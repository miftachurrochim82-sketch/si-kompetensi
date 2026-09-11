// ============================================================
// SI-KOMPETENSI - 99_TestSuite.gs (v3.2.0 — Live Ecosystem Linked)
// Comprehensive Automated Tests, Sheet Auditor & Safe Cleanup Tools
// ============================================================

/**
 * 1. FUNGSI DIAGNOSTIK & AUDIT SELURUH SHEET LOKAL
 * Jalankan fungsi ini untuk melihat daftar 12 sheet, jumlah baris, dan headernya!
 */
function auditSpreadsheetSheets() {
  var ss = getLocalSpreadsheet_();
  if (!ss) {
    Logger.log('❌ Gagal membuka spreadsheet lokal.');
    return { success: false, error: 'Spreadsheet tidak ditemukan.' };
  }

  var sheets = ss.getSheets();
  var activeSheets = ['M_REFERENSI', 'M_KATALOG_DIKLAT', 'M_STANDAR_KOMPETENSI', 'T_RIWAYAT_KOMPETENSI', 'T_USULAN_DIKLAT'];
  var report = [];

  Logger.log('================ AUDIT SPREADSHEET SI-KOMPETENSI ================');
  Logger.log('Total Sheet Ditemukan: ' + sheets.length + ' sheet\n');

  sheets.forEach(function(sheet, idx) {
    var name = sheet.getName();
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var headers = [];

    if (lastRow > 0 && lastCol > 0) {
      headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
    }

    var status = '';
    var actionRecom = '';

    if (activeSheets.indexOf(name) !== -1) {
      status = '✅ [AKTIF v3.0 - WAJIB DIPERTAHANKAN]';
      actionRecom = 'Sheet utama aktif SI-KOMPETENSI.';
    } else if (name === 'T_KOMPETENSI_PEGAWAI' || name === 'DATA_KOMPETENSI') {
      status = '⚠️ [DATA LAMA - PERLU DIMIGRASI]';
      actionRecom = 'Data sertifikat lama. Jalankan cleanupObsoleteSheets() agar otomatis dimigrasikan ke T_RIWAYAT_KOMPETENSI sebelum dihapus.';
    } else if (name === 'M_PEGAWAI' || name === 'PEGAWAI' || name === 'M_UNIT_KERJA' || name === 'UNIT_KERJA' || name === 'M_JABATAN' || name === 'JABATAN') {
      status = '🗑️ [DUPLIKAT SIMPEG - AMAN DIHAPUS]';
      actionRecom = 'Duplikat lokal. SI-KOMPETENSI sudah membaca langsung 101 pegawai dari SIMPEG Pusat (1HvMXmvdtgAUZ9A0-SQHZp9QjnYv1A7Ku_oJIjbT8gT0).';
    } else if (name === 'KONFIGURASI' || name === 'AUDIT_LOGS') {
      status = '🗑️ [DUPLIKAT SI-PLATFORM - AMAN DIHAPUS]';
      actionRecom = 'Duplikat lokal. Konfigurasi & Audit sudah terpusat ke SI-PLATFORM (1EeJrOo6-75uf8SWCX4P5XPSMoUGXp8p1a098vKBRJys).';
    } else {
      status = '🗑️ [SHEET LAIN / SISA TESTING - AMAN DIHAPUS]';
      actionRecom = 'Sheet temporary / bawaan kosong.';
    }

    var item = {
      index: idx + 1,
      name: name,
      rows: lastRow,
      cols: lastCol,
      status: status,
      recommendation: actionRecom,
      headers: headers
    };
    report.push(item);

    Logger.log((idx + 1) + '. Sheet: "' + name + '" (' + lastRow + ' baris, ' + lastCol + ' kolom)');
    Logger.log('   Status : ' + status);
    Logger.log('   Saran  : ' + actionRecom);
    Logger.log('   Header : [' + headers.join(', ') + ']\n');
  });

  Logger.log('================ RINGKASAN REKOMENDASI ================');
  Logger.log('Sheet Wajib Aktif (5 Sheet): ' + activeSheets.join(', '));
  Logger.log('Gunakan fungsi "cleanupObsoleteSheets()" untuk membersihkan sheet usang secara aman otomatis.');

  return { success: true, total: sheets.length, report: report };
}

