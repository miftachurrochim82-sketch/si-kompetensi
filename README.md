# SI-KOMPETENSI — Pemkab Trenggalek
### Sistem Informasi Pengembangan Kompetensi Pegawai (v3.2.0 — Arsitektur 5 Sheet Master Satelit)
**Satuan Polisi Pamong Praja & Pemadam Kebakaran Pemerintah Kabupaten Trenggalek**

Aplikasi web modern berbasis **Google Apps Script (GAS)**, **Vue 3**, dan **Tailwind CSS** untuk pengelolaan portofolio pengembangan kompetensi pegawai, pemenuhan kewajiban minimal **20 Jam Pelajaran (JP)/Tahun** (PP No. 17/2020), manajemen kualifikasi personel **PPNS Penegak Perda** & **Fire Rescue Operator**, analisis kesenjangan kompetensi jabatan (**Competency Gap Analysis / SKJ**), serta pengajuan **Usulan Diklat Bottom-Up (AKD)** di lingkungan Satpol PP & Pemadam Kebakaran Trenggalek.

---

## 🏛️ Identitas Ekosistem Terpadu (3 Database Sinergis)

| Komponen Sistem | ID Spreadsheet / URL | Peran & Tanggung Jawab Data |
|---|---|---|
| **1. SI-PLATFORM (Pusat SSO)** | `1EeJrOo6-75uf8SWCX4P5XPSMoUGXp8p1a098vKBRJys` | SSO Login, Global Settings, Central Audit Logging (`audit_events`) |
| **2. SIMPEG MASTER** | `1HvMXmvdtgAUZ9A0-SQHZp9QjnYv1A7Ku_oJIjbT8gT0` | Master ASN (`PEGAWAI` 101 personel, `UNIT_KERJA` 32 pos/bidang, `JABATAN` 25 posisi) — **Strict Read-Only** |
| **3. SI-KOMPETENSI (Lokal)** | *(Spreadsheet Database Lokal)* | **5 Sheet Satelit Murni Diklat** (`M_REFERENSI`, `M_KATALOG_DIKLAT`, `M_STANDAR_KOMPETENSI`, `T_RIWAYAT_KOMPETENSI`, `T_USULAN_DIKLAT`) |

---

## 🗄️ Skema 5 Sheet Database Lokal SI-KOMPETENSI

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE LOKAL SI-KOMPETENSI (5 SHEET)                   │
├────────────────────────────┬────────────────────────────────────────────────┤
│ 1. M_REFERENSI             │ Master Data Gabungan (Rumpun, Metode, Penye-   │
│                            │ lenggara, Tingkat Urgensi, Status)             │
├────────────────────────────┼────────────────────────────────────────────────┤
│ 2. M_KATALOG_DIKLAT        │ Kamus Resmi Jenis Pelatihan, Default JP & Biaya│
├────────────────────────────┼────────────────────────────────────────────────┤
│ 3. M_STANDAR_KOMPETENSI    │ Matriks Syarat Diklat per Jabatan (Kunci Gap)  │
├────────────────────────────┼────────────────────────────────────────────────┤
│ 4. T_RIWAYAT_KOMPETENSI    │ Riwayat Sertifikat, Bukti PDF Drive & 20 JP    │
├────────────────────────────┼────────────────────────────────────────────────┤
│ 5. T_USULAN_DIKLAT         │ Form Pengajuan Diklat Bottom-Up (AKD)          │
└────────────────────────────┴────────────────────────────────────────────────┘
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
    ├── 01_ConfigAndBridge.gs       # Konfigurasi ekosistem, normalisasi SIMPEG, CRUD native & cache
    ├── 02_AppLogic.gs              # Standalone API Dispatcher, Dashboard 20 JP, Portofolio & Usulan Diklat
    ├── 03_SeedData.gs              # Seeder realistis 5 sheet lokal Satpol PP & Damkar Trenggalek
    ├── 99_TestSuite.gs             # Test Suite 7 skenario, Sheet Auditor & Safe Cleaner Tools
    │
    ├── Index.html                  # [HTML 1] Shell Aplikasi SPA Vue 3 & SSO Transition Screen
    └── V_Layout.html               # [HTML 2] Seluruh Antarmuka UI (Dashboard, Portofolio, Usulan, Analisa, 3 Tab Master Satelit & Modals)
```

---

## 🛠️ Perangkat Diagnostik Spreadsheet (`99_TestSuite.gs`)

1. **`auditSpreadsheetSheets()`**:
   - Memeriksa seluruh tab sheet yang ada di spreadsheet lokal Anda.
   - Menampilkan nama sheet, jumlah baris, kolom, dan daftar header riil.
   - Mengelompokkan sheet ke dalam status: **`[AKTIF v3.0 - WAJIB]`**, **`[MIGRASI DATA DULU]`**, atau **`[DUPLIKAT USANG - AMAN DIHAPUS]`**.

2. **`cleanupObsoleteSheets()`**:
   - Menjamin keamanan data: otomatis memigrasikan riwayat sertifikat lama dari sheet `T_KOMPETENSI_PEGAWAI` atau `DATA_KOMPETENSI` ke `T_RIWAYAT_KOMPETENSI`.
   - Menghapus sheet duplikat/usang (`M_PEGAWAI`, `M_UNIT_KERJA`, `M_JABATAN`, `KONFIGURASI`, `AUDIT_LOGS`, `Sheet1`).
   - Menyisakan tepat **5 Sheet Satelit Murni** yang bersih dan berkinerja tinggi.

3. **`runAllTests()`**:
   - Menjalankan 7 skenario pengujian otomatis (Koneksi 5 Sheet, Master Satelit, SIMPEG Lookup Bridge 101 Pegawai, Dashboard 20 JP, Gap Analysis SKJ, Proteksi Read-Only, dan Dispatcher API).

---

## 📱 Panduan Eksekusi di Tablet / Mobile Browser

1. Buka proyek di [Google Apps Script Editor](https://script.google.com).
2. Perbarui 4 file `.gs` dan 2 file `.html` di folder `src/`.
3. **Pembersihan Database**: Jalankan fungsi **`cleanupObsoleteSheets`** untuk merapikan sheet menjadi 5 sheet murni.
4. **Verifikasi Sistem**: Jalankan fungsi **`runAllTests`** untuk memastikan seluruh tes berstatus `[PASS]`.
5. **Deploy**: Klik **Deploy** ➔ **Manage deployments** ➔ Edit ke versi terbaru.
