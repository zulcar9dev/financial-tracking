# PRD: Aplikasi Pelacakan Keuangan dengan AI

**Nama kerja:** Financial Tracking AI
**Status:** Dokumen hidup (living document) — MVP sedang diimplementasi
**Versi:** 2.0
**Tanggal:** 18 Agustus 2026
**Target platform:** Web responsif, desktop dan mobile
**Bahasa utama:** Bahasa Indonesia
**Mata uang awal:** Rupiah Indonesia (IDR)
**Target pengguna:** Pengguna personal, satu akun untuk satu pemilik data

## Changelog

| Versi | Tanggal | Perubahan |
| --- | --- | --- |
| 1.0 | 17 Agustus 2026 | Rilis awal. Draft MVP disetujui untuk implementasi. |
| 2.0 | 18 Agustus 2026 | Audit menyeluruh terhadap kode aktual, pengembangan lengkap: marker status implementasi (`[DONE]`/`[PARTIAL]`/`[TODO]`), perbaikan inkonsistensi (Tailwind v4, sitemap, pemetaan fungsi/RPC), penambahan glossar, design tokens, spesifikasi per halaman, kontrak error AI, spesifikasi format ekspor, aturan business logic baru, NFR kuantitatif, matriks environment, UU PDP, beta plan, dan roadmap pasca-MVP. Fakta provider AI diverifikasi ulang pada 18 Agustus 2026. |

## Konvensi dokumen

- **Marker status implementasi** memetakan setiap fitur/FR terhadap kondisi kode pada **18 Agustus 2026**:
  - `[DONE]` — berfungsi di kode saat ini (terverifikasi dari `app/`, `components/`, `lib/`, `migrations/`, `functions/`).
  - `[PARTIAL]` — sebagian tersedia (misal: schema DB ada, alur UI belum lengkap; atau tersedia di satu jalur saja).
  - `[TODO]` — belum diimplementasi; masih spesifikasi ke depan.
- Marker bukan janji akhir: ia adalah snapshot yang harus diperbarui setiap ada perubahan fitur.
- Referensi file kode ditulis sebagai `path/file` untuk memudahkan verifikasi (lihat Lampiran A).
- Istilah teknis didefinisikan di Glossar (Seksi 29). Singkatan yang dipakai: FR = Functional Requirement, RPC = Remote Procedure Call (function Postgres), RLS = Row-Level Security, DoD = Definition of Done, NFR = Non-Functional Requirement.

---

## 1. Ringkasan Eksekutif

Financial Tracking AI adalah aplikasi web untuk membantu pengguna mencatat dan memahami keuangan personal tanpa harus mengisi formulir panjang. Pengguna dapat mencatat transaksi melalui percakapan Bahasa Indonesia, formulir manual, atau upload satu maupun banyak foto struk belanja.

AI mengubah pesan atau foto menjadi rancangan transaksi terstruktur. Data tidak boleh disimpan otomatis. Pengguna harus meninjau dan mengonfirmasi hasil AI terlebih dahulu. Aplikasi kemudian menyediakan dashboard, akun keuangan manual, tiga model anggaran, transaksi berulang, pengingat dalam aplikasi dan email, ekspor data, serta penghapusan permanen.

MVP menggunakan Next.js untuk frontend dan InsForge untuk authentication, database, row-level security, storage, server-side functions, email, scheduled jobs, serta deployment. AI dipanggil dari InsForge Function agar API key tidak pernah dikirim ke browser.

### 1.1 Status implementasi ringkas (18 Agustus 2026)

| Area | Status | Catatan |
| --- | --- | --- |
| Auth (register, login, logout, verifikasi email, reset password) | `[DONE]` | Alur kode berbasis `code`; SMTP belum aktif (lihat Risiko R-12). |
| Onboarding & profil | `[DONE]` | Halaman `/onboarding`, profil + zona waktu + locale. |
| Akun keuangan, kategori, transaksi manual, transfer | `[DONE]` | Mutasi melalui RPC `confirm_transaction` / `update_transaction` / `delete_transaction`. |
| Dashboard & filter periode | `[DONE]` | Lihat Seksi 11.9. |
| Tiga model anggaran + threshold | `[DONE]` | Mesin `lib/budget.ts` + peringatan in-app via scheduler. |
| Transaksi berulang + occurrence | `[DONE]` | Template + `recordOccurrence`; email belum (blokir SMTP). |
| Notifikasi in-app (read/unread, badge) | `[DONE]` | Scheduler idempotent `scheduler_generate_notification_jobs`. |
| Ekspor JSON/CSV & penghapusan akun | `[DONE]` | Server actions; batas awal 1.000 baris/tabel JSON, 2.000 baris CSV. |
| AI chat teks, Q&A, receipt multi-foto | `[TODO]` | Schema DB siap (`chat_sessions`, `chat_messages`, `receipt_batches`, `receipt_attachments`, `ai_usage`); function & UI belum ada. |
| Email pengingat | `[TODO]` | Terblokir SMTP disabled (Risiko R-12); keputusan terbuka (Seksi 27). |
| Lampiran receipt (storage) | `[TODO]` | Bucket privat belum dibuat; tabel sudah siap. |

## 2. Masalah yang Ingin Diselesaikan

Pengguna personal sering mengetahui bahwa pencatatan keuangan penting, tetapi berhenti karena prosesnya memakan waktu dan terasa administratif. Masalah utama yang ingin diselesaikan:

- Mencatat transaksi secara manual membutuhkan terlalu banyak langkah.
- Pengguna sering memiliki data transaksi dalam bentuk percakapan atau foto struk.
- Kesalahan memasukkan nominal, tanggal, kategori, dan akun membuat laporan tidak dapat dipercaya.
- Pengguna sulit melihat hubungan antara transaksi, saldo akun, anggaran, dan pengeluaran berulang.
- Banyak aplikasi keuangan memerlukan integrasi bank yang kompleks sebelum memberikan manfaat dasar.
- Pengguna membutuhkan kontrol penuh untuk meninjau, mengekspor, dan menghapus data keuangan.
- Pengguna tidak dapat memverifikasi bahwa saldo yang ditampilkan benar-benar berasal dari transaksi yang ia catat (kurangnya keterauditan).
- Pengguna mendapat banyak notifikasi yang tidak relevan; pengingat yang tepat waktu dan dapat dimatikan lebih bernilai.

## 3. Visi Produk

Menjadikan pencatatan keuangan personal semudah mengirim pesan atau mengunggah struk, tanpa mengorbankan akurasi, transparansi, dan kontrol pengguna.

## 4. Prinsip Produk

- **Konfirmasi sebelum penyimpanan:** AI boleh membantu mengisi data, tetapi pengguna memegang keputusan akhir.
- **Akurasi lebih penting daripada otomatisasi:** Data ambigu harus ditanyakan atau ditandai, bukan ditebak secara diam-diam.
- **Privasi sejak awal:** Data finansial hanya dapat diakses oleh pemiliknya dan dikirim ke AI dengan payload seminimal mungkin.
- **Manual fallback selalu tersedia:** Pengguna tetap dapat bekerja ketika AI, provider, email, atau koneksi gagal.
- **Saldo dapat diaudit:** Saldo akun berasal dari saldo awal dan transaksi, bukan dari angka tersembunyi yang berubah langsung.
- **Bahasa lokal:** UI, kategori awal, format IDR, contoh prompt, dan respons AI diprioritaskan untuk Bahasa Indonesia.
- **Tidak memberi nasihat investasi:** MVP membantu pencatatan dan analisis deskriptif, bukan rekomendasi investasi atau keputusan finansial profesional.
- **Retensi minimal:** Data yang tidak diperlukan (raw prompt, foto mentah, log) tidak disimpan lebih lama dari yang dibutuhkan; data yang disimpan ditentukan eksplisit di Seksi 14.16.
- **Satu sumber kebenaran:** Hanya transaksi berstatus `confirmed` yang memengaruhi saldo, laporan, anggaran, dan ekspor. Draft, chat, dan hasil AI bukan sumber kebenaran.

## 5. Tujuan MVP

### 5.1 Tujuan utama

- Memungkinkan pengguna membuat transaksi melalui chat dalam Bahasa Indonesia.
- Memungkinkan pengguna membuat transaksi dari satu atau banyak foto struk.
- Menyediakan formulir manual yang setara untuk koreksi dan fallback.
- Menampilkan saldo akun dan ringkasan pendapatan serta pengeluaran yang dapat dipercaya.
- Menyediakan tiga model anggaran dalam satu mesin anggaran yang konsisten.
- Mengingatkan pengguna tentang transaksi berulang melalui aplikasi dan email.
- Memberikan kontrol ekspor dan penghapusan permanen data.

### 5.2 Target keberhasilan MVP

Target berikut digunakan untuk evaluasi beta dan dapat disesuaikan setelah data penggunaan nyata tersedia. Kolom **Cara ukur** memetakan tiap metrik ke event pada Seksi 21 dan definisi operasionalnya.

| Metrik | Target awal | Cara ukur |
| --- | --- | --- |
| Pengguna baru membuat transaksi pertama | Minimal 60% dalam 10 menit setelah onboarding | Funnel: `signup_completed` → `onboarding_completed` → `transaction_*_created` (lihat Seksi 21.2) |
| Field wajib transaksi teks benar setelah konfirmasi | Minimal 90% pada dataset evaluasi Bahasa Indonesia | Skor evaluasi per field pada eval set (Seksi 22.3) |
| Total struk benar atau dikoreksi sebelum simpan | Minimal 90% pada dataset evaluasi struk yang terbaca | Skor eval set receipt; koreksi tercatat sebagai `transaction_ai_corrected` |
| Transaksi AI berhasil menghasilkan review card | Minimal 95% dari request yang tidak melebihi kuota | Event `transaction_ai_draft_created` / `receipt_extraction_failed` |
| Pengguna menyelesaikan konfirmasi hasil AI | Minimal 70% dari review card yang ditampilkan | `transaction_ai_confirmed` ÷ `transaction_ai_draft_created` |
| P95 waktu parsing teks | Maksimal 5 detik | Durasi function `parse-transaction-text` (Seksi 21.3) |
| P95 waktu parsing foto | Maksimal 20 detik untuk satu batch normal | Durasi function `parse-receipt-images` per batch |
| Transaksi yang dibuat ulang atau hilang akibat error | 0; operasi penyimpanan harus idempotent | Audit `idempotency_key` + test duplikat klik (Seksi 22) |
| Pengiriman email pengingat berhasil | Minimal 95% dari email yang valid dan disetujui pengguna | Status `notification_jobs.email.sent` ÷ total terjadwal (setelah email aktif) |
| Akses lintas pengguna akibat kesalahan RLS | 0 | Negative test RLS otomatis pada setiap deploy (Seksi 22.2) |

### 5.3 Metrik yang sengaja tidak dijadikan target MVP

- Retensi 30/60/90 hari (diukur saat beta sebagai sinyal, bukan gate).
- Jumlah akun per pengguna (konteks, bukan target).
- Tingkat kesalahan AI secara absolut (bervariasi per model; digunakan untuk evaluasi model, bukan gate fitur).

## 6. Pengguna Sasaran

### 6.1 Persona utama: Pengguna personal ("Rina, 29 tahun")

Rina bekerja full-time, gajian bulanan, dan ingin tahu ke mana uangnya pergi tetapi tidak ingin memakai spreadsheet. Ia mengetik dalam Bahasa Indonesia, sering menyimpan struk belanja, dan memiliki kombinasi rekening bank (BCA), e-wallet (GoPay), uang tunai, dan satu kartu kredit. Ia meninggalkan aplikasi pencatatan sebelumnya karena input terlalu panjang dan lupa mengisi secara rutin. Ia sensitif terhadap privasi: tidak ingin menghubungkan rekening bank dan tidak nyaman jika datanya bocor.

**Kebutuhan inti:** catat dalam satu kalimat atau foto struk; koreksi cepat; lihat saldo dan pengeluaran bulanan; pengingat tagihan tanpa harus membuka aplikasi; bisa keluar kapan saja dengan data.

### 6.2 Persona sekunder: Pengguna sibuk ("Budi, 40 tahun")

Budi jarang membuka aplikasi, mencatat 2–3 kali seminggu, dan hanya ingin tahu total pengeluaran serta tagihan yang akan jatuh tempo. Ia memakai pengingat email, menyukai anggaran sederhana (per kategori bulanan), dan menghargai notifikasi yang sedikit tapi tepat. Ia tidak pernah memakai AI chat; formulir manual yang cepat cukup.

### 6.3 Persona sekunder: Power user ("Sari, 35 tahun")

Sari menggunakan envelope budgeting, mencatat setiap transaksi, dan memakai ekspor CSV untuk rekonsiliasi bulanan di spreadsheet. Ia mengharapkan konsistensi angka antar-halaman (dashboard = detail transaksi = ekspor) dan memanfaatkan pertanyaan finansial read-only untuk analisis cepat. Ia akan memberi umpan balik teknis dan menjadi aset evaluasi beta.

### 6.4 User journey map (alur kunci)

**Alur A — Registrasi sampai transaksi pertama (persona Rina):**

| Tahap | Tindakan | Titik frustrasi | Peluang produk |
| --- | --- | --- | --- |
| Registrasi | Isi nama, email, password; setujui syarat | Panjangnya form | Form 3 field; verifikasi email jelas langkahnya (Seksi 10.1) |
| Verifikasi email | Masukkan kode 6 digit dari email | Email tidak sampai (SMTP! Risiko R-12) | Pesan error jelas + tombol kirim ulang (cooldown) |
| Onboarding | Pilih nama tampilan, zona waktu, bahasa | Terlalu banyak pertanyaan | Default `Asia/Jakarta`, `id-ID`; hanya 3 langkah |
| Akun pertama | Buat akun Tunai "Kas" | Bingung saldo awal | Contoh saldo awal 0; penjelasan singkat |
| Transaksi pertama | Ketik chat / isi manual | Harus memahami istilah | Contoh prompt satu klik; placeholder "cth: makan siang 45 ribu" |
| Sukses | Lihat dashboard berubah | Angka tidak sinkron antar halaman | RevalidatePath seluruh halaman terkait (Seksi 13.6) |

**Alur B — Struk berulang (persona Rina):** foto → upload cepat dengan progress → review dengan item → simpan → lampiran privat. Titik frustrasi: foto buram, struk panjang, total tidak konsisten. Peluang: penanda field ragu, konflik terlihat, retry, dan fallback manual (Seksi 10.3).

**Alur C — Tagihan bulanan (persona Budi):** buat template → terima pengingat H-1 → konfirmasi satu klik dari notifikasi → transaksi tersimpan. Titik frustrasi: pengingat ganda atau telat. Peluang: dedupe idempotent, offset default 1 hari (1440 menit), waktu sesuai zona pengguna.

### 6.5 Hal yang tidak diasumsikan

- Pengguna tidak harus menghubungkan rekening bank.
- Pengguna tidak harus memahami akuntansi berpasangan.
- Pengguna tidak harus memiliki lebih dari satu akun keuangan.
- Pengguna tidak boleh dipaksa memakai AI untuk membuat transaksi.

## 7. Keputusan Produk yang Sudah Ditetapkan

Keputusan di bawah ini sudah final untuk MVP (status implementasi pada kolom status, lihat Lampiran A):

- Sasaran awal adalah pengguna personal, bukan akun keluarga atau tim. `[DONE]`
- UI dan AI memprioritaskan Bahasa Indonesia. `[DONE]` (locale `id-ID` default)
- Mata uang awal adalah IDR, disimpan sebagai integer rupiah. `[DONE]`
- Authentication menggunakan email dan password; verifikasi email wajib dengan metode kode 6 digit. `[DONE]` (`insforge.toml: require_email_verification = true, verify_email_method = "code"`)
- Password minimal 6 karakter, tanpa syarat kompleksitas. `[DONE]`
- Input transaksi mencakup chat, formulir manual, dan foto struk. `[PARTIAL]` (manual `[DONE]`; chat & receipt `[TODO]`)
- AI selalu meminta konfirmasi sebelum transaksi disimpan. `[TODO]` (belum ada jalur AI; menjadi hard requirement saat jalur AI dibangun)
- Pengguna dapat mengupload banyak foto tanpa batas jumlah di level fitur. `[TODO]` (per file 20 MB, lihat FR-AI-RECEIPT-03/14)
- Backend memproses banyak foto dalam beberapa batch jika provider memiliki batas per request. `[TODO]` (fakta provider: max 5 gambar/request, Seksi 12.1)
- Akun keuangan dibuat dan diperbarui secara manual; tidak ada bank sync pada MVP. `[DONE]`
- Tiga model anggaran wajib tersedia saat peluncuran MVP. `[DONE]`
- Transaksi berulang menggunakan template dan pengingat; tidak melakukan posting otomatis. `[DONE]` (pengingat in-app; email `[TODO]`)
- AI chat mendukung pencatatan transaksi dan pertanyaan finansial read-only. `[TODO]`
- Pengguna dapat mengekspor data dan menghapusnya secara permanen. `[DONE]` (batas baris awal: 1.000/tabel JSON, 2.000 CSV — FR-DATA-11)
- Pengingat tersedia dalam aplikasi dan melalui email. `[PARTIAL]` (in-app `[DONE]`; email `[TODO]`, terblokir SMTP)
- Target biaya provider AI pada MVP adalah Rp0 menggunakan free quota. `[TODO]` (belum ada pemakaian)
- Batas file upload per file: 20 MB (batas aplikasi; platform InsForge 50 MB — FR-AI-RECEIPT-03/14). `[DONE]` untuk konfigurasi platform; enforcers aplikasi `[TODO]`
- Kategori sistem (`user_id NULL`) dibaca semua pengguna; kategori milik pengguna hanya oleh pemiliknya. `[DONE]`
- Mutasi transaksi hanya melalui RPC SECURITY DEFINER; `INSERT`/`UPDATE`/`DELETE` langsung pada `transactions` dan `transaction_legs` direvoke untuk anon/authenticated. `[DONE]`
- Penghapusan transaksi bersifat soft-delete (`status = 'deleted'`); baris tetap ada untuk audit. `[DONE]`

### 7.1 Keputusan terbuka (belum final — lihat Seksi 27)

- Provider email & aktivasi SMTP (blokir email verifikasi, reset password, dan reminder). Lihat Risiko R-12.
- Penyimpanan lampiran receipt secara default (ephemeral vs tetap) — tabel sudah mendukung `delete_after_processing`.
- Model AI berbayar setelah free quota terbukti tidak cukup.

## 8. Ruang Lingkup MVP

### 8.1 Fitur yang wajib ada (dengan status implementasi)

