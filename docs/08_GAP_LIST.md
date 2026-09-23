# 08 — GAP LIST (as-is → to-be) [SI-KOMPETENSI] — 2026-09-19

> **Status per 2026-09-19**: seluruh gap arsitektural **TUTUP**. Gap yang masih
> aktif = keputusan pemilik (status_jadwal) + beberapa item backlog fase lanjut
> (upload Drive, notifikasi, BerAKHLAK).
>
> **Riwayat**:
> - pra-2026 — daftar gap awal (K1–K10) dari baseline v4.x.
> - 2026-09-13 — K11–K15 (CoreLib v2.4.0.1 adopsi + adapter Utils).
> - 2026-09-14 — K16–K20 (polish frontend, insight cards, filter grid).
> - **2026-09-19 — K21–K40**: migrasi total CoreLib-First + CDN v2.9.1 (sesi refactor).

---

## 1. Gap Aktif (perlu perhatian)

| # | Gap | Status | Tindakan |
|---|---|---|---|
| **K41** | `status_jadwal` non-owner bebas diubah | ⏸ **DIPUTUSKAN PEMILIK** (2026-09-19): biarkan — pegawai boleh tandai selesai/batal | Tidak diubah (perilaku saat ini = keputusan) |
| **K42** | `cekStatusAkhir()` target stale (mengacu rilis lama) | 🟢 **NICE-TO-HAVE** | Update target atau hapus fungsi |
| **K43** | `testMasterSelfCheck` test 5 cetak `undefined` (ID duplikat antar-run) | 🟢 **NICE-TO-HAVE** | Pakai ID unik (mis. `DKL-0002-' + Date.now()`) |
| **K44** | Upload file biner sertifikat/lisensi ke Drive | 🟡 **BACKLOG fase lanjut** | v1 = URL manual (keputusan); perlu amendemen skema dulu |
| **K45** | Notifikasi H-90 otomatis (email/Telegram) | 🟡 **BACKLOG fase lanjut** | Job harian sudah siap (`dailyLisensiAlertJob_`) — hanya flag, belum kirim pesan |
| **K46** | Predikat kinerja BerAKHLAK (v1 = kuantitas JP saja) | 🟡 **BACKLOG fase lanjut** | Butuh amendemen skema (kolom perilaku) + backend baru |
| **K47** | Integrasi SIASN / SRIKANDI | 🟡 **BACKLOG fase lanjut** | Tercatat di BRD §Fitur Masa Depan |
| **K48** | API publik untuk portal induk / dashboard lintas SKPD | 🟡 **BACKLOG fase lanjut** | Belum ada kebutuhan konkret |

---

## 2. Gap yang Sudah TUTUP

### K1 — DB engine lokal di app (bukan library) → TUTUP ✅
- **Sebelum**: getSheetData_/saveRecord_/softDeleteRecord_ full impl lokal.
- **Sesudah (v5.0.0, 2026-09-13)**: DB engine dipindah ke CoreLib v2.4.0.1.
  `CoreLib.getSheetDataCached`, `CoreLib.apiSave`, `CoreLib.apiDelete`.
- **Bukti**: `01_ConfigAndBridge.gs` v5.0+ hanya wrapper tipis di atas CoreLib.

### K2 — Fallback data palsu (FALLBACK_*) → TUTUP ✅
- **Sebelum**: 6 konstanta `FALLBACK_PEGAWAI`, `FALLBACK_UNIT_KERJA`, `FALLBACK_JABATAN`, dll.
- **Sesudah**: **dihapus**. Lebih baik sheet kosong daripada data palsu.
  Return `[]` bila SIMPEG tidak tersedia → caller handle empty state.
- **Bukti**: `01_ConfigAndBridge.gs` v5.0 changelog: "REMOVED: Semua FALLBACK_*".

### K3 — Cache key custom (CACHE_SIKOMPETENSI_*) → TUTUP ✅
- **Sebelum**: key cache custom di app.
- **Sesudah**: pakai cache native CoreLib `sheetData_<dbId>_<sheet>` (namespace per database, sinkron antar-app).
- **Bukti**: `01_ConfigAndBridge.gs` v5.0 changelog.

### K4 — Nama sheet SIMPEG resolve error → TUTUP ✅
- **Sebelum**: `M_PEGAWAI` / `M_JABATAN` tidak dikenali CoreLib (gagal resolveCanonical).
- **Sesudah**: `canonicalSimpegSheet_()` normalisasi alias (`M_PEGAWAI` → `PEGAWAI`, `units` → `UNIT_KERJA`, `jabatan` → `JABATAN`).
- **Bukti**: `01_ConfigAndBridge.gs` §3 — `SIMPEG_SHEET_ALIAS_`.

