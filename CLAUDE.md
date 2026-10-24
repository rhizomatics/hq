# Rhizomatics HQ

Management and administration hub for the Rhizomatics open source organisation (GitHub org
`rhizomatics`). One human maintainer (`jeyrb`); agents do routine work. No product code here.

HQ is two repos, checked out side by side (locally and in cloud routines):

- **`hq`** (this repo, public): the static docs — processes, skills, personas, policies, reference,
  projects and the repo registry. Anything here is published; never put security findings,
  alert details, traffic referrers, support triage notes or personal infrastructure in it.
- **`hq-private`** (`../hq-private`, private): everything updated frequently or sensitive — reports,
  data snapshots, the stats collection scripts and workflow, private reference notes, and the
  **issues** that are the maintainer's to-do list. Paths written `hq-private/...` in any hq doc mean
  that checkout. "hq issue" always means an issue in `rhizomatics/hq-private`.

## Layout

- `repos.toml` — registry of every repo, its family and where it's published. Source of truth for all processes; update it when a repo is added, renamed or starts publishing somewhere new.
- `projects/` — active projects; `projects/proposed/` ideas not started, `projects/done/` finished, `projects/shelved/` rejected or postponed indefinitely. Format, task tags (`@agent`/`@pair`/`@human`) and index in `projects/README.md`.
- `processes/` — recurring routines, one file per cadence (`daily.md` … `quarterly.md`): when, persona, output.
- `team.md` — who owns what, character, handoffs between personas, disagreements.
- `.claude/agents/` — personas: `pm`, `architect`, `infra-lead`, `marketing`, `tech-writer`; plus `researcher` (Haiku) for farmed-out gathering.
- `.claude/skills/` — one skill per process.
- `policies/` — the maintainer's cross-project policies (e.g. supported Python versions), each with its scope and exceptions. Processes check repos against them; format in `policies/README.md`.
- `reference/` — lookup material for processes: `project_standards.md` (the baseline every product repo should meet), forums to watch (`hass_discussion.md`, `signalk_discussion.md`) and per-product problem phrases (`topic_terms.md`).
- `hq-private/commands/` — helper shell commands for the maintainer.
- `hq-private/scripts/` — deterministic data collection (stdlib Python 3.11+, no deps), run by `hq-private/.github/workflows/collect-stats.yml`.
- `hq-private/reference/` — private reference notes (e.g. the real-world test environments).
- `hq-private/data/stats/` — daily metric snapshots (committed; GitHub traffic is lost after 14 days otherwise).
- `hq-private/reports/<area>/` — dated process outputs (`YYYY-MM-DD.md`, `YYYY-Www.md` for weekly, `YYYY-MM.md` for monthly).

## House values

- The maintainer's time is the scarcest resource. Bring decisions, not raw data; rank, and say what's needed from whom.
- Honest over impressive: say when data is thin, a guess is a guess, or a finding is a false positive.
- Small-org sized: prefer the cheapest change that removes the problem; no process for its own sake.
- Users first: people waiting on us, then contributors, then everything else.
- Voice in anything public: practical, understated, technically credible.
- Personas see things differently on purpose. Hand findings to the right role and surface disagreements (see `team.md`).

## Working rules for agents

- Read freely across `rhizomatics/*` with `gh`.
- Reports in `hq-private/reports/` are the detailed record for drill-down; assume nobody reads them. Anything the maintainer must do reaches them only through GitHub: an hq issue, or a PR when the action is reviewing a change (see "Issues and PRs"). Either one links back to the report section with the detail (drafts, evidence). A report item that needs the human and has no issue or PR link is a bug.
- Keep reports short and compare with the previous one in the same folder; say what changed, not what's the same. **Daily reports**: a quiet day is one or two lines; otherwise a headline, the action items (each with its hq issue link) and then only the detail those items need, aiming for under ~20 lines plus drafts. No lists of sources checked or unchanged tables unless something failed or changed; data gaps are one line each.
- Fix what an agent can fix (hq reference files, `repos.toml`, docs) in the same run, or as a PR for product repos, instead of listing it as a to-do.
- When working a project, update its **Log** and task checkboxes in the same session.
- Farm out bulk gathering (the same query across many repos, fetching many forum threads, release notes or search results) to the `researcher` subagent, which runs on Haiku. Give it the exact sources, fields and date range; keep ranking, judgement and drafting in your own persona.
- Handoffs: when a finding belongs to another persona (see the table in `team.md`), add it under **For other roles** at the end of your report, naming the persona. At the start of each run, check the latest reports for items addressed to you and say in your report which you picked up.

