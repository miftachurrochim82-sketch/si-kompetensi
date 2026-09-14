// ============================================================
// SI-KOMPETENSI - Utils.gs (v2.0.0 — CoreLib Adapter)
// ============================================================
// Changelog v2.0:
// - File ini sekarang WRAPPER TIPIS ke CoreLib v2.2.1.
//   Fungsi helper (normId_, normStr_, parseDate_, whitelist_,
//   validateFields_, genUniqueCode_, requireRole_, getRoleForEmail_,
//   isAllowedConfigKey_) didelegasikan ke CoreLib — tidak lagi
//   diimplementasikan lokal (menghindari duplikasi).
// - ACTION_ROLE_MAP_ tetap di sini karena spesifik SI-KOMPETENSI.
// - audit_ tetap di sini karena pakai sendAuditLog_ (HTTP ke SI-PLATFORM).
// - checkActionRole_ didelegasikan ke CoreLib.checkRole.
//
// ⚠️ PRASYARAT: CoreLib v2.2.1+ terpasang sebagai library dan
//    di-referensikan dengan identifier "CoreLib" di appsscript.json.
// ============================================================

// ============================================================
// PETA ACTION → MINIMAL ROLE (SPESIFIK SI-KOMPETENSI)
// ============================================================
var ACTION_ROLE_MAP_ = {
  // Konfigurasi sistem → admin
  save_config_item: 'admin',
  save_config: 'admin',
  delete_config_item: 'admin',
  delete_config: 'admin',

  // Master data → verifikator
  save_katalog: 'verifikator',
  save_katalog_diklat: 'verifikator',
  save_katalog_master: 'verifikator',
  delete_katalog: 'verifikator',
  delete_katalog_diklat: 'verifikator',
  delete_katalog_master: 'verifikator',
  save_standar_kompetensi: 'verifikator',
  save_standar: 'verifikator',
  save_standar_jabatan: 'verifikator',
  delete_standar_kompetensi: 'verifikator',
  delete_standar: 'verifikator',
  delete_standar_jabatan: 'verifikator',
  save_referensi: 'verifikator',
  save_ref: 'verifikator',
  delete_referensi: 'verifikator',
  delete_ref: 'verifikator',

  // Jadwal — user boleh input (ownership dicek di fungsi), delete hanya admin
  save_jadwal: 'user',
  delete_jadwal: 'admin',
  review_jadwal: 'verifikator',

  // Penugasan → verifikator
  save_penugasan: 'verifikator',
  bulk_assign_peserta: 'verifikator',
  delete_penugasan: 'verifikator',

  // Kualifikasi — FIX v2.0: user boleh hapus miliknya (ownership di fungsi)
  save_kualifikasi: 'verifikator',
  delete_kualifikasi: 'user',     // ← FIX: ownership dicek di deleteKualifikasi_

  // Riwayat — user boleh hapus miliknya (ownership di fungsi)
  save_riwayat: 'user',
  delete_riwayat: 'user',         // ← FIX: ownership dicek di deleteRiwayat_
  verifikasi_riwayat: 'verifikator',

  // Usulan — user boleh input, verifikator/admin boleh hapus & review
  save_usulan: 'user',
  save_usulan_diklat: 'user',
  save_rencana_diklat: 'user',
  save_rencana: 'user',
  delete_usulan: 'verifikator',
  delete_usulan_diklat: 'verifikator',
  delete_rencana_diklat: 'verifikator',
  delete_rencana: 'verifikator',
  review_usulan: 'admin',

  // Sistem → super
  init_database: 'super',
  cleanup_obsolete_sheets: 'super'
};

// ============================================================
// WRAPPER KE CORELIB v2.2.1
// ============================================================

/** @deprecated Gunakan CoreLib.requireRole langsung. */
function requireRole_(user, minRole) {
  return CoreLib.requireRole(user, minRole);
}

/** Cek izin user terhadap action menurut ACTION_ROLE_MAP_ SI-KOMPETENSI. */
function checkActionRole_(action, user) {
  return CoreLib.checkRole(user, action, ACTION_ROLE_MAP_);
}

/** @deprecated Gunakan CoreLib.normId langsung. */
function normId_(v) { return CoreLib.normId(v); }

/** @deprecated Gunakan CoreLib.normStr langsung. */
function normStr_(v) { return CoreLib.normStr(v); }

/** @deprecated Gunakan CoreLib.parseDate langsung. */
function parseDate_(v) { return CoreLib.parseDate(v); }

/** @deprecated Gunakan CoreLib.whitelist langsung. */
function whitelist_(val, allowed, fieldName) {
  return CoreLib.whitelist(val, allowed, fieldName);
}

