// ============================================================
// SI-KOMPETENSI - 03_SeedData.gs (v4.0.0 — 8-Sheet Realistic Seeder)
// Realistic Seed Data untuk Satpol PP & Pemadam Kebakaran Trenggalek
// ============================================================

function seedInitialData() {
  var user = { id: 'SYSTEM_SEED', email: 'system@trenggalekkab.go.id', role: 'super' };

  // ==================== 1. SEED M_REFERENSI (Master Opsi Gabungan) ====================
  var referensi = [
    // Rumpun Kompetensi
    { id: 'REF-001', kategori: 'RUMPUN_KOMPETENSI', kode: 'MANAJERIAL', nama_nilai: 'Manajerial & Kepemimpinan', urutan: 1, status_aktif: 'true', keterangan: 'PKA, PKP, Pelatihan Kepemimpinan Pengawas/Administrator' },
    { id: 'REF-002', kategori: 'RUMPUN_KOMPETENSI', kode: 'TEKNIS_GAKDA', nama_nilai: 'Teknis Penegakan Perda (PPNS)', urutan: 2, status_aktif: 'true', keterangan: 'Penyidikan Tipiring, Penegakan Perda & Perbup' },
    { id: 'REF-003', kategori: 'RUMPUN_KOMPETENSI', kode: 'TEKNIS_DAMKAR', nama_nilai: 'Teknis Pemadam & Rescue', urutan: 3, status_aktif: 'true', keterangan: 'Fire Rescue, SCBA, Water Rescue, Vertical Rescue, Hazmat' },
    { id: 'REF-004', kategori: 'RUMPUN_KOMPETENSI', kode: 'FUNGSIONAL', nama_nilai: 'Jabatan Fungsional Pol PP & Damkar', urutan: 4, status_aktif: 'true', keterangan: 'Pelatihan Fungsional Ahli Pertama/Terampil' },
    { id: 'REF-005', kategori: 'RUMPUN_KOMPETENSI', kode: 'SOSIO_KULTURAL', nama_nilai: 'Sosio-Kultural & Pelayanan Publik', urutan: 5, status_aktif: 'true', keterangan: 'Komunikasi Publik Humanis, Negosiasi Massa' },
    { id: 'REF-006', kategori: 'RUMPUN_KOMPETENSI', kode: 'BIMTEK', nama_nilai: 'Bimbingan Teknis & Workshop', urutan: 6, status_aktif: 'true', keterangan: 'Bimtek Linmas, SOP Pengamanan Obvit, Mitigasi Kebakaran' },

    // Metode Pelatihan
    { id: 'REF-010', kategori: 'METODE_PELATIHAN', kode: 'KLASIKAL', nama_nilai: 'Klasikal (Tatap Muka / Kampus)', urutan: 1, status_aktif: 'true', keterangan: 'Pelatihan tatap muka fisik di pusdiklat' },
    { id: 'REF-011', kategori: 'METODE_PELATIHAN', kode: 'DARING', nama_nilai: 'E-Learning / Daring (MOOC ASN)', urutan: 2, status_aktif: 'true', keterangan: 'Pembelajaran online mandiri LAN / BKN' },
    { id: 'REF-012', kategori: 'METODE_PELATIHAN', kode: 'BLENDED', nama_nilai: 'Blended Learning (Kombinasi)', urutan: 3, status_aktif: 'true', keterangan: 'Kombinasi materi daring & simulasi lapangan' },

    // Tingkat Urgensi Usulan
    { id: 'REF-020', kategori: 'URGENSI_USULAN', kode: 'TINGGI', nama_nilai: 'Sangat Mendesak (Prioritas 1)', urutan: 1, status_aktif: 'true', keterangan: 'Syarat wajib operasional lapangan / sertifikasi kedaluwarsa' },
    { id: 'REF-021', kategori: 'URGENSI_USULAN', kode: 'SEDANG', nama_nilai: 'Kebutuhan Berkala (Prioritas 2)', urutan: 2, status_aktif: 'true', keterangan: 'Peningkatan jenjang karir & keahlian tambahan' },
    { id: 'REF-022', kategori: 'URGENSI_USULAN', kode: 'RENDAH', nama_nilai: 'Pengembangan Wawasan (Prioritas 3)', urutan: 3, status_aktif: 'true', keterangan: 'Seminar / lokakarya umum' },

    // Lembaga Penyelenggara Resmi
    { id: 'REF-030', kategori: 'PENYELENGGARA', kode: 'BPSDM_JATIM', nama_nilai: 'BPSDM Provinsi Jawa Timur', urutan: 1, status_aktif: 'true', keterangan: 'Badan Pengembangan SDM Pemprov Jawa Timur' },
    { id: 'REF-031', kategori: 'PENYELENGGARA', kode: 'KEMENDAGRI', nama_nilai: 'Kemendagri / Pusdiklat Regional', urutan: 2, status_aktif: 'true', keterangan: 'Badan Pengembangan SDM Kementerian Dalam Negeri RI' },
    { id: 'REF-032', kategori: 'PENYELENGGARA', kode: 'DAMKAR_DKI', nama_nilai: 'Ciracas Fire Safety Academy DKI', urutan: 3, status_aktif: 'true', keterangan: 'Pusdiklat Penanggulangan Kebakaran & Penyelamatan DKI' },
    { id: 'REF-033', kategori: 'PENYELENGGARA', kode: 'BASARNAS', nama_nilai: 'BASARNAS Jawa Timur', urutan: 4, status_aktif: 'true', keterangan: 'Badan Nasional Pencarian dan Pertolongan' },
    { id: 'REF-034', kategori: 'PENYELENGGARA', kode: 'LAN_RI', nama_nilai: 'Lembaga Administrasi Negara (LAN RI)', urutan: 5, status_aktif: 'true', keterangan: 'Pusat Pembinaan Program dan Kebijakan Pengembangan ASN' },
    { id: 'REF-035', kategori: 'PENYELENGGARA', kode: 'INTERNAL_OPD', nama_nilai: 'Satpol PP & Damkar Trenggalek', urutan: 6, status_aktif: 'true', keterangan: 'Penyelenggaraan in-house training internal instansi' },

    // Kategori Kualifikasi Khusus
    { id: 'REF-040', kategori: 'JENIS_KUALIFIKASI_KHUSUS', kode: 'SK_PPNS', nama_nilai: 'SK Pengangkatan Penyidik PPNS (Kemenkumham/Polri)', urutan: 1, status_aktif: 'true', keterangan: 'Lisensi resmi wewenang pro-justitia penegakan perda' },
    { id: 'REF-041', kategori: 'JENIS_KUALIFIKASI_KHUSUS', kode: 'DAMKAR_1', nama_nilai: 'Sertifikasi BNSP Pemadam Kebakaran Level I', urutan: 2, status_aktif: 'true', keterangan: 'Lisensi kompetensi operasional fire rescue dasar' },
    { id: 'REF-042', kategori: 'JENIS_KUALIFIKASI_KHUSUS', kode: 'SCBA_OPERATOR', nama_nilai: 'Lisensi Operator SCBA & Ruang Terbatas', urutan: 3, status_aktif: 'true', keterangan: 'Kompetensi pernapasan bertekanan udara isolatif' },
    { id: 'REF-043', kategori: 'JENIS_KUALIFIKASI_KHUSUS', kode: 'SAR_WATER', nama_nilai: 'Brevet Water Rescue & Selam Evakuasi', urutan: 4, status_aktif: 'true', keterangan: 'Lisensi penyelamatan laka air dan pesisir' },
    { id: 'REF-044', kategori: 'JENIS_KUALIFIKASI_KHUSUS', kode: 'ROPE_RESCUE', nama_nilai: 'Brevet Vertical & High Angle Rescue', urutan: 5, status_aktif: 'true', keterangan: 'Lisensi evakuasi tali ketinggian & tebing' }
  ];
  referensi.forEach(function(r) { saveRecord_(LOCAL_SHEETS.M_REFERENSI, r, user); });

  // ==================== 2. SEED M_KATALOG_DIKLAT (Kamus Master Program Diklat) ====================
  var diklat = [
    {
      id: 'DKL-001',
      kode_diklat: 'DKL-PKA',
      nama_diklat: 'Pelatihan Kepemimpinan Administrator (PKA)',
      rumpun: 'Manajerial & Kepemimpinan',
      kategori_keahlian: 'Kepemimpinan Struktural',
      penyelenggara_default: 'BPSDM Provinsi Jawa Timur',
      default_jp: 908,
      metode: 'Blended Learning',
      estimasi_biaya_default: 22500000,
      deskripsi: 'Peningkatan kompetensi kepemimpinan taktis & manajerial pejabat administrator eselon III.',
      persyaratan: 'Menduduki jabatan Administrator (Eselon III) atau JF Ahli Madya',
      status_aktif: 'true'
    },
    {
      id: 'DKL-002',
      kode_diklat: 'DKL-PPNS',
      nama_diklat: 'Diklat Pembentukan Penyidik Pegawai Negeri Sipil (PPNS) Penegak Perda',
      rumpun: 'Teknis Penegakan Perda (PPNS)',
      kategori_keahlian: 'Penyidikan PPNS',
      penyelenggara_default: 'Kemendagri / Lemdiklat Polri',
      default_jp: 400,
      metode: 'Klasikal',
      estimasi_biaya_default: 35000000,
      deskripsi: 'Kualifikasi wewenang penyidikan tindak pidana pelanggaran Perda sesuai Permendagri No. 3/2019.',
      persyaratan: 'PNS Gol minimal III/a, Sarjana Hukum/Sosial, Sehat Jasmani & Rohani',
      status_aktif: 'true'
    },
    {
      id: 'DKL-003',
      kode_diklat: 'DKL-FIRE-1',
      nama_diklat: 'Diklat Kualifikasi Pemadam Kebakaran I & Fire Rescue Operator',
      rumpun: 'Teknis Pemadam & Rescue',
      kategori_keahlian: 'Fire Rescue Operasional',
      penyelenggara_default: 'Ciracas Fire Safety Academy DKI',
      default_jp: 150,
      metode: 'Klasikal',
      estimasi_biaya_default: 7500000,
      deskripsi: 'Standar kompetensi dasar formasi regu pemadam api, penggunaan SCBA, dan evakuasi darurat.',
      persyaratan: 'Personel Regu Damkar, Lulus Tes Fisik & Paru-Paru Sehat',
      status_aktif: 'true'
    },
    {
      id: 'DKL-004',
      kode_diklat: 'DKL-WATER-RESCUE',
      nama_diklat: 'Diklat Water Rescue & Pertolongan Korban Perairan Pantai Prigi',
      rumpun: 'Teknis Pemadam & Rescue',
      kategori_keahlian: 'Water Rescue',
      penyelenggara_default: 'BASARNAS Jawa Timur',
      default_jp: 60,
      metode: 'Klasikal',
      estimasi_biaya_default: 4500000,
      deskripsi: 'Keahlian penyelamatan korban laka air, perahu karet LCR, dan teknik navigasi pesisir pantai.',
      persyaratan: 'Mampu Berenang Minimal 200 Meter Non-Stop',
      status_aktif: 'true'
    },
    {
      id: 'DKL-005',
      kode_diklat: 'DKL-VERTICAL-RESCUE',
      nama_diklat: 'Diklat Vertical Rescue & Evakuasi Ketinggian / Bangunan Gedung',
      rumpun: 'Teknis Pemadam & Rescue',
      kategori_keahlian: 'Vertical Rescue',
      penyelenggara_default: 'BASARNAS Jawa Timur',
      default_jp: 50,
      metode: 'Klasikal',
      estimasi_biaya_default: 4000000,
      deskripsi: 'Teknik evakuasi menggunakan tali (rope rescue), ascending, dan descending tebing/gedung bertingkat.',
      persyaratan: 'Tidak Memiliki Riwayat Acrophobia (Takut Ketinggian)',
      status_aktif: 'true'
    },
    {
      id: 'DKL-006',
      kode_diklat: 'DKL-JAFUNG-POLPP',
      nama_diklat: 'Pelatihan Fungsional Polisi Pamong Praja Ahli Pertama',
      rumpun: 'Jabatan Fungsional Pol PP & Damkar',
      kategori_keahlian: 'Jabatan Fungsional Pol PP',
      penyelenggara_default: 'Pusdiklat Kemendagri Regional Yogyakarta',
      default_jp: 180,
      metode: 'Blended Learning',
      estimasi_biaya_default: 8500000,
      deskripsi: 'Standar kompetensi pengawasan trantibum, penindakan non-yustisial, dan perlindungan masyarakat.',
      persyaratan: 'Pejabat Fungsional Pol PP Pertama Golongan III',
      status_aktif: 'true'
    },
    {
      id: 'DKL-007',
      kode_diklat: 'DKL-BIMTEK-LINMAS',
      nama_diklat: 'Bimtek Tata Kelola Satlinmas & Mitigasi Bencana Daerah',
      rumpun: 'Bimbingan Teknis & Workshop',
      kategori_keahlian: 'Linmas & Mitigasi',
      penyelenggara_default: 'Satpol PP & Damkar Trenggalek',
      default_jp: 32,
      metode: 'Klasikal',
      estimasi_biaya_default: 1500000,
      deskripsi: 'Penguatan kapasitas anggota Satlinmas desa/kelurahan dalam pengamanan TPS dan deteksi dini bencana.',
      persyaratan: 'Kasi Trantib Kecamatan & Anggota Satlinmas Inti',
      status_aktif: 'true'
    },
    {
      id: 'DKL-008',
      kode_diklat: 'DKL-INTEL-TIBUM',
      nama_diklat: 'Workshop Intelijen Taktis & Negosiasi Penanganan Unjuk Rasa',
      rumpun: 'Teknis Penegakan Perda (PPNS)',
      kategori_keahlian: 'Intelijen Tibum',
      penyelenggara_default: 'BPSDM Provinsi Jawa Timur',
      default_jp: 45,
      metode: 'Klasikal',
      estimasi_biaya_default: 3000000,
      deskripsi: 'Teknik pengumpulan bahan keterangan, deteksi dini konflik sosial, dan humanis crowd control.',
      persyaratan: 'Anggota Unit Reaksi Cepat (URC) & PTI Pol PP',
      status_aktif: 'true'
    }
  ];
  diklat.forEach(function(d) { saveRecord_(LOCAL_SHEETS.M_KATALOG_DIKLAT, d, user); });

  // ==================== 3. SEED M_STANDAR_KOMPETENSI (Matriks Syarat Diklat per Jabatan) ====================
  var standar = [
    { id: 'SKJ-001', jabatan_id: 'JAB-001', diklat_id: 'DKL-001', tingkat_kebutuhan: 'WAJIB', minimal_jp: 908, keterangan: 'Syarat wajib kompetensi kepemimpinan Kasat (Eselon II/b)', status_aktif: 'true' },
    { id: 'SKJ-002', jabatan_id: 'JAB-002', diklat_id: 'DKL-002', tingkat_kebutuhan: 'WAJIB', minimal_jp: 400, keterangan: 'Kabid Gakda wajib memiliki sertifikasi penyidik PPNS', status_aktif: 'true' },
    { id: 'SKJ-003', jabatan_id: 'JAB-004', diklat_id: 'DKL-003', tingkat_kebutuhan: 'WAJIB', minimal_jp: 150, keterangan: 'Kabid Damkar wajib memiliki sertifikasi teknis Fire Rescue', status_aktif: 'true' },
    { id: 'SKJ-004', jabatan_id: 'JAB-007', diklat_id: 'DKL-003', tingkat_kebutuhan: 'WAJIB', minimal_jp: 150, keterangan: 'Komandan Regu Damkar wajib kualifikasi Pemadam I', status_aktif: 'true' },
    { id: 'SKJ-005', jabatan_id: 'JAB-007', diklat_id: 'DKL-004', tingkat_kebutuhan: 'DISARANKAN', minimal_jp: 60, keterangan: 'Danru Damkar disarankan memiliki sertifikasi Water Rescue', status_aktif: 'true' },
    { id: 'SKJ-006', jabatan_id: 'JAB-008', diklat_id: 'DKL-006', tingkat_kebutuhan: 'WAJIB', minimal_jp: 180, keterangan: 'Polisi Pamong Praja Ahli Pertama wajib diklat fungsional', status_aktif: 'true' },
    { id: 'SKJ-007', jabatan_id: 'JAB-009', diklat_id: 'DKL-003', tingkat_kebutuhan: 'WAJIB', minimal_jp: 150, keterangan: 'Pemadam Terampil wajib lulus kualifikasi Fire I', status_aktif: 'true' }
  ];
  standar.forEach(function(s) { saveRecord_(LOCAL_SHEETS.M_STANDAR_KOMPETENSI, s, user); });

  // ==================== 4. SEED T_JADWAL_DIKLAT (Agenda Pelatihan Terjadwal) ====================
  var jadwal = [
    {
      id: 'JDW-001',
      kode_jadwal: 'JDW-2026-09-01',
      diklat_id: 'DKL-003',
      nama_kegiatan: 'Diklat Kualifikasi Pemadam Kebakaran I & Fire Rescue Operator',
      rumpun: 'Teknis Pemadam & Rescue',
      penyelenggara: 'Ciracas Fire Safety Academy DKI',
      metode: 'Klasikal',
      jumlah_jp: 150,
      tgl_mulai: '2026-09-25',
      tgl_selesai: '2026-10-05',
      bulan_periode: 'September 2026',
      tahun_periode: 2026,
      kuota_peserta: 6,
      lokasi_pelaksanaan: 'Kampus Pusdiklat Ciracas Jakarta Timur',
      link_pendaftaran: 'https://damkar.jakarta.go.id/diklat',
      status_jadwal: 'Buka Pendaftaran',
      keterangan: 'Prioritas anggota baru regu pemadam pos Watulimo & Panggul.'
    },
    {
      id: 'JDW-002',
      kode_jadwal: 'JDW-2026-09-02',
      diklat_id: 'DKL-002',
      nama_kegiatan: 'Diklat Pembentukan PPNS Penegak Perda Pola 400 JP',
      rumpun: 'Teknis Penegakan Perda (PPNS)',
      penyelenggara: 'Kemendagri / Lemdiklat Polri Megamendung',
      metode: 'Klasikal',
      jumlah_jp: 400,
      tgl_mulai: '2026-09-15',
      tgl_selesai: '2026-10-15',
      bulan_periode: 'September 2026',
      tahun_periode: 2026,
      kuota_peserta: 3,
      lokasi_pelaksanaan: 'Pusdiklat Reskrim Polri Megamendung Bogor',
      link_pendaftaran: 'https://diklat.kemendagri.go.id',
      status_jadwal: 'Buka Pendaftaran',
      keterangan: 'Peningkatan personil penyidik yustisial bidang penegakan perda.'
    },
    {
      id: 'JDW-003',
      kode_jadwal: 'JDW-2026-09-03',
      diklat_id: 'DKL-007',
      nama_kegiatan: 'Bimtek Tata Kelola Satlinmas & Mitigasi Bencana Daerah',
      rumpun: 'Bimbingan Teknis & Workshop',
      penyelenggara: 'Satpol PP & Damkar Trenggalek',
      metode: 'Klasikal',
      jumlah_jp: 32,
      tgl_mulai: '2026-09-12',
      tgl_selesai: '2026-09-14',
      bulan_periode: 'September 2026',
      tahun_periode: 2026,
      kuota_peserta: 30,
      lokasi_pelaksanaan: 'Ruang Rapat Praja Mukti Satpol PP Trenggalek',
      link_pendaftaran: '',
      status_jadwal: 'Sedang Berjalan',
      keterangan: 'Pelatihan internal persiapan pengamanan ketertiban wilayah.'
    },
    {
      id: 'JDW-004',
      kode_jadwal: 'JDW-2026-10-01',
      diklat_id: 'DKL-004',
      nama_kegiatan: 'Diklat Water Rescue & Pertolongan Korban Perairan Pantai Prigi',
      rumpun: 'Teknis Pemadam & Rescue',
      penyelenggara: 'BASARNAS Jawa Timur',
      metode: 'Klasikal',
      jumlah_jp: 60,
      tgl_mulai: '2026-10-08',
      tgl_selesai: '2026-10-12',
      bulan_periode: 'Oktober 2026',
      tahun_periode: 2026,
      kuota_peserta: 8,
      lokasi_pelaksanaan: 'Pos Basarnas Pelabuhan Perikanan Prigi Watulimo',
      link_pendaftaran: '',
      status_jadwal: 'Segera Dibuka',
      keterangan: 'Kesiapsiagaan penanganan laka air libur akhir tahun.'
    }
  ];
  jadwal.forEach(function(j) { saveRecord_(LOCAL_SHEETS.T_JADWAL_DIKLAT, j, user); });

  // ==================== 5. SEED T_PENUGASAN_PESERTA (Surat Perintah Tugas Kasat) ====================
  var penugasan = [
    {
      id: 'TGS-001',
      jadwal_id: 'JDW-001',
      pegawai_id: 'PEG-006',
      no_surat_tugas: '800/SPT/412/35.03/2026',
      tgl_surat_tugas: '2026-09-10',
      pejabat_penandatangan: 'Kepala Satpol PP & Pemadam Kebakaran',
      status_keikutsertaan: 'DITUGASKAN',
      nilai_kelulusan: '',
      no_sertifikat_terbit: '',
      catatan: 'Dibiayai APBD DPA Satpol PP & Damkar TA 2026.'
    },
    {
      id: 'TGS-002',
      jadwal_id: 'JDW-001',
      pegawai_id: 'PEG-007',
      no_surat_tugas: '800/SPT/412/35.03/2026',
      tgl_surat_tugas: '2026-09-10',
      pejabat_penandatangan: 'Kepala Satpol PP & Pemadam Kebakaran',
      status_keikutsertaan: 'DITUGASKAN',
      nilai_kelulusan: '',
      no_sertifikat_terbit: '',
      catatan: 'Anggota Regu B Pos Watulimo.'
    },
    {
      id: 'TGS-003',
      jadwal_id: 'JDW-003',
      pegawai_id: 'PEG-005',
      no_surat_tugas: '800/SPT/398/35.03/2026',
      tgl_surat_tugas: '2026-09-08',
      pejabat_penandatangan: 'Kepala Satpol PP & Pemadam Kebakaran',
      status_keikutsertaan: 'HADIR_AKTIF',
      nilai_kelulusan: 'Sangat Memuaskan (92.5)',
      no_sertifikat_terbit: 'BIMTEK/LINMAS/2026/01',
      catatan: 'Telah menyelesaikan seluruh modul pelatihan.'
    }
  ];
  penugasan.forEach(function(t) { saveRecord_(LOCAL_SHEETS.T_PENUGASAN_PESERTA, t, user); });

  // ==================== 6. SEED T_RIWAYAT_KOMPETENSI (Catatan Sertifikat & JP) ====================
  var riwayat = [
    { id: 'KMP-001', pegawai_id: 'PEG-001', diklat_id: 'DKL-001', jadwal_id: '', nama_kegiatan: 'Pelatihan Kepemimpinan Administrator (PKA)', rumpun: 'Manajerial & Kepemimpinan', penyelenggara: 'BPSDM Provinsi Jawa Timur', no_sertifikat: '893.3/452/PKA/2025', tgl_terbit: '2025-06-20', tgl_mulai: '2025-02-10', tgl_selesai: '2025-06-15', tgl_kedaluwarsa: '', jumlah_jp: 908, metode: 'Klasikal', file_url: 'https://drive.google.com', status_verifikasi: 'disetujui', catatan_verifikator: 'Sertifikat PKA terverifikasi valid.', verifikator_id: 'bkpsdm@trenggalekkab.go.id', tanggal_verifikasi: '2025-06-25T08:00:00.000Z' },
    { id: 'KMP-002', pegawai_id: 'PEG-002', diklat_id: 'DKL-002', jadwal_id: '', nama_kegiatan: 'Diklat Pembentukan PPNS Penegak Perda', rumpun: 'Teknis Penegakan Perda (PPNS)', penyelenggara: 'Kemendagri / Lemdiklat Polri', no_sertifikat: 'PPNS/089/Kemendagri/2025', tgl_terbit: '2025-04-20', tgl_mulai: '2025-04-05', tgl_selesai: '2025-04-18', tgl_kedaluwarsa: '2028-04-20', jumlah_jp: 120, metode: 'Klasikal', file_url: 'https://drive.google.com', status_verifikasi: 'disetujui', catatan_verifikator: 'Surat Keputusan Pengangkatan PPNS telah diterbitkan.', verifikator_id: 'bkpsdm@trenggalekkab.go.id', tanggal_verifikasi: '2025-04-22T09:30:00.000Z' },
    { id: 'KMP-003', pegawai_id: 'PEG-004', diklat_id: 'DKL-003', jadwal_id: '', nama_kegiatan: 'Diklat Kualifikasi Pemadam Kebakaran I & Fire Rescue Operator', rumpun: 'Teknis Pemadam & Rescue', penyelenggara: 'Ciracas Fire Safety Academy DKI', no_sertifikat: 'DAMKAR/2025/VII/112', tgl_terbit: '2025-07-22', tgl_mulai: '2025-07-01', tgl_selesai: '2025-07-20', tgl_kedaluwarsa: '2028-07-22', jumlah_jp: 150, metode: 'Klasikal', file_url: 'https://drive.google.com', status_verifikasi: 'disetujui', catatan_verifikator: 'Kualifikasi Fire Rescue terverifikasi.', verifikator_id: 'bkpsdm@trenggalekkab.go.id', tanggal_verifikasi: '2025-07-25T11:00:00.000Z' },
    { id: 'KMP-004', pegawai_id: 'PEG-006', diklat_id: 'DKL-004', jadwal_id: '', nama_kegiatan: 'Diklat Water Rescue & Pertolongan Korban Perairan Pantai Prigi', rumpun: 'Teknis Pemadam & Rescue', penyelenggara: 'BASARNAS Jawa Timur', no_sertifikat: 'WR-PRIGI/2025/08', tgl_terbit: '2025-08-15', tgl_mulai: '2025-08-10', tgl_selesai: '2025-08-14', tgl_kedaluwarsa: '2027-08-15', jumlah_jp: 60, metode: 'Klasikal', file_url: 'https://drive.google.com', status_verifikasi: 'disetujui', catatan_verifikator: 'Kesiapsiagaan Pos Watulimo pantai Prigi.', verifikator_id: 'bkpsdm@trenggalekkab.go.id', tanggal_verifikasi: '2025-08-18T10:00:00.000Z' },
    { id: 'KMP-005', pegawai_id: 'PEG-007', diklat_id: 'DKL-005', jadwal_id: '', nama_kegiatan: 'Diklat Vertical Rescue & Evakuasi Ketinggian', rumpun: 'Teknis Pemadam & Rescue', penyelenggara: 'BASARNAS Jawa Timur', no_sertifikat: 'VR-TRENGGALEK/2025/11', tgl_terbit: '2025-11-05', tgl_mulai: '2025-11-01', tgl_selesai: '2025-11-04', tgl_kedaluwarsa: '2027-11-05', jumlah_jp: 50, metode: 'Klasikal', file_url: 'https://drive.google.com', status_verifikasi: 'disetujui', catatan_verifikator: 'Sertifikasi Rope Rescue disetujui.', verifikator_id: 'bkpsdm@trenggalekkab.go.id', tanggal_verifikasi: '2025-11-08T13:45:00.000Z' },
    { id: 'KMP-006', pegawai_id: 'PEG-003', diklat_id: 'DKL-006', jadwal_id: '', nama_kegiatan: 'Pelatihan Fungsional Polisi Pamong Praja Ahli Pertama', rumpun: 'Jabatan Fungsional Pol PP & Damkar', penyelenggara: 'Pusdiklat Kemendagri Regional Yogyakarta', no_sertifikat: 'F-POLPP/2025/334', tgl_terbit: '2025-08-28', tgl_mulai: '2025-08-01', tgl_selesai: '2025-08-25', tgl_kedaluwarsa: '', jumlah_jp: 180, metode: 'Klasikal', file_url: 'https://drive.google.com', status_verifikasi: 'menunggu', catatan_verifikator: '', verifikator_id: '', tanggal_verifikasi: '' },
    { id: 'KMP-007', pegawai_id: 'PEG-005', diklat_id: 'DKL-007', jadwal_id: 'JDW-003', nama_kegiatan: 'Bimtek Tata Kelola Satlinmas & Mitigasi Bencana Daerah', rumpun: 'Bimbingan Teknis & Workshop', penyelenggara: 'Satpol PP & Damkar Trenggalek', no_sertifikat: 'BIMTEK/LINMAS/2026/01', tgl_terbit: '2026-01-20', tgl_mulai: '2026-01-15', tgl_selesai: '2026-01-18', tgl_kedaluwarsa: '', jumlah_jp: 32, metode: 'Klasikal', file_url: '', status_verifikasi: 'disetujui', catatan_verifikator: 'Pemenuhan 20 JP TA 2026.', verifikator_id: 'miftachurrochim@trenggalekkab.go.id', tanggal_verifikasi: '2026-01-22T09:00:00.000Z' },
    { id: 'KMP-008', pegawai_id: 'PEG-008', diklat_id: 'DKL-008', jadwal_id: '', nama_kegiatan: 'Workshop Intelijen Taktis & Negosiasi Penanganan Unjuk Rasa', rumpun: 'Teknis Penegakan Perda (PPNS)', penyelenggara: 'BPSDM Provinsi Jawa Timur', no_sertifikat: 'WS-INTEL/2026/02', tgl_terbit: '2026-02-18', tgl_mulai: '2026-02-15', tgl_selesai: '2026-02-17', tgl_kedaluwarsa: '', jumlah_jp: 45, metode: 'Klasikal', file_url: '', status_verifikasi: 'menunggu', catatan_verifikator: '', verifikator_id: '', tanggal_verifikasi: '' }
  ];
  riwayat.forEach(function(r) { saveRecord_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI, r, user); });

  // ==================== 7. SEED T_KUALIFIKASI_KHUSUS (Lisensi & SK Kadaluwarsa) ====================
  var kualifikasi = [
    {
      id: 'KLS-001',
      pegawai_id: 'PEG-002',
      jenis_kualifikasi: 'SK Pengangkatan Penyidik PPNS (Kemenkumham/Polri)',
      nomor_sk_lisensi: 'M.HH-02.AH.09.01/2023',
      no_registrasi_nasional: 'PPNS-3503-001',
      lembaga_penerbit: 'Kementerian Hukum & HAM RI',
      tgl_sk_terbit: '2023-04-10',
      tgl_habis_berlaku: '2028-04-10',
      status_kualifikasi: 'AKTIF',
      file_sk_url: 'https://drive.google.com',
      catatan_perpanjangan: 'Wewenang penyidikan tindak pidana perda di wilayah Kab. Trenggalek.',
      alert_h90_sent: 'false'
    },
    {
      id: 'KLS-002',
      pegawai_id: 'PEG-004',
      jenis_kualifikasi: 'Sertifikasi BNSP Pemadam Kebakaran Level I',
      nomor_sk_lisensi: 'BNSP/DAMKAR/2023/1189',
      no_registrasi_nasional: 'BNSP-FR-2023-991',
      lembaga_penerbit: 'Badan Nasional Sertifikasi Profesi (BNSP)',
      tgl_sk_terbit: '2023-10-15',
      tgl_habis_berlaku: '2026-10-15', // Masuk dalam H-90 alert di 2026!
      status_kualifikasi: 'AKTIF',
      file_sk_url: 'https://drive.google.com',
      catatan_perpanjangan: 'Perlu dijadwalkan uji perpanjangan kompetensi BNSP di BPSDM Jatim.',
      alert_h90_sent: 'false'
    },
    {
      id: 'KLS-003',
      pegawai_id: 'PEG-006',
      jenis_kualifikasi: 'Brevet Water Rescue & Selam Evakuasi',
      nomor_sk_lisensi: 'SAR-LCR/BASARNAS/2024/09',
      no_registrasi_nasional: 'SAR-35-088',
      lembaga_penerbit: 'BASARNAS Jawa Timur',
      tgl_sk_terbit: '2024-05-12',
      tgl_habis_berlaku: '2027-05-12',
      status_kualifikasi: 'AKTIF',
      file_sk_url: 'https://drive.google.com',
      catatan_perpanjangan: 'Regu siaga evakuasi pesisir pantai selatan Prigi.',
      alert_h90_sent: 'false'
    }
  ];
  kualifikasi.forEach(function(k) { saveRecord_(LOCAL_SHEETS.T_KUALIFIKASI_KHUSUS, k, user); });

  // ==================== 8. SEED T_USULAN_DIKLAT (Rencana Diklat Tahunan & Realisasi) ====================
  var usulan = [
    {
      id: 'USL-001',
      tahun_anggaran: 2026,
      periode_triwulan: 'TW I (Jan - Mar)',
      unit_id: 'UNT-003',
      jabatan_id: 'JAB-004',
      pegawai_id: 'PEG-004',
      diklat_id: 'DKL-003',
      nama_program_diklat: 'Diklat Kualifikasi Pemadam Kebakaran I & Fire Rescue Operator',
      nama_diklat_usulan: 'Diklat Kualifikasi Pemadam Kebakaran I & Fire Rescue Operator',
      rumpun: 'Teknis Pemadam & Rescue',
      metode: 'Klasikal',
      penyelenggara: 'Ciracas Fire Safety Academy DKI',
      target_penyelenggara: 'Ciracas Fire Safety Academy DKI',
      target_jp: 150,
      estimasi_biaya: 7500000,
      sumber_dana: 'APBD Kabupaten Trenggalek',
      urgensi: 'Sangat Mendesak (Prioritas 1)',
      alasan_justifikasi: 'Standar kompetensi dasar regu operasional pemadam api dan rescue pos induk.',
      alasan_usulan: 'Standar kompetensi dasar regu operasional pemadam api dan rescue pos induk.',
      status_rencana: 'Terealisasi',
      status_usulan: 'disetujui_kasat',
      catatan_pimpinan: 'Tuntas dilaksanakan dengan sertifikat terbit valid.',
      tgl_pengajuan: '2026-01-10',
      tahun_anggaran_target: 2026
    },
    {
      id: 'USL-002',
      tahun_anggaran: 2026,
      periode_triwulan: 'TW II (Apr - Jun)',
      unit_id: 'UNT-002',
      jabatan_id: 'JAB-002',
      pegawai_id: 'PEG-002',
      diklat_id: 'DKL-002',
      nama_program_diklat: 'Diklat Pembentukan Penyidik Pegawai Negeri Sipil (PPNS) Penegak Perda',
      nama_diklat_usulan: 'Diklat Pembentukan Penyidik Pegawai Negeri Sipil (PPNS) Penegak Perda',
      rumpun: 'Teknis Penegakan Perda (PPNS)',
      metode: 'Klasikal',
      penyelenggara: 'Kemendagri / Lemdiklat Polri',
      target_penyelenggara: 'Kemendagri / Lemdiklat Polri',
      target_jp: 120,
      estimasi_biaya: 35000000,
      sumber_dana: 'Beasiswa BPSDM Kemendagri',
      urgensi: 'Sangat Mendesak (Prioritas 1)',
      alasan_justifikasi: 'Memenuhi kuota pejabat fungsional PPNS untuk penindakan yustisial tipiring perda.',
      alasan_usulan: 'Memenuhi kuota pejabat fungsional PPNS untuk penindakan yustisial tipiring perda.',
      status_rencana: 'Terealisasi',
      status_usulan: 'disetujui_kasat',
      catatan_pimpinan: 'SK Pelantikan PPNS telah diterbitkan Kemenkumham RI.',
      tgl_pengajuan: '2026-01-15',
      tahun_anggaran_target: 2026
    },
    {
      id: 'USL-003',
      tahun_anggaran: 2026,
      periode_triwulan: 'TW III (Jul - Sep)',
      unit_id: 'UNT-003',
      jabatan_id: 'JAB-006',
      pegawai_id: 'PEG-006',
      diklat_id: 'DKL-004',
      nama_program_diklat: 'Diklat Water Rescue & Pertolongan Korban Perairan Pantai Prigi',
      nama_diklat_usulan: 'Diklat Water Rescue & Pertolongan Korban Perairan Pantai Prigi',
      rumpun: 'Teknis Pemadam & Rescue',
      metode: 'Klasikal',
      penyelenggara: 'BASARNAS Jawa Timur',
      target_penyelenggara: 'BASARNAS Jawa Timur',
      target_jp: 60,
      estimasi_biaya: 4500000,
      sumber_dana: 'APBD Kabupaten Trenggalek',
      urgensi: 'Sangat Mendesak (Prioritas 1)',
      alasan_justifikasi: 'Kesiapsiagaan Pos Watulimo pantai Prigi menghadapi evakuasi laka laut.',
      alasan_usulan: 'Kesiapsiagaan Pos Watulimo pantai Prigi menghadapi evakuasi laka laut.',
      status_rencana: 'Terealisasi',
      status_usulan: 'disetujui_kasat',
      catatan_pimpinan: 'Telah bersertifikat resmi Basarnas.',
      tgl_pengajuan: '2026-02-01',
      tahun_anggaran_target: 2026
    },
    {
      id: 'USL-004',
      tahun_anggaran: 2026,
      periode_triwulan: 'TW IV (Okt - Des)',
      unit_id: 'UNT-003',
      jabatan_id: 'JAB-007',
      pegawai_id: 'PEG-007',
      diklat_id: 'DKL-005',
      nama_program_diklat: 'Diklat Vertical Rescue & Evakuasi Ketinggian / Bangunan Gedung',
      nama_diklat_usulan: 'Diklat Vertical Rescue & Evakuasi Ketinggian / Bangunan Gedung',
      rumpun: 'Teknis Pemadam & Rescue',
      metode: 'Klasikal',
      penyelenggara: 'BASARNAS Jawa Timur',
      target_penyelenggara: 'BASARNAS Jawa Timur',
      target_jp: 50,
      estimasi_biaya: 4000000,
      sumber_dana: 'APBD Kabupaten Trenggalek',
      urgensi: 'Mendesak (Prioritas 2)',
      alasan_justifikasi: 'Keahlian teknik rope rescue evakuasi tebing dan gedung bertingkat.',
      alasan_usulan: 'Keahlian teknik rope rescue evakuasi tebing dan gedung bertingkat.',
      status_rencana: 'Terjadwal',
      status_usulan: 'disetujui_kasat',
      catatan_pimpinan: 'Pelaksanaan di Pos Panggul / Watulimo pada Triwulan IV.',
      tgl_pengajuan: '2026-02-10',
      tahun_anggaran_target: 2026
    },
    {
      id: 'USL-005',
      tahun_anggaran: 2027,
      periode_triwulan: 'TW I (Jan - Mar)',
      unit_id: 'UNT-002',
      jabatan_id: 'JAB-008',
      pegawai_id: 'PEG-008',
      diklat_id: 'DKL-008',
      nama_program_diklat: 'Workshop Intelijen Taktis & Negosiasi Penanganan Unjuk Rasa',
      nama_diklat_usulan: 'Workshop Intelijen Taktis & Negosiasi Penanganan Unjuk Rasa',
      rumpun: 'Teknis Penegakan Perda (PPNS)',
      metode: 'Non-Klasikal / E-Learning',
      penyelenggara: 'BPSDM Provinsi Jawa Timur',
      target_penyelenggara: 'BPSDM Provinsi Jawa Timur',
      target_jp: 45,
      estimasi_biaya: 2500000,
      sumber_dana: 'APBD Kabupaten Trenggalek',
      urgensi: 'Mendesak (Prioritas 2)',
      alasan_justifikasi: 'Peningkatan kapasitas deteksi dini dan negosiasi persuasif humanis.',
      alasan_usulan: 'Peningkatan kapasitas deteksi dini dan negosiasi persuasif humanis.',
      status_rencana: 'Direncanakan',
      status_usulan: 'diajukan',
      catatan_pimpinan: 'Diusulkan masuk dalam DPA Perubahan Satpol PP TA 2027.',
      tgl_pengajuan: '2026-02-15',
      tahun_anggaran_target: 2027
    }
  ];
  usulan.forEach(function(u) { saveRecord_(LOCAL_SHEETS.T_USULAN_DIKLAT, u, user); });

  Logger.log('✅ Berhasil seed data realistis ke dalam 8 Sheet Lengkap SI-KOMPETENSI!');
}
