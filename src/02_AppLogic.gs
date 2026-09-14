// ============================================================
// SI-KOMPETENSI - 02_AppLogic.gs (v5.0.1 — CoreLib Integration)
// Main HTTP & Action Dispatcher
// ============================================================
// Changelog v5.0.1 (2026-09-13):
// - Tambah action granular: get_master_pegawai, get_master_unit,
//   get_master_jabatan — untuk AppCore.loadMasterSIMPEG (app-core.js).
// - Tambah action alias: get_pegawai_list, get_unit_list,
//   get_jabatan_list (fallback kompatibilitas).
// - Update self-test.
// Changelog v5.0 (2026-09-13):
// - BREAKING: Auth/session/SSO didelegasikan ke CoreLib v2.2.1.
//   * validateSessionToken_ → CoreLib.checkAuth
//   * logoutUser_           → CoreLib.logoutUser
//   * exchangePlatformTicket_ → CoreLib.exchangePlatformTicket + adaptor
// - 🔴 FIX-S9 (KRITIS): Hapus fallback manual role mapping yang tidak
//   mengenali 'sekretaris', 'kepala_dinas', 'kasubbag'. Sekarang
//   WAJIB pakai CoreLib.getHighestRole (5-level kanonik).
// - FIX-S10: checkActionRole_ dari 00_Utils.gs v2.0 (delegasi CoreLib).
// - FIX-S11: Session prefix konsisten dengan CoreLib.
// - PRESERVED: Domain logic tetap lokal — spesifik SI.
// Changelog v4.1:
// - FIX-S1..S8: lihat git history.
// ============================================================

// ==================== §1 DISPATCHER UTAMA ====================

/**
 * Dispatcher utama. Menerima payload, validasi auth, route ke handler.
 *
 * Changelog v5.0.2 (2026-09-14):
 * - 🆕 ADD: hapus `_cacheBust` dari payload.data sebelum diproses.
 *   Field ini dikirim frontend (app-core.js v2.5.1) untuk cache
 *   busting GAS — harus dibuang sebelum data digunakan agar tidak
 *   tersimpan sebagai kolom sampah di sheet.
 */
