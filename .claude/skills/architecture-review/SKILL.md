---
name: architecture-review
description: Quarterly rolling architecture review of each Rhizomatics product against its platform's architecture (Home Assistant or SignalK), including the Home Assistant Integration Quality Scale — code changes needed, level changes, and changes to the scale itself.
context: fork
agent: architect
---

# Quarterly platform architecture review

Rolling, like `/docs-review` but offset from it: the window is the 1st–14th of February,
May, August and November, scheduled daily then. Each run reviews **one batch**.

## Pick today's batch

1. Quarter folder: `hq-private/reports/architecture-review/YYYY-Qn/`. In scope: repos in `repos.toml` with
   `upstream = "homeassistant"` or `"signalk"`, plus `mqtt-service` repos (reviewed against Home
   Assistant MQTT discovery conventions).
2. First run of the quarter only: write `_platform-changes.md` (below) before any product.
3. Already reviewed = product files in the folder. Nothing left → stop.
4. Batch size = ceil(remaining / 5), max 3. Products with the largest gap last quarter first.

## Platform changes (first run of the quarter)

What changed in the platform's architecture and guidance since the last quarter's review, so the
product reviews judge against the current rules:

- **Home Assistant**: developer docs (`https://developers.home-assistant.io/docs/`) and dev blog
  posts since last quarter; the `hq-private/reports/ecosystem/` reports from the quarter. The release notes
  for every HA release in the supported window
  (`https://www.home-assistant.io/blog/categories/release-notes/`): read each release's
  backward-incompatible changes, deprecations and full change list for integrations, helpers,
  services or APIs our products use or overlap with (e.g. `notify`, `alarm_control_panel`, `update`,
  `logger`, MQTT discovery), and note which product each affects. **Quality Scale
  itself**: compare the current checklist and rules
  (`https://developers.home-assistant.io/docs/core/integration-quality-scale/checklist`,
  `.../rules/`) with last quarter's `_platform-changes.md` — rules added, removed, renamed or moved
  between tiers, and hassfest changes in `home-assistant/core` `script/hassfest/quality_scale*.py`.
- **SignalK**: `@signalk/server-api` and `SignalK/signalk-server` plugin docs
  (`docs/` in that repo), `SignalK/specification` changes, app store metadata requirements.

## Review each product

Shallow-clone into the scratchpad. Cite `file:line` for every finding.

**Home Assistant integrations**
- **Quality Scale**: read `custom_components/<domain>/quality_scale.yaml` (create the proposal for
  one if missing, following supernotify's format: header with date, HA version and checklist URL
  verified against, plus a changelog of rule changes). For every rule, check the recorded
  `status`/`comment` against the actual code: rules marked `done` that no longer hold, `todo`
  rules now met, `exempt` justifications still valid, new/renamed rules not yet in the file.
- **Compatibility window** (`reference/project_standards.md`): the integration supports a rolling 6
  months of HA releases, including across HA's Python version changes. Check `hacs.json`/`manifest.json`
  minimums, `pyproject.toml` `requires-python` and CI test matrices against it, and that the code
  handles every release-note change in the window that touches it (from "Platform changes" above).
- **Level**: the highest tier whose rules are all done/exempt vs the `quality_scale` in
  `manifest.json`. Recommend raising, keeping or lowering it, and list exactly which rules block
  the next tier, with effort.
- **Architecture beyond the scale**: config entries and flows (options, reconfigure), `runtime_data`,
  coordinator/update patterns, async correctness (no blocking I/O in the event loop),
  `has_entity_name` and translations, unique IDs, device registry, services/actions registered in
  `async_setup`, diagnostics, repairs, deprecated APIs still in use (grep for anything in the
  dev blog deprecation posts), `hacs.json`/`manifest.json` minimum versions.

**SignalK plugins**
- Plugin API usage per current `@signalk/server-api` types: lifecycle (`start`/`stop` clean-up of
  subscriptions, timers, sockets), `schema`/`uiSchema`, delta emission (correct paths per the
  specification, SI units, `$source`, meta for units), resource providers vs ad-hoc routers,
  notifications and PUT handlers, v2 APIs (course, autopilot, notifications) where relevant.
- App store readiness: `package.json` `keywords` (`signalk-node-server-plugin`, `signalk-webapp`,
  category keywords), `signalk.displayName`/`appIcon`, server version range, no native deps that
  break on Raspberry Pi/Victron Cerbo.
- Security: no secrets in config defaults or logs, input validation on HTTP routes.

**MQTT services**
- Home Assistant MQTT discovery: topic structure, `unique_id`, device block, availability,
  `origin`, retained discovery messages, removal on uninstall, device-based discovery where useful.

## Output

- `_platform-changes.md` once per quarter.
- `hq-private/reports/architecture-review/YYYY-Qn/<repo>.md` per product: **Platform conformance** findings
  (tag: breaking soon / non-conformant / improvement), for HA a **Quality Scale** table
  (`Rule | Tier | Recorded | Actual | Change needed`) and a **Level** recommendation, then the
  proposed edit to `quality_scale.yaml`. Compare with the same product's file last quarter.
  File human to-dos as hq issues and build agent-ready changes (e.g. the
  `quality_scale.yaml` update) as PRs, per "Issues and PRs" in `CLAUDE.md`.
