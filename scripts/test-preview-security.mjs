import { spawn, spawnSync } from 'node:child_process';
import { writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const base = 'http://127.0.0.1:48983';
const configPath = resolve('.masterskaya-preview-auth.php');
const testPassword = 'CI-only-staging-password-not-used-on-hoster';
const hash = spawnSync('php', ['-r', 'echo password_hash($argv[1], PASSWORD_BCRYPT);', testPassword], { encoding: 'utf8' });
if (hash.status !== 0 || !hash.stdout.startsWith('$2y$')) throw new Error('PHP bcrypt is unavailable');
const server = spawn('php', ['-S', '127.0.0.1:48983', '-t', 'dist-preview', 'scripts/preview-test-router.php'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
});
/** @param {number} ms */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
/** @param {string} path @param {RequestInit} [options] */
async function request(path, options={}) {
    return fetch(base+path, {redirect:'manual', ...options});
}
/** @param {unknown} condition @param {string} name */
function ensure(condition, name) {
    if (!condition) throw new Error('Protected preview smoke test: '+name);
}
try {
    await rm(configPath, { force: true });
    let ready = false;
    for (let i=0;i<50;i++) {
        try { const res=await request('/'); ready=res.status===503; if(ready) break; } catch {}
        await sleep(100);
    }
    ensure(ready, 'Without private config all requests must fail closed (503)');
    const escapedHash=hash.stdout.trim().replace(/'/g, "\\'");
    await writeFile(configPath, "<?php return ['username'=>'preview', 'password_hash'=>'"+escapedHash+"'];\n", {mode:0o600});
    const initial=await request('/portfolio/');
    ensure(initial.status===302,'Private portfolio redirects before auth');
    const initialCookie = initial.headers.get('set-cookie')?.split(';')[0];
    if (!initialCookie) throw new Error('Missing first-session cookie');
    ensure(initial.headers.get('location')==='https://baltmotors.by/preview-login/','Redirect stays on HTTPS canonical domain');
    for(const path of ['/', '/assets/figma/portfolio-ruckit.jpg', '/documents/personal-data-policy.pdf','/robots.txt','/_astro/nonexistent.css']){
        const res=await request(path);
        ensure(res.status===302,'Unauthorized file denied: '+path);
        ensure(res.headers.get('x-robots-tag')?.includes('noindex'),'Noindex response: '+path);
    }
    const login=await request('/preview-login/',{headers:{Cookie:initialCookie}});
    ensure(login.status===200,'Login is public');
    const cookie=login.headers.get('set-cookie')?.split(';')[0] || initialCookie;
    ensure(cookie?.startsWith('__Host-MSKPreview='),'Secure session cookie issued');
    if (!cookie) throw new Error('Secure preview session cookie is missing');
    const html=await login.text();
    ensure(html.includes('data-preview-login-styles'),'Figma-styled login CSS is self-contained');
    ensure(html.includes('type="password"'),'Password input is real password field');
    ensure(html.includes('Введите логин'),'TextField component is present');
    ensure(!html.includes('PREVIEW_CSRF_PLACEHOLDER'),'CSRF has been injected');
    ensure(!html.includes('href="/_astro/'),'Login has no unprotected asset dependency');
    const match=html.match(/name="csrf" value="([a-f0-9]{64})"/);
    if (!match) throw new Error('Login CSRF token missing');
    /** @param {string} pass */
    const send=(pass)=>request('/_preview/auth.php',{
      method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Cookie:cookie},
      body:new URLSearchParams({username:'preview',password:pass,csrf:match[1]}).toString()
    });
    const bad=await send('definitely-wrong-password');
    ensure(bad.status===303 && bad.headers.get('location')?.endsWith('/preview-login/?error=1'),'Incorrect password denied');
    const good=await send(testPassword);
    ensure(good.status===303 && good.headers.get('location')==='https://baltmotors.by/portfolio/','Correct password continues to original page');
    const authorized=await request('/portfolio/',{headers:{Cookie:cookie}});
    ensure(authorized.status===200,'Authorized portfolio can be read');
    ensure((await authorized.text()).includes('<html'),'Authorized content is returned');
    const unauthorizedApi=await request('/api/submit.php');
    ensure(unauthorizedApi.status===401,'Unauthenticated API is protected');
    const protectedApi=await request('/api/submit.php',{method:'POST',headers:{Cookie:cookie}});
    ensure(protectedApi.status===403,'Authenticated API enforces its own Origin validation');
    const pdf=await request('/documents/personal-data-policy.pdf',{headers:{Cookie:cookie}});
    ensure(pdf.status===200 && pdf.headers.get('content-type')?.includes('pdf'),'Protected PDF served only after login');
    const dotFile=await request('/.htaccess',{headers:{Cookie:cookie}});
    ensure(dotFile.status===404,'Dot files stay hidden even after auth');
    const source=await request('/_preview/bootstrap.php',{headers:{Cookie:cookie}});
    ensure(source.status===404,'Internal PHP source cannot be fetched');
    console.log('PREVIEW_AUTH_OK: default-deny, CSRF, login, PDF, static content and noindex headers.');
} finally {
    server.kill('SIGTERM');
    await rm(configPath, {force:true});
}
