// robots.txt: everything is public; points crawlers at the sitemap Starlight generates.
import { ORG } from '../lib/hq-config.mjs';

export function GET() {
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${ORG.siteUrl}/sitemap-index.xml\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
