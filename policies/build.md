# Build Policies

## Automated Build

- All projects will use GitHub Actions for automated build and release
  - A `ci` workflow that runs on every push and PR
    - Workflow will lint, auto-format and test the code
  - A `ci-ok` step that is used to gate deployment workflows
  - All actions MUST be pinned by immutable tags or commit hashes
  - A `release` workflow (`release.yml`) that builds and publishes the artefact
    - Only where a project releases more than one kind of artefact (e.g. a Docker image and a
      PyPI library) use one `release-xxxx` workflow per artefact, where `xxxx` refers to the type
      of artefact


- GitHub security will be used for code scanning and dependency analysis
- All container image builds will be scanned weekly
  - If there are critical or high CVEs resolved by either an updated base image, or `apt` dependencies layered on the image then a new image will be built and released. Manual action is required if the updated dependencies both resolve and introduce vulnerabilities
