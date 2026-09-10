// ============================================================
// SI-KOMPETENSI - 03_SeedData.gs
// Fungsi untuk membuat data dummy (seed) pada sheet DATA_KOMPETENSI & LAPORAN.
// Digunakan untuk pengujian dan pengembangan front-end.
// ============================================================

/**
 * Seeder Terpadu 1-Klik: Mengisi seluruh sheet (DATA_KOMPETENSI & LAPORAN)
 */
function seedAllSampleData() {
  var r1 = seedKompetensiData();
  var r2 = seedRiwayatLaporanData();
  return {
    success: true,
    message: 'Seed selesai: ' + r1.total + ' data kompetensi & ' + r2.total + ' riwayat laporan berhasil ditambahkan.'
  };
}

/**
 * Membuat data dummy pada sheet DATA_KOMPETENSI.
 * Data lama (jika ada) akan dihapus terlebih dahulu.
 * @returns {Object} hasil operasi
 */
function seedKompetensiData() {
  var sheetName = 'DATA_KOMPETENSI';
  var sh = ensureSheet_(sheetName);

  // Hapus seluruh baris lama (kecuali header)
  if (sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).clearContent();
  }
  invalidateSheetCache_(sheetName);

  var actor = systemActor_();
  var jenisList = ['diklat', 'sertifikasi', 'pelatihan', 'bimtek'];
  var namaList = [
    'Diklat Manajemen Kepemimpinan Pengawas (PKP)',
    'Pelatihan Teknis Penegakan Peraturan Daerah',
    'Bimtek Manajemen Operasional Pemadam Kebakaran Tingkat I',
    'Sertifikasi Pengadaan Barang dan Jasa Pemerintah (PBJP)',
    'Pelatihan Penyelamatan di Air & Ruang Terbatas (Water & Confined Rescue)',
    'Bimtek Penyusunan SOP Satuan Polisi Pamong Praja',
    'Diklat Revolusi Mental dan Pelayanan Prima',
    'Sertifikasi Investigasi Kebakaran Tingkat Dasar',
    'Pelatihan Analisis Beban Kerja dan Evaluasi Jabatan',
    'Bimtek Sistem Informasi Kepegawaian dan Kinerja ASN',
    'Pelatihan Intelijen Dasar Satpol PP',
    'Diklat Teknis Penanganan Konflik Sosial',
    'Sertifikasi Petugas P3K dan Tanggap Darurat',
    'Bimtek Kearsipan Dinamis Berbasis Digital',
    'Pelatihan Penegakan Protokol Kesehatan dan Trantibum'
  ];
  var penyelenggaraList = [
    'BPSDM Provinsi Jawa Timur',
    'Kemendagri / Pusdiklat Pol PP & Damkar',
    'BKPSDM Kabupaten Trenggalek',
    'Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah (LKPP)',
    'Badan Nasional Penanggulangan Bencana (BNPB)'
  ];
  var statusList = ['disetujui', 'menunggu', 'revisi'];

  var pegawaiIds = [];
  try {
    var pegawai = CoreLib.getPegawaiList(SPREADSHEET_ID, getAllHeaders_(), MASTER_SPREADSHEET_ID);
    pegawaiIds = pegawai.map(function(p) { return p.pegawai_id; });
  } catch (e) {
    pegawaiIds = ['PEG-0001', 'PEG-0002', 'PEG-0003', 'PEG-0004', 'PEG-0005'];
  }
  if (!pegawaiIds.length) pegawaiIds = ['PEG-0001'];

  var now = nowIso_();
  var created = 0;
  for (var i = 0; i < namaList.length; i++) {
    var pegawaiId = pegawaiIds[i % pegawaiIds.length];
    var tglMulai = new Date();
    tglMulai.setDate(tglMulai.getDate() - (i * 15 + 5));
    var tglSelesai = new Date(tglMulai.getTime());
    tglSelesai.setDate(tglSelesai.getDate() + 3);

    var record = {
      id: makeId_('komp'),
      pegawai_id: pegawaiId,
      jenis_kompetensi: jenisList[i % jenisList.length],
      nama_kompetensi: namaList[i],
      penyelenggara: penyelenggaraList[i % penyelenggaraList.length],
      no_sertifikat: 'SERT/' + (2026 - (i % 2)) + '/TGK/' + (1000 + i),
      jumlah_jp: 20 + (i % 5) * 10,
      tanggal_mulai: tglMulai.toISOString().slice(0, 10),
      tanggal_selesai: tglSelesai.toISOString().slice(0, 10),
      file_url: 'https://drive.google.com/sample_sertifikat_' + (i + 1) + '.pdf',
      status_verifikasi: statusList[i % statusList.length],
      catatan_verifikator: (statusList[i % statusList.length] === 'revisi') ? 'Lampirkan halaman belakang sertifikat nilai kelulusan.' : '',
      verifikator_id: (statusList[i % statusList.length] === 'disetujui') ? 'PEG-ADMIN' : '',
      tanggal_verifikasi: (statusList[i % statusList.length] === 'disetujui') ? todayIso_() : '',
      created_at: now,
      created_by: actor.id || 'system',
      updated_at: now,
      updated_by: actor.id || 'system',
      deleted_at: ''
    };
    writeRecordNoLock_(sheetName, record, false, actor);
    created++;
  }
  invalidateSheetCache_(sheetName);

  return {
    success: true,
    message: 'Seed data selesai: ' + created + ' baris ditambahkan ke ' + sheetName + '.',
    total: created
  };
}

