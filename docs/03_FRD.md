# 03 — FRD [SI-KOMPETENSI: Portofolio, Jadwal & Lisensi Khusus ASN — 2026-09-19]

> Aturan Gate 0: **satu baris FR = satu item kode** (handler/fungsi/komponen/kolom).
> Build tidak boleh mendahului baris di dokumen ini.
>
> **Riwayat revisi**:
> - 2026-09-13 — FRD v5.0 (Gate 0, migrasi DB engine ke CoreLib v2.2.1).
> - 2026-09-14 — v5.4 (UI/UX polish, insight cards terang).
> - **2026-09-19 — v6.0.1**: CoreLib-First penuh (FR-40); kunci verifikasi lewat
>   `localPreSaveHook_` (FR-41); filter soft-delete otomatis (FR-42); tombol aksi
>   pakai kit CDN (FR-43).

## Master Katalog Diklat (M_KATALOG_DIKLAT)
- **FR-01** CRUD katalog diklat (verifikator+): nama_diklat wajib, default_jp numerik ≥ 0; kode auto DKL-XXX via `CoreLib.genUniqueCode` saat insert baru.
  - Backend: `saveKatalog_` (`06_MasterLogic.gs`).
- **FR-02** Whitelist rumpun diklat (soft-fallback): 6 rumpun valid (Manajerial & Kepemimpinan, Teknis Operasional, Fungsional Umum, Sosial Kultural, Pemerintahan, Lainnya); rumpun kosong/tidak valid → fallback 'Teknis Operasional' + log WARN.
  - Backend: `saveKatalog_` + `RUMPUN_DIKLAT_VALID_` (`06_MasterLogic.gs`).
- **FR-03** Delete katalog: dicegah bila masih dipakai di `M_STANDAR_KOMPETENSI` (audit log + error dengan count).
  - Backend: `deleteKatalog_` (`06_MasterLogic.gs`).

## Master Standar Kompetensi Jabatan (M_STANDAR_KOMPETENSI)
- **FR-04** CRUD standar SKJ (verifikator+): jabatan_id + diklat_id wajib; minimal_jp numerik ≥ 0 (angka 0 tidak dianggap falsy); duplikat (jabatan + diklat) dicegah saat insert.
  - Backend: `saveStandarKompetensi_` (`06_MasterLogic.gs`).
- **FR-05** Enrichment nama_jabatan (SIMPEG) + nama_diklat (katalog) + rumpun otomatis bila kosong; `minimal_jp` fallback ke `default_jp` katalog.
  - Backend: `saveStandarKompetensi_` (`06_MasterLogic.gs`).
- **FR-06** Whitelist tingkat_kebutuhan (WAJIB / DISARANKAN); whitelist level_kompetensi (5 level — soft, hanya log WARN).
  - Backend: `TINGKAT_KEBUTUHAN_VALID_`, `LEVEL_KOMPETENSI_VALID_` (`06_MasterLogic.gs`).

## Master Referensi (M_REFERENSI)
- **FR-07** CRUD referensi (verifikator+): kategori + nama_nilai wajib; status_aktif dinormalisasi ke 'true'/'false'; urutan numerik opsional.
  - Backend: `saveReferensi_` (`06_MasterLogic.gs`).
- **FR-08** Whitelist kategori referensi (soft-fail): 9 kategori valid (RUMPUN_KOMPETENSI, METODE_PELATIHAN, PENYELENGGARA, URGENSI_USULAN, JENIS_KUALIFIKASI_KHUSUS, STATUS_PEGAWAI, PANGKAT_GOLONGAN, TINGKAT_KEBUTUHAN, JENIS_JABATAN); kategori baru di luar whitelist tetap diizinkan (log WARN).
  - Backend: `KATEGORI_REFERENSI_VALID_` (`06_MasterLogic.gs`).
- **FR-09** Duplikat (kategori + kode) dicegah saat insert baru.
  - Backend: `saveReferensi_` (`06_MasterLogic.gs`).

## Jadwal Diklat (T_JADWAL_DIKLAT)
- **FR-10** Simpan jadwal (user insert; user edit milik sendiri; user edit field-hasil milik orang lain): nama_kegiatan/nama_diklat wajib; tgl_mulai ≤ tgl_selesai; whitelist status_jadwal.
  - Backend: `saveJadwal_` (`04_DiklatLogic.gs`).
