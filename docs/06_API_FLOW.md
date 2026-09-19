# 06 — API FLOW [SI-KOMPETENSI: Portofolio, Jadwal & Lisensi Khusus ASN — 2026-09-19]

> Semua aksi lewat CoreLib router (`handleAction({action, data, token})`).
> Level aksi dideklarasikan di `01_ConfigAndBridge.gs` (`getAppConfig_().actionLevels`) —
> cermin fail-closed CoreLib (default aksi tak dikenal = `viewer`).
>
> **Catatan CoreLib built-in default** (v2.2.2+): tiga aksi berikut punya default
> `admin` **tanpa perlu didaftarkan di `actionLevels`**: `save`, `delete`,
> `save_config_item`. Karena itu `V_Pengaturan.html` (`<app-settings>`) berfungsi
> penuh tanpa app perlu mendeklarasikan ketiganya.
>
> **Riwayat revisi**:
> - 2026-09-13 — API FLOW v5.0 initial (Gate 0, migrasi CoreLib v2.2.1).
> - 2026-09-14 — v5.4 polish.
> - **2026-09-19 — v6.0.1**: CoreLib-First penuh (dispatcher `CoreLib.dispatchAction`);
>   10 wrapper delegasi dihapus; `localPreSaveHook_` (P1/P2); filter soft-delete otomatis.

## Alur bisnis utama

```
[M_KATALOG_DIKLAT + M_STANDAR_KOMPETENSI]
        │
        ├── admin susun agenda ──► [T_JADWAL_DIKLAT] ──► [T_PENUGASAN_PESERTA]
        │                                                    │
        └── admin susun RHK per jabatan                     │
                                                            ▼
[pegawai] ───upload──► [T_RIWAYAT_KOMPETENSI] ──menunggu──► [verifikasi verifikator]
        │                       │                                    │
        │                       └──disetujui──► JP terhitung          │
        │                                                             │
        │                              ┌──────────────────────────────┘
        │                              ▼
        └──[T_KUALIFIKASI_KHUSUS] ──alert H-90──► [Dashboard + Analisa]
                                                        │
        [T_USULAN_DIKLAT] ◄──usulan bottom-up───────────┘
```

## Daftar aksi (71 handler dari `buildLocalHandlers_()`)

Handler didaftarkan di `02_AppLogic.gs` via `buildLocalHandlers_()`, digabung ke
`cfg.localHandlers` lalu dieksekusi `CoreLib.dispatchAction`. Level aksi
dideklarasikan terpisah di `01_ConfigAndBridge.gs` (`getAppConfig_().actionLevels`).

### A. Konfigurasi (Script Properties — bukan sheet)

| Aksi | Level | Backend | Input | Output |
|---|---|---|---|---|
| `get_config` | viewer | `02` → `getConfigList_` | — | list default + stored (whitelist) |
| `get_config_list` | viewer | `02` → `getConfigList_` | — | alias `get_config` |
| `save_config_item` | **admin** | `02` → `saveConfigItem_` | `{key, value, keterangan?}` | upsert Script Property (whitelist key) |
| `save_config` | **admin** | `02` → `saveConfigItem_` | alias | |
| `delete_config_item` | **admin** | `02` → `deleteConfigItem_` | `{key}` atau `{id}` | hapus Script Property (whitelist key) |
| `delete_config` | **admin** | `02` → `deleteConfigItem_` | alias | |
| `delete` | admin (default CoreLib) | routing internal → `deleteConfigItem_` (khusus KONFIGURASI) | `{entity:'KONFIGURASI', key}` | dipakai `<app-settings>` |

### B. Profil Sesi

| Aksi | Level | Backend | Input | Output |
|---|---|---|---|---|
| `get_my_profile` | viewer | `02` → `{success, data: user}` | — | user dari session CoreLib |
| `save_my_profile` | viewer | `CoreLib.saveMyProfile` | `{alamat?, no_hp?}` | update MAIN_DATA lokal (email dari session) |

### C. Dashboard & Analitik

| Aksi | Level | Backend | Input | Output |
|---|---|---|---|---|
| `dashboard` | viewer | `03` → `apiDashboard_` | `{tahun?}` | KPI + PNS/PPPK + chart + AI insight + jadwal aktif + matriks bulanan |
| `analytics` | viewer | `03` → `getAnalytics_` | `{tahun?}` | gap SKJ + temuan + rekomendasi + total riwayat tahun |

### D. SIMPEG Read-Only (bundle + granular)

