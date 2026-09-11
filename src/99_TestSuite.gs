// ============================================================
// SI-KOMPETENSI - 99_TestSuite.gs (v4.0.0 — 8-Sheet Test Suite & Auditor)
// Comprehensive Automated Tests, Sheet Auditor & Safe Cleanup Tools
// ============================================================

/**
 * 1. FUNGSI DIAGNOSTIK & AUDIT SELURUH SHEET LOKAL (8 SHEET STANDAR)
 */
function auditSpreadsheetSheets() {
  var ss = getLocalSpreadsheet_();
  if (!ss) {
    Logger.log('❌ Gagal membuka spreadsheet lokal.');
    return { success: false, error: 'Spreadsheet tidak ditemukan.' };
  }

  var sheets = ss.getSheets();
  var activeSheets = [
    'M_REFERENSI',
    'M_KATALOG_DIKLAT',
    'M_STANDAR_KOMPETENSI',
    'T_JADWAL_DIKLAT',
    'T_PENUGASAN_PESERTA',
    'T_RIWAYAT_KOMPETENSI',
    'T_KUALIFIKASI_KHUSUS',
    'T_USULAN_DIKLAT'
  ];
  var report = [];

  Logger.log('================ AUDIT SPREADSHEET SI-KOMPETENSI (8 SHEET IDEAL) ================');
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
      status = '✅ [AKTIF v4.0 - 8 SHEET IDEAL]';
      actionRecom = 'Sheet utama aktif SI-KOMPETENSI.';
    } else {
      status = '🗑️ [SHEET LAMA / SISA PENGUJIAN - AMAN DIHAPUS]';
      actionRecom = 'Bukan bagian dari 8 sheet standar. Jalankan cleanupObsoleteSheets() untuk membersihkan.';
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
  Logger.log('Sheet Wajib Aktif (8 Sheet): ' + activeSheets.join(', '));
  Logger.log('Gunakan fungsi "cleanupObsoleteSheets()" untuk membersihkan sheet usang secara aman otomatis.');

  return { success: true, total: sheets.length, report: report };
}

/**
 * 2. FUNGSI PEMBERSIH SHEET USANG OTOMATIS & AMAN (8 SHEET AKTIF)
 */
function cleanupObsoleteSheets() {
  var ss = getLocalSpreadsheet_();
  if (!ss) return { success: false, error: 'Spreadsheet tidak ditemukan.' };

  Logger.log('🧹 Memulai Pembersihan Sheet Usang di SI-KOMPETENSI (8-Sheet Standard)...');

  // 1. Pastikan 8 Sheet Wajib Sudah Terbuat & Header Tersinkron
  initDatabase();

  var activeSheets = [
    'M_REFERENSI',
    'M_KATALOG_DIKLAT',
    'M_STANDAR_KOMPETENSI',
    'T_JADWAL_DIKLAT',
    'T_PENUGASAN_PESERTA',
    'T_RIWAYAT_KOMPETENSI',
    'T_KUALIFIKASI_KHUSUS',
    'T_USULAN_DIKLAT'
  ];
  var allSheets = ss.getSheets();
  var deleted = [];

  allSheets.forEach(function(sh) {
    var sName = sh.getName();
    if (activeSheets.indexOf(sName) === -1 && ss.getSheets().length > 1) {
      try {
        ss.deleteSheet(sh);
        deleted.push(sName);
        Logger.log('🗑️ Berhasil menghapus sheet usang: "' + sName + '"');
      } catch (err) {
        Logger.log('[WARN] Gagal menghapus ' + sName + ': ' + err.message);
      }
    }
  });

  Logger.log('🎉 ============================================================');
  Logger.log('🎉 Pembersihan Selesai! Sheet dihapus: ' + (deleted.join(', ') || 'Tidak ada'));
  Logger.log('🎉 8 SHEET IDEAL AKTIF: ' + activeSheets.join(', '));
  Logger.log('🎉 ============================================================');

  return { success: true, deleted: deleted };
}

/**
 * 3. TEST SUITE OTOMATIS LENGKAP (8 SHEET & ENDPOINT)
 */
