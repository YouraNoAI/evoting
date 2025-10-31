# 🗳️ E-Voting HIMATIF — Full Stack Documentation

Aplikasi **E-Voting** berbasis web untuk pemilihan internal HIMATIF, dibangun dengan **React (Vite)** untuk frontend dan **Express.js + MySQL** untuk backend.  
Mendukung autentikasi JWT, manajemen kandidat & voting, upload foto, serta tampilan hasil voting real-time.

---

## 🚀 Fitur Utama

- Autentikasi berbasis **JWT** (login/logout user & admin)
- **CRUD Voting & Kandidat** (admin panel)
- **Upload foto kandidat** dengan *multer*
- **Hasil voting real-time** (hasil publik & admin)
- Sistem **role user/admin** dengan validasi middleware
- Penyimpanan data di **MySQL**
- Proteksi session & invalidasi setelah vote
- Frontend modern berbasis **React + Vite**

---

## ⚙️ Tech Stack

| Layer | Teknologi |
|-------|------------|
| Frontend | React + Vite + Axios + Context API |
| Backend | Node.js + Express.js |
| Database | MySQL |
| Auth | JWT (JSON Web Token) |
| Upload File | Multer |
| Hashing Password | bcrypt |
| Environment | dotenv |

---

## 🧩 Struktur Folder

```
e-voting-himatif/
│
├── client/                # Frontend React
│   ├── src/
│   │   ├── pages/         # Halaman utama
│   │   ├── components/    # Komponen UI reusable
│   │   ├── api/axios.jsx  # Axios instance + interceptor JWT
│   │   └── context/AuthContext.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── server/                # Backend Express
│   ├── routes/            # Semua route API
│   ├── uploads/           # Foto kandidat tersimpan di sini
│   ├── config.js          # Koneksi DB, multer, JWT
│   ├── middleware.js      # requireAdmin, authenticate
│   ├── main.js            # Entry point server
│   ├── .env               # Variabel environment backend
│   └── package.json
│
└── README.md              # Dokumentasi proyek
```

---

## 🧠 Alur Sistem

1. **User login** dengan NIM & password → sistem kirim JWT token.
2. Token disimpan di `localStorage` (frontend).
3. User dapat memilih voting aktif & memberikan suara.
4. Setelah vote, session user diinvalidasi (tidak bisa vote dua kali).
5. Admin dapat membuat, mengedit, dan menghapus voting & kandidat.
6. Foto kandidat diunggah melalui route admin `/api/admin/upload-foto`.
7. Semua hasil voting ditampilkan real-time di frontend.

---

## ⚡ Instalasi & Setup

### 1. Clone Repository
```bash
git clone https://github.com/YouraNoAI/evoting.git
cd evoting
```

### 2. Setup Backend
```bash
cd server
npm install
```
Buat file `.env` dengan isi:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=yourpassword
DB_NAME=e_voting
JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=7d
PORT=4000
```

Jalankan server:
```bash
node main.js
```
Akses di: [http://localhost:4000](http://localhost:4000)

### 3. Setup Frontend
```bash
cd ../client
npm install
npm run dev
```
Frontend jalan di: [http://localhost:5173](http://localhost:5173)

---

## 🔑 Endpoint API (Ringkasan)

### Auth
| Method | Endpoint | Deskripsi |
|---------|-----------|-----------|
| POST | `/api/auth/login` | Login user/admin |
| POST | `/api/auth/logout` | Logout & invalidate session |

### Voting (User)
| Method | Endpoint | Deskripsi |
|---------|-----------|-----------|
| GET | `/api/votings` | Daftar semua voting |
| GET | `/api/votings/:id` | Detail voting |
| GET | `/api/votings/:id/candidates` | Daftar kandidat |
| POST | `/api/votings/:id/vote` | Kirim suara |
| GET | `/api/votings/:id/results` | Hasil voting |

### Admin
| Method | Endpoint | Deskripsi |
|---------|-----------|-----------|
| GET | `/api/admin/votings` | Lihat semua voting |
| POST | `/api/admin/votings` | Tambah voting baru |
| PUT | `/api/admin/votings/:id` | Edit voting |
| DELETE | `/api/admin/votings/:id` | Hapus voting |
| POST | `/api/admin/votings/:id/candidates` | Tambah kandidat |
| PUT | `/api/admin/votings/:id/candidates/:cid` | Edit kandidat |
| DELETE | `/api/admin/votings/:id/candidates/:cid` | Hapus kandidat |
| GET | `/api/admin/users` | Lihat semua user |
| POST | `/api/admin/users` | Tambah user |
| PUT | `/api/admin/users/:nim` | Update user |
| DELETE | `/api/admin/users/:nim` | Hapus user |
| POST | `/api/admin/upload-foto` | Upload foto kandidat |

---

## 💾 Database Struktur

| Tabel | Kolom |
|--------|--------|
| `users` | nim, nama, password, role |
| `sessions` | id, user_nim, token, valid |
| `votings` | voting_id, nama_voting, waktu_mulai, waktu_selesai |
| `candidates` | candidate_id, voting_id, nama, nim, foto_url, deskripsi, visi_misi |
| `votes` | vote_id, user_nim, candidate_id, voting_id |

---

## 🧰 Troubleshooting

| Masalah | Solusi |
|----------|---------|
| 401 Unauthorized | Cek token JWT di localStorage atau sesi DB |
| Upload gagal | Pastikan folder `server/uploads` ada |
| Tidak bisa login | Pastikan password di-hash dan DB terkoneksi |
| Gambar tidak muncul | Periksa konfigurasi static file `/uploads` |

---

## ❤️ Credits
Dibuat oleh **Arya Danuwarta**  
Frontend & Backend: Fullstack JS With AI  
© 2025 — HIMATIF E-Voting System
