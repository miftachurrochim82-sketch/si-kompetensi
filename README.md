# SI-KOMPETENSI — Satpol PP & Damkar Trenggalek
### Sistem Informasi Manajemen Portofolio, Jadwal & Lisensi Khusus ASN (v5.3.0 — Arsitektur Modular + CoreLib)

Aplikasi web modern berbasis **Google Apps Script (GAS)**, **Vue 3**, **Tailwind CSS**, **Chart.js**, dan library bersama **CoreLib v2.2.3** untuk pengelolaan portofolio pengembangan kompetensi pegawai, pemenuhan kewajiban minimal **20 JP (PNS)** / **24 JP (PPPK)** per tahun (PP No. 17/2020 & Perka BKN), manajemen kualifikasi personel **PPNS Penegak Perda** & **Fire Rescue Operator**, pelacakan masa berlaku sertifikasi kadaluwarsa (**Early Warning Alert H-90**), penyusunan agenda kalender diklat terpadu, serta analisis kesenjangan kompetensi jabatan (**Competency Gap Analysis / SKJ**).

---

## 🏛️ Dependensi & Identitas Ekosistem

| Komponen | Versi / ID | Peran |
|---|---|---|
| **CoreLib** (GAS library) | pin `12` + `developmentMode: true` (selalu kode HEAD; saat ini v2.2.3) | Auth SSO, role guard, CRUD generik, cache, setup sheet |
| **frontend-cdn** (jsDelivr) | `@v2.6.5` | Komponen `<app-*>`, AppCore, design tokens |
| **1. SI-PLATFORM (Pusat SSO)** | `1EeJrOo6-75uf8SWCX4P5XPSMoUGXp8p1a098vKBRJys` | SSO Login, Global Settings, Central Audit Logging |
| **2. SIMPEG MASTER** | `1HvMXmvdtgAUZ9A0-SQHZp9QjnYv1A7Ku_oJIjbT8gT0` | Master ASN (`PEGAWAI`, `UNIT_KERJA`, `JABATAN`) — **Strict Read-Only** |
| **3. SI-KOMPETENSI (Lokal)** | *(Spreadsheet Database Lokal)* | 8 Sheet Satelit Murni Diklat & Lisensi |

