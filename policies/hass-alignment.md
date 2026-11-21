---
group: python
summary: "Home Assistant components as exemplary citizens: Quality Scale, UI configuration, new features within the month."
---

# Home Assistant Alignment

Home Assistant custom components will be exemplary citizens of the community. 

Components will be regularly checked against the Quality Scale , with aspirations towards the highest level, and the results checked in. The potential will be kept open for possible migration from Marketplace to Core.

This extends to documentation standards.

## No YAML configuration

Everything configurable is UI-driven (config flow). YAML is kept only for power-user content that is naturally text and round-trips with the UI. 

Exceptions: Supernotify scenarios/deliveries; AutoArm rules engine.

## New HA Features

New features and other changes introduced in monthly Home Assistant releases will be supported within the month, without prejudicing ongoing support for older versions.

## Translations

Custom components don't use `strings.json`: it's for core integrations only
([translations](https://contributors.home-assistant.io/core/integrations/translations/)).

## Platform changes

Platform changes still to act on (Marketplace, the Contributors site, deprecated test and type packages) are tracked in `reference/hass_platform_changes.md`, picked up by the platform and alignment reviews.

## Marketplace Confidence

Use whatever measures available to reassure Marketplace users of the robustness, quality and safety of the products.

For example,

- Meeting the Home Assistant Quality Scale
- Shields on the readme for code coverage, security scanning etc
- Clean reports from security checks like HA Security Sandbox, Marketplace Guard and HA Barkley

## References

- [Quality Scale](https://www.home-assistant.io/docs/quality_scale/)
