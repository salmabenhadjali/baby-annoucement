/* ==========================================================================
   Carte souvenir — dessinée directement en Canvas 2D (aucune dépendance).
   Souvenir.prepare(data) → Promise<Blob PNG>   (mis en cache)
   Souvenir.peek()        → Blob | null        (si déjà prêt)
   Souvenir.save(blob)    → partage (mobile) ou téléchargement
   ========================================================================== */
window.Souvenir = (function () {
  'use strict';

  var W = 1080, H = 1566;
  var SERIF = '"Cormorant Garamond", "Noto Naskh Arabic", "Geeza Pro", Georgia, serif';
  var C = {
    paper: '#FCF8F2', ink: '#4A3530', soft: '#765A52', wine: '#9A3F4D', gold: '#B08D57',
  };

  var cache = null, ready = null;

  function loadImage(src) {
    return new Promise(function (res, rej) {
      if (!src) return rej(new Error('no src'));
      var img = new Image();
      img.decoding = 'async';
      img.onload = function () { res(img); };
      img.onerror = rej;
      img.src = src;
    });
  }

  function wrap(ctx, text, maxW) {
    // espace insécable avant ! ? : ; et les emoji (typographie française) : jamais seuls en début de ligne
    var t = String(text).replace(/\s+(?=[!?:;»]|\p{Extended_Pictographic})/gu, '\u00A0');
    var words = t.split(/ +/), lines = [], line = '';
    words.forEach(function (w) {
      var test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
      else line = test;
    });
    if (line) lines.push(line);
    // évite un mot (ou un emoji) tout seul en dernière ligne
    if (lines.length > 1 && lines[lines.length - 1].split(' ').length === 1) {
      var prev = lines[lines.length - 2].split(' ');
      if (prev.length > 2) {
        lines[lines.length - 1] = prev.pop() + ' ' + lines[lines.length - 1];
        lines[lines.length - 2] = prev.join(' ');
      }
    }
    return lines;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // object-position simplifié : "center", "50% 40%", "left top"…
  function parsePos(pos) {
    var map = { left: 0, top: 0, center: .5, right: 1, bottom: 1 };
    var parts = String(pos || 'center').trim().split(/\s+/);
    if (parts.length === 1) parts.push('center');
    return parts.map(function (p) {
      if (p in map) return map[p];
      var n = parseFloat(p);
      return isNaN(n) ? .5 : n / 100;
    });
  }

  function drawCover(ctx, img, x, y, w, h, pos) {
    var iw = img.naturalWidth || img.width || 1200, ih = img.naturalHeight || img.height || 900;
    var scale = Math.max(w / iw, h / ih);
    var sw = w / scale, sh = h / scale;
    var p = parsePos(pos);
    var sx = (iw - sw) * p[0], sy = (ih - sh) * p[1];
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function heart(ctx, cx, cy, s) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * .55);
    ctx.bezierCurveTo(cx - s * .1, cy + s * .45, cx - s * .7, cy + s * .05, cx - s * .7, cy - s * .2);
    ctx.bezierCurveTo(cx - s * .7, cy - s * .5, cx - s * .45, cy - s * .62, cx - s * .27, cy - s * .62);
    ctx.bezierCurveTo(cx - s * .12, cy - s * .62, cx, cy - s * .52, cx, cy - s * .36);
    ctx.bezierCurveTo(cx, cy - s * .52, cx + s * .12, cy - s * .62, cx + s * .27, cy - s * .62);
    ctx.bezierCurveTo(cx + s * .45, cy - s * .62, cx + s * .7, cy - s * .5, cx + s * .7, cy - s * .2);
    ctx.bezierCurveTo(cx + s * .7, cy + s * .05, cx + s * .1, cy + s * .45, cx, cy + s * .55);
    ctx.closePath();
  }

  async function render(d) {
    if (document.fonts && document.fonts.load) {
      await Promise.all([
        document.fonts.load('600 76px "Cormorant Garamond"'),
        document.fonts.load('italic 500 44px "Cormorant Garamond"'),
        document.fonts.load('500 30px "Cormorant Garamond"'),
      ]).catch(function () {});
    }
    var img = await loadImage(d.echoSrc).catch(function () { return null; });

    var cv = document.createElement('canvas');
    var k = d.scale || 1; // 2 = haute définition pour l'impression
    cv.width = W * k; cv.height = H * k;
    var ctx = cv.getContext('2d');
    ctx.scale(k, k);
    var rtl = d.dir === 'rtl';
    var italic = rtl ? '' : 'italic ';
    try { ctx.direction = rtl ? 'rtl' : 'ltr'; } catch (e) {}
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    // papier
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, W, H);
    var g = ctx.createRadialGradient(W / 2, 0, 50, W / 2, H * .3, H);
    g.addColorStop(0, 'rgba(255,255,255,.6)');
    g.addColorStop(1, 'rgba(233,210,198,.35)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // filet doré
    ctx.strokeStyle = 'rgba(176,141,87,.6)';
    ctx.lineWidth = 2;
    roundRect(ctx, 34, 34, W - 68, H - 68, 14);
    ctx.stroke();

    // ornement
    var oy = 112;
    ctx.strokeStyle = C.gold; ctx.fillStyle = C.gold; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W / 2 - 190, oy); ctx.lineTo(W / 2 - 40, oy);
    ctx.moveTo(W / 2 + 40, oy); ctx.lineTo(W / 2 + 190, oy); ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2 - 52, oy, 3.5, 0, Math.PI * 2); ctx.arc(W / 2 + 52, oy, 3.5, 0, Math.PI * 2); ctx.fill();
    heart(ctx, W / 2, oy - 2, 30); ctx.lineWidth = 2.4; ctx.stroke();

    if (d.cardTo) {
      ctx.fillStyle = C.soft;
      ctx.font = italic + '500 46px ' + SERIF;
      ctx.fillText(d.cardTo, W / 2, 190);
    }

    // texte du bas, mesuré pour donner le reste à la photo
    ctx.font = '600 78px ' + SERIF;
    var titleLines = wrap(ctx, d.title || '', 900);
    ctx.font = italic + '500 46px ' + SERIF;
    var subLines = d.subtitle ? wrap(ctx, d.subtitle, 860) : [];

    var titleLH = 84, subLH = rtl ? 70 : 58;
    var hTitle = titleLines.length * titleLH;
    var hSub = subLines.length * subLH;
    var hSign = d.signature ? 74 : 0;
    var hDue = d.dueDate ? 50 : 0;
    var bottomPad = 92;
    var stack = 56 + hTitle + 20 + hSub + (hSign ? 40 + hSign : 0) + hDue;

    var px = 96, py = 236, pw = W - px * 2;
    var ph = Math.max(300, H - bottomPad - stack - py);
    var border = 16;

    // photo + cadre blanc
    ctx.save();
    ctx.shadowColor = 'rgba(74,53,48,.28)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 14;
    ctx.fillStyle = '#fff';
    roundRect(ctx, px, py, pw, ph, 10); ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, px + border, py + border, pw - border * 2, ph - border * 2, 5); ctx.clip();
    ctx.fillStyle = '#1a1514';
    ctx.fillRect(px + border, py + border, pw - border * 2, ph - border * 2);
    if (img) drawCover(ctx, img, px + border, py + border, pw - border * 2, ph - border * 2, d.echoPosition);
    ctx.restore();

    // textes
    var y = py + ph + 56;
    ctx.fillStyle = C.ink;
    ctx.font = '600 78px ' + SERIF;
    titleLines.forEach(function (l) { y += titleLH; ctx.fillText(l, W / 2, y - 18); });

    y += 20;
    ctx.fillStyle = C.soft;
    ctx.font = italic + '500 46px ' + SERIF;
    subLines.forEach(function (l) { y += subLH; ctx.fillText(l, W / 2, y - 12); });

    if (d.signature) {
      y += 40 + hSign;
      ctx.fillStyle = C.wine;
      ctx.font = italic + '500 64px ' + SERIF;
      ctx.fillText(d.signature, W / 2, y - 16);
    }
    if (d.dueDate) {
      y += hDue;
      ctx.fillStyle = C.soft;
      ctx.font = '500 32px ' + SERIF;
      ctx.fillText(rtl ? d.dueDate : d.dueDate.toUpperCase(), W / 2, y - 8);
    }

    return new Promise(function (res, rej) {
      cv.toBlob(function (b) { b ? res(b) : rej(new Error('toBlob failed')); }, 'image/png');
    });
  }

  function prepare(d) {
    if (!cache) {
      cache = render(d).then(function (b) { ready = b; return b; }, function (e) { cache = null; throw e; });
    }
    return cache;
  }

  function peek() { return ready; }

  // à appeler si les textes changent (changement de langue)
  function reset() { cache = null; ready = null; }

  async function save(blob, name) {
    var file;
    try { file = new File([blob], name, { type: 'image/png' }); } catch (e) { file = null; }
    var touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

    // Mobile : la feuille de partage permet « Enregistrer l'image » dans Photos
    if (touch && file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return; // l'utilisateur a fermé la feuille
      }
    }

    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  return { prepare: prepare, peek: peek, save: save, reset: reset, render: render };
})();
