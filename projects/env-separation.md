---
title: Provision fully segregated development and test environments
summary: Keep development and test apart from personal production machines, against supply chain attacks
---
# Environment Separation

## Summary

Increasing supply chain attacks make it essential to keep development and production environments separate, especially personal prod environments such as laptops that have access to mail, passwords, financial and health details etc.

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
- `envforge` or a similar tool used to access
"Break Glass" access for limited access to production environments
- Manual intervention to enable agent access
- Read only accounts
- Use for debugging Home Assistant or SignalK issues, via UI, API or tools like ha-repl / signalk-cli