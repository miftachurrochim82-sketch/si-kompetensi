// ============================================================
// SI-KOMPETENSI - 01_ConfigAndBridge.gs (v2.4.0 — Opsi B 6-Sheet)
// Standar Spesifik Satpol PP & Pemadam Kebakaran Kab. Trenggalek
// ============================================================

var APP_TITLE = 'SI-KOMPETENSI';
var APP_CODE = 'SIKOMPETENSI';

// URL Portal Utama SSO Pusat (Fallback bila Properties kosong)
var DEFAULT_PLATFORM_URL = 'https://script.google.com/macros/s/AKfycbwh_OUVqmxLcuF81FHmPZtT33Wrm8Ce9Da1SQ3hfkSr7gM5P8ofyAlHSgW40mq3eo-PoQ/exec';

function appProps_() {
  try {
    return PropertiesService.getScriptProperties();
  } catch(e) {
    return {
      getProperty: function() { return null; },
      getProperties: function() { return {}; },
      setProperty: function() {},
      setProperties: function() {}
    };
  }
}

function getEnvProperty_(key) {
  try {
    var val = appProps_().getProperty(key);
    if (val) return val;
  } catch(e) {}
  if (typeof CoreLib !== 'undefined' && typeof CoreLib.getEnvProperty === 'function') {
    try { return CoreLib.getEnvProperty(key, appProps_()); } catch(e) {}
  }
  return '';
}

var SPREADSHEET_ID = getEnvProperty_('SPREADSHEET_ID') || (function() {
  try { return SpreadsheetApp.getActiveSpreadsheet().getId(); } catch(e) { return ''; }
})();

var MASTER_SPREADSHEET_ID = getEnvProperty_('MASTER_SPREADSHEET_ID') || SPREADSHEET_ID;
var ROOT_FOLDER_ID = getEnvProperty_('ROOT_FOLDER_ID');
var BACKUP_FOLDER_ID = getEnvProperty_('BACKUP_FOLDER_ID');
var EVIDENCE_FOLDER_ID = getEnvProperty_('EVIDENCE_FOLDER_ID');

var PLATFORM_API_URL = getEnvProperty_('PLATFORM_API_URL') || DEFAULT_PLATFORM_URL;
var SESSION_PREFIX = 'APP_SESSION_' + APP_CODE + '_';
var SESSION_TTL_SECONDS = 6 * 60 * 60; // 6 jam
var DATA_CACHE_TTL = 180; // 3 Menit
var ROLE_LEVELS = { viewer: 1, user: 1, verifikator: 2, admin: 3, super: 3 };

// ==================== 6 SHEET UTAMA OPSI B (SATPOL PP & DAMKAR) ====================
var LOCAL_SHEET_NAMES = {
  M_PEGAWAI: 'M_PEGAWAI',
  M_UNIT_KERJA: 'M_UNIT_KERJA',
  M_JABATAN: 'M_JABATAN',
  M_KATALOG_DIKLAT: 'M_KATALOG_DIKLAT',
  T_KOMPETENSI_PEGAWAI: 'T_KOMPETENSI_PEGAWAI',
  T_USULAN_DIKLAT: 'T_USULAN_DIKLAT',
  // Kompatibilitas alias lama
  DATA_KOMPETENSI: 'T_KOMPETENSI_PEGAWAI',
  LAPORAN: 'T_KOMPETENSI_PEGAWAI',
  KONFIGURASI: 'KONFIGURASI',
  AUDIT_LOGS: 'AUDIT_LOGS',
  ZZ_TEST_CRUD: 'ZZ_TEST_CRUD'
};

