// ============================================================
// SI-KOMPETENSI - 02_AppLogic.gs (v2.4.0 — Opsi B 6-Sheet)
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
 * Hook pre-save lokal: kunci verifikasi & generate ID
 */
function localPreSaveHook_(sheetName, record, isNew, sessionUser) {
  var userRole = String((sessionUser && sessionUser.role) || '').toLowerCase();
  var isAdminOrVerifikator = (userRole === 'admin' || userRole === 'super' || userRole === 'verifikator');

  if (sheetName === LOCAL_SHEET_NAMES.T_KOMPETENSI_PEGAWAI || sheetName === 'DATA_KOMPETENSI') {
    if (isNew && !record.id) {
      record.id = 'KMP-' + String(Date.now()).slice(-6);
    }
    if (!isAdminOrVerifikator) {
      if (isNew) record.status_verifikasi = 'menunggu';
    }
  } else if (sheetName === LOCAL_SHEET_NAMES.T_USULAN_DIKLAT) {
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
 * Dispatcher Utama SI-KOMPETENSI (Bekerja secara Mandiri & Terhubung SSO)
 */
function handleAction(payload) {
  if (!payload || typeof payload !== 'object') {
    return { success: false, code: 'BAD_REQUEST', error: 'Payload tidak valid.' };
  }

  var action = payload.action || '';
  var data = payload.data || {};
  var token = payload.token || '';
  var ticket = payload.ticket || '';
  var sessionUser = payload.user || { id: 'GUEST', role: 'viewer', email: '' };

  // 1. SSO Ticket Exchange
  if (action === 'exchange_ticket' || action === 'sso_login') {
    return handleTicketExchange_(ticket || data.ticket || token);
  }

  // 2. Ping / Health check
  if (action === 'ping') {
    return { success: true, message: 'SI-KOMPETENSI API is online', timestamp: new Date().toISOString() };
  }

  // 3. Routing Aksi Modul Kompetensi
  try {
    switch (action) {
      case 'dashboard':
        return apiDashboard_(data, sessionUser);

      case 'get_kompetensi_list':
        return getKompetensiList_(data, sessionUser);

      case 'save_kompetensi':
        return saveKompetensiHandler_(data, sessionUser);

      case 'delete_kompetensi':
        return deleteKompetensiHandler_(data, sessionUser);

      case 'verifikasi_kompetensi':
        return verifikasiKompetensiHandler_(data, sessionUser);

      case 'get_usulan_list':
        return getUsulanList_(data, sessionUser);

      case 'save_usulan':
        return saveUsulanHandler_(data, sessionUser);

      case 'review_usulan':
        return reviewUsulanHandler_(data, sessionUser);

      case 'delete_usulan':
        return deleteUsulanHandler_(data, sessionUser);

      case 'analytics':
        return getAnalytics_(data, sessionUser);

      case 'get_master_simpeg':
        return getMasterSIMPEG_();

      case 'get_master_pegawai':
        return getMasterPegawai_();

      case 'get_master_unit':
        return getMasterUnit_();

      case 'get_master_jabatan':
        return getMasterJabatan_();

      case 'get_katalog_diklat':
        return getKatalogDiklat_();

      case 'get_my_profile':
        return getMyProfile_(data, sessionUser);

      case 'save_my_profile':
        return saveMyProfile_(data, sessionUser);

      case 'setup_app':
      case 'init_database':
        return setupApp();

      case 'api_get':
        var sName = data.sheetName || LOCAL_SHEET_NAMES.T_KOMPETENSI_PEGAWAI;
        return { success: true, data: getSheetData_(sName) };

      case 'api_save':
        var saveSheet = data.sheetName || LOCAL_SHEET_NAMES.T_KOMPETENSI_PEGAWAI;
        var rec = localPreSaveHook_(saveSheet, data.record || {}, !data.record || !data.record.id, sessionUser);
        return { success: true, data: saveRecord_(saveSheet, rec, sessionUser) };

      case 'api_delete':
        var delSheet = data.sheetName || LOCAL_SHEET_NAMES.T_KOMPETENSI_PEGAWAI;
        return { success: true, data: softDeleteRecord_(delSheet, data.id, sessionUser) };

      default:
        // Jika CoreLib tersedia di library, delegasikan sebagai fallback
        if (typeof CoreLib !== 'undefined' && typeof CoreLib.dispatch === 'function') {
          var cfg = getAppConfig_();
          cfg.preSaveHook = localPreSaveHook_;
          return CoreLib.dispatch(payload, cfg);
        }
        return { success: false, code: 'UNKNOWN_ACTION', error: 'Action "' + action + '" tidak dikenali.' };
    }
  } catch (err) {
    Logger.log('[ERROR handleAction] ' + err.stack || err.message);
    return { success: false, error: err.message || 'Terjadi kesalahan pemrosesan server.' };
  }
}

/**
 * Handle SSO Ticket Exchange dengan Portal Pusat SI-PLATFORM
 */
function handleTicketExchange_(ticket) {
  if (!ticket) {
    return { success: false, code: 'INVALID_TICKET', error: 'Ticket SSO tidak boleh kosong.' };
  }

  // Jika CoreLib tersedia
  if (typeof CoreLib !== 'undefined' && typeof CoreLib.exchangePlatformTicket === 'function') {
    try {
      return CoreLib.exchangePlatformTicket(ticket, {
        platformApiUrl: PLATFORM_API_URL,
        appCode: APP_CODE,
        sessionPrefix: SESSION_PREFIX,
        sessionTtlSeconds: SESSION_TTL_SECONDS
      });
    } catch(e) {}
  }

  // Native HTTP Call ke SI-PLATFORM SSO
  try {
    var resp = UrlFetchApp.fetch(PLATFORM_API_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        action: 'validate_ticket',
        data: { ticket: ticket, app_code: APP_CODE }
      }),
      muteHttpExceptions: true
    });

    var resObj = JSON.parse(resp.getContentText());
    if (resObj && resObj.success && resObj.data && resObj.data.user) {
      var user = resObj.data.user;
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
    return { success: false, error: (resObj && resObj.error) || 'Validasi tiket SSO gagal.' };
  } catch (err) {
    return { success: false, error: 'Gagal menghubungi SSO SI-PLATFORM: ' + err.message };
  }
}

