// ============================================================
// SI-KOMPETENSI - 03_SeedData.gs (v3.0.0 — 5 Sheet Master Satelit)
// Realistic Seed Data untuk Satpol PP & Pemadam Kebakaran Trenggalek
// ============================================================

function seedInitialData() {
  var user = { id: 'SYSTEM_SEED', email: 'system@trenggalekkab.go.id', role: 'super' };

  // ==================== 1. SEED M_REFERENSI (Master Data Gabungan) ====================
  var referensi = [
    // Rumpun Kompetensi
    { id: 'REF-001', kategori: 'RUMPUN_KOMPETENSI', kode: 'MANAJERIAL', nama_nilai: 'Manajerial & Kepemimpinan', urutan: 1, status_aktif: 'true', keterangan: 'PKA, PKP, Pelatihan Kepemimpinan Pengawas/Administrator' },
    { id: 'REF-002', kategori: 'RUMPUN_KOMPETENSI', kode: 'TEKNIS_GAKDA', nama_nilai: 'Teknis Penegakan Perda (PPNS)', urutan: 2, status_aktif: 'true', keterangan: 'Penyidikan Tipiring, Penegakan Perda & Perbup' },
    { id: 'REF-003', kategori: 'RUMPUN_KOMPETENSI', kode: 'TEKNIS_DAMKAR', nama_nilai: 'Teknis Pemadam & Rescue', urutan: 3, status_aktif: 'true', keterangan: 'Fire Rescue, SCBA, Water Rescue, Vertical Rescue, Hazmat' },
    { id: 'REF-004', kategori: 'RUMPUN_KOMPETENSI', kode: 'FUNGSIONAL', nama_nilai: 'Jabatan Fungsional Pol PP & Damkar', urutan: 4, status_aktif: 'true', keterangan: 'Pelatihan Fungsional Ahli Pertama/Terampil' },
    { id: 'REF-005', kategori: 'RUMPUN_KOMPETENSI', kode: 'SOSIO_KULTURAL', nama_nilai: 'Sosio-Kultural & Pelayanan Publik', urutan: 5, status_aktif: 'true', keterangan: 'Komunikasi Publik Humanis, Negosiasi Massa' },
    { id: 'REF-006', kategori: 'RUMPUN_KOMPETENSI', kode: 'BIMTEK', nama_nilai: 'Bimbingan Teknis & Workshop', urutan: 6, status_aktif: 'true', keterangan: 'Bimtek Linmas, SOP Pengamanan Obvit, Mitigasi Kebakaran' },

    // Metode Pelatihan
    { id: 'REF-010', kategori: 'METODE_PELATIHAN', kode: 'KLASIKAL', nama_nilai: 'Klasikal (Tatap Muka / Diklat Kampus)', urutan: 1, status_aktif: 'true', keterangan: 'Pelatihan tatap muka fisik di asrama / pusdiklat' },
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
    { id: 'REF-035', kategori: 'PENYELENGGARA', kode: 'INTERNAL_OPD', nama_nilai: 'Satpol PP & Damkar Trenggalek', urutan: 6, status_aktif: 'true', keterangan: 'Penyelenggaraan in-house training internal instansi' }
  ];
  referensi.forEach(function(r) { saveRecord_(LOCAL_SHEETS.M_REFERENSI, r, user); });

  // ==================== 2. SEED M_KATALOG_DIKLAT (Kamus Resmi Pelatihan) ====================
  var diklat = [
    { id: 'DKL-001', kode_diklat: 'DKL-PKA', nama_diklat: 'Pelatihan Kepemimpinan Administrator (PKA)', rumpun: 'Manajerial & Kepemimpinan', kategori_keahlian: 'Kepemimpinan Struktural', penyelenggara_default: 'BPSDM Provinsi Jawa Timur', default_jp: 908, estimasi_biaya_default: 22500000, deskripsi: 'Peningkatan kompetensi kepemimpinan taktis & manajerial pejabat administrator eselon III.', status_aktif: 'true' },
    { id: 'DKL-002', kode_diklat: 'DKL-PPNS', nama_diklat: 'Diklat Pembentukan Penyidik Pegawai Negeri Sipil (PPNS) Penegak Perda', rumpun: 'Teknis Penegakan Perda (PPNS)', kategori_keahlian: 'Penyidikan PPNS', penyelenggara_default: 'Kemendagri / Lemdiklat Polri', default_jp: 400, estimasi_biaya_default: 35000000, deskripsi: 'Kualifikasi wewenang penyidikan tindak pidana pelanggaran Perda sesuai Permendagri No. 3/2019.', status_aktif: 'true' },
    { id: 'DKL-003', kode_diklat: 'DKL-FIRE-1', nama_diklat: 'Diklat Kualifikasi Pemadam Kebakaran I & Fire Rescue Operator', rumpun: 'Teknis Pemadam & Rescue', kategori_keahlian: 'Fire Rescue Operasional', penyelenggara_default: 'Ciracas Fire Safety Academy DKI', default_jp: 150, estimasi_biaya_default: 7500000, deskripsi: 'Standar kompetensi dasar formasi regu pemadam api, penggunaan SCBA, dan evakuasi darurat.', status_aktif: 'true' },
    { id: 'DKL-004', kode_diklat: 'DKL-WATER-RESCUE', nama_diklat: 'Diklat Water Rescue & Pertolongan Korban Perairan Pantai Prigi', rumpun: 'Teknis Pemadam & Rescue', kategori_keahlian: 'Water Rescue', penyelenggara_default: 'BASARNAS Jawa Timur', default_jp: 60, estimasi_biaya_default: 4500000, deskripsi: 'Keahlian penyelamatan korban laka air, perahu karet LCR, dan teknik navigasi pesisir pantai.', status_aktif: 'true' },
    { id: 'DKL-005', kode_diklat: 'DKL-VERTICAL-RESCUE', nama_diklat: 'Diklat Vertical Rescue & Evakuasi Ketinggian / Bangunan Gedung', rumpun: 'Teknis Pemadam & Rescue', kategori_keahlian: 'Vertical Rescue', penyelenggara_default: 'BASARNAS Jawa Timur', default_jp: 50, estimasi_biaya_default: 4000000, deskripsi: 'Teknik evakuasi menggunakan tali (rope rescue), ascending, dan descending tebing/gedung bertingkat.', status_aktif: 'true' },
    { id: 'DKL-006', kode_diklat: 'DKL-JAFUNG-POLPP', nama_diklat: 'Pelatihan Fungsional Polisi Pamong Praja Ahli Pertama', rumpun: 'Jabatan Fungsional Pol PP & Damkar', kategori_keahlian: 'Jabatan Fungsional Pol PP', penyelenggara_default: 'Pusdiklat Kemendagri Regional Yogyakarta', default_jp: 180, estimasi_biaya_default: 8500000, deskripsi: 'Standar kompetensi pengawasan trantibum, penindakan non-yustisial, dan perlindungan masyarakat.', status_aktif: 'true' },
    { id: 'DKL-007', kode_diklat: 'DKL-BIMTEK-LINMAS', nama_diklat: 'Bimtek Tata Kelola Satlinmas & Mitigasi Bencana Daerah', rumpun: 'Bimbingan Teknis & Workshop', kategori_keahlian: 'Linmas & Mitigasi', penyelenggara_default: 'Satpol PP & Damkar Trenggalek', default_jp: 32, estimasi_biaya_default: 1500000, deskripsi: 'Penguatan kapasitas anggota Satlinmas desa/kelurahan dalam pengamanan TPS dan deteksi dini bencana.', status_aktif: 'true' },
    { id: 'DKL-008', kode_diklat: 'DKL-INTEL-TIBUM', nama_diklat: 'Workshop Intelijen Taktis & Negosiasi Penanganan Unjuk Rasa', rumpun: 'Teknis Penegakan Perda (PPNS)', kategori_keahlian: 'Intelijen Tibum', penyelenggara_default: 'BPSDM Provinsi Jawa Timur', default_jp: 45, estimasi_biaya_default: 3000000, deskripsi: 'Teknik pengumpulan bahan keterangan, deteksi dini konflik sosial, dan humanis crowd control.', status_aktif: 'true' }
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

  // ==================== 4. SEED T_RIWAYAT_KOMPETENSI (Catatan Sertifikat & 20 JP) ====================
  var riwayat = [
    { id: 'KMP-001', pegawai_id: 'PEG-001', diklat_id: 'DKL-001', nama_kegiatan: 'Pelatihan Kepemimpinan Administrator (PKA)', rumpun: 'Manajerial & Kepemimpinan', penyelenggara: 'BPSDM Provinsi Jawa Timur', no_sertifikat: '893.3/452/PKA/2025', tgl_terbit: '2025-06-20', tgl_mulai: '2025-02-10', tgl_selesai: '2025-06-15', tgl_kedaluwarsa: '', jumlah_jp: 908, metode: 'Klasikal', file_url: 'https://drive.google.com', status_verifikasi: 'disetujui', catatan_verifikator: 'Sertifikat PKA terverifikasi valid.', verifikator_id: 'bkpsdm@trenggalekkab.go.id', tanggal_verifikasi: '2025-06-25T08:00:00.000Z' },
    { id: 'KMP-002', pegawai_id: 'PEG-002', diklat_id: 'DKL-002', nama_kegiatan: 'Diklat Pembentukan PPNS Penegak Perda', rumpun: 'Teknis Penegakan Perda (PPNS)', penyelenggara: 'Kemendagri / Lemdiklat Polri', no_sertifikat: 'PPNS/089/Kemendagri/2025', tgl_terbit: '2025-04-20', tgl_mulai: '2025-04-05', tgl_selesai: '2025-04-18', tgl_kedaluwarsa: '2028-04-20', jumlah_jp: 120, metode: 'Klasikal', file_url: 'https://drive.google.com', status_verifikasi: 'disetujui', catatan_verifikator: 'Surat Keputusan Pengangkatan PPNS telah diterbitkan.', verifikator_id: 'bkpsdm@trenggalekkab.go.id', tanggal_verifikasi: '2025-04-22T09:30:00.000Z' },
    { id: 'KMP-003', pegawai_id: 'PEG-004', diklat_id: 'DKL-003', nama_kegiatan: 'Diklat Kualifikasi Pemadam Kebakaran I & Fire Rescue Operator', rumpun: 'Teknis Pemadam & Rescue', penyelenggara: 'Ciracas Fire Safety Academy DKI', no_sertifikat: 'DAMKAR/2025/VII/112', tgl_terbit: '2025-07-22', tgl_mulai: '2025-07-01', tgl_selesai: '2025-07-20', tgl_kedaluwarsa: '2028-07-22', jumlah_jp: 150, metode: 'Klasikal', file_url: 'https://drive.google.com', status_verifikasi: 'disetujui', catatan_verifikator: 'Kualifikasi Fire Rescue terverifikasi.', verifikator_id: 'bkpsdm@trenggalekkab.go.id', tanggal_verifikasi: '2025-07-25T11:00:00.000Z' },
    { id: 'KMP-004', pegawai_id: 'PEG-006', diklat_id: 'DKL-004', nama_kegiatan: 'Diklat Water Rescue & Pertolongan Korban Perairan Pantai Prigi', rumpun: 'Teknis Pemadam & Rescue', penyelenggara: 'BASARNAS Jawa Timur', no_sertifikat: 'WR-PRIGI/2025/08', tgl_terbit: '2025-08-15', tgl_mulai: '2025-08-10', tgl_selesai: '2025-08-14', tgl_kedaluwarsa: '2027-08-15', jumlah_jp: 60, metode: 'Klasikal', file_url: 'https://drive.google.com', status_verifikasi: 'disetujui', catatan_verifikator: 'Kesiapsiagaan Pos Watulimo pantai Prigi.', verifikator_id: 'bkpsdm@trenggalekkab.go.id', tanggal_verifikasi: '2025-08-18T10:00:00.000Z' },
    { id: 'KMP-005', pegawai_id: 'PEG-007', diklat_id: 'DKL-005', nama_kegiatan: 'Diklat Vertical Rescue & Evakuasi Ketinggian', rumpun: 'Teknis Pemadam & Rescue', penyelenggara: 'BASARNAS Jawa Timur', no_sertifikat: 'VR-TRENGGALEK/2025/11', tgl_terbit: '2025-11-05', tgl_mulai: '2025-11-01', tgl_selesai: '2025-11-04', tgl_kedaluwarsa: '2027-11-05', jumlah_jp: 50, metode: 'Klasikal', file_url: 'https://drive.google.com', status_verifikasi: 'disetujui', catatan_verifikator: 'Sertifikasi Rope Rescue disetujui.', verifikator_id: 'bkpsdm@trenggalekkab.go.id', tanggal_verifikasi: '2025-11-08T13:45:00.000Z' },
    { id: 'KMP-006', pegawai_id: 'PEG-003', diklat_id: 'DKL-006', nama_kegiatan: 'Pelatihan Fungsional Polisi Pamong Praja Ahli Pertama', rumpun: 'Jabatan Fungsional Pol PP & Damkar', penyelenggara: 'Pusdiklat Kemendagri Regional Yogyakarta', no_sertifikat: 'F-POLPP/2025/334', tgl_terbit: '2025-08-28', tgl_mulai: '2025-08-01', tgl_selesai: '2025-08-25', tgl_kedaluwarsa: '', jumlah_jp: 180, metode: 'Klasikal', file_url: 'https://drive.google.com', status_verifikasi: 'menunggu', catatan_verifikator: '', verifikator_id: '', tanggal_verifikasi: '' },
    { id: 'KMP-007', pegawai_id: 'PEG-005', diklat_id: 'DKL-007', nama_kegiatan: 'Bimtek Tata Kelola Satlinmas & Mitigasi Bencana Daerah', rumpun: 'Bimbingan Teknis & Workshop', penyelenggara: 'Satpol PP & Damkar Trenggalek', no_sertifikat: 'BIMTEK/LINMAS/2026/01', tgl_terbit: '2026-01-20', tgl_mulai: '2026-01-15', tgl_selesai: '2026-01-18', tgl_kedaluwarsa: '', jumlah_jp: 32, metode: 'Klasikal', file_url: '', status_verifikasi: 'disetujui', catatan_verifikator: 'Pemenuhan 20 JP TA 2026.', verifikator_id: 'miftachurrochim@trenggalekkab.go.id', tanggal_verifikasi: '2026-01-22T09:00:00.000Z' },
    { id: 'KMP-008', pegawai_id: 'PEG-008', diklat_id: 'DKL-008', nama_kegiatan: 'Workshop Intelijen Taktis & Negosiasi Penanganan Unjuk Rasa', rumpun: 'Teknis Penegakan Perda (PPNS)', penyelenggara: 'BPSDM Provinsi Jawa Timur', no_sertifikat: 'WS-INTEL/2026/02', tgl_terbit: '2026-02-18', tgl_mulai: '2026-02-15', tgl_selesai: '2026-02-17', tgl_kedaluwarsa: '', jumlah_jp: 45, metode: 'Klasikal', file_url: '', status_verifikasi: 'menunggu', catatan_verifikator: '', verifikator_id: '', tanggal_verifikasi: '' }
  ];
  riwayat.forEach(function(r) { saveRecord_(LOCAL_SHEETS.T_RIWAYAT_KOMPETENSI, r, user); });

  // ==================== 5. SEED T_USULAN_DIKLAT (Usulan Bottom-Up AKD) ====================
  var usulan = [
    { id: 'USL-001', pegawai_id: 'PEG-009', diklat_id: 'DKL-003', nama_diklat_usulan: 'Diklat Kualifikasi Pemadam Kebakaran I & Fire Safety Rescue Operator', rumpun: 'Teknis Pemadam & Rescue', target_penyelenggara: 'Ciracas Fire Safety Academy DKI', alasan_usulan: 'Meningkatkan kesiapsiagaan personel baru regu pemadam pos induk kota dalam penanganan api dan evakuasi gedung.', urgensi: 'Sangat Mendesak (Prioritas 1)', estimasi_biaya: 7500000, status_usulan: 'disetujui_kasat', catatan_pimpinan: 'Diusulkan pada DPA Satpol PP & Damkar TA 2027.', tgl_pengajuan: '2026-02-01', tahun_anggaran_target: 2027 },
    { id: 'USL-002', pegawai_id: 'PEG-008', diklat_id: 'DKL-002', nama_diklat_usulan: 'Diklat Lanjutan PPNS Penyidikan Tindak Pidana Ringan Tipiring Perda', rumpun: 'Teknis Penegakan Perda (PPNS)', target_penyelenggara: 'Kemendagri / Lemdiklat Polri', alasan_usulan: 'Memperkuat kapasitas penegakan hukum yustisial dan penuntutan denda pelanggaran perda tata ruang.', urgensi: 'Kebutuhan Berkala (Prioritas 2)', estimasi_biaya: 5000000, status_usulan: 'diajukan', catatan_pimpinan: '', tgl_pengajuan: '2026-02-10', tahun_anggaran_target: 2027 },
    { id: 'USL-003', pegawai_id: 'PEG-006', diklat_id: 'DKL-004', nama_diklat_usulan: 'Pelatihan Sertifikasi Selam Search & Rescue (SAR) Pantai Prigi', rumpun: 'Teknis Pemadam & Rescue', target_penyelenggara: 'BASARNAS Jawa Timur', alasan_usulan: 'Menunjang keselamatan wisatawan dan evakuasi kecelakaan laut di kawasan pesisir Watulimo.', urgensi: 'Sangat Mendesak (Prioritas 1)', estimasi_biaya: 4500000, status_usulan: 'direkomendasikan_bkpsdm', catatan_pimpinan: 'Rekomendasi beasiswa diklat kedinasan telah dikirim ke BKPSDM Trenggalek.', tgl_pengajuan: '2026-02-15', tahun_anggaran_target: 2027 }
  ];
  usulan.forEach(function(u) { saveRecord_(LOCAL_SHEETS.T_USULAN_DIKLAT, u, user); });

  Logger.log('✅ Berhasil seed data realistis ke dalam 5 Sheet Lokal SI-KOMPETENSI!');
}
