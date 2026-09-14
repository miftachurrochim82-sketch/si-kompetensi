// ============================================================
// SI-KOMPETENSI - 03_DashboardLogic.gs (v4.1.0 — FASE 1)
// Dashboard, Matriks & Analytics
// ============================================================
// Changelog v4.1 (FASE 1):
// - FIX-D1: getAnalytics_ O(n^3) -> O(n^2). Build index riwayat
//           (pegawai_id|diklat_id) supaya find jadi O(1).
// - FIX-D2: getAnalytics_ filter tahun. Sebelumnya param tahun
//           diterima tapi tidak dipakai.
// - FIX-D3: kualifikasiAktifCount sekarang cek tgl_habis_berlaku.
//           Sebelumnya hanya cek status (lisensi kadaluwarsa tetap
//           dihitung aktif).
// - FIX-D4: Normalisasi ID pakai normId_ / normStr_ dari Utils.gs.
//           Cegah bug "PEG-001 " vs "PEG-001".
// - FIX-D5: terbaru sort by tgl_terbit desc (bukan slice -5 dari urutan sheet).
// - FIX-D6: jadwal_pelatihan filter status_jadwal aktif + sort by tgl_mulai.
// - FIX-D7: pegawaiById map dibangun sekali, hindari find() dalam loop.
// - FIX-D8: clone objek sebelum mutasi (cegah korupsi cache).
// - FIX-D9: JP orphan (riwayat pegawai mutasi/pensiun) didokumentasikan.
// - FIX-D10: tambah field persen_capaian_standar (baru),
//            persen_capaian_20jp dipertahankan untuk kompat.
// ============================================================

// Konstanta status jadwal yang dianggap "aktif"
var JADWAL_STATUS_AKTIF_ = ['terjadwal', 'buka pendaftaran', 'segera dibuka', 'sedang berjalan'];

// ==================== DASHBOARD ====================