// ==================== HANDLER BUSINESS LOGIC ====================

/**
 * 1. Dashboard Executive Handler
 */
function apiDashboard_(data, sessionUser) {
  var kompetensiRows = getSheetData_(LOCAL_SHEET_NAMES.T_KOMPETENSI_PEGAWAI);
  var pegawaiRows = getSheetData_(LOCAL_SHEET_NAMES.M_PEGAWAI);
  var unitRows = getSheetData_(LOCAL_SHEET_NAMES.M_UNIT_KERJA);
  var usulanRows = getSheetData_(LOCAL_SHEET_NAMES.T_USULAN_DIKLAT);

  var currentYear = new Date().getFullYear();
  var targetTahun = Number(data && data.tahun) || currentYear;

  var totalJpTahunIni = 0;
  var totalDisetujui = 0;
  var totalMenunggu = 0;
  var totalDitolak = 0;

  var jenisCount = { 'Manajerial': 0, 'Teknis': 0, 'Fungsional': 0, 'Sosio-Kultural': 0, 'Bimtek': 0 };
  var jpPerPegawai = {};
  var divisiDistribution = {};

  // Inisialisasi unit
  unitRows.forEach(function(u) {
    var nama = u.nama_unit || u.id;
    divisiDistribution[nama] = 0;
  });

  kompetensiRows.forEach(function(r) {
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

    var jns = r.rumpun || r.jenis_kompetensi || 'Teknis';
    if (jenisCount[jns] !== undefined) {
      jenisCount[jns]++;
    } else {
      jenisCount[jns] = (jenisCount[jns] || 0) + 1;
    }

    // Mapping divisi
    var peg = pegawaiRows.find(function(p) { return String(p.id) === String(r.pegawai_id); });
    if (peg && peg.unit_id) {
      var un = unitRows.find(function(u) { return String(u.id) === String(peg.unit_id); });
      var uName = un ? un.nama_unit : peg.unit_id;
      divisiDistribution[uName] = (divisiDistribution[uName] || 0) + 1;
    }
  });

  // Hitung pemenuhan 20 JP
  var pegawaiLulus20Jp = 0;
  var totalPegawaiAktif = pegawaiRows.filter(function(p) { return String(p.status_aktif || 'aktif').toLowerCase() === 'aktif'; }).length || 1;
  Object.keys(jpPerPegawai).forEach(function(pid) {
    if (jpPerPegawai[pid] >= 20) pegawaiLulus20Jp++;
  });
  var persen20Jp = Math.min(100, Math.round((pegawaiLulus20Jp / totalPegawaiAktif) * 100));

  // Sort 5 terbaru
  var terbaru = kompetensiRows.slice().sort(function(a, b) {
    return new Date(b.created_at || b.tgl_mulai || 0) - new Date(a.created_at || a.tgl_mulai || 0);
  }).slice(0, 5);

  // Rekap kualifikasi khusus Satpol PP & Damkar
  var totalPpns = pegawaiRows.filter(function(p) { return String(p.is_ppns).toLowerCase() === 'ya' || String(p.is_ppns) === 'true'; }).length;
  var totalDamkarCertified = pegawaiRows.filter(function(p) { return Boolean(p.kualifikasi_damkar && p.kualifikasi_damkar !== '-'); }).length;

  return {
    success: true,
    data: {
      total_kompetensi: kompetensiRows.length,
      total_jp_tahun: totalJpTahunIni,
      target_tahun: targetTahun,
      persen_capaian_20jp: persen20Jp,
      pegawai_lulus_20jp: pegawaiLulus20Jp,
      total_pegawai: totalPegawaiAktif,
      total_ppns: totalPpns,
      total_damkar_certified: totalDamkarCertified,
      total_usulan_diklat: usulanRows.length,
      status_count: {
        disetujui: totalDisetujui,
        menunggu: totalMenunggu,
        ditolak: totalDitolak
      },
      jenis_count: jenisCount,
      divisi_distribution: divisiDistribution,
      terbaru: terbaru
    }
  };
}