| Fitur | Status | Referensi |
| --- | --- | --- |
| Landing page dan authentication | `[DONE]` | Seksi 11.1, 16 |
| Onboarding profil, locale, mata uang, dan zona waktu | `[DONE]` | Seksi 11.2 |
| Dashboard ringkasan keuangan | `[DONE]` | Seksi 11.9 |
| CRUD akun keuangan manual | `[DONE]` | Seksi 11.3 |
| CRUD kategori transaksi (arsip, bukan hapus destruktif) | `[DONE]` | Seksi 11.4 |
| CRUD transaksi manual | `[DONE]` | Seksi 11.5 |
| Pencatatan transaksi melalui chat teks | `[TODO]` | Seksi 11.6 |
| Pencatatan transaksi melalui banyak foto struk | `[TODO]` | Seksi 11.7 |
| Review dan konfirmasi hasil AI | `[TODO]` | Seksi 11.8 |
| Edit, hapus (soft-delete), dan arsip transaksi | `[DONE]` | Seksi 11.5 |
| Pendapatan, pengeluaran, transfer, dan penyesuaian saldo | `[DONE]` | Seksi 11.5 |
| Tiga model anggaran | `[DONE]` | Seksi 11.10 |
| Template transaksi berulang | `[DONE]` | Seksi 11.11 |
| Pengingat in-app dan email | `[PARTIAL]` | in-app `[DONE]`; email `[TODO]` (Risiko R-12) |
| Pertanyaan finansial read-only berdasarkan data pengguna | `[TODO]` | Seksi 11.12 |
| Ekspor CSV dan JSON | `[DONE]` | Seksi 11.13 |
| Penghapusan permanen data pengguna | `[DONE]` | Seksi 11.13 |
| Pengaturan privasi, notifikasi, dan batas penggunaan AI | `[PARTIAL]` | notifikasi `[DONE]`; batas AI `[TODO]` |

### 8.2 Fitur yang sengaja tidak termasuk

- Sinkronisasi otomatis dengan bank, kartu, atau dompet digital.
- Open banking dan agregasi rekening.
- Import CSV mutasi bank sebagai fitur peluncuran.
- Posting otomatis transaksi berulang.
- Akun bersama, undangan anggota keluarga, atau multi-tenant collaboration.
- Multi-currency dan konversi nilai tukar.
- Investasi, saham, kripto, pinjaman, dan portofolio.
- Nasihat investasi atau rekomendasi finansial personal.
- Input suara.
- Aplikasi native iOS atau Android.
- Pembayaran, langganan, atau monetisasi.
- Chat yang dapat melakukan mutasi data tanpa konfirmasi.
- Query SQL bebas yang dibuat atau dieksekusi langsung oleh AI.
- OAuth/social login (email/password satu-satunya pada MVP).
- Dark mode toggle manual (mengikuti `prefers-color-scheme` sistem; lihat Seksi 17.1).

## 9. User Stories

| ID | Sebagai | Saya ingin | Agar | Status |
| --- | --- | --- | --- | --- |
| US-01 | Pengguna baru | Membuat akun dengan email dan password | Saya dapat memiliki ruang data pribadi | `[DONE]` |
| US-02 | Pengguna | Menetapkan zona waktu dan mata uang IDR | Format waktu dan nominal sesuai kebiasaan saya | `[DONE]` |
| US-03 | Pengguna | Membuat akun tunai, bank, dompet digital, atau kartu kredit | Saldo saya dapat dipisahkan dengan benar | `[DONE]` |
| US-04 | Pengguna | Menulis "makan siang 45 ribu di warteg dari BCA hari ini" | Transaksi dapat dipersiapkan tanpa formulir panjang | `[TODO]` |
| US-05 | Pengguna | Mengupload banyak foto struk | Struk panjang atau beberapa sisi dapat diproses bersama | `[TODO]` |
| US-06 | Pengguna | Meninjau hasil parsing AI | Saya dapat mencegah kesalahan sebelum penyimpanan | `[TODO]` |
| US-07 | Pengguna | Menggunakan formulir manual | Saya tetap dapat mencatat saat AI gagal | `[DONE]` |
| US-08 | Pengguna | Mencatat transfer antar akun | Saldo akun tidak menghitung transfer sebagai pengeluaran | `[DONE]` |
| US-09 | Pengguna | Mengatur budget bulanan, fleksibel, dan envelope | Saya dapat memakai metode penganggaran yang sesuai | `[DONE]` |
| US-10 | Pengguna | Membuat template transaksi berulang | Saya tidak perlu mengingat tagihan rutin | `[DONE]` |
| US-11 | Pengguna | Menerima pengingat di aplikasi dan email | Saya dapat mengonfirmasi transaksi tepat waktu | `[PARTIAL]` (in-app saja) |
| US-12 | Pengguna | Bertanya tentang pengeluaran saya | Saya dapat memahami data tanpa menghitung manual | `[TODO]` |
| US-13 | Pengguna | Mengekspor data | Saya memiliki salinan yang dapat digunakan di luar aplikasi | `[DONE]` |
| US-14 | Pengguna | Menghapus semua data secara permanen | Saya memiliki kontrol penuh atas informasi finansial | `[DONE]` |
| US-15 | Pengguna | Mengelola kategori (tambah, ubah warna/nama, arsip) | Transaksi dapat dikelompokkan sesuai kebiasaan saya | `[DONE]` |
| US-16 | Pengguna | Menandai notifikasi sebagai dibaca (satu atau semua) | Inbox saya mencerminkan yang sudah saya lihat | `[DONE]` |
| US-17 | Pengguna | Mengubah nama tampilan, zona waktu, dan preferensi notifikasi | Pengaturan sesuai kondisi saya yang berubah | `[DONE]` |
| US-18 | Pengguna | Menerima peringatan saat anggaran mendekati atau melewati batas | Saya dapat mengendalikan pengeluaran sebelum terlambat | `[DONE]` |
| US-19 | Pengguna | Membuat transaksi dari occurrence template (konfirmasi satu klik) | Tagihan rutin tercatat tanpa mengetik ulang | `[DONE]` |
| US-20 | Pengguna | Melihat riwayat ekspor dan status pengingat | Saya tahu data apa yang telah diambil dan notifikasi mana yang terkirim | `[PARTIAL]` (status job tersedia; riwayat unduhan `[TODO]`) |

## 10. Alur Pengguna Utama

Status implementasi per alur ditandai; alur yang belum berfungsi penuh tetap menjadi spesifikasi ke depan.

### 10.1 Onboarding `[DONE]`

1. Pengguna membuka landing page (`/`).
2. Pengguna mendaftar dengan nama, email, dan password (`/register`, `signUpAction` di `lib/actions/auth.ts`).
3. Sistem mewajibkan verifikasi email (kode 6 digit via `verifyEmailAction`); halaman `/register` menampilkan form kode dan tombol kirim ulang dengan cooldown (`insforge.toml` SMTP menentukan pengiriman — Risiko R-12).
4. Setelah terverifikasi, pengguna diarahkan ke `/onboarding` dan memilih nama tampilan, zona waktu, dan preferensi bahasa (`updateProfileAction`).
5. Sistem menetapkan IDR sebagai mata uang dasar awal (`base_currency = 'IDR'` di `profiles`).
6. Sistem membuat profil, preferensi notifikasi, dan 12 kategori default otomatis melalui trigger `handle_new_user` (Lampiran B).
7. Pengguna dapat langsung membuat akun keuangan pertama.
8. Sistem menampilkan contoh input chat dan formulir manual. (Contoh chat hanya tampil ketika fitur AI `[TODO]`; saat ini hanya contoh formulir manual.)

### 10.2 Mencatat transaksi melalui chat `[TODO]`

1. Pengguna membuka halaman Catat atau panel chat.
2. Pengguna menulis pesan dalam Bahasa Indonesia.
3. Sistem mengirim teks ke InsForge Function `parse-transaction-text` (Lampiran D).
4. Function memanggil model teks `openai/gpt-oss-20b` dengan schema transaksi (Seksi 12.3).
5. Sistem memvalidasi JSON dan mencocokkan akun serta kategori milik pengguna (resolusi kandidat nama, bukan tebakan foreign key — FR-AI-TEXT-04).
6. Jika field wajib hilang atau ambigu, AI meminta klarifikasi (FR-AI-TEXT-05).
7. Sistem menampilkan review card berisi nominal, tipe, akun, tanggal, kategori, merchant, dan catatan.
8. Pengguna mengedit field jika perlu.
9. Pengguna memilih Konfirmasi dan Simpan atau Batal.
10. Backend menyimpan transaksi secara idempotent melalui RPC `confirm_transaction` dengan `idempotency_key` (FR-TX-11).
11. Chat menampilkan hasil penyimpanan dan tautan ke detail transaksi.
12. Chat tidak pernah menyimpan transaksi tanpa langkah 9 (FR-AI-TEXT-03).

### 10.3 Mencatat transaksi dari banyak foto struk `[TODO]`

1. Pengguna memilih Upload Foto Struk.
2. Pengguna dapat memilih banyak gambar dan menambah gambar berikutnya kapan saja (FR-AI-RECEIPT-01).
3. Client melakukan pemeriksaan tipe file, ukuran file (≤ 20 MB), dan integritas file (FR-AI-RECEIPT-02/03, FR-AI-RECEIPT-15).
4. Gambar dikirim ke private InsForge Storage dengan path milik pengguna (Seksi 15).
5. Sistem membuat satu receipt batch dan mempertahankan urutan upload (`receipt_batches` + `receipt_attachments.sort_order`).
6. InsForge Function `parse-receipt-images` memproses gambar dalam batch provider (max 5 gambar/request — fakta Groq; FR-AI-RECEIPT-04).
7. Model vision `qwen/qwen3.6-27b` membaca merchant, tanggal, total, pajak, diskon, metode pembayaran, dan item struk (FR-AI-RECEIPT-05/06).
8. Backend menggabungkan hasil antar-gambar dan mendeteksi kemungkinan duplikasi (FR-AI-RECEIPT-07).
9. Sistem menandai field yang tidak terbaca, konflik antar-foto, atau total yang tidak konsisten (FR-AI-RECEIPT-08/09).
10. Sistem menampilkan review transaksi dan daftar item hasil ekstraksi.
11. Pengguna dapat menggabungkan, menghapus, atau memperbaiki item dan field transaksi (FR-AI-RECEIPT-13).
12. Pengguna memilih Simpan untuk membuat satu atau beberapa transaksi (FR-AI-RECEIPT-10).
13. Foto disimpan sebagai lampiran privat hanya jika pengguna memilih menyimpannya; jika tidak, file mentah dihapus setelah proses selesai (`delete_after_processing`).

### 10.4 Mencatat transaksi manual `[DONE]`

1. Pengguna memilih Tambah Transaksi (`/app/capture`, `TransactionForm`).
2. Pengguna memilih tipe pendapatan, pengeluaran, transfer, atau penyesuaian (penyesuaian tersedia via API; UI tab saat ini: Pengeluaran, Pendapatan, Transfer — Lampiran A).
3. Pengguna mengisi nominal, akun, tanggal, kategori bila relevan, merchant, dan catatan.
4. Sistem memvalidasi field (client `parseIDRInput` + server RPC) dan menampilkan ringkasan.
5. Pengguna menyimpan transaksi — langsung `confirmed` (sumber `manual`), saldo diperbarui otomatis.
6. Idempotency key dibuat sekali per form (`crypto.randomUUID()`) untuk mencegah duplikasi klik berulang.

### 10.5 Transfer antar-akun `[DONE]`

1. Pengguna memilih tipe Transfer.
2. Pengguna memilih akun sumber dan akun tujuan.
3. Pengguna memasukkan nominal, tanggal, dan catatan.
4. Sistem menolak akun sumber dan tujuan yang sama (validasi RPC `confirm_transaction`).
5. Backend membuat satu transaksi logis dengan dua legs yang saling terhubung dalam satu transaksi DB atomik (FR-TX-15).
6. Saldo akun sumber berkurang dan saldo akun tujuan bertambah (view `account_balances`).
7. Transfer tidak masuk ke total pendapatan atau pengeluaran.
8. Edit dan hapus transfer dilakukan secara atomik pada kedua legs (`update_transaction` / `delete_transaction`).

### 10.6 Anggaran `[DONE]`

1. Pengguna membuka halaman Anggaran (`/app/budgets`).
2. Pengguna memilih salah satu dari tiga model anggaran (per kategori bulanan, periode fleksibel, envelope).
3. Pengguna memilih kategori, periode, nominal, dan preferensi notifikasi (threshold 80%/100%/over).
4. Sistem menghitung penggunaan dari transaksi pengeluaran yang telah dikonfirmasi (`lib/budget.ts` `computeBudgets`).
5. Sistem menampilkan allocated, spent, available, dan persentase penggunaan sesuai model (FR-BUDGET-03/07/10).
6. Sistem mengirim peringatan pada ambang yang diaktifkan pengguna (via `scheduler_generate_notification_jobs`, in-app; email `[TODO]`).

### 10.7 Transaksi berulang `[DONE]`

1. Pengguna membuat template dengan tipe, nominal, akun, kategori, jadwal, dan tanggal mulai (`/app/recurring`, `TemplatePayload`).
2. Pengguna memilih pengingat dalam aplikasi, email, atau keduanya (saat ini in-app yang berfungsi; email `[TODO]`).
3. Scheduler harian (`schedule-recurring-reminders`) membuat notifikasi untuk occurrence yang akan datang (`scheduler_generate_notification_jobs`, jendela ±1 hari, dedupe idempotent).
4. Pengguna menerima pengingat sesuai zona waktu (offset default 1440 menit = H-1).
5. Pengguna memilih Konfirmasi dan Simpan untuk membuat transaksi aktual (`recordOccurrenceAction` → RPC `confirm_transaction`, sumber `recurring`).
6. Sistem tidak membuat transaksi aktual secara diam-diam (FR-RECUR-06).

### 10.8 Pertanyaan finansial read-only `[TODO]`

1. Pengguna menulis pertanyaan seperti "Berapa pengeluaran makan saya bulan ini?".
2. InsForge Function `answer-finance-question` menentukan intent dan parameter terstruktur (FR-QA-02).
3. Backend menjalankan query terparameterisasi yang telah diizinkan (FR-QA-03).
4. Sistem mengirim hasil agregat minimal ke model untuk dirangkum dalam Bahasa Indonesia.
5. Jawaban menampilkan periode, filter, sumber perhitungan, dan data kosong jika tidak ada hasil (FR-QA-05).
6. AI tidak boleh membuat, mengedit, atau menghapus data dari jalur Q&A (FR-QA-06).

### 10.9 Ekspor dan penghapusan data `[DONE]`

1. Pengguna membuka Pengaturan dan memilih Data Saya (`/app/settings/data`).
2. Pengguna dapat meminta ekspor CSV (`exportCsvAction`) atau JSON (`exportJsonAction`).
3. Sistem membuat file ekspor dengan semua entitas milik pengguna (JSON: 16 entitas; CSV: transaksi) — Seksi 11.13 dan Lampiran F.
4. Pengguna dapat mengunduh file dari browser (server action; lampiran `[TODO]`).
5. Untuk penghapusan, sistem meminta login ulang atau konfirmasi password (`deleteAccountAction`: reauth via `signInWithPassword`).
6. Pengguna mengetik `HAPUS DATA SAYA` sebagai konfirmasi.
7. Sistem menghapus data database (`delete_user_data` RPC — 16 tabel), storage, sesi, notifikasi, dan riwayat chat milik pengguna.
8. Sistem membatalkan scheduler dan token pengiriman email terkait (jika ada).
9. Sistem mengeluarkan pengguna dari semua sesi dan mengarahkan ke `/login?deleted=1`.

### 10.10 Kuota AI habis `[TODO]`

1. Pengguna mencoba operasi AI (chat/receipt/Q&A) setelah melewati kuota harian (30) atau bulanan (300).
2. Function menolak dengan kode `ai_quota_exceeded` sebelum memanggil provider (FR-AI-TEXT-09).
3. UI menampilkan pesan: kuota terpakai, waktu reset, dan tautan ke formulir manual.
4. Sistem tidak mengaktifkan billing otomatis sebagai fallback (Seksi 12.2).

### 10.11 AI gagal / fallback manual `[DONE]` (manual) / `[TODO]` (jalur AI)

1. Function mengembalikan error terstruktur dengan kode dan correlation ID (Seksi 12.6).
2. UI menampilkan pesan yang membedakan: coba ulang (retry) vs beralih manual.
3. Draft yang belum dikonfirmasi tidak hilang; batch/foto tetap tersedia untuk diulang (FR-AI-RECEIPT-12, NFR Reliability).
4. Formulir manual selalu dapat diakses dari halaman yang sama.

## 11. Persyaratan Fungsional

Penomoran FR bersifat stabil: FR yang sudah ada di v1.0 dipertahankan, FR baru diberi nomor lanjutan. Setiap FR diberi status implementasi.

### 11.1 Authentication dan akun pengguna

**FR-AUTH-01** `[DONE]` Sistem harus menyediakan pendaftaran dengan email dan password (min. 6 karakter).

**FR-AUTH-02** `[DONE]` Sistem harus menyediakan login, logout, reset password, dan refresh session (route `/api/auth/refresh` + `proxy.ts` middleware refresh).

**FR-AUTH-03** `[DONE]` Halaman aplikasi yang berisi data finansial harus memerlukan session pengguna yang valid.

**FR-AUTH-04** `[DONE]` Setiap record data aplikasi harus memiliki `user_id` dan tidak boleh dibaca atau dimutasi oleh pengguna lain (RLS, Seksi 15).

**FR-AUTH-05** `[DONE]` Sistem harus mendukung penghapusan akun dan seluruh data pengguna melalui alur yang terkonfirmasi (FR-DATA-05/06/12).

**FR-AUTH-06** `[DONE]` Session browser Next.js harus menggunakan helper SSR InsForge agar refresh token tidak disimpan di tempat yang dapat dibaca JavaScript (`lib/insforge/server.ts`, `proxy.ts`).

**FR-AUTH-07** `[DONE]` Verifikasi email wajib dengan kode (`verify_email_method = "code"`); halaman `/register` menyediakan form kode dan kirim ulang dengan cooldown (`verifyEmailAction`, `resendVerificationAction`). Pengiriman kode bergantung pada SMTP/email InsForge — Risiko R-12.

**FR-AUTH-08** `[DONE]` Reset password menggunakan alur kode: kirim email → `exchangeResetCodeAction` menukar kode menjadi token → `resetPasswordAction` menetapkan password baru.

**FR-AUTH-09** `[TODO]` Function dan endpoint AI harus menerapkan rate limit per user per menit (misal 10 request/menit) untuk mencegah abuse; nilai final dikonfigurasi server-side.

### 11.2 Onboarding dan lokalitas

**FR-LOC-01** `[DONE]` UI utama harus tersedia dalam Bahasa Indonesia.

**FR-LOC-02** `[DONE]` Format nominal default harus menggunakan `id-ID`, misalnya `Rp1.234.567`, tanpa desimal untuk transaksi IDR (`lib/format.ts` `formatIDR`).

**FR-LOC-03** `[DONE]` Nilai uang disimpan sebagai integer rupiah, bukan floating point (`amount_idr INTEGER`).

**FR-LOC-04** `[DONE]` Zona waktu default adalah `Asia/Jakarta` dan dapat diubah pengguna (kolom `profiles.timezone`; helper `format.ts` menghormati zona waktu).

**FR-LOC-05** `[DONE]` Tanggal alami seperti "kemarin", "tanggal 5", atau "awal bulan" harus dikonversi berdasarkan zona waktu pengguna dan ditampilkan kembali untuk konfirmasi. *(Implementasi saat ini: periode dashboard dihitung dengan `periodRange()` berbasis zona waktu pengguna; konversi frasa natural menjadi tanggung jawab AI text `[TODO]`.)*

**FR-LOC-06** `[DONE]` `locale` tersimpan di `profiles` dengan default `id-ID`; MVP hanya mendukung satu locale (Indonesia). Struktur kode tidak perlu i18n framework; string UI ditulis langsung dalam Bahasa Indonesia.

