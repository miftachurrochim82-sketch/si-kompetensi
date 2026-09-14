// ============================================================
// SI-KOMPETENSI - 07_RencanaLogic.gs (v5.0.0 — CoreLib Integration)
// Rencana Diklat Tahunan & Realisasi (T_USULAN_DIKLAT)
// ============================================================
// Changelog v5.0 (2026-09-13):
// - FIX-R17: STATUS_RENCANA_VALID_ BENAR-BENAR dipakai untuk validasi.
//   Sebelumnya dideklarasi tapi tidak dipakai → status ngawur lolos.
//   Sekarang: whitelist + soft-map format lama + REJECT jika tidak valid.
// Changelog v4.1:
// - FIX-R1: Audit log SUCCESS saat gagal -> pakai audit_ dengan status benar.
// - FIX-R2: Matching realisasi -> prioritas diklat_id (bukan fuzzy name).
//           Fuzzy fallback diperketat (min 10 char, both ways).
// - FIX-R3: reviewUsulan_ wajib status (jangan default 'disetujui').
// - FIX-R4: tgl_penetapan hanya diisi saat review disetujui.
// - FIX-R5: Whitelist status_rencana & status_usulan.
// - FIX-R6: Cek duplikat (pegawai_id, diklat_id, tahun_anggaran).
// - FIX-R7: getUsulanList_ filter tahun/status/unit + paginasi.
// - FIX-R8: Clone objek sebelum mutasi (cegah korupsi cache).
// - FIX-R9: target_jp default ikut PPPK (24) vs PNS (20).
// - FIX-R10: Validasi pegawai_id exist di SIMPEG.
// - FIX-R11: estimasi_biaya cast ke Number.
// - FIX-R12: realisasi_jp cast ke Number.
// - FIX-R13: Tanggal review & reviewer_id saat review.
// - FIX-R14: Role check (via ACTION_ROLE_MAP_ di AppLogic).
// - FIX-R15: Normalisasi ID.
// - FIX-R16: Catat lama review (history) — optional field.
// ============================================================

// Status rencana valid
var STATUS_RENCANA_VALID_ = [
  'Direncanakan', 'Diajukan', 'Disetujui', 'Disetujui_Kasat',
  'Ditolak', 'Terealisasi', 'Dibatalkan'
];

// Status usulan valid (untuk review)
var STATUS_USULAN_VALID_ = [
  'diajukan', 'disetujui_kasat', 'ditolak_kasat', 'revisi'
];

// Periode triwulan valid
var PERIODE_TRIWULAN_VALID_ = [
  'TW I (Jan - Mar)',
  'TW II (Apr - Jun)',
  'TW III (Jul - Sep)',
  'TW IV (Okt - Des)'
];

// ==================== LIST ====================

/**
 * Ambil daftar usulan/rencana diklat.
 * params: { tahun?, status?, unit_id?, pegawai_id?, diklat_id?, limit? }
 */