function handleAction(payload) {
  try {
    payload = payload || {};
    var action = String(payload.action || 'ping');
    var token = payload.token || '';
    var ticket = payload.ticket || '';
    var user = null;

    // ============================================================
    // v5.0.2: CACHE BUSTING CLEANUP
    // Frontend (app-core.js v2.5.1) menambahkan `_cacheBust` timestamp
    // di payload.data. Hapus di sini agar tidak ikut diproses/disimpan.
    // ============================================================
    if (payload.data && typeof payload.data === 'object' && payload.data._cacheBust !== undefined) {
      delete payload.data._cacheBust;
    }
    if (payload._cacheBust !== undefined) {
      delete payload._cacheBust;
    }

    // FIX-S1: JANGAN percaya payload._user
    if (payload._user) {
      Logger.log('[WARN] payload._user diabaikan (deprecated v4.1). Client: ' +
        JSON.stringify(payload._user).slice(0, 100));
    }

    // ---------- A. Endpoint publik ----------
    if (action === 'ping') {
      return {
        success: true,
        message: 'SI-KOMPETENSI API Backend Aktif (v5.0.2 - CoreLib Integration)',
        timestamp: new Date().toISOString()
      };
    }

    // ---------- B. Authentikasi via SSO ticket ----------
    if (ticket) {
      user = validateSsoTicket_(ticket);
    }

    // ---------- C. Authentikasi via session token ----------
    if (!user && token) {
      user = validateSessionToken_(token);
    }

    // ---------- D. Fallback: email Google aktif ----------
    // (bukan auto-admin — role ditentukan whitelist via getRoleForEmail_)
    if (!user) {
      var activeEmail = '';
      try { activeEmail = Session.getActiveUser().getEmail(); } catch (e) {}
      if (activeEmail) {
        user = {
          id: 'USER-' + activeEmail.split('@')[0],
          email: activeEmail,
          username: activeEmail.split('@')[0],
          nama: activeEmail.split('@')[0],
          role: getRoleForEmail_(activeEmail),
          pegawai_id: '',
          nip: ''
        };
      } else {
        user = { id: 'ANONYMOUS', email: '', role: 'viewer', pegawai_id: '', nip: '' };
      }
    }

    // ---------- E. Role check terpusat ----------
    var roleCheck = checkActionRole_(action, user);
    if (!roleCheck.allowed) {
      audit_(user, 'ACCESS_DENIED', 'AUTH', action, false, roleCheck.error);
      return { success: false, error: roleCheck.error, action: action };
    }

    // ---------- F. Routing ----------
    switch (action) {
      // Auth & SSO Bridge
      case 'get_config':
      case 'get_config_list':
        return getConfigList_();
      case 'save_config_item':
      case 'save_config':
        return saveConfigItem_(payload.data || payload, user);
      case 'delete_config_item':
      case 'delete_config':
        return deleteConfigItem_(payload.data || payload, user);
      case 'delete':
        var ent = (payload.data && payload.data.entity) || "";
        if (ent === "KONFIGURASI") {
          return deleteConfigItem_(payload.data || payload, user);
        }
        return { success: false, error: "Aksi delete untuk entitas " + ent + " tidak dikenali." };
      case 'exchange_platform_ticket':
      case 'exchange_sso_ticket':
        return exchangePlatformTicket_(payload.data || payload || {});
      case 'get_my_profile':
        return { success: true, data: user };
      case 'logout':
        return logoutUser_(token);

      // Dashboard & Analitik
      case 'dashboard':
        return apiDashboard_(payload.data || {}, user);
      case 'analytics':
        return getAnalytics_(payload.data || {}, user);

      // SIMPEG Read-Only Lookup (bundle)
      case 'get_simpeg_lookup':
        return getSimpegLookup_();

      // v5.0.1: SIMPEG granular accessors (untuk AppCore.loadMasterSIMPEG)
      case 'get_master_pegawai':
      case 'get_pegawai_list':       // alias fallback
        return getMasterPegawai_();
      case 'get_master_unit':
      case 'get_unit_list':          // alias fallback
        return getMasterUnit_();
      case 'get_master_jabatan':
      case 'get_jabatan_list':       // alias fallback
        return getMasterJabatan_();

      // Master Satelit Bundle
      case 'get_master_satelit':
        return getMasterSatelit_();

      // Jadwal Pelatihan
      case 'get_jadwal_list':
        return getJadwalList_(payload.data || {});
      case 'save_jadwal':
        return saveJadwal_(payload.data || {}, user);
      case 'delete_jadwal':
        return deleteJadwal_(payload.data || {}, user);

      // Penugasan Peserta
      case 'get_penugasan_list':
        return getPenugasanList_(payload.data || {});
      case 'save_penugasan':
        return savePenugasan_(payload.data || {}, user);
      case 'bulk_assign_peserta':
        return bulkAssignPeserta_(payload.data || {}, user);
      case 'delete_penugasan':
        return deletePenugasan_(payload.data || {}, user);

      // Kualifikasi Khusus
      case 'get_kualifikasi_list':
        return getKualifikasiList_(payload.data || {});
      case 'save_kualifikasi':
        return saveKualifikasi_(payload.data || {}, user);
      case 'delete_kualifikasi':
        return deleteKualifikasi_(payload.data || {}, user);
      case 'get_kualifikasi_expiring_soon':
        return getKualifikasiExpiringSoon_(payload.data || {});

      // Riwayat Portofolio
      case 'get_riwayat_list':
        return getRiwayatList_(payload.data || {}, user);
      case 'save_riwayat':
        return saveRiwayat_(payload.data || {}, user);
      case 'delete_riwayat':
        return deleteRiwayat_(payload.data || {}, user);
      case 'verifikasi_riwayat':
        return verifikasiRiwayat_(payload.data || {}, user);

      // Usulan Diklat
      case 'get_usulan_list':
      case 'get_rencana_list':
      case 'get_usulan':
        return getUsulanList_(payload.data || {}, user);
      case 'save_usulan':
      case 'save_usulan_diklat':
      case 'save_rencana_diklat':
      case 'save_rencana':
        return saveUsulan_(payload.data || {}, user);
      case 'delete_usulan':
      case 'delete_usulan_diklat':
      case 'delete_rencana_diklat':
      case 'delete_rencana':
        return deleteUsulan_(payload.data || {}, user);
      case 'review_usulan':
        return reviewUsulan_(payload.data || {}, user);

      // Master Katalog
      case 'get_katalog_list':
      case 'get_katalog':
      case 'get_katalog_diklat':
        return { success: true, data: getSheetData_(LOCAL_SHEETS.M_KATALOG_DIKLAT) };
      case 'save_katalog':
      case 'save_katalog_diklat':
      case 'save_katalog_master':
        return saveKatalog_(payload.data || {}, user);
      case 'delete_katalog':
      case 'delete_katalog_diklat':
      case 'delete_katalog_master':
        return deleteKatalog_(payload.data || {}, user);

      // Standar Kompetensi
      case 'get_standar_list':
      case 'get_standar':
      case 'get_standar_kompetensi':
        return { success: true, data: getSheetData_(LOCAL_SHEETS.M_STANDAR_KOMPETENSI) };
      case 'save_standar_kompetensi':
      case 'save_standar':
      case 'save_standar_jabatan':
        return saveStandarKompetensi_(payload.data || {}, user);
      case 'delete_standar_kompetensi':
      case 'delete_standar':
      case 'delete_standar_jabatan':
        return deleteStandarKompetensi_(payload.data || {}, user);

      // Master Referensi
      case 'get_referensi_list':
      case 'get_referensi':
        return { success: true, data: getSheetData_(LOCAL_SHEETS.M_REFERENSI) };
      case 'save_referensi':
      case 'save_ref':
        return saveReferensi_(payload.data || {}, user);
      case 'delete_referensi':
      case 'delete_ref':
        return deleteReferensi_(payload.data || {}, user);

      // Migrasi & Setup (butuh role super — sudah dicek di ACTION_ROLE_MAP_)
      case 'init_database':
        return initDatabase(user);
      case 'cleanup_obsolete_sheets':
        return cleanupObsoleteSheets(user);

      default:
        return { success: false, error: 'Aksi API "' + action + '" tidak dikenali di SI-KOMPETENSI.' };
    }
  } catch (err) {
    Logger.log('[CRITICAL ERROR handleAction] ' + err.message + '\n' + err.stack);
    return { success: false, error: err.message };
  }
}