### K5 — Kolom SIMPEG tidak dinormalisasi → TUTUP ✅
- **Sebelum**: `nama` vs `nama_lengkap`, `status_kepegawaian` vs `status_pegawai`, dst. → matching error.
- **Sesudah**: `normalizePegawai_` / `normalizeUnitKerja_` / `normalizeJabatan_` post-read (alias kolom bidirectional) + `normalizeEntityId_` (ID 4-digit).
- **Bukti**: `01_ConfigAndBridge.gs` §4.

### K6 — ID tidak konsisten (PEG-001 vs PEG-0001) → TUTUP ✅
- **Sebelum**: `PEG-001 ` (spasi trailing) ≠ `PEG-001` → duplikat tidak terdeteksi.
- **Sesudah**: `normalizeEntityId_` kanonik 4-digit (`PEG-0001`); field-field dinormalisasi otomatis.
- **Bukti**: test `TC-06` (si-kompetensi v5.0) — 7 test normalizeEntityId_ PASS.

### K7 — Audit log di delete hilang (FIX-M1) → TUTUP ✅
- **Sebelum**: `deleteKatalog_` / `deleteStandarKompetensi_` / `deleteReferensi_` tidak log audit.
- **Sesudah**: semua delete pakai `audit_(user, 'DELETE_XXX', ..., ok, msg)`.
- **Bukti**: `06_MasterLogic.gs` FIX-M1.

### K8 — H-90 hardcoded 90 hari → TUTUP ✅
- **Sebelum**: konstanta `90` di kode.
- **Sesudah**: baca dari config `alert_h_days_lisensi` (via `CoreLib.getEnvProperty`).
- **Bukti**: `05_KualifikasiLogic.gs` FIX-L2.

### K9 — Lisensi expired muncul di expiring → TUTUP ✅
- **Sebelum**: satu list campur (expired + expiring).
- **Sesudah**: pisah `data_expired` vs `data` (expiring); default `include_expired=false` eksplisit (FIX-L16).
- **Bukti**: `05_KualifikasiLogic.gs` FIX-L3 + FIX-L16.

### K10 — Duplikat lisensi/diklat/standar → TUTUP ✅
- **Sebelum**: tidak ada cek duplikat.
- **Sesudah**: cek duplikat di save (pegawai+jenis sama aktif / jabatan+diklat / kategori+kode / pegawai+diklat+tahun).
- **Bukti**: FIX-L11 (lisensi), FIX-M3 (standar), FIX-M4 (referensi), FIX-R6 (usulan).

### K11 — Analisis gap O(n³) → TUTUP ✅
- **Sebelum**: nested find di loop (FIX-D1).
- **Sesudah**: index `pegawaiById` + `riwayatIndex` (pegawai_id|diklat_id) — O(n).
- **Bukti**: `03_DashboardLogic.gs` FIX-D1.

### K12 — Filter tahun tidak dipakai di Analytics → TUTUP ✅
- **Sebelum**: param `tahun` diterima tapi diabaikan (FIX-D2).
- **Sesudah**: riwayat difilter by tahun.
- **Bukti**: `03_DashboardLogic.gs` FIX-D2.

### K13 — Kualifikasi aktif tidak cek masa berlaku → TUTUP ✅
- **Sebelum**: hanya cek `status_kualifikasi = 'aktif'` (FIX-D3).
- **Sesudah**: cek `tgl_habis_berlaku` → pisah aktif/expiring/expired.
- **Bukti**: `03_DashboardLogic.gs` FIX-D3.

### K14 — Bug geser tanggal UTC vs WIB → TUTUP ✅
- **Sebelum (v4.x–v5.x)**: `new Date().toISOString().slice(0,10)` → mundur 1 hari untuk WIB sebelum 07:00.
- **Sesudah (v5.4 G18d, 2026-09-19)**: `CoreLib.todayIsoLocal()` di 04/07/08.
  - `bulkAssignPeserta_` — tgl_surat_tugas WIB.
  - `saveUsulan_` — tgl_pengajuan WIB.
  - `reviewUsulan_` — tgl_penetapan WIB (tgl_review tetap UTC timestamp).
  - `verifikasiRiwayat_` — tanggal_verifikasi WIB.
- **Bukti**: test `TC-25`, `TC-R17.3`, `TC-43` PASS.

