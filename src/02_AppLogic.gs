// ============================================================
// SI-KOMPETENSI - 02_AppLogic.gs (Main HTTP & Action Dispatcher)
// ============================================================

// ============================================================
// SI-KOMPETENSI - 02_AppLogic.gs (v4.0.0 — 8-Sheet Backend Business Engine)
// Sistem Informasi Manajemen Portofolio, Jadwal & Lisensi Khusus ASN
// Satuan Polisi Pamong Praja & Pemadam Kebakaran Kab. Trenggalek
// ============================================================

/**
 * 1. DISPATCHER UTAMA DENGAN VALIDASI TIKET SSO & SESSION TOKEN
 */
function handleAction(payload) {
  try {
    payload = payload || {};
    var action = payload.action || 'ping';
    var user = payload._user || null;
    var token = payload.token || '';
    var ticket = payload.ticket || '';

    // A. Endpoint Publik
    if (action === 'ping') {
      return { success: true, message: 'SI-KOMPETENSI API Backend Aktif (v4.0.0 - 8 Sheet Architecture)', timestamp: new Date().toISOString() };
    }
    if (action === 'get_config') {
      return { success: true, data: getAppConfig_() };
    }

    // B. Autentikasi SSO Ticket dari SI-PLATFORM
    if (ticket && !user) {
      user = validateSsoTicket_(ticket);
    }

    // C. Autentikasi Token Sesi Lokal / SI-PLATFORM
    if (token && !user) {
      user = validateSessionToken_(token);
    }

    // D. Mode Pengembang & In-App Testing
    if (!user) {
      var activeEmail = '';
      try { activeEmail = Session.getActiveUser().getEmail(); } catch (e) {}
      if (activeEmail) {
        user = {
          id: 'DEV-' + activeEmail.split('@')[0],
          email: activeEmail,
          username: activeEmail.split('@')[0],
          nama: activeEmail.split('@')[0],
          role: 'admin',
          pegawai_id: 'PEG-001'
        };
      } else {
        user = { id: 'ANONYMOUS', email: 'guest@trenggalekkab.go.id', role: 'viewer', pegawai_id: '' };
      }
    }

    // E. Routing Endpoint Aksi
    switch (action) {
      // 0. Auth & SSO Bridge
      case 'exchange_platform_ticket':
      case 'exchange_sso_ticket':
        return exchangePlatformTicket_(payload.data || payload || {});
      case 'get_my_profile':
        return { success: true, data: user };
      case 'logout':
        return logoutUser_(token);

      // 1. Dashboard & Analitik
      case 'dashboard':
        return apiDashboard_(payload.data || {}, user);
      case 'analytics':
        return getAnalytics_(payload.data || {}, user);

      // 2. SIMPEG Read-Only Lookup
      case 'get_simpeg_lookup':
        return getSimpegLookup_();

      // 3. Master Satelit Bundle
      case 'get_master_satelit':
        return getMasterSatelit_();

      // 4. Jadwal Pelatihan Terjadwal (T_JADWAL_DIKLAT)
      case 'get_jadwal_list':
        return getJadwalList_(payload.data || {});
      case 'save_jadwal':
        return saveJadwal_(payload.data || {}, user);
      case 'delete_jadwal':
        return deleteJadwal_(payload.data || {}, user);

      // 5. Penugasan Peserta & Surat Perintah Tugas (T_PENUGASAN_PESERTA)
      case 'get_penugasan_list':
        return getPenugasanList_(payload.data || {});
      case 'save_penugasan':
        return savePenugasan_(payload.data || {}, user);
      case 'bulk_assign_peserta':
        return bulkAssignPeserta_(payload.data || {}, user);
      case 'delete_penugasan':
        return deletePenugasan_(payload.data || {}, user);

      // 6. Kualifikasi & Lisensi Khusus Kadaluwarsa (T_KUALIFIKASI_KHUSUS)
      case 'get_kualifikasi_list':
        return getKualifikasiList_(payload.data || {});
      case 'save_kualifikasi':
        return saveKualifikasi_(payload.data || {}, user);
      case 'delete_kualifikasi':
        return deleteKualifikasi_(payload.data || {}, user);
      case 'get_kualifikasi_expiring_soon':
        return getKualifikasiExpiringSoon_(payload.data || {});

      // 7. Riwayat Portofolio Sertifikat (T_RIWAYAT_KOMPETENSI)
      case 'get_riwayat_list':
        return getRiwayatList_(payload.data || {}, user);
      case 'save_riwayat':
        return saveRiwayat_(payload.data || {}, user);
      case 'delete_riwayat':
        return deleteRiwayat_(payload.data || {}, user);
      case 'verifikasi_riwayat':
        return verifikasiRiwayat_(payload.data || {}, user);

      // 8. Usulan Diklat Bottom-Up / AKD (T_USULAN_DIKLAT)
      case 'get_usulan_list':
        return getUsulanList_(payload.data || {}, user);
      case 'save_usulan':
        return saveUsulan_(payload.data || {}, user);
      case 'delete_usulan':
        return deleteUsulan_(payload.data || {}, user);
      case 'review_usulan':
        return reviewUsulan_(payload.data || {}, user);

      // 9. Master Katalog Diklat (M_KATALOG_DIKLAT)
      case 'get_katalog_list':
        return { success: true, data: getSheetData_(LOCAL_SHEETS.M_KATALOG_DIKLAT) };
      case 'save_katalog':
        return saveKatalog_(payload.data || {}, user);
      case 'delete_katalog':
        return deleteKatalog_(payload.data || {}, user);

      // 10. Standar Kompetensi Jabatan (M_STANDAR_KOMPETENSI)
      case 'get_standar_list':
        return { success: true, data: getSheetData_(LOCAL_SHEETS.M_STANDAR_KOMPETENSI) };
      case 'save_standar_kompetensi':
        return saveStandarKompetensi_(payload.data || {}, user);
      case 'delete_standar_kompetensi':
        return deleteStandarKompetensi_(payload.data || {}, user);

      // 11. Master Referensi (M_REFERENSI)
      case 'get_referensi_list':
        return { success: true, data: getSheetData_(LOCAL_SHEETS.M_REFERENSI) };
      case 'save_referensi':
        return saveReferensi_(payload.data || {}, user);
      case 'delete_referensi':
        return deleteReferensi_(payload.data || {}, user);

      // 12. Migrasi & Setup
      case 'init_database':
        return initDatabase();
      case 'cleanup_obsolete_sheets':
        return cleanupObsoleteSheets();

      default:
        return { success: false, error: 'Aksi API "' + action + '" tidak dikenali di SI-KOMPETENSI.' };
    }
  } catch (err) {
    Logger.log('[CRITICAL ERROR handleAction] ' + err.message + '\n' + err.stack);
    return { success: false, error: err.message };
  }
}

