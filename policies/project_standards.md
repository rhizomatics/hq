# Project Standards

Expectations of Rhizomatics projects

## All Projects

"All projects" means every repo with any code or markdown, including sites and picoware.

- `prek` configured and local hooks installed
  - legacy hooks for 'pre-commit' removed
  - No pre-commit.ci: hooks run locally through prek, and the CI workflow runs the linters and
    type checks itself (decided in hq-private#83, 2026-11-08)
- `mise` used for tooling definition and installation plus development tasks
  - Standard tasks
    - `clean` - removes local ephemeral dirs
    - `refresh` - refreshes dependencies, and pulls in changes merged PRs
    - `preview-xxxxx` - run a preview of component, e.g. using docker
    - Use `supernotify` as the model of how to do this
- All auto update processes will follow a cooldown process
  - For example, `prek autoupdate --cooldown-days` and similar for uv and npm
  - Standard cooldown is 7 days
  - This may be extended for less trusted packages
  - This may be reduced to 0 for rhizomatics own packages, and to 2 days for trusted packages with strong process and wide usage
    - Trusted at 2 days: Home Assistant (`homeassistant`, `homeassistant-stubs`, `pytest-homeassistant`,
      `pytest-homeassistant-custom-component`) and Astral (`uv`, `uv_build`, `ruff`, `ty`, `astral-sh/*` actions)
  - This may temporarily be reduced to 0 for one-off critical events and then restored, for example taking a critical CVE remediation
    - Any other per-package exception is temporary: remove it once the event has passed. A security
      floor belongs in `constraint-dependencies` or `override-dependencies`, not in a cooldown exception
  - The cooldown covers mise tools too
  - Only apply permanent cooldown overrides where it can be applied consistently within local git repo, prek environment and GitHub Actions workflows
  - Where each cooldown lives:

    | Updater | Where the cooldown lives |
    |---|---|
    | Dependabot | `cooldown: default-days: 7` on each ecosystem |
    | uv | `exclude-newer = "7 days"` in `[tool.uv]`; per-package exceptions in `exclude-newer-package` |
    | npm | shared `.npmrc` (`min-release-age=7`, `@rhizomatics/*` exempt) |
    | prek hooks | `prek autoupdate --cooldown-days 7` in the shared `refresh` task |
    | mise tools | `minimum_release_age = "7d"` under `[settings]` in `mise.toml`; trusted tools as `uv = { version = "latest", minimum_release_age = "2d" }` |

## Shared repo admin

Every production repo uses the shared setup in `rhizomatics/.github`, synced by its
`scripts/sync-admin.sh` (how it works is in that repo's `templates/README.md`):

- Admin workflows: auto-assign issues and PRs to `jeyrb`, weekly label sync from `labels.yml`,
  dependency review on PRs, and auto-merge of Dependabot PRs touching only trusted deps (astral's
  uv, ruff, ty and `astral-sh/*` actions) once every other check passes. Callers pin the reusable
  workflows to a release commit SHA.
- Shared mise file tasks `refresh` and `clean` in `.mise/tasks/`. A repo that needs its own
  version defines it in `mise.toml` instead.

## Dependabot

`dependabot.yml` can't be shared, so each repo has its own with a common shape per ecosystem:

- **Version updates** on the 1st and 15th of the month, with the 7-day cooldown. Minor and patch
  bumps are grouped into one PR per ecosystem; majors come separately.
- **astral** group (uv, ruff, ty, `astral-sh/*` actions) in the Python and Actions ecosystems, so
  trusted updates arrive in their own PR and can be auto-merged. Keep it in step with the
  auto-merge workflow's `TRUSTED` list.
- **Security updates** are raised as soon as an alert opens, grouped into one PR per ecosystem.
- Home Assistant integrations only update direct pip deps, since homeassistant pins their
  transitive deps. The same `allow` rule keeps security PRs to direct deps too.
- Floors stay put: see "Dependency floors" below.
- Versions of project tools will be kept consistent across local repo tooling and Github Actions workflows, as other dependencies

## Claude Code settings

- `.claude/settings.local.json` is gitignored. Accumulated "always allow" permissions go there and
  stay on the maintainer's machine.
- `.claude/settings.json` is committed only for deliberate, project-wide items: hooks, and
  optionally the repo's own dev commands (`npm run *`, `uv run pytest *`, ...). No local paths,
  one-off commands or broad rules like `git add *`, `pip install *` or `python3 -c *`; project
  permissions apply to every contributor who opens Claude Code in a clone.
- Don't gitignore all of `.claude/`: that also blocks shared skills, agents and `CLAUDE.md`.

## Python Projects

Standard tools - `ruff`,`mypy`,`ty`,`uv`

Python versions supported by PyPI packages: see `policies/python_versions.md`.

## Dependency floors

Minimum versions (`>=` lower bounds, `requires-python`, `hacs.json` `homeassistant`) are a support
decision, raised deliberately by a maintainer, never by a bot. `dependabot.yml` sets
`versioning-strategy: increase-if-necessary` for pip, uv and npm, so Dependabot updates lock files
and leaves the floors alone.

## Node Projects

Standard tools - `npm`,`oxfmt`,`oxlint`

## Major Projects

A `developer` docs directory with `principles.md` and `roadmap.md`

(Considered 'major' based on number of downloads and known installs)


## Home Assistant Projects

- Quality Scale assessed and maintained
- Rolling 6 months of Home Assistant compatibility maintained, including where the underlying Python version changes.
  In November 2026 that means 2026.5.0 to 2026.11.x. `hacs.json` `homeassistant` is the oldest release in the window,
  and CI tests the oldest and newest.

## Other Home Assistant standards

- Translation
  - https://contributors.home-assistant.io/translate/
    - Exception is use of `lokalise`
  - https://contributors.home-assistant.io/core/integrations/translations/
