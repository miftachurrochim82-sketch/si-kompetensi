# 04 — DATABASE [SI-KOMPETENSI: Portofolio, Jadwal & Lisensi Khusus ASN — 2026-09-19]

> Standar minimal (revisi 2026-09-18): referensi otomatis TIDAK masuk budget; app bisnis =
> master bisnis 3–5 + tabel bisnis ≥3. SI-KOMPETENSI: **master bisnis 3 ✅ tabel bisnis 5 ✅**.
> Kolom audit (`created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at`) wajib — diisi CoreLib otomatis.
>
> **Riwayat skema**:
> - v4.x (pra-2026) — 8 sheet satelit murni + 3 referensi SIMPEG.
> - v5.0.0 (2026-09-13) — DB engine dipindah ke CoreLib v2.2.1; `FALLBACK_*` dihapus; cache key diserahkan ke CoreLib (`sheetData_<dbId>_<sheet>`).
> - v5.4.0 (2026-09-14) — polish UI; tidak ada perubahan skema.
> - **v6.0.1 (2026-09-19)** — tidak ada perubahan skema. Filter soft-delete otomatis di `getSheetData_` (kolom `deleted_at` otomatis tidak tampil di list). `localPreSaveHook_` (P1) menegaskan prefix id per-sheet.

## M1 M_REFERENSI (master opsi)
| Kolom | Tipe | Catatan |
|---|---|---|
| id | text pk | prefix `ref-` |
| kategori | text | whitelist 9 kategori (lihat §Enum) |
| kode | text | kode unik per kategori |
| nama_nilai | text | nilai opsi |
| urutan | number | opsional, urutan tampil |
| status_aktif | text | 'true' / 'false' |
| keterangan | text | |
| + audit | | |

Seed (kategori): RUMPUN_KOMPETENSI, METODE_PELATIHAN, PENYELENGGARA, URGENSI_USULAN, JENIS_KUALIFIKASI_KHUSUS, STATUS_PEGAWAI, PANGKAT_GOLONGAN, TINGKAT_KEBUTUHAN, JENIS_JABATAN.

## M2 M_KATALOG_DIKLAT (master program diklat)
| Kolom | Tipe | Catatan |
|---|---|---|
| id | text pk | prefix `dkl-` |
| kode_diklat | text | unik; auto `DKL-XXX` via `CoreLib.genUniqueCode` |
| nama_diklat | text | wajib (kalimat program) |
| rumpun | enum | 6 rumpun valid (soft-fallback 'Teknis Operasional') |
| kategori_keahlian | text | |
| penyelenggara_default | text | |
| default_jp | number | ≥ 0; default fallback untuk `minimal_jp` di standar |
| metode | text | |
| estimasi_biaya_default | number | |
| deskripsi | text | |
| persyaratan | text | |
| status_aktif | text | 'true' / 'false' |
| + audit | | |

**Rumpun whitelist**: `Manajerial & Kepemimpinan`, `Teknis Operasional`, `Fungsional Umum`, `Sosial Kultural`, `Pemerintahan`, `Lainnya`.

## M3 M_STANDAR_KOMPETENSI (master SKJ)
| Kolom | Tipe | Catatan |
|---|---|---|
| id | text pk | prefix `std-` |
| jabatan_id | fk JABATAN | referensi SIMPEG |
| nama_jabatan | text | enrichment otomatis dari SIMPEG |
| diklat_id | fk M2 | |
| nama_diklat | text | enrichment otomatis dari katalog |
| rumpun | text | enrichment otomatis |
| level_kompetensi | enum | 5 level (whitelist soft — hanya log WARN) |
| tingkat_kebutuhan | enum | WAJIB / DISARANKAN |
| minimal_jp | number | ≥ 0 (angka 0 tidak dianggap falsy); fallback ke `default_jp` katalog |
| keterangan | text | dasar regulasi / kriteria |
| status_aktif | text | 'true' / 'false' |
| + audit | | |

**Level kompetensi whitelist**: `Level 1 - Pertama / Pelaksana`, `Level 1 - Terampil / Pelaksana`, `Level 2 - Pengawas / Terampil`, `Level 3 - Administrator`, `Level 4 - JPT Pratama`.

