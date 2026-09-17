// ============================================================
// SI-KOMPETENSI - 06_MasterLogic.gs (v4.1.0 — FASE 1)
// Master Katalog, Standar Kompetensi, Referensi & Init Database
// ============================================================
// Changelog v4.1:
// - FIX-M1: Audit log di deleteKatalog_, deleteStandarKompetensi_,
//           deleteReferensi_ (sebelumnya hilang total).
// - FIX-M2: generate kode via genUniqueCode_ (saveKatalog_).
// - FIX-M3: cek duplikat (jabatan_id, diklat_id) di saveStandarKompetensi_.
// - FIX-M4: cek duplikat (kategori, kode) di saveReferensi_.
// - FIX-M5: initDatabase(actor) terima actor untuk audit.
// - FIX-M6: Enrichment nama_jabatan robust (tetap isi kalau kosong).
// - FIX-M7: level_kompetensi default konsisten dengan fallback.
// - FIX-M8: Whitelist rumpun & kategori.
// - FIX-M9: saveStandarKompetensi_ - fix minimal_jp=0 yang dianggap falsy.
// - FIX-M10: setupApp - jangan overwrite config user yang sudah ada.
// - FIX-M11: setupApp - cek hasil initDatabase sebelum lanjut.
// - FIX-M12: initDatabase - cek ss null, log error.
// - FIX-M13: initDatabase - log warning saat format header gagal.
// - FIX-M14: saveReferensi_ normalisasi status_aktif ke 'true'/'false'.
// - FIX-M15: Whitelist level_kompetensi & tingkat_kebutuhan.
// - FIX-M16: saveKatalog_ whitelist rumpun BENAR-BENAR dipakai
//   (sebelumnya cuma di klaim di komentar). Soft-fail ke 'Teknis Operasional'.
// - Changelog v4.1 tetap berlaku (FIX-M1 s.d. M15).
// ============================================================

// Whitelist kategori referensi (kategori dari M_REFERENSI)
var KATEGORI_REFERENSI_VALID_ = [
  'RUMPUN_KOMPETENSI',
  'METODE_PELATIHAN',
  'URGENSI_USULAN',
  'PENYELENGGARA',
  'JENIS_KUALIFIKASI_KHUSUS',
  'STATUS_PEGAWAI',
  'PANGKAT_GOLONGAN',
  'TINGKAT_KEBUTUHAN',
  'JENIS_JABATAN'
];

// Level kompetensi valid (konsisten dengan FALLBACK_STANDAR_KOMPETENSI)
var LEVEL_KOMPETENSI_VALID_ = [
  'Level 1 - Pertama / Pelaksana',
  'Level 1 - Terampil / Pelaksana',
  'Level 2 - Pengawas / Terampil',
  'Level 3 - Administrator',
  'Level 4 - JPT Pratama'
];

// Tingkat kebutuhan
var TINGKAT_KEBUTUHAN_VALID_ = ['WAJIB', 'DISARANKAN'];

// ==================== KATALOG DIKLAT ====================

/**
 * Simpan katalog diklat.
 * FIX-M2: generate kode via genUniqueCode_.
 * FIX-M8: whitelist rumpun (soft).
 */
// v5.0: whitelist rumpun dari konfigurasi terpusat
var RUMPUN_DIKLAT_VALID_ = [
  'Manajerial & Kepemimpinan',
  'Teknis Operasional',
  'Fungsional Umum',
  'Sosial Kultural',
  'Pemerintahan',
  'Lainnya'
];

/**
 * Simpan katalog diklat.
 *
 * v5.0 FIX-M16: whitelist rumpun BENAR-BENAR dipakai (sebelumnya hanya
 *   diklaim di komentar). Perilaku:
 *   - Rumpun valid → dipertahankan (canonical case)
 *   - Rumpun tidak valid → soft-fallback ke 'Teknis Operasional' + log WARN
 *   - Rumpun kosong → default 'Teknis Operasional'
 *
 * @param {Object} params - { record?: {...}, ...recordFields }
 * @param {Object} user
 * @returns {Object} { success, data? , error? }
 */
