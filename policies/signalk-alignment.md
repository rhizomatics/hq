# SignalK Alignment

Plugins will be exemplary citizens of the `npm` and `SignalK` ecosystems.

Plugins will be in typescript.

Plugins will be automatically tested across a 6 month rolling version range (see `signalk_versions.md`).

## npm Releases

Scope: All SignalK plugins (`family = "signalk-plugin"` in `repos.toml`)

Every npm release is staged by CI and made live by a maintainer. No npm token exists anywhere.

- A `release.yml` workflow, triggered by a published GitHub release, stages the package with
  `npm stage publish --provenance --access public --tag <dist-tag>`
  - Runs in a GitHub environment named `npm`, with `id-token: write` on the publish job only
  - Installs `npm@latest` (staging needs npm 11.15.0 or later)
  - Fails if the release tag isn't `v` + the `package.json` version, then runs lint, format check and tests
- The dist-tag comes from the release tag, matching the SignalK server and its plugins:

  | Release tag contains | dist-tag |
  |---|---|
  | `alpha` | `alpha` |
  | `beta` | `beta` |
  | `rc` | `rc` |
  | none of these, release marked pre-release on GitHub | `next` |
  | none of these | `latest` |

  npm refuses a prerelease version (e.g. `1.2.0-beta.1`) without an explicit dist-tag, so a
  pre-release must match one of the first four rows.
- On npmjs.com, the package's trusted publisher is GitHub Actions with the exact org, repo,
  workflow filename and environment `npm`, and allows **stage publish only**. Each staged version
  goes live when the maintainer approves it (Staged Packages tab, or `npm stage approve <id>`,
  both needing 2FA). Approving is a human step: CI can't do it.
- The first version of a new package has to be published by hand before a trusted publisher can
  be configured.

### Gotchas

- Don't set `registry-url` on `actions/setup-node`. It writes an `.npmrc` with
  `_authToken=${NODE_AUTH_TOKEN}`, and npm sent that empty token instead of using OIDC (`E401`).
- `E404` on the publish request usually means the trusted publisher doesn't match the workflow,
  most often a missing or misspelt environment name. npm doesn't check the settings when saved.
- `E403 OIDC permission denied for this action` means the command isn't allowed by the trusted
  publisher, e.g. plain `npm publish` against a stage-only publisher.
- A newly saved trusted publisher expires if nothing is published through it within 2 days.

Reference implementation: `signalk-ble-sensors-plugin` `.github/workflows/release.yml`.

## Bluetooth Low Energy (BLE) Usage

- All plugins will support the SignalK BLE API and Manager
- All BLE using plugins will be able to use and test BLE Manager.
- As BLE Manager improves, it will be the default for all BLE interaction
- Eventually, perhaps, non-BLE Manager access will be removed.
