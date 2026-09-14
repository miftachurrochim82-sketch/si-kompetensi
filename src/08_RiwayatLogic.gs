// ============================================================
// SI-KOMPETENSI - 08_RiwayatLogic.gs (v5.0.1 — CoreLib Integration)
// Portofolio Sertifikat Diklat & JP Pegawai (T_RIWAYAT_KOMPETENSI)
// ============================================================
// Changelog v5.0.1 (2026-09-13):
// - FIX: getRiwayatList_ dukung params.search (dari frontend
//   J_Api.loadKompetensi). Sebelumnya frontend kirim `search`
//   tapi backend abaikan → search bar di Portofolio tidak bekerja.
// - FIX: auto-filter only_mine untuk role 'user' (pegawai biasa).
//   Privacy: pegawai hanya lihat riwayat miliknya sendiri.
//   verifikator/admin/super tetap lihat semua.
//   Bisa di-override dengan params.only_mine=false eksplisit dari
//   role privileged; parameter pegawai_id juga menonaktifkan auto-filter.
// - Struktur & logika save/verifikasi/delete tidak diubah.
// Changelog v4.1 (initial):
// - File baru — dibangun dari nol sesuai kebutuhan dispatcher.
// ============================================================

// Status verifikasi valid
var STATUS_VERIFIKASI_VALID_ = ['menunggu', 'disetujui', 'ditolak', 'revisi'];

// Metode pelatihan valid
var METODE_PELATIHAN_VALID_ = ['Klasikal', 'Daring', 'Blended Learning', 'Non-Klasikal / E-Learning', 'Lainnya'];

// ==================== HELPER: SEARCH ====================

/**
 * v5.0.1: Cek apakah record match dengan query search.
 * Cari di kolom yang relevan (case-insensitive).
 * @param {Object} r - record
 * @param {string} q - query (sudah dinormalisasi lowercase)
 * @returns {boolean}
 */
function _riwayatMatchesSearch_(r, q) {
  if (!q) return true;
  var haystack = [
    r.nama_kegiatan,
    r.no_sertifikat,
    r.penyelenggara,
    r.pegawai_id,
    r.nip,
    r.nama_pegawai,
    r.rumpun
  ].map(function(x) { return normStr_(x); }).join(' ');
  return haystack.indexOf(q) !== -1;
}

// ==================== LIST ====================

/**
 * Ambil daftar riwayat kompetensi dengan filter.
 *
 * v5.0.1 params:
 *   pegawai_id, diklat_id, jadwal_id, status_verifikasi, rumpun,
 *   tahun, search, only_mine, limit
 *
 * @param {Object} params
 * @param {Object} user - untuk ownership & auto-privacy filter
 */