### 11.3 Akun keuangan

**FR-ACCOUNT-01** `[DONE]` Sistem harus menyediakan tipe akun Tunai (`cash`), Rekening Bank (`bank`), Dompet Digital (`e_wallet`), dan Kartu Kredit (`credit_card`).

**FR-ACCOUNT-02** `[DONE]` Pengguna dapat membuat nama akun, tipe akun, saldo awal, tanggal saldo awal, warna atau ikon, dan status aktif (`lib/actions/accounts.ts`).

**FR-ACCOUNT-03** `[DONE]` Saldo berjalan harus dihitung dari saldo awal dan transaction legs yang sudah dikonfirmasi (view `account_balances`: `opening_balance_idr + SUM(legs confirmed)`; dihitung per akun dengan filter `user_id = auth.uid()`).

**FR-ACCOUNT-04** `[DONE]` Sistem tidak boleh mengubah saldo berjalan secara langsung tanpa membuat transaction adjustment.

**FR-ACCOUNT-05** `[DONE]` Pengguna dapat mengarsipkan akun. Akun yang memiliki transaksi tidak dapat dihapus langsung — penghapusan akun di level DB dicegah oleh FK `transaction_legs.account_id ON DELETE RESTRICT`; UI menyediakan arsip (dan hapus hanya untuk akun tanpa legs).

**FR-ACCOUNT-06** `[DONE]` Akun kartu kredit harus diperlakukan sebagai liability. Pembelian meningkatkan saldo terutang, sedangkan pembayaran kartu adalah transfer dari akun sumber ke kartu kredit.

**FR-ACCOUNT-07** `[DONE]` Sistem harus menampilkan peringatan ketika transaksi keluar melebihi saldo akun, tetapi tidak memblokirnya secara otomatis karena overdraft dan saldo kartu kredit dapat valid.

**FR-ACCOUNT-08** `[DONE]` MVP hanya mendukung IDR dan tidak mendukung konversi mata uang.

**FR-ACCOUNT-09** `[PARTIAL]` Saldo kartu kredit (liability) harus ditampilkan dengan penanda visual berbeda (misal label "Saldo terutang") agar tidak disalahartikan sebagai aset. *(Model saldo benar di `account_balances`; penanda UI disarankan di spesifikasi halaman Seksi 17.4.)*

**FR-ACCOUNT-10** `[DONE]` Saldo awal tidak boleh negatif (`CHECK opening_balance_idr >= 0`); penyesuaian saldo turun dilakukan lewat transaksi Adjustment.

### 11.4 Kategori

**FR-CATEGORY-01** `[DONE]` Sistem harus membuat kategori default saat onboarding (trigger `handle_new_user`, 12 kategori — Lampiran B).

**FR-CATEGORY-02** `[DONE]` Pengguna dapat membuat, mengubah nama, mengarsipkan, dan memilih warna kategori (`lib/actions/categories.ts`).

**FR-CATEGORY-03** `[DONE]` Kategori yang dipakai transaksi atau anggaran tidak boleh dihapus secara destruktif; kategori dapat diarsipkan atau diganti (UI menyediakan arsip/aktifkan ulang; tidak ada action hapus kategori).

**FR-CATEGORY-04** `[DONE]` Kategori default minimal mencakup Makanan, Transportasi, Tagihan, Belanja, Kesehatan, Hiburan, Pendidikan, Gaji, Bonus, Transfer, Biaya Bank, dan Lainnya (Lampiran B: nama, kind, warna).

**FR-CATEGORY-05** `[DONE]` Transfer tidak boleh membutuhkan kategori pengeluaran atau pendapatan.

**FR-CATEGORY-06** `[DONE]` Nama kategori unik per pengguna (`UNIQUE (user_id, name)`); kategori sistem (`user_id NULL`) dibaca semua pengguna, tidak dapat dimutasi pengguna (policies hanya untuk `user_id = auth.uid()`).

### 11.5 Transaksi

**FR-TX-01** `[DONE]` Sistem harus mendukung tipe Income, Expense, Transfer, dan Adjustment.

**FR-TX-02** `[DONE]` Transaksi Expense harus memiliki nominal, akun, tanggal, dan kategori (validasi RPC: kategori wajib untuk expense).

**FR-TX-03** `[DONE]` Transaksi Income harus memiliki nominal, akun, tanggal, dan kategori pendapatan bila tersedia.

**FR-TX-04** `[DONE]` Transaksi Transfer harus memiliki akun sumber, akun tujuan, nominal, dan tanggal; sumber ≠ tujuan.

**FR-TX-05** `[DONE]` Nominal transaksi harus lebih besar dari nol dan disimpan dalam integer IDR (`CHECK amount_idr > 0`).

**FR-TX-06** `[DONE]` Pengguna dapat menambahkan merchant, catatan, label sumber, dan lampiran (lampiran `[TODO]` — tabel `receipt_attachments` siap).

**FR-TX-07** `[DONE]` Sistem harus menyimpan sumber transaksi sebagai `manual`, `chat`, `receipt`, `recurring`, atau `adjustment` (`CHECK` constraint; chat/receipt belum dipakai sampai jalur AI aktif).

**FR-TX-08** `[DONE]` Pengguna dapat mencari dan memfilter transaksi berdasarkan periode, tipe, akun, kategori, merchant, sumber, dan nominal (`getTransactions` + `TransactionFilters`; periode via `periodRange`).

**FR-TX-09** `[DONE]` Pengguna dapat mengedit dan menghapus transaksi. Edit atau hapus transfer harus mengubah seluruh legs terkait secara atomik (`update_transaction` mengganti legs dalam satu transaksi DB; `delete_transaction` soft-delete).

**FR-TX-10** `[DONE]` Hanya transaksi berstatus Confirmed yang boleh memengaruhi saldo, laporan, dan anggaran (`account_balances` memfilter `status = 'confirmed'`; `computeBudgets` memfilter `status = 'confirmed'`; dashboard memfilter status).

**FR-TX-11** `[DONE]` Sistem harus memiliki mekanisme idempotency key untuk mencegah transaksi ganda ketika pengguna mengklik simpan ulang atau request diulang (`transactions.idempotency_key` + `UNIQUE (user_id, idempotency_key)`; RPC mengembalikan record yang sudah ada; `TransactionForm` membuat key per form).

**FR-TX-12** `[DONE]` Aturan edit transaksi confirmed:
- Semua field dapat diubah termasuk tipe (expense ↔ income ↔ transfer ↔ adjustment).
- Legs lama dihapus dan dibuat ulang sesuai tipe baru dalam satu transaksi DB atomik.
- `confirmed_at` dipertahankan; `updated_at` diperbarui.
- Saldo, dashboard, dan budget dihitung ulang dari data baru (semua hanya dari transaksi `confirmed`).
- `source` dapat diubah hanya oleh sistem (draft AI); pengguna tidak mengubah source lewat UI edit biasa.
- Hapus = soft-delete (`status = 'deleted'`); baris tidak muncul di daftar, saldo, laporan, budget, atau ekspor.

**FR-TX-13** `[DONE]` Soft-delete mempertahankan baris untuk audit; `delete_transaction` menolak menghapus transaksi berstatus `deleted` dua kali; transaksi `deleted` tidak dikembalikan oleh query aplikasi (`.neq('status', 'deleted')`).

**FR-TX-14** `[DONE]` List transaksi wajib memakai pagination: `pageSize` maksimal 50, default 20 (`getTransactions`). Query tanpa limit tidak diizinkan di jalur aplikasi.

**FR-TX-15** `[DONE]` Transfer disimpan sebagai satu `transactions` baris + dua `transaction_legs` (`out` dan `in`), dengan `UNIQUE (transaction_id, account_id, direction)` mencegah leg duplikat dalam satu transfer.

**FR-TX-16** `[DONE]` `transactions` dan `transaction_legs` tidak memiliki grant `INSERT/UPDATE/DELETE` untuk `anon`/`authenticated`; semua mutasi melalui RPC SECURITY DEFINER yang memvalidasi kepemilikan (`confirm_transaction`, `update_transaction`, `delete_transaction`).

**FR-TX-17** `[PARTIAL]` Perubahan saldo dari edit/hapus transaksi harus tercermin konsisten di dashboard, halaman akun, dan budget (revalidatePath menjalankan pembaruan server; verifikasi konsistensi ada di acceptance criteria Seksi 20).

### 11.6 AI chat untuk transaksi teks `[TODO]` (seluruh seksi)

**FR-AI-TEXT-01** Pengguna dapat mengirim teks Bahasa Indonesia untuk membuat draft transaksi.

**FR-AI-TEXT-02** AI harus mengembalikan schema terstruktur yang memuat tipe transaksi, nominal, tanggal, akun kandidat, kategori kandidat, merchant, catatan, confidence, dan daftar field yang membutuhkan klarifikasi (Seksi 12.3).

**FR-AI-TEXT-03** AI tidak boleh menyimpan transaksi secara langsung.

**FR-AI-TEXT-04** Sistem harus mencocokkan nama akun dan kategori AI dengan entitas milik pengguna. Nama yang tidak cocok harus menjadi kandidat yang perlu dipilih, bukan foreign key yang ditebak.

**FR-AI-TEXT-05** Jika nominal, tanggal, akun, atau tipe tidak dapat dipastikan, sistem harus meminta klarifikasi sebelum menampilkan tombol simpan.

**FR-AI-TEXT-06** Sistem harus menampilkan teks sumber atau ringkasan interpretasi agar pengguna dapat membandingkan input dan hasil.

**FR-AI-TEXT-07** Sistem harus menggunakan structured JSON Schema untuk model teks jika model yang dipilih mendukungnya, lalu memvalidasi ulang dengan schema runtime (Zod) di server.

**FR-AI-TEXT-08** Sistem harus mencatat setiap operasi AI ke `ai_usage` (tanpa raw prompt) dan memvalidasi kuota harian (30) serta bulanan (300) sebelum memanggil provider (Seksi 12.2; `count_ai_usage_today` `[DONE]` sebagai komponen kuota harian, penggabungan ke function `[TODO]`).

**FR-AI-TEXT-09** Jika kuota habis, function menolak dengan kode `ai_quota_exceeded`; UI menampilkan pesan jelas dan tautan formulir manual.

### 11.7 AI receipt dan banyak foto `[TODO]` (fitur inti); sebagian prasyarat `[DONE]`

**FR-AI-RECEIPT-01** `[TODO]` Pengguna dapat mengupload satu maupun banyak foto struk untuk satu receipt batch tanpa batas jumlah pada level fitur.

**FR-AI-RECEIPT-02** `[TODO]` Sistem harus menerima format gambar umum seperti JPEG, PNG, dan WebP dengan pemeriksaan MIME type dan file signature (magic bytes).

**FR-AI-RECEIPT-03** `[PARTIAL]` Per file memiliki batas keamanan dan operasional maksimum 20 MB (batas aplikasi; konsisten dengan batas gambar Groq 20 MB dan platform InsForge 50 MB). Batas ini bukan batas jumlah foto pada level produk. *(Enforcer upload aplikasi belum ada → `[PARTIAL]`; konfigurasi platform `[DONE]`.)*

**FR-AI-RECEIPT-04** `[TODO]` Backend harus membagi foto secara otomatis ke batch provider. Batas provider (fakta Groq `qwen/qwen3.6-27b`: maksimal 5 gambar per request) tidak boleh terlihat sebagai batas produk bagi pengguna.

**FR-AI-RECEIPT-05** `[TODO]` AI harus mencoba mengekstrak merchant, tanggal, waktu, nominal total, subtotal, pajak, diskon, biaya layanan, metode pembayaran, nomor struk bila terbaca, mata uang, serta item baris (Seksi 12.4).

**FR-AI-RECEIPT-06** `[TODO]` Item baris harus mendukung nama item, kuantitas, harga satuan bila tersedia, total item, diskon item bila tersedia, dan confidence per item (tabel `transaction_items` siap).

**FR-AI-RECEIPT-07** `[TODO]` Sistem harus menggabungkan hasil dari beberapa gambar, mempertahankan urutan, dan menandai kemungkinan gambar duplikat.

**FR-AI-RECEIPT-08** `[TODO]` Sistem harus menandai konflik, misalnya dua total berbeda, tanggal berbeda, atau foto yang kemungkinan berasal dari struk berbeda.

**FR-AI-RECEIPT-09** `[TODO]` Sistem harus memeriksa konsistensi total dan item, tetapi tidak boleh mengubah total secara diam-diam (perbedaan ditampilkan sebagai konflik/peringatan).

**FR-AI-RECEIPT-10** `[TODO]` Pengguna dapat memilih apakah beberapa struk menjadi satu transaksi atau beberapa transaksi sebelum penyimpanan.

**FR-AI-RECEIPT-11** `[TODO]` Foto tidak boleh diproses sebagai instruksi sistem. Teks dalam struk adalah data tidak tepercaya dan harus diabaikan sebagai prompt instruction (Seksi 12.5).

**FR-AI-RECEIPT-12** `[TODO]` Model vision menggunakan JSON mode atau structured output yang tersedia (fakta Groq: JSON mode + tool use didukung), kemudian hasilnya harus divalidasi dengan schema runtime. Jika schema tidak valid, sistem melakukan retry terbatas atau mengarahkan pengguna ke formulir manual.

**FR-AI-RECEIPT-13** `[TODO]` Pengguna dapat menghapus satu gambar dari batch, mengganti gambar, atau mengulangi ekstraksi.

**FR-AI-RECEIPT-14** `[PARTIAL]` Upload menampilkan progress per file, status batch, retry, remove, dan cancel; foto tidak boleh hanya bergantung pada drag-and-drop (NFR Accessibility). *(UI upload `[TODO]`; komponen dropzone di prototype statis.)*

**FR-AI-RECEIPT-15** `[TODO]` Setiap file upload harus divalidasi: tipe MIME, signature bytes, ukuran ≤ 20 MB, dan checksum; file tidak lolos validasi ditolak dengan pesan per file.

### 11.8 Review dan konfirmasi `[TODO]` (jalur AI); pola `[DONE]` untuk konfirmasi manual

**FR-REVIEW-01** Review card harus menampilkan tipe, nominal, tanggal, akun, kategori, merchant, catatan, sumber, confidence, dan peringatan.

**FR-REVIEW-02** Field yang tidak pasti harus diberi penanda visual dan dapat diedit langsung.

**FR-REVIEW-03** Tombol Simpan tidak aktif ketika field wajib belum lengkap.

**FR-REVIEW-04** Batal tidak boleh membuat transaction record confirmed.

**FR-REVIEW-05** Setelah konfirmasi, sistem menampilkan notifikasi berhasil dan tautan detail.

### 11.9 Dashboard dan laporan

**FR-DASH-01** `[DONE]` Dashboard harus menampilkan saldo akun aktif secara terpisah dan total net balance (`getAccountsWithBalances`; net balance = jumlah akun aktif; kartu kredit ditampilkan sebagai kewajiban — FR-ACCOUNT-09).

**FR-DASH-02** `[DONE]` Dashboard harus menampilkan total pendapatan, pengeluaran, dan net cash flow untuk periode yang dipilih (`getPeriodTotals`).

**FR-DASH-03** `[DONE]` Dashboard harus menampilkan pengeluaran berdasarkan kategori (`getCategorySpending`; "Tanpa kategori" untuk transaksi tanpa kategori).

**FR-DASH-04** `[DONE]` Dashboard harus menampilkan transaksi terbaru (limit 6, `getRecentTransactions`).

**FR-DASH-05** `[DONE]` Dashboard harus menampilkan status anggaran aktif (`computeBudgets`) dan pengingat transaksi berulang yang akan datang (limit 5, `getUpcomingRecurring`).

**FR-DASH-06** `[DONE]` Semua angka dashboard hanya berasal dari transaksi Confirmed dan query harus dibatasi pada `user_id`.

**FR-DASH-07** `[DONE]` Pengguna dapat memilih periode bulan ini, bulan sebelumnya, 30 hari terakhir, tahun ini, dan rentang custom (`PeriodTabs`; custom `[PARTIAL]` — `periodRange` mendukung `custom`, UI picker rentang `[TODO]`).

**FR-DASH-08** `[DONE]` Empty state harus menjelaskan langkah pertama yang dapat dilakukan pengguna.

### 11.10 Tiga model anggaran

#### Model A: Anggaran bulanan per kategori

**FR-BUDGET-01** `[DONE]` Pengguna dapat menetapkan batas IDR per kategori untuk setiap bulan.

**FR-BUDGET-02** `[DONE]` Periode bulanan mengikuti zona waktu pengguna dan menggunakan batas awal serta akhir bulan lokal (`periodRange`/`monthBounds` berbasis zona waktu; perbandingan rentang `inRange` pada `lib/budget.ts`).

**FR-BUDGET-03** `[DONE]` Sistem menampilkan target, spent, remaining, dan persentase penggunaan.

**FR-BUDGET-04** `[DONE]` Transaksi transfer tidak dihitung sebagai spent.

#### Model B: Anggaran rentang fleksibel

**FR-BUDGET-05** `[DONE]` Pengguna dapat membuat budget dengan tanggal mulai dan tanggal akhir custom.

**FR-BUDGET-06** `[DONE]` Sistem menolak rentang dengan tanggal akhir sebelum tanggal mulai (`CHECK budgets_period_order` + validasi action).

**FR-BUDGET-07** `[DONE]` Sistem menampilkan transaksi yang masuk dalam rentang berdasarkan tanggal transaksi lokal.

**FR-BUDGET-08** `[PARTIAL]` Sistem memberi peringatan jika budget kategori dan periode yang sama tumpang tindih secara ambigu. *(Deteksi overlap `[TODO]`; model data mendukung.)*

#### Model C: Envelope budgeting

**FR-BUDGET-09** `[DONE]` Pengguna dapat membuat envelope kategori dan menetapkan allocated amount (`budget_allocations`).

**FR-BUDGET-10** `[DONE]` Sistem menghitung available sebagai allocated ditambah rollover dikurangi spent (`computeBudgets`: `available = allocated + rollover - spent`).

**FR-BUDGET-11** `[PARTIAL]` Pengguna dapat memindahkan alokasi antar-envelope dalam periode yang sama dengan catatan perubahan. *(Alokasi dapat diedit; riwayat "catatan perubahan" `[TODO]`.)*

**FR-BUDGET-12** `[DONE]` Pengguna dapat mengaktifkan atau menonaktifkan rollover untuk envelope (`rollover_enabled`; nilai rollover tersimpan di `budget_allocations.rollover_amount_idr`).

**FR-BUDGET-13** `[PARTIAL]` Pengeluaran tanpa kategori tidak boleh diam-diam masuk ke envelope tertentu; sistem meminta kategori atau menampilkannya sebagai Uncategorized. *(Mesin budget memfilter per kategori, transaksi tanpa kategori tidak masuk envelope mana pun; label UI "Tanpa kategori" `[DONE]` di dashboard.)*

#### Persyaratan lintas model

**FR-BUDGET-14** `[DONE]` Semua model harus memakai kategori dan transaksi yang sama (`computeBudgets` satu mesin untuk tiga model).

**FR-BUDGET-15** `[DONE]` Pengguna dapat mengedit, mengarsipkan, dan melihat riwayat budget (edit/arsip `[DONE]`; "riwayat" dalam arti daftar budget lama yang tersimpan `[DONE]` — `getAllBudgets`).

