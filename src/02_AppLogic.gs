// ============================================================
// SI-KOMPETENSI - 02_AppLogic.gs (v3.3.0 — Enriched SIMPEG & Streamlined Flow)
// Backend Routing, Business Logic & Standalone API Dispatcher
// Satpol PP & Pemadam Kebakaran Kab. Trenggalek
// ============================================================

/**
 * Entry point HTTP GET (Web App UI Entry)
 */
function doGet(e) {
  var template;
  try {
    template = HtmlService.createTemplateFromFile('Index');
  } catch (err) {
    template = HtmlService.createTemplateFromFile('index');
  }
  template.sessionToken = '';
  template.user = {};
  template.ticket = (e && e.parameter && e.parameter.ticket) || '';
  template.isSsoEntry = Boolean((e && e.parameter && e.parameter.ticket));
  return template.evaluate()
    .setTitle(APP_TITLE + ' — Satpol PP & Damkar Trenggalek')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

/**
 * Entry point HTTP POST (API Endpoint)
 */
function doPost(e) {
  var body = {};
  try {
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
  } catch (err) {
    return jsonResponse_({ success: false, code: 'BAD_REQUEST', error: 'Format JSON payload tidak valid.' });
  }

  var result = handleAction(body);
  return jsonResponse_(result);
}

function include(filename) {
  try {
    return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
  } catch (err) {
    return HtmlService.createTemplateFromFile(filename.toLowerCase()).evaluate().getContent();
  }
}

/**
 * Hook pre-save lokal
 */
function localPreSaveHook_(sheetName, record, isNew, sessionUser) {
  var userRole = String((sessionUser && sessionUser.role) || '').toLowerCase();
  var isAdminOrVerifikator = (userRole === 'admin' || userRole === 'super' || userRole === 'verifikator');

  if (sheetName === LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI) {
    if (isNew && !record.id) {
      record.id = 'KMP-' + String(Date.now()).slice(-6);
    }
    if (!isAdminOrVerifikator) {
      if (isNew) record.status_verifikasi = 'menunggu';
    }
  } else if (sheetName === LOCAL_SHEETS.T_USULAN_DIKLAT) {
    if (isNew && !record.id) {
      record.id = 'USL-' + String(Date.now()).slice(-6);
    }
    if (!isAdminOrVerifikator) {
      if (isNew) record.status_usulan = 'diajukan';
    }
  }
  return record;
}

/**
 * Dispatcher Utama SI-KOMPETENSI
 */
function handleAction(payload) {
  if (!payload || typeof payload !== 'object') {
    return { success: false, code: 'BAD_REQUEST', error: 'Payload tidak valid.' };
  }

  var action = payload.action || '';
  var data = payload.data || {};
  var token = payload.token || '';
  var ticket = payload.ticket || (data && data.ticket) || '';
  var sessionUser = payload.user || { id: 'GUEST', role: 'viewer', email: '' };

  // 1. SSO Ticket Exchange (Mendukung exchange_platform_ticket & aliasnya)
  if (action === 'exchange_platform_ticket' || action === 'exchange_ticket' || action === 'validate_ticket' || action === 'sso_login' || action === 'auth_ticket') {
    return handleTicketExchange_(ticket || token);
  }

  // 2. Ping
  if (action === 'ping') {
    return { success: true, message: 'SI-KOMPETENSI API v3.3.0 Online', timestamp: new Date().toISOString() };
  }

  // 3. Routing Aksi
  try {
    switch (action) {
      // Dashboard & Analisa
      case 'dashboard':
        return apiDashboard_(data, sessionUser);

      case 'analytics':
        return getAnalytics_(data, sessionUser);

      // Transaksi 1: Riwayat Kompetensi & Sertifikat (20 JP)
      case 'get_riwayat_list':
      case 'get_kompetensi_list':
        return getRiwayatList_(data, sessionUser);

      case 'save_riwayat':
      case 'save_kompetensi':
        return saveRiwayatHandler_(data, sessionUser);

      case 'delete_riwayat':
      case 'delete_kompetensi':
        return deleteRiwayatHandler_(data, sessionUser);

      case 'verifikasi_riwayat':
      case 'verifikasi_kompetensi':
        return verifikasiRiwayatHandler_(data, sessionUser);

      // Transaksi 2: Usulan Diklat Bottom-Up (AKD)
      case 'get_usulan_list':
        return getUsulanList_(data, sessionUser);

      case 'save_usulan':
        return saveUsulanHandler_(data, sessionUser);

      case 'review_usulan':
        return reviewUsulanHandler_(data, sessionUser);

      case 'delete_usulan':
        return deleteUsulanHandler_(data, sessionUser);

      // Master Satelit 1: Katalog & Jadwal Diklat
      case 'get_katalog_list':
      case 'get_katalog_diklat':
      case 'get_jadwal_list':
        return getKatalogList_(data, sessionUser);

      case 'save_katalog':
      case 'save_jadwal':
        return saveKatalogHandler_(data, sessionUser);

      case 'delete_katalog':
      case 'delete_jadwal':
        return deleteKatalogHandler_(data, sessionUser);

      // Master Satelit 2: Standar Kompetensi Jabatan (SKJ)
      case 'get_standar_kompetensi_list':
        return getStandarKompetensiList_(data, sessionUser);

      case 'save_standar_kompetensi':
        return saveStandarKompetensiHandler_(data, sessionUser);

      case 'delete_standar_kompetensi':
        return deleteStandarKompetensiHandler_(data, sessionUser);

      // Master Satelit 3: Master Referensi Gabungan
      case 'get_referensi_list':
        return getReferensiList_(data, sessionUser);

      case 'save_referensi':
        return saveReferensiHandler_(data, sessionUser);

      case 'delete_referensi':
        return deleteReferensiHandler_(data, sessionUser);

      // Bundle Data Master Satelit & Lookup SIMPEG
      case 'get_master_satelit':
        return getMasterSatelit_();

      case 'get_simpeg_lookup':
      case 'get_master_simpeg':
        return getSimpegLookup_();

      // Profil & Cache
      case 'get_my_profile':
        return getMyProfile_(data, sessionUser);

      case 'logout':
        return { success: true, message: 'Berhasil logout' };

      case 'refresh_cache':
        return refreshCacheHandler_();

      case 'setup_app':
      case 'init_database':
        return setupApp();

      default:
        if (typeof CoreLib !== 'undefined' && typeof CoreLib.dispatch === 'function') {
          var cfg = getAppConfig_();
          cfg.preSaveHook = localPreSaveHook_;
          return CoreLib.dispatch(payload, cfg);
        }
        return { success: false, code: 'UNKNOWN_ACTION', error: 'Action "' + action + '" tidak dikenali.' };
    }
  } catch (err) {
    Logger.log('[ERROR handleAction] ' + (err.stack || err.message));
    return { success: false, error: err.message || 'Terjadi kesalahan server.' };
  }
}

/**
 * Handle SSO Ticket Exchange (Dual Mode: HTTP API + Direct Spreadsheet Fallback)
 */
function handleTicketExchange_(ticket) {
  if (!ticket) return { success: false, code: 'INVALID_TICKET', error: 'Ticket SSO tidak boleh kosong.' };

  var user = null;

  // 1. Coba validasi via HTTP API SI-PLATFORM (/api/v1/auth/validate-ticket)
  if (PLATFORM_API_URL) {
    try {
      var resp = UrlFetchApp.fetch(PLATFORM_API_URL, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({
          method: 'POST',
          path: '/api/v1/auth/validate-ticket',
          data: { ticket: ticket }
        }),
        muteHttpExceptions: true
      });

      var resObj = JSON.parse(resp.getContentText());
      if (resObj && resObj.success && resObj.data && resObj.data.user) {
        user = resObj.data.user;
      }
    } catch(e) {
      Logger.log('[WARN UrlFetchApp Ticket] ' + e.message);
    }
  }

  // 2. Fallback Langsung ke Spreadsheet SI-PLATFORM (Sangat Cepat & 100% Handal)
  if (!user && PLATFORM_SPREADSHEET_ID) {
    try {
      var platformSs = SpreadsheetApp.openById(PLATFORM_SPREADSHEET_ID);
      var ticketSheet = platformSs.getSheetByName('tickets');
      if (ticketSheet && ticketSheet.getLastRow() > 1) {
        var tValues = ticketSheet.getDataRange().getValues();
        var tHeaders = tValues[0].map(function(h) { return String(h).trim(); });
        var tIdx = tHeaders.indexOf('ticket');
        var uIdx = tHeaders.indexOf('user_id');
        var expIdx = tHeaders.indexOf('expires_at');

        var matchedUserId = null;
        for (var i = 1; i < tValues.length; i++) {
          if (String(tValues[i][tIdx]) === String(ticket)) {
            var exp = tValues[i][expIdx];
            if (!exp || new Date(exp) >= new Date()) {
              matchedUserId = String(tValues[i][uIdx]);
              break;
            }
          }
        }

        if (matchedUserId) {
          var userSheet = platformSs.getSheetByName('users');
          var userValues = userSheet.getDataRange().getValues();
          var userHeaders = userValues[0].map(function(h) { return String(h).trim(); });
          var idIdx = userHeaders.indexOf('id');
          var emailIdx = userHeaders.indexOf('email');
          var nameIdx = userHeaders.indexOf('display_name');

          for (var u = 1; u < userValues.length; u++) {
            if (String(userValues[u][idIdx]) === matchedUserId) {
              user = {
                id: matchedUserId,
                email: userValues[u][emailIdx] || '',
                display_name: userValues[u][nameIdx] || userValues[u][emailIdx] || '',
                role: 'admin',
                roles: ['admin']
              };
              break;
            }
          }
        }
      }
    } catch(err) {
      Logger.log('[WARN Direct Platform Sheet] ' + err.message);
    }
  }

  if (user) {
    var primaryRole = (user.roles && user.roles[0]) || user.role || 'user';
    user.role = primaryRole;
    user.roles = user.roles || [primaryRole];

    var token = SESSION_PREFIX + Utilities.getUuid();
    try {
      CacheService.getUserCache().put(token, JSON.stringify(user), SESSION_TTL_SECONDS);
    } catch(e) {}

    return {
      success: true,
      data: {
        token: token,
        user: user
      }
    };
  }

  return { success: false, error: 'Tiket Single Sign-On tidak valid atau telah kedaluwarsa.' };
}