## T1 T_JADWAL_DIKLAT (agenda pelatihan)
| Kolom | Tipe | Catatan |
|---|---|---|
| id | text pk | prefix `jdw-` |
| kode_jadwal | text | auto `JDW-XXX` via `CoreLib.genUniqueCode` |
| diklat_id | fk M2 | |
| nama_kegiatan | text | = nama_diklat (bidirectional) |
| rumpun | text | |
| penyelenggara | text | dropdown dari referensi + manual |
| metode | text | whitelist: Klasikal / Daring / Blended Learning / Non-Klasikal / E-Learning / Lainnya |
| jumlah_jp | number | |
| tgl_mulai | date | yyyy-MM-dd |
| tgl_selesai | date | |
| bulan_periode | text | mis. 'September 2026' |
| tahun_periode | number | |
| kuota_peserta | number | |
| lokasi_pelaksanaan | text | |
| link_pendaftaran | text | URL |
| status_jadwal | enum | whitelist 6 status (lihat §Enum) |
| keterangan | text | |
| catatan_hasil | text | field-hasil (boleh diisi non-owner) |
| jumlah_peserta_hadir | number | field-hasil |
| + audit | | |

## T2 T_PENUGASAN_PESERTA (delegasi peserta)
| Kolom | Tipe | Catatan |
|---|---|---|
| id | text pk | prefix `tgs-` |
| jadwal_id | fk T1 | |
| pegawai_id | fk PEGAWAI | wajib; exist di SIMPEG |
| no_surat_tugas | text | auto-generate `800/SPT/XXXX/YYYY` bila kosong |
| tgl_surat_tugas | date | yyyy-MM-dd; WIB via `CoreLib.todayIsoLocal()` |
| pejabat_penandatangan | text | default: 'Kepala Satpol PP & Pemadam Kebakaran' |
| status_keikutsertaan | enum | whitelist 5 status (lihat §Enum) — uppercase |
| nilai_kelulusan | text | |
| no_sertifikat_terbit | text | |
| catatan | text | |
| + audit | | |

## T3 T_RIWAYAT_KOMPETENSI (portofolio sertifikat)
| Kolom | Tipe | Catatan |
|---|---|---|
| id | text pk | prefix `rwy-` |
| pegawai_id | fk PEGAWAI | wajib; exist di SIMPEG |
| diklat_id | fk M2 | nullable |
| jadwal_id | fk T1 | nullable |
| nama_kegiatan | text | wajib; auto-fill dari jadwal bila ada |
| rumpun | text | auto-fill dari katalog |
| penyelenggara | text | auto-fill dari katalog |
| no_sertifikat | text | unik per pegawai (duplikat dicegah) |
| tgl_terbit | date | ≥ tgl_selesai |
| tgl_mulai | date | ≤ tgl_selesai |
| tgl_selesai | date | |
| tgl_kedaluwarsa | date | opsional |
| jumlah_jp | number | 0–2000 |
| metode | text | whitelist (sama T1) |
| file_url | text | URL |
| status_verifikasi | enum | whitelist: menunggu / disetujui / ditolak / revisi — **dikunci hook P2** |
| catatan_verifikator | text | |
| verifikator_id | text | email verifikator |
| tanggal_verifikasi | date | WIB via `CoreLib.todayIsoLocal()` |
| + audit | | |

**Hook P2** (`localPreSaveHook_`): non-verifikator non-admin → `status_verifikasi = 'menunggu'`; update = warisi baris lama. Hanya verifikator+ yang bisa set manual.

## T4 T_KUALIFIKASI_KHUSUS (lisensi & H-90)
| Kolom | Tipe | Catatan |
|---|---|---|
| id | text pk | prefix `kua-` |
| pegawai_id | fk PEGAWAI | wajib |
| jenis_kualifikasi | enum | whitelist 7 (lihat §Enum); alias panjang → kode kanonik via `normalizeJenisKualifikasi_` |
| nomor_sk_lisensi | text | |
| no_registrasi_nasional | text | |
| lembaga_penerbit | text | |
| tgl_sk_terbit | date | < tgl_habis_berlaku |
| tgl_habis_berlaku | date | |
| status_kualifikasi | enum | whitelist: AKTIF / TIDAK_AKTIF / DICABUT / DIPERPANJANG (uppercase) |
| file_sk_url | text | URL |
| catatan_perpanjangan | text | |
| alert_h90_sent | text | 'true' / 'false'; reset bila tgl_habis_berlaku berubah |
| + audit | | |

**Duplikat dicegah**: (pegawai + jenis sama dengan status 'AKTIF').

