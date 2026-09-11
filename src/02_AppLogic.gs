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
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ==================== SSO & SESSION BRIDGE ====================

function validateSsoTicket_(ticket) {
  if (!ticket) return null;
  try {
    if (PLATFORM_API_URL) {
      var resp = UrlFetchApp.fetch(PLATFORM_API_URL, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({ action: 'validate_ticket', data: { ticket: ticket, app_code: APP_CODE } }),
        muteHttpExceptions: true
      });
      var body = JSON.parse(resp.getContentText());
      if (body && body.success && body.data && body.data.user) {
        var u = body.data.user;
        var token = 'SESS_' + Utilities.getUuid();
        CacheService.getScriptCache().put(SESSION_PREFIX + token, JSON.stringify(u), SESSION_TTL_SECONDS);
        u.token = token;
        return u;
      }
    }
  } catch (e) {
    Logger.log('[SSO WARN] Validasi tiket gagal: ' + e.message);
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

// ==================== 2. DASHBOARD, MATRIKS & SMART ANALYTICS ====================

function apiDashboard_(params, user) {
  try {
    params = params || {};
    var tahun = Number(params.tahun) || new Date().getFullYear();
    var bulanIniIdx = new Date().getMonth(); // 0 = Jan, 8 = Sep

    var riwayat = getSheetData_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI);
    var simpeg = getSimpegLookup_();
    var pegawaiList = (simpeg && simpeg.data && simpeg.data.pegawai) || [];
    var unitList = (simpeg && simpeg.data && simpeg.data.unit) || [];
    var jabatanList = (simpeg && simpeg.data && simpeg.data.jabatan) || [];
    var jadwalList = getSheetData_(LOCAL_SHEETS.T_JADWAL_DIKLAT);
    var kualifikasiList = getSheetData_(LOCAL_SHEETS.T_KUALIFIKASI_KHUSUS);
    var usulanList = getSheetData_(LOCAL_SHEETS.T_USULAN_DIKLAT);

    var totalJpTahun = 0;
    var jenisCount = {};
    var statusCount = { disetujui: 0, menunggu: 0, ditolak: 0 };
    var pegawaiJpMap = {};
    var pegawaiMonthlyJpMap = {};
    var unitJpMap = {};
    var unitPegawaiCountMap = {};

    var monthlyJpTotal = [0,0,0,0,0,0,0,0,0,0,0,0];

    // Inisialisasi peta pegawai
    pegawaiList.forEach(function(p) {
      var pid = String(p.id);
      pegawaiJpMap[pid] = 0;
      pegawaiMonthlyJpMap[pid] = [0,0,0,0,0,0,0,0,0,0,0,0];

      var uid = String(p.unit_id || 'UNKNOWN');
      unitPegawaiCountMap[uid] = (unitPegawaiCountMap[uid] || 0) + 1;
      if (unitJpMap[uid] === undefined) unitJpMap[uid] = 0;
    });

    // Proses data riwayat
    riwayat.forEach(function(r) {
      var st = String(r.status_verifikasi || 'menunggu').toLowerCase();
      statusCount[st] = (statusCount[st] || 0) + 1;

      var jp = Number(r.jumlah_jp) || 0;
      var rumpun = r.rumpun || 'Lainnya';
      jenisCount[rumpun] = (jenisCount[rumpun] || 0) + 1;

      var rTahun = tahun;
      var rBulan = 0;
      var dateField = r.tgl_selesai || r.tgl_terbit || r.tgl_mulai || r.created_at;
      if (dateField) {
        var d = new Date(dateField);
        if (!isNaN(d.getTime())) {
          rTahun = d.getFullYear();
          rBulan = d.getMonth();
        }
      }

      if (rTahun === tahun && st === 'disetujui') {
        totalJpTahun += jp;
        var pid = String(r.pegawai_id);
        pegawaiJpMap[pid] = (pegawaiJpMap[pid] || 0) + jp;

        if (pegawaiMonthlyJpMap[pid]) {
          pegawaiMonthlyJpMap[pid][rBulan] += jp;
        }
        if (rBulan >= 0 && rBulan < 12) {
          monthlyJpTotal[rBulan] += jp;
        }

        var pegObj = pegawaiList.find(function(p) { return String(p.id) === pid; });
        if (pegObj && pegObj.unit_id) {
          var uid = String(pegObj.unit_id);
          unitJpMap[uid] = (unitJpMap[uid] || 0) + jp;
        }
      }
    });

    // Klasifikasi PNS vs PPPK
    var pnsTotal = 0, pnsLulus = 0, pnsJpTotal = 0;
    var pppkTotal = 0, pppkLulus = 0, pppkJpTotal = 0;
    var matriksBulanan = [];
    var listPegawaiRisiko = [];

    pegawaiList.forEach(function(p) {
      var pid = String(p.id);
      var jp = pegawaiJpMap[pid] || 0;
      var isPppk = String(p.status_pegawai || '').toUpperCase().indexOf('PPPK') !== -1;
      var targetJp = isPppk ? 24 : 20;

      if (isPppk) {
        pppkTotal++;
        pppkJpTotal += jp;
        if (jp >= targetJp) pppkLulus++;
      } else {
        pnsTotal++;
        pnsJpTotal += jp;
        if (jp >= targetJp) pnsLulus++;
      }

      var unitObj = unitList.find(function(u) { return String(u.id) === String(p.unit_id); });
      var unitNama = unitObj ? (unitObj.nama_unit || unitObj.nama) : (p.unit_id || '-');

      var jabObj = jabatanList.find(function(j) { return String(j.id) === String(p.jabatan_id); });
      var jabNama = jabObj ? (jabObj.nama_jabatan || jabObj.nama) : (p.jabatan_id || '-');

      var mData = {
        pegawai_id: pid,
        nama_pegawai: p.nama_lengkap || p.nama || pid,
        nip: p.nip || '-',
        status_pegawai: isPppk ? 'PPPK' : 'PNS',
        unit_nama: unitNama,
        jabatan_nama: jabNama,
        target_jp: targetJp,
        total_jp: jp,
        persen_capaian: Math.min(100, Math.round((jp / targetJp) * 100)),
        bulan: pegawaiMonthlyJpMap[pid] || [0,0,0,0,0,0,0,0,0,0,0,0]
      };
      matriksBulanan.push(mData);

      if (jp < targetJp) {
        listPegawaiRisiko.push({
          nama: p.nama_lengkap || p.nama || pid,
          nip: p.nip || '-',
          status: isPppk ? 'PPPK' : 'PNS',
          target_jp: targetJp,
          capaian_jp: jp,
          kurang_jp: targetJp - jp,
          unit_nama: unitNama
        });
      }
    });

    var totalPegawai = pegawaiList.length || 1;
    var totalLulus = pnsLulus + pppkLulus;
    var persenCapaian = Math.round((totalLulus / totalPegawai) * 100);

    // Kualifikasi Khusus (SK PPNS & Damkar Expired Alert)
    var nowMs = Date.now();
    var ms90Days = 90 * 24 * 60 * 60 * 1000;
    var kualifikasiAktifCount = 0;
    var kualifikasiExpiringSoonCount = 0;

    kualifikasiList.forEach(function(k) {
      if (String(k.status_kualifikasi).toLowerCase() !== 'tidak_aktif') {
        kualifikasiAktifCount++;
        if (k.tgl_habis_berlaku) {
          var expMs = new Date(k.tgl_habis_berlaku).getTime();
          if (!isNaN(expMs) && expMs > nowMs && (expMs - nowMs) <= ms90Days) {
            kualifikasiExpiringSoonCount++;
          }
        }
      }
    });

    // Smart AI Organization Insights
    var bulanIniJp = monthlyJpTotal[bulanIniIdx] || 0;
    var bulanLaluJp = bulanIniIdx > 0 ? (monthlyJpTotal[bulanIniIdx - 1] || 0) : 0;
    var trenPersen = bulanLaluJp > 0 ? Math.round(((bulanIniJp - bulanLaluJp) / bulanLaluJp) * 100) : (bulanIniJp > 0 ? 100 : 0);

    var topUnitId = '-';
    var topUnitAvg = 0;
    Object.keys(unitJpMap).forEach(function(uid) {
      var count = unitPegawaiCountMap[uid] || 1;
      var avg = Math.round((unitJpMap[uid] / count) * 10) / 10;
      if (avg > topUnitAvg) {
        topUnitAvg = avg;
        topUnitId = uid;
      }
    });
    var topUnitObj = unitList.find(function(u) { return String(u.id) === topUnitId; });
    var topUnitNama = topUnitObj ? (topUnitObj.nama_unit || topUnitObj.nama) : 'Bidang Pemadam Kebakaran';

    var aiInsights = {
      tren_partisipasi: {
        naik: trenPersen >= 0,
        persen: Math.abs(trenPersen),
        bulan_ini_jp: bulanIniJp,
        bulan_lalu_jp: bulanLaluJp
      },
      unit_terbaik: {
        nama: topUnitNama,
        rata_jp: topUnitAvg
      },
      prediksi_tidak_capai: {
        total_berisiko: listPegawaiRisiko.length,
        sisa_bulan: Math.max(0, 11 - bulanIniIdx),
        daftar: listPegawaiRisiko.slice(0, 5)
      }
    };

    var months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    var bulanAktifNama = months[bulanIniIdx] + ' ' + tahun;

    return {
      success: true,
      data: {
        total_kompetensi: riwayat.length,
        total_jp_tahun: totalJpTahun,
        total_pegawai: totalPegawai,
        pegawai_lulus_20jp: totalLulus,
        persen_capaian_20jp: persenCapaian,
        bulan_aktif: bulanAktifNama,

        // Klasifikasi PNS vs PPPK
        capaian_pns: {
          total: pnsTotal,
          lulus: pnsLulus,
          persen: pnsTotal > 0 ? Math.round((pnsLulus / pnsTotal) * 100) : 0,
          total_jp: pnsJpTotal,
          target_standar: '20 JP'
        },
        capaian_pppk: {
          total: pppkTotal,
          lulus: pppkLulus,
          persen: pppkTotal > 0 ? Math.round((pppkLulus / pppkTotal) * 100) : 0,
          total_jp: pppkJpTotal,
          target_standar: '24 JP'
        },

        // Status Kualifikasi Khusus
        total_kualifikasi_aktif: kualifikasiAktifCount,
        total_kualifikasi_expiring_soon: kualifikasiExpiringSoonCount,
        total_jadwal_aktif: jadwalList.length,
        total_usulan_diklat: usulanList.length,

        // Detail Koleksi
        status_count: statusCount,
        jenis_count: jenisCount,
        terbaru: riwayat.slice(-5).reverse(),
        jadwal_pelatihan: jadwalList.slice(0, 8),
        matriks_bulanan: matriksBulanan,
        ai_insights: aiInsights
      }
    };
  } catch (err) {
    return { success: false, error: 'Gagal memproses kalkulasi Dashboard: ' + err.message };
  }
}

