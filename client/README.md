# 🗳️ E-Voting HIMATIF — Dokumentasi Aplikasi

Aplikasi **E-Voting** sederhana untuk pemilihan internal.  
Frontend: **React (Vite)**. Backend: **Express + MySQL**.  
Fitur utama: autentikasi JWT, manajemen voting & kandidat, upload foto kandidat, pencatatan suara, dan tampilan hasil voting.

---

## ⚙️ Isi Cepat
- 🧠 [Tech Stack & File Penting](#-tech-stack--file-penting)
- ⚡ [Quick Start (Development)](#-quick-start-development)
- 🔧 [Environment Variables](#-environment-variables)
- 🔗 [API Overview](#-api-overview)
- 🔒 [Autentikasi & Keamanan](#-autentikasi--keamanan)
- 🧰 [Troubleshooting Singkat](#-troubleshooting-singkat)

---

## 🧠 Tech Stack & File Penting

| Layer | Teknologi |
|-------|------------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | MySQL |
| Auth | JWT (JSON Web Token) |
| Upload | Multer |
| Password | bcrypt (hashing) |
| Config | dotenv |

**File penting:**
- `client/src/App.jsx` — Routing utama React
- `server/main.js` — Entry point backend
- `server/config.js` — Konfigurasi DB, multer, JWT
- `server/middleware.js` — Middleware admin & autentikasi
- `server/routes/` — Semua endpoint API

---

## ⚡ Quick Start (Development)

### 🖥 Backend
Masuk ke folder server:
```bash
cd server
npm install
```
Buat file `.env` (contoh `server/.env`) dan isi konfigurasi DB serta `JWT_SECRET`.  
Jalankan server:
```bash
node main.js
```
Server aktif di: **http://localhost:4000**

### 🌐 Frontend
Masuk ke folder client:
```bash
cd client
npm install
npm run dev
```
Akses UI di: **http://localhost:5173**

---

## 🔧 Environment Variables

File `.env` untuk backend:

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

Dibaca di `server/config.js`.

---

## 📁 Struktur Penting

### 🖥 Server
- `server/config.js` — Bootstrap app, DB pool, multer, JWT
- `server/middleware.js` — `requireAdmin`, `authenticate`
- Routes:
  - `server/routes/auth.js` — Login / Logout
  - `server/routes/votings.js` — Endpoint votings (user)
  - `server/routes/candidate.js` — CRUD kandidat (admin)
  - `server/routes/upload.js` — Upload foto admin
  - `server/routes/admin/votings.js` — Admin votings
  - `server/routes/admin/users.js` — Admin user management
- Entry point: `server/main.js`

### 🌐 Client
- `client/src/App.jsx` — Routing & proteksi route
- `client/src/context/AuthContext.jsx` — Context auth & `AuthProvider`
- `client/src/api/axios.jsx` — Axios instance + interceptor Authorization
- Halaman & Komponen utama:
  - `client/src/pages/Login.jsx`
  - `client/src/pages/User.jsx`
  - `client/src/pages/Voting.jsx`
  - `client/src/pages/SelectVotings.jsx`
  - `client/src/pages/AdminDashboard.jsx`
  - `client/src/components/VotingSettings.jsx`
  - `client/src/components/UserSettings.jsx`
  - `client/src/components/VotingResult.jsx`
  - `client/src/components/ProtectedRoute.jsx`

---

## 🔗 API Overview

### 🔑 Auth
| Method | Endpoint | Deskripsi |
|---------|-----------|-----------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout (invalidate session) |

### 🗳️ Votings (User)
| Method | Endpoint | Deskripsi |
|---------|-----------|-----------|
| GET | `/api/votings` | Daftar semua votings |
| GET | `/api/votings/:id` | Detail voting |
| GET | `/api/votings/:id/candidates` | Daftar kandidat |
| POST | `/api/votings/:id/vote` | Submit vote |
| GET | `/api/votings/:id/results` | Hasil voting |

### 🧑‍💼 Admin (Require Token Admin)
| Method | Endpoint | Deskripsi |
|---------|-----------|-----------|
| GET/POST/PUT/DELETE | `/api/admin/votings` | Manajemen votings |
| POST | `/api/admin/votings/:id/candidates` | Tambah kandidat + foto |
| PUT | `/api/admin/votings/:id/candidates/:cid` | Update kandidat |
| DELETE | `/api/admin/votings/:id/candidates/:cid` | Hapus kandidat |
| POST | `/api/admin/upload-foto` | Upload foto kandidat |
| GET | `/api/admin/fotos` | List file upload |
| CRUD | `/api/admin/users` | Manajemen user |

---

## 🔒 Autentikasi & Keamanan

- JWT dibuat oleh `signToken()` (`server/config.js`) dan disimpan di tabel `sessions`.
- Middleware `authenticate` memverifikasi token & validitas session.
- Frontend menyimpan token di `localStorage`.
- Axios interceptor otomatis menambahkan header `Authorization`.
- Password di-hash dengan `bcrypt`.
- Setelah voting, session user diinvalidasi agar tidak bisa vote dua kali.
- File upload disimpan di `server/uploads` dan diakses via `/uploads`.

---

## 🧰 Troubleshooting Singkat

| Masalah | Solusi |
|----------|---------|
| ❌ 401 Unauthorized | Cek token di `localStorage` & session DB |
| 🖼️ Gambar tidak muncul | Periksa folder `server/uploads` & route `/uploads` |
| 🔌 DB tidak konek | Pastikan variabel DB_* di `.env` benar |
| 🔐 Tidak bisa login | Periksa hashing password & token JWT |

---

## 📜 Lisensi & Kontak
Proyek ini dibuat untuk kebutuhan internal.  
💡 Developer: **Arya Danuwarta**  
📆 © 2025 — HIMATIF E-Voting System  
