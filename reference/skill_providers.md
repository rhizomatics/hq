# Skill providers

Who else provides what each HQ skill does, so a skill is retired when someone else does it as well or better
([HQ as a product](../projects/hq-as-product.md), Phase 1). The choice per capability is recorded in
`[capabilities]` in `repos.toml`; this file holds the evidence behind it. Surveyed 2026-11-19 from vendors' own
repos and docs, skill marketplaces and GitHub's agentic workflow (gh-aw) catalogues.

**How sure:** catalogue listings were checked against the source repo where it mattered (the OSPO workflows, the
gh-aw engine and cross-repo docs, the security tools' release dates). Star counts and marketplace entries were
not. Several marketplaces (skills.sh, claudemarketplaces.com and similar) list skills with no review, so an
entry there isn't a recommendation.

## Summary

- **No third-party provider covers an HQ capability fully.** The closest are GitHub's OSPO workflows (gh-aw), on
  trial from 2026-11-19 beside four HQ skills (below).
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
| support (`support-sweep`) | [OSPO Organization Health Report](https://github.com/github/awesome-copilot/blob/main/workflows/ospo-org-health.md); [issue-triage](https://github.com/githubnext/agentics) | GitHub, gh-aw | partial: stale issues and "needs a human" items, but one weekly issue, not a ranked daily list of people waiting | **trial** |
| pull-requests (`pr-report`) | OSPO Organization Health Report (stale PRs, merge times); [Contribution Check](https://github.com/github/gh-aw) | GitHub, gh-aw | partial: no split of external contributions, stuck bumps and drafts | **trial** (same run as support) |
| dependency-updates (`dependabot-sweep`) | [dependabot skill](https://github.com/github/awesome-copilot/blob/main/skills/dependabot/SKILL.md); Renovate automerge | GitHub, skill; Mend, tool | partial: config help only. Notes that `@dependabot merge` comment commands were deprecated (Jan 2026) | keep; the shared auto-merge workflow already does the deterministic part |
| security (`security-escalation`) | see [Security](#security) | | partial | **merge step** over several providers |
| registry (`registry-check`) | [OSPO Stale Repository Report](https://github.com/github/awesome-copilot/blob/main/workflows/ospo-stale-repos.md) | GitHub, gh-aw | partial: inactive repos only, no comparison with `repos.toml` or publishing channels | **trial** |
| github-settings (`github-review`) | [OSS Release Compliance Checker](https://github.com/github/awesome-copilot/blob/main/workflows/ospo-release-compliance-checker.md); CI Doctor and CI Coach (gh-aw); OpenSSF Scorecard | GitHub, gh-aw; OpenSSF | partial: community files and security settings per repo; nothing compares workflows across repos | **trial** (compliance checker); Scorecard already in use |
| adoption (`adoption-report`) | [OSPO Contributors Report](https://github.com/github/awesome-copilot/blob/main/workflows/ospo-contributors-report.md) | GitHub, gh-aw | partial: contributors only; no provider reads PyPI, npm, GHCR, HACS or HA analytics | **trial** for the contributor part; downloads are [HQ Stats](../projects/hq-stats.md) |
| docs (`docs-review`) | Markdown Linter, Link Checker, Documentation Unbloat, Daily Accessibility Review (gh-aw) | GitHub Next, gh-aw | partial: each covers one aspect, none checks fidelity to the code | keep; revisit a link checker as a cheap add-on |
| releases (`release-digest`) | Daily Repository Chronicle (gh-aw); changelog skills on marketplaces | GitHub Next; third parties | partial: no judgement of what's significant to users | keep |
| support-themes (`support-review`) | Weekly Issue Activity, Discussion Task Miner (gh-aw) | GitHub Next, gh-aw | partial: issues only, no forums | keep |
| architecture (`architecture-review`) | Home Assistant quality-scale skills on marketplaces | third parties, unverified | partial: quality scale only | keep; check upkeep before any use |
| platforms (`platform-review`) | Home Assistant and SignalK development skills on marketplaces | third parties, unverified | none for release watching | keep |
| roadmaps, projects | gh-aw plan and team-status workflows | GitHub, gh-aw | partial: planning issues, not review against platform change | keep |
| alignment, agent-accessibility, forums, reputation, policies | none found | | none | keep |

## The trial

Four of GitHub's OSPO workflows run in `hq-private` from 2026-11-19 for two weeks, beside the HQ skills they
overlap. Each writes one issue labelled `trial` (never assigned, so no one is paged).

- **Engine:** Claude (`engine: claude`, an `ANTHROPIC_API_KEY` secret). gh-aw doesn't accept subscription tokens.
  Copilot-hosted inference is the alternative and needs no secret, only a Copilot plan.
- **Reach:** gh-aw reads every public repo by default, so running from one repo covers the org. Private repos
  would need a token, and they're out of scope anyway.
- **Pinned** to awesome-copilot commit `1683f50`. The upstream instructions are unchanged. Local settings are the
  engine, the schedule (weekly for the trial), the `trial` label and a marked section at the end of each file.
  The compliance checker runs only on issues labelled `ospo-release-check`, not on every new issue.
- **Question** (reframed 2026-11-19): is a workflow worth supporting as an optional HQ provider, off by default and
  turned on per instance like a skill, perhaps as a quarterly audit? The HQ skills stay either way; nothing is
  retired on the trial's result. The default HQ must stay low-friction for a developer with a handful of
  projects, so set-up cost counts as much as output quality.
- **Compare** on the same weeks: what each found that the other missed, false positives, whether the output
  needs a human to act, how much set-up and tuning it needed, and the cost per run. Results go in the project log.
- **Findings so far:** the first org health run (2026-11-19) cost about $2.43 on Sonnet 5 and filed nothing. Told to
  cover public repos only, it searched repo by repo, hit GitHub's search rate limit and ended without its safe
  output. The local settings now keep searches org-wide with `is:public`, one at a time, and always file the issue
  ([hq-private#129](https://github.com/rhizomatics/hq-private/pull/129)). The re-run the same evening cost about $1.09 and filed
  [hq-private#130](https://github.com/rhizomatics/hq-private/issues/130): an accurate snapshot (activity, merge
  times, four stale issues) that says which figures it couldn't get (commit search blocked in its sandbox, PRs
  sampled at 100), but with nothing to act on. It has no notion of someone waiting on the maintainer, counts the
  maintainer's own roadmap items as stale, and its thresholds suit a large org (a 94% merge rate shows yellow).
  So far it fits as an optional periodic snapshot, not a replacement for `support-sweep` or `pr-report`.

## Security

Already running beside Dependabot alerts and CodeQL: secret scanning with push protection (every public repo),
OpenSSF Scorecard (every released repo) and Grype (container images). Everything that uploads SARIF lands in
code scanning. One API (`code-scanning/alerts`, `tool.name`) then reads all of it, so `/security-escalation`
merges them in one place.

| Tool | Finds | Output | Fit |
| --- | --- | --- | --- |
| **[zizmor](https://github.com/zizmorcore/zizmor)** | Actions workflow flaws: template injection, unpinned or impostor actions, excess permissions, credentials left in checkouts | SARIF to code scanning | **chosen.** Every repo runs the shared admin workflows, and Scorecard only scores these issues. Shared workflow `reusable-zizmor.yml`, reaching repos with the next hq release. Free |
| **[Socket.dev](https://socket.dev)** | malicious or risky npm and PyPI packages with no CVE (install scripts, typosquats, new maintainers) | GitHub App: PR checks and comments | **chosen, pending the maintainer** (a GitHub App install). Nothing else catches this. Free for open source per its pricing page (not checked against the terms) |
| Trivy | images, filesystem, IaC, secrets | SARIF | not now: Grype already covers the images |
| osv-scanner, pip-audit, npm audit | known vulnerable dependencies | SARIF / JSON | not now: a second view of the same advisory data as Dependabot |
| Semgrep CE, Bandit | static analysis | SARIF | not now: overlaps CodeQL; worth it only for custom rules |
| gitleaks, TruffleHog | secrets in history | SARIF | not now: secret scanning and push protection are on everywhere |
| StepSecurity Harden-Runner | runtime egress on CI runners | dashboard | later: CI compromise is a real gap, but it has no code scanning output, so a separate read path |
| [claude-code-security-review](https://github.com/anthropics/claude-code-security-review) | AI review of PR diffs | PR comments | not now: last pushed 2026-02, no releases, and its README says it isn't hardened against prompt injection, so not for fork PRs |
| Copilot Autofix | fixes for code scanning alerts | PR suggestions | free on public repos; nothing to install |
| Snyk, Aikido, Endor Labs, Semgrep platform | SCA, SAST, triage | own dashboards | not now: free tiers capped or per developer, and findings don't reach code scanning |

How `/security-escalation` merges them is in its skill ("Providers and merging").
