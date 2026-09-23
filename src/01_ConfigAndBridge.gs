// ============================================================
// SI-KOMPETENSI - 01_ConfigAndBridge.gs (v5.0.0 — CoreLib Integration)
// Sistem Informasi Manajemen Portofolio, Jadwal & Lisensi Khusus ASN
// Satpol PP & Damkar Kab. Trenggalek
// ============================================================
// Changelog v5.0 (2026-09-13):
// - BREAKING: DB engine dipindah ke CoreLib v2.4.0.
//   * getSheetData_      → CoreLib.getSheetDataCached
//   * saveRecord_        → CoreLib.apiSave
//   * softDeleteRecord_  → CoreLib.apiDelete
//   Signature tetap sama → file lain (02-08) TIDAK perlu diubah.
// - REMOVED: Semua FALLBACK_* (PEGAWAI/UNIT_KERJA/JABATAN/STANDAR/
//   KATALOG/RIWAYAT). Lebih baik sheet kosong daripada data palsu.
//   Jika sheet kosong → return [] (caller harus handle empty state).
// - REMOVED: Cache key custom (CACHE_SIKOMPETENSI_*) → sekarang pakai
//   cache native CoreLib (sheetData_<dbId>_<sheet>), sinkron antar-app.
// - IMPROVED: Kanalisasi nama sheet SIMPEG (M_PEGAWAI → PEGAWAI) sebelum
//   diteruskan ke CoreLib — mencegah error resolveCanonical.
// - IMPROVED: Normalisasi kolom SIMPEG dilakukan post-read di SI (karena
//   CoreLib tidak tahu struktur kolom SIMPEG lokal).
// - FIX: getEnvProperty_ tidak lagi redundant panggil CoreLib (sudah
//   satu sumber — Script Properties SI).
// - Changelog v4.2 s.d. v4.1 tetap berlaku untuk logic bisnis.
// ============================================================

// ==================== §1 KONSTANTA GLOBAL ====================
var APP_TITLE = 'SI-KOMPETENSI';
var APP_CODE = 'SIKOMPETENSI';

// ID Spreadsheet Resmi Ekosistem Terpadu Trenggalek
var DEFAULT_MASTER_SPREADSHEET_ID = '1HvMXmvdtgAUZ9A0-SQHZp9QjnYv1A7Ku_oJIjbT8gT0'; // SIMPEG Master
var DEFAULT_PLATFORM_SPREADSHEET_ID = '1EeJrOo6-75uf8SWCX4P5XPSMoUGXp8p1a098vKBRJys'; // SI-PLATFORM
var DEFAULT_PLATFORM_URL = 'https://script.google.com/macros/s/AKfycbwh_OUVqmxLcuF81FHmPZtT33Wrm8Ce9Da1SQ3hfkSr7gM5P8ofyAlHSgW40mq3eo-PoQ/exec';

var SESSION_PREFIX = 'APP_SESSION_' + APP_CODE + '_';
var SESSION_TTL_SECONDS = 6 * 60 * 60; // 6 jam (cap CoreLib = 21600)
var DATA_CACHE_TTL = 300;              // 5 menit

// Sinkron dengan CoreLib MASTER_ROLE_LEVELS v2.2
var ROLE_LEVELS = { viewer: 0, user: 1, verifikator: 2, admin: 3, super: 4 };

// ==================== §1b TEMA PER-APP (CoreLib v2.4.0 C8) ====================
// THEME_JSON disimpan di Script Properties sebagai JSON string:
//   {"primary":"#059669","preset":"emerald"}  (6 preset: emerald/sky/amber/violet/rose/teal)
// Frontend inject via <?!= getThemeCss() ?> di Index.html + <app-theme-picker>.
// Default: emerald (#059669) bila properti kosong.
var DEFAULT_THEME = { primary: '#059669', preset: 'emerald' };

function getThemeConfig_() {
  try { return CoreLib.getThemeConfig(appProps_(), DEFAULT_THEME); }
  catch (e) { return DEFAULT_THEME; }
}

