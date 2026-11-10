# Project Tooling

## Home Assistant

- All project should have access to the `homeassistant-repl@rhizomatics` skill and the `ha-repl` tool
  - Major projects will have their own `ha-repl` plugin
  - An up-to-date long lived access token will be maintained at user level for `ha-repl` access
- Real-world beta test environments (home Home Assistant install, boat SignalK server) are described
  privately in `hq-private/reference/test_environments.md`.

## Diagnostics

- Local secrets for diagnostics and agent accounts live in `~/Projects/.hq.env/<service>.env`, outside
  every repo; never copy them into a checkout. Load at run time, never print.
- Agents use dedicated, least-privilege accounts on local services (OpenObserve, SignalK, Home Assistant,
  routers), not the maintainer's logins.
- What exists, hosts, accounts and sandbox needs: `hq-private/reference/diagnostics.md`. Project:
  `projects/agent-diagnostics.md`.

## Github Actions
- All production projects
  - Share the same set of admin workflows from the `.github` project
  - Have a `ci` build that's triggered on push to main or PR
  - Have package publish workflows that require a clean (tests, lints, cyber checks) build, unless manually forced


## Skills

- `archify` used to generate architectural diagrams
- `home-assistant-best-practices`
- rhizomatics/agent-plugins marketplace
  - homeassistant-repl@rhizomatics
- New skill based on `hq` defined standards and practices