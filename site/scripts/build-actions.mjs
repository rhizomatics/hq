#!/usr/bin/env node
// Builds src/data/actions.json, the GitHub Actions health shown on the site's Workflows page.
//
// Sources, all read-only:
//   - repos.toml                        which repos to cover (`archived = true` ones are left out)
//   - hq-private/data/github/<latest>   only for repo visibility and archive state
//   - GitHub REST API                   workflows and workflow runs of each public repo
//
// Only public repos are covered, and everything written comes from their public Actions history.
// Runs from pull requests, Dependabot branches and Copilot reviews are left out: they test
// proposed changes, not the repo's own state. Needs GITHUB_TOKEN (or GH_TOKEN); without one the page says so.
//
// Per workflow:  red       = its latest completed run failed
//                flapping  = passing now, but 3+ separate failure streaks in the last 7 days
//                recovered = passing now, but a run failed in the 24 hours before the build
//                green     = passing, no failures in the last day
// A repo takes its worst workflow's state. Dependabot's update jobs don't set the state; their
// failures are listed separately.

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
const RANK = { red: 4, flapping: 3, recovered: 2, green: 1, none: 0 };
const FLAPPING_STREAKS = 3; // separate failure streaks in 7 days

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
// cancelled and skipped runs say nothing about health
const counted = (run) => relevant(run) && !['cancelled', 'skipped', 'neutral'].includes(run.conclusion);

async function completedRuns(repo, wf) {
  const { workflow_runs: runs } = await gh(
    `repos/${repo}/actions/workflows/${wf.id}/runs?status=completed&exclude_pull_requests=true&per_page=30`,
  );
  return runs.filter(counted); // newest first
}

// Separate runs of consecutive failures among runs since `from` (newest first).
function failureStreaks(runs, from) {
  let streaks = 0;
  let inStreak = false;
  for (const r of runs.filter((x) => Date.parse(x.created_at) >= from)) {
    const failed = FAILED.has(r.conclusion);
    if (failed && !inStreak) streaks += 1;
    inStreak = failed;
  }
  return streaks;
}

async function workflowHealth(repo, wf, now) {
  const own = await completedRuns(repo, wf);
  const latest = own[0];
  if (!latest) return null;
  const recentFailures = own.filter((r) => FAILED.has(r.conclusion) && Date.parse(r.updated_at) >= now - DAY);
  const streaks7d = failureStreaks(own, now - 7 * DAY);
  const state = FAILED.has(latest.conclusion)
    ? 'red'
    : streaks7d >= FLAPPING_STREAKS
      ? 'flapping'
      : recentFailures.length
        ? 'recovered'
        : 'green';
  const lastFailure = own.find((r) => FAILED.has(r.conclusion));
  return {
    name: wf.name,
    state,
    conclusion: latest.conclusion,
    lastRun: latest.updated_at,
    url: (state === 'red' || !lastFailure ? latest : lastFailure).html_url,
    failures24h: recentFailures.length,
    streaks7d,
  };
}

// Dependabot runs one job per ecosystem and directory ("uv in /."), so each is judged on its own
// latest run. Ecosystems that missed the latest round have been dropped from the config.
async function dependabotFailures(repo, wf) {
  const runs = await completedRuns(repo, wf);
  if (!runs.length) return [];
  const newest = Date.parse(runs[0].created_at);
  const latestByJob = new Map();
  for (const r of runs) {
    const job = r.name.split(' - Update')[0].split(' for ')[0];
    if (!latestByJob.has(job) && Date.parse(r.created_at) >= newest - 3 * DAY) latestByJob.set(job, r);
  }
  return [...latestByJob]
    .filter(([, r]) => FAILED.has(r.conclusion))
    .map(([job, r]) => ({ job, since: r.updated_at, url: r.html_url }));
}

async function repoHealth(org, name, now) {
  const repo = `${org}/${name}`;
  const { workflows } = await gh(`repos/${repo}/actions/workflows?per_page=100`);
  // dynamic/agents/* are Copilot's pull request reviews, not the repo's own jobs
  const active = workflows.filter((w) => w.state === 'active' && !w.path.startsWith('dynamic/agents/'));
  const isDependabot = (w) => w.path === 'dynamic/dependabot/dependabot-updates';
  const results = await Promise.all(active.filter((w) => !isDependabot(w)).map((w) => workflowHealth(repo, w, now)));
  const dependabot = (await Promise.all(active.filter(isDependabot).map((w) => dependabotFailures(repo, w)))).flat();
  const list = results.filter(Boolean).sort((a, b) => RANK[b.state] - RANK[a.state] || a.name.localeCompare(b.name));
  return {
    state: list.reduce((s, w) => (RANK[w.state] > RANK[s] ? w.state : s), 'none'),
    workflows: list,
    dependabot,
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

  const names = Object.keys(registry.repos).filter((n) => !registry.repos[n].archived && orgRepos[n]?.visibility === 'public' && !orgRepos[n].archived);
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
            return { id: name, family: registry.repos[name].family, url: `https://github.com/${org}/${name}/actions`, ...(await repoHealth(org, name, now)) };
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
  console.log(`actions: ${repos.length} repos, ${count('red')} red, ${count('flapping')} flapping, ${count('recovered')} recovered${notes.length ? `; ${notes.length} gaps` : ''}`);
  for (const n of notes) console.warn(`  ${n}`);
}

await main();
