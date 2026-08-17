# PRD: Aplikasi Pelacakan Keuangan dengan AI

**Nama kerja:** Financial Tracking AI  
**Status:** Draft MVP disetujui untuk implementasi  
**Versi:** 1.0  
**Tanggal:** 17 Agustus 2026  
**Target platform:** Web responsif, desktop dan mobile  
**Bahasa utama:** Bahasa Indonesia  
**Mata uang awal:** Rupiah Indonesia (IDR)  
**Target pengguna:** Pengguna personal, satu akun untuk satu pemilik data  

## 1. Ringkasan Eksekutif

Financial Tracking AI adalah aplikasi web untuk membantu pengguna mencatat dan memahami keuangan personal tanpa harus mengisi formulir panjang. Pengguna dapat mencatat transaksi melalui percakapan Bahasa Indonesia, formulir manual, atau upload satu maupun banyak foto struk belanja.

AI mengubah pesan atau foto menjadi rancangan transaksi terstruktur. Data tidak boleh disimpan otomatis. Pengguna harus meninjau dan mengonfirmasi hasil AI terlebih dahulu. Aplikasi kemudian menyediakan dashboard, akun keuangan manual, tiga model anggaran, transaksi berulang, pengingat dalam aplikasi dan email, ekspor data, serta penghapusan permanen.

MVP menggunakan Next.js untuk frontend dan InsForge untuk authentication, database, row-level security, storage, server-side functions, email, scheduled jobs, serta deployment. AI dipanggil dari InsForge Function agar API key tidak pernah dikirim ke browser.

## 2. Masalah yang Ingin Diselesaikan

Pengguna personal sering mengetahui bahwa pencatatan keuangan penting, tetapi berhenti karena prosesnya memakan waktu dan terasa administratif. Masalah utama yang ingin diselesaikan:

- Mencatat transaksi secara manual membutuhkan terlalu banyak langkah.
- Pengguna sering memiliki data transaksi dalam bentuk percakapan atau foto struk.
- Kesalahan memasukkan nominal, tanggal, kategori, dan akun membuat laporan tidak dapat dipercaya.
- Pengguna sulit melihat hubungan antara transaksi, saldo akun, anggaran, dan pengeluaran berulang.
- Banyak aplikasi keuangan memerlukan integrasi bank yang kompleks sebelum memberikan manfaat dasar.
- Pengguna membutuhkan kontrol penuh untuk meninjau, mengekspor, dan menghapus data keuangan.

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

Target berikut digunakan untuk evaluasi beta dan dapat disesuaikan setelah data penggunaan nyata tersedia:

| Metrik | Target awal |
| --- | --- |
| Pengguna baru membuat transaksi pertama | Minimal 60% dalam 10 menit setelah onboarding |
| Field wajib transaksi teks benar setelah konfirmasi | Minimal 90% pada dataset evaluasi Bahasa Indonesia |
| Total struk benar atau dikoreksi sebelum simpan | Minimal 90% pada dataset evaluasi struk yang terbaca |
| Transaksi AI berhasil menghasilkan review card | Minimal 95% dari request yang tidak melebihi kuota |
| Pengguna menyelesaikan konfirmasi hasil AI | Minimal 70% dari review card yang ditampilkan |
| P95 waktu parsing teks | Maksimal 5 detik |
| P95 waktu parsing foto | Maksimal 20 detik untuk satu batch normal |
| Transaksi yang dibuat ulang atau hilang akibat error | 0; operasi penyimpanan harus idempotent |
| Pengiriman email pengingat berhasil | Minimal 95% dari email yang valid dan disetujui pengguna |
| Akses lintas pengguna akibat kesalahan RLS | 0 |

## 6. Pengguna Sasaran

### 6.1 Persona utama: Pengguna personal

Pengguna ingin mengetahui ke mana uangnya pergi, tetapi tidak ingin menggunakan spreadsheet atau input yang rumit. Pengguna memiliki kombinasi rekening bank, uang tunai, dompet digital, dan mungkin kartu kredit. Pengguna bisa mengetik dalam Bahasa Indonesia dan sering mendapatkan transaksi dari struk.

### 6.2 Kebutuhan persona

- Dapat mencatat transaksi dalam satu kalimat.
- Dapat mengupload banyak foto untuk struk panjang atau struk dari beberapa sisi.
- Dapat memperbaiki hasil AI dengan cepat.
- Dapat melihat saldo per akun dan total pengeluaran.
- Dapat mengatur anggaran sesuai cara yang digunakan.
- Dapat menerima pengingat tanpa harus membuka aplikasi setiap hari.
- Dapat mengambil atau menghapus semua datanya kapan saja.

### 6.3 Hal yang tidak diasumsikan

- Pengguna tidak harus menghubungkan rekening bank.
- Pengguna tidak harus memahami akuntansi berpasangan.
- Pengguna tidak harus memiliki lebih dari satu akun keuangan.
- Pengguna tidak boleh dipaksa memakai AI untuk membuat transaksi.

## 7. Keputusan Produk yang Sudah Ditetapkan

- Sasaran awal adalah pengguna personal, bukan akun keluarga atau tim.
- UI dan AI memprioritaskan Bahasa Indonesia.
- Mata uang awal adalah IDR.
- Authentication menggunakan email dan password.
- Input transaksi mencakup chat, formulir manual, dan foto struk.
- AI selalu meminta konfirmasi sebelum transaksi disimpan.
- Pengguna dapat mengupload banyak foto tanpa batas jumlah di level fitur.
- Backend memproses banyak foto dalam beberapa batch jika provider memiliki batas per request.
- Akun keuangan dibuat dan diperbarui secara manual; tidak ada bank sync pada MVP.
- Tiga model anggaran wajib tersedia saat peluncuran MVP.
- Transaksi berulang menggunakan template dan pengingat; tidak melakukan posting otomatis.
- AI chat mendukung pencatatan transaksi dan pertanyaan finansial read-only.
- Pengguna dapat mengekspor data dan menghapusnya secara permanen.
- Pengingat tersedia dalam aplikasi dan melalui email.
- Target biaya provider AI pada MVP adalah Rp0 menggunakan free quota.

## 8. Ruang Lingkup MVP

### 8.1 Fitur yang wajib ada

- Landing page dan authentication.
- Onboarding profil, locale, mata uang, dan zona waktu.
- Dashboard ringkasan keuangan.
- CRUD akun keuangan manual.
- CRUD kategori transaksi.
- CRUD transaksi manual.
- Pencatatan transaksi melalui chat teks.
- Pencatatan transaksi melalui banyak foto struk.
- Review dan konfirmasi hasil AI.
- Edit, hapus, dan arsip transaksi.
- Pendapatan, pengeluaran, transfer, dan penyesuaian saldo.
- Tiga model anggaran.
- Template transaksi berulang.
- Pengingat in-app dan email.
- Pertanyaan finansial read-only berdasarkan data pengguna.
- Ekspor CSV dan JSON.
- Penghapusan permanen data pengguna.
- Pengaturan privasi, notifikasi, dan batas penggunaan AI.

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

## 9. User Stories

