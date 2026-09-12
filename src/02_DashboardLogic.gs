// ============================================================
// SI-KOMPETENSI - 02_DashboardLogic.gs (Dashboard, Matriks & Analytics)
// ============================================================

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