### K15 — Adapter Utils terlalu tipis (delegasi tanpa nilai tambah) → DIPERTAHANKAN ✅
- **Keputusan**: wrapper tipis delegasi OK (memudahkan refactor call-site).
- **v6.0.0**: wrapper delegasi tipis **dihapus total** (K21 di bawah).

---

## 3. Gap G18d (v6.0.0–v6.0.1) — Sesi Migrasi CoreLib-First

### K21 — Dispatcher switch-case manual (~200 baris) → TUTUP ✅
- **Sebelum (v5.x)**: `handleAction` switch 40+ case + `checkActionRole_`.
- **Sesudah (v6.0.0, 2026-09-19)**: `CoreLib.dispatchAction(payload, getAppConfig_())`.
- **Efek**: fail-closed (aksi tak dikenal ditolak di gerbang auth) + 200 baris hilang.
- **Bukti**: test `TC-R1..R16` PASS (16/16).

### K22 — Wrapper delegasi tipis (10 fungsi) → TUTUP ✅
- **Dihapus**: `requireRole_`, `checkActionRole_`, `normId_`, `normStr_`, `parseDate_`,
  `whitelist_`, `validateFields_`, `genUniqueCode_`, `getRoleForEmail_`, `isAllowedConfigKey_`.
- **Sesudah**: panggil `CoreLib.xxx` langsung dari setiap file domain.
- **Bukti**: `00_Utils.gs` v3.0.0 (sisa: `sendAuditLog_` + `audit_` — domain).

### K23 — Duplikasi fungsi CoreLib (`jsonResponse_`, `getEnvProperty_`) → TUTUP ✅
- **Dihapus**: `jsonResponse_`, `getEnvProperty_`, `getMasterSpreadsheet_`, `corelibConfig_`.
- **Sesudah**: `CoreLib.jsonResponse()`, `CoreLib.getEnvProperty(key, appProps_())`, `CoreLib.getDb()`, `CoreLib.masterDbFor_()`.
- **Bukti**: `01_ConfigAndBridge.gs` v3.0.0.

### K24 — SSO fallback manual (email aktif) → TUTUP ✅
- **Dihapus**: `adaptCorelibUser_`, `exchangePlatformTicket_`, `validateSsoTicket_`,
  `validateSessionToken_`, `logoutUser_`, fallback `Session.getActiveUser().getEmail()`.
- **Sesudah**: SSO native CoreLib (`CoreLib.exchangePlatformTicket`, `CoreLib.checkAuth`, `CoreLib.logoutUser`).
- **Bukti**: `02_AppLogic.gs` v3.0.0 — hanya `doGet`/`doPost`/`handleAction` + handler domain.

### K25 — Self-approve verifikasi (celah keamanan) → TUTUP ✅
- **Sebelum**: user edit riwayat status `menunggu` sambil kirim `status_verifikasi='disetujui'` → lolos (guard substantif tidak jalan).
- **Sesudah**: `localPreSaveHook_` (P2) — non-verifikator selalu `'menunggu'`, field verifikasi dikunci.
- **Bukti**: test `TC-P2.1` + `TC-P2.2` PASS.

### K26 — ID kosong (P1) — cegah PK jatuh ke pegawai_id → TUTUP ✅
- **Sebelum**: `saveRecord_` generate id via prefix sheet (substring 3 huruf).
- **Sesudah**: `localPreSaveHook_` (P1) dengan peta prefix eksplisit (`jdw`, `dkl`, `std`, `tgs`, `rwy`, `kua`, `usl`, `ref`).
- **Bukti**: test `TC-P1.1`, `TC-P1.2`, `TC-P1.3` PASS.

### K27 — Soft-delete record muncul di list → TUTUP ✅
- **Sebelum**: `getSheetData_` tidak filter `deleted_at` → record "hapus" tetap tampil di list + dashboard.
- **Sesudah (v6.0.1 A.1)**: `getSheetData_` default filter `!r.deleted_at`;
  parameter `{ includeDeleted: true }` untuk audit/histori.
- **Efek**: semua pemanggil (02–08) otomatis bersih dari record terhapus.
- **Bukti**: `T_USULAN_DIKLAT` jumlah stabil antar-run (bukan bertambah dari soft-delete).

### K28 — `ROLE_LEVELS` hardcoded → TUTUP ✅
- **Sebelum**: `var ROLE_LEVELS = { viewer: 0, user: 1, verifikator: 2, admin: 3, super: 4 };` hardcoded.
- **Sesudah**: `var ROLE_LEVELS = CoreLib.MASTER_ROLE_LEVELS;`.
- **Efek**: tidak ada drift bila CoreLib update level.
- **Bukti**: `01_ConfigAndBridge.gs` v3.0.0.

