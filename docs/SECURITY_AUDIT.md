# Dependency security audit — 2026-11-18

**Status: One unresolved upstream advisory, not twelve unrelated root causes.**

The last GitHub Actions npm audit contains twelve high-severity affected dependency nodes. All stem from **picomatch CVE-2026-112366 (GHSA-fc5q-39xc-vjpf)**. Installed branches: 4.0.7 (Astro / Vite / tinyglobby) and 2.3.2 (nested under anymatch).

- Upstream source: https://github.com/advisories/GHSA-fc5q-39xc-vjpf
- Upstream 4.x fix proposal: https://github.com/micromatch/picomatch/pull/238 (open, not merged).
- Upstream 2.x fix proposal: https://github.com/micromatch/picomatch/pull/246 (open, not merged).
- As of 2026-11-18, latest npm picomatch release is 4.0.7 and no verified fixed version is available.
- npm audit fix --force proposes Astro 5.3.0, a major **downgrade** from 7.4.12 that is not an acceptable safe fix. Keep the verified Astro 7.4.12.
- No unreviewed vendor patch, fork or audit-bypass was installed.

## Immediate risk control

1. The production target is Astro **static SSG**; no Node.js/Astro server runtime is exposed publicly. The reported ReDoS requires applying malicious repeated-extglob patterns inside Node.js. It does **not** imply twelve browser-side vulnerabilities in the built HTML/CSS/JS.
2. Keep the existing release gate and noindex until the user explicitly approves production release.
3. Do not introduce code that evaluates user-supplied glob expressions. Audit such changes before any release.
4. GitHub Actions now records the complete audit JSON and validates it using scripts/verify-security-audit.mjs. Only the one known advisory dependency chain is accepted; a new, changed or higher-severity advisory will **fail CI**.
5. Do not hide, remove or falsely mark the 12 warnings as fixed.

## Closing the finding

When an official fixed package is published: update the direct dependency and transitive lock, run npm ci + npm audit, run all UI checks in Chromium/Firefox/WebKit, remove the temporary audit exception and its documentation, and verify **zero findings**.

The preceding work does not modify other pages' Mobile layouts, master, or deployment.
