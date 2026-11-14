# Release

- All releases for non-beta projects will be immutable
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