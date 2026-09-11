# SI-KOMPETENSI — Pemkab Trenggalek
### Sistem Informasi Pengembangan Kompetensi Pegawai (Satpol PP & Damkar Trenggalek — Opsi B 6-Sheet)

Aplikasi web modern berbasis **Google Apps Script (GAS)**, **Vue 3**, dan **Tailwind CSS** untuk pengelolaan portofolio pengembangan kompetensi pegawai, pemenuhan kewajiban minimal **20 Jam Pelajaran (JP)/Tahun** (PP No. 17/2020), manajemen kualifikasi personel **PPNS Penegak Perda** & **Fire Rescue Operator**, serta pengajuan **Usulan Diklat Bottom-Up** di lingkungan Satuan Polisi Pamong Praja & Kebakaran Pemerintah Kabupaten Trenggalek.

---

## 🏛️ Identitas Aplikasi & Arsitektur Database

| Properti | Nilai | Keterangan |
|---|---|---|
| **App Code** | `SIKOMPETENSI` | Kode identitas aplikasi |
| **Arsitektur Database** | `Opsi B (6 Sheet Spesifik Korps)` | Mengakomodasi kekhususan profesi PPNS & Damkar Wilayah Trenggalek |
| **Arsitektur Tampilan** | `2-File HTML System (Single Include)` | `Index.html` (Shell & Bootloader) + `V_Layout.html` (Seluruh Modul Tampilan) |
| **Integrasi SSO** | `SI-PLATFORM` | Tiket SSO otomatis & validasi token terpusat |
| **Frontend Framework** | `Vue 3 + Tailwind CSS` | Single Page Application (SPA) responsif |
| **Shared CDN** | `frontend-cdn@main` | Komponen Navigasi, Sidebar, Pustaka Profil & Settings |
| **Runtime** | `V8 (GAS)` | Modern JavaScript ES6+ Engine |
| **TimeZone** | `Asia/Jakarta` | WIB (Waktu Indonesia Barat) |

---

## 🗄️ Skema Database 6 Sheet (Opsi B)

```text
┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│       M_PEGAWAI         │      │      M_UNIT_KERJA       │      │        M_JABATAN        │
│ ─────────────────────── │      │ ─────────────────────── │      │ ─────────────────────── │
│ • id (PK)               │      │ • id (PK)               │      │ • id (PK)               │
│ • nip, nik              │◄────┐│ • kode_unit             │      │ • kode_jabatan          │
│ • nama_lengkap, gelar   │     ││ • nama_unit             │      │ • nama_jabatan          │
│ • pangkat_gol           │     ││ • kategori_unit         │      │ • rumpun_jabatan        │
│ • unit_id (FK) ─────────┼─────┘│ • lokasi, telepon       │      │ • jenjang_jabatan       │
│ • jabatan_id (FK)       │      │ • kepala_nip            │      │ • target_jp_tahunan     │
│ • regu_pleton           │      └─────────────────────────┘      └─────────────────────────┘
│ • is_ppns, no_sk_ppns   │
│ • kualifikasi_damkar    │
└────────────┬────────────┘
             │
             ├──────────────────────────────────────────────────────┐
             ▼                                                      ▼
┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│  T_KOMPETENSI_PEGAWAI   │      │    M_KATALOG_DIKLAT     │      │     T_USULAN_DIKLAT     │
│ ─────────────────────── │      │ ─────────────────────── │      │ ─────────────────────── │
│ • id (PK)               │      │ • id (PK)               │      │ • id (PK)               │
│ • pegawai_id (FK)       │      │ • kode_diklat           │      │ • pegawai_id (FK)       │
│ • diklat_id (FK) ───────┼─────>│ • nama_diklat           │<─────┼── • diklat_id (FK)      │
│ • nama_kegiatan         │      │ • rumpun (Manaj/Teknis) │      │ • nama_diklat_usulan    │
│ • jumlah_jp             │      │ • kategori_keahlian     │      │ • target_penyelenggara  │
│ • tgl_mulai, tgl_selesai│      │ • penyelenggara_default │      │ • alasan_usulan         │
│ • tgl_kedaluwarsa       │      │ • default_jp            │      │ • urgensi (Tinggi/Sedang│
│ • status_verifikasi     │      │ • deskripsi             │      │ • estimasi_biaya (Rp)   │
│ • catatan_verifikator   │      └─────────────────────────┘      │ • status_usulan         │
│ • file_url (Drive)      │                                       │ • catatan_pimpinan      │
└─────────────────────────┘                                       └─────────────────────────┘
```

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
    ├── 01_ConfigAndBridge.gs       # Skema 6 Sheet, konfigurasi & bridge CoreLib
    ├── 02_AppLogic.gs              # Business logic: Dashboard JP, Portofolio, Usulan, Verifikasi & Analytics
    ├── 03_SeedData.gs              # Seeder data realistis Satpol PP & Pos Damkar Wilayah Trenggalek
    ├── 99_TestSuite.gs             # Unit & integration test suite 6 Sheet
    │
    ├── Index.html                  # [HTML 1] Entry point SPA Vue 3, SSO splash & single include
    └── V_Layout.html               # [HTML 2] Seluruh Modul UI (Dashboard 20 JP, Portofolio, Usulan, Analisa & Master)
```

---

## 📋 Modul & Fitur Unggulan

1. **Dashboard & Barometer 20 JP OPD**:
   - Indikator real-time persentase pemenuhan 20 JP per ASN.
   - Grafik sebaran diklat di 7 unit/pos: Sekretariat, Bidang Gakda, Bidang Tibum, Pos Induk Kota, Pos Watulimo (Prigi), Pos Panggul, dan Bidang Linmas.
   - Rekapitulasi personel bersertifikasi **PPNS** & **Damkar/Rescue**.
2. **Portofolio & Riwayat Sertifikasi**:
   - Input berkas diklat dengan pilihan cepat dari Kamus Diklat Resmi (otomatis mengisi JP dan penyelenggara).
   - Pencatatan **masa berlaku lisensi** (peringatan kedaluwarsa untuk sertifikasi Fire Rescue / Water Rescue).
   - Filter pintar berdasarkan rumpun (Manajerial, Teknis, Fungsional, Sosio-Kultural, Bimtek) dan status verifikasi.
3. **Pengajuan Usulan Diklat (Bottom-Up)**:
   - Staf dan komandan regu dapat mengusulkan pelatihan lapangan yang dibutuhkan.
   - Alur persetujuan oleh Kepala Satuan (*Disetujui Kasat*, *Direkomendasikan ke BKPSDM*, *Ditolak*) dengan catatan penganggaran DPA.
4. **Analisis Kesenjangan & Rencana Kebutuhan Diklat**:
   - Deteksi otomatis gap kompetensi di lapangan dan rekomendasi prioritas diklat tahun anggaran berikutnya.
   - Ekspor laporan analisis resmi dalam format **PDF (.pdf)**.
5. **Ekspor Data Portofolio Excel (.xlsx)**:
   - Rekapitulasi portofolio sertifikat dan JP pegawai dalam format spreadsheet siap cetak.

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
