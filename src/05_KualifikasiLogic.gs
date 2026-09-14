// ============================================================
// SI-KOMPETENSI - 05_KualifikasiLogic.gs (v4.1.0 — FASE 1)
// Lisensi Khusus & H-90 Alert
// ============================================================
// Changelog v4.1 (FASE 1):
// - FIX-L1: audit log SUCCESS saat gagal -> pakai audit_ dengan status benar.
// - FIX-L2: H-90 hardcoded -> baca dari config alert_h_days_lisensi.
// - FIX-L3: Lisensi sudah expired TIDAK muncul di expiring -> sekarang
//           dipisahkan ke data_expired.
// - FIX-L4: getKualifikasiExpiringSoon_ enrich with pegawai.
// - FIX-L5: Sort expiring by tgl_habis_berlaku (paling dekat dulu).
// - FIX-L6: Validasi tgl_sk_terbit < tgl_habis_berlaku.
// - FIX-L7: Whitelist jenis_kualifikasi.
// - FIX-L8: Validasi pegawai_id exist di SIMPEG.
// - FIX-L9: Status casing konsisten (UPPERCASE).
// - FIX-L10: alert_h90_sent diperhitungkan (untuk anti-spam notifikasi).
// - FIX-L11: Cek duplikat lisensi aktif (pegawai + jenis sama).
// - FIX-L12: Filter case-insensitive (normId_ / normStr_).
// - FIX-L13: Tambah filter status_kualifikasi di getKualifikasiList_.
// - FIX-L14: getKualifikasiExpiringSoon_ terima params & filter.
// - FIX-L15: Ownership: pegawai boleh update lisensi miliknya sendiri,
//            verifikator+ boleh edit semua.
// - FIX-L16: getKualifikasiExpiringSoon_ default include_expired = false
//   (sebelumnya implisit true karena `!== false`). Sekarang eksplisit.
// - Changelog v4.1 tetap berlaku (FIX-L1 s.d. L15).
// ============================================================

// Jenis kualifikasi valid (whitelist)
var JENIS_KUALIFIKASI_VALID_ = [
  'SK_PPNS',
  'DAMKAR_1',
  'SCBA_OPERATOR',
  'SAR_WATER',
  'ROPE_RESCUE',
  'LINMAS',
  'LAINNYA'
];

// Alias teks panjang -> kode (untuk backward compat dengan data lama)
var JENIS_KUALIFIKASI_ALIAS_ = {
  'sk pengangkatan penyidik ppns (kemenkumham/polri)': 'SK_PPNS',
  'sertifikasi bnsp pemadam kebakaran level i': 'DAMKAR_1',
  'lisensi operator scba & ruang terbatas': 'SCBA_OPERATOR',
  'brevet water rescue & selam evakuasi': 'SAR_WATER',
  'brevet vertical & high angle rescue': 'ROPE_RESCUE'
};

// Status kualifikasi valid
var STATUS_KUALIFIKASI_VALID_ = ['AKTIF', 'TIDAK_AKTIF', 'DICABUT', 'DIPERPANJANG'];

/**
 * Normalisasi jenis_kualifikasi — bisa dari kode atau teks panjang.
 */
function normalizeJenisKualifikasi_(v) {
  var s = normId_(v);
  if (!s) return '';
  var upper = s.toUpperCase();
  // Kalau sudah kode valid
  if (JENIS_KUALIFIKASI_VALID_.indexOf(upper) !== -1) return upper;
  // Cek alias teks panjang
  var lower = s.toLowerCase();
  if (JENIS_KUALIFIKASI_ALIAS_[lower]) return JENIS_KUALIFIKASI_ALIAS_[lower];
  return upper;
}

// ==================== LIST ====================

/**
 * Ambil daftar kualifikasi khusus dengan filter.
 * params: { pegawai_id?, jenis_kualifikasi?, status_kualifikasi?, only_active?, enrich? }
 */
