---
title: mise environments
summary: mise as the way into prod/dev/test environments, starting with secrets through fnox
status: active
lead: infra-lead
owner: jeyrb
started: 2026-11-23
---

# mise environments

Use mise as the one way into an environment (production, dev, test) from any checkout. Its tools,
its tasks and later its hosts and settings all come from there. Start with secrets: replace
`set -a; . ~/Projects/.hq.env/<env>/<service>.env` with [fnox](https://fnox.jdx.dev) profiles
that mise tasks call, so secrets are encrypted at rest, scoped to one command and ready to move to
AWS Secrets Manager without changing how agents ask for them.

This is Phase 1 of [environment separation](env-separation.md). Once proven, its generic parts become
an [HQ Seed](hq-seed.md) module (working name `secrets`).

## Context

mise is already the standard for tools and dev tasks (`policies/project_standards.md`). Secrets
are plaintext `KEY=value` files under `~/Projects/.hq.env/{prod,dev}/`, one per service, mode 600,
according to `hq-private/reference/diagnostics.md`. They're on the physical MacBook (production).
The virtual macOS dev environment has no copy; the maintainer imports them through the shared folders
once fnox is ready to take them. Agents source them by hand,
and the `openobserve` skill reads its file directly. That works, but the values sit unencrypted on
disk, every caller re-implements loading, and the planned move to Secrets Manager
([agent diagnostics](agent-diagnostics.md), "Later") would mean changing every caller. No repo
under `~/Projects` has a real `.env` file, only `.env.example` files.

**Assumption: fnox fits.** It's by jdx, the author of mise, so it adds no new party to trust. It
reads secrets from an encrypted
`fnox.toml` (age), the macOS Keychain, 1Password, AWS Secrets Manager or Parameter Store and more,
and passes them to one process with `fnox exec -- <cmd>`. Profiles (`-P prod`) pick the source per
environment. The fnox docs recommend mise tasks that wrap `fnox exec` rather than mise `[env]`
loading; the `mise-env-fnox` plugin is marked experimental. Latest seen: v1.47.0. Not yet checked:
`.env` import, pointing at a config outside the cwd tree, and Keychain access from inside the
Claude Code sandbox. The spike confirms or kills the assumption.

**What it buys:** encrypted secrets stop agents and stray tools reading them off disk, and keep
plaintext out of backups and repos. They don't stop a malicious dependency running as the
maintainer on the laptop, which can ask the same unlocked Keychain. Only moving development off the
laptop (later phases of environment separation) does that.

**Shape (to confirm in the spike):**

- One `fnox.toml` in `~/Projects/.hq.env/`, outside every repo as now. It holds names and
  provider references, with no plaintext values.
- One fnox profile per environment and service, e.g. `prod-openobserve`, `dev-signalk`, mirroring
  today's one-file-per-service and the `prod-*` sandbox profiles. A command gets only the secrets
  for the service it uses.
- Profiles grouped by risk tier. Proposed tiers:
  - `dev`: dev/test services and seed data
  - `home-ro`: read-only agent accounts on home production
  - `cost`: AWS, npm, PyPI and other publish tokens

  The `critical` tier (iCloud and the maintainer's personal logins) stays outside fnox entirely.
- **Provider: age, with no Keychain**, so the same setup runs on the Linux dev machine. Two age keys
  in `~/.config/fnox/`, mode 600:
  - `dev`: a plain key file. Agents use it unattended.
  - `prod`: a passphrase-protected key file. Only `home-ro` and `cost` secrets are encrypted to it.

  Encrypting or importing needs only the public key, so agents can add secrets without being able
  to read them back. Later: `aws-sm`, behind the same profile names.
- **Break-glass = passphrase + lease.** fnox runs as the same user as the agent, so profiles alone
  are no boundary; the passphrase is. Without a terminal, fnox can't ask for it and refuses.
  1. The maintainer runs `fnox -P prod-<service> exec -- true` in their own terminal and types the passphrase.
  2. The fnox daemon (`[daemon] enabled = true`) holds the values in memory, and the agent's
     `fnox exec` reads them from there.
  3. The daemon exits after `idle_timeout`, which ends the lease. `fnox daemon stop` revokes it early.

  Production access still goes through the `prod-*` sandbox profiles too.
- mise: `MISE_ENV=prod|dev` picks the environment, and a shared task or small wrapper runs
  `fnox exec -P <env>-<service> -- <cmd>`. Secrets never go into the interactive shell.
- Generic parts go in `hq`, written for any org, so they can become a seed module:
  - the policy
  - how agents load a secret
  - the break-glass procedure
  - the pinned fnox install

  Our own parts go in `hq-private`: hosts, accounts, which profile holds what, and the inventory.

**Out of scope for now:** cloud routines (they have no `.hq.env`; they come in with Secrets Manager),
and the maintainer's own logins.

## Plan

### Secrets (first)

- [x] @human Say where the `.hq.env` secrets live now: on the physical MacBook; the virtual dev
  environment has none (2026-11-23)
- [x] @agent Spike: fnox 1.48.0 pinned under the 7-day cooldown, tested with dummy values. Fits; see
  the Log (2026-11-23)
- [x] @human Choose the provider: age, with no Keychain, so it also runs on Linux (2026-11-23)
- [x] @human Make the `prod` key, which needs a passphrase only you know:
  `age-keygen 2>prod.pub | age -p -o prod-key.age` in `~/.config/fnox/`
  (`chmod 700` the folder and `chmod 600` the key) (2026-11-23)
- [x] @agent Make the `dev` key (`dev-key.txt`, no passphrase) and turn on `[audit]` in
  `~/.config/fnox/config.toml` (2026-11-23)
- [ ] @agent Upgrade fnox to 1.50.0 once it clears the cooldown (2026-11-25). Its daemon cache-time
  settings give the lease a fixed cap; in 1.48.0 the agent's own use keeps an idle lease alive
- [ ] @agent Inventory, names only, of every secret or private value an agent or repo uses: the
  diagnostics accounts, `ha-repl` config, MCP server configs, mise `[env]`, `.env.example` files,
  publish tokens (npm, PyPI, AWS) held locally. Goes in `hq-private/projects/mise-environments/inventory.md`,
  each value tagged with a tier
- [x] @pair `~/Projects/.hq.env/fnox.toml`: `prod` and `dev` providers, `[daemon] enabled = true`,
  `idle_timeout = "30m"`, one `prod-*` profile per production service, named as its sandbox profile
  (2026-11-23). `dev-*` profiles follow as dev secrets arrive
- [x] @pair Import from the MacBook through the shared folder (`/Volumes/My Shared Files/Prod2Dev/`)
  with `fnox import -p prod`: 10 production files, 28 keys, piped from the tarball so nothing was
  unpacked to disk (2026-11-23)
- [x] @pair mise entry point: tasks `lease-start`, `lease-end`, `lease-status` and `prod-run` in
  `~/Projects/mise.toml` (2026-11-23). `MISE_ENV` selection moves to "Environments (later)"
- [x] @pair Move the `openobserve` skill to `mise run prod-run openobserve -- python3 oo.py ...`;
  `oo.py` already read the environment, so only its help text and the skill changed (2026-11-23)
- [x] @pair Update `hq-private/reference/diagnostics.md` (secrets section, break-glass lease) and
  `reference/project_tooling.md` to the new loading command (2026-11-23)
- [ ] @pair `policies/secrets.md` in `hq`, written for any org: the tiers, no plaintext, how agents
  load a secret, and break-glass (who turns it on, how long it lasts, what's logged, how it's
  revoked). Only our own values go in `hq-private/reference/diagnostics.md`
- [ ] @human Delete the plaintext copies: `Prod2Dev/openobserve.env`, `Prod2Dev/prod_env.tar`, and in
  time `~/Projects/.hq.env/prod/` on the MacBook (the only remaining originals)
- [ ] @pair Add the systems that have secrets but no row or sandbox profile yet to
  `hq-private/reference/diagnostics.md`: EMQX, LibreNMS, Frigate
- [ ] @pair Package the generic parts as the `secrets` module in `hq-seed`. Its `module.toml` says
  when the module applies (a repo with `.env.example`, or an HQ with production diagnostics). Do
  this once HQ Seed's module formats exist (its Phase 1)

Secrets are done when:
- no plaintext secrets that agents use remain under `~/Projects` or `~/.config`
- every diagnostics task runs through `fnox exec`
- the agent can't get into production unless the maintainer asks
- the generic parts are in `hq` with nothing specific to Rhizomatics in them

### Environments (later)

- [ ] @pair `preview-*` tasks and the home dev SignalK select the `dev` environment through
  `MISE_ENV`, so dev/test needs no extra setup
- [ ] @pair Non-secret per-environment settings (hosts, ports, URLs) in mise env files instead of
  the secret files
- [ ] @pair Add an `aws-sm` provider behind the same profile names once the dev environments of
  [environment separation](env-separation.md) exist; replaces agent-diagnostics' Secrets Manager task
- [ ] @agent Add "environments through mise" to `policies/project_standards.md` once it works in
  two repos

## Decisions

- 2026-11-23 jeyrb: fnox is the first choice for secrets; envforge is dropped. This project is
  active as Phase 1 of [environment separation](env-separation.md).
- 2026-11-23 jeyrb: no Keychain dependence, so it runs on a Linux dev machine too: age keys.
  Break-glass is a passphrase the maintainer types, with a lease time.

## Log

- 2026-11-10: proposed by the maintainer: extend mise to manage environments, starting with
  secrets, on the assumption that fnox can hold the `.hq.env` secrets. fnox docs read; spike is
  the first task.
- 2026-11-23: made active as Phase 1 of environment separation, with fnox as first choice. Folded in
  that project's tasks: the secrets inventory, risk tiers, the generic `policies/secrets.md` and the HQ
  Seed `secrets` module. `~/Projects/.hq.env/` is on the physical MacBook, not in the virtual dev
  environment; the maintainer imports it through the shared folders once fnox is ready. envforge
  uninstalled. Next: the spike.
- 2026-11-23: spike on fnox 1.48.0 (v1.50.0 is too new for the cooldown), installed from
  `~/Projects/mise.toml` with `minimum_release_age = "7d"`. Dummy values in a scratch dir.
  - **Fits:**
    - `-c <path>` loads a config outside any repo, and nothing was written into the repo dir.
    - `.env` import works into age, quotes included.
    - A passphrase-protected age key works: without a terminal, fnox refuses ("could not read
      passphrase from terminal").
    - After a human typed the passphrase, the daemon served the secrets to the agent's `exec`.
      After 45 seconds idle it exited and reads failed again.
    - `exec --redact` hides values in piped output.
  - **Watch:**
    - Whoever can resolve a profile can read its values. `get` and `export` print them, and
      `exec` passes them to any command. That's why the gate has to be the passphrase.
    - `import` refuses Keychain targets.
    - The keychain provider reads only the login keychain, so a separate locking keychain can't
      be the provider.
    - Touch ID (`touch_id = true`) is no use here: this is a virtual Mac, with no Touch ID.
    - 1.48.0's `[daemon]` has only `enabled` and `idle_timeout`; the fixed cache times in the
      docs are newer.
    - Auditing is off by default: turn on `[audit]` in the global config.
  - **Not tried:**
    - `fnox proxy` (placeholder credentials injected per domain), which would let agents call
      production APIs without ever holding the secret. It fits the HTTP services (OpenObserve,
      HA, UniFi) and is worth a look after the first import.
    - `fnox mcp` with a `secrets` allowlist.
- 2026-11-23: set up for real.
  - The maintainer made the `prod` key.
  - The agent made the `dev` key, `~/Projects/.hq.env/fnox.toml` (`prod` and `dev` providers,
    `[daemon] idle_timeout = "30m"`) and the global `[audit]` setting.
  - Imported `openobserve.env` from the shared folder into `prod-openobserve`, with nothing printed.
  - Without the passphrase, the agent's read is refused.
  - Next: a real lease against OpenObserve, then delete the plaintext copy.
- 2026-11-23: first real lease works.
  - The maintainer started the daemon and entered the passphrase.
  - The agent's `fnox exec --redact -- python3 oo.py streams` reached production OpenObserve and
    listed the streams; `oo.py` needed no change, since it already reads `OPENOBSERVE_*` from the
    environment.
  - The audit log recorded each secret read as `cached: true`.
  - **Quirks:**
    - `daemon status` shows `cached_entries: 0` even while it serves the secrets.
    - `--redact` matches values literally, so a short non-secret value (the org ID) also hides a
      stream name with the same text. Set `redact = false` on the URL and org ID, or keep them out of
      the secrets.
- 2026-11-23: imported the rest of production from a tarball: 10 profiles, 28 keys, including five
  services missing from diagnostics.md (`ha-repl`, `signalk`, `frigate`, `librenms`, `emqx`).
  - Profiles take the names of their sandbox profiles (`prod-boat-router`, `prod-boat-signalk`).
  - Added the mise lease tasks.
  - Moved the openobserve skill, diagnostics.md and project_tooling.md over to fnox.
  - **Found:** after `fnox.toml` changed, the open lease's daemon stopped serving the secrets
    without an error (the cause is a guess). `prod-run` now passes `--if-missing error`, so a
    missing lease fails loudly.
