// ============================================================
// SI-KOMPETENSI - 02_AppLogic.gs (v2-ready, port SILAHAR hijau)
// Patch vs versi kiriman (P1–P8 + hardening dispatcher):
// - P1: hook generate id bila kosong (semua entitas) — cegah PK jatuh
//   ke pegawai_id (bug: data ke-2 user menimpa data ke-1!).
// - P2: hook KUNCI field verifikasi di jalur save generik (baru='menunggu',
//   update=warisi baris lama). Satu-satunya penulis = handler verifikasi.
// - P3: getKompetensiList_ dukung search.
// - P4: handler save_kompetensi/delete_kompetensi (proteksi pemilik, opsi A).
// - P5: handler verifikasi_kompetensi (khusus admin).
// - P6: getAnalytics_ tambah by_tanggal + by_pegawai.
// - P7: get_my_profile diperkaya pangkat_golongan dari master (anti spoof:
//   email SELALU dari session, bukan dari payload).
// - P8: dashboard tanpa lock baca + tambah terbaru[] (5 terakhir, server-sorted).
// - Dispatcher: localConfig rakitan manual DIGANTI getAppConfig_() + preSaveHook
//   di-wire + semua handler ref (pegawai/unit/jabatan/profil) di-wire.
// - setupApp: tambah masterSsId + props app (B15).
// - doGet ALLOWALL -> DEFAULT (anti clickjacking) + support ticket & isSsoEntry.
// Susulan A5 (R1–R4): entity LAPORAN ternyata CRUD mandiri (bukan filter view).
// - R1: get_riwayat_list (search + filter status/pegawai/unit + sortir + meta).
// - R2: save/delete_riwayat proteksi pemilik via created_by (opsi A adaptasi:
//   pegawai_id opsional → pemilik = pembuat baris).
// - R3: verifikasi_riwayat khusus admin (satu-satunya penulis status).
// - R4: hook KUNCI status LAPORAN di jalur save (baru='draft', update=warisi).
// Susulan A6 (N2): getAnalytics_ honor filter tahun/bulan + kirim by_bulan.
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
    .setTitle(APP_TITLE)
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
 * Dispatcher lokal: APP_CONFIG + handler khas SIKOMPETENSI -> dispatcher v2.
 */
function handleAction(payload) {
  var cfg = getAppConfig_();
  cfg.preSaveHook = localPreSaveHook_;
  cfg.localHandlers = {
    'get_kompetensi_list': typeof getKompetensiList_ === 'function' ? getKompetensiList_ : null,
    'save_kompetensi': typeof saveKompetensiHandler_ === 'function' ? saveKompetensiHandler_ : null,
    'delete_kompetensi': typeof deleteKompetensiHandler_ === 'function' ? deleteKompetensiHandler_ : null,
    'verifikasi_kompetensi': typeof verifikasiKompetensiHandler_ === 'function' ? verifikasiKompetensiHandler_ : null,
    'get_riwayat_list': typeof getRiwayatList_ === 'function' ? getRiwayatList_ : null,
    'save_riwayat': typeof saveRiwayatHandler_ === 'function' ? saveRiwayatHandler_ : null,
    'delete_riwayat': typeof deleteRiwayatHandler_ === 'function' ? deleteRiwayatHandler_ : null,
    'verifikasi_riwayat': typeof verifikasiRiwayatHandler_ === 'function' ? verifikasiRiwayatHandler_ : null,
    'dashboard': typeof apiDashboard_ === 'function' ? apiDashboard_ : null,
    'analytics': typeof getAnalytics_ === 'function' ? getAnalytics_ : null,
    'get_pegawai_list': typeof getPegawaiList_ === 'function' ? getPegawaiList_ : null,
    'get_unit_list': typeof getUnitList_ === 'function' ? getUnitList_ : null,
    'get_jabatan_list': typeof getJabatanList_ === 'function' ? getJabatanList_ : null,
    'get_my_profile': function(d, user) { return getMyProfileEnriched_(user); },
    'save_my_profile': function(d, user) { return saveMyProfile_(d, user); }
  };

  return CoreLib.dispatchAction(payload, cfg);
}