function getRiwayatList_(params, user) {
  try {
    params = params || {};
    var list = getSheetData_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI) || [];

    // Filter: pegawai_id
    if (params.pegawai_id) {
      var pid = normId_(params.pegawai_id);
      list = list.filter(function(r) { return normId_(r.pegawai_id) === pid; });
    }

    // Filter: diklat_id
    if (params.diklat_id) {
      var did = normId_(params.diklat_id);
      list = list.filter(function(r) { return normId_(r.diklat_id) === did; });
    }

    // Filter: jadwal_id
    if (params.jadwal_id) {
      var jid = normId_(params.jadwal_id);
      list = list.filter(function(r) { return normId_(r.jadwal_id) === jid; });
    }

    // Filter: status_verifikasi
    if (params.status_verifikasi) {
      var st = normStr_(params.status_verifikasi);
      list = list.filter(function(r) { return normStr_(r.status_verifikasi) === st; });
    }

    // Filter: rumpun
    if (params.rumpun) {
      var ru = normStr_(params.rumpun);
      list = list.filter(function(r) { return normStr_(r.rumpun) === ru; });
    }

    // Filter: tahun (dari tgl_terbit / tgl_selesai)
    if (params.tahun) {
      list = list.filter(function(r) {
        var d = parseDate_(r.tgl_terbit || r.tgl_selesai || r.tgl_mulai);
        return d && d.getFullYear() === Number(params.tahun);
      });
    }

    // v5.0.1 FIX: filter search (dari J_Api.loadKompetensi)
    if (params.search) {
      var q = normStr_(params.search);
      if (q) {
        list = list.filter(function(r) { return _riwayatMatchesSearch_(r, q); });
      }
    }

    // ============================================================
    // v5.0.1: Only-mine filter
    // 1. Eksplisit: params.only_mine = true → paksa filter ke user
    // 2. Auto-privacy: role 'user' tanpa params.pegawai_id → filter
    //    ke pegawai_id user sendiri
    // ============================================================
    var userRole = String((user && user.role) || '').toLowerCase();
    var isPrivileged = ['verifikator', 'admin', 'super'].indexOf(userRole) !== -1;
    var userPegawaiId = normId_((user && user.pegawai_id) || '');

    var applyMineFilter = false;
    if (params.only_mine === true) {
      applyMineFilter = true;
    } else if (!isPrivileged && userPegawaiId && !params.pegawai_id) {
      // Auto-privacy untuk pegawai biasa (kecuali sudah filter by pegawai_id tertentu)
      applyMineFilter = true;
    }

    if (applyMineFilter && userPegawaiId) {
      list = list.filter(function(r) { return normId_(r.pegawai_id) === userPegawaiId; });
    }

    // Clone supaya tidak mutasi cache
    list = list.map(function(r) { return Object.assign({}, r); });

    // Sort: tgl_terbit desc
    list.sort(function(a, b) {
      var da = parseDate_(a.tgl_terbit || a.tgl_selesai || a.created_at);
      var db = parseDate_(b.tgl_terbit || b.tgl_selesai || b.created_at);
      if (!da) return 1;
      if (!db) return -1;
      return db.getTime() - da.getTime();
    });

    // Enrich dengan pegawai
    list = enrichWithPegawai_(list);

    // Limit
    if (params.limit) {
      var lim = Number(params.limit);
      if (lim > 0) list = list.slice(0, lim);
    }

    return { success: true, data: list, total: list.length };
  } catch (err) {
    Logger.log('[getRiwayatList_] ' + err.message);
    return { success: false, error: err.message };
  }
}

// ==================== SAVE ====================

/**
 * Simpan riwayat kompetensi (input/edit).
 *
 * Ownership:
 * - user: boleh insert & edit MILIKNYA SENDIRI
 * - verifikator+: boleh edit semua
 *
 * Auto-fill:
 * - status_verifikasi: 'menunggu' untuk insert baru oleh user biasa
 * - status_verifikasi: 'disetujui' kalau yang save verifikator
 */
