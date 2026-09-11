# SI-KOMPETENSI — Pemkab Trenggalek
### Sistem Informasi Pengembangan Kompetensi Pegawai (Satpol PP & Damkar)

Aplikasi web modern berbasis **Google Apps Script (GAS)**, **Vue 3**, dan **Tailwind CSS** untuk pengelolaan data pengembangan kompetensi pegawai, diklat teknis/fungsional, angka kredit Jam Pelajaran (JP), verifikasi berkas sertifikat, dan analisis kesenjangan kompetensi ASN di lingkungan Satuan Polisi Pamong Praja & Kebakaran Pemerintah Kabupaten Trenggalek.

---

## 🏛️ Identitas Aplikasi

| Properti | Nilai | Keterangan |
|---|---|---|
| **App Code** | `SIKOMPETENSI` | Kode identitas aplikasi |
| **Arsitektur Tampilan** | `2-File HTML System (Single Include)` | `Index.html` (Shell & Bootloader) + `V_Layout.html` (Seluruh Modul Tampilan) |
| **Integrasi SSO** | `SI-PLATFORM` | Tiket SSO otomatis & validasi token terpusat |
| **Frontend Framework** | `Vue 3 + Tailwind CSS` | Single Page Application (SPA) responsif |
| **Shared CDN** | `frontend-cdn@main` | Komponen Navigasi, Sidebar, Pustaka Profil & Settings |
| **Runtime** | `V8 (GAS)` | Modern JavaScript ES6+ Engine |
| **TimeZone** | `Asia/Jakarta` | WIB (Waktu Indonesia Barat) |

---

## 📦 Struktur Berkas Sumber (`src/`)

```text
si-kompetensi/
│
├── 🤖 .github/
│   └── workflows/
│       └── deploy-gas.yml          # Skrip CI/CD otomatis deploy ke GAS via Clasp
│
├── 📄 .clasp.json                  # Konfigurasi target Google Apps Script (rootDir: "src")
├── 📄 .claspignore                 # Daftar berkas yang diabaikan saat push
├── 📄 package.json & README.md     # Metadata proyek & dokumentasi teknis
├── 📁 scripts/
│   └── set-script-id.js            # Script helper konfigurasi Script ID
│
└── 📁 src/                         # SELURUH SUMBER KODE RESMI (BACKEND & FRONTEND)
    ├── appsscript.json             # Manifest GAS & OAuth Scopes
    ├── 01_ConfigAndBridge.gs       # Konfigurasi konstanta, bridge CoreLib & skema sheet
    ├── 02_AppLogic.gs              # Backend routing, CRUD kompetensi, verifikasi & dashboard
    ├── 03_SeedData.gs              # Seeder data kompetensi dummy Satpol PP & Damkar
    ├── 99_TestSuite.gs             # Unit & integration test suite
    │
    ├── Index.html                  # [HTML 1] Entry point SPA Vue 3, SSO splash & single include
    └── V_Layout.html               # [HTML 2] Seluruh Modul UI (Dashboard KPI, Riwayat, Analisa & Master Data)
```

---

## 📋 Fitur Utama

1. **Single Sign-On (SSO) Terpadu**:
   - Otomatis menukar tiket dari `SI-PLATFORM` menjadi sesi aktif pengguna tanpa login ulang.
2. **Dashboard Eksekutif & Visualisasi Grafik**:
   - Menampilkan total pengembangan kompetensi, distribusi jenis diklat (Manajerial, Teknis, Fungsional, Bimtek), dan grafik sebaran per divisi Eselon III.
3. **Pengelolaan Riwayat Laporan Kompetensi**:
   - Pencatatan berkas laporan pengembangan kompetensi per periode, lengkap dengan filter status dan unit kerja.
4. **Master Data Pengembangan Kompetensi**:
   - Pencatatan judul pelatihan, instansi penyelenggara, nomor sertifikat, jumlah JP, tanggal pelaksanaan, dan tautan berkas.
5. **Alur Verifikasi Bertingkat**:
   - Status: *Draft*, *Menunggu Verifikasi*, *Disetujui*, atau *Ditolak* khusus oleh verifikator/administrator.
6. **Analisis Kesenjangan & Rekomendasi Diklat**:
   - Laporan ringkasan kebutuhan pelatihan tahunan/bulanan, temuan pemenuhan standar 20 JP, dan rekomendasi otomatis.
7. **Pustaka Ekspor Dokumen**:
   - Unduh laporan hasil analisis dalam format **PDF (.pdf)** dan **Excel (.xlsx)** secara instan dari browser.

---

## 📱 Panduan Deployment di Tablet / Mobile Browser

### Opsi A: Deployment Otomatis via GitHub Actions (CI/CD)
1. Buka repositori di GitHub pada peramban tablet.
2. Masuk ke menu **Settings** ➔ **Secrets and variables** ➔ **Actions**.
3. Tambahkan 2 Secret:
   * `CLASPRC_JSON`: Isi konfigurasi autentikasi Clasp.
   * `CLASP_SCRIPT_ID`: ID Script Google Apps Script SI-KOMPETENSI Anda.
4. Setiap ada pembaruan di branch `main`, GitHub Actions akan otomatis melakukan `clasp push --force`.

### Opsi B: Salin Manual ke Editor Google Apps Script
1. Buka proyek di [Google Apps Script Editor](https://script.google.com).
2. Buat berkas-berkas sesuai dengan struktur di folder `src/`:
   * 4 Berkas Script (`.gs`): `01_ConfigAndBridge.gs`, `02_AppLogic.gs`, `03_SeedData.gs`, `99_TestSuite.gs`.
   * 2 Berkas HTML (`.html`): `Index.html` dan `V_Layout.html`.
3. Salin kode dari repositori GitHub ke editor Apps Script.
4. Klik **Deploy** ➔ **New deployment** ➔ Pilih tipe **Web app** ➔ Akses: **Anyone**.