> Dokumentasi master CoreLib & frontend-cdn: repo [`frontend-cdn`](https://github.com/miftachurrochim82-sketch/frontend-cdn)
> (`backend/00_MIGRATION_v2.md`, `ECOSYSTEM_GUIDE.md`, `frontend/CDN_SNIPPET.md`).

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
└────────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 📦 Struktur Berkas Proyek (`src/` — 26 berkas)

```text
si-kompetensi/
├── .clasp.json / .claspignore    # Konfigurasi clasp (rootDir: "src")
├── package.json, scripts/        # Helper deploy (set-script-id)
├── tools/                        # compile-check.js (verifikasi sintaks Vue/HTML lokal)
├── README.md
└── src/
    ├── appsscript.json           # Manifest V8 + dependensi library CoreLib (pin 12, devMode)
    │
    │── Lapisan backend (GAS)
    ├── 01_ConfigAndBridge.gs     # Konfigurasi ekosistem (v5.0 CoreLib Integration), skema 8 sheet, bridge CoreLib
    ├── 02_AppLogic.gs            # doGet, handleAction → dispatch CoreLib, handler lintas modul
    ├── 03_DashboardLogic.gs      # KPI dashboard, AI insights, ringkasan JP
    ├── 04_DiklatLogic.gs         # Katalog & jadwal diklat, penugasan peserta
    ├── 05_KualifikasiLogic.gs    # Lisensi khusus & Early Warning H-90
    ├── 06_MasterLogic.gs         # Master referensi + initDatabase(actor) (setup 8 sheet)
    ├── 07_RencanaLogic.gs        # Rencana/uskulan diklat (AKD bottom-up)
    ├── 08_RiwayatLogic.gs        # Riwayat kompetensi & portofolio sertifikat
    ├── Utils.gs                  # Adapter lokal → CoreLib (normId_, parseDate_, role map, dll.)
    ├── 99_TestSuite.gs           # runAllTestsSikompetensi() — 49 assert (CoreLib, role, read-only, fix regresi)
    │
    │── Lapisan frontend (2-berkas-per-modul: shell + include)
    ├── Index.html                # Shell SPA: CDN v2.6.5, tema, include seluruh V_* & J_*
    ├── J_State.html              # State Vue (data reaktif)
    ├── J_Helpers.html            # Helper format tanggal/angka/label
    ├── J_Api.html                # callServer → CoreLib dispatch (aksi + token sesi)
    ├── J_Actions.html            # Actions CRUD & navigasi
    ├── J_Export.html             # Ekspor Excel/PDF via AppCore.loadLib
    ├── J_App.html                # AppCore.create + mount Vue + routing view
    ├── V_Dashboard.html          # View dashboard KPI (6 <app-stat-card>)
    ├── V_AnalisaGap.html         # View analisis kesenjangan SKJ (3 <app-stat-card>)
    ├── V_UsulanDiklat.html       # View usulan diklat (4 <app-stat-card>)
    ├── V_DiklatPortofolio.html   # View riwayat diklat & portofolio
    ├── V_MasterSatelit.html      # View master referensi satelit
    ├── V_Modals.html             # Seluruh modal form
    ├── V_Pengaturan.html         # View pengaturan sistem (<app-settings>)
    └── V_Profil.html             # View profil ASN mandiri (<app-profile>)
```

Adopsi komponen CDN: **13 `<app-stat-card>`** + **32 `<app-badge>`** (100% — tidak ada badge/kartu gaya lama tersisa).

---

## 🛠️ Perangkat Diagnostik & Setup

| Fungsi | Lokasi | Kegunaan |
|---|---|---|
| `initDatabase(actor)` | `06_MasterLogic.gs` | Membuat/menyelaraskan 8 sheet di spreadsheet lokal |
| `runAllTestsSikompetensi()` | `99_TestSuite.gs` | 49 assert: ketersediaan CoreLib, adapter Utils, role mapping, proteksi read-only SIMPEG, regresi fix L16/M16/R17 |
| `tools/compile-check.js` | lokal (Node) | Verifikasi sintaks template Vue/HTML sebelum diunggah (`node tools/compile-check.js`) |

> Fungsi lama `auditSpreadsheetSheets()` / `cleanupObsoleteSheets()` / `runAllTests()` **sudah tidak ada** — pengganti resmi: `runAllTestsSikompetensi()`.

---

## 📱 Panduan Eksekusi di Tablet / Mobile Browser

1. Buka proyek di [Google Apps Script Editor](https://script.google.com).
2. Perbarui berkas yang berubah di `src/` dengan cara **paste whole-file** (Ctrl+A → hapus → tempel isi file workspace), jangan find-replace manual.
3. Jalankan **`initDatabase`** sekali untuk membuat/menyelaraskan 8 sheet.
4. Jalankan **`runAllTestsSikompetensi`** → pastikan semua `[PASS]`.
5. Klik **Deploy** ➔ **Manage deployments** ➔ Edit ➔ **New version**.

---

## ⚠️ Catatan Pengembangan

- **Workspace Arena = sumber kebenaran**. Semua edit diverifikasi di workspace (jumlah penggantian persis + `node --check`/compile-check) sebelum disalin ke GAS & GitHub.
- **Unggah ke GitHub lewat *Add file → Upload files***, jangan paste di web editor (paste menyisipkan CF challenge script ±938 byte).
- CDN wajib memakai **tag versi** (`@v2.6.5`), bukan `@main` (cache jsDelivr 12 jam).
- CoreLib `developmentMode: true` → perbaikan library otomatis aktif tanpa mengubah repo ini.
