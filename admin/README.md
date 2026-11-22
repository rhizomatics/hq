# Repo admin workflows

Shared GitHub admin automation for rhizomatics repos. Moved here from the `.github` repo, which now holds only the main website and the org-wide profile and SECURITY.md.

| Caller (in each repo) | Reusable workflow (in `.github/workflows/`) | What it does |
|---|---|---|
| `admin-auto-assign.yml` | `reusable-auto-assign.yml` | Assigns new/reopened issues and PRs (including fork PRs) to `jeyrb` |
| `admin-labels.yml` | `reusable-labels.yml` | Weekly sync of [`labels.yml`](labels.yml) into the repo; repo-only labels are kept |
| `admin-dependency-review.yml` | `reusable-dependency-review.yml` | Flags known-vulnerable dependencies on PRs, commenting only when it fails |
| `admin-dependabot-automerge.yml` | `reusable-dependabot-automerge.yml` | Squash-merges Dependabot PRs touching only trusted deps (`TRUSTED` regex) once every other check passes |
| `admin-zizmor.yml` | `reusable-zizmor.yml` | Audits the repo's Actions workflows with [zizmor](https://docs.zizmor.sh) on push, PRs and weekly; findings go to code scanning (public repos) for `/security-escalation` |

Alongside the callers, `sync-admin.sh` keeps three more files in step
([policies/release_workflows.md](../policies/release_workflows.md) says how they're used):

| File (in each repo) | Template | Copied to |
|---|---|---|
| `.github/zizmor.yml` | `templates/zizmor.yml` | every repo; turns off zizmor's style-only `self-repository` audit |
| `.github/workflows/github-release.yml` | `templates/workflows-optional/` | repos that already have it; the release workflow calls it to publish the GitHub release with its notes and files |
| `.github/workflows/scorecard.yml` | `templates/workflows-optional/` | repos that already have it (Scorecard can't publish results from a reusable workflow) |

A new repo copies the optional workflows in once by hand; from then on `sync-admin.sh` updates them.

Callers pin the reusable workflows to a release tag's commit SHA (`@<sha> # 1.0.0`), so a
change to a reusable workflow reaches a repo only when its pin moves. To release one, tag this
repo (immutable release), update the pins in `admin/templates/workflows/`, and run `sync-admin.sh`;
Dependabot also proposes the bump in each repo. `labels.yml` is still read from `main` at run
time, so label changes take effect everywhere on the next run.

## Adding or updating repos

```sh
admin/sync-admin.sh --check   # list rhizomatics repos under ~/Projects that are out of date
admin/sync-admin.sh           # copy callers in, remove the per-repo workflows they replace
```

Then commit in each repo.

A repo that shouldn't get a template lists its file name in `.github/admin-skip`, one per line (`#`
comments allowed); `sync-admin.sh` then leaves it out and removes it if present. Example: hq-private
skips `admin-dependency-review.yml` (a private repo without GitHub Advanced Security can't run it)
and `admin-dependabot-automerge.yml` (no Dependabot there).

## Shared mise tasks

`sync-admin.sh` copies [mise file tasks](https://mise.jdx.dev/tasks/file-tasks.html) into each
repo's `.mise/tasks/`, replacing the old `refresh-deps.sh` (which it removes):

| Repos | Task | What it does |
|---|---|---|
| Python (`uv.lock`) | `mise run refresh` | Upgrades mise tools, pulls bot PRs, re-locks and syncs with `uv`, runs `prek autoupdate --cooldown-days 7` |
| Python (`uv.lock`) | `mise run clean` | Removes build, test and lint caches and recreates an empty `.venv` |
| Node (`package-lock.json`) | `mise run refresh` | Pulls bot PRs, runs `prek autoupdate --cooldown-days 7`, upgrades mise tools, runs `npm update` |
| Node (`package-lock.json`) | `.npmrc` (not a task) | `min-release-age=7`, so `npm install`/`npm update` skip versions under 7 days old; `@rhizomatics/*` is exempt |

The Python `refresh` hides the user-level `~/.config/uv/uv.toml` from `uv` (`XDG_CONFIG_HOME=/dev/null`)
so personal settings never reach a committed `uv.lock`, while the project's own `[tool.uv]` still applies.

A file task shadows a `mise.toml` task of the same name, so a repo that needs its own version
(supernotify's `clean` also tears down its Docker preview) defines it in `mise.toml`, and
`sync-admin.sh` then leaves the shared one out.

## Standards

The rules these templates implement (cooldowns, the Dependabot shape, dependency floors, `prek`
over `pre-commit`) are kept in
[`policies/project_standards.md`](https://github.com/rhizomatics/hq/blob/main/policies/project_standards.md)
in `rhizomatics/hq`. This file only covers how the shared files work.

`dependabot.yml` can't be shared, so each repo keeps its own (the Home Assistant starting point is
`templates/hass-github/dependabot.yml`). When you change one, keep its `astral` group in step with
`TRUSTED` in `reusable-dependabot-automerge.yml`.
