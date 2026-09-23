# 07 — TESTCASE [SI-KOMPETENSI: Portofolio, Jadwal & Lisensi Khusus ASN — 2026-09-19]

> Setiap TC dijalankan sebagai fungsi uji di `99_TestSuite.gs` (pola si-kinerja-harian):
> actor `viewer`/`verifikator`/`admin`/`super`, assert `success`/`code`. Satu baris
> TC = satu assert kelompok.
>
> **Target per 2026-09-19**:
> - `runLibraryTests()` — **PASS 42 / FAIL 0 / SKIP 1** (CoreLib v2.4.0, pin 17).
> - `testAdopsiG18d()` — **13 asersi PASS** (verifikasi delegasi util CoreLib).
> - `testDispatcherRouting()` — **16 asersi PASS** (registry handler + fail-closed).
> - `runDomainTestsSI()` — **14 asersi PASS** (FIX domain + SIMPEG read-only + hook).
>
> **Riwayat revisi**:
> - 2026-09-13 — TESTCASE v5.0 initial (Gate 0, migrasi CoreLib v2.4.0.1).
> - 2026-09-14 — v5.4 polish.
> - **2026-09-19 — v6.0.1**: CoreLib-First penuh; test suite pola si-kinerja-harian
>   (`runLibraryTests` + `testAdopsiG18d` + `testDispatcherRouting` + `runDomainTestsSI`).

## Master Katalog Diklat (FR-01..03)
- **TC-01** admin `save_katalog` valid → success; `kode_diklat` ter-generate (`DKL-XXX`).
- **TC-02** `save_katalog` rumpun tidak valid → fallback 'Teknis Operasional' + log WARN (soft).
- **TC-03** `delete_katalog` yang masih dipakai di `M_STANDAR_KOMPETENSI` → ditolak + count.
- **TC-04** `get_katalog_list` viewer → list + total.

## Master Standar Kompetensi Jabatan (FR-04..06)
- **TC-05** admin `save_standar_kompetensi` valid → success; enrichment `nama_jabatan` & `nama_diklat` terisi.
- **TC-06** `save_standar_kompetensi` dengan (jabatan + diklat) duplikat → ditolak.
- **TC-07** `minimal_jp = 0` **tidak dianggap falsy** → tersimpan sebagai 0.
- **TC-08** `save_standar_kompetensi` tanpa `jabatan_id`/`diklat_id` → BAD_REQUEST.

## Master Referensi (FR-07..09)
- **TC-09** `save_referensi` kategori di luar whitelist → **soft-fail** (log WARN, tetap simpan).
- **TC-10** `save_referensi` duplikat (kategori + kode) → ditolak.
- **TC-11** `save_referensi` normalisasi `status_aktif` ke 'true'/'false'.

## Jadwal Diklat (FR-10..14)
- **TC-12** user `save_jadwal` valid → success; `kode_jadwal` auto `JDW-XXX`.
- **TC-13** `save_jadwal` tanggal mulai > selesai → ditolak.
- **TC-14** `save_jadwal` status di luar whitelist → ditolak.
- **TC-15** owner edit semua field → OK; non-owner edit field non-hasil → ditolak (whitelist `JADWAL_HASIL_FIELDS_`).
- **TC-16** non-owner edit field hasil (status, nilai, no sertifikat, catatan, jumlah hadir) → OK.
- **TC-17** `delete_jadwal` non-admin → ditolak; admin → OK.
- **TC-18** `delete_jadwal` yang masih punya penugasan → ditolak + count.
- **TC-19** `get_jadwal_list` filter tahun & rumpun konsisten dengan hasil.

## Penugasan Peserta (FR-15..18)
- **TC-20** `save_penugasan` tanpa `jadwal_id`/`pegawai_id` → BAD_REQUEST.
- **TC-21** `save_penugasan` pegawai tidak ada di SIMPEG → ditolak.
- **TC-22** `save_penugasan` status_keikutsertaan di luar whitelist → ditolak.
- **TC-23** `bulk_assign_peserta` skip duplikat (pegawai + jadwal sama) → `skipped_count` > 0.
- **TC-24** `bulk_assign_peserta` dengan jadwal kosong → BAD_REQUEST.
- **TC-25** **tgl_surat_tugas WIB** (`CoreLib.todayIsoLocal()`) — bukan UTC (fix G18d).

