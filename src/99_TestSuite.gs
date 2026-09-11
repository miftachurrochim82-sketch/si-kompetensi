// ============================================================
// SI-KOMPETENSI - 99_TestSuite.gs (v3.0.0 — 5 Sheet Master Satelit)
// Comprehensive Automated Integration & Unit Tests
// ============================================================

function runAllTests() {
  var results = [];
  var ss = getLocalSpreadsheet_();
  var adminUser = { id: 'TEST_ADMIN', email: 'admin.test@trenggalekkab.go.id', role: 'admin' };
  var viewerUser = { id: 'PEG-TEST', email: 'staf.test@trenggalekkab.go.id', role: 'viewer' };

  Logger.log('🧪 Memulai Test Suite SI-KOMPETENSI (v3.0.0 — 5 Sheet Master Satelit)...');

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
        results.push({ name: '1. Struktur 5 Sheet Database Lokal', status: 'WARN', message: 'Sheet belum dibuat: ' + missing.join(', ') + ' (Jalankan setupApp() untuk inisialisasi)' });
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
        message: 'Pegawai: ' + pCount + ', Unit: ' + uCount + ', Jabatan: ' + jCount
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
      saveRecord_('M_PEGAWAI', { id: 'TEST_HACK', nama_lengkap: 'Hacker' }, viewerUser);
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
  Logger.log('================ HASIL PENGUJIAN SI-KOMPETENSI v3.0.0 ================');
  results.forEach(function(r) {
    Logger.log('[' + r.status + '] ' + r.name + (r.message ? ' - ' + r.message : '') + (r.error ? ' - ERROR: ' + r.error : ''));
  });

  return { success: true, results: results };
}
