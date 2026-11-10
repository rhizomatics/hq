---
title: Agent diagnostics
status: active
lead: infra-lead
owner: jeyrb
started: 2026-11-10
---

# Agent diagnostics

Give every project the same diagnostic access, set up once in hq: logs, the live Home Assistant
API and database, real config, preview environments, throwaway HA/SignalK instances, browser
automation (Claude in Chrome, headless Playwright), and the local services agents log in to
(OpenObserve, SignalK, Home Assistant, routers). Each one gets a
dedicated agent account, a skill or doc, a known place for its secret and the same sandbox rules
in every project.

## Context

Today each resource was set up inside whichever project needed it first, so another project can't
use it without copying credentials and permissions over by hand. The private inventory, with hosts,
accounts and gaps, is `hq-private/reference/diagnostics.md`.

**Where things live:**

- **Secret values**: `~/Projects/.hq.env/<service>.env` on the laptop, outside every git repo,
  mode 600. `ha-repl` tokens stay in its own user-level config. Never in hq or hq-private.
- **Docs, skills, sandbox profiles, account list**: hq-private, because they name private hosts;
  generic skills that name nothing private go in the agent-plugins marketplace.
- **Later**: AWS Secrets Manager, once the remote [developer environment](dev-env.md) exists.

**Agent accounts** are separate from the maintainer's own logins, read-only unless a task needs
more, so access shows up in audit logs and can be revoked without touching anything else.

Preview containers and starter VMs may fit better on the remote developer environment, which is
blocked on the AWS migration. This project does the parts that work on the laptop now and gives
that environment a spec to build to.

## Plan

### Now (laptop)

- [x] @agent Gitignore `.logs.env` where a copy exists (supernotify had it; updates2mqtt fixed by the maintainer, 2026-11-10)
- [x] @agent Create `~/Projects/.hq.env/` and move the OpenObserve credentials in (2026-11-10)
- [x] @agent Write a diagnostics section in `reference/project_tooling.md`
- [ ] @human Confirm or create agent accounts: OpenObserve, HA `home`, SignalK, boat and home routers ([hq-private#93](https://github.com/rhizomatics/hq-private/issues/93))
- [ ] @pair `openobserve` skill: query logs by service and time range, loading `openobserve.env`
- [x] @pair Sandbox profiles per family (`homeassistant`, `signalk`) in hq-private, plus a command that writes them into each repo's `.claude/settings.local.json`, driven by `repos.toml` ([hq-private#94](https://github.com/rhizomatics/hq-private/pull/94), [#96](https://github.com/rhizomatics/hq-private/pull/96); applied to 19 checkouts 2026-11-10)
- [x] @pair Retire one-off `curl` allows in project `settings.local.json` in favour of the profile's host rules (`--prune`, 2026-11-10)
- [ ] @human Remove `10.36.10.20` from `sandbox.network.allowedDomains` in `~/.claude/settings.json`, now that the `signalk` profile covers it per repo
- [ ] @pair Point supernotify and updates2mqtt at `~/Projects/.hq.env/openobserve.env`, then delete their `.logs.env` copies
- [ ] @pair Move the preview environment out of supernotify into a reusable pattern, or document it as the template
- [ ] @human Dedicated Chrome profile for Claude in Chrome, logged in only with agent accounts (hq-private#93)
- [ ] @pair Browser guidance: Claude in Chrome for UI checks on real instances, headless Playwright for preview and docs; shared Playwright setup instead of per-repo `npx` installs
- [ ] @pair Cloud routines: advisory text in the snapshot instead of blocked sources ([hq-private#95](https://github.com/rhizomatics/hq-private/pull/95), [hq#3](https://github.com/rhizomatics/hq/pull/3))
- [ ] @agent Sweep reports for other "blocked"/"not read" gaps (e.g. `hacs/default` via raw.githubusercontent.com) and move each source into the snapshot
- [ ] @agent Remove the stale `openobserve` MCP entry for the old `~/Code/rhizomatics-ha/supernotify` path

### Later (developer environment)

- [ ] @human Decide which resources move to the remote dev environment (preview, starters, mounted config)
- [ ] @pair Move `.hq.env` secrets to AWS Secrets Manager and resolve them at runtime

## Decisions

- 2026-11-10: local secrets live in `~/Projects/.hq.env/`, one file per service, outside every repo (maintainer).
- 2026-11-10: agent accounts on local services are in scope (maintainer).
- 2026-11-10: project started (maintainer).

## Log

- 2026-11-10: proposed from a maintainer note listing five scattered diagnostic resources; inventory written in hq-private.
- 2026-11-10: started. Created `~/Projects/.hq.env/` with `openobserve.env`; added agent accounts to the scope and the inventory; filed hq-private#93 for account checks; tooling reference updated. Next: sandbox profiles.
- 2026-11-10: browser automation (Claude in Chrome, Playwright) and the OpenObserve MCP server added to scope and inventory; Chrome profile item added to hq-private#93. Sandbox profiles and sync command opened as hq-private#94 (dry run: 19 checkouts, 7 curl allows to prune). Next after merge: `openobserve` skill.
- 2026-11-10: OrbStack made an opt-in profile (environments moving to the dev server), hq-private#96. Profiles applied with `--prune`; the earlier #94 run had given every HA repo OrbStack access, removed by hand, with supernotify opted in. All 19 checkouts up to date.