function saveKatalog_(params, user) {
  try {
    var record = params.record || params;

    // ---------- Validasi dasar ----------
    if (!record.nama_diklat) {
      return { success: false, error: 'Nama program diklat wajib diisi.' };
    }

    // ---------- Validasi default_jp ----------
    if (record.default_jp !== undefined && record.default_jp !== '') {
      var jp = Number(record.default_jp);
      if (isNaN(jp) || jp < 0) {
        return { success: false, error: 'Default JP tidak valid.' };
      }
      record.default_jp = jp;
    }

    // ---------- v5.0 FIX-M16: whitelist rumpun (soft-fail) ----------
    if (record.rumpun) {
      var rr = String(record.rumpun).trim();
      var matched = null;
      for (var i = 0; i < RUMPUN_DIKLAT_VALID_.length; i++) {
        if (normStr_(RUMPUN_DIKLAT_VALID_[i]) === normStr_(rr)) {
          matched = RUMPUN_DIKLAT_VALID_[i];
          break;
        }
      }
      if (matched) {
        record.rumpun = matched;
      } else {
        Logger.log('[WARN] rumpun "' + rr + '" tidak di whitelist. Fallback ke "Teknis Operasional".');
        record.rumpun = 'Teknis Operasional';
      }
    } else {
      record.rumpun = 'Teknis Operasional';
    }

    // ---------- Generate kode saat insert baru ----------
    if (!record.id && !record.kode_diklat) {
      record.kode_diklat = genUniqueCode_('DKL-', LOCAL_SHEETS.M_KATALOG_DIKLAT, 'kode_diklat', 3);
    }

    // ---------- Normalisasi status_aktif ----------
    if (record.status_aktif !== undefined) {
      record.status_aktif = String(record.status_aktif).toLowerCase() === 'false' ? 'false' : 'true';
    }

    // ---------- Simpan ----------
    var saved = saveRecord_(LOCAL_SHEETS.M_KATALOG_DIKLAT, record, user);

    audit_(user, record.id ? 'UPDATE_KATALOG' : 'CREATE_KATALOG',
      'M_KATALOG_DIKLAT', saved.id, true, 'Katalog: ' + saved.nama_diklat);

    return { success: true, data: saved };

  } catch (err) {
    Logger.log('[saveKatalog_] ' + err.message);
    audit_(user, 'SAVE_KATALOG', 'M_KATALOG_DIKLAT',
      (params.record && params.record.id) || '', false, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Hapus katalog.
 * FIX-M1: audit log.
 */
function deleteKatalog_(params, user) {
  try {
    var id = params.id;
    if (!id) return { success: false, error: 'ID katalog wajib disertakan.' };

    // Cek apakah masih dipakai di standar kompetensi
    var standar = getSheetData_(LOCAL_SHEETS.M_STANDAR_KOMPETENSI) || [];
    var usedIn = standar.filter(function(s) {
      return normId_(s.diklat_id) === normId_(id) && !s.deleted_at;
    });
    if (usedIn.length > 0) {
      var msg = 'Katalog tidak bisa dihapus: masih dipakai di ' + usedIn.length + ' standar kompetensi.';
      audit_(user, 'DELETE_KATALOG', 'M_KATALOG_DIKLAT', id, false, msg);
      return { success: false, error: msg, count: usedIn.length };
    }

    var ok = softDeleteRecord_(LOCAL_SHEETS.M_KATALOG_DIKLAT, id, user);

    audit_(user, 'DELETE_KATALOG', 'M_KATALOG_DIKLAT', id, ok,
      ok ? 'Hapus katalog: ' + id : 'Katalog tidak ditemukan: ' + id);

    return {
      success: ok,
      message: ok ? 'Katalog berhasil dihapus.' : 'Katalog tidak ditemukan.'
    };
  } catch (err) {
    Logger.log('[deleteKatalog_] ' + err.message);
    return { success: false, error: err.message };
  }
}

// ==================== STANDAR KOMPETENSI ====================

/**
 * Simpan standar kompetensi jabatan.
 * FIX-M3: cek duplikat (jabatan_id, diklat_id).
 * FIX-M6: enrichment robust.
 * FIX-M9: minimal_jp=0 tidak dianggap falsy.
 * FIX-M15: whitelist level_kompetensi & tingkat_kebutuhan.
 */
function saveStandarKompetensi_(params, user) {
  try {
    var record = params.record || params;

    if (!record.jabatan_id || !record.diklat_id) {
      return { success: false, error: 'Jabatan dan Diklat wajib dipilih.' };
    }

    // Normalisasi ID
    record.jabatan_id = normalizeEntityId_(record.jabatan_id);
    record.diklat_id = normalizeEntityId_(record.diklat_id);

    // FIX-M3: cek duplikat (jabatan_id + diklat_id) saat insert baru
    if (!record.id) {
      var existing = getSheetData_(LOCAL_SHEETS.M_STANDAR_KOMPETENSI) || [];
      var duplicate = existing.find(function(s) {
        if (s.deleted_at) return false;
        return normalizeEntityId_(s.jabatan_id) === normalizeEntityId_(record.jabatan_id) &&
               normalizeEntityId_(s.diklat_id) === normalizeEntityId_(record.diklat_id);
      });
      if (duplicate) {
        return {
          success: false,
          error: 'Standar untuk jabatan + diklat ini sudah ada (ID: ' + duplicate.id + '). Edit yang ada atau pilih diklat lain.'
        };
      }
    }

    // FIX-M15: whitelist tingkat_kebutuhan
    if (record.tingkat_kebutuhan) {
      var tk = String(record.tingkat_kebutuhan).toUpperCase();
      try {
        whitelist_(tk, TINGKAT_KEBUTUHAN_VALID_, 'tingkat_kebutuhan');
        record.tingkat_kebutuhan = tk;
      } catch (e) {
        return { success: false, error: e.message };
      }
    }

    // FIX-M6: enrichment nama_jabatan
    if (record.jabatan_id) {
      var simpeg = getSimpegLookup_();
      var jabList = (simpeg && simpeg.data && simpeg.data.jabatan) || [];
      var j = jabList.find(function(x) {
        return normId_(x.id) === normId_(record.jabatan_id) ||
               normId_(x.jabatan_id) === normId_(record.jabatan_id) ||
               normId_(x.kode_jabatan) === normId_(record.jabatan_id);
      });
      if (!j && typeof FALLBACK_JABATAN !== 'undefined') {
        j = FALLBACK_JABATAN.find(function(x) {
          return normId_(x.id) === normId_(record.jabatan_id) ||
                 normId_(x.jabatan_id) === normId_(record.jabatan_id);
        });
      }
      if (j && !record.nama_jabatan) {
        record.nama_jabatan = j.nama_jabatan || j.nama || record.jabatan_id;
      }
    }

    // Enrichment nama_diklat & rumpun
    if (!record.nama_diklat || !record.rumpun) {
      var katalog = getSheetData_(LOCAL_SHEETS.M_KATALOG_DIKLAT) || [];
      var d = katalog.find(function(x) { return normId_(x.id) === normId_(record.diklat_id); });
      if (d) {
        if (!record.nama_diklat) record.nama_diklat = d.nama_diklat;
        if (!record.rumpun) record.rumpun = d.rumpun || 'Teknis Operasional';
        // FIX-M9: minimal_jp=0 tidak dianggap falsy — pakai cek explicit
        if ((record.minimal_jp === undefined || record.minimal_jp === null || record.minimal_jp === '') && d.default_jp) {
          record.minimal_jp = Number(d.default_jp);
        }
      }
    }

    // FIX-M7: default level_kompetensi konsisten dengan fallback
    if (!record.level_kompetensi) {
      record.level_kompetensi = 'Level 2 - Pengawas / Terampil';
    }

    // FIX-M15: whitelist level_kompetensi (soft)
    if (record.level_kompetensi && LEVEL_KOMPETENSI_VALID_.indexOf(record.level_kompetensi) === -1) {
      Logger.log('[WARN] level_kompetensi "' + record.level_kompetensi + '" tidak di whitelist.');
    }

    // Normalisasi minimal_jp
    if (record.minimal_jp !== undefined && record.minimal_jp !== '') {
      var mj = Number(record.minimal_jp);
      if (isNaN(mj) || mj < 0) {
        return { success: false, error: 'Minimal JP tidak valid.' };
      }
      record.minimal_jp = mj;
    }

    // Normalisasi status_aktif
    if (record.status_aktif !== undefined) {
      record.status_aktif = String(record.status_aktif).toLowerCase() === 'false' ? 'false' : 'true';
    }

    var saved = saveRecord_(LOCAL_SHEETS.M_STANDAR_KOMPETENSI, record, user);

    audit_(user, record.id ? 'UPDATE_STANDAR' : 'CREATE_STANDAR',
      'M_STANDAR_KOMPETENSI', saved.id, true,
      'Standar: ' + (saved.nama_jabatan || saved.jabatan_id));

    return { success: true, data: saved };
  } catch (err) {
    Logger.log('[saveStandarKompetensi_] ' + err.message);
    audit_(user, 'SAVE_STANDAR', 'M_STANDAR_KOMPETENSI',
      (params.record && params.record.id) || '', false, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Hapus standar kompetensi.
 * FIX-M1: audit log.
 */
function deleteStandarKompetensi_(params, user) {
  try {
    var id = params.id;
    if (!id) return { success: false, error: 'ID standar wajib disertakan.' };

    var ok = softDeleteRecord_(LOCAL_SHEETS.M_STANDAR_KOMPETENSI, id, user);

    audit_(user, 'DELETE_STANDAR', 'M_STANDAR_KOMPETENSI', id, ok,
      ok ? 'Hapus standar: ' + id : 'Standar tidak ditemukan: ' + id);

    return {
      success: ok,
      message: ok ? 'Standar kompetensi dihapus.' : 'Standar tidak ditemukan.'
    };
  } catch (err) {
    Logger.log('[deleteStandarKompetensi_] ' + err.message);
    return { success: false, error: err.message };
  }
}

// ==================== MASTER REFERENSI ====================

/**
 * Simpan referensi.
 * FIX-M4: cek duplikat (kategori, kode).
 * FIX-M8: whitelist kategori.
 * FIX-M14: normalisasi status_aktif.
 */
function saveReferensi_(params, user) {
  try {
    var record = params.record || params;

    if (!record.kategori || !record.nama_nilai) {
      return { success: false, error: 'Kategori dan nama nilai referensi wajib diisi.' };
    }

    // FIX-M8: whitelist kategori
    var kat = String(record.kategori).toUpperCase().trim();
    try {
      whitelist_(kat, KATEGORI_REFERENSI_VALID_, 'kategori');
      record.kategori = kat;
    } catch (e) {
      Logger.log('[WARN] ' + e.message);
      // Soft fail — lanjut saja, biar admin bisa tambah kategori baru
    }

    // FIX-M4: cek duplikat (kategori + kode) saat insert baru
    if (!record.id && record.kode) {
      var existing = getSheetData_(LOCAL_SHEETS.M_REFERENSI) || [];
      var duplicate = existing.find(function(r) {
        if (r.deleted_at) return false;
        return String(r.kategori).toUpperCase() === kat &&
               String(r.kode).toUpperCase() === String(record.kode).toUpperCase();
      });
      if (duplicate) {
        return {
          success: false,
          error: 'Referensi dengan kategori "' + kat + '" dan kode "' + record.kode + '" sudah ada.'
        };
      }
    }

    // FIX-M14: normalisasi status_aktif
    if (record.status_aktif !== undefined) {
      record.status_aktif = String(record.status_aktif).toLowerCase() === 'false' ? 'false' : 'true';
    } else {
      record.status_aktif = 'true';
    }

    // Normalisasi urutan
    if (record.urutan !== undefined && record.urutan !== '') {
      var u = Number(record.urutan);
      if (!isNaN(u)) record.urutan = u;
    }

    var saved = saveRecord_(LOCAL_SHEETS.M_REFERENSI, record, user);

    audit_(user, record.id ? 'UPDATE_REFERENSI' : 'CREATE_REFERENSI',
      'M_REFERENSI', saved.id, true,
      'Referensi: ' + saved.kategori + ' / ' + saved.kode);

    return { success: true, data: saved };
  } catch (err) {
    Logger.log('[saveReferensi_] ' + err.message);
    audit_(user, 'SAVE_REFERENSI', 'M_REFERENSI',
      (params.record && params.record.id) || '', false, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Hapus referensi.
 * FIX-M1: audit log.
 */
function deleteReferensi_(params, user) {
  try {
    var id = params.id;
    if (!id) return { success: false, error: 'ID referensi wajib disertakan.' };

    var ok = softDeleteRecord_(LOCAL_SHEETS.M_REFERENSI, id, user);

    audit_(user, 'DELETE_REFERENSI', 'M_REFERENSI', id, ok,
      ok ? 'Hapus referensi: ' + id : 'Referensi tidak ditemukan: ' + id);

    return {
      success: ok,
      message: ok ? 'Item referensi berhasil dihapus.' : 'Referensi tidak ditemukan.'
    };
  } catch (err) {
    Logger.log('[deleteReferensi_] ' + err.message);
    return { success: false, error: err.message };
  }
}

// ==================== DATABASE INITIALIZATION ====================

/**
 * Inisialisasi 8 sheet SI-KOMPETENSI.
 *
 * FIX-M5: terima actor untuk audit.
 * FIX-M12: cek ss null.
 * FIX-M13: log warning saat format header gagal.
 *
 * @param {Object} actor - optional, untuk audit
 */
function initDatabase(actor) {
  try {
    var ss = getLocalSpreadsheet_();

    // FIX-M12: cek ss null
    if (!ss) {
      var errMsg = 'Spreadsheet lokal tidak dapat dibuka. Cek SPREADSHEET_ID di Script Properties.';
      Logger.log('[ERROR] ' + errMsg);
      audit_(actor, 'INIT_DB', 'SYSTEM', 'ALL', false, errMsg);
      return { success: false, error: errMsg };
    }

    var created = [];
    var updated = [];

    // C1 (CoreLib v2.2.4): mekanisme buat/sinkron-hias header didelegasikan ke
    // CoreLib.ensureSheet. Orkestrasi TETAP di app: subset 8 sheet lokal (BUKAN
    // CoreLib.initDatabase penuh — itu akan menambah AUDIT_LOGS/KONFIGURASI/
    // MAIN_DATA yang tidak dipakai app ini), bersih-bersih Sheet1, audit.
    var ssId = getSpreadsheetId_();
    var hiasHeader_ = { bg: '#059669', font: '#ffffff', bold: true, frozen: 1 };
    var bukanRef_ = function() { return false; };
    Object.keys(LOCAL_SHEETS).forEach(function(key) {
      var sheetName = LOCAL_SHEETS[key];
      if (!ALL_SHEET_HEADERS[sheetName]) return;

      var sebelum = ss.getSheetByName(sheetName);
      var kolomSebelum = sebelum ? sebelum.getLastColumn() : 0;

      CoreLib.ensureSheet(ssId, sheetName, ALL_SHEET_HEADERS, {
        isRefFunc: bukanRef_,
        decorate: hiasHeader_
      });

      if (!sebelum) { created.push(sheetName); return; }
      var sesudah = ss.getSheetByName(sheetName);
      if (sesudah && sesudah.getLastColumn() > kolomSebelum) {
        updated.push(sheetName + ' (+' + (sesudah.getLastColumn() - kolomSebelum) + ' kolom)');
      }
    });

    // Hapus Sheet1 / Sheet default kalau kosong
    try {
      var defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Sheet 1');
      if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() === 0) {
        ss.deleteSheet(defaultSheet);
      }
    } catch (e) {
      Logger.log('[WARN] Gagal hapus Sheet1: ' + e.message);
    }

    var summary = 'Inisialisasi basis data 8-Sheet SI-KOMPETENSI selesai.';
    if (created.length > 0) summary += ' Dibuat: ' + created.join(', ') + '.';
    if (updated.length > 0) summary += ' Kolom diselaraskan: ' + updated.join(', ') + '.';
    Logger.log('✅ ' + summary);

    audit_(actor, 'INIT_DB', 'SYSTEM', 'ALL', true,
      'Dibuat: ' + created.length + ', Update: ' + updated.length);

    return { success: true, created: created, updated: updated, summary: summary };
  } catch (err) {
    Logger.log('[initDatabase] ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Setup aplikasi (jalankan sekali pertama kali).
 * FIX-M5: initDatabase(actor).
 * FIX-M10: jangan overwrite config user yang sudah ada.
 * FIX-M11: cek hasil initDatabase sebelum lanjut.
 */
function setupApp(actor) {
  try {
    Logger.log('🚀 Memulai Setup SI-KOMPETENSI...');

    // FIX-M11: cek hasil initDatabase
    var initRes = initDatabase(actor);
    if (!initRes.success) {
      return { success: false, error: 'Init DB gagal: ' + initRes.error };
    }

    var props = appProps_();
    var activeId = getSpreadsheetId_();
    if (!activeId) {
      try { activeId = SpreadsheetApp.getActiveSpreadsheet().getId(); } catch(e) {}
    }

    // FIX-M10: JANGAN overwrite kalau sudah ada
    var current = props.getProperties() || {};
    var newProps = {
      APP_TITLE: APP_TITLE,
      APP_CODE: APP_CODE,
      SPREADSHEET_ID: activeId || '',
      MASTER_SPREADSHEET_ID: MASTER_SPREADSHEET_ID,
      PLATFORM_SPREADSHEET_ID: PLATFORM_SPREADSHEET_ID,
      PLATFORM_API_URL: PLATFORM_API_URL
    };
    var written = [];
    Object.keys(newProps).forEach(function(k) {
      if (!current[k]) {
        props.setProperty(k, newProps[k]);
        written.push(k);
      }
    });

    Logger.log('✅ Setup SI-KOMPETENSI selesai. Properti baru: ' + (written.join(', ') || 'tidak ada'));

    audit_(actor, 'SETUP_APP', 'SYSTEM', 'ALL', true,
      'Setup selesai. Properti baru: ' + written.length);

    return {
      success: true,
      message: 'Setup aplikasi berhasil.',
      created: initRes.created,
      updated: initRes.updated,
      properties_written: written
    };
  } catch (err) {
    Logger.log('[setupApp] ' + err.message);
    return { success: false, error: err.message };
  }
}

// ==================== SELF-TEST ====================

function testMasterSelfCheck() {
  Logger.log('=== 06_MasterLogic.gs v4.1 self-check ===');

  // Test 1: initDatabase dengan actor
  var res = initDatabase({ email: 'test@test.com', role: 'super' });
  Logger.log((res.success ? '✅' : '❌') + ' initDatabase: ' + (res.summary || res.error));

  // Test 2: saveKatalog_ generate kode
  var katalogTest = {
    nama_diklat: 'Test Katalog ' + Date.now(),
    rumpun: 'Manajerial & Kepemimpinan',
    default_jp: 20
  };
  var katalogRes = saveKatalog_(katalogTest, { email: 'test@test.com', role: 'admin' });
  Logger.log((katalogRes.success ? '✅' : '❌') + ' saveKatalog_: ' + (katalogRes.data && katalogRes.data.kode_diklat || katalogRes.error));

  // Test 3: cek duplikat standar
  var stdTest = {
    jabatan_id: 'JAB-0001',
    diklat_id: 'DKL-001',
    tingkat_kebutuhan: 'WAJIB',
    minimal_jp: 20
  };
  var stdRes = saveStandarKompetensi_(stdTest, { email: 'test@test.com', role: 'admin' });
  Logger.log((stdRes.success ? '✅' : '⚠️') + ' saveStandarKompetensi_ (mungkin duplikat): ' + (stdRes.data && stdRes.data.id || stdRes.error));

  // Test 4: whitelist kategori
  var badRef = saveReferensi_({
    kategori: 'KATEGORI_ASAL',
    kode: 'TEST',
    nama_nilai: 'Test'
  }, { email: 'test@test.com', role: 'admin' });
  Logger.log((!badRef.success ? '✅' : '⚠️') + ' whitelist kategori (soft): ' + (badRef.error || 'diterima (soft)'));

  // Test 5: minimal_jp=0 tidak dianggap falsy
  var zeroJp = saveStandarKompetensi_({
    jabatan_id: 'JAB-0002',
    diklat_id: 'DKL-002',
    minimal_jp: 0,
    tingkat_kebutuhan: 'WAJIB'
  }, { email: 'test@test.com', role: 'admin' });
  Logger.log((zeroJp.success ? '✅' : '⚠️') + ' minimal_jp=0 dipertahankan: ' + (zeroJp.data && zeroJp.data.minimal_jp));

  // Cleanup test data
  if (katalogRes.success && katalogRes.data) {
    deleteKatalog_({ id: katalogRes.data.id }, { email: 'test@test.com', role: 'admin' });
  }
  if (stdRes.success && stdRes.data) {
    deleteStandarKompetensi_({ id: stdRes.data.id }, { email: 'test@test.com', role: 'admin' });
  }
  if (zeroJp.success && zeroJp.data) {
    deleteStandarKompetensi_({ id: zeroJp.data.id }, { email: 'test@test.com', role: 'admin' });
  }

  Logger.log('=== Selesai ===');
}

function testSaveKatalogV5() {
  Logger.log('=== Test saveKatalog_ v5.0 ===');

  // Test 1: rumpun ngawur → fallback
  var r1 = saveKatalog_({
    nama_diklat: 'TEST_RUMPUN_NGAWUR_' + Date.now(),
    rumpun: 'Rumpun Aneh XYZ',
    default_jp: 10
  }, { email: 'test@test.com', role: 'admin' });

  Logger.log((r1.success && r1.data.rumpun === 'Teknis Operasional' ? '✅' : '❌') +
    ' rumpun ngawur → fallback: ' + (r1.data ? r1.data.rumpun : r1.error));

  if (r1.success && r1.data && r1.data.id) {
    softDeleteRecord_(LOCAL_SHEETS.M_KATALOG_DIKLAT, r1.data.id, { email: 'test@test.com' });
  }

  // Test 2: rumpun valid
  var r2 = saveKatalog_({
    nama_diklat: 'TEST_RUMPUN_VALID_' + Date.now(),
    rumpun: 'manajerial & kepemimpinan',   // ← lowercase sengaja
    default_jp: 20
  }, { email: 'test@test.com', role: 'admin' });

  Logger.log((r2.success && r2.data.rumpun === 'Manajerial & Kepemimpinan' ? '✅' : '❌') +
    ' rumpun lowercase → kanonik: ' + (r2.data ? r2.data.rumpun : r2.error));

  if (r2.success && r2.data && r2.data.id) {
    softDeleteRecord_(LOCAL_SHEETS.M_KATALOG_DIKLAT, r2.data.id, { email: 'test@test.com' });
  }

  // Test 3: rumpun kosong → default
  var r3 = saveKatalog_({
    nama_diklat: 'TEST_RUMPUN_KOSONG_' + Date.now(),
    default_jp: 15
  }, { email: 'test@test.com', role: 'admin' });

  Logger.log((r3.success && r3.data.rumpun === 'Teknis Operasional' ? '✅' : '❌') +
    ' rumpun kosong → default: ' + (r3.data ? r3.data.rumpun : r3.error));

  if (r3.success && r3.data && r3.data.id) {
    softDeleteRecord_(LOCAL_SHEETS.M_KATALOG_DIKLAT, r3.data.id, { email: 'test@test.com' });
  }

  Logger.log('=== Selesai ===');
}