function saveRiwayat_(params, user) {
  try {
    var record = params.record || params;

    // ============ Validasi dasar ============
    if (!record.pegawai_id) {
      return { success: false, error: 'Pegawai wajib dipilih.' };
    }
    if (!record.nama_kegiatan) {
      return { success: false, error: 'Nama kegiatan diklat wajib diisi.' };
    }

    // Normalisasi ID
    record.pegawai_id = normalizeEntityId_(record.pegawai_id);
    if (record.diklat_id) record.diklat_id = normalizeEntityId_(record.diklat_id);
    if (record.jadwal_id) record.jadwal_id = normalizeEntityId_(record.jadwal_id);

    // ============ Validasi pegawai exist ============
    var simpeg = getSimpegLookup_();
    var pegawaiList = (simpeg && simpeg.data && simpeg.data.pegawai) || [];
    var pegawai = pegawaiList.find(function(p) {
      return normId_(p.id || p.pegawai_id) === normId_(record.pegawai_id);
    });
    if (!pegawai) {
      return { success: false, error: 'Pegawai tidak ditemukan di SIMPEG: ' + record.pegawai_id };
    }

    // ============ Validasi tanggal ============
    var tglMulai = parseDate_(record.tgl_mulai);
    var tglSelesai = parseDate_(record.tgl_selesai);
    if (tglMulai && tglSelesai && tglMulai > tglSelesai) {
      return { success: false, error: 'Tanggal mulai tidak boleh setelah tanggal selesai.' };
    }
    var tglTerbit = parseDate_(record.tgl_terbit);
    if (tglSelesai && tglTerbit && tglSelesai > tglTerbit) {
      return { success: false, error: 'Tanggal terbit sertifikat tidak boleh sebelum tanggal selesai diklat.' };
    }

    // ============ JP validasi ============
    var jp = Number(record.jumlah_jp) || 0;
    if (jp < 0) return { success: false, error: 'Jumlah JP tidak valid (negatif).' };
    if (jp > 2000) return { success: false, error: 'Jumlah JP tidak wajar (>2000).' };
    record.jumlah_jp = jp;

    // ============ Metode whitelist ============
    if (record.metode) {
      var mt = String(record.metode).trim();
      var matched = METODE_PELATIHAN_VALID_.find(function(m) {
        return normStr_(m) === normStr_(mt);
      });
      record.metode = matched || 'Lainnya';
    } else {
      record.metode = 'Lainnya';
    }

    // ============ Ownership + status verifikasi ============
    var isVerifikator = user && ['verifikator', 'admin', 'super'].indexOf(String(user.role).toLowerCase()) !== -1;
    var userEmail = (user && user.email) || '';
    var userPegawaiId = normId_((user && user.pegawai_id) || '');

    if (record.id) {
      // ---- UPDATE ----
      var existing = findRecordById_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI, record.id);
      if (!existing) return { success: false, error: 'Riwayat tidak ditemukan.' };

      var isOwner = normStr_(existing.created_by) === normStr_(userEmail);
      var isTargetPegawai = normId_(existing.pegawai_id) === userPegawaiId;

      if (!isVerifikator && !isOwner && !isTargetPegawai) {
        return { success: false, error: 'Anda hanya bisa mengedit riwayat milik sendiri.' };
      }

      // Non-verifikator: paksa status kembali ke 'menunggu' saat edit data penting
      if (!isVerifikator) {
        var oldStatus = normStr_(existing.status_verifikasi);
        if (oldStatus === 'disetujui' || oldStatus === 'ditolak') {
          var substantif = ['nama_kegiatan', 'tgl_terbit', 'tgl_mulai', 'tgl_selesai', 'jumlah_jp', 'no_sertifikat', 'penyelenggara'].some(function(f) {
            return record[f] !== undefined && String(record[f]) !== String(existing[f]);
          });
          if (substantif) {
            record.status_verifikasi = 'menunggu';
          }
        }
      }
    } else {
      // ---- INSERT baru ----
      if (!isVerifikator) {
        record.status_verifikasi = 'menunggu';
      } else {
        record.status_verifikasi = record.status_verifikasi || 'disetujui';
      }
      record.verifikator_id = '';
      record.tanggal_verifikasi = '';
      record.catatan_verifikator = record.catatan_verifikator || '';
    }

    // Status whitelist
    if (record.status_verifikasi) {
      var sv = String(record.status_verifikasi).toLowerCase();
      try {
        whitelist_(sv, STATUS_VERIFIKASI_VALID_, 'status_verifikasi');
        record.status_verifikasi = sv;
      } catch (e) {
        return { success: false, error: e.message };
      }
    }

    // ============ Cek duplikat ============
    if (!record.id) {
      var allRiwayat = getSheetData_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI) || [];
      var dup = allRiwayat.find(function(r) {
        if (r.deleted_at) return false;
        if (normId_(r.pegawai_id) !== normId_(record.pegawai_id)) return false;
        // No sertifikat sama
        if (record.no_sertifikat && normStr_(r.no_sertifikat) === normStr_(record.no_sertifikat)) return true;
        // Diklat + tgl sama
        if (record.diklat_id && r.diklat_id &&
            normId_(r.diklat_id) === normId_(record.diklat_id) &&
            record.tgl_terbit && r.tgl_terbit &&
            String(r.tgl_terbit).slice(0, 10) === String(record.tgl_terbit).slice(0, 10)) return true;
        return false;
      });
      if (dup) {
        return {
          success: false,
          error: 'Riwayat duplikat terdeteksi (ID: ' + dup.id + '). Cek no_sertifikat / diklat + tanggal.'
        };
      }
    }

    // ============ Auto-fill dari katalog ============
    if (record.diklat_id && (!record.rumpun || !record.penyelenggara)) {
      var katalog = getSheetData_(LOCAL_SHEETS.M_KATALOG_DIKLAT) || [];
      var d = katalog.find(function(x) { return normId_(x.id) === normId_(record.diklat_id); });
      if (d) {
        if (!record.rumpun) record.rumpun = d.rumpun || 'Lainnya';
        if (!record.penyelenggara) record.penyelenggara = d.penyelenggara_default || '';
      }
    }

    var saved = saveRecord_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI, record, user);

    audit_(user, record.id ? 'UPDATE_RIWAYAT' : 'CREATE_RIWAYAT',
      'T_RIWAYAT_KOMPETENSI', saved.id, true,
      'Riwayat: ' + saved.nama_kegiatan + ' (' + saved.jumlah_jp + ' JP)');

    return { success: true, data: saved };
  } catch (err) {
    Logger.log('[saveRiwayat_] ' + err.message);
    audit_(user, 'SAVE_RIWAYAT', 'T_RIWAYAT_KOMPETENSI',
      (params.record && params.record.id) || '', false, err.message);
    return { success: false, error: err.message };
  }
}

