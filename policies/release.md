---
group: general
summary: Immutable, semantically versioned releases with notes in a standard format.
---

# Release

- All releases will be immutable, except in `experimental` products (`lifecycle` in `products.toml`)
  - GitHub's immutable releases setting covers every release in a repo, so it may be switched off briefly to
    publish a beta and then switched back on
- Release notes will be in Release Note Format as below, and will also have the GitHub auto generated release notes (PRs plus diff link)
  - Written in the repo's `CHANGELOG.md` under the version's heading, and copied into the release by the
    release workflow, followed by the generated notes. Never written in the GitHub UI
- Semantic Versions used for all releases
  - `-betaN` suffix for pre-release except where overridden by conventions, e.g. for NPM or SignalK
- All releases made by Github Actions, started by pushing a version tag (see
  [Release workflows](./release_workflows.md))
  - Gated on successful build, test, lint and format
  - Staged Releases for NPM with manual approval
  - Pre-release Python packages released to test pypi

## Release Notes Format

```markdown
---
title: What's New
---

# X.X.X
## 🚨 Breaking changes
## ⚠️ Deprecated
## ✨ Enhancements
## 🐞 Bug Fixes
## 📚 Documentation
## 📝 Other changes
```