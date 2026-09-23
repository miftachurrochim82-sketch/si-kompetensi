# 09 — PROFIL KOMPETENSI (Paspor & Portofolio Kompetensi ASN)

Status: **LIVE PRODUKSI** (2026-09-19). Diimplementasikan di `V_Profil.html` v5.3.0 → v6.0.1,
terverifikasi di lingkungan produksi. Rujukan konsep: **Paspor ASN** — praktik baik
pengelolaan portofolio pengembangan kompetensi ASN.

> **Pemicu**: keputusan pemilik — *"profil itu bukan hanya menampilkan identitas pegawai,
> tapi portofolio kompetensi pegawai"*. Rujukan: pengalaman si-lahar Paspor Kinerja v1.1
> + regulasi pengembangan kompetensi ASN (PP 17/2020, Perka BKN).
>
> **Riwayat**:
> - 2026-09-13 — v5.3.0: implementasi awal `V_Profil.html` + computed di `J_State.html`.
> - 2026-09-14 — v5.4 polish (perbaikan kolom "Tahun/TW", pemilih tahun dinamis, min-w mobile).
> - **2026-09-19 — v6.0.1**: migrasi ke CoreLib-First + CDN `@v2.9.1`; layout & logika
>   tetap (tidak ada perubahan perilaku); tombol aksi ke `.btn-icon` kit.

## 1. Tujuan

`V_Profil` SI-KOMPETENSI = **Paspor & Portofolio Kompetensi ASN** — potret kompetensi
pribadi pegawai: identitas SIMPEG-aware, capaian JP tahunan terhadap target
(20 PNS / 24 PPPK), transkrip riwayat sertifikat, kesenjangan standar jabatan (SKJ),
dan rencana pengembangan individual (IDP). Edit kontak tetap tersedia sebagai sub-tab.

Halaman ini **bukan sekadar halaman utilitas** (identitas + kontak). Ia adalah
**rekam jejak profesional** yang bisa dipakai untuk:
- Bukti pemenuhan kewajiban pengembangan kompetensi ASN.
- Rujukan penyusunan SKP/RHK tahunan berikutnya.
- Argumentasi usulan pelatihan di Rencana Diklat Tahunan.
- Laporan kepada pimpinan (cetak PDF).

## 2. Prinsip

- **P1** NOL backend baru — semua data dari API yang sudah hidup:
  `get_my_profile`, `get_riwayat_list`, `get_rekap_list`, `get_rhk_list`, `get_master_satelit`.
- **P2** Reuse state root (mixin `J_State` + `J_Kinerja`) — loader baru hanya menambah.
- **P3** Pola seragam dengan kit: struktur meniru Paspor Kinerja si-lahar (hero → kartu
  identitas + speedometer → sub-tab ber-count), memakai `<app-crud-table>`,
  `<app-badge>`, `<app-empty-state>`, `<app-skeleton>` + konvensi 05_UIUX
  (min-w mobile, tombol-fitur-belum-ada `disabled`+`title`).
- **P4** Gate 0: satu baris dokumen = satu item kode; implementasi = `V_Profil.html`.

## 3. Kontrak data (semua SUDAH ADA di gateway)

| Kebutuhan UI | Action | Catatan scope |
|---|---|---|
| Identitas pegawai + kontak | `get_my_profile` | actor dari session CoreLib |
| Kartu identitas SIMPEG-aware | `get_master_satelit` (`get_pegawai_list`) | resolve via `simpegLookup.pegawai` / `masterPegawaiList` |
| Speedometer capaian JP tahunan | `get_riwayat_jp_summary` (via `get_riwayat_list` filter tahun) | client-side computed dari list |
| Transkrip riwayat sertifikat | `get_riwayat_list` filter pegawai + tahun | server-scope via `only_mine` (viewer) |
| Standar Kompetensi Jabatan (SKJ) | `get_master_satelit` (standar) + `get_riwayat_list` | client-side gap analysis |
| Rencana & Usulan Diklat (IDP) | `get_usulan_list` filter pegawai | client-side filter |
| Tombol Cetak Paspor PDF | `AppCore.loadLib('pdf')` + jsPDF + AutoTable | client-side render |

> **KONSEKUENSI**: karena `get_riwayat_list` sudah auto-scope untuk viewer (role `user`
> di-filter `only_mine` di backend), paspor pegawai tanpa `pegawai_id` di session tetap
> menampilkan data yang benar (via fallback match email di computed `activePegawaiDetail`).

## 4. Struktur halaman (satu baris = satu item kode)

1. `V_Profil.html` — `<section v-if="currentPage === 'profil'">` berisi:

