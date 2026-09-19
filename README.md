# SI-KOMPETENSI — Satpol PP & Damkar Trenggalek
### Sistem Informasi Manajemen Portofolio, Jadwal & Lisensi Khusus ASN (v6.0.1 — CoreLib-First + CDN v2.8.1)

Aplikasi web modern berbasis **Google Apps Script (GAS)**, **Vue 3**, **Tailwind CSS**, **Chart.js**, dan library bersama **CoreLib v2.3.0 (pin 15)** untuk pengelolaan portofolio pengembangan kompetensi pegawai, pemenuhan kewajiban minimal **20 JP (PNS)** / **24 JP (PPPK)** per tahun (PP No. 17/2020 & Perka BKN), manajemen kualifikasi personel **PPNS Penegak Perda** & **Fire Rescue Operator**, pelacakan masa berlaku sertifikasi kadaluwarsa (**Early Warning Alert H-90**), penyusunan agenda kalender diklat terpadu, serta analisis kesenjangan kompetensi jabatan (**Competency Gap Analysis / SKJ**).

---

## 🏛️ Dependensi & Identitas Ekosistem

| Komponen | Versi / ID | Peran |
|---|---|---|
| **CoreLib** (GAS library) | pin **`15`** (v2.3.0) — terkunci, **tanpa** developmentMode | Auth SSO, role guard, dispatcher, CRUD generik, cache, tanggal sadar-WIB |
| **frontend-cdn** (jsDelivr) | **`@v2.8.1`** (internal `2.8.0`) | Komponen `<app-*>`, AppCore, design tokens |
| **Vue** | `3.5.42` (pinned) | Runtime reactive UI |
| **Font Awesome** | `6.5.2` | Ikon |
| **1. SI-PLATFORM (Pusat SSO)** | `1EeJrOo6-75uf8SWCX4P5XPSMoUGXp8p1a098vKBRJys` | SSO Login, Global Settings, Central Audit Logging |
| **2. SIMPEG MASTER** | `1HvMXmvdtgAUZ9A0-SQHZp9QjnYv1A7Ku_oJIjbT8gT0` | Master ASN (`PEGAWAI`, `UNIT_KERJA`, `JABATAN`) — **Strict Read-Only** |
| **3. SI-KOMPETENSI (Lokal)** | *(Spreadsheet Database Lokal)* | 8 Sheet Satelit Murni Diklat & Lisensi + 1 sheet test |

