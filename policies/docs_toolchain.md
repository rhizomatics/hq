---
group: general
summary: properdocs with the materialx theme for Python projects; Astro Starlight for the rest.
---

# Documentation Toolchain

Projects may use Static Site Generators to build efficient web sites on Github Pages.

## Simple Projects

A Markdown formatted `README.md` and `CHANGELOG.md` may be sufficient.

## Python Projects

- Documentation uses `properdocs` with the `materialx` theme. No `mkdocs.yml`.
- New projects with simple needs may use `zensical` as a trailblazer, until it supports the plugins the other projects rely on.
- Docs images are compressed once, when committed, by the `optimize-png` prek hook (`docgen/optimize_png.py`,
  as in camera_autonotify), not by the `optimize` plugin on every build. No docs build installs `pngquant`:
  the hook gets prebuilt binaries from `pngquant-cli`, so a build doesn't fail when the Ubuntu package mirrors
  are down. Existing repos move over the next time they're released (projects/ongoing/docs-png-hook.md).

## JavaScript Projects

- Use `astro` with `starlight`, to avoid adding dependencies.

## Other Projects

`astro` or `properdocs` may be used, with preference for `astro` to minimize dependency chain.

## References

Background: the migration project is in `projects/done/mkdocs_decom.md`.
