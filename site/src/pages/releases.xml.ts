// RSS feed of the Releases page: the same releases and summaries, newest first.
import releases from '../data/releases.json';
import { ORG } from '../lib/hq-config.mjs';

type Release = { key: string; repo: string; tag: string; date: string; url: string; kind: string; summary: string };

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function GET() {
  const page = `${ORG.siteUrl}/releases/`;
  const items = (releases.releases as Release[])
    .map((r) => {
      const title = `${r.repo} ${r.tag}${r.kind === 'critical-fix' ? ' (important fix)' : ''}`;
      return [
        '    <item>',
        `      <title>${esc(title)}</title>`,
        `      <link>${esc(r.url)}</link>`,
        `      <guid isPermaLink="false">${esc(r.key)}</guid>`,
        `      <pubDate>${new Date(r.date).toUTCString()}</pubDate>`,
        `      <category>${esc(r.repo)}</category>`,
        `      <description>${esc(r.summary)}</description>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(`${ORG.name} releases`)}</title>
    <link>${esc(page)}</link>
    <atom:link href="${esc(`${ORG.siteUrl}/releases.xml`)}" rel="self" type="application/rss+xml" />
    <description>${esc(`New features and important fixes in ${ORG.name} products, summarised. Maintenance releases are left out.`)}</description>
    <language>en</language>
    <lastBuildDate>${new Date(releases.generatedAt).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
