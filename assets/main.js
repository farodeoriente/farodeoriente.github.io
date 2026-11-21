// Faro de Oriente v2. Everything works without JS; these are enhancements.
document.addEventListener('DOMContentLoaded', function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // mobile menu
  var btn = document.querySelector('.menu-btn'), nav = document.querySelector('.mnav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    });
  }

  // close desktop mega menu with Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.activeElement && document.activeElement.closest('.nav')) document.activeElement.blur();
  });

  // WeChat QR dialog
  var dlg = document.querySelector('dialog.wx');
  document.querySelectorAll('[data-wechat]').forEach(function (el) {
    el.addEventListener('click', function (e) { if (dlg && dlg.showModal) { e.preventDefault(); dlg.showModal(); } });
  });
  if (dlg) dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.classList.contains('x')) dlg.close(); });

  // reveal on scroll
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('in'); }); }

  // count-up numbers
  var nums = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && !reduce) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, txt = el.textContent, m = txt.match(/\d+/g);
        co.unobserve(el);
        if (!m) return;
        var t0 = null;
        function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min(1, (ts - t0) / 1100), e = 1 - Math.pow(1 - p, 3), i = 0;
          el.textContent = txt.replace(/\d+/g, function (d) { i++; return Math.round(+d * e); });
          if (p < 1) requestAnimationFrame(step); else el.textContent = txt;
        }
        requestAnimationFrame(step);
      });
    }, { threshold: .6 });
    nums.forEach(function (el) { co.observe(el); });
  }

  // side index highlight (home)
  var idx = document.querySelectorAll('.idx a');
  if (idx.length && 'IntersectionObserver' in window) {
    var map = {};
    idx.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          idx.forEach(function (a) { a.classList.remove('on'); });
          map[en.target.id].classList.add('on');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) so.observe(s); });
  }

  // course filters
  var fb = document.querySelectorAll('.filters button');
  fb.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-f');
      fb.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      document.querySelectorAll('.ccard').forEach(function (c) {
        c.hidden = !(f === 'all' || (' ' + c.getAttribute('data-cats') + ' ').indexOf(' ' + f + ' ') > -1);
      });
    });
  });
  // find your child's path: who -> (child) age -> Chinese at home | (adult) where
  var pf = document.querySelector('.pf-q');
  if (pf) {
    var steps = {}, out = document.querySelector('.pf-out');
    pf.querySelectorAll('fieldset').forEach(function (f) { steps[f.getAttribute('data-step')] = f; });
    var show = function (r) {
      out.querySelector('.pf-start').hidden = !!r;
      out.querySelectorAll('.pf-res').forEach(function (el) {
        var on = el.getAttribute('data-r') === r;
        if (on && el.hidden) { el.classList.remove('in-anim'); void el.offsetWidth; el.classList.add('in-anim'); }
        el.hidden = !on;
      });
    };
    pf.addEventListener('change', function () {
      var v = function (n) { var x = pf.querySelector('input[name="' + n + '"]:checked'); return x ? x.value : ''; };
      var who = v('who'), age = v('age'), home = v('home'), where = v('where'), r = '';
      steps.age.hidden = who !== 'child';
      steps.home.hidden = !(who === 'child' && age);
      steps.where.hidden = who !== 'adult';
      if (who === 'adult' && where) r = where === 'online' ? 'online' : 'adults';
      if (who === 'child' && age && home) r = home === 'yes' ? 'weekend' : (age === '59' ? 'kids' : 'youth');
      show(r);
    });
  }

  var h = location.hash.slice(1), pre = h && document.querySelector('.filters button[data-f="' + h + '"]');
  if (pre) pre.click();
});

/* scrolling itinerary: endless auto-scroll, pauses while the pointer is on it; arrows, drag, swipe */
document.querySelectorAll(".scroll-trip").forEach(function (box) {
  var tr = box.querySelector(".st-track"), prev = box.querySelector(".st-prev"), next = box.querySelector(".st-next"), bar = box.querySelector(".st-prog i");
  if (!tr) return;
  var orig = Array.prototype.slice.call(tr.children);
  orig.forEach(function (li) {  // second copy so the strip can loop without a jump
    var c = li.cloneNode(true); c.setAttribute("aria-hidden", "true"); c.classList.add("st-clone");
    c.querySelectorAll("img").forEach(function (i) { i.alt = ""; i.loading = "eager"; });
    tr.appendChild(c);
  });
  tr.classList.add("auto");
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SPEED = 38;  // px per second
  var pos = 0, last = 0, hover = false, focus = false, hold = 0, down = false, moved = false, sx = 0, sl = 0;
  function loopW() { var c = tr.querySelector(".st-clone"); return c ? c.offsetLeft - orig[0].offsetLeft : tr.scrollWidth / 2; }
  function step() { return orig[0].getBoundingClientRect().width + 22; }
  function wrap() {
    var L = loopW();
    if (tr.scrollLeft >= L) tr.scrollLeft -= L;
    else if (tr.scrollLeft <= 0 && L > 0) tr.scrollLeft += L;
  }
  function upd() {
    if (!bar) return;
    var L = loopW(), w = Math.max(10, 100 * tr.clientWidth / (L || 1));
    w = Math.min(w, 100); bar.style.width = w + "%";
    bar.style.left = ((tr.scrollLeft % L) / L) * (100 - w) + "%";
  }
  function paused() { return still || hover || focus || down || document.hidden || Date.now() < hold; }
  function tick(t) {
    var dt = last ? Math.min(t - last, 60) : 0; last = t;
    if (!paused()) {
      pos += SPEED * dt / 1000;
      var L = loopW(); if (pos >= L) pos -= L;
      tr.scrollLeft = pos;
    } else { pos = tr.scrollLeft; }
    upd();
    requestAnimationFrame(tick);
  }
  function nudge(dir) {
    hold = Date.now() + 2500;
    if (dir < 0 && tr.scrollLeft < step()) tr.scrollLeft += loopW();
    if (dir > 0 && tr.scrollLeft > loopW() - step()) tr.scrollLeft -= loopW();
    tr.scrollBy({ left: dir * step(), behavior: "smooth" });
  }
  if (prev) prev.addEventListener("click", function () { nudge(-1); });
  if (next) next.addEventListener("click", function () { nudge(1); });
  box.addEventListener("mouseenter", function () { hover = true; });
  box.addEventListener("mouseleave", function () { hover = false; });
  tr.addEventListener("focusin", function () { focus = true; });
  tr.addEventListener("focusout", function () { focus = false; });
  tr.addEventListener("touchstart", function () { hold = Date.now() + 1e9; }, { passive: true });
  tr.addEventListener("touchend", function () { hold = Date.now() + 2500; }, { passive: true });
  tr.addEventListener("scroll", function () { if (paused()) wrap(); }, { passive: true });
  tr.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") return; down = true; moved = false; sx = e.clientX; sl = tr.scrollLeft; });
  window.addEventListener("pointermove", function (e) {
    if (!down) return;
    var dx = e.clientX - sx;
    if (!moved && Math.abs(dx) > 5) { moved = true; tr.classList.add("drag"); }
    if (moved) tr.scrollLeft = sl - dx;
  });
  window.addEventListener("pointerup", function () { if (!down) return; down = false; if (moved) { tr.classList.remove("drag"); hold = Date.now() + 1500; } });
  tr.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); nudge(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); nudge(-1); }
  });
  requestAnimationFrame(tick);
});
