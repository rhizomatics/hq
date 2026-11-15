# HQ

Management and administration hub for an open source organisation: the GitHub org and its human
maintainers are set in `repos.toml` (`[org]`). Agents do routine work; the maintainers decide. No product
code here, apart from the public site that publishes it (`site/`).

This file is the canonical instruction file for every agent. Agent-specific notes live in thin files that
point here (`CLAUDE.md` for Claude Code).

## Names used in these docs

The docs name roles, not the org. Each resolves through `repos.toml`:

- **the org**: `[org].github`, written `<org>` in commands and paths (`gh api repos/<org>/<repo>`).
- **the maintainer**: the first of `[org].maintainers`, written `<maintainer>` in commands. Issues are
  assigned to and reviews requested from them.
- **`hq`** and **`hq-private`**: the repos `[org].hq_repo` and `[org].private_repo`, checked out side by side
  (locally and in scheduled runs). Paths written `hq-private/...` in any hq doc mean that checkout.
- **the site**: the public HQ site at `[org].site_url`.
- **areas** and **labels**: the `area` of each family in `[families]`, and `[labels].sources`.

HQ is those two repos:

- **`hq`** (this repo, public): the static docs — processes, skills, personas, policies, reference,
  projects and the repo registry. Anything here is published; never put security findings,
  alert details, traffic referrers, support triage notes or personal infrastructure in it.
- **`hq-private`** (`../hq-private`, private): everything updated frequently or sensitive — reports,
  data snapshots, the stats collection scripts and workflow, private reference notes, and the
  **issues** that are the maintainer's to-do list. "hq issue" always means an issue in `<org>/hq-private`.

## Layout

- `repos.toml` — registry of every repo, its family and where it's published, plus the org settings above. Source of truth for all processes; update it when a repo is added, renamed or starts publishing somewhere new.
- `projects/` — active projects; `projects/proposed/` ideas not started, `projects/done/` finished, `projects/shelved/` rejected or postponed indefinitely. Format, task tags (`@agent`/`@pair`/`@human`) in `projects/README.md`; the project tables there are generated from each file's folder and `summary:`.
- `processes/` — recurring routines, one file per cadence (`daily.md` … `quarterly.md`): when, persona, environment, output. The schedule in `processes/README.md` and each persona's **Runs** in `team.md` are generated from them.
- `team.md` — who owns what, character, handoffs between personas, disagreements.
- `.claude/agents/` — personas: `pm`, `architect`, `infra-lead`, `marketing`, `tech-writer`; plus `researcher`, a cheap fast model for farmed-out gathering.
- `.claude/skills/` — one skill per process.
- `policies/` — the maintainer's cross-project policies (e.g. supported Python versions), each with its scope and exceptions, including `project_standards.md` (the baseline every product repo should meet: tooling, cooldowns, shared admin workflows, Dependabot shape). Processes check repos against them; format in `policies/README.md`.
- `reference/` — lookup material for processes: `project_tooling.md`, forums to watch (`*_discussion.md`), per-product problem phrases (`topic_terms.md`) and platform changes still to act on (`*_platform_changes.md`).
- `site/` — the public HQ site (Astro Starlight), built twice daily by
  `.github/workflows/site.yml`: the docs above, public reports, and a Usage section per component
  from `hq-private/data/`. Org name, URLs and family headings come from `repos.toml` via
  `site/src/lib/hq-config.mjs`. `scripts/sync-content.mjs` publishes docs and reports and fails on
  anything that looks private; `scripts/build-stats.mjs` writes only public aggregates;
  `scripts/build-actions.mjs` fetches each public repo's Actions state for the Operations › Deployments page;
  `scripts/build-issues.mjs` counts open issues by type for the Support and Design Process pages;
  `scripts/build-security.mjs` gathers public security settings and published advisories (never alerts) for the Security page;
  `scripts/build-design.mjs` gathers RFCs, roadmaps and design principles for the Design Process and RFCs pages. Run it with
  `mise run preview-site`.
- `hq-private/commands/` — helper shell commands for the maintainer.
- `hq-private/scripts/` — deterministic data collection (stdlib Python 3.11+, no deps), run by `hq-private/.github/workflows/collect-stats.yml`.
- `hq-private/reference/` — private reference notes (e.g. the real-world test environments).
- `hq-private/data/stats/` — daily metric snapshots (committed; GitHub traffic is lost after 14 days otherwise).
- `hq-private/data/legacy/` — frozen history from before the snapshots began, used by the site.
- `hq-private/reports/<area>/` — dated process outputs (`YYYY-MM-DD.md`, `YYYY-Www.md` for weekly, `YYYY-MM.md` for monthly).

## House values

- The maintainer's time is the scarcest resource. Bring decisions, not raw data; rank, and say what's needed from whom.
- Honest over impressive: say when data is thin, a guess is a guess, or a finding is a false positive.
- Small-org sized: prefer the cheapest change that removes the problem; no process for its own sake.
- Users first: people waiting on us, then contributors, then everything else.
- Voice in anything public: practical, understated, technically credible.
- Personas see things differently on purpose. Hand findings to the right role and surface disagreements (see `team.md`).

## Working rules for agents

- Read freely across `<org>/*` with `gh`.
- **Reports only when there's a case for one.** Write a report in `hq-private/reports/` only as an audit trail that
  the process ran and what it found (security escalation is the one known case), or as memory the agent needs on its
  next run (what it compared, drafted or handed over). Otherwise a process's output is its PRs and hq issues and
  nothing else. This overrides a skill's **Output** that names a report path (decided in hq-private#110).
