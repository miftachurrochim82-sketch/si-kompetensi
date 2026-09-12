

var FALLBACK_UNIT_KERJA = [
  { id: "UNT-001", unit_id: "UNT-001", kode_unit: "SEKR", nama_unit: "Sekretariat & Pimpinan Dinas", singkatan: "SEKR" },
  { id: "UNT-002", unit_id: "UNT-002", kode_unit: "GAKDA", nama_unit: "Bidang Penegakan Perda & Perbup", singkatan: "GAKDA" },
  { id: "UNT-003", unit_id: "UNT-003", kode_unit: "DAMKAR", nama_unit: "Bidang Pemadam Kebakaran & Penyelamatan", singkatan: "DAMKAR" },
  { id: "UNT-004", unit_id: "UNT-004", kode_unit: "LINMAS", nama_unit: "Bidang Perlindungan Masyarakat (Satlinmas)", singkatan: "LINMAS" }
];

var FALLBACK_JABATAN = [
  { id: "JAB-001", jabatan_id: "JAB-001", kode_jabatan: "KASAT", nama_jabatan: "Kepala Satuan Polisi Pamong Praja & Pemadam Kebakaran", target_jp_tahunan: 20 },
  { id: "JAB-002", jabatan_id: "JAB-002", kode_jabatan: "KABID_GAKDA", nama_jabatan: "Kepala Bidang Penegakan Perda & Perbup", target_jp_tahunan: 20 },
  { id: "JAB-003", jabatan_id: "JAB-003", kode_jabatan: "PPNS_PERTAMA", nama_jabatan: "Penyidik PPNS Penegak Perda Ahli Pertama", target_jp_tahunan: 20 },
  { id: "JAB-004", jabatan_id: "JAB-004", kode_jabatan: "KABID_DAMKAR", nama_jabatan: "Kepala Bidang Pemadam Kebakaran & Penyelamatan", target_jp_tahunan: 20 },
  { id: "JAB-005", jabatan_id: "JAB-005", kode_jabatan: "PENGAWAS_LINMAS", nama_jabatan: "Pengawas Tata Operasional Linmas & Bencana", target_jp_tahunan: 20 },
  { id: "JAB-006", jabatan_id: "JAB-006", kode_jabatan: "OPERATOR_WATER", nama_jabatan: "Operator Damkar & Water Rescue Pos Watulimo", target_jp_tahunan: 20 },
  { id: "JAB-007", jabatan_id: "JAB-007", kode_jabatan: "DANRU_RESCUE", nama_jabatan: "Komandan Regu Rescue Damkar & Vertical Rescue", target_jp_tahunan: 20 },
  { id: "JAB-008", jabatan_id: "JAB-008", kode_jabatan: "POLPP_PERTAMA", nama_jabatan: "Polisi Pamong Praja Ahli Pertama (Trantibum)", target_jp_tahunan: 20 },
  { id: "JAB-009", jabatan_id: "JAB-009", kode_jabatan: "DAMKAR_TERAMPIL", nama_jabatan: "Pranata Pemadam Kebakaran Terampil", target_jp_tahunan: 24 },
  { id: "JAB-010", jabatan_id: "JAB-010", kode_jabatan: "RESCUER_TERAMPIL", nama_jabatan: "Petugas Penyelamat Rescue Terampil", target_jp_tahunan: 24 }
];

