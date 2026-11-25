---
title: vaults
summary: environment scoped for vaults for encrypted secrets and private information scoped per dev/test/prod
status: active
lead: infra-lead
owner: jeyrb
programme: env-separation
started: 2026-11-23
---

# Vaults

Hold all secrets (passwords, tokens, API keys etc) and private information (real usernames, IP addresses, local URLs) in environment scoped vaults.

Production vaults can selectively be made available to agents on a `break-glass` basis, where a temporary lease granted by human authority (e.g. password entry, biometrics).
Mise-en-place is defined in [Project Standards](../../policies/project_standards.md) as the one way to build and configure an environment (production, dev, test). 

Secrets are all encrypted at rest, scoped to one command and ready to move to a different vaulting technology, e.g. 
AWS Secrets Manager, without changing how agents ask for them.

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

- fnox's global config, `~/.config/fnox/config.toml`, outside every repo and out of the dotfiles. It
  holds names, providers and ciphertext, with no plaintext values. (First `~/Projects/.hq.env/fnox.toml`,
  moved 2026-11-23.)
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
- [x] @pair mise entry point: tasks `lease-start`, `lease-end`, `lease-status` and `prod-run`, first
  in `~/Projects/mise.toml`, now in the global mise config (2026-11-23). `MISE_ENV` selection moves to "Environments (later)"
- [x] @pair Move the `openobserve` skill to `mise run prod-run openobserve -- python3 oo.py ...`;
  `oo.py` already read the environment, so only its help text and the skill changed (2026-11-23)
- [x] @pair Update `hq-private/reference/diagnostics.md` (secrets section, break-glass lease) and
  `reference/project_tooling.md` to the new loading command (2026-11-23)
- [x] @pair `policies/secrets.md` in `hq`, written for any org, with the policy and its fnox
  implementation in separate sections, so another implementation could meet the same policy
  (2026-11-23)
- [x] @pair Move the mise lease tasks and the fnox pin from `~/Projects/mise.toml` to the global mise
  config in the chezmoi dotfiles, so every machine gets them (2026-11-23)
- [x] @human Apply the dotfiles on the MacBook, then set up `~/.config/fnox/` there (keys and
  `config.toml`) and import its `~/Projects/.hq.env/` files (2026-11-23)
- [x] @human Record the hosts for EMQX, LibreNMS and Frigate; an agent added them and their
  `prod-*` sandbox profiles to hq-private (2026-11-23)
- [x] @human Delete the plaintext copies: `Prod2Dev/openobserve.env`, `Prod2Dev/prod_env.tar`, and in
  time `~/Projects/.hq.env/prod/` on the MacBook (the only remaining originals) (2026-11-23)
- [x] @pair Add EMQX, LibreNMS and Frigate to `hq-private/reference/diagnostics.md` (2026-11-23)
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
  `~/Projects/mise.toml` (since moved to the global mise config) with `minimum_release_age = "7d"`. Dummy values in a scratch dir.
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
- 2026-11-23: remote_logger is the first product repo trialling the lease and `prod-run` (the
  maintainer, in its own session). If it works, that's the second repo after hq, which the
  `project_standards.md` task waits for.
- 2026-11-23: the remote_logger session's prod check passed (HA and OpenObserve), but it found
  three bugs in the lease tasks. All three are confirmed here, with dev-key test profiles and
  `cached` in the audit log:
  1. fnox 1.48.0 runs one daemon per profile set and global flags. `--if-missing` counts;
     `--non-interactive` doesn't; `-P a,b` and `-P a -P b` are the same. So `prod-run`'s
     `--if-missing error` never reached the lease, and a lease on two services didn't serve one.
  2. `daemon stop` without `-P` stops only the default daemon, so `lease-end` didn't revoke.
  3. Every new combination of profiles and flags leaves its own daemon behind.

  Rewrote the tasks:
  - `lease-start` ends any old lease, opens the new one and records its profile set in
    `~/.local/state/fnox/lease-profiles`.
  - `prod-run` reuses exactly that set, with no `--if-missing`. It passes on only its own
    service's keys (`exec --only`), and stops with exit 97 if the first key is empty, so an
    ended lease fails loudly. It also keeps quoted arguments now (`eval set -- $usage_command`).
  - `lease-end` stops every fnox daemon of the user by its own flags, deletes the state file,
    and fails if any daemon is left.
  - `lease-status` lists the daemons.

  Tested end to end: lease, cached reads, an unleased service refused, an ended lease refused,
  and no daemons left afterwards. The earlier "lease stopped after `fnox.toml` changed" may have
  been the config change or these bugs; that's unconfirmed. Check whether 1.50.0 changes how
  daemons are keyed when upgrading.
- 2026-11-23: wrote `policies/secrets.md`, with the policy and its fnox, age and mise implementation
  kept apart.
  - Moved the lease tasks and the fnox pin to the global mise config in the chezmoi dotfiles
    (committed and pushed), and removed `~/Projects/mise.toml`. Re-tested from the global config.
  - That file's `minimum_release_age = "7d"` didn't move: the global config uses `latest` for its
    other tools. fnox is pinned exactly, so it doesn't need it.
  - Added EMQX, LibreNMS and Frigate to diagnostics.md; their hosts still need recording.
- 2026-11-23: moved the secrets from `~/Projects/.hq.env/fnox.toml` into fnox's standard global
  config, `~/.config/fnox/config.toml`, next to the keys and the `[audit]` setting. It stays out of
  chezmoi and is set up by hand where needed (maintainer).
  - `FNOX_SECRETS` now defaults to the global config, and `~/Projects/.hq.env` is removed.
  - The tasks still pass `-c` explicitly. Tested with a temporary dev profile: without it, a
    folder with its own `fnox.toml` loads a different set of configs and missed the lease. With it,
    one daemon served `~`, supernotify and that folder.
- 2026-11-23: MacBook moved over to fnox.
  - The maintainer made its own `prod` key (not shared with virtdevmac). The agent wrote
    `~/.config/fnox/config.toml` and imported the 10 production files: 28 keys, nothing printed.
    `dev/` was skipped: its details wait for the new dev server.
  - Without a lease, reads are refused. Under a `lease-start hass` lease, `prod-run hass` was served
    and `prod-run mqtt` was refused. `lease-end` revoked it, and the audit log recorded reads by name.
    No production system was contacted.
  - The maintainer deleted `~/Projects/.hq.env` and the shared-folder copies: no plaintext originals remain.