- **FR-11** Ownership jadwal (policy): owner (created_by = email) atau admin boleh semua field; non-owner non-admin hanya boleh edit field-hasil (`JADWAL_HASIL_FIELDS_`): status_jadwal, nilai_kelulusan, no_sertifikat_terbit, catatan_hasil, jumlah_peserta_hadir.
  - Backend: `saveJadwal_` (`04_DiklatLogic.gs`).
- **FR-12** Insert jadwal (non-admin): status_jadwal dipaksa ke salah satu {Terjadwal, Buka Pendaftaran, Segera Dibuka}; kode_jadwal auto JDW-XXX via `CoreLib.genUniqueCode`.
  - Backend: `saveJadwal_` (`04_DiklatLogic.gs`).
- **FR-13** Delete jadwal (admin only): dicegah bila masih ada penugasan peserta terkait.
  - Backend: `deleteJadwal_` (`04_DiklatLogic.gs`).
- **FR-14** List jadwal: filter tahun (tahun_periode atau tgl_mulai), status, rumpun, diklat_id, limit; sort tgl_mulai desc; clone record sebelum kirim.
  - Backend: `getJadwalList_` (`04_DiklatLogic.gs`).

## Penugasan Peserta (T_PENUGASAN_PESERTA)
- **FR-15** Simpan penugasan (verifikator+): jadwal_id + pegawai_id wajib; cek jadwal exist + pegawai exist di SIMPEG; auto-generate no_surat_tugas bila kosong.
  - Backend: `savePenugasan_` (`04_DiklatLogic.gs`).
- **FR-16** Whitelist status_keikutsertaan (uppercase): DITUGASKAN / HADIR / TIDAK_HADIR / SELESAI / BATAL.
  - Backend: `PENUGASAN_STATUS_VALID_` (`04_DiklatLogic.gs`).
- **FR-17** Bulk assign peserta (verifikator+): skip duplikat (pegawai + jadwal sama), report per item (inserted/skipped/failed); no_surat_tugas & tgl (WIB via `CoreLib.todayIsoLocal()`) sama untuk semua.
  - Backend: `bulkAssignPeserta_` (`04_DiklatLogic.gs`).
- **FR-18** Delete penugasan (soft) — verifikator+.
  - Backend: `deletePenugasan_` (`04_DiklatLogic.gs`).

## Lisensi Khusus (T_KUALIFIKASI_KHUSUS)
- **FR-19** Simpan lisensi (verifikator+ or pemilik): pegawai_id + jenis_kualifikasi wajib; pegawai exist di SIMPEG; whitelist jenis_kualifikasi (SK_PPNS, DAMKAR_1, SCBA_OPERATOR, SAR_WATER, ROPE_RESCUE, LINMAS, LAINNYA).
  - Backend: `saveKualifikasi_` (`05_KualifikasiLogic.gs`).
- **FR-20** Normalisasi jenis_kualifikasi dari alias teks panjang → kode kanonik (mis. "sk pengangkatan penyidik ppns (kemenkumham/polri)" → SK_PPNS).
  - Backend: `normalizeJenisKualifikasi_` + `JENIS_KUALIFIKASI_ALIAS_` (`05_KualifikasiLogic.gs`).
- **FR-21** Validasi tanggal: tgl_sk_terbit < tgl_habis_berlaku; whitelist status_kualifikasi (AKTIF, TIDAK_AKTIF, DICABUT, DIPERPANJANG) — casing uppercase.
  - Backend: `saveKualifikasi_` + `STATUS_KUALIFIKASI_VALID_` (`05_KualifikasiLogic.gs`).
- **FR-22** Duplikat lisensi (pegawai + jenis sama dengan status AKTIF) dicegah saat insert.
  - Backend: `saveKualifikasi_` (`05_KualifikasiLogic.gs`).
- **FR-23** Ownership lisensi: pemilik (pegawai_id = user.pegawai_id) atau verifikator+ boleh edit; reset `alert_h90_sent` bila tgl_habis_berlaku berubah.
  - Backend: `saveKualifikasi_` (`05_KualifikasiLogic.gs`).
- **FR-24** Early Warning H-90: hitung lisensi expiring soon vs expired; threshold dari config `alert_h_days_lisensi` (default 90); default `include_expired = false` (eksplisit).
  - Backend: `getKualifikasiExpiringSoon_` (`05_KualifikasiLogic.gs`).