var FALLBACK_PEGAWAI = [
  { id: "PEG-001", pegawai_id: "PEG-001", nip: "197709081998021001", nama_lengkap: "PURWO EDI PRAWITO, S.Sos.", nama: "PURWO EDI PRAWITO, S.Sos.", pangkat_golongan: "Pembina (IV/a)", unit_id: "UNT-001", jabatan_id: "JAB-001", status_pegawai: "PNS", is_ppns: true },
  { id: "PEG-002", pegawai_id: "PEG-002", nip: "198205122005011002", nama_lengkap: "MIFTACHUR ROCHIM, S.AP.", nama: "MIFTACHUR ROCHIM, S.AP.", pangkat_golongan: "Penata Tk.I (III/d)", unit_id: "UNT-002", jabatan_id: "JAB-002", status_pegawai: "PNS", is_ppns: true },
  { id: "PEG-003", pegawai_id: "PEG-003", nip: "198603152010011003", nama_lengkap: "AGUS PRASETYO, S.H.", nama: "AGUS PRASETYO, S.H.", pangkat_golongan: "Penata (III/c)", unit_id: "UNT-002", jabatan_id: "JAB-003", status_pegawai: "PNS", is_ppns: true },
  { id: "PEG-004", pegawai_id: "PEG-004", nip: "198911202014021004", nama_lengkap: "BAMBANG HERMAWAN", nama: "BAMBANG HERMAWAN", pangkat_golongan: "Penata Muda Tk.I (III/b)", unit_id: "UNT-003", jabatan_id: "JAB-004", status_pegawai: "PNS", is_ppns: false, kualifikasi_damkar: "Damkar I, SCBA" },
  { id: "PEG-005", pegawai_id: "PEG-005", nip: "199204102019031005", nama_lengkap: "DENI KURNIAWAN, S.Tr.IP.", nama: "DENI KURNIAWAN, S.Tr.IP.", pangkat_golongan: "Penata Muda (III/a)", unit_id: "UNT-004", jabatan_id: "JAB-005", status_pegawai: "PNS", is_ppns: false },
  { id: "PEG-006", pegawai_id: "PEG-006", nip: "199507182020121006", nama_lengkap: "EKO WAHYUDI", nama: "EKO WAHYUDI", pangkat_golongan: "Pengatur Tk.I (II/d)", unit_id: "UNT-003", jabatan_id: "JAB-006", status_pegawai: "PNS", is_ppns: false, kualifikasi_damkar: "Water Rescue" },
  { id: "PEG-007", pegawai_id: "PEG-007", nip: "199702252022031007", nama_lengkap: "FAJAR NUGROHO", nama: "FAJAR NUGROHO", pangkat_golongan: "Pengatur (II/c)", unit_id: "UNT-003", jabatan_id: "JAB-007", status_pegawai: "PNS", is_ppns: false, kualifikasi_damkar: "Vertical Rescue" },
  { id: "PEG-008", pegawai_id: "PEG-008", nip: "199906302024051008", nama_lengkap: "GILANG RAMADHAN", nama: "GILANG RAMADHAN", pangkat_golongan: "Pengatur Muda Tk.I (II/b)", unit_id: "UNT-002", jabatan_id: "JAB-008", status_pegawai: "PNS", is_ppns: false },
  { id: "PEG-009", pegawai_id: "PEG-009", nip: "199408122023211009", nama_lengkap: "HENDRA WIJAYA", nama: "HENDRA WIJAYA", pangkat_golongan: "Golongan VII", unit_id: "UNT-003", jabatan_id: "JAB-009", status_pegawai: "PPPK", is_ppns: false, kualifikasi_damkar: "Damkar I" },
  { id: "PEG-010", pegawai_id: "PEG-010", nip: "199612052023211010", nama_lengkap: "IRWAN SANTOSO", nama: "IRWAN SANTOSO", pangkat_golongan: "Golongan VII", unit_id: "UNT-003", jabatan_id: "JAB-010", status_pegawai: "PPPK", is_ppns: false, kualifikasi_damkar: "Water Rescue" }
];

// ============================================================
// SI-KOMPETENSI - 01_ConfigAndBridge.gs (v4.0.0 — 8-Sheet Ideal Architecture)
// Sistem Informasi Manajemen Portofolio, Jadwal & Lisensi Khusus ASN
// Satuan Polisi Pamong Praja & Pemadam Kebakaran Kab. Trenggalek
// ============================================================

var APP_TITLE = 'SI-KOMPETENSI';
var APP_CODE = 'SIKOMPETENSI';

// ID Spreadsheet Resmi Ekosistem Terpadu Trenggalek
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

// ==================== 8 SHEET DATABASE LOKAL SI-KOMPETENSI ====================
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

// Sheet master eksternal SIMPEG (Read-Only)
var SIMPEG_REFERENCE_SHEETS = [
  'PEGAWAI', 'M_PEGAWAI', 'pegawai',
  'UNIT_KERJA', 'M_UNIT_KERJA', 'unit_kerja', 'units',
  'JABATAN', 'M_JABATAN', 'jabatan'
];

