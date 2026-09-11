# SI-KOMPETENSI — Pemkab Trenggalek
### Sistem Informasi Pengembangan Kompetensi ASN

Aplikasi web modern berbasis **Google Apps Script (GAS)**, **Vue 3**, dan **Tailwind CSS** untuk pengelolaan data pengembangan kompetensi pegawai, diklat teknis/fungsional, angka kredit JP, verifikasi berkas sertifikat, dan analisis kesenjangan kompetensi ASN di lingkungan Pemerintah Kabupaten Trenggalek.

---

## 🏛️ Identitas Aplikasi

| Properti | Nilai | Keterangan |
|---|---|---|
| **App Code** | `SIKOMPETENSI` | Kode identitas aplikasi |
| **Integrasi SSO** | `SI-PLATFORM` | Tiket SSO otomatis & validasi token terpusat |
| **Frontend Framework** | `Vue 3 + Tailwind CSS` | Single Page Application (SPA) responsif |
| **Shared CDN** | `frontend-cdn@main` | Komponen Navigasi, Sidebar, & UI Terpadu |
| **Runtime** | `V8 (GAS)` | Modern JavaScript ES6+ Engine |
| **TimeZone** | `Asia/Jakarta` | WIB (Waktu Indonesia Barat) |

---

## 📦 Struktur File Sumber (`src/`)

```text
si-kompetensi/
├── 🤖 .github/workflows/deploy-gas.yml  # Auto deploy ke GAS via Clasp & Actions
├── 📁 src/
│   ├── appsscript.json                 # Manifest GAS & OAuth Scopes
│   ├── 01_ConfigAndBridge.gs           # Konfigurasi konstanta, bridge CoreLib & skema sheet
│   ├── 02_AppLogic.gs                  # Backend routing, CRUD kompetensi, verifikasi & dashboard
│   ├── 03_SeedData.gs                  # Seeder data kompetensi dummy
│   ├── 99_TestSuite.gs                 # Unit & integration test suite
│   ├── A4_Dashboard.html               # Visualisasi KPI, grafik Eselon III & ringkasan JP
│   ├── A5_RiwayatLaporan.html          # Riwayat kompetensi & approval verifikator
│   ├── A6_Analisa.html                 # Analisis tren kompetensi & rekomendasi diklat
│   ├── A8_MasterData.html              # Master jenis kompetensi & referensi SIMPEG
│   └── Index.html                      # Layout SPA Vue 3 dengan SSO Handshake
├── .clasp.json                         # Clasp config
└── README.md                           # Dokumentasi teknis
```

---

## 📋 Fitur Utama

1. **Single Sign-On (SSO) Terpadu**:
   - Otomatis menukar tiket dari `SI-PLATFORM` menjadi sesi aktif pengguna.
2. **Pengelolaan Riwayat Pelatihan & Diklat**:
   - Pencatatan nama pelatihan, jenis kompetensi, jam pelajaran (JP), nomor & berkas sertifikat.
3. **Alur Verifikasi Bertingkat**:
   - Status: *Draft*, *Diajukan*, *Disetujui*, atau *Revisi* dengan catatan verifikator.
4. **Dashboard & Analisis Kesenjangan**:
   - Distribusi kompetensi per unit kerja (Eselon III), agregasi total JP, dan ekspor data CSV/PDF.

---

## 🚀 Setup & Deployment

1. Buka Apps Script Editor untuk project `SI-KOMPETENSI`.
2. Jalankan fungsi `seedData()` di `03_SeedData.gs` untuk menginisialisasi sheet data awal.
3. Jalankan `runTestSuite()` di `99_TestSuite.gs` untuk memastikan seluruh fungsi berjalan normal.
4. Deploy sebagai **Web App** (*Execute as: Me, Access: Anyone*).
5. Daftarkan URL Web App ke dalam tabel `applications` di database **SI-PLATFORM**.

---

## 📝 Lisensi
Dikelola oleh Pemerintah Kabupaten Trenggalek.  
Lisensi: MIT.
