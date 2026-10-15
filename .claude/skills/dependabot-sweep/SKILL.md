---
name: dependabot-sweep
description: Daily merge or close of Dependabot PRs across Rhizomatics repos — merges trusted bumps (GitHub-owned actions, hassfest/HACS actions, rhizomatics/.github workflows, Astral and oxc tooling) once CI is green, and closes bumps of dependencies inherited from Home Assistant or SignalK.
context: fork
agent: infra-lead
---

# Daily Dependabot sweep

The maintainer has given this process standing approval to merge and close the Dependabot PRs
described below (see "Issues and PRs" in `CLAUDE.md`). Anything outside these rules is left open
for the weekly `/pr-report`. Silence is the expected outcome.

## Gather, per repo in `repos.toml`

- Open PRs by `dependabot[bot]`: `gh api 'repos/rhizomatics/<repo>/pulls?state=open&per_page=100'`.
- For each: `gh api repos/rhizomatics/<repo>/pulls/<n>` (`head.sha`, `mergeable`,
  `mergeable_state`), `.../pulls/<n>/files` (changed files), and the PR body, which lists every
  dependency and its from/to version (grouped PRs list several).
- CI on the head commit: `gh api repos/rhizomatics/<repo>/commits/<sha>/check-runs` and
  `.../commits/<sha>/status`.

## Classify each dependency in the PR

**Trusted** (merge):
- GitHub-owned actions: `actions/*`.
- Home Assistant validation actions: `home-assistant/actions/hassfest`, `hacs/action`.
- Shared workflows from `rhizomatics/.github` (`uses: rhizomatics/.github/...`).
- Astral: `uv`, `uv_build`, `ruff`, `ty` and `astral-sh/*` actions.
- oxc: `oxlint`, `oxfmt`, `oxlint-tsgolint`.

**Inherited** (close without merging), only in repos whose `upstream` in `repos.toml` is that platform:
- `homeassistant`: `homeassistant`, `pytest-homeassistant-custom-component`, and any package Home
  Assistant or the test harness pins: `homeassistant/package_constraints.txt` and `pyproject.toml`
  `dependencies` in `home-assistant/core` at the latest release, and `requirements_test.txt` in
  `MatthewFlamm/pytest-homeassistant-custom-component` (WebFetch the github.com pages). Examples:
  `zeroconf`, `aiohttp`, `pytest`.
- `signalk`: `signalk-server`, `@signalk/*`, and anything in the plugin's `peerDependencies`.

**Raises a support floor** (close without merging, whatever the dependency): the PR raises
`requires-python`, a `homeassistant` minimum (in `pyproject.toml`, `hacs.json` or `manifest.json`),
or, in a package published to PyPI or npm, the lower bound of a runtime dependency. Floors are set
deliberately (see "Dependency floors" in `reference/project_standards.md`). Comment why, and check
the repo's `dependabot.yml` has `versioning-strategy: increase-if-necessary`; if not, add it in the
same `dependabot.yml` PR as any `ignore` entries.

**Other**: everything else. If any dependency in a PR is Other, or a PR mixes trusted and
inherited, leave it open for `/pr-report`.

## Act

**Merge** a PR when every dependency in it is trusted and:
- it changes only dependency files (`.github/workflows/*`, `pyproject.toml`, `uv.lock`,
  `package.json`, `package-lock.json`, `.pre-commit-config.yaml`, `requirements*.txt`);
- every check run and status on the head commit has completed as success, skipped or neutral,
  and there is at least one (still pending → leave for tomorrow);
- no dependency in it is a major version bump (`1.x` → `2.x`, `v4` → `v5`, or for `0.x`
  versions a minor bump such as `0.16` → `0.17`, which semver treats as breaking).

**Never merge major version bumps**, trusted or not. They can break things CI doesn't exercise
(workflows that only run on release or tag), and in a published library raising a dependency's
lower bound to a new major (e.g. `polars` 1 → 2) breaks people who import it. Leave majors open:
add each to the rolling `<area>: review waiting PRs` issue with a one-line summary of the breaking
changes from the release notes, so the maintainer can decide.

Merge with a squash, pinned to the head you checked:
`gh api -X PUT repos/rhizomatics/<repo>/pulls/<n>/merge -f merge_method=squash -f sha=<sha>`.
If the PR is behind or conflicting (`mergeable_state` `dirty`/`behind`), comment
`@dependabot rebase` and leave it for tomorrow. Never use admin bypass.

**Close** a PR whose dependencies are all inherited. Comment first, e.g. "Closing: `zeroconf` is
pinned by Home Assistant, so we follow the platform's version rather than bumping it here.", then
`gh api -X PATCH repos/rhizomatics/<repo>/pulls/<n> -f state=closed`. If the repo's
`.github/dependabot.yml` doesn't already `ignore` that dependency, add it in one PR per repo
(reuse an open one), so Dependabot stops raising it; if the same ignore belongs in the shared
template in `rhizomatics/.github`, say so in the PR.

**Not merged** despite the rules (CI failing for 2+ days, merge refused by branch protection):
add it to the rolling hq issue for the area, `<area>: review waiting PRs` (labels `prs` + area),
with the reason in a few words. A merge refused because branch protection
requires checks that no longer run is a settings fix: file or update an hq issue (labels
`github` + area) naming the stale check names.

## Output

`hq-private/reports/dependabot/YYYY-MM-DD.md`, short (see "Working rules" in `CLAUDE.md`):

```
# Dependabot sweep YYYY-MM-DD
Merged N · closed M · waiting K · [hq#N](link)

| PR | Deps | Action | Why (only for closed or not merged) |
```

Nothing to do → a one-line report. Left-open "Other" PRs get a count only, not a table row.
