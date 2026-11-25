// @ts-check
import starlight from '@astrojs/starlight';
import hqStats from '@rhizomatics/hq-stats/astro';
import { usageSidebar } from '@rhizomatics/hq-stats/sidebar';
import { defineConfig } from 'astro/config';
import { ORG, analyticsHead, githubUrl } from './src/lib/hq-config.mjs';
import { policies, policyGroups } from './scripts/lib/hq-docs.mjs';

// Usage pages from @rhizomatics/hq-stats: hq.toml's [stats] says where the snapshots and stats.json are.
const stats = { config: '..' };

// Policies: the list and how it works, then each policy under its `group:`, as on the list page.
async function policiesSidebar() {
  const list = await policies(new URL('..', import.meta.url).pathname);
  const groups = policyGroups(list).map(({ label, items }) => ({
    label,
    items: items.map((p) => ({ slug: p.rel.replace(/\.md$/, '').toLowerCase() })),
  }));
  return [{ label: 'All policies', link: '/policies/' }, { label: 'How it works', link: '/policies/how-it-works/' }, ...groups];
}

export default defineConfig({
  site: ORG.siteUrl,
  trailingSlash: 'always',
  redirects: { '/actions/': '/deployments/' },
  integrations: [
    starlight({
      title: `${ORG.name} HQ`,
      description: `How the ${ORG.name} open source projects are run, and how much they are used.`,
      logo: { src: './src/assets/icon.svg' },
      favicon: '/favicon.svg',
      head: [
        { tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '128x128', href: '/favicon.png' } },
        { tag: 'link', attrs: { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' } },
        { tag: 'meta', attrs: { property: 'og:image', content: `${ORG.siteUrl}/og.png` } },
        // Lets feed readers find the releases feed from any page.
        { tag: 'link', attrs: { rel: 'alternate', type: 'application/rss+xml', title: `${ORG.name} releases`, href: '/releases.xml' } },
        ...analyticsHead(),
      ],
      social: [{ icon: 'github', label: 'GitHub', href: githubUrl(ORG.hqRepo) }],
      customCss: ['./src/styles/site.css'],
      lastUpdated: false,
      sidebar: [
        { label: 'Releases', link: '/releases/' },
        { label: 'Usage', items: usageSidebar(stats) },
        { label: 'Community', link: '/community/' },
        { label: 'Design Process', items: [{ label: 'Overview', link: '/design/' }, { label: 'RFCs', link: '/rfcs/' }] },
        {
          label: 'Operations',
          items: [
            { label: 'Support', link: '/support/' },
            { label: 'Deployments', link: '/deployments/' },
            { label: 'Security', link: '/security/' },
          ],
        },
        { label: 'Projects', collapsed: true, items: [{ autogenerate: { directory: 'projects' } }] },
        { label: 'Processes', collapsed: true, items: [{ autogenerate: { directory: 'processes' } }] },
        { label: 'Policies', collapsed: true, items: await policiesSidebar() },
        { label: 'Reference', collapsed: true, items: [{ autogenerate: { directory: 'reference' } }] },
        { label: 'Team', link: '/team/' },
        { label: 'Reports', collapsed: true, items: [{ autogenerate: { directory: 'reports' } }] },
      ],
    }),
    hqStats(stats),
  ],
});
