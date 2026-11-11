# Home Assistant Alignment

Home Assistant custom components will be exemplary citizens of the community. 

Components will be regularly checked against the Quality Scale , with aspirations towards the highest level, and the results checked in. The potential will be kept open for possible migration from Marketplace to Core.

This extends to documentation standards.

## No YAML configuration

Everything configurable is UI-driven (config flow). YAML is kept only for power-user content that is naturally text and round-trips with the UI. 

Exceptions: Supernotify scenarios/deliveries; AutoArm rules engine.

## New HA Features

New features and other changes introduced in monthly Home Assistant releases will be supported within the month, without prejudicing ongoing support for older versions.

## Known Issues & Possible Work

- Do not use strings.json for custom components.
  - Source: https://contributors.home-assistant.io/core/integrations/translations/
- Support the HA change to new Contributors site by updating URLs to previous developer or data sites
- HACS moving into Home Assistant as Marketplace
  - https://github.com/home-assistant/home-assistant.io/blob/7896394058b9b9576692cf990cbb36dcfbef1c8a/source/_integrations/marketplace.markdown
- `homeassistant-stubs` is deprecated since HA now has its own types
- `pytest-homeassistant-custom-component` now deprecated in favour of HA owned `pytest-homeassistant` from HA 2026.11


## References

- [Quality Scale](https://www.home-assistant.io/docs/quality_scale/)