// ==================== WEB APP ENTRY POINTS (GAS) ====================

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
      payload = JSON.parse(e.postData.contents);
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

// ==================== SSO & SESSION BRIDGE ====================

function exchangePlatformTicket_(data) {
  try {
    data = data || {};
    var ticket = (typeof data === 'string') ? data : (data.ticket || '');
    var cleanTicket = String(ticket || '').trim();
    if (!cleanTicket) {
      throw new Error('Tiket SSO tidak ditemukan.');
    }

    var platformUser = null;

    // 1. Validasi via HTTP API ke SI-PLATFORM
    if (PLATFORM_API_URL) {
      try {
        var payload = {
          method: 'POST',
          path: '/api/v1/auth/validate-ticket',
          data: { ticket: cleanTicket, appCode: APP_CODE }
        };
        var resp = UrlFetchApp.fetch(PLATFORM_API_URL, {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify(payload),
          muteHttpExceptions: true,
          followRedirects: true
        });
        var code = resp.getResponseCode();
        var text = resp.getContentText();
        if (code === 200) {
          var result = JSON.parse(text);
          if (result && result.success && result.data && result.data.user) {
            platformUser = result.data.user;
          }
        }
      } catch (errApi) {
        Logger.log('[SSO WARN] UrlFetch ke SI-PLATFORM gagal: ' + errApi.message);
      }
    }

    // 2. Fallback jika UrlFetch offline / delay: Resolve dari active Google User / SIMPEG
    if (!platformUser) {
      var activeEmail = '';
      try { activeEmail = Session.getActiveUser().getEmail(); } catch(e) {}
      if (activeEmail) {
        platformUser = {
          id: 'USER_' + activeEmail.split('@')[0],
          email: activeEmail,
          nama: activeEmail.split('@')[0],
          roles: ['admin']
        };
      }
    }

    if (!platformUser || !platformUser.email) {
      throw new Error('Validasi tiket SSO gagal atau tiket telah kadaluwarsa.');
    }

    var email = String(platformUser.email).toLowerCase().trim();
    var simpeg = getSimpegLookup_();
    var pegawaiList = (simpeg && simpeg.data && simpeg.data.pegawai) || [];
    var pegObj = pegawaiList.find(function(p) { return String(p.email || '').toLowerCase().trim() === email; });

    var role = 'viewer';
    var roles = Array.isArray(platformUser.roles) ? platformUser.roles.map(String) : [];
    if (roles.indexOf('super') !== -1 || roles.indexOf('superadmin') !== -1) role = 'super';
    else if (roles.indexOf('admin') !== -1 || roles.indexOf('administrator') !== -1 || roles.indexOf('kasat') !== -1 || roles.indexOf('kabid') !== -1) role = 'admin';
    else if (roles.indexOf('verifikator') !== -1) role = 'verifikator';
    else role = 'user';

    var localToken = 'SESS_' + Utilities.getUuid();
    var sessionUser = {
      id: platformUser.id || (pegObj && pegObj.id) || ('USER_' + email.split('@')[0]),
      email: email,
      nama: platformUser.display_name || platformUser.nama || (pegObj && pegObj.nama_lengkap) || email.split('@')[0],
      display_name: platformUser.display_name || (pegObj && pegObj.nama_lengkap) || email.split('@')[0],
      role: role,
      pegawai_id: (pegObj && pegObj.id) || '',
      nip: (pegObj && pegObj.nip) || ''
    };

    CacheService.getScriptCache().put(SESSION_PREFIX + localToken, JSON.stringify(sessionUser), SESSION_TTL_SECONDS);
    sendAuditLog_(sessionUser, 'SSO_LOGIN', 'AUTH', sessionUser.id, 'SUCCESS', 'Login via SSO Ticket');

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

function logoutUser_(token) {
  if (token) {
    try {
      CacheService.getScriptCache().remove(SESSION_PREFIX + token);
    } catch(e) {}
  }
  return { success: true, message: 'Berhasil keluar dari sesi.' };
}

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

function validateSessionToken_(token) {
  if (!token) return null;
  try {
    var cached = CacheService.getScriptCache().get(SESSION_PREFIX + token);
    if (cached) return JSON.parse(cached);
  } catch (e) {}
  return null;
}

// ==================== SIMPEG READ-ONLY LOOKUP ====================

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

function enrichWithPegawai_(list) {
  if (!list || !Array.isArray(list)) return list || [];
  try {
    var simpeg = getSimpegLookup_();
    var pegawaiList = (simpeg && simpeg.data && simpeg.data.pegawai) || [];
    if (!pegawaiList.length && typeof FALLBACK_PEGAWAI !== 'undefined') {
      pegawaiList = FALLBACK_PEGAWAI.slice();
    }

    var pegawaiMap = {};
    pegawaiList.forEach(function(p) {
      if (p.id) pegawaiMap[String(p.id).trim().toLowerCase()] = p;
      if (p.pegawai_id) pegawaiMap[String(p.pegawai_id).trim().toLowerCase()] = p;
      if (p.nip) pegawaiMap[String(p.nip).trim().toLowerCase()] = p;
      if (p.nama_lengkap) pegawaiMap[String(p.nama_lengkap).trim().toLowerCase()] = p;
    });

    if (typeof FALLBACK_PEGAWAI !== 'undefined') {
      FALLBACK_PEGAWAI.forEach(function(p) {
        var pid = String(p.id).trim().toLowerCase();
        if (!pegawaiMap[pid]) pegawaiMap[pid] = p;
        if (p.nip && !pegawaiMap[String(p.nip).trim().toLowerCase()]) {
          pegawaiMap[String(p.nip).trim().toLowerCase()] = p;
        }
      });
    }

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

function getMasterSatelit_() {
  try {
    var katalog = getSheetData_(LOCAL_SHEETS.M_KATALOG_DIKLAT);
    var standar = getSheetData_(LOCAL_SHEETS.M_STANDAR_KOMPETENSI);
    var referensi = getSheetData_(LOCAL_SHEETS.M_REFERENSI);
    var jadwal = getSheetData_(LOCAL_SHEETS.T_JADWAL_DIKLAT);

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
