// ============================================================
// SI-KOMPETENSI - 01_ConfigAndBridge.gs (v2-ready)
// Configuration, Domain Schema & Core Library Bridges
// Migrasi Library v2 — perubahan vs versi lama:
// - HAPUS TEST_MODE total (B1). Exchange selalu ke SSO asli.
// - getEnvProperty WAJIB oper store app (anti config-shared 30 app).
// - TAMBAH MASTER_SPREADSHEET_ID; wrappers teruskan masterSsId (B4/B5).
// - SESSION_PREFIX = default v2 'APP_SESSION_<appCode>_' (B2).
// - TTL session 6 jam = cap v2 (B16).
// - invalidateSheetCache oper dbId (B3).
// - TAMBAH getAppConfig_/APP_CONFIG kontrak dispatcher (§2 migrasi).
// - TAMBAH ZZ_TEST_CRUD untuk runCoreTests.
// Perilaku tulis v2 (tanpa ubah signature wrapper):
//   B7 update ID-asing DITOLAK | B8 duplikat PK DITOLAK
//   B9 null/'' = kosongkan      | B10 field audit otoritas server
// ============================================================

var APP_TITLE = 'SI-KOMPETENSI';
var APP_CODE = 'SIKOMPETENSI';

// URL Portal Utama SSO Pusat (Fallback bila Properties kosong)
var DEFAULT_PLATFORM_URL = 'https://script.google.com/macros/s/AKfycbwh_OUVqmxLcuF81FHmPZtT33Wrm8Ce9Da1SQ3hfkSr7gM5P8ofyAlHSgW40mq3eo-PoQ/exec';

// Store MILIK APP INI. Wajib dioper ke getEnvProperty — tanpa ini,
// library membaca Properties MILIK LIBRARY (dipakai bersama 30 app)!
function appProps_() { return PropertiesService.getScriptProperties(); }

var SPREADSHEET_ID = CoreLib.getEnvProperty('SPREADSHEET_ID', appProps_()) || (function() {
  try { return SpreadsheetApp.getActiveSpreadsheet().getId(); } catch(e) { return ''; }
})();
// WAJIB DIISI di Script Properties: ID spreadsheet SIMPEG pusat (database master).
var MASTER_SPREADSHEET_ID = CoreLib.getEnvProperty('MASTER_SPREADSHEET_ID', appProps_());
var ROOT_FOLDER_ID = CoreLib.getEnvProperty('ROOT_FOLDER_ID', appProps_());
var BACKUP_FOLDER_ID = CoreLib.getEnvProperty('BACKUP_FOLDER_ID', appProps_());
var EVIDENCE_FOLDER_ID = CoreLib.getEnvProperty('EVIDENCE_FOLDER_ID', appProps_());

// Membaca dari Properties app ini, jika kosong memakai DEFAULT_PLATFORM_URL
var PLATFORM_API_URL = appProps_().getProperty('PLATFORM_API_URL') || DEFAULT_PLATFORM_URL;

var SESSION_PREFIX = 'APP_SESSION_' + APP_CODE + '_'; // default v2 (B2) — samakan di router localConfig!
var SESSION_TTL_SECONDS = 6 * 60 * 60; // 6 jam = cap v2 (B16)
var DATA_CACHE_TTL = 180; // 3 Menit
var ROLE_LEVELS = CoreLib.MASTER_ROLE_LEVELS;
// TEST_MODE DIHAPUS (B1) — login selalu via SSO asli.

// ==================== NAMA SHEET CANONICAL SI-KOMPETENSI ====================
var LOCAL_SHEET_NAMES = {
  DATA_KOMPETENSI: 'DATA_KOMPETENSI',
  KATEGORI_KOMPETENSI: 'KATEGORI_KOMPETENSI',
  REKAP_KOMPETENSI: 'REKAP_KOMPETENSI',
  MAIN_DATA: 'MAIN_DATA',
  LAPORAN: 'LAPORAN',
  KONFIGURASI: 'KONFIGURASI',
  AUDIT_LOGS: 'AUDIT_LOGS',
  ZZ_TEST_CRUD: 'ZZ_TEST_CRUD'
};