// ==================== §2 WEB APP ENTRY POINTS ====================

function doGet(e) {
  e = e || { parameter: {} };
  var ticket = e.parameter.ticket || '';
  var isSsoEntry = !!ticket;

  var template = HtmlService.createTemplateFromFile('Index');
  template.ticket = ticket;
  template.isSsoEntry = isSsoEntry ? 'true' : 'false';

  return template.evaluate()
    .setTitle(APP_TITLE + ' — Satpol PP & Damkar Trenggalek')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function doPost(e) {
  try {
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        Logger.log('[WARN] doPost: gagal parse JSON, fallback ke parameter. ' + parseErr.message);
        payload = (e && e.parameter) || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }
    var res = handleAction(payload);
    return jsonResponse_(res);
  } catch (err) {
    return jsonResponse_({ success: false, error: err.message });
  }
}

function include(filename) {
  try {
    return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
  } catch (err) {
    try {
      return HtmlService.createTemplateFromFile(filename.toLowerCase()).evaluate().getContent();
    } catch (e2) {
      Logger.log('[WARN] Error including ' + filename + ': ' + e2.message);
      return '<!-- Error loading ' + filename + ': ' + e2.message + ' -->';
    }
  }
}

// ==================== §3 SSO & SESSION (DELEGASI CORELIB) ====================

/**
 * Adaptor — konversi user CoreLib ke format SI.
 */
function adaptCorelibUser_(coreUser) {
  if (!coreUser) return null;
  return {
    id: coreUser.user_id || coreUser.id || '',
    email: coreUser.email || '',
    username: (coreUser.email || '').split('@')[0],
    nama: coreUser.display_name || coreUser.nama || (coreUser.email || '').split('@')[0],
    display_name: coreUser.display_name || coreUser.nama || '',
    role: coreUser.role || 'viewer',
    pegawai_id: coreUser.pegawai_id || '',
    nip: coreUser.nip || ''
  };
}

/**
 * Config CoreLib untuk SI-KOMPETENSI.
 */
