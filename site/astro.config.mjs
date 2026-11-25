// @ts-check
import starlight from '@astrojs/starlight';
import hqStats from '@rhizomatics/hq-stats/astro';
import { usageSidebar } from '@rhizomatics/hq-stats/sidebar';
import { defineConfig } from 'astro/config';
import { LINES, ORG, PRODUCTS, analyticsHead, githubUrl, isProduct } from './src/lib/hq-config.mjs';
import { COLLAPSED_GROUPS, PROJECT_GROUPS, policies, policyGroups, projects } from './scripts/lib/hq-docs.mjs';

// Usage pages from @rhizomatics/hq-stats: hq.toml's [stats] says where the snapshots and stats.json are.
const stats = { config: '..' };

const projectList = await projects(new URL('..', import.meta.url).pathname);
const projectPage = (p) => p.rel.replace(/\.md$/, '').toLowerCase();

// A project's page moves with it from folder to folder (proposed, ready, active, done...): its URL under every
// other status folder, and at the top of projects/ where active ones once were, redirects to where it is now.
function projectRedirects() {
  return Object.fromEntries(
    projectList.flatMap((p) => {
      const name = p.slug.toLowerCase();
      const here = `/${projectPage(p)}/`;
      const olds = [`/projects/${name}/`, `/projects/queued/${name}/`, ...PROJECT_GROUPS.map(([dir]) => `/projects/${dir}/${name}/`)];
      return [...new Set(olds)].filter((u) => u !== here).map((u) => [u, here]);
    }),
  );
}

// Products: the catalogue, then each product line that has products, linking to its section of the catalogue.
function productsSidebar() {
  const lines = LINES.filter(([line]) => PRODUCTS.some((p) => p.line === line && isProduct(p)));
  return [{ label: 'All products', link: '/products/' }, ...lines.map(([line, label]) => ({ label, link: `/products/#${line}` }))];
}

// Projects: the list and how it works, then each status group with its name capitalised; done and shelved folded.
function projectsSidebar() {
  const groups = PROJECT_GROUPS.map(([dir, label]) => ({
    label,
    collapsed: COLLAPSED_GROUPS.includes(dir),
    items: projectList
      .filter((p) => p.dir === dir)
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((p) => ({ label: p.title, slug: projectPage(p) })),
  })).filter((g) => g.items.length);
  return [{ label: 'All projects', link: '/projects/' }, { label: 'How it works', link: '/projects/how-it-works/' }, ...groups];
}

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
  redirects: {
    '/actions/': '/deployments/',
    ...projectRedirects(),
  },
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
        { label: 'Products', items: productsSidebar() },
        { label: 'Releases', link: '/releases/' },
        // Usage without hq-stats' per-line groups of products: those are under Products, and each product's page
        // links to its usage.
        { label: 'Usage', items: usageSidebar(stats).filter((item) => !item.items) },
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
        { label: 'Projects', collapsed: true, items: projectsSidebar() },
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