// ==================== HELPER AKTOR & CARI ====================

function actorRole_(actor) { return String((actor && actor.role) || 'viewer').toLowerCase(); }
function isAdminActor_(actor) { var r = actorRole_(actor); return r === 'admin' || r === 'super'; }
function actorPegawaiId_(actor) { return String((actor && actor.pegawai_id) || '').trim(); }

function findKompetensiById_(id) {
  var target = String(id || '').trim();
  if (!target) return null;
  var rows = readRecordsNoLock_('DATA_KOMPETENSI');
  for (var i = 0; i < rows.length; i++) {
    if (!rows[i].deleted_at && String(rows[i].id || '').trim() === target) return rows[i];
  }
  return null;
}

function matchSearch_(row, q, fields) {
  if (!q) return true;
  for (var i = 0; i < fields.length; i++) {
    if (String(row[fields[i]] || '').toLowerCase().indexOf(q) !== -1) return true;
  }
  return false;
}
var KOMPETENSI_SEARCH_FIELDS = ['nama_kompetensi', 'penyelenggara', 'no_sertifikat', 'jenis_kompetensi', 'tanggal_mulai'];
var RIWAYAT_SEARCH_FIELDS = ['nama_laporan', 'periode'];

function findRiwayatById_(id) {
  var target = String(id || '').trim();
  if (!target) return null;
  var rows = readRecordsNoLock_('LAPORAN');
  for (var i = 0; i < rows.length; i++) {
    if (!rows[i].deleted_at && String(rows[i].id || '').trim() === target) return rows[i];
  }
  return null;
}

// R2: identitas aktor untuk guard pemilik berbasis pembuat baris.
// created_by ditulis server (B10) — cocokkan ke semua identitas umum
// agar tahan terhadap pilihan field library (email/username/id).
function actorIdentities_(actor) {
  var ids = [];
  ['email', 'username', 'id', 'display_name'].forEach(function(k) {
    var v = String((actor && actor[k]) || '').trim();
    if (v) ids.push(v);
  });
  return ids;
}
function isOwnerRow_(row, actor) {
  if (!row) return false;
  var by = String(row.created_by || '').trim();
  if (!by) return false;
  return actorIdentities_(actor).indexOf(by) !== -1;
}

function paginate_(rows, page, limit) {
  page = parseInt(page || 1, 10); if (isNaN(page) || page < 1) page = 1;
  limit = parseInt(limit || 10, 10); if (isNaN(limit) || limit < 1) limit = 10;
  var start = (page - 1) * limit;
  return {
    success: true,
    data: rows.slice(start, start + limit),
    meta: { total: rows.length, page: page, limit: limit, total_pages: Math.max(1, Math.ceil(rows.length / limit)) }
  };
}

// ==================== DASHBOARD & ANALYTICS LOKAL ====================

function apiDashboard_(query, actor) {
  try {
    var dashboardData = {
      app_title: APP_TITLE,
      total_kompetensi: 0,
      jenis_count: {},
      tanggal_count: {},
      generated_at: nowIso_(),
      generated_by: actor && (actor.username || actor.email) ? (actor.username || actor.email) : 'system'
    };

    var dataKompetensi = readRecordsNoLock_('DATA_KOMPETENSI').filter(function(r) { return !r.deleted_at; });
    if (dataKompetensi && dataKompetensi.length > 0) {
      dashboardData.total_kompetensi = dataKompetensi.length;
      dataKompetensi.forEach(function(item) {
        var tgl = String(item.tanggal_mulai || 'tanpa_tanggal').slice(0, 10);
        dashboardData.tanggal_count[tgl] = (dashboardData.tanggal_count[tgl] || 0) + 1;
        var jenis = String(item.jenis_kompetensi || 'diklat').toLowerCase().trim();
        dashboardData.jenis_count[jenis] = (dashboardData.jenis_count[jenis] || 0) + 1;
      });
      // P8: 5 data terbaru (terbaru dulu, server-sorted) — widget dashboard
      // tidak bergantung pada list yang hanya terisi usai buka halaman lain.
      dashboardData.terbaru = dataKompetensi.slice().sort(function(a, b) {
        var ta = String(a.tanggal_mulai || ''), tb = String(b.tanggal_mulai || '');
        return tb < ta ? -1 : (tb > ta ? 1 : 0);
      }).slice(0, 5);
    } else {
      dashboardData.terbaru = [];
    }

    return { success: true, data: dashboardData };
  } catch (err) {
    return { success: false, code: 'BAD_REQUEST', error: err.message };
  }
}

