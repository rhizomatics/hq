---
name: github-review
description: Monthly review of GitHub Actions workflows and repo/org settings across Rhizomatics — consistency per app type (HACS, SignalK plugin, Docker/PyPI), adopting new GitHub features, and root causes of recurring build failures.
context: fork
agent: infra-lead
---

# Monthly GitHub review

## 1. Recurring build failures (root causes)

For each repo in `repos.toml`: `gh run list -R rhizomatics/<repo> --status failure --created ">=<date 35 days ago>" --json workflowName,headBranch,event,createdAt,url,databaseId`.
Read failing logs (`gh run view <id> --log-failed`) and cluster by cause: flaky test, expired
token/secret, rate limit, upstream action deprecation (Node version, `set-output`), dependency
resolution, runner image change, publish credential (PyPI/npm OIDC, GHCR). For each cluster with
2+ occurrences, give the root cause and the fix that removes it (not just a re-run). Note
renovate/dependabot PRs whose CI fails for the same reason.

## 2. Workflow consistency per app type

Families in `repos.toml` map to app types: `ha-integration` (HACS release zip, hassfest, HACS
validation), `signalk-plugin` (npm publish with OIDC trusted publishing), `mqtt-service` (Docker
to GHCR + PyPI), `cli`, `site`. Within each type compare `.github/workflows/*`: same jobs, triggers,
action versions (pinned to SHA or major consistently), permissions blocks, concurrency, caching,
release flow. Identify the best current version per type and the repos behind it. Where a type
has 3+ repos with near-identical workflows, propose a reusable workflow in `rhizomatics/.github`.

## 3. Settings

Per repo (`gh api repos/rhizomatics/<repo>`, `/rulesets`, `/actions/permissions`,
`/actions/permissions/workflow`, `/vulnerability-alerts`, `/private-vulnerability-reporting`):
default branch protection or rulesets, default `GITHUB_TOKEN` permissions (read-only),
allowed actions, Dependabot alerts/security updates, secret scanning + push protection, private
vulnerability reporting, code scanning, discussions/issues enabled consistently, merge options,
auto-delete head branches, topics/description/homepage set. Org level: `gh api orgs/rhizomatics`
and `/actions/permissions`. Flag drift from the majority or from a sensible baseline.

Read every setting the API exposes, not only these, and compare against `policies/products.md`
(Actions, Issues, PRs and Discussions on; Wiki and Projects off; social preview set) and
`policies/project_standards.md` ("Shared repo admin"). The maintainer has approved proposing any
drift fix (hq-private#110): settings changes as one hq issue with the exact `gh` commands, changes
to files in a repo as a PR.

## 4. New GitHub features

Scan the GitHub changelog (`https://github.blog/changelog/`) for the last month for Actions,
security, rulesets, packages and repo-settings features worth adopting here (e.g. immutable
releases, artifact attestations, new runner images). Only recommend what fits a small org.

## 5. Release and build policies

Checks no other process makes (hq-private#110):

- **Release notes** (`policies/release.md`): the latest non-beta release of each repo uses the
  Release Notes Format headings it needs, plus GitHub's generated notes (PR list and "Full Changelog" link).
- **Immutable releases**: `immutable` is true on the latest release
  (`gh api repos/rhizomatics/<repo>/releases?per_page=1 --jq '.[0].immutable'`), except repos with
  `category = ["experimental"]`. GitHub applies immutability to all of a repo's releases, so it may be
  switched off briefly for a beta: flag it only if it's still off a week after the beta.
- **Container rescans** (`policies/build.md`): every repo that publishes to GHCR (`ghcr` in
  `repos.toml`) has a scheduled scan workflow that ran in the last 8 days, and a critical or high
  finding with a fix available led to a rebuilt image.
- **Badge** (`policies/project_standards.md`): the README shows the "managed by hq" badge.

## Output

`hq-private/reports/github/YYYY-MM.md`: failure clusters with root cause and fix, a per-type workflow matrix
with the recommended baseline, settings drift table, new features worth adopting. Changes to
GitHub settings need approval: file them as an hq issue (area `org`) with the exact `gh` commands; run
them only once approved there. Workflow changes go as PRs, per "Issues and PRs" in `CLAUDE.md`.
Check last month's report and record what was adopted.