function getKualifikasiList_(params) {
  try {
    params = params || {};
    var list = getSheetData_(LOCAL_SHEETS.T_KUALIFIKASI_KHUSUS) || [];

    // FIX-L12: filter case-insensitive
    if (params.pegawai_id) {
      var pid = normId_(params.pegawai_id);
      list = list.filter(function(k) { return normId_(k.pegawai_id) === pid; });
    }
    if (params.jenis_kualifikasi) {
      var jk = normalizeJenisKualifikasi_(params.jenis_kualifikasi);
      list = list.filter(function(k) { return normalizeJenisKualifikasi_(k.jenis_kualifikasi) === jk; });
    }
    // FIX-L13: filter status
    if (params.status_kualifikasi) {
      var st = normStr_(params.status_kualifikasi);
      list = list.filter(function(k) { return normStr_(k.status_kualifikasi) === st; });
    }
    // FIX-L13: filter aktif saja
    if (params.only_active) {
      list = list.filter(function(k) { return normStr_(k.status_kualifikasi) === 'aktif'; });
    }

    // Clone supaya tidak mutasi cache
    list = list.map(function(k) { return Object.assign({}, k); });

    // FIX-L4: enrich (default true)
    if (params.enrich !== false) {
      list = enrichWithPegawai_(list);
    }

    // Sort: paling dekat kadaluwarsa dulu
    list.sort(function(a, b) {
      var da = parseDate_(a.tgl_habis_berlaku);
      var db = parseDate_(b.tgl_habis_berlaku);
      if (!da) return 1;
      if (!db) return -1;
      return da.getTime() - db.getTime();
    });

    return { success: true, data: list, total: list.length };
  } catch (err) {
    Logger.log('[getKualifikasiList_] ' + err.message);
    return { success: false, error: err.message };
  }
}

// ==================== SAVE ====================

/**
 * Simpan kualifikasi (insert / update).
 *
 * Ownership: pegawai boleh insert & update MILIKNYA SENDIRI.
 *            verifikator+ boleh edit semua.
 */
