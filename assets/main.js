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
  var h = location.hash.slice(1), pre = h && document.querySelector('.filters button[data-f="' + h + '"]');
  if (pre) pre.click();
});
