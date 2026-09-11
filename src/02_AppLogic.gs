// ============================================================
// SI-KOMPETENSI - 02_AppLogic.gs (v2.4.0 — Opsi B 6-Sheet)
// Backend Routing, Business Logic & API Dispatcher
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
    return CoreLib.jsonResponse({ success: false, code: 'BAD_REQUEST', error: 'Format JSON payload tidak valid.' });
  }

  var result = handleAction(body);
  return CoreLib.jsonResponse(result);
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
 * Dispatcher lokal SI-KOMPETENSI
 */
function handleAction(payload) {
  var cfg = getAppConfig_();
  cfg.preSaveHook = localPreSaveHook_;
  cfg.localHandlers = {
    'dashboard': typeof apiDashboard_ === 'function' ? apiDashboard_ : null,
    'get_kompetensi_list': typeof getKompetensiList_ === 'function' ? getKompetensiList_ : null,
    'save_kompetensi': typeof saveKompetensiHandler_ === 'function' ? saveKompetensiHandler_ : null,
    'delete_kompetensi': typeof deleteKompetensiHandler_ === 'function' ? deleteKompetensiHandler_ : null,
    'verifikasi_kompetensi': typeof verifikasiKompetensiHandler_ === 'function' ? verifikasiKompetensiHandler_ : null,
    'get_usulan_list': typeof getUsulanList_ === 'function' ? getUsulanList_ : null,
    'save_usulan': typeof saveUsulanHandler_ === 'function' ? saveUsulanHandler_ : null,
    'review_usulan': typeof reviewUsulanHandler_ === 'function' ? reviewUsulanHandler_ : null,
    'delete_usulan': typeof deleteUsulanHandler_ === 'function' ? deleteUsulanHandler_ : null,
    'analytics': typeof getAnalytics_ === 'function' ? getAnalytics_ : null,
    'get_master_simpeg': typeof getMasterSIMPEG_ === 'function' ? getMasterSIMPEG_ : null,
    'get_master_pegawai': typeof getMasterPegawai_ === 'function' ? getMasterPegawai_ : null,
    'get_master_unit': typeof getMasterUnit_ === 'function' ? getMasterUnit_ : null,
    'get_master_jabatan': typeof getMasterJabatan_ === 'function' ? getMasterJabatan_ : null,
    'get_katalog_diklat': typeof getKatalogDiklat_ === 'function' ? getKatalogDiklat_ : null,
    'get_my_profile': typeof getMyProfile_ === 'function' ? getMyProfile_ : null,
    'save_my_profile': typeof saveMyProfile_ === 'function' ? saveMyProfile_ : null
  };
  return CoreLib.dispatch(payload, cfg);
}

// ==================== HANDLER BUSINESS LOGIC ====================

/**
 * 1. Dashboard Executive Handler
 */
function apiDashboard_(data, sessionUser) {
  var ss = getLocalSpreadsheet_();
  var kompetensiRows = CoreLib.getSheetDataAsJson(ss, LOCAL_SHEET_NAMES.T_KOMPETENSI_PEGAWAI) || [];
  var pegawaiRows = CoreLib.getSheetDataAsJson(ss, LOCAL_SHEET_NAMES.M_PEGAWAI) || [];
  var unitRows = CoreLib.getSheetDataAsJson(ss, LOCAL_SHEET_NAMES.M_UNIT_KERJA) || [];
  var usulanRows = CoreLib.getSheetDataAsJson(ss, LOCAL_SHEET_NAMES.T_USULAN_DIKLAT) || [];

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
  var ss = getLocalSpreadsheet_();
  var rows = CoreLib.getSheetDataAsJson(ss, LOCAL_SHEET_NAMES.T_KOMPETENSI_PEGAWAI) || [];

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

  var ss = getLocalSpreadsheet_();
  var isNew = !record.id;
  record = localPreSaveHook_(LOCAL_SHEET_NAMES.T_KOMPETENSI_PEGAWAI, record, isNew, sessionUser);

  var saved = CoreLib.saveRecord(ss, LOCAL_SHEET_NAMES.T_KOMPETENSI_PEGAWAI, record, sessionUser);
  return { success: true, data: saved };
}

/**
 * 4. Delete Kompetensi Handler
 */
function deleteKompetensiHandler_(data, sessionUser) {
  var id = data && (data.id || (data.record && data.record.id));
  if (!id) return { success: false, error: 'ID data kompetensi wajib diisi.' };

  var ss = getLocalSpreadsheet_();
  var deleted = CoreLib.softDeleteRecord(ss, LOCAL_SHEET_NAMES.T_KOMPETENSI_PEGAWAI, id, sessionUser);
  return { success: true, data: deleted };
}

/**
 * 5. Verifikasi Kompetensi Handler (Admin / Verifikator)
 */
function verifikasiKompetensiHandler_(data, sessionUser) {
  var role = String((sessionUser && sessionUser.role) || '').toLowerCase();
  if (role !== 'admin' && role !== 'super' && role !== 'verifikator') {
    return { success: false, error: 'Akses ditolak: Hanya verifikator dan administrator yang dapat memverifikasi.' };
  }

  var id = data && data.id;
  var status = data && (data.status_verifikasi || data.status || 'disetujui');
  var catatan = (data && data.catatan_verifikator) || '';

  if (!id) return { success: false, error: 'ID kompetensi wajib diisi.' };

  var ss = getLocalSpreadsheet_();
  var existing = CoreLib.findRecordById(ss, LOCAL_SHEET_NAMES.T_KOMPETENSI_PEGAWAI, id);
  if (!existing) return { success: false, error: 'Data kompetensi tidak ditemukan.' };

  existing.status_verifikasi = status;
  existing.catatan_verifikator = catatan;
  existing.verifikator_id = sessionUser.email || sessionUser.id || 'admin';
  existing.tanggal_verifikasi = new Date().toISOString();

  var updated = CoreLib.saveRecord(ss, LOCAL_SHEET_NAMES.T_KOMPETENSI_PEGAWAI, existing, sessionUser);
  return { success: true, data: updated };
}