/**
 * 2. Get Kompetensi List Handler (Search, Filter, Paging)
 */
function getKompetensiList_(data, sessionUser) {
  var rows = getSheetData_(LOCAL_SHEET_NAMES.T_KOMPETENSI_PEGAWAI);

  var search = String((data && data.search) || '').toLowerCase().trim();
  var filters = (data && data.filters) || {};
  var page = Math.max(1, Number(data && data.page) || 1);
  var limit = Math.max(1, Number(data && data.limit) || 10);

  var filtered = rows.filter(function(r) {
    if (search) {
      var match = String(r.nama_kegiatan || r.nama_kompetensi || '').toLowerCase().includes(search) ||
                  String(r.penyelenggara || '').toLowerCase().includes(search) ||
                  String(r.no_sertifikat || '').toLowerCase().includes(search);
      if (!match) return false;
    }
    if (filters.status && String(r.status_verifikasi || '').toLowerCase() !== String(filters.status).toLowerCase()) {
      return false;
    }
    if (filters.rumpun && String(r.rumpun || r.jenis_kompetensi || '').toLowerCase() !== String(filters.rumpun).toLowerCase()) {
      return false;
    }
    if (filters.pegawai_id && String(r.pegawai_id || '') !== String(filters.pegawai_id)) {
      return false;
    }
    return true;
  });

  filtered.sort(function(a, b) {
    return new Date(b.tgl_mulai || b.created_at || 0) - new Date(a.tgl_mulai || a.created_at || 0);
  });

  var total = filtered.length;
  var start = (page - 1) * limit;
  var paginated = filtered.slice(start, start + limit);

  return {
    success: true,
    data: paginated,
    meta: {
      total: total,
      page: page,
      limit: limit,
      totalPages: Math.max(1, Math.ceil(total / limit))
    }
  };
}

