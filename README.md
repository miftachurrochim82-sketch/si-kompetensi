# SI-KOMPETENSI — Satpol PP & Damkar Trenggalek
### Sistem Informasi Manajemen Portofolio, Jadwal & Lisensi Khusus ASN (v4.0.0 — 8-Sheet Ideal Architecture)

Aplikasi web modern berbasis **Google Apps Script (GAS)**, **Vue 3**, **Tailwind CSS**, dan **Chart.js** untuk pengelolaan portofolio pengembangan kompetensi pegawai, pemenuhan kewajiban minimal **20 JP (PNS)** / **24 JP (PPPK)** per tahun (PP No. 17/2020 & Perka BKN), manajemen kualifikasi personel **PPNS Penegak Perda** & **Fire Rescue Operator**, pelacakan masa berlaku sertifikasi kadaluwarsa (**Early Warning Alert H-90**), penyusunan agenda kalender diklat terpadu, serta analisis kesenjangan kompetensi jabatan (**Competency Gap Analysis / SKJ**).

---

## 🏛️ Identitas Ekosistem Terpadu (3 Database Sinergis)

| Komponen Sistem | ID Spreadsheet / URL | Peran & Tanggung Jawab Data |
|---|---|---|
| **1. SI-PLATFORM (Pusat SSO)** | `1EeJrOo6-75uf8SWCX4P5XPSMoUGXp8p1a098vKBRJys` | SSO Login, Global Settings, Central Audit Logging (`audit_events`) |
| **2. SIMPEG MASTER** | `1HvMXmvdtgAUZ9A0-SQHZp9QjnYv1A7Ku_oJIjbT8gT0` | Master ASN (`PEGAWAI` 101 personel, `UNIT_KERJA` 32 pos/bidang, `JABATAN` 25 posisi) — **Strict Read-Only** |
| **3. SI-KOMPETENSI (Lokal)** | *(Spreadsheet Database Lokal)* | **8 Sheet Satelit Murni Diklat & Lisensi** |

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

## 📦 Struktur Berkas Proyek (`src/`)

```text
si-kompetensi/
│
├── 📄 .clasp.json                  # Konfigurasi Clasp (rootDir: "src")
├── 📄 .claspignore                 # File yang diabaikan saat push
├── 📄 README.md                    # Dokumentasi komprehensif sistem
│
└── 📁 src/                         # BERKAS SUMBER RESMI APLIKASI
    ├── appsscript.json             # Manifest GAS & izin akses
    ├── 01_ConfigAndBridge.gs       # Konfigurasi ekosistem, 8 Sheet schema, CRUD native & cache
    ├── 02_AppLogic.gs              # Standalone API Dispatcher, 8 Module Handlers, AI Insights, Auto-Sync
    ├── 03_SeedData.gs              # Seeder realistis 8 sheet Satpol PP & Damkar Trenggalek
    ├── 99_TestSuite.gs             # Test Suite 9 skenario komprehensif & Safe Sheet Cleaner
    │
    ├── Index.html                  # Shell SPA Vue 3, PWA, pdf-lib, Clean CDN Mirrors & SSO
    └── V_Layout.html               # Seluruh View UI (Dashboard AI, Agenda, Lisensi H-90, Portofolio, AKD, SKJ)
```

---

## 🛠️ Perangkat Diagnostik Spreadsheet (`99_TestSuite.gs`)

1. **`auditSpreadsheetSheets()`**: Memeriksa seluruh tab sheet yang ada di spreadsheet lokal Anda dan memvalidasi kecocokan dengan 8 Sheet Standar.
2. **`cleanupObsoleteSheets()`**: Membersihkan sheet usang secara otomatis dan mempertahankan tepat 8 Sheet Satelit Murni.
3. **`runAllTests()`**: Menjalankan 9 skenario pengujian otomatis untuk memastikan stabilitas ekosistem terpadu.

---

## 📱 Panduan Eksekusi di Tablet / Mobile Browser

1. Buka proyek di [Google Apps Script Editor](https://script.google.com).
2. Perbarui seluruh berkas di folder `src/` (`01_ConfigAndBridge.gs`, `02_AppLogic.gs`, `03_SeedData.gs`, `99_TestSuite.gs`, `Index.html`, `V_Layout.html`).
3. Jalankan fungsi **`initDatabase`** untuk membuat dan menyelaraskan 8 sheet di spreadsheet Anda.
4. Jalankan fungsi **`runAllTests`** untuk memastikan seluruh tes berstatus `[PASS]`.
5. Klik **Deploy** ➔ **Manage deployments** ➔ Edit ke **New version**.