function getAnalytics_(query, actor) {
  try {
    // N2 (susulan A6): honor filter tahun/bulan dari UI analisa.
    // Kontrak: tahun = 'YYYY'; bulan = angka 1–12 ATAU nama bulan Indonesia.
    var q = query || {};
    var fTahun = String(q.tahun || (q.filters && q.filters.tahun) || '').trim();
    var fBulanRaw = (q.bulan !== undefined && q.bulan !== '') ? q.bulan : ((q.filters && q.filters.bulan) || '');
    var fBulan = parseInt(fBulanRaw, 10);
    if (isNaN(fBulan)) {
      var NAMA_BULAN = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
      fBulan = NAMA_BULAN.indexOf(String(fBulanRaw || '').toLowerCase().trim()) + 1;
      if (fBulan < 1) fBulan = 0;
    }

    var total = 0;
    var ringkasan = '';
    var byJenis = {};
    var byTanggal = {};   // P6
    var byPegawai = {};   // P6
    var byBulan = {};     // N2: agregat YYYY-MM untuk kartu distribusi bulanan
    var temuan = [];
    var rekomendasi = [];

    var dataKompetensi = readRecordsNoLock_('DATA_KOMPETENSI').filter(function(p) { return !p.deleted_at; });
    if (fTahun) dataKompetensi = dataKompetensi.filter(function(p) { return String(p.tanggal_mulai || '').slice(0, 4) === fTahun; });
    if (fBulan) dataKompetensi = dataKompetensi.filter(function(p) { return parseInt(String(p.tanggal_mulai || '').slice(5, 7), 10) === fBulan; });
    if (dataKompetensi && dataKompetensi.length > 0) {
      total = dataKompetensi.length;
      dataKompetensi.forEach(function(item) {
        var jenis = String(item.jenis_kompetensi || 'diklat').toLowerCase().trim();
        byJenis[jenis] = (byJenis[jenis] || 0) + 1;
        var tgl = String(item.tanggal_mulai || 'tanpa_tanggal').slice(0, 10);
        byTanggal[tgl] = (byTanggal[tgl] || 0) + 1;
        var peg = String(item.pegawai_id || 'tanpa_pegawai');
        byPegawai[peg] = (byPegawai[peg] || 0) + 1;
        var bln = String(item.tanggal_mulai || '').slice(0, 7);
        if (/^\d{4}-\d{2}$/.test(bln)) byBulan[bln] = (byBulan[bln] || 0) + 1;
      });
      ringkasan = 'Total pengembangan kompetensi pegawai tercatat: ' + total + ' kegiatan diklat.';
    }

    if (total === 0) {
      ringkasan = 'Belum ada data kompetensi yang tercatat.';
      temuan.push({ level: 'kritis', pesan: 'Belum ada riwayat diklat pegawai yang terinput.' });
      rekomendasi.push({ prioritas: 'tinggi', tindakan: 'Sosialisasi pengisian data pengembangan kompetensi.' });
    } else {
      temuan.push({ level: 'info', pesan: 'Volume data riwayat diklat terdaftar cukup baik.' });
      rekomendasi.push({ prioritas: 'rendah', tindakan: 'Lakukan pemantauan pemenuhan jam pelajaran (JP) tahunan.' });
    }

    return {
      success: true,
      data: {
        ringkasan: ringkasan, total_data: total, by_jenis: byJenis,
        by_tanggal: byTanggal, by_pegawai: byPegawai, by_bulan: byBulan,
        temuan: temuan, rekomendasi: rekomendasi, generated_at: nowIso_()
      }
    };
  } catch (err) {
    return { success: false, code: 'BAD_REQUEST', error: err.message };
  }
}

// ==================== VALIDATOR & HOOKS LOKAL ====================