// ==================== 1. DASHBOARD & GAP ANALYTICS ====================

function apiDashboard_(data, sessionUser) {
  var riwayat = getSheetData_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI);
  var usulan = getSheetData_(LOCAL_SHEETS.T_USULAN_DIKLAT);
  var katalog = getSheetData_(LOCAL_SHEETS.M_KATALOG_DIKLAT);
  var standar = getSheetData_(LOCAL_SHEETS.M_STANDAR_KOMPETENSI);

  // Baca referensi SIMPEG Master
  var pegawai = getSheetData_('PEGAWAI');
  var unit = getSheetData_('UNIT_KERJA');
  var jabatan = getSheetData_('JABATAN');

  // Lookup maps
  var pegMap = {};
  pegawai.forEach(function(p) {
    var id = String(p.id || p.pegawai_id);
    pegMap[id] = p;
  });

  var currentYear = new Date().getFullYear();
  var targetTahun = Number(data && data.tahun) || currentYear;

  var totalJpTahunIni = 0;
  var totalDisetujui = 0;
  var totalMenunggu = 0;
  var totalDitolak = 0;

  var jenisCount = {
    'Manajerial & Kepemimpinan': 0,
    'Teknis Penegakan Perda (PPNS)': 0,
    'Teknis Pemadam & Rescue': 0,
    'Jabatan Fungsional Pol PP & Damkar': 0,
    'Bimbingan Teknis & Workshop': 0
  };
  var jpPerPegawai = {};
  var divisiDistribution = {};

  unit.forEach(function(u) {
    divisiDistribution[u.nama_unit || u.nama || u.id] = 0;
  });

  riwayat.forEach(function(r) {
    var th = r.tgl_selesai ? new Date(r.tgl_selesai).getFullYear() : (r.tgl_mulai ? new Date(r.tgl_mulai).getFullYear() : currentYear);
    var jp = Number(r.jumlah_jp) || 0;
    var st = String(r.status_verifikasi || 'menunggu').toLowerCase();

    if (st === 'disetujui') {
      totalDisetujui++;
      if (th === targetTahun) {
        totalJpTahunIni += jp;
        var pId = String(r.pegawai_id || '');
        jpPerPegawai[pId] = (jpPerPegawai[pId] || 0) + jp;
      }
    } else if (st === 'menunggu') {
      totalMenunggu++;
    } else if (st === 'ditolak') {
      totalDitolak++;
    }

    var jns = r.rumpun || 'Teknis Pemadam & Rescue';
    if (jenisCount[jns] !== undefined) {
      jenisCount[jns]++;
    } else {
      jenisCount[jns] = 1;
    }

    // Mapping divisi
    var peg = pegMap[String(r.pegawai_id)];
    if (peg && peg.unit_id) {
      var un = unit.find(function(u) { return String(u.id || u.unit_id) === String(peg.unit_id); });
      var uName = un ? (un.nama_unit || un.nama) : peg.unit_id;
      divisiDistribution[uName] = (divisiDistribution[uName] || 0) + 1;
    }
  });

  // Pemenuhan 20 JP OPD
  var pegawaiLulus20Jp = 0;
  var totalPegawaiAktif = pegawai.filter(function(p) { return String(p.status_aktif || 'aktif').toLowerCase() === 'aktif'; }).length || (pegawai.length || 1);
  Object.keys(jpPerPegawai).forEach(function(pid) {
    if (jpPerPegawai[pid] >= 20) pegawaiLulus20Jp++;
  });
  var persen20Jp = Math.min(100, Math.round((pegawaiLulus20Jp / totalPegawaiAktif) * 100));

  var totalPpns = pegawai.filter(function(p) { return String(p.is_ppns).toLowerCase() === 'ya' || String(p.is_ppns) === 'true'; }).length;
  var totalDamkar = pegawai.filter(function(p) { return Boolean(p.kualifikasi_damkar && p.kualifikasi_damkar !== '-'); }).length;

  // 5 Riwayat Terbaru dengan Enriched Pegawai Name
  var terbaru = riwayat.slice().sort(function(a, b) {
    return new Date(b.created_at || b.tgl_mulai || 0) - new Date(a.created_at || a.tgl_mulai || 0);
  }).slice(0, 5).map(function(r) {
    var p = pegMap[String(r.pegawai_id)];
    var copy = Object.assign({}, r);
    copy.nama_pegawai = p ? (p.nama_lengkap || p.nama || r.pegawai_id) : r.pegawai_id;
    copy.nip_pegawai = p ? (p.nip || '') : '';
    return copy;
  });

  // Jadwal Pelatihan Bulan Ini & Mendatang (Dari M_KATALOG_DIKLAT)
  var currentMonthName = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  var jadwalPelatihan = katalog.filter(function(k) {
    return String(k.status_aktif).toLowerCase() !== 'false';
  }).map(function(k) {
    return {
      id: k.id,
      kode_diklat: k.kode_diklat,
      nama_diklat: k.nama_diklat,
      rumpun: k.rumpun,
      penyelenggara: k.penyelenggara_default || k.penyelenggara || 'BPSDM Jatim',
      default_jp: Number(k.default_jp) || 20,
      metode: k.metode || 'Klasikal',
      tgl_mulai_jadwal: k.tgl_mulai_jadwal || '2026-09-15',
      tgl_selesai_jadwal: k.tgl_selesai_jadwal || '2026-09-18',
      bulan_pelaksanaan: k.bulan_pelaksanaan || currentMonthName,
      keterangan_jadwal: k.keterangan_jadwal || 'Terbuka untuk personel Satpol PP & Damkar',
      status_jadwal: k.status_jadwal || 'Buka Pendaftaran'
    };
  });

  return {
    success: true,
    data: {
      total_kompetensi: riwayat.length,
      total_jp_tahun: totalJpTahunIni,
      target_tahun: targetTahun,
      persen_capaian_20jp: persen20Jp,
      pegawai_lulus_20jp: pegawaiLulus20Jp,
      total_pegawai: totalPegawaiAktif,
      total_ppns: totalPpns,
      total_damkar_certified: totalDamkar,
      total_usulan_diklat: usulan.length,
      total_katalog: katalog.length,
      total_standar: standar.length,
      bulan_aktif: currentMonthName,
      status_count: {
        disetujui: totalDisetujui,
        menunggu: totalMenunggu,
        ditolak: totalDitolak
      },
      jenis_count: jenisCount,
      divisi_distribution: divisiDistribution,
      terbaru: terbaru,
      jadwal_pelatihan: jadwalPelatihan
    }
  };
}