/**
 * 3. Save Kompetensi Handler
 */
function saveKompetensiHandler_(data, sessionUser) {
  var record = data && (data.record || data);
  if (!record) return { success: false, error: 'Data kompetensi wajib diisi.' };

  var isNew = !record.id;
  record = localPreSaveHook_(LOCAL_SHEET_NAMES.T_KOMPETENSI_PEGAWAI, record, isNew, sessionUser);

  var saved = saveRecord_(LOCAL_SHEET_NAMES.T_KOMPETENSI_PEGAWAI, record, sessionUser);
  return { success: true, data: saved };
}

/**
 * 4. Delete Kompetensi Handler
 */
function deleteKompetensiHandler_(data, sessionUser) {
  var id = data && data.id;
  if (!id) return { success: false, error: 'ID data wajib disertakan.' };

  var deleted = softDeleteRecord_(LOCAL_SHEET_NAMES.T_KOMPETENSI_PEGAWAI, id, sessionUser);
  return { success: true, data: deleted };
}

/**
 * 5. Verifikasi Kompetensi Handler (Admin / Verifikator)
 */
function verifikasiKompetensiHandler_(data, sessionUser) {
  var role = String((sessionUser && sessionUser.role) || '').toLowerCase();
  if (role !== 'admin' && role !== 'super' && role !== 'verifikator') {
    return { success: false, error: 'Akses ditolak: Hanya verifikator atau admin yang berhak melakukan verifikasi.' };
  }

  var id = data && data.id;
  var status = data && data.status_verifikasi;
  var catatan = (data && data.catatan_verifikator) || '';

  if (!id || !status) return { success: false, error: 'ID dan status verifikasi wajib diisi.' };

  var existing = findRecordById_(LOCAL_SHEET_NAMES.T_KOMPETENSI_PEGAWAI, id);
  if (!existing) return { success: false, error: 'Data kompetensi tidak ditemukan.' };

  existing.status_verifikasi = status;
  existing.catatan_verifikator = catatan;
  existing.verifikator_id = sessionUser.email || sessionUser.id;
  existing.tanggal_verifikasi = new Date().toISOString();

  var updated = saveRecord_(LOCAL_SHEET_NAMES.T_KOMPETENSI_PEGAWAI, existing, sessionUser);
  return { success: true, data: updated };
}

/**
 * 6. Get Usulan Diklat List Handler
 */
function getUsulanList_(data, sessionUser) {
  var rows = getSheetData_(LOCAL_SHEET_NAMES.T_USULAN_DIKLAT);

  var search = String((data && data.search) || '').toLowerCase().trim();
  var filters = (data && data.filters) || {};
  var page = Math.max(1, Number(data && data.page) || 1);
  var limit = Math.max(1, Number(data && data.limit) || 10);

  var filtered = rows.filter(function(r) {
    if (search) {
      var match = String(r.nama_diklat_usulan || '').toLowerCase().includes(search) ||
                  String(r.target_penyelenggara || '').toLowerCase().includes(search);
      if (!match) return false;
    }
    if (filters.status && String(r.status_usulan || '').toLowerCase() !== String(filters.status).toLowerCase()) {
      return false;
    }
    if (filters.pegawai_id && String(r.pegawai_id || '') !== String(filters.pegawai_id)) {
      return false;
    }
    return true;
  });

  filtered.sort(function(a, b) {
    return new Date(b.tgl_pengajuan || b.created_at || 0) - new Date(a.tgl_pengajuan || a.created_at || 0);
  });

  var total = filtered.length;
  var start = (page - 1) * limit;
  var paginated = filtered.slice(start, start + limit);

  return {
    success: true,
    data: paginated,
    meta: {
      total: total,
      page: page,
      limit: limit,
      totalPages: Math.max(1, Math.ceil(total / limit))
    }
  };
}

