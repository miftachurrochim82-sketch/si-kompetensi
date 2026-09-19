# 05 — UI/UX [SI-KOMPETENSI: Portofolio, Jadwal & Lisensi Khusus ASN — 2026-09-19]

> Shell & komponen kit dipertahankan (v5.0+): `<app-login>`/`<app-sidebar>`/`<app-header>`,
> `<app-crud-table>`, `<app-filter-bar>`, `<app-badge>`, `<app-modal>`, toast, dark mode.
> Halaman bisnis = view `V_*` (pola modular si-kompetensi & si-lahar). Modal dipusatkan
> di `V_Modals.html`.
>
> **Riwayat revisi**:
> - 2026-09-13 — UIUX v5.0 initial (Gate 0, migrasi CoreLib v2.2.1).
> - 2026-09-14 — v5.4 (polish insight cards, filter grid 4 kolom, min-w tablet).
> - **2026-09-19 — v6.0.1**: CDN `@v2.8.1`; tombol aksi tabel pakai `.btn-icon`/
>   `.btn-icon-danger` kit; urutan JS CDN byte-identik si-lahar.

## Peta halaman (menu sidebar v6.0.1 final)

Menu sidebar = **7 item** (5 operasional + 2 admin).

| Grup | Menu | View | Isi utama |
|---|---|---|---|
| **Utama** | Dashboard & Standar JP | `V_Dashboard.html` | Hero banner + 6 kartu KPI (`<app-stat-card>`): Total Sertifikat, Total JP, Capaian Target JP, Lisensi Khusus, Jadwal Diklat, Usulan Diklat; alert H-90 lisensi; **klasifikasi PNS vs PPPK** (2 kartu progress); chart doughnut pemenuhan target + bar distribusi rumpun (kit `<app-chart-* bare>`); **Agenda Pelatihan** bulan ini (grid 4 kartu, tombol Klaim Sertifikat); tombol "Buka Analisa Lengkap" |
| **Utama** | Profil & Paspor ASN | `V_Profil.html` | **Paspor Kompetensi ASN**: hero identitas (avatar, NIP, pangkat/gol, unit, jabatan) + **speedometer capaian 20/24 JP** (pemilih tahun dinamis) + 3 sub-tab: Transkrip Riwayat Sertifikat (per tahun), Standar Kompetensi Jabatan (SKJ — gap per pegawai), Rencana & Usulan Diklat; tombol Upload Sertifikat + Unduh Paspor PDF (jsPDF on-demand); simulasi pegawai (admin) |
| **Utama** | Diklat & Portofolio | `V_DiklatPortofolio.html` | **3 tab segmented**: <br>**Tab 1 Agenda Jadwal Diklat** — filter (tahun/bulan/rumpun) + tabel (Klaim/Edit/Hapus) <br>**Tab 2 Portofolio Sertifikat** — filter 5 kolom (search/tahun/bulan/unit/Upload) + tabel (Verif/Edit/Hapus) <br>**Tab 3 Lisensi Khusus** — filter 4 kolom (search/tahun/jenis/Tambah) + tabel (Edit/Hapus); badge H-90 alert |
| **Utama** | Rencana Diklat Tahunan | `V_UsulanDiklat.html` | 4 KPI kartu (Total Rencana / Tingkat Realisasi / Total Target JP / Estimasi Anggaran); `<app-filter-bar>` (search/tahun/TW/status); tabel rencana (Sasaran Jabatan & Personel / Program Terencana / Alasan / Rumpun & Target JP / Periode & Anggaran / Status Realisasi); tombol Review (verifikator) / Edit / Hapus; export Rencana + Rencana vs Realisasi |
| **Utama** | Analisis Kesenjangan | `V_AnalisaGap.html` | 4 KPI (Kepatuhan SKJ / Total Gap / Gap Wajib / Personel Terdampak); 3 **insight cards terang** (Prediksi Risiko / Unit Teraktif / Tren Partisipasi); panel "Rekomendasi & Insight Pimpinan"; **Matriks JP 12 Bulan** (per pegawai × bulan); **Rincian Matriks Kesenjangan** — filter 4 kolom (search/unit/kategori/status) + tabel gap + tombol "+ Rencanakan"; export PDF landscape + Excel |
| **Master Satelit** | Kamus Master Diklat | `V_MasterSatelit.html` (admin-only) | **3 tab segmented**: <br>**Katalog Diklat** — filter (search/rumpun) + tabel + modal <br>**Standar Jabatan** — filter (search/jabatan/kebutuhan) + tabel (jabatan × diklat × level × kebutuhan × min JP) <br>**Opsi Referensi** — filter (search/kategori) + tabel; semua tab: [🔄 Refresh] + [＋ Tambah] di kolom 4 filter bar |
| **Sistem** | Pengaturan | `V_Pengaturan.html` (admin-only) | Wrapper modul kit `<app-settings>` (self-contained, auto load `get_config`); fallback `<app-empty-state>` bila non-admin (seharusnya tidak muncul karena menu adminOnly) |