| Aksi | Level | Backend | Input | Output |
|---|---|---|---|---|
| `get_simpeg_lookup` | viewer | `02` → `getSimpegLookup_` | — | `{pegawai, unit, jabatan}` (bundle) |
| `get_master_pegawai` | viewer | `02` → `getMasterPegawai_` | — | list pegawai |
| `get_master_unit` | viewer | `02` → `getMasterUnit_` | — | list unit |
| `get_master_jabatan` | viewer | `02` → `getMasterJabatan_` | — | list jabatan |
| `get_pegawai_list` | viewer | alias `get_master_pegawai` | — | kompat AppCore.loadMasterSIMPEG |
| `get_unit_list` | viewer | alias `get_master_unit` | — | kompat |
| `get_jabatan_list` | viewer | alias `get_master_jabatan` | — | kompat |
| `get_master_satelit` | viewer | `02` → `getMasterSatelit_` | — | `{katalog, standar_kompetensi, referensi, jadwal}` |

### E. Jadwal Diklat (T_JADWAL_DIKLAT)

| Aksi | Level | Backend | Input | Output |
|---|---|---|---|---|
| `get_jadwal_list` | viewer | `04` → `getJadwalList_` | `{tahun?, status?, rumpun?, diklat_id?, limit?}` | list + total |
| `save_jadwal` | **user** | `04` → `saveJadwal_` | `{record}` atau `record` langsung | upsert + validasi + kode JDW auto |
| `delete_jadwal` | **admin** | `04` → `deleteJadwal_` | `{id}` | soft delete; tolak bila ada penugasan |

**Ownership jadwal**: owner (created_by = email) atau admin bebas; non-owner hanya boleh ubah field `JADWAL_HASIL_FIELDS_` (`status_jadwal`, `nilai_kelulusan`, `no_sertifikat_terbit`, `catatan_hasil`, `jumlah_peserta_hadir`).

### F. Penugasan Peserta (T_PENUGASAN_PESERTA)

| Aksi | Level | Backend | Input | Output |
|---|---|---|---|---|
| `get_penugasan_list` | viewer | `04` → `getPenugasanList_` | `{jadwal_id?, pegawai_id?, status_keikutsertaan?}` | list + total |
| `save_penugasan` | **verifikator** | `04` → `savePenugasan_` | `{record}` | upsert + validasi pegawai/jadwal |
| `bulk_assign_peserta` | **verifikator** | `04` → `bulkAssignPeserta_` | `{jadwal_id, pegawai_ids[]}` | inserted/skipped/failed (WIB tgl SPT) |
| `delete_penugasan` | **verifikator** | `04` → `deletePenugasan_` | `{id}` | soft delete |

### G. Kualifikasi Khusus (T_KUALIFIKASI_KHUSUS)

| Aksi | Level | Backend | Input | Output |
|---|---|---|---|---|
| `get_kualifikasi_list` | viewer | `05` → `getKualifikasiList_` | `{pegawai_id?, jenis_kualifikasi?, status_kualifikasi?, only_active?, enrich?}` | list + total + enrich pegawai |
| `save_kualifikasi` | **verifikator** | `05` → `saveKualifikasi_` | `{record}` | upsert + validasi + duplikat + reset alert |
| `delete_kualifikasi` | **user** | `05` → `deleteKualifikasi_` | `{id}` | soft delete + ownership |
| `get_kualifikasi_expiring_soon` | viewer | `05` → `getKualifikasiExpiringSoon_` | `{pegawai_id?, jenis_kualifikasi?, include_expired?}` | list + count + threshold |

### H. Riwayat Portofolio (T_RIWAYAT_KOMPETENSI)

| Aksi | Level | Backend | Input | Output |
|---|---|---|---|---|
| `get_riwayat_list` | viewer | `08` → `getRiwayatList_` | `{pegawai_id?, diklat_id?, jadwal_id?, status_verifikasi?, rumpun?, tahun?, search?, only_mine?, limit?}` | list + total + auto-privacy (role user default sendiri) |
| `save_riwayat` | **user** | `08` → `saveRiwayat_` | `{record}` | upsert + validasi; **field verifikasi DIKUNCI hook P2** |
| `delete_riwayat` | **user** | `08` → `deleteRiwayat_` | `{id}` | soft delete + ownership; tolak bila status disetujui & bukan verifikator |
| `verifikasi_riwayat` | **verifikator** | `08` → `verifikasiRiwayat_` | `{id, status_verifikasi, catatan_verifikator?}` | update status + tgl WIB |