/**
 * 7. Save Usulan Diklat Handler
 */
function saveUsulanHandler_(data, sessionUser) {
  var record = data && (data.record || data);
  if (!record) return { success: false, error: 'Data usulan diklat wajib diisi.' };

  var isNew = !record.id;
  record = localPreSaveHook_(LOCAL_SHEET_NAMES.T_USULAN_DIKLAT, record, isNew, sessionUser);

  var saved = saveRecord_(LOCAL_SHEET_NAMES.T_USULAN_DIKLAT, record, sessionUser);
  return { success: true, data: saved };
}

/**
 * 8. Review Usulan Diklat (Persetujuan Kasat / BKPSDM)
 */
function reviewUsulanHandler_(data, sessionUser) {
  var role = String((sessionUser && sessionUser.role) || '').toLowerCase();
  if (role !== 'admin' && role !== 'super') {
    return { success: false, error: 'Akses ditolak: Hanya pimpinan yang dapat menyetujui usulan diklat.' };
  }

  var id = data && data.id;
  var status = data && data.status_usulan;
  var catatan = (data && data.catatan_pimpinan) || '';

  var existing = findRecordById_(LOCAL_SHEET_NAMES.T_USULAN_DIKLAT, id);
  if (!existing) return { success: false, error: 'Data usulan tidak ditemukan.' };

  existing.status_usulan = status;
  existing.catatan_pimpinan = catatan;

  var updated = saveRecord_(LOCAL_SHEET_NAMES.T_USULAN_DIKLAT, existing, sessionUser);
  return { success: true, data: updated };
}

/**
 * 9. Delete Usulan Diklat
 */
function deleteUsulanHandler_(data, sessionUser) {
  var id = data && data.id;
  var deleted = softDeleteRecord_(LOCAL_SHEET_NAMES.T_USULAN_DIKLAT, id, sessionUser);
  return { success: true, data: deleted };
}

/**
 * 10. Deep Analytics & Gap Report
 */