> **CATATAN PENTING**:
> - Menu **Profil & Paspor ASN** = Profil Kinerja (bukan sekadar identitas); meniru Paspor ASN si-kompetensi v5.3.0 (keputusan pemilik 2026-09-18).
> - **Tab referensi SIMPEG (Pegawai/Jabatan/Unit) DIHAPUS** dari V_Master (keputusan owner) — read-only, cukup via picker & lookup.
> - **A0_Style.html DIHAPUS** — splash & theme override **inline** di `<style>` `Index.html` (khas si-kompetensi, tidak ada file CSS terpisah).

## Modal terpusat di `V_Modals.html` (10 modal via `<app-modal>`)

Migrasi v6.0 (2026-09-15): 10 modal tulisan tangan dikonversi ke komponen kit `<app-modal>` — shell, header, footer, tombol Batal/Simpan + spinner disediakan CDN. Berkas hanya memuat ISI (body) tiap modal.

1. **Upload / Edit Sertifikat Kompetensi** (size 3xl) — `<app-pegawai-picker>` + select agenda + detail sertifikat + upload PDF (kompresi `pdf-lib` client-side) + 3 section divider visual
2. **Susun Jadwal Pelatihan** (3xl) — admin
3. **Input / Edit Kualifikasi Khusus** (3xl) — 7 jenis lisensi + tanggal SK + link bukti
4. **Verifikasi Sertifikat** (2xl) — verifikator+; 3 status (disetujui/revisi/ditolak) + catatan
5. **Form Rencana Diklat Tahunan** (3xl) — 5 section divider (Periode / Sasaran / Program / Anggaran / Status) + `<app-pegawai-picker>`
6. **Review Usulan Pimpinan** (2xl) — admin; 4 status review + catatan arahan
7. **Katalog Master Diklat** (2xl) — admin; kode auto DKL-XXX
8. **Standar Kompetensi Jabatan (SKJ)** (3xl) — admin; jabatan + diklat picker + level + kebutuhan
9. **Opsi Referensi** (2xl) — admin; 9 kategori
10. **Buku Panduan Penggunaan** (4xl, `showFooter=false`) — 6 section edukasi (Dashboard / Diklat / Rencana / Analisa / Profil / PWA) + footer tombol tutup kustom

## Shell & arsitektur file

`Index.html` = **shell tipis**:
- Pin CDN `@v2.8.1` (4 aset: `app-common.min.css`, `app-components.min.js`, `app-core.min.js`, `app-modules.min.js` — urutan byte-identik si-lahar).
- Vue `3.5.42` (pinned) + Font Awesome `6.5.2` + Tailwind Play CDN.
- Identitas tema `:root` (`--primary-*` — Emerald).
- Blok `<style>` kustom **inline**:
  - Theme override (`:root`) — 7 variabel.
  - **Splash SSO** — animasi khas si-kompetensi: 4 komponen (ring spin, ring spin-reverse, logo float, gradient orb, orbit dot, shimmer bar, delay-dot); TIDAK bisa digantikan komponen kit (dibiarkan lokal).
- Boot dark-mode: kunci `sikompetensi_dark` (baca ter-guard try/catch — bug produksi v2.6.1 app-core).
- Window var SSO: `__SSO_TICKET__` + `__IS_SSO_ENTRY__` (dari template `doGet`).
- Include SATU tingkat: `V_Modals` → `V_Dashboard` → `V_Profil` → `V_DiklatPortofolio` → `V_UsulanDiklat` → `V_AnalisaGap` → `V_MasterSatelit` → `V_Pengaturan` + 6 file `J_*`.

