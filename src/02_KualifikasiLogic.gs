// ============================================================
// SI-KOMPETENSI - 02_KualifikasiLogic.gs (Lisensi Khusus & H-90 Alert)
// ============================================================

// ==================== 5. KUALIFIKASI & LISENSI KHUSUS (T_KUALIFIKASI_KHUSUS) ====================

function getKualifikasiList_(params) {
  try {
    params = params || {};
    var list = getSheetData_(LOCAL_SHEETS.T_KUALIFIKASI_KHUSUS);
    if (params.pegawai_id) {
      list = list.filter(function(k) { return String(k.pegawai_id) === String(params.pegawai_id); });
    }
    if (params.jenis_kualifikasi) {
      list = list.filter(function(k) { return String(k.jenis_kualifikasi) === String(params.jenis_kualifikasi); });
    }
    return { success: true, data: enrichWithPegawai_(list) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function saveKualifikasi_(params, user) {
  try {
    var record = params.record || params;
    if (!record.pegawai_id || !record.jenis_kualifikasi) {
      return { success: false, error: 'Pegawai dan jenis kualifikasi khusus wajib diisi.' };
    }
    if (!record.status_kualifikasi) record.status_kualifikasi = 'AKTIF';

    var saved = saveRecord_(LOCAL_SHEETS.T_KUALIFIKASI_KHUSUS, record, user);
    sendAuditLog_(user, 'SAVE_KUALIFIKASI', 'T_KUALIFIKASI_KHUSUS', saved.id, 'SUCCESS', 'Simpan lisensi: ' + saved.jenis_kualifikasi);
    return { success: true, data: saved };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deleteKualifikasi_(params, user) {
  try {
    var id = params.id;
    if (!id) return { success: false, error: 'ID kualifikasi wajib disertakan.' };
    var ok = softDeleteRecord_(LOCAL_SHEETS.T_KUALIFIKASI_KHUSUS, id, user);
    sendAuditLog_(user, 'DELETE_KUALIFIKASI', 'T_KUALIFIKASI_KHUSUS', id, 'SUCCESS', 'Hapus lisensi kualifikasi: ' + id);
    return { success: ok, message: 'Lisensi kualifikasi khusus berhasil dihapus.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getKualifikasiExpiringSoon_(params) {
  try {
    var list = getSheetData_(LOCAL_SHEETS.T_KUALIFIKASI_KHUSUS);
    var nowMs = Date.now();
    var ms90Days = 90 * 24 * 60 * 60 * 1000;

    var expiring = list.filter(function(k) {
      if (!k.tgl_habis_berlaku || String(k.status_kualifikasi).toLowerCase() === 'tidak_aktif') return false;
      var expMs = new Date(k.tgl_habis_berlaku).getTime();
      return !isNaN(expMs) && expMs > nowMs && (expMs - nowMs) <= ms90Days;
    });

    return { success: true, count: expiring.length, data: expiring };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