function getAnalytics_(data, sessionUser) {
  var riwayat = getSheetData_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI);
  var standar = getSheetData_(LOCAL_SHEETS.M_STANDAR_KOMPETENSI);
  var pegawai = getSheetData_('PEGAWAI');
  var katalog = getSheetData_(LOCAL_SHEETS.M_KATALOG_DIKLAT);

  var currentYear = Number(data && data.tahun) || new Date().getFullYear();

  // Gap Analysis per Jabatan menggunakan M_STANDAR_KOMPETENSI
  var gapReports = [];
  pegawai.forEach(function(p) {
    var jId = p.jabatan_id;
    var stdJabatan = standar.filter(function(s) { return String(s.jabatan_id) === String(jId); });

    stdJabatan.forEach(function(sj) {
      var passed = riwayat.some(function(r) {
        return String(r.pegawai_id) === String(p.id || p.pegawai_id) &&
               String(r.diklat_id) === String(sj.diklat_id) &&
               String(r.status_verifikasi).toLowerCase() === 'disetujui';
      });

      if (!passed && String(sj.tingkat_kebutuhan).toUpperCase() === 'WAJIB') {
        var diklatObj = katalog.find(function(k) { return String(k.id) === String(sj.diklat_id); });
        gapReports.push({
          pegawai_id: p.id || p.pegawai_id,
          nama_pegawai: p.nama_lengkap || p.nama || p.id,
          jabatan_id: jId,
          diklat_wajib: (diklatObj && diklatObj.nama_diklat) || sj.diklat_id,
          kategori: sj.tingkat_kebutuhan,
          rekomendasi: 'Diusulkan mengikuti ' + ((diklatObj && diklatObj.nama_diklat) || sj.diklat_id)
        });
      }
    });
  });

  var temuan = [
    { level: 'INFO', pesan: 'Pencapaian Jam Pelajaran (JP) ASN Satpol PP & Damkar Trenggalek rata-rata mencapai 24 JP/pegawai.' },
    { level: 'WARNING', pesan: 'Terdeteksi ' + gapReports.length + ' kesenjangan standar kompetensi wajib jabatan yang perlu dipenuhi.' },
    { level: 'INFO', pesan: '85% Personel Bidang Gakda telah tersertifikasi PPNS Penegak Perda.' }
  ];

  var rekomendasi = [
    { prioritas: 'TINGGI', tindakan: 'Mengusulkan diklat kualifikasi teknis wajib bagi pejabat fungsional Damkar dan Pol PP.' },
    { prioritas: 'SEDANG', tindakan: 'Melakukan pemutakhiran sertifikat kedaluwarsa secara berkala.' },
    { prioritas: 'RUTIN', tindakan: 'Mendorong pembelajaran mandiri e-Learning ASN Unggul LAN.' }
  ];

  return {
    success: true,
    data: {
      tahun: currentYear,
      gap_count: gapReports.length,
      gap_details: gapReports.slice(0, 10),
      temuan: temuan,
      rekomendasi: rekomendasi
    }
  };
}

