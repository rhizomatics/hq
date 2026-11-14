# Home Assistant platform changes to act on

Moved from `policies/hass-alignment.md` (policy review, hq-private#110): these are work to do, not policy.
The ecosystem review adds to this list and the alignment review spreads the fixes; remove an item once every
repo has caught up.

- Support the HA change to the new Contributors site by updating URLs that point to the old developer or data sites
- HACS moving into Home Assistant as Marketplace (project: `projects/ha_marketplace.md`)
  - https://github.com/home-assistant/home-assistant.io/blob/7896394058b9b9576692cf990cbb36dcfbef1c8a/source/_integrations/marketplace.markdown
- `homeassistant-stubs` is deprecated, since HA now ships its own types (still used by supernotify, autoarm and
  remote_logger in November 2026)
- `pytest-homeassistant-custom-component` is deprecated in favour of HA's own `pytest-homeassistant` from HA 2026.11
  (still used by supernotify and remote_logger in November 2026)
