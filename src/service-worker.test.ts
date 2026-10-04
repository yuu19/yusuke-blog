import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';

const origin = 'https://blog.example';
const asset = '/_app/immutable/entry/app.abc123.js';
const image = '/logo.png';
const page = '/articles/example';
const data = `${page}/__data.json`;
const cacheName = 'yusuke-blog-cache-v2-test';

// Execute the actual worker with a controlled manifest, network and Cache API.
// This avoids importing SvelteKit's build-only $service-worker module in Vitest.
const source = ts.transpileModule(readFileSync('src/service-worker.ts', 'utf8'), {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;

function setup() {
	const listeners = new Map<string, (event: unknown) => void>();
	const stores = new Map<string, ReturnType<typeof createCache>>();
	const key = (input: Request | URL | string) =>
		new URL(input instanceof Request ? input.url : input.toString(), origin).href;
	function createCache() {
		const entries = new Map<string, Response>();
		return {
			match: vi.fn(async (input: Request | URL | string) => entries.get(key(input))?.clone()),
			put: vi.fn(async (input: Request | URL | string, response: Response) => {
				entries.set(key(input), response.clone());
			}),
			delete: vi.fn(async (input: Request | URL | string) => entries.delete(key(input)))
		};
	}
	const caches = {
		open: vi.fn(async (name: string) => {
			if (!stores.has(name)) stores.set(name, createCache());
			return stores.get(name)!;
		}),
		keys: vi.fn(async () => [...stores.keys()]),
		delete: vi.fn(async (name: string) => stores.delete(name))
	};
	const network = vi.fn<typeof fetch>().mockImplementation(async () => new Response('asset'));
	const worker = {
		location: new URL('/service-worker.js', origin),
		addEventListener: (name: string, listener: (event: unknown) => void) => {
			listeners.set(name, listener);
		},
		skipWaiting: vi.fn(async () => {}),
		clients: { claim: vi.fn(async () => {}) }
	};
	runInNewContext(source, {
		exports: {},
		require: (name: string) => {
			if (name !== '$service-worker') throw new Error(`Unexpected import: ${name}`);
			return { build: [asset], files: [image], prerendered: ['/', page], version: 'test' };
		},
		self: worker,
		caches,
		fetch: network,
		URL
	});

	function dispatch(path: string, init?: RequestInit) {
		const request = new Request(new URL(path, origin), init);
		const respondWith = vi.fn();
		listeners.get('fetch')!({ request, respondWith });
		return { request, respondWith };
	}
	async function visit(path: string, init?: RequestInit): Promise<Response> {
		const { request, respondWith } = dispatch(path, init);
		// An unintercepted request is handled by the browser network stack.
		return respondWith.mock.calls.length ? respondWith.mock.calls[0][0] : network(request);
	}
	async function lifecycle(name: 'install' | 'activate') {
		const pending: Promise<unknown>[] = [];
		listeners.get(name)!({ waitUntil: (promise: Promise<unknown>) => pending.push(promise) });
		await Promise.all(pending);
	}
	return { caches, network, worker, dispatch, visit, lifecycle };
}

const html = (body: string, headers: Record<string, string> = {}) =>
	new Response(body, { headers: { 'content-type': 'text/html; charset=utf-8', ...headers } });

describe('service worker cache policy', () => {
	it.each(['/form', '/contributions', page])('recovers from 503 on revisit to %s', async (path) => {
		const sw = setup();
		sw.network.mockResolvedValueOnce(new Response('unavailable', { status: 503 }));
		expect((await sw.visit(path)).status).toBe(503);
		expect(await (await sw.caches.open(cacheName)).match(path)).toBeUndefined();
		sw.network.mockResolvedValueOnce(html('recovered'));
		const response = await sw.visit(path);
		expect(response.status).toBe(200);
		expect(await response.text()).toBe('recovered');
		expect(sw.network).toHaveBeenCalledTimes(2);
	});

	it.each(['/form', '/form/__data.json', '/contributions', page, data, image])(
		'fetches changed content on an ordinary revisit to %s',
		async (path) => {
			const sw = setup();
			sw.network.mockResolvedValueOnce(html('old configuration'));
			await sw.visit(path);
			sw.network.mockResolvedValueOnce(html('new configuration'));
			expect(await (await sw.visit(path)).text()).toBe('new configuration');
			expect(sw.network).toHaveBeenCalledTimes(2);
		}
	);

	it.each([
		['/form', {}],
		['/form/__data.json', {}],
		['/contributions', {}],
		['/api/status', {}],
		['/_app/version.json', {}],
		['https://other.example/logo.png', {}],
		[page, { method: 'POST' }],
		[asset, { cache: 'no-store' }],
		[asset, { headers: { range: 'bytes=0-10' } }],
		[page, { headers: { authorization: 'Bearer test' } }]
	] satisfies [string, RequestInit][])('does not intercept %s with %j', (path, init) => {
		const sw = setup();
		expect(sw.dispatch(path, init).respondWith).not.toHaveBeenCalled();
		expect(sw.caches.open).not.toHaveBeenCalled();
	});

	it.each(['no-store', 'public, No-Store', 'private', 'max-age=60, no-cache'])(
		'does not store %s responses and removes the old offline copy',
		async (directive) => {
			const sw = setup();
			const cache = await sw.caches.open(cacheName);
			await cache.put(page, html('old'));
			sw.network.mockResolvedValueOnce(html('fresh', { 'cache-control': directive }));
			expect(await (await sw.visit(page)).text()).toBe('fresh');
			expect(await cache.match(page)).toBeUndefined();
		}
	);

	it.each([404, 500, 503, 206])(
		'does not store status %i or retain a stale copy',
		async (status) => {
			const sw = setup();
			const cache = await sw.caches.open(cacheName);
			await cache.put(page, html('old'));
			sw.network.mockResolvedValueOnce(new Response('error', { status }));
			expect((await sw.visit(page)).status).toBe(status);
			expect(await cache.match(page)).toBeUndefined();
		}
	);

	it('does not store redirected, unexpected content type or Vary: * responses', async () => {
		const sw = setup();
		const redirected = html('login');
		Object.defineProperty(redirected, 'redirected', { value: true });
		for (const response of [redirected, new Response('not HTML'), html('vary', { vary: '*' })]) {
			sw.network.mockResolvedValueOnce(response);
			await sw.visit(page);
			expect(await (await sw.caches.open(cacheName)).match(page)).toBeUndefined();
		}
	});

	it('precaches static assets and serves immutable assets without a network request', async () => {
		const sw = setup();
		await sw.lifecycle('install');
		expect(sw.worker.skipWaiting).toHaveBeenCalledOnce();
		expect(sw.network).toHaveBeenCalledTimes(2);
		sw.network.mockRejectedValue(new TypeError('offline'));
		expect(await (await sw.visit(asset)).text()).toBe('asset');
		expect(sw.network).toHaveBeenCalledTimes(2);
		expect(await (await sw.visit(image)).text()).toBe('asset');
	});

	it.each(['reload', 'no-cache'] as const)('revalidates immutable assets for %s', async (cache) => {
		const sw = setup();
		await sw.lifecycle('install');
		sw.network.mockResolvedValueOnce(new Response('new asset'));
		expect(await (await sw.visit(asset, { cache })).text()).toBe('new asset');
		expect(sw.network).toHaveBeenLastCalledWith(expect.any(Request), { cache: 'no-cache' });
	});

	it.each([page, '/', data, '/__data.json'])(
		'serves visited public content offline: %s',
		async (path) => {
			const sw = setup();
			const response = path.endsWith('.json')
				? Response.json({ title: 'article' })
				: html('article');
			sw.network.mockResolvedValueOnce(response);
			const online = await (await sw.visit(path)).text();
			expect(sw.network).toHaveBeenLastCalledWith(expect.any(Request), { cache: 'no-cache' });
			sw.network.mockRejectedValue(new TypeError('offline'));
			expect(await (await sw.visit(path)).text()).toBe(online);
		}
	);

	it('keeps query variants separate and propagates offline misses', async () => {
		const sw = setup();
		sw.network.mockResolvedValueOnce(html('variant A'));
		await sw.visit(`${page}?variant=a`);
		sw.network.mockRejectedValue(new TypeError('offline'));
		await expect(sw.visit(`${page}?variant=b`)).rejects.toThrow('offline');
		expect(await (await sw.visit(`${page}?variant=a`)).text()).toBe('variant A');
	});

	it('never falls back to an old dynamic page while offline', async () => {
		const sw = setup();
		await (await sw.caches.open(cacheName)).put('/form', html('old form'));
		sw.network.mockRejectedValue(new TypeError('offline'));
		await expect(sw.visit('/form')).rejects.toThrow('offline');
	});

	it('does not precache no-store responses or activate after a failed precache', async () => {
		const sw = setup();
		sw.network.mockResolvedValue(
			new Response('private', { headers: { 'cache-control': 'no-store' } })
		);
		await sw.lifecycle('install');
		expect((await sw.caches.open(cacheName)).put).not.toHaveBeenCalled();
		const failing = setup();
		failing.network.mockResolvedValue(new Response('unavailable', { status: 503 }));
		await expect(failing.lifecycle('install')).rejects.toThrow('503');
		expect(failing.worker.skipWaiting).not.toHaveBeenCalled();
	});

	it('deletes previous policy/version caches before claiming clients, preserving other caches', async () => {
		const sw = setup();
		for (const name of [
			'yusuke-blog-cache-test',
			'yusuke-blog-cache-v2-old',
			cacheName,
			'other-app'
		]) {
			await sw.caches.open(name);
		}
		sw.worker.clients.claim.mockImplementation(async () => {
			expect(await sw.caches.keys()).toEqual([cacheName, 'other-app']);
		});
		await sw.lifecycle('activate');
		expect(sw.worker.clients.claim).toHaveBeenCalledOnce();
	});

	it.each(['open', 'match', 'put'] as const)(
		'returns online responses if cache %s fails',
		async (operation) => {
			const sw = setup();
			const cache = await sw.caches.open(cacheName);
			const method = operation === 'open' ? sw.caches.open : cache[operation];
			method.mockRejectedValue(new Error('storage unavailable'));
			sw.network.mockResolvedValueOnce(new Response('online'));
			expect(await (await sw.visit(asset)).text()).toBe('online');
		}
	);
});
