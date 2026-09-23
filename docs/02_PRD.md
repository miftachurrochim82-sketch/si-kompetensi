# 02 — PRD [SI-KOMPETENSI: Portofolio, Jadwal & Lisensi Khusus ASN — 2026-09-19]

> Modul & user story. Satu modul = satu "kamar" backend/frontend (pola file per domain
> si-kompetensi, sudah dilaksanakan sejak v5.0: `03_DashboardLogic.gs` s/d
> `08_RiwayatLogic.gs` + `V_*.html` per modul).
>
> **Perubahan v6.0.1 (2026-09-19)**: adopsi CoreLib-First penuh (dispatcher
> `CoreLib.dispatchAction`, `localPreSaveHook_` P1/P2, filter soft-delete otomatis);
> bump pin CoreLib ke **17** + CDN `@v2.9.1` + Vue `3.5.42`; tombol aksi tabel
> pakai `.btn-icon`/`.btn-icon-danger` kit CDN.

## P1 — Dashboard & Standar JP
- Story: ASN & pimpinan memantau agregat pemenuhan 20/24 JP dan kondisi lisensi.
- AC: kartu KPI total sertifikat, total JP tahun, capaian target JP, lisensi aktif, jadwal aktif, usulan diklat; chart doughnut pemenuhan target + bar distribusi per rumpun; kartu PNS vs PPPK dengan progress bar terpisah; panel AI insight (tren partisipasi bulanan, unit teraktif, prediksi pegawai tidak capai target); alert H-90 lisensi; agenda pelatihan bulan ini (4 kartu klaim); tombol "Buka Analisa Lengkap".
- Modul backend: `03_DashboardLogic.gs` (`apiDashboard_`).
- Modul frontend: `V_Dashboard.html` (6 `<app-stat-card>` + `<app-chart-bar>` + `<app-chart-doughnut bare>`).

## P2 — Profil & Paspor Kompetensi ASN
- Story: pegawai melihat identitas SIMPEG-aware, capaian JP tahunan, transkrip sertifikat, standar jabatan (SKJ), dan rencana diklat pribadi.
- AC:
  - **Kartu Identitas**: nama (via `formatNamaPegawai`), NIP, pangkat/gol, unit kerja, jabatan — resolve dari `simpegLookup` / `masterPegawaiList`.
  - **Speedometer capaian JP**: pilih tahun (tahun ini ±2), progress bar terhadap target (20 PNS / 24 PPPK), status lulus/belum.
  - **Sub-tab**: Transkrip Riwayat Sertifikat (semua tahun), Standar Kompetensi Jabatan (SKJ) — gap analysis per pegawai, Rencana & Usulan Diklat (individual development plan).
  - **Simulasi pegawai (admin)**: dropdown di header untuk melihat paspor pegawai lain.
  - Tombol Upload Sertifikat & Unduh Paspor PDF (jsPDF on-demand).
- Modul backend: `08_RiwayatLogic.gs` (`getRiwayatList_`), `06_MasterLogic.gs` (`getMasterSatelit_` — standar SKJ), `07_RencanaLogic.gs` (`getUsulanList_`).
- Modul frontend: `V_Profil.html` + computed di `J_State.html` (`activePegawaiDetail`, `activePegawaiRiwayatTahun`, `activePegawaiSkjList`, dll.).