## T5 T_USULAN_DIKLAT (rencana / usulan bottom-up)
| Kolom | Tipe | Catatan |
|---|---|---|
| id | text pk | prefix `usl-` |
| tahun_anggaran | number | 2000–2100 |
| periode_triwulan | enum | whitelist 4 TW |
| unit_id | fk UNIT_KERJA | nullable |
| jabatan_id | fk JABATAN | nullable |
| pegawai_id | fk PEGAWAI | nullable (kosong = terbuka untuk bidang) |
| diklat_id | fk M2 | nullable |
| nama_program_diklat | text | wajib; = nama_diklat_usulan (bidirectional) |
| nama_diklat_usulan | text | alias legacy |
| rumpun | text | |
| metode | text | whitelist |
| penyelenggara | text | |
| target_penyelenggara | text | alias legacy |
| target_jp | number | default 20 (PNS) / 24 (PPPK) |
| estimasi_biaya | number | default 0 |
| sumber_dana | text | default 'APBD Kabupaten Trenggalek' |
| urgensi | text | |
| alasan_justifikasi | text | = alasan_usulan (bidirectional) |
| alasan_usulan | text | alias legacy |
| status_rencana | enum | whitelist 7 (lihat §Enum) |
| status_usulan | enum | whitelist 4 (lihat §Enum) |
| catatan_pimpinan | text | |
| catatan_evaluasi | text | history review (append) |
| tgl_pengajuan | date | WIB; auto-set saat insert |
| tgl_penetapan | date | WIB; diisi HANYA saat disetujui |
| tahun_anggaran_target | number | alias legacy |
| + audit | | |

**Duplikat dicegah**: (pegawai + diklat + tahun_anggaran) saat insert.

## ZZ_TEST_CRUD (infra uji CoreLib)
`id`, `laporan_id`, `nama`, `no_hp`, `catatan_baru`.
Dipakai `CoreLib.runCoreTests(testCtx_())` — 42 test, aman (dibersihkan otomatis tiap tes).

## Enum & validasi server

### Enum e-Kinerja / Diklat (server-side)
| Enum | Whitelist |
|---|---|
| `status_jadwal` | Terjadwal, Buka Pendaftaran, Segera Dibuka, Sedang Berjalan, Selesai, Dibatalkan |
| `status_keikutsertaan` | DITUGASKAN, HADIR, TIDAK_HADIR, SELESAI, BATAL |
| `jenis_kualifikasi` | SK_PPNS, DAMKAR_1, SCBA_OPERATOR, SAR_WATER, ROPE_RESCUE, LINMAS, LAINNYA |
| `status_kualifikasi` | AKTIF, TIDAK_AKTIF, DICABUT, DIPERPANJANG |
| `status_verifikasi` | menunggu, disetujui, ditolak, revisi |
| `metode` | Klasikal, Daring, Blended Learning, Non-Klasikal / E-Learning, Lainnya |
| `tingkat_kebutuhan` | WAJIB, DISARANKAN |
| `level_kompetensi` | 5 level (soft-whitelist — hanya log WARN) |
| `kategori` (M_REFERENSI) | 9 kategori (soft-fail — admin boleh tambah) |
| `periode_triwulan` | TW I (Jan - Mar), TW II (Apr - Jun), TW III (Jul - Sep), TW IV (Okt - Des) |
| `status_rencana` | Direncanakan, Diajukan, Disetujui, Disetujui_Kasat, Ditolak, Terealisasi, Dibatalkan |
| `status_usulan` | diajukan, disetujui_kasat, ditolak_kasat, revisi |
| `rumpun` (katalog) | 6 rumpun (soft-fallback 'Teknis Operasional') |

**Pola validasi**: whitelist diverifikasi saat save via `CoreLib.whitelist(v, list, 'field')` (throw bila tidak match). Soft-fail (log WARN saja) untuk kategori referensi & rumpun & level_kompetensi.

## Konfigurasi app (bukan sheet — Script Properties)
Config SI-KOMPETENSI disimpan di **Script Properties** (bukan sheet `KONFIGURASI`), untuk backward-compat & stabilitas.
Diakses via `getConfigList_` / `saveConfigItem_` / `deleteConfigItem_` (`02_AppLogic.gs`) + `<app-settings>` frontend.
Whitelist key via `CoreLib.isAllowedConfigKey(key, ['ADMIN_EMAILS', 'VERIFIKATOR_EMAILS'])`.