- **FR-25** List lisensi: filter pegawai, jenis, status, only_active; enrich dengan pegawai (nama, NIP); sort tgl_habis_berlaku asc.
  - Backend: `getKualifikasiList_` (`05_KualifikasiLogic.gs`).
- **FR-26** Job harian opsional: tandai `alert_h90_sent = 'true'` untuk lisensi yang masuk window H-90; idempoten (skip yang sudah ditandai). Tidak kirim email — hanya set flag.
  - Backend: `dailyLisensiAlertJob_` (`05_KualifikasiLogic.gs`).

## Riwayat Kompetensi (T_RIWAYAT_KOMPETENSI)
- **FR-27** Simpan riwayat (viewer milik sendiri / verifikator+ bebas): pegawai_id + nama_kegiatan wajib; pegawai exist; tgl mulai ≤ selesai ≤ terbit; JP 0–2000; whitelist metode pelatihan.
  - Backend: `saveRiwayat_` (`08_RiwayatLogic.gs`).
- **FR-28** **Kunci field verifikasi via hook (P2)**: `localPreSaveHook_` menahan non-verifikator — selalu `status_verifikasi = 'menunggu'`; verifikator+ bebas set status.
  - Backend: `localPreSaveHook_` (`01_ConfigAndBridge.gs`).
- **FR-29** Auto-fill dari katalog: rumpun & penyelenggara di-resolve dari katalog bila kosong; cek duplikat (no_sertifikat sama / diklat+tgl sama).
  - Backend: `saveRiwayat_` (`08_RiwayatLogic.gs`).
- **FR-30** **Auto-privacy**: role `user` tanpa filter pegawai_id → list default milik sendiri (dipaksa); verifikator+ lihat semua.
  - Backend: `getRiwayatList_` (`08_RiwayatLogic.gs`).
- **FR-31** Verifikasi riwayat (verifikator+): `status_verifikasi ∈ {disetujui, ditolak, revisi}`; tanggal_verifikasi = `CoreLib.todayIsoLocal()` (WIB).
  - Backend: `verifikasiRiwayat_` (`08_RiwayatLogic.gs`).
- **FR-32** Delete riwayat: pemilik atau verifikator+; pemilik tidak boleh hapus bila status 'disetujui'.
  - Backend: `deleteRiwayat_` (`08_RiwayatLogic.gs`).
- **FR-33** Summary JP per pegawai: filter status 'disetujui' + tahun; group by pegawai; enrich dengan nama/nip.
  - Backend: `getRiwayatJpSummary_` (`08_RiwayatLogic.gs`).

## Rencana / Usulan Diklat (T_USULAN_DIKLAT)
- **FR-34** Simpan usulan (user): nama_program_diklat (alias nama_diklat_usulan) wajib; tahun_anggaran 2000–2100; whitelist periode_triwulan; whitelist status_rencana; normalisasi ID fields.
  - Backend: `saveUsulan_` (`07_RencanaLogic.gs`).
- **FR-35** Validasi pegawai exist (bila pegawai_id diisi); target_jp default 20 (PNS) / 24 (PPPK, dari SIMPEG status_pegawai); estimasi_biaya cast Number default 0.
  - Backend: `saveUsulan_` (`07_RencanaLogic.gs`).
- **FR-36** Duplikat (pegawai + diklat + tahun) dicegah saat insert; tgl_pengajuan auto = `CoreLib.todayIsoLocal()` (WIB); tgl_penetapan TIDAK auto-set.
  - Backend: `saveUsulan_` (`07_RencanaLogic.gs`).
- **FR-37** List usulan + tracking realisasi: index riwayat by (pegawai_id|diklat_id) untuk lookup O(1); fallback fuzzy nama (≥10 char); isi `realisasi_jp` & `is_terealisasi`; alias bidirectional (nama_program ↔ nama_diklat_usulan, tahun_anggaran ↔ tahun_anggaran_target).
  - Backend: `getUsulanList_` (`07_RencanaLogic.gs`).
- **FR-38** Review usulan (admin): status_usulan wajib (whitelist: diajukan, disetujui_kasat, ditolak_kasat, revisi); sinkronkan status_rencana; tgl_penetapan diisi HANYA saat disetujui (WIB); tgl_review = timestamp UTC kanonik; history append ke catatan_evaluasi.
  - Backend: `reviewUsulan_` (`07_RencanaLogic.gs`).
- **FR-39** Delete usulan: dicegah bila status_rencana = 'Terealisasi' (data historis).
  - Backend: `deleteUsulan_` (`07_RencanaLogic.gs`).

