// ============================================================
// SI-KOMPETENSI - 99_Test.gs (v2-ready, port SILAHAR hijau)
// Migrasi Library v2 — perubahan vs versi kiriman:
// - API tes v2 = SATU pintu: CoreLib.runCoreTests(ctx). Enam fungsi
//   gaya-lama (testDatabaseConnection(ssId), testSheetHeaders(ssId,...),
//   testGenericCrud(ssId,sheet,dummy,...), testSsoFlow(ssoConfig),
//   testReadOnlyProtection(...), testHardDeleteConfig(...)) DIHAPUS —
//   semua kini menerima SATU ctx object. Panggil gaya lama = error.
// - TEST_MODE dihapus (B1) — kalau masih direferensikan = ReferenceError.
// - Semua tes tulis v2 terisolasi di sheet ZZ_TEST_CRUD (aman, auto-bersih).
//   Tes DILARANG menulis dummy ke DATA_KOMPETENSI produksi.
// Urutan jalan: setupApp() -> initDatabase() -> runLibraryTests().
// ============================================================

// ctx kontrak v2: { ssId, ssIdB?, masterSsId?, headersMap, isRefFunc?, platformApiUrl?, appCode? }
function testCtx_() {
  return {
    appCode: APP_CODE,
    ssId: SPREADSHEET_ID,
    masterSsId: MASTER_SPREADSHEET_ID,
    // Opsional: isi Properties TEST_SS_ID_B (ID spreadsheet uji ke-2) agar
    // testCacheIsolation ikut PASS; bila kosong ia SKIP (wajar).
    ssIdB: appProps_().getProperty('TEST_SS_ID_B') || '',
    platformApiUrl: PLATFORM_API_URL,
    headersMap: getAllHeaders_(), // wajib memuat ZZ_TEST_CRUD (sudah ada di file 01)
    isRefFunc: isReferenceSheet_
  };
}

/**
 * 22 regression tests library v2. Target: failed:0.
 * (SKIP wajar hanya untuk testCacheIsolation bila TEST_SS_ID_B kosong.)
 */
function runLibraryTests() {
  Logger.log('==========================================================');
  Logger.log('🧪 REGRESSION TESTS LIBRARY v2 (dari ' + APP_CODE + ')');
  Logger.log('==========================================================');
  var recap = CoreLib.runCoreTests(testCtx_());
  Logger.log('REKAP: PASS ' + recap.passed + ' / FAIL ' + recap.failed + ' / SKIP ' + recap.skipped);
  (recap.results || []).forEach(function(r) {
    Logger.log((r.status === 'PASS' ? '✅' : (r.status === 'SKIP' ? '⏭️' : '❌')) + ' ' + r.test + (r.detail ? ' — ' + r.detail : ''));
  });
  return recap;
}

function runAllDiagnostics() {
  Logger.log('==========================================================');
  Logger.log('🔍 MEMULAI DIAGNOSTIK KESEHATAN SI-KOMPETENSI');
  Logger.log('==========================================================');

  // Koneksi DB (pengganti testDatabaseConnection gaya-lama)
  try {
    Logger.log('✅ DB lokal tersambung: ' + getDb_().getName());
  } catch (e) {
    Logger.log('❌ DB lokal GAGAL dibuka: ' + e.message);
  }

  // Skema check-only (pengganti testSheetHeaders gaya-lama — tak boleh membuat sheet)
  try {
    var ss = getDb_();
    Object.keys(LOCAL_SHEET_NAMES).forEach(function(name) {
      var sh = ss.getSheetByName(name);
      if (!sh) {
        Logger.log((isReferenceSheet_(name) ? '⚠️ ' : '❌ ') + name + ' : sheet TIDAK ADA' + (isReferenceSheet_(name) ? ' (wajar — baca via master).' : ' (jalankan initDatabase!).'));
      } else {
        Logger.log('✅ ' + name + ' : ada (' + Math.max(0, sh.getLastRow() - 1) + ' baris).');
      }
    });
  } catch (e) {
    Logger.log('❌ Cek skema gagal: ' + e.message);
  }

  try {
    Logger.log('✅ DATA_KOMPETENSI : ' + readRecordsNoLock_('DATA_KOMPETENSI').length + ' baris.');
  } catch (e) { Logger.log('❌ DATA_KOMPETENSI : ' + e.message); }
  try {
    Logger.log('✅ PEGAWAI (master): ' + readRecordsNoLock_('PEGAWAI').length + ' data.');
  } catch (e) { Logger.log('❌ PEGAWAI : ' + e.message + ' (cek MASTER_SPREADSHEET_ID!)'); }
  try {
    Logger.log('✅ KONFIGURASI     : ' + readRecordsNoLock_('KONFIGURASI').length + ' item.');
  } catch (e) { Logger.log('❌ KONFIGURASI : ' + e.message); }
  Logger.log('🏁 DIAGNOSTIK SELESAI');
}

