// ============================================================
// SI-KOMPETENSI - 03_SeedData.gs
// Fungsi untuk membuat data dummy (seed) pada sheet DATA_KOMPETENSI.
// Digunakan untuk pengujian dan pengembangan front-end.
// ============================================================

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