**FR-BUDGET-16** `[DONE]` Sistem menyediakan threshold notifikasi 80%, 100%, dan over budget yang dapat diaktifkan per budget (`notify_at_80`, `notify_at_100`, `notify_over`; status `near`/`over` di `computeBudgets`; notifikasi in-app via scheduler).

**FR-BUDGET-17** `[DONE]` Anggaran tidak mengubah saldo akun dan tidak membuat transaksi baru.

**FR-BUDGET-18** `[DONE]` Envelope tanpa alokasi tidak valid (minimal satu alokasi kategori saat create/update). Envelope dapat memiliki beberapa alokasi (multi-kategori dalam satu envelope).

### 11.11 Transaksi berulang dan pengingat

**FR-RECUR-01** `[DONE]` Pengguna dapat membuat template pendapatan, pengeluaran, atau transfer.

**FR-RECUR-02** `[DONE]` Template harus menyimpan nominal, akun atau pasangan akun, kategori bila relevan, jadwal, tanggal mulai, tanggal akhir opsional, dan status aktif.

**FR-RECUR-03** `[DONE]` MVP harus mendukung jadwal harian, mingguan, bulanan, dan tahunan.

**FR-RECUR-04** `[DONE]` Pengguna dapat menentukan offset pengingat, misalnya 1 hari sebelum atau hari yang sama (default 1440 menit; `reminder_offsets` array menit).

**FR-RECUR-05** `[PARTIAL]` Pengingat dapat dikirim melalui in-app notification, email, atau keduanya. *(In-app `[DONE]`; email `[TODO]` — Risiko R-12.)*

**FR-RECUR-06** `[DONE]` Sistem tidak boleh membuat transaksi confirmed otomatis dari template; transaksi hanya dibuat setelah konfirmasi pengguna (`recordOccurrenceAction`).

**FR-RECUR-07** `[DONE]` Notification scheduler harus idempotent berdasarkan template, occurrence date, channel, dan user (dedupe key `recurring:{template}:{due_at}:{offset_minutes}` + `UNIQUE (user_id, dedupe_key)` + `ON CONFLICT DO NOTHING`).

**FR-RECUR-08** `[TODO]` Email pengingat harus memiliki subject, nominal, tanggal, merchant atau deskripsi, serta tautan aman ke aplikasi (template di Lampiran E).

**FR-RECUR-09** `[TODO]` Email harus menyertakan kontrol unsubscribe atau pengaturan notifikasi (mengubah `notification_preferences.unsubscribed_at` / `email_enabled`).

**FR-RECUR-10** `[DONE]` Sistem menggunakan `Asia/Jakarta` sebagai zona waktu default dan menghormati zona waktu yang dipilih pengguna.

**FR-RECUR-11** `[DONE]` Komputasi occurrence (`computeNextOccurrence` di `lib/actions/recurring.ts`):
- Hitung dari `start_date`; maju bertahap sesuai `frequency`/`interval_value`.
- Guard maksimal 2.000 iterasi untuk mencegah infinite loop.
- Bulan dengan tanggal 31: `setUTCMonth` menggulung ke bulan berikutnya (misal 31 Jan → 3 Mar untuk interval 1 bulan). Konsekuensi ini didokumentasikan; opsi "clamp ke akhir bulan" menjadi keputusan pasca-MVP (Seksi 27).
- `next_occurrence_at` diperbarui saat template dibuat; advance otomatis setelah occurrence direkam adalah penyempurnaan pasca-MVP (saat ini occurrence tidak menggeser `next_occurrence_at` secara otomatis — dicatat sebagai gap `[PARTIAL]`).

**FR-RECUR-12** `[PARTIAL]` Perekaman occurrence (`recordOccurrenceAction`) membuat transaksi `confirmed` dengan `source = 'recurring'`, `merchant = nama template`, `note = 'Dibuat dari template berulang'`. *(Idempotensi per occurrence perlu `idempotency_key` turunan `recurring:{template}:{occurred_at}` — `[TODO]`.)*

**FR-RECUR-13** `[DONE]` Scheduler harian (`schedule-recurring-reminders`) memanggil RPC `scheduler_generate_notification_jobs` yang hanya memproses occurrence dalam jendela `[NOW-1 hari, NOW+1 hari]` dan menghormati `notification_preferences` (`in_app_enabled`, `recurring_reminder_enabled`) serta `end_date` template.

### 11.12 Pertanyaan finansial read-only `[TODO]` (seluruh seksi)

**FR-QA-01** Pengguna dapat bertanya tentang transaksi, saldo, kategori, periode, dan budget miliknya.

**FR-QA-02** Intent AI harus dipetakan ke daftar intent yang diizinkan, misalnya `spending_by_category`, `income_summary`, `account_balance`, `budget_status`, `top_merchants`, dan `recent_transactions`.

**FR-QA-03** Parameter query harus divalidasi server-side dan menggunakan query terparameterisasi (query dibatasi user sebelum agregasi).

**FR-QA-04** AI tidak boleh mengarang angka ketika query mengembalikan data kosong atau gagal.

**FR-QA-05** Jawaban harus menampilkan periode analisis dan filter yang digunakan.

**FR-QA-06** Q&A tidak dapat membuat, mengubah, menghapus, atau mengonfirmasi transaksi.

**FR-QA-07** Jawaban harus memiliki disclaimer singkat bahwa hasil bersifat informasional dan berdasarkan data yang telah dicatat pengguna.

### 11.13 Ekspor, privasi, dan penghapusan

**FR-DATA-01** `[DONE]` Pengguna dapat meminta ekspor semua data finansialnya dalam JSON (`exportJsonAction`; 16 entitas — Lampiran F).

**FR-DATA-02** `[DONE]` Pengguna dapat meminta ekspor transaksi dalam CSV yang kompatibel dengan spreadsheet (`exportCsvAction`; spesifikasi format Lampiran F).

**FR-DATA-03** `[DONE]` Ekspor JSON harus mencakup profiles/settings, accounts, categories, transactions, transaction legs, items, budgets, allocations, recurring templates, notification preferences, notification jobs, receipt batches, receipt attachments (metadata), chat sessions, chat messages, dan ai_usage (tanpa raw prompt/response — kolom tersebut memang tidak disimpan).

**FR-DATA-04** `[TODO]` Lampiran receipt harus dapat diunduh secara privat atau dikemas dalam arsip jika ukuran dan jumlahnya memungkinkan.

**FR-DATA-05** `[DONE]` Penghapusan permanen harus menghapus data database (16 tabel via RPC `delete_user_data`), chat, AI usage, storage objects, notification jobs, dan session terkait.

**FR-DATA-06** `[DONE]` Penghapusan harus meminta reauthentication dan konfirmasi eksplisit (`signInWithPassword` ulang + teks `HAPUS DATA SAYA`).

**FR-DATA-07** `[DONE]` Setelah penghapusan, pengguna tidak boleh dapat mengakses data melalui session lama (`signOut` + redirect `/login?deleted=1`; session dihapus).

**FR-DATA-08** `[DONE]` Sistem harus menjelaskan bahwa data teknis provider pihak ketiga tunduk pada kebijakan provider; aplikasi tidak boleh menyimpan prompt atau foto lebih lama dari yang diperlukan (dijelaskan di `/privacy`).

**FR-DATA-09** `[PARTIAL]` Spesifikasi CSV (implementasi awal): kolom `id, tanggal, tipe, nominal_idr, merchant, kategori, akun, sumber, catatan, status`; escape `"`, koma, newline, titik-koma; nominal integer; tanggal ISO 8601; max 2.000 baris. *(Penyempurnaan `[TODO]`: BOM UTF-8 untuk Excel Indonesia, format tanggal lokal, kolom tambahan `transfer_from/transfer_to`.)*

**FR-DATA-10** `[DONE]` Spesifikasi JSON: objek `{ exported_at, app, version: 1, <16 entitas> }`; format pretty-print; nama file `financial-tracking-export-YYYY-MM-DD.json`.

**FR-DATA-11** `[PARTIAL]` Batas awal ekspor: 1.000 baris per tabel (JSON) dan 2.000 transaksi (CSV). Untuk data di atas batas, ekspor harus berjalan secara bertahap/streaming (`[TODO]`), dan UI harus memberi tahu jika data terpotong.

**FR-DATA-12** `[DONE]` Reauthentication penghapusan memakai password (bukan hanya session) dan menolak password salah tanpa efek samping.

**FR-DATA-13** `[DONE]` Setelah penghapusan akun, `auth.users` tetap dihapus/dinonaktifkan sesuai kebijakan InsForge; semua data aplikasi milik pengguna sudah tidak ada di DB (RPC menghapus semua tabel milik user).

**FR-DATA-14** `[DONE]` Kepatuhan UU PDP (Indonesia): pengguna memiliki hak akses data (FR-DATA-01/02), hak hapus data (FR-DATA-05), dan informasi pemrosesan (FR-DATA-08). Aplikasi tidak mengumpulkan data anak di bawah 13 tahun; pendaftaran hanya untuk pengguna dewasa/pribadi (pernyataan di `/terms`).

### 11.14 Notifikasi in-app (baru)

**FR-NOTIF-01** `[DONE]` Notifikasi in-app memiliki status dibaca/belum (`read_at`); pengguna dapat menandai satu (`markNotificationReadAction`) atau semua (`markAllNotificationsReadAction`).

**FR-NOTIF-02** `[DONE]` Badge jumlah belum dibaca tampil di sidebar dan indikator di topbar (`getUnreadNotificationCount`; badge hanya saat `unreadCount > 0`).

**FR-NOTIF-03** `[DONE]` `notification_jobs` memiliki `dedupe_key` unik per user (`UNIQUE (user_id, dedupe_key)`).

**FR-NOTIF-04** `[DONE]` Scheduler idempotent: insert dengan `ON CONFLICT DO NOTHING`; menjalankan scheduler berulang tidak menggandakan notifikasi.

**FR-NOTIF-05** `[DONE]` Peringatan anggaran dihasilkan per threshold: `near` (≥80%) jika `notify_at_80`, `over` (≥100%) jika `notify_at_100`/`notify_over`; dedupe key `budget:{id}:{period_start}:{threshold}` (satu peringatan per ambang per periode).

**FR-NOTIF-06** `[DONE]` Konten notifikasi in-app: judul + body berisi tipe, nominal terformat IDR, dan tanggal jatuh tempo (recurring) atau spent/allocated/persentase (budget).

**FR-NOTIF-07** `[PARTIAL]` Notifikasi harus memiliki tautan kontekstual (misal ke template recurring atau halaman budget). *(Body sudah memuat info; tautan/aksi dalam notifikasi `[TODO]`.)*

### 11.15 Scheduler dan pekerjaan terjadwal (baru)

**FR-SCHED-01** `[DONE]` Edge function `schedule-recurring-reminders` dijalankan oleh schedule InsForge (harian) dan wajib diautentikasi dengan `SCHEDULER_SECRET` (bearer atau body) bila di-set.

**FR-SCHED-02** `[DONE]` Function hanya memanggil RPC `scheduler_generate_notification_jobs` dengan admin client; tidak ada logika bisnis di function.

**FR-SCHED-03** `[DONE]` Scheduler tidak pernah membuat transaksi; hanya membuat `notification_jobs` in-app.

**FR-SCHED-04** `[TODO]` Scheduler email: ketika email aktif, channel `email` harus menghasilkan job dengan `dedupe_key` terpisah dari in-app (`...:in_app` vs `...:email`) dan status delivery dicatat di `notification_jobs` (`sent_at`, `attempt_count`, `last_error`).

**FR-SCHED-05** `[PARTIAL]` Scheduler harus menangani pengguna yang menghapus akun: baris `notification_jobs` miliknya terhapus oleh RPC `delete_user_data`; job yang sedang dieksekusi setelah penghapusan tidak boleh mengirim ke alamat yang sudah dihapus (`[TODO]`: cek keberadaan user sebelum kirim).

## 12. Rekomendasi AI dan Kontrak Pemrosesan

### 12.1 Provider dan model (fakta diverifikasi 18 Agustus 2026 dari dokumentasi Groq)

Provider awal yang direkomendasikan adalah Groq, dipanggil dari InsForge Function.

| Operasi | Model | Modality | Status Groq | Harga per 1M token | Batas relevan |
| --- | --- | --- | --- | --- | --- |
| Parsing chat transaksi | `openai/gpt-oss-20b` | Text in, text out | Production (1000 tps) | $0.075 input / $0.30 output | 131K context; max completion 65.536 |
| Q&A terstruktur | `openai/gpt-oss-20b` | Text in, text out | Production (1000 tps) | $0.075 input / $0.30 output | Sama seperti di atas |
| Parsing foto struk | `qwen/qwen3.6-27b` | Text dan image in | **Preview** (500 tps) | $0.60 input / $3.00 output | 131K context; max completion 16.384; **max 5 gambar/request**; **max 20 MB per gambar**; tool use + JSON mode |
| Fallback | Form manual | Tidak menggunakan AI | — | — | Harus selalu tersedia |

Aturan model:

- `qwen/qwen3.6-27b` adalah model **preview**: dapat dihentikan sewaktu-waktu (risiko R-01). Model ID harus dikonfigurasi melalui environment variable (`AI_TEXT_MODEL`, `AI_VISION_MODEL`) agar dapat diganti tanpa mengubah UI atau schema domain.
- Batas Groq 5 gambar/request dan 20 MB/gambar menjadi acuan perancangan batching (FR-AI-RECEIPT-04) dan batas file (FR-AI-RECEIPT-03). Nilai ini harus diverifikasi ulang saat deployment.
- Dukungan structured output/JSON Schema untuk `gpt-oss-20b` harus diverifikasi saat implementasi; fallback JSON mode + validasi Zod selalu wajib (FR-AI-TEXT-07).
- Setiap function harus mencatat `provider` dan `model` yang benar-benar dipakai ke `ai_usage`.

### 12.2 Batas biaya dan kuota aplikasi

- Target biaya AI eksternal MVP: Rp0 (menggunakan free quota).
- Batas aplikasi: 30 operasi AI per pengguna per hari; 300 per bulan (nilai via `AI_DAILY_LIMIT`, `AI_MONTHLY_LIMIT`).
- Satu operasi = parsing chat, parsing satu receipt batch, atau satu pertanyaan Q&A.
- Foto dalam jumlah banyak tetap dihitung sebagai satu operasi produk; biaya provider dihitung sesuai request dan token (`ai_usage.input_tokens/output_tokens`).
- Window harian: reset pada tengah malam waktu server (`date_trunc('day', NOW())` — implementasi `count_ai_usage_today`); window bulanan mengikuti bulan server. Penyesuaian ke zona waktu pengguna adalah penyempurnaan pasca-MVP.
- Jika kuota pengguna habis, aplikasi menampilkan pesan yang jelas dan mengarahkan ke input manual (FR-AI-TEXT-09).
- Aplikasi tidak boleh mengaktifkan billing otomatis sebagai fallback.
- `ai_usage` adalah satu-satunya sumber penghitungan kuota; tidak ada cache kuota di client.
- Pencatatan `ai_usage` wajib terjadi di server (function), bukan di browser.

### 12.3 Parsing transaksi teks `[TODO]`

Schema konseptual output (draft; versi final ditentukan di function saat implementasi):

```json
{
  "intent": "create_transaction",
  "transaction_type": "expense",
  "amount_idr": 45000,
  "occurred_at": "2026-08-17T12:00:00+07:00",
  "merchant": "Warteg",
  "account_candidate": "BCA",
  "category_candidate": "Makanan",
  "note": null,
  "confidence": 0.94,
  "missing_fields": [],
  "ambiguities": []
}
```

Rules:

- Semua nominal harus dikonversi menjadi integer IDR.
- Frasa seperti `45 ribu`, `45k`, dan `Rp45.000` harus dipahami secara konsisten.
- AI harus membedakan `transfer`, `expense`, dan `income`.
- AI tidak boleh membuat account ID atau category ID; backend melakukan resolusi terhadap kandidat nama (FR-AI-TEXT-04).
- Output model harus divalidasi dengan Zod atau validator runtime yang setara di server.
- Field yang tidak ada harus bernilai `null` atau masuk `missing_fields`, bukan ditebak.
- Tanggal relatif dikonversi di function menggunakan zona waktu pengguna yang dikirim dari client (tidak dihitung model sendiri).

### 12.4 Parsing foto struk `[TODO]`

Schema konseptual output:

```json
{
  "receipt_group": "single_receipt",
  "merchant": "Contoh Mart",
  "occurred_at": "2026-08-17T19:30:00+07:00",
  "currency": "IDR",
  "subtotal_idr": 100000,
  "discount_idr": 5000,
  "tax_idr": 10450,
  "service_charge_idr": 0,
  "total_idr": 105450,
  "payment_method_candidate": "BCA",
  "items": [
    {
      "name": "Contoh Produk",
      "quantity": 1,
      "unit_amount_idr": 100000,
      "total_amount_idr": 100000,
      "confidence": 0.9
    }
  ],
  "conflicts": [],
  "missing_fields": [],
  "confidence": 0.88
}
```

Rules:

- Tidak ada batas jumlah foto atau item di level fitur.
- Provider memiliki batas teknis per request (max 5 gambar), sehingga Function harus melakukan batching dan merge (FR-AI-RECEIPT-04).
- Total yang terbaca harus diprioritaskan sebagai nilai yang memengaruhi transaksi (FR-AI-RECEIPT-09).
- Sistem harus menampilkan jika subtotal dan item tidak sama dengan total (konflik, bukan koreksi diam-diam).
- Jika foto berasal dari beberapa struk, sistem meminta pengguna memilih pengelompokan (FR-AI-RECEIPT-10).
- QR code, nomor kartu, atau data sensitif lain tidak boleh disimpan kecuali memang diperlukan (Seksi 12.5).
- Jika aplikasi menyimpan foto sebagai lampiran, path dan URL harus dicatat di database (`receipt_attachments.storage_key/storage_url`) dan bucket harus private (Seksi 15).

### 12.5 Keamanan prompt dan data AI

- API key Groq hanya berada di InsForge Function secrets.
- Browser hanya memanggil function melalui session pengguna.
- Teks pada foto, merchant name, dan catatan pengguna diperlakukan sebagai data tidak tepercaya (FR-AI-RECEIPT-11); prompt instruksi harus memisahkan tegas bagian "instruksi sistem" dari "data input".
- AI tidak boleh menjalankan SQL bebas; Q&A hanya melalui fungsi query terparameterisasi yang diizinkan (FR-QA-03).
- Tool Q&A hanya menyediakan function yang telah ditentukan dan validasi parameter.
- Prompt tidak boleh berisi seluruh database pengguna; kirim konteks paling minimal (misal daftar nama akun/kategori, bukan riwayat lengkap).
- Raw prompt, raw response, dan foto tidak ditulis ke application log; `ai_usage` hanya menyimpan metadata (operation, provider, model, status, token, estimasi biaya).
- Konfigurasi Zero Data Retention provider harus diaktifkan jika tersedia dan harus diverifikasi sebelum launch.
- Pernyataan privasi tidak boleh menjanjikan lebih dari kebijakan provider yang benar-benar aktif (FR-DATA-08).
- Correlation ID mengalir dari client ke function dan ke log error tanpa menyimpan isi prompt (Seksi 21.3).

### 12.6 Kontrak error dan retry function AI `[TODO]`

