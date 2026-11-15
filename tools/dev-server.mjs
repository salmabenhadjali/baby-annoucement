/* ==========================================================================
   Serveur de dev local : `npm run dev`
   · exécute le vrai middleware.js (page « Votre prénom », fonction par prénom)
     avec les variables de .env.local — comme en prod sur Vercel ;
   · sert public/ ;
   · recharge le navigateur dès qu'un fichier change.
   (`vercel dev` n'exécute pas le middleware sur ce projet statique.)
   ========================================================================== */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT) || 4173;

// .env.local → process.env
try {
  for (const line of fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
} catch {}

const { default: middleware, config } = await import(path.join(ROOT, 'middleware.js'));
const matchers = (config?.matcher || ['/(.*)']).map((p) => new RegExp('^' + p + '$'));

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.txt': 'text/plain; charset=utf-8',
};

const RELOAD = `<script>(function(){var lost=false,es=new EventSource('/__reload');
es.onmessage=function(){location.reload()};es.onerror=function(){lost=true};
es.onopen=function(){if(lost)location.reload()};})();</script>`;
const inject = (html) => html.includes('</body>') ? html.replace('</body>', RELOAD + '</body>') : html + RELOAD;

// rechargement : public/ change → message ; middleware/.env changent → node --watch redémarre
const clients = new Set();
let timer;
fs.watch(PUBLIC, { recursive: true }, () => {
  clearTimeout(timer);
  timer = setTimeout(() => clients.forEach((c) => c.write('data: reload\n\n')), 80);
});

function serveStatic(req, res, pathname) {
  let file = path.join(PUBLIC, decodeURIComponent(pathname));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404, { 'content-type': 'text/plain' }).end('404'); return; }
  const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  let body = fs.readFileSync(file);
  if (type.startsWith('text/html')) body = inject(body.toString());
  res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' }).end(body);
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost:' + PORT}`);

  if (url.pathname === '/__reload') {
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
    res.write(': ok\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  try {
    if (matchers.some((m) => m.test(url.pathname))) {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) headers.set(k, Array.isArray(v) ? v.join(', ') : v);
      const request = new Request(url, {
        method: req.method, headers,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
      });
      const out = await middleware(request);
      if (out && !out.headers.get('x-middleware-next')) {
        const h = {};
        out.headers.forEach((v, k) => { if (k !== 'set-cookie') h[k] = v; });
        const cookies = out.headers.getSetCookie();
        if (cookies.length) h['set-cookie'] = cookies;
        let body = Buffer.from(await out.arrayBuffer());
        if ((h['content-type'] || '').startsWith('text/html')) body = Buffer.from(inject(body.toString()));
        res.writeHead(out.status, h).end(body);
        return;
      }
    }
    serveStatic(req, res, url.pathname);
  } catch (e) {
    console.error(e);
    res.writeHead(500, { 'content-type': 'text/plain' }).end(String(e));
  }
}).listen(PORT, () => {
  const n = Object.keys(process.env).includes('ACCES_PRENOMS') && process.env.ACCES_PRENOMS.trim()
    ? 'activé (ACCES_PRENOMS de .env.local)' : 'désactivé (ACCES_PRENOMS vide)';
  console.log(`\n  ✉️  http://localhost:${PORT}\n  Accès par prénom : ${n}\n  Rechargement automatique : activé\n`);
});
