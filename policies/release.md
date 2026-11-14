# Release

- All releases will be immutable, except in `experimental` projects (`repos.toml`)
  - GitHub's immutable releases setting covers every release in a repo, so it may be switched off briefly to
    publish a beta and then switched back on
- Release notes will be in Release Note Format as below, and will also have the GitHub auto generated release notes (PRs plus diff link)
- Semantic Versions used for all releases
  - `-betaN` suffix for pre-release except where overridden by conventions, e.g. for NPM or SignalK
- All releases made by Github Actions
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