### I. Usulan / Rencana Diklat (T_USULAN_DIKLAT)

| Aksi | Level | Backend | Input | Output |
|---|---|---|---|---|
| `get_usulan_list` | viewer | `07` → `getUsulanList_` | `{tahun?, status?, unit_id?, pegawai_id?, diklat_id?, limit?}` | list + tracking realisasi (auto-match riwayat) |
| `get_rencana_list` | viewer | alias `get_usulan_list` | | |
| `get_usulan` | viewer | alias `get_usulan_list` | | |
| `save_usulan` | **user** | `07` → `saveUsulan_` | `{record}` | upsert + validasi + duplikat + WIB tgl_pengajuan |
| `save_usulan_diklat` | **user** | alias `save_usulan` | | |
| `save_rencana_diklat` | **user** | alias `save_usulan` | | |
| `save_rencana` | **user** | alias `save_usulan` | | |
| `delete_usulan` | **verifikator** | `07` → `deleteUsulan_` | `{id}` | soft delete; tolak bila Terealisasi |
| `delete_usulan_diklat` | **verifikator** | alias | | |
| `delete_rencana_diklat` | **verifikator** | alias | | |
| `delete_rencana` | **verifikator** | alias | | |
| `review_usulan` | **admin** | `07` → `reviewUsulan_` | `{id, status_usulan, catatan_pimpinan?}` | update + sinkron status_rencana + history + WIB tgl_penetapan |

### J. Master Katalog Diklat (M_KATALOG_DIKLAT)

| Aksi | Level | Backend | Input | Output |
|---|---|---|---|---|
| `get_katalog_list` | viewer | `02` → `getSheetData_` (dipetakan inline) | — | list katalog |
| `get_katalog` | viewer | alias | | |
| `get_katalog_diklat` | viewer | alias | | |
| `save_katalog` | **verifikator** | `06` → `saveKatalog_` | `{record}` | upsert + rumpun whitelist soft + kode DKL auto |
| `save_katalog_diklat` | **verifikator** | alias | | |
| `save_katalog_master` | **verifikator** | alias | | |
| `delete_katalog` | **verifikator** | `06` → `deleteKatalog_` | `{id}` | tolak bila dipakai di standar |
| `delete_katalog_diklat` | **verifikator** | alias | | |
| `delete_katalog_master` | **verifikator** | alias | | |

### K. Master Standar Kompetensi (M_STANDAR_KOMPETENSI)

| Aksi | Level | Backend | Input | Output |
|---|---|---|---|---|
| `get_standar_list` | viewer | `02` → `getSheetData_` | — | list standar SKJ |
| `get_standar` | viewer | alias | | |
| `get_standar_kompetensi` | viewer | alias | | |
| `save_standar_kompetensi` | **verifikator** | `06` → `saveStandarKompetensi_` | `{record}` | upsert + duplikat + enrichment |
| `save_standar` | **verifikator** | alias | | |
| `save_standar_jabatan` | **verifikator** | alias | | |
| `delete_standar_kompetensi` | **verifikator** | `06` → `deleteStandarKompetensi_` | `{id}` | soft delete |
| `delete_standar` | **verifikator** | alias | | |
| `delete_standar_jabatan` | **verifikator** | alias | | |

### L. Master Referensi (M_REFERENSI)

| Aksi | Level | Backend | Input | Output |
|---|---|---|---|---|
| `get_referensi_list` | viewer | `02` → `getSheetData_` | — | list referensi |
| `get_referensi` | viewer | alias | | |
| `save_referensi` | **verifikator** | `06` → `saveReferensi_` | `{record}` | upsert + kategori soft-fail + duplikat |
| `save_ref` | **verifikator** | alias | | |
| `delete_referensi` | **verifikator** | `06` → `deleteReferensi_` | `{id}` | soft delete |
| `delete_ref` | **verifikator** | alias | | |

### M. Sistem

| Aksi | Level | Backend | Input | Output |
|---|---|---|---|---|
| `init_database` | **super** | `06` → `initDatabase(actor)` | — | delegasi `CoreLib.initDatabase` + hapus Sheet1 |
| `ping` | publik (default viewer) | routing bawaan CoreLib.dispatchAction | — | — |
| `exchange_platform_ticket` | publik | `CoreLib.exchangePlatformTicket` | `{ticket}` | token + user (SSO native) |
| `exchange_sso_ticket` | publik | alias | | |
| `logout` | publik | `CoreLib.logoutUser` | — | cleanup session |

