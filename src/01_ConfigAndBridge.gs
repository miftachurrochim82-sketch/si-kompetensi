// ============================================================
// SI-KOMPETENSI - 01_ConfigAndBridge.gs (v3.2.0 — Live Ecosystem Linked)
// Standar Satpol PP & Pemadam Kebakaran Kab. Trenggalek
// ============================================================

var APP_TITLE = 'SI-KOMPETENSI';
var APP_CODE = 'SIKOMPETENSI';

// ID Spreadsheet Resmi Ekosistem Terpadu
var DEFAULT_MASTER_SPREADSHEET_ID = '1HvMXmvdtgAUZ9A0-SQHZp9QjnYv1A7Ku_oJIjbT8gT0'; // SIMPEG Master
var DEFAULT_PLATFORM_SPREADSHEET_ID = '1EeJrOo6-75uf8SWCX4P5XPSMoUGXp8p1a098vKBRJys'; // SI-PLATFORM
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

// ID Spreadsheet SIMPEG Pusat (Master Pegawai, Unit, Jabatan)
var MASTER_SPREADSHEET_ID = getEnvProperty_('MASTER_SPREADSHEET_ID') || DEFAULT_MASTER_SPREADSHEET_ID;

// ID Spreadsheet SI-PLATFORM (Sentral Settings & Audit)
var PLATFORM_SPREADSHEET_ID = getEnvProperty_('PLATFORM_SPREADSHEET_ID') || DEFAULT_PLATFORM_SPREADSHEET_ID;
var PLATFORM_API_URL = getEnvProperty_('PLATFORM_API_URL') || DEFAULT_PLATFORM_URL;

var SESSION_PREFIX = 'APP_SESSION_' + APP_CODE + '_';
var SESSION_TTL_SECONDS = 6 * 60 * 60; // 6 jam
var DATA_CACHE_TTL = 300; // 5 Menit Cache
var ROLE_LEVELS = { viewer: 1, user: 1, verifikator: 2, admin: 3, super: 3 };

// ==================== 5 SHEET DATABASE LOKAL SI-KOMPETENSI ====================
var LOCAL_SHEETS = {
  M_REFERENSI: 'M_REFERENSI',
  M_KATALOG_DIKLAT: 'M_KATALOG_DIKLAT',
  M_STANDAR_KOMPETENSI: 'M_STANDAR_KOMPETENSI',
  T_RIWAYAT_KOMPETENSI: 'T_RIWAYAT_KOMPETENSI',
  T_USULAN_DIKLAT: 'T_USULAN_DIKLAT'
};

// Sheet master eksternal SIMPEG (Read-Only)
var SIMPEG_REFERENCE_SHEETS = [
  'PEGAWAI', 'M_PEGAWAI', 'pegawai',
  'UNIT_KERJA', 'M_UNIT_KERJA', 'unit_kerja', 'units',
  'JABATAN', 'M_JABATAN', 'jabatan'
];

function isSimpegSheet_(sheetName) {
  return SIMPEG_REFERENCE_SHEETS.indexOf(sheetName) !== -1;
}

