<div align="center">
  
# 📖 YasaLearn English

**Platform Persiapan Literasi Bahasa Inggris Modern**

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Glossary/HTML5)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

YasaLearn adalah platform simulasi tes literasi Bahasa Inggris berbasis *client-side* (tanpa server) dengan antarmuka premium bergaya *Dark Glassmorphism*. 
Didesain khusus agar nyaman dipandang selama berjam-jam saat latihan soal.

</div>

---

## ✨ Fitur Unggulan

- 🎯 **Smart Review & Terjemahan**
  Setiap soal dilengkapi dengan toggle fitur terjemahan otomatis dan penjelasan komprehensif setelah Anda menjawab.
- 💾 **Client-Side Storage**
  Semua progres belajar, skor ujian, dan *Vocabulary* sulit Anda disimpan dengan aman di penyimpanan lokal peramban (LocalStorage). Tanpa perlu login atau koneksi database.
- 📱 **Mobile Responsive Layout**
  UI yang sepenuhnya dapat menyesuaikan ukuran layar perangkat (Desktop, Tablet, maupun Mobile) dengan kontrol terdedikasi untuk layar sentuh saat ujian.
- ⏱️ **Timer Simulasi Ujian**
  Fitur hitung mundur 45 Menit untuk simulasi ujian sesungguhnya, membangun manajemen waktu yang baik.
- 🎨 **Premium Aesthetic**
  Menggunakan pendekatan desain UI modern: Warna Dark Soft, bayangan halus, efek *blur* glassmorphism, dan komponen bergaya *pill-shape*.

## 🚀 Cara Menjalankan (Local Development)

Proyek ini dibangun murni menggunakan **Vanilla HTML, CSS, dan JavaScript**, sehingga tidak diperlukan proses instalasi dependencies rumit seperti Node.js atau Framework lainnya.

1. Clone repositori ini ke komputer lokal Anda:
   ```bash
   git clone https://github.com/username/yasalearn.git
   ```
2. Buka folder `yasalearn` di IDE favorit Anda (contoh: VS Code).
3. Jalankan aplikasi menggunakan **Live Server** (ekstensi VS Code) untuk menghindari batasan *CORS* pada pengambilan data paket JSON.
   - Klik kanan pada `index.html` dan pilih **"Open with Live Server"**.

## 🌐 Deployment (Vercel / GitHub Pages)

Website ini siap di-deploy secara instan ke layanan hosting statis (Vercel, Netlify, atau GitHub Pages) **tanpa konfigurasi tambahan**.

1. Buat repositori di GitHub dan dorong (*push*) kode.
2. Di Dashboard Vercel, pilih **"Import Project"**.
3. Pilih repositori YasaLearn dan biarkan *Build Settings* secara default.
4. Klik **Deploy**! 🚀

## 📂 Struktur Folder

```text
/
├── index.html       # Landing page (Beranda)
├── dashboard.html   # Panel utama manajemen progres & vocab
├── study.html       # Halaman utama ujian dan simulasi soal
├── result.html      # Halaman hasil ujian akhir
├── style.css        # Desain dan responsivitas UI 
├── script.js        # Logika aplikasi dan penyimpanan lokal
├── README.md        # Dokumentasi proyek
└── /data            # Folder yang berisi database soal (JSON)
    ├── paket1.json
    ├── paket2.json
    └── paket3.json
```

## 🛠️ Teknologi yang Digunakan

- **HTML5**: Struktur dan semantik.
- **Vanilla CSS3**: Styling kustom menggunakan *CSS Variables* untuk kemudahan *theming* dan sistem Grid/Flexbox modern.
- **Vanilla JavaScript**: Logika DOM Manipulation murni menggunakan API `fetch` dan `localStorage`.
- **Lucide Icons**: Library ikon minimalis yang disematkan langsung via CDN.

---
<div align="center">
  Dibuat untuk mempermudah pejuang PTN meraih kampus impian. 🚀
</div>