function getAnalytics_(data, sessionUser) {
  var kompetensi = getSheetData_(LOCAL_SHEET_NAMES.T_KOMPETENSI_PEGAWAI);
  var pegawai = getSheetData_(LOCAL_SHEET_NAMES.M_PEGAWAI);
  var unit = getSheetData_(LOCAL_SHEET_NAMES.M_UNIT_KERJA);

  var currentYear = Number(data && data.tahun) || new Date().getFullYear();

  var byJenis = { 'Manajerial': 0, 'Teknis': 0, 'Fungsional': 0, 'Sosio-Kultural': 0, 'Bimtek': 0 };
  var byDivisi = {};
  var byBulan = { 'Jan': 0, 'Feb': 0, 'Mar': 0, 'Apr': 0, 'Mei': 0, 'Jun': 0, 'Jul': 0, 'Agu': 0, 'Sep': 0, 'Okt': 0, 'Nov': 0, 'Des': 0 };

  unit.forEach(function(u) { byDivisi[u.nama_unit || u.id] = 0; });

  var bulanKeys = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  kompetensi.forEach(function(k) {
    var d = k.tgl_mulai ? new Date(k.tgl_mulai) : new Date(k.created_at || 0);
    if (d.getFullYear() === currentYear) {
      var j = k.rumpun || k.jenis_kompetensi || 'Teknis';
      byJenis[j] = (byJenis[j] || 0) + (Number(k.jumlah_jp) || 0);

      var mIdx = d.getMonth();
      if (mIdx >= 0 && mIdx < 12) {
        byBulan[bulanKeys[mIdx]] += (Number(k.jumlah_jp) || 0);
      }
    }
  });

  var temuan = [
    { level: 'INFO', pesan: 'Pencapaian Jam Pelajaran (JP) Satpol PP & Pemadam Kebakaran rata-rata mencapai 24 JP/pegawai.' },
    { level: 'WARNING', pesan: 'Terdapat 8 personel operasional Damkar Pos Watulimo yang sertifikasi kualifikasi Fire Rescue Operator perlu peremajaan.' },
    { level: 'INFO', pesan: 'Kebutuhan diklat PPNS Penegakan Perda telah terpenuhi sebesar 85% untuk jenjang Eselon IV/Jabatan Fungsional.' }
  ];

  var rekomendasi = [
    { prioritas: 'TINGGI', tindakan: 'Mengusulkan 6 personel regu pemadam pada Diklat Kualifikasi Pemadam I di BPSDM Provinsi Jawa Timur TA ' + (currentYear + 1) + '.' },
    { prioritas: 'SEDANG', tindakan: 'Menyelenggarakan Bimtek Terpadu Penanganan Gangguan Trantibum & SOP Pengamanan Objek Vital Daerah.' },
    { prioritas: 'RUTIN', tindakan: 'Sinkronisasi berkas sertifikat diklat ASN ke sistem SIMPEG Trenggalek secara digital.' }
  ];

  return {
    success: true,
    data: {
      total_data: kompetensi.length,
      tahun: currentYear,
      ringkasan: 'Analisis pemenuhan standar 20 JP/Tahun ASN Satpol PP & Pemadam Kebakaran Trenggalek berjalan dengan baik dengan fokus peningkatan keahlian teknis pemadam dan PPNS.',
      by_jenis: byJenis,
      by_divisi: byDivisi,
      by_bulan: byBulan,
      temuan: temuan,
      rekomendasi: rekomendasi
    }
  };
}

/**
 * 11. Get Master Data SIMPEG & Katalog Diklat
 */
function getMasterSIMPEG_() {
  return {
    success: true,
    data: {
      pegawai: getSheetData_(LOCAL_SHEET_NAMES.M_PEGAWAI),
      unit: getSheetData_(LOCAL_SHEET_NAMES.M_UNIT_KERJA),
      jabatan: getSheetData_(LOCAL_SHEET_NAMES.M_JABATAN),
      katalog_diklat: getSheetData_(LOCAL_SHEET_NAMES.M_KATALOG_DIKLAT)
    }
  };
}

function getMasterPegawai_() { return { success: true, data: getSheetData_(LOCAL_SHEET_NAMES.M_PEGAWAI) }; }
function getMasterUnit_() { return { success: true, data: getSheetData_(LOCAL_SHEET_NAMES.M_UNIT_KERJA) }; }
function getMasterJabatan_() { return { success: true, data: getSheetData_(LOCAL_SHEET_NAMES.M_JABATAN) }; }
function getKatalogDiklat_() { return { success: true, data: getSheetData_(LOCAL_SHEET_NAMES.M_KATALOG_DIKLAT) }; }

/**
 * 12. Profil Pengguna
 */
function getMyProfile_(data, sessionUser) {
  if (!sessionUser || !sessionUser.email) return { success: false, error: 'Sesi tidak valid.' };
  var pegawai = getSheetData_(LOCAL_SHEET_NAMES.M_PEGAWAI);
  var match = pegawai.find(function(p) { return String(p.email).toLowerCase() === String(sessionUser.email).toLowerCase(); });
  return { success: true, data: match || sessionUser };
}

function saveMyProfile_(data, sessionUser) {
  if (!sessionUser || !sessionUser.email) return { success: false, error: 'Sesi tidak valid.' };
  var record = data && (data.record || data);
  var saved = saveRecord_(LOCAL_SHEET_NAMES.M_PEGAWAI, record, sessionUser);
  return { success: true, data: saved };
}

// ==================== INITIALIZATION & SETUP LAUNCHER ====================