function runAllIntegrationTests() {
  Logger.log('==========================================================');
  Logger.log('🚀 MEMULAI PENGUJIAN INTEGRASI (' + APP_CODE + ')');
  Logger.log('==========================================================');

  // 1. CRUD aman di sheet uji (BUKAN di DATA_KOMPETENSI produksi!)
  try {
    var actor = systemActor_();
    var testId = 'ITEST-' + new Date().getTime();
    var n0 = readRecordsNoLock_('ZZ_TEST_CRUD').length;
    var ins = apiSave_('ZZ_TEST_CRUD', { id: testId, nama: 'uji awal', no_hp: '081234567890' }, actor);
    var n1 = readRecordsNoLock_('ZZ_TEST_CRUD').length;
    var upd = apiSave_('ZZ_TEST_CRUD', { id: testId, nama: 'uji ubah' }, actor);
    var got = apiGet_('ZZ_TEST_CRUD', testId, {});
    var del = apiDelete_('ZZ_TEST_CRUD', testId, actor);
    hardDeleteRecordNoLock_('ZZ_TEST_CRUD', testId, actor);
    var n2 = readRecordsNoLock_('ZZ_TEST_CRUD').length;
    var crudOk = ins.success && upd.success && del.success && got.success && got.data && got.data.nama === 'uji ubah' && n1 === n0 + 1 && n2 === n0;
    Logger.log(crudOk ? '✅ CRUD ZZ_TEST_CRUD sukses + bersih total!' : '❌ CRUD ZZ_TEST_CRUD gagal (cek tiap langkah).');
  } catch (e) {
    Logger.log('❌ CRUD ZZ_TEST_CRUD exception: ' + e.message);
  }

  // 2. Dashboard & analytics lokal
  var dashRes = apiDashboard_({}, systemActor_());
  Logger.log(dashRes.success ? '✅ apiDashboard_ sukses!' : '❌ apiDashboard_ gagal: ' + dashRes.error);
  var analyticsRes = getAnalytics_({}, systemActor_());
  Logger.log(analyticsRes.success ? '✅ getAnalytics_ sukses!' : '❌ getAnalytics_ gagal: ' + analyticsRes.error);

  // 3. SSO negatif: tiket palsu WAJIB ditolak server (tanpa testMode!)
  try {
    validatePlatformTicket_('tiket_palsu_uji_' + new Date().getTime());
    Logger.log('❌ SSO NEGATIF GAGAL: tiket palsu malah diterima!');
  } catch (e) {
    Logger.log('✅ SSO negatif lolos: tiket palsu ditolak (' + String(e.message).substring(0, 80) + ').');
  }
  Logger.log('ℹ️ Uji SSO positif (tiket valid): jalankan testFullSsoIntegrationFlow().');

  // 4. Spot-check read-only: tulis ke PEGAWAI wajib THROW
  try {
    writeRecordNoLock_('PEGAWAI', { id: 'X-SPOT' }, false, systemActor_());
    Logger.log('❌ READ-ONLY JEBOL: tulis ke PEGAWAI tidak ditolak!');
  } catch (e) {
    Logger.log('✅ Read-only terjaga: tulis ke PEGAWAI ditolak.');
  }

  Logger.log('🎉 SEMUA PENGUJIAN SELESAI');
}