- Reports are the detailed record for drill-down; assume nobody reads them. Anything the maintainer must do reaches them only through GitHub: an hq issue, or a PR when the action is reviewing a change (see "Issues and PRs"). Either one links back to the report section with the detail (drafts, evidence). A report item that needs the human and has no issue or PR link is a bug.
- **Report visibility.** Each process declares its report `public`, `private` or `private by exception`
  in its cadence file (`- **Report:**`). The site publishes public and private-by-exception reports
  dated from 2026-11-14. Write those for a public reader. In a private-by-exception report, add
  `visibility: private` to its YAML frontmatter whenever it holds anything that must not be published:
  unfixed security findings, alert details, traffic referrers, personal infrastructure, support triage
  of named users, unposted drafts. When unsure, mark it private. Public reports never hold those;
  put such detail in the hq issue instead.
- Keep reports short and compare with the previous one in the same folder; say what changed, not what's the same. **Daily reports**: a quiet day is one or two lines; otherwise a headline, the action items (each with its hq issue link) and then only the detail those items need, aiming for under ~20 lines plus drafts. No lists of sources checked or unchanged tables unless something failed or changed; data gaps are one line each.
- Fix what an agent can fix (hq reference files, `repos.toml`, docs) in the same run, or as a PR for product repos, instead of listing it as a to-do.
- **Scripts over agents** (`policies/scripts_over_agents.md`): never hand-edit a generated list; change its source. Run `mise run check-hq` after changing processes, skills, personas or projects. Mechanical work you find yourself repeating each run is a candidate for a script: say so in your report.
- When working a project, update its **Log** and task checkboxes in the same session.
- Farm out bulk gathering (the same query across many repos, fetching many forum threads, release notes or search results) to the `researcher` subagent. Give it the exact sources, fields and date range; keep ranking, judgement and drafting in your own persona.
- Handoffs: when a finding belongs to another persona (see the table in `team.md`), add it under **For other roles** at the end of your report, naming the persona. At the start of each run, check the latest reports for items addressed to you and say in your report which you picked up.

## Data you can't fetch live

Some data needs credentials or APIs that scheduled runs don't have. A daily GitHub Actions job
(`hq-private/scripts/collect_github.py`, 05:00 UTC) snapshots it to `hq-private/data/github/YYYY-MM-DD.json`:
security alerts, traffic referrers and paths, the org's repo list, discussions with their last commenter.
Read the latest snapshot and say which date you used. Download stats are in `hq-private/data/stats/`.
If something you need is unavailable, say so in the report rather than guessing.

## Issues and PRs

**Issues in `<org>/hq-private` are the human to-do list.** Anything only the maintainer can do — decide, approve, merge, release, reply where agents can't post, change GitHub/cloud settings, dismiss alerts — becomes an issue there, assigned to the maintainer, linking the report section it came from. A "needs the maintainer" item that exists only in a report or project file doesn't count; file the issue in the same run and link it from the report. Where a skill says to file an issue but the fix is a change an agent can build, a PR is often the better vehicle: see below.

**PRs are how agents deliver changes.** Code, docs and config changes in product repos are built by an agent on a branch and opened as a PR. When reviewing and merging is all the maintainer has to do, the PR is the to-do: request review from the maintainer, put the why and the report link in its description, and skip the hq issue. Add an hq issue only when there is also a decision or a non-PR step, and link the two. Keep each PR to one repo and one theme. Agents never merge, except the Dependabot PRs that `/dependabot-sweep` has standing approval to merge or close.

**Size issues so they can be finished.** One issue is one completable unit: a single project (a product repo or a `projects/` entry) with a checklist. When many small items span repos, group them by area instead of one issue per repo; never mix areas or projects in one issue, so nothing is left half done. If an issue grows past ~8 checklist items, split it.

**Before filing, search** open hq issues with the same labels and add to or comment on a match rather than duplicating. Tick or close items an agent can verify as done, with a comment saying how.

**Pinging the maintainer.** Issues are filed as the maintainer, and GitHub doesn't notify you of your own actions, so `hq-private/.github/workflows/notify-assignee.yml` re-assigns them as `github-actions[bot]` to make it ping. A new issue assigned to the maintainer pings by itself. A comment pings only if it contains the line `<!-- hq:needs-action -->` (hidden when rendered): add it when the comment asks the maintainer for something new (a new checklist item, a question, a decision, a blocker) and leave it off progress notes, ticks and closing comments. Editing an issue's body never pings, so when you add items to a rolling issue, also post a flagged comment listing them.

**Labels:** one source (`[labels].sources` in `repos.toml`) and one area (the `area` values in `[families]`). Title: `<area>: <outcome>`, e.g. `org: clear open security alerts`.

**Waiting threads and PRs** (unanswered support threads, forum replies, bump PRs) don't get an hq issue each. Keep one rolling issue per source and area, e.g. `<area>: reply to waiting users` (`support`) or `<area>: forum replies and manual checks` (`forums`), with one checklist item per thread: link to the thread, the decision or action needed in a few words, and a link to its draft in the report. Add new items, tick ones that are resolved (with how) and close the issue when the list is empty.

**Never, without approval in the hq issue:** comment on, label or close items in product repos, post to forums, change GitHub/cloud/DNS settings or secrets, merge. Once the maintainer approves in the issue, an agent may carry it out and close the issue. Standing exception: `/dependabot-sweep` may merge, close, rebase and comment on Dependabot PRs within the rules in its skill.
