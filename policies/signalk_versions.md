# SignalK Versions

Scope: All SignalK plugins (`family = "signalk-plugin"` in `repos.toml`)

## Policy - SignalK Server

Support a rolling 6 months of `signalk-server` releases.
  - Ideally this would be a year, but `signalk-server` is changing fast
  - The oldest supported release is the one that was current 6 months ago, i.e. the latest
    non-prerelease published on or before that date
  - Plugins must work on every release from the oldest supported to the latest
    - Don't use server APIs added after the oldest supported release, unless the plugin checks
      for them at runtime and degrades gracefully
  - Declare the floor in `package.json` as `"engines": { "signalk-server": ">=X.Y.Z" }`
  - Example
    - On 2026-10-21 the window starts 2026-04-21
    - `v2.25.0` (2026-04-19) was current then, so supported range is `v2.25.0` to `v2.34.0`

## Policy - Node

The minimum Node version is the `engines.node` of the oldest supported `signalk-server` release.
  - Set `engines.node` in every plugin's `package.json` to exactly that range
  - When the window moves past a `signalk-server` release that raised its Node minimum, raise the
    plugins' `engines.node` to match. Never set it lower than the server's.
  - CI `node-version` uses that minimum major
  - Always use the latest point release within a major version
  - Example
    - `signalk-server` `v2.25.0` declares `"node": ">=22"`, so plugins declare `"node": ">=22"`

## Checking

Find the oldest supported release with
`gh api "repos/SignalK/signalk-server/releases?per_page=60"` (skip prereleases), then read its Node
minimum from `package.json` at that tag:
`gh api "repos/SignalK/signalk-server/contents/package.json?ref=<tag>"`.