## Lisensi Khusus (FR-19..26)
- **TC-26** `save_kualifikasi` tanpa pegawai → ditolak.
- **TC-27** `save_kualifikasi` jenis di luar whitelist → ditolak.
- **TC-28** `save_kualifikasi` tgl_sk_terbit ≥ tgl_habis_berlaku → ditolak.
- **TC-29** `save_kualifikasi` duplikat (pegawai + jenis sama dengan status AKTIF) → ditolak.
- **TC-30** `normalizeJenisKualifikasi_` alias panjang → kode kanonik (`sk pengangkatan penyidik ppns` → `SK_PPNS`).
- **TC-31** `getKualifikasiList_` filter `only_active` → hanya status AKTIF.

### FIX-L16 — Early Warning H-90 (default include_expired=false)
- **TC-L16.1** `getKualifikasiExpiringSoon_({})` → `data_expired = []` (default eksplisit).
- **TC-L16.2** `getKualifikasiExpiringSoon_({include_expired: true})` → `data_expired` array terisi.

## Riwayat Portofolio (FR-27..33)
- **TC-32** `save_riwayat` tanpa pegawai → ditolak.
- **TC-33** `save_riwayat` tanpa nama kegiatan → ditolak.
- **TC-34** `save_riwayat` tgl mulai > selesai → ditolak.
- **TC-35** `save_riwayat` JP > 2000 → ditolak.
- **TC-36** `save_riwayat` duplikat (no_sertifikat sama) → ditolak.
- **TC-37** `getRiwayatList_` search "diklat" → hasil > 0.
- **TC-38** `getRiwayatList_` search "XYZABC" → 0 hasil.
- **TC-39** `getRiwayatList_({}, user)` auto-privacy → semua item milik user.
- **TC-40** `getRiwayatList_({}, verifikator)` → lihat semua riwayat.
- **TC-41** `verifikasi_riwayat` tanpa status → ditolak.
- **TC-42** `verifikasi_riwayat` status di luar whitelist → ditolak.
- **TC-43** `verifikasi_riwayat` tanggal_verifikasi WIB (`CoreLib.todayIsoLocal()`).
- **TC-44** `getRiwayatJpSummary_({tahun})` → group by pegawai, filter disetujui + tahun.

## Usulan / Rencana Diklat (FR-34..39)
- **TC-45** `save_usulan` tanpa nama program → ditolak.
- **TC-46** `save_usulan` pegawai tidak ada di SIMPEG → ditolak.
- **TC-47** `review_usulan` tanpa status → ditolak.
- **TC-48** `review_usulan` status di luar whitelist → ditolak.
- **TC-49** `save_usulan` duplikat (pegawai + diklat + tahun) → ditolak.
- **TC-50** `delete_usulan` status Terealisasi → ditolak.

### FIX-R17 — whitelist status_rencana (BENAR-BENAR dipakai)
- **TC-R17.1** `save_usulan` status_rencana 'STATUS_NGAWUR' → **ditolak** + pesan 'tidak valid'.
- **TC-R17.2** `save_usulan` status_rencana 'DIAJUKAN' (lowercase) → **kanonik 'Diajukan'**.
- **TC-R17.3** `save_usulan` `tgl_pengajuan` = WIB (`CoreLib.todayIsoLocal()`).

## Dashboard & Analisa (FR-40..42)
- **TC-51** `apiDashboard_({tahun})` → KPI konsisten (total sertifikat, JP tahun, capaian).
- **TC-52** `apiDashboard_` dengan data kosong → tidak crash, nilai 0.
- **TC-53** `getAnalytics_({tahun})` → `gap_count` + `persen_kepatuhan` + `teman` + `rekomendasi`.
- **TC-54** `getAnalytics_` filter tahun benar-benar dipakai (riwayat difilter).

### FIX-M16 — whitelist rumpun (soft-fallback)
- **TC-M16.1** `save_katalog` rumpun 'RUMPUN NGAWUR XYZ' → fallback 'Teknis Operasional'.
- **TC-M16.2** `save_katalog` rumpun 'Manajerial & Kepemimpinan' → tetap (canonical case).

