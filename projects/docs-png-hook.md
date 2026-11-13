---
title: Docs PNGs compressed at commit
status: active
lead: infra-lead
owner: jeyrb
started: 2026-11-11
---

## Goal

No docs build needs `pngquant`. Docs PNGs are compressed once, by a prek hook as they're committed, instead of by
the `optimize` plugin on every CI build, which needs `sudo apt-get install pngquant` and so breaks the build
whenever the Ubuntu package mirrors are down, as on 2026-11-11.

**Opportunistic**: each repo gets it the next time it's touched for a release anyway, as part of that work. No PRs
for this alone, and no chasing repos that aren't otherwise changing.

## The change, per repo

As done in camera_autonotify (the first, 2026-11-11):

1. Add `docgen/optimize_png.py`, copied from camera_autonotify. It runs pngquant with the `optimize` plugin's own
   settings (`--force --skip-if-larger --speed 3 --strip`), in place, and treats "left alone" (exit 98/99) as
   success, so committing an already compressed PNG changes nothing.
2. Add the hook to `.pre-commit-config.yaml`, scoped to `docs/` so brand icons Home Assistant shows aren't
   recompressed:
   ```yaml
   - repo: local
     hooks:
       - id: optimize-png
         name: optimize PNGs
         entry: python docgen/optimize_png.py
         language: python
         additional_dependencies: [pngquant-cli==3.0.3]
         types: [png]
         files: ^docs/
   ```
   `pngquant-cli` ships prebuilt pngquant binaries (macOS, Linux x86_64, Windows), so neither Homebrew nor apt is
   needed.
3. Run it once over the existing images (`prek run optimize-png --all-files`) and commit them.
4. Remove `- optimize` from `properdocs.yml`, `sudo apt-get install pngquant` from the docs workflow, and the
   `pngquant` package from the `docs` dependency group if it's there (a Python wrapper nothing uses).
5. Check `properdocs build` works with no pngquant on `PATH`.

## Plan

- [x] @pair camera_autonotify (2026-11-11), pending its first green CI run
- [ ] @pair anpr2mqtt
- [ ] @pair appliance_autonotify
- [ ] @pair autoarm
- [ ] @pair remote_logger
- [ ] @pair supernotify
- [ ] @pair updates2mqtt
- [ ] @pair signalk-cli
- [ ] @pair homeassistant-repl: only step 4's `apt-get` line, since it installs pngquant without using `optimize`
- [ ] @agent Once two repos are done and green, add the rule to `policies/docs_toolchain.md` and `project_standards.md`,
  so new repos start this way, then move this project to `done/`

## Decisions

- 2026-11-11 jeyrb: opportunistic, done as each repo is next touched and released, not for its own sake.

## Log

- 2026-11-11: started from camera_autonotify's docs build failing on the Ubuntu mirrors. Its four docs PNGs went
  from 35.7 KB to 15.0 KB, the same as the `optimize` plugin made them in the built site, and a second hook run
  changes nothing. Survey of local checkouts: 7 repos use `optimize` and install pngquant in CI, and
  homeassistant-repl installs it without using it.
