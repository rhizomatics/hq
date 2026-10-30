# Docs toolchain

Scope: Python projects (Home Assistant components, updates2mqtt, CLIs).

- Documentation uses `properdocs` with the `materialx` theme. No `mkdocs.yml`.
- New projects with simple needs may use `zensical` as a trailblazer, until it supports the plugins the other projects rely on.
- Non-Python projects use `astro` with `starlight`, to avoid adding dependencies.

Exceptions: plugin packages keep their `mkdocs-` names.

Background: the migration project is in `projects/done/mkdocs_decom.md`.
