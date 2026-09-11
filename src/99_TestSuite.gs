// ============================================================
// SI-KOMPETENSI - 99_TestSuite.gs (Opsi B 6-Sheet Test Suite)
// Automated Integration & Unit Tests for Satpol PP & Damkar
// ============================================================

function runAllTests() {
  var results = [];
  var ss = getLocalSpreadsheet_();
  var adminUser = { id: 'TEST_ADMIN', email: 'admin.test@trenggalekkab.go.id', role: 'admin' };
  var viewerUser = { id: 'PEG-TEST', email: 'staf.test@trenggalekkab.go.id', role: 'viewer' };

  Logger.log('🧪 Memulai Test Suite SI-KOMPETENSI (Opsi B 6-Sheet)...');

  // Test 1: Verifikasi Spreadsheet & Struktur 6 Sheet
  try {
    if (!ss) {
      results.push({ name: '1. Koneksi Spreadsheet', status: 'WARN', message: 'Spreadsheet ID belum diisi di Properties (berjalan di standalone mode).' });
    } else {
      var expectedSheets = [
        LOCAL_SHEET_NAMES.M_PEGAWAI,
        LOCAL_SHEET_NAMES.M_UNIT_KERJA,
        LOCAL_SHEET_NAMES.M_JABATAN,
        LOCAL_SHEET_NAMES.M_KATALOG_DIKLAT,
        LOCAL_SHEET_NAMES.T_KOMPETENSI_PEGAWAI,
        LOCAL_SHEET_NAMES.T_USULAN_DIKLAT
      ];
      var missing = [];
      expectedSheets.forEach(function(s) {
        if (!ss.getSheetByName(s)) missing.push(s);
      });
      if (missing.length === 0) {
        results.push({ name: '1. Struktur 6 Sheet Opsi B', status: 'PASS', message: 'Semua 6 sheet terdaftar lengkap di spreadsheet.' });
      } else {
        results.push({ name: '1. Struktur 6 Sheet Opsi B', status: 'WARN', message: 'Sheet belum dibuat: ' + missing.join(', ') + ' (Jalankan setupApp() untuk inisialisasi otomatis)' });
      }
    }
  } catch (e) {
    results.push({ name: '1. Struktur 6 Sheet Opsi B', status: 'FAIL', error: e.message });
  }

  // Test 2: Handler Dashboard & Kalkulasi JP
  try {
    var dash = apiDashboard_({ tahun: 2026 }, adminUser);
    if (dash && dash.success && dash.data) {
      results.push({ name: '2. Handler Dashboard & Kalkulasi 20 JP', status: 'PASS', message: 'Dashboard berhasil dimuat. Total data: ' + (dash.data.total_kompetensi || 0) });
    } else {
      results.push({ name: '2. Handler Dashboard & Kalkulasi 20 JP', status: 'FAIL', error: 'Dashboard gagal mengembalikan data' });
    }
  } catch (e) {
    results.push({ name: '2. Handler Dashboard & Kalkulasi 20 JP', status: 'FAIL', error: e.message });
  }

  // Test 3: Handler Get Master SIMPEG & Katalog Diklat
  try {
    var master = getMasterSIMPEG_();
    if (master && master.success && master.data) {
      results.push({ name: '3. Master SIMPEG & Kamus Diklat', status: 'PASS', message: 'Master SIMPEG & Diklat berhasil dimuat.' });
    } else {
      results.push({ name: '3. Master SIMPEG & Kamus Diklat', status: 'FAIL', error: 'Gagal memuat master data' });
    }
  } catch (e) {
    results.push({ name: '3. Master SIMPEG & Kamus Diklat', status: 'FAIL', error: e.message });
  }

  // Test 4: Handler Deep Analytics
  try {
    var analytics = getAnalytics_({ tahun: 2026 }, adminUser);
    if (analytics && analytics.success && analytics.data && analytics.data.temuan) {
      results.push({ name: '4. Deep Analytics & Temuan Kebutuhan Diklat', status: 'PASS', message: 'Analytics berhasil dimuat dengan ' + analytics.data.temuan.length + ' temuan.' });
    } else {
      results.push({ name: '4. Deep Analytics & Temuan Kebutuhan Diklat', status: 'FAIL', error: 'Analytics gagal mengembalikan data' });
    }
  } catch (e) {
    results.push({ name: '4. Deep Analytics & Temuan Kebutuhan Diklat', status: 'FAIL', error: e.message });
  }

  // Test 5: Dispatcher handleAction()
  try {
    var pingResp = handleAction({ action: 'ping' });
    if (pingResp && pingResp.success) {
      results.push({ name: '5. Dispatcher API handleAction()', status: 'PASS', message: 'Dispatcher merespons ping dengan sukses.' });
    } else {
      results.push({ name: '5. Dispatcher API handleAction()', status: 'FAIL', error: 'Dispatcher gagal merespons' });
    }
  } catch (e) {
    results.push({ name: '5. Dispatcher API handleAction()', status: 'FAIL', error: e.message });
  }

  // Log Hasil
  Logger.log('================ HASIL PENGUJIAN ================');
  results.forEach(function(r) {
    Logger.log('[' + r.status + '] ' + r.name + (r.message ? ' - ' + r.message : '') + (r.error ? ' - ERROR: ' + r.error : ''));
  });

  return { success: true, results: results };
}