| ID | Sebagai | Saya ingin | Agar |
| --- | --- | --- | --- |
| US-01 | Pengguna baru | Membuat akun dengan email dan password | Saya dapat memiliki ruang data pribadi |
| US-02 | Pengguna | Menetapkan zona waktu dan mata uang IDR | Format waktu dan nominal sesuai kebiasaan saya |
| US-03 | Pengguna | Membuat akun tunai, bank, dompet digital, atau kartu kredit | Saldo saya dapat dipisahkan dengan benar |
| US-04 | Pengguna | Menulis "makan siang 45 ribu di warteg dari BCA hari ini" | Transaksi dapat dipersiapkan tanpa formulir panjang |
| US-05 | Pengguna | Mengupload banyak foto struk | Struk panjang atau beberapa sisi dapat diproses bersama |
| US-06 | Pengguna | Meninjau hasil parsing AI | Saya dapat mencegah kesalahan sebelum penyimpanan |
| US-07 | Pengguna | Menggunakan formulir manual | Saya tetap dapat mencatat saat AI gagal |
| US-08 | Pengguna | Mencatat transfer antar akun | Saldo akun tidak menghitung transfer sebagai pengeluaran |
| US-09 | Pengguna | Mengatur budget bulanan, fleksibel, dan envelope | Saya dapat memakai metode penganggaran yang sesuai |
| US-10 | Pengguna | Membuat template transaksi berulang | Saya tidak perlu mengingat tagihan rutin |
| US-11 | Pengguna | Menerima pengingat di aplikasi dan email | Saya dapat mengonfirmasi transaksi tepat waktu |
| US-12 | Pengguna | Bertanya tentang pengeluaran saya | Saya dapat memahami data tanpa menghitung manual |
| US-13 | Pengguna | Mengekspor data | Saya memiliki salinan yang dapat digunakan di luar aplikasi |
| US-14 | Pengguna | Menghapus semua data secara permanen | Saya memiliki kontrol penuh atas informasi finansial |

## 10. Alur Pengguna Utama

### 10.1 Onboarding

1. Pengguna membuka landing page.
2. Pengguna mendaftar dengan email dan password.
3. Sistem memverifikasi email jika konfigurasi authentication mewajibkannya.
4. Pengguna memilih nama tampilan, zona waktu, dan preferensi bahasa.
5. Sistem menetapkan IDR sebagai mata uang dasar awal.
6. Pengguna dapat langsung membuat akun pertama.
7. Sistem menampilkan contoh input chat dan formulir manual.

### 10.2 Mencatat transaksi melalui chat

1. Pengguna membuka halaman Catat atau panel chat.
2. Pengguna menulis pesan dalam Bahasa Indonesia.
3. Sistem mengirim teks ke InsForge Function.
4. Function memanggil model teks dengan schema transaksi.
5. Sistem memvalidasi JSON dan mencocokkan akun serta kategori milik pengguna.
6. Jika field wajib hilang atau ambigu, AI meminta klarifikasi.
7. Sistem menampilkan review card berisi nominal, tipe, akun, tanggal, kategori, merchant, dan catatan.
8. Pengguna mengedit field jika perlu.
9. Pengguna memilih Konfirmasi dan Simpan atau Batal.
10. Backend menyimpan transaksi secara idempotent.
11. Chat menampilkan hasil penyimpanan dan tautan ke detail transaksi.

### 10.3 Mencatat transaksi dari banyak foto struk

1. Pengguna memilih Upload Foto Struk.
2. Pengguna dapat memilih banyak gambar dan menambah gambar berikutnya kapan saja.
3. Client melakukan pemeriksaan tipe file, ukuran file, dan integritas file.
4. Gambar dikirim ke private InsForge Storage dengan path milik pengguna.
5. Sistem membuat satu receipt batch dan mempertahankan urutan upload.
6. InsForge Function memproses gambar dalam batch provider secara otomatis.
7. Model vision membaca merchant, tanggal, total, pajak, diskon, metode pembayaran, dan item struk jika tersedia.
8. Backend menggabungkan hasil antar-gambar dan mendeteksi kemungkinan duplikasi.
9. Sistem menandai field yang tidak terbaca, konflik antar-foto, atau total yang tidak konsisten.
10. Sistem menampilkan review transaksi dan daftar item hasil ekstraksi.
11. Pengguna dapat menggabungkan, menghapus, atau memperbaiki item dan field transaksi.
12. Pengguna memilih Simpan untuk membuat satu atau beberapa transaksi.
13. Foto disimpan sebagai lampiran privat hanya jika pengguna memilih menyimpannya; jika tidak, file mentah dihapus setelah proses selesai.

### 10.4 Mencatat transaksi manual

1. Pengguna memilih Tambah Transaksi.
2. Pengguna memilih tipe pendapatan, pengeluaran, transfer, atau penyesuaian.
3. Pengguna mengisi nominal, akun, tanggal, kategori bila relevan, merchant, dan catatan.
4. Sistem memvalidasi field dan menampilkan ringkasan.
5. Pengguna menyimpan transaksi.

### 10.5 Transfer antar-akun

1. Pengguna memilih tipe Transfer.
2. Pengguna memilih akun sumber dan akun tujuan.
3. Pengguna memasukkan nominal, tanggal, dan catatan.
4. Sistem menolak akun sumber dan tujuan yang sama.
5. Backend membuat satu transaksi logis dengan dua legs yang saling terhubung.
6. Saldo akun sumber berkurang dan saldo akun tujuan bertambah.
7. Transfer tidak masuk ke total pendapatan atau pengeluaran.
8. Edit dan hapus transfer dilakukan secara atomik pada kedua legs.

### 10.6 Anggaran

1. Pengguna membuka halaman Anggaran.
2. Pengguna memilih salah satu dari tiga model anggaran.
3. Pengguna memilih kategori, periode, nominal, dan preferensi notifikasi.
4. Sistem menghitung penggunaan dari transaksi pengeluaran yang telah dikonfirmasi.
5. Sistem menampilkan allocated, spent, available, dan persentase penggunaan sesuai model.
6. Sistem mengirim peringatan pada ambang yang diaktifkan pengguna.

### 10.7 Transaksi berulang

1. Pengguna membuat template dengan tipe, nominal, akun, kategori, jadwal, dan tanggal mulai.
2. Pengguna memilih pengingat dalam aplikasi, email, atau keduanya.
3. Scheduler membuat notifikasi untuk occurrence yang akan datang.
4. Pengguna menerima pengingat sesuai zona waktu.
5. Pengguna memilih Konfirmasi dan Simpan untuk membuat transaksi aktual.
6. Sistem tidak membuat transaksi aktual secara diam-diam.

### 10.8 Pertanyaan finansial read-only

1. Pengguna menulis pertanyaan seperti "Berapa pengeluaran makan saya bulan ini?".
2. InsForge Function menentukan intent dan parameter terstruktur.
3. Backend menjalankan query terparameterisasi yang telah diizinkan.
4. Sistem mengirim hasil agregat minimal ke model untuk dirangkum dalam Bahasa Indonesia.
5. Jawaban menampilkan periode, filter, sumber perhitungan, dan data kosong jika tidak ada hasil.
6. AI tidak boleh membuat, mengedit, atau menghapus data dari jalur Q&A.

### 10.9 Ekspor dan penghapusan data

1. Pengguna membuka Pengaturan dan memilih Data Saya.
2. Pengguna dapat meminta ekspor CSV atau JSON.
3. Sistem membuat file ekspor dengan semua entitas milik pengguna.
4. Pengguna dapat mengunduh file dan lampiran yang dipilih.
5. Untuk penghapusan, sistem meminta login ulang atau konfirmasi password.
6. Pengguna mengetik `HAPUS DATA SAYA` sebagai konfirmasi.
7. Sistem menghapus data database, storage, sesi, notifikasi, dan riwayat chat milik pengguna.
8. Sistem membatalkan scheduler dan token pengiriman email terkait.
9. Sistem mengeluarkan pengguna dari semua sesi.

## 11. Persyaratan Fungsional

### 11.1 Authentication dan akun pengguna

**FR-AUTH-01** Sistem harus menyediakan pendaftaran dengan email dan password.

**FR-AUTH-02** Sistem harus menyediakan login, logout, reset password, dan refresh session.

**FR-AUTH-03** Halaman aplikasi yang berisi data finansial harus memerlukan session pengguna yang valid.

**FR-AUTH-04** Setiap record data aplikasi harus memiliki `user_id` dan tidak boleh dibaca atau dimutasi oleh pengguna lain.

**FR-AUTH-05** Sistem harus mendukung penghapusan akun dan seluruh data pengguna melalui alur yang terkonfirmasi.