function localPreSaveHook_(canonical, record) {
  // P1: id kosong WAJIB digenerate di sini — kalau lolos kosong, PK jatuh ke
  // pegawai_id: baris tersimpan tanpa id + save berikut menimpa (DATA LOSS).
  if (!record.id || String(record.id).trim() === '') {
    record.id = makeId_(String(canonical || 'rec').toLowerCase());
  }
  if (canonical === 'DATA_KOMPETENSI') {
    // P2: jalur save generik DILARANG membawa verifikasi (anti self-approve
    // via DevTools). Baru='menunggu', update=warisi baris lama.
    var old = findKompetensiById_(record.id);
    if (old) {
      record.status_verifikasi = old.status_verifikasi || 'menunggu';
      record.catatan_verifikator = old.catatan_verifikator || '';
      record.verifikator_id = old.verifikator_id || '';
      record.tanggal_verifikasi = old.tanggal_verifikasi || '';
    } else {
      record.status_verifikasi = 'menunggu';
      record.catatan_verifikator = '';
      record.verifikator_id = '';
      record.tanggal_verifikasi = '';
    }
    if (record.tanggal_mulai) {
      var dStart = parseTanggalBackend_(record.tanggal_mulai);
      if (dStart) record.tanggal_mulai = dStart.toISOString().slice(0, 10);
    }
    if (record.tanggal_selesai) {
      var dEnd = parseTanggalBackend_(record.tanggal_selesai);
      if (dEnd) record.tanggal_selesai = dEnd.toISOString().slice(0, 10);
    }
    if (record.jenis_kompetensi) {
      record.jenis_kompetensi = String(record.jenis_kompetensi).toLowerCase().trim();
    }
  }
  if (canonical === 'LAPORAN') {
    // R4: jalur save DILARANG membawa status (anti self-approve).
    // Baru='draft', update=warisi baris lama. Satu-satunya penulis status
    // adalah verifikasiRiwayatHandler_ (admin, bypass hook).
    var oldLap = findRiwayatById_(record.id);
    if (oldLap) {
      record.status = oldLap.status || 'draft';
      record.catatan_verifikator = oldLap.catatan_verifikator || '';
      record.verifikator_id = oldLap.verifikator_id || '';
      record.tanggal_verifikasi = oldLap.tanggal_verifikasi || '';
    } else {
      record.status = 'draft';
      record.catatan_verifikator = '';
      record.verifikator_id = '';
      record.tanggal_verifikasi = '';
    }
  }
  return { record: record };
}

// ==================== KOMPETENSI: LIST ====================

function getKompetensiList_(data, actor) {
  data = data || {};
  try {
    var rows = readRecordsNoLock_('DATA_KOMPETENSI').filter(function(row) { return !row.deleted_at; });
    var q = String(data.search || '').toLowerCase().trim(); // P3
    if (q) rows = rows.filter(function(r) { return matchSearch_(r, q, KOMPETENSI_SEARCH_FIELDS); });
    return paginate_(rows, data.page, data.limit);
  } catch (err) {
    return { success: false, code: 'BAD_REQUEST', error: err.message };
  }
}

// ==================== KOMPETENSI: SAVE/DELETE/VERIFIKASI (P4–P5) ====================

function saveKompetensiHandler_(data, actor) {
  data = data || {};
  var record = data.record || data.row || data;
  if (!record || typeof record !== 'object') return { success: false, code: 'BAD_REQUEST', error: 'Payload record tidak valid.' };
  record = Object.assign({}, record);
  if (!isAdminActor_(actor)) {
    var myPeg = actorPegawaiId_(actor);
    if (!myPeg) return { success: false, code: 'FORBIDDEN', error: 'Akun Anda belum terhubung ke data pegawai. Hubungi admin.' };
    if (String(record.pegawai_id || '').trim() !== myPeg) {
      return { success: false, code: 'FORBIDDEN', error: 'Anda hanya boleh menyimpan data milik sendiri.' };
    }
    if (record.id && String(record.id).trim() !== '') {
      var old = findKompetensiById_(record.id);
      if (old && String(old.pegawai_id || '').trim() !== myPeg) {
        return { success: false, code: 'FORBIDDEN', error: 'Anda hanya boleh mengubah data milik sendiri.' };
      }
    }
  }
  return apiSave_('DATA_KOMPETENSI', record, actor);
}

