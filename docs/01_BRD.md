# 01 — BRD [SI-KOMPETENSI = Portofolio, Jadwal & Lisensi Khusus ASN — 2026-09-19]

> Reposisi pemilik: SI-KOMPETENSI mengelola **portofolio pengembangan kompetensi ASN**
> dan **lisensi khusus personel** Satpol PP & Damkar Trenggalek. Merujuk PP No. 17/2020
> (PNS min. 20 JP/tahun), Perpres No. 49/2018 (PPPK min. 24 JP/tahun), Perka BKN, dan
> Permendagri No. 16/2020 (sertifikasi penegakan Perda). Bukan pengelola kepegawaian —
> identitas & role diambil dari SI-PLATFORM / SIMPEG.
>
> **Riwayat versi app si-kompetensi**:
> - v4.x (pra-2026) — Skema 8 sheet satelit + fungsi lokal + CoreLib adapter awal.
> - v5.0.0 (2026-09-13) — BREAKING: DB engine dipindah ke CoreLib v2.4.0.1.
>   Semua `FALLBACK_*` dihapus, cache key custom dihilangkan, adapter ke CoreLib.
> - v5.3.0 (2026-09-13) — Frontend modular: V_* per halaman + J_* per modul,
>   adopsi `<app-filter-bar>`, `<app-empty-state>`, `<app-skeleton>`, `<app-chart-*>`.
> - v5.4.0 (2026-09-14) — UI/UX polish; insight cards terang; filter grid 4 kolom.
> - **v6.0.1 (2026-09-19)** — CoreLib-First penuh: dispatcher `CoreLib.dispatchAction`,
>   `localPreSaveHook_` (P1/P2), filter soft-delete otomatis, tombol `.btn-icon` kit
>   CDN; bump pin CoreLib ke **15** + CDN **`@v2.9.1`** + Vue `3.5.42`.

| Butir | Isi |
|---|---|
| Nama & kode | `SI-KOMPETENSI` — judul lengkap "Sistem Informasi Manajemen Portofolio, Jadwal & Lisensi Khusus ASN"; kode app tetap `SIKOMPETENSI` |
| Masalah | Pengembangan kompetensi ASN Satpol PP & Damkar tidak terpusat: (a) pemenuhan 20 JP (PNS) / 24 JP (PPPK) tidak termonitor; (b) sertifikat diklat tersebar di berkas fisik; (c) lisensi khusus (PPNS, Damkar, SCBA, Rope/Water Rescue) kadaluwarsa tanpa peringatan; (d) analisis kesenjangan standar kompetensi jabatan (SKJ) tidak ada; (e) usulan diklat bottom-up tidak terdata; (f) agenda diklat tidak terkoordinasi |
| Rujukan konsep | **PP No. 17/2020** (PNS: min. 20 JP/tahun); **Perpres No. 49/2018** (PPPK: min. 24 JP/tahun); **Perka BKN** (pengembangan kompetensi ASN); **Permendagri No. 16/2020** (sertifikasi PPNS & penegakan Perda); **PermenPANRB 6/2022** (predikat kinerja) |
| Pengguna | **viewer** = ASN (lihat portofolio sendiri, upload sertifikat milik sendiri, usul rencana diklat); **verifikator** = pengelola master + verifikasi sertifikat; **admin** = pengelola penuh + keputusan pimpinan; **super** = admin platform. Identitas/role dari SI-Platform (SSO) |
| Ukuran sukses (**DIKUNCI pemilik 2026-09-19**) | (a) ≥90% ASN memiliki portofolio terverifikasi dalam 3 bulan; (b) 0 lisensi kadaluwarsa tanpa peringatan H-90; (c) Laporan Analisis SKJ ter-generate 100% tepat waktu tahunan; (d) 0 sertifikat tanpa nomor/kegiatan terdata; (e) Rencana Diklat Tahunan terisi 100% sebelum DPA |
| BATAS | Tidak mengelola kepegawaian (SIMPEG), user/role (SI-PLATFORM), absensi, penggajian; **e-Kinerja Harian ASN = app TERPISAH (`si-lahar`)**; upload file biner ke Drive = fase lanjut (v1 = URL/link); notifikasi email/Telegram = fase lanjut |
| Wali data | Pemilik aplikasi (user) — perubahan skema wajib amendemen docs dulu (Gate 0) |
| App ekosistem | `si-platform` (SSO), SIMPEG (3 referensi otomatis: PEGAWAI, UNIT_KERJA, JABATAN), **CoreLib v2.4.0 pin 17**, **CDN kit v2.9.1**, `si-lahar` (tetangga — e-Kinerja Harian) |

