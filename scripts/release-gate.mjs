import { readFile } from 'node:fs/promises';
const status = JSON.parse(await readFile(new URL('../docs/release-status.json', import.meta.url), 'utf8'));
const pending = Object.entries(status).filter(([, done]) => done !== true).map(([name]) => name);
if (pending.length) {
  console.error('Production build blocked. Incomplete checks: ' + pending.join(', '));
  process.exitCode = 1;
}
