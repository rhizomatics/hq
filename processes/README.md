# Processes

Recurring routines, one file per cadence:

- [daily.md](daily.md)
- [weekly.md](weekly.md)
- [fortnightly.md](fortnightly.md)
- [monthly.md](monthly.md)
- [quarterly.md](quarterly.md)

Each agent process is a Claude Code skill in `.claude/skills/<name>/SKILL.md` (runnable by hand as
`/<name>`) that runs as a persona from `.claude/agents/`. The cadence files say *when* and *who*; the skill says *how*.

Process outputs are focused on *actionable results* rather than reports. Primary output of each process are PRs for identified changes and Issues for open questions, raised on the target repository. A report is written only where there's a case for one: an audit trail that the process ran and what it found (security escalation is the one known case), or memory the agent needs for its next run. Otherwise nobody reads it, so it isn't written (see "Reports only when there's a case for one" in `AGENTS.md`).

## Report Accessibility

> This applies only where a report has to be created, see the above section on Actionable Results.

Each process also declares who can read its report (`- **Report:**`):

- **public**: published in the Reports section of the HQ site; never holds security findings, referrers, personal infrastructure or support triage.
- **private by exception**: published unless the report's frontmatter says `visibility: private`, which the agent sets whenever the report holds anything sensitive.
- **private**: stays in `hq-private`.

Publishing starts with reports dated 2026-11-14; earlier ones were written as private. The site build also withholds any report that looks private (IP or email addresses, referrer counts, tokens).

Data gathering that needs no judgement (download counts, traffic) is a plain script on a GitHub Actions cron so it is cheap, reliable and builds history; the agent routines only interpret.

Monthly and quarterly work is spread across the calendar so it doesn't all land at once. Forum and topic sources are in `reference/`.

## Scheduling

Every agent process runs as a Claude Code cloud routine (manage at https://claude.ai/code/routines), named `hq: <cadence> <process>`, with all the org's repos attached.
Each process's cadence entry is the one place its time (**When:**, UTC) and persona (**Who:**) are set; daily agent routines start after the 05:00 stats and GitHub snapshot in Actions. On the site, this table is generated from those entries:

<!-- hq:generated schedule -->

Models: Sonnet for daily and weekly routines, Opus for monthly and quarterly ones, Haiku for
the `researcher` subagent they farm gathering out to. What cloud routines can and can't reach is in
`CLAUDE.md` ("Running as a cloud routine"); the probe behind it is `reference/cloud-access-probe.md`.
Run any process by hand with `/<skill-name>`; `hq-private/commands/collect-stats.sh` triggers the data snapshot.

Environment: every routine runs in **HQ Web Research**, which allowlists the sites they read (forums, platform
docs and blogs, github.com pages) but isn't meant for package installs. An entry that ever needs another one
says so with an **Environment:** line. When changing a routine's environment through the API, send the whole `job_config`; a partial one replaces it and drops the prompt and repos.

When adding a repo to the org, attach it to the routines too (the registry check will remind you).

## Adding a process

1. Write `.claude/skills/<name>/SKILL.md` with `agent: <persona>` and a fixed output path.
2. Add a section to the cadence file with **Who:**, **When:** (UTC), **Output:** and **Report:**.
   `mise run check-hq` says if anything is missing or disagrees with the skill.
3. Run it by hand twice and tune before scheduling it as a routine like the others.
