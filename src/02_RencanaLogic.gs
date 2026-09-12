// ============================================================
// SI-KOMPETENSI - 02_RencanaLogic.gs (Rencana Diklat Tahunan & Realisasi)
// ============================================================

// ==================== 7. RENCANA DIKLAT TAHUNAN & REALISASI (T_USULAN_DIKLAT) ====================

function getUsulanList_(params, user) {
  try {
    params = params || {};
    var list = getSheetData_(LOCAL_SHEETS.T_USULAN_DIKLAT);
    var riwayatList = getSheetData_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI);

    var enriched = enrichWithPegawai_(list);

    // Hitung keselarasan & realisasi terhadap sertifikat riil pegawai
    return {
      success: true,
      data: enriched.map(function(u) {
        var progName = String(u.nama_program_diklat || u.nama_diklat_usulan || '').toLowerCase().trim();
        var pegId = String(u.pegawai_id || '').trim().toLowerCase();

        // Cari apakah ada sertifikat riwayat yang cocok
        var matchedRiwayat = riwayatList.find(function(r) {
          if (String(r.status_verifikasi).toLowerCase() === 'ditolak') return false;
          var rProg = String(r.nama_kegiatan || '').toLowerCase().trim();
          var rPeg = String(r.pegawai_id || '').trim().toLowerCase();
          var samePeg = (!pegId || rPeg === pegId);
          var sameProg = rProg && progName && (rProg.indexOf(progName) !== -1 || progName.indexOf(rProg) !== -1);
          return samePeg && sameProg;
        });

        if (matchedRiwayat) {
          u.is_terealisasi = true;
          u.realisasi_sertifikat_id = matchedRiwayat.id;
          u.realisasi_tgl = matchedRiwayat.tgl_terbit || matchedRiwayat.tgl_selesai;
          u.realisasi_jp = matchedRiwayat.jumlah_jp;
          if (!u.status_rencana || u.status_rencana === 'Direncanakan' || u.status_rencana === 'diajukan') {
            u.status_rencana = 'Terealisasi';
          }
        } else {
          u.is_terealisasi = (u.status_rencana === 'Terealisasi');
        }

        if (!u.nama_program_diklat && u.nama_diklat_usulan) u.nama_program_diklat = u.nama_diklat_usulan;
        if (!u.tahun_anggaran && u.tahun_anggaran_target) u.tahun_anggaran = u.tahun_anggaran_target;
        if (!u.alasan_justifikasi && u.alasan_usulan) u.alasan_justifikasi = u.alasan_usulan;
        if (!u.penyelenggara && u.target_penyelenggara) u.penyelenggara = u.target_penyelenggara;

        return u;
      })
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function saveUsulan_(params, user) {
  try {
    var record = params.record || params;
    var prog = record.nama_program_diklat || record.nama_diklat_usulan;
    if (!prog) return { success: false, error: 'Nama program pelatihan terencana wajib diisi.' };

    record.nama_program_diklat = prog;
    record.nama_diklat_usulan = prog;
    if (!record.tahun_anggaran) record.tahun_anggaran = record.tahun_anggaran_target || new Date().getFullYear();
    if (!record.tahun_anggaran_target) record.tahun_anggaran_target = record.tahun_anggaran;
    if (!record.periode_triwulan) record.periode_triwulan = 'TW I (Jan - Mar)';
    if (!record.status_rencana) record.status_rencana = record.status_usulan || 'Direncanakan';
    if (!record.status_usulan) record.status_usulan = record.status_rencana;
    if (!record.target_jp) record.target_jp = record.jumlah_jp || 20;
    if (!record.sumber_dana) record.sumber_dana = 'APBD Kabupaten Trenggalek';
    if (!record.tgl_penetapan) record.tgl_penetapan = new Date().toISOString().slice(0, 10);

    var saved = saveRecord_(LOCAL_SHEETS.T_USULAN_DIKLAT, record, user);
    sendAuditLog_(user, 'SAVE_RENCANA_DIKLAT', 'T_USULAN_DIKLAT', saved.id, 'SUCCESS', 'Simpan rencana diklat: ' + prog);
    return { success: true, data: saved };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function reviewUsulan_(params, user) {
  try {
    var id = params.id;
    var status = params.status_usulan || 'disetujui_kasat';
    var catatan = params.catatan_pimpinan || '';

    if (!id) return { success: false, error: 'ID usulan wajib disertakan.' };

    var rec = findRecordById_(LOCAL_SHEETS.T_USULAN_DIKLAT, id);
    if (!rec) return { success: false, error: 'Data usulan diklat tidak ditemukan.' };

    rec.status_usulan = status;
    rec.catatan_pimpinan = catatan;

    var saved = saveRecord_(LOCAL_SHEETS.T_USULAN_DIKLAT, rec, user);
    sendAuditLog_(user, 'REVIEW_USULAN', 'T_USULAN_DIKLAT', id, 'SUCCESS', 'Review usulan status: ' + status);
    return { success: true, data: saved };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deleteUsulan_(params, user) {
  try {
    var id = params.id;
    if (!id) return { success: false, error: 'ID usulan wajib disertakan.' };
    var ok = softDeleteRecord_(LOCAL_SHEETS.T_USULAN_DIKLAT, id, user);
    sendAuditLog_(user, 'DELETE_USULAN', 'T_USULAN_DIKLAT', id, 'SUCCESS', 'Hapus usulan diklat: ' + id);
    return { success: ok, message: 'Usulan diklat berhasil dihapus.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