function isSimpegSheet_(sheetName) {
  var s = String(sheetName || '').trim();
  return SIMPEG_REFERENCE_SHEETS.indexOf(s) !== -1;
}

// Skema Header Resmi 8 Sheet Lokal + SIMPEG
var ALL_SHEET_HEADERS = {
  // 1. Master Referensi Gabungan
  M_REFERENSI: [
    'id', 'kategori', 'kode', 'nama_nilai', 'urutan', 'status_aktif', 'keterangan',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],

  // 2. Katalog Master Program Diklat Resmi (Kamus Diklat)
  M_KATALOG_DIKLAT: [
    'id', 'kode_diklat', 'nama_diklat', 'rumpun', 'kategori_keahlian',
    'penyelenggara_default', 'default_jp', 'metode', 'estimasi_biaya_default',
    'deskripsi', 'persyaratan', 'status_aktif',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],

  // 3. Standar Kompetensi Jabatan (Matriks Kebutuhan Pelatihan per Posisi Jabatan)
  M_STANDAR_KOMPETENSI: [
    'id', 'jabatan_id', 'diklat_id', 'tingkat_kebutuhan', 'minimal_jp', 'keterangan', 'status_aktif',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],

  // 4. Jadwal & Agenda Pelatihan Riil (Pemisahan Jadwal dari Katalog)
  T_JADWAL_DIKLAT: [
    'id', 'kode_jadwal', 'diklat_id', 'nama_kegiatan', 'rumpun', 'penyelenggara',
    'metode', 'jumlah_jp', 'tgl_mulai', 'tgl_selesai', 'bulan_periode', 'tahun_periode',
    'kuota_peserta', 'lokasi_pelaksanaan', 'link_pendaftaran', 'status_jadwal', 'keterangan',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],

  // 5. Penugasan Peserta & Surat Perintah Tugas (SPT Kasatpol PP & Damkar)
  T_PENUGASAN_PESERTA: [
    'id', 'jadwal_id', 'pegawai_id', 'no_surat_tugas', 'tgl_surat_tugas',
    'pejabat_penandatangan', 'status_keikutsertaan', 'nilai_kelulusan', 'no_sertifikat_terbit',
    'catatan', 'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],

  // 6. Riwayat Sertifikat Diklat Pegawai (Pemenuhan Standar 20 JP PNS / 24 JP PPPK)
  T_RIWAYAT_KOMPETENSI: [
    'id', 'pegawai_id', 'diklat_id', 'jadwal_id', 'nama_kegiatan', 'rumpun', 'penyelenggara',
    'no_sertifikat', 'tgl_terbit', 'tgl_mulai', 'tgl_selesai', 'tgl_kedaluwarsa',
    'jumlah_jp', 'metode', 'file_url', 'status_verifikasi', 'catatan_verifikator',
    'verifikator_id', 'tanggal_verifikasi',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],

  // 7. Kualifikasi & Lisensi Khusus Kadaluwarsa (PPNS, Damkar I, SCBA, Rescue, Water SAR)
  T_KUALIFIKASI_KHUSUS: [
    'id', 'pegawai_id', 'jenis_kualifikasi', 'nomor_sk_lisensi', 'no_registrasi_nasional',
    'lembaga_penerbit', 'tgl_sk_terbit', 'tgl_habis_berlaku', 'status_kualifikasi',
    'file_sk_url', 'catatan_perpanjangan', 'alert_h90_sent',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],

  // 8. Rencana Pengembangan Kompetensi Tahunan (Annual Competency Plan & AKD)
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
    'pegawai_id', 'nip', 'nama_lengkap', 'gelar_depan', 'gelar_belakang', 'email', 'telepon',
    'unit_id', 'jabatan_id', 'pangkat_golongan', 'status_pegawai', 'status_aktif',
    'regu_pleton', 'pos_wilayah', 'is_ppns', 'kualifikasi_damkar',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  UNIT_KERJA: [
    'unit_id', 'kode_unit', 'nama_unit', 'singkatan', 'level_unit', 'parent_unit_id',
    'alamat_kantor', 'telepon_unit', 'status_aktif',
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
 * Membaca Data Sheet sebagai JSON Objects dengan Normalisasi Kolom & In-Memory Cache
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
      'T_KOMPETENSI_PEGAWAI': ['T_RIWAYAT_KOMPETENSI', 'DATA_KOMPETENSI', 'riwayat_kompetensi'],
      'T_JADWAL_DIKLAT': ['JADWAL_DIKLAT', 'jadwal_diklat', 'T_JADWAL'],
      'T_PENUGASAN_PESERTA': ['PENUGASAN_PESERTA', 'T_PENUGASAN', 'penugasan'],
      'T_KUALIFIKASI_KHUSUS': ['KUALIFIKASI_KHUSUS', 'T_LISENSI_KHUSUS', 'kualifikasi_khusus']
    };
    var cand = aliasMap[sheetName] || [];
    for (var i = 0; i < cand.length; i++) {
      sheet = ss.getSheetByName(cand[i]);
      if (sheet) break;
    }
  }

  if (!sheet || sheet.getLastRow() <= 1) {
    if (sheetName === "PEGAWAI" || sheetName === "M_PEGAWAI" || sheetName === "pegawai") {
      return FALLBACK_PEGAWAI.slice();
    }
    if (sheetName === "UNIT_KERJA" || sheetName === "M_UNIT_KERJA" || sheetName === "unit_kerja" || sheetName === "units") {
      return FALLBACK_UNIT_KERJA.slice();
    }
    if (sheetName === "JABATAN" || sheetName === "M_JABATAN" || sheetName === "jabatan") {
      return FALLBACK_JABATAN.slice();
    }
    return [];
  }

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
      // Normalisasi khusus PEGAWAI
      if (sheetName === 'PEGAWAI' || sheetName === 'M_PEGAWAI' || sheetName === 'pegawai') {
        if (obj.pegawai_id && !obj.id) obj.id = obj.pegawai_id;
        if (!obj.pegawai_id && obj.id) obj.pegawai_id = obj.id;
        if (obj.nama && !obj.nama_lengkap) obj.nama_lengkap = obj.nama;
        if (obj.nama_lengkap && !obj.nama) obj.nama = obj.nama_lengkap;
        if (obj.pangkat_golongan && !obj.pangkat_gol) obj.pangkat_gol = obj.pangkat_golongan;
        if (obj.pangkat_gol && !obj.pangkat_golongan) obj.pangkat_golongan = obj.pangkat_gol;
        if (obj.regu && !obj.regu_pleton) obj.regu_pleton = obj.regu;
        if (obj.regu_pleton && !obj.regu) obj.regu = obj.regu_pleton;
        if (obj.no_hp && !obj.telepon) obj.telepon = obj.no_hp;
      }

      // Normalisasi khusus UNIT_KERJA
      if (sheetName === 'UNIT_KERJA' || sheetName === 'M_UNIT_KERJA' || sheetName === 'unit_kerja' || sheetName === 'units') {
        if (obj.unit_id && !obj.id) obj.id = obj.unit_id;
        if (!obj.unit_id && obj.id) obj.unit_id = obj.id;
        if (obj.nama_unit && !obj.nama) obj.nama = obj.nama_unit;
        if (obj.telepon_unit && !obj.telepon) obj.telepon = obj.telepon_unit;
      }

      // Normalisasi khusus JABATAN
      if (sheetName === 'JABATAN' || sheetName === 'M_JABATAN' || sheetName === 'jabatan') {
        if (obj.jabatan_id && !obj.id) obj.id = obj.jabatan_id;
        if (!obj.jabatan_id && obj.id) obj.jabatan_id = obj.id;
        if (obj.nama_jabatan && !obj.nama) obj.nama = obj.nama_jabatan;
      }

      records.push(obj);
    }
  }

  // Simpan cache untuk sheet referensi & master satelit
  var cacheableSheets = [
    LOCAL_SHEETS.M_REFERENSI,
    LOCAL_SHEETS.M_KATALOG_DIKLAT,
    LOCAL_SHEETS.M_STANDAR_KOMPETENSI,
    LOCAL_SHEETS.T_JADWAL_DIKLAT
  ];
  if (isSimpegSheet_(sheetName) || cacheableSheets.indexOf(sheetName) !== -1) {
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
  if (pkIndex === -1) pkIndex = 0;
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
    if (String(records[i].id) === String(id)) {
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
