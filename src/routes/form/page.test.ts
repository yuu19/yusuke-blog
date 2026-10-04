import { render } from 'svelte/server';
import { isActionFailure } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createIssue } from '$lib/server/github';
import { actions } from './+page.server';
import ContactPage from './+page.svelte';

vi.mock('$env/dynamic/private', () => ({ env: { GITHUB_TOKEN: 'test-token' } }));
vi.mock('$lib/server/github', () => ({ createIssue: vi.fn() }));
vi.mock('$app/stores', async () => {
	const { readable } = await import('svelte/store');
	return { page: readable({ data: {}, form: null }) };
});

const validInput = {
	name: 'テスト利用者',
	contact: '',
	category: 'その他',
	message: 'お問い合わせ内容の検証用メッセージです。',
	consentPublic: 'on',
	website: ''
};

async function submit(overrides: Partial<typeof validInput> = {}) {
	const formData = new FormData();
	for (const [key, value] of Object.entries({ ...validInput, ...overrides })) {
		if (key === 'consentPublic' && !value) continue;
		formData.set(key, value);
	}
	const event = {
		request: new Request('http://localhost/form', { method: 'POST', body: formData })
	} as Parameters<typeof actions.default>[0];
	return actions.default(event);
}

describe('contact form error rendering', () => {
	beforeEach(() => vi.resetAllMocks());

	it.each([
		['name', ' ', 'お名前を入力してください。'],
		['contact', 'a'.repeat(201), '連絡先は200文字以内で入力してください。'],
		['category', 'invalid', 'お問い合わせ種別を選択してください。'],
		['message', '短い本文', '本文は10文字以上で入力してください。'],
		['consentPublic', '', '公開Issueとして投稿されることへの同意が必要です。']
	] as const)('renders the server validation error for %s', async (field, value, text) => {
		const result = await submit({ [field]: value });
		if (!result || !('data' in result) || !result.data)
			throw new Error('Expected validation failure');
		expect(result.status).toBe(400);
		const { body } = render(ContactPage, {
			props: { data: { form: result.data.form, githubAvailable: true }, form: null, params: {} }
		});
		expect(body).toContain(text);
		expect(createIssue).not.toHaveBeenCalled();
	});

	it('clears validation errors after a corrected submission succeeds', async () => {
		const invalid = await submit({ name: ' ' });
		if (!invalid || !('data' in invalid) || !invalid.data)
			throw new Error('Expected validation failure');
		expect(invalid.data.form.errors.name).toEqual(['お名前を入力してください。']);
		vi.mocked(createIssue).mockResolvedValue({
			id: 1,
			number: 1,
			title: 'お問い合わせ',
			html_url: 'https://github.com/example/test/issues/1',
			body: null,
			state: 'open',
			created_at: '2026-10-05T00:00:00Z',
			updated_at: '2026-10-05T00:00:00Z'
		});
		const result = await submit();
		if (!result || isActionFailure(result)) throw new Error('Expected successful submission');
		const { body } = render(ContactPage, {
			props: { data: { form: result.form, githubAvailable: true }, form: null, params: {} }
		});
		expect(body).not.toContain('お名前を入力してください。');
		expect(body).toContain('お問い合わせを受け付けました。');
		expect(createIssue).toHaveBeenCalledOnce();
	});

	it('keeps the form-level submission error visible', async () => {
		vi.mocked(createIssue).mockRejectedValue(new Error('Mock GitHub failure'));
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		try {
			const result = await submit();
			if (!result || !('data' in result) || !result.data)
				throw new Error('Expected submission failure');
			expect(result.status).toBe(500);
			const { body } = render(ContactPage, {
				props: { data: { form: result.data.form, githubAvailable: true }, form: null, params: {} }
			});
			expect(body).toContain('送信に失敗しました。しばらく時間をおいてから再度お試しください。');
		} finally {
			log.mockRestore();
		}
	});
});