## SIMPEG Read-Only Protection (FR-28 — security)
- **TC-55** `saveRecord_('PEGAWAI', ...)` → **throw** (read-only).
- **TC-56** `softDeleteRecord_('PEGAWAI', ...)` → **throw** (read-only).
- **TC-57** Sama untuk `UNIT_KERJA` dan `JABATAN` (2 jalur × 3 sheet = 6 penolakan).

## LOCAL PRE-SAVE HOOK (P1/P2 — fix G18d)
### P1 — Auto-generate id (prefix per-sheet)
- **TC-P1.1** `localPreSaveHook_('T_JADWAL_DIKLAT', {}, user)` → id prefix `jdw-`.
- **TC-P1.2** `localPreSaveHook_('M_KATALOG_DIKLAT', {}, user)` → id prefix `dkl-`.
- **TC-P1.3** `localPreSaveHook_('T_RIWAYAT_KOMPETENSI', {}, user)` → id prefix `rwy-`.

### P2 — Kunci field verifikasi `T_RIWAYAT_KOMPETENSI`
- **TC-P2.1** non-verifikator update riwayat → `status_verifikasi = 'menunggu'` (dipaksa).
- **TC-P2.2** verifikator update riwayat dengan `status_verifikasi = 'disetujui'` → hook **tidak intervensi**.

## Regresi CoreLib (FR-59)
- **TC-58** `runLibraryTests()` target: **PASS 42 / FAIL 0 / SKIP 1** (CoreLib v2.4.0, pin 17).
  - 38 test lama (Foundation + Gateway + v2.1 + v2.2 + v2.2.2) — tetap PASS.
  - 4 test baru v2.4.0: `testTodayIsoLocalV230`, `testDateKey10V230`, `testPaginateV230`, `testMatchSearchV230`.
  - SKIP wajar: `testCacheIsolation` (butuh `TEST_SPREADSHEET_ID_B` di Script Properties).

## Adopsi CoreLib v2.4.0 (FR-60) — `testAdopsiG18d()`
Dijalankan sebagai `testAdopsiG18d()` di `99_TestSuite.gs` — **murni in-memory**.

| ID | Asersi | Target |
|---|---|---|
| **TC-AD1** | `CoreLib.todayIsoLocal()` → `/^\d{4}-\d{2}-\d{2}$/` | format tanggal valid |
| **TC-AD2** | `CoreLib.dateKey10('2026-09-18T17:00:00.000Z')` === `'2026-09-19'` | ISO UTC → WIB |
| **TC-AD3** | `CoreLib.dateKey10('2026-09-19')` === `'2026-09-19'` | passthrough |
| **TC-AD4** | `CoreLib.paginate(rows25, 1, 10)` → data.length=10, meta.total=25, total_pages=3 | paginasi |
| **TC-AD5** | `CoreLib.paginate(rows25, 3, 10)` → data[0].id=21 | halaman terakhir |
| **TC-AD6** | `CoreLib.matchSearch(row, 'bencana', ['nama_kegiatan'])` → true | case-insensitive |
| **TC-AD7** | `CoreLib.matchSearch(row, 'XYZ', ['nama_kegiatan'])` → false | tidak match |
| **TC-AD8** | `CoreLib.matchSearch(row, '', ['nama_kegiatan'])` → true | q kosong |
| **TC-AD9** | `CoreLib.matchSearch(row, 'x', [])` → false | fields kosong |
| **TC-AD10** | `CoreLib.whitelist('terjadwal', ['Terjadwal','Selesai'], 'x')` → 'Terjadwal' | lowercase → kanonik |
| **TC-AD11** | `CoreLib.normId('  x  ')` → 'x' | trim |
| **TC-AD12** | `CoreLib.normStr('  X  ')` → 'x' | trim + lower |
| **TC-AD13** | `CoreLib.parseDate('12/09/2026')` → Date valid | dd/MM/yyyy |

**Status: 13/13 PASS** (diverifikasi live 2026-09-19).

## Routing & Fail-Closed (FR-61) — `testDispatcherRouting()`
Dijalankan sebagai `testDispatcherRouting()` di `99_TestSuite.gs`.