function apiDashboard_(params, user) {
  try {
    params = params || {};
    var tahun = Number(params.tahun) || new Date().getFullYear();
    var bulanIniIdx = new Date().getMonth();

    // FIX-D4: gunakan helper normalisasi
    var riwayat = getSheetData_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI) || [];
    var simpeg = getSimpegLookup_();
    var pegawaiList = (simpeg && simpeg.data && simpeg.data.pegawai) || [];
    var unitList = (simpeg && simpeg.data && simpeg.data.unit) || [];
    var jabatanList = (simpeg && simpeg.data && simpeg.data.jabatan) || [];
    var jadwalList = getSheetData_(LOCAL_SHEETS.T_JADWAL_DIKLAT) || [];
    var kualifikasiList = getSheetData_(LOCAL_SHEETS.T_KUALIFIKASI_KHUSUS) || [];
    var usulanList = getSheetData_(LOCAL_SHEETS.T_USULAN_DIKLAT) || [];

    var totalJpTahun = 0;
    var jenisCount = {};
    var statusCount = { disetujui: 0, menunggu: 0, ditolak: 0 };
    var pegawaiJpMap = {};
    var pegawaiMonthlyJpMap = {};
    var unitJpMap = {};
    var unitPegawaiCountMap = {};

    var monthlyJpTotal = [0,0,0,0,0,0,0,0,0,0,0,0];

    // ============================================================
    // FIX-D7: build map pegawai SEKALI — hindari find() dalam loop
    // ============================================================
    var pegawaiById = {};
    var unitById = {};
    var jabatanById = {};

    pegawaiList.forEach(function(p) {
      var pid = normId_(p.id || p.pegawai_id);
      if (pid) pegawaiById[pid] = p;

      pegawaiJpMap[pid] = 0;
      pegawaiMonthlyJpMap[pid] = [0,0,0,0,0,0,0,0,0,0,0,0];

      var uid = normId_(p.unit_id) || 'UNKNOWN';
      unitPegawaiCountMap[uid] = (unitPegawaiCountMap[uid] || 0) + 1;
      if (unitJpMap[uid] === undefined) unitJpMap[uid] = 0;
    });

    unitList.forEach(function(u) {
      var uid = normId_(u.id || u.unit_id);
      if (uid) unitById[uid] = u;
    });

    jabatanList.forEach(function(j) {
      var jid = normId_(j.id || j.jabatan_id);
      if (jid) jabatanById[jid] = j;
    });

    // ============================================================
    // Proses riwayat — FIX-D4: normalisasi ID konsisten
    // FIX-D9: JP untuk pegawai yang tidak ada di pegawaiList
    //         (mutasi/pensiun) TIDAK dimasukkan ke map pegawai,
    //         tapi TETAP masuk ke totalJpTahun & monthlyJpTotal.
    // ============================================================
    riwayat.forEach(function(r) {
      var st = normStr_(r.status_verifikasi || 'menunggu');
      statusCount[st] = (statusCount[st] || 0) + 1;

      var jp = Number(r.jumlah_jp) || 0;
      var rumpun = r.rumpun || 'Lainnya';
      jenisCount[rumpun] = (jenisCount[rumpun] || 0) + 1;

      var rTahun = tahun;
      var rBulan = 0;
      var dateField = r.tgl_selesai || r.tgl_terbit || r.tgl_mulai || r.created_at;
      var d = parseDate_(dateField);
      if (d) {
        rTahun = d.getFullYear();
        rBulan = d.getMonth();
      }

      if (rTahun === tahun && st === 'disetujui') {
        totalJpTahun += jp;
        var pid = normId_(r.pegawai_id);

        if (pegawaiJpMap[pid] !== undefined) {
          pegawaiJpMap[pid] = pegawaiJpMap[pid] + jp;
          if (pegawaiMonthlyJpMap[pid] && rBulan >= 0 && rBulan < 12) {
            pegawaiMonthlyJpMap[pid][rBulan] += jp;
          }
        }
        // else: JP orphan (pegawai tidak ada di list) — tetap masuk total

        if (rBulan >= 0 && rBulan < 12) {
          monthlyJpTotal[rBulan] += jp;
        }

        var pegObj = pegawaiById[pid];
        if (pegObj && pegObj.unit_id) {
          var uid = normId_(pegObj.unit_id);
          unitJpMap[uid] = (unitJpMap[uid] || 0) + jp;
        }
      }
    });

    // ============================================================
    // Klasifikasi PNS vs PPPK
    // ============================================================
    var pnsTotal = 0, pnsLulus = 0, pnsJpTotal = 0;
    var pppkTotal = 0, pppkLulus = 0, pppkJpTotal = 0;
    var matriksBulanan = [];
    var listPegawaiRisiko = [];

    pegawaiList.forEach(function(p) {
      var pid = normId_(p.id || p.pegawai_id);
      var jp = pegawaiJpMap[pid] || 0;
      var isPppk = normStr_(p.status_pegawai).indexOf('pppk') !== -1;
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

      var unitObj = unitById[normId_(p.unit_id)];
      var unitNama = unitObj ? (unitObj.nama_unit || unitObj.nama) : (p.unit_id || '-');

      var jabObj = jabatanById[normId_(p.jabatan_id)];
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

    // ============================================================
    // FIX-D3: kualifikasiAktifCount sekarang cek tgl_habis_berlaku
    // ============================================================
    var nowMs = Date.now();
    var hDays = Number(getEnvProperty_('alert_h_days_lisensi')) || 90;
    var msThreshold = hDays * 24 * 60 * 60 * 1000;

    var kualifikasiAktifCount = 0;
    var kualifikasiExpiringSoonCount = 0;
    var kualifikasiExpiredCount = 0;

    kualifikasiList.forEach(function(k) {
      if (normStr_(k.status_kualifikasi) === 'tidak_aktif') return;

      var expMs = k.tgl_habis_berlaku ? new Date(k.tgl_habis_berlaku).getTime() : NaN;

      if (isNaN(expMs)) {
        // Tidak ada tanggal — anggap aktif
        kualifikasiAktifCount++;
      } else if (expMs <= nowMs) {
        // Sudah kadaluwarsa
        kualifikasiExpiredCount++;
      } else if ((expMs - nowMs) <= msThreshold) {
        // Akan kadaluwarsa dalam H-{hDays}
        kualifikasiExpiringSoonCount++;
        kualifikasiAktifCount++;
      } else {
        // Masih aktif dan lama
        kualifikasiAktifCount++;
      }
    });

    // ============================================================
    // AI Insights
    // ============================================================
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
    var topUnitObj = unitById[topUnitId];
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

    // ============================================================
    // FIX-D5: terbaru sort by tgl_terbit desc
    // FIX-D6: jadwal_pelatihan filter status aktif + sort
    // FIX-D8: clone supaya tidak mutasi cache
    // ============================================================
    var terbaruSorted = riwayat.slice().sort(function(a, b) {
      var da = parseDate_(b.tgl_terbit || b.tgl_selesai || b.created_at);
      var db2 = parseDate_(a.tgl_terbit || a.tgl_selesai || a.created_at);
      if (!da) return 1;
      if (!db2) return -1;
      return da.getTime() - db2.getTime();
    }).slice(0, 5).map(function(r) { return Object.assign({}, r); });

    var jadwalAktif = jadwalList.filter(function(j) {
      return JADWAL_STATUS_AKTIF_.indexOf(normStr_(j.status_jadwal)) !== -1;
    }).sort(function(a, b) {
      var da = parseDate_(a.tgl_mulai);
      var db2 = parseDate_(b.tgl_mulai);
      if (!da) return 1;
      if (!db2) return -1;
      return da.getTime() - db2.getTime();
    }).slice(0, 8).map(function(j) { return Object.assign({}, j); });

    return {
      success: true,
      data: {
        total_kompetensi: riwayat.length,
        total_kompetensi_tahun: riwayat.filter(function(r) {
          var d = parseDate_(r.tgl_selesai || r.tgl_terbit || r.tgl_mulai);
          return d && d.getFullYear() === tahun;
        }).length,
        total_jp_tahun: totalJpTahun,
        total_pegawai: totalPegawai,
        pegawai_lulus_20jp: totalLulus,
        persen_capaian_20jp: persenCapaian,
        persen_capaian_standar: persenCapaian,
        bulan_aktif: bulanAktifNama,

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

        // Kualifikasi
        total_kualifikasi_aktif: kualifikasiAktifCount,
        total_kualifikasi_expiring_soon: kualifikasiExpiringSoonCount,
        total_kualifikasi_expired: kualifikasiExpiredCount,
        alert_threshold_days: hDays,

        // FIX-D6: total_jadwal_aktif sekarang benar-benar filter aktif
        total_jadwal_aktif: jadwalAktif.length,
        total_jadwal_semua: jadwalList.length,
        total_usulan_diklat: usulanList.length,

        status_count: statusCount,
        jenis_count: jenisCount,
        terbaru: terbaruSorted,
        jadwal_pelatihan: jadwalAktif,
        matriks_bulanan: matriksBulanan,
        ai_insights: aiInsights
      }
    };
  } catch (err) {
    Logger.log('[apiDashboard_] ' + err.message + '\n' + err.stack);
    return { success: false, error: 'Gagal memproses kalkulasi Dashboard: ' + err.message };
  }
}

// ==================== ANALYTICS (GAP ANALYSIS) ====================

function getAnalytics_(params, user) {
  try {
    params = params || {};
    var tahun = Number(params.tahun) || new Date().getFullYear();

    var standar = getSheetData_(LOCAL_SHEETS.M_STANDAR_KOMPETENSI) || [];
    var riwayat = getSheetData_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI) || [];
    var katalog = getSheetData_(LOCAL_SHEETS.M_KATALOG_DIKLAT) || [];
    var simpeg = getSimpegLookup_();

    var pegawaiList = (simpeg && simpeg.data && simpeg.data.pegawai) || [];
    var unitList = (simpeg && simpeg.data && simpeg.data.unit) || [];
    var jabatanList = (simpeg && simpeg.data && simpeg.data.jabatan) || [];

    if (!pegawaiList.length && typeof FALLBACK_PEGAWAI !== 'undefined') {
      pegawaiList = FALLBACK_PEGAWAI.slice();
    }
    if (!unitList.length && typeof FALLBACK_UNIT_KERJA !== 'undefined') {
      unitList = FALLBACK_UNIT_KERJA.slice();
    }
    if (!jabatanList.length && typeof FALLBACK_JABATAN !== 'undefined') {
      jabatanList = FALLBACK_JABATAN.slice();
    }

    // ============================================================
    // FIX-D2: filter riwayat per tahun
    // ============================================================
    var riwayatTahun = riwayat.filter(function(r) {
      var d = parseDate_(r.tgl_terbit || r.tgl_selesai || r.tgl_mulai);
      return d && d.getFullYear() === tahun;
    });

    // ============================================================
    // FIX-D1: build index riwayat (pegawai_id|diklat_id) — O(1) find
    // ============================================================
    var riwayatIndex = {};
    riwayatTahun.forEach(function(r) {
      if (normStr_(r.status_verifikasi) !== 'disetujui') return;
      var key = normId_(r.pegawai_id) + '|' + normId_(r.diklat_id);
      if (!riwayatIndex[key]) riwayatIndex[key] = r;
    });

    // Index katalog & jabatan & unit
    var katalogById = {};
    katalog.forEach(function(k) { katalogById[normId_(k.id)] = k; });

    var jabatanById = {};
    jabatanList.forEach(function(j) {
      if (j.id) jabatanById[normId_(j.id)] = j;
      if (j.jabatan_id) jabatanById[normId_(j.jabatan_id)] = j;
      if (j.kode_jabatan) jabatanById[normId_(j.kode_jabatan)] = j;
    });
    if (typeof FALLBACK_JABATAN !== 'undefined') {
      FALLBACK_JABATAN.forEach(function(j) {
        if (j.id && !jabatanById[normId_(j.id)]) jabatanById[normId_(j.id)] = j;
        if (j.jabatan_id && !jabatanById[normId_(j.jabatan_id)]) jabatanById[normId_(j.jabatan_id)] = j;
        if (j.kode_jabatan && !jabatanById[normId_(j.kode_jabatan)]) jabatanById[normId_(j.kode_jabatan)] = j;
      });
    }

    var unitById = {};
    unitList.forEach(function(u) { unitById[normId_(u.id || u.unit_id)] = u; });

    // Index pegawai per jabatan_id
    var pegawaiByJabatanId = {};
    pegawaiList.forEach(function(p) {
      var jid = normId_(p.jabatan_id);
      if (!jid) return;
      if (!pegawaiByJabatanId[jid]) pegawaiByJabatanId[jid] = [];
      pegawaiByJabatanId[jid].push(p);
    });

    var gapDetails = [];
    var temuan = [];
    var rekomendasi = [];
    var totalEvaluasi = 0;

    // ============================================================
    // Gap analysis — FIX-D1: now uses indexes, no nested finds
    // ============================================================
    standar.forEach(function(std) {
      var jid = normId_(std.jabatan_id);
      var did = normId_(std.diklat_id);
      var minJp = Number(std.minimal_jp) || 20;

      var dObj = katalogById[did];
      var jObj = jabatanById[jid];

      var namaDiklat = dObj ? dObj.nama_diklat : did;
      var rumpunDiklat = dObj ? (dObj.rumpun || 'Teknis Operasional') : 'Teknis Operasional';
      var namaJabatan = jObj ? (jObj.nama_jabatan || jObj.nama) : jid;

      // FIX-D1: langsung ambil dari index
      var targetPegawai = pegawaiByJabatanId[jid] || [];

      targetPegawai.forEach(function(p) {
        totalEvaluasi++;
        var pid = normId_(p.id || p.pegawai_id);
        var uObj = unitById[normId_(p.unit_id)];
        var namaUnit = uObj ? (uObj.nama_unit || uObj.nama) : 'Satpol PP & Damkar';

        // FIX-D1: lookup O(1)
        var sertif = riwayatIndex[pid + '|' + did];

        if (!sertif) {
          var isWajib = String(std.tingkat_kebutuhan).toUpperCase() === 'WAJIB';
          gapDetails.push({
            pegawai_id: pid,
            nama_pegawai: p.nama_lengkap || p.nama || pid,
            nip: p.nip || '-',
            unit_id: p.unit_id || '',
            nama_unit: namaUnit,
            jabatan_id: jid,
            nama_jabatan: namaJabatan,
            diklat_id: did,
            nama_diklat: namaDiklat,
            rumpun: rumpunDiklat,
            tingkat_kebutuhan: isWajib ? 'WAJIB' : 'DISARANKAN',
            minimal_jp: minJp,
            realisasi_jp: 0,
            status_gap: isWajib ? 'Belum Memenuhi Syarat Wajib' : 'Disarankan Pelatihan Lanjutan',
            rekomendasi_tindak_lanjut: isWajib ? 'Prioritaskan masuk Rencana Diklat Tahunan (TW I/II)' : 'Fasilitasi melalui E-Learning / MOOC BPSDM'
          });
        }
      });
    });

    var totalWajibGap = gapDetails.filter(function(g) { return g.tingkat_kebutuhan === 'WAJIB'; }).length;
    var totalDisarankanGap = gapDetails.filter(function(g) { return g.tingkat_kebutuhan !== 'WAJIB'; }).length;
    var uniquePegawaiTerdampak = [];
    gapDetails.forEach(function(g) {
      if (uniquePegawaiTerdampak.indexOf(g.pegawai_id) === -1) uniquePegawaiTerdampak.push(g.pegawai_id);
    });

    var persenKepatuhan = totalEvaluasi > 0 ? Math.round(((totalEvaluasi - gapDetails.length) / totalEvaluasi) * 100) : 100;

    if (gapDetails.length > 0) {
      temuan.push({
        level: 'PERINGATAN',
        pesan: 'Terdeteksi ' + gapDetails.length + ' kesenjangan kompetensi standar jabatan pada ' + uniquePegawaiTerdampak.length + ' personel aktif (' + totalWajibGap + ' Wajib, ' + totalDisarankanGap + ' Disarankan).'
      });
      rekomendasi.push({
        prioritas: 'Prioritas 1 (Mendesak)',
        tindakan: 'Akomodasikan ' + totalWajibGap + ' pelatihan wajib ke dalam Rencana Diklat Tahunan ' + tahun + ' / usulan DPA dinas.'
      });
      rekomendasi.push({
        prioritas: 'Prioritas 2 (Dukungan)',
        tindakan: 'Arahkan personel terkait untuk mengikuti program pembelajaran mandiri (MOOC ASN BerAKHLAK / Webinar BPSDM Jatim).'
      });
    } else {
      temuan.push({
        level: 'OPTIMAL',
        pesan: 'Seluruh pejabat struktural dan personel operasional telah memenuhi standar kompetensi minimal jabatan (Tingkat Kepatuhan 100%).'
      });
    }

    return {
      success: true,
      data: {
        total_evaluasi: totalEvaluasi,
        gap_count: gapDetails.length,
        total_wajib_gap: totalWajibGap,
        total_disarankan_gap: totalDisarankanGap,
        persen_kepatuhan: persenKepatuhan,
        total_pegawai_terdampak: uniquePegawaiTerdampak.length,
        gap_details: gapDetails,
        temuan: temuan,
        rekomendasi: rekomendasi,
        tahun: tahun,
        total_riwayat_tahun: riwayatTahun.length
      }
    };
  } catch (err) {
    Logger.log('[getAnalytics_] ' + err.message + '\n' + err.stack);
    return { success: false, error: 'Gagal memproses analisa gap: ' + err.message };
  }
}

