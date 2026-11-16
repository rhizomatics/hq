#!/usr/bin/env node
// Builds src/data/security.json for the Security page: what each public repo has in place, and the
// advisories it has published.
//
// Sources, all read-only and all public on GitHub:
//   - repos.toml                        which repos to cover (`archived = true` ones are left out)
//   - hq-private/data/github/<latest>   only for repo visibility and archive state
//   - GitHub REST API                   private vulnerability reporting, file tree (SECURITY.md),
//                                       active workflows (CodeQL, Dependabot updates), published advisories
//   - OpenSSF Scorecard API             each repo's latest published Scorecard (public, no key), for repos
//                                       running the Scorecard workflow; 404 means not published yet
//
// Never alerts: open Dependabot, code scanning and secret scanning alerts are unfixed findings and stay
// in hq-private (CLAUDE.md). This token couldn't read them anyway. Needs GITHUB_TOKEN (or GH_TOKEN).

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { gh, ghAll, inBatches, publicRepos, siteRoot, token } from './lib/github.mjs';
import { USER_AGENT } from '../src/lib/hq-config.mjs';

const outPath = path.join(siteRoot, 'src', 'data', 'security.json');
const POLICY = /^(\.github\/|docs\/)?security\.md$/i;
const SCORECARD_WORKFLOW = /(^|\/)scorecards?\.ya?ml$/i;

// The latest published Scorecard, or null when the repo has none yet. Check scores are 0-10, or -1 when
// the check doesn't apply (e.g. Packaging on a repo that publishes nowhere); those are dropped.
async function scorecard(org, name) {
  const res = await fetch(`https://api.securityscorecards.dev/projects/github.com/${org}/${name}`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(30_000),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return {
    score: data.score,
    date: data.date,
    url: `https://scorecard.dev/viewer/?uri=github.com/${org}/${name}`,
    checks: Object.fromEntries((data.checks ?? []).filter((c) => c.score >= 0).map((c) => [c.name, c.score])),
  };
}

async function repoSecurity(org, name, notes) {
  const repo = `${org}/${name}`;
  const [pvr, tree, wf, advisories, card] = await Promise.all([
    gh(`repos/${repo}/private-vulnerability-reporting`),
    gh(`repos/${repo}/git/trees/HEAD?recursive=1`),
    gh(`repos/${repo}/actions/workflows?per_page=100`),
    ghAll(`repos/${repo}/security-advisories?state=published`),
    scorecard(org, name).catch((err) => {
      notes.push(`${name}: Scorecard unavailable (${err.message}).`);
      return null;
    }),
  ]);
  const policy = tree?.tree.find((t) => t.type === 'blob' && POLICY.test(t.path))?.path ?? null;
  const active = (wf?.workflows ?? []).filter((w) => w.state === 'active');
  const published = advisories.map((a) => a.published_at).filter(Boolean).sort();
  return {
    reporting: Boolean(pvr?.enabled),
    policy: policy ? `https://github.com/${repo}/blob/HEAD/${policy}` : null,
    codeql: active.some((w) => w.path === 'dynamic/github-code-scanning/codeql' || /codeql/i.test(w.path)),
    dependabot: active.some((w) => w.path === 'dynamic/dependabot/dependabot-updates'),
    // From the default branch's files: the Actions list also has workflows pushed only on PR branches.
    scorecardWorkflow: Boolean(tree?.tree.some((t) => t.type === 'blob' && t.path.startsWith('.github/workflows/') && SCORECARD_WORKFLOW.test(t.path))),
    scorecard: card,
    advisories: advisories.length,
    lastAdvisory: published.at(-1) ?? null,
  };
}

async function main() {
  const { org, repos } = await publicRepos();
  const notes = [];
  let out = [];
  if (!token) {
    notes.push('No GitHub token at build time, so security settings were not fetched.');
    console.warn('security: no GITHUB_TOKEN; writing an empty page');
  } else {
    out = (
      await inBatches(repos, async (r) => {
        try {
          return { id: r.name, family: r.family, url: `https://github.com/${org}/${r.name}/security`, ...(await repoSecurity(org, r.name, notes)) };
        } catch (err) {
          notes.push(`${r.name}: security settings unavailable (${err.message}).`);
          return null;
        }
      })
    ).filter(Boolean);
  }
  // GitHub shows the org's .github SECURITY.md on repos without their own.
  const orgPolicy = out.find((r) => r.id === '.github')?.policy ?? null;
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), available: Boolean(token), orgPolicy, notes, repos: out })}\n`);
  const count = (f) => out.filter(f).length;
  console.log(
    `security: ${out.length} repos, ${count((r) => r.reporting)} with private reporting, ${count((r) => r.policy)} with their own policy, ${count((r) => r.codeql)} with CodeQL, ${count((r) => r.scorecard)} with a Scorecard, ${out.reduce((n, r) => n + r.advisories, 0)} advisories${notes.length ? `; ${notes.length} gaps` : ''}`,
  );
  for (const n of notes) console.warn(`  ${n}`);
}

await main();