function getUsulanList_(params, user) {
  try {
    params = params || {};
    var list = getSheetData_(LOCAL_SHEETS.T_USULAN_DIKLAT) || [];
    var riwayatList = getSheetData_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI) || [];

    // FIX-R7: filter
    if (params.tahun) {
      list = list.filter(function(u) {
        return String(u.tahun_anggaran) === String(params.tahun) ||
               String(u.tahun_anggaran_target) === String(params.tahun);
      });
    }
    if (params.status) {
      var st = normStr_(params.status);
      list = list.filter(function(u) {
        return normStr_(u.status_usulan) === st || normStr_(u.status_rencana) === st;
      });
    }
    if (params.unit_id) {
      list = list.filter(function(u) { return normId_(u.unit_id) === normId_(params.unit_id); });
    }
    if (params.pegawai_id) {
      list = list.filter(function(u) { return normId_(u.pegawai_id) === normId_(params.pegawai_id); });
    }
    if (params.diklat_id) {
      list = list.filter(function(u) { return normId_(u.diklat_id) === normId_(params.diklat_id); });
    }

    var enriched = enrichWithPegawai_(list);

    // ============================================================
    // FIX-R2: build index riwayat — prioritas diklat_id + pegawai_id
    // ============================================================
    var riwayatIndex = {};
    riwayatList.forEach(function(r) {
      if (normStr_(r.status_verifikasi) === 'ditolak') return;
      var pid = normId_(r.pegawai_id);
      var did = normId_(r.diklat_id);
      if (pid && did) {
        riwayatIndex[pid + '|' + did] = r;
      }
    });

    // ============================================================
    // FIX-R8: clone objek sebelum mutasi
    // ============================================================
    var result = enriched.map(function(u) {
      var clone = Object.assign({}, u);

      var pegId = normId_(clone.pegawai_id);
      var did = normId_(clone.diklat_id);
      var progName = normStr_(clone.nama_program_diklat || clone.nama_diklat_usulan || '');

      // Prioritas 1: match by (pegawai_id + diklat_id)
      var matched = (pegId && did) ? riwayatIndex[pegId + '|' + did] : null;

      // FIX-R2: fallback fuzzy hanya kalau progName >= 10 char & match both ways
      if (!matched && progName.length >= 10) {
        for (var i = 0; i < riwayatList.length; i++) {
          var r = riwayatList[i];
          if (normStr_(r.status_verifikasi) === 'ditolak') continue;
          var rPeg = normId_(r.pegawai_id);
          if (pegId && rPeg !== pegId) continue;
          var rProg = normStr_(r.nama_kegiatan);
          if (rProg.length < 10) continue;
          if (rProg.indexOf(progName) !== -1 || progName.indexOf(rProg) !== -1) {
            matched = r;
            break;
          }
        }
      }

      if (matched) {
        clone.is_terealisasi = true;
        clone.realisasi_sertifikat_id = matched.id;
        clone.realisasi_tgl = matched.tgl_terbit || matched.tgl_selesai || '';
        // FIX-R12: cast ke Number
        clone.realisasi_jp = Number(matched.jumlah_jp) || 0;
        if (!clone.status_rencana ||
            normStr_(clone.status_rencana) === 'direncanakan' ||
            normStr_(clone.status_rencana) === 'diajukan') {
          clone.status_rencana = 'Terealisasi';
        }
      } else {
        clone.is_terealisasi = normStr_(clone.status_rencana) === 'terealisasi';
        clone.realisasi_jp = 0;
      }

      // Alias bidirectional
      if (!clone.nama_program_diklat && clone.nama_diklat_usulan) clone.nama_program_diklat = clone.nama_diklat_usulan;
      if (!clone.nama_diklat_usulan && clone.nama_program_diklat) clone.nama_diklat_usulan = clone.nama_program_diklat;
      if (!clone.tahun_anggaran && clone.tahun_anggaran_target) clone.tahun_anggaran = clone.tahun_anggaran_target;
      if (!clone.tahun_anggaran_target && clone.tahun_anggaran) clone.tahun_anggaran_target = clone.tahun_anggaran;
      if (!clone.alasan_justifikasi && clone.alasan_usulan) clone.alasan_justifikasi = clone.alasan_usulan;
      if (!clone.penyelenggara && clone.target_penyelenggara) clone.penyelenggara = clone.target_penyelenggara;

      return clone;
    });

    // Sort: terbaru dulu
    result.sort(function(a, b) {
      var ta = String(a.tahun_anggaran || a.tahun_anggaran_target || '');
      var tb = String(b.tahun_anggaran || b.tahun_anggaran_target || '');
      return tb.localeCompare(ta);
    });

    // Paginasi opsional
    if (params.limit) {
      var lim = Number(params.limit);
      if (lim > 0) result = result.slice(0, lim);
    }

    return { success: true, data: result, total: result.length };
  } catch (err) {
    Logger.log('[getUsulanList_] ' + err.message);
    return { success: false, error: err.message };
  }
}

// ==================== SAVE ====================