function deleteKompetensiHandler_(data, actor) {
  data = data || {};
  var id = data.id || (data.record && data.record.id) || '';
  if (!id) return { success: false, code: 'BAD_REQUEST', error: 'ID data wajib diisi.' };
  if (!isAdminActor_(actor)) {
    var myPeg = actorPegawaiId_(actor);
    var row = findKompetensiById_(id);
    if (!row) return { success: false, code: 'NOT_FOUND', error: 'Data tidak ditemukan.' };
    if (!myPeg || String(row.pegawai_id || '').trim() !== myPeg) {
      return { success: false, code: 'FORBIDDEN', error: 'Anda hanya boleh menghapus data milik sendiri.' };
    }
  }
  return apiDelete_('DATA_KOMPETENSI', id, actor);
}

// Satu-satunya penulis field verifikasi. Dispatcher + cek ganda admin.
function verifikasiKompetensiHandler_(data, actor) {
  data = data || {};
  if (!isAdminActor_(actor)) return { success: false, code: 'FORBIDDEN', error: 'Verifikasi hanya untuk admin.' };
  var id = data.id || '';
  var status = String(data.status || data.status_verifikasi || '').toLowerCase().trim();
  if (!id) return { success: false, code: 'BAD_REQUEST', error: 'ID data wajib diisi.' };
  if (status !== 'disetujui' && status !== 'revisi') {
    return { success: false, code: 'BAD_REQUEST', error: 'Status harus "disetujui" atau "revisi".' };
  }
  var lock = acquireLock_();
  if (!lock) return { success: false, code: 'BUSY', error: 'Server sibuk, silakan coba lagi.' };
  try {
    var row = findKompetensiById_(id);
    if (!row) return { success: false, code: 'NOT_FOUND', error: 'Data tidak ditemukan.' };
    row.status_verifikasi = status;
    row.catatan_verifikator = (data.catatan_verifikator !== undefined) ? data.catatan_verifikator : (row.catatan_verifikator || '');
    row.verifikator_id = actorPegawaiId_(actor) || String(actor.id || '');
    row.tanggal_verifikasi = todayIso_();
    var saved = writeRecordNoLock_('DATA_KOMPETENSI', row, true, actor); // langsung (bypass hook)
    return { success: true, data: saved };
  } catch (err) {
    return { success: false, code: 'BAD_REQUEST', error: err.message };
  } finally { try { lock.releaseLock(); } catch (e) {} }
}

// ==================== RIWAYAT (LAPORAN): LIST/SAVE/DELETE/VERIFIKASI (R1–R3) ====================

function getRiwayatList_(data, actor) {
  data = data || {};
  try {
    var rows = readRecordsNoLock_('LAPORAN').filter(function(row) { return !row.deleted_at; });
    var filters = data.filters || data;
    if (typeof filters === 'string') { try { filters = JSON.parse(filters); } catch (e) { filters = {}; } }
    var fStatus = String(filters.status || '').toLowerCase().trim();
    var fPeg = String(filters.pegawai_id || '').trim();
    var fUnit = String(filters.unit_id || '').trim();
    if (fStatus) rows = rows.filter(function(r) { return String(r.status || 'draft').toLowerCase() === fStatus; });
    if (fPeg) rows = rows.filter(function(r) { return String(r.pegawai_id || '') === fPeg; });
    if (fUnit) rows = rows.filter(function(r) { return String(r.unit_id || '') === fUnit; });
    var q = String(data.search || '').toLowerCase().trim();
    if (q) rows = rows.filter(function(r) { return matchSearch_(r, q, RIWAYAT_SEARCH_FIELDS); });
    rows.sort(function(a, b) {
      var ta = String(a.updated_at || ''), tb = String(b.updated_at || '');
      return tb < ta ? -1 : (tb > ta ? 1 : 0);
    });
    return paginate_(rows, data.page, data.limit);
  } catch (err) {
    return { success: false, code: 'BAD_REQUEST', error: err.message };
  }
}