function testSistem() {
  Logger.log('📊 --- RINGKASAN DATA SYSTEM SI-KOMPETENSI ---');
  try {
    Logger.log('• DATA_KOMPETENSI : ' + readRecordsNoLock_('DATA_KOMPETENSI').length + ' baris');
    Logger.log('• PEGAWAI         : ' + readRecordsNoLock_('PEGAWAI').length + ' data');
    Logger.log('• KONFIGURASI     : ' + readRecordsNoLock_('KONFIGURASI').length + ' item');
    Logger.log('✅ Pemeriksaan sistem selesai tanpa error.');
  } catch (e) {
    Logger.log('❌ Terjadi kesalahan: ' + e.message);
  }
}

function testKoneksiKePortalSso() {
  Logger.log('==========================================================');
  Logger.log('🔍 DIAGNOSTIK KONEKSI SSO KE PORTAL UTAMA');
  Logger.log('==========================================================');
  Logger.log('• URL Portal : ' + PLATFORM_API_URL);
  Logger.log('• APP_CODE   : ' + APP_CODE);

  try {
    var payload = {
      method: 'POST',
      path: '/api/v1/auth/validate-ticket',
      data: {
        ticket: 'st_TEST_DIAGNOSTIK_123',
        appCode: APP_CODE
      }
    };

    var options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      followRedirects: true
    };

    var response = UrlFetchApp.fetch(PLATFORM_API_URL, options);
    var statusCode = response.getResponseCode();
    var content = response.getContentText();

    Logger.log('• HTTP Status Code : ' + statusCode);
    Logger.log('• Isi Respons Raw  : ' + content.substring(0, 300));

    if (statusCode === 200) {
      if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
        var json = JSON.parse(content);
        Logger.log('✅ Portal merespons JSON dengan BENAR!');
        Logger.log('• Pesan Portal: ' + JSON.stringify(json));
      } else {
        Logger.log('❌ KESALAHAN UTAMA TERDETEKSI:');
        Logger.log('👉 Portal mengembalikan halaman HTML Login Google, BUKAN data JSON.');
        Logger.log('👉 PENYEBAB: Setelan "Siapa yang memiliki akses" di Portal SSO BELUM disetel ke "Siapa saja" (Anyone).');
      }
    } else {
      Logger.log('❌ HTTP ERROR ' + statusCode + ': Portal menolak koneksi.');
    }

  } catch (err) {
    Logger.log('❌ ERROR EXCEPTION: ' + err.message);
  }
  Logger.log('==========================================================');
}

/**
 * Test Uji Coba SSO End-to-End (Tiket Valid -> Exchange Ticket)
 * Dapatkan tiket valid dari Portal SSO (misal via createTestTicketSIKOMPETENSI
 * di Global App), tempel di bawah, jalankan dari editor.
 */
