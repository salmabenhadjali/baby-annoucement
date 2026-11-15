/* ==========================================================================
   Contrôle d'accès OPTIONNEL par prénom — Vercel Routing Middleware.
   S'exécute côté serveur AVANT de servir les fichiers : sans le bon cookie,
   ni la page, ni config.js, ni l'échographie ne sont accessibles.

   Activation (Vercel → Settings → Environment Variables) :
     ACCES_PRENOMS = mama, baba, michel:grand-pere, sophie:tante
                     (liste, virgules ; « prénom:fonction » choisit la carte,
                      voir « versions » dans public/config.js)
     ACCES_SECRET  = une longue chaîne aléatoire      (signe le cookie)
   Si ACCES_PRENOMS est vide → pas de contrôle (lien privé uniquement).
   ========================================================================== */
import { next } from '@vercel/functions';
import ACCES_TEXTS from './acces.config.js';

export const config = {
  // tout sauf l'image d'aperçu WhatsApp, les polices et le favicon
  matcher: ['/((?!og-image\\.jpg|assets/fonts/|favicon\\.ico).*)'],
};

const COOKIE = 'acces';
const ROLE_COOKIE = 'pour';     // lisible par app.js : quelle carte afficher
const NAME_COOKIE = 'prenom';   // lisible par app.js : « Pour Mounira »
const MAX_AGE = 60 * 60 * 24 * 365; // 1 an : les parents ne retapent pas leur prénom
const FORM_PATH = '/__acces';

// Textes : voir acces.config.js. Langue = ?lang=… du lien (aussi dans « next »).
function textsFor(pathWithQuery) {
  let lang = ACCES_TEXTS.defaultLang || 'fr';
  try {
    const q = new URL(pathWithQuery, 'https://x').searchParams.get('lang');
    if (q && ACCES_TEXTS[q]) lang = q;
  } catch {}
  return { lang, ...(ACCES_TEXTS.fr || {}), ...(ACCES_TEXTS[lang] || {}) };
}

/* -------------------------------------------------------------------------- */

function normalize(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')       // accents latins
    .replace(/[ً-ٰٟ]/g, '') // voyelles arabes (tashkeel)
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/[\s\-_.]+/g, '')
    .toLowerCase()
    .trim();
}

// « michel:grand-pere » → { michel: { role: 'grand-pere', label: 'Michel' } }
function allowedRoles() {
  const roles = {};
  (process.env.ACCES_PRENOMS || '').replace(/["'\r\n]/g, '').split(',').forEach((entry) => {
    const [rawName, rawRole = ''] = entry.split(/[:=]/);
    const name = normalize(rawName);
    // prénom affiché tel qu'écrit dans la liste, avec une majuscule
    const label = rawName.trim().replace(/(^|[\s-])(\p{Ll})/gu, (m, a, b) => a + b.toUpperCase());
    if (name) roles[name] = { role: rawRole.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''), label };
  });
  return roles;
}

function infoCookies(info, secure) {
  const c = (k, v) => `${k}=${encodeURIComponent(v)}; Path=/; Max-Age=${v ? MAX_AGE : 0}; SameSite=Lax`
    + (secure ? '; Secure' : '');
  return [c(ROLE_COOKIE, info.role), c(NAME_COOKIE, info.label)];
}

async function sign(value) {
  const secret = process.env.ACCES_SECRET || 'change-me:' + (process.env.ACCES_PRENOMS || '');
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(mac)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  const m = header.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}

async function hasValidCookie(request, names) {
  const raw = readCookie(request, COOKIE);
  if (!raw) return false;
  const dot = raw.lastIndexOf('.');
  if (dot < 1) return false;
  const name = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  // le prénom doit toujours être dans la liste (on peut retirer un accès)
  return names.includes(name) && sig === (await sign(name)) ? name : false;
}