// Dipanggil oleh Index.html template: <?!= getThemeCss() ?>
function getThemeCss() {
  try { return CoreLib.getThemeCss(appProps_(), DEFAULT_THEME); }
  catch (e) { return ':root{--primary:#059669}'; }
}

// Dipanggil oleh handler save_theme (admin) untuk simpan THEME_JSON
function saveThemeConfig_(obj) {
  if (!obj || !obj.primary) throw new Error('Tema tidak valid.');
  return CoreLib.buildThemeCss ? CoreLib.buildThemeCss(obj) : getThemeCss();
}

// ==================== §1c SCOPE "SAYA" (RLS ownerField) ====================
// Helper untuk filter Saya/Semua di handler utama.
// Di frontend: AppCore.getMyScope() → 'mine' | 'all' (disimpan localStorage)
// Di backend: filter rows where row.pegawai_id === session.pegawai_id
var SCOPE_OWNER_FIELD = 'pegawai_id'; // kolom pemilik di T_JADWAL_DIKLAT/T_RIWAYAT_KOMPETENSI

function filterByScope_(rows, scope, session) {
  if (scope === 'mine' && session && session.pegawai_id) {
    return rows.filter(function(r){ return String(r[SCOPE_OWNER_FIELD]||'') === String(session.pegawai_id); });
  }
  return rows;
}

// ==================== §1d WORKFLOW & PERIODE (CoreLib v2.4.0 A+B) ====================
// STATUS_MAP untuk validateTransition (C4) — transisi legal per resource
var STATUS_MAP = {
  'T_JADWAL_DIKLAT': {
    'draft':    ['diajukan', 'disetujui', 'batal'],
    'diajukan': ['disetujui', 'ditolak', 'batal'],
    'disetujui':['selesai', 'batal'],
    'ditolak':  ['diajukan', 'batal'],
    'selesai':  [],
    'batal':    []
  },
  'T_USULAN_DIKLAT': {
    'baru':     ['diproses', 'batal'],
    'diproses': ['disetujui', 'ditolak', 'batal'],
    'disetujui':['selesai'],
    'ditolak':  ['baru', 'batal'],
    'selesai':  [],
    'batal':    []
  },
  'T_KUALIFIKASI_KHUSUS': {
    'aktif':    ['nonaktif', 'arsip'],
    'nonaktif': ['aktif', 'arsip'],
    'arsip':    []
  }
};

// Wrapper tipis — biar app bisa panggil tanpa import CoreLib langsung
function periodeBulan_(tanggalStr){ try{ return CoreLib.periodeBulan(tanggalStr); }catch(e){ return ''; } }
function dalamPeriode_(tgl, start, end){ try{ return CoreLib.dalamPeriode(tgl, start, end); }catch(e){ return false; } }
function hitungHariKerja_(start, end){ try{ return CoreLib.hitungHariKerja(start, end); }catch(e){ return 0; } }
function findUnique_(sheet, field, value){ try{ return CoreLib.findUnique(getSpreadsheetId_(), sheet, field, value, ALL_SHEET_HEADERS || {}); }catch(e){ return null; } }



// ==================== §1b 8 SHEET DATABASE LOKAL ====================
var LOCAL_SHEETS = {
  M_REFERENSI: 'M_REFERENSI',
  M_KATALOG_DIKLAT: 'M_KATALOG_DIKLAT',
  M_STANDAR_KOMPETENSI: 'M_STANDAR_KOMPETENSI',
  T_JADWAL_DIKLAT: 'T_JADWAL_DIKLAT',
  T_PENUGASAN_PESERTA: 'T_PENUGASAN_PESERTA',
  T_RIWAYAT_KOMPETENSI: 'T_RIWAYAT_KOMPETENSI',
  T_KUALIFIKASI_KHUSUS: 'T_KUALIFIKASI_KHUSUS',
  T_USULAN_DIKLAT: 'T_USULAN_DIKLAT'
};