2. **Hero header**:
   - Ikon + judul "Paspor & Portofolio Kompetensi ASN".
   - Subtitle: *"Kartu Identitas, Kepatuhan Standar Kompetensi Jabatan (SKJ),
     Progres 20 JP Tahunan, & Transkrip Sertifikat Personal."*
   - **Pemilih Pegawai (Simulasi, admin-only)**: dropdown `sortedPegawaiList`
     → `switchProfilePegawai(pid)` (reset `activeProfileTab` ke `'transkrip'`).
   - Tombol **Upload Sertifikat** (`laporSertifikatPribadi()`).
   - Tombol **Unduh Paspor PDF** (`cetakPasporKompetensiPDF()` — disable + title
     bila method belum tersedia, konvensi 05_UIUX).

3. **Baris 1** (grid `lg:grid-cols-12`):
   - **3a. col-span-7 Kartu Identitas** (`.card`):
     - Avatar inisial + tanda centang "Terverifikasi SIMPEG".
     - Nama lengkap (`formatNamaPegawai`), badge status pegawai (PNS/PPPK),
       badge "Aktif Kedinasan".
     - Jabatan (`activePegawaiJabatan` — resolve dari `jabatanList` bila ref
       hanya bawa `*_id`).
     - Unit kerja (`activePegawaiUnit` — resolve dari `unitList`).
     - Grid 4 kolom: **NIP**, **Pangkat/Gol**, **Target Tahunan** (20/24 JP),
       **Total Sertifikat Valid** (`activePegawaiRiwayat.length`).
   - **3b. col-span-5 Speedometer Capaian JP** (gradient emerald):
     - **Pemilih tahun** (computed `profileYearOptions` — dinamis tahun ini ±2,
       **JANGAN hardcode**, pelajaran v5.3.0).
     - Angka besar: `activePegawaiTotalJpTahun` / `activePegawaiTargetJp`.
     - Persentase `activePegawaiPersenJp` di kanan.
     - Bar progress (warna dinamis: emerald kalau lulus, amber kalau belum).
     - Status box: "Memenuhi standar minimal" atau "Kurang N JP lagi".
     - **Tombol "Unduh Paspor PDF"** (via `cetakPasporKompetensiPDF()`).

4. **Baris 2: Sub-tab ber-count** (pola segmented tab kit):
   - **Tab "Transkrip Riwayat Sertifikat"** (default) — `<app-crud-table>`:
     - Kolom: No, Nama Pelatihan/Sertifikat (+badge rumpun), Lembaga Penyelenggara,
       Nomor & Tanggal Sertifikat, Jam (JP), Status Verifikasi, Berkas PDF.
     - `min-w-[1000px]` untuk scroll mobile.
     - Kosong → `<app-empty-state>` + CTA "Upload Sertifikat Sekarang".
     - Tombol "Tambah Sertifikat" di header.
   - **Tab "Standar Kompetensi Jabatan (SKJ)"** — matriks kualifikasi jabatan:
     - Header: jabatan aktif pegawai.
     - `<app-crud-table>`: No, Standar Pelatihan/Diklat, Rumpun Keahlian, Min. JP,
       Tingkat Kebutuhan (WAJIB/DISARANKAN — badge), Status Pribadi (Sudah Terpenuhi /
       Belum Memenuhi-Gap), Tindak Lanjut (tombol "+ Rencanakan" bila gap, atau link
       PDF bila sudah penuh).
     - `min-w-[1100px]`.
     - Data dari computed `activePegawaiSkjList` — gap analysis (standar jabatan ×
       riwayat pegawai, FIX-D1 O(1) lookup).
   - **Tab "Rencana & Usulan Diklat"** — IDP (Individual Development Plan):
     - `<app-crud-table>`: No, Program Pelatihan Direncanakan, Tahun/TW,
       Target Penyelenggara, Target JP, Status Rencana.
     - `min-w-[900px]`.
     - Tombol "Buat Usulan Baru" di header.

5. **Modal Cetak Paspor PDF** (`cetakPasporKompetensiPDF()` di `J_Export.html`):
   - Layout 1 halaman A4 portrait.
   - **Kop teks sederhana**: Pemerintah Kabupaten Trenggalek — Satpol PP & Damkar.
   - **Judul**: "PASPOR KOMPETENSI ASN" + tahun evaluasi.
   - **Kotak identitas**: foto placeholder 3×4 + Nama/NIP/Jabatan/Unit/Pangkat/Status.
   - **Section Capaian JP**: angka, status TUNTAS/BELUM, progress bar.
   - **Tabel Riwayat Sertifikat** (AutoTable, head hijau emerald).
   - **Tabel Lisensi/SK Khusus** (head ungu).
   - **Tabel SKJ Gap** (head biru).
   - **Footer pengesahan** (tanpa tanda tangan digital — placeholder `(........)`).
   - **Footer info**: timestamp cetak.

