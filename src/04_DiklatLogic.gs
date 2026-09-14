// ============================================================
// SI-KOMPETENSI - 04_DiklatLogic.gs (v4.2.0 — FASE 1 FINAL)
// Jadwal Pelatihan & Penugasan Peserta
// ============================================================
// Changelog v4.2 (FINAL):
// - POLICY: save_jadwal = user (pegawai boleh input & update)
//           delete_jadwal = admin (hanya admin/super)
// - Ownership rules:
//   • Pembuat (created_by): bebas edit semua field
//   • Admin/Super: bebas edit semua jadwal
//   • Non-pembuat (pegawai lain): HANYA field hasil
//     (status_jadwal, nilai_kelulusan, no_sertifikat_terbit,
//      catatan_hasil, jumlah_peserta_hadir)
//   • Delete: hanya admin/super
// - FIX-K1..K13 dari v4.1 tetap berlaku
// ============================================================

// Status jadwal yang valid
var JADWAL_STATUS_VALID_ = [
  'Terjadwal', 'Buka Pendaftaran', 'Segera Dibuka',
  'Sedang Berjalan', 'Selesai', 'Dibatalkan'
];

// Status keikutsertaan peserta
var PENUGASAN_STATUS_VALID_ = ['DITUGASKAN', 'HADIR', 'TIDAK_HADIR', 'SELESAI', 'BATAL'];

// Field yang boleh diupdate oleh NON-pembuat (pegawai lain)
// Field di luar ini hanya boleh diedit oleh pembuat atau admin.
var JADWAL_HASIL_FIELDS_ = [
  'status_jadwal',
  'nilai_kelulusan',
  'no_sertifikat_terbit',
  'catatan_hasil',
  'jumlah_peserta_hadir'
];

// ==================== JADWAL DIKLAT ====================

/**
 * Ambil daftar jadwal dengan filter.
 * params: { tahun?, status?, rumpun?, diklat_id?, limit? }
 */