### K29 — Sisa `FALLBACK_*` di 03 + 06 (janji changelog belum ditepati) → TUTUP ✅
- **Sebelum**: `getAnalytics_` (03) + `saveStandarKompetensi_` (06) masih cek `typeof FALLBACK_* !== 'undefined'`.
- **Sesudah (v6.0.0)**: dihapus total (sesuai janji changelog 01 v5.0).
- **Bukti**: `03_DashboardLogic.gs` v5.0.0, `06_MasterLogic.gs` v5.0.0 — tidak ada lagi referensi.

### K30 — `getEnvProperty_` tanpa argumen store (config-shared) → TUTUP ✅
- **Sebelum**: `getEnvProperty_` baca Properties dari library.
- **Sesudah**: `CoreLib.getEnvProperty(key, appProps_())` — argumen store wajib.
- **Bukti**: `01_ConfigAndBridge.gs` v3.0.0 — `appProps_()` dideklarasikan + dipakai.

### K31 — `ACTION_ROLE_MAP_` tidak lengkap (fail-open) → TUTUP ✅
- **Sebelum**: aksi `get_*` + `delete` + `save` tidak di-map → `CoreLib.checkRole` return `allowed:true` (fail-open).
- **Sesudah (v6.0.0)**: semua aksi di-declare eksplisit di `getAppConfig_().actionLevels`;
  fail-closed via `CoreLib.dispatchAction` (default viewer + auth gate).
- **Bukti**: test `TC-R2` + `TC-R3` PASS.

### K32 — `initDatabase` orkestrasi manual → TUTUP ✅
- **Sebelum**: loop `Object.keys(LOCAL_SHEETS)` + `CoreLib.ensureSheet` per sheet + hapus Sheet1.
- **Sesudah**: `CoreLib.initDatabase(SPREADSHEET_ID, ALL_SHEET_HEADERS, isSimpegSheet_)` + hapus Sheet1 tipis.
- **Bukti**: `06_MasterLogic.gs` v5.0.0.

### K33 — `setupApp` orkestrasi manual → TUTUP ✅
- **Sebelum**: manual Props + folder Drive + seed config.
- **Sesudah**: `CoreLib.executeAppSetup({appCode, ..., props: appProps_()})`.
- **Bukti**: `06_MasterLogic.gs` v5.0.0.

### K34 — Test suite custom (4 self-check) → TUTUP ✅
- **Sebelum**: `testAppLogicSelfCheck`, `testDashboardSelfCheck`, `testDiklatSelfCheck`, `testKualifikasiSelfCheck`, `testMasterSelfCheck`, `testRencanaSelfCheck`, `testRiwayatSelfCheck`, `testSaveKatalogV5`, `runAllTestsSikompetensi` (custom).
- **Sesudah (v3.0.1)**: pola si-lahar — `runLibraryTests` (42) + `testAdopsiG18d` (13) + `testDispatcherRouting` (16) + `runDomainTestsSI` (14). Satu pintu `runAllTestsSikompetensi`.
- **Bukti**: output 42/13/16/14 PASS (2026-09-19).

### K35 — `checkRole_` fail-open (CoreLib) → DIDOKUMENTASIKAN ✅
- **Temuan**: `CoreLib.checkRole_` return `{allowed:true}` untuk aksi tak dikenal (fail-open by design).
- **Sesudah**: lengkapi `actionLevels` (K31) — tidak lagi bergantung pada fail-open.
- **Bukti**: test `TC-R2` + `TC-R3` PASS.

### K36 — CDN `@v2.6.5` → `@v2.9.1` → TUTUP ✅
- **Sebelum**: 4 URL CDN di Index pakai `@v2.6.5`.
- **Sesudah**: `@v2.9.1` (internal `2.8.0`).
- **Bukti**: `Index.html` v6.0.1 — 4 aset CDN.
- **Verifikasi**: `AppCore.version` = `AppComponents.version` = `AppModules.version` = `"2.8.0"`.

### K37 — Vue `3.4.21` → `3.5.42` → TUTUP ✅
- **Sebelum**: `vue@3.5.42`.
- **Sesudah**: `vue@3.5.42` (sinkron dengan standar CDN v2.9.1 & si-lahar).
- **Efek**: tidak ada breaking (tidak pakai fitur 3.5-only / reactive-props-destructure).
- **Bukti**: `Index.html` v6.0.1.

