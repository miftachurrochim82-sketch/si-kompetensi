// ============================================================
// SI-KOMPETENSI - 99_TestSuite.gs (v2.0.0 — CoreLib Integration Test)
// ============================================================
// Changelog v2.0 (2026-09-13):
// - Rewrite total: fokus verifikasi integrasi CoreLib v2.2.1.
// - Cek adapter 00_Utils.gs, delegasi SSO, session, db engine.
// - Tambah test untuk FIX-S9, FIX-L16, FIX-M16, FIX-R17.
// - Simplify: hanya test kritis (bukan comprehensive).
// ============================================================

var TEST_ID_PREFIX_ = '_TEST_';

var TEST_USER_ADMIN_ = { id: 'TEST-ADMIN', email: 'test.admin@trenggalekkab.go.id', role: 'admin', pegawai_id: 'PEG-0001' };
var TEST_USER_VERIF_ = { id: 'TEST-VERIF', email: 'test.verif@trenggalekkab.go.id', role: 'verifikator', pegawai_id: 'PEG-0002' };
var TEST_USER_USER_ = { id: 'TEST-USER', email: 'test.user@trenggalekkab.go.id', role: 'user', pegawai_id: 'PEG-0003' };
var TEST_USER_VIEWER_ = { id: 'TEST-VIEWER', email: 'test.viewer@trenggalekkab.go.id', role: 'viewer', pegawai_id: '' };

// ==================== RUNNER ====================

function runAllTestsSikompetensi() {
  Logger.log('========================================');
  Logger.log('SI-KOMPETENSI TEST SUITE v2.0');
  Logger.log('Waktu: ' + new Date().toISOString());
  Logger.log('========================================');
  Logger.log('');

  var results = [];

  Logger.log('--- INTEGRASI CORELIB ---');
  results = results.concat(testCoreLibAvailable());
  results = results.concat(testUtilsAdapter());
  results = results.concat(testRoleMappingFixed());

  Logger.log('');
  Logger.log('--- DOMAIN LOGIC ---');
  results = results.concat(testDispatcherReadOnly());
  results = results.concat(testRoleChecks());
  results = results.concat(testLookupReadOnly());

  Logger.log('');
  Logger.log('--- BUG FIX VERIFICATION ---');
  results = results.concat(testFixL16());
  results = results.concat(testFixM16());
  results = results.concat(testFixR17());

  Logger.log('');
  Logger.log('========================================');
  var pass = results.filter(function(r) { return r.status === 'PASS'; }).length;
  var fail = results.filter(function(r) { return r.status === 'FAIL'; }).length;
  var skip = results.filter(function(r) { return r.status === 'SKIP'; }).length;
  Logger.log('RINGKASAN: PASS=' + pass + ' / FAIL=' + fail + ' / SKIP=' + skip);
  Logger.log('========================================');

  if (fail > 0) {
    Logger.log('');
    Logger.log('=== FAIL DETAILS ===');
    results.filter(function(r) { return r.status === 'FAIL'; }).forEach(function(r) {
      Logger.log('❌ ' + r.name + ': ' + r.detail);
    });
  }

  return { success: true, pass: pass, fail: fail, skip: skip, results: results };
}

// ==================== HELPER ====================

function _assert_(results, name, condition, detail) {
  if (condition) {
    results.push({ name: name, status: 'PASS' });
    Logger.log('  ✅ ' + name);
  } else {
    results.push({ name: name, status: 'FAIL', detail: detail || '' });
    Logger.log('  ❌ ' + name + ' — ' + (detail || ''));
  }
}

// ==================== 1. CORELIB AVAILABLE ====================

