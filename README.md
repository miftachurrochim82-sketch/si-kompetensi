# SI-KOMPETENSI — Pemkab Trenggalek
### Sistem Informasi Pengembangan Kompetensi Pegawai (v3.4.0 — Smart Analytics & SIPKA Integrated)
**Satuan Polisi Pamong Praja & Pemadam Kebakaran Pemerintah Kabupaten Trenggalek**

Aplikasi web modern berbasis **Google Apps Script (GAS)**, **Vue 3**, **Tailwind CSS**, dan **Chart.js** untuk pengelolaan portofolio pengembangan kompetensi pegawai, pemenuhan kewajiban minimal **20 JP (PNS)** / **24 JP (PPPK)** per tahun (PP No. 17/2020 & Perka BKN), manajemen kualifikasi personel **PPNS Penegak Perda** & **Fire Rescue Operator**, analisis kesenjangan kompetensi jabatan (**Competency Gap Analysis / SKJ**), jadwal agenda pelatihan terpadu, serta kecerdasan buatan (**AI Insights & Predictive Analytics**).

---

## 🌟 Fitur Utama & Pembaruan v3.4.0

1. **Diferensiasi Target Jam Pelajaran (JP)**:
   - **PNS**: Target 20 JP per tahun.
   - **PPPK**: Target 24 JP per tahun.
   - Dilengkapi kartu statistik capaian klasifikasi 2 kolom (PNS vs PPPK) dengan indikator visual dan progress bar dinamis.

2. **AI Insights & Predictive Organization Analytics**:
   - **Tren Partisipasi**: Perbandingan total jam pelajaran bulan berjalan vs bulan lalu.
   - **Unit Kerja Terbaik**: Deteksi otomatis bidang/seksi dengan rata-rata jam pelajaran tertinggi.
   - **Prediksi Risiko Akhir Tahun**: Identifikasi cerdas pegawai berisiko tidak mencapai target di sisa bulan tahun berjalan.
   - **Rekomendasi Pelatihan Prioritas**: Saran otomatis program diklat dari katalog berdasarkan profil kesenjangan unit.

3. **Matriks JP Bulanan (Januari – Desember) & Ekspor Excel**:
   - Tabel matriks real-time persebaran JP seluruh pegawai per bulan (Jan–Des).
   - Indikator status kelulusan target (Tuntas vs Dalam Proses).
   - Tombol **Ekspor Matriks Excel (.xlsx)** instan untuk kebutuhan pelaporan BKD.

4. **Agenda Pelatihan Terpadu & Alur Klaim Sertifikat Cepat**:
   - Jadwal pelatihan bulanan aktif ditampilkan di Dashboard dan tab Riwayat.
   - Tombol **"Klaim Sertifikat"** otomatis mengisi formulir riwayat (Nama Diklat, Rumpun, Penyelenggara, Metode, Tanggal, dan Default JP) tanpa perlu ketik manual.
   - Opsi mandiri untuk pelatihan di luar agenda resmi.

5. **Kompresi PDF Otomatis di Browser (`pdf-lib`)**:
   - Berkas sertifikat PDF dikompresi langsung di sisi klien sebelum pengunggahan, menghemat kuota Google Drive dan mempercepat transfer data.

6. **Tampilan Tabel Portofolio & Form Modern**:
   - Kolom Aksi dengan lebar proporsional (dua kali lipat) untuk tata letak tombol aksi yang rapi.
   - Seluruh formulir responsif, modern, dan nyaman diakses melalui perangkat tablet maupun smartphone.

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
│ 2. M_KATALOG_DIKLAT        │ Kamus Resmi Jenis Pelatihan, Default JP, Jadwal│
├────────────────────────────┼────────────────────────────────────────────────┤
│ 3. M_STANDAR_KOMPETENSI    │ Matriks Syarat Diklat per Jabatan (Kunci Gap)  │
├────────────────────────────┼────────────────────────────────────────────────┤
│ 4. T_RIWAYAT_KOMPETENSI    │ Riwayat Sertifikat, Bukti PDF Drive & Target JP│
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
    ├── 02_AppLogic.gs              # Standalone API Dispatcher, AI Insights, Target PNS/PPPK, Matriks JP & Usulan
    ├── 03_SeedData.gs              # Seeder realistis 5 sheet lokal Satpol PP & Damkar Trenggalek
    ├── 99_TestSuite.gs             # Test Suite 7 skenario, Sheet Auditor & Safe Cleaner Tools
    │
    ├── Index.html                  # [HTML 1] Shell Aplikasi SPA Vue 3, PWA, pdf-lib & SSO Transition
    └── V_Layout.html               # [HTML 2] UI Dashboard AI, Matriks Bulanan, Portofolio, Usulan, Gap, Master Satelit
```

---

## 🛠️ Perangkat Diagnostik Spreadsheet (`99_TestSuite.gs`)

1. **`auditSpreadsheetSheets()`**: Memeriksa seluruh tab sheet yang ada di spreadsheet lokal Anda.
2. **`cleanupObsoleteSheets()`**: Membersihkan sheet usang secara otomatis dan mempertahankan 5 Sheet Satelit Murni.
3. **`runAllTests()`**: Menjalankan 7 skenario pengujian otomatis untuk memastikan stabilitas ekosistem terpadu.

---

## 📱 Panduan Eksekusi di Tablet / Mobile Browser

1. Buka proyek di [Google Apps Script Editor](https://script.google.com).
2. Perbarui 4 file `.gs` dan 2 file `.html` di folder `src/`.
3. Jalankan fungsi **`initDatabase`** atau **`cleanupObsoleteSheets`** untuk merapikan sheet.
4. Jalankan fungsi **`runAllTests`** untuk memastikan seluruh tes berstatus `[PASS]`.
5. Klik **Deploy** ➔ **Manage deployments** ➔ Edit ke versi terbaru.
