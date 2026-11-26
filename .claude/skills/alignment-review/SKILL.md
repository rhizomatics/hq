---
name: alignment-review
description: Monthly cross-repo alignment review — find improvements or fixes made in one of the org's repos that should be applied to others (pyproject rules, pre-commit, docs plugins, tooling config, templates; CI workflows are covered by /github-review), and check each product's platform rating (HA quality scale, SignalK registry score) against policy.
context: fork
agent: architect
---

# Monthly alignment review

## 1. What changed this month

For each repo in `products.toml`, list commits on the default branch in the last ~35 days that touched
shared-convention files, e.g.:
`gh api "repos/<org>/<repo>/commits?since=<date>&per_page=100"` then inspect the diffs of
commits touching: `pyproject.toml`, `.pre-commit-config.yaml`, `mise.toml`, `properdocs.yml`,
`zensical.toml`, `docs_hooks/`, `docgen/`, `.github/ISSUE_TEMPLATE`,
`renovate.json`, `package.json` scripts, `tsconfig.json`, `.oxlintrc.json`, `.oxfmtrc.json`,
`SECURITY.md`, `CLAUDE.md`/`AGENTS.md`, `refresh-deps.sh`.

Shallow-clone into the scratchpad when diffing many files is easier than the API.

Also take each open item in `reference/hass_platform_changes.md` (kept by the platform review) as a change
to spread to the Home Assistant repos that haven't made it yet.

## 2. Snapshot the current state per platform

The baseline every repo should meet is `policies/project_standards.md` plus the policies in
`policies/` (within each policy's scope, allowing its listed exceptions); report each repo's gaps
against them, as well as differences between repos.

Include OpenSSF Scorecard: list public repos with no `.github/workflows/scorecard.yml` (a gap, as for any
baseline file), and for the rest the lowest checks from
`https://api.securityscorecards.dev/projects/github.com/<org>/<repo>` (WebFetch; if the host is blocked, say so in one line). Recommend only fixes
that are cheap and one pattern across repos (pinning actions, workflow `permissions:`), not score-chasing, and
skip the checks `policies/project_standards.md` lists as accepted. Scores stay internal: never put them in public reports.

Within each platform (a product's `platform`, usually its line's), compare the current versions of those files side by side: ruff/mypy/pytest
config, Python version, hook versions, docs plugins and theme, lint/format tooling. Note who is ahead and who is behind.

## 2a. Platform ratings

How each product rates on its platform's own measure, against the goals in `policies/hass-alignment.md`
(Integration Quality Scale) and `policies/signalk-alignment.md` (SignalK plugin registry score). Read the goals
there; don't restate them here.

Data: `health` on each product in the latest `hq/data/stats/` snapshot (collected daily by hq-stats:
`homeassistant` has `declared`, `assessed`, `next`; `signalk` has `score`, `badges`, `test_status`, `plugin_ci`,
`version`), and the snapshot from about 35 days earlier. A product with no `health`, or `{ error }`, is a
one-line data gap. A product's version is the registry's `version` for SignalK, its latest release
(`gh api repos/<org>/<repo>/releases/latest`) for Home Assistant. The goals apply from v1.0.0.

a. **Policy met.** Each product at v1.0.0 or later meets its goal. For Home Assistant, check both levels:
   a declared level above its own assessment is a claim the assessment doesn't back, and one below undersells
   the work.
b. **Not slipped.** Compare with the older snapshot: a drop in declared or assessed level or in score, or a lost
   badge, is a finding, with its cause (a rule marked `todo`, a new hassfest rule, a new registry penalty, a
   failing test run). This applies below v1.0.0 too.
c. **Platform rules kept up with.**
   - Home Assistant: compare each integration's `quality_scale.yaml` with hassfest's rule list
     (`https://raw.githubusercontent.com/home-assistant/core/HEAD/script/hassfest/quality_scale.py`). A rule
     missing from the YAML needs adding with a status. A rule in the YAML that hassfest no longer has needs
     removing. Note rule changes to hassfest in the month; hand substantive ones to the architecture review.
   - SignalK: read the registry's README changes in the month
     (`gh api "repos/SignalK/signalk-plugin-registry/commits?path=README.md&since=<date>"`). Note new checks or
     penalties, and which plugins they'll hit before they're rescored.
d. **Cheap moves up.** A product short of the next level by little work:
   - Home Assistant: `next.todo` of three rules or fewer, each small (docs rules, translations, a rule that's
     really `exempt`).
   - SignalK: a missing badge with a known small fix (screenshots, the plugin-ci workflow, a runnable test
     suite).
   List these only when the effort is S. Bigger gaps go to the project or roadmap that owns them, not here.

Findings go in the recommendations like any other, theme "Platform ratings". Build the agent-ready ones as PRs:
rule lists brought up to date, a status that is really `exempt`, the plugin-ci caller.

## 3. Recommend

For each improvement: source repo + commit link, why it's better, target repos, the concrete change,
effort S/M/L. Also flag divergence that looks accidental, and fixes in one repo (a CI bug, a docs
build workaround) whose bug likely exists elsewhere. Where 3+ repos need the same thing, propose
a reusable workflow or template in hq's `admin/` instead.

Check the previous report in `hq-private/reports/alignment/` and record which recommendations were adopted.

## Output

`hq-private/reports/alignment/YYYY-MM.md` grouped by theme (Python tooling, TS tooling, docs, repo hygiene, platform ratings), each with a table `Change | From | Apply to | Effort`. End with a short "proposed
issues" list, then file them as hq issues and build agent-ready changes as PRs, per "Issues and PRs" in
`AGENTS.md`.
