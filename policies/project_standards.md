---
group: general
summary: "The baseline every repo should meet: tooling, cooldowns, shared admin workflows, Dependabot shape."
---

# Project Standards

Expectations of Rhizomatics projects

## All Projects

"All projects" means every repo with any code or markdown, including sites and picoware.

- All tooling will be managed by `mise`
  - Packages not directly supplied by mise will use its [bootstrap packages](https://mise.jdx.dev/bootstrap/packages/) capability
  - `mise bootstrap` used for environment wide settings, operating system packages etc
- All product dependencies by the standard package manager
  - `uv` for Python
    - `.venv` holds a virtual environment for all Python projects
  - `npm` for Node
  - Package managers themselves provisioned by `mise`
  - Licences must be compatibile with Apache 2.0 usage
- `prek` configured and local hooks installed
  - legacy hooks for 'pre-commit' removed
  - No pre-commit.ci: hooks run locally through prek, and the CI workflow runs the linters and
    type checks itself (decided in hq-private#83, 2026-11-08)
  - `fix-spaces` from `sirosen/texthooks` in every repo: it replaces non-breaking and other irregular
    spaces with plain ones. They slip in from pastes and option-space on macOS, break Markdown headings
    and YAML, and look identical in review. A recurring problem across repos (found again in hq, 2026-11-15)
  - `gitleaks` in every repo for secrets scanning
  - `check-yaml` for YAML linting
  - `codespell` for spell check of codes and docs (non-English support TBD)
  - `bandit` for security checks
- Linting configured using standard linters for all code and available config
  - For Python code defer to [Python Stack](./python_stack.md)
  - For JavaScript, `oxfmt` and `oxlint`
  - Linters to be identified for GitHub Actions, shellscript, Dockerfile, C and YAML
- Dependency locks used
  - `uv.lock` for Python
  - `npm.lock` for JavaScript
  - pre-commit checks on locks
- Page views on every website the org publishes (docs sites, the HQ site, www) are counted with
  GoatCounter, cookieless, so no site needs a consent banner. No Google Analytics or other cookie-setting
  trackers. Each website has its own GoatCounter site, recorded as the `goatcounter` of its product's
  `website` artefact in hq's `products.toml` (e.g. `rhizomatics` for www.rhizomatics.org.uk on `homepage`, `rhizomatics-hq` for the HQ site,
  a product's name for its docs site). Count only the public production build, as the boat tech directory's
  `site/src/analytics.mjs` does, so dev servers and builds run elsewhere aren't counted (decided 2026-11-15)
- Every public repo with releases runs OpenSSF Scorecard (`.github/workflows/scorecard.yml`, the same workflow
  in each, weekly and on push to `main`, results published to the Scorecard API). Scores are an input to the
  routine security and alignment reviews only: not shown on the HQ site or in READMEs, since the headline score
  is dragged down by checks a solo-maintainer org can't or won't pass (decided 2026-11-16)
  - Accepted, never raised: Code-Review and Contributors (one maintainer), Branch-Protection above 3 (needs a
    second reviewer), Fuzzing, CII-Best-Practices, and Maintained 0 on a repo under 90 days old (Scorecard's
    rule for new repos, which clears itself)
  - Acted on: Token-Permissions (top-level `permissions: {}` or read-only, writes granted per job),
    Dependency-Update-Tool, SAST, License, Dangerous-Workflow, Pinned-Dependencies, Vulnerabilities, Binary-Artifacts
- README badges
  - Every repo in `products.toml` except `hq`, `.github` and non-public ones shows the "managed by hq" badge,
    linking to the HQ site:
    `[![managed by hq](https://raw.githubusercontent.com/rhizomatics/hq/main/assets/badge-managed-by-hq.svg)](https://hq.rhizomatics.org.uk/)`
  - Sailing projects listed in the boat tech directory also show its badge:
    `[![boat tech directory](https://boat-tech-directory.rhizomatics.org.uk/images/badge.svg)](https://boat-tech-directory.rhizomatics.org.uk)`
- `mise` used for tooling definition and installation plus development tasks
  - Standard tasks
    - `clean` - removes local ephemeral dirs
    - `refresh` - refreshes dependencies, and pulls in changes merged PRs
    - `preview-xxxxx` - run a preview of component, e.g. using docker
    - Use `supernotify` as the model of how to do this
- All auto update processes will follow a cooldown process
  - To include, at least
    - prek
    - dependabot
    - Github Actions workflows
    - mise
    - uv
    - npm
    - apt
  - Cooldown will be applied consistently across all tools, so builds are reproducible across local, pre-commit and CI/release environments
    - Only apply permanent cooldown overrides where it can be applied consistently within local git repo, prek environment and GitHub Actions workflows
  - Standard cooldown is 7 days
    - This may be extended for less trusted packages
    - This may be reduced to 0 for rhizomatics own packages, and to 2 days for trusted packages with strong process and wide usage
    - Trusted at 2 days: Home Assistant (`homeassistant`, `homeassistant-stubs`, `pytest-homeassistant`,
      `pytest-homeassistant-custom-component`), Astral (`uv`, `uv_build`, `ruff`, `ty`, `astral-sh/*` actions)
      and oxc (`oxfmt`, `oxlint`)
      - `homeassistant-stubs` and `pytest-homeassistant-custom-component` are deprecated: drop them here once no
        repo uses them (in November 2026 still supernotify, autoarm and remote_logger)
    - This may temporarily be reduced to 0 for one-off critical events and then restored, for example taking a critical CVE remediation
    - Any other per-package exception is temporary: remove it once the event has passed. A security
      floor belongs in `constraint-dependencies` or `override-dependencies`, not in a cooldown exception
  - Where each cooldown lives:

    | Updater | Where the cooldown lives |
    |---|---|
    | Dependabot | `cooldown: default-days: 7` on each ecosystem |
    | uv | `exclude-newer = "7 days"` in `[tool.uv]`; per-package exceptions in `exclude-newer-package` |
    | npm | shared `.npmrc` (`min-release-age=7`, `@rhizomatics/*` exempt) |
    | prek hooks | `prek autoupdate --cooldown-days 7` in the shared `refresh` task |
    | mise tools | `minimum_release_age = "7d"` under `[settings]` in `mise.toml`; trusted tools as `uv = { version = "latest", minimum_release_age = "2d" }` |

## Shared repo admin

Every production repo uses the shared setup in `rhizomatics/hq` (`admin/`), synced by `admin/sync-admin.sh` (how it works is in [admin/README.md](../admin/README.md)):

- Admin workflows: auto-assign issues and PRs to `jeyrb`, weekly label sync from `admin/labels.yml`,
  dependency review on PRs, and auto-merge of Dependabot PRs touching only trusted deps (astral's
  uv, ruff, ty and `astral-sh/*` actions) once every other check passes. Callers pin the reusable
  workflows to an hq release commit SHA (`@<sha> # v1.0.0`).
- Shared mise file tasks `refresh` and `clean` in `.mise/tasks/`. A repo that needs its own
  version defines it in `mise.toml` instead.
- All repos have code scanning, security scanning and dependency analysis switched on

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

Major projects are the ones with `significance = "major"` in `products.toml` (chosen by downloads and known installs).
They have `design_principles.md` and `roadmap.md` in `docs/developer/design/`, as set out in `design.md`.


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