/**
 * Membuat data dummy pada sheet LAPORAN (Riwayat Laporan).
 * Data lama (jika ada) akan dihapus terlebih dahulu.
 * @returns {Object} hasil operasi
 */
function seedRiwayatLaporanData() {
  var sheetName = 'LAPORAN';
  var sh = ensureSheet_(sheetName);

  if (sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).clearContent();
  }
  invalidateSheetCache_(sheetName);

  var actor = systemActor_();
  var periodeList = ['2026-Q1', '2026-Q2', '2026-Q3', '2025-Q4', '2025-Q3'];
  var namaLaporanList = [
    'Laporan Evaluasi Pelaksanaan Bimtek Trantibum Triwulan I',
    'Laporan Pemenuhan Jam Pelajaran (JP) Diklat Personel Damkar',
    'Laporan Monitoring & Sertifikasi Kompetensi Petugas PBJP',
    'Laporan Rekapitulasi Pelatihan Teknis Penegakan Perda',
    'Laporan Evaluasi Pasca-Diklat Kepemimpinan Pengawas',
    'Laporan Analisis Kebutuhan Diklat (AKD) Personel Satpol PP',
    'Laporan Pelaksanaan Simulasi & Penyelamatan Ruang Terbatas',
    'Laporan Akreditasi & Sertifikasi Keahlian Investigasi Kebakaran'
  ];
  var statusList = ['disetujui', 'draft', 'ditolak'];

  var pegawaiList = [];
  var unitList = [];
  var jabatanList = [];
  try {
    pegawaiList = CoreLib.getPegawaiList(SPREADSHEET_ID, getAllHeaders_(), MASTER_SPREADSHEET_ID);
    unitList = CoreLib.getUnitList(SPREADSHEET_ID, getAllHeaders_(), MASTER_SPREADSHEET_ID);
    jabatanList = CoreLib.getJabatanList(SPREADSHEET_ID, getAllHeaders_(), MASTER_SPREADSHEET_ID);
  } catch (e) {}

  var now = nowIso_();
  var created = 0;
  for (var i = 0; i < namaLaporanList.length; i++) {
    var p = pegawaiList[i % Math.max(1, pegawaiList.length)] || {};
    var u = unitList[i % Math.max(1, unitList.length)] || {};
    var j = jabatanList[i % Math.max(1, jabatanList.length)] || {};
    var st = statusList[i % statusList.length];

    var record = {
      id: makeId_('lap'),
      periode: periodeList[i % periodeList.length],
      nama_laporan: namaLaporanList[i],
      pegawai_id: p.pegawai_id || ('PEG-' + (1000 + i)),
      unit_id: p.unit_id || u.unit_id || ('UNIT-' + (100 + i)),
      jabatan_id: p.jabatan_id || j.jabatan_id || ('JAB-' + (100 + i)),
      status: st,
      catatan_verifikator: st === 'ditolak' ? 'Format dokumen lampiran belum sesuai standar Perbup.' : (st === 'disetujui' ? 'Laporan lengkap dan telah divalidasi.' : ''),
      verifikator_id: st !== 'draft' ? 'PEG-ADMIN' : '',
      tanggal_verifikasi: st !== 'draft' ? todayIso_() : '',
      created_at: now,
      created_by: actor.id || 'system',
      updated_at: now,
      updated_by: actor.id || 'system',
      deleted_at: ''
    };
    writeRecordNoLock_(sheetName, record, false, actor);
    created++;
  }
  invalidateSheetCache_(sheetName);

  return {
    success: true,
    message: 'Seed data selesai: ' + created + ' baris ditambahkan ke ' + sheetName + '.',
    total: created
  };
}

/**
 * Menghapus seluruh data pada sheet DATA_KOMPETENSI (tanpa menghapus header).
 * @returns {Object} hasil operasi
 */
function clearKompetensiData() {
  var sheetName = 'DATA_KOMPETENSI';
  var sh = ensureSheet_(sheetName);
  if (sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).clearContent();
  }
  invalidateSheetCache_(sheetName);
  return { success: true, message: 'Data DATA_KOMPETENSI dibersihkan.' };
}

/**
 * Menghapus seluruh data pada sheet LAPORAN (tanpa menghapus header).
 * @returns {Object} hasil operasi
 */
function clearRiwayatLaporanData() {
  var sheetName = 'LAPORAN';
  var sh = ensureSheet_(sheetName);
  if (sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).clearContent();
  }
  invalidateSheetCache_(sheetName);
  return { success: true, message: 'Data LAPORAN dibersihkan.' };
}