// ==================== HEADER STRUKTUR DATABASE LENGKAP ====================
var ALL_SHEET_HEADERS = {
  // 1. Master Referensi Gabungan (Dropdown Opsi Sistem)
  M_REFERENSI: [
    'id', 'kategori', 'kode', 'nama_nilai', 'urutan', 'status_aktif', 'keterangan',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  // 2. Kamus Resmi Pelatihan & Standar JP
  M_KATALOG_DIKLAT: [
    'id', 'kode_diklat', 'nama_diklat', 'rumpun', 'kategori_keahlian',
    'penyelenggara_default', 'default_jp', 'estimasi_biaya_default', 'deskripsi', 'status_aktif',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  // 3. Standar Kompetensi Jabatan (Matriks Kebutuhan Pelatihan per Jabatan)
  M_STANDAR_KOMPETENSI: [
    'id', 'jabatan_id', 'diklat_id', 'tingkat_kebutuhan', 'minimal_jp', 'keterangan', 'status_aktif',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  // 4. Riwayat Sertifikat Diklat Pegawai (Pemenuhan 20 JP)
  T_RIWAYAT_KOMPETENSI: [
    'id', 'pegawai_id', 'diklat_id', 'nama_kegiatan', 'rumpun',
    'penyelenggara', 'no_sertifikat', 'tgl_terbit', 'tgl_mulai', 'tgl_selesai', 'tgl_kedaluwarsa',
    'jumlah_jp', 'metode', 'file_url', 'status_verifikasi', 'catatan_verifikator',
    'verifikator_id', 'tanggal_verifikasi',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  // 5. Usulan Diklat Bottom-Up (AKD)
  T_USULAN_DIKLAT: [
    'id', 'pegawai_id', 'diklat_id', 'nama_diklat_usulan', 'rumpun',
    'target_penyelenggara', 'alasan_usulan', 'urgensi', 'estimasi_biaya',
    'status_usulan', 'catatan_pimpinan', 'tgl_pengajuan', 'tahun_anggaran_target',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  // Header Referensi Master SIMPEG (Sesuai Struktur Asli SIMPEG)
  PEGAWAI: [
    'pegawai_id', 'nip', 'nik', 'nama', 'gelar_depan', 'gelar_belakang', 'jenis_kelamin',
    'tempat_lahir', 'tanggal_lahir', 'pangkat_golongan', 'status_kepegawaian', 'pendidikan_terakhir',
    'email', 'no_hp', 'alamat', 'foto_url', 'unit_id', 'jabatan_id', 'atasan_id', 'role',
    'regu', 'is_ppns', 'no_sk_ppns', 'kualifikasi_damkar', 'status_aktif',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  UNIT_KERJA: [
    'unit_id', 'kode_unit', 'nama_unit', 'kategori_unit', 'parent_unit_id', 'lokasi',
    'telepon_unit', 'kepala_nip', 'kepala_hp', 'status_aktif', 'keterangan',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  JABATAN: [
    'jabatan_id', 'kode_jabatan', 'nama_jabatan', 'jenis_jabatan', 'rumpun_jabatan', 'jenjang_jabatan',
    'kelas_jabatan', 'unit_id', 'status_jabatan', 'plt_pegawai_id', 'tanggal_mulai_jabatan', 'tanggal_selesai_jabatan',
    'target_jp_tahunan', 'status_aktif', 'keterangan',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ]
};

// ==================== HELPER AKSES SPREADSHEET ====================

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

function getMasterSpreadsheet_() {
  if (MASTER_SPREADSHEET_ID && MASTER_SPREADSHEET_ID !== SPREADSHEET_ID) {
    try {
      return SpreadsheetApp.openById(MASTER_SPREADSHEET_ID);
    } catch (e) {
      Logger.log('[WARN] Gagal membuka MASTER_SPREADSHEET_ID: ' + e.message);
    }
  }
  return getLocalSpreadsheet_();
}

function getSpreadsheetForSheet_(sheetName) {
  if (isSimpegSheet_(sheetName)) {
    return getMasterSpreadsheet_();
  }
  return getLocalSpreadsheet_();
}

/**
 * Membaca Data Sheet sebagai JSON Objects dengan Dukungan In-Memory Cache & Normalisasi Kolom
 */
function getSheetData_(sheetName) {
  var cacheKey = 'CACHE_' + APP_CODE + '_' + sheetName;
  var cache = CacheService.getScriptCache();
  try {
    var cached = cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {}

  var ss = getSpreadsheetForSheet_(sheetName);
  if (!ss) return [];
  var sheet = ss.getSheetByName(sheetName);

  // Resolusi alias penamaan sheet
  if (!sheet) {
    var aliasMap = {
      'PEGAWAI': ['M_PEGAWAI', 'pegawai', 'Pegawai', 'm_pegawai'],
      'M_PEGAWAI': ['PEGAWAI', 'pegawai', 'Pegawai', 'm_pegawai'],
      'pegawai': ['PEGAWAI', 'M_PEGAWAI', 'Pegawai', 'm_pegawai'],
      'UNIT_KERJA': ['M_UNIT_KERJA', 'unit_kerja', 'Unit_Kerja', 'units', 'm_unit_kerja'],
      'M_UNIT_KERJA': ['UNIT_KERJA', 'unit_kerja', 'Unit_Kerja', 'units', 'm_unit_kerja'],
      'JABATAN': ['M_JABATAN', 'jabatan', 'Jabatan', 'm_jabatan', 'roles'],
      'M_JABATAN': ['JABATAN', 'jabatan', 'Jabatan', 'm_jabatan', 'roles'],
      'T_RIWAYAT_KOMPETENSI': ['T_KOMPETENSI_PEGAWAI', 'DATA_KOMPETENSI', 'riwayat_kompetensi'],
      'T_KOMPETENSI_PEGAWAI': ['T_RIWAYAT_KOMPETENSI', 'DATA_KOMPETENSI', 'riwayat_kompetensi']
    };
    var cand = aliasMap[sheetName] || [];
    for (var i = 0; i < cand.length; i++) {
      sheet = ss.getSheetByName(cand[i]);
      if (sheet) break;
    }
  }

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
      // Normalisasi otomatis PEGAWAI
      if (obj.pegawai_id && !obj.id) obj.id = obj.pegawai_id;
      if (!obj.pegawai_id && obj.id) obj.pegawai_id = obj.id;
      if (obj.nama && !obj.nama_lengkap) obj.nama_lengkap = obj.nama;
      if (obj.nama_lengkap && !obj.nama) obj.nama = obj.nama_lengkap;
      if (obj.pangkat_golongan && !obj.pangkat_gol) obj.pangkat_gol = obj.pangkat_golongan;
      if (obj.pangkat_gol && !obj.pangkat_golongan) obj.pangkat_golongan = obj.pangkat_gol;
      if (obj.regu && !obj.regu_pleton) obj.regu_pleton = obj.regu;
      if (obj.regu_pleton && !obj.regu) obj.regu = obj.regu_pleton;
      if (obj.no_hp && !obj.telepon) obj.telepon = obj.no_hp;

      // Normalisasi otomatis UNIT_KERJA
      if (obj.unit_id && !obj.id) obj.id = obj.unit_id;
      if (!obj.unit_id && obj.id) obj.unit_id = obj.id;
      if (obj.nama_unit && !obj.nama) obj.nama = obj.nama_unit;
      if (obj.telepon_unit && !obj.telepon) obj.telepon = obj.telepon_unit;

      // Normalisasi otomatis JABATAN
      if (obj.jabatan_id && !obj.id) obj.id = obj.jabatan_id;
      if (!obj.jabatan_id && obj.id) obj.jabatan_id = obj.id;
      if (obj.nama_jabatan && !obj.nama) obj.nama = obj.nama_jabatan;

      records.push(obj);
    }
  }

  // Cache data
  if (isSimpegSheet_(sheetName) || sheetName === LOCAL_SHEETS.M_REFERENSI || sheetName === LOCAL_SHEETS.M_KATALOG_DIKLAT || sheetName === LOCAL_SHEETS.M_STANDAR_KOMPETENSI) {
    try {
      cache.put(cacheKey, JSON.stringify(records), DATA_CACHE_TTL);
    } catch (e) {}
  }

  return records;
}

/**
 * Menyimpan / Update Baris Data ke Sheet Lokal
 * ⛔ STRICT: Menolak penyimpanan ke master SIMPEG
 */
function saveRecord_(sheetName, record, actor) {
  if (isSimpegSheet_(sheetName)) {
    throw new Error('Akses Ditolak: Sheet "' + sheetName + '" bersifat READ-ONLY di aplikasi ini. Perubahan data Pegawai, Unit Kerja, dan Jabatan hanya dapat dilakukan melalui aplikasi SIMPEG Pusat.');
  }

  var ss = getLocalSpreadsheet_();
  if (!ss) throw new Error('Spreadsheet lokal tidak dapat dibuka.');
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    initDatabase();
    sheet = ss.getSheetByName(sheetName);
  }
  if (!sheet) throw new Error('Sheet ' + sheetName + ' tidak ditemukan di database.');

  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(function(h) { return String(h).trim(); });
  var now = new Date().toISOString();
  var actorId = (actor && (actor.email || actor.id || actor.username)) || 'system';

  if (!record.id) {
    var prefix = sheetName.replace('M_', '').replace('T_', '').substring(0, 3).toUpperCase();
    record.id = prefix + '-' + String(Date.now()).slice(-6);
  }

  var pkIndex = headers.indexOf('id');
  if (pkIndex === -1) pkIndex = headers.indexOf('pegawai_id');
  if (pkIndex === -1) pkIndex = headers.indexOf('unit_id');
  if (pkIndex === -1) pkIndex = headers.indexOf('jabatan_id');
  if (pkIndex === -1) pkIndex = 0;

  var rowIndex = -1;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][pkIndex]) === String(record.id || record.pegawai_id || record.unit_id || record.jabatan_id)) {
      rowIndex = i + 1;
      break;
    }
  }

  record.updated_at = now;
  record.updated_by = actorId;

  if (rowIndex === -1) {
    record.created_at = record.created_at || now;
    record.created_by = record.created_by || actorId;
    record.deleted_at = '';
    var newRow = headers.map(function(h) {
      return record[h] !== undefined && record[h] !== null ? record[h] : '';
    });
    sheet.appendRow(newRow);
  } else {
    var existingRow = values[rowIndex - 1];
    var updatedRow = headers.map(function(h, c) {
      if (record[h] !== undefined) return record[h];
      return existingRow[c] !== undefined ? existingRow[c] : '';
    });
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([updatedRow]);
  }

  // Refresh cache
  try {
    CacheService.getScriptCache().remove('CACHE_' + APP_CODE + '_' + sheetName);
  } catch(e) {}

  return record;
}

/**
 * Soft Delete Baris Data
 */
function softDeleteRecord_(sheetName, id, actor) {
  if (isSimpegSheet_(sheetName)) {
    throw new Error('Akses Ditolak: Sheet "' + sheetName + '" bersifat READ-ONLY di aplikasi ini.');
  }

  var ss = getLocalSpreadsheet_();
  if (!ss) return false;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return false;

  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(function(h) { return String(h).trim(); });
  var pkIndex = headers.indexOf('id');
  if (pkIndex === -1) pkIndex = headers.indexOf('pegawai_id');
  if (pkIndex === -1) pkIndex = headers.indexOf('unit_id');
  if (pkIndex === -1) pkIndex = headers.indexOf('jabatan_id');
  var delIndex = headers.indexOf('deleted_at');
  if (pkIndex === -1 || delIndex === -1) return false;

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][pkIndex]) === String(id)) {
      sheet.getRange(i + 1, delIndex + 1).setValue(new Date().toISOString());
      try {
        CacheService.getScriptCache().remove('CACHE_' + APP_CODE + '_' + sheetName);
      } catch(e) {}
      return true;
    }
  }
  return false;
}

