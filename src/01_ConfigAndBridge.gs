// ============================================================
// SI-KOMPETENSI - 01_ConfigAndBridge.gs (v2.4.0 — Opsi B 6-Sheet)
// Standar Spesifik Satpol PP & Pemadam Kebakaran Kab. Trenggalek
// ============================================================

var APP_TITLE = 'SI-KOMPETENSI';
var APP_CODE = 'SIKOMPETENSI';

// URL Portal Utama SSO Pusat (Fallback bila Properties kosong)
var DEFAULT_PLATFORM_URL = 'https://script.google.com/macros/s/AKfycbwh_OUVqmxLcuF81FHmPZtT33Wrm8Ce9Da1SQ3hfkSr7gM5P8ofyAlHSgW40mq3eo-PoQ/exec';

function appProps_() { return PropertiesService.getScriptProperties(); }

var SPREADSHEET_ID = CoreLib.getEnvProperty('SPREADSHEET_ID', appProps_()) || (function() {
  try { return SpreadsheetApp.getActiveSpreadsheet().getId(); } catch(e) { return ''; }
})();

var MASTER_SPREADSHEET_ID = CoreLib.getEnvProperty('MASTER_SPREADSHEET_ID', appProps_()) || SPREADSHEET_ID;
var ROOT_FOLDER_ID = CoreLib.getEnvProperty('ROOT_FOLDER_ID', appProps_());
var BACKUP_FOLDER_ID = CoreLib.getEnvProperty('BACKUP_FOLDER_ID', appProps_());
var EVIDENCE_FOLDER_ID = CoreLib.getEnvProperty('EVIDENCE_FOLDER_ID', appProps_());

var PLATFORM_API_URL = appProps_().getProperty('PLATFORM_API_URL') || DEFAULT_PLATFORM_URL;
var SESSION_PREFIX = 'APP_SESSION_' + APP_CODE + '_';
var SESSION_TTL_SECONDS = 6 * 60 * 60; // 6 jam
var DATA_CACHE_TTL = 180; // 3 Menit
var ROLE_LEVELS = CoreLib.MASTER_ROLE_LEVELS;

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

function getLocalSpreadsheet_() {
  return CoreLib.getSpreadsheet(SPREADSHEET_ID);
}

function getMasterSpreadsheet_() {
  return CoreLib.getMasterSpreadsheet(MASTER_SPREADSHEET_ID, SPREADSHEET_ID);
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