6. `J_State.html` — computed (sudah ada, tidak berubah sejak v5.4):
   - `activePegawaiDetail` — resolve dari `simpegLookup.pegawai` / `masterPegawaiList`.
   - `activePegawaiJabatan`, `activePegawaiUnit` — resolve dari list master.
   - `activePegawaiTargetJp` — 20 (PNS) / 24 (PPPK).
   - `activePegawaiRiwayat` — filter riwayat milik pegawai aktif.
   - `activePegawaiRiwayatTahun` — filter riwayat tahun terpilih + status disetujui
     (fix v5.4.0: exclude riwayat tanpa tanggal).
   - `activePegawaiTotalJpTahun`, `activePegawaiPersenJp`, `activePegawaiIsJpLulus`.
   - `activePegawaiSkjList` — gap analysis SKJ vs riwayat (v5.4.2: strict match by ID,
     fallback by nama hanya jika ID kosong).
   - `activePegawaiRencanaList` — usulan diklat milik pegawai aktif.
   - `profileYearOptions` — tahun ini + 1, -1, -2 (dinamis).

7. Panggil `loadPasporKompetensi()` saat navigasi ke `'profil'` (via `J_App.onNavigate`)
   — loader paralel `get_my_profile` + `get_riwayat_list` + `get_usulan_list` +
   `get_master_satelit`, limit wajar.

8. **Section "Kontak & Identitas"** — tidak ada di si-kompetensi V_Profil.
   Padanan: tombol **Upload Sertifikat** di hero. Kalau nanti butuh, tambah
   `<app-profile>` kit sebagai sub-tab ke-4 (kandidat).

## 5. Di luar scope (v1)

- **Cetak PDF multi-pegawai** (batch paspor untuk seluruh Satpol PP).
- **Ekspor paspor dalam format lain** (Excel, JSON).
- **Sertifikat tanda tangan digital** (v1 = placeholder).
- **Perbandingan paspor antar-pegawai** (analitik lintas pegawai).

## 6. Uji terima (live)

| ID | Skenario | Harapan | Status |
|---|---|---|---|
| **TC-PK1** | Viewer buka menu Profil | Identitas = dirinya; transkrip = sertifikat dirinya; speedometer = JP tahun berjalan | ✅ PASS |
| **TC-PK2** | Ganti tahun di speedometer | Angka JP berubah; transkrip/SKJ/Rencana tetap (lintas tahun kecuali Transkrip default "Semua Tahun") | ✅ PASS |
| **TC-PK3** | Pegawai tanpa data | `<app-empty-state>` kit di tiap sub-tab; tanpa error konsol | ✅ PASS |
| **TC-PK4** | Admin ganti pegawai via dropdown | Data pindah ke pegawai yang dipilih; sub-tab reset ke "Transkrip" | ✅ PASS |
| **TC-PK5** | Pegawai tanpa `pegawai_id` di session | Card kosong + banner "Akun belum tertaut"; tidak crash | ✅ PASS |
| **TC-PK6** | Layar HP | Tabel Transkrip/SKJ/Rencana scroll horizontal mulus (`min-w` kolom) | ✅ PASS |
| **TC-PK7** | Tombol "Unduh Paspor PDF" | PDF ter-download: kop + identitas + capaian + riwayat + lisensi + SKJ + footer | ✅ PASS |
| **TC-PK8** | Tombol "Upload Sertifikat" | Form modal terbuka; pegawai default = pegawai aktif (dari `activeProfilePegawaiId`) | ✅ PASS |
| **TC-PK9** | Tab SKJ — pegawai punya gap | Baris gap punya tombol "+ Rencanakan" → pre-fill form usulan | ✅ PASS |
| **TC-PK10** | Tab Rencana — pegawai punya usulan | Baris rencana tampil dengan status yang benar | ✅ PASS |

## 7. Berkas terdampak (final)