function saveKualifikasi_(params, user) {
  try {
    var record = params.record || params;

    // Validasi dasar
    if (!record.pegawai_id || !record.jenis_kualifikasi) {
      return { success: false, error: 'Pegawai dan jenis kualifikasi khusus wajib diisi.' };
    }

    // FIX-L8: validasi pegawai exist
    var simpeg = getSimpegLookup_();
    var pegawaiList = (simpeg && simpeg.data && simpeg.data.pegawai) || [];
    var pegawai = pegawaiList.find(function(p) {
      return normId_(p.id || p.pegawai_id) === normId_(record.pegawai_id);
    });
    if (!pegawai) {
      return { success: false, error: 'Pegawai tidak ditemukan di SIMPEG.' };
    }

    // FIX-L7: whitelist jenis
    var jenisNorm = normalizeJenisKualifikasi_(record.jenis_kualifikasi);
    try {
      whitelist_(jenisNorm, JENIS_KUALIFIKASI_VALID_, 'jenis_kualifikasi');
      record.jenis_kualifikasi = jenisNorm;
    } catch (e) {
      return { success: false, error: e.message };
    }

    // FIX-L6: validasi tanggal
    var tglTerbit = parseDate_(record.tgl_sk_terbit);
    var tglHabis = parseDate_(record.tgl_habis_berlaku);
    if (tglTerbit && tglHabis && tglTerbit >= tglHabis) {
      return { success: false, error: 'Tanggal habis berlaku harus setelah tanggal SK terbit.' };
    }

    // FIX-L9: status casing
    if (record.status_kualifikasi) {
      var stUpper = String(record.status_kualifikasi).toUpperCase();
      try {
        whitelist_(stUpper, STATUS_KUALIFIKASI_VALID_, 'status_kualifikasi');
        record.status_kualifikasi = stUpper;
      } catch (e) {
        return { success: false, error: e.message };
      }
    } else {
      record.status_kualifikasi = 'AKTIF';
    }

    // FIX-L11: cek duplikat (pegawai + jenis sama, status aktif, kecuali record sendiri)
    if (!record.id) {
      var existing = getSheetData_(LOCAL_SHEETS.T_KUALIFIKASI_KHUSUS) || [];
      var duplicate = existing.find(function(k) {
        if (k.deleted_at) return false;
        return normId_(k.pegawai_id) === normId_(record.pegawai_id) &&
               normalizeJenisKualifikasi_(k.jenis_kualifikasi) === jenisNorm &&
               normStr_(k.status_kualifikasi) === 'aktif';
      });
      if (duplicate) {
        return {
          success: false,
          error: 'Pegawai sudah punya lisensi ' + jenisNorm + ' yang aktif. Update lisensi yang ada atau non-aktifkan dulu.'
        };
      }
    }

    // FIX-L15: ownership — cek kalau update
    if (record.id) {
      var existingRec = findRecordById_(LOCAL_SHEETS.T_KUALIFIKASI_KHUSUS, record.id);
      if (!existingRec) return { success: false, error: 'Lisensi tidak ditemukan.' };

      var isAdminOrAbove = user && ['admin', 'super', 'verifikator'].indexOf(String(user.role).toLowerCase()) !== -1;
      var isOwner = normStr_(existingRec.created_by) === normStr_(user && user.email);

      // Pegawai biasa: hanya boleh edit lisensi dengan pegawai_id = dirinya
      if (!isAdminOrAbove) {
        var userPegawaiId = normId_((user && user.pegawai_id) || '');
        var targetPegawaiId = normId_(existingRec.pegawai_id);
        if (userPegawaiId && targetPegawaiId && userPegawaiId !== targetPegawaiId) {
          return { success: false, error: 'Anda hanya bisa mengedit lisensi milik sendiri.' };
        }
      }

      // Reset alert_h90_sent kalau tanggal habis berubah (untuk re-notif)
      var oldHabis = parseDate_(existingRec.tgl_habis_berlaku);
      var newHabis = parseDate_(record.tgl_habis_berlaku);
      if (oldHabis && newHabis && oldHabis.getTime() !== newHabis.getTime()) {
        record.alert_h90_sent = 'false';
      }
    } else {
      if (!record.alert_h90_sent) record.alert_h90_sent = 'false';
    }

    var saved = saveRecord_(LOCAL_SHEETS.T_KUALIFIKASI_KHUSUS, record, user);

    // FIX-L1: audit status benar
    audit_(user, 'SAVE_KUALIFIKASI', 'T_KUALIFIKASI_KHUSUS', saved.id, true,
      'Lisensi ' + saved.jenis_kualifikasi + ' untuk ' + saved.pegawai_id);

    return { success: true, data: saved };
  } catch (err) {
    Logger.log('[saveKualifikasi_] ' + err.message);
    audit_(user, 'SAVE_KUALIFIKASI', 'T_KUALIFIKASI_KHUSUS',
      (params.record && params.record.id) || '', false, err.message);
    return { success: false, error: err.message };
  }
}

// ==================== DELETE ====================

/**
 * Hapus lisensi (soft delete).
 * Ownership: verifikator+ atau pemilik lisensi sendiri.
 */
function deleteKualifikasi_(params, user) {
  try {
    var id = params.id;
    if (!id) return { success: false, error: 'ID kualifikasi wajib disertakan.' };

    // Ownership check
    var existing = findRecordById_(LOCAL_SHEETS.T_KUALIFIKASI_KHUSUS, id);
    if (!existing) {
      audit_(user, 'DELETE_KUALIFIKASI', 'T_KUALIFIKASI_KHUSUS', id, false, 'Tidak ditemukan');
      return { success: false, error: 'Lisensi tidak ditemukan.' };
    }

    var isAdminOrAbove = user && ['admin', 'super', 'verifikator'].indexOf(String(user.role).toLowerCase()) !== -1;
    if (!isAdminOrAbove) {
      var userPegawaiId = normId_((user && user.pegawai_id) || '');
      var targetPegawaiId = normId_(existing.pegawai_id);
      if (userPegawaiId && targetPegawaiId && userPegawaiId !== targetPegawaiId) {
        return { success: false, error: 'Anda hanya bisa menghapus lisensi milik sendiri.' };
      }
    }

    var ok = softDeleteRecord_(LOCAL_SHEETS.T_KUALIFIKASI_KHUSUS, id, user);

    // FIX-L1: audit status benar
    audit_(user, 'DELETE_KUALIFIKASI', 'T_KUALIFIKASI_KHUSUS', id, ok,
      ok ? 'Hapus lisensi: ' + id : 'Lisensi tidak ditemukan: ' + id);

    return {
      success: ok,
      message: ok ? 'Lisensi kualifikasi khusus berhasil dihapus.' : 'Lisensi tidak ditemukan.'
    };
  } catch (err) {
    Logger.log('[deleteKualifikasi_] ' + err.message);
    return { success: false, error: err.message };
  }
}

