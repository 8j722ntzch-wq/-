import type { APIRoute } from 'astro';
import { indexingEnabled } from '../data/search';

export const GET: APIRoute = ({ site }) => {
  const rules = ['User-agent: *', 'Disallow: /api/'];
  if (indexingEnabled) rules.push('Sitemap: ' + new URL('/sitemap.xml', site).href);
  return new Response(rules.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