function testCoreLibAvailable() {
  Logger.log('');
  var results = [];

  _assert_(results, '1.1 CoreLib terpasang', typeof CoreLib !== 'undefined', '');

  if (typeof CoreLib === 'undefined') return results;

  _assert_(results, '1.2 CoreLib.getHighestRole',
    typeof CoreLib.getHighestRole === 'function', '');
  _assert_(results, '1.3 CoreLib.checkRole',
    typeof CoreLib.checkRole === 'function', '');
  _assert_(results, '1.4 CoreLib.normId',
    typeof CoreLib.normId === 'function', '');
  _assert_(results, '1.5 CoreLib.parseDate',
    typeof CoreLib.parseDate === 'function', '');
  _assert_(results, '1.6 CoreLib.getSheetDataCached',
    typeof CoreLib.getSheetDataCached === 'function', '');
  _assert_(results, '1.7 CoreLib.apiSave',
    typeof CoreLib.apiSave === 'function', '');
  _assert_(results, '1.8 CoreLib.apiDelete',
    typeof CoreLib.apiDelete === 'function', '');

  return results;
}

// ==================== 2. UTILS ADAPTER ====================

function testUtilsAdapter() {
  Logger.log('');
  var results = [];

  try {
    _assert_(results, '2.1 normId_ delegate CoreLib',
      normId_('  x  ') === 'x', '');
  } catch (e) { _assert_(results, '2.1 normId_ delegate CoreLib', false, e.message); }

  try {
    _assert_(results, '2.2 normStr_ delegate CoreLib',
      normStr_('  X  ') === 'x', '');
  } catch (e) { _assert_(results, '2.2 normStr_ delegate CoreLib', false, e.message); }

  try {
    var d = parseDate_('12/09/2026');
    _assert_(results, '2.3 parseDate_ dd/MM/yyyy benar',
      d && d.getMonth() === 8 && d.getDate() === 12,
      'dapat: ' + (d ? d.toISOString() : 'null'));
  } catch (e) { _assert_(results, '2.3 parseDate_ dd/MM/yyyy benar', false, e.message); }

  try {
    var w = whitelist_('terjadwal', ['Terjadwal', 'Selesai'], 'x');
    _assert_(results, '2.4 whitelist_ case-insensitive',
      w === 'Terjadwal', 'dapat: ' + w);
  } catch (e) { _assert_(results, '2.4 whitelist_ case-insensitive', false, e.message); }

  return results;
}

// ==================== 3. ROLE MAPPING (FIX-S9) ====================

function testRoleMappingFixed() {
  Logger.log('');
  var results = [];

  var tests = [
    { input: ['sekretaris'], expect: 'admin' },
    { input: ['kepala_dinas'], expect: 'admin' },
    { input: ['kasat'], expect: 'admin' },
    { input: ['kabid'], expect: 'admin' },
    { input: ['kasubbag'], expect: 'verifikator' },
    { input: ['kasi'], expect: 'verifikator' },
    { input: ['operator'], expect: 'user' },
    { input: ['pegawai'], expect: 'user' },
    { input: [], expect: 'viewer' }
  ];

  tests.forEach(function(t, i) {
    try {
      var got = CoreLib.getHighestRole(t.input);
      _assert_(results, '3.' + (i+1) + ' getHighestRole([' + t.input.join(',') + '])',
        got === t.expect, 'dapat ' + got + ' expect ' + t.expect);
    } catch (e) {
      _assert_(results, '3.' + (i+1), false, e.message);
    }
  });

  return results;
}

// ==================== 4. DISPATCHER READ-ONLY ====================