// Sheet master eksternal SIMPEG (Read-Only) + alias yang diterima
var SIMPEG_REFERENCE_SHEETS = [
  'PEGAWAI', 'M_PEGAWAI', 'pegawai',
  'UNIT_KERJA', 'M_UNIT_KERJA', 'unit_kerja', 'units',
  'JABATAN', 'M_JABATAN', 'jabatan'
];

// v5.0: Kanonikalisasi nama sheet SIMPEG ke nama kanonik SIMPEG.
// Mencegah CoreLib.resolceCanonical_ gagal saat menerima alias.
var SIMPEG_SHEET_ALIAS_ = {
  'PEGAWAI': 'PEGAWAI', 'M_PEGAWAI': 'PEGAWAI', 'pegawai': 'PEGAWAI', 'M_PEGAWAI_': 'PEGAWAI',
  'UNIT_KERJA': 'UNIT_KERJA', 'M_UNIT_KERJA': 'UNIT_KERJA', 'unit_kerja': 'UNIT_KERJA', 'units': 'UNIT_KERJA',
  'JABATAN': 'JABATAN', 'M_JABATAN': 'JABATAN', 'jabatan': 'JABATAN'
};

function isSimpegSheet_(sheetName) {
  var s = String(sheetName || '').trim();
  return SIMPEG_REFERENCE_SHEETS.indexOf(s) !== -1;
}

/**
 * v5.0: Kembalikan nama kanonik sheet SIMPEG, atau null jika bukan sheet SIMPEG.
 */
function canonicalSimpegSheet_(sheetName) {
  var s = String(sheetName || '').trim();
  if (SIMPEG_SHEET_ALIAS_[s]) return SIMPEG_SHEET_ALIAS_[s];
  var u = s.toUpperCase();
  if (SIMPEG_SHEET_ALIAS_[u]) return SIMPEG_SHEET_ALIAS_[u];
  return null;
}

// ==================== §2 AKSES PROPERTIES & SPREADSHEET ====================

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

// v5.0: sederhanakan — hanya baca store SI. Tidak panggil CoreLib (redundant).
function getEnvProperty_(key) {
  try {
    return appProps_().getProperty(key) || '';
  } catch(e) { return ''; }
}

// Lazy getter untuk SPREADSHEET_ID
var _cachedSpreadsheetId_;
function getSpreadsheetId_() {
  if (_cachedSpreadsheetId_ !== undefined) return _cachedSpreadsheetId_;
  _cachedSpreadsheetId_ = getEnvProperty_('SPREADSHEET_ID') || '';
  if (!_cachedSpreadsheetId_) {
    try { _cachedSpreadsheetId_ = SpreadsheetApp.getActiveSpreadsheet().getId(); } catch(e) {}
  }
  return _cachedSpreadsheetId_;
}

// ID Spreadsheet SIMPEG Pusat (Master Pegawai, Unit, Jabatan)
var MASTER_SPREADSHEET_ID = getEnvProperty_('MASTER_SPREADSHEET_ID') || DEFAULT_MASTER_SPREADSHEET_ID;

// ID Spreadsheet SI-PLATFORM (Sentral Settings & Audit)
var PLATFORM_SPREADSHEET_ID = getEnvProperty_('PLATFORM_SPREADSHEET_ID') || DEFAULT_PLATFORM_SPREADSHEET_ID;
var PLATFORM_API_URL = getEnvProperty_('PLATFORM_API_URL') || DEFAULT_PLATFORM_URL;

