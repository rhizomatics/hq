# De-YAMLification

All Home Assistant components will have either zero YAML, or a limited set needed only for power users.

## Done

- Remote Logger
- Home Assistant REPL
- Appliance Auto Notify

## Residual Power User YAML
- Auto Arm (from v2)

## In Progress
- Supernotify
  - Recipients
  - Transports
  - Deliveries and Scenarios - with round trip
  - Cameras - TBD
  - Action Groups - TBD
  
## Log

- 2026-10-30 — project-review: Supernotify's roadmap ("Extended UI Configuration", decided in supernotify#166) says YAML stays the primary store for deliveries, scenarios and transports, with UI round-tripping to the file. That conflicts with "zero YAML or a small power-user set" for Supernotify; decision needed, see hq-private issue.
- 2026-11-06 — project-review: decided in hq-private#56 (closed 11-06): Supernotify follows HA's Automation pattern (UI-driven wherever possible; YAML kept for scenarios and deliveries, round-trip with the UI). The only other YAML is AutoArm's rules engine. These are the accepted power-user exceptions. Project looks finished; proposed to move to `done/` and record the rule as a policy (see report).