## P3 — Agenda Jadwal Diklat (T_JADWAL_DIKLAT + T_PENUGASAN_PESERTA)
- Story: admin menyusun kalender diklat tahunan; pegawai melihat agenda & mengklaim sertifikatnya.
- AC:
  - CRUD jadwal (admin): nama_kegiatan, rumpun, penyelenggara (dropdown + manual), metode, jumlah_jp, tgl_mulai/selesai, kuota, lokasi, link pendaftaran, status_jadwal (whitelist: Terjadwal / Buka Pendaftaran / Segera Dibuka / Sedang Berjalan / Selesai / Dibatalkan).
  - **Ownership**: user boleh edit field hasil (status, nilai, no sertifikat, catatan, jumlah_peserta_hadir) meski bukan pembuat — sisanya hanya admin/owner (whitelist `JADWAL_HASIL_FIELDS_`).
  - Delete: hanya admin; dicegah bila masih ada penugasan terkait.
  - Bulk assign peserta (verifikator+): SPT + tanggal (WIB via `CoreLib.todayIsoLocal()`), skip duplikat, report per item.
  - Pegawai klik "Klaim Sertifikat" → form riwayat terisi otomatis dari jadwal.
  - Filter: tahun, bulan, rumpun; export Excel via kit.
- Modul backend: `04_DiklatLogic.gs` (`getJadwalList_`, `saveJadwal_`, `deleteJadwal_`, `getPenugasanList_`, `savePenugasan_`, `bulkAssignPeserta_`, `deletePenugasan_`).
- Modul frontend: `V_DiklatPortofolio.html` Tab 1 (jadwal), modal di `V_Modals.html`.

## P4 — Portofolio Sertifikat (T_RIWAYAT_KOMPETENSI)
- Story: ASN mengunggah sertifikat diklat; verifikator menyetujui; JP terhitung otomatis ke target tahunan.
- AC:
  - Form upload sertifikat: pegawai (picker), agenda jadwal (select), no sertifikat, tgl terbit/mulai/selesai/kedaluwarsa, jumlah JP, metode (whitelist), file URL (kompresi PDF client-side via `pdf-lib` on-demand).
  - Validasi: pegawai exist di SIMPEG; tgl mulai ≤ selesai ≤ terbit; JP 0–2000; metode whitelist; cek duplikat (no_sertifikat / diklat+tgl).
  - **Auto-privacy**: role `user` hanya melihat riwayat milik sendiri (via `only_mine` + guard).
  - **Auto-privilese**: verifikator+ melihat semua + bisa langsung set `disetujui` saat input.
  - **Self-approve prevention**: hook `localPreSaveHook_` (P2) mengunci field verifikasi — non-verifikator selalu `menunggu`.
  - Edit/delete: pemilik boleh sementara status bukan `disetujui`; verifikator/admin bebas.
  - Filter: search, tahun, bulan, unit (dengan sub-unit via `_unitIdsInSubtree`); export per unit.
- Modul backend: `08_RiwayatLogic.gs` (`getRiwayatList_`, `saveRiwayat_`, `deleteRiwayat_`, `getRiwayatJpSummary_`).
- Modul frontend: `V_DiklatPortofolio.html` Tab 2 (portofolio), modal di `V_Modals.html`.

## P5 — Lisensi Khusus & Early Warning H-90 (T_KUALIFIKASI_KHUSUS)
- Story: pengelola dan pegawai memantau lisensi khusus (PPNS, Damkar I, SCBA, Water/Rope Rescue) dan masa berlakunya.
- AC:
  - CRUD lisensi: pegawai, jenis_kualifikasi (whitelist: SK_PPNS, DAMKAR_1, SCBA_OPERATOR, SAR_WATER, ROPE_RESCUE, LINMAS, LAINNYA), no SK, no registrasi, lembaga penerbit, tgl SK terbit, tgl habis berlaku, status_kualifikasi (AKTIF / TIDAK_AKTIF / DICABUT / DIPERPANJANG), file URL.
  - **Validasi**: pegawai exist; tgl terbit < tgl habis; duplikat (pegawai + jenis sama dengan status AKTIF) dicegah.
  - **Normalisasi jenis**: alias panjang → kode kanonik (mis. "sk pengangkatan penyidik ppns" → `SK_PPNS`).
  - **H-90 Early Warning**: `getKualifikasiExpiringSoon_` — threshold dari config `alert_h_days_lisensi`; pisahkan expired vs expiring soon; default `include_expired = false` (eksplisit).
  - Flag `alert_h90_sent` untuk anti-spam notifikasi (job harian opsional).
  - Edit/delete: pemilik boleh (sendiri) atau verifikator+; update tanggal habis = reset alert flag.
  - Filter: search, tahun, jenis kualifikasi; export "Monitoring H-90" multi-status.