/** @deprecated Gunakan CoreLib.validateFields langsung. */
function validateFields_(obj, fields) {
  return CoreLib.validateFields(obj, fields);
}

/**
 * Generate kode unik per sheet — delegasi ke CoreLib.
 * v2.0: signature LAMA dipertahankan (prefix, sheetName, field, padWidth).
 * ssId di-resolve otomatis dari context SI-KOMPETENSI.
 */
function genUniqueCode_(prefix, sheetName, field, padWidth) {
  return CoreLib.genUniqueCode(prefix, sheetName, field, padWidth || 3, getSpreadsheetId_(), ALL_SHEET_HEADERS);
}

/**
 * Tentukan role dari email via whitelist ADMIN_EMAILS/VERIFIKATOR_EMAILS.
 * Store diambil dari Script Properties SI-KOMPETENSI.
 */
function getRoleForEmail_(email) {
  return CoreLib.getRoleForEmail(email, appProps_());
}

/** Cek apakah key config boleh diubah dari UI (dengan extraKeys SI). */
function isAllowedConfigKey_(key) {
  // SI menambah extra key: ADMIN_EMAILS, VERIFIKATOR_EMAILS
  // (di sisi SI ini AMAN karena hanya admin/super yang bisa akses save_config)
  return CoreLib.isAllowedConfigKey(key, ['ADMIN_EMAILS', 'VERIFIKATOR_EMAILS']);
}

// ============================================================
// AUDIT — TETAP LOKAL (SI-KOMPETENSI kirim ke SI-PLATFORM)
// ============================================================

/**
 * Audit log — pakai sendAuditLog_ (HTTP ke SI-PLATFORM).
 * Tidak pakai CoreLib karena audit SI-KOMPETENSI terpusat di SI-PLATFORM.
 */
function audit_(user, action, type, id, ok, msg) {
  try {
    sendAuditLog_(user, action, type, id, ok ? 'SUCCESS' : 'FAILED', msg || '');
  } catch (e) {
    Logger.log('[AUDIT WARN] ' + e.message);
  }
}

// ============================================================
// SELF-TEST
// ============================================================

function testUtilsAdapterSelfCheck() {
  Logger.log('=== 00_Utils.gs v2.0 (CoreLib Adapter) self-check ===');

  // 1. CoreLib tersedia?
  if (typeof CoreLib === 'undefined') {
    Logger.log('❌ CoreLib TIDAK terpasang. Pasang library CoreLib v2.2.1+ dulu.');
    return;
  }
  Logger.log('✅ CoreLib terdeteksi.');

  // 2. Wrapper berfungsi?
  Logger.log('  normId_("  x  ")         = "' + normId_('  x  ') + '"');
  Logger.log('  normStr_("  X  ")        = "' + normStr_('  X  ') + '"');
  Logger.log('  parseDate_("12/09/2026") = ' + parseDate_('12/09/2026'));
  Logger.log('  whitelist_("terjadwal")  = "' + whitelist_('terjadwal', ['Terjadwal','Selesai'], 'x') + '"');

  // 3. checkActionRole_
  var r1 = checkActionRole_('save_jadwal', { role: 'user' });
  Logger.log((r1.allowed ? '✅' : '❌') + ' user boleh save_jadwal');

  var r2 = checkActionRole_('delete_jadwal', { role: 'user' });
  Logger.log((!r2.allowed ? '✅' : '❌') + ' user dilarang delete_jadwal');

  var r3 = checkActionRole_('delete_riwayat', { role: 'user' });
  Logger.log((r3.allowed ? '✅' : '❌') + ' user DIIZINKAN delete_riwayat (ownership di fungsi)');

  var r4 = checkActionRole_('delete_kualifikasi', { role: 'user' });
  Logger.log((r4.allowed ? '✅' : '❌') + ' user DIIZINKAN delete_kualifikasi (ownership di fungsi)');

  // 4. isAllowedConfigKey_ dengan extra keys SI
  Logger.log('  isAllowedConfigKey_("app_title"):     ' + isAllowedConfigKey_('app_title') + ' (true)');
  Logger.log('  isAllowedConfigKey_("SPREADSHEET_ID"): ' + isAllowedConfigKey_('SPREADSHEET_ID') + ' (false)');
  Logger.log('  isAllowedConfigKey_("ADMIN_EMAILS"):   ' + isAllowedConfigKey_('ADMIN_EMAILS') + ' (true via extra SI)');

  Logger.log('=== Selesai ===');
}

function testAdapter() {
  testUtilsAdapterSelfCheck();
}