**FR-AUTH-06** Session browser Next.js harus menggunakan helper SSR InsForge agar refresh token tidak disimpan di tempat yang dapat dibaca JavaScript.

### 11.2 Onboarding dan lokalitas

**FR-LOC-01** UI utama harus tersedia dalam Bahasa Indonesia.

**FR-LOC-02** Format nominal default harus menggunakan `id-ID`, misalnya `Rp1.234.567`, tanpa desimal untuk transaksi IDR.

**FR-LOC-03** Nilai uang disimpan sebagai integer rupiah, bukan floating point.

**FR-LOC-04** Zona waktu default adalah `Asia/Jakarta` dan dapat diubah pengguna.

**FR-LOC-05** Tanggal alami seperti "kemarin", "tanggal 5", atau "awal bulan" harus dikonversi berdasarkan zona waktu pengguna dan ditampilkan kembali untuk konfirmasi.

### 11.3 Akun keuangan

**FR-ACCOUNT-01** Sistem harus menyediakan tipe akun Tunai, Rekening Bank, Dompet Digital, dan Kartu Kredit.

**FR-ACCOUNT-02** Pengguna dapat membuat nama akun, tipe akun, saldo awal, tanggal saldo awal, warna atau ikon, dan status aktif.

**FR-ACCOUNT-03** Saldo berjalan harus dihitung dari saldo awal dan transaction legs yang sudah dikonfirmasi.

**FR-ACCOUNT-04** Sistem tidak boleh mengubah saldo berjalan secara langsung tanpa membuat transaction adjustment.

**FR-ACCOUNT-05** Pengguna dapat mengarsipkan akun. Akun yang memiliki transaksi tidak dapat dihapus langsung.

**FR-ACCOUNT-06** Akun kartu kredit harus diperlakukan sebagai liability. Pembelian meningkatkan saldo terutang, sedangkan pembayaran kartu adalah transfer dari akun sumber ke kartu kredit.

**FR-ACCOUNT-07** Sistem harus menampilkan peringatan ketika transaksi keluar melebihi saldo akun, tetapi tidak memblokirnya secara otomatis karena overdraft dan saldo kartu kredit dapat valid.

**FR-ACCOUNT-08** MVP hanya mendukung IDR dan tidak mendukung konversi mata uang.

### 11.4 Kategori

**FR-CATEGORY-01** Sistem harus membuat kategori default saat onboarding.

**FR-CATEGORY-02** Pengguna dapat membuat, mengubah nama, mengarsipkan, dan memilih warna kategori.

**FR-CATEGORY-03** Kategori yang dipakai transaksi atau anggaran tidak boleh dihapus secara destruktif; kategori dapat diarsipkan atau diganti.

**FR-CATEGORY-04** Kategori default minimal mencakup Makanan, Transportasi, Tagihan, Belanja, Kesehatan, Hiburan, Pendidikan, Gaji, Bonus, Transfer, Biaya Bank, dan Lainnya.

**FR-CATEGORY-05** Transfer tidak boleh membutuhkan kategori pengeluaran atau pendapatan.

### 11.5 Transaksi

**FR-TX-01** Sistem harus mendukung tipe Income, Expense, Transfer, dan Adjustment.

**FR-TX-02** Transaksi Expense harus memiliki nominal, akun, tanggal, dan kategori.

**FR-TX-03** Transaksi Income harus memiliki nominal, akun, tanggal, dan kategori pendapatan bila tersedia.

**FR-TX-04** Transaksi Transfer harus memiliki akun sumber, akun tujuan, nominal, dan tanggal.

**FR-TX-05** Nominal transaksi harus lebih besar dari nol dan disimpan dalam integer IDR.

**FR-TX-06** Pengguna dapat menambahkan merchant, catatan, label sumber, dan lampiran.

**FR-TX-07** Sistem harus menyimpan sumber transaksi sebagai Manual, Chat, Receipt, Recurring, atau Adjustment.

**FR-TX-08** Pengguna dapat mencari dan memfilter transaksi berdasarkan periode, tipe, akun, kategori, merchant, sumber, dan nominal.

**FR-TX-09** Pengguna dapat mengedit dan menghapus transaksi. Edit atau hapus transfer harus mengubah seluruh legs terkait secara atomik.

**FR-TX-10** Hanya transaksi berstatus Confirmed yang boleh memengaruhi saldo, laporan, dan anggaran.

**FR-TX-11** Sistem harus memiliki mekanisme idempotency key untuk mencegah transaksi ganda ketika pengguna mengklik simpan ulang atau request diulang.

### 11.6 AI chat untuk transaksi teks

**FR-AI-TEXT-01** Pengguna dapat mengirim teks Bahasa Indonesia untuk membuat draft transaksi.

**FR-AI-TEXT-02** AI harus mengembalikan schema terstruktur yang memuat tipe transaksi, nominal, tanggal, akun kandidat, kategori kandidat, merchant, catatan, confidence, dan daftar field yang membutuhkan klarifikasi.

**FR-AI-TEXT-03** AI tidak boleh menyimpan transaksi secara langsung.

**FR-AI-TEXT-04** Sistem harus mencocokkan nama akun dan kategori AI dengan entitas milik pengguna. Nama yang tidak cocok harus menjadi kandidat yang perlu dipilih, bukan foreign key yang ditebak.

**FR-AI-TEXT-05** Jika nominal, tanggal, akun, atau tipe tidak dapat dipastikan, sistem harus meminta klarifikasi sebelum menampilkan tombol simpan.

**FR-AI-TEXT-06** Sistem harus menampilkan teks sumber atau ringkasan interpretasi agar pengguna dapat membandingkan input dan hasil.

**FR-AI-TEXT-07** Sistem harus menggunakan structured JSON Schema untuk model teks jika model yang dipilih mendukungnya, lalu memvalidasi ulang dengan schema runtime.

### 11.7 AI receipt dan banyak foto

**FR-AI-RECEIPT-01** Pengguna dapat mengupload satu maupun banyak foto struk untuk satu receipt batch tanpa batas jumlah pada level fitur.

**FR-AI-RECEIPT-02** Sistem harus menerima format gambar umum seperti JPEG, PNG, dan WebP dengan pemeriksaan MIME type dan file signature.

**FR-AI-RECEIPT-03** Per file tetap memiliki batas keamanan dan operasional maksimum 20 MB. Batas ini bukan batas jumlah foto pada level produk.

**FR-AI-RECEIPT-04** Backend harus membagi foto secara otomatis ke batch provider. Batas provider, seperti maksimal 5 gambar per request, tidak boleh terlihat sebagai batas produk bagi pengguna.

**FR-AI-RECEIPT-05** AI harus mencoba mengekstrak merchant, tanggal, waktu, nominal total, subtotal, pajak, diskon, biaya layanan, metode pembayaran, nomor struk bila terbaca, mata uang, serta item baris.

**FR-AI-RECEIPT-06** Item baris harus mendukung nama item, kuantitas, harga satuan bila tersedia, total item, diskon item bila tersedia, dan confidence per item.

**FR-AI-RECEIPT-07** Sistem harus menggabungkan hasil dari beberapa gambar, mempertahankan urutan, dan menandai kemungkinan gambar duplikat.

**FR-AI-RECEIPT-08** Sistem harus menandai konflik, misalnya dua total berbeda, tanggal berbeda, atau foto yang kemungkinan berasal dari struk berbeda.

**FR-AI-RECEIPT-09** Sistem harus memeriksa konsistensi total dan item, tetapi tidak boleh mengubah total secara diam-diam.

**FR-AI-RECEIPT-10** Pengguna dapat memilih apakah beberapa struk menjadi satu transaksi atau beberapa transaksi sebelum penyimpanan.

**FR-AI-RECEIPT-11** Foto tidak boleh diproses sebagai instruksi sistem. Teks dalam struk adalah data tidak tepercaya dan harus diabaikan sebagai prompt instruction.