function getAnalytics_(params, user) {
  try {
    params = params || {};
    var tahun = Number(params.tahun) || new Date().getFullYear();

    var standar = getSheetData_(LOCAL_SHEETS.M_STANDAR_KOMPETENSI);
    var riwayat = getSheetData_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI);
    var katalog = getSheetData_(LOCAL_SHEETS.M_KATALOG_DIKLAT);
    var simpeg = getSimpegLookup_();

    var pegawaiList = (simpeg && simpeg.data && simpeg.data.pegawai) || [];
    var unitList = (simpeg && simpeg.data && simpeg.data.unit) || [];
    var jabatanList = (simpeg && simpeg.data && simpeg.data.jabatan) || [];

    var gapDetails = [];
    var temuan = [];
    var rekomendasi = [];

    // Matriks Gap Analisis per Jabatan
    standar.forEach(function(std) {
      var jid = String(std.jabatan_id);
      var did = String(std.diklat_id);
      var minJp = Number(std.minimal_jp) || 20;

      var targetPegawai = pegawaiList.filter(function(p) { return String(p.jabatan_id) === jid; });
      var dObj = katalog.find(function(k) { return String(k.id) === did; });
      var jObj = jabatanList.find(function(j) { return String(j.id) === jid; });

      var namaDiklat = dObj ? dObj.nama_diklat : did;
      var namaJabatan = jObj ? (jObj.nama_jabatan || jObj.nama) : jid;

      targetPegawai.forEach(function(p) {
        var pid = String(p.id);
        var sertif = riwayat.find(function(r) {
          return String(r.pegawai_id) === pid &&
                 (String(r.diklat_id) === did || String(r.nama_kegiatan || '').toLowerCase().indexOf(namaDiklat.toLowerCase()) !== -1) &&
                 String(r.status_verifikasi).toLowerCase() === 'disetujui';
        });

        if (!sertif) {
          gapDetails.push({
            pegawai_id: pid,
            nama_pegawai: p.nama_lengkap || p.nama || pid,
            jabatan_id: jid,
            nama_jabatan: namaJabatan,
            diklat_id: did,
            nama_diklat: namaDiklat,
            tingkat_kebutuhan: std.tingkat_kebutuhan || 'WAJIB',
            minimal_jp: minJp,
            status_gap: 'Belum Mengikuti Diklat Wajib'
          });
        }
      });
    });

    if (gapDetails.length > 0) {
      temuan.push({
        level: 'PERINGATAN',
        pesan: 'Ditemukan ' + gapDetails.length + ' kesenjangan kompetensi standar jabatan (SKJ) yang belum terpenuhi personel.'
      });
      rekomendasi.push({
        prioritas: 'Prioritas 1',
        tindakan: 'Usulkan pelaksanaan in-house training teknis Satpol PP & Damkar Trenggalek untuk menutup gap kompetensi wajib.'
      });
    } else {
      temuan.push({
        level: 'OPTIMAL',
        pesan: 'Seluruh pejabat struktural dan fungsional telah memenuhi standar kompetensi minimal jabatan.'
      });
    }

    return {
      success: true,
      data: {
        gap_count: gapDetails.length,
        gap_details: gapDetails,
        temuan: temuan,
        rekomendasi: rekomendasi,
        tahun: tahun
      }
    };
  } catch (err) {
    return { success: false, error: 'Gagal memproses analisa gap: ' + err.message };
  }
}

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
      record.kode_jadwal = 'JDW-' + String(Date.now()).slice(-4);
    }
    if (!record.nama_kegiatan && record.nama_diklat) {
      record.nama_kegiatan = record.nama_diklat;
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
    return { success: true, data: list };
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

// ==================== 6. PORTOFOLIO RIWAYAT KOMPETENSI (T_RIWAYAT_KOMPETENSI) ====================

function getRiwayatList_(params, user) {
  try {
    params = params || {};
    var list = getSheetData_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI);

    if (params.filters) {
      if (params.filters.rumpun) {
        list = list.filter(function(k) { return String(k.rumpun) === String(params.filters.rumpun); });
      }
      if (params.filters.status) {
        list = list.filter(function(k) { return String(k.status_verifikasi) === String(params.filters.status); });
      }
    }

    if (params.search) {
      var q = String(params.search).toLowerCase().trim();
      list = list.filter(function(k) {
        return String(k.nama_kegiatan || '').toLowerCase().indexOf(q) !== -1 ||
               String(k.penyelenggara || '').toLowerCase().indexOf(q) !== -1 ||
               String(k.no_sertifikat || '').toLowerCase().indexOf(q) !== -1;
      });
    }

    return { success: true, data: list };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function saveRiwayat_(params, user) {
  try {
    var record = params.record || params;
    if (!record.nama_kegiatan) return { success: false, error: 'Nama kegiatan pelatihan wajib diisi.' };
    if (!record.pegawai_id) return { success: false, error: 'Pegawai pemilik sertifikat wajib dipilih.' };

    if (record.jumlah_jp === undefined || record.jumlah_jp === '') record.jumlah_jp = 20;
    if (!record.status_verifikasi) record.status_verifikasi = 'menunggu';

    var saved = saveRecord_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI, record, user);
    sendAuditLog_(user, 'SAVE_RIWAYAT', 'T_RIWAYAT_KOMPETENSI', saved.id, 'SUCCESS', 'Simpan riwayat kompetensi: ' + saved.nama_kegiatan);
    return { success: true, data: saved };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deleteRiwayat_(params, user) {
  try {
    var id = params.id;
    if (!id) return { success: false, error: 'ID riwayat wajib disertakan.' };
    var ok = softDeleteRecord_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI, id, user);
    sendAuditLog_(user, 'DELETE_RIWAYAT', 'T_RIWAYAT_KOMPETENSI', id, 'SUCCESS', 'Hapus riwayat kompetensi: ' + id);
    return { success: ok, message: 'Riwayat sertifikat berhasil dihapus.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function verifikasiRiwayat_(params, user) {
  try {
    var id = params.id;
    var status = params.status_verifikasi || 'disetujui';
    var catatan = params.catatan_verifikator || '';

    if (!id) return { success: false, error: 'ID sertifikat wajib disertakan.' };

    var rec = findRecordById_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI, id);
    if (!rec) return { success: false, error: 'Data sertifikat tidak ditemukan.' };

    rec.status_verifikasi = status;
    rec.catatan_verifikator = catatan;
    rec.verifikator_id = (user && (user.email || user.id)) || 'verifikator';
    rec.tanggal_verifikasi = new Date().toISOString();

    var saved = saveRecord_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI, rec, user);
    sendAuditLog_(user, 'VERIFIKASI_RIWAYAT', 'T_RIWAYAT_KOMPETENSI', id, 'SUCCESS', 'Verifikasi status: ' + status);
    return { success: true, data: saved };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ==================== 7. USULAN DIKLAT BOTTOM-UP (T_USULAN_DIKLAT) ====================

function getUsulanList_(params, user) {
  try {
    var list = getSheetData_(LOCAL_SHEETS.T_USULAN_DIKLAT);
    return { success: true, data: list };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function saveUsulan_(params, user) {
  try {
    var record = params.record || params;
    if (!record.nama_diklat_usulan) return { success: false, error: 'Nama diklat yang diusulkan wajib diisi.' };
    if (!record.status_usulan) record.status_usulan = 'diajukan';
    if (!record.tgl_pengajuan) record.tgl_pengajuan = new Date().toISOString().slice(0, 10);
    if (!record.tahun_anggaran_target) record.tahun_anggaran_target = new Date().getFullYear() + 1;

    var saved = saveRecord_(LOCAL_SHEETS.T_USULAN_DIKLAT, record, user);
    sendAuditLog_(user, 'SAVE_USULAN', 'T_USULAN_DIKLAT', saved.id, 'SUCCESS', 'Pengajuan usulan: ' + saved.nama_diklat_usulan);
    return { success: true, data: saved };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function reviewUsulan_(params, user) {
  try {
    var id = params.id;
    var status = params.status_usulan || 'disetujui_kasat';
    var catatan = params.catatan_pimpinan || '';

    if (!id) return { success: false, error: 'ID usulan wajib disertakan.' };

    var rec = findRecordById_(LOCAL_SHEETS.T_USULAN_DIKLAT, id);
    if (!rec) return { success: false, error: 'Data usulan diklat tidak ditemukan.' };

    rec.status_usulan = status;
    rec.catatan_pimpinan = catatan;

    var saved = saveRecord_(LOCAL_SHEETS.T_USULAN_DIKLAT, rec, user);
    sendAuditLog_(user, 'REVIEW_USULAN', 'T_USULAN_DIKLAT', id, 'SUCCESS', 'Review usulan status: ' + status);
    return { success: true, data: saved };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deleteUsulan_(params, user) {
  try {
    var id = params.id;
    if (!id) return { success: false, error: 'ID usulan wajib disertakan.' };
    var ok = softDeleteRecord_(LOCAL_SHEETS.T_USULAN_DIKLAT, id, user);
    sendAuditLog_(user, 'DELETE_USULAN', 'T_USULAN_DIKLAT', id, 'SUCCESS', 'Hapus usulan diklat: ' + id);
    return { success: ok, message: 'Usulan diklat berhasil dihapus.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

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