## Running as a cloud routine

Scheduled routines run in a cloud sandbox with every rhizomatics repo attached, each cloned under
`/home/user/<repo>` (so `hq` and `hq-private` are siblings). Commit and push reports and data to
`hq-private`, and changes to docs, projects or `repos.toml` to `hq`, each on `main`. What works there:

- `gh api` REST calls scoped to a rhizomatics repo: issues, comments, PRs, check runs, commits,
  releases, Actions runs, private security advisories, contents. Also `hq` issues.
- WebFetch and WebSearch, including github.com pages (e.g. discussions of any repo).

What doesn't, and what to use instead:

- **GraphQL** (`gh pr list`, `gh issue list`, `gh search`, discussions API) → use `gh api repos/...` REST.
- **Security alerts, traffic referrers/paths, org repo list, discussions with last-commenter**
  → read the latest `hq-private/data/github/YYYY-MM-DD.json` (collected daily at 05:00 UTC by
  `hq-private/scripts/collect_github.py` in GitHub Actions). Say which snapshot date you used.
- **Repos outside rhizomatics** (SignalK, home-assistant) → WebFetch their github.com pages.
- **Direct downloads** (`curl` to npm, Discourse, Panbo) → WebFetch the URL; download stats are already in `hq-private/data/stats/`.

If something you need is unavailable, say so in the report rather than guessing.

## Issues and PRs

**Issues in `rhizomatics/hq-private` are the human to-do list.** Anything only the maintainer can do — decide, approve, merge, release, reply where agents can't post, change GitHub/AWS settings, dismiss alerts — becomes an issue there, assigned to `jeyrb`, linking the report section it came from. A "needs the maintainer" item that exists only in a report or project file doesn't count; file the issue in the same run and link it from the report. Where a skill says to file an issue but the fix is a change an agent can build, a PR is often the better vehicle: see below.

**PRs are how agents deliver changes.** Code, docs and config changes in product repos are built by an agent on a branch and opened as a PR. When reviewing and merging is all the maintainer has to do, the PR is the to-do: request review from `jeyrb`, put the why and the report link in its description, and skip the hq issue. Add an hq issue only when there is also a decision or a non-PR step, and link the two. Keep each PR to one repo and one theme. Agents never merge, except the Dependabot PRs that `/dependabot-sweep` has standing approval to merge or close.

**Size issues so they can be finished.** One issue is one completable unit: a single project (a product repo or a `projects/` entry) with a checklist. When many small items span repos, group them by area — `homeassistant`, `signalk`, `mqtt`, `org` — instead of one issue per repo; never mix areas or projects in one issue, so nothing is left half done. If an issue grows past ~8 checklist items, split it.

**Before filing, search** open hq issues with the same labels and add to or comment on a match rather than duplicating. Tick or close items an agent can verify as done, with a comment saying how.

**Pinging the maintainer.** Issues are filed as `jeyrb`, and GitHub doesn't notify you of your own actions, so `hq-private/.github/workflows/notify-assignee.yml` re-assigns `jeyrb` as `github-actions[bot]` to make it ping. A new issue assigned to `jeyrb` pings by itself. A comment pings only if it contains the line `<!-- hq:needs-action -->` (hidden when rendered): add it when the comment asks the maintainer for something new (a new checklist item, a question, a decision, a blocker) and leave it off progress notes, ticks and closing comments. Editing an issue's body never pings, so when you add items to a rolling issue, also post a flagged comment listing them.

**Labels:** one source (`security-escalation`, `dependabot`, `support`, `forums`, `alignment`, `github`, `docs`, `architecture`, `ecosystem`, `reputation`, `roadmap`, `project`, `adoption`, `prs`) and one area (`homeassistant`, `signalk`, `mqtt`, `org`). Title: `<area>: <outcome>`, e.g. `homeassistant: clear open security alerts`.

**Waiting threads and PRs** (unanswered support threads, forum replies, bump PRs) don't get an hq issue each. Keep one rolling issue per source and area, e.g. `homeassistant: reply to waiting users` (`support`) or `signalk: forum replies and manual checks` (`forums`), with one checklist item per thread: link to the thread, the decision or action needed in a few words, and a link to its draft in the report. Add new items, tick ones that are resolved (with how) and close the issue when the list is empty.

**Never, without approval in the hq issue:** comment on, label or close items in product repos, post to forums, change GitHub/AWS/DNS settings or secrets, merge. Once the maintainer approves in the issue, an agent may carry it out and close the issue. Standing exception: `/dependabot-sweep` may merge, close, rebase and comment on Dependabot PRs within the rules in its skill.