/**
 * Simpan usulan/rencana diklat.
 * FIX-R4: tgl_penetapan TIDAK auto-set — hanya diisi saat review.
 * FIX-R5: whitelist status.
 * FIX-R6: cek duplikat (pegawai_id, diklat_id, tahun_anggaran).
 * FIX-R9: target_jp default ikut PPPK vs PNS.
 * FIX-R10: validasi pegawai_id exist.
 * FIX-R11: estimasi_biaya cast Number.
 * FIX-R15: normalisasi ID.
 * FIX-R17 (v5.0): whitelist status_rencana BENAR-BENAR dipakai.
 */
function saveUsulan_(params, user) {
  try {
    var record = params.record || params;

    var prog = record.nama_program_diklat || record.nama_diklat_usulan;
    if (!prog) return { success: false, error: 'Nama program pelatihan terencana wajib diisi.' };

    // Normalisasi bidirectional nama
    record.nama_program_diklat = prog;
    record.nama_diklat_usulan = prog;

    // Normalisasi ID
    if (record.pegawai_id) record.pegawai_id = normalizeEntityId_(record.pegawai_id);
    if (record.unit_id) record.unit_id = normalizeEntityId_(record.unit_id);
    if (record.jabatan_id) record.jabatan_id = normalizeEntityId_(record.jabatan_id);
    if (record.diklat_id) record.diklat_id = normalizeEntityId_(record.diklat_id);

    // Tahun anggaran
    if (!record.tahun_anggaran) record.tahun_anggaran = record.tahun_anggaran_target || new Date().getFullYear();
    if (!record.tahun_anggaran_target) record.tahun_anggaran_target = record.tahun_anggaran;

    // FIX-R5: whitelist periode triwulan
    if (!record.periode_triwulan) {
      record.periode_triwulan = 'TW I (Jan - Mar)';
    } else {
      var pt = String(record.periode_triwulan).trim();
      if (PERIODE_TRIWULAN_VALID_.indexOf(pt) === -1) {
        // Coba map dari format lain
        if (/^TW\s*I\b/i.test(pt) || pt.indexOf('Jan') !== -1 && pt.indexOf('Mar') !== -1) record.periode_triwulan = 'TW I (Jan - Mar)';
        else if (/^TW\s*II\b/i.test(pt) || pt.indexOf('Apr') !== -1 && pt.indexOf('Jun') !== -1) record.periode_triwulan = 'TW II (Apr - Jun)';
        else if (/^TW\s*III\b/i.test(pt) || pt.indexOf('Jul') !== -1 && pt.indexOf('Sep') !== -1) record.periode_triwulan = 'TW III (Jul - Sep)';
        else if (/^TW\s*IV\b/i.test(pt) || pt.indexOf('Okt') !== -1 && pt.indexOf('Des') !== -1) record.periode_triwulan = 'TW IV (Okt - Des)';
        else record.periode_triwulan = 'TW I (Jan - Mar)';
      }
    }

    // ============================================================
    // FIX-R17 (v5.0): whitelist status_rencana BENAR-BENAR dipakai.
    // Sebelumnya hanya beberapa nilai yang di-map → status ngawur lolos.
    // ============================================================
    if (!record.status_rencana) {
      record.status_rencana = record.status_usulan || 'Direncanakan';
    }

    // Coba whitelist langsung (case-insensitive, return nilai kanonik)
    var statusMapped = null;
    try {
      statusMapped = whitelist_(record.status_rencana, STATUS_RENCANA_VALID_, 'status_rencana');
    } catch (e) {
      // Fallback: soft-map dari format lama (sebelum whitelist diperketat)
      var sr = String(record.status_rencana).trim().toLowerCase();
      if (sr === 'direncanakan') statusMapped = 'Direncanakan';
      else if (sr === 'diajukan') statusMapped = 'Diajukan';
      else if (sr === 'disetujui') statusMapped = 'Disetujui';
      else if (sr === 'disetujui_kasat') statusMapped = 'Disetujui_Kasat';
      else if (sr === 'ditolak' || sr === 'ditolak_kasat') statusMapped = 'Ditolak';
      else if (sr === 'terealisasi') statusMapped = 'Terealisasi';
      else if (sr === 'dibatalkan') statusMapped = 'Dibatalkan';
    }

    if (!statusMapped) {
      return {
        success: false,
        error: 'Status rencana "' + record.status_rencana + '" tidak valid. Pilihan: ' + STATUS_RENCANA_VALID_.join(', ')
      };
    }
    record.status_rencana = statusMapped;

    // status_usulan default
    if (!record.status_usulan) {
      record.status_usulan = normStr_(record.status_rencana) === 'diajukan' ? 'diajukan' : 'diajukan';
    }

    // FIX-R9: target_jp default ikut PPPK/PNS
    if (!record.target_jp) {
      var targetDefault = 20;
      if (record.pegawai_id) {
        try {
          var simpeg = getSimpegLookup_();
          var pegawaiList = (simpeg && simpeg.data && simpeg.data.pegawai) || [];
          var peg = pegawaiList.find(function(p) {
            return normId_(p.id || p.pegawai_id) === normId_(record.pegawai_id);
          });
          if (peg && normStr_(peg.status_pegawai).indexOf('pppk') !== -1) targetDefault = 24;
        } catch (e) {
          Logger.log('[WARN] Gagal cek PPPK: ' + e.message);
        }
      }
      record.target_jp = Number(record.jumlah_jp) || targetDefault;
    } else {
      record.target_jp = Number(record.target_jp) || 20;
    }

    // FIX-R11: estimasi_biaya cast Number
    if (record.estimasi_biaya !== undefined && record.estimasi_biaya !== '') {
      var est = Number(record.estimasi_biaya);
      record.estimasi_biaya = isNaN(est) ? 0 : est;
    } else {
      record.estimasi_biaya = 0;
    }

    // Sumber dana default
    if (!record.sumber_dana) record.sumber_dana = 'APBD Kabupaten Trenggalek';

    // FIX-R10: validasi pegawai_id exist
    if (record.pegawai_id) {
      var simpeg2 = getSimpegLookup_();
      var pegawaiList2 = (simpeg2 && simpeg2.data && simpeg2.data.pegawai) || [];
      var pegawaiExist = pegawaiList2.find(function(p) {
        return normId_(p.id || p.pegawai_id) === normId_(record.pegawai_id);
      });
      if (!pegawaiExist) {
        return { success: false, error: 'Pegawai tidak ditemukan di SIMPEG: ' + record.pegawai_id };
      }
    }

    // FIX-R6: cek duplikat (pegawai_id, diklat_id, tahun_anggaran)
    if (!record.id && record.pegawai_id && record.diklat_id) {
      var existing = getSheetData_(LOCAL_SHEETS.T_USULAN_DIKLAT) || [];
      var duplicate = existing.find(function(u) {
        if (u.deleted_at) return false;
        return normId_(u.pegawai_id) === normId_(record.pegawai_id) &&
               normId_(u.diklat_id) === normId_(record.diklat_id) &&
               String(u.tahun_anggaran) === String(record.tahun_anggaran);
      });
      if (duplicate) {
        return {
          success: false,
          error: 'Usulan untuk pegawai + diklat + tahun yang sama sudah ada (ID: ' + duplicate.id + ').'
        };
      }
    }

    // FIX-R4: JANGAN auto-set tgl_penetapan — hanya di review

    // Default tanggal pengajuan
    if (!record.tgl_pengajuan && !record.id) {
      record.tgl_pengajuan = new Date().toISOString().slice(0, 10);
    }

    var saved = saveRecord_(LOCAL_SHEETS.T_USULAN_DIKLAT, record, user);

    audit_(user, record.id ? 'UPDATE_USULAN' : 'CREATE_USULAN',
      'T_USULAN_DIKLAT', saved.id, true, 'Usulan: ' + prog);

    return { success: true, data: saved };
  } catch (err) {
    Logger.log('[saveUsulan_] ' + err.message);
    audit_(user, 'SAVE_USULAN', 'T_USULAN_DIKLAT',
      (params.record && params.record.id) || '', false, err.message);
    return { success: false, error: err.message };
  }
}