| Berkas | Peran |
|---|---|
| `V_Profil.html` | Seluruh tampilan Paspor & Portofolio Kompetensi ASN |
| `J_State.html` | Computed (state turunan) — `activePegawai*`, `profileYearOptions`, dll |
| `J_Helpers.html` | Helper murni (`formatNamaPegawai`, `nipPegawai`, `namaJabatan`, `namaUnit`, `namaDiklat`, `getKatalogRumpun`, `isLicenseExpiringSoon`) |
| `J_Export.html` | `cetakPasporKompetensiPDF()` (jsPDF + AutoTable) |
| `J_App.html` | `onNavigate('profil')` — memanggil loader paralel |
| `J_Actions.html` | `switchProfilePegawai`, `laporSertifikatPribadi`, `usulkanRencanaPribadi` |
| `J_Api.html` | Loader `loadRiwayat`, `loadUsulan`, `loadMasterSatelit` |

**Backend**: TIDAK ADA perubahan dari v5.4 → v6.0.1 (hanya delegasi CoreLib).

## 8. Komponen kit yang dipakai

| Komponen | Di mana |
|---|---|
| `<app-badge>` | Badge status pegawai, rumpun, verifikasi, tingkat kebutuhan |
| `<app-crud-table>` | Tabel Transkrip, SKJ, Rencana — masing-masing sub-tab |
| `<app-empty-state>` | Empty state Transkrip bila kosong |
| `<app-skeleton>` | Loading awal (opsional — bisa ditambah) |
| `<app-pegawai-picker>` | Tidak dipakai di sini (dropdown langsung di hero) |

**Kelas CSS kit**: `.card`, `.btn`, `.btn-primary`, `.btn-secondary`, `.input`,
`badgeVerif_` (helper internal) + konvensi `min-w-[...]` mobile.

## 9. Praktik baik yang diadopsi (dari si-lahar Paspor Kinerja)

| # | Adopsi | Item kode |
|---|---|---|
| 1 | Struktur hero → kartu identitas + speedometer → sub-tab ber-count | `V_Profil.html` |
| 2 | Sub-tab dengan count di badge | (Transkrip/SKJ/Rencana) |
| 3 | Min-w mobile untuk semua tabel (1000/1100/900px) | `<app-crud-table>` |
| 4 | Pemilih tahun **dinamis** (computed, bukan hardcode) | `profileYearOptions` |
| 5 | Reset sub-tab saat ganti pegawai | `switchProfilePegawai` |
| 6 | Empty state via `<app-empty-state>` (bukan custom) | Transkrip kosong |
| 7 | Tombol "belum tersedia" pakai `disabled` + `title` | "Unduh Paspor PDF" |
| 8 | Simulasi pegawai (admin) via dropdown langsung di hero | `activeProfilePegawaiId` |

## 10. Adendum v6.0.1 (2026-09-19)

Adopsi CoreLib-First + CDN v2.9.1 **tidak mengubah** struktur Paspor Kompetensi.
Yang berubah:

- **Wrapper delegasi tipis dihapus** — `formatNamaPegawai`, `nipPegawai`, `namaJabatan`,
  `namaUnit` tetap lokal (domain SI, tidak ada padanan CoreLib).
- **Nama pegawai**: `formatNamaPegawai` tetap dipakai (mendukung gelar `, S.H.` dll);
  fallback ke `namaPegawai` (AppCore) tetap ada.
- **Speedometer capaian JP**: filter tahun di `activePegawaiRiwayatTahun` tetap
  client-side (server-side tidak tersedia); tetap aman karena `get_riwayat_list`
  sudah auto-scope untuk viewer.
- **Tombol "Unduh Paspor PDF"**: tetap pakai `loadLib('pdf')` on-demand; tidak berubah.
- **Cetak PDF**: layout, kop, dan tabel tidak berubah — hanya internal
  `formatDateDisplay` yang tetap dipakai (via AppCore).
- **App version bump**: splash footer `v5.3.0` → `v6.0.1`.

## 11. Kandidat pengembangan fase lanjut (tercatat)

- **Simulasi pegawai untuk admin dengan backend scope** — saat ini dropdown pegawai
  hanya mengganti computed frontend; kalau pengen backend ikut scope, butuh
  parameter `pegawai_id` di `get_riwayat_list` + `get_usulan_list` untuk admin
  (sudah didukung partial: `filters.pegawai_id`). **Kandidat: dokumentasikan eksplisit
  di `06_API_FLOW.md`** sebagai "scope-switch admin".
- **Ekspor paspor Excel** — tabular data riwayat + SKJ + rencana per pegawai.
- **Tanda tangan digital** di footer paspor (butuh sertifikat instansi).
- **Timeline visual** (di samping tabel Transkrip) — garis waktu riwayat per tahun
  untuk melihat kepadatan pengembangan kompetensi.
- **Rekomendasi otomatis** — dari gap SKJ + JP tahun, usulkan 2–3 program prioritas
  berikutnya (butuh aturan bisnis di backend).
