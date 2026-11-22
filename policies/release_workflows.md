---
group: general
summary: "Workflow patterns for immutable releases to HA Marketplace, PyPI, OCI and npm: tag-driven, hash-pinned, least privilege, zizmor-clean."
---

# Release workflows

How the rules in [Build](./build.md) and [Release](./release.md) are applied in GitHub Actions, so every repo
releases the same way and passes `zizmor` (`admin-zizmor.yml`) without findings. Four kinds of artefact:
Home Assistant Marketplace (HACS) zips, PyPI packages, OCI images on GHCR and npm packages. A repo that
releases more than one kind follows each pattern. Decided in hq-private#136 (2026-11), after zizmor's first
findings.

## Releasing

1. Write the version's notes in `CHANGELOG.md`, in the Release Notes Format, and merge them with the release's
   other changes. The heading is the version: `# 1.2.3`, `# v1.2.3`, `## [1.2.3]` or `## 1.2.3 - 2026-11-22` all
   work. A pre-release can have its own heading (`# 1.2.3-beta1`) or use the one of the version it leads to.
2. Tag and push: `git tag v1.2.3 && git push origin v1.2.3`. That's all.

The tag starts the release workflow(s). Each re-runs CI on the tag, builds and attests the artefacts, then
the shared `github-release.yml` creates a draft release with the notes (the CHANGELOG section followed by
GitHub's generated notes), attaches the files and publishes it, and finally the registry gets the same
files. A version with a suffix (`-beta1`, `-rc.1`) is published as a pre-release, goes to TestPyPI rather than
PyPI and to the matching npm dist-tag, and never moves the `latest` release or a floating image tag.

Releases are no longer drafted in the GitHub UI: a release published there is immutable at once, so nothing
can be attached to it. If a run fails, fix the cause and re-run the failed jobs; a draft left behind is picked
up and finished. A tag whose changelog section is missing fails before anything is created: add the notes,
move the tag (`git tag -f`, `git push -f origin <tag>`) and push again.

## Every workflow

| Rule | How | zizmor audit |
|---|---|---|
| No default token permissions | `permissions: {}` at the top; each job lists what it needs, with a comment for any `write` | `excessive-permissions` |
| Write access only where nothing untrusted runs | A job holding `contents: write`, `packages: write` or a publishing `id-token` runs no PR code and as few third-party actions as possible; building, testing and publishing are separate jobs | `excessive-permissions` |
| Every `uses:` pinned by commit hash | `owner/action@<40-char sha> # v1.2.3`, the comment naming the exact tag so Dependabot updates both. Includes reusable workflows (`SignalK/signalk-server/...plugin-ci.yml@<sha>`) and GitHub's own actions. An action with no releases (`hassfest`, `hacs/action`) is pinned with no comment rather than a branch name | `unpinned-uses`, `ref-version-mismatch` |
| No credentials left in the checkout | `actions/checkout` always with `persist-credentials: false`. A job that pushes gives the token to that one git command, as `GIT_CONFIG_*` environment variables (homeassistant-repl's `publish` job) | `artipacked` |
| No expressions in shell | Pass every `${{ }}` that isn't a literal written in the workflow (`inputs`, `github.event`, step outputs, `secrets`) into `run:` through `env:`, and quote it (`"$TAG"`). A `matrix` value listed in the workflow may stay inline | `template-injection` |
| No caches where artefacts are built for release | `enable-cache: false` (setup-uv), `package-manager-cache: false` (setup-node), no `cache:` (setup-python) in any job of a release workflow | `cache-poisoning` |
| Tools at exact versions | `npm install -g npm@11.21.2`, never `@latest`; bumped by hand under the usual cooldown. zizmor flags any global install, pinned or not, so the pinned line carries an inline ignore | `adhoc-packages` |
| No `pull_request_target` or `workflow_run` | Chain workflows with `workflow_call` within a run, or `gh workflow run` from a job holding only `actions: write`. The one exception is hq's `admin-auto-assign.yml`, ignored inline | `dangerous-triggers` |

Exceptions are rare and go inline, on the flagged line, as `# zizmor: ignore[<audit>] <reason>`. The shared
`.github/zizmor.yml` (from `admin/templates/zizmor.yml`) only turns off `self-repository`, a style audit that
prefers GitHub's new `$/` syntax for local reusable workflows, until `$/` is confirmed to work for them.

CI workflows are read-only, so a release can call them: badges and docs that push to the repo are published by
a workflow of their own (updates2mqtt's and homeassistant-repl's `docs.yml`, the HACS repos' `deploy.yml`), which
runs the tests again for its figures.

## The release skeleton

Every release workflow has these jobs, in this order:

```yaml
on:
  push:
    tags: ["v*"]

permissions: {}

jobs:
  ci:            # the repo's CI workflow, called with workflow_call: lint, format, type check, test
    uses: ./.github/workflows/ci.yml
    permissions:
      contents: read
  build:         # needs: ci. contents: read, id-token + attestations: write.
                 # Builds from the tag, attests build provenance, uploads the files as artifact `release`
  github-release:
    needs: build
    permissions:
      contents: write
    uses: ./.github/workflows/github-release.yml
    with:
      artifact: release
  publish:       # needs: github-release. The registry's trusted publishing (id-token: write) in an
                 # environment, from the files already attested and attached - never rebuilt
```

`github-release.yml` is the same in every repo (`admin/templates/workflows-optional/`, kept in step by
`sync-admin.sh`). It is a local reusable workflow, not one called from hq, so a release never depends on an hq
tag. CI is called rather than its result looked up, because the tag is usually pushed while main's own run is
still going.

Trusted publishers (PyPI, npm) name the workflow file and environment that may publish. Changing either is
a registry setting only the maintainer can change, so existing file names stay as they are even where they
don't match the `release-xxxx` naming in Build.

## Home Assistant Marketplace

HACS installs the zip named by `hacs.json` (`zip_release`) from the release, so the zip must be attached
before the release is published.

- `build`: zip `custom_components/<domain>` (excluding `__pycache__`), with a `.sha256` beside it, attest both.
- `publish`: none, as HACS reads the GitHub release itself. A repo with versioned docs (supernotify) deploys them
  after `github-release`, by calling its docs workflow with the tag.

## PyPI

- `build`: `uv build`, so the wheel and sdist are attested and attached to the release.
- `publish`: download the `release` artifact and publish the `.whl` and `.tar.gz` with
  `pypa/gh-action-pypi-publish`: environment `pypi` for a release, `testpypi` (with `skip-existing`) for a
  pre-release, chosen by `github-release.yml`'s `prerelease` output.
- Where PyPI's trusted publisher names `pypi-publish.yml`, that file is the tag-triggered release workflow. In a
  repo that also releases a zip (homeassistant-repl), `release.yml` publishes the GitHub release and then
  starts `pypi-publish.yml` with `gh workflow run`, from a job holding only `actions: write`.

## OCI images (GHCR)

`docker-publish.yml`, on the tag, alongside the PyPI release workflow:

- `ci`, then build for `linux/amd64,linux/arm64` with SBOM, push, sign with cosign (keyless) and attest.
- A version tag (`1.2.3`) is pushed once and never again: the run fails if it already exists. A rebuild of a
  published release, for base image or apt fixes, is a new revision `1.2.3-r1` and moves only the floating tags.
- Floating tags (`1.2`, `release`) move only for a release, never for a pre-release.
- The scan of the image just published is started by the last job, `gh workflow run image-scan.yml`, from a job
  holding only `actions: write`, not by a `workflow_run` trigger on `image-scan.yml`. (It can't be called with
  `workflow_call`: the scan workflow's rebuild job needs `actions: write`, which the caller would then have to
  grant.) The weekly scheduled scan starts a rebuild the same way, `gh workflow run docker-publish.yml -f
  release_tag=...`; a scan started after a publish never rebuilds, so the two can't loop.

## npm

The npm trusted publisher is stage-only, so each release waits for approval on npmjs.com (Release policy:
"Staged Releases for NPM with manual approval").

- `build`: `npm ci --ignore-scripts`, lint, format check and tests, with `package-manager-cache: false`.
  SignalK plugins run this in place of calling `signalk-ci.yml`, whose upstream matrix is slow and needs no
  release-time repeat.
- `publish`: environment `npm`, `id-token: write`; installs the pinned npm, checks the tag matches
  `package.json`, and runs `npm stage publish --provenance --access public --tag <dist-tag>`, the dist-tag
  following SignalK's convention (`alpha`, `beta` or `rc` from the version, `next` for other pre-releases,
  otherwise `latest`).

## Docs sites and other workflows

GitHub Pages deploys follow the same split: the build job has `contents: read`, the deploy job alone has
`pages: write` and `id-token: write`. Scorecard is the shared `scorecard.yml` (also in
`workflows-optional`), as its results can only be published from a workflow in the repo itself.
