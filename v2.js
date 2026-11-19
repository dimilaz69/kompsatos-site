(function () {
  'use strict';
  var K = window.K || {};
  var STR = K.str || {};
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  /* ---------- language ---------- */
  var lang = 'en';
  function t(k, vars) {
    var v = (STR[k] || {})[lang] || '';
    if (vars) for (var n in vars) v = v.replace('{' + n + '}', vars[n]);
    return v;
  }
  var onLang = [];
  function setLang(l, remember) {
    lang = l; root.lang = l;
    if (!K.fixed) $$('[data-i18n]').forEach(function (el) { el.innerHTML = t(el.getAttribute('data-i18n')); });
    if (!K.fixed) $$('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var p = pair.split(':'); el.setAttribute(p[0], t(p[1]));
      });
    });
    var b = $('#langBtn'); if (!K.fixed) { b.textContent = l === 'el' ? 'English' : 'Ελληνικά'; b.lang = l === 'el' ? 'en' : 'el'; }
    if (os !== 'desktop') $$('.cta-row .btn').forEach(function (a) {
      var other = a.classList.contains(os === 'ios' ? 'android' : 'ios');
      if (other) a.innerHTML = t(a.classList.contains('android') ? 'cta.android.short' : 'cta.ios.short');
    });
    onLang.forEach(function (f) { f(); });
    if (remember) { try { localStorage.setItem('kLang', l); } catch (e) {} }
  }
  $('#langBtn').addEventListener('click', function () {
    if (K.fixed) { try { localStorage.setItem('kLang', lang === 'el' ? 'en' : 'el'); } catch (e) {} return; }
    setLang(lang === 'el' ? 'en' : 'el', true);
  });

  /* ---------- which phone is this ---------- */
  var ua = navigator.userAgent || '';
  var os = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'ios' : /Android/.test(ua) ? 'android' : 'desktop';
  root.setAttribute('data-os', os);
  if (os === 'ios') $('#dockBtn').href = 'https://testflight.apple.com/join/EJnFbWZ6';
  if (os === 'android') $('#dockBtn').href = 'https://www.kompsatos.com/android/';

  /* ---------- hero demo: save a set, rest, next set ---------- */
  (function () {
    if (!$('#demo')) return;
    var demo = $('#demo'), C = 2 * Math.PI * 14, set = 1, timer = null, running = false;
    var rings = $$('[data-ring]', demo), clocks = $$('[data-clock]', demo), hrs = $$('[data-hr]', demo);
    rings.forEach(function (r) { r.setAttribute('stroke-dasharray', C.toFixed(2)); });
    function clock(s) {
      var txt = Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
      clocks.forEach(function (c) { c.textContent = txt; });
      rings.forEach(function (r) { r.style.strokeDashoffset = (C * (1 - s / 90)).toFixed(2); });
    }
    function hr(v) { hrs.forEach(function (h) { h.textContent = v; }); }
    function labels() {
      $('#dSave').textContent = t('demo.save', { n: set });
      $('#dLast').textContent = t('demo.last', { n: set });
      $('#wSet').textContent = t('demo.wSet', { n: set });
    }
    onLang.push(labels);
    function ready() { demo.classList.remove('resting'); $('#dReps').textContent = '8'; $('#wReps').textContent = '8'; hr(128 + set * 2); clock(90); labels(); }
    function tap(el, ms) { el.classList.add('tap'); setTimeout(function () { el.classList.remove('tap'); }, ms || 220); }
    var steps = [
      [900, function () { tap($('#dPlus')); $('#dReps').textContent = '9'; $('#wReps').textContent = '9'; }],
      [900, function () { tap($('#dSave'), 260); }],
      [300, function () { var f = $('#dFlash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); demo.classList.add('resting'); hr(146); clock(90); }],
      [1000, function () { clock(89); hr(143); }],
      [1000, function () { clock(88); hr(139); }],
      [1000, function () { clock(87); hr(136); }],
      /* the middle of the rest is skipped: nobody watches ninety seconds */
      [700, function () { rings.forEach(function (r) { r.style.transitionDuration = '.6s'; }); clock(3); hr(118); }],
      [1000, function () { rings.forEach(function (r) { r.style.transitionDuration = ''; }); clock(2); }],
      [1000, function () { clock(1); hr(117); }],
      [1000, function () { clock(0); var w = $('#dWatch'); w.classList.remove('buzz'); void w.offsetWidth; w.classList.add('buzz'); }],
      [900, function () { set = set % 3 + 1; ready(); }]
    ];
    var i = 0;
    function next() {
      if (!running) return;
      var s = steps[i];
      timer = setTimeout(function () { s[1](); i = (i + 1) % steps.length; next(); }, s[0]);
    }
    function start() { if (running || reduce) return; running = true; next(); }
    function stop() { running = false; clearTimeout(timer); }
    function saveNow() {
      if (reduce || demo.classList.contains('resting')) return;
      clearTimeout(timer); $('#dReps').textContent = '9'; $('#wReps').textContent = '9';
      i = 1; running = true; steps[1][1](); i = 2; next();
    }
    $('#dSave').addEventListener('click', saveNow);
    $('.w-log', demo).addEventListener('click', saveNow);
    ready();
    if (reduce) { $('#dReps').textContent = '9'; $('#wReps').textContent = '9'; return; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { e[0].isIntersecting && !document.hidden ? start() : stop(); }, { threshold: 0.15 }).observe(demo);
    } else start();
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  })();

  /* ---------- features tabs ---------- */
  (function () {
    if (!$('#panel')) return;
    var tabs = $$('#tabs [role=tab]'), panel = $('#panel'), imgs = ['img.program', 'img.logging', 'img.records'], cur = 0;
    function show(n, focus) {
      cur = n;
      tabs.forEach(function (b, k) { b.setAttribute('aria-selected', k === n); b.tabIndex = k === n ? 0 : -1; });
      panel.setAttribute('aria-labelledby', tabs[n].id);
      var k = n + 1;
      $('#fImg').setAttribute('data-i18n-attr', 'src:' + imgs[n] + ';alt:feat.' + k + '.alt');
      $('#fImg').src = t(imgs[n]); $('#fImg').alt = t('feat.' + k + '.alt');
      [['#fH', 'h'], ['#fA', 'a'], ['#fB', 'b'], ['#fC', 'c']].forEach(function (p) {
        var el = $(p[0]); el.setAttribute('data-i18n', 'feat.' + k + '.' + p[1]); el.innerHTML = t('feat.' + k + '.' + p[1]);
      });
      $$('.fdots i').forEach(function (d, j) { d.classList.toggle('on', j === n); });
      panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap');
      if (focus) tabs[n].focus();
    }
    var x0 = null, y0 = 0;
    panel.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; warm(); }, { passive: true });
    panel.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) show(dx < 0 ? Math.min(2, cur + 1) : Math.max(0, cur - 1));
    }, { passive: true });
    var warmed = false;
    function warm() { if (warmed) return; warmed = true; imgs.forEach(function (k) { new Image().src = t(k); }); }
    $('#tabs').addEventListener('pointerenter', warm); $('#tabs').addEventListener('touchstart', warm, { passive: true });
    tabs.forEach(function (b, k) {
      b.addEventListener('click', function () { show(k); });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') show((cur + 1) % 3, true);
        if (e.key === 'ArrowLeft') show((cur + 2) % 3, true);
      });
    });
  })();

  /* ---------- watch screens ---------- */
  (function () {
    if (!$('.wframe')) return;
    var imgs = $$('.wframe img'), items = $$('#wlist li'), dots = $('#wdots'), cur = 0, timer = null, btns = [];
    imgs.forEach(function (_, k) {
      var b = document.createElement('button'); b.type = 'button';
      b.addEventListener('click', function () { show(k); hold(); });
      dots.appendChild(b); btns.push(b);
    });
    function aria() { btns.forEach(function (b, k) { b.setAttribute('aria-label', t('watch.dot', { n: k + 1 })); }); }
    onLang.push(aria);
    function show(n) {
      cur = n;
      imgs.forEach(function (im, k) { im.classList.toggle('on', k === n); });
      items.forEach(function (li, k) { li.classList.toggle('on', k === n); });
      btns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === n); });
    }
    items.forEach(function (li, k) { li.addEventListener('click', function () { show(k); hold(); }); });
    function play() { if (reduce) return; clearInterval(timer); timer = setInterval(function () { show((cur + 1) % imgs.length); }, 3200); }
    function hold() { clearInterval(timer); timer = setTimeout(play, 9000); }
    show(0);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { e[0].isIntersecting ? play() : clearInterval(timer); }, { threshold: 0.3 }).observe($('.wframe'));
  })();

  /* ---------- weekly sets explorer (Pelland et al. 2026, Table 3) ---------- */
  (function () {
    if (!$('#doseSvg')) return;
    var svg = $('#doseSvg'), NS = 'http://www.w3.org/2000/svg';
    var L = 40, R = 14, T = 16, B = 62, W = 640, H = 310, XMAX = 45, YMAX = 5.5, lastW = 0;
    /* sets at which each further detectable step is reached: 4, +6, +8.5, +10.75, +12.5 */
    var P = [[4, 1], [10, 2], [18.5, 3], [29.25, 4], [41.75, 5]];
    var COST = [null, null, 6, 8.5, 10.75, 12.5];
    function X(v) { return L + (W - L - R) * v / XMAX; }
    function Y(v) { return H - B - (H - B - T) * v / YMAX; }
    /* square-root curve through the tier limits (the paper's best-fit form) */
    function f(x) { return Math.max(0, 0.895 * Math.sqrt(x) - 0.81); }
    function el(n, a, txt) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; svg.appendChild(e); return e; }
    function tier(n) { return n < 4 ? 0 : n === 4 ? 1 : n <= 10 ? 2 : n <= 18 ? 3 : n <= 29 ? 4 : n <= 42 ? 5 : 6; }
    function fmt(v) { return lang === 'el' ? String(v).replace('.', ',') : String(v); }
    var area, dot, drop, labelY, labelX, few, costs = [];
    function build() {
      var cw = svg.parentNode.clientWidth || 640;
      W = Math.max(300, Math.min(640, cw)); H = W < 480 ? 290 : 310; lastW = cw;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.innerHTML = ''; costs = [];
      var i, d;
      el('rect', { x: X(25), y: T, width: X(XMAX) - X(25), height: H - B - T, fill: 'rgba(255,255,255,.035)' });
      few = el('text', { x: X(35), y: H - B - 10, 'text-anchor': 'middle' }, t('dose.few'));
      for (i = 0; i <= 5; i++) {
        el('line', { x1: L, x2: W - R, y1: Y(i), y2: Y(i), stroke: '#2a2d32', 'stroke-width': 1 });
        el('text', { x: L - 8, y: Y(i) + 4, 'text-anchor': 'end' }, i);
      }
      [0, 10, 20, 30, 40].forEach(function (v) { el('text', { x: X(v), y: H - B + 18, 'text-anchor': 'middle' }, v); });
      /* the widening brackets: how many sets each further step cost */
      var prev = 4;
      el('line', { x1: X(4), x2: X(4), y1: Y(1), y2: H - B, stroke: '#32dbb8', 'stroke-width': 1, 'stroke-dasharray': '3 4', opacity: .6 });
      for (i = 1; i < P.length; i++) {
        var x0 = X(prev), x1 = X(P[i][0]), yb = H - B + 30;
        el('line', { x1: x1, x2: x1, y1: Y(P[i][1]), y2: H - B, stroke: '#32dbb8', 'stroke-width': 1, 'stroke-dasharray': '3 4', opacity: .6 });
        el('path', { d: 'M' + (x0 + 3) + ' ' + (yb - 5) + 'v5H' + (x1 - 3) + 'v-5', fill: 'none', stroke: '#a39f99', 'stroke-width': 1.5 });
        costs.push(el('text', { x: (x0 + x1) / 2, y: yb + 17, 'text-anchor': 'middle', style: 'fill:#f4f2ed;font-weight:700;font-size:13px' }, '+' + fmt(COST[i + 1])));
        prev = P[i][0];
      }
      area = el('path', { fill: 'rgba(50,219,184,.16)' });
      d = '';
      for (var x = 0.82; x <= 41.75; x += 0.5) d += (d ? 'L' : 'M') + X(x).toFixed(1) + ' ' + Y(f(x)).toFixed(1);
      d += 'L' + X(41.75).toFixed(1) + ' ' + Y(5).toFixed(1);
      el('path', { d: d, fill: 'none', stroke: '#32dbb8', 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      el('path', { d: 'M' + X(41.75) + ' ' + Y(5) + 'L' + X(45) + ' ' + Y(5), fill: 'none', stroke: '#32dbb8', 'stroke-width': 3, 'stroke-dasharray': '2 7', 'stroke-linecap': 'round', opacity: .7 });
      el('text', { x: X(43.6), y: Y(5) - 10, 'text-anchor': 'middle', style: 'font-weight:700;font-size:15px' }, '?');
      P.forEach(function (p) { el('circle', { cx: X(p[0]), cy: Y(p[1]), r: 4, fill: '#101214', stroke: '#32dbb8', 'stroke-width': 2 }); });
      drop = el('line', { stroke: '#f4f2ed', 'stroke-width': 1.5, opacity: .5 });
      dot = el('circle', { r: 8, fill: '#f4f2ed', stroke: '#101214', 'stroke-width': 3 });
      labelY = el('text', { x: 12, y: T + (H - B - T) / 2, 'text-anchor': 'middle', transform: 'rotate(-90 12 ' + (T + (H - B - T) / 2) + ')' }, t('dose.y'));
      render();
    }
    function render() {
      var n = +$('#doseRange').value, k = tier(n), y = n > 41.75 ? 5 : f(n);
      $('#doseNum').textContent = n;
      $('#doseName').textContent = t('dose.t' + k + '.name');
      $('#doseText').innerHTML = COST[k] ? t('dose.cost', { n: fmt(COST[k]) }) : t('dose.t' + k + '.text');
      dot.setAttribute('cx', X(n)); dot.setAttribute('cy', Y(y));
      drop.setAttribute('x1', X(n)); drop.setAttribute('x2', X(n)); drop.setAttribute('y1', Y(y)); drop.setAttribute('y2', H - B);
      var d = 'M' + X(0.82).toFixed(1) + ' ' + Y(0);
      for (var x = 0.82; x < Math.min(n, 41.75); x += 0.5) d += 'L' + X(x).toFixed(1) + ' ' + Y(f(x)).toFixed(1);
      d += 'L' + X(n).toFixed(1) + ' ' + Y(y).toFixed(1) + 'L' + X(n).toFixed(1) + ' ' + Y(0) + 'Z';
      area.setAttribute('d', n > 0.82 ? d : '');
      $('#doseRange').setAttribute('aria-valuetext', n + ' ' + t('dose.unit') + ': ' + t('dose.t' + k + '.name'));
    }
    $('#doseRange').addEventListener('input', render);
    onLang.push(build);
    window.addEventListener('resize', function () { if ((svg.parentNode.clientWidth || 0) !== lastW) build(); });
  })();

  /* ---------- strength check: the app's own norms (van den Hoek et al. 2024) ---------- */
  (function () {
    if (!$('#stForm')) return;
    var N = { m: { squat: [1.75, 2.28, 2.83], bench: [1.19, 1.56, 1.95], deadlift: [2.03, 2.63, 3.25] },
              f: { squat: [1.23, 1.72, 2.26], bench: [0.67, 0.96, 1.35], deadlift: [1.49, 2.06, 2.66] } };
    var form = $('#stForm'), LV = ['st.p10', 'st.p50', 'st.p90'], SH = ['st.p10s', 'st.p50s', 'st.p90s'];
    function num(v, d) { var s = v.toFixed(d); return lang === 'el' ? s.replace('.', ',') : s; }
    function val(id) { return parseFloat(String($(id).value).replace(',', '.')); }
    function calc() {
      var lift = (form.querySelector('input[name=lift]:checked') || {}).value || 'bench';
      var sex = (form.querySelector('input[name=sex]:checked') || {}).value || 'm';
      var bw = val('#stBw'), load = val('#stLoad'), reps = Math.round(val('#stReps'));
      var n = N[sex][lift], max = n[2] * 1.18;
      $$('#stScale .mk').forEach(function (m, k) {
        m.style.left = (n[k] / max * 100) + '%';
        m.querySelector('b').textContent = num(n[k], 2) + '×';
        m.querySelector('em').textContent = t(SH[k]);
      });
      if (!(bw >= 30 && bw <= 250) || !(load > 0 && load <= 600) || !(reps >= 1 && reps <= 10)) {
        $('#stMax').textContent = '–'; $('#stRatio').textContent = '–'; $('#stText').innerHTML = t('st.invalid');
        $('#stYou').style.left = '0%'; $('#stFill').style.width = '0%'; return;
      }
      var e1 = reps === 1 ? load : load * (1 + reps / 30), r = e1 / bw;
      $('#stMax').textContent = num(e1, 0); $('#stRatio').textContent = num(r, 2);
      var pos = Math.min(100, r / max * 100);
      $('#stYou').style.left = pos + '%'; $('#stFill').style.width = pos + '%';
      var k = r >= n[2] ? 3 : r >= n[1] ? 2 : r >= n[0] ? 1 : 0;
      var need = k < 3 ? Math.max(0.5, Math.ceil((n[k] * bw - e1) * 2) / 2) : 0;
      var needTxt = num(need, need % 1 ? 1 : 0);
      $('#stText').innerHTML = k === 0 ? t('st.below', { kg: needTxt, next: t(LV[0]) })
        : k === 3 ? t('st.top', { level: t(LV[2]) })
        : t('st.at', { level: t(LV[k - 1]), kg: needTxt, next: t(LV[k]) });
    }
    form.addEventListener('input', calc);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    onLang.push(calc);
  })();

  /* ---------- evidence cards ---------- */
  $$('.ev button').forEach(function (b) {
    b.addEventListener('click', function () { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); });
  });

  /* ---------- journey: a plate for every milestone ---------- */
  (function () {
    if (!$('#jr')) return;
    var jr = $('#jr'), miles = $$('.miles li', jr), plates = $$('.pl', jr);
    if (reduce) return;
    jr.classList.add('live');
    var ticking = false;
    function upd() {
      ticking = false;
      var line = window.innerHeight * 0.72, count = 0;
      miles.forEach(function (li) { if (li.getBoundingClientRect().top < line) count++; });
      miles.forEach(function (li, k) { li.classList.toggle('on', k < count); });
      plates.forEach(function (p, k) { p.classList.toggle('on', k < count); });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    window.addEventListener('resize', upd);
    upd();
  })();

  /* ---------- bottom bar: after the hero, until the last call ---------- */
  (function () {
    var dock = $('#dock'), hero = $('.hero'), get = $('#get'), pastHero = false, atGet = false;
    if (!hero || !get) { dock.classList.add('on'); return; }
    if (!('IntersectionObserver' in window)) return;
    function upd() { dock.classList.toggle('on', pastHero && !atGet); }
    new IntersectionObserver(function (e) { pastHero = !e[0].isIntersecting; upd(); }).observe(hero);
    new IntersectionObserver(function (e) { atGet = e[0].isIntersecting; upd(); }, { threshold: 0.2 }).observe(get);
  })();

  /* ---------- two views: the home page and the research page ---------- */
  (function () {
    var home = $('#viewHome'), res = $('#viewResearch');
    if (!home || !res) return;
    function route() {
      var r = location.hash === '#research', was = !res.hidden;
      home.hidden = r; res.hidden = !r;
      function jump(y) { try { window.scrollTo({ top: y, behavior: 'instant' }); } catch (e) { window.scrollTo(0, y); } }
      if (r) { jump(0); return; }
      if (was) {
        var el = location.hash.length > 1 && document.getElementById(location.hash.slice(1));
        if (el) jump(el.getBoundingClientRect().top + window.pageYOffset - 56); else jump(0);
        window.dispatchEvent(new Event('resize'));
      }
    }
    window.addEventListener('hashchange', route);
    route();
  })();

  /* ---------- first language: a remembered choice, else the phone's ---------- */
  var first = null;
  try { first = localStorage.getItem('kLang'); } catch (e) {}
  if (K.fixed) first = K.lang;
  if (first !== 'el' && first !== 'en') first = (navigator.language || '').toLowerCase().indexOf('el') === 0 ? 'el' : 'en';
  setLang(first, false);
})();