`J_*` modul logika (6 file):
- `J_State.html` — state + computed (filter, paginasi, chart, profil, filter defs)
- `J_Helpers.html` — helper murni (formatNamaPegawai, nipPegawai, namaDiklat, getKatalogRumpun, isLicenseExpiringSoon, normStr, dll.)
- `J_Api.html` — loader data per modul (callServer + silent handling)
- `J_Actions.html` — handler aksi user (modal open/save/delete, profil switcher, PDF compression)
- `J_Export.html` — export Excel/PDF (via `AppCore.loadLib`) + Paspor Kompetensi PDF
- `J_App.html` — `AppCore.create` + mount Vue + routing (`onNavigate`) + init phase

## Aturan desain (konsisten lintas app)

- **Segmented tabs**: lebar grid 3 kolom equal, aktif solid emerald + ring emerald; `<app-badge>` count di kanan label (konsisten V_DiklatPortofolio / V_MasterSatelit). Disamakan dengan si-lahar V_Master.
- **Filter bar per tab**: grid 4 kolom @25% (Tahun/Bulan/Rumpun + [🔄 Refresh] [＋ Tambah]); grid 5 kolom @20% khusus Tab Portofolio (Search/Tahun/Bulan/Unit + [🔄 Refresh] [⬆ Upload]); kolom terakhir selalu aksi gabungan.
- **Modal**: seluruh modal via kit `<app-modal>` (size 2xl–4xl); section divider bergaris + ikon kecil untuk form panjang (>3 field set).
- **Badge**: `<app-badge size="sm|md">`; status dinamis dari state (verifikasi, kebutuhan, kualifikasi, lisensi).
- **Speedometer JP**: bar gradient (emerald kalau ≥ target, amber kalau < target) + progress + status box; tahun pemilih dinamis via computed `profileYearOptions`.
- **Kanban-like panel**: dilarang — si-kompetensi tidak ada kanban; papan gap = matriks tabel ber-paginasi.
- **Kalender**: tidak ada (keputusan: agenda jadwal cukup tabel + filter bulan).
- **Toast & confirm()** bawaan dipertahankan; **debounce search 400ms** dipertahankan.
- **Dark mode**: semua view wajib varian dark (token kit + inline style Index).
- **min-w mobile**: kolom penting `<app-crud-table>` wajib `thClass min-w-[...]` agar scroll horizontal mulus di HP (Transkrip 1000px, SKJ 1100px, Rencana 900px, Analisa 1100px, Matriks JP 900px).
- **Opsi waktu dinamis**: pemilih tahun/bulan SELALU computed (kini ±N), **tidak pernah hardcode**.

## Komponen kit yang dipakai (v2.8.1)

| Komponen | Dipakai di |
|---|---|
| `<app-login>` | `Index.html` (login SSO gateway) |
| `<app-sidebar>` / `<app-header>` | `Index.html` (shell); header punya `slot #extra-actions` (tombol Panduan) |
| `<app-stat-card>` | `V_Dashboard.html` (×6), `V_UsulanDiklat.html` (×4), `V_AnalisaGap.html` (×3) |
| `<app-chart-bar>` / `<app-chart-doughnut>` (`bare`) | `V_Dashboard.html` |
| `<app-crud-table>` | `V_DiklatPortofolio.html` (×3 tab), `V_UsulanDiklat.html`, `V_AnalisaGap.html` (×2), `V_MasterSatelit.html` (×3 tab), `V_Profil.html` (×3 sub-tab) |
| `<app-filter-bar>` | `V_AnalisaGap.html`, `V_UsulanDiklat.html` |
| `<app-empty-state>` | `V_Profil.html` (transkrip kosong), `V_Pengaturan.html` (fallback non-admin), `V_AnalisaGap.html` (gap 100% / filter kosong) |
| `<app-skeleton>` | `V_Dashboard.html`, `V_AnalisaGap.html`, `V_DiklatPortofolio.html` |
| `<app-modal>` | `V_Modals.html` (×10 modal) |
| `<app-badge>` | Semua V_* (32 pemakaian) |
| `<app-pegawai-picker>` | `V_Modals.html` (modal Sertifikat, Kualifikasi, Rencana) — 3 tempat |
| `<app-profile>` (modul kit) | `V_Profil.html` (tidak dipakai — V_Profil punya desain sendiri "Paspor") |
| `<app-settings>` (modul kit) | `V_Pengaturan.html` |

**Kelas CSS kit yang dipakai**: `.card`, `.btn*`, `.btn-icon`, `.btn-icon-danger`, `.btn-lg`, `.btn-aksi`, `.input`, `.form-label`, `.badge*`, `.toast-*`, `.modal-backdrop`, `.modal-content`, `.table-scroll`, `.animate-fade-in`, `.line-clamp-1/2` — semua dari `app-common.css` v2.8.1.