## Dashboard & Analisa Gap
- **FR-40** Dashboard KPI: kartu total (sertifikat, JP tahun, capaian %, kualifikasi aktif/expiring/expired, jadwal aktif, usulan) + kartu PNS vs PPPK + AI insight (tren partisipasi, unit teraktif, prediksi pegawai tidak capai target) + list jadwal aktif 8 teratas.
  - Backend: `apiDashboard_` (`03_DashboardLogic.gs`).
- **FR-41** Analisa gap SKJ (admin): index (pegawai_id|diklat_id) — O(n) lookup; hitung total evaluasi, gap count, gap wajib vs disarankan, % kepatuhan, personel terdampak; temuan + rekomendasi.
  - Backend: `getAnalytics_` (`03_DashboardLogic.gs`).
- **FR-42** Filter tahun di dashboard & analisa (parameter `tahun` benar-benar dipakai; riwayat difilter by tahun).

## Infrastruktur & Konfigurasi (CoreLib-First)
- **FR-43** **Delegasi penuh ke CoreLib**: seluruh util generik (normId, normStr, parseDate, whitelist, genUniqueCode, requireRole, checkRole, getRoleForEmail, isAllowedConfigKey, getEnvProperty, todayIsoLocal, dateKey10, paginate, matchSearch, dispatchAction, getDb, ensureSheet, initDatabase, executeAppSetup) — DILARANG menduplikasi di app.
  - Backend: seluruh `.gs` (tidak ada wrapper delegasi tipis di app setelah v6.0.0).
- **FR-44** **Dispatcher CoreLib**: `handleAction` → `CoreLib.dispatchAction(payload, cfg)`; `cfg = getAppConfig_()` + `localHandlers` dari `buildLocalHandlers_()`.
  - Backend: `handleAction` (`02_AppLogic.gs`), `getAppConfig_` (`01_ConfigAndBridge.gs`).
- **FR-45** **`actionLevels` fail-closed**: semua aksi di map eksplisit (viewer / user / verifikator / admin / super); aksi tak dikenal = fail-closed (default dispatcher viewer + auth gate).
  - Backend: `getAppConfig_().actionLevels` (`01_ConfigAndBridge.gs`).
- **FR-46** **`localPreSaveHook_`**: P1 = generate id kosong (prefix per-sheet: jdw, dkl, std, tgs, rwy, kua, usl, ref); P2 = kunci field verifikasi `T_RIWAYAT_KOMPETENSI` untuk non-verifikator.
  - Backend: `localPreSaveHook_` (`01_ConfigAndBridge.gs`).
- **FR-47** **Filter soft-delete otomatis**: `getSheetData_` filter `!r.deleted_at` secara default; parameter `{ includeDeleted: true }` untuk audit/histori.
  - Backend: `getSheetData_` (`01_ConfigAndBridge.gs`).
- **FR-48** **Kontrak dispatcher v2**: `getAppConfig_()` menyediakan `appCode, spreadsheetId, masterSsId, platformApiUrl, sessionPrefix, ttlSeconds, roleLevels, headersMap, pkFields, isRefSheetFunc, preSaveHook, actionLevels, localHandlers`.
  - Backend: `getAppConfig_` (`01_ConfigAndBridge.gs`).
- **FR-49** **SSO tanpa fallback**: exchange ticket & session langsung ke `CoreLib.exchangePlatformTicket` / `CoreLib.checkAuth` — TIDAK ADA fallback email aktif.
  - Backend: `CoreLib.dispatchAction` (delegasi dari `02_AppLogic.gs`).
- **FR-50** **Konfigurasi app di Script Properties**: whitelist key via `CoreLib.isAllowedConfigKey` (default 9 key + extra ADMIN_EMAILS, VERIFIKATOR_EMAILS); delete via handler khusus `deleteConfigItem_` (whitelist key — bukan generic delete).
  - Backend: `getConfigList_`, `saveConfigItem_`, `deleteConfigItem_` (`02_AppLogic.gs`).