// ==================== SELF-TEST ====================

function testDashboardSelfCheck() {
  Logger.log('=== 03_DashboardLogic.gs v4.1 self-check ===');

  // Test 1: Dashboard
  var dash = apiDashboard_({ tahun: 2026 }, { role: 'admin', email: 'test@test.com' });
  if (dash.success) {
    Logger.log('✅ apiDashboard_ OK');
    Logger.log('   Total pegawai: ' + dash.data.total_pegawai);
    Logger.log('   Total JP tahun: ' + dash.data.total_jp_tahun);
    Logger.log('   Kualifikasi aktif: ' + dash.data.total_kualifikasi_aktif);
    Logger.log('   Kualifikasi expired: ' + dash.data.total_kualifikasi_expired);
    Logger.log('   Kualifikasi expiring soon: ' + dash.data.total_kualifikasi_expiring_soon);
    Logger.log('   Total jadwal aktif: ' + dash.data.total_jadwal_aktif + ' dari ' + dash.data.total_jadwal_semua);
    Logger.log('   Terbaru (sorted): ' + dash.data.terbaru.length + ' item');
  } else {
    Logger.log('❌ apiDashboard_: ' + dash.error);
  }

  // Test 2: Analytics
  var ana = getAnalytics_({ tahun: 2026 }, { role: 'admin', email: 'test@test.com' });
  if (ana.success) {
    Logger.log('✅ getAnalytics_ OK');
    Logger.log('   Total evaluasi: ' + ana.data.total_evaluasi);
    Logger.log('   Gap count: ' + ana.data.gap_count);
    Logger.log('   Persen kepatuhan: ' + ana.data.persen_kepatuhan + '%');
    Logger.log('   Riwayat tahun ' + ana.data.tahun + ': ' + ana.data.total_riwayat_tahun);
  } else {
    Logger.log('❌ getAnalytics_: ' + ana.error);
  }

  Logger.log('=== Selesai ===');
}