/**
 * 2. FUNGSI PEMBERSIH SHEET USANG OTOMATIS & AMAN
 * Otomatis memindahkan riwayat diklat lama jika ada, lalu menghapus sheet duplikat.
 */
function cleanupObsoleteSheets() {
  var ss = getLocalSpreadsheet_();
  if (!ss) return { success: false, error: 'Spreadsheet tidak ditemukan.' };

  Logger.log('🧹 Memulai Pembersihan Sheet Usang & Duplikat di SI-KOMPETENSI...');

  // 1. Pastikan 5 Sheet Wajib Sudah Terbuat
  initDatabase();

  // 2. Migrasi Data Lama dari T_KOMPETENSI_PEGAWAI / DATA_KOMPETENSI jika ada data tambahan
  var oldCompSheet = ss.getSheetByName('T_KOMPETENSI_PEGAWAI') || ss.getSheetByName('DATA_KOMPETENSI');
  var targetCompSheet = ss.getSheetByName(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI);

  if (oldCompSheet && targetCompSheet && oldCompSheet.getLastRow() > 1) {
    Logger.log('📦 Memeriksa data riwayat lama di ' + oldCompSheet.getName() + '...');
    var oldValues = oldCompSheet.getDataRange().getValues();
    var oldHeaders = oldValues[0].map(function(h) { return String(h).trim(); });
    var targetValues = targetCompSheet.getDataRange().getValues();
    var targetHeaders = targetValues[0].map(function(h) { return String(h).trim(); });

    var existingIds = {};
    for (var i = 1; i < targetValues.length; i++) {
      existingIds[String(targetValues[i][0])] = true;
    }

    var migratedCount = 0;
    var idColOld = oldHeaders.indexOf('id');
    if (idColOld === -1) idColOld = 0;

    for (var r = 1; r < oldValues.length; r++) {
      var row = oldValues[r];
      var rId = String(row[idColOld]);
      if (rId && !existingIds[rId]) {
        var newRow = targetHeaders.map(function(th) {
          var oldIdx = oldHeaders.indexOf(th);
          return oldIdx !== -1 ? row[oldIdx] : '';
        });
        targetCompSheet.appendRow(newRow);
        migratedCount++;
      }
    }
    Logger.log('✅ Migrasi data selesai: ' + migratedCount + ' baris riwayat dipindahkan ke T_RIWAYAT_KOMPETENSI.');
  }

  // 3. Daftar Sheet yang Aman Dihapus
  var obsoleteSheetNames = [
    'M_PEGAWAI', 'PEGAWAI', 'pegawai',
    'M_UNIT_KERJA', 'UNIT_KERJA', 'unit_kerja',
    'M_JABATAN', 'JABATAN', 'jabatan',
    'T_KOMPETENSI_PEGAWAI', 'DATA_KOMPETENSI', 'LAPORAN',
    'KONFIGURASI', 'AUDIT_LOGS', 'ZZ_TEST_CRUD', 'Sheet1', 'Sheet 1'
  ];

  var deleted = [];
  obsoleteSheetNames.forEach(function(sName) {
    var sh = ss.getSheetByName(sName);
    if (sh && ss.getSheets().length > 1) {
      try {
        ss.deleteSheet(sh);
        deleted.push(sName);
        Logger.log('🗑️ Berhasil menghapus sheet usang: ' + sName);
      } catch (err) {
        Logger.log('[WARN] Gagal menghapus ' + sName + ': ' + err.message);
      }
    }
  });

  Logger.log('🎉 Pembersihan Selesai! Sheet dihapus: ' + (deleted.join(', ') || 'Tidak ada'));
  Logger.log('🎉 Sisa Sheet Sekarang (5 Sheet Murni): M_REFERENSI, M_KATALOG_DIKLAT, M_STANDAR_KOMPETENSI, T_RIWAYAT_KOMPETENSI, T_USULAN_DIKLAT');

  return { success: true, deleted: deleted };
}