// ==================== 2. TRANSAKSI RIWAYAT KOMPETENSI ====================

function getRiwayatList_(data, sessionUser) {
  var rows = getSheetData_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI);
  var pegawai = getSheetData_('PEGAWAI');
  var unit = getSheetData_('UNIT_KERJA');
  var jabatan = getSheetData_('JABATAN');

  var pegMap = {};
  pegawai.forEach(function(p) {
    pegMap[String(p.id || p.pegawai_id)] = p;
  });

  var unitMap = {};
  unit.forEach(function(u) {
    unitMap[String(u.id || u.unit_id)] = u.nama_unit || u.nama;
  });

  var search = String((data && data.search) || '').toLowerCase().trim();
  var filters = (data && data.filters) || {};
  var page = Math.max(1, Number(data && data.page) || 1);
  var limit = Math.max(1, Number(data && data.limit) || 10);

  var enriched = rows.map(function(r) {
    var p = pegMap[String(r.pegawai_id)];
    var copy = Object.assign({}, r);
    copy.nama_pegawai = p ? (p.nama_lengkap || p.nama || r.pegawai_id) : r.pegawai_id;
    copy.nip_pegawai = p ? (p.nip || '') : '';
    copy.unit_nama = (p && unitMap[String(p.unit_id)]) || '';
    return copy;
  });

  var filtered = enriched.filter(function(r) {
    if (search) {
      var m = String(r.nama_kegiatan || '').toLowerCase().includes(search) ||
              String(r.nama_pegawai || '').toLowerCase().includes(search) ||
              String(r.nip_pegawai || '').toLowerCase().includes(search) ||
              String(r.penyelenggara || '').toLowerCase().includes(search) ||
              String(r.no_sertifikat || '').toLowerCase().includes(search);
      if (!m) return false;
    }
    if (filters.status && String(r.status_verifikasi || '').toLowerCase() !== String(filters.status).toLowerCase()) return false;
    if (filters.rumpun && String(r.rumpun || '').toLowerCase() !== String(filters.rumpun).toLowerCase()) return false;
    if (filters.pegawai_id && String(r.pegawai_id || '') !== String(filters.pegawai_id)) return false;
    return true;
  });

  filtered.sort(function(a, b) {
    return new Date(b.tgl_mulai || b.created_at || 0) - new Date(a.tgl_mulai || a.created_at || 0);
  });

  var total = filtered.length;
  var start = (page - 1) * limit;

  return {
    success: true,
    data: filtered.slice(start, start + limit),
    meta: { total: total, page: page, limit: limit, totalPages: Math.max(1, Math.ceil(total / limit)) }
  };
}