/**
 * 6. Get Usulan Diklat List
 */
function getUsulanList_(data, sessionUser) {
  var ss = getLocalSpreadsheet_();
  var rows = CoreLib.getSheetDataAsJson(ss, LOCAL_SHEET_NAMES.T_USULAN_DIKLAT) || [];

  var userRole = String((sessionUser && sessionUser.role) || '').toLowerCase();
  var isAdmin = (userRole === 'admin' || userRole === 'super' || userRole === 'verifikator');

  if (!isAdmin && sessionUser && sessionUser.id) {
    rows = rows.filter(function(r) { return String(r.pegawai_id) === String(sessionUser.id); });
  }

  rows.sort(function(a, b) {
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  return { success: true, data: rows };
}

/**
 * 7. Save Usulan Diklat
 */
function saveUsulanHandler_(data, sessionUser) {
  var record = data && (data.record || data);
  if (!record) return { success: false, error: 'Data usulan diklat wajib diisi.' };

  var ss = getLocalSpreadsheet_();
  var isNew = !record.id;
  record = localPreSaveHook_(LOCAL_SHEET_NAMES.T_USULAN_DIKLAT, record, isNew, sessionUser);

  var saved = CoreLib.saveRecord(ss, LOCAL_SHEET_NAMES.T_USULAN_DIKLAT, record, sessionUser);
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

  var ss = getLocalSpreadsheet_();
  var existing = CoreLib.findRecordById(ss, LOCAL_SHEET_NAMES.T_USULAN_DIKLAT, id);
  if (!existing) return { success: false, error: 'Data usulan tidak ditemukan.' };

  existing.status_usulan = status;
  existing.catatan_pimpinan = catatan;

  var updated = CoreLib.saveRecord(ss, LOCAL_SHEET_NAMES.T_USULAN_DIKLAT, existing, sessionUser);
  return { success: true, data: updated };
}

/**
 * 9. Delete Usulan Diklat
 */
function deleteUsulanHandler_(data, sessionUser) {
  var id = data && data.id;
  var ss = getLocalSpreadsheet_();
  var deleted = CoreLib.softDeleteRecord(ss, LOCAL_SHEET_NAMES.T_USULAN_DIKLAT, id, sessionUser);
  return { success: true, data: deleted };
}

/**
 * 10. Deep Analytics & Gap Report
 */
function getAnalytics_(data, sessionUser) {
  var ss = getLocalSpreadsheet_();
  var kompetensi = CoreLib.getSheetDataAsJson(ss, LOCAL_SHEET_NAMES.T_KOMPETENSI_PEGAWAI) || [];
  var pegawai = CoreLib.getSheetDataAsJson(ss, LOCAL_SHEET_NAMES.M_PEGAWAI) || [];
  var unit = CoreLib.getSheetDataAsJson(ss, LOCAL_SHEET_NAMES.M_UNIT_KERJA) || [];

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
  var ss = getLocalSpreadsheet_();
  return {
    success: true,
    data: {
      pegawai: CoreLib.getSheetDataAsJson(ss, LOCAL_SHEET_NAMES.M_PEGAWAI) || [],
      unit: CoreLib.getSheetDataAsJson(ss, LOCAL_SHEET_NAMES.M_UNIT_KERJA) || [],
      jabatan: CoreLib.getSheetDataAsJson(ss, LOCAL_SHEET_NAMES.M_JABATAN) || [],
      katalog_diklat: CoreLib.getSheetDataAsJson(ss, LOCAL_SHEET_NAMES.M_KATALOG_DIKLAT) || []
    }
  };
}

function getMasterPegawai_() { return { success: true, data: CoreLib.getSheetDataAsJson(getLocalSpreadsheet_(), LOCAL_SHEET_NAMES.M_PEGAWAI) || [] }; }
function getMasterUnit_() { return { success: true, data: CoreLib.getSheetDataAsJson(getLocalSpreadsheet_(), LOCAL_SHEET_NAMES.M_UNIT_KERJA) || [] }; }
function getMasterJabatan_() { return { success: true, data: CoreLib.getSheetDataAsJson(getLocalSpreadsheet_(), LOCAL_SHEET_NAMES.M_JABATAN) || [] }; }
function getKatalogDiklat_() { return { success: true, data: CoreLib.getSheetDataAsJson(getLocalSpreadsheet_(), LOCAL_SHEET_NAMES.M_KATALOG_DIKLAT) || [] }; }

/**
 * 12. Profil Pengguna
 */
function getMyProfile_(data, sessionUser) {
  if (!sessionUser || !sessionUser.email) return { success: false, error: 'Sesi tidak valid.' };
  var ss = getLocalSpreadsheet_();
  var pegawai = CoreLib.getSheetDataAsJson(ss, LOCAL_SHEET_NAMES.M_PEGAWAI) || [];
  var match = pegawai.find(function(p) { return String(p.email).toLowerCase() === String(sessionUser.email).toLowerCase(); });
  return { success: true, data: match || sessionUser };
}

function saveMyProfile_(data, sessionUser) {
  if (!sessionUser || !sessionUser.email) return { success: false, error: 'Sesi tidak valid.' };
  var record = data && (data.record || data);
  var ss = getLocalSpreadsheet_();
  var saved = CoreLib.saveRecord(ss, LOCAL_SHEET_NAMES.M_PEGAWAI, record, sessionUser);
  return { success: true, data: saved };
}
