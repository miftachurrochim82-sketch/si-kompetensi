/* ============================================================
   compile-check.js —Verifier template Vue untuk proyek GAS ini.

   Meniru perilaku GAS HtmlService: semua `<?!= include('X'); ?>`
   di Index.html diganti isi berkas src/X.html, lalu seluruh
   template dalam DOM dikompilasi dengan @vue/compiler-dom.
   Error sintaks template (tag tak tertutup, atribut rusak, dll.)
   akan tertangkap DI SANDBOX, bukan di browser pengguna.

   Pakai:  node tools/compile-check.js
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { compile } = require('@vue/compiler-dom');

const SRC = path.join(__dirname, '..', 'src');

function read(name) {
  return fs.readFileSync(path.join(SRC, name + '.html'), 'utf8');
}

function expand(html, depth) {
  depth = depth || 0;
  if (depth > 6) return html;
  return html.replace(/<\?!=\s*include\(\s*'([A-Za-z0-9_]+)'\s*\)\s*;?\s*\?>/g, function (m, name) {
    try {
      return expand(read(name), depth + 1);
    } catch (e) {
      console.warn('  (include tidak ditemukan: ' + name + ')');
      return '';
    }
  });
}

let html = read('Index');
html = expand(html);

// ---- PEMINDAI KONTAMINASI (pelajaran 2026-09-15) ----
// Proxy keamanan jaringan bisa menyelinapkan skrip tantangan Cloudflare
// ke halaman yang disalin lewat browser. Bila ikut tersalin-tempel, ia
// terdeploy bersama aplikasi dan menimbulkan error 404/MIME di Console.
const cfHits = (html.match(/challenge-platform|__CF\$cv/g) || []).length;
if (cfHits > 0) {
  console.log('❌ KONTAMINASI TERDETEKSI: ' + cfHits + ' kemunculan skrip tantangan Cloudflare');
  console.log('   Buang baris <script> yang memuat "challenge-platform" / "__CF$cv"');
  console.log('   (biasanya baris terakhir sebelum </body>), lalu jalankan ulang.');
  process.exit(1);
}

// Buang seluruh elemen <script> dan <style>: yang kita verifikasi
// adalah sintaks TEMPLATE, bukan isi JS/CSS.
html = html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, '');
html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');

// ---- PEMINDAI SELF-CLOSING CUSTOM ELEMENT (pelajaran 2026-09-16) ----
// Kejadian nyata: <app-chart-doughnut ... /> + <app-skeleton v-else /> memicu
// error Vue compiler-30 (X_V_ELSE_NO_ADJACENT_IF) di browser produksi.
// Penyebab: parser HTML browser MENGABAIKAN "/>" pada custom element —
// <app-x /> diperlakukan sebagai <app-x> yang "menelan" elemen berikutnya,
// sehingga v-else tidak lagi bersebelahan dengan v-if. @vue/compiler-dom
// mem-parse gaya XML (/> valid) jadi TIDAK menangkapnya. Pindai manual:
const scHits = html.match(/<[a-z][a-z0-9]*-[a-z0-9-]*\b[^>]*\/>/g) || [];
if (scHits.length) {
  console.log('\u274C SELF-CLOSING CUSTOM ELEMENT (' + scHits.length + ') \u2014 tidak valid di template in-DOM:');
  scHits.slice(0, 8).forEach(function (t) { console.log('   - ' + t.slice(0, 110)); });
  console.log('   Perbaiki: tulis <app-x ...></app-x> bukan <app-x ... />');
  process.exit(1);
}

// ---- PEMINDAI PREFIKS RESERVED `_` DI TEMPLATE (pelajaran 2026-09-16 #2) ----
// Kejadian nyata: v-if="!_dashboardLoading" → ReferenceError di produksi.
// Template in-DOM dikompilasi dengan with(this); proxy Vue MENYEMBUNYIKAN
// identifier berawalan `_`/`$` (dicadangkan internal) dari resolusi with,
// padahal this._x di kode JS biasa tetap jalan. Jembatani lewat computed
// tanpa underscore. Pindai atribut dinamis + mustache:
(function () {
  const vals = [];
  html.replace(/\s(v-[\w:-]+|[:@][\w.:-]+)="([^"]*)"/g, function (m, a, v) { vals.push([a, v]); return m; });
  html.replace(/\{\{([^}]*)\}\}/g, function (m, v) { vals.push(['{{ }}', v]); return m; });
  const bad = [];
  vals.forEach(function (p) {
    const m = p[1].match(/(^|[^.\w$'"])(_[A-Za-z]\w*)/);
    if (m) bad.push(p[0] + ' \u2192 ' + m[2]);
  });
  if (bad.length) {
    console.log('\u274C PREFIKS RESERVED `_` DI TEMPLATE (' + bad.length + ') \u2014 tidak bisa diakses via with(this):');
    bad.slice(0, 8).forEach(function (b) { console.log('   - ' + b); });
    console.log('   Perbaiki: buat computed/method tanpa underscore sebagai jembatan.');
    process.exit(1);
  }
})();

// GAS expressions `<?= ... ?>` jadi teks biasa: aman untuk compiler.
const errors = [];
try {
  const result = compile(html, { onError: function (e) { errors.push(e.message); } });
  if (!result || typeof result.code !== 'string') errors.push('compile() tidak menghasilkan code');
} catch (e) {
  errors.push(e.message);
}

if (errors.length) {
  console.log('❌ TEMPLATE BERMASALAH (' + errors.length + ' error):');
  errors.slice(0, 12).forEach(function (e) { console.log('   - ' + e); });
  process.exit(1);
} else {
  const appModal = (html.match(/<app-modal/g) || []).length;
  const shells = (html.match(/class="fixed inset-0 z-50/g) || []).length;
  console.log('✅ TEMPLATE KOMPILASI BERES tanpa error');
  console.log('   <app-modal> terpakai : ' + appModal);
  console.log('   shell modal manual   : ' + shells);
  process.exit(0);
}