// ==================== VERIFIKASI ====================

/**
 * Verifikasi riwayat — approve / reject / revisi.
 * Hanya verifikator+.
 *
 * params: { id, status_verifikasi, catatan_verifikator? }
 */
function verifikasiRiwayat_(params, user) {
  try {
    // Role check (double-check)
    try {
      requireRole_(user, 'verifikator');
    } catch (e) {
      audit_(user, 'VERIFIKASI_RIWAYAT', 'T_RIWAYAT_KOMPETENSI', params.id || '', false, 'Akses ditolak: ' + e.message);
      return { success: false, error: e.message };
    }

    var id = params.id;
    if (!id) return { success: false, error: 'ID riwayat wajib disertakan.' };

    // Status wajib — jangan default approve
    var status = params.status_verifikasi;
    if (!status) {
      return { success: false, error: 'Status verifikasi wajib disertakan (disetujui/ditolak/revisi).' };
    }

    var st = String(status).toLowerCase().trim();
    // Verifikasi hanya boleh: disetujui, ditolak, revisi
    var allowedForVerif = ['disetujui', 'ditolak', 'revisi'];
    if (allowedForVerif.indexOf(st) === -1) {
      return { success: false, error: 'Status verifikasi harus salah satu: ' + allowedForVerif.join(', ') };
    }

    var rec = findRecordById_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI, id);
    if (!rec) return { success: false, error: 'Riwayat tidak ditemukan.' };

    // Clone supaya tidak mutasi cache
    rec = JSON.parse(JSON.stringify(rec));

    rec.status_verifikasi = st;
    rec.catatan_verifikator = params.catatan_verifikator || rec.catatan_verifikator || '';
    rec.verifikator_id = (user && user.email) || '';
    rec.tanggal_verifikasi = new Date().toISOString();

    var saved = saveRecord_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI, rec, user);

    audit_(user, 'VERIFIKASI_RIWAYAT', 'T_RIWAYAT_KOMPETENSI', id, true,
      'Verifikasi: ' + st);

    return { success: true, data: saved };
  } catch (err) {
    Logger.log('[verifikasiRiwayat_] ' + err.message);
    return { success: false, error: err.message };
  }
}

// ==================== DELETE ====================

/**
 * Hapus riwayat (soft delete).
 * Ownership: verifikator+ atau pemilik.
 */
function deleteRiwayat_(params, user) {
  try {
    var id = params.id;
    if (!id) return { success: false, error: 'ID riwayat wajib disertakan.' };

    var existing = findRecordById_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI, id);
    if (!existing) {
      audit_(user, 'DELETE_RIWAYAT', 'T_RIWAYAT_KOMPETENSI', id, false, 'Tidak ditemukan');
      return { success: false, error: 'Riwayat tidak ditemukan.' };
    }

    var isVerifikator = user && ['verifikator', 'admin', 'super'].indexOf(String(user.role).toLowerCase()) !== -1;
    var userEmail = (user && user.email) || '';
    var userPegawaiId = normId_((user && user.pegawai_id) || '');

    if (!isVerifikator) {
      var isOwner = normStr_(existing.created_by) === normStr_(userEmail);
      var isTargetPegawai = normId_(existing.pegawai_id) === userPegawaiId;
      if (!isOwner && !isTargetPegawai) {
        return { success: false, error: 'Anda hanya bisa menghapus riwayat milik sendiri.' };
      }
      // Pegawai biasa: tidak boleh hapus riwayat yang sudah disetujui
      if (normStr_(existing.status_verifikasi) === 'disetujui') {
        return { success: false, error: 'Riwayat yang sudah disetujui tidak bisa dihapus. Hubungi verifikator.' };
      }
    }

    var ok = softDeleteRecord_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI, id, user);

    audit_(user, 'DELETE_RIWAYAT', 'T_RIWAYAT_KOMPETENSI', id, ok,
      ok ? 'Hapus riwayat: ' + id : 'Riwayat tidak ditemukan: ' + id);

    return {
      success: ok,
      message: ok ? 'Riwayat kompetensi berhasil dihapus.' : 'Riwayat tidak ditemukan.'
    };
  } catch (err) {
    Logger.log('[deleteRiwayat_] ' + err.message);
    return { success: false, error: err.message };
  }
}

