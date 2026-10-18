# Project Standards

Expectations of Rhizomatics projects

## All Projects

`pre-commit` configured and local hooks installed
`mise` used for tooling definition and installation

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
  In October 2026 that means 2026.4.0 to 2026.10.x. `hacs.json` `homeassistant` is the oldest release in the window,
  and CI tests the oldest and newest.

## Other Home Assistant standards

- Translation
  - https://developers.home-assistant.io/docs/translations/
    - Exception is use of `lokalise`
  - https://developers.home-assistant.io/docs/internationalization/custom_integration
