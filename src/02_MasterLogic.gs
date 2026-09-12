// ============================================================
// SI-KOMPETENSI - 02_MasterLogic.gs (Katalog, Standar, Referensi & Init)
// ============================================================

// ==================== 8. MASTER KATALOG, STANDAR & REFERENSI ====================

function saveKatalog_(params, user) {
  try {
    var record = params.record || params;
    if (!record.nama_diklat) return { success: false, error: 'Nama program diklat wajib diisi.' };
    if (!record.kode_diklat) record.kode_diklat = 'DKL-' + String(Date.now()).slice(-4);
    var saved = saveRecord_(LOCAL_SHEETS.M_KATALOG_DIKLAT, record, user);
    sendAuditLog_(user, 'SAVE_KATALOG', 'M_KATALOG_DIKLAT', saved.id, 'SUCCESS', 'Simpan katalog: ' + saved.nama_diklat);
    return { success: true, data: saved };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deleteKatalog_(params, user) {
  try {
    var id = params.id;
    if (!id) return { success: false, error: 'ID katalog wajib disertakan.' };
    var ok = softDeleteRecord_(LOCAL_SHEETS.M_KATALOG_DIKLAT, id, user);
    return { success: ok, message: 'Katalog berhasil dihapus.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function saveStandarKompetensi_(params, user) {
  try {
    var record = params.record || params;
    if (!record.jabatan_id || !record.diklat_id) return { success: false, error: 'Jabatan dan Diklat wajib dipilih.' };
    var saved = saveRecord_(LOCAL_SHEETS.M_STANDAR_KOMPETENSI, record, user);
    sendAuditLog_(user, 'SAVE_STANDAR', 'M_STANDAR_KOMPETENSI', saved.id, 'SUCCESS', 'Simpan standar kompetensi jabatan');
    return { success: true, data: saved };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deleteStandarKompetensi_(params, user) {
  try {
    var id = params.id;
    if (!id) return { success: false, error: 'ID standar wajib disertakan.' };
    var ok = softDeleteRecord_(LOCAL_SHEETS.M_STANDAR_KOMPETENSI, id, user);
    return { success: ok, message: 'Standar kompetensi dihapus.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function saveReferensi_(params, user) {
  try {
    var record = params.record || params;
    if (!record.kategori || !record.nama_nilai) return { success: false, error: 'Kategori dan nama nilai referensi wajib diisi.' };
    var saved = saveRecord_(LOCAL_SHEETS.M_REFERENSI, record, user);
    sendAuditLog_(user, 'SAVE_REFERENSI', 'M_REFERENSI', saved.id, 'SUCCESS', 'Simpan referensi: ' + saved.nama_nilai);
    return { success: true, data: saved };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deleteReferensi_(params, user) {
  try {
    var id = params.id;
    if (!id) return { success: false, error: 'ID referensi wajib disertakan.' };
    var ok = softDeleteRecord_(LOCAL_SHEETS.M_REFERENSI, id, user);
    return { success: ok, message: 'Item referensi berhasil dihapus.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ==================== 9. DATABASE INITIALIZATION & SETUP (8 SHEETS) ====================

function initDatabase() {
  var ss = getLocalSpreadsheet_();
  var created = [];
  var updated = [];

  Object.keys(LOCAL_SHEETS).forEach(function(key) {
    var sheetName = LOCAL_SHEETS[key];
    var headers = ALL_SHEET_HEADERS[sheetName];
    if (!headers) return;

    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      created.push(sheetName);
    }

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      try {
        sheet.getRange(1, 1, 1, headers.length)
          .setBackground('#059669')
          .setFontColor('#ffffff')
          .setFontWeight('bold');
        sheet.setFrozenRows(1);
      } catch (e) {}
    } else {
      // Auto-sinkronisasi kolom baru ke sheet yang sudah ada tanpa menghapus data lama
      var lastCol = sheet.getLastColumn();
      var existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
      var missing = headers.filter(function(h) { return existingHeaders.indexOf(h) === -1; });
      if (missing.length > 0) {
        sheet.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]);
        try {
          sheet.getRange(1, lastCol + 1, 1, missing.length)
            .setBackground('#059669')
            .setFontColor('#ffffff')
            .setFontWeight('bold');
        } catch(e) {}
        updated.push(sheetName + ' (+' + missing.length + ' kolom baru)');
      }
    }
  });

  try {
    var defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Sheet 1');
    if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() === 0) {
      ss.deleteSheet(defaultSheet);
    }
  } catch (e) {}

  var summary = 'Inisialisasi basis data 8-Sheet Ideal SI-KOMPETENSI selesai.';
  if (created.length > 0) summary += ' Dibuat: ' + created.join(', ') + '.';
  if (updated.length > 0) summary += ' Kolom diselaraskan: ' + updated.join(', ') + '.';
  Logger.log('✅ ' + summary);
  return { success: true, created: created, updated: updated, summary: summary };
}

function setupApp() {
  Logger.log('🚀 Memulai Setup SI-KOMPETENSI (8 Sheet Ideal Ekosistem Terpadu)...');
  initDatabase();

  var props = appProps_();
  var activeId = SPREADSHEET_ID;
  if (!activeId) {
    try { activeId = SpreadsheetApp.getActiveSpreadsheet().getId(); } catch(e) {}
  }

  props.setProperties({
    APP_TITLE: APP_TITLE,
    APP_CODE: APP_CODE,
    SPREADSHEET_ID: activeId || '',
    MASTER_SPREADSHEET_ID: MASTER_SPREADSHEET_ID,
    PLATFORM_SPREADSHEET_ID: PLATFORM_SPREADSHEET_ID,
    PLATFORM_API_URL: PLATFORM_API_URL
  });

  Logger.log('✅ Setup SI-KOMPETENSI 8-Sheet selesai!');
  return { success: true, message: 'Setup aplikasi berhasil.' };
}
