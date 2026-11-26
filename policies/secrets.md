---
group: general
summary: No plaintext secrets; agents reach production only through a short lease a human opens.
---

# Secrets

Scope: secrets that agents and local tooling use on maintainers' machines (agent accounts on production
and dev/test systems, publish and cloud tokens held locally), and private details such as internal hosts and
URLs. Not CI secrets (GitHub Actions secrets) or cloud routines, which have none locally. Not the
maintainers' own logins, which stay in their password manager.

## Policy

The rules come first. Any implementation that meets them will do; the one in use is described after them.

1. **No plaintext at rest.** Secrets are encrypted wherever they are stored: never in a repo, an env
   file, a config file, shell history or a backup in the clear. Private, non-secret details (internal hosts,
   URLs) are treated the same, so they can't leak into public repos.
2. **Tiers, by the damage a leak does.**

   | Tier | Holds | Who can use it |
   |---|---|---|
   | dev | dev/test services, seed data | agents, unattended |
   | production | read-only agent accounts on production systems | agents, only under a lease (rule 4) |
   | cost | anything that can spend money or publish: cloud keys, package registry tokens | agents, only under a lease; prefer short-lived credentials |
   | critical | personal accounts: email, cloud storage, banking, the password manager | never reachable by an agent, by any route |
3. **Least privilege.** Agents use dedicated accounts, read-only unless a task needs more. They never
   use a maintainer's own login. Each command gets only the secrets of the one service it uses.
4. **Production is break-glass.** An agent can reach a production or cost secret only during a lease:
   - **a human step** opens it, one an agent can't perform: a passphrase only the human knows, or a
     hardware key;
   - **scoped** to the services named when it's opened;
   - **time-limited**: it ends on its own after a set time or idle period;
   - **revocable** at once by one command, which ends every open lease;
   - **logged**: every read is recorded by secret name, never by value.
5. **Agents handle values blind.** Agents pass secrets to the one command that needs them, through its
   environment. They never print, copy, store or paste values, and command output is redacted. An agent
   may add a secret without being able to read it back.
6. **Two gates for production.** Reaching a production system needs both the lease and a network grant
   (the agent sandbox's production profile for that system). Each is given for the task and taken away
   after.
7. **Environments stay apart.** Dev secrets never grant production access. Production secrets reach a
   development machine only encrypted, and only a lease makes them readable there.
8. **Trusted, pinned tooling.** The secrets tool is the most valuable thing to compromise. Use a tool
   from a publisher already trusted for the toolchain, pinned to an exact version that has passed the
   supply-chain cooldown (`project_standards.md`), never `latest`.
9. **Portable.** The same setup works on every machine the maintainers develop on, macOS and Linux,
   so it can't depend on one operating system's keystore or biometrics.

A lease is a trusted window, not a sandbox. While one is open, any process of that user can read its
secrets, so keep leases short and scoped. Encryption protects secrets at rest and from unattended use. It
doesn't stop malicious code that runs as the maintainer during a lease. Only keeping development off
production machines does that.

### Exceptions

- Tools with their own token store that can't take secrets from the environment (a CLI's config file,
  MCP server OAuth tokens, a browser profile signed in to production UIs) stay where the tool expects
  them. Each is listed with its system in the private diagnostics reference, and agents use it only on
  the same production-by-exception terms.
- Seed data for disposable dev/test environments (e.g. preview users) can live in the repo in plain text,
  since it guards nothing real.

## Implementation: fnox, age and mise

How HQ meets the policy today. Another tool could replace this part without changing the policy;
see the end of this section.

| Rule | How |
|---|---|
| 1. No plaintext | [fnox](https://fnox.jdx.dev) stores every secret as [age](https://age-encryption.org) ciphertext in fnox's global config, `~/.config/fnox/config.toml`, outside every repo. It's set up by hand on each machine that needs it and kept out of dotfile sync |
| 2. Tiers | one fnox profile per environment and service (`dev-signalk`, `prod-hass`). Two age keys in `~/.config/fnox/` (mode 600): `dev-key.txt`, no passphrase, for `dev-*`; `prod-key.age`, passphrase-protected, for production and cost. The critical tier is never added |
| 3. Least privilege | a command gets one profile's keys only (`fnox exec --only`) |
| 4. Break-glass | mise tasks (below). The passphrase is the human step: without a terminal, fnox can't ask for it and refuses. The lease is the fnox daemon's in-memory cache. Each value expires 30 minutes after its last read or 4 hours after the passphrase was entered, whichever comes first (`cache_ttl` and `max_cache_ttl` on the prod provider), or at `lease-end`. Reads are logged by name in `~/.local/state/fnox/audit.log` (`[audit] enabled = true` in the global `~/.config/fnox/config.toml`) |
| 5. Blind handling | `prod-run` passes values through the environment and redacts them from output (`exec --redact`). `fnox import -p <key>` encrypts to a public key, so an agent can add secrets it can't read |
| 6. Two gates | `prod-<service>` profile names match the sandbox profiles, so one name grants both |
| 7. Apart | production profiles are encrypted to the prod key only |
| 8. Pinned | fnox comes from the author of mise, already the standard tool manager. It's pinned to an exact version in the global mise config |
| 9. Portable | age keys in files, no macOS Keychain or Touch ID: the same on a macOS VM, a Linux dev server or a laptop |

**Tasks**, in the global mise config so every machine has them:

```bash
mise run lease-start hass openobserve   # the maintainer, in their own terminal: asks for the passphrase
mise run prod-run hass -- <command>     # an agent, while the lease is open
mise run lease-status                   # open or not, running daemons, recent reads (names only)
mise run lease-end                      # ends every lease at once
```

- `lease-start` refuses without a terminal, so an agent can't open a lease. It ends any earlier lease
  first and records the profile set it opened.
- `prod-run` reuses exactly that set, passes only the named service's keys, and fails loudly when the
  lease has ended or doesn't cover the service.
- `lease-end` stops every fnox daemon of the user, each with the fnox binary that started it (so a lease opened
  before an upgrade still ends), and checks the process has gone.
- Dev secrets need no lease: `fnox -c ~/.config/fnox/config.toml -P dev-<service> exec -- <command>`.
- Every call passes `-c` with the global config's path, even though fnox loads it anyway: in a repo
  with its own `fnox.toml`, fnox would otherwise load a different set of configs and miss the lease.

**Adding secrets:** pipe the env file into fnox, e.g. from an archive straight off a shared folder, so
nothing is unpacked or printed:
`tar -xOf prod.tar prod/<service>.env | fnox -c <config> -P prod-<service> import -p prod --force`.
Then delete the plaintext source.

**Known limits** (fnox 1.50.0):
- **Only the tasks reach the lease.** fnox runs a separate daemon for each profile set and
  `--if-missing` value, so a hand-written `fnox exec` misses the lease and leaves an empty daemon behind.
- **No hardware key.** The passphrase is the human step; fnox's `fido2` and `yubikey` providers could
  replace it where a hardware key is available.
- Changing the config while a lease is open ends it: fnox resolves the values again, which needs the passphrase.
- **Upgrading fnox:** end every lease first. A release can change the daemon protocol (1.50.0 did), and a
  newer client can't use an older daemon's lease.

**Other implementations of the same policy** include:
- a password manager's CLI with per-use approval (1Password with biometric unlock);
- Vault or a cloud secret manager with short-lived tokens issued on human approval;
- sops with a hardware-backed key.

Each would need the same mapping against the rules above, especially the human step (rule 4) and
portability (rule 9).