## UI & Frontend (v6.0.1 — CDN First)
- **FR-51** Seluruh UI memakai kit CDN `@v2.8.1`: `<app-badge>`, `<app-modal>`, `<app-crud-table>`, `<app-filter-bar>`, `<app-stat-card>`, `<app-chart-bar>` / `<app-chart-doughnut>`, `<app-pegawai-picker>`, `<app-empty-state>`, `<app-skeleton>`, `<app-profile>`, `<app-settings>`, `<app-login>`, `<app-sidebar>`, `<app-header>`.
- **FR-52** Tombol aksi tabel pakai `.btn-icon` / `.btn-icon-danger` kit CDN (7 tempat di `V_MasterSatelit`, `V_DiklatPortofolio`, `V_UsulanDiklat`).
- **FR-53** Filter multi-kolom pakai `<app-filter-bar>` (4 halaman: Analisa, Master×3 tab, Diklat×3 tab).
- **FR-54** Paginasi client-side pakai `AppCore.paginate` + `AppCore.pageCount` (bukan helper lokal).
- **FR-55** Library berat (chart, xlsx, jspdf, autotable, pdf-lib) dimuat on-demand via `AppCore.loadLib()` — TIDAK dimuat di `<head>` Index.html.
- **FR-56** Boot dark-mode pakai kunci `sikompetensi_dark` (baca ter-guard try/catch di Index.html).
- **FR-57** Splash SSO khas si-kompetensi: gradient orb + ring spin + logo float — TIDAK bisa digantikan komponen kit (dibiarkan lokal di `<style>` Index).
- **FR-58** Include wajib satu tingkat dari `Index.html`: `V_Modals` → `V_Dashboard` → `V_Profil` → `V_DiklatPortofolio` → `V_UsulanDiklat` → `V_AnalisaGap` → `V_MasterSatelit` → `V_Pengaturan`; `J_State` → `J_Helpers` → `J_Api` → `J_Actions` → `J_Export` → `J_App`.

## Test & Verifikasi (v3.0.1)
- **FR-59** `runLibraryTests()` — regression CoreLib pin 15 (target PASS 42 / FAIL 0 / SKIP 1).
  - Backend: `99_TestSuite.gs`.
- **FR-60** `testAdopsiG18d()` — verifikasi util CoreLib v2.3.0 (target 13/13).
  - Backend: `99_TestSuite.gs`.
- **FR-61** `testDispatcherRouting()` — registry handler + fail-closed (target 16/16).
  - Backend: `99_TestSuite.gs`.
- **FR-62** `runDomainTestsSI()` — test domain FIX L16/M16/R17 + SIMPEG read-only + hook (target 14/14).
  - Backend: `99_TestSuite.gs`.
- **FR-63** `runAllTestsSikompetensi()` — satu pintu eksekusi semua di atas + rekap akhir.

## Migrasi & Cleanup (v6.0.0 — 2026-09-19)
- **FR-64** Hapus 10 wrapper delegasi tipis di `00_Utils.gs` (requireRole_, checkActionRole_, normId_, normStr_, parseDate_, whitelist_, validateFields_, genUniqueCode_, getRoleForEmail_, isAllowedConfigKey_) — semua panggil `CoreLib.xxx` langsung.
  - Backend: `00_Utils.gs` (sisa: `sendAuditLog_` + `audit_` domain).
- **FR-65** Hapus fallback SSO manual (`exchangePlatformTicket_`, `validateSsoTicket_`, `validateSessionToken_`, `adaptCorelibUser_`, `corelibConfig_`) — delegasi penuh ke CoreLib.
  - Backend: `02_AppLogic.gs`.
- **FR-66** Bersihkan sisa `FALLBACK_*` di `03_DashboardLogic.gs` + `06_MasterLogic.gs` (sesuai janji changelog 01 v5.0).
- **FR-67** `initDatabase` → delegasi `CoreLib.initDatabase`; `setupApp` → delegasi `CoreLib.executeAppSetup` (folder Drive + seed config + warnings otomatis).
  - Backend: `06_MasterLogic.gs`.
- **FR-68** `getAppConfig_()` di-restrukturisasi ke format kontrak dispatcher v2 (actionLevels + localHandlers + preSaveHook + isRefSheetFunc + pkFields).
  - Backend: `01_ConfigAndBridge.gs`.
- **FR-69** `ROLE_LEVELS` → `CoreLib.MASTER_ROLE_LEVELS` (delegasi — hindari drift).
  - Backend: `01_ConfigAndBridge.gs`.
- **FR-70** `getEnvProperty_` → `CoreLib.getEnvProperty(key, appProps_())` (argumen store wajib, cegah config-shared).
  - Backend: `01_ConfigAndBridge.gs` (variabel konstanta).
