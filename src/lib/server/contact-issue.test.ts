import { describe, expect, it } from 'vitest';
import {
	buildContactIssuePayload,
	CONTACT_CATEGORIES,
	contactFormSchema
} from './contact-issue';

describe('contactFormSchema', () => {
	const validInput = {
		name: '山田 太郎',
		category: CONTACT_CATEGORIES[1],
		message: '記事内の数式について確認したい点があります。詳細をご確認ください。',
		consentPublic: true,
		website: ''
	};

	it('accepts optional contact field when omitted', () => {
		const parsed = contactFormSchema.safeParse(validInput);
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data.contact).toBe('');
		}
	});

	it('rejects missing required fields', () => {
		const parsed = contactFormSchema.safeParse({
			...validInput,
			name: ''
		});
		expect(parsed.success).toBe(false);
		if (!parsed.success) {
			expect(parsed.error.issues.some((issue) => issue.path.join('.') === 'name')).toBe(true);
		}
	});

	it('rejects submission without public consent', () => {
		const parsed = contactFormSchema.safeParse({
			...validInput,
			consentPublic: false
		});
		expect(parsed.success).toBe(false);
		if (!parsed.success) {
			expect(parsed.error.issues.some((issue) => issue.path.join('.') === 'consentPublic')).toBe(true);
		}
	});

	it('rejects non-empty honeypot field', () => {
		const parsed = contactFormSchema.safeParse({
			...validInput,
			website: 'https://spam.example.com'
		});
		expect(parsed.success).toBe(false);
		if (!parsed.success) {
			expect(parsed.error.issues.some((issue) => issue.path.join('.') === 'website')).toBe(true);
		}
	});
});

describe('buildContactIssuePayload', () => {
	it('builds issue title/body with all metadata fields', () => {
		const formData = contactFormSchema.parse({
			name: '山田 太郎',
			contact: '@yamada',
			category: CONTACT_CATEGORIES[2],
			message: 'お仕事のご相談です。技術記事の寄稿について打ち合わせをお願いしたいです。',
			consentPublic: true,
			website: ''
		});
		const submittedAt = new Date('2026-02-28T00:00:00.000Z');

		const payload = buildContactIssuePayload(formData, { submittedAt });

		expect(payload.issueTitle.startsWith('[お問い合わせ][お仕事の相談] 山田 太郎:')).toBe(true);
		expect(payload.issueBody).toContain('## お問い合わせ概要');
		expect(payload.issueBody).toContain('- 種別: お仕事の相談');
		expect(payload.issueBody).toContain('- お名前: 山田 太郎');
		expect(payload.issueBody).toContain('- 連絡先: @yamada');
		expect(payload.issueBody).toContain('- 送信日時 (UTC): 2026-02-28T00:00:00.000Z');
		expect(payload.issueBody).toContain('- 送信元: /form');
	});

	it('truncates the title summary when message is too long', () => {
		const formData = contactFormSchema.parse({
			name: '長文テスター',
			category: CONTACT_CATEGORIES[3],
			message: 'a'.repeat(120),
			consentPublic: true,
			website: ''
		});

		const payload = buildContactIssuePayload(formData);
		expect(payload.issueTitle.endsWith(`${'a'.repeat(59)}…`)).toBe(true);
	});
});