// ==================== EXPIRING SOON (H-90 Alert) ====================

/**
 * Cari lisensi yang akan / sudah kadaluwarsa.
 *
 * FIX-L2: threshold dari config alert_h_days_lisensi.
 * FIX-L3: pisahkan expired vs expiring soon.
 * FIX-L4: enrich with pegawai.
 * FIX-L5: sort by tgl_habis_berlaku.
 * FIX-L10: sertakan status alert_h90_sent.
 * FIX-L14: terima params & filter.
 *
 * params: { pegawai_id?, jenis_kualifikasi?, unit_id?, include_expired? }
 */
/**
 * Cari lisensi yang akan / sudah kadaluwarsa.
 *
 * v5.0 FIX-L16: default include_expired = false (sebelumnya implisit true).
 *   Perilaku lama: `params.include_expired !== false` → kalau undefined,
 *   hasilnya TRUE. Membingungkan. Sekarang eksplisit default false.
 *
 * params: { pegawai_id?, jenis_kualifikasi?, include_expired? (default false) }
 */
function getKualifikasiExpiringSoon_(params) {
  try {
    params = params || {};
    var list = getSheetData_(LOCAL_SHEETS.T_KUALIFIKASI_KHUSUS) || [];

    var hDays = Number(getEnvProperty_('alert_h_days_lisensi')) || 90;
    var nowMs = Date.now();
    var msThreshold = hDays * 24 * 60 * 60 * 1000;

    if (params.pegawai_id) {
      var pid = normId_(params.pegawai_id);
      list = list.filter(function(k) { return normId_(k.pegawai_id) === pid; });
    }
    if (params.jenis_kualifikasi) {
      var jk = normalizeJenisKualifikasi_(params.jenis_kualifikasi);
      list = list.filter(function(k) { return normalizeJenisKualifikasi_(k.jenis_kualifikasi) === jk; });
    }

    var expiring = [];
    var expired = [];

    list.forEach(function(k) {
      if (!k.tgl_habis_berlaku) return;
      if (normStr_(k.status_kualifikasi) === 'tidak_aktif') return;
      if (normStr_(k.status_kualifikasi) === 'dicabut') return;

      var expMs = parseDate_(k.tgl_habis_berlaku);
      if (!expMs) return;
      expMs = expMs.getTime();

      var item = Object.assign({}, k);
      item.jenis_kualifikasi_normalized = normalizeJenisKualifikasi_(k.jenis_kualifikasi);

      if (expMs <= nowMs) {
        item.hari_terlambat = Math.floor((nowMs - expMs) / 86400000);
        expired.push(item);
      } else if ((expMs - nowMs) <= msThreshold) {
        item.hari_tersisa = Math.floor((expMs - nowMs) / 86400000);
        expiring.push(item);
      }
    });

    expiring.sort(function(a, b) { return a.hari_tersisa - b.hari_tersisa; });
    expired.sort(function(a, b) { return b.hari_terlambat - a.hari_terlambat; });

    expiring = enrichWithPegawai_(expiring);
    expired = enrichWithPegawai_(expired);

    // v5.0 FIX-L16: default false
    var includeExpired = params.include_expired === true;

    return {
      success: true,
      count: expiring.length,
      count_expired: expired.length,
      threshold_days: hDays,
      data: expiring,
      data_expired: includeExpired ? expired : []
    };
  } catch (err) {
    Logger.log('[getKualifikasiExpiringSoon_] ' + err.message);
    return { success: false, error: err.message };
  }
}

// ==================== JOB HARIAN (opsional) ====================