## Custom UI yang dipertahankan (diizinkan)

- **Splash SSO** khas si-kompetensi (gradient orb + ring spin + logo float) — tidak bisa digantikan komponen kit.
- **Banner salam Dashboard** — gradient emerald/slate dengan orb blur.
- **Kartu PNS vs PPPK** di Dashboard — 2 kartu progress berwarna (biru & ungu) yang tidak dipaksakan ke `<app-stat-card>` (layout khusus).
- **Agenda Pelatihan grid** di Dashboard — 4 kartu ringkas dengan tombol Klaim.
- **Matriks JP 12 Bulan** di V_AnalisaGap — tabel custom (banyak kolom, warna per sel JP).
- **Kartu antrian verifikasi** (jika nanti ditambah) — pola kaya info.
- **Kartu KPI "Kepatuhan SKJ"** di V_AnalisaGap — warna dinamis (merah/kuning/hijau) berdasarkan nilai.

## Praktik baik yang diadopsi (dari si-lahar)

| # | Adopsi | Item kode |
|---|---|---|
| 1 | Menu sidebar 7 item (ringkas, kategori Utama / Master / Sistem) | `J_App.html` menu |
| 2 | Konvensi `V_*` per halaman + `J_*` per modul | Struktur file v5.3+ |
| 3 | Modal terpusat di `V_Modals.html` | sudah (pola lama) |
| 4 | Helper murni di `J_Helpers.html` | sudah (pola lama) |
| 5 | `pageIcons` untuk ikon per halaman di header | `J_App.html` |
| 6 | **`onNavigate` guard** anti-double-load (skip jika sudah loading / data sudah ada) | `J_App.html` |
| 7 | **`initApp` silent mode** (tidak spam 7 toast saat startup gagal) | `J_App.html` |
| 8 | Filter bar per tab (bukan global) — hemat ruang, konteks jelas | `V_DiklatPortofolio`, `V_MasterSatelit` |
| 9 | Segmented tabs lebar dengan `<app-badge>` count | `V_DiklatPortofolio`, `V_MasterSatelit` |
| 10 | Insight cards **terang** (dari gelap di v5.3) — konsisten si-lahar | `V_AnalisaGap` |
| 11 | **Tombol aksi tabel 32×32** (`.btn-icon`/`.btn-icon-danger` kit) | `V_MasterSatelit` (3 tab), `V_DiklatPortofolio` (3 tab), `V_UsulanDiklat` — 7 tempat |

## Anomali data yang sudah dibersihkan

Ditemukan 2026-09-19 (hasil `runAllTestsSikompetensi()` + cleanup manual):
1. ~~Sheet `M_REFERENSI` sisa 59 baris uji~~ — bersih setelah hapus manual (target 20–30).
2. ~~Sheet `M_KATALOG_DIKLAT` 38 baris (target 20)~~ — bersih setelah hapus manual.
3. ~~Sheet `T_USULAN_DIKLAT` 21–23 baris antar-run (soft-delete record masih muncul)~~ — **FIX v6.0.1**: `getSheetData_` filter `!r.deleted_at` otomatis.
4. Soft-delete record di semua list (T_JADWAL, T_KUALIFIKASI, dst.) — **FIX v6.0.1** (sama).
5. Uji iteratif `T_JADWAL_DIKLAT` `TEST FIX M16` sisa — dibersihkan manual.

## Backlog polesan (dari review owner)

- Modal RHK — **tidak ada di si-kompetensi**; analog di si-lahar. Si-kompetensi modal SKJ (Standar Jabatan) sudah pakai select jabatan & diklat.
- Kandidat gerbong **CDN v2.8.x berikutnya**: 
  - ✅ Adopsi `span` per filter di `<app-filter-bar>` (belum dipakai di si-kompetensi).
  - ✅ Standarisasi `.btn-icon`/`.btn-icon-danger`/`.btn-lg` (sudah diadopsi 7 tempat).
- Pertimbangan promosi ke CDN: **format nama dengan gelar** (`formatNamaPegawai`) — saat ini lokal (dipakai 1 app; kandidat kalau dipakai ≥2 app).
- Pertimbangan promosi ke CDN: **helper `isLicenseExpiringSoon(tgl)`** — domain lisensi khusus (dipakai 1 app; lokal sekarang).
- Pertimbangan promosi ke CDN: **`_unitIdsInSubtree`** — filter unit hierarki (dipakai 1 app; lokal).