function testDispatcherReadOnly() {
  Logger.log('');
  var results = [];

  try {
    var ping = handleAction({ action: 'ping' });
    _assert_(results, '4.1 Ping endpoint', ping.success === true, '');
  } catch (e) { _assert_(results, '4.1 Ping endpoint', false, e.message); }

  var readActions = [
    ['4.2', 'get_config_list', function(r) { return r.success && Array.isArray(r.data); }],
    ['4.3', 'get_master_satelit', function(r) { return r.success && r.data.katalog; }],
    ['4.4', 'get_simpeg_lookup', function(r) { return r.success && r.data.pegawai; }],
    ['4.5', 'get_jadwal_list', function(r) { return r.success && r.data.length >= 0; }],
    ['4.6', 'get_penugasan_list', function(r) { return r.success && r.data.length >= 0; }],
    ['4.7', 'get_kualifikasi_list', function(r) { return r.success && r.data.length >= 0; }],
    ['4.8', 'get_riwayat_list', function(r) { return r.success && r.data.length >= 0; }],
    ['4.9', 'get_usulan_list', function(r) { return r.success && r.data.length >= 0; }],
    ['4.10', 'get_katalog_list', function(r) { return r.success && r.data.length > 0; }],
    ['4.11', 'get_standar_list', function(r) { return r.success && r.data.length > 0; }],
    ['4.12', 'get_referensi_list', function(r) { return r.success && r.data.length > 0; }]
  ];

  readActions.forEach(function(item) {
    try {
      var r = handleAction({ action: item[1] });
      _assert_(results, item[0] + ' ' + item[1], item[2](r), '');
    } catch (e) {
      _assert_(results, item[0] + ' ' + item[1], false, e.message);
    }
  });

  try {
    var dash = handleAction({ action: 'dashboard', data: { tahun: 2026 } });
    _assert_(results, '4.13 dashboard', dash.success && dash.data, '');
  } catch (e) { _assert_(results, '4.13 dashboard', false, e.message); }

  try {
    var unk = handleAction({ action: 'aksi_ngawur' });
    _assert_(results, '4.14 Action tidak dikenal ditolak',
      !unk.success && unk.error.indexOf('tidak dikenali') !== -1, '');
  } catch (e) { _assert_(results, '4.14 Action tidak dikenal ditolak', false, e.message); }

  return results;
}

// ==================== 5. ROLE CHECKS ====================

function testRoleChecks() {
  Logger.log('');
  var results = [];

  var checks = [
    ['5.1', 'save_jadwal', TEST_USER_VIEWER_, false],
    ['5.2', 'save_jadwal', TEST_USER_USER_, true],
    ['5.3', 'delete_jadwal', TEST_USER_USER_, false],
    ['5.4', 'delete_jadwal', TEST_USER_ADMIN_, true],
    ['5.5', 'review_usulan', TEST_USER_USER_, false],
    ['5.6', 'review_usulan', TEST_USER_ADMIN_, true],
    ['5.7', 'init_database', TEST_USER_ADMIN_, false],
    ['5.8', 'init_database', { role: 'super', email: 'super@test.com' }, true],
    ['5.9', 'delete_riwayat', TEST_USER_USER_, true],
    ['5.10', 'delete_kualifikasi', TEST_USER_USER_, true]
  ];

  checks.forEach(function(item) {
    try {
      var r = checkActionRole_(item[1], item[2]);
      _assert_(results, item[0] + ' ' + item[2].role + ' → ' + item[1],
        r.allowed === item[3], 'allowed=' + r.allowed);
    } catch (e) {
      _assert_(results, item[0], false, e.message);
    }
  });

  return results;
}

// ==================== 6. LOOKUP READ-ONLY ====================

function testLookupReadOnly() {
  Logger.log('');
  var results = [];

  try {
    var pegawai = getSheetData_('PEGAWAI');
    _assert_(results, '6.1 SIMPEG pegawai > 50', pegawai.length >= 50, 'Jumlah: ' + pegawai.length);
  } catch (e) { _assert_(results, '6.1 SIMPEG pegawai > 50', false, e.message); }

  try {
    var pegawai = getSheetData_('PEGAWAI');
    var allFourDigit = pegawai.every(function(p) {
      return /^PEG-\d{4}$/.test(String(p.pegawai_id || p.id || ''));
    });
    _assert_(results, '6.2 Pegawai ID format 4 digit', allFourDigit, '');
  } catch (e) { _assert_(results, '6.2 Pegawai ID format 4 digit', false, e.message); }

  try {
    var kat = getSheetData_(LOCAL_SHEETS.M_KATALOG_DIKLAT);
    _assert_(results, '6.3 M_KATALOG_DIKLAT ada isi', kat.length > 0, 'Jumlah: ' + kat.length);
  } catch (e) { _assert_(results, '6.3 M_KATALOG_DIKLAT ada isi', false, e.message); }

  try {
    var ref = getSheetData_(LOCAL_SHEETS.M_REFERENSI);
    _assert_(results, '6.4 M_REFERENSI ada isi', ref.length > 0, 'Jumlah: ' + ref.length);
  } catch (e) { _assert_(results, '6.4 M_REFERENSI ada isi', false, e.message); }

  return results;
}