## Nilai bisnis
1. **Pemenuhan kewajiban ASN terukur**: setiap ASN tahu posisi JP-nya terhadap target tahunan.
2. **Portofolio digital terpusat**: sertifikat & lisensi terkumpul, terverifikasi, dan bisa diaudit.
3. **Kesiapan operasional**: lisensi khusus personel Satpol PP & Damkar termonitor (H-90 alert).
4. **Pengembangan berbasis gap**: analisis SKJ memetakan diklat wajib yang belum dipenuhi per jabatan.
5. **Perencanaan anggaran defensible**: Rencana Diklat Tahunan berbasis data gap + usulan unit.

## Paket ruang tumbuh (8 sheet satelit murni: master 3 + tabel 5)
| Kode | Sheet | Jenis |
|---|---|---|
| M1 | M_REFERENSI | master opsi (Rumpun, Metode, Penyelenggara, Kategori, Urgensi, dll.) |
| M2 | M_KATALOG_DIKLAT | kamus program & jenis pelatihan resmi (kode DKL-, default JP) |
| M3 | M_STANDAR_KOMPETENSI | matriks syarat wajib/disarankan diklat per posisi jabatan (SKJ) |
| T1 | T_JADWAL_DIKLAT | agenda pelatihan terjadwal (kuota, status, penyelenggara) |
| T2 | T_PENUGASAN_PESERTA | Surat Perintah Tugas (SPT), delegasi peserta, status kelulusan |
| T3 | T_RIWAYAT_KOMPETENSI | portofolio riwayat sertifikat & pemenuhan 20/24 JP |
| T4 | T_KUALIFIKASI_KHUSUS | lisensi khusus & masa berlaku (PPNS, Damkar I, SCBA, Water/Rope Rescue) |
| T5 | T_USULAN_DIKLAT | usulan kebutuhan diklat bottom-up (AKD unit kerja) |

Sheet uji: `ZZ_TEST_CRUD` (auto dibersihkan, dipakai CoreLib test suite).

## Kepatuhan platform (ekosistem)
- **CoreLib First**: seluruh util generik (tanggal, paginasi, pencarian, whitelist, role,
  genUniqueCode, dispatcher) memakai CoreLib v2.4.0 pin 17. Tidak ada wrapper delegasi tipis
  di app (dihapus saat migrasi v6.0.0). `todayIsoLocal()`/`dateKey10()` untuk tanggal
  sadar-WIB; `todayIso()` (UTC) hanya untuk keperluan server-side.
- **CDN kit v2.9.1**: seluruh UI (`<app-badge>`, `<app-modal>`, `<app-crud-table>`,
  `<app-filter-bar>`, `<app-chart-*>`, `<app-pegawai-picker>`, `<app-stat-card>`,
  `<app-empty-state>`, `<app-skeleton>`, `<app-profile>`, `<app-settings>`) memakai
  kit `frontend-cdn`. Tombol aksi tabel pakai `.btn-icon`/`.btn-icon-danger` (kit v2.8.0).
- **Struktur file modular**: `V_*.html` per halaman + `J_*.html` per modul logika
  (standar si-lahar & si-kompetensi; bukan pola 2-berkas warisan si-pelaporan).
- **Fail-closed dispatcher**: `CoreLib.dispatchAction` + `actionLevels` lengkap —
  aksi tak dikenal ditolak di gerbang auth.

## Fitur masa depan (fase lanjut, tercatat)
Upload file sertifikat ke Drive (v1 = URL); notifikasi email/Telegram H-90 otomatis;
predikat kinerja BerAKHLAK (bukan hanya kuantitas JP); integrasi SIASN/SRIKANDI;
API publik untuk portal induk; dashboard lintas SKPD (agregat Pemkab).
