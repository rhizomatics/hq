# mkdocs Decom

`mkdocs` has gone off in a strange direction.

It seems that `zensical` may be the best long term replacement, however too early to move all projects as it doesn't have full support for all mkdocs features and plugins.

## In Flight

- Trailblazer projects using Zensical that are brand new and have fewer demands
- Migrate all other mkdocs projects to `properdocs` with `materialx` as the theme, so there are no moribund projects

## Other Documentation

Non-python projects will continue to use `astro` and `starlight`
to avoid complicating dependencies.

## Log

- 2026-10-23 — project-review: audit done. Every docs repo with a docs config (anpr2mqtt, appliance_autonotify, autoarm, homeassistant-repl, remote_logger, signalk-cli, supernotify, updates2mqtt) has `properdocs.yml`, none has `mkdocs.yml`; remote_logger dropped its mkdocs refs on 2026-10-16. No Zensical trailblazer yet. Migration half looks complete (plugin packages keep their `mkdocs-` names, which is expected).
- 2026-10-30 — project-review: moved to done. Migration to properdocs/materialx is finished across all docs repos; "Zensical for new projects" is a standing rule, now `policies/docs_toolchain.md`, not a project.