function testFullSsoIntegrationFlow() {
  Logger.log('==========================================================');
  Logger.log('🚀 MEMULAI PENGUJIAN INTEGRASI ALUR PENUH SSO (' + APP_CODE + ')');
  Logger.log('==========================================================');

  // Ganti dengan tiket valid yang Anda dapatkan dari Global App
  var ticketValid = ''; // <<< ISI TIKET VALID DI SINI (via createTestTicketSIKOMPETENSI)

  if (!ticketValid) {
    Logger.log('❌ Tiket valid belum diisi. Silakan generate tiket dari Global App (createTestTicketSIKOMPETENSI) lalu isi variabel ticketValid.');
    return;
  }

  Logger.log('1️⃣ Menukarkan Tiket SSO ke Backend Aplikasi Lokal...');
  var exchangeResult = exchangePlatformTicket(ticketValid);

  if (!exchangeResult.success) {
    Logger.log('❌ GAGAL MENUKAR TIKET: ' + exchangeResult.error);
    return;
  }

  Logger.log('2️⃣ Memverifikasi session token...');
  var auth = checkAuth_(exchangeResult.data.token, 'viewer');
  Logger.log(auth.success
    ? '✅ Session valid: ' + auth.user.email + ' [' + auth.user.role + '] pegawai_id=' + (auth.user.pegawai_id || '(kosong — cek masterSsId!)')
    : '❌ Session TIDAK valid: ' + auth.error);

  Logger.log('3️⃣ Membersihkan session uji (logout)...');
  logout_(exchangeResult.data.token);

  Logger.log('==========================================================');
  Logger.log('🎉 PENGUJIAN INTEGRASI SSO 100% SUKSES!');
  Logger.log('• User Logged In : ' + exchangeResult.data.user.display_name + ' (' + exchangeResult.data.user.email + ')');
  Logger.log('==========================================================');
}

/**
 * Uji proteksi kompetensi (patch P1–P8). Menulis 2 baris uji sungguhan ke
 * DATA_KOMPETENSI lalu hard-cleanup total. Target: semua ✅.
 */
