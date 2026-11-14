# Processes

Recurring routines, one file per cadence:

- [daily.md](daily.md)
- [weekly.md](weekly.md)
- [fortnightly.md](fortnightly.md)
- [monthly.md](monthly.md)
- [quarterly.md](quarterly.md)

Each agent process is a Claude Code skill in `.claude/skills/<name>/SKILL.md` (runnable by hand as
`/<name>`) that runs as a persona from `.claude/agents/`. The cadence files say *when* and *who*; the skill says *how*.

Process outputs are focused on *actionable results* rather than reports. Primary output of each process are PRs for identified changes and Issues for open questions, raised on the target repository. A report is written only where there's a case for one: an audit trail that the process ran and what it found (security escalation is the one known case), or memory the agent needs for its next run. Otherwise nobody reads it, so it isn't written (see "Reports" in `CLAUDE.md`).

## Report Accessibility

> This applies only where a report has to be created, see the above section on Actionable Results.

Each process also declares who can read its report (`- **Report:**`):

- **public**: published on the [HQ site](https://hq.rhizomatics.org.uk/reports/); never holds security findings, referrers, personal infrastructure or support triage.
- **private by exception**: published unless the report's frontmatter says `visibility: private`, which the agent sets whenever the report holds anything sensitive.
- **private**: stays in `hq-private`.

Publishing starts with reports dated 2026-11-14; earlier ones were written as private. The site build also withholds any report that looks private (IP or email addresses, referrer counts, tokens).

Data gathering that needs no judgement (download counts, traffic) is a plain script on a GitHub Actions cron so it is cheap, reliable and builds history; the agent routines only interpret.

Monthly and quarterly work is spread across the calendar so it doesn't all land at once. Forum and topic sources are in `reference/`.

## Scheduling

Every agent process runs as a Claude Code cloud routine (manage at https://claude.ai/code/routines), named `hq: <cadence> <process>`, with all rhizomatics repos attached. Times are UTC:

- **Daily:** Dependabot sweep 05:40, support sweep 06:00, security escalation 06:20, forum watch 06:40 (after the 05:00
  stats and GitHub snapshot in Actions).
- **Weekly:** Monday adoption 07:00, PR report 07:20, registry check 07:40; Friday project review 07:00.
- **Monthly, 08:00:** alignment 1st, support review 4th, ecosystem 10th, GitHub 11th, agent
  accessibility 18th, reputation 24th.
- **Every four months** (`quarterly.md`): docs review 08:30 on the 1st–14th of Jan/May/Sep, architecture review 08:30 on the
  1st–14th of Feb/Jun/Oct, roadmap review 09:00 on the 10th of Mar/Jul/Nov, policy review 09:00 on the 10th of Apr/Aug/Dec
  (routine `hq: quarterly policy review`).

Models: Sonnet for daily and weekly routines, Opus for monthly and quarterly ones, Haiku for
the `researcher` subagent they farm gathering out to. What cloud routines can and can't reach is in
`CLAUDE.md` ("Running as a cloud routine"); the probe behind it is `reference/cloud-access-probe.md`.
Run any process by hand with `/<skill-name>`; `hq-private/commands/collect-stats.sh` triggers the data snapshot.

Environments: routines that read the web (WebFetch/WebSearch of forums, platform docs and blogs,
github.com pages) run in **HQ Web Research**, which allowlists those domains but isn't meant for
package installs: Dependabot sweep, support sweep, security escalation, forum watch, alignment, support review,
ecosystem, GitHub, agent accessibility, reputation, architecture review, registry check, docs
review. The rest (adoption, PR report, project review, roadmap review, policy review) run in **Cloud Play Pen**. When changing a routine's environment through the API, send the whole `job_config`; a partial one replaces it and drops the prompt and repos.

When adding a repo to the org, attach it to the routines too (the registry check will remind you).

## Adding a process

1. Write `.claude/skills/<name>/SKILL.md` with `agent: <persona>` and a fixed output path.
2. Add a section to the cadence file.
3. Run it by hand twice and tune before scheduling it as a routine like the others.