### K38 — Tombol aksi tabel manual (padding custom) → TUTUP ✅
- **Sebelum**: `btn btn-secondary text-xs px-2.5 py-1.5 rounded-lg` (7 tempat).
- **Sesudah**: `.btn-icon` / `.btn-icon-danger` (kit CDN v2.8.0/F2). 32×32 seragam, light+dark identik sumbernya.
- **Bukti**: 7 tempat di `V_MasterSatelit` (3), `V_DiklatPortofolio` (3), `V_UsulanDiklat` (1).

### K39 — Urutan JS CDN tidak identik si-lahar → TUTUP ✅
- **Sebelum (v6.0.0)**: `components → modules → core`.
- **Sesudah (v6.0.1)**: `components → core → modules` (byte-identik si-lahar).
- **Efek**: fungsional sama; byte-identik memudahkan diff antar-app.
- **Bukti**: `Index.html` v6.0.1.

### K40 — Pin CoreLib tidak terkunci (devMode) → TUTUP ✅
- **Sebelum**: pin `12` + `developmentMode: true` (selalu HEAD).
- **Sesudah**: pin **15** (v2.4.0) — terkunci, produksi stabil.
- **Bukti**: `appsscript.json` — `"version": "15"` tanpa devMode.

---

## 4. Daftar Keputusan Pemilik — Status

| # | Pertanyaan | Jawaban | Status |
|---|---|---|---|
| 1 | `invalidateSheetCache_` perlu ditambah? | **Tidak** — sudah ada di `CoreLib.apiSave`/`apiDelete` | ✅ Konfirmasi |
| 2 | `checkRole_` fail-open ditutup? | **Ya** — lengkapi `actionLevels` eksplisit | ✅ K31 |
| 3 | Self-approve verifikasi ditutup? | **Ya** — via `localPreSaveHook_` (P2) | ✅ K25 |
| 4 | Soft-delete filter? | **Ya** — di `getSheetData_` (default filter, `includeDeleted` opt-in) | ✅ K27 |
| 5 | `status_jadwal` non-owner: boleh ubah? | **Biarkan** (perilaku saat ini = keputusan) | ⏸ K41 |
| 6 | Migrasi dispatcher ke `CoreLib.dispatchAction`? | **Ya** — full migrasi | ✅ K21 |
| 7 | Hapus 10 wrapper delegasi tipis? | **Ya** — CoreLib-First | ✅ K22 |
| 8 | Struktur file — pola si-lahar? | **Ya** — modular V_* / J_* | ✅ (sudah dari v5.x) |
| 9 | Frontend — naikkan CDN & Vue? | **Ya** — `@v2.9.1` + Vue 3.5.42 | ✅ K36, K37 |
| 10 | Tombol icon manual → kit? | **Ya** — `.btn-icon`/`.btn-icon-danger` | ✅ K38 |

---

## 5. Ringkasan Status

### Total gap yang pernah tercatat
- **K1–K48** (48 gap, termasuk keputusan pemilik & backlog).

### Status akhir
| Kategori | Jumlah |
|---|---|
| ✅ TUTUP | 39 |
| ⏸ DIPUTUSKAN (biarkan) | 1 (K41) |
| 🟢 NICE-TO-HAVE | 2 (K42, K43) |
| 🟡 BACKLOG fase lanjut | 5 (K44–K48) |

### Kesehatan keseluruhan
- **Backend**: 100% CoreLib-First (dispatcher, hook, soft-delete filter, fail-closed).
- **Frontend**: 100% CDN kit `@v2.9.1` (badge, modal, tabel, filter, chart, picker).
- **Dokumen**: seluruh 9 dokumen `docs/` sinkron (dalam proses migrasi tulis-ulang).
- **Test**: `runLibraryTests` 42/0/1 + `testAdopsiG18d` 13/13 + `testDispatcherRouting` 16/16 + `runDomainTestsSI` 14/14 = **85 asersi**.

### Perbandingan dengan si-lahar
| Aspek | Si-lahar | Si-kompetensi |
|---|---|---|
| Backend pola | CoreLib-First (dispatcher + hook + soft-delete) | ✅ sama |
| Test suite | 42 + 13 + 13 | 42 + 13 + 16 + 14 |
| CDN | `@v2.9.1` | ✅ sama |
| Vue | `3.5.42` | ✅ sama |
| Urutan JS CDN | components → core → modules | ✅ byte-identik |
| Tombol aksi | `.btn-icon` kit | ✅ sama |
| Filename modular | V_* / J_* | ✅ sama |

**Kesimpulan**: si-kompetensi siap produksi. Tidak ada gap blocker. Sisa item = fase lanjut (fitur baru, bukan gap fungsional) + 2 nice-to-have kosmetik.