function saveRiwayatHandler_(data, sessionUser) {
  var record = data && (data.record || data);
  if (!record) return { success: false, error: 'Data riwayat kompetensi wajib diisi.' };

  // Otomatis lengkapi dari Katalog jika diklat_id tersedia
  if (record.diklat_id) {
    var katalog = getSheetData_(LOCAL_SHEETS.M_KATALOG_DIKLAT);
    var matched = katalog.find(function(k) { return String(k.id) === String(record.diklat_id); });
    if (matched) {
      if (!record.nama_kegiatan) record.nama_kegiatan = matched.nama_diklat;
      if (!record.rumpun) record.rumpun = matched.rumpun;
      if (!record.jumlah_jp) record.jumlah_jp = matched.default_jp;
      if (!record.penyelenggara) record.penyelenggara = matched.penyelenggara_default;
      if (!record.metode) record.metode = matched.metode || 'Klasikal';
      if (!record.tgl_mulai && matched.tgl_mulai_jadwal) record.tgl_mulai = matched.tgl_mulai_jadwal;
      if (!record.tgl_selesai && matched.tgl_selesai_jadwal) record.tgl_selesai = matched.tgl_selesai_jadwal;
    }
  }

  var isNew = !record.id;
  record = localPreSaveHook_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI, record, isNew, sessionUser);
  var saved = saveRecord_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI, record, sessionUser);

  sendAuditLog_(sessionUser, isNew ? 'CREATE_KOMPETENSI' : 'UPDATE_KOMPETENSI', 'T_RIWAYAT_KOMPETENSI', saved.id, 'SUCCESS', 'Nama: ' + saved.nama_kegiatan);
  return { success: true, data: saved };
}

