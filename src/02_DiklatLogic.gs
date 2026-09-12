// ============================================================
// SI-KOMPETENSI - 02_DiklatLogic.gs (Jadwal Pelatihan & Penugasan)
// ============================================================

// ==================== 3. JADWAL PELATIHAN (T_JADWAL_DIKLAT) ====================

function getJadwalList_(params) {
  try {
    var list = getSheetData_(LOCAL_SHEETS.T_JADWAL_DIKLAT);
    return { success: true, data: list };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function saveJadwal_(params, user) {
  try {
    var record = params.record || params;
    if (!record.nama_kegiatan && !record.nama_diklat) {
      return { success: false, error: 'Nama kegiatan pelatihan wajib diisi.' };
    }
    if (!record.kode_jadwal) {
      record.kode_jadwal = 'JDW-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMM') + '-' + Math.floor(1000 + Math.random() * 9000);
    }
    if (!record.nama_kegiatan && record.nama_diklat) {
      record.nama_kegiatan = record.nama_diklat;
    }
    if (!record.status_jadwal) {
      record.status_jadwal = 'Terjadwal';
    }
    var saved = saveRecord_(LOCAL_SHEETS.T_JADWAL_DIKLAT, record, user);
    sendAuditLog_(user, 'SAVE_JADWAL', 'T_JADWAL_DIKLAT', saved.id, 'SUCCESS', 'Simpan agenda jadwal: ' + (saved.nama_kegiatan || ''));
    return { success: true, data: saved };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deleteJadwal_(params, user) {
  try {
    var id = params.id;
    if (!id) return { success: false, error: 'ID jadwal wajib disertakan.' };
    var ok = softDeleteRecord_(LOCAL_SHEETS.T_JADWAL_DIKLAT, id, user);
    sendAuditLog_(user, 'DELETE_JADWAL', 'T_JADWAL_DIKLAT', id, 'SUCCESS', 'Hapus agenda jadwal: ' + id);
    return { success: ok, message: 'Jadwal berhasil dihapus.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ==================== 4. PENUGASAN PESERTA & SURAT TUGAS (T_PENUGASAN_PESERTA) ====================

function getPenugasanList_(params) {
  try {
    params = params || {};
    var list = getSheetData_(LOCAL_SHEETS.T_PENUGASAN_PESERTA);
    if (params.jadwal_id) {
      list = list.filter(function(p) { return String(p.jadwal_id) === String(params.jadwal_id); });
    }
    if (params.pegawai_id) {
      list = list.filter(function(p) { return String(p.pegawai_id) === String(params.pegawai_id); });
    }
    return { success: true, data: list };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function savePenugasan_(params, user) {
  try {
    var record = params.record || params;
    if (!record.pegawai_id) return { success: false, error: 'Pegawai peserta wajib dipilih.' };
    if (!record.no_surat_tugas) record.no_surat_tugas = '800/SPT/' + String(Date.now()).slice(-4) + '/2026';
    if (!record.status_keikutsertaan) record.status_keikutsertaan = 'DITUGASKAN';

    var saved = saveRecord_(LOCAL_SHEETS.T_PENUGASAN_PESERTA, record, user);
    sendAuditLog_(user, 'SAVE_PENUGASAN', 'T_PENUGASAN_PESERTA', saved.id, 'SUCCESS', 'Penugasan diklat pegawai: ' + saved.pegawai_id);
    return { success: true, data: saved };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function bulkAssignPeserta_(params, user) {
  try {
    var jadwalId = params.jadwal_id;
    var pegawaiIds = params.pegawai_ids || [];
    var noSuratTugas = params.no_surat_tugas || ('800/SPT/' + String(Date.now()).slice(-4) + '/2026');
    var tglSuratTugas = params.tgl_surat_tugas || new Date().toISOString().slice(0, 10);

    if (!jadwalId || !Array.isArray(pegawaiIds) || pegawaiIds.length === 0) {
      return { success: false, error: 'Jadwal dan daftar pegawai wajib dipilih.' };
    }

    var inserted = [];
    pegawaiIds.forEach(function(pid) {
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
    });

    sendAuditLog_(user, 'BULK_ASSIGN_PESERTA', 'T_PENUGASAN_PESERTA', jadwalId, 'SUCCESS', 'Delegasi massal ' + inserted.length + ' pegawai.');
    return { success: true, count: inserted.length, data: inserted };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deletePenugasan_(params, user) {
  try {
    var id = params.id;
    if (!id) return { success: false, error: 'ID penugasan wajib disertakan.' };
    var ok = softDeleteRecord_(LOCAL_SHEETS.T_PENUGASAN_PESERTA, id, user);
    sendAuditLog_(user, 'DELETE_PENUGASAN', 'T_PENUGASAN_PESERTA', id, 'SUCCESS', 'Hapus penugasan: ' + id);
    return { success: ok, message: 'Data penugasan peserta dihapus.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