> Dokumentasi master CoreLib & frontend-cdn: repo [`frontend-cdn`](https://github.com/miftachurrochim82-sketch/frontend-cdn)
> (`backend/00_MIGRATION_v2.md`, `ECOSYSTEM_GUIDE.md`, `frontend/CDN_SNIPPET.md`).

### Prinsip: CoreLib-First + CDN-First

Sebelum menulis fungsi baru di app, **selalu cek dulu** apakah CoreLib (backend) atau CDN (frontend) sudah punya:

- **Backend**: `normId`, `normStr`, `parseDate`, `whitelist`, `genUniqueCode`, `requireRole`, `checkRole`, `getRoleForEmail`, `isAllowedConfigKey`, `getEnvProperty`, `todayIsoLocal`, `dateKey10`, `paginate`, `matchSearch`, `dispatchAction`, `getDb`, `ensureSheet`, `initDatabase`, `executeAppSetup`.
- **Frontend**: semua komponen `<app-*>`, `AppCore.paginate`/`pageCount`/`loadLib`/`callServer`, direktif `v-can`, kelas `.btn-*`/`.btn-icon`/`.btn-lg`/`.badge-*`/`.card`/`.input`.

Kalau CDN/CoreLib sudah punya → **pakai**. Kalau belum ada **dan** dipakai di ≥2 app → kandidat promosi. Kalau belum ada **dan** hanya dipakai app ini → biarkan lokal (domain bisnis).

---

## 🗄️ Skema 8 Sheet Database Lokal SI-KOMPETENSI

```text
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE LOKAL SI-KOMPETENSI (8 SHEET SATELIT)                       │
├────────────────────────────────┬────────────────────────────────────────────────────────┤
│ 1. M_REFERENSI                 │ Master Opsi (Rumpun, Metode, Penyelenggara, Kategori)  │
├────────────────────────────────┼────────────────────────────────────────────────────────┤
│ 2. M_KATALOG_DIKLAT            │ Kamus Master Program & Jenis Pelatihan Resmi           │
├────────────────────────────────┼────────────────────────────────────────────────────────┤
│ 3. M_STANDAR_KOMPETENSI (SKJ)  │ Matriks Syarat Wajib/Pilihan Diklat per Posisi Jabatan │
├────────────────────────────────┼────────────────────────────────────────────────────────┤
│ 4. T_JADWAL_DIKLAT             │ Agenda Pelatihan Terjadwal, Kuota & Status Pendaftaran │
├────────────────────────────────┼────────────────────────────────────────────────────────┤
│ 5. T_PENUGASAN_PESERTA         │ Surat Perintah Tugas (SPT), Delegasi & Status Kelulusan│
├────────────────────────────────┼────────────────────────────────────────────────────────┤
│ 6. T_RIWAYAT_KOMPETENSI        │ Portofolio Riwayat Sertifikat & Pemenuhan 20/24 JP     │
├────────────────────────────────┼────────────────────────────────────────────────────────┤
│ 7. T_KUALIFIKASI_KHUSUS        │ Lisensi Khusus Kadaluwarsa (PPNS, Damkar I, SCBA, SAR) │
├────────────────────────────────┼────────────────────────────────────────────────────────┤
│ 8. T_USULAN_DIKLAT             │ Pengajuan Kebutuhan Diklat Bottom-Up (AKD Unit Kerja)  │
├────────────────────────────────┼────────────────────────────────────────────────────────┤
│ + ZZ_TEST_CRUD                 │ Sheet uji coba CoreLib (auto-dibersihkan, aman)        │
└────────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 📦 Struktur Berkas Proyek (`src/` — 24 berkas)

```text
si-kompetensi/
├── .clasp.json / .claspignore    # Konfigurasi clasp (rootDir: "src")
├── package.json, scripts/        # Helper deploy (set-script-id)
├── tools/                        # compile-check.js (verifikasi sintaks Vue/HTML lokal)
├── README.md
└── src/
    ├── appsscript.json           # Manifest V8 + dependensi library CoreLib (pin 15)
    │
    │── Lapisan backend (GAS) — CoreLib-First
    ├── 00_Utils.gs               # Util domain-spesifik (audit_ → SI-PLATFORM); wrapper delegasi dihapus
    ├── 01_ConfigAndBridge.gs     # Konstanta, skema 8 sheet, bridge CoreLib, preSaveHook (P1/P2), getAppConfig_()
    ├── 02_AppLogic.gs            # doGet/doPost, handleAction → CoreLib.dispatchAction, registry handler, SIMPEG lookup
    ├── 03_DashboardLogic.gs      # KPI dashboard, AI insights, ringkasan JP (v5.0.0 CoreLib-First)
    ├── 04_DiklatLogic.gs         # Katalog & jadwal diklat, penugasan peserta (v5.0.0)
    ├── 05_KualifikasiLogic.gs    # Lisensi khusus & Early Warning H-90 (v5.0.0)
    ├── 06_MasterLogic.gs         # Master referensi + initDatabase + setupApp (delegasi CoreLib)
    ├── 07_RencanaLogic.gs        # Rencana/usulan diklat bottom-up (v5.0.0)
    ├── 08_RiwayatLogic.gs        # Riwayat kompetensi & portofolio sertifikat (v5.0.0)
    ├── 99_TestSuite.gs           # v3.0.1 — library test + adopsi + routing + domain
    │
    │── Lapisan frontend (modular: shell + include satu tingkat)
    ├── Index.html                # Shell SPA: CDN v2.8.1, tema, boot dark-mode, include V_* & J_* (v6.0.1)
    ├── J_State.html              # State + computed (filter, paginasi, profil, chart data)
    ├── J_Helpers.html            # Helper domain: formatNamaPegawai, nipPegawai, namaDiklat, dll.
    ├── J_Api.html                # Loader data per modul (callServer + silent error handling)
    ├── J_Actions.html            # Handler aksi user (modal open/save/delete, profil switcher)
    ├── J_Export.html             # Export Excel/PDF + Paspor Kompetensi PDF
    ├── J_App.html                # AppCore.create + mount Vue + routing + init
    ├── V_Dashboard.html          # Dashboard KPI (6 <app-stat-card> + chart kit)
    ├── V_Profil.html             # Profil & Paspor Kompetensi ASN
    ├── V_DiklatPortofolio.html   # 3 tab: Agenda Jadwal / Portofolio / Lisensi Khusus
    ├── V_UsulanDiklat.html       # Rencana Diklat Tahunan & Tracking Realisasi
    ├── V_AnalisaGap.html         # Analisis Kesenjangan SKJ (chart + insight cards)
    ├── V_MasterSatelit.html      # 3 tab: Katalog / Standar Jabatan / Referensi
    ├── V_Modals.html             # Seluruh modal form (10 modal via <app-modal>)
    └── V_Pengaturan.html         # Wrapper <app-settings> (admin-only)
```

**Adopsi kit CDN (100%)**:
- **13 `<app-stat-card>`** + **32 `<app-badge>`** + **8 tabel `<app-crud-table>`** + **4 `<app-filter-bar>`** + **10 `<app-modal>`**
- **7 tombol aksi** pakai `.btn-icon`/`.btn-icon-danger` (kit v2.8.0/F2)
- **0 chart manual** — semua via `<app-chart-bar>` / `<app-chart-doughnut>`
- **0 empty-state custom** — semua via `<app-empty-state>`
- **0 formatter tanggal lokal** yang tak didukung kit

---

## 🛠️ Perangkat Diagnostik & Setup

| Fungsi | Lokasi | Kegunaan |
|---|---|---|
| `initDatabase()` | `06_MasterLogic.gs` | Membuat/menyelaraskan 8 sheet + ZZ_TEST_CRUD (delegasi `CoreLib.initDatabase`) |
| `setupApp()` | `06_MasterLogic.gs` | Setup properti + folder Drive + seed config (delegasi `CoreLib.executeAppSetup`) |
| `runLibraryTests()` | `99_TestSuite.gs` | Regression CoreLib — target **PASS 42 / FAIL 0 / SKIP 1** |
| `testAdopsiG18d()` | `99_TestSuite.gs` | Verifikasi adopsi util CoreLib v2.3.0 — target **13/13** |
| `testDispatcherRouting()` | `99_TestSuite.gs` | Registry handler + fail-closed — target **16/16** |
| `runDomainTestsSI()` | `99_TestSuite.gs` | Test FIX domain (L16/M16/R17/SIMPEG RO/hook) — target **14/14** |
| `runAllTestsSikompetensi()` | `99_TestSuite.gs` | Satu pintu — jalankan semua di atas |
| `testKoneksiKePortalSso()` | `99_TestSuite.gs` | Diagnostik koneksi SSO (opsional, manual) |
| `testFullSsoIntegrationFlow()` | `99_TestSuite.gs` | Alur SSO end-to-end (butuh tiket valid) |
| `tools/compile-check.js` | lokal (Node) | Verifikasi sintaks template Vue/HTML sebelum diunggah |

> Fungsi lama `auditSpreadsheetSheets()` / `cleanupObsoleteSheets()` / `runAllTests()` / `testAdapter()` (lama) **sudah tidak ada** — pengganti resmi: `runAllTestsSikompetensi()`.

### Target test akhir (per 2026-09-19)

| Runner | Target |
|---|---|
| Library (CoreLib) | **PASS 42 / FAIL 0 / SKIP 1** |
| Adopsi G18d | **13 / 0** |
| Routing | **16 / 0** |
| Domain (SI) | **14 / 0** |

SKIP 1 = `testCacheIsolation` (normal — butuh `TEST_SPREADSHEET_ID_B` di Script Properties; kosong = SKIP wajar).

---

## 📱 Panduan Eksekusi di Tablet / Mobile Browser

1. Buka proyek di [Google Apps Script Editor](https://script.google.com).
2. Perbarui berkas yang berubah di `src/` dengan cara **paste whole-file** (Ctrl+A → hapus → tempel isi file workspace), jangan find-replace manual.
3. Jalankan **`initDatabase`** sekali untuk membuat/menyelaraskan 8 sheet.
4. Jalankan **`runAllTestsSikompetensi`** → pastikan semua `🎉 SEMUA TEST HIJAU`.
5. Klik **Deploy** ➔ **Manage deployments** ➔ Edit ➔ **New version**.

### Verifikasi cepat di browser (F12 Console)

```js
AppCore.version          // "2.8.0"  (tag CDN: v2.8.1)
AppComponents.version    // "2.8.0"
AppModules.version       // "2.8.0"
Object.keys(AppCore.libs) // ['chart','xlsx','jspdf','autotable','pdflib','pdf']
```

---

## ⚠️ Catatan Pengembangan

- **Workspace Arena = sumber kebenaran**. Semua edit diverifikasi di workspace (jumlah penggantian persis + `node --check`/compile-check) sebelum disalin ke GAS & GitHub.
- **Unggah ke GitHub lewat *Add file → Upload files***, jangan paste di web editor (paste menyisipkan CF challenge script ±938 byte).
- CDN wajib memakai **tag versi** (`@v2.8.1`), bukan `@main` (cache jsDelivr 12 jam).
- CoreLib **pin 15 terkunci** (v2.3.0, produksi stabil). Untuk pengembangan library, gunakan app terpisah dengan `developmentMode: true` — jangan di produksi.
- **Tanggal "hari ini"**: WAJIB pakai `CoreLib.todayIsoLocal()` / `CoreLib.dateKey10(val)`. JANGAN `todayIso()` (UTC — mundur 1 hari untuk user WIB sebelum 07:00).

---

## 🗂️ Riwayat Migrasi (v5.3.0 → v6.0.1)

| Aspek | v5.3.0 | v6.0.1 |
|---|---|---|
| Arsitektur backend | Wrapper lokal + fallback | **CoreLib-First** — semua util delegasi, 10 wrapper tipis dihapus |
| Dispatcher | `switch/case` manual | **`CoreLib.dispatchAction`** + `actionLevels` fail-closed |
| Guard verifikasi | Cek substantif manual di handler | **`localPreSaveHook_` (P2)** — kunci terpusat |
| Soft delete | Tampil di list | **Filter `deleted_at`** otomatis di `getSheetData_` |
| CoreLib pin | `12` + devMode | **`15`** (v2.3.0, tanpa devMode) |
| CDN frontend | `@v2.6.5` | **`@v2.8.1`** |
| Vue | `3.4.21` | **`3.5.42`** |
| Splash footer | `v5.3.0` | **`v6.0.1`** |
| Test suite | Custom (4 self-check) | **Pola si-lahar** — `runLibraryTests` (42) + adopsi (13) + routing (16) + domain (14) |
| Tombol aksi tabel | `btn btn-secondary/danger` + padding manual | **`.btn-icon`/`.btn-icon-danger`** kit CDN |
| Urutan JS CDN | — | **Byte-identik si-lahar** (`components → core → modules`) |
