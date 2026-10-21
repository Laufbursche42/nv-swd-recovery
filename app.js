'use strict';
// SWD-recovery shell. Same i18n/theme/language mechanics as the other Laufbursche tools
// (shared localStorage keys), plus client-side detect + assemble of the IAP+app image.
(function () {
  var BUILD = 'v1';
  var IAP_URL = 'assets/navee_02831_iap.bin';
  var IAP_SIZE = 0x3000, OTA_HEADER = 0x100;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var SK = { lang: 'lbwp.lang', theme: 'lbwp.theme' };   // shared with the other LB tools

  var state = { lang: 'de', resKey: 'resIdle', resCls: '', resVars: null };
  var blobUrl = null, dlName = '';

  // official NAVEE controller images (02831 family). name, version, external url.
  var FW = [
    ['NT5 Max (9301)',  'bldc 0.0.0.6', 'https://myusnavee.s3.amazonaws.com/2026/06/19/4cc6b951eb134f61b52b39a3e778f304.bin'],
    ['NT3 Pro (12401)', 'bldc 0.0.0.7', 'https://myusnavee.s3.amazonaws.com/2026/06/26/417600b41e12436d90c1357c8c2bead6.bin'],
    ['ST3 Pro (12501)', 'bldc 0.0.2.0', 'https://myusnavee.s3.amazonaws.com/2026/07/23/3d14a05646914dbaa2dcb1ec7d99d5b6.bin'],
    ['ST3 Pro (3801)',  'bldc 0.0.2.0', 'https://myusnavee.s3.amazonaws.com/2026/07/23/f8b684cb472a4b199e621869a9ee5d5e.bin'],
    ['GT3 Pro (12601)', 'bldc 0.0.1.7', 'https://myusnavee.s3.amazonaws.com/2026/06/30/e341ce70c12e4cc2a30d6f80a0425fdc.bin'],
    ['GT3 Pro (3401)',  'bldc 0.0.1.7', 'https://myusnavee.s3.amazonaws.com/2026/06/30/7860029c832e4a5484e3833ee9b11aae.bin'],
    ['GT3 (3501)',      'bldc 0.0.1.1', 'https://myusnavee.s3.amazonaws.com/2025/09/01/c17f7c77c4c245dabec9d00bced37717.bin'],
    ['GT3 Max (3601)',  'bldc 0.0.1.1', 'https://myusnavee.s3.amazonaws.com/2025/09/01/07f3246ce4854df7a0799495969c6795.bin'],
    ['ST3 (3701)',      'bldc 0.0.1.1', 'https://myusnavee.s3.amazonaws.com/2025/09/01/f45e6237f7e24d3ab88efd038632f919.bin']
  ];

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  // ---- i18n ----------------------------------------------------------------
  function dict() { return (window.UI_I18N && window.UI_I18N[state.lang]) || {}; }
  function t(key) { var d = dict(); if (d[key] != null) return d[key]; var en = (window.UI_I18N && window.UI_I18N.en) || {}; return en[key] != null ? en[key] : key; }
  function applyStaticI18n(root) {
    $$('[data-t]', root).forEach(function (e) {
      var v = t(e.getAttribute('data-t'));
      if (/[<&]/.test(v)) e.innerHTML = v; else e.textContent = v;   // scan-ok: our own i18n table (trusted, developer-authored)
    });
  }

  // ---- theme / language ----------------------------------------------------
  function applyTheme(theme) {
    if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
    else document.documentElement.removeAttribute('data-theme');
    var b = $('#btn-theme'); if (b) b.innerHTML = theme === 'light' ? '&#9789;' : '&#9728;';   // scan-ok: literal icon entity
  }
  function toggleTheme() { var now = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light'; LS.set(SK.theme, now); applyTheme(now); }
  function setLang(lang) {
    if (!window.UI_I18N || !window.UI_I18N[lang]) return;
    state.lang = lang; LS.set(SK.lang, lang); document.documentElement.setAttribute('lang', lang);
    $$('#langs button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)); });
    refreshUI();
  }
  function refreshUI() {
    applyStaticI18n(document);
    renderFw();
    showResult(state.resKey, state.resCls, state.resVars);
    var e = $('#build-ver'); if (e) e.textContent = t('buildLabel') + ' ' + BUILD;
  }

  // ---- firmware list -------------------------------------------------------
  function renderFw() {
    var wrap = $('#fw-list'); if (!wrap) return;
    wrap.innerHTML = '';   // scan-ok: clears the element
    FW.forEach(function (row) {
      var r = el('div', 'dl-file');
      var info = el('div', 'dl-file-info');
      info.appendChild(el('div', 'dl-file-label', row[0]));
      info.appendChild(el('div', 'dl-file-meta', row[1]));
      var a = el('a', 'get', t('getBtn'));
      a.href = row[2]; a.target = '_blank'; a.rel = 'noopener';
      r.appendChild(info); r.appendChild(a);
      wrap.appendChild(r);
    });
  }

  // ---- result line ---------------------------------------------------------
  function showResult(key, cls, vars) {
    state.resKey = key; state.resCls = cls || ''; state.resVars = vars || null;
    var e = $('#result'); if (!e) return;
    var s = t(key);
    if (vars) { Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); }); }
    e.textContent = s;
    e.className = 'hint' + (cls ? ' ' + cls : '');
  }
  function setDownload(name) {
    dlName = name; var b = $('#dl'); if (b) b.hidden = !name;
  }

  // ---- detect + assemble ---------------------------------------------------
  function at(u8, off, s) { if (u8.length < off + s.length) return false; for (var i = 0; i < s.length; i++) if (u8[off + i] !== s.charCodeAt(i)) return false; return true; }
  function detect(u8) {
    // Only an 02831 controller image is safe to assemble, keyed on its magic at raw-OTA
    // offset 0x90. Anything else (meter/display, 3553G, other SZMC) is refused.
    if (at(u8, 0x90, 'SZMC-ES-ZM-02831')) return 'ctrl02831';
    if (at(u8, 0x90, 'SZMC-ES-ZM-3553G')) return 'ctrl3553g';
    if (at(u8, 0x90, 'SZMC-ES-ZM-'))      return 'ctrlother';
    return 'notctrl';
  }

  function onFile(ev) {
    setDownload('');
    if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
    var f = ev.target.files && ev.target.files[0]; if (!f) { showResult('resIdle', ''); return; }
    var r = new FileReader();
    r.onload = function () {
      var u8;
      try { u8 = new Uint8Array(r.result); } catch (e) { showResult('resReadErr', 'err'); return; }
      var kind = detect(u8);
      if (kind === 'notctrl')  { showResult('resNotCtrl', 'err'); return; }
      if (kind === 'ctrl3553g'){ showResult('res3553g', 'err'); return; }
      if (kind === 'ctrlother'){ showResult('resOther', 'err'); return; }
      if (kind !== 'ctrl02831'){ showResult('resUnknown', 'err'); return; }
      if (u8.length <= OTA_HEADER) { showResult('resTooSmall', 'err'); return; }
      fetch(IAP_URL + '?v=' + BUILD, { cache: 'no-cache' }).then(function (rp) { return rp.arrayBuffer(); }).then(function (ab) {
        var iap = new Uint8Array(ab);
        if (iap.length !== IAP_SIZE) { showResult('resIapSize', 'err'); return; }
        var body = u8.subarray(OTA_HEADER);
        var out = new Uint8Array(IAP_SIZE + body.length);
        out.set(iap, 0); out.set(body, IAP_SIZE);
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        blobUrl = URL.createObjectURL(new Blob([out], { type: 'application/octet-stream' }));
        setDownload((f.name.replace(/\.bin$/i, '') || 'controller') + '_SWD_IAP+APP.bin');
        showResult('resOk', 'ok', { len: out.length, hex: out.length.toString(16) });
      }).catch(function () { showResult('resIapFail', 'err'); });
    };
    r.onerror = function () { showResult('resReadErr', 'err'); };
    r.readAsArrayBuffer(f);
  }

  function triggerDownload() {
    if (!blobUrl) return;
    var a = el('a'); a.href = blobUrl; a.download = dlName || 'controller_SWD_IAP+APP.bin';
    document.body.appendChild(a); a.click(); a.remove();
  }

  // ---- docs (render Markdown in-page) --------------------------------------
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  // inlineMd receives ALREADY-escaped text (mdToHtml escapes first), so it only adds our own markup.
  function inlineMd(s) {
    return s
      .replace(/`([^`]+)`/g, function (m, c) { return '<code>' + c + '</code>'; })
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, txt, url) {
        if (/^#[A-Z][A-Z0-9]*$/.test(url)) return '<a href="#" data-doc="' + url.slice(1) + '">' + txt + '</a>';   // cross-doc link (#LICENSE) opens in the viewer
        return '<a href="' + url + '" target="_blank" rel="noopener">' + txt + '</a>';
      });
  }
  // Small Markdown renderer: fenced code, headings, hr, GFM tables, blockquotes (recursive), lists.
  function mdToHtml(md) {
    var codeBlocks = [];
    md = String(md).replace(/```[^\n]*\n?([\s\S]*?)```/g, function (m, code) { var i = codeBlocks.length; codeBlocks.push('<pre><code>' + esc(code.replace(/\n$/, '')) + '</code></pre>'); return '\x00CB' + i + '\x00'; });
    var lines = md.split(/\r?\n/), out = [], para = [], list = null;
    function flushPara() { if (para.length) { out.push('<p>' + inlineMd(esc(para.join(' '))) + '</p>'); para = []; } }
    function flushList() { if (list) { out.push('<' + list.type + '>' + list.items.join('') + '</' + list.type + '>'); list = null; } }
    function isTableSep(s) { var tt = s.replace(/\s/g, ''); return /^\|?:?-+:?(\|:?-+:?)+\|?$/.test(tt); }
    function splitRow(s) { return s.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(function (c) { return c.trim(); }); }
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      var cb = ln.match(/^\x00CB(\d+)\x00$/);
      if (cb) { flushPara(); flushList(); out.push(codeBlocks[Number(cb[1])]); continue; }
      if (/^\s*$/.test(ln)) { flushPara(); flushList(); continue; }
      var h = ln.match(/^(#{1,6})\s+(.*)$/);
      if (h) { flushPara(); flushList(); var lvl = Math.min(h[1].length, 4); out.push('<h' + lvl + '>' + inlineMd(esc(h[2])) + '</h' + lvl + '>'); continue; }
      if (/^---+$/.test(ln.trim())) { flushPara(); flushList(); out.push('<hr>'); continue; }
      if (ln.indexOf('|') >= 0 && i + 1 < lines.length && isTableSep(lines[i + 1])) {
        flushPara(); flushList();
        var head = splitRow(ln); i++;
        var tbody = '';
        while (i + 1 < lines.length && lines[i + 1].indexOf('|') >= 0 && lines[i + 1].trim() !== '') {
          tbody += '<tr>' + splitRow(lines[++i]).map(function (c) { return '<td>' + inlineMd(esc(c)) + '</td>'; }).join('') + '</tr>';
        }
        out.push('<table><thead><tr>' + head.map(function (c) { return '<th>' + inlineMd(esc(c)) + '</th>'; }).join('') + '</tr></thead><tbody>' + tbody + '</tbody></table>');
        continue;
      }
      if (/^\s*>/.test(ln)) {
        flushPara(); flushList();
        var q = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
        i--;
        while (q.length && /^\s*$/.test(q[0])) q.shift();
        while (q.length && /^\s*$/.test(q[q.length - 1])) q.pop();
        if (q.length) out.push('<blockquote>' + mdToHtml(q.join('\n')) + '</blockquote>');
        continue;
      }
      var ul = ln.match(/^\s*[-*]\s+(.*)$/), ol = ln.match(/^\s*\d+\.\s+(.*)$/);
      if (ul || ol) { flushPara(); var type = ul ? 'ul' : 'ol'; if (!list || list.type !== type) { flushList(); list = { type: type, items: [] }; } list.items.push('<li>' + inlineMd(esc(ul ? ul[1] : ol[1])) + '</li>'); continue; }
      para.push(ln.trim());
    }
    flushPara(); flushList();
    return out.join('\n');
  }
  var DOC_BASE = { README: 'README', CHANGELOG: 'CHANGELOG', DISCLAIMER: 'DISCLAIMER', LICENSE: 'LICENSE', PRIVACY: 'PRIVACY', TRADEMARKS: 'TRADEMARKS' };
  function candidatePaths(key) {
    var base = DOC_BASE[key] || key, paths = [];
    if (state.lang === 'de') paths.push(base + '.DE.md', base + '.de.md');   // German first, English .md as fallback
    paths.push(base + '.md');
    return paths;
  }
  function tryFetchFirst(paths) {
    var i = 0;
    function next() {
      if (i >= paths.length) return Promise.resolve(null);
      var p = paths[i++];
      return fetch(p + '?v=' + BUILD, { cache: 'no-cache' }).then(function (r) {
        if (!r.ok) return next();
        if ((r.headers.get('content-type') || '').toLowerCase().indexOf('html') >= 0) return next();
        return r.text().then(function (txt) { return /^\s*<(?:!doctype|html)\b/i.test(txt) ? next() : txt; });
      }).catch(function () { return next(); });
    }
    return next();
  }
  function openDoc(key) {
    var dlg = $('#doc'); if (!dlg) return;
    $('#doc-title').textContent = t('foot' + key.charAt(0) + key.slice(1).toLowerCase()) || key;
    var body = $('#doc-body'); body.textContent = ''; body.appendChild(el('p', 'hint', t('docLoading')));
    if (dlg.showModal) dlg.showModal();
    tryFetchFirst(candidatePaths(key)).then(function (txt) { body.innerHTML = mdToHtml(txt || ('# ' + key)); });   // scan-ok: mdToHtml escapes
  }

  // ---- boot ----------------------------------------------------------------
  function init() {
    applyTheme(LS.get(SK.theme, 'dark') === 'light' ? 'light' : 'dark');
    $('#btn-theme').addEventListener('click', toggleTheme);
    $$('#langs button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.lang); }); });
    $('#file').addEventListener('change', onFile);
    $('#dl').addEventListener('click', triggerDownload);
    // delegated: footer + step links with data-doc open the in-page Markdown viewer
    document.addEventListener('click', function (e) {
      if (!e.target.closest) return;
      var dd = e.target.closest('[data-doc]'); if (dd) { e.preventDefault(); openDoc(dd.getAttribute('data-doc')); }
    });
    var dx = $('#doc-x'); if (dx) dx.addEventListener('click', function () { $('#doc').close(); });
    var dc = $('#doc-close'); if (dc) dc.addEventListener('click', function () { $('#doc').close(); });
    setLang(LS.get(SK.lang, 'de'));   // fills all i18n + renders FW list + result
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