// ==================== HELPER: JP SUMMARY ====================

/**
 * Ringkasan JP per pegawai (untuk dashboard & analytics).
 * params: { tahun?, pegawai_id?, unit_id? }
 */
function getRiwayatJpSummary_(params) {
  try {
    params = params || {};
    var tahun = Number(params.tahun) || new Date().getFullYear();
    var list = getSheetData_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI) || [];

    // Filter: hanya disetujui + tahun
    var filtered = list.filter(function(r) {
      if (normStr_(r.status_verifikasi) !== 'disetujui') return false;
      var d = parseDate_(r.tgl_terbit || r.tgl_selesai || r.tgl_mulai);
      return d && d.getFullYear() === tahun;
    });

    if (params.pegawai_id) {
      var pid = normId_(params.pegawai_id);
      filtered = filtered.filter(function(r) { return normId_(r.pegawai_id) === pid; });
    }

    // Group by pegawai
    var byPegawai = {};
    filtered.forEach(function(r) {
      var pid = normId_(r.pegawai_id);
      if (!byPegawai[pid]) byPegawai[pid] = { pegawai_id: pid, total_jp: 0, count: 0 };
      byPegawai[pid].total_jp += Number(r.jumlah_jp) || 0;
      byPegawai[pid].count++;
    });

    // Enrich
    var result = Object.keys(byPegawai).map(function(pid) { return byPegawai[pid]; });
    result = enrichWithPegawai_(result);

    return { success: true, data: result, tahun: tahun };
  } catch (err) {
    Logger.log('[getRiwayatJpSummary_] ' + err.message);
    return { success: false, error: err.message };
  }
}

// ==================== SELF-TEST ====================