Default keys (9): `app_title`, `app_version`, `instansi`, `target_jp_pns`, `target_jp_pppk`, `tahun_evaluasi_aktif`, `alert_h_days_lisensi`, `auto_approve_sertifikat`, `max_pdf_upload_mb`.

## Referensi otomatis (tidak masuk budget)
- **PEGAWAI / JABATAN / UNIT_KERJA** — SIMPEG via `masterSsId` (baca dari `MASTER_SPREADSHEET_ID`, tidak pernah dibuat lokal — CoreLib H3).
- **USER_ROLE / AUDIT_LOG / KONFIGURASI platform** — di SI-PLATFORM.
- **AUDIT_LOGS & MAIN_DATA** — sheet sistem **LIBRARY** (`CoreLib.DEFAULT_SYSTEM_HEADERS`), dibuat ulang otomatis oleh `initDatabase()` — jangan dihapus.
- **ZZ_TEST_CRUD** — infra uji CoreLib (auto-bersih).

## Total sheet aktif SI-KOMPETENSI (9 sheet + 1 uji)
| # | Sheet | Klasifikasi |
|---|---|---|
| 1 | `M_REFERENSI` | master opsi M1 |
| 2 | `M_KATALOG_DIKLAT` | master program diklat M2 |
| 3 | `M_STANDAR_KOMPETENSI` | master SKJ M3 |
| 4 | `T_JADWAL_DIKLAT` | tabel bisnis T1 |
| 5 | `T_PENUGASAN_PESERTA` | tabel bisnis T2 |
| 6 | `T_RIWAYAT_KOMPETENSI` | tabel bisnis T3 |
| 7 | `T_KUALIFIKASI_KHUSUS` | tabel bisnis T4 |
| 8 | `T_USULAN_DIKLAT` | tabel bisnis T5 |
| 9 | `ZZ_TEST_CRUD` | infra uji CoreLib |

**Sheet sistem CoreLib (auto-create, tidak dihitung budget)**: `AUDIT_LOGS`, `MAIN_DATA`.
**Sheet referensi SIMPEG (auto-baca dari master, tidak dihitung budget)**: `PEGAWAI`, `JABATAN`, `UNIT_KERJA`.
**Konfigurasi app**: **Script Properties** (bukan sheet).

## Soft-delete & filter otomatis (v6.0.1)
Sejak v6.0.1, `getSheetData_` (`01_ConfigAndBridge.gs`) memfilter `!r.deleted_at` secara default.
Pemanggil yang butuh data mentah (audit/histori) pakai `getSheetData_(sheetName, { includeDeleted: true })`.
Soft delete dilakukan `CoreLib.apiDelete` (isi `deleted_at` + `updated_at` + `updated_by`).

## Normalisasi SIMPEG (khas si-kompetensi)
Karena kolom SIMPEG tidak selalu konsisten antar source, `01_ConfigAndBridge.gs` melakukan **post-process** setelah `CoreLib.getSheetDataCached`:
- **Alias nama sheet**: `M_PEGAWAI` / `pegawai` → `PEGAWAI`; `M_UNIT_KERJA` / `units` → `UNIT_KERJA`; `M_JABATAN` / `jabatan` → `JABATAN`.
- **Alias kolom** (`normalizePegawai_`): `nama ↔ nama_lengkap`, `status_kepegawaian ↔ status_pegawai`, `pangkat_golongan ↔ pangkat_gol`, `regu ↔ regu_pleton`, `no_hp ↔ telepon`, `status ↔ status_aktif`, `pegawai_id ↔ id`.
- **Normalisasi ID 4-digit** (`normalizeEntityId_`): `PEG-001` → `PEG-0001`, `JAB-25` → `JAB-0025`, `UNIT-1` → `UNIT-0001`.
- **Field yang dinormalisasi**: `pegawai_id`, `unit_id`, `jabatan_id`, `atasan_id`, `plt_pegawai_id`, `kepala_unit_id`, `kepala_pegawai_id`.

## Prefix ID per-sheet (v3.0.1 lokalPreSaveHook_)
| Sheet | Prefix |
|---|---|
| M_REFERENSI | `ref` |
| M_KATALOG_DIKLAT | `dkl` |
| M_STANDAR_KOMPETENSI | `std` |
| T_JADWAL_DIKLAT | `jdw` |
| T_PENUGASAN_PESERTA | `tgs` |
| T_RIWAYAT_KOMPETENSI | `rwy` |
| T_KUALIFIKASI_KHUSUS | `kua` |
| T_USULAN_DIKLAT | `usl` |