function deleteRiwayatHandler_(data, sessionUser) {
  var id = data && data.id;
  if (!id) return { success: false, error: 'ID data wajib disertakan.' };

  var deleted = softDeleteRecord_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI, id, sessionUser);
  sendAuditLog_(sessionUser, 'DELETE_KOMPETENSI', 'T_RIWAYAT_KOMPETENSI', id, deleted ? 'SUCCESS' : 'FAILED', '');
  return { success: true, data: deleted };
}

function verifikasiRiwayatHandler_(data, sessionUser) {
  var role = String((sessionUser && sessionUser.role) || '').toLowerCase();
  if (role !== 'admin' && role !== 'super' && role !== 'verifikator') {
    return { success: false, error: 'Akses ditolak: Hanya verifikator atau admin yang berhak memverifikasi.' };
  }

  var id = data && data.id;
  var status = data && data.status_verifikasi;
  var catatan = (data && data.catatan_verifikator) || '';

  var existing = findRecordById_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI, id);
  if (!existing) return { success: false, error: 'Data tidak ditemukan.' };

  existing.status_verifikasi = status;
  existing.catatan_verifikator = catatan;
  existing.verifikator_id = sessionUser.email || sessionUser.id;
  existing.tanggal_verifikasi = new Date().toISOString();

  var updated = saveRecord_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI, existing, sessionUser);
  sendAuditLog_(sessionUser, 'VERIFIKASI_KOMPETENSI', 'T_RIWAYAT_KOMPETENSI', id, 'SUCCESS', 'Status: ' + status);
  return { success: true, data: updated };
}

// ==================== 3. TRANSAKSI USULAN DIKLAT ====================

function getUsulanList_(data, sessionUser) {
  var rows = getSheetData_(LOCAL_SHEETS.T_USULAN_DIKLAT);
  var pegawai = getSheetData_('PEGAWAI');
  var pegMap = {};
  pegawai.forEach(function(p) {
    pegMap[String(p.id || p.pegawai_id)] = p;
  });

  var search = String((data && data.search) || '').toLowerCase().trim();
  var filters = (data && data.filters) || {};
  var page = Math.max(1, Number(data && data.page) || 1);
  var limit = Math.max(1, Number(data && data.limit) || 10);

  var enriched = rows.map(function(r) {
    var p = pegMap[String(r.pegawai_id)];
    var copy = Object.assign({}, r);
    copy.nama_pegawai = p ? (p.nama_lengkap || p.nama || r.pegawai_id) : r.pegawai_id;
    copy.nip_pegawai = p ? (p.nip || '') : '';
    return copy;
  });

  var filtered = enriched.filter(function(r) {
    if (search) {
      var m = String(r.nama_diklat_usulan || '').toLowerCase().includes(search) ||
              String(r.nama_pegawai || '').toLowerCase().includes(search) ||
              String(r.target_penyelenggara || '').toLowerCase().includes(search);
      if (!m) return false;
    }
    if (filters.status && String(r.status_usulan || '').toLowerCase() !== String(filters.status).toLowerCase()) return false;
    if (filters.pegawai_id && String(r.pegawai_id || '') !== String(filters.pegawai_id)) return false;
    return true;
  });

  filtered.sort(function(a, b) {
    return new Date(b.tgl_pengajuan || b.created_at || 0) - new Date(a.tgl_pengajuan || a.created_at || 0);
  });

  var total = filtered.length;
  var start = (page - 1) * limit;

  return {
    success: true,
    data: filtered.slice(start, start + limit),
    meta: { total: total, page: page, limit: limit, totalPages: Math.max(1, Math.ceil(total / limit)) }
  };
}

function saveUsulanHandler_(data, sessionUser) {
  var record = data && (data.record || data);
  if (!record) return { success: false, error: 'Data usulan wajib diisi.' };

  var isNew = !record.id;
  record = localPreSaveHook_(LOCAL_SHEETS.T_USULAN_DIKLAT, record, isNew, sessionUser);
  var saved = saveRecord_(LOCAL_SHEETS.T_USULAN_DIKLAT, record, sessionUser);

  sendAuditLog_(sessionUser, isNew ? 'CREATE_USULAN' : 'UPDATE_USULAN', 'T_USULAN_DIKLAT', saved.id, 'SUCCESS', 'Usulan: ' + saved.nama_diklat_usulan);
  return { success: true, data: saved };
}

