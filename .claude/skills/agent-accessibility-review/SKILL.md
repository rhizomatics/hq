---
name: agent-accessibility-review
description: Monthly review of how well Rhizomatics repos and docs work for AI agents — both agents developing the code and agents helping end users install and configure it — with suggested improvements.
context: fork
agent: architect
---

# Monthly agent accessibility review

Two audiences: **contributor agents** (an agent working in the repo) and **user agents** (an agent
helping someone install, configure or troubleshoot the project from its docs).

## Checklist per repo in `repos.toml`

Contributor agents:
- `CLAUDE.md` and/or `AGENTS.md` present, current (mentions the actual build/test/lint commands,
  matches `mise.toml`/`pyproject.toml`/`package.json`), and not bloated.
- One-command dev setup and test run; tests runnable without real hardware/services (fixtures,
  devcontainer, `ha-repl` for HA repos).
- `.claude/` settings or skills where they'd help; no stale or contradictory instructions.

User agents:
- Docs site publishes `llms.txt` (and ideally `llms-full.txt`) — check `https://<CNAME>/llms.txt`.
- Configuration documented as complete, copyable examples (YAML/JSON) with every option, types and
  defaults; error messages in docs match the code.
- Project listed in `rhizomatics/agent-plugins` marketplace where a skill/plugin makes sense (e.g.
  a config-helper skill for supernotify, a SignalK plugin skill), and the listing is current.
- Machine-readable metadata accurate: repo description/topics, `hacs.json`, `package.json`
  `signalk` keywords, pyproject classifiers/URLs.

Score each repo per item ✅ / ⚠️ / ❌ and keep the scoring consistent with last month's report
in `hq-private/reports/agent-accessibility/` so progress is visible.

## Output

`hq-private/reports/agent-accessibility/YYYY-MM.md`: a matrix (repos × checklist), changes since last month,
then the top 5 improvements ranked by value/effort with concrete content (e.g. a drafted AGENTS.md
section, an `llms.txt` docs plugin config to copy from the repo that already has one). Build the
improvements as PRs and file anything needing a decision as an hq issue, per "Issues and PRs" in
`CLAUDE.md`.