function findRecordById_(sheetName, id) {
  var records = getSheetData_(sheetName);
  for (var i = 0; i < records.length; i++) {
    if (String(records[i].id) === String(id) || String(records[i].pegawai_id) === String(id) || String(records[i].unit_id) === String(id) || String(records[i].jabatan_id) === String(id)) {
      return records[i];
    }
  }
  return null;
}

function getReferencesByCategory_(kategori) {
  var refs = getSheetData_(LOCAL_SHEETS.M_REFERENSI);
  return refs.filter(function(r) {
    return String(r.kategori).toUpperCase() === String(kategori).toUpperCase() &&
           String(r.status_aktif).toLowerCase() !== 'false';
  }).sort(function(a, b) {
    return (Number(a.urutan) || 99) - (Number(b.urutan) || 99);
  });
}

function sendAuditLog_(actor, action, resourceType, resourceId, result, details) {
  try {
    var actorId = (actor && (actor.email || actor.id || actor.username)) || 'anonymous';
    if (PLATFORM_API_URL) {
      UrlFetchApp.fetch(PLATFORM_API_URL, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({
          action: 'record_audit',
          data: {
            actor_id: actorId,
            application_id: APP_CODE,
            action: action,
            resource_type: resourceType,
            resource_id: resourceId,
            result: result || 'SUCCESS',
            details: details || ''
          }
        }),
        muteHttpExceptions: true
      });
    }
  } catch(e) {
    Logger.log('[AUDIT LOG WARN] Gagal mengirim audit log: ' + e.message);
  }
}

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
    platformSsId: PLATFORM_SPREADSHEET_ID,
    platformApiUrl: PLATFORM_API_URL,
    sessionPrefix: SESSION_PREFIX,
    sessionTtlSeconds: SESSION_TTL_SECONDS,
    sheetNames: LOCAL_SHEETS,
    sheetHeaders: ALL_SHEET_HEADERS
  };
}
