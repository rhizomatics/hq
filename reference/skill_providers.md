# Skill providers

Who else provides what each HQ skill does, so a skill is retired when someone else does it as well or better
([HQ as a product](../projects/hq-as-product.md), Phase 1). The choice per capability is recorded in
`[capabilities]` in `hq.toml`; this file holds the evidence behind it. Surveyed 2026-11-19 from vendors' own
repos and docs, skill marketplaces and GitHub's agentic workflow (gh-aw) catalogues.

**How sure:** catalogue listings were checked against the source repo where it mattered (the OSPO workflows, the
gh-aw engine and cross-repo docs, the security tools' release dates). Star counts and marketplace entries were
not. Several marketplaces (skills.sh, claudemarketplaces.com and similar) list skills with no review, so an
entry there isn't a recommendation.

## Summary

- **No third-party provider covers an HQ capability fully.** The closest are GitHub's OSPO workflows (gh-aw),
  tried beside four HQ skills in November 2026 and not adopted: worthwhile only for large orgs ([below](#githubs-ospo-workflows-gh-aw)).
- **Nothing exists for** forum watching, reputation, alignment across repos, agent accessibility, adoption trends
  across package registries, roadmaps, policies or projects. These stay HQ skills.
- **Platform knowledge** for Home Assistant and SignalK exists only as third-party skills of unknown upkeep. None is
  official. Not adopted; worth a look when the architecture review next runs.
- **Security** is where reuse pays most: deterministic scanners feed one place (code scanning), and the HQ skill
  becomes the step that merges and ranks them.

## Per capability

Overlap: **full** (could replace the skill), **partial** (covers part; HQ keeps the rest), **none**.

| Capability (HQ skill) | Best candidates | Maintainer, kind | Overlap | Decision |
| --- | --- | --- | --- | --- |
| support (`support-sweep`) | [OSPO Organization Health Report](https://github.com/github/awesome-copilot/blob/main/workflows/ospo-org-health.md); [issue-triage](https://github.com/githubnext/agentics) | GitHub, gh-aw | partial: stale issues and "needs a human" items, but one weekly issue, not a ranked daily list of people waiting | not adopted ([trial](#githubs-ospo-workflows-gh-aw)) |
| pull-requests (`pr-report`) | OSPO Organization Health Report (stale PRs, merge times); [Contribution Check](https://github.com/github/gh-aw) | GitHub, gh-aw | partial: no split of external contributions, stuck bumps and drafts | not adopted ([trial](#githubs-ospo-workflows-gh-aw)) |
| dependency-updates (`dependabot-sweep`) | [dependabot skill](https://github.com/github/awesome-copilot/blob/main/skills/dependabot/SKILL.md); Renovate automerge | GitHub, skill; Mend, tool | partial: config help only. Notes that `@dependabot merge` comment commands were deprecated (Jan 2026) | keep; the shared auto-merge workflow already does the deterministic part |
| security (`security-escalation`) | see [Security](#security) | | partial | **merge step** over several providers |
| registry (`registry-check`) | [OSPO Stale Repository Report](https://github.com/github/awesome-copilot/blob/main/workflows/ospo-stale-repos.md) | GitHub, gh-aw | partial: inactive repos only, no comparison with `products.toml` or publishing channels | not adopted ([trial](#githubs-ospo-workflows-gh-aw)) |
| github-settings (`github-review`) | [OSS Release Compliance Checker](https://github.com/github/awesome-copilot/blob/main/workflows/ospo-release-compliance-checker.md); CI Doctor and CI Coach (gh-aw); OpenSSF Scorecard | GitHub, gh-aw; OpenSSF | partial: community files and security settings per repo; nothing compares workflows across repos | not adopted (compliance checker); Scorecard already in use |
| adoption (`adoption-report`) | [OSPO Contributors Report](https://github.com/github/awesome-copilot/blob/main/workflows/ospo-contributors-report.md) | GitHub, gh-aw | partial: contributors only; no provider reads PyPI, npm, GHCR, HACS or HA analytics | not adopted for the contributor part; downloads are [HQ Stats](../projects/done/hq-stats.md) |
| docs (`docs-review`) | Markdown Linter, Link Checker, Documentation Unbloat, Daily Accessibility Review (gh-aw) | GitHub Next, gh-aw | partial: each covers one aspect, none checks fidelity to the code | keep; revisit a link checker as a cheap add-on |
| releases (`release-digest`) | Daily Repository Chronicle (gh-aw); changelog skills on marketplaces | GitHub Next; third parties | partial: no judgement of what's significant to users | keep |
| support-themes (`support-review`) | Weekly Issue Activity, Discussion Task Miner (gh-aw) | GitHub Next, gh-aw | partial: issues only, no forums | keep |
| architecture (`architecture-review`) | Home Assistant quality-scale skills on marketplaces | third parties, unverified | partial: quality scale only | keep; check upkeep before any use |
| platforms (`platform-review`) | Home Assistant and SignalK development skills on marketplaces | third parties, unverified | none for release watching | keep |
| roadmaps, projects | gh-aw plan and team-status workflows | GitHub, gh-aw | partial: planning issues, not review against platform change | keep |
| alignment, agent-accessibility, forums, reputation, policies | none found | | none | keep |

## GitHub's OSPO workflows (gh-aw)

**Not used by HQ.** Four of GitHub's OSPO workflows ran in `hq-private` from 2026-11-19 to 2026-11-23 beside the HQ
skills they overlap, to decide whether HQ should support them as an optional provider. Ended early: the
data was enough.

**Result:** accurate snapshots with nothing to act on, at an org of Rhizomatics' size. They're built for large
organisations with many repos and developers, where an org-wide health, stale-repo or contributor report tells
someone something they couldn't see. For a handful of maintainers it restates what the HQ skills already say.

- **Org health** (about $1 to $2.50 a run on Sonnet 5): activity, merge times and stale issues, but no notion of
  someone waiting on the maintainer, counts the maintainer's own roadmap items as stale, and its thresholds suit a
  large org (a 94% merge rate shows yellow). The first run filed nothing (search rate limit; see below).
- **Stale repos:** 0 of 23 public repos inactive for a year. The registry check already sees this.
- **Contributors:** an accurate monthly table (5 contributors, 2 new), but one figure a month, with no action.
- **Release compliance checker:** meant to run only on issues labelled `ospo-release-check`, but its agent ran
  (5 to 10 minutes each) on nine ordinary hq-private issues and wrote nothing. Paying for runs that are meant
  to be skipped is a cost to watch with any issue-triggered gh-aw workflow.

So none is an HQ provider, not even an opt-in one: supporting it would cost more than it's worth. They remain a
reasonable add-on for a large org running HQ, set up by hand as below.

### Using them

The workflows are in [github/awesome-copilot](https://github.com/github/awesome-copilot/tree/main/workflows)
(`ospo-*.md`). With the [gh-aw CLI](https://github.github.com/gh-aw/) installed (`gh extension install github/gh-aw`):

1. In the repo they should run from (one is enough: they read every public repo of the org):
   `gh aw add github/awesome-copilot/workflows/ospo-org-health.md@<sha>`, pinned to a commit.
2. Choose the engine in the file's frontmatter: `engine: claude` needs an `ANTHROPIC_API_KEY` repo secret (gh-aw
   doesn't accept subscription tokens); `engine: copilot` needs no secret but a Copilot plan. Private repos also need
   a token; leave them out if you can.
3. Keep local changes in a marked section at the end of the file, so the upstream part can be updated, and set
   the schedule (weekly or monthly is plenty) and a label on the issue it creates (`safe-outputs`).
4. `gh aw compile` writes the `.lock.yml` beside it; commit both. Re-run it after every edit. If you run zizmor, add
   the `.lock.yml` files to its `adhoc-packages` ignore list: gh-aw pins the engine's install itself.

Tuning we needed: tell the org health report to keep GitHub searches org-wide (`org:<org> is:public ...`), one at
a time, never repo by repo or from sub-agents, and to file its issue even when a call fails. Otherwise it hits
the search rate limit and ends without a report, at full cost. Expect $1 to $3 a run with Claude.

## Security

Already running beside Dependabot alerts and CodeQL: secret scanning with push protection (every public repo),
OpenSSF Scorecard (every released repo) and Grype (container images). Everything that uploads SARIF lands in
code scanning. One API (`code-scanning/alerts`, `tool.name`) then reads all of it, so `/security-escalation`
merges them in one place.

| Tool | Finds | Output | Fit |
| --- | --- | --- | --- |
| **[zizmor](https://github.com/zizmorcore/zizmor)** | Actions workflow flaws: template injection, unpinned or impostor actions, excess permissions, credentials left in checkouts | SARIF to code scanning | **chosen.** Every repo runs the shared admin workflows, and Scorecard only scores these issues. Shared workflow `reusable-zizmor.yml`, reaching repos with the next hq release. Free |
| **[Socket.dev](https://socket.dev)** | malicious or risky npm and PyPI packages with no CVE (install scripts, typosquats, new maintainers) | GitHub App: PR checks and comments | **in use** on every repo (2026-11-23). Nothing else catches this. Free for open source per its pricing page (not checked against the terms) |
| Trivy | images, filesystem, IaC, secrets | SARIF | not now: Grype already covers the images |
| osv-scanner, pip-audit, npm audit | known vulnerable dependencies | SARIF / JSON | not now: a second view of the same advisory data as Dependabot |
| Semgrep CE, Bandit | static analysis | SARIF | not now: overlaps CodeQL; worth it only for custom rules |
| gitleaks, TruffleHog | secrets in history | SARIF | not now: secret scanning and push protection are on everywhere |
| StepSecurity Harden-Runner | runtime egress on CI runners | dashboard | later: CI compromise is a real gap, but it has no code scanning output, so a separate read path |
| [claude-code-security-review](https://github.com/anthropics/claude-code-security-review) | AI review of PR diffs | PR comments | not now: last pushed 2026-02, no releases, and its README says it isn't hardened against prompt injection, so not for fork PRs |
| Copilot Autofix | fixes for code scanning alerts | PR suggestions | free on public repos; nothing to install |
| Snyk, Aikido, Endor Labs, Semgrep platform | SCA, SAST, triage | own dashboards | not now: free tiers capped or per developer, and findings don't reach code scanning |

How `/security-escalation` merges them is in its skill ("Providers and merging").