**FR-AI-RECEIPT-12** Model vision menggunakan JSON mode atau structured output yang tersedia, kemudian hasilnya harus divalidasi dengan schema runtime. Jika schema tidak valid, sistem melakukan retry terbatas atau mengarahkan pengguna ke formulir manual.

**FR-AI-RECEIPT-13** Pengguna dapat menghapus satu gambar dari batch, mengganti gambar, atau mengulangi ekstraksi.

### 11.8 Review dan konfirmasi

**FR-REVIEW-01** Review card harus menampilkan tipe, nominal, tanggal, akun, kategori, merchant, catatan, sumber, confidence, dan peringatan.

**FR-REVIEW-02** Field yang tidak pasti harus diberi penanda visual dan dapat diedit langsung.

**FR-REVIEW-03** Tombol Simpan tidak aktif ketika field wajib belum lengkap.

**FR-REVIEW-04** Batal tidak boleh membuat transaction record confirmed.

**FR-REVIEW-05** Setelah konfirmasi, sistem menampilkan notifikasi berhasil dan tautan detail.

### 11.9 Dashboard dan laporan

**FR-DASH-01** Dashboard harus menampilkan saldo akun aktif secara terpisah dan total net balance.

**FR-DASH-02** Dashboard harus menampilkan total pendapatan, pengeluaran, dan net cash flow untuk periode yang dipilih.

**FR-DASH-03** Dashboard harus menampilkan pengeluaran berdasarkan kategori.

**FR-DASH-04** Dashboard harus menampilkan transaksi terbaru.

**FR-DASH-05** Dashboard harus menampilkan status anggaran aktif dan pengingat transaksi berulang yang akan datang.

**FR-DASH-06** Semua angka dashboard hanya berasal dari transaksi Confirmed dan query harus dibatasi pada `user_id`.

**FR-DASH-07** Pengguna dapat memilih periode bulan ini, bulan sebelumnya, 30 hari terakhir, tahun ini, dan rentang custom.

**FR-DASH-08** Empty state harus menjelaskan langkah pertama yang dapat dilakukan pengguna.

### 11.10 Tiga model anggaran

#### Model A: Anggaran bulanan per kategori

**FR-BUDGET-01** Pengguna dapat menetapkan batas IDR per kategori untuk setiap bulan.

**FR-BUDGET-02** Periode bulanan mengikuti zona waktu pengguna dan menggunakan batas awal serta akhir bulan lokal.

**FR-BUDGET-03** Sistem menampilkan target, spent, remaining, dan persentase penggunaan.

**FR-BUDGET-04** Transaksi transfer tidak dihitung sebagai spent.

#### Model B: Anggaran rentang fleksibel

**FR-BUDGET-05** Pengguna dapat membuat budget dengan tanggal mulai dan tanggal akhir custom.

**FR-BUDGET-06** Sistem menolak rentang dengan tanggal akhir sebelum tanggal mulai.

**FR-BUDGET-07** Sistem menampilkan transaksi yang masuk dalam rentang berdasarkan tanggal transaksi lokal.

**FR-BUDGET-08** Sistem memberi peringatan jika budget kategori dan periode yang sama tumpang tindih secara ambigu.

#### Model C: Envelope budgeting

**FR-BUDGET-09** Pengguna dapat membuat envelope kategori dan menetapkan allocated amount.

**FR-BUDGET-10** Sistem menghitung available sebagai allocated ditambah rollover dikurangi spent.

**FR-BUDGET-11** Pengguna dapat memindahkan alokasi antar-envelope dalam periode yang sama dengan catatan perubahan.

**FR-BUDGET-12** Pengguna dapat mengaktifkan atau menonaktifkan rollover untuk envelope.

**FR-BUDGET-13** Pengeluaran tanpa kategori tidak boleh diam-diam masuk ke envelope tertentu; sistem meminta kategori atau menampilkannya sebagai Uncategorized.

#### Persyaratan lintas model

**FR-BUDGET-14** Semua model harus memakai kategori dan transaksi yang sama.

**FR-BUDGET-15** Pengguna dapat mengedit, mengarsipkan, dan melihat riwayat budget.

**FR-BUDGET-16** Sistem menyediakan threshold notifikasi 80%, 100%, dan over budget yang dapat diaktifkan per budget.

**FR-BUDGET-17** Anggaran tidak mengubah saldo akun dan tidak membuat transaksi baru.

### 11.11 Transaksi berulang dan pengingat

**FR-RECUR-01** Pengguna dapat membuat template pendapatan, pengeluaran, atau transfer.

**FR-RECUR-02** Template harus menyimpan nominal, akun atau pasangan akun, kategori bila relevan, jadwal, tanggal mulai, tanggal akhir opsional, dan status aktif.

**FR-RECUR-03** MVP harus mendukung jadwal harian, mingguan, bulanan, dan tahunan.

**FR-RECUR-04** Pengguna dapat menentukan offset pengingat, misalnya 1 hari sebelum atau hari yang sama.

**FR-RECUR-05** Pengingat dapat dikirim melalui in-app notification, email, atau keduanya.

**FR-RECUR-06** Sistem tidak boleh membuat transaksi confirmed otomatis dari template.

**FR-RECUR-07** Notification scheduler harus idempotent berdasarkan template, occurrence date, channel, dan user.

**FR-RECUR-08** Email pengingat harus memiliki subject, nominal, tanggal, merchant atau deskripsi, serta tautan aman ke aplikasi.

**FR-RECUR-09** Email harus menyertakan kontrol unsubscribe atau pengaturan notifikasi.

**FR-RECUR-10** Sistem menggunakan `Asia/Jakarta` sebagai zona waktu default dan menghormati zona waktu yang dipilih pengguna.

### 11.12 Pertanyaan finansial read-only

**FR-QA-01** Pengguna dapat bertanya tentang transaksi, saldo, kategori, periode, dan budget miliknya.

**FR-QA-02** Intent AI harus dipetakan ke daftar intent yang diizinkan, misalnya `spending_by_category`, `income_summary`, `account_balance`, `budget_status`, `top_merchants`, dan `recent_transactions`.

**FR-QA-03** Parameter query harus divalidasi server-side dan menggunakan query terparameterisasi.

**FR-QA-04** AI tidak boleh mengarang angka ketika query mengembalikan data kosong atau gagal.

**FR-QA-05** Jawaban harus menampilkan periode analisis dan filter yang digunakan.

**FR-QA-06** Q&A tidak dapat membuat, mengubah, menghapus, atau mengonfirmasi transaksi.

**FR-QA-07** Jawaban harus memiliki disclaimer singkat bahwa hasil bersifat informasional dan berdasarkan data yang telah dicatat pengguna.

### 11.13 Ekspor, privasi, dan penghapusan

**FR-DATA-01** Pengguna dapat meminta ekspor semua data finansialnya dalam JSON.

**FR-DATA-02** Pengguna dapat meminta ekspor transaksi dalam CSV yang kompatibel dengan spreadsheet.

**FR-DATA-03** Ekspor harus mencakup profiles/settings, accounts, categories, transactions, transaction legs, items, budgets, recurring templates, notification preferences, dan metadata lampiran.

**FR-DATA-04** Lampiran receipt harus dapat diunduh secara privat atau dikemas dalam arsip jika ukuran dan jumlahnya memungkinkan.

**FR-DATA-05** Penghapusan permanen harus menghapus data database, chat, AI usage detail yang dapat mengidentifikasi input, storage objects, notification jobs, dan session terkait.

**FR-DATA-06** Penghapusan harus meminta reauthentication dan konfirmasi eksplisit.

**FR-DATA-07** Setelah penghapusan, pengguna tidak boleh dapat mengakses data melalui session lama.

