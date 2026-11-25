---
summary: A blog on the HQ site, on open source maintenance and agentic product management, that also boosts the Home Assistant and sailing substacks
productline: org
---

# HQ Blog

Start a blog from within HQ: posts on open source issues and on agentic product management, written from running
Rhizomatics with an HQ, and a way to boost the two existing substacks,
[Home Tech Projects](https://automatedhome.substack.com) (Home Assistant) and
[Boat Tech Projects](https://automatedboat.substack.com) (sailing), already listed in `community.toml`.

## Shape (proposed)

- **Where:** `/blog/` on the HQ site, with an RSS feed (the [starlight-blog](https://github.com/HiDeoo/starlight-blog)
  plugin gives posts, tags, authors and a feed to a Starlight site). Posts are markdown in `blog/` in this repo,
  published by `sync-content.mjs` like the other docs, so the same privacy checks apply.
- **What it covers:** HQ's own subjects (open source maintenance, agentic product management, how an HQ runs),
  the ones that don't belong on either substack. Product how-tos for a general audience stay with the
  [Media](media.md) project's channels.
- **Boosting the substacks:** their latest posts already come in by RSS for the Community page; the blog index
  can show them beside HQ's own posts, and a blog post can point to a substack post instead of repeating it.
  Optionally, link posts announced on the products' own channels (release notes, discussions).
- **Who writes:** the maintainer's voice. The marketing persona can propose subjects from what processes find
  (a recurring support theme, a release worth a story, a platform change), and draft; nothing is published
  without the maintainer's edit and approval, as with forum replies.

## Questions

- Byline and voice: the maintainer by name, or "Rhizomatics"?
- Comments: none, or GitHub Discussions on `hq` (giscus)?
- Cross-posting: HQ posts also go to a substack (with the HQ post as the canonical one), or stay on HQ only?
- Should www.rhizomatics.org.uk link to it, or carry it instead of HQ?

## Tasks

- [ ] @human Answer the questions above
- [ ] @pair Add starlight-blog to the site, `blog/` in hq, the RSS feed, and the substacks' latest posts on the
      blog index; a first post (e.g. how Rhizomatics is run with an HQ) to check the shape
- [ ] @pair Marketing persona: a monthly list of post ideas from process findings, drafted on request (a skill or a
      section of an existing marketing process)

## Related

- [Media](media.md): Substack, YouTube and podcast channels for product material aimed at a general audience.
- The Community page lists the substacks today ("Blogs").

## Log

- 2026-11-25: Proposed by the maintainer.
