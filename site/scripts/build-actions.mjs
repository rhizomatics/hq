#!/usr/bin/env node
// Builds src/data/actions.json, the GitHub Actions health shown on the site's Workflows page.
//
// Sources, all read-only:
//   - repos.toml                        which repos to cover
//   - hq-private/data/github/<latest>   only for repo visibility and archive state
//   - GitHub REST API                   workflows and workflow runs of each public repo
//
// Only public repos are covered, and everything written comes from their public Actions history.
// Runs from pull requests, Dependabot branches and Copilot reviews are left out: they test
// proposed changes, not the repo's own state. Needs GITHUB_TOKEN (or GH_TOKEN); without one the page says so.
//
// Per workflow:  red   = its latest completed run failed
//                amber = not red, but a run failed in the 24 hours before the build
// A repo takes its worst workflow's state.

import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseToml } from 'smol-toml';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hqRoot = path.resolve(siteRoot, '..');
const privateRoot = path.resolve(process.env.HQ_PRIVATE ?? path.join(hqRoot, '..', 'hq-private'));
const outPath = path.join(siteRoot, 'src', 'data', 'actions.json');
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const DAY = 86_400_000;
const FAILED = new Set(['failure', 'timed_out', 'startup_failure']);
const PR_EVENTS = new Set(['pull_request', 'pull_request_target', 'merge_group']);
const RANK = { red: 3, amber: 2, green: 1, none: 0 };

async function gh(route) {
  for (let attempt = 1; ; attempt += 1) {
    const res = await fetch(`https://api.github.com/${route}`, {
      headers: {
        'User-Agent': 'rhizomatics-hq-site',
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (res.ok) return res.json();
    if ((res.status < 500 && res.status !== 429) || attempt >= 3) throw new Error(`HTTP ${res.status}`);
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
}

const relevant = (run) => !PR_EVENTS.has(run.event) && !run.head_branch?.startsWith('dependabot/');

async function workflowHealth(repo, wf, since) {
  const { workflow_runs: runs } = await gh(
    `repos/${repo}/actions/workflows/${wf.id}/runs?status=completed&exclude_pull_requests=true&per_page=30`,
  );
  // cancelled and skipped runs say nothing about health
  const own = runs.filter((r) => relevant(r) && !['cancelled', 'skipped', 'neutral'].includes(r.conclusion));
  const latest = own[0];
  if (!latest) return null;
  const recentFailures = own.filter((r) => FAILED.has(r.conclusion) && Date.parse(r.updated_at) >= since);
  const state = FAILED.has(latest.conclusion) ? 'red' : recentFailures.length ? 'amber' : 'green';
  const shown = state === 'amber' ? recentFailures[0] : latest;
  return {
    name: wf.name,
    state,
    conclusion: latest.conclusion,
    lastRun: latest.updated_at,
    event: latest.event,
    url: shown.html_url,
    failures24h: recentFailures.length,
  };
}

async function repoHealth(org, name, since) {
  const repo = `${org}/${name}`;
  const { workflows } = await gh(`repos/${repo}/actions/workflows?per_page=100`);
  // dynamic/agents/* are Copilot's pull request reviews, not the repo's own jobs
  const own = workflows.filter((w) => w.state === 'active' && !w.path.startsWith('dynamic/agents/'));
  const results = await Promise.all(own.map((w) => workflowHealth(repo, w, since)));
  const list = results.filter(Boolean).sort((a, b) => RANK[b.state] - RANK[a.state] || a.name.localeCompare(b.name));
  return {
    state: list.reduce((s, w) => (RANK[w.state] > RANK[s] ? w.state : s), 'none'),
    workflows: list,
  };
}

async function main() {
  const registry = parseToml(await readFile(path.join(hqRoot, 'repos.toml'), 'utf8'));
  const org = registry.org.github;
  const dir = path.join(privateRoot, 'data', 'github');
  const latest = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort().at(-1);
  const orgRepos = Object.fromEntries(JSON.parse(await readFile(path.join(dir, latest), 'utf8')).org_repos.map((r) => [r.name, r]));
  const now = Date.now();
  const notes = [];

  const names = Object.keys(registry.repos).filter((n) => orgRepos[n]?.visibility === 'public' && !orgRepos[n].archived);
  const repos = [];
  if (!token) {
    notes.push('No GitHub token at build time, so workflow states were not fetched.');
    console.warn('actions: no GITHUB_TOKEN; writing an empty page');
  } else {
    // A few repos at a time keeps well inside the API's secondary rate limits.
    for (let i = 0; i < names.length; i += 4) {
      const batch = names.slice(i, i + 4);
      const results = await Promise.all(
        batch.map(async (name) => {
          try {
            return { id: name, family: registry.repos[name].family, url: `https://github.com/${org}/${name}/actions`, ...(await repoHealth(org, name, now - DAY)) };
          } catch (err) {
            notes.push(`${name}: workflow runs unavailable (${err.message}).`);
            return null;
          }
        }),
      );
      repos.push(...results.filter(Boolean));
    }
  }

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify({ generatedAt: new Date(now).toISOString(), available: Boolean(token), notes, repos })}\n`);
  const count = (s) => repos.filter((r) => r.state === s).length;
  console.log(`actions: ${repos.length} repos, ${count('red')} red, ${count('amber')} amber${notes.length ? `; ${notes.length} gaps` : ''}`);
  for (const n of notes) console.warn(`  ${n}`);
}

await main();