**FR-DATA-08** Sistem harus menjelaskan bahwa data teknis provider pihak ketiga tunduk pada kebijakan provider; aplikasi tidak boleh menyimpan prompt atau foto lebih lama dari yang diperlukan.

## 12. Rekomendasi AI dan Kontrak Pemrosesan

### 12.1 Provider dan model

Provider awal yang direkomendasikan adalah Groq dengan free quota, dipanggil dari InsForge Function.

| Operasi | Model | Modality | Catatan |
| --- | --- | --- | --- |
| Parsing chat transaksi | `openai/gpt-oss-20b` | Text in, text out | Mendukung JSON Schema mode dan tool use |
| Q&A terstruktur | `openai/gpt-oss-20b` | Text in, text out | Hanya menerima hasil query terparameterisasi |
| Parsing foto struk | `qwen/qwen3.6-27b` | Text dan image in | Vision, OCR, JSON mode, dan tool use |
| Fallback | Form manual | Tidak menggunakan AI | Harus selalu tersedia |

Model vision dapat berada pada status preview atau memiliki kuota yang berubah. Model ID harus dikonfigurasi melalui environment variable agar dapat diganti tanpa mengubah UI atau schema domain.

### 12.2 Batas biaya dan kuota aplikasi

- Target biaya AI eksternal MVP: Rp0.
- Batas aplikasi: 30 operasi AI per pengguna per hari.
- Batas aplikasi: 300 operasi AI per pengguna per bulan.
- Satu operasi dapat berupa parsing chat, parsing satu receipt batch, atau satu pertanyaan Q&A.
- Foto dalam jumlah banyak tetap dihitung sebagai satu operasi produk, tetapi provider quota dihitung sesuai request dan token.
- Jika kuota pengguna habis, aplikasi harus menampilkan pesan yang jelas dan mengarahkan ke input manual.
- Aplikasi tidak boleh mengaktifkan billing otomatis sebagai fallback.
- `AI_USAGE_LIMIT` harus dapat dikonfigurasi server-side.

### 12.3 Parsing transaksi teks

Schema konseptual output:

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
- AI tidak boleh membuat account ID atau category ID; backend melakukan resolusi terhadap kandidat nama.
- Output model harus divalidasi dengan Zod atau validator runtime yang setara.
- Field yang tidak ada harus bernilai `null` atau masuk `missing_fields`, bukan ditebak.

### 12.4 Parsing foto struk

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
- Provider dapat memiliki batas teknis per request, sehingga Function harus melakukan batching dan merge.
- Total yang terbaca harus diprioritaskan sebagai nilai yang memengaruhi transaksi.
- Sistem harus menampilkan jika subtotal dan item tidak sama dengan total.
- Jika foto berasal dari beberapa struk, sistem meminta pengguna memilih pengelompokan.
- QR code, nomor kartu, atau data sensitif lain tidak boleh disimpan kecuali memang diperlukan.
- Jika aplikasi menyimpan foto sebagai lampiran, path dan URL harus dicatat di database dan bucket harus private.

### 12.5 Keamanan prompt dan data AI

- API key Groq hanya berada di InsForge Function secrets.
- Browser hanya memanggil function melalui session pengguna.
- Teks pada foto, merchant name, dan catatan pengguna diperlakukan sebagai data tidak tepercaya.
- AI tidak boleh menjalankan SQL bebas.
- Tool Q&A hanya menyediakan function yang telah ditentukan dan validasi parameter.
- Prompt tidak boleh berisi seluruh database pengguna; kirim konteks paling minimal.
- Raw prompt, raw response, dan foto tidak ditulis ke application log.
- Sistem menyimpan usage metadata seperlunya untuk kuota, debugging, dan keamanan.
- Konfigurasi Zero Data Retention provider harus diaktifkan jika tersedia dan harus diverifikasi sebelum launch.
- Pernyataan privasi tidak boleh menjanjikan lebih dari kebijakan provider yang benar-benar aktif.

## 13. Arsitektur Teknis

### 13.1 Frontend

- Next.js App Router.
- TypeScript dengan strict mode.
- Tailwind CSS 3.4 untuk styling.
- Komponen UI yang memiliki keyboard navigation dan state aksesibilitas yang jelas.
- `@insforge/sdk` untuk authentication, database, storage, functions, email, dan kebutuhan realtime jika diperlukan.
- Server-rendered protected pages jika memungkinkan.
- Client components hanya untuk interaksi yang membutuhkan state browser, upload, chat streaming, atau drag-and-drop.
- Runtime validation menggunakan Zod untuk form, function response, dan AI output.

### 13.2 Backend InsForge

- InsForge Auth untuk email/password dan session.
- InsForge Postgres untuk seluruh data aplikasi.
- RLS di setiap tabel yang memiliki data pengguna.
- InsForge Storage private bucket untuk receipt attachment.
- InsForge Functions untuk AI parsing, Q&A, data deletion, dan pekerjaan terjadwal.
- InsForge Email untuk email pengingat jika fitur custom transactional email tersedia pada plan yang digunakan.
- InsForge schedule atau scheduler yang setara untuk occurrence dan notification jobs.
- Deployment frontend dan backend mengikuti deployment workflow InsForge.

### 13.3 Integrasi client dan server

Client-side SDK menggunakan:

```text
NEXT_PUBLIC_INSFORGE_URL
NEXT_PUBLIC_INSFORGE_ANON_KEY
```

Server-only secrets menggunakan:

```text
INSFORGE_URL
INSFORGE_API_KEY
GROQ_API_KEY
AI_TEXT_MODEL
AI_VISION_MODEL
AI_DAILY_LIMIT
AI_MONTHLY_LIMIT
```

Aturan:

- Anon key boleh digunakan untuk operasi user-scoped sesuai RLS.
- API key admin atau Groq key tidak boleh dipakai di client bundle.
- File `.env`, `.env.local`, dan `.env*.local` harus masuk `.gitignore`.
- Repository harus menyediakan `.env.example` tanpa secret.
- Mutasi sensitif seperti confirm transaction, delete account, dan AI invoke harus memiliki validasi server-side.

### 13.4 Function yang direkomendasikan

| Function | Tanggung jawab |
| --- | --- |
| `parse-transaction-text` | Parsing pesan teks menjadi draft transaction |
| `parse-receipt-images` | Mengambil receipt attachments, memproses batch vision, dan menggabungkan hasil |
| `answer-finance-question` | Memetakan intent, menjalankan query aman, dan menyusun jawaban |
| `confirm-transaction-draft` | Memvalidasi dan menyimpan transaksi secara atomik |
| `create-data-export` | Membuat CSV/JSON export dan mengatur akses download privat |
| `delete-user-data` | Menghapus data database, storage, session, dan jobs |
| `schedule-recurring-reminders` | Membuat notification jobs secara idempotent |
| `send-notification-email` | Mengirim email pengingat dan mencatat status delivery |

### 13.5 Idempotensi dan konsistensi

- Confirm transaction harus menerima `idempotency_key`.
- Transfer harus disimpan sebagai satu logical transaction dan dua transaction legs dalam satu database transaction.
- Penghapusan transaction harus menghapus legs, items, attachments relation, dan draft reference yang terkait sesuai kebijakan.
- Notification job harus memiliki unique dedupe key.
- Receipt batch dapat diulang tanpa membuat duplicate transaction sebelum pengguna mengonfirmasi.
- Retry AI tidak boleh membuat record finansial.

## 14. Model Data Konseptual

Nama tabel final dapat disesuaikan saat migration, tetapi relasi dan batasan berikut wajib dipertahankan.

### 14.1 `profiles`

- `id` sebagai user ID dari InsForge Auth.
- `display_name`.
- `locale` dengan default `id-ID`.
- `base_currency` dengan default `IDR`.
- `timezone` dengan default `Asia/Jakarta`.
- `created_at`, `updated_at`.

### 14.2 `notification_preferences`

