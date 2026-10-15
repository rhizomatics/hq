# Project Alignment

Reduce unncessary variation across the stack, and adopt successful packages, techniques etc across the products.

This is always within the limitations of the underlying platform, and its imports, so 2nd best may be preferred if it minimizes the stack.

## Examples

- Config standardization on Pydantic and phase out Omegaconf
- Possibly niquests for http, phasing out requests and httpx
   - Probably not on Home Assistant custom components
- Github Actions
  - Shared suite of admin workflows and configs
  - Common names for workflows (`ci`) and internal config
- See also
  - [Project Tooling](../reference/project_tooling.md)
  - [Project Standards](../reference/project_standards.md)