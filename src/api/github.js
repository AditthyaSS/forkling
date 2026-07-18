/**
 * GitHub REST API v3 wrapper for Forkling.
 * All functions use fetchWithCache() and inject PAT header when available.
 */

import { fetchWithCache } from './cache';

const BASE = 'https://api.github.com';

function getHeaders() {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
  };
  const pat = localStorage.getItem('forkling_github_pat');
  if (pat) {
    headers['Authorization'] = `Bearer ${pat}`;
  }
  return headers;
}

function buildUrl(path, params = {}) {
  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, v);
    }
  });
  return url.toString();
}

/**
 * Search repositories.
 * GitHub Search API: GET /search/repositories
 */
export async function searchRepos(query = '', filters = {}, page = 1, perPage = 30) {
  // Build search query string
  let q = query || 'stars:>100';

  if (filters.language) {
    q += ` language:${filters.language}`;
  }
  if (filters.topic) {
    q += ` topic:${filters.topic}`;
  }
  if (filters.hasGoodFirstIssue) {
    q += ' good-first-issues:>0';
  }
  if (filters.pushed) {
    q += ` pushed:>${filters.pushed}`;
  }

  const sort = filters.sort || 'stars';
  const order = filters.order || 'desc';

  const url = buildUrl('/search/repositories', { q, sort, order, page, per_page: perPage });
  return fetchWithCache(url, { headers: getHeaders() });
}

/**
 * Get a single repository.
 */
export async function getRepo(owner, repo) {
  const url = buildUrl(`/repos/${owner}/${repo}`);
  return fetchWithCache(url, { headers: getHeaders() });
}

/**
 * Get contributors for a repository.
 */
export async function getContributors(owner, repo, perPage = 30, page = 1) {
  const url = buildUrl(`/repos/${owner}/${repo}/contributors`, { per_page: perPage, page });
  return fetchWithCache(url, { headers: getHeaders() });
}

/**
 * Get recent commits (for network graph).
 */
export async function getCommits(owner, repo, perPage = 100) {
  const url = buildUrl(`/repos/${owner}/${repo}/commits`, { per_page: perPage });
  return fetchWithCache(url, { headers: getHeaders() });
}

/**
 * Get issues for a repository.
 */
export async function getIssues(owner, repo, params = {}) {
  const url = buildUrl(`/repos/${owner}/${repo}/issues`, {
    state: params.state || 'open',
    labels: params.labels || '',
    sort: params.sort || 'created',
    direction: params.direction || 'desc',
    per_page: params.perPage || 30,
    page: params.page || 1,
  });
  return fetchWithCache(url, { headers: getHeaders() });
}

/**
 * Get language breakdown for a repository.
 */
export async function getLanguages(owner, repo) {
  const url = buildUrl(`/repos/${owner}/${repo}/languages`);
  return fetchWithCache(url, { headers: getHeaders() });
}

/**
 * Get community profile (governance health).
 */
export async function getCommunityProfile(owner, repo) {
  const url = buildUrl(`/repos/${owner}/${repo}/community/profile`);
  return fetchWithCache(url, {
    headers: {
      ...getHeaders(),
      'Accept': 'application/vnd.github.v3+json',
    },
  });
}

/**
 * Get rate limit status.
 */
export async function getRateLimit() {
  const url = buildUrl('/rate_limit');
  // Don't cache rate limit — always fetch live
  const response = await fetch(url, { headers: getHeaders() });
  return response.json();
}

/**
 * Get README content for a repository.
 */
export async function getReadme(owner, repo) {
  const url = buildUrl(`/repos/${owner}/${repo}/readme`);
  try {
    const data = await fetchWithCache(url, {
      headers: {
        ...getHeaders(),
        'Accept': 'application/vnd.github.v3.html',
      },
    });
    return data;
  } catch {
    return null;
  }
}

/**
 * Get commit activity (weekly, last year).
 */
export async function getCommitActivity(owner, repo) {
  const url = buildUrl(`/repos/${owner}/${repo}/stats/commit_activity`);
  return fetchWithCache(url, { headers: getHeaders() });
}

/**
 * Get code frequency (additions/deletions per week).
 */
export async function getCodeFrequency(owner, repo) {
  const url = buildUrl(`/repos/${owner}/${repo}/stats/code_frequency`);
  return fetchWithCache(url, { headers: getHeaders() });
}

/**
 * Get participation stats (owner vs. all).
 */
export async function getParticipation(owner, repo) {
  const url = buildUrl(`/repos/${owner}/${repo}/stats/participation`);
  return fetchWithCache(url, { headers: getHeaders() });
}

/**
 * Get repository forks sorted by the given strategy.
 * @param {string} owner
 * @param {string} repo
 * @param {'newest'|'oldest'|'stargazers'|'watchers'} sort
 * @param {number} perPage
 * @param {number} page
 */
export async function getForks(owner, repo, sort = 'stargazers', perPage = 100, page = 1) {
  const url = buildUrl(`/repos/${owner}/${repo}/forks`, { sort, per_page: perPage, page });
  return fetchWithCache(url, { headers: getHeaders() });
}

/**
 * Compare two refs (branches/SHAs) in a repository.
 * Used to determine how far ahead/behind a fork is relative to the upstream default branch.
 * Returns { ahead_by, behind_by, status, ... }
 *
 * @param {string} owner  - upstream owner
 * @param {string} repo   - upstream repo name
 * @param {string} base   - base ref (e.g. upstream default branch)
 * @param {string} head   - head ref in "owner:branch" format
 */
export async function compareRefs(owner, repo, base, head) {
  // head must be URL-encoded when it contains a colon
  const encodedHead = encodeURIComponent(head);
  const url = buildUrl(`/repos/${owner}/${repo}/compare/${base}...${encodedHead}`);
  return fetchWithCache(url, { headers: getHeaders() });
}

/**
 * Test if a PAT is valid.
 */
export async function testPAT(pat) {
  try {
    const response = await fetch(`${BASE}/user`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${pat}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}