## Kontrak respons (CoreLib v2.2+)

Standar CoreLib `dispatchAction`:

```js
// Sukses
{ success: true, data: <payload> }
{ success: true, data: [...], meta: { total, page, limit, total_pages } }

// Gagal
{ success: false, code: 'BAD_REQUEST'|'UNAUTHORIZED'|'FORBIDDEN'|'NOT_FOUND'|'BUSY', error: 'pesan' }
```

**Frontend auto-handling** (app-core v2.8.0):
- `code: 'UNAUTHORIZED'` → `handleSessionExpired()` (clear token + redirect init).
- `code: 'BUSY'` → toast "Server sibuk, coba lagi".
- `code: 'FORBIDDEN'` → toast pesan error dari backend.
- `code: 'BAD_REQUEST'` → toast pesan validasi.
- `code: 'NOT_FOUND'` → toast "Data tidak ditemukan".

**Dedup & cache-bust**: `AppCore.callServer` menambah `_cacheBust` timestamp ke payload; `CoreLib.dispatchAction` membuang field ini sebelum diproses (fix v2.2.2). In-flight dedup otomatis untuk aksi baca (`get_*`, `dashboard`, `analytics`).

## Aksi CoreLib built-in (tidak perlu didaftarkan di `actionLevels`)

| Aksi | Level Default CoreLib | Dipakai oleh |
|---|---|---|
| `save` | **admin** | Generic CRUD (tidak dipakai frontend — pakai handler khusus `save_katalog` dll.) |
| `delete` | **admin** | Generic CRUD (`<app-settings>` pakai ini untuk hapus KONFIGURASI) |
| `save_config_item` | **admin** | `<app-settings>` (V_Pengaturan) |
| `get_config` | viewer (default) | `<app-settings>` |
| `exchange_platform_ticket` | publik (tanpa session) | login SSO gateway |
| `logout` | publik | keluar sesi |
| `get_pegawai_list` / `get_unit_list` / `get_jabatan_list` | viewer | referensi SIMPEG (fallback AppCore.loadMasterSIMPEG) |

> Sejak v6.0.1, `01_ConfigAndBridge.gs` **mendeklarasikan eksplisit** `actionLevels`
> untuk semua aksi e-Kompetensi (mis. `save_katalog: 'verifikator'`). Untuk aksi
> generik (`save`/`delete`/`save_config_item`) tidak perlu didaftarkan — CoreLib
> sudah punya default `admin`.

## Adopsi CoreLib v2.3.0 (v6.0.1)

Tidak ada aksi API baru. Yang berubah hanya **implementasi internal**:

| Wrapper lama | Sebelum | Sesudah (v6.0.0) |
|---|---|---|
| `normId_(x)` | Wrapper `return CoreLib.normId(x)` | Dihapus — panggil `CoreLib.normId(x)` langsung |
| `normStr_(x)` | Wrapper | Dihapus — `CoreLib.normStr(x)` |
| `parseDate_(x)` | Wrapper | Dihapus — `CoreLib.parseDate(x)` |
| `whitelist_(v,a,f)` | Wrapper | Dihapus — `CoreLib.whitelist(v,a,f)` |
| `validateFields_(o,f)` | Wrapper | Dihapus — `CoreLib.validateFields(o,f)` |
| `requireRole_(u,m)` | Wrapper | Dihapus — `CoreLib.requireRole(u,m)` |
| `checkActionRole_(a,u)` | Wrapper | Dihapus — dispatcher `actionLevels` |
| `genUniqueCode_(p,s,f,w)` | Wrapper tanpa ssId | Dihapus — `CoreLib.genUniqueCode(p,s,f,w,SPREADSHEET_ID,ALL_SHEET_HEADERS)` |
| `getRoleForEmail_(e)` | Wrapper | Dihapus — `CoreLib.getRoleForEmail(e, appProps_())` |
| `isAllowedConfigKey_(k)` | Wrapper dengan extraKeys | Dihapus — `CoreLib.isAllowedConfigKey(k, ['ADMIN_EMAILS','VERIFIKATOR_EMAILS'])` |
| `getEnvProperty_(k)` | Baca Properties langsung | Dihapus — `CoreLib.getEnvProperty(k, appProps_())` |
| `todayIso_()` (dashboard) | `new Date()` lokal | Dihapus — semua pakai `CoreLib.todayIsoLocal()` |
| `jsonResponse_()` | Wrapper ContentService | Dihapus — pakai `CoreLib.jsonResponse()` |
| `checkActionRole_` switch | Manual switch 200 baris | Dihapus — `CoreLib.dispatchAction(payload, cfg)` |
| `adaptCorelibUser_`, `corelibConfig_`, `exchangePlatformTicket_`, `validateSsoTicket_`, `validateSessionToken_`, `logoutUser_` | Fallback SSO manual | Dihapus — SSO native CoreLib |

