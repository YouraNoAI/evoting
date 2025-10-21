# 🗳️ E-Voting API Documentation

Backend server built with **Express.js** + **MySQL** + **JWT Authentication**.

---

## 🚀 Getting Started

### Install Dependencies
```bash
npm install
```

### Setup Environment Variables
Create `.env` file:
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

### Run Server
```bash
node main.js
```
Server runs at: `http://localhost:4000`

---

## 🔑 Authentication Routes

| Method | Endpoint | Description |
|---------|-----------|-------------|
| POST | `/api/auth/login` | Login with `nim` & `password`, returns JWT |
| POST | `/api/auth/logout` | Logout and invalidate current session |

---

## 👥 User Voting Routes

| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | `/api/votings` | Get list of all votings |
| GET | `/api/votings/:id` | Get detail of a specific voting |
| GET | `/api/votings/:id/candidates` | Get candidates in specific voting |
| POST | `/api/votings/:id/vote` | Submit a vote |
| GET | `/api/votings/:id/results` | Get voting results (user) |

---

## 🧑‍💼 Admin Voting Routes

| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | `/api/admin/votings` | Get all votings (admin) |
| POST | `/api/admin/votings` | Create new voting |
| PUT | `/api/admin/votings/:id` | Update existing voting |
| DELETE | `/api/admin/votings/:id` | Delete voting & related data |
| GET | `/api/admin/votings/:id/results` | Get voting results (admin) |

---

## 🧑‍🤝‍🧑 Candidate Management

| Method | Endpoint | Description |
|---------|-----------|-------------|
| POST | `/api/admin/votings/:id/candidates` | Add candidate (with photo) |
| PUT | `/api/admin/votings/:id/candidates/:cid` | Update candidate info/photo |
| DELETE | `/api/admin/votings/:id/candidates/:cid` | Delete candidate & related votes |
| GET | `/api/admin/fotos` | List uploaded candidate photos |

---

## 👤 User Management (Admin)

| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/users` | Create new user |
| PUT | `/api/admin/users/:nim` | Update user info/password/role |
| DELETE | `/api/admin/users/:nim` | Delete user |

---

## 📤 Upload Management

| Method | Endpoint | Description |
|---------|-----------|-------------|
| POST | `/api/admin/upload-foto` | Upload candidate photo |

---

## 🔒 Middleware

### `authenticate`
Validates JWT token from `Authorization` header.

### `requireAdmin`
Restricts route access to admin users only.

---

## 💾 Database Tables Overview

| Table | Columns |
|--------|----------|
| `users` | nim, nama, password, role |
| `sessions` | id, user_nim, token, valid |
| `votings` | voting_id, nama_voting, waktu_mulai, waktu_selesai |
| `candidates` | candidate_id, voting_id, nama, nim, foto_url, deskripsi, visi_misi |
| `votes` | vote_id, user_nim, candidate_id, voting_id |

---

## 🧠 Notes
- All `POST`, `PUT`, `DELETE` under `/api/admin/...` require valid **Admin JWT token**.
- File uploads are stored under `/uploads` folder.
- JWT token is required for all authenticated routes.

---

© 2025 E-Voting System | Made with ❤️ by Arya Danuwarta
