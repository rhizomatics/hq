# Project Tooling

## Home Assistant

- All project should have access to the `homeassistant-repl@rhizomatics` skill and the `ha-repl` tool
  - Major projects will have their own `ha-repl` plugin
  - An up-to-date long lived access token will be maintained at user level for `ha-repl` access
- Real-world beta test environments (home Home Assistant install, boat SignalK server) are described
  privately in `hq-private/reference/test_environments.md`.

## Diagnostics

- Local secrets for diagnostics and agent accounts are encrypted with [fnox](https://fnox.jdx.dev) (age) in
  `~/Projects/.hq.env/fnox.toml`, outside every repo, one profile per environment and service
  (`prod-hass`, `dev-signalk`). Never copy them into a checkout or print them. `dev-*` profiles run
  unattended; `prod-*` ones only under a lease the maintainer opens with a passphrase:
  `mise run lease-start <service>`, then `mise run prod-run <service> -- <command>`
  (tasks in `~/Projects/mise.toml`).
- Agents use dedicated, least-privilege accounts on local services (OpenObserve, SignalK, Home Assistant,
  routers), not the maintainer's logins.
- Browser automation: Claude in Chrome (MCP extension) for UI checks against real instances, using a
  Chrome profile logged in with agent accounts only; headless Playwright for preview environments,
  docs sites and screenshots.
- What exists, hosts, accounts and sandbox needs: `hq-private/reference/diagnostics.md`. Project:
  `projects/agent-diagnostics.md`.

## Github Actions
- All production projects
  - Share the same set of admin workflows from hq (`admin/`, reusable workflows in hq's `.github/workflows/`)
  - Have a `ci` build that's triggered on push to main or PR
  - Have package publish workflows that require a clean (tests, lints, cyber checks) build, unless manually forced


## Skills

- `archify` used to generate architectural diagrams
- `home-assistant-best-practices`
- rhizomatics/agent-plugins marketplace
  - homeassistant-repl@rhizomatics
- New skill based on `hq` defined standards and practices