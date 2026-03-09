import { z } from 'zod';

export const CONTACT_CATEGORIES = ['記事の誤り報告', '技術的な質問', 'お仕事の相談', 'その他'] as const;

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const summarizeMessage = (message: string, maxLength = 60) => {
  const normalized = normalizeWhitespace(message);
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 1)}…`;
};

export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'お名前を入力してください。')
    .max(80, 'お名前は80文字以内で入力してください。'),
  contact: z
    .string()
    .trim()
    .max(200, '連絡先は200文字以内で入力してください。')
    .optional()
    .transform((value) => value ?? ''),
  category: z
    .enum(CONTACT_CATEGORIES, {
      error: 'お問い合わせ種別を選択してください。'
    })
    .default(CONTACT_CATEGORIES[0]),
  message: z
    .string()
    .trim()
    .min(10, '本文は10文字以上で入力してください。')
    .max(5000, '本文は5000文字以内で入力してください。'),
  consentPublic: z
    .boolean()
    .default(false)
    .refine((value) => value === true, {
      message: '公開Issueとして投稿されることへの同意が必要です。'
    }),
  website: z
    .string()
    .max(0, '不正な送信が検出されました。')
    .default('')
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

export const buildContactIssuePayload = (
  formData: ContactFormData,
  options: { submittedAt?: Date } = {}
) => {
  const submittedAt = options.submittedAt ?? new Date();
  const summary = summarizeMessage(formData.message);
  const issueTitle = `[お問い合わせ][${formData.category}] ${formData.name}: ${summary || 'メッセージ'}`;
  const contact = formData.contact || '未記入';

  const issueBody = `## お問い合わせ概要

- 種別: ${formData.category}

## 本文

${formData.message}

---

### メタ情報

- お名前: ${formData.name}
- 連絡先: ${contact}
- 送信日時 (UTC): ${submittedAt.toISOString()}
- 送信元: /form

> このIssueはお問い合わせフォームから自動作成されています。公開Issueとして投稿されるため、個人情報・機密情報は記載しないでください。`;

  return {
    issueTitle,
    issueBody
  };
};