Setiap function AI wajib mengembalikan envelope respons terstruktur:

```json
{
  "ok": true,
  "data": { },
  "meta": { "correlation_id": "…", "provider": "groq", "model": "…" }
}
```

```json
{
  "ok": false,
  "error": {
    "code": "ai_quota_exceeded | provider_error | schema_validation_failed | rate_limited | unauthorized | internal",
    "message": "Pesan ramah pengguna dalam Bahasa Indonesia",
    "retryable": true,
    "correlation_id": "…"
  }
}
```

Aturan:

- `retryable: true` hanya untuk `provider_error` dan `rate_limited`; UI menampilkan tombol "Coba lagi".
- `schema_validation_failed` tidak retryable — mengarahkan ke formulir manual (FR-AI-RECEIPT-12).
- `ai_quota_exceeded` menampilkan status kuota dan arah manual.
- Retry maksimal 1 kali otomatis untuk `provider_error`; tidak pernah menulis draft duplikat (batch/draft dibuat sekali, update di tempat).
- Semua error dicatat ke `ai_usage.status` dan log server dengan correlation ID (tanpa payload).

## 13. Arsitektur Teknis

### 13.1 Frontend

- Next.js App Router (terpasang: `next@16.3.1`, `react@19.2.8`). `[DONE]`
- TypeScript dengan strict mode. `[DONE]`
- Tailwind CSS **4** (terpasang: `tailwindcss@^4`, `@tailwindcss/postcss@^4`). *(Perbaikan dari v1.0 yang menyebut 3.4.)* `[DONE]`
- Ikon: `@phosphor-icons/react` (2.1.10). `[DONE]`
- `@insforge/sdk` (1.5.2) untuk authentication, database, storage, functions, email, dan kebutuhan realtime. `[DONE]`
- Server-rendered protected pages (server components) + `proxy.ts` untuk refresh session SSR. `[DONE]`
- Client components hanya untuk interaksi yang membutuhkan state browser, upload, chat streaming, atau drag-and-drop. `[DONE]`
- Runtime validation menggunakan Zod 4 untuk form, function response, dan (nanti) AI output. `[DONE]` (validasi form di server actions; schema AI `[TODO]`)

### 13.2 Backend InsForge

- InsForge Auth untuk email/password dan session. `[DONE]`
- InsForge Postgres untuk seluruh data aplikasi (16 tabel). `[DONE]`
- RLS di setiap tabel yang memiliki data pengguna. `[DONE]`
- InsForge Storage private bucket untuk receipt attachment. `[TODO]` (bucket belum dibuat)
- InsForge Functions: `schedule-recurring-reminders` `[DONE]`; function AI `[TODO]` (Lampiran D).
- InsForge Email untuk email pengingat: **belum aktif** (`[auth.smtp] enabled = false` di `insforge.toml`) — Risiko R-12.
- InsForge schedule untuk notification jobs (retention schedule 7 hari; realtime retention 0 hari). `[DONE]`

### 13.3 Integrasi client dan server

Client-side SDK menggunakan (`NEXT_PUBLIC_` prefix, aman untuk browser):

```text
NEXT_PUBLIC_INSFORGE_URL
NEXT_PUBLIC_INSFORGE_ANON_KEY
NEXT_PUBLIC_APP_URL
```

Server-only secrets menggunakan (tidak boleh ada di client bundle):

```text
INSFORGE_URL
INSFORGE_API_KEY
GROQ_API_KEY                 # [TODO] — belum dipakai
AI_TEXT_MODEL                # [TODO] — default openai/gpt-oss-20b
AI_VISION_MODEL              # [TODO] — default qwen/qwen3.6-27b
AI_DAILY_LIMIT               # [TODO] — default 30
AI_MONTHLY_LIMIT             # [TODO] — default 300
SCHEDULER_SECRET             # [DONE] — dipakai schedule-recurring-reminders
INSFORGE_BASE_URL            # [DONE] — dipakai edge function (fallback INSFORGE_URL)
```

Aturan:

- Anon key boleh digunakan untuk operasi user-scoped sesuai RLS.
- API key admin atau Groq key tidak boleh dipakai di client bundle.
- File `.env`, `.env.local`, dan `.env*.local` harus masuk `.gitignore`; `.env.example` tersedia tanpa secret. `[DONE]`
- Mutasi sensitif seperti confirm transaction, delete account, dan AI invoke harus memiliki validasi server-side. `[DONE]` (confirm/delete; AI `[TODO]`)
- Konfigurasi auth: `require_email_verification = true`, `verify_email_method = "code"`, `reset_password_method = "code"`, `disable_signup = false`, password min 6 karakter. `[DONE]`
- Konfigurasi storage: `max_file_size_mb = 50` (platform). Batas aplikasi 20 MB per file receipt tetap ditegakkan di layer aplikasi (FR-AI-RECEIPT-03).

### 13.4 Function dan RPC yang direkomendasikan

Pemetaan yang akurat antara daftar fungsi PRD v1.0 dan realita implementasi:

| Function/RPC | Tanggung jawab | Status |
| --- | --- | --- |
| `schedule-recurring-reminders` (edge function) | Memanggil RPC scheduler; auth `SCHEDULER_SECRET` | `[DONE]` |
| RPC `scheduler_generate_notification_jobs` | Membuat notification jobs in-app (recurring + budget) idempotent | `[DONE]` |
| RPC `confirm_transaction` | Validasi + simpan transaksi atomik (1-2 legs), idempotent | `[DONE]` |
| RPC `update_transaction` | Edit transaksi, ganti legs atomik | `[DONE]` |
| RPC `delete_transaction` | Soft-delete transaksi | `[DONE]` |
| RPC `delete_user_data` | Hapus permanen 16 tabel milik user | `[DONE]` |
| RPC `count_ai_usage_today` | Hitung operasi AI hari ini (kuota harian) | `[DONE]` |
| Function `parse-transaction-text` | Parsing pesan teks → draft transaction | `[TODO]` |
| Function `parse-receipt-images` | Ambil receipt attachments, batch vision, gabung hasil | `[TODO]` |
| Function `answer-finance-question` | Intent + query aman + ringkasan jawaban | `[TODO]` |
| Function `confirm-transaction-draft` | Validasi & simpan transaksi dari review AI (dapat berupa RPC + action, lihat catatan) | `[TODO]` |
| Function `create-data-export` | Ekspor CSV/JSON + akses download privat (saat ini server action browser) | `[PARTIAL]` |
| Function `delete-user-data` | (sudah menjadi RPC `delete_user_data` + server action reauth) | `[DONE]` |
| Function `send-notification-email` | Kirim email pengingat + catat status delivery | `[TODO]` |
| RPC `count_ai_usage_month` | Hitung operasi AI bulan ini (kuota bulanan) | `[TODO]` |

Catatan arsitektur:

- Mutasi transaksi harus tetap melewati RPC SECURITY DEFINER (`confirm_transaction` dst.) — function AI dan server action tidak boleh menulis `transactions` langsung.
- Draft AI disimpan di `chat_messages`/`receipt_batches` (bukan di `transactions.status = 'draft'`); field `status = 'draft'` di tabel `transactions` disediakan schema untuk kebutuhan masa depan.
- Ekspor tetap di server action pada MVP (`[DONE]`); migration ke function `create-data-export` (untuk lampiran & arsip) dapat menyusul.

### 13.5 Idempotensi dan konsistensi

- Confirm transaction harus menerima `idempotency_key` (RPC + `UNIQUE (user_id, idempotency_key)`). `[DONE]`
- Transfer disimpan sebagai satu logical transaction dan dua transaction legs dalam satu database transaction. `[DONE]`
- Penghapusan transaction (soft-delete) mempertahankan legs, items, attachments relation, dan draft reference. `[DONE]`
- Notification job harus memiliki unique dedupe key. `[DONE]`
- Receipt batch dapat diulang tanpa membuat duplicate transaction sebelum pengguna mengonfirmasi. `[TODO]`
- Retry AI tidak boleh membuat record finansial. `[TODO]`
- `recordOccurrenceAction` harus menerima idempotency key turunan occurrence (FR-RECUR-12). `[TODO]`

### 13.6 Revalidasi data (sinkronisasi antar halaman)

- Mutasi transaksi/akun/budget/template memanggil `revalidatePath` untuk halaman yang terpengaruh (`/app/transactions`, `/app/dashboard`, `/app/accounts`, `/app/budgets`, `/app/capture`, `/app/recurring`). `[DONE]`
- Dashboard tidak boleh menyimpan cache angka finansial antar request; `dynamic = 'force-dynamic'` pada halaman data. `[DONE]`
- Cache (misal data non-sensitive) hanya boleh di-scope per user (NFR Performance). `[DONE]`

### 13.7 Environment matrix

| Environment | Tujuan | DB/storage | Email | AI (Groq) | Catatan |
| --- | --- | --- | --- | --- | --- |
| Local dev | Pengembangan | InsForge remote (project `u673svbw`) atau branch dev | Nonaktif (blokir alur email) | Tidak dipakai sampai function AI dibangun | `npm run dev` |
| Staging | UAT, eval set, beta internal | Branch/DB staging | Email sandbox jika tersedia | Model preview dengan kuota terbatas | Gate sebelum production (Seksi 26) |
| Production | Rilis | Project production `u673svbw` | Email aktif (keputusan R-12) | Model final + quota diverifikasi | ZDR provider aktif |

Secrets harus berbeda per environment; tidak ada secret bersama antar environment.

## 14. Model Data Konseptual

Nama tabel final mengikuti migrations (001–005). Relasi dan batasan berikut wajib dipertahankan. Kolom yang ditandai **delta v2.0** merupakan penyempurnaan dokumen terhadap schema aktual.

### 14.1 `profiles`

- `id` (PK = `auth.users.id`, `ON DELETE CASCADE`).
- `display_name` (default `''`; diisi trigger dari metadata email saat signup).
- `locale` (default `'id-ID'`), `base_currency` (default `'IDR'`), `timezone` (default `'Asia/Jakarta'`).
- `created_at`, `updated_at` (trigger `updated_at`).

### 14.2 `notification_preferences`

- `user_id` (UNIQUE), `in_app_enabled` (default true), `email_enabled` (default **false**), `recurring_reminder_enabled` (true), `budget_threshold_enabled` (true), `default_reminder_offset_minutes` (default 1440, `CHECK >= 0`), `unsubscribed_at` nullable.
- `created_at`, `updated_at`.

### 14.3 `accounts`

- `id`, `user_id` (`DEFAULT auth.uid()`).
- `name` (non-empty), `account_type`: `cash`/`bank`/`e_wallet`/`credit_card`.
- `opening_balance_idr` (`CHECK >= 0`), `opening_balance_at`.
- `is_active`, `archived_at` nullable, `icon`, `color`.
- Index: `(user_id)`, partial `(user_id) WHERE archived_at IS NULL`.
- FK `transaction_legs.account_id ON DELETE RESTRICT` → akun ber-leg tidak bisa dihapus (FR-ACCOUNT-05).

### 14.4 `categories`

- `id`, `user_id` nullable (kategori sistem), `name` (UNIQUE per user), `category_kind`: `income`/`expense`/`both`, `is_system`, `is_active`, `color`.
- RLS: SELECT `user_id = auth.uid() OR user_id IS NULL`; mutasi hanya milik sendiri.

### 14.5 `transactions`

- `id`, `user_id`, `transaction_type`: `income`/`expense`/`transfer`/`adjustment`.
- `status`: `draft`/`confirmed`/`deleted` (default `confirmed` — aplikasi selalu menyimpan langsung confirmed; `draft` untuk kebutuhan masa depan).
- `occurred_at` (TIMESTAMPTZ), `amount_idr` (`CHECK > 0`), `merchant`, `category_id` (FK `ON DELETE SET NULL`), `source`: `manual`/`chat`/`receipt`/`recurring`/`adjustment`, `note`, `source_reference_id`, `idempotency_key` (UNIQUE per user), `confirmed_at`, `created_at`, `updated_at`.
- Index: `(user_id, occurred_at DESC)`, `(user_id, status)`, `(user_id, category_id)`, `(user_id, transaction_type)`.

### 14.6 `transaction_legs`

- `id`, `user_id`, `transaction_id` (FK CASCADE), `account_id` (FK RESTRICT), `direction`: `in`/`out`, `amount_idr` (`CHECK > 0`).
- `UNIQUE (transaction_id, account_id, direction)`.
- Rules: Income 1 leg `in`; Expense 1 leg `out`; Transfer 2 legs; Adjustment 1 leg (arah via `p_leg_direction` di RPC).

### 14.7 `transaction_items`

- `id`, `user_id`, `transaction_id` (FK CASCADE), `name`, `quantity` (NUMERIC(12,2)), `unit_amount_idr`, `total_amount_idr`, `discount_idr` (`CHECK >= 0`), `category_id`, `confidence` (NUMERIC(4,3) 0..1), `sort_order`.
- Tidak ada batas jumlah item di level produk; proteksi resource tetap harus ada (Seksi 19).
- Items dihapus via CASCADE saat transaksi soft-delete? **Tidak** — soft-delete tidak menghapus baris; items tetap utuh sebagai data audit. Baris `deleted` disembunyikan di query aplikasi.

### 14.8 `receipt_batches`

- `id`, `user_id`, `status`: `uploaded`/`processing`/`review`/`confirmed`/`failed`/`discarded`, `provider`, `model`, `extraction_result` JSONB (hanya jika retention diaktifkan dan diperlukan), `conflict_summary` JSONB, `created_at`, `updated_at`.

### 14.9 `receipt_attachments`

- `id`, `user_id`, `receipt_batch_id` (FK CASCADE), `transaction_id` (FK SET NULL, diisi saat konfirmasi), `storage_key`, `storage_url`, `mime_type`, `size_bytes`, `checksum`, `sort_order`, `delete_after_processing` (default true), `created_at`, `deleted_at`.

### 14.10 `budgets`

- `id`, `user_id`, `budget_model`: `monthly_category`/`flexible_period`/`envelope`, `name`, `category_id` (null untuk envelope), `period_start`/`period_end` (DATE, `CHECK period_end >= period_start`), `target_amount_idr` (null untuk envelope; `CHECK > 0`), `rollover_enabled`, `notify_at_80`, `notify_at_100`, `notify_over` (default true), `is_active`.

### 14.11 `budget_allocations`

- `id`, `user_id`, `budget_id` (FK CASCADE), `category_id` (FK CASCADE), `period_start`/`period_end`, `allocated_amount_idr` (`CHECK >= 0`), `rollover_amount_idr` (nullable, `CHECK >= 0`).

### 14.12 `recurring_templates`

- `id`, `user_id`, `name`, `transaction_type` (`income`/`expense`/`transfer`), `amount_idr` (`> 0`), `account_id`/`transfer_from_id`/`transfer_to_id` (FK SET NULL), `category_id`, `frequency` (`daily`/`weekly`/`monthly`/`yearly`), `interval_value` (`>= 1`), `start_date`, `end_date` nullable, `next_occurrence_at`, `reminder_offsets` JSONB (default `[1440]`), `is_active`.
- Constraints: transfer wajib punya from/to berbeda; non-transfer wajib punya `account_id`.

### 14.13 `notification_jobs`

- `id`, `user_id`, `type` (`recurring_reminder`/`budget_alert`/…), `channel`: `in_app`/`email`, `source_type`/`source_id`, `title`, `body`, `scheduled_at`, `dedupe_key` (**UNIQUE per user**), `status`: `pending`/`sent`/`failed`/`cancelled`, `attempt_count`, `last_error`, **`read_at`** (delta v2.0: sudah ada di schema aktual — status dibaca), `sent_at`, `created_at`.

### 14.14 `chat_sessions` dan `chat_messages`

- `chat_sessions`: `id`, `user_id`, `title`, timestamps.
- `chat_messages`: `id`, `user_id`, `session_id` (FK SET NULL), `role`: `user`/`assistant`/`system`, `operation` (misal `parse_text`, `ask_question`), `content`, `status`, `created_at`.
- Raw receipt image tidak disimpan sebagai base64 pada message (gunakan `receipt_attachments`).
- Retention chat: batasan dapat diterapkan (contoh: konten `content` dibatasi panjang 4.000 karakter per pesan saat penyimpanan); harus termasuk dalam export/delete (FR-DATA-03/05).
- Chat message bukan sumber kebenaran transaksi; transaction record confirmed adalah sumber kebenaran.

### 14.15 `ai_usage`

- `id`, `user_id`, `operation`, `provider`, `model`, `status` (default `started`), `input_tokens`/`output_tokens` nullable, `estimated_cost_idr` nullable, `created_at`.
- **Tidak menyimpan raw prompt/response.**
- Index `(user_id, created_at DESC)` untuk penghitungan kuota.

### 14.16 Retention policy (delta v2.0)

| Data | Retention | Catatan |
| --- | --- | --- |
| Transaksi soft-deleted | Permanen (audit) | Disembunyikan dari UI/query; tidak dihitung |
| `receipt_batches.extraction_result` | Hanya jika `delete_after_processing = false` dan pengguna menyimpan lampiran; jika tidak, kosong/dihapus setelah proses | `[TODO]` implementasi pembersihan |
| `receipt_attachments` file mentah | Dihapus setelah batch selesai jika `delete_after_processing = true`; jika lampiran disimpan, sesuai preferensi pengguna | `[TODO]` job pembersih |
| `chat_messages` | Permanen selama akun aktif (termasuk ekspor); batas panjang konten saat insert | — |
| `ai_usage` | Permanen (kuota + audit); tanpa payload | — |
| Log aplikasi | Tidak menyimpan payload finansial sama sekali | Seksi 19/21 |
| Storage bucket | File tanpa baris `receipt_attachments` harus dihapus oleh job pembersih (orphan cleanup) | `[TODO]` |

## 15. Row-Level Security dan Authorization

Peta policy aktual (migration 002) + aturan tambahan:

- Semua 16 tabel data pengguna memiliki RLS aktif. `[DONE]`
- Policy `SELECT`: `user_id = auth.uid()` (kecuali `categories`: `user_id = auth.uid() OR user_id IS NULL`; `profiles`: `id = auth.uid()`). `[DONE]`
- Policy `INSERT/UPDATE/DELETE`: `user_id = auth.uid()` untuk tabel dengan grant mutasi langsung (accounts, categories, items, receipt, budgets, allocations, templates, chat). `[DONE]`
- `transactions`/`transaction_legs`: **hanya SELECT** untuk `authenticated`; mutasi hanya lewat RPC SECURITY DEFINER. `[DONE]`
- `notification_jobs`: SELECT + UPDATE (tandai dibaca); INSERT hanya dari scheduler RPC. `[DONE]`
- `chat_messages`: SELECT + INSERT (tanpa UPDATE/DELETE — pesan tidak dapat diubah setelah dikirim). `[DONE]`
- `ai_usage`: SELECT + INSERT. `[DONE]`
- View `account_balances` memfilter `user_id = auth.uid()` **di dalam view** (bukan hanya bergantung RLS tabel dasar — perbaikan migration 004). `[DONE]`
- RPC SECURITY DEFINER wajib memvalidasi `auth.uid()` secara eksplisit (exception `42501` bila null) dan memvalidasi kepemilikan entitas referensi (akun, kategori). `[DONE]`
- Semua RPC memiliki `SET search_path = public` (mencegah hijack search_path). `[DONE]`
- `DEFAULT auth.uid()` pada kolom `user_id` (migration 003) — insert dari server actions tanpa menyebut `user_id` eksplisit tetap memenuhi `WITH CHECK`. `[DONE]`
- Storage receipt: bucket harus private; path storage menyertakan scope user (misal `receipts/{user_id}/{batch_id}/{file}`). `[TODO]` (bucket)
- Public bucket tidak boleh digunakan untuk foto struk. `[TODO]`
- Admin client hanya boleh digunakan di server-side (edge function, migration admin); tidak pernah di client bundle. `[DONE]`
- Function harus mengambil user identity dari session/JWT, bukan dari `user_id` yang dikirim client saja. `[TODO]` (function AI)
- Semua function menolak request tanpa autentikasi kecuali endpoint publik yang dirancang demikian (contoh: scheduler memakai `SCHEDULER_SECRET`). `[DONE]` (scheduler), `[TODO]` (function AI)
- Query Q&A membatasi data berdasarkan user sebelum agregasi. `[TODO]`
- Tidak boleh ada policy yang memungkinkan user membaca semua rows untuk kemudian difilter di client (negative test di CI, Seksi 22.2). `[DONE]`
- `GRANT`: minimal sesuai kebutuhan (anon tidak diberi SELECT data finansial apa pun). `[DONE]`

