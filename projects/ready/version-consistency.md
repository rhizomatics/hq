---
title: Version consistency check
summary: A shared prek hook keeps every repo's version files in step with each other and its release tags
status: draft
lead: infra-lead
owner: jeyrb
started: 2026-11-22
---

## Goal

A release can't go out with a version file that says something else, and a version can't fall behind the
last release unnoticed. One shared prek hook, from hq, checks the version files each repo has
(`custom_components/*/manifest.json`, a static `version` in `pyproject.toml`, `package.json`) agree with each
other and are at or ahead of the latest release tag, and the release workflow checks the tag matches them exactly.

## Context

Today only two checks exist, both at release time: `github-release.yml` fails a tag with no `CHANGELOG.md`
section, and the npm `publish` job checks the tag against `package.json`. Nothing checks a HACS `manifest.json`
or a `pyproject.toml`, and nothing runs before the tag. Survey of local checkouts, 2026-11-22:

| Repo | Version files | Latest tag | Changelog | |
|---|---|---|---|---|
| camera_autonotify | manifest `1.0.0b1`, pyproject dynamic | `v1.0.0-beta8` | `# 1.0.0` | **behind the tag** |
| homeassistant-repl | manifest `0.15.0`, pyproject `0.15.0` | `v0.15.0` | `# 0.15.0` | two to keep in step |
| supernotify | manifest `2.19.0`, `package.json` with no version (tooling only) | `v2.19.0` | `# v2.19.0` | skip versionless `package.json` |
| updates2mqtt | pyproject `1.19.1` | `v1.19.1-beta1` | `# 1.19.1` | ahead of a beta tag: fine |
| other HA repos | manifest, pyproject dynamic (read from manifest) | match | match | |
| signalk plugins, hq-stats | `package.json` | match | match | |
| picoware, boat-tech-directory, hq | none | | | nothing to check |

Version forms differ: HA manifests and Python use PEP 440 (`1.0.0b1`), tags and npm use semver (`v1.0.0-beta8`).
The check compares them as versions, treating `bN`/`-betaN`, `aN`/`-alphaN` and `rcN`/`-rc.N` as the same.

## The check

At commit, when a version file or `CHANGELOG.md` changes:

1. Every version file the repo has gives the same version `V`. A `pyproject.toml` with a dynamic version, a
   `package.json` with no version or marked `private` with none, and `version = "0"` placeholders are skipped.
2. `V` is not behind the highest release tag `T` (`v*`). `V == T` is a released version with nothing bumped yet;
   `V > T` is a bump under way. No tags, or no version files, passes.
3. Where `V > T`, `CHANGELOG.md` has a heading for `V`, in any of the forms `github-release.yml` accepts, so the
   release can't later fail for want of notes. Repos with no `CHANGELOG.md` skip this.

At release, `github-release.yml` also fails a tag that isn't exactly `V`, before creating anything, alongside its
changelog check. Every repo gets that through `sync-admin.sh` with no hook needed.

## Plan

- [ ] @human Decide where the hook lives (see **Decisions**)
- [ ] @pair Write the hook: stdlib Python 3.11+ (`tomllib`, `json`, `git` for tags), no dependencies, with tests
  for the version forms and each repo shape above; `.pre-commit-hooks.yaml` with `files` limited to the version
  files and `CHANGELOG.md`, `pass_filenames: false`
- [ ] @pair Add the exact-tag check to `admin/templates/workflows-optional/github-release.yml`, then
  `sync-admin.sh`
- [ ] @human Release hq so the hook has a tag to pin
- [ ] @pair camera_autonotify first: fix its drift, then add the hook
- [ ] @pair Remaining repos with version files, opportunistically as each is next touched (as `docs-png-hook.md`)
- [ ] @agent Add the hook to `policies/project_standards.md` (All Projects, prek) and move this to `done/`

## Decisions

- Open: the hook in hq (`admin/hooks/`, pinned as `repo: https://github.com/rhizomatics/hq` at a release, as the
  reusable workflows already are) or a small repo of its own. hq is "no product code", but already holds the shared
  admin scripts and workflows; a separate repo would version the hook apart from hq's docs churn. Proposed: hq.

## Log

- 2026-11-22: proposed from appliance_autonotify, asking for manifest.json to be checked against the changelog;
  widened to every version file and to the release tags, as other repos need it. Survey above.
