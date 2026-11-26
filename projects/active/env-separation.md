---
title: Provision fully segregated development and test environments
summary: Keep development and test apart from personal production machines, against supply chain attacks
status: draft
lead: infra-lead
infra: security, infra
owner: jeyrb
started: 2026-11-23
---
# Environment Separation

## Summary

Increasing supply chain attacks make it essential to keep development and production environments separate, especially personal prod environments such as laptops that have access to mail, passwords, financial and health details etc.

## Depends On

- [AWS Account Segregation](aws-migration.md)

## Environments

### Production

Scope
- Developer's personal main laptop
- Self-hosted home servers
- Home network appliances
- Other home appliances and devices
- LAN and associated Wifi networks

Activities
- Raising issues on GitHub and approving PRs
  - Issues are preferred feedback for beta and own env problems, using built-in diagnostics where available, to dogfood the user experience
- Approving `npmjs` staged builds
  - These will use a passkey or h/w token

### Development

Scope
- Developer laptop, physical or virtual
  - Virtual MacOS environment on laptop can't be fully segregated since only one Wifi supported at a time
- Dedicated development Linux server
- Dedicated LAN and Wifi
- On-demand ephemeral sandboxes
- Longer running "dirty" servers for things like Home Assistant or SignalK
- Pre-defined clean enviroments, for integration testing HA/SignalK plugins or UI review
- UAT type clones of production environments with external secrets redacted


### Credentials

No unencrypted secrets in any environment.
- [fnox](https://fnox.jdx.dev) through mise used to access them
"Break Glass" access for limited access to production environments
- Manual intervention to enable agent access
- Read only accounts
- Use for debugging Home Assistant or SignalK issues, via UI, API or tools like ha-repl / signalk-cli

## Phases

### Phase 1: Secrets

Delivered by [mise environments](vaults.md), with fnox; its plan has the tasks.

Goals:
- Replace all `.env` files holding secrets or private info, like URLs, with encrypted stores, and likewise for config files
- Support a 'break-glass' process for access to home production for debugging and beta analysis
  - Needs a step only a human can do: fnox runs as the same user as the agent, so it can't be the boundary
- All secrets are encrypted, encryption key is either a manual secret or keychain protected
  - None of the secrets should end up in public repos, however it is not a serious risk if they are
- Minimal overhead per repo
  - Small number of profiles supporting all the products that might want HA, OpenObserve, MQTT, AWS, SignalK etc
  - Segregate by risk, anything involving ability to run up costs (misuse of AWS keys) or access to personal info (iCloud access is critical level)
- Generic parts become an [HQ Seed](hq-seed.md) module (`secrets`) once proven

This phase keeps secrets off disk in plaintext, but the laptop is still in both Production and
Development. A malicious dependency running as the maintainer can still ask the unlocked Keychain.
The next phases, dev on separate machines, close that gap.

### Later phases

Not planned yet: the dedicated dev server and network, sandboxes and clean test environments, and
production clones with external secrets redacted. These depend on the AWS migration.

## Decisions

- 2026-11-23 jeyrb: fnox over envforge for secrets; Phase 1 is run as the
  [mise environments](vaults.md) project.

## Log

- 2026-11-23: reviewed the project and drafted a Phase 1 plan. The maintainer chose fnox and dropped
  envforge. The plan moved into mise environments, now active. The output becomes an HQ Seed module
  once proven.
