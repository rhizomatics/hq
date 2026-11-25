#!/usr/bin/env node
// Builds src/data/community.json for the Community page: the blogs about the org's products. The projects other
// people have built on them, with their figures, come from @rhizomatics/hq-stats (collected daily into
// data/stats/, shown at /usage/community/ and read from stats.json by the Community page).
//
// Sources, all read-only and public:
//   - community.toml    entries with kind = "blog"
//   - each blog's RSS feed (<url>/feed)   its title, description and latest posts. Some hosts (Substack) refuse
//     GitHub's build servers, so each feed read is also kept in hq-private/data/community/feeds.json and that
//     copy is used when a fetch fails. `node scripts/build-community.mjs --update-feeds` only refreshes that copy
//     (the daily release digest runs it), exiting 1 if any feed couldn't be read.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { privateRoot, siteRoot, writeJson } from './lib/github.mjs';
import { CONFIG, ORG, USER_AGENT } from '../src/lib/hq-config.mjs';

const outPath = path.join(siteRoot, 'src', 'data', 'community.json');
const feedsPath = path.join(privateRoot, 'data', 'community', 'feeds.json');

async function readFeedCopies() {
  try {
    return JSON.parse(await readFile(feedsPath, 'utf8'));
  } catch {
    return {};
  }
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
  await writeJson(feedsPath, copies, 1);
}

async function main() {
  const blogEntries = CONFIG.community.filter((e) => e.kind === 'blog');
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
  const notes = [];
  const blogList = await blogs(blogEntries, notes, copies);
  await writeJson(outPath, { generatedAt: new Date().toISOString(), notes, blogs: blogList });
  console.log(`community: ${blogList.length} blogs${notes.length ? `; ${notes.length} gaps` : ''}`);
  for (const n of notes) console.warn(`  ${n}`);
}

await main();
