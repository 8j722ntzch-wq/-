import type { APIRoute } from 'astro';
import { portfolioProjects } from '../data/portfolio';
import { servicePages } from '../data/service-pages';

export const GET: APIRoute = ({ site }) => {
  const paths = [
    '/', '/contacts/', '/policy/', '/portfolio/',
    ...servicePages.map(({ slug }) => '/services/' + encodeURIComponent(slug) + '/'),
    ...portfolioProjects.map(({ slug }) => '/portfolio/' + encodeURIComponent(slug) + '/'),
  ];
  const urls = paths.map(path => '  <url><loc>' + new URL(path, site).href + '</loc></url>');
  const xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls, '</urlset>'].join('\n');
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