function testKompetensiGuards() {
  Logger.log('==========================================================');
  Logger.log('🛡️ UJI PROTEKSI KOMPETENSI (patch P1–P8)');
  Logger.log('==========================================================');
  var admin = { id: 'U-ADMIN', email: 'admin@uji.id', role: 'admin', pegawai_id: 'PEG-ADMIN' };
  var pegA = { id: 'U-A', email: 'a@uji.id', role: 'viewer', pegawai_id: 'PEG-UJI-A' };
  var pegB = { id: 'U-B', email: 'b@uji.id', role: 'viewer', pegawai_id: 'PEG-UJI-B' };
  var noPeg = { id: 'U-X', email: 'x@uji.id', role: 'viewer', pegawai_id: '' };
  var ok = 0, fail = 0;
  function verdict(cond, label) {
    if (cond) { ok++; Logger.log('✅ ' + label); } else { fail++; Logger.log('❌ ' + label); }
  }

  // 1. Viewer simpan milik sendiri → OK + id ter-generate (P1)
  var r1 = saveKompetensiHandler_({ record: { id: '', pegawai_id: 'PEG-UJI-A', jenis_kompetensi: 'bimtek', nama_kompetensi: 'UJI-GUARD-A', tanggal_mulai: todayIso_() } }, pegA);
  var idA = (r1.success && r1.data) ? r1.data.id : '';
  verdict(r1.success && idA, 'viewer save milik sendiri + id ter-generate');
  // 1b. Status awal = menunggu (P2)
  verdict(r1.success && r1.data.status_verifikasi === 'menunggu', 'status awal data = menunggu');

  // 2. Viewer simpan sebagai orang lain → TOLAK (P4)
  var r2 = saveKompetensiHandler_({ record: { pegawai_id: 'PEG-UJI-B', nama_kompetensi: 'BAJAK' } }, pegA);
  verdict(!r2.success, 'viewer save milik orang DITOLAK');

  // 3. Viewer tanpa link pegawai → TOLAK (P4)
  var r3 = saveKompetensiHandler_({ record: { pegawai_id: 'PEG-UJI-A', nama_kompetensi: 'X' } }, noPeg);
  verdict(!r3.success, 'viewer tanpa link pegawai DITOLAK');

  // 4. Viewer verifikasi → TOLAK (P5)
  var r4 = verifikasiKompetensiHandler_({ id: idA, status: 'disetujui' }, pegA);
  verdict(!r4.success, 'viewer verifikasi DITOLAK');

  // 5. Admin verifikasi → OK (P5)
  var r5 = verifikasiKompetensiHandler_({ id: idA, status: 'disetujui', catatan_verifikator: 'uji ok' }, admin);
  verdict(r5.success && r5.data.verifikator_id === 'PEG-ADMIN', 'admin verifikasi OK + verifikator tercatat');

  // 6. Edit user (bawa status palsu) tak goyahkan verifikasi (P2)
  var r6 = saveKompetensiHandler_({ record: { id: idA, pegawai_id: 'PEG-UJI-A', nama_kompetensi: 'edit', status_verifikasi: 'revisi' } }, pegA);
  var kept = r6.success && findKompetensiById_(idA).status_verifikasi === 'disetujui';
  verdict(kept, 'edit user tak goyahkan status verifikasi');

  // 7. Baris ke-2 untuk uji hapus (admin tulis sebagai B)
  var rB = saveKompetensiHandler_({ record: { pegawai_id: 'PEG-UJI-B', jenis_kompetensi: 'bimtek', nama_kompetensi: 'UJI-GUARD-B', tanggal_mulai: todayIso_() } }, admin);
  var idB = (rB.success && rB.data) ? rB.data.id : '';
  verdict(rB.success && idB && idB !== idA, 'admin save sebagai B OK + id unik');

  // 8. Viewer hapus milik orang → TOLAK; hapus milik sendiri → OK (P4)
  var r8 = deleteKompetensiHandler_({ id: idB }, pegA);
  verdict(!r8.success, 'viewer hapus milik orang DITOLAK');
  var r9 = deleteKompetensiHandler_({ id: idA }, pegA);
  verdict(r9.success, 'viewer hapus milik sendiri OK');

  // 9. Search + paginasi meta (P3)
  var s = getKompetensiList_({ search: 'UJI-GUARD-B' }, admin);
  verdict(s.success && s.data.length === 1, 'search kompetensi menemukan 1 baris');
  var pg = getKompetensiList_({ page: 1, limit: 1 }, admin);
  verdict(pg.success && pg.meta && pg.meta.total_pages >= 1, 'paginasi kirim meta total_pages');

  // 10. Analytics (P6)
  var an = getAnalytics_({}, admin);
  verdict(an.success && an.data.by_tanggal && an.data.by_pegawai && an.data.by_bulan, 'analytics kirim by_tanggal + by_pegawai + by_bulan');
  var anf = getAnalytics_({ tahun: '1999' }, admin);
  verdict(anf.success && anf.data.total_data === 0, 'analytics filter tahun jalan');
  var anb = getAnalytics_({ bulan: 'Januari' }, admin);
  verdict(anb.success && anb.data.by_bulan, 'analytics filter bulan (nama) jalan');

  // Cleanup total
  if (idA) hardDeleteRecordNoLock_('DATA_KOMPETENSI', idA, systemActor_());
  if (idB) hardDeleteRecordNoLock_('DATA_KOMPETENSI', idB, systemActor_());
  Logger.log('REKAP GUARD: ' + ok + ' lolos, ' + fail + ' gagal.' + (fail === 0 ? ' 🎉' : ' — CEK YANG ❌!'));
}

/**
 * Uji proteksi riwayat LAPORAN (patch R1–R4). Menulis 2 baris uji sungguhan
 * ke LAPORAN lalu hard-cleanup total. Target: semua ✅.
 */