**Efek di alur API**: seluruh handler yang memakai util (tanggal, whitelist, paginasi,
pencarian) sekarang **sadar zona waktu Script** dan **sadar whitelist kanonik**.
Handler yang mengembalikan error kini **selalu menyertakan `code`** (bukan hanya
`error` string) — konsisten dengan kontrak CoreLib v2.2+.

## Alur detail per fitur

### 1. Login SSO
```
[User buka app] → [doGet(ticket?)] → Index.html + window.__SSO_TICKET__
                                        ↓
[AppCore.processInitialAuth] → callServer('exchange_platform_ticket', {ticket})
                                        ↓
[CoreLib.exchangePlatformTicket] → HTTP POST ke SI-PLATFORM → token + user
                                        ↓
[sessionStorage: token + user] → [runInitApp()]
                                        ↓
[loadMasterSIMPEG] → [get_master_pegawai/unit/jabatan] → cache SWR (LocalStorage)
                                        ↓
[config.initApp(vm)] → load semua modul (silent) → [dataLoaded = true]
```

### 2. Upload Sertifikat (riwayat)
```
[V_DiklatPortofolio Tab Portofolio] → klik Upload → openKompetensiForm()
                                        ↓
[Modal Sertifikat] → isi form → pilih PDF → onPdfFileSelected() (kompresi client-side)
                                        ↓
[Simpan] → callServer('save_riwayat', {record})
                                        ↓
[CoreLib.dispatchAction] → actionLevels.save_riwayat = 'user' → checkAuth
                                        ↓
[dispatchAction → localHandlers.save_riwayat] → saveRiwayat_(data, user)
                                        ↓
[apiSave → localPreSaveHook_] → P2: non-verifikator → status='menunggu'
                                        ↓
[T_RIWAYAT_KOMPETENSI] tersimpan → toast + refresh list
```

### 3. Verifikasi Sertifikat (verifikator)
```
[V_DiklatPortofolio Tab Portofolio] → klik Verif → openVerifModal(k)
                                        ↓
[Modal Verifikasi] → pilih status + catatan → Simpan
                                        ↓
[callServer('verifikasi_riwayat', {id, status_verifikasi, catatan_verifikator})]
                                        ↓
[CoreLib.dispatchAction] → actionLevels.verifikasi_riwayat = 'verifikator'
                                        ↓
[verifikasiRiwayat_] → CoreLib.requireRole(user, 'verifikator') double-check
                                        ↓
[tanggal_verifikasi = CoreLib.todayIsoLocal() (WIB)] → apiSave → tersimpan
```

### 4. Early Warning H-90 (lisensi)
```
[Admin buka Dashboard / Tab Lisensi]
        ↓
[callServer('get_kualifikasi_expiring_soon')] atau list biasa
        ↓
[getKualifikasiExpiringSoon_] → threshold dari CoreLib.getEnvProperty('alert_h_days_lisensi', appProps_())
        ↓
[Filter: expMs > nowMs && (expMs - nowMs) <= msThreshold] → expiring list
        ↓
[Filter: expMs <= nowMs] → expired list (default include_expired=false)
        ↓
[Enrich dengan pegawai] → sort asc (paling dekat kadaluwarsa)
        ↓
[Badge H-90 Alert] tampil di tabel + kartu Dashboard
```

### 5. Analisis Kesenjangan SKJ
```
[Admin buka V_AnalisaGap]
        ↓
[callServer('analytics', {tahun})]
        ↓
[getAnalytics_] →
  1. Filter riwayat by tahun (FIX-D2)
  2. Index riwayat by (pegawai_id|diklat_id) — O(1) lookup (FIX-D1)
  3. For each standar SKJ × pegawai di jabatan tsb → cek sertif
  4. Gap list + total_wajib_gap + total_disarankan_gap
  5. persen_kepatuhan = (total_evaluasi - gap) / total_evaluasi
  6. temuan + rekomendasi
        ↓
[Frontend] → KPI cards + insight + matriks JP + rincian gap
```

