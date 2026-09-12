// ============================================================
// SI-KOMPETENSI - 02_RiwayatLogic.gs (Portofolio Sertifikat & Approval)
// ============================================================

// ==================== 6. PORTOFOLIO RIWAYAT KOMPETENSI (T_RIWAYAT_KOMPETENSI) ====================

function getRiwayatList_(params, user) {
  try {
    params = params || {};
    var list = getSheetData_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI);

    if (params.filters) {
      if (params.filters.rumpun) {
        list = list.filter(function(k) { return String(k.rumpun) === String(params.filters.rumpun); });
      }
      if (params.filters.status) {
        list = list.filter(function(k) { return String(k.status_verifikasi) === String(params.filters.status); });
      }
    }

    if (params.search) {
      var q = String(params.search).toLowerCase().trim();
      list = list.filter(function(k) {
        return String(k.nama_kegiatan || '').toLowerCase().indexOf(q) !== -1 ||
               String(k.penyelenggara || '').toLowerCase().indexOf(q) !== -1 ||
               String(k.no_sertifikat || '').toLowerCase().indexOf(q) !== -1;
      });
    }

    return { success: true, data: enrichWithPegawai_(list) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function saveRiwayat_(params, user) {
  try {
    var record = params.record || params;
    if (!record.pegawai_id) return { success: false, error: 'Pegawai pemilik sertifikat wajib dipilih.' };

    // Auto-populate from Jadwal if diklat_id / jadwal_id is provided
    if ((!record.nama_kegiatan || !record.penyelenggara) && (record.jadwal_id || record.diklat_id)) {
      var targetId = record.jadwal_id || record.diklat_id;
      var allJadwal = getSheetData_(LOCAL_SHEETS.T_JADWAL_DIKLAT);
      var j = allJadwal.find(function(x) { return String(x.id) === String(targetId); });
      if (j) {
        if (!record.nama_kegiatan) record.nama_kegiatan = j.nama_kegiatan || j.nama_diklat || '';
        if (!record.rumpun) record.rumpun = j.rumpun || 'Teknis Pemadam & Rescue';
        if (record.jumlah_jp === undefined || record.jumlah_jp === '') record.jumlah_jp = j.jumlah_jp || 20;
        if (!record.penyelenggara) record.penyelenggara = j.penyelenggara || '';
        if (!record.metode) record.metode = j.metode || 'Klasikal';
        if (!record.tgl_mulai) record.tgl_mulai = j.tgl_mulai || '';
        if (!record.tgl_selesai) record.tgl_selesai = j.tgl_selesai || '';
      }
    }

    if (!record.nama_kegiatan) return { success: false, error: 'Nama kegiatan pelatihan / agenda diklat wajib dipilih.' };

    if (record.jumlah_jp === undefined || record.jumlah_jp === '') record.jumlah_jp = 20;
    if (!record.status_verifikasi) record.status_verifikasi = 'disetujui';

    var saved = saveRecord_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI, record, user);
    sendAuditLog_(user, 'SAVE_RIWAYAT', 'T_RIWAYAT_KOMPETENSI', saved.id, 'SUCCESS', 'Simpan riwayat kompetensi: ' + saved.nama_kegiatan);
    return { success: true, data: saved };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deleteRiwayat_(params, user) {
  try {
    var id = params.id;
    if (!id) return { success: false, error: 'ID riwayat wajib disertakan.' };
    var ok = softDeleteRecord_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI, id, user);
    sendAuditLog_(user, 'DELETE_RIWAYAT', 'T_RIWAYAT_KOMPETENSI', id, 'SUCCESS', 'Hapus riwayat kompetensi: ' + id);
    return { success: ok, message: 'Riwayat sertifikat berhasil dihapus.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function verifikasiRiwayat_(params, user) {
  try {
    var id = params.id;
    var status = params.status_verifikasi || 'disetujui';
    var catatan = params.catatan_verifikator || '';

    if (!id) return { success: false, error: 'ID sertifikat wajib disertakan.' };

    var rec = findRecordById_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI, id);
    if (!rec) return { success: false, error: 'Data sertifikat tidak ditemukan.' };

    rec.status_verifikasi = status;
    rec.catatan_verifikator = catatan;
    rec.verifikator_id = (user && (user.email || user.id)) || 'verifikator';
    rec.tanggal_verifikasi = new Date().toISOString();

    var saved = saveRecord_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI, rec, user);
    sendAuditLog_(user, 'VERIFIKASI_RIWAYAT', 'T_RIWAYAT_KOMPETENSI', id, 'SUCCESS', 'Verifikasi status: ' + status);
    return { success: true, data: saved };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
