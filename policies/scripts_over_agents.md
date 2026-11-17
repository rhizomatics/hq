---
group: hq
summary: Work that needs no judgement is done by a script, not an agent.
---

# Scripts over agents

Scope: HQ itself (`hq`, `hq-private`), and product repos where an agent process does the same mechanical work each run.

## Policy

Work that needs no judgement is done by a script, not an agent. Agents spend tokens, vary from run to run and
miss things a script never would. Keep agents for ranking, judging, drafting and deciding.

- **Generate lists; don't maintain them.** A list or table that repeats facts held elsewhere (an index of
  projects, a schedule, who runs what) is generated from its one source at build time. Nobody, agent or human,
  edits it by hand. Every fact has one home, e.g. a project's goal is its `summary:`, a process's time is its
  **When:** line.
- **Check mechanically, then judge.** Consistency checks with a yes/no answer (a skill exists for each process,
  the persona matches, a field is present, a heading parses) are a script. Agents run the script and act on
  what it reports, rather than reading every file to look.
- **Collect deterministically.** Data gathering with fixed sources and fields (stats, snapshots) runs as a plain
  script on a schedule; agents only interpret the results. This was already the rule for stats.
- **When an agent repeats the same mechanical step on every run**, that step is a candidate for a script. The
  policy review looks for them.

## How it's done in HQ

- The site build generates the lists of projects, processes (the routine schedule) and policies that open those
  sections, and expands markers in the docs, such as `<!-- hq:runs <persona> -->` (processes per persona), in
  `site/scripts/lib/hq-docs.mjs`.
- `mise run check-hq` (`site/scripts/check-hq.mjs`) runs the mechanical checks and exits non-zero on a problem;
  the site build prints the same problems as warnings.
- Stats and GitHub snapshots are collected by scripts in `hq-private/scripts/` on GitHub Actions.

## Exceptions

- A one-off list that nothing else repeats can stay hand-written.
- Generating isn't worth it if the script would cost more to keep than the list: a few lines that rarely change.
