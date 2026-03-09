import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import { message, setError, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { buildContactIssuePayload, contactFormSchema } from '$lib/server/contact-issue';
import { createIssue } from '$lib/server/github';
import type { Actions, PageServerLoad } from './$types';

const CONTACT_ISSUE_OWNER = 'yuu19';
const CONTACT_ISSUE_REPO = 'yusuke-blog';
export const prerender = false;

const isGithubIssueAvailable = () => Boolean(env.GITHUB_TOKEN?.trim());

export const load: PageServerLoad = async () => {
  const form = await superValidate(zod4(contactFormSchema));
  return {
    form,
    githubAvailable: isGithubIssueAvailable()
  };
};

export const actions: Actions = {
  default: async (event) => {
    const form = await superValidate(event, zod4(contactFormSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    if (!isGithubIssueAvailable()) {
      return setError(form, '', '現在お問い合わせ機能を利用できません。時間をおいて再度お試しください。', {
        status: 503
      });
    }

    try {
      const { issueTitle, issueBody } = buildContactIssuePayload(form.data);
      const issue = await createIssue({
        owner: CONTACT_ISSUE_OWNER,
        repo: CONTACT_ISSUE_REPO,
        title: issueTitle,
        body: issueBody
      });

      return message(form, {
        text: 'お問い合わせを受け付けました。GitHub Issue を作成しました。',
        issueUrl: issue.html_url,
        issueNumber: issue.number,
        issueTitle: issue.title
      });
    } catch (error) {
      console.error('[form] Failed to create issue from contact form', error);
      return setError(form, '', '送信に失敗しました。しばらく時間をおいてから再度お試しください。', {
        status: 500
      });
    }
  }
};