// ==================== HEADER SHEET KHUSUS SI-KOMPETENSI ====================
var LOCAL_SHEET_HEADERS = {
  DATA_KOMPETENSI: [
    'id', 'pegawai_id', 'jenis_kompetensi', 'nama_kompetensi', 'penyelenggara',
    'no_sertifikat', 'jumlah_jp', 'tanggal_mulai', 'tanggal_selesai', 'file_url',
    'status_verifikasi', 'catatan_verifikator', 'verifikator_id', 'tanggal_verifikasi',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  KATEGORI_KOMPETENSI: [
    'id', 'kode_kategori', 'nama_kategori', 'jp_minimal', 'keterangan',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  REKAP_KOMPETENSI: [
    'id', 'tahun', 'pegawai_id', 'total_kegiatan', 'total_jp', 'target_jp_tahun', 'status_capaian',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  MAIN_DATA: ['id', 'nama', 'nip', 'email', 'unit_nama', 'jabatan_nama', 'alamat', 'no_hp', 'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'],
  LAPORAN: [
    'id', 'periode', 'nama_laporan', 'pegawai_id', 'unit_id', 'jabatan_id', 'status',
    'catatan_verifikator', 'verifikator_id', 'tanggal_verifikasi',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  KONFIGURASI: ['id', 'key', 'value', 'keterangan', 'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'],
  AUDIT_LOGS: ['id', 'user_id', 'action', 'timestamp', 'details'],
  // Sheet sekali-pakai untuk runCoreTests (aman di DB produksi — 1 sheet kosong).
  ZZ_TEST_CRUD: ['id', 'laporan_id', 'nama', 'no_hp', 'catatan_baru']
};

// ==================== BRIDGE HELPER WRAPPERS ====================

function getAllHeaders_() {
  return Object.assign({}, CoreLib.MASTER_SHEET_HEADERS, LOCAL_SHEET_HEADERS);
}

function getCanonicalSheetName_(sheetName) {
  return CoreLib.getCanonicalSheetName(sheetName, LOCAL_SHEET_NAMES)
      || String(sheetName || '').toUpperCase().trim();
}

function isReferenceSheet_(sheetName) {
  return CoreLib.isReferenceSheet(sheetName);
}

function getDb_() { return CoreLib.getDb(SPREADSHEET_ID); }
function ensureSheet_(sheetName) { return CoreLib.ensureSheet(SPREADSHEET_ID, getCanonicalSheetName_(sheetName), getAllHeaders_()); }
function initDatabase_() { return CoreLib.initDatabase(SPREADSHEET_ID, getAllHeaders_(), isReferenceSheet_); }

// Baca: teruskan masterSsId agar PEGAWAI/JABATAN/UNIT_KERJA dibaca dari MASTER (B5).
function readRecordsNoLock_(sheetName) { return CoreLib.readRecordsNoLock(SPREADSHEET_ID, getCanonicalSheetName_(sheetName), getAllHeaders_(), { masterSsId: MASTER_SPREADSHEET_ID }); }
function getSheetDataCached_(sheetName) { return CoreLib.getSheetDataCached(SPREADSHEET_ID, getCanonicalSheetName_(sheetName), getAllHeaders_(), DATA_CACHE_TTL, { masterSsId: MASTER_SPREADSHEET_ID }); }
// Tulis: pkField opsional (auto-deteksi aman — semua sheet lokal punya kolom 'id').
function toSheetRow_(sheetName, record) { return CoreLib.toSheetRow(getCanonicalSheetName_(sheetName), record, getAllHeaders_()); }
function writeRecordNoLock_(sheetName, record, isUpdate, actor, pkField) { return CoreLib.writeRecordNoLock(SPREADSHEET_ID, getCanonicalSheetName_(sheetName), record, isUpdate, actor, getAllHeaders_(), isReferenceSheet_, pkField); }
function softDeleteRecordNoLock_(sheetName, id, actor, pkField) { return CoreLib.softDeleteRecordNoLock(SPREADSHEET_ID, getCanonicalSheetName_(sheetName), id, actor, getAllHeaders_(), isReferenceSheet_, pkField); }
function hardDeleteRecordNoLock_(sheetName, id, actor, pkField) { return CoreLib.hardDeleteRecordNoLock(SPREADSHEET_ID, getCanonicalSheetName_(sheetName), id, actor, isReferenceSheet_, pkField); }

// B3: dbId WAJIB — tanpa ini cache v2 tidak terhapus (data basi walau sudah save).
function invalidateSheetCache_(sheetName) {
  var canonical = getCanonicalSheetName_(sheetName);
  CoreLib.invalidateSheetCache(canonical, SPREADSHEET_ID);
  if (MASTER_SPREADSHEET_ID && isReferenceSheet_(canonical)) CoreLib.invalidateSheetCache(canonical, MASTER_SPREADSHEET_ID);
}

// ==================== BRIDGE SSO & UTILITIES ====================
function logInfo(ctx, msg) { CoreLib.logInfo(ctx, msg); }
function logWarn(ctx, msg) { CoreLib.logWarn(ctx, msg); }
function logError(ctx, err) { CoreLib.logError(ctx, err); }
function makeId_(prefix) { return CoreLib.makeId(prefix); }
function nowIso_() { return CoreLib.nowIso(); }
function todayIso_() { return CoreLib.todayIso(); }
function safeUser_(user) { return CoreLib.safeUser(user); }
function acquireLock_() { return CoreLib.acquireLock(); }
function parseTanggalBackend_(val) { return CoreLib.parseTanggalBackend(val); }
function isValidDate_(val) { return CoreLib.isValidDate(val); }
function hitungDurasiHari_(t1, t2) { return CoreLib.hitungDurasiHari(t1, t2); }
function systemActor_() { return CoreLib.systemActor(); }

// B1: argumen testMode lama diganti false (abaikan mode palsu).
function validatePlatformTicket_(ticket) { return CoreLib.validatePlatformTicket(ticket, PLATFORM_API_URL, false, APP_CODE); }
// masterSsId dioper agar session terisi pegawai_id/nip dari master (H2).
function exchangePlatformTicket(ticket) {
  return CoreLib.exchangePlatformTicket(ticket, {
    sessionPrefix: SESSION_PREFIX, ttlSeconds: SESSION_TTL_SECONDS, platformApiUrl: PLATFORM_API_URL, appCode: APP_CODE, masterSsId: MASTER_SPREADSHEET_ID
  });
}
function logout_(token) { return CoreLib.logoutUser(token, SESSION_PREFIX); }
function checkAuth_(token, minLevel) { return CoreLib.checkAuth(token, minLevel, SESSION_PREFIX, ROLE_LEVELS); }

// ==================== KONTRAK DISPATCHER v2 (§2 migrasi) ====================
// Router (doPost) WAJIB memakai ini sebagai localConfig agar prefix/headers
// sama persis dengan wrapper di atas. Jangan rakit localConfig manual.
function getAppConfig_() {
  return {
    appCode: APP_CODE,
    spreadsheetId: SPREADSHEET_ID,
    masterSsId: MASTER_SPREADSHEET_ID,
    platformApiUrl: PLATFORM_API_URL,
    sessionPrefix: SESSION_PREFIX,
    ttlSeconds: SESSION_TTL_SECONDS,
    roleLevels: ROLE_LEVELS,
    headersMap: getAllHeaders_(),
    pkFields: {},       // opsional — auto-deteksi 'id' sudah cukup
    // Default v2: save_my_profile butuh 'admin' — user biasa tak bisa simpan
    // profilnya sendiri. Buka ke viewer (saveMyProfile aman: email dari session).
    // get_config dikunci admin (frontend non-admin tak butuh config).
    // verifikasi_kompetensi/verifikasi_riwayat admin (lapis 1; lapis 2 = cek di handler).
    actionLevels: { save_my_profile: 'viewer', get_config: 'admin', verifikasi_kompetensi: 'admin', verifikasi_riwayat: 'admin' },
    // Aksi generik save/delete DATA_KOMPETENSI: default v2 (admin). Frontend TIDAK
    // memakai jalur generik untuk data kompetensi — melainkan handler khusus
    // (proteksi pemilik) + verifikasi_kompetensi.
    // Defense in depth: jalur generik via DevTools tetap tertolak untuk viewer.
    entityPermissions: {},
    isRefSheetFunc: isReferenceSheet_,
    localHandlers: {}   // diisi file router: { nama_aksi: function(data, currentUser) {...} }
  };
}
var APP_CONFIG = getAppConfig_();