function safeNext(value) {
  const v = String(value || '/');
  return v.startsWith('/') && !v.startsWith('//') ? v : '/';
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function gatePage(request, { error = false, nextPath = '/' } = {}) {
  const og = new URL('/og-image.jpg', request.url).href;
  const TEXTS = textsFor(nextPath);
  const htmlLang = TEXTS.lang === 'tn' ? 'ar-TN' : TEXTS.lang;
  const html = `<!doctype html>
<html lang="${htmlLang}" dir="${TEXTS.dir || 'ltr'}"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow, noarchive, noimageindex">
<meta name="referrer" content="no-referrer">
<title>${TEXTS.title}</title>
<meta name="description" content="${TEXTS.description}">
<meta property="og:type" content="website">
<meta property="og:title" content="${TEXTS.title}">
<meta property="og:description" content="${TEXTS.description}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="theme-color" content="#F3E4DB">
<style>
@font-face{font-family:"Cormorant Garamond";src:url(/assets/fonts/cormorant-garamond-latin-500-italic.woff2) format("woff2");font-style:italic;font-weight:500}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;min-height:100svh;display:grid;place-items:center;padding:24px 16px;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans Arabic",sans-serif;color:#4A3530;
  background:radial-gradient(120% 70% at 50% 0%,#FCF8F4,#F5EBE4 55%,#EEDDD3) fixed,#F5EBE4}
main{width:100%;max-width:380px;text-align:center}
svg{width:96px;height:auto;filter:drop-shadow(0 10px 14px rgba(92,52,44,.25))}
h1{font:italic 500 clamp(1.6rem,7vw,2rem)/1.2 "Cormorant Garamond",Georgia,serif;margin:18px 0 6px}
.ar{margin:0 0 22px;color:#765A52;font-size:1rem}
input{width:100%;min-height:56px;padding:0 18px;border:1.5px solid #D9B9AC;border-radius:16px;background:#FFFCF9;
  font:500 1.25rem system-ui,sans-serif;color:#4A3530;text-align:center}
input:focus{outline:3px solid #B08D57;outline-offset:2px;border-color:transparent}
button{margin-top:14px;width:100%;min-height:56px;border:0;border-radius:999px;background:#9A3F4D;color:#fff;
  font:600 1.125rem system-ui,sans-serif;box-shadow:0 10px 22px -10px rgba(126,47,60,.7);cursor:pointer}
button:focus-visible{outline:3px solid #B08D57;outline-offset:3px}
.err{margin:14px 0 0;color:#9A3F4D;font-size:1rem}
</style></head>
<body><main>
<svg viewBox="0 0 100 64" aria-hidden="true"><rect width="100" height="64" rx="4" fill="#E9C6B9"/><path d="M0 64 46 31.5Q50 29 54 31.5L100 64Z" fill="#F3DACF"/><path d="M0 0H100L53 37.6Q50 40 47 37.6Z" fill="#E4BBAD"/><circle cx="50" cy="36" r="7.5" fill="#9A3A48"/></svg>
<h1>${TEXTS.prompt}</h1>
${TEXTS.secondary ? `<p class="ar" dir="${TEXTS.secondaryDir || 'auto'}">${TEXTS.secondary}</p>` : '<div style="height:16px"></div>'}
<form method="post" action="${FORM_PATH}">
  <input type="hidden" name="next" value="${escapeHtml(nextPath)}">
  <label for="p" style="position:absolute;left:-9999px">${TEXTS.placeholder}</label>
  <input id="p" name="prenom" autocomplete="given-name" autocapitalize="words" placeholder="${TEXTS.placeholder}" required autofocus>
  <button type="submit">${TEXTS.button}</button>
  ${error ? `<p class="err" role="alert">${TEXTS.error}</p>` : ''}
</form>
</main></body></html>`;
  return new Response(html, {
    status: error ? 401 : 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
      'referrer-policy': 'no-referrer',
    },
  });
}

export default async function middleware(request) {
  const roles = allowedRoles();
  const names = Object.keys(roles);
  if (names.length === 0) return next(); // contrôle désactivé

  const url = new URL(request.url);
  const secure = url.protocol === 'https:';

  // Soumission du formulaire
  if (url.pathname === FORM_PATH && request.method === 'POST') {
    const form = await request.formData().catch(() => null);
    const name = normalize(form && form.get('prenom'));
    const nextPath = safeNext(form && form.get('next'));
    if (!names.includes(name)) return gatePage(request, { error: true, nextPath });

    const value = name + '.' + (await sign(name));
    const headers = new Headers({ location: nextPath, 'cache-control': 'no-store' });
    // « Secure » seulement en HTTPS : sinon Safari refuse le cookie sur http://localhost
    headers.append('set-cookie', `${COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; SameSite=Lax`
      + (secure ? '; Secure' : ''));
    infoCookies(roles[name], secure).forEach((v) => headers.append('set-cookie', v));
    return new Response(null, { status: 303, headers });
  }

  const who = await hasValidCookie(request, names);
  if (who) {
    // Fonction ou prénom changés dans ACCES_PRENOMS (ou cookie posé avant) → mise à jour
    const info = roles[who];
    if (url.pathname === '/' && request.method === 'GET'
      && ((readCookie(request, ROLE_COOKIE) || '') !== info.role || (readCookie(request, NAME_COOKIE) || '') !== info.label)) {
      const headers = new Headers({ location: url.pathname + url.search, 'cache-control': 'no-store' });
      infoCookies(info, secure).forEach((v) => headers.append('set-cookie', v));
      return new Response(null, { status: 307, headers });
    }
    return next();
  }

  return gatePage(request, { nextPath: url.pathname + url.search });
}
