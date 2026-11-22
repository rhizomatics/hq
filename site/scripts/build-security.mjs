#!/usr/bin/env node
// Builds src/data/security.json for the Security page: what each public repo has in place, and the
// advisories it has published.
//
// Sources, all read-only and all public on GitHub:
//   - repos.toml                        which repos to cover (`archived = true` ones are left out)
//   - hq-private/data/github/<latest>   only for repo visibility and archive state
//   - GitHub REST API                   private vulnerability reporting, file tree (SECURITY.md),
//                                       active workflows (CodeQL, Dependabot updates), published advisories
//
// Never alerts: open Dependabot, code scanning and secret scanning alerts are unfixed findings and stay
// in hq-private (CLAUDE.md). This token couldn't read them anyway. Needs GITHUB_TOKEN (or GH_TOKEN).

import path from 'node:path';
import { gh, ghAll, inBatches, publicRepos, siteRoot, token, writeJson } from './lib/github.mjs';

const outPath = path.join(siteRoot, 'src', 'data', 'security.json');
const POLICY = /^(\.github\/|docs\/)?security\.md$/i;

async function repoSecurity(org, name) {
  const repo = `${org}/${name}`;
  const [pvr, tree, wf, advisories] = await Promise.all([
    gh(`repos/${repo}/private-vulnerability-reporting`),
    gh(`repos/${repo}/git/trees/HEAD?recursive=1`),
    gh(`repos/${repo}/actions/workflows?per_page=100`),
    ghAll(`repos/${repo}/security-advisories?state=published`),
  ]);
  const policy = tree?.tree.find((t) => t.type === 'blob' && POLICY.test(t.path))?.path ?? null;
  const active = (wf?.workflows ?? []).filter((w) => w.state === 'active');
  const published = advisories.map((a) => a.published_at).filter(Boolean).sort();
  return {
    reporting: Boolean(pvr?.enabled),
    policy: policy ? `https://github.com/${repo}/blob/HEAD/${policy}` : null,
    codeql: active.some((w) => w.path === 'dynamic/github-code-scanning/codeql' || /codeql/i.test(w.path)),
    dependabot: active.some((w) => w.path === 'dynamic/dependabot/dependabot-updates'),
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
          return { id: r.name, family: r.family, url: `https://github.com/${org}/${r.name}/security`, ...(await repoSecurity(org, r.name)) };
        } catch (err) {
          notes.push(`${r.name}: security settings unavailable (${err.message}).`);
          return null;
        }
      })
    ).filter(Boolean);
  }
  // GitHub shows the org's .github SECURITY.md on repos without their own.
  const orgPolicy = out.find((r) => r.id === '.github')?.policy ?? null;
  await writeJson(outPath, { generatedAt: new Date().toISOString(), available: Boolean(token), orgPolicy, notes, repos: out });
  const count = (f) => out.filter(f).length;
  console.log(
    `security: ${out.length} repos, ${count((r) => r.reporting)} with private reporting, ${count((r) => r.policy)} with their own policy, ${count((r) => r.codeql)} with CodeQL, ${out.reduce((n, r) => n + r.advisories, 0)} advisories${notes.length ? `; ${notes.length} gaps` : ''}`,
  );
  for (const n of notes) console.warn(`  ${n}`);
}

await main();