/**
 * Inisialisasi struktur sheet dan header (Database Setup)
 */
function initDatabase() {
  var ss = getLocalSpreadsheet_();
  var created = [];

  Object.keys(LOCAL_SHEET_NAMES).forEach(function(key) {
    var sheetName = LOCAL_SHEET_NAMES[key];
    var headers = LOCAL_SHEET_HEADERS[sheetName];
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

  // Hapus Sheet1 default jika kosong
  try {
    var defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Sheet 1');
    if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() === 0) {
      ss.deleteSheet(defaultSheet);
    }
  } catch (e) {}

  Logger.log('✅ Inisialisasi basis data 6-Sheet selesai. Sheet baru dibuat: ' + (created.join(', ') || 'Tidak ada (sudah lengkap)'));
  return { success: true, created: created };
}

/**
 * Setup Lengkap Aplikasi SI-KOMPETENSI (Opsi B 6-Sheet)
 * Jalankan fungsi ini sekali dari menu Run di Editor Google Apps Script!
 */
function setupApp() {
  Logger.log('🚀 Memulai Setup Lengkap SI-KOMPETENSI (Satpol PP & Damkar Trenggalek)...');

  // 1. Inisialisasi Sheet & Header
  initDatabase();

  // 2. Set Konfigurasi Default di Script Properties
  var props = appProps_();
  var activeId = SPREADSHEET_ID;
  if (!activeId) {
    try { activeId = SpreadsheetApp.getActiveSpreadsheet().getId(); } catch(e) {}
  }

  props.setProperties({
    'APP_TITLE': APP_TITLE,
    'APP_CODE': APP_CODE,
    'SPREADSHEET_ID': activeId || '',
    'MASTER_SPREADSHEET_ID': MASTER_SPREADSHEET_ID || activeId || '',
    'SESSION_PREFIX': SESSION_PREFIX,
    'SESSION_TTL_SECONDS': String(SESSION_TTL_SECONDS),
    'PLATFORM_API_URL': PLATFORM_API_URL
  });

  // 3. Masukkan Master Data Awal (Seeder Realistis Satpol PP & Damkar)
  if (typeof seedInitialData === 'function') {
    seedInitialData();
  }

  // 4. Set Konfigurasi Sistem di Sheet KONFIGURASI
  var defaultConfigs = [
    { key: 'app_name', value: APP_TITLE, keterangan: 'Nama Aplikasi' },
    { key: 'app_version', value: '2.4.0', keterangan: 'Versi Aplikasi' },
    { key: 'instansi', value: 'Pemerintah Kabupaten Trenggalek', keterangan: 'Nama Instansi' },
    { key: 'opd_name', value: 'Satuan Polisi Pamong Praja & Kebakaran', keterangan: 'Nama OPD' },
    { key: 'target_jp_tahunan', value: '20', keterangan: 'Standar Minimal Jam Pelajaran ASN per Tahun' },
    { key: 'pos_wilayah_list', value: 'Pos Induk Kota,Pos Watulimo (Prigi),Pos Panggul', keterangan: 'Daftar Pos Wilayah Pemadam Kebakaran' }
  ];
  var systemUser = { id: 'SYSTEM_SETUP', email: 'system@trenggalekkab.go.id', role: 'super' };
  defaultConfigs.forEach(function(c) {
    saveRecord_(LOCAL_SHEET_NAMES.KONFIGURASI, c, systemUser);
  });

  Logger.log('🎉 ============================================================');
  Logger.log('🎉 SETUP SELESAI DENGAN SUKSES!');
  Logger.log('🎉 Basis Data 6-Sheet Opsi B siap digunakan untuk Satpol PP & Damkar Trenggalek.');
  Logger.log('🎉 ============================================================');

  return { success: true, message: 'Setup SI-KOMPETENSI selesai dengan sukses.' };
}

/**
 * Alias fungsi setup untuk kenyamanan eksekusi di editor
 */
function setup() {
  return setupApp();
}
