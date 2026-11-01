---
title: remote_logger to Quality Scale Silver
status: active
lead: architect
owner: jeyrb
started: 2026-11-01
target: 2027-02-01
---

## Goal

remote_logger declares `quality_scale: silver` in `manifest.json` by 1 Feb 2027. It is a specialist
component for technical users, so a rule can be marked `exempt` with a stated reason where meeting it
would cost more than it gives users. Bronze comes first ([hq#66](https://github.com/rhizomatics/hq-private/issues/66)).

## Context

The first assessment is in `custom_components/remote_logger/quality_scale.yaml` (remote_logger#102)
and the 2026-Q4 architecture review (`hq-private/reports/architecture-review/2026-Q4/remote_logger.md`).
Of the 10 Silver rules, 3 are already done (config-entry-unloading, integration-owner,
reauthentication-flow) and entity-unavailable is exempt: the sensors are the integration's own
counters. No other Silver rule looks like a candidate for an exception; all are small to medium.

## Plan

- [ ] @pair Bronze (hq#66): fixes remote_logger#103 (merged), reconfigure flow #104, HA floor + test matrix + bronze declaration #105
- [x] @pair action-exceptions: `ServiceValidationError` for unknown or unloaded entries (remote_logger#103, merged 2026-11-01)
- [ ] @pair parallel-updates: `PARALLEL_UPDATES = 0` in sensor.py (S)
- [ ] @pair log-when-unavailable: log once when the collector becomes unreachable and once on recovery, instead of a warning per flush (S)
- [ ] @pair docs-installation-parameters: describe every setup field in text (OTLP host/port/TLS/encoding/token/headers/resource attributes, syslog fields), after the reconfigure flow lands (S, tech-writer)
- [ ] @pair docs-configuration-parameters: describe every options field (log level, event groups, event body, custom events, suppress event name) (S, tech-writer)
- [ ] @pair test-coverage above 95% (91.7% on 2026-11-01; 96% with #104, so mainly raise `fail-under` and update quality_scale.yaml): exporter.py, otel/exporter.py, remote_logger.py event-group branches; raise `fail-under` to 95 (M)
- [ ] @pair Re-check entity-unavailable exemption and set `quality_scale: silver` in manifest.json
- [ ] @human Merge the PRs; release

## Decisions

- 2026-11-01 jeyrb: approved all of hq#66 (Bronze), including moving connection settings to a reconfigure step and raising the HA floor to 2026.5.0.
- 2026-11-01 jeyrb: 3-month goal to reach Silver; exceptions acceptable for a specialist component.

## Log

- 2026-11-01: project started. Bronze PRs being built. Silver gap list taken from quality_scale.yaml; no reasons found not to go for Silver.
- 2026-11-01: #103 merged; #104 and #105 green. Coverage reaches 96% with #104. Remaining Silver: parallel-updates, log-when-unavailable, the two docs-parameters rules, fail-under 95.