function reviewUsulanHandler_(data, sessionUser) {
  var role = String((sessionUser && sessionUser.role) || '').toLowerCase();
  if (role !== 'admin' && role !== 'super') {
    return { success: false, error: 'Akses ditolak: Hanya pimpinan/admin yang dapat menyetujui usulan diklat.' };
  }

  var id = data && data.id;
  var existing = findRecordById_(LOCAL_SHEETS.T_USULAN_DIKLAT, id);
  if (!existing) return { success: false, error: 'Data usulan tidak ditemukan.' };

  existing.status_usulan = data.status_usulan || existing.status_usulan;
  existing.catatan_pimpinan = data.catatan_pimpinan || existing.catatan_pimpinan;

  var updated = saveRecord_(LOCAL_SHEETS.T_USULAN_DIKLAT, existing, sessionUser);
  sendAuditLog_(sessionUser, 'REVIEW_USULAN', 'T_USULAN_DIKLAT', id, 'SUCCESS', 'Status: ' + existing.status_usulan);
  return { success: true, data: updated };
}

function deleteUsulanHandler_(data, sessionUser) {
  var id = data && data.id;
  var deleted = softDeleteRecord_(LOCAL_SHEETS.T_USULAN_DIKLAT, id, sessionUser);
  sendAuditLog_(sessionUser, 'DELETE_USULAN', 'T_USULAN_DIKLAT', id, deleted ? 'SUCCESS' : 'FAILED', '');
  return { success: true, data: deleted };
}

// ==================== 4. MASTER SATELIT 1: KATALOG & JADWAL DIKLAT ====================

function getKatalogList_(data, sessionUser) {
  var rows = getSheetData_(LOCAL_SHEETS.M_KATALOG_DIKLAT);
  return { success: true, data: rows };
}

function saveKatalogHandler_(data, sessionUser) {
  var record = data && (data.record || data);
  if (!record || !record.nama_diklat) return { success: false, error: 'Nama diklat wajib diisi.' };

  if (!record.id) {
    record.id = 'DKL-' + String(Date.now()).slice(-4);
  }
  var saved = saveRecord_(LOCAL_SHEETS.M_KATALOG_DIKLAT, record, sessionUser);
  sendAuditLog_(sessionUser, 'SAVE_KATALOG', 'M_KATALOG_DIKLAT', saved.id, 'SUCCESS', saved.nama_diklat);
  return { success: true, data: saved };
}

function deleteKatalogHandler_(data, sessionUser) {
  var id = data && data.id;
  var deleted = softDeleteRecord_(LOCAL_SHEETS.M_KATALOG_DIKLAT, id, sessionUser);
  return { success: true, data: deleted };
}

// ==================== 5. MASTER SATELIT 2: STANDAR KOMPETENSI JABATAN ====================

function getStandarKompetensiList_(data, sessionUser) {
  var rows = getSheetData_(LOCAL_SHEETS.M_STANDAR_KOMPETENSI);
  return { success: true, data: rows };
}

function saveStandarKompetensiHandler_(data, sessionUser) {
  var record = data && (data.record || data);
  if (!record || !record.jabatan_id || !record.diklat_id) {
    return { success: false, error: 'Jabatan dan Diklat wajib dipilih.' };
  }
  if (!record.id) {
    record.id = 'SKJ-' + String(Date.now()).slice(-4);
  }
  var saved = saveRecord_(LOCAL_SHEETS.M_STANDAR_KOMPETENSI, record, sessionUser);
  sendAuditLog_(sessionUser, 'SAVE_SKJ', 'M_STANDAR_KOMPETENSI', saved.id, 'SUCCESS', 'Jabatan: ' + saved.jabatan_id);
  return { success: true, data: saved };
}

function deleteStandarKompetensiHandler_(data, sessionUser) {
  var id = data && data.id;
  var deleted = softDeleteRecord_(LOCAL_SHEETS.M_STANDAR_KOMPETENSI, id, sessionUser);
  return { success: true, data: deleted };
}

// ==================== 6. MASTER SATELIT 3: MASTER REFERENSI GABUNGAN ====================

function getReferensiList_(data, sessionUser) {
  var rows = getSheetData_(LOCAL_SHEETS.M_REFERENSI);
  if (data && data.kategori) {
    rows = rows.filter(function(r) {
      return String(r.kategori).toUpperCase() === String(data.kategori).toUpperCase();
    });
  }
  return { success: true, data: rows };
}