// ==================== REVIEW ====================

/**
 * Review usulan — ubah status usulan.
 * FIX-R3: status WAJIB dari params (jangan default approve).
 * FIX-R4: tgl_penetapan diisi saat disetujui.
 * FIX-R13: catat tanggal review + reviewer.
 */
function reviewUsulan_(params, user) {
  try {
    var id = params.id;
    if (!id) return { success: false, error: 'ID usulan wajib disertakan.' };

    // FIX-R3: status wajib, jangan default approve
    var status = params.status_usulan;
    if (!status) {
      return { success: false, error: 'Status review wajib disertakan (diajukan/disetujui_kasat/ditolak_kasat/revisi).' };
    }

    // FIX-R5: whitelist
    var st = String(status).toLowerCase().trim();
    if (STATUS_USULAN_VALID_.indexOf(st) === -1) {
      return { success: false, error: 'Status "' + status + '" tidak valid. Harus salah satu: ' + STATUS_USULAN_VALID_.join(', ') };
    }

    var rec = findRecordById_(LOCAL_SHEETS.T_USULAN_DIKLAT, id);
    if (!rec) return { success: false, error: 'Data usulan diklat tidak ditemukan.' };

    // FIX-R8: clone supaya tidak mutasi cache
    rec = JSON.parse(JSON.stringify(rec));

    // FIX-R4: catat lama (untuk history)
    var oldStatus = rec.status_usulan || '';
    var historyNote = '[Dari: ' + oldStatus + ' -> ' + st + ']';

    rec.status_usulan = st;
    rec.catatan_pimpinan = params.catatan_pimpinan || rec.catatan_pimpinan || '';

    // Sync status_rencana dengan status_usulan
    if (st === 'disetujui_kasat') {
      rec.status_rencana = 'Disetujui';
      // FIX-R4: tgl_penetapan diisi HANYA saat disetujui
      if (!rec.tgl_penetapan) {
        rec.tgl_penetapan = new Date().toISOString().slice(0, 10);
      }
    } else if (st === 'ditolak_kasat') {
      rec.status_rencana = 'Ditolak';
    } else if (st === 'revisi') {
      rec.status_rencana = 'Direncanakan';
    } else if (st === 'diajukan') {
      rec.status_rencana = 'Diajukan';
    }

    // FIX-R13: catat reviewer
    rec.reviewer_id = (user && user.email) || '';
    rec.tgl_review = new Date().toISOString();

    // Append ke catatan_evaluasi (history)
    var evNote = (rec.catatan_evaluasi || '') + '\n' + historyNote + ' oleh ' + ((user && user.email) || 'unknown') + ' pada ' + rec.tgl_review;
    rec.catatan_evaluasi = evNote.trim();

    var saved = saveRecord_(LOCAL_SHEETS.T_USULAN_DIKLAT, rec, user);

    audit_(user, 'REVIEW_USULAN', 'T_USULAN_DIKLAT', id, true, 'Review status: ' + oldStatus + ' -> ' + st);

    return { success: true, data: saved };
  } catch (err) {
    Logger.log('[reviewUsulan_] ' + err.message);
    audit_(user, 'REVIEW_USULAN', 'T_USULAN_DIKLAT', params.id || '', false, err.message);
    return { success: false, error: err.message };
  }
}