// ==================== 7. FIX-L16 ====================

function testFixL16() {
  Logger.log('');
  var results = [];

  try {
    var res = getKualifikasiExpiringSoon_({});
    _assert_(results, '7.1 Default include_expired=false',
      res.success && Array.isArray(res.data_expired) && res.data_expired.length === 0,
      'data_expired: ' + (res.data_expired ? res.data_expired.length : 'undefined'));
  } catch (e) { _assert_(results, '7.1 Default include_expired=false', false, e.message); }

  try {
    var res2 = getKualifikasiExpiringSoon_({ include_expired: true });
    _assert_(results, '7.2 Explicit include_expired=true',
      res2.success && Array.isArray(res2.data_expired),
      '');
  } catch (e) { _assert_(results, '7.2 Explicit include_expired=true', false, e.message); }

  return results;
}

// ==================== 8. FIX-M16 ====================

function testFixM16() {
  Logger.log('');
  var results = [];

  try {
    var res = saveKatalog_({
      nama_diklat: 'TEST FIX M16 ' + Date.now(),
      rumpun: 'RUMPUN NGAWUR',
      default_jp: 20
    }, TEST_USER_ADMIN_);
    _assert_(results, '8.1 Rumpun ngawur → fallback Teknis Operasional',
      res.success && res.data.rumpun === 'Teknis Operasional',
      'rumpun: ' + (res.data ? res.data.rumpun : res.error));

    // Cleanup
    if (res.success && res.data && res.data.id) {
      softDeleteRecord_(LOCAL_SHEETS.M_KATALOG_DIKLAT, res.data.id, TEST_USER_ADMIN_);
    }
  } catch (e) { _assert_(results, '8.1 Rumpun ngawur → fallback', false, e.message); }

  try {
    var res2 = saveKatalog_({
      nama_diklat: 'TEST FIX M16B ' + Date.now(),
      rumpun: 'Manajerial & Kepemimpinan',
      default_jp: 20
    }, TEST_USER_ADMIN_);
    _assert_(results, '8.2 Rumpun valid tetap',
      res2.success && res2.data.rumpun === 'Manajerial & Kepemimpinan',
      'rumpun: ' + (res2.data ? res2.data.rumpun : res2.error));

    if (res2.success && res2.data && res2.data.id) {
      softDeleteRecord_(LOCAL_SHEETS.M_KATALOG_DIKLAT, res2.data.id, TEST_USER_ADMIN_);
    }
  } catch (e) { _assert_(results, '8.2 Rumpun valid tetap', false, e.message); }

  return results;
}

// ==================== 9. FIX-R17 ====================

function testFixR17() {
  Logger.log('');
  var results = [];

  try {
    var res = saveUsulan_({
      nama_program_diklat: 'TEST FIX R17 ' + Date.now(),
      pegawai_id: 'PEG-0001',
      status_rencana: 'STATUS_NGAWUR_XYZ'
    }, TEST_USER_ADMIN_);
    _assert_(results, '9.1 Status ngawur ditolak',
      !res.success && res.error && res.error.indexOf('tidak valid') !== -1,
      'error: ' + (res.error || 'NO ERROR'));
  } catch (e) { _assert_(results, '9.1 Status ngawur ditolak', false, e.message); }

  try {
    var res2 = saveUsulan_({
      nama_program_diklat: 'TEST FIX R17B ' + Date.now(),
      pegawai_id: 'PEG-0001',
      status_rencana: 'DIAJUKAN'
    }, TEST_USER_ADMIN_);
    _assert_(results, '9.2 Status lowercase di-map ke kanonik',
      res2.success && res2.data.status_rencana === 'Diajukan',
      'status_rencana: ' + (res2.data ? res2.data.status_rencana : res2.error));

    if (res2.success && res2.data && res2.data.id) {
      softDeleteRecord_(LOCAL_SHEETS.T_USULAN_DIKLAT, res2.data.id, TEST_USER_ADMIN_);
    }
  } catch (e) { _assert_(results, '9.2 Status lowercase di-map', false, e.message); }

  return results;
}