### 6. Rencana Diklat Tahunan (usulan bottom-up)
```
[User buka V_UsulanDiklat] → klik "Susun Rencana Baru"
        ↓
[Modal Rencana] → isi 5 section (Periode/Sasaran/Program/Anggaran/Status)
        ↓
[Simpan] → callServer('save_usulan', {record})
        ↓
[saveUsulan_] →
  - Validasi: nama program, tahun, whitelist status_rencana, pegawai exist
  - Auto: target_jp default 20/24 (PNS/PPPK)
  - Auto: tgl_pengajuan = CoreLib.todayIsoLocal() (WIB)
  - Cek duplikat (pegawai + diklat + tahun)
  - Normalisasi ID fields
        ↓
[T_USULAN_DIKLAT] tersimpan
        ↓
[Tracking Realisasi] → getUsulanList_ match dengan T_RIWAYAT_KOMPETENSI
        ↓
[is_terealisasi + realisasi_jp] tampil di tabel
```

### 7. Review Usulan (pimpinan)
```
[Admin buka V_UsulanDiklat] → klik Review (status_usulan='diajukan')
        ↓
[Modal Review] → pilih keputusan (disetujui_kasat / ditolak_kasat / revisi) + catatan
        ↓
[callServer('review_usulan', {id, status_usulan, catatan_pimpinan})]
        ↓
[reviewUsulan_] →
  - Sync status_rencana (Disetujui/Ditolak/Direncanakan/Diajukan)
  - tgl_penetapan diisi HANYA saat disetujui (WIB)
  - tgl_review = toISOString() (UTC kanonik)
  - Append history ke catatan_evaluasi
        ↓
[T_USULAN_DIKLAT] terupdate
```

### 8. Master Data (Katalog / Standar / Referensi)
```
[Admin buka V_MasterSatelit] → pilih tab
        ↓
[Filter bar per tab] → [🔄 Refresh] + [＋ Tambah]
        ↓
[Modal] → isi form → Simpan
        ↓
[callServer('save_katalog' / 'save_standar_kompetensi' / 'save_referensi')]
        ↓
[Handler 06_MasterLogic] → validasi + duplikat + enrichment + kode auto (DKL)
        ↓
[Sheet] terupdate → toast + refresh list
```

### 9. Pengaturan (Script Properties)
```
[Admin buka V_Pengaturan] → <app-settings> auto-load
        ↓
[callServer('get_config')] → getConfigList_ (default 9 + stored whitelist)
        ↓
[Admin] → edit/tambah → save_config_item → saveConfigItem_ (whitelist key)
        ↓
[Script Properties] terupdate
```

### 10. Init Database & Setup
```
[Owner] → jalankan initDatabase() di editor
        ↓
[CoreLib.initDatabase(SPREADSHEET_ID, ALL_SHEET_HEADERS, isSimpegSheet_)]
        ↓
[9 sheet lokal dibuat/di-sinkron kolom] + [Sheet1 dihapus bila kosong]
        ↓
[Owner] → jalankan setupApp()
        ↓
[CoreLib.executeAppSetup({appCode, appTitle, ..., props: appProps_()})]
        ↓
[Script Properties: APP_CODE, SPREADSHEET_ID, MASTER_SPREADSHEET_ID, PLATFORM_API_URL]
[Folder Drive: Root/Evidence/Backup] (optional)
[Seed 9 config default]
        ↓
[Owner] → jalankan runAllTestsSikompetensi() → target 42/13/16/14
```

## Catatan integrasi

- **Picker RHK/satuan/jenis tugas** di frontend memakai list aktif (cache AppCore 300s boleh).
- **Export rekap & matriks** via `AppCore.exportExcel` / `AppCore.exportPDF` / custom `_exportXlsx` (multi-sheet) — kolom didefinisikan frontend.
- **Paspor Kompetensi PDF** — `cetakPasporKompetensiPDF()` di `J_Export.html` pakai jsPDF + AutoTable (on-demand `loadLib('pdf')`).
- **Kompresi PDF client-side** di form sertifikat — `compressPdfClientSide()` pakai pdf-lib (on-demand `loadLib('pdflib')`).
- **CoreLib First**: aksi util generik (tanggal, paginasi, pencarian, whitelist, role) **wajib** pakai CoreLib. Bila butuh wrapper lokal untuk call-site yang ada, pakai pola delegasi (`return CoreLib.x(...)`) — jangan salin body. Sejak v6.0.1, wrapper delegasi sudah **dihapus** — panggil langsung.