- Modul backend: `05_KualifikasiLogic.gs` (`getKualifikasiList_`, `saveKualifikasi_`, `deleteKualifikasi_`, `getKualifikasiExpiringSoon_`, `dailyLisensiAlertJob_`).
- Modul frontend: `V_DiklatPortofolio.html` Tab 3 (lisensi), modal di `V_Modals.html`.

## P6 — Rencana Diklat Tahunan (T_USULAN_DIKLAT)
- Story: unit/pegawai mengusulkan kebutuhan diklat; pimpinan mereview; sistem tracking realisasi otomatis.
- AC:
  - CRUD usulan: tahun_anggaran, periode_triwulan (whitelist), unit, jabatan, pegawai (opsional — kosong = terbuka untuk bidang), program, rumpun, metode, penyelenggara target, target_jp, estimasi_biaya, sumber_dana, urgensi, alasan_justifikasi.
  - **Validasi**: nama program wajib; tahun 2000–2100; whitelist status_rencana (Direncanakan / Diajukan / Disetujui / Disetujui_Kasat / Ditolak / Terealisasi / Dibatalkan); whitelist periode triwulan; pegawai exist; duplikat (pegawai + diklat + tahun) dicegah; target_jp default 20 PNS / 24 PPPK.
  - **Tracking realisasi otomatis**: `getUsulanList_` mencocokkan usulan dengan `T_RIWAYAT_KOMPETENSI` via (pegawai_id + diklat_id) atau fuzzy nama (≥10 char) — isi `realisasi_jp` & `is_terealisasi`.
  - **Review**: `reviewUsulan_` (admin) dengan status_usulan (diajukan / disetujui_kasat / ditolak_kasat / revisi); catatan; tgl_penetapan diisi HANYA saat disetujui (WIB); history append ke catatan_evaluasi.
  - Delete dicegah untuk status Terealisasi (data historis).
  - Filter: tahun, TW, status, search; export "Rencana vs Realisasi" (3 sheet: Rekap Program / Ringkasan per TW / Belum Terealisasi).
- Modul backend: `07_RencanaLogic.gs` (`getUsulanList_`, `saveUsulan_`, `reviewUsulan_`, `deleteUsulan_`).
- Modul frontend: `V_UsulanDiklat.html`, modal di `V_Modals.html`.

## P7 — Analisis Kesenjangan SKJ
- Story: pimpinan menganalisis gap antara standar kompetensi jabatan dan sertifikat riil pegawai; menindaklanjuti dengan usulan pelatihan.
- AC:
  - **KPI cards**: kepatuhan SKJ (%), total gap, gap wajib, personel terdampak.
  - **Insight cards**: prediksi risiko akhir tahun (dari dashboard), unit teraktif, tren partisipasi.
  - **Matriks JP 12 bulan**: per pegawai × bulan (PNS 20 / PPPK 24 target), bar capaian.
  - **Rincian matriks kesenjangan**: list per (pegawai × standar SKJ) dengan kolom profil personel, posisi jabatan, standar diklat, target JP, tingkat kebutuhan (WAJIB/DISARANKAN), rekomendasi tindak lanjut; filter 4 kolom (search, unit, kategori, status pegawai PNS/PPPK); paginasi.
  - **Tombol "+ Rencanakan"**: klik gap → pre-fill form usulan diklat dengan data gap (diklat_id, rumpun, target JP, urgensi).
  - Export PDF landscape + Excel via kit.
  - **Perhitungan**: index by (pegawai_id | diklat_id) untuk lookup O(1) — FIX-D1 (O(n²) → O(n³) di v4.0).