function saveRiwayatHandler_(data, actor) {
  data = data || {};
  var record = data.record || data.row || data;
  if (!record || typeof record !== 'object') return { success: false, code: 'BAD_REQUEST', error: 'Payload record tidak valid.' };
  record = Object.assign({}, record);
  if (!String(record.periode || '').trim()) return { success: false, code: 'BAD_REQUEST', error: 'Periode laporan wajib diisi.' };
  if (!String(record.nama_laporan || '').trim()) return { success: false, code: 'BAD_REQUEST', error: 'Nama laporan wajib diisi.' };
  if (!isAdminActor_(actor)) {
    // R2: non-admin hanya boleh ubah baris yang ia buat sendiri.
    if (record.id && String(record.id).trim() !== '') {
      var old = findRiwayatById_(record.id);
      if (!old) return { success: false, code: 'NOT_FOUND', error: 'Laporan tidak ditemukan.' };
      if (!isOwnerRow_(old, actor)) {
        return { success: false, code: 'FORBIDDEN', error: 'Anda hanya boleh mengubah laporan yang Anda buat.' };
      }
    }
  }
  return apiSave_('LAPORAN', record, actor);
}

function deleteRiwayatHandler_(data, actor) {
  data = data || {};
  var id = data.id || (data.record && data.record.id) || '';
  if (!id) return { success: false, code: 'BAD_REQUEST', error: 'ID laporan wajib diisi.' };
  if (!isAdminActor_(actor)) {
    var row = findRiwayatById_(id);
    if (!row) return { success: false, code: 'NOT_FOUND', error: 'Laporan tidak ditemukan.' };
    if (!isOwnerRow_(row, actor)) {
      return { success: false, code: 'FORBIDDEN', error: 'Anda hanya boleh menghapus laporan yang Anda buat.' };
    }
  }
  return apiDelete_('LAPORAN', id, actor);
}

// Satu-satunya penulis field status LAPORAN. Dispatcher + cek ganda admin.
function verifikasiRiwayatHandler_(data, actor) {
  data = data || {};
  if (!isAdminActor_(actor)) return { success: false, code: 'FORBIDDEN', error: 'Verifikasi hanya untuk admin.' };
  var id = data.id || '';
  var status = String(data.status || '').toLowerCase().trim();
  if (!id) return { success: false, code: 'BAD_REQUEST', error: 'ID laporan wajib diisi.' };
  if (status !== 'disetujui' && status !== 'ditolak') {
    return { success: false, code: 'BAD_REQUEST', error: 'Status harus "disetujui" atau "ditolak".' };
  }
  var lock = acquireLock_();
  if (!lock) return { success: false, code: 'BUSY', error: 'Server sibuk, silakan coba lagi.' };
  try {
    var row = findRiwayatById_(id);
    if (!row) return { success: false, code: 'NOT_FOUND', error: 'Laporan tidak ditemukan.' };
    row.status = status;
    row.catatan_verifikator = (data.catatan_verifikator !== undefined) ? data.catatan_verifikator : (row.catatan_verifikator || '');
    row.verifikator_id = actorPegawaiId_(actor) || String(actor.id || '');
    row.tanggal_verifikasi = todayIso_();
    var saved = writeRecordNoLock_('LAPORAN', row, true, actor); // langsung (bypass hook)
    return { success: true, data: saved };
  } catch (err) {
    return { success: false, code: 'BAD_REQUEST', error: err.message };
  } finally { try { lock.releaseLock(); } catch (e) {} }
}

// Bridges ke Core Business Engine
function apiGet_(sheetName, id, query) { return CoreLib.apiGet(SPREADSHEET_ID, sheetName, id, query, getAllHeaders_()); }
function apiSave_(sheetName, record, actor) { return CoreLib.apiSave(SPREADSHEET_ID, sheetName, record, actor, getAllHeaders_(), isReferenceSheet_, localPreSaveHook_); }
function apiDelete_(sheetName, id, actor) { return CoreLib.apiDelete(SPREADSHEET_ID, sheetName, id, actor, getAllHeaders_()); }

