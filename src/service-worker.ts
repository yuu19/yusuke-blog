/// <reference lib="webworker" />

import { build, files, prerendered, version } from '$service-worker';

const worker = self as unknown as ServiceWorkerGlobalScope;
const CACHE_PREFIX = 'yusuke-blog-cache-';
// Changing the policy also invalidates caches if the build version is reused.
const CACHE_NAME = `${CACHE_PREFIX}v2-${version}`;
const BUILD_ASSETS = new Set(build);
const STATIC_ASSETS = new Set(files);
const PRERENDERED = new Set(prerendered);

function canCache(response: Response): boolean {
	const directives = response.headers.get('cache-control') ?? '';
	return (
		response.status === 200 &&
		!response.redirected &&
		!/(?:^|,)\s*(?:no-store|no-cache|private)\b/i.test(directives) &&
		!response.headers
			.get('vary')
			?.split(',')
			.some((value) => value.trim() === '*')
	);
}

worker.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE_NAME);
			await Promise.all(
				[...new Set([...build, ...files])].map(async (path) => {
					const response = await fetch(new URL(path, worker.location.origin), { cache: 'reload' });
					if (!response.ok) throw new Error(`Failed to precache ${path}: ${response.status}`);
					if (canCache(response)) await cache.put(path, response);
				})
			);
			await worker.skipWaiting();
		})()
	);
});

worker.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			await Promise.all(
				(await caches.keys())
					.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
					.map((key) => caches.delete(key))
			);
			await worker.clients.claim();
		})()
	);
});

worker.addEventListener('fetch', (event) => {
	const request = event.request;
	const url = new URL(request.url);
	if (
		request.method !== 'GET' ||
		url.origin !== worker.location.origin ||
		request.cache === 'no-store' ||
		request.headers.has('range') ||
		request.headers.has('authorization')
	) {
		return;
	}

	const isAsset = BUILD_ASSETS.has(url.pathname) || STATIC_ASSETS.has(url.pathname);
	// SvelteKit navigations fetch page data separately from the HTML document.
	const pagePath = url.pathname.replace(/\/__data\.json$/, '') || '/';
	const isPageData = url.pathname.endsWith('/__data.json') && PRERENDERED.has(pagePath);
	const isPage = PRERENDERED.has(url.pathname);
	// Dynamic pages, their data requests, and unknown endpoints remain network-only.
	if (!isAsset && !isPage && !isPageData) return;

	async function respond(): Promise<Response> {
		// Cache storage can be unavailable or full; that must not break an online request.
		const cache = await caches.open(CACHE_NAME).catch(() => undefined);
		const match = () => cache?.match(request).catch(() => undefined);
		if (
			BUILD_ASSETS.has(url.pathname) &&
			request.cache !== 'reload' &&
			request.cache !== 'no-cache'
		) {
			const cached = await match();
			if (cached) return cached;
		}

		let response: Response;
		try {
			// Revalidate the HTTP cache too, including for ordinary revisits to HTML/static files.
			response = await fetch(request, { cache: 'no-cache' });
		} catch (error) {
			const cached = await match();
			if (cached) return cached;
			throw error;
		}

		const contentType = response.headers.get('content-type')?.split(';')[0].trim();
		const hasExpectedType =
			isAsset || (isPageData ? contentType === 'application/json' : contentType === 'text/html');
		try {
			if (canCache(response) && hasExpectedType) {
				await cache?.put(request, response.clone());
			} else {
				// A new no-store/error response must not leave an older offline copy behind.
				await cache?.delete(request);
			}
		} catch {
			// Return the network response even if a cache write fails.
		}
		return response;
	}

	event.respondWith(respond());
});