// ==================== DELETE ====================

/**
 * Hapus usulan.
 * FIX-R1: audit status benar.
 */
function deleteUsulan_(params, user) {
  try {
    var id = params.id;
    if (!id) return { success: false, error: 'ID usulan wajib disertakan.' };

    // Cek status — usulan yang sudah Terealisasi tidak boleh dihapus
    var rec = findRecordById_(LOCAL_SHEETS.T_USULAN_DIKLAT, id);
    if (rec && normStr_(rec.status_rencana) === 'terealisasi') {
      var msg = 'Usulan yang sudah Terealisasi tidak bisa dihapus (data historis).';
      audit_(user, 'DELETE_USULAN', 'T_USULAN_DIKLAT', id, false, msg);
      return { success: false, error: msg };
    }

    var ok = softDeleteRecord_(LOCAL_SHEETS.T_USULAN_DIKLAT, id, user);

    // FIX-R1: audit status benar
    audit_(user, 'DELETE_USULAN', 'T_USULAN_DIKLAT', id, ok,
      ok ? 'Hapus usulan: ' + id : 'Usulan tidak ditemukan: ' + id);

    return {
      success: ok,
      message: ok ? 'Usulan diklat berhasil dihapus.' : 'Usulan tidak ditemukan.'
    };
  } catch (err) {
    Logger.log('[deleteUsulan_] ' + err.message);
    return { success: false, error: err.message };
  }
}