- `user_id`.
- `in_app_enabled`.
- `email_enabled`.
- `recurring_reminder_enabled`.
- `budget_threshold_enabled`.
- `default_reminder_offset_minutes`.
- `unsubscribed_at` nullable.
- `created_at`, `updated_at`.

### 14.3 `accounts`

- `id`, `user_id`.
- `name`.
- `account_type`: `cash`, `bank`, `e_wallet`, `credit_card`.
- `opening_balance_idr`.
- `opening_balance_at`.
- `is_active`, `archived_at`.
- `icon`, `color`.
- `created_at`, `updated_at`.

### 14.4 `categories`

- `id`, `user_id` nullable hanya untuk kategori sistem.
- `name`.
- `category_kind`: `income`, `expense`, `both`.
- `is_system`, `is_active`.
- `created_at`, `updated_at`.

### 14.5 `transactions`

- `id`, `user_id`.
- `transaction_type`: `income`, `expense`, `transfer`, `adjustment`.
- `status`: `draft`, `confirmed`, `deleted` atau soft-delete state yang setara.
- `occurred_at`.
- `merchant` nullable.
- `category_id` nullable untuk transfer.
- `source`: `manual`, `chat`, `receipt`, `recurring`, `adjustment`.
- `note` nullable.
- `source_reference_id` nullable.
- `idempotency_key` unique per user untuk operasi confirm.
- `created_at`, `updated_at`, `confirmed_at`.

### 14.6 `transaction_legs`

- `id`, `user_id`, `transaction_id`.
- `account_id`.
- `direction`: `in`, `out`.
- `amount_idr` positif.
- `created_at`.

Rules:

- Income normalnya memiliki satu leg `in`.
- Expense normalnya memiliki satu leg `out`.
- Transfer memiliki satu leg `out` dan satu leg `in`.
- Adjustment memiliki satu leg dan alasan pada transaction note atau metadata.

### 14.7 `transaction_items`

- `id`, `user_id`, `transaction_id`.
- `name`.
- `quantity` nullable.
- `unit_amount_idr` nullable.
- `total_amount_idr` nullable.
- `discount_idr` nullable.
- `category_id` nullable.
- `confidence` nullable.
- `sort_order`.
- `created_at`, `updated_at`.

Tidak ada batas jumlah item di level produk. Payload dan database tetap harus memiliki proteksi resource untuk mencegah abuse.

### 14.8 `receipt_batches`

- `id`, `user_id`.
- `status`: `uploaded`, `processing`, `review`, `confirmed`, `failed`, `discarded`.
- `provider`.
- `model`.
- `extraction_result` JSONB hanya jika retention diaktifkan dan diperlukan.
- `conflict_summary` JSONB nullable.
- `created_at`, `updated_at`.

### 14.9 `receipt_attachments`

- `id`, `user_id`, `receipt_batch_id`.
- `transaction_id` nullable sampai konfirmasi.
- `storage_key`.
- `storage_url` atau signed URL metadata yang diperlukan.
- `mime_type`, `size_bytes`, `checksum`.
- `sort_order`.
- `delete_after_processing`.
- `created_at`, `deleted_at`.

Storage key dan URL atau metadata yang diperlukan untuk download/delete harus disimpan agar operasi storage dapat dilakukan dengan benar.

### 14.10 `budgets`

- `id`, `user_id`.
- `budget_model`: `monthly_category`, `flexible_period`, `envelope`.
- `name`.
- `category_id` nullable bila model tidak membutuhkan kategori langsung.
- `period_start`, `period_end`.
- `target_amount_idr`.
- `rollover_enabled`.
- `is_active`.
- `created_at`, `updated_at`.

### 14.11 `budget_allocations`

- `id`, `user_id`, `budget_id`.
- `category_id`.
- `period_start`, `period_end`.
- `allocated_amount_idr`.
- `rollover_amount_idr`.
- `created_at`, `updated_at`.

### 14.12 `recurring_templates`

- `id`, `user_id`.
- `name`.
- `transaction_type`.
- `amount_idr`.
- `account_id` atau source/destination account pair.
- `category_id` nullable.
- `frequency`.
- `interval_value`.
- `start_date`, `end_date` nullable.
- `next_occurrence_at`.
- `reminder_offsets` JSONB.
- `is_active`.
- `created_at`, `updated_at`.

### 14.13 `notification_jobs`

- `id`, `user_id`.
- `type`.
- `channel`: `in_app`, `email`.
- `source_type`, `source_id`.
- `scheduled_at`.
- `dedupe_key` unique.
- `status`: `pending`, `sent`, `failed`, `cancelled`.
- `attempt_count`, `last_error`.
- `sent_at`.

### 14.14 `chat_sessions` dan `chat_messages`

- Seluruh record memiliki `user_id`.
- Message menyimpan role, operation, status, dan timestamp.
- Raw receipt image tidak disimpan sebagai base64 pada message.
- Retention chat dapat dibatasi dan harus termasuk dalam export/delete.
- Chat message tidak menjadi sumber kebenaran transaksi; transaction record confirmed adalah sumber kebenaran.

### 14.15 `ai_usage`

- `id`, `user_id`.
- `operation`.
- `provider`, `model`.
- `status`.
- `input_tokens`, `output_tokens` nullable.
- `estimated_cost_idr` nullable.
- `created_at`.

Jangan menyimpan raw prompt atau raw response pada tabel usage.

## 15. Row-Level Security dan Authorization

- Semua tabel aplikasi dengan data pengguna harus memiliki RLS aktif.
- Policy read, insert, update, dan delete harus membatasi `user_id` dengan authenticated user.
- `transaction_legs` harus memeriksa kepemilikan transaction parent dan account.
- `budgets` harus memeriksa kepemilikan category serta user.
- `receipt_attachments` harus menggunakan path storage yang menyertakan user scope.
- Public bucket tidak boleh digunakan untuk foto struk.
- Admin client hanya boleh digunakan di server-side function dengan kebutuhan eksplisit.
- Function harus mengambil user identity dari session/JWT, bukan dari `user_id` yang dikirim client saja.
- Semua function harus menolak request tanpa autentikasi kecuali endpoint publik yang memang dirancang demikian.
- Query Q&A harus membatasi data berdasarkan user sebelum agregasi.
- Tidak boleh menggunakan policy yang memungkinkan user membaca semua rows untuk kemudian difilter di client.

## 16. Struktur Halaman dan Navigasi

### Halaman publik

- `/` Landing page.
- `/login` Login.
- `/register` Registrasi.
- `/forgot-password` Reset password.
- `/privacy` Kebijakan privasi.
- `/terms` Ketentuan penggunaan.

### Halaman aplikasi

- `/app/dashboard` Dashboard.
- `/app/capture` Chat, upload struk, dan formulir manual.
- `/app/transactions` Daftar transaksi.
- `/app/transactions/[id]` Detail dan edit transaksi.
- `/app/accounts` Daftar dan pengaturan akun.
- `/app/budgets` Tiga model anggaran.
- `/app/recurring` Template dan jadwal transaksi berulang.
- `/app/notifications` Notifikasi dan status pengingat.
- `/app/settings/profile` Profil, bahasa, mata uang, dan zona waktu.
- `/app/settings/data` Ekspor dan hapus data.

### Navigasi utama mobile

- Dashboard.
- Catat.
- Transaksi.
- Anggaran.
- Lainnya.

Tombol Catat harus mudah dijangkau karena merupakan tindakan utama aplikasi.

## 17. UX dan UI