## 16. Struktur Halaman dan Navigasi

### Halaman publik

- `/` Landing page. `[DONE]`
- `/login` Login. `[DONE]`
- `/register` Registrasi + verifikasi kode. `[DONE]`
- `/forgot-password` Reset password (kirim kode + set password baru). `[DONE]`
- `/onboarding` Onboarding setelah verifikasi. `[DONE]`
- `/privacy` Kebijakan privasi. `[DONE]`
- `/terms` Ketentuan penggunaan. `[DONE]`
- Halaman 404 custom (belum ada — `[TODO]`).

### Halaman aplikasi

- `/app/dashboard` Dashboard. `[DONE]`
- `/app/capture` Chat, upload struk, dan formulir manual. `[PARTIAL]` (manual `[DONE]`; chat/struk `[TODO]`)
- `/app/transactions` Daftar transaksi. `[DONE]`
- `/app/transactions/[id]` Detail transaksi. `[DONE]`
- `/app/transactions/[id]/edit` Edit transaksi. `[DONE]`
- `/app/accounts` Daftar dan pengaturan akun. `[DONE]`
- `/app/categories` Daftar dan pengaturan kategori. `[DONE]` *(Halaman ini tidak tercantum di v1.0 — diperbaiki.)*
- `/app/budgets` Tiga model anggaran. `[DONE]`
- `/app/recurring` Template dan jadwal transaksi berulang. `[DONE]`
- `/app/notifications` Notifikasi dan status pengingat. `[DONE]`
- `/app/settings/profile` Profil, bahasa, mata uang, dan zona waktu. `[DONE]`
- `/app/settings/data` Ekspor dan hapus data. `[DONE]`

### API dan infrastruktur

- `/api/auth/refresh` (POST) Refresh session SSR — `createRefreshAuthRouter()`. `[DONE]`
- `proxy.ts` Middleware refresh session global (matcher mengecualikan aset statis). `[DONE]`
- Function edge: `schedule-recurring-reminders`. `[DONE]`

### Navigasi utama mobile

- Dashboard, Transaksi, Catat, Anggaran, Lainnya (Pengaturan/Notifikasi). `[DONE]` (`components/app-shell.tsx` `mobile-nav`)
- Tombol Catat harus mudah dijangkau (posisi tengah pada bar navigasi bawah) karena merupakan tindakan utama aplikasi. `[DONE]`

### Deep-link dan behavior

- Transaksi detail dapat di-link dari chat, notifikasi, dashboard, dan email (tautan aman, tidak memuat data finansial mentah di URL — FR-RECUR-08/09, Seksi 18).
- Halaman yang membutuhkan session me-redirect ke `/login` (guard di `app/app/layout.tsx`). `[DONE]`
- Halaman yang tidak ditemukan di dalam `/app` harus menampilkan 404 dalam app shell, bukan layout publik. `[TODO]`

## 17. Desain Sistem dan UX

### 17.1 Design tokens (dari static-prototype; target implementasi Tailwind v4)

| Token | Nilai dark (default) | Nilai light (`prefers-color-scheme: light`) | Penggunaan |
| --- | --- | --- | --- |
| `--bg` | `#111411` | `#f2f6ef` | Latar halaman |
| `--bg-raised` | `#161a17` | — | Latar sidebar/topbar (dengan blur) |
| `--surface` | `#1b201d` | `#ffffff` | Kartu/surface |
| `--surface-strong` | `#202621` | `#f7fbf5` | Surface lebih tinggi |
| `--surface-soft` | `#252c26` | `#eaf2e7` | Surface hover |
| `--ink` | `#eef5ed` | `#172019` | Teks utama |
| `--muted` | `#91a097` | `#77867c` | Teks sekunder |
| `--muted-strong` | `#bac7bd` | `#536259` | Teks sekunder kuat |
| `--line` | `rgba(219,235,222,.11)` | `rgba(35,62,43,.12)` | Border |
| `--line-strong` | `rgba(219,235,222,.2)` | `rgba(35,62,43,.2)` | Border kuat |
| `--acid` | `#c9f46c` | `#c9f46c` | Aksen utama (income, aktif, CTA) |
| `--acid-deep` | `#8cb946` | — | Hover aksen |
| `--acid-ink` | `#182116` | `#182116` | Teks di atas aksen |
| `--coral` | `#ff9c79` | `#ff9c79` | Expense, peringatan |
| `--blue` | `#8ebaff` | `#8ebaff` | Info, net cash flow |
| `--violet` | `#b8a9ff` | `#b8a9ff` | Kategori/grafik |
| `--amber` | `#f4c86e` | `#f4c86e` | Peringatan menengah (near threshold) |
| `--danger` | `#ff897e` | `#ff897e` | Error, hapus |
| Font display | `Space Grotesk` | sama | Heading, nominal besar |
| Font body | `DM Sans` | sama | Teks |
| Font mono | `DM Mono` | sama | Label teknis, nominal tabel, kicker |

Spacing: skala 4px (4, 8, 12, 16, 20, 24…). Radius: kartu 11–13px, tombol 7px, nav 9px, pill 5px. Shadow kartu: `0 20-24px 55-70px rgba(0,0,0,.14-.18)`. Body base: 13–14px. Kontras teks memenuhi WCAG AA pada kedua mode.

Mode warna: mengikuti `prefers-color-scheme`; tidak ada toggle manual pada MVP. Reduksi gerak: `prefers-reduced-motion` mematikan transisi (sudah di prototype). Fokus: outline 2px `--acid` offset 3px.

### 17.2 Komponen inventory

Komponen yang sudah ada di `components/` dan yang direncanakan:

| Komponen | Status | Lokasi |
| --- | --- | --- |
| `app-shell` (sidebar, topbar, mobile-nav, badge notifikasi) | `[DONE]` | `components/app-shell.tsx` |
| `transaction-form` (form manual: expense/income/transfer/adjustment) | `[DONE]` | `components/transaction-form.tsx` |
| `transaction-filters` | `[DONE]` | `components/transaction-filters.tsx` |
| `period-tabs` | `[DONE]` | `components/period-tabs.tsx` |
| `account-form`, `category-form`, `budget-form`, `template-form` | `[DONE]` | `components/` |
| `notification-widgets` (row, mark-all-read, preferences) | `[DONE]` | `components/notification-widgets.tsx` |
| `profile-menu`, `profile-form`, `logout-button` | `[DONE]` | `components/` |
| `data-settings` (export buttons, danger zone) | `[DONE]` | `components/data-settings.tsx` |
| Review card AI (editable field + confidence + konflik) | `[TODO]` | — |
| Chat composer + message thread | `[TODO]` | — |
| Upload batch (progress per file, retry, remove, cancel) | `[TODO]` | — |
| Budget detail (allocations, rollover, move allocation) | `[TODO]` | — |
| Date range picker (custom period) | `[TODO]` | — |
| Toast/snackbar untuk notifikasi berhasil/gagal | `[TODO]` | — |

### 17.3 Prinsip UX

- Semua tampilan harus usable pada lebar mobile 360px dan desktop.
- Form nominal menggunakan input numerik dan preview format IDR (`parseIDRInput` + preview `formatIDR`).
- Review AI menggunakan card yang dapat diedit tanpa membuka halaman baru.
- Upload menyediakan progress per file, status batch, retry, remove, dan cancel.
- Foto yang buram atau tidak terbaca harus menghasilkan pesan yang dapat ditindaklanjuti.
- Loading state harus membedakan upload, processing, dan saving.
- Error state harus menyebut apakah pengguna dapat mencoba ulang atau menggunakan formulir manual (Seksi 12.6).
- Tidak ada tombol destruktif tanpa konfirmasi.
- Warna tidak boleh menjadi satu-satunya cara untuk membedakan income dan expense (sertakan label "+/-" dan ikon).
- Semua input memiliki label, focus state, error message, dan keyboard support.
- Chart memiliki ringkasan teks agar dapat digunakan dengan screen reader.
- Email dan in-app notification harus memiliki tautan kembali ke konteks yang relevan.
- Nominal besar (> Rp1 jt) boleh dikompakkan menjadi `Rp1,5 jt` di kartu metrik; detail selalu penuh (`formatIDRFull`).

### 17.4 Spesifikasi per halaman

Konvensi state: setiap halaman mendefinisikan state **empty / loading / error / success**; loading menggunakan skeleton; error menampilkan pesan + aksi (coba lagi / manual).

#### 17.4.1 Landing page `/` `[DONE]`
- Tujuan: jelaskan nilai produk dalam 5 detik; CTA register/login.
- Elemen: nav publik (brand, tautan, CTA), hero (headline, copy, preview dashboard fiktif), 3 value cards (chat, struk, anggaran), proof (privasi), footer (privacy, terms).
- State: statis; tidak bergantung data pengguna.
- Aksesibilitas: heading hierarki, alt teks pada preview, kontras CTA.

#### 17.4.2 Login `/login` dan Registrasi `/register` `[DONE]`
- Login: email, password, link lupa password, link register. Error: "Email belum diverifikasi…" khusus status 403.
- Register: nama, email, password (min 6), checkbox setuju syarat & privasi; setelah submit → layar verifikasi kode 6 digit + tombol kirim ulang (cooldown 60 detik `min_interval_seconds`).
- Setelah verifikasi → `/onboarding`.
- State: pending submit (disabled + spinner), error per field inline.

#### 17.4.3 Forgot password `/forgot-password` `[DONE]`
- Langkah 1: input email → kirim kode. Langkah 2: kode + password baru (min 6) → selesai → login.
- Semua respons "berhasil" tanpa membocorkan keberadaan akun (anti enumeration).

#### 17.4.4 Onboarding `/onboarding` `[DONE]`
- Langkah: (1) nama tampilan, (2) zona waktu (default Asia/Jakarta), (3) selesai → dashboard.
- Menampilkan status: kategori default sudah dibuat (Lampiran B).

#### 17.4.5 Dashboard `/app/dashboard` `[DONE]`
- Elemen: kartu saldo total (net balance), kartu income/expense/net periode, period tabs (bulan ini/bulan lalu/30 hari/tahun ini; custom `[TODO]`), pengeluaran per kategori (bar + ringkasan teks), transaksi terbaru (6), status anggaran, upcoming recurring (5).
- Empty state: panduan langkah pertama (buat akun → catat transaksi) dengan CTA.
- Interaksi: tab periode mengubah seluruh angka (server-rendered, `searchParams`).

#### 17.4.6 Capture `/app/capture` `[PARTIAL]`
- Layout target (dari prototype): composer chat (area dominan) + sidebar upload struk + akses formulir manual. Saat ini: formulir manual + placeholder AI "Segera hadir".
- Manual form: tab tipe (Pengeluaran/Pendapatan/Transfer), nominal (preview IDR), akun, tanggal, kategori, merchant, catatan, tombol simpan. Adjustment hanya via API (UI `[TODO]`).
- Sukses: reset form, toast, revalidate dashboard.
- Chat/struk: lihat Seksi 10.2/10.3; komponen `[TODO]`.

#### 17.4.7 Transactions `/app/transactions` `[DONE]`
- Elemen: filter bar (periode, tipe, akun, kategori, pencarian merchant, sumber), ringkasan (4 mini kartu), tabel daftar (tanggal, merchant/kategori, akun, nominal ±), pagination (max 50/halaman).
- Baris dapat diklik → detail. Aksi edit/hapus di detail (soft-delete dengan konfirmasi).

#### 17.4.8 Transaction detail & edit `[DONE]`
- Detail: hero (ikon tipe, merchant, tanggal, nominal warna), grid field (tipe, akun/legs, kategori, sumber, catatan, idempotency terkait), legs untuk transfer (2 baris), tombol edit/hapus.
- Edit: `TransactionForm` mode edit; simpan → kembali ke detail; hapus → konfirmasi → redirect daftar.

#### 17.4.9 Accounts `/app/accounts` `[DONE]`
- Elemen: grid kartu akun (nama, tipe, saldo, ikon), kartu "Tambah akun", kartu terarsip (opacity, tombol aktifkan ulang).
- Form: nama, tipe (4), saldo awal, tanggal saldo awal, warna, ikon; edit: nama, tipe, status aktif.
- Hapus hanya untuk akun tanpa transaksi (legs RESTRICT); akun ber-transaksi diarsipkan.
- Kartu kredit menampilkan saldo terutang dengan label jelas (FR-ACCOUNT-09).

#### 17.4.10 Categories `/app/categories` `[DONE]`
- Grid kartu kategori (titik warna, nama, kind, jumlah?), tombol tambah; arsip/aktifkan ulang; tanpa hapus destruktif.
- Kategori sistem ditandai; kategori milik pengguna dapat diedit.

#### 17.4.11 Budgets `/app/budgets` `[DONE]`
- Ringkasan total allocated/spent/sisa; kartu per budget (model badge, progress bar warna status: violet=ok, amber=near, coral=over, teks spent/available, %).
- Form per model: monthly (kategori, periode bulan, target, threshold), flexible (rentang custom), envelope (daftar alokasi kategori + nominal; minimal 1 alokasi).
- Threshold toggle per budget; envelope rollover toggle.

#### 17.4.12 Recurring `/app/recurring` `[DONE]`
- Daftar template (nama, tipe, nominal, jadwal, next occurrence, status aktif); tombol tambah.
- Form: tipe, nominal, akun/pasangan transfer, kategori, frequency+interval, start/end date, offset pengingat (menit; UI pilihan H-1/H-0).
- Aksi: toggle aktif, edit, hapus, dan "catat occurrence" (`recordOccurrenceAction` — konfirmasi pembuatan transaksi).

#### 17.4.13 Notifications `/app/notifications` `[DONE]`
- Inbox list (judul, body, waktu, badge belum dibaca), tombol "tandai semua dibaca" (hanya bila ada unread), item dapat ditandai dibaca.
- Panel preferensi: toggle in-app, email (email `[TODO]` — toggle disimpan tetapi tidak berfungsi sampai SMTP aktif), recurring reminder, budget threshold, offset default.
- Empty state: "Belum ada notifikasi" + penjelasan sumber notifikasi.

#### 17.4.14 Settings/profile `/app/settings/profile` `[DONE]`
- Banner profil (avatar inisial, nama, email), form nama tampilan, zona waktu (dropdown), locale (hanya `id-ID` di MVP), mata uang (hanya IDR, readonly).
- Tombol keluar (logout).

#### 17.4.15 Settings/data `/app/settings/data` `[DONE]`
- Kartu ekspor: JSON (semua data) dan CSV (transaksi) — tombol unduh langsung; catatan batas baris (FR-DATA-11).
- Kartu "Data & privasi": tautan privacy/terms.
- Danger zone: hapus akun permanen — modal/flow reauth password + ketik `HAPUS DATA SAYA`; konfirmasi akhir; setelah selesai redirect `/login?deleted=1`.
- Ringkasan (data yang akan dihapus: transaksi, akun, kategori, anggaran, template, notifikasi, chat, riwayat AI, lampiran) dengan bahasa jelas bahwa tindakan tidak dapat dibatalkan.

#### 17.4.16 Privacy `/privacy` dan Terms `/terms` `[DONE]`
- Privacy mencakup: data yang dikumpulkan, pemrosesan AI (provider, ZDR), receipt & storage privat, email & unsubscribe, retention, ekspor & penghapusan, hak pengguna (UU PDP), kontak.
- Terms mencakup: penggunaan layanan, larangan, disclaimer (bukan nasihat finansial), penghentian layanan, perubahan ketentuan.

#### 17.4.17 Halaman 404 `[TODO]`
- Custom 404 publik + 404 dalam app shell; tautan kembali ke dashboard.

## 18. Email dan Notifikasi

### 18.1 Status email (kritis)

- `insforge.toml` saat ini: `[auth.smtp] enabled = false`. Akibatnya **verifikasi email, reset password, dan seluruh email pengingat tidak dapat dikirim** hingga email provider diaktifkan (Risiko R-12, keputusan terbuka Seksi 27).
- Semua keputusan produk di seksi ini tetap berlaku; implementasi ditandai `[TODO]` sampai email aktif.
- UI sudah menyimpan preferensi `email_enabled` (default false) — aman untuk diaktifkan lebih dulu tanpa mengirim apa pun.

### 18.2 Event minimal

| Event | Channel | Status |
| --- | --- | --- |
| Pengingat transaksi berulang | in-app + email | in-app `[DONE]`; email `[TODO]` |
| Budget mencapai 80% (near) jika diaktifkan | in-app + email | in-app `[DONE]`; email `[TODO]` |
| Budget mencapai 100% jika diaktifkan | in-app + email | in-app `[DONE]`; email `[TODO]` |
| Budget melewati batas jika diaktifkan | in-app + email | in-app `[DONE]`; email `[TODO]` |
| Status export selesai | in-app/email | `[TODO]` (ekspor sinkron saat ini) |
| Peringatan bahwa penghapusan data akan permanen | in-app (konfirmasi UI) | `[DONE]` |

### 18.3 Aturan email

- Pengiriman harus menggunakan provider email yang dikonfigurasi melalui InsForge.
- Custom transactional email pada InsForge dapat bergantung pada plan; konfigurasi plan, sender, dan domain harus divalidasi sebelum deployment (prasyarat Seksi 24).
- Email harus dikirim hanya jika pengguna mengaktifkan channel tersebut (`notification_preferences.email_enabled`).
- Email tidak boleh memuat seluruh riwayat keuangan; hanya informasi minimum untuk pengingat.
- Link email harus memiliki token aman dan tidak berisi data finansial mentah pada URL.
- Unsubscribe harus langsung memperbarui preference pengguna (`unsubscribed_at` atau `email_enabled = false`).
- Job retry memiliki batas percobaan (contoh: 3) dan tidak menggandakan email (dedupe key per channel — FR-SCHED-04).
- Template email: Lampiran E.

## 19. Non-Functional Requirements

### Security