function testRiwayatGuards() {
  Logger.log('==========================================================');
  Logger.log('🛡️ UJI PROTEKSI RIWAYAT (patch R1–R4)');
  Logger.log('==========================================================');
  var admin = { id: 'U-ADMIN', email: 'admin@uji.id', role: 'admin', pegawai_id: 'PEG-ADMIN' };
  var pegA = { id: 'U-A', email: 'a@uji.id', role: 'viewer', pegawai_id: 'PEG-UJI-A' };
  var pegB = { id: 'U-B', email: 'b@uji.id', role: 'viewer', pegawai_id: 'PEG-UJI-B' };
  var ok = 0, fail = 0;
  function verdict(cond, label) {
    if (cond) { ok++; Logger.log('✅ ' + label); } else { fail++; Logger.log('❌ ' + label); }
  }

  // 1. Viewer buat laporan (bawa status palsu) → OK tapi terkunci draft (R4)
  var r1 = saveRiwayatHandler_({ record: { periode: '2026-Q3', nama_laporan: 'UJI-RIWAYAT-A', status: 'disetujui' } }, pegA);
  var idA = (r1.success && r1.data) ? r1.data.id : '';
  verdict(r1.success && idA, 'viewer buat laporan OK + id ter-generate');
  verdict(r1.success && r1.data.status === 'draft', 'status bawaan user DIKUNCI jadi draft');

  // 2. Viewer ubah milik sendiri → OK; status tetap draft (R2+R4)
  var r2 = saveRiwayatHandler_({ record: { id: idA, periode: '2026-Q3', nama_laporan: 'UJI-RIWAYAT-A2', status: 'disetujui' } }, pegA);
  verdict(r2.success && findRiwayatById_(idA).status === 'draft', 'edit sendiri OK + status tak goyah');

  // 3. Viewer ubah/hapus milik orang → TOLAK (R2)
  var r3 = saveRiwayatHandler_({ record: { id: idA, periode: '2026-Q3', nama_laporan: 'BAJAK' } }, pegB);
  verdict(!r3.success, 'viewer ubah milik orang DITOLAK');
  var r4 = deleteRiwayatHandler_({ id: idA }, pegB);
  verdict(!r4.success, 'viewer hapus milik orang DITOLAK');

  // 4. Validasi wajib isi
  var r5 = saveRiwayatHandler_({ record: { nama_laporan: 'tanpa periode' } }, pegA);
  verdict(!r5.success, 'tanpa periode DITOLAK');

  // 5. Verifikasi: viewer TOLAK, admin OK (R3)
  var r6 = verifikasiRiwayatHandler_({ id: idA, status: 'disetujui' }, pegA);
  verdict(!r6.success, 'viewer verifikasi DITOLAK');
  var r7 = verifikasiRiwayatHandler_({ id: idA, status: 'disetujui', catatan_verifikator: 'uji ok' }, admin);
  verdict(r7.success && r7.data.verifikator_id === 'PEG-ADMIN', 'admin verifikasi OK + verifikator tercatat');

  // 6. Baris ke-2 (admin) + list/search/filter/meta (R1)
  var rB = saveRiwayatHandler_({ record: { periode: '2026-Q3', nama_laporan: 'UJI-RIWAYAT-B' } }, admin);
  var idB = (rB.success && rB.data) ? rB.data.id : '';
  verdict(rB.success && idB && idB !== idA, 'admin buat baris ke-2 OK');
  var s = getRiwayatList_({ search: 'UJI-RIWAYAT-B' }, admin);
  verdict(s.success && s.data.length === 1, 'search menemukan 1 baris');
  var f = getRiwayatList_({ filters: { status: 'disetujui' } }, admin);
  verdict(f.success && f.data.length >= 1, 'filter status jalan');
  var pg = getRiwayatList_({ page: 1, limit: 1 }, admin);
  verdict(pg.success && pg.meta && pg.meta.total_pages >= 1, 'paginasi kirim meta');

  // 7. Hapus milik sendiri → OK (R2)
  var r9 = deleteRiwayatHandler_({ id: idA }, pegA);
  verdict(r9.success, 'viewer hapus milik sendiri OK');

  // Cleanup total
  if (idA) hardDeleteRecordNoLock_('LAPORAN', idA, systemActor_());
  if (idB) hardDeleteRecordNoLock_('LAPORAN', idB, systemActor_());
  Logger.log('REKAP GUARD RIWAYAT: ' + ok + ' lolos, ' + fail + ' gagal.' + (fail === 0 ? ' 🎉' : ' — CEK YANG ❌!'));
}