function runAllTests() {
  var results = [];
  var ss = getLocalSpreadsheet_();
  var adminUser = { id: 'TEST_ADMIN', email: 'admin.test@trenggalekkab.go.id', role: 'admin' };
  var viewerUser = { id: 'PEG-TEST', email: 'staf.test@trenggalekkab.go.id', role: 'viewer' };

  Logger.log('🧪 Memulai Test Suite SI-KOMPETENSI (v4.0.0 — 8 Sheet Ideal Architecture)...');

  // Test 1: Verifikasi Struktur 8 Sheet Database Lokal
  try {
    if (!ss) {
      results.push({ name: '1. Koneksi Spreadsheet Lokal', status: 'WARN', message: 'Spreadsheet ID belum terhubung.' });
    } else {
      var expectedSheets = [
        LOCAL_SHEETS.M_REFERENSI,
        LOCAL_SHEETS.M_KATALOG_DIKLAT,
        LOCAL_SHEETS.M_STANDAR_KOMPETENSI,
        LOCAL_SHEETS.T_JADWAL_DIKLAT,
        LOCAL_SHEETS.T_PENUGASAN_PESERTA,
        LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI,
        LOCAL_SHEETS.T_KUALIFIKASI_KHUSUS,
        LOCAL_SHEETS.T_USULAN_DIKLAT
      ];
      var missing = [];
      expectedSheets.forEach(function(s) {
        if (!ss.getSheetByName(s)) missing.push(s);
      });

      if (missing.length === 0) {
        results.push({ name: '1. Struktur 8 Sheet Database Lokal', status: 'PASS', message: '8 Sheet Satelit terdaftar lengkap di spreadsheet.' });
      } else {
        results.push({ name: '1. Struktur 8 Sheet Database Lokal', status: 'WARN', message: 'Sheet belum dibuat: ' + missing.join(', ') });
      }
    }
  } catch (e) {
    results.push({ name: '1. Struktur 8 Sheet Database Lokal', status: 'FAIL', error: e.message });
  }

  // Test 2: Handler Jadwal Diklat & Penugasan Peserta (T_JADWAL & T_PENUGASAN)
  try {
    var jdwList = getJadwalList_({});
    var tgsList = getPenugasanList_({});
    if (jdwList && jdwList.success && tgsList && tgsList.success) {
      results.push({
        name: '2. Modul Jadwal Pelatihan & Penugasan SPT',
        status: 'PASS',
        message: 'Jadwal Diklat: ' + (jdwList.data || []).length + ', Penugasan SPT: ' + (tgsList.data || []).length
      });
    } else {
      results.push({ name: '2. Modul Jadwal Pelatihan & Penugasan SPT', status: 'FAIL', error: 'Gagal memuat data jadwal/penugasan' });
    }
  } catch (e) {
    results.push({ name: '2. Modul Jadwal Pelatihan & Penugasan SPT', status: 'FAIL', error: e.message });
  }

  // Test 3: Kualifikasi Khusus (SK PPNS / Damkar) & Alert H-90 Kadaluwarsa
  try {
    var klsList = getKualifikasiList_({});
    var expiringSoon = getKualifikasiExpiringSoon_({});
    if (klsList && klsList.success && expiringSoon && expiringSoon.success) {
      results.push({
        name: '3. Kualifikasi Khusus & Alert H-90 Kadaluwarsa',
        status: 'PASS',
        message: 'Total Lisensi: ' + (klsList.data || []).length + ', Lisensi Mendekati Kadaluwarsa: ' + (expiringSoon.count || 0)
      });
    } else {
      results.push({ name: '3. Kualifikasi Khusus & Alert H-90 Kadaluwarsa', status: 'FAIL', error: 'Gagal memuat kualifikasi khusus' });
    }
  } catch (e) {
    results.push({ name: '3. Kualifikasi Khusus & Alert H-90 Kadaluwarsa', status: 'FAIL', error: e.message });
  }

  // Test 4: Master Satelit (Katalog, Standar Jabatan, Referensi)
  try {
    var satelitBundle = getMasterSatelit_();
    if (satelitBundle && satelitBundle.success && satelitBundle.data) {
      var katCount = (satelitBundle.data.katalog || []).length;
      var stdCount = (satelitBundle.data.standar_kompetensi || []).length;
      var refCount = (satelitBundle.data.referensi || []).length;
      results.push({
        name: '4. Master Data Satelit',
        status: 'PASS',
        message: 'Katalog: ' + katCount + ', Standar Jabatan: ' + stdCount + ', Referensi: ' + refCount
      });
    } else {
      results.push({ name: '4. Master Data Satelit', status: 'FAIL', error: 'Gagal memuat master satelit' });
    }
  } catch (e) {
    results.push({ name: '4. Master Data Satelit', status: 'FAIL', error: e.message });
  }

  // Test 5: SIMPEG Lookup Read-Only Bridge
  try {
    var simpeg = getSimpegLookup_();
    if (simpeg && simpeg.success && simpeg.data) {
      var pCount = (simpeg.data.pegawai || []).length;
      var uCount = (simpeg.data.unit || []).length;
      var jCount = (simpeg.data.jabatan || []).length;
      results.push({
        name: '5. SIMPEG Lookup Bridge (Read-Only)',
        status: 'PASS',
        message: 'Pegawai: ' + pCount + ', Unit: ' + uCount + ', Jabatan: ' + jCount
      });
    } else {
      results.push({ name: '5. SIMPEG Lookup Bridge (Read-Only)', status: 'FAIL', error: 'Gagal membaca lookup SIMPEG' });
    }
  } catch (e) {
    results.push({ name: '5. SIMPEG Lookup Bridge (Read-Only)', status: 'FAIL', error: e.message });
  }

  // Test 6: Dashboard, Matriks JP & AI Insights
  try {
    var dash = apiDashboard_({ tahun: 2026 }, adminUser);
    if (dash && dash.success && dash.data) {
      results.push({
        name: '6. Dashboard Agregasi, Matriks & AI Insights',
        status: 'PASS',
        message: 'Total Portofolio: ' + (dash.data.total_kompetensi || 0) + ', PNS Lulus: ' + ((dash.data.capaian_pns && dash.data.capaian_pns.lulus) || 0) + ', Matriks: ' + (dash.data.matriks_bulanan || []).length + ' baris'
      });
    } else {
      results.push({ name: '6. Dashboard Agregasi, Matriks & AI Insights', status: 'FAIL', error: 'Gagal memuat dashboard' });
    }
  } catch (e) {
    results.push({ name: '6. Dashboard Agregasi, Matriks & AI Insights', status: 'FAIL', error: e.message });
  }

  // Test 7: Analisa Gap Kebutuhan Kompetensi Jabatan (SKJ)
  try {
    var analytics = getAnalytics_({ tahun: 2026 }, adminUser);
    if (analytics && analytics.success && analytics.data) {
      results.push({
        name: '7. Analisa Gap Kompetensi Jabatan (SKJ)',
        status: 'PASS',
        message: 'Kesenjangan Terdeteksi: ' + (analytics.data.gap_count || 0) + ', Temuan: ' + (analytics.data.temuan || []).length
      });
    } else {
      results.push({ name: '7. Analisa Gap Kompetensi Jabatan (SKJ)', status: 'FAIL', error: 'Gagal memproses analisa gap' });
    }
  } catch (e) {
    results.push({ name: '7. Analisa Gap Kompetensi Jabatan (SKJ)', status: 'FAIL', error: e.message });
  }

  // Test 8: Proteksi Keamanan Tulis (Strict Read-Only SIMPEG)
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
      results.push({ name: '8. Proteksi Keamanan Tulis SIMPEG', status: 'PASS', message: 'Upaya tulis ke master SIMPEG berhasil ditolak otomatis.' });
    } else {
      results.push({ name: '8. Proteksi Keamanan Tulis SIMPEG', status: 'FAIL', error: 'Proteksi tulis SIMPEG bocor' });
    }
  } catch (e) {
    results.push({ name: '8. Proteksi Keamanan Tulis SIMPEG', status: 'FAIL', error: e.message });
  }

  // Test 9: Standalone API Dispatcher handleAction()
  try {
    var ping = handleAction({ action: 'ping' });
    var satelitResp = handleAction({ action: 'get_master_satelit' });
    var jadwalResp = handleAction({ action: 'get_jadwal_list' });
    var kualResp = handleAction({ action: 'get_kualifikasi_list' });

    if (ping && ping.success && satelitResp && satelitResp.success && jadwalResp && jadwalResp.success && kualResp && kualResp.success) {
      results.push({ name: '9. Dispatcher handleAction() (Seluruh 8 Sheet Endpoints)', status: 'PASS', message: 'Seluruh endpoint API merespons valid.' });
    } else {
      results.push({ name: '9. Dispatcher handleAction() (Seluruh 8 Sheet Endpoints)', status: 'FAIL', error: 'Dispatcher gagal merespons salah satu endpoint' });
    }
  } catch (e) {
    results.push({ name: '9. Dispatcher handleAction() (Seluruh 8 Sheet Endpoints)', status: 'FAIL', error: e.message });
  }

  // Log Hasil Rangkuman
  Logger.log('================ HASIL PENGUJIAN SI-KOMPETENSI v4.0.0 ================');
  results.forEach(function(r) {
    Logger.log('[' + r.status + '] ' + r.name + (r.message ? ' - ' + r.message : '') + (r.error ? ' - ERROR: ' + r.error : ''));
  });

  return { success: true, results: results };
}