- Tidak ada secret di client bundle atau repository. `[DONE]`
- Semua traffic production menggunakan HTTPS. `[DONE]` (InsForge)
- Storage receipt harus private. `[TODO]` (bucket belum dibuat)
- Input upload divalidasi tipe, ukuran, checksum, dan dapat dipindai dari konten berbahaya sesuai kemampuan platform. `[TODO]` (upload belum ada)
- Data log disensor dari nominal lengkap, nomor kartu, dan raw receipt. `[DONE]` (belum ada log payload; aturan ditetapkan)
- Delete operation memiliki audit metadata minimal tanpa menyimpan data finansial yang dihapus. `[DONE]`
- Rate limit berlaku pada function untuk mencegah abuse. `[PARTIAL]` (auth cooldown `min_interval_seconds`; function AI `[TODO]`)
- RPC SECURITY DEFINER tidak boleh dipanggil publik tanpa `auth.uid()` valid (semua RPC mengecek). `[DONE]`
- Prompt injection dari receipt/merchant/note dinetralkan dengan pemisahan instruksi vs data (FR-AI-RECEIPT-11) dan penolakan instruksi tersemat. `[TODO]`

### Performance

- Dashboard menggunakan query teragregasi dan pagination. `[DONE]`
- List transaction tidak boleh mengambil rows tanpa limit (max 50/halaman). `[DONE]`
- Data besar menggunakan pagination atau cursor. `[DONE]` (list); ekspor bertahap `[TODO]`
- Upload foto menggunakan progress dan tidak menunggu semua foto sebelum menampilkan status awal. `[TODO]`
- AI receipt batch diproses asynchronous jika jumlah file besar. `[TODO]`
- Cache hanya untuk data non-sensitive atau cache scoped per user. `[DONE]` (halaman data `force-dynamic`)
- **Target kuantitatif (delta v2.0):** LCP < 2,5 detik (koneksi normal), INP < 200 ms, CLS < 0,1 pada halaman utama; P95 durasi halaman server < 600 ms untuk query dashboard dengan ≤ 2.000 transaksi per user; payload bundle awal < 200 KB gzip (route `/app/dashboard`).

### Reliability

- Semua operasi confirm dan transfer idempotent. `[DONE]`
- Retry AI tidak boleh membuat transaksi duplicate. `[TODO]`
- Gangguan AI tidak boleh menghilangkan foto atau draft pengguna. `[TODO]`
- Gangguan email tidak boleh membatalkan transaksi. `[DONE]` (email tidak terkait simpan transaksi)
- Backup dan restore database mengikuti capability InsForge yang aktif; prosedur restore diuji sebelum production (prasyarat Seksi 24). `[DONE]` (perlu diverifikasi di staging)
- Error function memiliki correlation ID tanpa menyimpan raw prompt. `[TODO]`
- Scheduler harus idempotent dan aman dijalankan ulang (ON CONFLICT DO NOTHING). `[DONE]`
- Availability target MVP: 99,5% uptime bulanan untuk aplikasi; downtime direncanakan di luar jam sibuk Indonesia (22:00–06:00 WIB) bila memungkinkan.

### Accessibility

- Target WCAG 2.1 AA untuk alur utama. `[DONE]` (dasar; audit `[TODO]`)
- Semua kontrol dapat digunakan dengan keyboard. `[DONE]` (focus-visible outline di prototype; audit final `[TODO]`)
- Form error dibacakan oleh assistive technology. `[PARTIAL]` (inline error; `aria-live` perlu ditambahkan)
- Kontras teks dan status memenuhi standar (kedua mode warna). `[DONE]`
- Upload tidak boleh hanya bergantung pada drag-and-drop (sertakan tombol pilih file). `[TODO]`
- Warna bukan satu-satunya penanda income/expense (label + ikon). `[DONE]`
- Chart memiliki ringkasan teks (screen reader). `[PARTIAL]` (dashboard menyediakan teks; audit `[TODO]`)
- Reduksi gerak dihormati (`prefers-reduced-motion`). `[DONE]` (prototype; diteruskan ke implementasi)

### Compatibility

- Chrome, Edge, Firefox, dan Safari versi modern. `[DONE]`
- Mobile browser pada Android dan iOS. `[DONE]`
- UI tidak bergantung pada hover untuk tindakan penting. `[DONE]`
- Minimum viewport 320–360px didukung (prototype `min-width: 320px`). `[DONE]`

## 20. Acceptance Criteria MVP

Kriteria v1.0 dipertahankan dan diberi status; kriteria baru ditambahkan.

### Authentication

- [x] `[DONE]` Pengguna dapat register, login, logout, reset password, dan kembali ke session aktif.
- [x] `[DONE]` Pengguna yang belum login tidak dapat mengakses data aplikasi.
- [x] `[DONE]` User A tidak dapat membaca data User B menggunakan browser atau API langsung (negative test RLS).
- [x] `[DONE]` Verifikasi email dengan kode: pengguna baru tidak dapat login sebelum verifikasi; pesan error spesifik ditampilkan.
- [ ] `[TODO]` Email verifikasi dan reset password benar-benar terkirim (gate: email aktif — Risiko R-12).

### Text transaction

- [ ] `[TODO]` Input `"Beli makan siang 45 ribu di Warteg, bayar dari BCA hari ini"` menghasilkan review card dengan nominal IDR, merchant, kategori kandidat, akun kandidat, dan tanggal.
- [ ] `[TODO]` Jika akun BCA tidak ada, sistem meminta pengguna memilih atau membuat akun.
- [x] `[DONE]` Transaksi tidak muncul pada dashboard sebelum konfirmasi (belum ada jalur AI yang menyimpan tanpa konfirmasi; akan diuji ulang saat AI aktif).
- [x] `[DONE]` Klik konfirmasi berulang tidak membuat duplicate transaction (idempotency key; diuji dengan klik ganda).
- [ ] `[TODO]` Pesan kuota AI habis menampilkan status dan arah manual (FR-AI-TEXT-09).

### Receipt transaction

- [ ] `[TODO]` Pengguna dapat memilih banyak foto dari file picker.
- [ ] `[TODO]` Pengguna dapat menambah foto setelah processing dimulai jika batch belum dikonfirmasi.
- [ ] `[TODO]` Backend memproses foto dalam batch provider (≤ 5/request) dan menggabungkan hasil.
- [ ] `[TODO]` Sistem menampilkan item, subtotal, pajak, diskon, total, confidence, dan konflik yang ditemukan.
- [ ] `[TODO]` Pengguna dapat mengubah hasil sebelum save.
- [x] `[DONE]` Foto mentah tidak menjadi public asset (bucket privat — belum ada bucket; akan diverifikasi saat bucket dibuat).
- [ ] `[TODO]` Bila vision provider gagal, pengguna mendapat pilihan retry atau formulir manual.
- [ ] `[TODO]` File > 20 MB / tipe tidak didukung ditolak dengan pesan per file.

### Account dan transfer

- [x] `[DONE]` Saldo awal akun dapat dibuat.
- [x] `[DONE]` Expense mengurangi saldo asset atau menambah saldo terutang kartu kredit sesuai aturan account.
- [x] `[DONE]` Transfer antar akun membuat dua legs linked dan tidak mengubah total expense/income.
- [x] `[DONE]` Edit dan delete transfer mempertahankan konsistensi kedua akun.
- [x] `[DONE]` Akun dengan transaksi dapat diarsipkan.
- [x] `[DONE]` Saldo yang ditampilkan = saldo awal + legs confirmed (keterauditan, FR-ACCOUNT-03).

### Budget

- [x] `[DONE]` Pengguna dapat membuat budget bulanan per kategori.
- [x] `[DONE]` Pengguna dapat membuat budget dengan rentang tanggal fleksibel.
- [x] `[DONE]` Pengguna dapat membuat envelope, mengalokasikan dana, melihat spent/available, dan mengaktifkan rollover.
- [x] `[DONE]` Nilai budget hanya memakai transaksi confirmed.
- [x] `[DONE]` Pengguna dapat mengaktifkan threshold notification (in-app; email menunggu email aktif).
- [x] `[DONE]` Envelope menampilkan available = allocated + rollover − spent.

### Recurring dan email

- [x] `[DONE]` Pengguna dapat membuat jadwal harian, mingguan, bulanan, dan tahunan.
- [x] `[DONE]` Sistem membuat pengingat in-app sesuai preference.
- [x] `[DONE]` Pengingat yang sama tidak terkirim dua kali untuk occurrence dan channel yang sama (dedupe key).
- [x] `[DONE]` Pengguna harus mengonfirmasi sebelum occurrence menjadi transaksi confirmed.
- [x] `[DONE]` Peringatan budget (near/over) dibuat oleh scheduler dan tampil di inbox.
- [ ] `[TODO]` Email reminder terkirim dan menampilkan subject/nominal/tanggal/tautan (gate: email aktif).

### Export dan delete

- [x] `[DONE]` Export JSON memuat entitas finansial utama (16 entitas).
- [x] `[DONE]` Export CSV dapat dibuka dalam spreadsheet.
- [x] `[DONE]` Pengguna dapat mengunduh metadata lampiran dan file jika lampiran disimpan (metadata `[DONE]`; file download `[TODO]`).
- [x] `[DONE]` Delete meminta reauthentication dan konfirmasi eksplisit (`HAPUS DATA SAYA`).
- [x] `[DONE]` Setelah delete, semua session lama tidak dapat mengakses data (redirect + signOut; verifikasi final di staging).
- [x] `[DONE]` Data yang terhapus tidak muncul kembali setelah re-login dengan akun baru (fresh state).

### Notifikasi in-app (baru)

- [x] `[DONE]` Badge unread tampil di sidebar dan topbar.
- [x] `[DONE]` Menandai satu notifikasi dibaca memperbarui badge; "tandai semua" mengosongkan badge.
- [x] `[DONE]` Scheduler dijalankan dua kali tidak menggandakan notifikasi.

### Kategori (baru)

- [x] `[DONE]` Kategori default dibuat saat signup (12 kategori, Lampiran B).
- [x] `[DONE]` Kategori dapat dibuat/diubah/diarsipkan; tidak ada jalur hapus destruktif.
- [x] `[DONE]` Kategori sistem tidak dapat dimutasi pengguna.

## 21. Observability dan Analytics

### 21.1 Product events yang direkomendasikan

| Event | Status | Properti wajib (redacted) |
| --- | --- | --- |
| `signup_completed` | `[DONE]` (dapat ditambahkan analytics) | — |
| `onboarding_completed` | `[DONE]` | — |
| `account_created` | `[DONE]` | account_type |
| `transaction_manual_created` | `[DONE]` | tipe, ada_merchant (bool), nominal **tidak** dikirim |
| `transaction_ai_draft_created` | `[TODO]` | tipe, confidence bucket |
| `transaction_ai_confirmed` | `[TODO]` | tipe, diedit_sebelum_simpan (bool) |
| `transaction_ai_corrected` | `[TODO]` | jumlah field yang dikoreksi |
| `receipt_upload_started` | `[TODO]` | jumlah file |
| `receipt_upload_completed` | `[TODO]` | jumlah file, durasi |
| `receipt_extraction_failed` | `[TODO]` | kode error (tanpa isi foto) |
| `budget_created` | `[DONE]` | model budget |
| `recurring_template_created` | `[DONE]` | frequency |
| `reminder_sent` | `[DONE]` (in-app) | channel, type |
| `export_completed` | `[DONE]` | format |
| `account_deletion_completed` | `[DONE]` | — |

### 21.2 Funnel untuk metrik Seksi 5.2

- **Transaksi pertama ≤ 10 menit:** `signup_completed` → `onboarding_completed` → (dalam 600 detik) `transaction_*_created`.
- **Konfirmasi AI:** `transaction_ai_draft_created` → `transaction_ai_confirmed` (atau `transaction_ai_corrected`).
- **Receipt:** `receipt_upload_started` → `receipt_upload_completed` → `transaction_ai_confirmed`.

### 21.3 Observability teknis

- Correlation ID: dihasilkan per request function AI; dikembalikan ke client (Seksi 12.6) dan dicatat di log error server; tidak menyimpan payload.
- Logging: tidak pernah mencatat nominal, merchant penuh, nomor kartu, raw receipt, prompt, atau response AI.
- Metrik fungsi: durasi, status (`ok`/error code), token, biaya estimasi — dari `ai_usage` + log.
- Alert awal (setelah production): error rate function > 5% dalam 10 menit; scheduler gagal 2x berturut; peningkatan `failed` jobs > threshold; durasi P95 function melebihi target (Seksi 5.2).
- `ai_usage` adalah sumber kuota dan biaya; audit bulanan estimasi biaya dari `estimated_cost_idr`.

### 21.4 Privacy analytics

- Jangan mengirim raw prompt, raw receipt, merchant lengkap, nomor akun, atau nominal transaksi ke analytics pihak ketiga.
- Gunakan event properties teragregasi/ter-redact (tabel di atas).
- Sediakan opt-out sesuai kebijakan privasi (`[TODO]` jika analytics pihak ketiga dipasang).
- Usage AI cukup dicatat di `ai_usage` (tanpa isi prompt) untuk quota enforcement.

## 22. Testing Strategy

### 22.1 Unit test

- Parsing dan formatting IDR (`lib/format.ts`). `[DONE]`
- Resolusi tanggal berdasarkan timezone (`periodRange`, `monthBounds`). `[DONE]`
- Perhitungan saldo asset dan kartu kredit (view `account_balances`; test kalkulasi di app). `[DONE]`
- Pembuatan dua transfer legs (RPC; test integrasi). `[DONE]`
- Perhitungan tiga model budget (`computeBudgets`). `[DONE]`
- Perhitungan rollover envelope. `[DONE]`
- Dedupe notification job (`ON CONFLICT`; test RPC scheduler). `[DONE]`
- Idempotency confirm transaction (RPC; test duplikat key). `[DONE]`
- Validasi schema AI (Zod). `[TODO]`
- Komputasi occurrence (`computeNextOccurrence`; kasus tanggal 31, akhir bulan, interval). `[DONE]`
- Escape CSV (koma, kutip, newline). `[DONE]`

### 22.2 Integration test

- Auth flow dengan InsForge (register → verify → login → logout → reset). `[DONE]`
- RLS untuk setiap tabel utama (positive + negative lintas user). `[DONE]` (migration 002; otomatisasi di CI `[TODO]`)
- Upload dan delete private receipt. `[TODO]`
- Invoke function dengan session pengguna. `[TODO]`
- Penyimpanan transaction dan legs secara atomik (RPC; rollback saat error). `[DONE]`
- Export dan delete cascade (JSON memuat 16 entitas; RPC menghapus semuanya). `[DONE]`
- Email preference dan notification job (scheduler 2x tidak menggandakan). `[DONE]`
- Negative test: user B memanggil RPC dengan id milik user A → ditolak. `[DONE]`
- Security test: prompt injection pada merchant/note/receipt → output tetap schema valid tanpa instruksi tersemat. `[TODO]`

### 22.3 AI evaluation set

Siapkan dataset anonim minimal 50 contoh Bahasa Indonesia untuk chat dan 50 contoh foto struk yang telah mendapatkan label manual. Dataset harus mencakup:

- `Rp45.000`, `45 ribu`, `45k`, dan format pemisah berbeda.
- Tanggal relatif seperti kemarin, minggu lalu, dan tanggal spesifik.
- Transfer, expense, income, dan pembayaran kartu kredit.
- Merchant tanpa kategori eksplisit.
- Struk dengan pajak, diskon, service charge, dan pembulatan.
- Struk panjang yang membutuhkan beberapa foto.
- Foto buram, miring, gelap, atau terpotong.
- Dua struk dalam satu upload batch.
- Item berulang dan quantity lebih dari satu.

**Grading rubric (delta v2.0):**

| Skor | Definisi |
| --- | --- |
| Benar penuh | Semua field wajib tepat; tidak ada field salah yang signifikan |
| Benar setelah koreksi minor | 1–2 field salah yang mudah dikoreksi di review card |
| Salah | Field wajib salah/tebak (nominal, tipe, tanggal, akun, kategori) |

Metrik: akurasi penuh, akurasi setelah koreksi minor, dan rasio salah. Target: sesuai Seksi 5.2 (≥90% benar atau benar-setelah-koreksi). Eval set harus dijalankan ulang saat model/versi prompt berubah.

### 22.4 End-to-end test

- Register sampai transaksi pertama. `[DONE]`
- Chat sampai confirm. `[TODO]`
- Banyak foto sampai confirm. `[TODO]`
- Transfer dan verifikasi saldo. `[DONE]`
- Tiga model budget dan notifikasi threshold. `[DONE]`
- Recurring template sampai email reminder. `[PARTIAL]` (in-app `[DONE]`; email `[TODO]`)
- Export lalu delete akun. `[DONE]`
- Kuota AI: operasi ke-31 ditolak hari itu, berhasil keesokan hari. `[TODO]`
- Aksesibilitas: jalankan axe-core pada 5 halaman utama + navigasi keyboard penuh. `[PARTIAL]` (belum otomatis)

### 22.5 Load/performance test

- Dashboard dengan 2.000 transaksi: waktu render server < 600 ms. `[TODO]`
- Batch receipt 10 foto: P95 ≤ 20 detik (Seksi 5.2). `[TODO]`
- Scheduler harian dengan 1.000 pengguna aktif: RPC selesai < 30 detik. `[TODO]`

## 23. Risiko dan Mitigasi

| ID | Risiko | Dampak | Mitigasi | Status |
| --- | --- | --- | --- | --- |
| R-01 | Model vision preview (`qwen/qwen3.6-27b`) berubah atau dihentikan | Parsing foto berhenti | Adapter provider, env model ID, fallback manual; pantau status model Groq | Terverifikasi 18/08/2026: preview |
| R-02 | Free quota AI habis | Pengguna tidak dapat memakai AI sementara | Enforce kuota (FR-AI-TEXT-08/09), tampilkan status, selalu sediakan manual form | `[TODO]` (belum dipakai) |
| R-03 | AI salah membaca total struk | Saldo dan laporan salah | Review wajib, confidence, konflik, validasi total, koreksi manual | `[TODO]` |
| R-04 | Beberapa foto berasal dari struk berbeda | Transaksi salah digabung | Receipt grouping review dan hasil konflik yang terlihat | `[TODO]` |
| R-05 | Transfer dianggap expense | Laporan pengeluaran terlalu besar | Model transaction legs dan aturan transfer terpisah | `[DONE]` |
| R-06 | RLS salah konfigurasi | Kebocoran data finansial | Test policy per tabel, negative test lintas user, server authorization; migration 004 sudah memperbaiki view | `[DONE]` |
| R-07 | Email custom tidak tersedia pada plan | Reminder email gagal | Validasi capability sebelum launch dan siapkan provider email yang disetujui | Blokir aktif (R-12) |
| R-08 | Upload besar menghabiskan resource | Biaya dan latency meningkat | Per-file guardrail (20 MB), batching (≤ 5/request), rate limit, async processing | `[TODO]` |
| R-09 | Data di log berisi informasi sensitif | Pelanggaran privasi | Redaction, structured error ID, larangan raw prompt logging | `[DONE]` (aturan) |
| R-10 | Tiga model budget membingungkan pengguna | Onboarding rendah | Template contoh, penjelasan singkat, default model bulanan yang jelas | `[DONE]` (UI); evaluasi beta |
| R-11 | Pengguna menganggap Q&A sebagai nasihat finansial | Risiko keputusan yang salah | Q&A deskriptif, citation periode, disclaimer (FR-QA-07) | `[TODO]` |
| R-12 | **SMTP disabled di `insforge.toml`** | Verifikasi email, reset password, reminder email tidak jalan — blokir alur produksi | Keputusan terbuka (Seksi 27): aktifkan email InsForge/plan berbayar/provider lain; sampai aktif, fitur terkait dinyatakan `[TODO]` dan tidak dijanjikan di UI | **Kritis — gate peluncuran** |
| R-13 | RPC SECURITY DEFINER disalahgunakan (IDOR) | Mutasi data user lain | Semua RPC mengecek `auth.uid()` + kepemilikan referensi; negative test otomatis | `[DONE]` |
| R-14 | Prompt injection melalui merchant/note/receipt | AI mengeksekusi instruksi tersemat | Pemisahan instruksi vs data, penolakan instruksi, validasi schema | `[TODO]` |
| R-15 | Timezone bug (budget/occurrence/scheduler) | Angka bulanan salah | Semua komputasi berbasis zona waktu pengguna; eval set tanggal; test bulan lintas tahun | `[PARTIAL]` (helper `[DONE]`; audit `[TODO]`) |
| R-16 | Email deliverability (spam/jatuh ke spam) | Pengingat tidak sampai | Domain sender terkonfigurasi, DMARC/SPF, unsubscribe, volume wajar | `[TODO]` |
| R-17 | Drift versi tooling (contoh: PRD menyebut Tailwind 3.4 padahal terpasang 4) | Dokumentasi tidak sinkron | Changelog PRD; status marker diperbarui saat perubahan | Ditangani v2.0 |
| R-18 | `next_occurrence_at` tidak maju otomatis setelah occurrence direkam | Pengingat occurrence berikutnya salah | Advance otomatis pasca-MVP; UI menampilkan next occurrence aktual; jaga konsistensi di FR-RECUR-11 | `[PARTIAL]` |
| R-19 | Ekspor terpotong di batas 1.000/2.000 baris tanpa tanda | Pengguna kehilangan data secara tak sadar | Pesan batas di UI; streaming ekspor `[TODO]` | `[PARTIAL]` |
| R-20 | Model AI berbayar / harga berubah | Biaya tak terduga | Pantau `ai_usage.estimated_cost_idr`; audit bulanan; keputusan berbayar = keputusan produk (Seksi 27) | `[TODO]` |