// ==================== HEADER STRUKTUR DATABASE 6 SHEET ====================
var LOCAL_SHEET_HEADERS = {
  M_PEGAWAI: [
    'id', 'nip', 'nik', 'nama_lengkap', 'gelar_depan', 'gelar_belakang',
    'email', 'pangkat_gol', 'jabatan_id', 'unit_id', 'regu_pleton',
    'is_ppns', 'no_sk_ppns', 'kualifikasi_damkar', 'status_aktif',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  M_UNIT_KERJA: [
    'id', 'kode_unit', 'nama_unit', 'kategori_unit', 'lokasi',
    'kepala_nip', 'telepon',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  M_JABATAN: [
    'id', 'kode_jabatan', 'nama_jabatan', 'rumpun_jabatan', 'jenjang_jabatan', 'target_jp_tahunan',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  M_KATALOG_DIKLAT: [
    'id', 'kode_diklat', 'nama_diklat', 'rumpun', 'kategori_keahlian',
    'penyelenggara_default', 'default_jp', 'deskripsi',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  T_KOMPETENSI_PEGAWAI: [
    'id', 'pegawai_id', 'diklat_id', 'nama_kegiatan', 'rumpun',
    'penyelenggara', 'no_sertifikat', 'tgl_terbit', 'tgl_mulai', 'tgl_selesai', 'tgl_kedaluwarsa',
    'jumlah_jp', 'metode', 'file_url', 'status_verifikasi', 'catatan_verifikator',
    'verifikator_id', 'tanggal_verifikasi',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  T_USULAN_DIKLAT: [
    'id', 'pegawai_id', 'diklat_id', 'nama_diklat_usulan', 'rumpun',
    'target_penyelenggara', 'alasan_usulan', 'urgensi', 'estimasi_biaya',
    'status_usulan', 'catatan_pimpinan', 'tgl_pengajuan',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  KONFIGURASI: ['id', 'key', 'value', 'keterangan', 'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'],
  AUDIT_LOGS: ['id', 'timestamp', 'actor_id', 'action', 'resource_type', 'resource_id', 'result', 'ip', 'user_agent', 'details'],
  ZZ_TEST_CRUD: ['id', 'name', 'status', 'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at']
};

/**
 * Helper Membuka Spreadsheet Lokal secara Native (Bebas Error CoreLib.getSpreadsheet)
 */
function getLocalSpreadsheet_() {
  if (SPREADSHEET_ID) {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      Logger.log('[WARN] Tidak dapat membuka SPREADSHEET_ID (' + SPREADSHEET_ID + '): ' + e.message);
    }
  }
  try {
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    Logger.log('[WARN] Tidak ada getActiveSpreadsheet: ' + e.message);
  }
  return null;
}

/**
 * Helper Membuka Spreadsheet Master SIMPEG
 */
function getMasterSpreadsheet_() {
  if (MASTER_SPREADSHEET_ID) {
    try {
      return SpreadsheetApp.openById(MASTER_SPREADSHEET_ID);
    } catch (e) {}
  }
  return getLocalSpreadsheet_();
}

/**
 * Membaca data seluruh baris dari Sheet sebagai Array of Objects JSON
 */
function getSheetData_(sheetName) {
  var ss = getLocalSpreadsheet_();
  if (!ss) return [];
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(function(h) { return String(h).trim(); });
  var records = [];

  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var obj = {};
    var hasData = false;
    for (var c = 0; c < headers.length; c++) {
      var val = row[c];
      if (val instanceof Date) {
        val = val.toISOString();
      }
      obj[headers[c]] = val !== undefined && val !== null ? val : '';
      if (val !== '' && val !== null && val !== undefined) hasData = true;
    }
    if (hasData && !obj.deleted_at) {
      records.push(obj);
    }
  }
  return records;
}

/**
 * Menyimpan / Update baris data ke Sheet (Auto Timestamp & User Log)
 */
function saveRecord_(sheetName, record, actor) {
  var ss = getLocalSpreadsheet_();
  if (!ss) throw new Error('Spreadsheet tidak dapat dibuka.');
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    initDatabase();
    sheet = ss.getSheetByName(sheetName);
  }
  if (!sheet) throw new Error('Sheet ' + sheetName + ' tidak ditemukan.');

  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(function(h) { return String(h).trim(); });
  var now = new Date().toISOString();
  var actorId = (actor && (actor.email || actor.id || actor.username)) || 'system';

  if (!record.id) {
    record.id = (sheetName.substring(0, 3).toUpperCase()) + '-' + String(Date.now()).slice(-6);
  }

  var pkIndex = headers.indexOf('id');
  if (pkIndex === -1) pkIndex = 0;

  var rowIndex = -1;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][pkIndex]) === String(record.id)) {
      rowIndex = i + 1;
      break;
    }
  }

  record.updated_at = now;
  record.updated_by = actorId;

  if (rowIndex === -1) {
    // Insert baru
    record.created_at = record.created_at || now;
    record.created_by = record.created_by || actorId;
    record.deleted_at = '';
    var newRow = headers.map(function(h) {
      return record[h] !== undefined && record[h] !== null ? record[h] : '';
    });
    sheet.appendRow(newRow);
  } else {
    // Update baris lama
    var existingRow = values[rowIndex - 1];
    var updatedRow = headers.map(function(h, c) {
      if (record[h] !== undefined) return record[h];
      return existingRow[c] !== undefined ? existingRow[c] : '';
    });
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([updatedRow]);
  }
  return record;
}

/**
 * Soft delete (menandai deleted_at)
 */
function softDeleteRecord_(sheetName, id, actor) {
  var ss = getLocalSpreadsheet_();
  if (!ss) return false;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return false;

  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(function(h) { return String(h).trim(); });
  var pkIndex = headers.indexOf('id');
  var delIndex = headers.indexOf('deleted_at');
  if (pkIndex === -1 || delIndex === -1) return false;

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][pkIndex]) === String(id)) {
      sheet.getRange(i + 1, delIndex + 1).setValue(new Date().toISOString());
      return true;
    }
  }
  return false;
}

/**
 * Mencari 1 record berdasarkan ID
 */
function findRecordById_(sheetName, id) {
  var records = getSheetData_(sheetName);
  for (var i = 0; i < records.length; i++) {
    if (String(records[i].id) === String(id)) {
      return records[i];
    }
  }
  return null;
}

/**
 * Helper JSON Response
 */
function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getAppConfig_() {
  return {
    appTitle: APP_TITLE,
    appCode: APP_CODE,
    spreadsheetId: SPREADSHEET_ID,
    masterSsId: MASTER_SPREADSHEET_ID,
    sessionPrefix: SESSION_PREFIX,
    sessionTtlSeconds: SESSION_TTL_SECONDS,
    platformApiUrl: PLATFORM_API_URL,
    sheetNames: LOCAL_SHEET_NAMES,
    sheetHeaders: LOCAL_SHEET_HEADERS
  };
}
