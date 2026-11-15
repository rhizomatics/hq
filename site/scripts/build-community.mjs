#!/usr/bin/env node
// Builds src/data/community.json for the Community page: projects other people have built on the org's
// products, grouped by the product they extend. Kept apart from the org's own usage figures.
//
// Sources, all read-only and public:
//   - repos.toml        `[community.<id>]` entries: projects (repo, author, extends, channel fields) and blogs
//   - GitHub REST API   each project's description, stars, latest release, and downloads of its HACS asset
//   - each blog's RSS feed (<url>/feed)   its title, description and latest posts. Some hosts (Substack) refuse
//     GitHub's build servers, so each feed read is also kept in hq-private/data/community/feeds.json and that
//     copy is used when a fetch fails. `node scripts/build-community.mjs --update-feeds` only refreshes that copy
//     (the daily release digest runs it), exiting 1 if any feed couldn't be read.
// Needs GITHUB_TOKEN (or GH_TOKEN) for the API; without one the page still lists the projects.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { parse as parseToml } from 'smol-toml';
import { gh, ghAll, hqRoot, inBatches, privateRoot, siteRoot, token } from './lib/github.mjs';
import { ORG, USER_AGENT } from '../src/lib/hq-config.mjs';

const outPath = path.join(siteRoot, 'src', 'data', 'community.json');
const feedsPath = path.join(privateRoot, 'data', 'community', 'feeds.json');

async function readFeedCopies() {
  try {
    return JSON.parse(await readFile(feedsPath, 'utf8'));
  } catch {
    return {};
  }
}

async function details(entry) {
  const info = await gh(`repos/${entry.repo}`);
  if (!info || info.private) return null;
  const releases = await ghAll(`repos/${entry.repo}/releases`);
  const latest = releases.find((r) => !r.draft && !r.prerelease);
  const hacsDownloads = entry.hacs_zip
    ? releases.flatMap((r) => r.assets).filter((a) => a.name === entry.hacs_zip).reduce((n, a) => n + a.download_count, 0)
    : null;
  return {
    description: info.description,
    stars: info.stargazers_count,
    license: info.license?.spdx_id ?? null,
    archived: info.archived,
    latestRelease: latest ? { tag: latest.tag_name, date: latest.published_at, url: latest.html_url } : null,
    hacsDownloads,
  };
}

// A blog's title, description and latest posts from its RSS feed; null if the feed can't be read.
async function blogFeed(url) {
  // Identify as a feed reader, with a link back, as feed readers do; some hosts refuse unnamed clients.
  const headers = { 'User-Agent': `${USER_AGENT} feed reader (+${ORG.siteUrl}/community/)`, Accept: 'application/rss+xml, application/xml;q=0.9' };
  const res = await fetch(`${url.replace(/\/$/, '')}/feed`, { headers, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  const text = (tag, s) => {
    const m = s.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`));
    if (!m) return null;
    const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'" };
    return m[1].trim().replace(/&(amp|lt|gt|quot|apos|#39);/g, (_, e) => entities[e]);
  };
  const [channel, ...items] = xml.split('<item>');
  return {
    title: text('title', channel),
    description: text('description', channel),
    posts: items.slice(0, 3).map((i) => ({ title: text('title', i), url: text('link', i), date: new Date(text('pubDate', i)).toISOString() })),
  };
}

// Each blog's feed, live where it can be read, otherwise the last copy kept. Fresh reads update `copies`.
async function blogs(entries, notes, copies) {
  return Promise.all(
    entries.map(async (e) => {
      // posts: null means the feed couldn't be read, as distinct from a feed with no posts.
      const base = { id: e.id, url: e.url, author: e.author, note: e.note ?? null, title: e.title ?? e.id, description: null, posts: null, asOf: null };
      try {
        const feed = await blogFeed(e.url);
        copies[e.id] = { ...feed, fetchedAt: new Date().toISOString() };
        return { ...base, ...feed, title: e.title ?? feed.title ?? e.id };
      } catch (err) {
        const copy = copies[e.id];
        if (copy) return { ...base, description: copy.description, posts: copy.posts, asOf: copy.fetchedAt };
        notes.push(`${e.id}: feed unavailable (${err.message}) and no saved copy.`);
        return base;
      }
    }),
  );
}

async function saveFeedCopies(copies) {
  await mkdir(path.dirname(feedsPath), { recursive: true });
  await writeFile(feedsPath, `${JSON.stringify(copies, null, 1)}\n`);
}

async function main() {
  const registry = parseToml(await readFile(path.join(hqRoot, 'repos.toml'), 'utf8'));
  const org = registry.org.github;
  const all = Object.entries(registry.community ?? {}).map(([id, e]) => ({ id, ...e }));
  const blogEntries = all.filter((e) => e.kind === 'blog');
  const copies = await readFeedCopies();

  if (process.argv.includes('--update-feeds')) {
    const before = JSON.stringify(copies);
    const failed = [];
    for (const e of blogEntries) {
      try {
        copies[e.id] = { ...(await blogFeed(e.url)), fetchedAt: new Date().toISOString() };
      } catch (err) {
        failed.push(`${e.id} (${err.message})`);
      }
    }
    if (JSON.stringify(copies) !== before) await saveFeedCopies(copies);
    console.log(`feeds: ${blogEntries.length - failed.length} of ${blogEntries.length} read${failed.length ? `; failed: ${failed.join(', ')}` : ''}`);
    process.exit(failed.length ? 1 : 0);
  }
  const entries = all.filter((e) => (e.kind ?? 'project') === 'project');
  const notes = [];
  if (!token && entries.length) notes.push('No GitHub token at the last build, so stars and releases are missing.');

  const projects = (
    await inBatches(entries, async (e) => {
      const base = {
        id: e.id,
        name: e.repo.split('/')[1],
        url: `https://github.com/${e.repo}`,
        author: e.author,
        authorUrl: `https://github.com/${e.author}`,
        extends: e.extends,
      };
      if (!token) return base;
      try {
        const d = await details(e);
        if (d === null) {
          notes.push(`${e.id}: not public or not found, so left out.`);
          return null;
        }
        return { ...base, ...d };
      } catch (err) {
        notes.push(`${e.id}: details unavailable (${err.message}).`);
        return base;
      }
    })
  ).filter(Boolean);

  const products = [...new Set(projects.map((p) => p.extends))].sort().map((id) => ({
    id,
    url: `https://github.com/${org}/${id}`,
    projects: projects.filter((p) => p.extends === id).sort((a, b) => a.name.localeCompare(b.name)),
  }));
  await mkdir(path.dirname(outPath), { recursive: true });
  const blogList = await blogs(blogEntries, notes, copies);
  await writeFile(outPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), notes, products, blogs: blogList })}\n`);
  console.log(`community: ${projects.length} projects for ${products.length} products, ${blogList.length} blogs${notes.length ? `; ${notes.length} gaps` : ''}`);
  for (const n of notes) console.warn(`  ${n}`);
}

await main();