function getJadwalList_(params) {
  try {
    params = params || {};
    var list = getSheetData_(LOCAL_SHEETS.T_JADWAL_DIKLAT) || [];

    if (params.tahun) {
      list = list.filter(function(j) {
        if (j.tahun_periode) return String(j.tahun_periode) === String(params.tahun);
        var d = parseDate_(j.tgl_mulai);
        return d && d.getFullYear() === Number(params.tahun);
      });
    }
    if (params.status) {
      list = list.filter(function(j) { return normStr_(j.status_jadwal) === normStr_(params.status); });
    }
    if (params.rumpun) {
      list = list.filter(function(j) { return normStr_(j.rumpun) === normStr_(params.rumpun); });
    }
    if (params.diklat_id) {
      list = list.filter(function(j) { return normId_(j.diklat_id) === normId_(params.diklat_id); });
    }

    // Sort: terbaru dulu
    list.sort(function(a, b) {
      var da = parseDate_(a.tgl_mulai);
      var db = parseDate_(b.tgl_mulai);
      if (!da) return 1;
      if (!db) return -1;
      return db.getTime() - da.getTime();
    });

    var limit = Number(params.limit) || 0;
    if (limit > 0) list = list.slice(0, limit);

    list = list.map(function(j) { return Object.assign({}, j); });

    return { success: true, data: list, total: list.length };
  } catch (err) {
    Logger.log('[getJadwalList_] ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Simpan jadwal (insert atau update).
 *
 * POLICY:
 * - user: boleh insert jadwal baru
 * - user: boleh update jadwal MILIKNYA SENDIRI (semua field)
 * - user: boleh update jadwal ORANG LAIN hanya field hasil
 * - admin/super: boleh update semua jadwal semua field
 *
 * Changelog v5.1 (2026-09-14):
 * - 🔴 FIX: ownership false positive saat userEmail kosong.
 *   Sebelumnya kalau `userEmail === ''` dan `created_by === ''`,
 *   `isOwner` jadi `true` → semua user auto-jadi owner.
 *   Sekarang wajib `userEmail` tidak kosong.
 */
function saveJadwal_(params, user) {
  try {
    var record = params.record || params;

    // ============ Validasi dasar ============
    if (!record.nama_kegiatan && !record.nama_diklat) {
      return { success: false, error: 'Nama kegiatan pelatihan wajib diisi.' };
    }
    if (!record.nama_kegiatan && record.nama_diklat) record.nama_kegiatan = record.nama_diklat;
    if (!record.nama_diklat && record.nama_kegiatan) record.nama_diklat = record.nama_kegiatan;

    // Validasi tanggal
    var tglMulai = parseDate_(record.tgl_mulai);
    var tglSelesai = parseDate_(record.tgl_selesai);
    if (tglMulai && tglSelesai && tglMulai > tglSelesai) {
      return { success: false, error: 'Tanggal mulai tidak boleh setelah tanggal selesai.' };
    }

    // Whitelist status
    if (record.status_jadwal) {
      try {
        whitelist_(record.status_jadwal, JADWAL_STATUS_VALID_, 'status_jadwal');
      } catch (e) {
        return { success: false, error: e.message };
      }
    } else {
      record.status_jadwal = 'Terjadwal';
    }

    var isAdmin = user && (user.role === 'admin' || user.role === 'super');
    var userEmail = (user && user.email) || '';

    // ============================================================
    // OWNERSHIP LOGIC
    // ============================================================
    if (record.id) {
      // ---- UPDATE ----
      var existing = findRecordById_(LOCAL_SHEETS.T_JADWAL_DIKLAT, record.id);
      if (!existing) return { success: false, error: 'Jadwal tidak ditemukan.' };

      // v5.1 FIX: guard userEmail kosong agar tidak jadi false positive
      // (kalau userEmail & created_by dua-duanya kosong, isOwner tidak boleh true)
      var isOwner = !!userEmail && normStr_(existing.created_by) === normStr_(userEmail);

      if (isAdmin || isOwner) {
        // OK — boleh edit semua field. Lanjut seperti biasa.
      } else {
        // ---- NON-OWNER & NON-ADMIN: hanya field hasil ----
        var attempted = Object.keys(record);
        var blocked = [];
        var sanitized = { id: record.id };

        attempted.forEach(function(k) {
          // Skip field teknis
          if (['id', 'created_at', 'created_by', 'updated_at', 'updated_by', 'deleted_at'].indexOf(k) !== -1) return;

          if (JADWAL_HASIL_FIELDS_.indexOf(k) !== -1) {
            sanitized[k] = record[k];
          } else if (String(record[k] || '') !== String(existing[k] || '')) {
            blocked.push(k);
          }
        });

        if (blocked.length > 0) {
          return {
            success: false,
            error: 'Anda hanya boleh mengedit field hasil (status, nilai, no sertifikat, catatan). Field yang tidak diizinkan: ' + blocked.join(', ')
          };
        }

        record = sanitized;
      }
    } else {
      // ---- INSERT baru ----
      // user biasa tidak bisa pakai status di luar default
      if (!isAdmin) {
        var allowedInsertStatus = ['Terjadwal', 'Buka Pendaftaran', 'Segera Dibuka'];
        if (allowedInsertStatus.indexOf(record.status_jadwal) === -1) {
          record.status_jadwal = 'Terjadwal';
        }
      }
    }

    // Generate kode unik saat insert baru
    if (!record.id && !record.kode_jadwal) {
      record.kode_jadwal = genUniqueCode_('JDW-', LOCAL_SHEETS.T_JADWAL_DIKLAT, 'kode_jadwal', 3);
    }

    var saved = saveRecord_(LOCAL_SHEETS.T_JADWAL_DIKLAT, record, user);

    var actionName = record.id ? 'UPDATE_JADWAL' : 'CREATE_JADWAL';
    audit_(user, actionName, 'T_JADWAL_DIKLAT', saved.id, true,
      'Jadwal: ' + (saved.nama_kegiatan || saved.kode_jadwal));

    return { success: true, data: saved };
  } catch (err) {
    Logger.log('[saveJadwal_] ' + err.message);
    audit_(user, 'SAVE_JADWAL', 'T_JADWAL_DIKLAT',
      (params.record && params.record.id) || '', false, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Hapus jadwal (soft delete).
 * POLICY: hanya admin/super.
 */
function deleteJadwal_(params, user) {
  try {
    var id = params.id;
    if (!id) return { success: false, error: 'ID jadwal wajib disertakan.' };

    // Double-check admin
    try {
      requireRole_(user, 'admin');
    } catch (e) {
      audit_(user, 'DELETE_JADWAL', 'T_JADWAL_DIKLAT', id, false, 'Akses ditolak: ' + e.message);
      return { success: false, error: e.message };
    }

    // Cek orphan penugasan
    var penugasan = getSheetData_(LOCAL_SHEETS.T_PENUGASAN_PESERTA) || [];
    var linkedPenugasan = penugasan.filter(function(p) {
      return normId_(p.jadwal_id) === normId_(id) && !p.deleted_at;
    });
    if (linkedPenugasan.length > 0) {
      var msg = 'Tidak bisa hapus jadwal: masih ada ' + linkedPenugasan.length + ' penugasan peserta. Hapus penugasan terlebih dahulu.';
      audit_(user, 'DELETE_JADWAL', 'T_JADWAL_DIKLAT', id, false, msg);
      return { success: false, error: msg, count: linkedPenugasan.length };
    }

    var ok = softDeleteRecord_(LOCAL_SHEETS.T_JADWAL_DIKLAT, id, user);

    audit_(user, 'DELETE_JADWAL', 'T_JADWAL_DIKLAT', id, ok,
      ok ? 'Hapus jadwal: ' + id : 'Jadwal tidak ditemukan: ' + id);

    return {
      success: ok,
      message: ok ? 'Jadwal berhasil dihapus.' : 'Jadwal tidak ditemukan.'
    };
  } catch (err) {
    Logger.log('[deleteJadwal_] ' + err.message);
    return { success: false, error: err.message };
  }
}

// ==================== PENUGASAN PESERTA ====================

/**
 * Ambil daftar penugasan dengan filter (case-insensitive).
 */
function getPenugasanList_(params) {
  try {
    params = params || {};
    var list = getSheetData_(LOCAL_SHEETS.T_PENUGASAN_PESERTA) || [];

    if (params.jadwal_id) {
      var jid = normId_(params.jadwal_id);
      list = list.filter(function(p) { return normId_(p.jadwal_id) === jid; });
    }
    if (params.pegawai_id) {
      var pid = normId_(params.pegawai_id);
      list = list.filter(function(p) { return normId_(p.pegawai_id) === pid; });
    }
    if (params.status_keikutsertaan) {
      var st = normStr_(params.status_keikutsertaan);
      list = list.filter(function(p) { return normStr_(p.status_keikutsertaan) === st; });
    }

    list = list.map(function(p) { return Object.assign({}, p); });

    return { success: true, data: list, total: list.length };
  } catch (err) {
    Logger.log('[getPenugasanList_] ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Simpan penugasan peserta.
 * POLICY: verifikator+ (dari ACTION_ROLE_MAP_).
 */
function savePenugasan_(params, user) {
  try {
    var record = params.record || params;

    if (!record.jadwal_id) return { success: false, error: 'Jadwal wajib dipilih.' };
    if (!record.pegawai_id) return { success: false, error: 'Pegawai peserta wajib dipilih.' };

    // Cek jadwal exist
    var jadwal = findRecordById_(LOCAL_SHEETS.T_JADWAL_DIKLAT, record.jadwal_id);
    if (!jadwal) return { success: false, error: 'Jadwal tidak ditemukan di database.' };

    // Cek pegawai exist
    var simpeg = getSimpegLookup_();
    var pegawaiList = (simpeg && simpeg.data && simpeg.data.pegawai) || [];
    var pegawai = pegawaiList.find(function(p) {
      return normId_(p.id || p.pegawai_id) === normId_(record.pegawai_id);
    });
    if (!pegawai) {
      return { success: false, error: 'Pegawai tidak ditemukan di SIMPEG.' };
    }

    // Generate no_surat_tugas
    if (!record.no_surat_tugas) {
      var tahunSpt = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy');
      record.no_surat_tugas = '800/SPT/' + String(Date.now()).slice(-4) + '/' + tahunSpt;
    }

    // Whitelist status
    if (record.status_keikutsertaan) {
      var stUpper = String(record.status_keikutsertaan).toUpperCase();
      try {
        whitelist_(stUpper, PENUGASAN_STATUS_VALID_, 'status_keikutsertaan');
        record.status_keikutsertaan = stUpper;
      } catch (e) {
        return { success: false, error: e.message };
      }
    } else {
      record.status_keikutsertaan = 'DITUGASKAN';
    }

    var saved = saveRecord_(LOCAL_SHEETS.T_PENUGASAN_PESERTA, record, user);

    audit_(user, 'SAVE_PENUGASAN', 'T_PENUGASAN_PESERTA', saved.id, true,
      'Penugasan ' + saved.pegawai_id + ' -> jadwal ' + saved.jadwal_id);

    return { success: true, data: saved };
  } catch (err) {
    Logger.log('[savePenugasan_] ' + err.message);
    audit_(user, 'SAVE_PENUGASAN', 'T_PENUGASAN_PESERTA',
      (params.record && params.record.id) || '', false, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Bulk assign peserta ke jadwal.
 * Skip duplikat, collect error per item.
 */
function bulkAssignPeserta_(params, user) {
  try {
    var jadwalId = params.jadwal_id;
    var pegawaiIds = params.pegawai_ids || [];
    var tahunSpt = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy');
    var noSuratTugas = params.no_surat_tugas || ('800/SPT/' + String(Date.now()).slice(-4) + '/' + tahunSpt);
    var tglSuratTugas = params.tgl_surat_tugas || new Date().toISOString().slice(0, 10);

    if (!jadwalId || !Array.isArray(pegawaiIds) || pegawaiIds.length === 0) {
      return { success: false, error: 'Jadwal dan daftar pegawai wajib dipilih.' };
    }

    var jadwal = findRecordById_(LOCAL_SHEETS.T_JADWAL_DIKLAT, jadwalId);
    if (!jadwal) return { success: false, error: 'Jadwal tidak ditemukan.' };

    // Cek duplikat
    var existing = getSheetData_(LOCAL_SHEETS.T_PENUGASAN_PESERTA) || [];
    var existingKeys = {};
    existing.forEach(function(p) {
      if (p.deleted_at) return;
      existingKeys[normId_(p.jadwal_id) + '|' + normId_(p.pegawai_id)] = true;
    });

    var inserted = [];
    var skipped = [];
    var failed = [];

    pegawaiIds.forEach(function(pid) {
      var key = normId_(jadwalId) + '|' + normId_(pid);
      if (existingKeys[key]) {
        skipped.push({ pegawai_id: pid, reason: 'Sudah ditugaskan' });
        return;
      }
      try {
        var item = {
          jadwal_id: jadwalId,
          pegawai_id: pid,
          no_surat_tugas: noSuratTugas,
          tgl_surat_tugas: tglSuratTugas,
          pejabat_penandatangan: 'Kepala Satpol PP & Pemadam Kebakaran',
          status_keikutsertaan: 'DITUGASKAN',
          nilai_kelulusan: '',
          no_sertifikat_terbit: '',
          catatan: ''
        };
        var res = saveRecord_(LOCAL_SHEETS.T_PENUGASAN_PESERTA, item, user);
        inserted.push(res);
        existingKeys[key] = true;
      } catch (e) {
        failed.push({ pegawai_id: pid, error: e.message });
      }
    });

    audit_(user, 'BULK_ASSIGN_PESERTA', 'T_PENUGASAN_PESERTA', jadwalId, true,
      'Bulk: ' + inserted.length + ' sukses, ' + skipped.length + ' skip, ' + failed.length + ' gagal.');

    return {
      success: true,
      count: inserted.length,
      skipped_count: skipped.length,
      failed_count: failed.length,
      data: inserted,
      skipped: skipped,
      failed: failed,
      message: inserted.length + ' peserta ditugaskan, ' + skipped.length + ' skip duplikat, ' + failed.length + ' gagal.'
    };
  } catch (err) {
    Logger.log('[bulkAssignPeserta_] ' + err.message);
    audit_(user, 'BULK_ASSIGN_PESERTA', 'T_PENUGASAN_PESERTA', params.jadwal_id || '', false, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Hapus penugasan (soft delete).
 * POLICY: verifikator+ (dari ACTION_ROLE_MAP_).
 */
function deletePenugasan_(params, user) {
  try {
    var id = params.id;
    if (!id) return { success: false, error: 'ID penugasan wajib disertakan.' };

    var ok = softDeleteRecord_(LOCAL_SHEETS.T_PENUGASAN_PESERTA, id, user);

    audit_(user, 'DELETE_PENUGASAN', 'T_PENUGASAN_PESERTA', id, ok,
      ok ? 'Hapus penugasan: ' + id : 'Penugasan tidak ditemukan: ' + id);

    return {
      success: ok,
      message: ok ? 'Data penugasan peserta dihapus.' : 'Penugasan tidak ditemukan.'
    };
  } catch (err) {
    Logger.log('[deletePenugasan_] ' + err.message);
    return { success: false, error: err.message };
  }
}

// ==================== SELF-TEST ====================

function testDiklatSelfCheck() {
  Logger.log('=== 04_DiklatLogic.gs v4.2 self-check ===');

  // Test 1: list
  var jadwal = getJadwalList_({ tahun: 2026 });
  Logger.log((jadwal.success ? '✅' : '❌') + ' getJadwalList_: ' + (jadwal.data || []).length + ' jadwal');

  // Test 2: validasi tanggal
  var badJadwal = saveJadwal_({
    nama_kegiatan: 'Test',
    tgl_mulai: '2026-12-31',
    tgl_selesai: '2026-01-01'
  }, { role: 'user', email: 'test@test.com' });
  Logger.log((!badJadwal.success ? '✅' : '❌') + ' validasi tanggal: ' + (badJadwal.error || 'TIDAK DITOLAK'));

  // Test 3: whitelist status
  var badStatus = saveJadwal_({
    nama_kegiatan: 'Test',
    status_jadwal: 'STATUS_NGAWUR'
  }, { role: 'user', email: 'test@test.com' });
  Logger.log((!badStatus.success ? '✅' : '❌') + ' whitelist status: ' + (badStatus.error || 'TIDAK DITOLAK'));

  // Test 4: penugasan list
  var tgs = getPenugasanList_({});
  Logger.log((tgs.success ? '✅' : '❌') + ' getPenugasanList_: ' + (tgs.data || []).length + ' penugasan');

  // Test 5: gen kode unik
  var kode = genUniqueCode_('JDW-', LOCAL_SHEETS.T_JADWAL_DIKLAT, 'kode_jadwal', 3);
  Logger.log('✅ genUniqueCode_ contoh: ' + kode);

  // Test 6: bulk assign validasi
  var bulk = bulkAssignPeserta_({ jadwal_id: '', pegawai_ids: [] }, { role: 'admin' });
  Logger.log((!bulk.success ? '✅' : '❌') + ' bulkAssign validasi: ' + (bulk.error || 'TIDAK DITOLAK'));

  Logger.log('');
  Logger.log('=== Ownership test (manual, butuh user dummy) ===');
  Logger.log('Test ownership TIDAK otomatis karena butuh data jadwal milik orang lain.');
  Logger.log('Silakan test manual via aplikasi/web UI.');

  Logger.log('=== Selesai ===');
}
