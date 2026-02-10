import { env } from '$env/dynamic/private';

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_API_VERSION = '2022-11-28';
const USER_AGENT = 'yusuke-blog';

export type GithubSearchIssueItem = {
  id: number;
  number: number;
  title: string;
  html_url: string;
  repository_url: string;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  pull_request?: {
    url: string;
  };
};

export type GithubSearchIssuesResponse = {
  total_count: number;
  items: GithubSearchIssueItem[];
};

const buildHeaders = () => {
  const headers = new Headers();
  headers.set('Accept', 'application/vnd.github+json');
  headers.set('X-GitHub-Api-Version', GITHUB_API_VERSION);
  headers.set('User-Agent', USER_AGENT);
  const githubToken = env.GITHUB_TOKEN;
  if (githubToken) {
    headers.set('Authorization', `Bearer ${githubToken}`);
  }
  return headers;
};

const parseGithubError = async (response: Response) => {
  try {
    const data = await response.json();
    if (data && typeof data === 'object' && 'message' in data) {
      return String(data.message);
    }
  } catch {
    // ignore parse errors
  }
  return response.statusText;
};

const fetchGithubJson = async <T>(url: string) => {
  const response = await fetch(url, {
    headers: buildHeaders()
  });

  if (!response.ok) {
    const message = await parseGithubError(response);
    throw new Error(`GitHub API error (${response.status}): ${message}`);
  }

  return (await response.json()) as T;
};

export const searchIssues = async (
  query: string,
  options: {
    perPage?: number;
    page?: number;
    sort?: 'created' | 'updated' | 'comments';
    order?: 'asc' | 'desc';
  } = {}
) => {
  const url = new URL(`${GITHUB_API_BASE}/search/issues`);
  url.searchParams.set('q', query);
  url.searchParams.set('per_page', String(options.perPage ?? 20));
  url.searchParams.set('page', String(options.page ?? 1));
  if (options.sort) {
    url.searchParams.set('sort', options.sort);
  }
  if (options.order) {
    url.searchParams.set('order', options.order);
  }

  return fetchGithubJson<GithubSearchIssuesResponse>(url.toString());
};
