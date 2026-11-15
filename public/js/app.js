/* ==========================================================================
   Annonce — chorégraphie
   Étapes : closed → opening → message → reveal → souvenir
   Principe : les classes CSS portent l'état final, les animations (Web
   Animations API) ne font que l'y amener. Sans animation, tout reste lisible.
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.ANNONCE_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };

  // ---------------------------------------------------------------- refs
  var app = $('app'), scene = $('scene'), card = $('card');
  var flap = $('flap'), flapWrap = $('flapWrap'), seal = $('seal');
  var envButton = $('envButton'), hint = $('hint');
  var msg = $('msg'), reveal = $('reveal'), echo = $('echo'), echoImg = $('echoImg');
  var revealTitle = $('revealTitle'), revealSub = $('revealSub'), sign = $('sign');
  var continueBtn = $('continueBtn'), actions = $('actions');
  var saveBtn = $('saveBtn'), saveLabel = $('saveLabel'), replayBtn = $('replayBtn');
  var musicBtn = $('musicBtn'), hearts = $('hearts'), langSwitch = $('langSwitch');
  var printBtn = $('printBtn'), printImg = $('printImg');
  var envParts = Array.prototype.slice.call(document.querySelectorAll('.env-part'));
  var msgLines = [];

  echoImg.style.objectPosition = (CFG.echo && CFG.echo.position) || 'center';

  // ---------------------------------------------------------------- langue
  var langs = Object.keys(CFG.texts || {});
  var lang, T;

  function applyLang(next) {
    lang = CFG.texts[next] ? next : (CFG.texts.fr ? 'fr' : langs[0]);
    T = CFG.texts[lang];

    document.documentElement.lang = lang === 'tn' ? 'ar-TN' : lang;
    document.documentElement.dir = T.dir || 'ltr';

    document.querySelectorAll('[data-t]').forEach(function (el) {
      var v = T[el.getAttribute('data-t')];
      var empty = v == null || v === '';
      el.hidden = empty && el !== saveLabel;
      if (!empty) el.textContent = v;
    });
    document.querySelectorAll('[data-t-aria]').forEach(function (el) {
      el.setAttribute('aria-label', T[el.getAttribute('data-t-aria')] || '');
    });
    document.querySelectorAll('[data-t-title]').forEach(function (el) {
      el.title = T[el.getAttribute('data-t-title')] || '';
    });
    if (T.pageTitle) document.title = T.pageTitle;
    echoImg.alt = T.echoAlt || '';

    // lignes du message (reconstruites ; visibles si on a déjà dépassé cette étape)
    var past = /^(reveal|souvenir)$/.test(app.getAttribute('data-step'));
    msg.textContent = '';
    msgLines = (T.messageLines || []).map(function (line) {
      var p = document.createElement('p');
      p.className = 'msg-line' + (past ? ' is-visible' : '');
      p.textContent = line;
      msg.appendChild(p);
      return p;
    });

    if (musicBtn && !musicBtn.hidden) {
      musicBtn.setAttribute('aria-label', musicBtn.getAttribute('aria-pressed') === 'true' ? T.musicOff : T.musicOn);
    }
    if (langSwitch) {
      langSwitch.querySelectorAll('button').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang));
      });
    }
  }

  // Version par type de personne : ?pour=grand-pere → CFG.versions['grand-pere']
  var params = new URLSearchParams(location.search);
  function findVersion(key) {
    var all = CFG.versions || {};
    var slug = function (s) {
      return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().trim().replace(/[\s_]+/g, '-');
    };
    var k = slug(key), found = null;
    Object.keys(all).forEach(function (name) { if (slug(name) === k) found = all[name]; });
    for (var i = 0; typeof found === 'string' && i < 5; i++) found = all[found]; // alias
    return found && typeof found === 'object' ? found : null;
  }
  // priorité au lien (?pour=…), sinon la fonction liée au prénom saisi (cookie posé par middleware.js)
  var roleCookie = (document.cookie.match(/(?:^|;\s*)pour=([^;]*)/) || [])[1];
  var V = findVersion(params.get('pour') || roleCookie);
  if (V && V.texts) {
    Object.keys(V.texts).forEach(function (l) {
      CFG.texts[l] = Object.assign({}, CFG.texts[l], V.texts[l]);
    });
  }
  // « Pour Mounira » : prénom saisi à l'entrée (cookie posé par middleware.js)
  var prenom = (document.cookie.match(/(?:^|;\s*)prenom=([^;]*)/) || [])[1];
  try { prenom = prenom && decodeURIComponent(prenom); } catch (e) { prenom = null; }
  if (V && prenom) {
    Object.keys(CFG.texts).forEach(function (l) {
      var tpl = CFG.texts[l].cardToName;
      if (tpl) CFG.texts[l] = Object.assign({}, CFG.texts[l], { cardTo: tpl.replace('{prenom}', prenom) });
    });
  }

  applyLang(params.get('lang') || (V && V.lang) || CFG.lang || 'fr');

  // Sélecteur de langue (visible sur l'enveloppe fermée et la carte souvenir)
  if (langSwitch && CFG.showLanguageSwitch !== false && langs.length > 1 && !(V && V.lang)) {
    langs.forEach(function (code) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-lang', code);
      b.setAttribute('lang', code === 'tn' ? 'ar-TN' : code);
      b.setAttribute('aria-pressed', String(code === lang));
      b.textContent = CFG.texts[code].languageName || code.toUpperCase();
      b.addEventListener('click', function () {
        if (code === lang) return;
        applyLang(code);
        try {
          var u = new URL(location.href);
          u.searchParams.set('lang', code);
          history.replaceState(null, '', u);
        } catch (e) {}
        if (window.Souvenir) {
          Souvenir.reset();
          if (app.getAttribute('data-step') === 'souvenir') Souvenir.prepare(souvenirData()).catch(noop);
        }
        if (!busy) layout();
      });
      langSwitch.appendChild(b);
    });
    langSwitch.hidden = false;
  }

  // ---------------------------------------------------------------- motion
  var canAnimate = typeof Element !== 'undefined' && 'animate' in Element.prototype;
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var reduced = function () { return mq.matches || !canAnimate; };
  var pace = Number(CFG.pace) > 0 ? Number(CFG.pace) : 1;

  var running = new Set();
  var runId = 0;
  var CANCEL = {};

  function play(el, keyframes, opts) {
    if (!canAnimate) return Promise.resolve();
    var a = el.animate(keyframes, Object.assign({ fill: 'both' }, opts, {
      duration: (opts.duration || 0) * pace,
      delay: (opts.delay || 0) * pace,
    }));
    running.add(a);
    var p = a.finished.then(function () { return a; }, function () { throw CANCEL; });
    p.catch(noop); // les animations « lancées sans attendre » peuvent être annulées sans bruit
    return p;
  }
  function release(a) { if (a) { running.delete(a); a.cancel(); } }

  // Attente interruptible (si « Revoir » est pressé en cours de route)
  function wait(ms, id) {
    return new Promise(function (res, rej) {
      setTimeout(function () { id === runId ? res() : rej(CANCEL); }, ms * pace);
    });
  }
  function guard(id) { if (id !== runId) throw CANCEL; }

  // Fait apparaître un élément : classe = état final, animation = transition
  function show(el, kf, opts) {
    el.classList.add('is-visible');
    if (reduced()) {
      return play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 450, easing: 'ease-out' }).then(release);
    }
    return play(el, kf, opts).then(release);
  }

  // ---------------------------------------------------------------- géométrie
  var G = {};
  function layout() {
    // place disponible = fenêtre − en-tête − pied (indépendant de la taille actuelle de la scène)
    var cs = getComputedStyle(app);
    var vw = document.documentElement.clientWidth;
    var top = app.querySelector('.top'), bottom = app.querySelector('.bottom');
    var availW = Math.min(vw - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), 440);
    var availH = Math.max(window.innerHeight - top.offsetHeight - bottom.offsetHeight
      - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 12, 260);
    var ratio = 1.45;
    var cw = Math.floor(Math.min(availW, availH / ratio));
    var ch = Math.round(cw * ratio);

    var ew = Math.round(Math.min(vw * 0.86, 360, cw * 1.04));
    var eh = Math.round(ew * 0.64);
    var m = eh * 0.07;                 // marge de la carte dans l'enveloppe
    var s = (ew * 0.88) / cw;          // échelle de la carte dans l'enveloppe
    var visH = eh - 2 * m;             // hauteur visible (à l'échelle)
    var envTop = (ch - eh) / 2;
    var clipIn = Math.max(0, ch - visH / s);

    G = {
      cw: cw, ch: ch, ew: ew, eh: eh, s: s, envTop: envTop,
      dyIn: envTop + m,
      dyPeek: envTop - visH - 10,      // carte entièrement sortie, au-dessus
      clipIn: clipIn,
    };

    var st = app.style;
    st.setProperty('--card-w', cw + 'px');
    st.setProperty('--card-h', ch + 'px');
    st.setProperty('--env-w', ew + 'px');
    st.setProperty('--env-h', eh + 'px');
    st.setProperty('--env-top', envTop + 'px');
    st.setProperty('--env-left', (cw - ew) / 2 + 'px');
    st.setProperty('--s', s.toFixed(4));
    st.setProperty('--dy-in', G.dyIn + 'px');
    st.setProperty('--clip-in', clipIn + 'px');
  }

  var resizeTimer, busy = false, pendingLayout = false;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { busy ? (pendingLayout = true) : layout(); }, 120);
  });

  // ---------------------------------------------------------------- étapes
  function setStep(step) { app.setAttribute('data-step', step); }

  function preloadEcho() {
    if (echoImg.getAttribute('src')) return;
    echoImg.src = (CFG.echo && CFG.echo.src) || '';
  }

  // 1 → 2 : ouverture de l'enveloppe ------------------------------------
  async function openEnvelope() {
    if (app.getAttribute('data-step') !== 'closed') return;
    var id = ++runId;
    busy = true;
    preloadEcho();

    // fige la lévitation là où elle est, puis la ramène doucement à zéro
    var floatT = getComputedStyle(scene).transform;
    setStep('opening');
    envButton.blur();

    try {
      if (reduced()) {
        play(scene, [{ opacity: 1 }, { opacity: 0 }], { duration: 250 });
        await wait(250, id);
        app.classList.add('is-out');
        running.forEach(release);
        await play(scene, [{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: 'ease-out' }).then(release);
      } else {
        if (floatT && floatT !== 'none') {
          play(scene, [{ transform: floatT }, { transform: 'none' }], { duration: 300, easing: 'ease-out' });
        }

        // cachet : se soulève et s'efface
        play(seal, [
          { transform: 'scale(1)', opacity: 1 },
          { transform: 'scale(1.12)', opacity: 1, offset: .35 },
          { transform: 'scale(.6) translateY(-20%)', opacity: 0 },
        ], { duration: 520, easing: 'ease-in' });

        // rabat : bascule vers l'arrière, passe derrière la carte à mi-course
        play(flapWrap, [
          { zIndex: 5 }, { zIndex: 5, offset: .5 }, { zIndex: 2, offset: .5 }, { zIndex: 2 },
        ], { duration: 900, delay: 260, easing: 'linear' });
        await play(flap, [
          { transform: 'rotateX(0deg)' },
          { transform: 'rotateX(180deg)' },
        ], { duration: 900, delay: 260, easing: 'cubic-bezier(.5,.05,.3,1)' });
        guard(id);

        await wait(150, id);

        // la carte glisse hors de l'enveloppe
        var inT = 'translate3d(0,' + G.dyIn + 'px,0) scale(' + G.s + ')';
        var peekT = 'translate3d(0,' + G.dyPeek + 'px,0) scale(' + G.s + ')';
        var clipIn = 'inset(0px 0px ' + G.clipIn + 'px 0px round 10px)';
        var rise = await play(card, [
          { transform: inT },
          { transform: peekT },
        ], { duration: 1150, easing: 'cubic-bezier(.3,.1,.2,1)' });
        guard(id);

        // elle passe au premier plan, grandit et se déplie
        card.style.zIndex = 10;
        var envOut = envParts.filter(function (el) { return el !== seal; }).map(function (el) {
          return play(el, [
            { transform: 'translate3d(0,0,0)', opacity: 1 },
            { transform: 'translate3d(0,' + (G.eh * 0.9) + 'px,0)', opacity: 0 },
          ], { duration: 950, delay: 80, easing: 'cubic-bezier(.5,0,.75,0)' });
        });
        var grow = play(card, [
          { transform: peekT, clipPath: clipIn},
          { transform: 'translate3d(0,0,0) scale(1)', clipPath: 'inset(0px 0px 0px 0px round 10px)'},
        ], { duration: 1300, easing: 'cubic-bezier(.65,0,.25,1)' });
        release(rise);
        await grow;
        await Promise.all(envOut);
        guard(id);

        app.classList.add('is-out');
        card.style.zIndex = '';
        running.forEach(release);
      }

      busy = false;
      if (pendingLayout) { pendingLayout = false; layout(); }
      await showMessage(id);
    } catch (e) { if (e !== CANCEL) throw e; }
  }

  // 3a : message progressif ----------------------------------------------
  async function showMessage(id) {
    setStep('message');
    await wait(350, id);
    for (var i = 0; i < msgLines.length; i++) {
      await show(msgLines[i], [
        { opacity: 0, transform: 'translateY(10px)' },
        { opacity: 1, transform: 'none' },
      ], { duration: 1300, easing: 'cubic-bezier(.25,.6,.3,1)' });
      guard(id);
      await wait(i === msgLines.length - 1 ? 900 : 1100, id);
    }
    if (app.getAttribute('data-step') !== 'message') return;
    continueBtn.hidden = false;
    show(continueBtn, [
      { opacity: 0, transform: 'translateY(8px)' },
      { opacity: 1, transform: 'none' },
    ], { duration: 600, easing: 'ease-out' }).catch(noop);
    continueBtn.focus({ preventScroll: true });

    var auto = Number(CFG.autoContinue);
    if (auto > 0) {
      await wait(auto, id);
      showReveal();
    }
  }

  // 3b : révélation -------------------------------------------------------
  async function showReveal() {
    if (app.getAttribute('data-step') !== 'message') return;
    var id = runId;
    setStep('reveal');
    continueBtn.hidden = true;
    preloadEcho();
    Souvenir.prepare(souvenirData()); // génère le PNG en tâche de fond

    try {
      await play(msg, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(-6px)' }], { duration: 500, easing: 'ease-in' }).then(release);
      msg.classList.add('is-gone');
      guard(id);
      reveal.classList.add('is-visible');

      if (!echoImg.complete) {
        await Promise.race([
          new Promise(function (r) { echoImg.onload = echoImg.onerror = r; }),
          wait(4000, id),
        ]);
      }
      guard(id);

      var echoAnim = show(echo, [
        { opacity: 0, transform: 'scale(1.04)', filter: 'blur(6px)' },
        { opacity: 1, transform: 'none', filter: 'blur(0)' },
      ], { duration: 1700, easing: 'cubic-bezier(.25,.6,.3,1)' });

      await wait(900, id);
      show(revealTitle, [
        { opacity: 0, transform: 'translateY(10px) scale(.98)' },
        { opacity: 1, transform: 'none' },
      ], { duration: 1100, easing: 'cubic-bezier(.2,.8,.3,1)' }).catch(noop);
      await wait(250, id);
      burstHearts();

      await wait(1500, id);
      await show(revealSub, [
        { opacity: 0, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'none' },
      ], { duration: 1200, easing: 'ease-out' });
      await echoAnim;
      guard(id);

      await wait(2600, id);
      await showSouvenir(id);
    } catch (e) { if (e !== CANCEL) throw e; }
  }

  // 4 : carte souvenir ----------------------------------------------------
  async function showSouvenir(id) {
    setStep('souvenir');
    await show(sign, [
      { opacity: 0, transform: 'translateY(6px)' },
      { opacity: 1, transform: 'none' },
    ], { duration: 1200, easing: 'ease-out' });
    guard(id);
    actions.hidden = false;
    await show(actions, [
      { opacity: 0, transform: 'translateY(10px)' },
      { opacity: 1, transform: 'none' },
    ], { duration: 700, easing: 'ease-out' });
  }

  // ---------------------------------------------------------------- cœurs
  function burstHearts() {
    if (reduced()) return;
    var r = card.getBoundingClientRect();
    var colors = ['#C25B6B', '#E39AA4', '#B08D57', '#D9737F', '#F0BCC2'];
    var n = 18;
    for (var i = 0; i < n; i++) {
      var h = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      h.setAttribute('viewBox', '0 0 24 24');
      h.setAttribute('class', 'heart');
      h.innerHTML = '<path fill="' + colors[i % colors.length] + '" d="M12 21s-7.5-4.7-9.6-9.2C.9 8.6 2.9 4.5 6.6 4.5c2.2 0 3.6 1.2 4.4 2.5.8-1.3 2.2-2.5 4.4-2.5 3.7 0 5.7 4.1 4.2 7.3C19.5 16.3 12 21 12 21z"/>';
      var size = 10 + Math.random() * 14;
      h.style.width = h.style.height = size + 'px';
      var x0 = r.left + r.width * (0.15 + Math.random() * 0.7);
      var y0 = r.top + r.height * (0.45 + Math.random() * 0.25);
      h.style.left = x0 + 'px';
      h.style.top = y0 + 'px';
      hearts.appendChild(h);
      var dx = (Math.random() - 0.5) * 120;
      var dy = -(r.height * 0.45 + Math.random() * r.height * 0.5);
      var rot = (Math.random() - 0.5) * 50;
      var a = h.animate([
        { transform: 'translate(0,0) scale(.3) rotate(0deg)', opacity: 0 },
        { transform: 'translate(' + dx * 0.3 + 'px,' + dy * 0.25 + 'px) scale(1) rotate(' + rot * 0.4 + 'deg)', opacity: .95, offset: .2 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.85) rotate(' + rot + 'deg)', opacity: 0 },
      ], { duration: 2600 + Math.random() * 1800, delay: Math.random() * 700, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'both' });
      a.onfinish = a.oncancel = (function (el) { return function () { el.remove(); }; })(h);
    }
  }

  // ---------------------------------------------------------------- souvenir
  function souvenirData() {
    return {
      dir: T.dir || 'ltr',
      cardTo: T.cardTo,
      title: T.revealTitle,
      subtitle: T.revealSubtitle,
      signature: T.signature,
      dueDate: T.dueDate,
      echoSrc: (CFG.echo && CFG.echo.src) || '',
      echoPosition: (CFG.echo && CFG.echo.position) || 'center',
    };
  }

  saveBtn.addEventListener('click', async function () {
    var ready = Souvenir.peek();
    if (!ready) {
      saveBtn.disabled = true;
      saveLabel.textContent = T.saving;
    }
    try {
      var blob = ready || await Souvenir.prepare(souvenirData());
      await Souvenir.save(blob, CFG.souvenirFileName || 'carte-souvenir.png');
    } catch (e) {
      console.error(e);
    } finally {
      saveBtn.disabled = false;
      saveLabel.textContent = T.save;
    }
  });

  // ---------------------------------------------------------------- imprimer
  printBtn.addEventListener('click', async function () {
    printBtn.disabled = true;
    try {
      var blob = await Souvenir.render(Object.assign(souvenirData(), { scale: 2 }));
      var url = URL.createObjectURL(blob);
      printImg.src = url;
      if (printImg.decode) await printImg.decode().catch(noop);
      window.print();
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    } catch (e) {
      console.error(e);
    } finally {
      printBtn.disabled = false;
    }
  });

  // ---------------------------------------------------------------- carte seule
  // (version « direct » : pas d'enveloppe, la carte souvenir s'affiche tout de suite)
  function showDirect() {
    app.classList.add('is-out');
    setStep('souvenir');
    msg.classList.add('is-gone');
    preloadEcho();
    [reveal, echo, revealTitle, revealSub, sign, actions].forEach(function (el) { el.classList.add('is-visible'); });
    actions.hidden = false;
    replayBtn.hidden = true;
    Souvenir.prepare(souvenirData()).catch(noop);
    if (!reduced()) {
      play(card, [
        { opacity: 0, transform: 'translateY(16px) scale(.98)' },
        { opacity: 1, transform: 'none' },
      ], { duration: 900, easing: 'cubic-bezier(.2,.8,.3,1)' }).then(release, noop);
    }
  }

  // ---------------------------------------------------------------- revoir
  function reset() {
    runId++;
    busy = false;
    running.forEach(release);
    hearts.textContent = '';
    app.classList.remove('is-out');
    card.style.zIndex = '';
    msg.classList.remove('is-gone');
    [reveal, echo, revealTitle, revealSub, sign, actions, continueBtn].concat(msgLines)
      .forEach(function (el) { el.classList.remove('is-visible'); });
    continueBtn.hidden = true;
    actions.hidden = true;
    setStep('closed');
    layout();
    envButton.focus({ preventScroll: true });
  }

  // ---------------------------------------------------------------- musique
  var audio = null;
  if (CFG.music && CFG.music.src) {
    musicBtn.hidden = false;
    musicBtn.setAttribute('aria-label', T.musicOn);
    musicBtn.addEventListener('click', function () {
      if (!audio) {
        audio = new Audio(CFG.music.src);
        audio.loop = true;
        audio.volume = CFG.music.volume != null ? CFG.music.volume : 0.35;
      }
      var on = musicBtn.getAttribute('aria-pressed') !== 'true';
      if (on) audio.play().catch(noop); else audio.pause();
      musicBtn.setAttribute('aria-pressed', String(on));
      musicBtn.setAttribute('aria-label', on ? T.musicOff : T.musicOn);
    });
  }

  // ---------------------------------------------------------------- go
  function noop() {}

  envButton.addEventListener('click', openEnvelope);
  continueBtn.addEventListener('click', showReveal);
  replayBtn.addEventListener('click', reset);

  if (V && V.print) printBtn.hidden = false;
  layout();
  if (V && V.direct) showDirect();
  // recalcule une fois les polices chargées (la hauteur de l'intro peut varier)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!busy) layout(); });
})();
