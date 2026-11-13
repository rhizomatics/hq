# HQ As Product

Make `hq` available as a product itself

  - `homeassistant` and `signalk` become modules within it
    - Module contains policies like arch alignment, and also info on how to gather stats
    - Modules like `python` and `node` cover pypi and npm usage, stats gathering etc. `signalk` would depened on `node` and likewise for `homeassistant` and `python`
  - Extract as a public template (personas, skills, processes, scripts) with no data; `hq` itself stays
    private because it holds unfixed security findings and personal infrastructure details
  - Possibly split into
    - `hq-skill` or `hq-template` - the commodified shared skill
    - `hq-private` - reports, and sensitive config
    - `hq` - the public facing site, also housing the web front end
      - S3 buckets also considered for the public facing site and private generated reports, however don't do this unless GitHub repo can't cope
- YAML config ( so support traditional scripted automation too)
 including location f hq-private
- `hq-private` optional for entirely public implementations 
- `hq.rhizomatics.org.uk` has two competing uses
  - HQ for rhizomatics
  - Product documentation for HQ
  - Prefer a separate domain for product documentation, e.g. `hq-templatez` repo based 