// ==================== SELF-TEST ====================

function testRencanaSelfCheck() {
  Logger.log('=== 07_RencanaLogic.gs v5.0.0 self-check ===');

  // Test 1: list
  var list = getUsulanList_({});
  Logger.log((list.success ? '✅' : '❌') + ' getUsulanList_: ' + (list.data || []).length + ' usulan');

  // Test 2: list filter tahun
  var listTahun = getUsulanList_({ tahun: 2026 });
  Logger.log((listTahun.success ? '✅' : '❌') + ' filter tahun 2026: ' + (listTahun.data || []).length);

  // Test 3: review tanpa status harus ditolak
  var badReview = reviewUsulan_({ id: 'USL-001' }, { role: 'admin', email: 'test@test.com' });
  Logger.log((!badReview.success ? '✅' : '❌') + ' review tanpa status: ' + (badReview.error || 'TIDAK DITOLAK'));

  // Test 4: review status ngawur
  var badStatus = reviewUsulan_({ id: 'USL-001', status_usulan: 'STATUS_NGAWUR' }, { role: 'admin', email: 'test@test.com' });
  Logger.log((!badStatus.success ? '✅' : '❌') + ' review status invalid: ' + (badStatus.error || 'TIDAK DITOLAK'));

  // Test 5: save usulan tanpa nama program
  var badSave = saveUsulan_({}, { role: 'admin', email: 'test@test.com' });
  Logger.log((!badSave.success ? '✅' : '❌') + ' save tanpa nama: ' + (badSave.error || 'TIDAK DITOLAK'));

  // Test 6: save usulan tanpa pegawai exist
  var badPegawai = saveUsulan_({
    nama_program_diklat: 'Test',
    pegawai_id: 'PEG-99999'
  }, { role: 'admin', email: 'test@test.com' });
  Logger.log((!badPegawai.success ? '✅' : '❌') + ' validasi pegawai: ' + (badPegawai.error || 'TIDAK DITOLAK'));

  // ============================================================
  // FIX-R17 (v5.0): test whitelist status_rencana
  // ============================================================
  Logger.log('');
  Logger.log('--- FIX-R17: whitelist status_rencana ---');

  // Test 7: status ngawur harus ditolak
  var badR17 = saveUsulan_({
    nama_program_diklat: 'TEST_R17_NGAWUR_' + Date.now(),
    pegawai_id: 'PEG-0001',
    status_rencana: 'STATUS_NGAWUR_XYZ'
  }, { role: 'admin', email: 'test@test.com' });
  Logger.log((!badR17.success ? '✅' : '❌') + ' 7. Status ngawur ditolak: ' +
    (badR17.error ? badR17.error.slice(0, 80) + '...' : 'LOLOS - ERROR!'));

  // Test 8: status lowercase di-map ke kanonik
  var okR17 = saveUsulan_({
    nama_program_diklat: 'TEST_R17_DIAJUKAN_' + Date.now(),
    pegawai_id: 'PEG-0001',
    diklat_id: 'DKL-' + Date.now(),
    status_rencana: 'DIAJUKAN'
  }, { role: 'admin', email: 'test@test.com' });
  Logger.log((okR17.success && okR17.data.status_rencana === 'Diajukan' ? '✅' : '❌') +
    ' 8. Status lowercase di-map: ' + (okR17.data ? okR17.data.status_rencana : okR17.error));

  // Cleanup
  if (okR17.success && okR17.data && okR17.data.id) {
    softDeleteRecord_(LOCAL_SHEETS.T_USULAN_DIKLAT, okR17.data.id, { email: 'test@test.com' });
  }

  Logger.log('');
  Logger.log('=== Selesai ===');
}

function testRencana() {
  testRencanaSelfCheck();
}