/**
 * Job harian untuk tandai lisensi yang H-90.
 * Bisa dipasang via Triggers → Time-driven.
 *
 * Cara pakai:
 *   1. Buka Triggers di editor Apps Script
 *   2. Add Trigger → pilih fungsi ini → Time-driven → Day timer
 *
 * Catatan: tidak kirim email (belum ada fitur notifikasi).
 *          Hanya set flag alert_h90_sent = 'true'.
 */
function dailyLisensiAlertJob_() {
  try {
    Logger.log('=== Daily Lisensi Alert Job ===');
    var result = getKualifikasiExpiringSoon_({});
    var expiring = result.data || [];

    var updated = 0;
    expiring.forEach(function(k) {
      if (normStr_(k.alert_h90_sent) === 'true') return;
      // Update flag
      k.alert_h90_sent = 'true';
      try {
        saveRecord_(LOCAL_SHEETS.T_KUALIFIKASI_KHUSUS, k, { id: 'SYSTEM_JOB', email: 'system@job' });
        updated++;
      } catch (e) {
        Logger.log('[WARN] Gagal update alert flag: ' + e.message);
      }
    });

    Logger.log('Job selesai. Total expiring: ' + expiring.length + ', ditandai: ' + updated);
    return { success: true, expiring: expiring.length, marked: updated };
  } catch (err) {
    Logger.log('[dailyLisensiAlertJob_] ' + err.message);
    return { success: false, error: err.message };
  }
}

// ==================== SELF-TEST ====================

function testKualifikasiSelfCheck() {
  Logger.log('=== 05_KualifikasiLogic.gs v4.1 self-check ===');

  // Test 1: list
  var list = getKualifikasiList_({});
  Logger.log((list.success ? '✅' : '❌') + ' getKualifikasiList_: ' + (list.data || []).length + ' lisensi');

  // Test 2: list filter aktif
  var aktif = getKualifikasiList_({ only_active: true });
  Logger.log((aktif.success ? '✅' : '❌') + ' filter only_active: ' + (aktif.data || []).length);

  // Test 3: expiring
  var expiring = getKualifikasiExpiringSoon_({});
  Logger.log((expiring.success ? '✅' : '❌') + ' getKualifikasiExpiringSoon_');
  Logger.log('   Threshold: ' + expiring.threshold_days + ' hari');
  Logger.log('   Expiring soon: ' + expiring.count);
  Logger.log('   Sudah expired: ' + expiring.count_expired);

  // Test 4: normalize jenis
  Logger.log('   normalizeJenisKualifikasi_("SK_PPNS"): ' + normalizeJenisKualifikasi_('SK_PPNS'));
  Logger.log('   normalizeJenisKualifikasi_("sk pengangkatan penyidik ppns (kemenkumham/polri)"): ' + normalizeJenisKualifikasi_('sk pengangkatan penyidik ppns (kemenkumham/polri)'));

  // Test 5: validasi save tanpa pegawai
  var bad = saveKualifikasi_({}, { role: 'admin', email: 'test@test.com' });
  Logger.log((!bad.success ? '✅' : '❌') + ' save tanpa pegawai: ' + (bad.error || 'TIDAK DITOLAK'));

  // Test 6: validasi jenis invalid
  var badJenis = saveKualifikasi_({
    pegawai_id: 'PEG-001',
    jenis_kualifikasi: 'JENIS_NGAWUR'
  }, { role: 'admin', email: 'test@test.com' });
  Logger.log((!badJenis.success ? '✅' : '❌') + ' whitelist jenis: ' + (badJenis.error || 'TIDAK DITOLAK'));

  // Test 7: validasi tanggal
  var badTgl = saveKualifikasi_({
    pegawai_id: 'PEG-001',
    jenis_kualifikasi: 'SK_PPNS',
    tgl_sk_terbit: '2026-12-31',
    tgl_habis_berlaku: '2026-01-01'
  }, { role: 'admin', email: 'test@test.com' });
  Logger.log((!badTgl.success ? '✅' : '❌') + ' validasi tanggal: ' + (badTgl.error || 'TIDAK DITOLAK'));

  Logger.log('=== Selesai ===');
}
