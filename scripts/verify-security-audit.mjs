/**
 * Temporary, explicit audit gate for GHSA-fc5q-39xc-vjpf.
 *
 * No patched picomatch release exists as of 2026-11-18.
 * This is NOT a vulnerability fix: it prevents NEW advisories being silently
 * ignored while we wait for an upstream patch and keep the SSG output static.
 * Delete this exception once a patched picomatch is available.
 */
import { readFileSync } from 'node:fs';

const auditPath = process.argv[2] ?? 'npm-audit.json';
const advisory = 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf';
const knownDerived = new Set([
  '@astrojs/check',
  '@astrojs/internal-helpers',
  '@astrojs/language-server',
  '@astrojs/markdown-satteri',
  '@astrojs/vite-plugin-astro',
  'anymatch',
  'astro',
  'fdir',
  'picomatch',
  'tinyglobby',
  'unstorage',
  'vite',
]);

/** @type {{
  error?: unknown,
  vulnerabilities: Record<string, {
    severity: string,
    via: Array<string | {url: string, title?: string}>
  }>,
  metadata: {
    vulnerabilities: { critical: number, high: number, moderate: number, low: number, total: number }
  }
}} */
let audit;
try {
  audit = JSON.parse(readFileSync(auditPath, 'utf8'));
} catch (error) {
  console.error('Security audit unavailable or not valid JSON:', error);
  process.exit(1);
}

if (audit.error || !audit.vulnerabilities || !audit.metadata?.vulnerabilities) {
  console.error('npm audit did not produce a complete report. Fail closed.', audit.error);
  process.exit(1);
}

const found = Object.entries(audit.vulnerabilities);
const unexpected = found.filter(([name, record]) =>
  !knownDerived.has(name) ||
  record.severity !== 'high' ||
  !Array.isArray(record.via)
);

const sources = found.flatMap(([name, record]) =>
  (record.via ?? []).filter(item => item && typeof item === 'object')
    .map(item => ({name, url: item.url, title: item.title}))
);

if (found.length > 0 && (
  unexpected.length > 0 ||
  sources.length !== 1 ||
  sources[0].name !== 'picomatch' ||
  sources[0].url !== advisory ||
  found.length !== knownDerived.size ||
  audit.metadata.vulnerabilities.critical !== 0 ||
  audit.metadata.vulnerabilities.high !== knownDerived.size ||
  audit.metadata.vulnerabilities.moderate !== 0 ||
  audit.metadata.vulnerabilities.low !== 0
)) {
  console.error('Unexpected dependency security advisory or changed dependency chain.');
  console.error(JSON.stringify({unexpected, sources, counts: audit.metadata.vulnerabilities}, null, 2));
  process.exit(1);
}

if (found.length === 0 && audit.metadata.vulnerabilities.total !== 0) {
  console.error('Audit metadata and vulnerability entries disagree.');
  process.exit(1);
}

if (found.length > 0) {
  console.warn(
    'KNOWN UNPATCHED ADVISORY: CVE-2026-112366; 12 affected package nodes',
    'trace to picomatch. This is tracked risk, not remediation.',
    'Do not deploy a Node runtime or process user-provided glob patterns.'
  );
} else {
  console.log('No dependency vulnerabilities. Remove the obsolete exception in this file.');
}