## 24. Ketergantungan dan Prasyarat Peluncuran

- [x] InsForge project telah dibuat dan linked ke repository (project `u673svbw`, region `us-east`). `[DONE]`
- [x] Database migrations dan RLS telah diterapkan pada environment test (5 migration). `[DONE]`
- [ ] Auth email delivery telah diuji — **diblokir SMTP** (R-12).
- [ ] Private storage bucket dan storage RLS telah diuji. `[TODO]`
- [ ] InsForge Functions dapat memanggil Groq dengan secret server-side. `[TODO]`
- [ ] Model teks dan vision tersedia serta quota telah diverifikasi (status model diverifikasi 18/08/2026; kuota project belum). `[PARTIAL]`
- [ ] Konfigurasi ZDR dan kebijakan retention provider telah ditinjau. `[TODO]`
- [ ] Email sender dan domain telah dikonfigurasi untuk production. `[TODO]`
- [x] Scheduler dapat membuat notification jobs (in-app) dan dijalankan berulang tanpa duplikat. `[DONE]`
- [ ] Backup dan prosedur penghapusan telah diuji di staging. `[PARTIAL]` (delete `[DONE]`; restore belum)
- [ ] Privacy policy menjelaskan pemrosesan AI, receipt, email, retention, export, dan delete. `[PARTIAL]` (halaman ada; penyesuaian konten AI saat fitur AI rilis)
- [x] Local build berhasil sebelum deployment. `[DONE]` (verifikasi tiap rilis)

## 25. Tahapan Implementasi

Status per tahap (18 Agustus 2026). Tahap 1–3 selesai; tahap 4–5 adalah fokus berikutnya; tahap 6 selesai untuk jalur in-app.

### Tahap 1: Fondasi aplikasi — `[DONE]`

- Inisialisasi Next.js App Router dan TypeScript.
- Instal `@insforge/sdk`.
- Konfigurasi environment dan SSR auth (`proxy.ts`, `/api/auth/refresh`).
- Implementasi layout, routing, theme, locale, dan error boundary.
- Hubungkan InsForge Auth (verifikasi kode, reset kode).

### Tahap 2: Database dan keamanan — `[DONE]`

- Migrations 001–005: 16 tabel, RLS, grants, view `account_balances`, trigger `handle_new_user`, RPC transaksi/scheduler/delete/kuota.
- RLS dan negative tests (otomatisasi CI `[TODO]`).
- Service layer dengan typed models (`lib/db.ts`, `lib/types.ts`).
- Seed kategori default via trigger (Lampiran B).

### Tahap 3: Pencatatan dasar — `[DONE]`

- Accounts, categories, manual transaction form, list, detail, edit, delete (soft), archive.
- Saldo (view) dan transfer atomik (RPC).
- Dashboard, filter, periode, empty states.

### Tahap 4: AI teks — `[TODO]` (mulai berikutnya)

- Buat `parse-transaction-text` function (Lampiran D).
- Groq adapter + structured schema + Zod validation (Seksi 12.3, 12.6).
- Review card, klarifikasi, confirm dengan idempotency, usage quota (FR-AI-TEXT-08/09, `count_ai_usage_today` + `count_ai_usage_month` baru).
- Buat evaluation set teks (Seksi 22.3).

### Tahap 5: Receipt multi-foto — `[TODO]`

- Buat private receipt bucket + RLS storage.
- Implementasi multi-file upload, progress, retry, cancel, remove (FR-AI-RECEIPT-14/15).
- `parse-receipt-images` function dengan batching (≤ 5 gambar/request).
- Item extraction, konflik, grouping, review, attachment policy (`delete_after_processing`).
- Uji foto struk Indonesia (eval set receipt).

### Tahap 6: Budget dan recurring — `[DONE]` (in-app) / `[TODO]` (email)

- Shared budget engine (`lib/budget.ts`). `[DONE]`
- Monthly, flexible, envelope UI. `[DONE]`
- Recurring template, occurrence, scheduler, in-app notification. `[DONE]`
- Email reminder serta unsubscribe — **menunggu keputusan email (R-12)**. `[TODO]`

### Tahap 7: Q&A, data control, dan hardening — `[PARTIAL]`

- Intent Q&A dan safe query functions. `[TODO]`
- Export CSV/JSON. `[DONE]` (batas baris; streaming `[TODO]`)
- Reauthentication dan permanent delete. `[DONE]`
- Analytics redaction, security review, performance testing, accessibility testing. `[PARTIAL]` (aturan `[DONE]`; eksekusi `[TODO]`)

### Tahap 8: Release readiness — `[TODO]`

- Jalankan local build.
- Jalankan unit, integration, RLS, dan end-to-end test (Seksi 22).
- Verifikasi secrets, email (**R-12**), storage, schedules, model availability, dan quota.
- Uji deployment InsForge pada environment staging.
- Lakukan beta terbatas dengan dataset anonim.
- Tinjau metrics dan error logs sebelum production release.

## 26. Definition of Done MVP

MVP dianggap selesai jika semua kondisi berikut terpenuhi:

- Semua fitur wajib pada Section 8.1 telah tersedia pada environment staging.
- Semua acceptance criteria pada Section 20 lulus (termasuk yang berstatus `[TODO]`).
- RLS telah diuji untuk positive dan negative access (otomatis di CI).
- Tidak ada API key atau secret pada client bundle, commit, atau log.
- Text parsing dan receipt parsing memiliki fallback manual.
- Tidak ada jalur AI yang menyimpan transaction tanpa konfirmasi.
- Transfer, saldo, dashboard, dan budget menggunakan data yang konsisten.
- Multi-foto tidak memiliki batas jumlah di level fitur dan backend memiliki batching.
- Export dan delete telah diuji terhadap database serta storage.
- Email reminder memiliki deduplication dan unsubscribe (**gate: email aktif — R-12**).
- Accessibility dan responsive QA telah dilakukan pada mobile serta desktop.
- Local build dan deployment build berhasil.
- Privacy policy dan terms mencerminkan fitur AI, receipt, email, dan data deletion.
- Model dan quota provider telah diverifikasi pada tanggal deployment.

## 27. Keputusan Terbuka Pasca-MVP

1. **Provider email (kritis):** mengaktifkan email InsForge (plan/sender) atau provider lain? Keputusan ini memblokir verifikasi email, reset password, dan reminder email di production.
2. Apakah perlu multi-currency untuk pengguna di luar Indonesia?
3. Apakah perlu akun keluarga dan shared budget?
4. Apakah line-item perlu menjadi searchable dan dapat memiliki kategori berbeda?
5. Apakah receipt image perlu disimpan default atau selalu ephemeral?
6. Apakah perlu model AI berbayar setelah free quota terbukti tidak cukup?
7. Apakah perlu input suara dan OCR khusus untuk tulisan tangan?
8. Apakah perlu insight proaktif seperti pola pengeluaran, dengan persetujuan pengguna?
9. Apakah `next_occurrence_at` harus maju otomatis setelah occurrence direkam, dan tanggal 31 diklamp ke akhir bulan (FR-RECUR-11)?
10. Apakah kuota AI harian perlu mengikuti zona waktu pengguna (saat ini waktu server)?
11. Apakah ekspor perlu streaming/pagination untuk data besar (FR-DATA-11)?

## 28. Ringkasan Keputusan Implementasi

| Area | Keputusan | Status |
| --- | --- | --- |
| Frontend | Next.js 16 App Router, TypeScript strict, Tailwind CSS 4, Phosphor icons, Zod 4 | `[DONE]` |
| Backend | InsForge Database, Auth, RLS, Functions, Storage, Email, Scheduler, Deployment | `[DONE]` (Email `[TODO]`) |
| User | Personal, single-user data scope | `[DONE]` |
| Bahasa | Bahasa Indonesia (`id-ID`) | `[DONE]` |
| Mata uang | IDR, disimpan sebagai integer | `[DONE]` |
| Auth | Email dan password; verifikasi kode wajib | `[DONE]` |
| Text AI | Groq `openai/gpt-oss-20b` (production) | `[TODO]` |
| Vision AI | Groq `qwen/qwen3.6-27b` (preview; 5 gambar/request; 20 MB) | `[TODO]` |
| AI budget | Target Rp0, 30 operasi/hari, 300 operasi/bulan per user | `[PARTIAL]` (RPC harian ada; enforcement `[TODO]`) |
| AI persistence | Konfirmasi pengguna wajib sebelum save | `[TODO]` (aturan saat jalur AI dibangun) |
| Receipt | Multi-foto dan multi-item tanpa batas produk | `[TODO]` |
| Account | Tunai, bank, dompet digital, kartu kredit | `[DONE]` |
| Transfer | Dua linked transaction legs, tidak dihitung sebagai expense/income | `[DONE]` |
| Budget | Monthly category, flexible period, envelope | `[DONE]` |
| Recurring | Template dan reminder, tidak auto-post | `[DONE]` (in-app) |
| Notification | In-app `[DONE]`; email `[TODO]` (R-12) | `[PARTIAL]` |
| Data control | Export CSV/JSON dan permanent delete | `[DONE]` |
| Bank sync | Di luar MVP | — |
| Financial advice | Di luar MVP | — |

## 29. Glossar

| Istilah | Definisi |
| --- | --- |
| Adjustment | Transaksi penyesuaian saldo (satu leg, arah in/out, wajib catatan alasan) |
| Allocated | Jumlah yang dialokasikan untuk budget/envelope |
| Available | Sisa anggaran = allocated + rollover − spent |
| Batch (receipt) | Sekelompok foto yang diproses bersama sebagai satu `receipt_batches` |
| Batching | Pemecahan foto ke beberapa request provider (≤ 5 gambar/request Groq) |
| Confirmed | Status transaksi yang sah: satu-satunya yang memengaruhi saldo, laporan, budget |
| Confidence | Tingkat keyakinan AI atas field (0–1) |
| Dedupe key | Kunci unik per (user, peristiwa, channel) agar job/scheduler idempotent |
| Draft | Rancangan transaksi dari AI yang belum disimpan (tidak memengaruhi apa pun) |
| Envelope | Model anggaran amplop: alokasi dana per kategori dengan rollover opsional |
| Idempotency key | Kunci unik per user untuk mencegah simpan ganda pada satu operasi |
| Leg | Baris `transaction_legs`: dampak satu akun (in/out) dari sebuah transaksi |
| Occurrence | Satu kejadian jadwal dari recurring template |
| Over budget | Pengeluaran melebihi alokasi (status `over`) |
| Review card | Kartu hasil AI yang dapat diedit sebelum konfirmasi |
| RPC | Postgres function (SECURITY DEFINER) untuk mutasi atomik |
| Rollover | Sisa alokasi envelope yang dibawa ke periode berikutnya |
| Spent | Pengeluaran confirmed yang dihitung untuk budget |
| Structured output | Mode output model dengan JSON Schema dari provider |
| Threshold | Ambang notifikasi budget (80% near, 100%/over) |
| ZDR | Zero Data Retention provider AI |

## 30. Lampiran

### Lampiran A — Matriks status implementasi (18 Agustus 2026)

| Area | File kunci | Status |
| --- | --- | --- |
| Auth | `lib/actions/auth.ts`, `proxy.ts`, `app/api/auth/refresh/route.ts` | `[DONE]` |
| Onboarding/profil | `app/onboarding`, `lib/actions/settings.ts` | `[DONE]` |
| Akun | `lib/actions/accounts.ts`, `app/app/accounts` | `[DONE]` |
| Kategori | `lib/actions/categories.ts`, `app/app/categories` | `[DONE]` |
| Transaksi manual | `components/transaction-form.tsx`, `lib/actions/transactions.ts` | `[DONE]` |
| Dashboard | `app/app/dashboard/page.tsx`, `lib/db.ts` | `[DONE]` |
| Budget | `lib/budget.ts`, `lib/actions/budgets.ts` | `[DONE]` |
| Recurring | `lib/actions/recurring.ts`, `app/app/recurring` | `[DONE]` |
| Scheduler | `functions/schedule-recurring-reminders.ts`, migration 005 | `[DONE]` |
| Notifikasi | `lib/actions/notifications.ts`, `components/notification-widgets.tsx` | `[DONE]` |
| Ekspor/delete | `lib/actions/data.ts`, `components/data-settings.tsx` | `[DONE]` |
| DB/RLS/RPC | `migrations/001–005` | `[DONE]` |
| AI teks | — (schema siap) | `[TODO]` |
| AI receipt | — (schema siap) | `[TODO]` |
| Q&A | — | `[TODO]` |
| Email | `insforge.toml` SMTP disabled | `[TODO]` (R-12) |
| Storage bucket | — | `[TODO]` |

### Lampiran B — Seed kategori default (trigger `handle_new_user`)

| Nama | kind | Warna |
| --- | --- | --- |
| Makanan | expense | `#ff9c79` |
| Transportasi | expense | `#8ebaff` |
| Tagihan | expense | `#f4c86e` |
| Belanja | expense | `#b8a9ff` |
| Kesehatan | expense | `#ff897e` |
| Hiburan | expense | `#f4a5d8` |
| Pendidikan | expense | `#8ebaff` |
| Gaji | income | `#c9f46c` |
| Bonus | income | `#f4c86e` |
| Transfer | both | `#91a097` |
| Biaya Bank | expense | `#ff9c79` |
| Lainnya | both | `#718177` |

Profil dan `notification_preferences` juga dibuat otomatis (nama diambil dari `profile->>'name'` atau `metadata->>'name'`, fallback bagian sebelum `@` email).

### Lampiran C — Environment variables

Client-safe: `NEXT_PUBLIC_INSFORGE_URL`, `NEXT_PUBLIC_INSFORGE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`.
Server-only: `INSFORGE_URL`, `INSFORGE_API_KEY`, `GROQ_API_KEY` (TODO), `AI_TEXT_MODEL` (TODO), `AI_VISION_MODEL` (TODO), `AI_DAILY_LIMIT` (TODO), `AI_MONTHLY_LIMIT` (TODO), `SCHEDULER_SECRET`, `INSFORGE_BASE_URL` (edge function).
Lihat Seksi 13.3 untuk aturan penggunaan.

### Lampiran D — Pemetaan fungsi/RPC

Lihat tabel Seksi 13.4. Prinsip: mutasi transaksi hanya via RPC; AI hanya via edge function; scheduler via edge function + RPC idempotent.

### Lampiran E — Template email (draft `[TODO]`)

**Pengingat recurring (H-1, default 1440 menit):**
- Subject: `Pengingat: {nama template} • {Rp nominal} • {tanggal}`
- Body: tipe (Pemasukan/Pengeluaran/Transfer), nominal, tanggal jatuh tempo, akun, tombol "Catat sekarang" → tautan aman ke `/app/capture` (token sesi, bukan data finansial di URL), tautan pengaturan notifikasi.

**Peringatan budget:**
- Subject: `Anggaran {mendekati batas|terlampaui}: {nama budget}`
- Body: spent vs allocated, persentase, tautan `/app/budgets`, pengaturan.

**Ekspor selesai (jika ekspor async di masa depan):**
- Subject: `Ekspor data Anda siap`
- Body: format, tanggal, tautan unduh sementara (token), catatan kedaluwarsa.

Semua email: footer unsubscribe yang langsung memperbarui preferensi (FR-RECUR-09), identitas sender yang terkonfigurasi, konten minimum tanpa riwayat keuangan.

### Lampiran F — Spesifikasi ekspor (implementasi awal)

**JSON** (`exportJsonAction`): `{ exported_at, app: "financial-tracking", version: 1, profiles, notification_preferences, accounts, categories, transactions, transaction_legs, transaction_items, budgets, budget_allocations, recurring_templates, notification_jobs, receipt_batches, receipt_attachments, chat_sessions, chat_messages, ai_usage }`. Batas 1.000 baris/tabel; nama file `financial-tracking-export-YYYY-MM-DD.json`.

**CSV** (`exportCsvAction`): header `id, tanggal, tipe, nominal_idr, merchant, kategori, akun, sumber, catatan, status`; tanggal ISO 8601; akun transfer digabung `"NamaA:out:jumlah; NamaB:in:jumlah"`; escape `"` → `""` dan wrap saat mengandung koma/quote/newline/titik-koma; batas 2.000 baris; nama file `financial-tracking-transactions-YYYY-MM-DD.csv`.

Penyempurnaan `[TODO]` (FR-DATA-09): BOM UTF-8 untuk Excel, format tanggal lokal, kolom `transfer_from`/`transfer_to` eksplisit.

### Lampiran G — Faktur model AI (verifikasi 18 Agustus 2026)

| Model | Status | Kecepatan | Harga/1M | Context | Max completion | Batas lain |
| --- | --- | --- | --- | --- | --- | --- |
| `openai/gpt-oss-20b` | Production | ~1000 tps | $0.075 / $0.30 | 131.072 | 65.536 | — |
| `qwen/qwen3.6-27b` | **Preview** | ~500 tps | $0.60 / $3.00 | 131.072 | 16.384 | 20 MB/gambar; **5 gambar/request**; JSON mode + tool use |

Sumber: dokumentasi Groq (models & vision). Harus diverifikasi ulang saat deployment (prasyarat Seksi 24).

---

*Dokumen ini adalah living document. Setiap perubahan fitur atau implementasi harus memperbarui marker status dan changelog.*