| ID | Asersi | Target |
|---|---|---|
| **TC-R1** | `localHandlers` terdaftar > 0 | registry ada |
| **TC-R2** | Semua handler punya `actionLevels` | fail-closed lengkap |
| **TC-R3** | Semua `actionLevels` punya handler (kecuali native/builtin) | tidak ada orphan |
| **TC-R4** | `handleAction({action:'ping'})` tanpa token → `success=false` | fail-closed |
| **TC-R5** | `ping` tanpa token → `code='UNAUTHORIZED'` | kode konsisten |
| **TC-R6** | `aksi_aneh_tidak_ada_xyz` → `success=false` | fail-closed |
| **TC-R7** | aksi tak dikenal → `code ∈ {UNAUTHORIZED, FORBIDDEN, NOT_FOUND}` | konsisten |
| **TC-R8** | `handleAction({action:'delete', data:{entity:'KONFIGURASI',key:'SPREADSHEET_ID'}})` tanpa auth → `UNAUTHORIZED` | route KONFIGURASI diproteksi |
| **TC-R9..R16** | 8 handler kritis tersedia: `save_jadwal`, `save_riwayat`, `verifikasi_riwayat`, `save_kualifikasi`, `save_katalog`, `save_usulan`, `init_database`, `dashboard` | registry lengkap |

**Status: 16/16 PASS** (diverifikasi live 2026-09-19).

## Domain Test (FR-62) — `runDomainTestsSI()`
Agregat `testFixL16` + `testFixM16` + `testFixR17` + `testSimpegReadOnly` + `testLocalPreSaveHook` — 14 asersi.

| Kelompok | Jumlah asersi | Status |
|---|---|---|
| FIX-L16 | 2 | ✅ |
| FIX-M16 | 2 | ✅ |
| FIX-R17 | 2 | ✅ |
| SIMPEG Read-Only | 3 (PEGAWAI/UNIT_KERJA/JABATAN × 2 jalur) | ✅ |
| Local Pre-Save Hook | 5 (P1.1, P1.2, P1.3, P2.1, P2.2) | ✅ |
| **Total** | **14** | **14/14 PASS** |

## Agregat eksekusi (FR-63) — `runAllTestsSikompetensi()`
Satu pintu eksekusi semua runner di atas + rekap akhir.

**Output akhir (verifikasi live 2026-09-19)**:
```
##########################################################
##  TEST SUITE LENGKAP SIKOMPETENSI v3.0.1
##  Waktu: 2026-09-19T11:35:28.095Z
##########################################################
...
RINGKASAN DOMAIN: PASS=14 / FAIL=0 / SKIP=0
##########################################################
##  REKAP AKHIR
##  Library (CoreLib) : PASS 42 / FAIL 0 / SKIP 1
##  Adopsi G18d       : 13 lolos / 0 gagal
##  Routing           : 16 lolos / 0 gagal
##  Domain (SI)       : PASS 14 / FAIL 0 / SKIP 0
##########################################################
🎉 SEMUA TEST HIJAU.
```

## Diagnostik manual (opsional — FR-63 lanjutan)
| Fungsi | Kegunaan | Target |
|---|---|---|
| `runAllDiagnostics()` | Cek CoreLib + DB + skema + adopsi | Semua ✅ |
| `testKoneksiKePortalSso()` | Diagnostik koneksi SSO (tanpa tiket) | HTTP 200 + JSON |
| `testFullSsoIntegrationFlow()` | Alur SSO end-to-end (butuh tiket valid) | User + session |
| `cekStatusAkhir()` | Jumlah baris tiap sheet (diagnostik) | *(target stale — perlu update)* |

## Catatan final
- **SKIP wajar**: `testCacheIsolation` — butuh `TEST_SPREADSHEET_ID_B` di Script Properties CoreLib (bukan si-kompetensi).
- **Test tulis terisolasi**: `CoreLib.runCoreTests` memakai sheet `ZZ_TEST_CRUD` (aman, auto-bersih). Tidak ada test yang menulis ke sheet produksi.
- **Running di editor si-kompetensi**: semua fungsi test di atas bisa dijalankan dari editor GAS si-kompetensi. `CoreLib.runCoreTests(ctx)` membaca `testCtx_()` dari `99_TestSuite.gs`.
- **Total asersi keseluruhan**: 42 + 13 + 16 + 14 = **85 asersi**.
