---
summary: A product catalogue on the site, each product a home for its downloads, page views, RFCs and reports
---

# HQ Product Catalogue

Products are only indirectly referred to, in the context of downloads, releases etc

Add a "Product Catalogue" to the home page.

Each Product is its own home, with the downloads, page views, RFCs, reports etc plus links out to roadmap and design principles.

HQ juggles several views - a product-centric one, a product-line-centric one (e.g. "SignalK Plugins"), an organizational view and a set of horizontal views, such as security that cross all of them.

This could mean much duplication, although in practice some information has a natural home. 

For Downloads and Page Views, this is a marketing horizontal that has an organization wide view, with drill down to products for the details, with products listed in their product lines.

This also needs Product and Product Line properly defined, including how represented in the repos.toml

## Related

- [HQ Seed](hq-seed.md) needs the definitions of product and product line too: its `repos.toml` skeleton is the
  schema every HQ inherits, so they should be settled before the seed's first release.
- What's there today: `family` (a key of `[families]`) gives each repo its heading on the site, its hq issue area,
  and in effect its platform (Home Assistant, SignalK, MQTT, Command line, Picoware, Sites, Organisation); `upstream`
  names the platform it runs inside; `category` marks `major`, `experimental`, `internal` and `meta`. Families are
  the nearest thing to product lines, but mix in issue areas and platforms. A product line such as "SignalK
  plugins" or a product with its companions (e.g. a Home Assistant integration and its card) may not map one to one.
