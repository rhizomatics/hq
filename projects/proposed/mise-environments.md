---
title: mise environments
status: draft
lead: infra-lead
owner: jeyrb
started:
---

# mise environments

Use mise as the one way into an environment (production, dev, test) from any checkout. Its tools,
its tasks and later its hosts and settings all come from there. Start with secrets: replace
`set -a; . ~/Projects/.hq.env/<env>/<service>.env` with [fnox](https://fnox.jdx.dev) profiles
that mise tasks call, so secrets are encrypted at rest, scoped to one command and ready to move to
AWS Secrets Manager without changing how agents ask for them.

## Context

mise is already the standard for tools and dev tasks (`policies/project_standards.md`). Secrets
are plaintext `KEY=value` files under `~/Projects/.hq.env/{prod,dev}/`, one per service, mode 600.
Agents source them by hand (see `hq-private/reference/diagnostics.md`), and the `openobserve` skill
reads its file directly. That works, but the values sit unencrypted on disk, every caller re-implements
loading, and the planned move to Secrets Manager
([agent diagnostics](../agent-diagnostics.md), "Later") would mean changing every caller.

**Assumption: fnox fits.** It's by jdx, the author of mise. It reads secrets from an encrypted
`fnox.toml` (age), the macOS Keychain, 1Password, AWS Secrets Manager or Parameter Store and more,
and passes them to one process with `fnox exec -- <cmd>`. Profiles (`-P prod`) pick the source per
environment. The fnox docs recommend mise tasks that wrap `fnox exec` rather than mise `[env]`
loading; the `mise-env-fnox` plugin is marked experimental. Latest seen: v1.47.0. Not yet checked:
`.env` import, pointing at a config outside the cwd tree, and Keychain access from inside the
Claude Code sandbox. The first task confirms or kills the assumption.

**Shape (to confirm in the spike):**

- One `fnox.toml` in `~/Projects/.hq.env/`, outside every repo as now. It holds names and
  provider references, with no plaintext values.
- One fnox profile per environment and service, e.g. `prod-openobserve`, `dev-signalk`, mirroring
  today's one-file-per-service and the `prod-*` sandbox profiles. A command gets only the secrets
  for the service it uses. fnox profiles are configuration, not an access boundary; the boundary
  stays the sandbox and the production-by-exception rule.
- Laptop provider: Keychain or age (decision below). Later: `aws-sm`, behind the same profile names.
- mise: `MISE_ENV=prod|dev` picks the environment, and a shared task or small wrapper runs
  `fnox exec -P <env>-<service> -- <cmd>`. Secrets never go into the interactive shell.

**Out of scope for now:** cloud routines (they have no `.hq.env`; they come in with Secrets Manager),
and the maintainer's own logins.

## Plan

### Secrets (first)

- [ ] @agent Spike: install fnox through mise with the 7-day cooldown; check `.env` import, config
  outside the cwd tree (`--config` or an env var), Keychain and age from inside the Claude Code
  sandbox, and that `fnox exec` never echoes values. Write up the result in the Log; shelve the
  project if fnox doesn't fit
- [ ] @human Choose the laptop provider: macOS Keychain (nothing on disk, may prompt) or age
  (ciphertext in `fnox.toml`, key in Keychain or 1Password)
- [ ] @pair `~/Projects/.hq.env/fnox.toml` with `prod-*` and `dev-*` profiles for every file in
  the diagnostics inventory; import values without printing them
- [ ] @pair mise entry point: `MISE_ENV` to fnox profile mapping, as a shared file task in
  `rhizomatics/.github` `.mise/tasks/` or a user-level mise config, whichever the spike favours
- [ ] @pair Move the `openobserve` skill (`oo.py`) to read from the environment under `fnox exec`,
  with the `.env` file as fallback until the migration is done
- [ ] @pair Update `hq-private/reference/diagnostics.md`, `~/Projects/.hq.env/README.md` and
  `reference/project_tooling.md` to the new loading command
- [ ] @human Delete the plaintext `.env` files once every caller uses fnox

### Environments (later)

- [ ] @pair `preview-*` tasks and the home dev SignalK select the `dev` environment through
  `MISE_ENV`, so dev/test needs no extra setup
- [ ] @pair Non-secret per-environment settings (hosts, ports, URLs) in mise env files instead of
  the secret files
- [ ] @pair Add an `aws-sm` provider behind the same profile names once the
  [developer environment](dev-env.md) exists; replaces agent-diagnostics' Secrets Manager task
- [ ] @agent Add "environments through mise" to `policies/project_standards.md` once it works in
  two repos

## Decisions

## Log

- 2026-11-10: proposed by the maintainer: extend mise to manage environments, starting with
  secrets, on the assumption that fnox can hold the `.hq.env` secrets. fnox docs read; spike is
  the first task.