// ==================== HANDLER LOKAL DENGAN FORMAT KONSISTEN ====================
function getPegawaiList_(data, actor) {
  return { success: true, data: CoreLib.getPegawaiList(SPREADSHEET_ID, getAllHeaders_(), MASTER_SPREADSHEET_ID) };
}
function getUnitList_(data, actor) {
  return { success: true, data: CoreLib.getUnitList(SPREADSHEET_ID, getAllHeaders_(), MASTER_SPREADSHEET_ID) };
}
function getJabatanList_(data, actor) {
  return { success: true, data: CoreLib.getJabatanList(SPREADSHEET_ID, getAllHeaders_(), MASTER_SPREADSHEET_ID) };
}
function getProfile_(email) { return CoreLib.getProfile(SPREADSHEET_ID, email, getAllHeaders_(), MASTER_SPREADSHEET_ID); }
// P7: profil + pangkat_golongan dari master. Email SELALU dari session actor
// (anti spoof: payload d.email diabaikan total).
function getMyProfileEnriched_(actor) {
  var prof = getProfile_((actor && actor.email) || '') || actor || {};
  try {
    var email = String((actor && actor.email) || '').toLowerCase().trim();
    if (email) {
      var refs = getSheetDataCached_('PEGAWAI');
      for (var i = 0; i < refs.length; i++) {
        if (String(refs[i].email || '').toLowerCase().trim() === email) {
          prof.pangkat_golongan = refs[i].pangkat_golongan || '';
          break;
        }
      }
    }
  } catch (e) {}
  return { success: true, data: prof };
}
function saveMyProfile_(data, actor) { return CoreLib.saveMyProfile(SPREADSHEET_ID, data, actor, getAllHeaders_(), MASTER_SPREADSHEET_ID); }
function getConfigList_() { return CoreLib.getConfigList(SPREADSHEET_ID, getAllHeaders_()); }
function saveConfigItem_(data, actor) { return CoreLib.saveConfigItem(SPREADSHEET_ID, data, actor, getAllHeaders_()); }

// ==================== LAUNCHER PROVISIONING 1-KLIK ====================

/**
 * Wrapper Publik untuk Inisialisasi Seluruh Tab Sheet Fisik dari Dropdown Apps Script
 */
function initDatabase() {
  return initDatabase_();
}

function setupApp() {
  var defaultConfigs = [
    { key: 'app_name', value: APP_TITLE, keterangan: 'Nama Aplikasi' },
    { key: 'app_version', value: '1.0.0', keterangan: 'Versi Aplikasi' },
    { key: 'instansi', value: 'BKPSDM / Satpol PP & Kebakaran Kab. Trenggalek', keterangan: 'Nama Instansi' },
    { key: 'jenis_kompetensi_list', value: 'diklat_struktural,bimtek,workshop,seminar,kursus', keterangan: 'Daftar jenis kompetensi' }
  ];

  var params = {
    appCode: APP_CODE, appTitle: APP_TITLE, spreadsheetId: SPREADSHEET_ID,
    masterSsId: MASTER_SPREADSHEET_ID,
    platformApiUrl: PLATFORM_API_URL, headersMap: getAllHeaders_(), defaultConfigs: defaultConfigs, isRefSheetFunc: isReferenceSheet_,
    props: appProps_() // WAJIB (B15): store milik app ini, bukan store library
  };

  return CoreLib.executeAppSetup(params);
}

/**
 * Jalankan fungsi ini untuk menyimpan URL Portal Pusat SSO secara permanen
 */
function setPlatformApiUrl() {
  var portalUrl = 'https://script.google.com/macros/s/AKfycbwh_OUVqmxLcuF81FHmPZtT33Wrm8Ce9Da1SQ3hfkSr7gM5P8ofyAlHSgW40mq3eo-PoQ/exec';

  PropertiesService.getScriptProperties().setProperty('PLATFORM_API_URL', portalUrl.trim());

  Logger.log('==========================================================');
  Logger.log('✅ PLATFORM_API_URL BERHASIL DISIMPAN!');
  Logger.log('• URL Terpasang: ' + PropertiesService.getScriptProperties().getProperty('PLATFORM_API_URL'));
  Logger.log('==========================================================');
}
