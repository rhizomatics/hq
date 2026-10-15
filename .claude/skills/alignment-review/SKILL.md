---
name: alignment-review
description: Monthly cross-repo alignment review — find improvements or fixes made in one Rhizomatics repo that should be applied to others (pyproject rules, pre-commit, docs plugins, tooling config, templates; CI workflows are covered by /github-review).
context: fork
agent: architect
---

# Monthly alignment review

## 1. What changed this month

For each repo in `repos.toml`, list commits on the default branch in the last ~35 days that touched
shared-convention files, e.g.:
`gh api "repos/rhizomatics/<repo>/commits?since=<date>&per_page=100"` then inspect the diffs of
commits touching: `pyproject.toml`, `.pre-commit-config.yaml`, `mise.toml`, `properdocs.yml`,
`zensical.toml`, `docs_hooks/`, `docgen/`, `.github/ISSUE_TEMPLATE`,
`renovate.json`, `package.json` scripts, `tsconfig.json`, `.oxlintrc.json`, `.oxfmtrc.json`,
`SECURITY.md`, `CLAUDE.md`/`AGENTS.md`, `refresh-deps.sh`.

Shallow-clone into the scratchpad when diffing many files is easier than the API.

## 2. Snapshot the current state per family

The baseline every repo should meet is `reference/project_standards.md` plus the policies in
`policies/` (within each policy's scope, allowing its listed exceptions); report each repo's gaps
against them, as well as differences between repos.

Within each `family`, compare the current versions of those files side by side: ruff/mypy/pytest
config, Python version, hook versions, docs plugins and theme, lint/format tooling. Note who is ahead and who is behind.

## 3. Recommend

For each improvement: source repo + commit link, why it's better, target repos, the concrete change,
effort S/M/L. Also flag divergence that looks accidental, and fixes in one repo (a CI bug, a docs
build workaround) whose bug likely exists elsewhere. Where 3+ repos need the same thing, propose
a reusable workflow or template in `rhizomatics/.github` instead.

Check the previous report in `hq-private/reports/alignment/` and record which recommendations were adopted.

## Output

`hq-private/reports/alignment/YYYY-MM.md` grouped by theme (Python tooling, TS tooling, docs, repo hygiene), each with a table `Change | From | Apply to | Effort`. End with a short "proposed
issues" list, then file them as hq issues and build agent-ready changes as PRs, per "Issues and PRs" in
`CLAUDE.md`.