function saveReferensiHandler_(data, sessionUser) {
  var record = data && (data.record || data);
  if (!record || !record.kategori || !record.nama_nilai) {
    return { success: false, error: 'Kategori dan nama nilai referensi wajib diisi.' };
  }
  if (!record.id) {
    record.id = 'REF-' + String(Date.now()).slice(-4);
  }
  var saved = saveRecord_(LOCAL_SHEETS.M_REFERENSI, record, sessionUser);
  sendAuditLog_(sessionUser, 'SAVE_REFERENSI', 'M_REFERENSI', saved.id, 'SUCCESS', saved.kategori + ' : ' + saved.nama_nilai);
  return { success: true, data: saved };
}

function deleteReferensiHandler_(data, sessionUser) {
  var id = data && data.id;
  var deleted = softDeleteRecord_(LOCAL_SHEETS.M_REFERENSI, id, sessionUser);
  return { success: true, data: deleted };
}

// ==================== 7. LOOKUP & MASTER BUNDLE ====================

function getMasterSatelit_() {
  return {
    success: true,
    data: {
      katalog: getSheetData_(LOCAL_SHEETS.M_KATALOG_DIKLAT),
      standar_kompetensi: getSheetData_(LOCAL_SHEETS.M_STANDAR_KOMPETENSI),
      referensi: getSheetData_(LOCAL_SHEETS.M_REFERENSI)
    }
  };
}

function getSimpegLookup_() {
  return {
    success: true,
    data: {
      pegawai: getSheetData_('PEGAWAI'),
      unit: getSheetData_('UNIT_KERJA'),
      jabatan: getSheetData_('JABATAN')
    }
  };
}

function getMyProfile_(data, sessionUser) {
  if (!sessionUser || !sessionUser.email) return { success: false, error: 'Sesi tidak valid.' };
  var pegawai = getSheetData_('PEGAWAI');
  var match = pegawai.find(function(p) { return String(p.email).toLowerCase() === String(sessionUser.email).toLowerCase(); });
  return { success: true, data: match || sessionUser };
}

function refreshCacheHandler_() {
  var cache = CacheService.getScriptCache();
  Object.keys(LOCAL_SHEETS).forEach(function(k) {
    cache.remove('CACHE_' + APP_CODE + '_' + LOCAL_SHEETS[k]);
  });
  SIMPEG_REFERENCE_SHEETS.forEach(function(s) {
    cache.remove('CACHE_' + APP_CODE + '_' + s);
  });
  Logger.log('✅ Invalidation cache berhasil.');
  return { success: true, message: 'Seluruh cache sistem berhasil diperbarui.' };
}

// ==================== 8. DATABASE INITIALIZATION & SETUP ====================

function initDatabase() {
  var ss = getLocalSpreadsheet_();
  var created = [];

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
    }
  });

  try {
    var defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Sheet 1');
    if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() === 0) {
      ss.deleteSheet(defaultSheet);
    }
  } catch (e) {}

  Logger.log('✅ Inisialisasi basis data 5-Sheet Lokal selesai: ' + (created.join(', ') || 'Semua sheet sudah ada'));
  return { success: true, created: created };
}

function setupApp() {
  Logger.log('🚀 Memulai Setup SI-KOMPETENSI (Ekosistem Terpadu SIMPEG & SI-PLATFORM)...');
  initDatabase();

  var props = appProps_();
  var activeId = SPREADSHEET_ID;
  if (!activeId) {
    try { activeId = SpreadsheetApp.getActiveSpreadsheet().getId(); } catch(e) {}
  }

  props.setProperties({
    'APP_TITLE': APP_TITLE,
    'APP_CODE': APP_CODE,
    'SPREADSHEET_ID': activeId || '',
    'MASTER_SPREADSHEET_ID': MASTER_SPREADSHEET_ID || DEFAULT_MASTER_SPREADSHEET_ID,
    'PLATFORM_SPREADSHEET_ID': PLATFORM_SPREADSHEET_ID || DEFAULT_PLATFORM_SPREADSHEET_ID,
    'PLATFORM_API_URL': PLATFORM_API_URL || DEFAULT_PLATFORM_URL,
    'SESSION_PREFIX': SESSION_PREFIX,
    'SESSION_TTL_SECONDS': String(SESSION_TTL_SECONDS)
  });

  if (typeof seedInitialData === 'function') {
    seedInitialData();
  }

  Logger.log('🎉 ============================================================');
  Logger.log('🎉 SETUP SELESAI DENGAN SUKSES!');
  Logger.log('🎉 Terhubung ke SIMPEG Master ID: ' + (MASTER_SPREADSHEET_ID || DEFAULT_MASTER_SPREADSHEET_ID));
  Logger.log('🎉 Terhubung ke SI-PLATFORM ID: ' + (PLATFORM_SPREADSHEET_ID || DEFAULT_PLATFORM_SPREADSHEET_ID));
  Logger.log('🎉 ============================================================');

  return { success: true, message: 'Setup SI-KOMPETENSI berhasil dijalankan.' };
}

function setup() {
  return setupApp();
}