- Semua tampilan harus usable pada lebar mobile 360px dan desktop.
- Form nominal menggunakan input numerik dan preview format IDR.
- Review AI menggunakan card yang dapat diedit tanpa membuka halaman baru.
- Upload menyediakan progress per file, status batch, retry, remove, dan cancel.
- Foto yang buram atau tidak terbaca harus menghasilkan pesan yang dapat ditindaklanjuti.
- Loading state harus membedakan upload, processing, dan saving.
- Error state harus menyebut apakah pengguna dapat mencoba ulang atau menggunakan formulir manual.
- Tidak ada tombol destruktif tanpa konfirmasi.
- Warna tidak boleh menjadi satu-satunya cara untuk membedakan income dan expense.
- Semua input memiliki label, focus state, error message, dan keyboard support.
- Chart memiliki ringkasan teks agar dapat digunakan dengan screen reader.
- Email dan in-app notification harus memiliki tautan kembali ke konteks yang relevan.

## 18. Email dan Notifikasi

### Event minimal

- Pengingat transaksi berulang.
- Budget mencapai 80% jika diaktifkan.
- Budget mencapai 100% jika diaktifkan.
- Budget melewati batas jika diaktifkan.
- Status export selesai.
- Peringatan bahwa penghapusan data akan permanen.

### Aturan email

- Pengiriman harus menggunakan provider email yang dikonfigurasi melalui InsForge.
- Custom transactional email pada InsForge dapat bergantung pada plan, sehingga konfigurasi plan dan sender harus divalidasi sebelum deployment.
- Email harus dikirim hanya jika pengguna mengaktifkan channel tersebut.
- Email tidak boleh memuat seluruh riwayat keuangan.
- Email hanya memuat informasi minimum yang dibutuhkan untuk pengingat.
- Link email harus memiliki token aman dan tidak berisi data finansial mentah pada URL.
- Unsubscribe harus langsung memperbarui preference pengguna.
- Job retry harus memiliki batas percobaan dan tidak menggandakan email.

## 19. Non-Functional Requirements

### Security

- Tidak ada secret di client bundle atau repository.
- Semua traffic production menggunakan HTTPS.
- Storage receipt harus private.
- Input upload harus divalidasi tipe, ukuran, checksum, dan dapat dipindai dari konten berbahaya sesuai kemampuan platform.
- Data log harus disensor dari nominal lengkap, nomor kartu, dan raw receipt.
- Delete operation harus memiliki audit metadata minimal tanpa menyimpan data finansial yang dihapus.
- Rate limit berlaku pada function untuk mencegah abuse.

### Performance

- Dashboard menggunakan query teragregasi dan pagination.
- List transaction tidak boleh mengambil rows tanpa limit.
- Data besar harus menggunakan pagination atau cursor.
- Upload foto menggunakan progress dan tidak menunggu semua foto sebelum menampilkan status awal.
- AI receipt batch diproses asynchronous jika jumlah file besar.
- Cache hanya boleh digunakan untuk data non-sensitive atau cache yang scoped per user.

### Reliability

- Semua operasi confirm dan transfer idempotent.
- Retry AI tidak boleh membuat transaksi duplicate.
- Gangguan AI tidak boleh menghilangkan foto atau draft pengguna.
- Gangguan email tidak boleh membatalkan transaksi.
- Backup dan restore database mengikuti capability InsForge yang aktif.
- Error function harus memiliki correlation ID tanpa menyimpan raw prompt.

### Accessibility

- Target WCAG 2.1 AA untuk alur utama.
- Semua kontrol dapat digunakan dengan keyboard.
- Form error dibacakan oleh assistive technology.
- Kontras teks dan status memenuhi standar.
- Upload tidak boleh hanya bergantung pada drag-and-drop.

### Compatibility

- Chrome, Edge, Firefox, dan Safari versi modern.
- Mobile browser pada Android dan iOS.
- UI tidak bergantung pada hover untuk tindakan penting.

## 20. Acceptance Criteria MVP

### Authentication

- Pengguna dapat register, login, logout, reset password, dan kembali ke session aktif.
- Pengguna yang belum login tidak dapat mengakses data aplikasi.
- User A tidak dapat membaca data User B menggunakan browser atau API langsung.

### Text transaction

- Input `"Beli makan siang 45 ribu di Warteg, bayar dari BCA hari ini"` menghasilkan review card dengan nominal IDR, merchant, kategori kandidat, akun kandidat, dan tanggal.
- Jika akun BCA tidak ada, sistem meminta pengguna memilih atau membuat akun.
- Transaksi tidak muncul pada dashboard sebelum konfirmasi.
- Klik konfirmasi berulang tidak membuat duplicate transaction.

### Receipt transaction

- Pengguna dapat memilih banyak foto dari file picker.
- Pengguna dapat menambah foto setelah processing dimulai jika batch belum dikonfirmasi.
- Backend memproses foto dalam batch provider dan menggabungkan hasil.
- Sistem menampilkan item, subtotal, pajak, diskon, total, confidence, dan konflik yang ditemukan.
- Pengguna dapat mengubah hasil sebelum save.
- Foto mentah tidak menjadi public asset.
- Bila vision provider gagal, pengguna mendapat pilihan retry atau formulir manual.

### Account dan transfer

- Saldo awal akun dapat dibuat.
- Expense mengurangi saldo asset atau menambah saldo terutang kartu kredit sesuai aturan account.
- Transfer antar akun membuat dua legs linked dan tidak mengubah total expense/income.
- Edit dan delete transfer mempertahankan konsistensi kedua akun.
- Akun dengan transaksi dapat diarsipkan.

### Budget

- Pengguna dapat membuat budget bulanan per kategori.
- Pengguna dapat membuat budget dengan rentang tanggal fleksibel.
- Pengguna dapat membuat envelope, mengalokasikan dana, melihat spent/available, dan mengaktifkan rollover.
- Nilai budget hanya memakai transaksi confirmed.
- Pengguna dapat mengaktifkan threshold notification.

### Recurring dan email

- Pengguna dapat membuat jadwal harian, mingguan, bulanan, dan tahunan.
- Sistem membuat pengingat in-app dan email sesuai preference.
- Pengingat yang sama tidak terkirim dua kali untuk occurrence dan channel yang sama.
- Pengguna harus mengonfirmasi sebelum occurrence menjadi transaksi confirmed.

### Export dan delete

- Export JSON memuat entitas finansial utama.
- Export CSV dapat dibuka dalam spreadsheet.
- Pengguna dapat mengunduh metadata lampiran dan file jika lampiran disimpan.
- Delete meminta reauthentication dan konfirmasi eksplisit.
- Setelah delete, semua session lama tidak dapat mengakses data.

## 21. Observability dan Analytics

### Product events yang direkomendasikan

- `signup_completed`.
- `onboarding_completed`.
- `account_created`.
- `transaction_manual_created`.
- `transaction_ai_draft_created`.
- `transaction_ai_confirmed`.
- `transaction_ai_corrected`.
- `receipt_upload_started`.
- `receipt_upload_completed`.
- `receipt_extraction_failed`.
- `budget_created`.
- `recurring_template_created`.
- `reminder_sent`.
- `export_completed`.
- `account_deletion_completed`.

### Data analytics

- Jangan mengirim raw prompt, raw receipt, merchant lengkap, nomor akun, atau nominal transaksi ke analytics pihak ketiga.
- Gunakan event properties yang teragregasi atau ter-redact.
- Sediakan opt-out sesuai kebijakan privasi.
- Usage AI dapat dicatat dalam `ai_usage` untuk quota enforcement tanpa menyimpan isi prompt.

## 22. Testing Strategy

### Unit test

- Parsing dan formatting IDR.
- Resolusi tanggal berdasarkan timezone.
- Perhitungan saldo asset dan kartu kredit.
- Pembuatan dua transfer legs.
- Perhitungan tiga model budget.
- Perhitungan rollover envelope.
- Dedupe notification job.
- Idempotency confirm transaction.
- Validasi schema AI.

### Integration test

- Auth flow dengan InsForge.
- RLS untuk setiap tabel utama.
- Upload dan delete private receipt.
- Invoke function dengan session pengguna.
- Penyimpanan transaction dan legs secara atomik.
- Export dan delete cascade.
- Email preference dan notification job.