function testRiwayatSelfCheck() {
  Logger.log('=== 08_RiwayatLogic.gs v5.0.1 self-check ===');

  // Test 1: list
  var list = getRiwayatList_({});
  Logger.log((list.success ? '✅' : '❌') + ' getRiwayatList_: ' + (list.data || []).length + ' riwayat');

  // Test 2: filter status
  var listApprove = getRiwayatList_({ status_verifikasi: 'disetujui' });
  Logger.log((listApprove.success ? '✅' : '❌') + ' filter disetujui: ' + (listApprove.data || []).length);

  // Test 3: save tanpa pegawai
  var badSave = saveRiwayat_({}, { role: 'user', email: 'test@test.com' });
  Logger.log((!badSave.success ? '✅' : '❌') + ' save tanpa pegawai: ' + (badSave.error || 'TIDAK DITOLAK'));

  // Test 4: save tanpa nama kegiatan
  var badSave2 = saveRiwayat_({ pegawai_id: 'PEG-0001' }, { role: 'user', email: 'test@test.com' });
  Logger.log((!badSave2.success ? '✅' : '❌') + ' save tanpa nama: ' + (badSave2.error || 'TIDAK DITOLAK'));

  // Test 5: validasi tanggal
  var badTgl = saveRiwayat_({
    pegawai_id: 'PEG-0001',
    nama_kegiatan: 'Test',
    tgl_mulai: '2026-12-31',
    tgl_selesai: '2026-01-01'
  }, { role: 'user', email: 'test@test.com' });
  Logger.log((!badTgl.success ? '✅' : '❌') + ' validasi tanggal: ' + (badTgl.error || 'TIDAK DITOLAK'));

  // Test 6: verifikasi tanpa status
  var badVerif = verifikasiRiwayat_({ id: 'RWY-001' }, { role: 'verifikator', email: 'test@test.com' });
  Logger.log((!badVerif.success ? '✅' : '❌') + ' verifikasi tanpa status: ' + (badVerif.error || 'TIDAK DITOLAK'));

  // Test 7: verifikasi status ngawur
  var badVerif2 = verifikasiRiwayat_({ id: 'RWY-001', status_verifikasi: 'NGAWUR' }, { role: 'verifikator', email: 'test@test.com' });
  Logger.log((!badVerif2.success ? '✅' : '❌') + ' verifikasi status invalid: ' + (badVerif2.error || 'TIDAK DITOLAK'));

  // Test 8: JP summary
  var summary = getRiwayatJpSummary_({ tahun: 2026 });
  Logger.log((summary.success ? '✅' : '❌') + ' JP summary 2026: ' + (summary.data || []).length + ' pegawai');

  // ============================================================
  // v5.0.1: Test search + auto-privacy
  // ============================================================
  Logger.log('');
  Logger.log('--- v5.0.1: Search & Auto-privacy ---');

  // Test 9: search "diklat"
  var searchRes = getRiwayatList_({ search: 'diklat' });
  Logger.log((searchRes.success ? '✅' : '❌') + ' search "diklat": ' +
    (searchRes.data || []).length + ' hasil');

  // Test 10: search tanpa match
  var noMatch = getRiwayatList_({ search: 'XYZABC123NGAWUR' });
  Logger.log((noMatch.success && (noMatch.data || []).length === 0 ? '✅' : '❌') +
    ' search tidak match → 0 hasil');

  // Test 11: auto-privacy untuk role 'user'
  var userVerif = { role: 'user', email: 'pegawai@test.com', pegawai_id: 'PEG-0001' };
  var listUser = getRiwayatList_({}, userVerif);
  var allOwned = (listUser.data || []).every(function(r) {
    return normId_(r.pegawai_id) === 'PEG-0001';
  });
  Logger.log((allOwned ? '✅' : '❌') + ' auto-privacy user: ' +
    (listUser.data || []).length + ' item (semua milik PEG-0001: ' + allOwned + ')');

  // Test 12: verifikator lihat semua
  var verifUser = { role: 'verifikator', email: 'verif@test.com', pegawai_id: 'PEG-0002' };
  var listVerif = getRiwayatList_({}, verifUser);
  Logger.log((listVerif.success ? '✅' : '❌') + ' verifikator lihat semua: ' +
    (listVerif.data || []).length + ' item');

  // Test 13: verifikator dengan search
  var verifSearch = getRiwayatList_({ search: 'PEG-0001' }, verifUser);
  Logger.log((verifSearch.success ? '✅' : '❌') + ' verifikator + search: ' +
    (verifSearch.data || []).length + ' hasil');

  Logger.log('=== Selesai ===');
}

function cekStatusAkhir() {
  Logger.log('=== STATUS SHEET SI-KOMPETENSI ===');
  var sheets = [
    {name: LOCAL_SHEETS.M_REFERENSI, target: 23},
    {name: LOCAL_SHEETS.M_KATALOG_DIKLAT, target: 20},
    {name: LOCAL_SHEETS.M_STANDAR_KOMPETENSI, target: 20},
    {name: LOCAL_SHEETS.T_JADWAL_DIKLAT, target: 20},
    {name: LOCAL_SHEETS.T_PENUGASAN_PESERTA, target: 20},
    {name: LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI, target: 20},
    {name: LOCAL_SHEETS.T_KUALIFIKASI_KHUSUS, target: 20},
    {name: LOCAL_SHEETS.T_USULAN_DIKLAT, target: 20}
  ];
  var allOk = true;
  sheets.forEach(function(s) {
    var data = getSheetData_(s.name) || [];
    var status = data.length === s.target ? '✅' : (data.length === 0 ? '❌' : '⚠️');
    Logger.log(status + ' ' + s.name + ': ' + data.length + ' (target ' + s.target + ')');
    if (data.length !== s.target) allOk = false;
  });
  Logger.log('');
  Logger.log(allOk ? '🎉 SEMUA SHEET LENGKAP — siap lanjut File 11' : '⚠️ Ada sheet belum lengkap');
}
