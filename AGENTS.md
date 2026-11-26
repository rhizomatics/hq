# HQ

Management and administration hub for an open source organisation: the GitHub org and its human
maintainers are set in `hq.toml` (`[org]`). Agents do routine work; the maintainers decide. No product
code here, apart from the public site that publishes it (`site/`).

This file is the canonical instruction file for every agent. Agent-specific notes live in thin files that
point here (`CLAUDE.md` for Claude Code).

## Names used in these docs

The docs name roles, not the org. Each resolves through `hq.toml` and `products.toml`:

- **the org**: `[org].github`, written `<org>` in commands and paths (`gh api repos/<org>/<repo>`).
- **the maintainer**: the first of `[org].maintainers`, written `<maintainer>` in commands. Issues are
  assigned to and reviews requested from them.
- **`hq`** and **`hq-private`**: the repos `[org].hq_repo` and `[org].private_repo`, checked out side by side
  (locally and in scheduled runs). Paths written `hq-private/...` in any hq doc mean that checkout.
- **the site**: the public HQ site at `[org].site_url`.
- **areas** and **labels**: the product line slugs (`[lines]` in `hq.toml`), and `[labels].sources`.

Three words for what surrounds a product, used only in these senses:

- **product**: one thing users install or visit, with one roadmap and one release cadence: a table in
  `products.toml`, keyed by its slug (usually its repo's name). Built in one or more **repos** (`repos`); each
  repo belongs to exactly one product. Counted as a product unless it's on an `org` line, `public = false`,
  `experimental` or archived (`policies/products.md`).
- **product line**: the heading products are listed under (`[lines]` in `hq.toml`): `homeassistant`, `signalk`,
  `picoware`, `mqtt`, `hq`, and `org` for the org's own sites and HQ itself (`kind = "org"`: page views only,
  never counted as products). A line's slug is also its hq issue area.
- **artefact**: how a product is delivered (`artefacts.<name>`): a package on a registry, a release asset, a
  website. Its distribution is one of `[distributions]` in `hq.toml`.
- **platform**: what a product is built *for* and runs inside, made by others: Home Assistant, SignalK, MQTT
  brokers, or as bare as Linux or an ESP32 (`[platforms]` in `hq.toml`). Set by `platform`: a line's default,
  overridden per product or artefact. Its releases and changes are watched by the platform review; its
  conventions are the `*-alignment` policies; its packages are in `security_watch`. Say "platform", never
  "ecosystem", for this.
- **community**: projects other people build *on* one of our products: plugins, cards, packages that depend on
  ours. Listed in `community.toml` with the product they `extend`. Their stats are shown apart and never
  counted in the org's totals.

"Ecosystem" appears only as a package manager's own term (Dependabot's `package-ecosystem`, the advisory
API's `ecosystem = "npm"`).

HQ is those two repos:

- **`hq`** (this repo, public): the static docs — processes, skills, personas, policies, reference,
  projects and the repo registry. Anything here is published; never put security findings,
  alert details, traffic referrers, support triage notes or personal infrastructure in it.
- **`hq-private`** (`../hq-private`, private): everything updated frequently or sensitive — reports,
  data snapshots, the stats collection scripts and workflow, private reference notes, and the
  **issues** that are the maintainer's to-do list. "hq issue" always means an issue in `<org>/hq-private`.

## Layout

- `hq.toml`, `products.toml`, `community.toml` — the registry: the org settings above, product lines, platforms and distributions (`hq.toml`); every product, its line, repos and artefacts (`products.toml`); community projects and blogs (`community.toml`). Read through hq-stats' `loadConfig`. Source of truth for all processes; update `products.toml` when a repo is added, renamed or starts publishing somewhere new.
- `projects/` — one folder per status: `active/` in progress, `ongoing/` background work done as products are touched, `blocked/` waiting on something (with `blocked:` saying why), `ready/` drafted and waiting to start, `proposed/` ideas not started, `done/` finished, `shelved/` rejected or postponed indefinitely. Format, task tags (`@agent`/`@pair`/`@human`) in `projects/README.md`; the site's project list is generated from each file's folder and `summary:`.
- `processes/` — recurring routines, one file per cadence (`daily.md` … `quarterly.md`): when, persona, environment, output. The site's process list (the schedule) and each persona's **Runs** in `team.md` are generated from them.
- `team.md` — who owns what, character, handoffs between personas, disagreements.
- `admin/` — shared repo admin for every product repo: caller templates, `sync-admin.sh` and the shared
  `labels.yml` ([admin/README.md](admin/README.md)). The reusable workflows they call are in `.github/workflows/reusable-*.yml`;
  repos pin them to an hq release (`vX.Y.Z`). The `.github` repo holds only the main website and the org's profile and
  SECURITY.md.