- Modul backend: `03_DashboardLogic.gs` (`getAnalytics_`).
- Modul frontend: `V_AnalisaGap.html`, def di `J_State.html` (`analisaFilterDefs`, `filteredAnalisaGap`, `analisaTotalPages`).

## P8 — Master Data Satelit & Pengaturan
- Story: admin memelihara kamus master (katalog diklat, standar jabatan, referensi) dan konfigurasi sistem.
- AC:
  - **Tab Katalog Diklat**: CRUD program diklat (kode auto DKL-XXX via `CoreLib.genUniqueCode`, nama, rumpun whitelist soft-fallback, kategori keahlian, penyelenggara default, default JP, estimasi biaya).
  - **Tab Standar Jabatan**: CRUD matriks SKJ per (jabatan × diklat) — jabatan_id, diklat_id, level_kompetensi (whitelist), tingkat_kebutuhan (WAJIB / DISARANKAN), minimal_jp, keterangan; duplikat (jabatan + diklat) dicegah; enrichment nama_jabatan & nama_diklat dari master.
  - **Tab Referensi**: CRUD opsi referensi (kategori whitelist: RUMPUN_KOMPETENSI, METODE_PELATIHAN, PENYELENGGARA, URGENSI_USULAN, JENIS_KUALIFIKASI_KHUSUS, STATUS_PEGAWAI, PANGKAT_GOLONGAN, TINGKAT_KEBUTUHAN, JENIS_JABATAN); duplikat (kategori + kode) dicegah.
  - **Pengaturan**: `<app-settings>` self-contained — CRUD `KONFIGURASI` (whitelist key via `CoreLib.isAllowedConfigKey`); admin-only.
  - Semua tab: filter + paginasi client-side via `<app-filter-bar>` + `AppCore.paginate`.
- Modul backend: `06_MasterLogic.gs` (`saveKatalog_`, `deleteKatalog_`, `saveStandarKompetensi_`, `deleteStandarKompetensi_`, `saveReferensi_`, `deleteReferensi_`, `initDatabase`, `setupApp`).
- Modul frontend: `V_MasterSatelit.html`, `V_Pengaturan.html`, modal di `V_Modals.html`.

## Luar scope v6 (fase lanjut)
- Upload file biner sertifikat/lisensi ke Google Drive (v1 = URL).
- Notifikasi email / Telegram H-90 otomatis (job harian sudah siap, hanya flag).
- Predikat kinerja BerAKHLAK (v1 = kuantitas JP saja).
- Integrasi SIASN / SRIKANDI.
- API publik untuk portal induk; dashboard lintas SKPD (agregat Pemkab).

## Adopsi platform (v6.0.1 — 2026-09-19)
- **CoreLib-First penuh**: dispatcher `CoreLib.dispatchAction` + `actionLevels` fail-closed;
  10 wrapper delegasi tipis dihapus; `getEnvProperty_` → `CoreLib.getEnvProperty`;
  `ROLE_LEVELS` → `CoreLib.MASTER_ROLE_LEVELS`; SSO tanpa fallback.
- **`localPreSaveHook_` (P1/P2)** di `01_ConfigAndBridge.gs`:
  - P1 = generate id (prefix per-sheet: `jdw`, `dkl`, `std`, `tgs`, `rwy`, `kua`, `usl`, `ref`).
  - P2 = kunci field verifikasi `T_RIWAYAT_KOMPETENSI` — non-verifikator selalu `menunggu`.
- **Filter soft-delete otomatis** di `getSheetData_` (parameter `{ includeDeleted: true }` untuk audit).
- **Tombol aksi tabel** pakai `.btn-icon`/`.btn-icon-danger` (kit CDN v2.9.1/F2) di 7 tempat.
- **Vue 3.5.42** + **CDN `@v2.9.1`** (internal `2.8.0`) + **CoreLib pin 17**.
