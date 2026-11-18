import { spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdir, copyFile, rm } from 'node:fs/promises';
import { resolve, dirname, join, extname, sep } from 'node:path';

const root = process.cwd();
const output = resolve(root, 'dist-preview');
await rm(output, { recursive: true, force: true });

// Preview is intentionally a separate build and cannot disable npm run build's
// production release gate. UI kit routes are excluded from the published tree.
const astro = resolve(root, 'node_modules', '.bin', 'astro');
const result = spawnSync(astro, ['build', '--outDir', 'dist-preview'], {
  cwd: root,
  env: { ...process.env, UI_KIT_BUILD: '0' },
  stdio: 'inherit',
});
if (result.error) throw result.error;
if (result.status !== 0) throw new Error('Astro preview build failed');

// Login is compiled with the same real TextField and Button components as the
// project. Unlike the private pages, this one must render before authentication.
// Inline its local CSS/fonts so no _astro assets need to be made public.
const loginPath = join(output, 'preview-login', 'index.html');
let html = await readFile(loginPath, 'utf8');
if (!html.includes('PREVIEW_CSRF_PLACEHOLDER')) {
  throw new Error('Login form is missing the CSRF placeholder');
}
let inlineCount = 0;
const stylesheetTags = [...html.matchAll(/<link\b[^>]*>/gi)].map(match => match[0]);
for (const tag of stylesheetTags) {
  const rel = /\brel\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1] || '';
  const href = /\bhref\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
  if (!rel.split(/\s+/).includes('stylesheet')) continue;
  if (!href || !href.startsWith('/_astro/')) {
    throw new Error('External stylesheet in the unauthenticated login page');
  }
  const cssPath = resolve(output, href.slice(1));
  if (!cssPath.startsWith(output + sep)) throw new Error('Stylesheet escapes output directory');
  let css = await readFile(cssPath, 'utf8');
  const urls = [...css.matchAll(/url\(\s*(?:"([^"]+)"|'([^']+)'|([^)]*))\s*\)/gi)];
  for (const match of urls) {
    const input = (match[1] || match[2] || match[3] || '').trim();
    if (/^(data:|#)/i.test(input)) continue;
    if (/^(https?:|\/\/)/i.test(input)) {
      throw new Error('External CSS asset in unauthenticated login page');
    }
    const clean = decodeURIComponent(input.split(/[?#]/)[0]);
    const assetPath = clean.startsWith('/') ? resolve(output, clean.slice(1)) : resolve(dirname(cssPath), clean);
    if (!assetPath.startsWith(output + sep)) throw new Error('CSS asset escapes output directory');
    const extension = extname(assetPath).toLowerCase();
    const mime = { '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.png': 'image/png' }[extension];
    if (!mime) throw new Error('Unsupported login CSS asset type: ' + extension);
    const bytes = await readFile(assetPath);
    css = css.replace(match[0], 'url("data:' + mime + ';base64,' + bytes.toString('base64') + '")');
  }
  html = html.replace(tag, '<style data-preview-login-styles>' + css + '</style>');
  inlineCount++;
}
if (inlineCount === 0) {
  throw new Error('Compiled login styles were not found');
}
// Any Astro preload would be unauthenticated network activity; compiled fonts
// are embedded above and no preload is needed.
html = html.replace(/<link\b[^>]*rel\s*=\s*["'](?:preload|modulepreload)["'][^>]*>/gi, '');
if (/(?:href|src)\s*=\s*["'](?:\/_astro\/|\/assets\/)/i.test(html)) {
  throw new Error('Login page still requires protected resources');
}
if (/\@import\s/i.test(html)) throw new Error('Unresolved @import in login styles');

const privateDir = join(output, '_preview');
await mkdir(privateDir, { recursive: true });
await writeFile(join(privateDir, 'login.html'), html, 'utf8');
for (const file of ['bootstrap.php', 'gate.php', 'auth.php']) {
  await copyFile(join(root, 'server', 'preview', file), join(privateDir, file));
}
await copyFile(join(root, 'server', 'preview', '.htaccess'), join(output, '.htaccess'));
const produced = await readFile(join(output, '.htaccess'), 'utf8');
if (!produced.includes('RewriteEngine On') || !produced.includes('_preview/gate.php')) {
  throw new Error('Server authentication rewrite missing from preview output');
}
console.log('Protected preview artifact prepared: dist-preview/ (do not host statically).');