- `.claude/agents/` — personas: `pm`, `architect`, `infra-lead`, `marketing`, `tech-writer`; plus `researcher`, a cheap fast model for farmed-out gathering.
- `.claude/skills/` — one skill per process.
- `policies/` — the maintainer's cross-project policies (e.g. supported Python versions), each with its scope and exceptions, including `project_standards.md` (the baseline every product repo should meet: tooling, cooldowns, shared admin workflows, Dependabot shape). Processes check repos against them; format (including the `summary:` the site's policy list shows) in `policies/README.md`.
- `reference/` — lookup material for processes: `project_tooling.md`, forums to watch (`*_discussion.md`), per-product problem phrases (`topic_terms.md`) and platform changes still to act on (`*_platform_changes.md`).
- `site/` — the public HQ site (Astro Starlight), built twice daily by
  `.github/workflows/site.yml`: the docs above, public reports, and a Usage section per component
  from the snapshots in `data/stats/` (the pages are [@rhizomatics/hq-stats](https://github.com/rhizomatics/hq-stats)'s, configured by `[stats]`). Org name, URLs and product line headings come from `hq.toml` and `products.toml` via
  `site/src/lib/hq-config.mjs`. `scripts/sync-content.mjs` publishes docs and reports and fails on
  anything that looks private;
  `scripts/build-actions.mjs` fetches each public repo's Actions state for the Operations › Deployments page;
  `scripts/build-issues.mjs` counts open issues by type for the Support and Design Process pages;
  `scripts/build-security.mjs` gathers public security settings and published advisories (never alerts) for the Security page;
  `scripts/build-design.mjs` gathers RFCs, roadmaps and design principles for the Design Process and RFCs pages;
  `scripts/build-community.mjs` reads the community blogs' feeds for the Community page (its projects and their figures come from hq-stats' `stats.json`);
  `scripts/build-releases.mjs` builds the Releases page from the last month's releases and the daily digest's summaries. Run it with
  `mise run preview-site`.
- `data/stats/` — daily usage snapshots, public data only, written by `hq-stats collect` from
  `.github/workflows/collect-stats.yml` (committed; GitHub traffic is lost after 14 days otherwise).
- `data/legacy/` — frozen HACS download history from before the snapshots began, used by the site.
- `hq-private/commands/` — helper shell commands for the maintainer.
- `hq-private/scripts/` — deterministic data collection (stdlib Python 3.11+, no deps), run by `hq-private/.github/workflows/collect-github.yml`.
- `hq-private/reference/` — private reference notes (e.g. the real-world test environments).
- `hq-private/reports/<area>/` — process outputs: `current.md` for a rolling report (daily and weekly routines), dated files for a snapshot (`YYYY-MM.md` monthly, `YYYY-Qn/` quarterly; daily and weekly ones from before 2026-11-26 too).

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
- **Rolling reports.** A process whose `- **Report:**` line says `rolling` keeps one file,
  `hq-private/reports/<area>/current.md`, and rewrites it each run with `updated: YYYY-MM-DD` in its frontmatter.
  Git history is the archive and the audit trail: compare with the last version (`git show HEAD:<path>`, or
  `git log -p -- <path>` further back), never with a dated file. Commit and push the report before filing or
  commenting on issues, and link its sections at that commit
  (`https://github.com/<org>/hq-private/blob/<sha>/reports/<area>/current.md#<anchor>`), since the next run
  rewrites them. When one run turns up more detail than belongs in the rolling report (a deep investigation, a
  long incident write-up), the persona may also write a one-off `hq-private/reports/<area>/YYYY-MM-DD-<topic>.md`
  and link it from `current.md`: its own judgement, not a schedule. A `snapshot` report is a new dated file each run, kept for periodic audits and the monthly and
  quarterly reviews.
- Keep reports short and compare with the previous one (the last version of a rolling report); say what changed, not what's the same. **Daily reports**: a quiet day is one or two lines; otherwise a headline, the action items (each with its hq issue link) and then only the detail those items need, aiming for under ~20 lines plus drafts. No lists of sources checked or unchanged tables unless something failed or changed; data gaps are one line each.
- Fix what an agent can fix (hq reference files, `products.toml`, docs) in the same run, or as a PR for product repos, instead of listing it as a to-do.
- **Scripts over agents** (`policies/scripts_over_agents.md`): never hand-edit a generated list; change its source. Run `mise run check-hq` after changing processes, skills, personas or projects. Mechanical work you find yourself repeating each run is a candidate for a script: say so in your report.
- When working a project, update its **Log** and task checkboxes in the same session.
- Farm out bulk gathering (the same query across many repos, fetching many forum threads, release notes or search results) to the `researcher` subagent. Give it the exact sources, fields and date range; keep ranking, judgement and drafting in your own persona.
- Handoffs: when a finding belongs to another persona (see the table in `team.md`), add it under **For other roles** at the end of your report, naming the persona. At the start of each run, check the latest reports for items addressed to you and say in your report which you picked up.

## Data you can't fetch live

Some data needs credentials or APIs that scheduled runs don't have. A daily GitHub Actions job
(`hq-private/scripts/collect_github.py`, 05:00 UTC) snapshots it to `hq-private/data/github/YYYY-MM-DD.json`:
security alerts, traffic referrers and paths, the org's repo list, discussions with their last commenter.
Read the latest snapshot and say which date you used. Download stats are in `hq/data/stats/`.
If something you need is unavailable, say so in the report rather than guessing.

## Issues and PRs

**Issues in `<org>/hq-private` are the human to-do list.** Anything only the maintainer can do — decide, approve, merge, release, reply where agents can't post, change GitHub/cloud settings, dismiss alerts — becomes an issue there, assigned to the maintainer, linking the report section it came from. A "needs the maintainer" item that exists only in a report or project file doesn't count; file the issue in the same run and link it from the report. Where a skill says to file an issue but the fix is a change an agent can build, a PR is often the better vehicle: see below.

**PRs are how agents deliver changes.** Code, docs and config changes in product repos are built by an agent on a branch and opened as a PR. When reviewing and merging is all the maintainer has to do, the PR is the to-do: request review from the maintainer, put the why and the report link in its description, and skip the hq issue. Add an hq issue only when there is also a decision or a non-PR step, and link the two. Keep each PR to one repo and one theme. Agents never merge, except the Dependabot PRs that `/dependabot-sweep` has standing approval to merge or close.

**One issue per action, named so the notification says it all.** An issue is one specific thing the maintainer must do, and its title says what and, when it's time-sensitive, by when: `homeassistant: reply on WTH "Notifying people is hard" by 2026-11-24 (frontend wants mockup feedback)`, not `homeassistant: forum replies`. Never keep a standing issue for a routine (no `<area>: reply to waiting users`, `<area>: forum replies`, `<area>: review waiting PRs`): items added to one arrive as edits nobody is notified about, under a title that doesn't say what's new or urgent, and get missed. The body opens with one line on why it matters and why now, then links the thing to act on and its draft or report section. Group items in one issue only when they're the same action done in one sitting (the same dependency bump across repos, the alerts on one package, the settings commands from one review); never mix areas or projects, and split past ~8 checklist items.

**Before filing, search** open hq issues with the same labels; if one already covers the same action, comment on it with what's new rather than duplicating. Tick or close items an agent can verify as done, with a comment saying how.

**Pinging the maintainer.** Issues are filed as the maintainer, and GitHub doesn't notify you of your own actions, so `hq-private/.github/workflows/notify-assignee.yml` re-assigns them as `github-actions[bot]` to make it ping. A new issue assigned to the maintainer pings by itself. A comment pings only if it contains the line `<!-- hq:needs-action -->` (hidden when rendered): add it when the comment asks the maintainer for something new (a new checklist item, a question, a decision, a blocker) and leave it off progress notes, ticks and closing comments. Editing an issue's body never pings, so when you add something to an existing issue, also post a flagged comment saying what.

**Labels:** one source (`[labels].sources` in `hq.toml`) and one area (a line slug from `[lines]`). Title: `<area>: <specific action>`, e.g. `homeassistant: upgrade aiohttp in supernotify for CVE-2026-1234`.

**Waiting threads and PRs** (an unanswered support thread, a forum post worth replying to, a PR needing a decision) each get their own issue, per the rule above: `<area>: reply to <repo>#123 (<what they need>)`, `<area>: decide on <repo>#45 <feature>`. Close it, saying how, once the thread is answered or the PR merged or closed. A PR whose only step is review and merge doesn't need one: the PR is the to-do.

**Never, without approval in the hq issue:** comment on, label or close items in product repos, post to forums, change GitHub/cloud/DNS settings or secrets, merge. Once the maintainer approves in the issue, an agent may carry it out and close the issue. Standing exception: `/dependabot-sweep` may merge, close, rebase and comment on Dependabot PRs within the rules in its skill.