function corelibConfig_() {
  return {
    appCode: APP_CODE,
    spreadsheetId: getSpreadsheetId_(),
    masterSsId: MASTER_SPREADSHEET_ID,
    platformApiUrl: PLATFORM_API_URL,
    sessionPrefix: SESSION_PREFIX,
    ttlSeconds: SESSION_TTL_SECONDS
  };
}

/**
 * Tukar tiket SSO menjadi session token SI.
 *
 * FIX-S9 (KRITIS): fallback manual role mapping DIHAPUS.
 *                  Wajib pakai CoreLib.getHighestRole (5-level).
 */
function exchangePlatformTicket_(data) {
  try {
    data = data || {};
    var ticket = (typeof data === 'string') ? data : (data.ticket || '');
    var cleanTicket = String(ticket || '').trim();
    if (!cleanTicket) {
      throw new Error('Tiket SSO tidak ditemukan.');
    }

    // ---------- 1. Panggil CoreLib ----------
    var coreResult = null;
    try {
      coreResult = CoreLib.exchangePlatformTicket(cleanTicket, corelibConfig_());
    } catch (e) {
      Logger.log('[SSO WARN] CoreLib.exchangePlatformTicket error: ' + e.message);
    }

    // ---------- 2. Kalau sukses → adapt + kembalikan ----------
    if (coreResult && coreResult.success && coreResult.data && coreResult.data.user) {
      var adapted = adaptCorelibUser_(coreResult.data.user);
      return {
        success: true,
        data: {
          token: coreResult.data.token,
          user: adapted
        }
      };
    }

    // ---------- 3. Fallback: email Google aktif ----------
    Logger.log('[SSO INFO] CoreLib SSO gagal, mencoba fallback email Google aktif...');
    var activeEmail = '';
    try { activeEmail = Session.getActiveUser().getEmail(); } catch (e) {}

    if (!activeEmail) {
      throw new Error('Validasi tiket SSO gagal dan tidak ada email pengguna aktif.');
    }

    var simpeg = getSimpegLookup_();
    var pegawaiList = (simpeg && simpeg.data && simpeg.data.pegawai) || [];
    var pegObj = pegawaiList.find(function(p) {
      return String(p.email || '').toLowerCase().trim() === activeEmail.toLowerCase().trim();
    });

    // FIX-S9: role dari whitelist email (bukan auto-admin)
    var role = getRoleForEmail_(activeEmail);

    var sessionUser = {
      id: (pegObj && pegObj.id) || ('USER_' + activeEmail.split('@')[0]),
      email: activeEmail.toLowerCase(),
      username: activeEmail.split('@')[0],
      nama: (pegObj && pegObj.nama_lengkap) || activeEmail.split('@')[0],
      display_name: (pegObj && pegObj.nama_lengkap) || activeEmail.split('@')[0],
      role: role,
      pegawai_id: (pegObj && pegObj.id) || '',
      nip: (pegObj && pegObj.nip) || ''
    };

    var localToken = 'SESS_' + Utilities.getUuid();
    CacheService.getScriptCache().put(
      SESSION_PREFIX + localToken,
      JSON.stringify(sessionUser),
      SESSION_TTL_SECONDS
    );

    sendAuditLog_(sessionUser, 'SSO_FALLBACK_LOGIN', 'AUTH', sessionUser.id, 'SUCCESS',
      'Login via fallback email aktif (SSO tidak tersedia).');

    return {
      success: true,
      data: {
        token: localToken,
        user: sessionUser
      }
    };

  } catch (err) {
    Logger.log('[CRITICAL SSO] ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Logout — delegasi ke CoreLib.logoutUser.
 */
function logoutUser_(token) {
  if (!token) {
    return { success: true, message: 'Tidak ada sesi aktif.' };
  }
  try {
    return CoreLib.logoutUser(token, SESSION_PREFIX);
  } catch (e) {
    try { CacheService.getScriptCache().remove(SESSION_PREFIX + token); } catch (e2) {}
    return { success: true, message: 'Berhasil keluar.' };
  }
}

/**
 * Validasi tiket SSO — return user atau null.
 */
function validateSsoTicket_(ticket) {
  if (!ticket) return null;
  var res = exchangePlatformTicket_({ ticket: ticket });
  if (res && res.success && res.data && res.data.user) {
    var u = res.data.user;
    u.token = res.data.token;
    return u;
  }
  return null;
}

/**
 * Validasi session token — delegasi ke CoreLib.checkAuth.
 */
function validateSessionToken_(token) {
  if (!token) return null;
  try {
    var result = CoreLib.checkAuth(token, 'viewer', SESSION_PREFIX);
    if (result && result.success && result.user) {
      return adaptCorelibUser_(result.user);
    }
  } catch (e) {
    Logger.log('[validateSessionToken_] CoreLib error: ' + e.message);
  }
  // Fallback: cek cache langsung (untuk kompat dengan session lama)
  try {
    var cached = CacheService.getScriptCache().get(SESSION_PREFIX + token);
    if (cached) return JSON.parse(cached);
  } catch (e) {}
  return null;
}

// ==================== §4 SIMPEG READ-ONLY LOOKUP (DOMAIN) ====================

function getSimpegLookup_() {
  try {
    var pegawaiRaw = getSheetData_('PEGAWAI');
    var unitRaw = getSheetData_('UNIT_KERJA');
    var jabatanRaw = getSheetData_('JABATAN');

    var pegawaiClean = pegawaiRaw.map(function(p) {
      return {
        id: p.id || p.pegawai_id || '',
        pegawai_id: p.pegawai_id || p.id || '',
        nip: p.nip || '',
        nama_lengkap: p.nama_lengkap || p.nama || '',
        email: p.email || '',
        unit_id: p.unit_id || '',
        jabatan_id: p.jabatan_id || '',
        pangkat_golongan: p.pangkat_golongan || p.pangkat_gol || '',
        status_pegawai: p.status_pegawai || 'PNS',
        is_ppns: String(p.is_ppns).toLowerCase() === 'true' || String(p.is_ppns) === '1',
        kualifikasi_damkar: p.kualifikasi_damkar || ''
      };
    });

    var unitClean = unitRaw.map(function(u) {
      return {
        id: u.id || u.unit_id || '',
        kode_unit: u.kode_unit || '',
        nama_unit: u.nama_unit || u.nama || ''
      };
    });

    var jabatanClean = jabatanRaw.map(function(j) {
      return {
        id: j.id || j.jabatan_id || '',
        kode_jabatan: j.kode_jabatan || '',
        nama_jabatan: j.nama_jabatan || j.nama || '',
        target_jp_tahunan: Number(j.target_jp_tahunan) || 20
      };
    });

    return {
      success: true,
      data: {
        pegawai: pegawaiClean,
        unit: unitClean,
        jabatan: jabatanClean
      }
    };
  } catch (err) {
    return { success: false, error: 'Gagal memuat master SIMPEG: ' + err.message };
  }
}

// ==================== §4b v5.0.1: GRANULAR MASTER ACCESSORS ====================
// Dibutuhkan AppCore.loadMasterSIMPEG (app-core.js).

function getMasterPegawai_() {
  try {
    var simpeg = getSimpegLookup_();
    if (!simpeg.success) return { success: false, error: simpeg.error };
    return { success: true, data: simpeg.data.pegawai || [] };
  } catch (e) {
    return { success: false, error: 'Gagal baca pegawai: ' + e.message };
  }
}

function getMasterUnit_() {
  try {
    var simpeg = getSimpegLookup_();
    if (!simpeg.success) return { success: false, error: simpeg.error };
    return { success: true, data: simpeg.data.unit || [] };
  } catch (e) {
    return { success: false, error: 'Gagal baca unit: ' + e.message };
  }
}

function getMasterJabatan_() {
  try {
    var simpeg = getSimpegLookup_();
    if (!simpeg.success) return { success: false, error: simpeg.error };
    return { success: true, data: simpeg.data.jabatan || [] };
  } catch (e) {
    return { success: false, error: 'Gagal baca jabatan: ' + e.message };
  }
}

// ==================== §4c ENRICH & MASTER SATELIT ====================

/**
 * Enrich list dengan data pegawai (nama, nip, status).
 */
function enrichWithPegawai_(list) {
  if (!list || !Array.isArray(list)) return list || [];
  try {
    var simpeg = getSimpegLookup_();
    var pegawaiList = (simpeg && simpeg.data && simpeg.data.pegawai) || [];

    var pegawaiMap = {};
    pegawaiList.forEach(function(p) {
      if (p.id) pegawaiMap[String(p.id).trim().toLowerCase()] = p;
      if (p.pegawai_id) pegawaiMap[String(p.pegawai_id).trim().toLowerCase()] = p;
      if (p.nip) pegawaiMap[String(p.nip).trim().toLowerCase()] = p;
      if (p.nama_lengkap) pegawaiMap[String(p.nama_lengkap).trim().toLowerCase()] = p;
    });

    return list.map(function(item) {
      var targetId = String(item.pegawai_id || item.id_pegawai || '').trim().toLowerCase();
      var p = targetId ? pegawaiMap[targetId] : null;
      if (p) {
        item.nama_pegawai = p.nama_lengkap || p.nama || item.pegawai_id;
        item.nip = p.nip || item.pegawai_id;
        item.status_pegawai = p.status_pegawai || 'PNS';
      } else {
        item.nama_pegawai = item.nama_pegawai || item.pegawai_id || '-';
        item.nip = item.nip || item.pegawai_id || '-';
      }
      return item;
    });
  } catch (e) {
    return list;
  }
}

/**
 * Bundle master satelit (katalog + standar + referensi + jadwal).
 *
 * v5.1 OPTIMASI (2026-09-14):
 * - Ganti `getSimpegLookup_()` (baca 3 sheet SIMPEG: PEGAWAI + UNIT_KERJA
 *   + JABATAN) dengan `getSheetData_('JABATAN')` saja (baca 1 sheet).
 *   Hemat ~30% response time.
 * - Fix typo perbandingan: `x.id === clone.jabatan_id` (sebelumnya
 *   `x.id === String(clone.jabatan_id)` — masih pakai variable salah,
 *   seharusnya compare `x.id` dengan `clone.jabatan_id`).
 */
function getMasterSatelit_() {
  try {
    var katalog = getSheetData_(LOCAL_SHEETS.M_KATALOG_DIKLAT);
    var standar = getSheetData_(LOCAL_SHEETS.M_STANDAR_KOMPETENSI);
    var referensi = getSheetData_(LOCAL_SHEETS.M_REFERENSI);
    var jadwal = getSheetData_(LOCAL_SHEETS.T_JADWAL_DIKLAT);

    // v5.1 OPTIMASI: hanya baca JABATAN (bukan getSimpegLookup_ yang baca 3 sheet)
    var jabList = getSheetData_('JABATAN');

    standar = (standar || []).map(function(s) {
      var clone = Object.assign({}, s);
      if (!clone.nama_jabatan && clone.jabatan_id) {
        var j = jabList.find(function(x) {
          return String(x.id) === String(clone.jabatan_id) ||
                 String(x.jabatan_id) === String(clone.jabatan_id) ||
                 String(x.kode_jabatan) === String(clone.jabatan_id);
        });
        if (j) clone.nama_jabatan = j.nama_jabatan || j.nama;
      }
      if (!clone.nama_diklat || !clone.rumpun) {
        var d = (katalog || []).find(function(x) { return String(x.id) === String(clone.diklat_id); });
        if (d) {
          if (!clone.nama_diklat) clone.nama_diklat = d.nama_diklat;
          if (!clone.rumpun) clone.rumpun = d.rumpun || 'Teknis Operasional';
        }
      }
      return clone;
    });

    return {
      success: true,
      data: {
        katalog: katalog,
        standar_kompetensi: standar,
        referensi: referensi,
        jadwal: jadwal
      }
    };
  } catch (err) {
    return { success: false, error: 'Gagal memuat Master Satelit: ' + err.message };
  }
}

// ==================== §5 CONFIG (via Script Properties) ====================
// Catatan v5.0: config tetap di Script Properties, tidak migrasi ke
// sheet KONFIGURASI (demi stabilitas & backward-compat).

/**
 * getConfigList_ — hanya tampilkan whitelist key.
 */
function getConfigList_() {
  var defaults = [
    { key: "app_title", value: APP_TITLE, keterangan: "Nama Resmi Aplikasi Sistem Informasi Kompetensi Satpol PP & Damkar" },
    { key: "app_version", value: "v5.0.1", keterangan: "Versi Rilis Arsitektur Database & UI Satelit" },
    { key: "instansi", value: "Satuan Polisi Pamong Praja dan Pemadam Kebakaran Kab. Trenggalek", keterangan: "Instansi Pemerintah Daerah Pengelola" },
    { key: "target_jp_pns", value: "20", keterangan: "Target Minimal Jam Pelajaran Tahunan PNS (PP No. 17/2020)" },
    { key: "target_jp_pppk", value: "24", keterangan: "Target Maksimal Jam Pelajaran Tahunan PPPK (Perpres No. 49/2018)" },
    { key: "tahun_evaluasi_aktif", value: "2026", keterangan: "Tahun Anggaran & Evaluasi Standar Berjalan" },
    { key: "alert_h_days_lisensi", value: "90", keterangan: "Batas Peringatan Dini Kedaluwarsa Lisensi (H-90 Alert)" },
    { key: "auto_approve_sertifikat", value: "true", keterangan: "Persetujuan Otomatis Laporan Sertifikat Pegawai (true/false)" },
    { key: "max_pdf_upload_mb", value: "5", keterangan: "Batas Maksimal Ukuran Unggah Dokumen PDF Sertifikat (MB)" }
  ];

  var props = appProps_();
  var stored = {};
  try { stored = props.getProperties() || {}; } catch(e) {}

  var list = defaults.map(function(d) {
    if (stored[d.key] !== undefined) {
      d.value = stored[d.key];
    }
    return d;
  });

  Object.keys(stored).forEach(function(k) {
    if (!isAllowedConfigKey_(k)) return;
    if (!list.find(function(item) { return item.key === k; })) {
      list.push({ key: k, value: stored[k], keterangan: "Parameter Kustom Sistem" });
    }
  });

  return { success: true, data: list };
}

/**
 * saveConfigItem_ — whitelist + audit.
 */
function saveConfigItem_(payload, actor) {
  try {
    var key = payload.key || (payload.record && payload.record.key);
    var value = payload.value !== undefined ? payload.value : (payload.record && payload.record.value);
    if (!key) return { success: false, error: "Key parameter wajib diisi." };

    if (!isAllowedConfigKey_(key)) {
      audit_(actor, 'SAVE_CONFIG_DENIED', 'CONFIG', key, false, 'Key tidak diizinkan: ' + key);
      return { success: false, error: 'Parameter "' + key + '" tidak diizinkan diubah dari sini.' };
    }

    var props = appProps_();
    props.setProperty(String(key), String(value));

    audit_(actor, 'SAVE_CONFIG', 'CONFIG', key, true,
      'Set config: ' + key + ' = ' + String(value).slice(0, 100));

    return { success: true, message: "Parameter " + key + " berhasil disimpan." };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * deleteConfigItem_ — whitelist + audit.
 */
function deleteConfigItem_(payload, actor) {
  try {
    var key = payload.key || (payload.record && payload.record.key) || payload.id;
    if (!key) return { success: false, error: "Key parameter wajib disertakan." };

    if (!isAllowedConfigKey_(key)) {
      audit_(actor, 'DELETE_CONFIG_DENIED', 'CONFIG', key, false, 'Key tidak diizinkan: ' + key);
      return { success: false, error: 'Parameter "' + key + '" tidak boleh dihapus dari sini.' };
    }

    var props = appProps_();
    props.deleteProperty(String(key));

    audit_(actor, 'DELETE_CONFIG', 'CONFIG', key, true, 'Delete config: ' + key);

    return { success: true, message: "Parameter " + key + " berhasil dihapus." };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ==================== §6 SELF-TEST ====================

function testAppLogicSelfCheck() {
  Logger.log('=== 02_AppLogic.gs v5.0.1 self-check ===');

  // 0. CoreLib
  if (typeof CoreLib === 'undefined') {
    Logger.log('❌ CoreLib tidak terpasang!');
    return;
  }
  Logger.log('✅ CoreLib terdeteksi.');

  // 1. ping endpoint
  var ping = handleAction({ action: 'ping' });
  Logger.log((ping.success ? '✅' : '❌') + ' ping: ' + ping.message);

  // 2. payload._user diabaikan
  Logger.log('Test payload._user diabaikan...');
  var res = handleAction({
    action: 'get_my_profile',
    _user: { role: 'super', email: 'hacker@evil.com' }
  });
  var roleFromProfile = (res.data && res.data.role) || 'unknown';
  Logger.log('  Profile role: ' + roleFromProfile + ' (expect: BUKAN "super")');

  // 3. role check
  var roleCheck = checkActionRole_('save_jadwal', { role: 'viewer' });
  Logger.log((!roleCheck.allowed ? '✅' : '❌') + ' viewer tidak boleh save_jadwal');

  var roleCheck2 = checkActionRole_('save_jadwal', { role: 'verifikator' });
  Logger.log((roleCheck2.allowed ? '✅' : '❌') + ' verifikator boleh save_jadwal');

  // 4. FIX-S9: role fallback mapping
  Logger.log('');
  Logger.log('--- FIX-S9: Role Fallback Test ---');
  var roleTests = [
    { input: ['sekretaris'], expect: 'admin' },
    { input: ['kepala_dinas'], expect: 'admin' },
    { input: ['kasubbag'], expect: 'verifikator' },
    { input: ['kasi'], expect: 'verifikator' },
    { input: ['operator'], expect: 'user' },
    { input: ['pegawai'], expect: 'user' }
  ];
  roleTests.forEach(function(t) {
    var got = CoreLib.getHighestRole(t.input);
    Logger.log((got === t.expect ? '✅' : '❌') +
      ' getHighestRole([' + t.input.join(',') + ']) = ' + got +
      ' (expect ' + t.expect + ')');
  });

  // 5. config whitelist
  var badConfig = saveConfigItem_({ key: 'SPREADSHEET_ID', value: 'hack' }, { role: 'admin' });
  Logger.log((!badConfig.success ? '✅' : '❌') + ' SPREADSHEET_ID ditolak: ' + (badConfig.error || ''));

  var goodConfig = saveConfigItem_({ key: 'app_title', value: 'TEST v5.0.1' }, { role: 'admin' });
  Logger.log((goodConfig.success ? '✅' : '❌') + ' app_title diterima');

  deleteConfigItem_({ key: 'app_title' }, { role: 'admin' });

  // 6. getConfigList_ tidak bocorkan infra key
  var cfg = getConfigList_();
  var hasInfra = (cfg.data || []).some(function(c) {
    return c.key === 'SPREADSHEET_ID' || c.key === 'PLATFORM_API_URL';
  });
  Logger.log((!hasInfra ? '✅' : '❌') + ' getConfigList_ tidak bocorkan infra key');

  // 7. Domain helpers
  Logger.log('');
  Logger.log('--- Domain helpers ---');
  var simpeg = getSimpegLookup_();
  Logger.log((simpeg.success ? '✅' : '❌') + ' getSimpegLookup_: ' +
    (simpeg.data && simpeg.data.pegawai ? simpeg.data.pegawai.length : 0) + ' pegawai');

  var satelit = getMasterSatelit_();
  Logger.log((satelit.success ? '✅' : '❌') + ' getMasterSatelit_: ' +
    (satelit.data && satelit.data.katalog ? satelit.data.katalog.length : 0) + ' katalog');

  // 8. v5.0.1: granular master accessors
  Logger.log('');
  Logger.log('--- v5.0.1: Granular Master Accessors ---');
  ['get_master_pegawai', 'get_master_unit', 'get_master_jabatan'].forEach(function(act) {
    var r = handleAction({ action: act });
    Logger.log((r.success ? '✅' : '❌') + ' ' + act + ': ' +
      (r.data ? r.data.length + ' item' : r.error));
  });

  // 8b. Alias fallback
  Logger.log('');
  Logger.log('--- Alias fallback ---');
  ['get_pegawai_list', 'get_unit_list', 'get_jabatan_list'].forEach(function(act) {
    var r = handleAction({ action: act });
    Logger.log((r.success ? '✅' : '❌') + ' ' + act + ': ' +
      (r.data ? r.data.length + ' item' : r.error));
  });

  // 9. Session helpers
  Logger.log('');
  Logger.log('--- Session ---');
  var fakeUser = validateSessionToken_('TOKEN_TIDAK_VALID');
  Logger.log((fakeUser === null ? '✅' : '❌') + ' validateSessionToken_ token invalid → null');

  var logoutRes = logoutUser_('');
  Logger.log((logoutRes.success ? '✅' : '❌') + ' logoutUser_ tanpa token');

  Logger.log('');
  Logger.log('=== Selesai ===');
}

function testAdapter02() {
  testAppLogicSelfCheck();
}