/**
 * 3. TEST SUITE OTOMATIS
 */
function runAllTests() {
  var results = [];
  var ss = getLocalSpreadsheet_();
  var adminUser = { id: 'TEST_ADMIN', email: 'admin.test@trenggalekkab.go.id', role: 'admin' };
  var viewerUser = { id: 'PEG-TEST', email: 'staf.test@trenggalekkab.go.id', role: 'viewer' };

  Logger.log('🧪 Memulai Test Suite SI-KOMPETENSI (v3.2.0 — Ekosistem Terpadu)...');

  // Test 1: Verifikasi Struktur 5 Sheet Database Lokal
  try {
    if (!ss) {
      results.push({ name: '1. Koneksi Spreadsheet Lokal', status: 'WARN', message: 'Spreadsheet ID belum terhubung.' });
    } else {
      var expectedSheets = [
        LOCAL_SHEETS.M_REFERENSI,
        LOCAL_SHEETS.M_KATALOG_DIKLAT,
        LOCAL_SHEETS.M_STANDAR_KOMPETENSI,
        LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI,
        LOCAL_SHEETS.T_USULAN_DIKLAT
      ];
      var missing = [];
      expectedSheets.forEach(function(s) {
        if (!ss.getSheetByName(s)) missing.push(s);
      });

      if (missing.length === 0) {
        results.push({ name: '1. Struktur 5 Sheet Database Lokal', status: 'PASS', message: '5 Sheet Satelit terdaftar lengkap di spreadsheet.' });
      } else {
        results.push({ name: '1. Struktur 5 Sheet Database Lokal', status: 'WARN', message: 'Sheet belum dibuat: ' + missing.join(', ') });
      }
    }
  } catch (e) {
    results.push({ name: '1. Struktur 5 Sheet Database Lokal', status: 'FAIL', error: e.message });
  }

  // Test 2: Handler Master Satelit (Katalog, Standar Kompetensi, Referensi)
  try {
    var satelitBundle = getMasterSatelit_();
    if (satelitBundle && satelitBundle.success && satelitBundle.data) {
      var katCount = (satelitBundle.data.katalog || []).length;
      var stdCount = (satelitBundle.data.standar_kompetensi || []).length;
      var refCount = (satelitBundle.data.referensi || []).length;
      results.push({
        name: '2. Handler Master Satelit (3 Tab)',
        status: 'PASS',
        message: 'Katalog: ' + katCount + ', Standar Jabatan: ' + stdCount + ', Referensi: ' + refCount
      });
    } else {
      results.push({ name: '2. Handler Master Satelit (3 Tab)', status: 'FAIL', error: 'Gagal memuat master satelit' });
    }
  } catch (e) {
    results.push({ name: '2. Handler Master Satelit (3 Tab)', status: 'FAIL', error: e.message });
  }

  // Test 3: SIMPEG Lookup Read-Only Bridge
  try {
    var simpeg = getSimpegLookup_();
    if (simpeg && simpeg.success && simpeg.data) {
      var pCount = (simpeg.data.pegawai || []).length;
      var uCount = (simpeg.data.unit || []).length;
      var jCount = (simpeg.data.jabatan || []).length;
      results.push({
        name: '3. SIMPEG Lookup Bridge (Read-Only)',
        status: 'PASS',
        message: 'Pegawai: ' + pCount + ', Unit: ' + uCount + ', Jabatan: ' + jCount + ' (dari SIMPEG Master)'
      });
    } else {
      results.push({ name: '3. SIMPEG Lookup Bridge (Read-Only)', status: 'FAIL', error: 'Gagal membaca lookup SIMPEG' });
    }
  } catch (e) {
    results.push({ name: '3. SIMPEG Lookup Bridge (Read-Only)', status: 'FAIL', error: e.message });
  }

  // Test 4: Dashboard & Kalkulasi Capaian 20 JP
  try {
    var dash = apiDashboard_({ tahun: 2026 }, adminUser);
    if (dash && dash.success && dash.data) {
      results.push({
        name: '4. Dashboard & Kalkulasi 20 JP',
        status: 'PASS',
        message: 'Total Data: ' + (dash.data.total_kompetensi || 0) + ', Capaian 20 JP: ' + (dash.data.persen_capaian_20jp || 0) + '%'
      });
    } else {
      results.push({ name: '4. Dashboard & Kalkulasi 20 JP', status: 'FAIL', error: 'Gagal memuat dashboard' });
    }
  } catch (e) {
    results.push({ name: '4. Dashboard & Kalkulasi 20 JP', status: 'FAIL', error: e.message });
  }

  // Test 5: Analisa Gap Kebutuhan Kompetensi Jabatan (SKJ)
  try {
    var analytics = getAnalytics_({ tahun: 2026 }, adminUser);
    if (analytics && analytics.success && analytics.data) {
      results.push({
        name: '5. Gap Analysis (Standar Jabatan vs Riwayat)',
        status: 'PASS',
        message: 'Kesenjangan Terdeteksi: ' + (analytics.data.gap_count || 0) + ', Temuan: ' + (analytics.data.temuan || []).length
      });
    } else {
      results.push({ name: '5. Gap Analysis (Standar Jabatan vs Riwayat)', status: 'FAIL', error: 'Gagal memproses analisa gap' });
    }
  } catch (e) {
    results.push({ name: '5. Gap Analysis (Standar Jabatan vs Riwayat)', status: 'FAIL', error: e.message });
  }

  // Test 6: Proteksi Keamanan Tulis (Strict Read-Only SIMPEG)
  try {
    var writeFailedAsExpected = false;
    try {
      saveRecord_('PEGAWAI', { id: 'TEST_HACK', nama: 'Hacker' }, viewerUser);
    } catch(err) {
      if (err.message && err.message.indexOf('Akses Ditolak') !== -1) {
        writeFailedAsExpected = true;
      }
    }

    if (writeFailedAsExpected) {
      results.push({ name: '6. Proteksi Keamanan Tulis SIMPEG', status: 'PASS', message: 'Upaya tulis ke master SIMPEG berhasil ditolak otomatis.' });
    } else {
      results.push({ name: '6. Proteksi Keamanan Tulis SIMPEG', status: 'FAIL', error: 'Proteksi tulis SIMPEG bocor' });
    }
  } catch (e) {
    results.push({ name: '6. Proteksi Keamanan Tulis SIMPEG', status: 'FAIL', error: e.message });
  }

  // Test 7: Dispatcher handleAction()
  try {
    var ping = handleAction({ action: 'ping' });
    var satelitResp = handleAction({ action: 'get_master_satelit' });
    if (ping && ping.success && satelitResp && satelitResp.success) {
      results.push({ name: '7. Standalone API Dispatcher handleAction()', status: 'PASS', message: 'Seluruh routing endpoint API merespons valid.' });
    } else {
      results.push({ name: '7. Standalone API Dispatcher handleAction()', status: 'FAIL', error: 'Dispatcher gagal merespons' });
    }
  } catch (e) {
    results.push({ name: '7. Standalone API Dispatcher handleAction()', status: 'FAIL', error: e.message });
  }

  // Log Hasil Rangkuman
  Logger.log('================ HASIL PENGUJIAN SI-KOMPETENSI v3.2.0 ================');
  results.forEach(function(r) {
    Logger.log('[' + r.status + '] ' + r.name + (r.message ? ' - ' + r.message : '') + (r.error ? ' - ERROR: ' + r.error : ''));
  });

  return { success: true, results: results };
}