// C2: delegasi CoreLib.getDb — satu mekanisme pembuka DB di seluruh ekosistem.
// Perilaku fallback dipertahankan: id kosong/gagal → active → null.
function getLocalSpreadsheet_() {
  try {
    return CoreLib.getDb(getSpreadsheetId_());
  } catch (e) {
    Logger.log('[WARN] Tidak dapat membuka spreadsheet lokal: ' + e.message);
  }
  try {
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (e2) {
    Logger.log('[WARN] Tidak ada getActiveSpreadsheet: ' + e2.message);
  }
  return null;
}

// v5.0: hanya dipakai untuk operasi direct (jarang). CoreLib handle sendiri.
// C2: delegasi CoreLib.masterDbFor_ + getDb; gagal → fallback lokal (semantik lama).
function getMasterSpreadsheet_() {
  try {
    return CoreLib.getDb(CoreLib.masterDbFor_(getSpreadsheetId_(), MASTER_SPREADSHEET_ID));
  } catch (e) {
    Logger.log('[WARN] Gagal membuka MASTER_SPREADSHEET_ID: ' + e.message);
  }
  return getLocalSpreadsheet_();
}

// ==================== §3 NORMALISASI ID & KOLOM SIMPEG ====================

/**
 * Normalisasi entity ID ke format kanonik 4 digit.
 * Contoh:
 *   PEG-001   -> PEG-0001
 *   PEG-0001  -> PEG-0001
 *   JAB-25    -> JAB-0025
 *   UNIT-1    -> UNIT-0001
 *   UNT-001   -> UNT-0001  (prefix tetap)
 */
function normalizeEntityId_(id) {
  var s = String(id || '').trim();
  if (!s) return '';
  var m = s.match(/^([A-Z]+)-0*(\d+)$/);
  if (m) {
    var prefix = m[1];
    var num = Number(m[2]);
    return prefix + '-' + ('0000' + num).slice(-4);
  }
  return s;
}

// Field yang perlu di-normalisasi ID-nya
var ID_FIELDS_TO_NORMALIZE_ = [
  'pegawai_id', 'unit_id', 'jabatan_id', 'atasan_id',
  'plt_pegawai_id', 'kepala_unit_id', 'kepala_pegawai_id'
];

function normalizeEntityIdFields_(obj) {
  if (!obj) return obj;
  ID_FIELDS_TO_NORMALIZE_.forEach(function(f) {
    if (obj[f] !== undefined && obj[f] !== null && obj[f] !== '') {
      obj[f] = normalizeEntityId_(obj[f]);
    }
  });
  return obj;
}

/**
 * Normalisasi khusus PEGAWAI — alias kolom SIMPEG.
 */
function normalizePegawai_(obj) {
  if (!obj) return obj;
  // ID
  if (obj.pegawai_id && !obj.id) obj.id = obj.pegawai_id;
  if (!obj.pegawai_id && obj.id) obj.pegawai_id = obj.id;
  // Nama
  if (obj.nama && !obj.nama_lengkap) obj.nama_lengkap = obj.nama;
  if (obj.nama_lengkap && !obj.nama) obj.nama = obj.nama_lengkap;
  // Status kepegawaian
  if (obj.status_kepegawaian && !obj.status_pegawai) obj.status_pegawai = obj.status_kepegawaian;
  if (obj.status_pegawai && !obj.status_kepegawaian) obj.status_kepegawaian = obj.status_pegawai;
  // Pangkat
  if (obj.pangkat_golongan && !obj.pangkat_gol) obj.pangkat_gol = obj.pangkat_golongan;
  if (obj.pangkat_gol && !obj.pangkat_golongan) obj.pangkat_golongan = obj.pangkat_gol;
  // Regu
  if (obj.regu && !obj.regu_pleton) obj.regu_pleton = obj.regu;
  if (obj.regu_pleton && !obj.regu) obj.regu = obj.regu_pleton;
  // Telepon
  if (obj.no_hp && !obj.telepon) obj.telepon = obj.no_hp;
  if (obj.telepon && !obj.no_hp) obj.no_hp = obj.telepon;
  // Status aktif
  if (obj.status && !obj.status_aktif) obj.status_aktif = obj.status;
  if (obj.status_aktif && !obj.status) obj.status = obj.status_aktif;
  return obj;
}

function normalizeUnitKerja_(obj) {
  if (!obj) return obj;
  if (obj.unit_id && !obj.id) obj.id = obj.unit_id;
  if (!obj.unit_id && obj.id) obj.unit_id = obj.id;
  if (obj.nama_unit && !obj.nama) obj.nama = obj.nama_unit;
  if (obj.telepon_unit && !obj.telepon) obj.telepon = obj.telepon_unit;
  return obj;
}

function normalizeJabatan_(obj) {
  if (!obj) return obj;
  if (obj.jabatan_id && !obj.id) obj.id = obj.jabatan_id;
  if (!obj.jabatan_id && obj.id) obj.jabatan_id = obj.id;
  if (obj.nama_jabatan && !obj.nama) obj.nama = obj.nama_jabatan;
  return obj;
}

// ==================== §3b SKEMA HEADER ====================

var ALL_SHEET_HEADERS = {
  M_REFERENSI: [
    'id', 'kategori', 'kode', 'nama_nilai', 'urutan', 'status_aktif', 'keterangan',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  M_KATALOG_DIKLAT: [
    'id', 'kode_diklat', 'nama_diklat', 'rumpun', 'kategori_keahlian',
    'penyelenggara_default', 'default_jp', 'metode', 'estimasi_biaya_default',
    'deskripsi', 'persyaratan', 'status_aktif',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  M_STANDAR_KOMPETENSI: [
    'id', 'jabatan_id', 'nama_jabatan', 'diklat_id', 'nama_diklat', 'rumpun', 'level_kompetensi', 'tingkat_kebutuhan', 'minimal_jp', 'keterangan', 'status_aktif',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  T_JADWAL_DIKLAT: [
    'id', 'kode_jadwal', 'diklat_id', 'nama_kegiatan', 'rumpun', 'penyelenggara',
    'metode', 'jumlah_jp', 'tgl_mulai', 'tgl_selesai', 'bulan_periode', 'tahun_periode',
    'kuota_peserta', 'lokasi_pelaksanaan', 'link_pendaftaran', 'status_jadwal', 'keterangan',
    'catatan_hasil', 'jumlah_peserta_hadir',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  T_PENUGASAN_PESERTA: [
    'id', 'jadwal_id', 'pegawai_id', 'no_surat_tugas', 'tgl_surat_tugas',
    'pejabat_penandatangan', 'status_keikutsertaan', 'nilai_kelulusan', 'no_sertifikat_terbit',
    'catatan', 'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  T_RIWAYAT_KOMPETENSI: [
    'id', 'pegawai_id', 'diklat_id', 'jadwal_id', 'nama_kegiatan', 'rumpun', 'penyelenggara',
    'no_sertifikat', 'tgl_terbit', 'tgl_mulai', 'tgl_selesai', 'tgl_kedaluwarsa',
    'jumlah_jp', 'metode', 'file_url', 'status_verifikasi', 'catatan_verifikator',
    'verifikator_id', 'tanggal_verifikasi',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  T_KUALIFIKASI_KHUSUS: [
    'id', 'pegawai_id', 'jenis_kualifikasi', 'nomor_sk_lisensi', 'no_registrasi_nasional',
    'lembaga_penerbit', 'tgl_sk_terbit', 'tgl_habis_berlaku', 'status_kualifikasi',
    'file_sk_url', 'catatan_perpanjangan', 'alert_h90_sent',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  T_USULAN_DIKLAT: [
    'id', 'tahun_anggaran', 'periode_triwulan', 'unit_id', 'jabatan_id', 'pegawai_id',
    'diklat_id', 'nama_program_diklat', 'nama_diklat_usulan', 'rumpun', 'metode', 'penyelenggara', 'target_penyelenggara',
    'target_jp', 'estimasi_biaya', 'sumber_dana', 'urgensi', 'alasan_justifikasi', 'alasan_usulan',
    'status_rencana', 'status_usulan', 'catatan_pimpinan', 'catatan_evaluasi',
    'tgl_pengajuan', 'tgl_penetapan', 'tahun_anggaran_target',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  // SIMPEG Pusat (Read-Only)
  PEGAWAI: [
    'pegawai_id', 'nip', 'nik', 'nama', 'gelar_depan', 'gelar_belakang',
    'jenis_kelamin', 'tanggal_lahir', 'pangkat_golongan', 'status_kepegawaian',
    'pendidikan_terakhir', 'email', 'no_hp', 'alamat', 'foto_url',
    'unit_id', 'jabatan_id', 'atasan_id', 'role', 'status',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  UNIT_KERJA: [
    'unit_id', 'kode_unit', 'nama_unit', 'kategori_unit', 'parent_unit_id', 'lokasi',
    'telepon_unit', 'kepala_nip', 'kepala_hp', 'kepala_unit_id', 'jenis_unit',
    'status_aktif', 'keterangan', 'status',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  JABATAN: [
    'jabatan_id', 'kode_jabatan', 'nama_jabatan', 'jenis_jabatan', 'rumpun_jabatan',
    'jenjang_jabatan', 'kelas_jabatan', 'unit_id', 'status_jabatan', 'plt_pegawai_id',
    'tanggal_mulai_jabatan', 'tanggal_selesai_jabatan', 'target_jp_tahunan',
    'status_aktif', 'keterangan', 'status',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ]
};

// ==================== §4 ADAPTER KE CORELIB (DB ENGINE) ====================

/**
 * v5.0: Post-process record SIMPEG — normalisasi ID + kolom alias.
 * Dipanggil setelah CoreLib.getSheetDataCached.
 */
function normalizeSimpegRecords_(sheetName, records) {
  if (!records || !records.length) return records;
  var canon = canonicalSimpegSheet_(sheetName);
  if (!canon) return records;

  return records.map(function(obj) {
    var clone = Object.assign({}, obj);
    normalizeEntityIdFields_(clone);
    if (canon === 'PEGAWAI') normalizePegawai_(clone);
    else if (canon === 'UNIT_KERJA') normalizeUnitKerja_(clone);
    else if (canon === 'JABATAN') normalizeJabatan_(clone);
    return clone;
  });
}

/**
 * v5.0: Baca sheet sebagai array of records.
 * Delegasi ke CoreLib.getSheetDataCached + post-process SIMPEG.
 *
 * @param {string} sheetName
 * @returns {Array}
 */
function getSheetData_(sheetName) {
  var ssId = getSpreadsheetId_();
  if (!ssId) {
    Logger.log('[WARN] getSheetData_ dipanggil tanpa SPREADSHEET_ID.');
    return [];
  }

  var canonicalSimpeg = canonicalSimpegSheet_(sheetName);
  var lookupName = canonicalSimpeg || sheetName;
  var options = {};
  if (canonicalSimpeg) {
    options.masterSsId = MASTER_SPREADSHEET_ID;
  }

  var records;
  try {
    records = CoreLib.getSheetDataCached(
      ssId,
      lookupName,
      ALL_SHEET_HEADERS,
      DATA_CACHE_TTL,
      options
    ) || [];
  } catch (e) {
    Logger.log('[getSheetData_] ' + sheetName + ': ' + e.message);
    return [];
  }

  // Post-process untuk sheet SIMPEG
  if (canonicalSimpeg) {
    records = normalizeSimpegRecords_(sheetName, records);
  }

  return records;
}

/**
 * v5.0: Simpan / update record. Delegasi ke CoreLib.apiSave.
 * ⛔ STRICT: Menolak penyimpanan ke master SIMPEG.
 *
 * @param {string} sheetName
 * @param {Object} record
 * @param {Object} actor
 * @returns {Object} record tersimpan
 * @throws {Error} jika gagal
 */
function saveRecord_(sheetName, record, actor) {
  if (isSimpegSheet_(sheetName)) {
    throw new Error('Akses Ditolak: Sheet "' + sheetName + '" bersifat READ-ONLY di aplikasi ini.');
  }
  if (!record || typeof record !== 'object') {
    throw new Error('Record tidak valid.');
  }

  var ssId = getSpreadsheetId_();
  if (!ssId) throw new Error('Spreadsheet lokal tidak dapat dibuka.');

  // Preserve format ID ala SI (prefix 3 huruf dari nama sheet)
  if (!record.id) {
    var prefix = sheetName.replace('M_', '').replace('T_', '').substring(0, 3).toUpperCase();
    record.id = prefix + '-' + String(Date.now()).slice(-6);
  }

  var result = CoreLib.apiSave(
    ssId,
    sheetName,
    record,
    actor,
    ALL_SHEET_HEADERS,
    isSimpegSheet_,
    null,       // preSaveHook
    'id'        // pkField
  );

  if (!result.success) {
    throw new Error(result.error || ('Gagal menyimpan ke ' + sheetName + '.'));
  }
  return result.data;
}

/**
 * v5.0: Soft delete record. Delegasi ke CoreLib.apiDelete.
 *
 * @param {string} sheetName
 * @param {string} id
 * @param {Object} actor
 * @returns {boolean} true jika berhasil
 */
function softDeleteRecord_(sheetName, id, actor) {
  if (isSimpegSheet_(sheetName)) {
    throw new Error('Akses Ditolak: Sheet "' + sheetName + '" bersifat READ-ONLY di aplikasi ini.');
  }

  var ssId = getSpreadsheetId_();
  if (!ssId) return false;

  var result = CoreLib.apiDelete(
    ssId,
    sheetName,
    id,
    actor,
    ALL_SHEET_HEADERS,
    isSimpegSheet_,
    'id'
  );

  return !!result.success;
}

/**
 * v5.0: Cari record by ID. Pakai getSheetData_ (post-process sudah jalan).
 */
function findRecordById_(sheetName, id) {
  var records = getSheetData_(sheetName);
  var target = normalizeEntityId_(id);
  for (var i = 0; i < records.length; i++) {
    var recId = normalizeEntityId_(records[i].id);
    if (recId === target) {
      return records[i];
    }
  }
  return null;
}

/**
 * Ambil referensi by kategori (dari M_REFERENSI).
 */
function getReferencesByCategory_(kategori) {
  var refs = getSheetData_(LOCAL_SHEETS.M_REFERENSI);
  return refs.filter(function(r) {
    return String(r.kategori).toUpperCase() === String(kategori).toUpperCase() &&
           String(r.status_aktif).toLowerCase() !== 'false';
  }).sort(function(a, b) {
    return (Number(a.urutan) || 99) - (Number(b.urutan) || 99);
  });
}

// ==================== §5 AUDIT & RESPONSE ====================

/**
 * Kirim audit log ke SI-PLATFORM via HTTP.
 * ⚠️ Double-write: CoreLib juga menulis ke sheet AUDIT_LOGS lokal.
 *    Ini disengaja — SI-PLATFORM untuk konsolidasi lintas-app,
 *    sheet lokal untuk offline/debug.
 */
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
    spreadsheetId: getSpreadsheetId_(),
    masterSsId: MASTER_SPREADSHEET_ID,
    platformSsId: PLATFORM_SPREADSHEET_ID,
    platformApiUrl: PLATFORM_API_URL,
    sessionPrefix: SESSION_PREFIX,
    sessionTtlSeconds: SESSION_TTL_SECONDS,
    sheetNames: LOCAL_SHEETS,
    sheetHeaders: ALL_SHEET_HEADERS,
    // Tahap 3 — deklaratif scope & workflow (CoreLib v2.4.0)
    resources: {
      T_JADWAL_DIKLAT: { ownerField: SCOPE_OWNER_FIELD },
      T_RIWAYAT_KOMPETENSI: { ownerField: SCOPE_OWNER_FIELD },
      T_USULAN_DIKLAT: { ownerField: SCOPE_OWNER_FIELD }
    },
    statusMap: (typeof STATUS_MAP !== 'undefined' ? STATUS_MAP : {}),
    localHandlers: {
      get_theme: function(data, user){ return { success:true, data: getThemeConfig_() }; },
      save_theme: function(data, user){ var css = saveThemeConfig_(data); appProps_().setProperty('THEME_JSON', JSON.stringify(data)); return { success:true, data: getThemeConfig_(), css: css }; }
    }
  };
}

// ==================== §6 SELF-TEST ====================

function testConfigBridgeSelfCheck() {
  Logger.log('=== 01_ConfigAndBridge.gs v5.0.0 self-check ===');

  // 1. CoreLib terpasang?
  if (typeof CoreLib === 'undefined') {
    Logger.log('❌ CoreLib tidak terpasang!');
    return;
  }
  Logger.log('✅ CoreLib terdeteksi.');

  // 2. ROLE_LEVELS
  Logger.log('ROLE_LEVELS: ' + JSON.stringify(ROLE_LEVELS));
  Logger.log((ROLE_LEVELS.viewer === 0 ? '✅' : '❌') + ' viewer = 0');

  // 3. normalizeEntityId_
  var tests = [
    ['PEG-001', 'PEG-0001'],
    ['PEG-0001', 'PEG-0001'],
    ['JAB-25', 'JAB-0025'],
    ['UNIT-1', 'UNIT-0001'],
    ['UNT-001', 'UNT-0001'],
    ['', ''],
    ['BUKAN-ID', 'BUKAN-ID']
  ];
  var normOk = true;
  tests.forEach(function(t) {
    var got = normalizeEntityId_(t[0]);
    if (got !== t[1]) {
      Logger.log('❌ normalizeEntityId_("' + t[0] + '") = "' + got + '" (expect "' + t[1] + '")');
      normOk = false;
    }
  });
  if (normOk) Logger.log('✅ normalizeEntityId_ — semua test lulus');

  // 4. canonicalSimpegSheet_
  Logger.log((canonicalSimpegSheet_('M_PEGAWAI') === 'PEGAWAI' ? '✅' : '❌') + ' M_PEGAWAI → PEGAWAI');
  Logger.log((canonicalSimpegSheet_('pegawai') === 'PEGAWAI' ? '✅' : '❌') + ' pegawai → PEGAWAI');
  Logger.log((canonicalSimpegSheet_('M_UNIT_KERJA') === 'UNIT_KERJA' ? '✅' : '❌') + ' M_UNIT_KERJA → UNIT_KERJA');
  Logger.log((canonicalSimpegSheet_('M_KATALOG_DIKLAT') === null ? '✅' : '❌') + ' M_KATALOG_DIKLAT → null (bukan SIMPEG)');

  // 5. Ambil sample pegawai dari SIMPEG
  try {
    var pegawai = getSheetData_('PEGAWAI');
    Logger.log('Total pegawai SIMPEG: ' + pegawai.length);
    if (pegawai.length > 0) {
      var p = pegawai[0];
      Logger.log('  Contoh [0]:');
      Logger.log('    pegawai_id: ' + p.pegawai_id);
      Logger.log('    unit_id: ' + p.unit_id);
      Logger.log('    jabatan_id: ' + p.jabatan_id);
      Logger.log('    nama_lengkap: ' + p.nama_lengkap);
      Logger.log('    status_pegawai: ' + p.status_pegawai);
    }
  } catch (e) {
    Logger.log('❌ Gagal baca PEGAWAI: ' + e.message);
  }

  // 6. Ambil sample jabatan
  try {
    var jabatan = getSheetData_('JABATAN');
    Logger.log('Total jabatan SIMPEG: ' + jabatan.length);
    if (jabatan.length > 0) {
      Logger.log('  Contoh [0]: id=' + jabatan[0].id + ', nama=' + jabatan[0].nama_jabatan);
    }
  } catch (e) {
    Logger.log('❌ Gagal baca JABATAN: ' + e.message);
  }

  // 7. Ambil sample unit
  try {
    var unit = getSheetData_('UNIT_KERJA');
    Logger.log('Total unit SIMPEG: ' + unit.length);
    if (unit.length > 0) {
      Logger.log('  Contoh [0]: id=' + unit[0].id + ', nama=' + unit[0].nama_unit);
    }
  } catch (e) {
    Logger.log('❌ Gagal baca UNIT_KERJA: ' + e.message);
  }

  // 8. Baca sheet lokal
  try {
    var referensi = getSheetData_(LOCAL_SHEETS.M_REFERENSI);
    Logger.log('Total M_REFERENSI: ' + referensi.length);
  } catch (e) {
    Logger.log('❌ Gagal baca M_REFERENSI: ' + e.message);
  }

  Logger.log('=== Selesai ===');
}
