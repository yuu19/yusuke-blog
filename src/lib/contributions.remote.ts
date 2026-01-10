import { query } from "$app/server";
import { githubConfig } from "$lib/github.config";
import { searchIssues } from "$lib/server/github";

export type Contribution = {
  id: number;
  number: number;
  title: string;
  url: string;
  repository: string;
  createdAt: string;
  updatedAt: string;
  state: "open" | "closed";
};

const normalizeRepository = (repositoryUrl: string) => {
  const marker = "https://api.github.com/repos/";
  return repositoryUrl.startsWith(marker)
    ? repositoryUrl.slice(marker.length)
    : repositoryUrl;
};

export const getContributions = query(async () => {
  const { username, includeOwnPRs, excludeRepos, maxResults } = githubConfig;

  const queryParts = ["is:pr", `author:${username}`, "is:public"];
  if (!includeOwnPRs) {
    queryParts.push(`-user:${username}`);
  }

  const response = await searchIssues(queryParts.join(" "), {
    perPage: maxResults,
    sort: "updated",
    order: "desc"
  });

  return response.items
    .map((item) => {
      const repository = normalizeRepository(item.repository_url);
      return {
        id: item.id,
        number: item.number,
        title: item.title,
        url: item.html_url,
        repository,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        state: item.state
      } satisfies Contribution;
    })
    .filter((item) => !excludeRepos.includes(item.repository));
});
