---
name: security-escalation
description: Daily check for serious security issues across Rhizomatics repos (Dependabot, code scanning, secret scanning, private advisories). Escalates only what matters, excluding purely transitive vulnerabilities inherited from Home Assistant or SignalK.
context: fork
agent: infra-lead
---

# Daily security escalation

Silence is the expected outcome. Escalate only what needs a human soon.

## Gather, per repo in `repos.toml`

In a cloud routine the alert APIs are blocked: read the alert lists from the latest
`hq-private/data/github/YYYY-MM-DD.json` instead (fields mirror the API below; `{"error": ...}` means the
snapshot couldn't read it). Private advisories still work via `gh api`.


- Dependabot: `gh api repos/rhizomatics/<repo>/dependabot/alerts?state=open --paginate`
  (fields: `security_advisory.severity`, `security_vulnerability.package`, `dependency.relationship`
  `direct|transitive|unknown`, `dependency.scope` `runtime|development`, `dependency.manifest_path`)
- Code scanning: `gh api repos/rhizomatics/<repo>/code-scanning/alerts?state=open` (404/403 = not enabled; note it, don't fail)
- Secret scanning: `gh api repos/rhizomatics/<repo>/secret-scanning/alerts?state=open`
- Privately reported advisories: `gh api repos/rhizomatics/<repo>/security-advisories?state=triage`

Once per run, not per repo:

- uv advisories, since uv builds, locks and packages every Python repo but never shows up as a
  Dependabot alert: `gh api "repos/astral-sh/uv/security-advisories?state=published"` (in a cloud
  routine, WebFetch https://github.com/astral-sh/uv/security/advisories instead). Only those
  published since the previous report.

## Escalate if any of

1. Any open secret-scanning alert.
2. Any privately reported advisory in `triage` (a researcher is waiting on us).
3. Critical/high code-scanning alert.
4. Critical/high Dependabot alert, **unless** it is purely transitive from the upstream platform:
   the repo has `upstream = "homeassistant"` or `"signalk"` in `repos.toml`, the relationship is
   `transitive` (or `unknown` and the package is not declared in our own manifest), and it arrives
   via `homeassistant` / `signalk-server` / their test harnesses. Those are the platform's to fix
   and we can't pin around them sensibly. Count them in the summary but don't escalate.
5. A medium alert in a direct runtime dependency with a known exploit (check the advisory for
   "actively exploited" / KEV) — use judgement.
6. A new critical/high uv advisory, or a medium one that applies to how we use uv. CI runs
   `astral-sh/setup-uv` without a version, so it picks up the fix by itself. What stays exposed:
   published images, which copy `ghcr.io/astral-sh/uv:latest` at build time (repos with `ghcr` in
   `repos.toml`; compare the latest release date with the fix date), and the maintainer's laptop
   and servers, where uv is installed with mise (`mise upgrade uv`, not `uv self update`). Escalate under the area of the images it affects, or `org` if none do.

Compare with the previous file in `hq-private/reports/security/` so the same alert isn't escalated twice
unless it is older than 7 days and still open (then re-escalate as "still open").

## Output

Always write `hq-private/reports/security/YYYY-MM-DD.md`, short (see "Working rules" in `CLAUDE.md`). Nothing
to escalate → one line, plus a line per data gap (e.g. snapshot missing or stale). Otherwise the
escalations, each with its hq issue link. Add the table of counts per repo (escalated /
excluded-transitive / other open) only when a count changed, and only the changed rows; on the
first run of each month write the full table and the repos with scanning not enabled.

Escalations become hq issues per "Issues and PRs" in `CLAUDE.md`: labels `security-escalation` plus
the area (`homeassistant`, `signalk`, `mqtt`, `org` — from the repo's family), assigned to the
maintainer, titled `<area>: clear security alerts`. Keep **one open issue per area**: if one exists,
add new items to its checklist and comment, rather than opening another; tick items whose alerts
have closed. Each item: repo, alert link, severity, why it matters, and what the human must do.
Where the fix is a change an agent can make (a pin bump, a CodeQL config, a small code fix), build
it as a PR in the product repo and link it, so the human only reviews and merges. This is what pages
the maintainer.
Never paste secret values into the report or issue, only alert links.