### AI evaluation set

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

### End-to-end test

- Register sampai transaksi pertama.
- Chat sampai confirm.
- Banyak foto sampai confirm.
- Transfer dan verifikasi saldo.
- Tiga model budget dan notifikasi threshold.
- Recurring template sampai email reminder.
- Export lalu delete akun.

## 23. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Model vision preview berubah atau dihentikan | Parsing foto berhenti | Gunakan adapter provider, env model ID, dan fallback manual |
| Free quota AI habis | Pengguna tidak dapat memakai AI sementara | Enforce quota, tampilkan status jelas, selalu sediakan manual form |
| AI salah membaca total struk | Saldo dan laporan salah | Review wajib, confidence, konflik, validasi total, dan koreksi manual |
| Beberapa foto berasal dari struk berbeda | Transaksi salah digabung | Receipt grouping review dan hasil konflik yang terlihat |
| Transfer dianggap expense | Laporan pengeluaran terlalu besar | Model transaction legs dan aturan transfer terpisah |
| RLS salah konfigurasi | Kebocoran data finansial | Test policy per tabel, negative test lintas user, dan server authorization |
| Email custom tidak tersedia pada plan | Reminder email gagal | Validasi capability sebelum launch dan siapkan provider email yang disetujui |
| Upload besar menghabiskan resource | Biaya dan latency meningkat | Per-file guardrail, batching, compression, rate limit, dan async processing |
| Data di log berisi informasi sensitif | Pelanggaran privasi | Redaction, structured error ID, dan larangan raw prompt logging |
| Tiga model budget membingungkan pengguna | Onboarding rendah | Template contoh, penjelasan singkat, dan default model bulanan yang jelas |
| Pengguna menganggap Q&A sebagai nasihat finansial | Risiko keputusan yang salah | Q&A deskriptif, citation periode, dan disclaimer |

## 24. Ketergantungan dan Prasyarat Peluncuran

- InsForge project telah dibuat dan linked ke repository.
- Database migrations dan RLS telah diterapkan pada environment test.
- Auth email delivery telah diuji.
- Private storage bucket dan storage RLS telah diuji.
- InsForge Functions dapat memanggil Groq dengan secret server-side.
- Model teks dan vision tersedia serta quota telah diverifikasi.
- Konfigurasi ZDR dan kebijakan retention provider telah ditinjau.
- Email sender dan domain telah dikonfigurasi untuk production.
- Scheduler dapat membuat dan mengirim notification jobs.
- Backup dan prosedur penghapusan telah diuji.
- Privacy policy menjelaskan pemrosesan AI, receipt, email, retention, export, dan delete.
- Local build berhasil sebelum deployment.

## 25. Tahapan Implementasi

### Tahap 1: Fondasi aplikasi

- Inisialisasi Next.js App Router dan TypeScript.
- Instal `@insforge/sdk`.
- Konfigurasi environment dan SSR auth.
- Implementasi layout, routing, theme, locale, dan error boundary.
- Hubungkan InsForge Auth.

### Tahap 2: Database dan keamanan

- Buat migrations untuk profiles, accounts, categories, transactions, legs, dan settings.
- Terapkan RLS dan negative tests.
- Implementasikan service layer dengan typed models.
- Buat seed kategori default.

### Tahap 3: Pencatatan dasar

- Implementasikan accounts, categories, manual transaction form, list, detail, edit, delete, dan archive.
- Implementasikan saldo dan transfer atomik.
- Implementasikan dashboard dan filter.

### Tahap 4: AI teks

- Buat `parse-transaction-text` function.
- Tambahkan Groq adapter dan structured schema.
- Tambahkan review card, klarifikasi, confirm, idempotency, dan usage quota.
- Buat evaluation set teks.

### Tahap 5: Receipt multi-foto

- Buat private receipt bucket dan RLS.
- Implementasikan multi-file upload, progress, retry, cancel, dan remove.
- Buat `parse-receipt-images` function dengan batching.
- Implementasikan item extraction, konflik, grouping, review, dan attachment policy.
- Uji foto struk Indonesia.

### Tahap 6: Budget dan recurring

- Implementasikan shared budget engine.
- Tambahkan monthly, flexible, dan envelope UI.
- Implementasikan recurring template, occurrence, scheduler, dan in-app notification.
- Implementasikan email reminder serta unsubscribe.

### Tahap 7: Q&A, data control, dan hardening

- Implementasikan intent Q&A dan safe query functions.
- Implementasikan export CSV/JSON.
- Implementasikan reauthentication dan permanent delete.
- Tambahkan analytics redaction, security review, performance testing, dan accessibility testing.

### Tahap 8: Release readiness

- Jalankan local build.
- Jalankan unit, integration, RLS, and end-to-end test.
- Verifikasi secrets, email, storage, schedules, model availability, dan quota.
- Uji deployment InsForge pada environment staging.
- Lakukan beta terbatas dengan dataset anonim.
- Tinjau metrics dan error logs sebelum production release.

## 26. Definition of Done MVP

MVP dianggap selesai jika semua kondisi berikut terpenuhi:

- Semua fitur wajib pada Section 8.1 telah tersedia pada environment staging.
- Semua acceptance criteria pada Section 20 lulus.
- RLS telah diuji untuk positive dan negative access.
- Tidak ada API key atau secret pada client bundle, commit, atau log.
- Text parsing dan receipt parsing memiliki fallback manual.
- Tidak ada jalur AI yang menyimpan transaction tanpa konfirmasi.
- Transfer, saldo, dashboard, dan budget menggunakan data yang konsisten.
- Multi-foto tidak memiliki batas jumlah di level fitur dan backend memiliki batching.
- Export dan delete telah diuji terhadap database serta storage.
- Email reminder memiliki deduplication dan unsubscribe.
- Accessibility dan responsive QA telah dilakukan pada mobile serta desktop.
- Local build dan deployment build berhasil.
- Privacy policy dan terms mencerminkan fitur AI, receipt, email, dan data deletion.
- Model dan quota provider telah diverifikasi pada tanggal deployment.

## 27. Keputusan Terbuka Pasca-MVP

- Apakah perlu multi-currency untuk pengguna di luar Indonesia?
- Apakah perlu akun keluarga dan shared budget?
- Apakah line-item perlu menjadi searchable dan dapat memiliki kategori berbeda?
- Apakah receipt image perlu disimpan default atau selalu ephemeral?
- Apakah perlu model AI berbayar setelah free quota terbukti tidak cukup?
- Apakah perlu input suara dan OCR khusus untuk tulisan tangan?
- Apakah perlu insight proaktif seperti pola pengeluaran, dengan persetujuan pengguna?

## 28. Ringkasan Keputusan Implementasi

| Area | Keputusan |
| --- | --- |
| Frontend | Next.js App Router, TypeScript, Tailwind CSS 3.4 |
| Backend | InsForge Database, Auth, RLS, Functions, Storage, Email, Scheduler, Deployment |
| User | Personal, single-user data scope |
| Bahasa | Bahasa Indonesia |
| Mata uang | IDR, disimpan sebagai integer |
| Auth | Email dan password |
| Text AI | Groq `openai/gpt-oss-20b` |
| Vision AI | Groq `qwen/qwen3.6-27b` |
| AI budget | Target Rp0, 30 operasi/hari, 300 operasi/bulan per user |
| AI persistence | Konfirmasi pengguna wajib sebelum save |
| Receipt | Multi-foto dan multi-item tanpa batas produk |
| Account | Tunai, bank, dompet digital, kartu kredit |
| Transfer | Dua linked transaction legs, tidak dihitung sebagai expense/income |
| Budget | Monthly category, flexible period, envelope |
| Recurring | Template dan reminder, tidak auto-post |
| Notification | In-app dan email |
| Data control | Export CSV/JSON dan permanent delete |
| Bank sync | Di luar MVP |
| Financial advice | Di luar MVP |
