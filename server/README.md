
# 📜 E-Voting API Documentation

Base URL: `http://localhost:5000/api`

## 🔐 Authentication
### 1. POST /login
**Deskripsi:** Login user atau admin.

**Request Body:**
```json
{
  "nim": "33241006",
  "password": "yourpassword"
}
```

**Response (200 OK):**
```json
{
  "token": "JWT_TOKEN",
  "role": "user"
}
```

---

## 👥 Users (Admin Only)
### 2. POST /users
**Deskripsi:** Tambah user baru.

**Request Header:**
```
Authorization: Bearer <token_admin>
```

**Request Body:**
```json
{
  "nim": "33241007",
  "nama": "Budi Santoso",
  "password": "123456"
}
```

**Response:**
```json
{
  "message": "User created successfully"
}
```

---

## 🗳️ Voting
### 3. GET /votings
**Deskripsi:** Ambil semua daftar voting aktif.

**Response:**
```json
[
  {
    "voting_id": 1,
    "nama_voting": "Pemilihan Ketua HIMATIF",
    "waktu_mulai": "2025-10-20T08:00:00",
    "waktu_selesai": "2025-10-20T16:00:00"
  }
]
```

### 4. POST /votings (Admin)
**Deskripsi:** Buat voting baru.

**Request Header:**
```
Authorization: Bearer <token_admin>
```

**Request Body:**
```json
{
  "nama_voting": "Pemilihan Ketua Himpunan",
  "waktu_mulai": "2025-10-20T08:00:00",
  "waktu_selesai": "2025-10-20T16:00:00"
}
```

**Response:**
```json
{
  "message": "Voting created successfully"
}
```

---

## 👤 Candidates
### 5. GET /candidates/:voting_id
**Deskripsi:** Ambil daftar kandidat berdasarkan voting ID.

**Response:**
```json
[
  {
    "id": 1,
    "nama": "Arya Danuwarta",
    "nim": "33241006",
    "foto_url": "https://example.com/foto1.jpg",
    "deskripsi": "Visi: Membawa HIMATIF jadi lebih inovatif."
  }
]
```

### 6. POST /candidates (Admin)
**Deskripsi:** Tambah kandidat baru.

**Request Header:**
```
Authorization: Bearer <token_admin>
```

**Request Body:**
```json
{
  "nama": "Arya Danuwarta",
  "nim": "33241006",
  "foto_url": "https://example.com/foto1.jpg",
  "deskripsi": "Visi: Membangun dunia digital di dunia tiputipu.",
  "voting_id": 1
}
```

**Response:**
```json
{
  "message": "Candidate added successfully"
}
```

---

## 🗳️ Votes
### 7. POST /votes
**Deskripsi:** User memilih kandidat.

**Request Header:**
```
Authorization: Bearer <token_user>
```

**Request Body:**
```json
{
  "voting_id": 1,
  "candidate_id": 2
}
```

**Response:**
```json
{
  "message": "Vote submitted successfully"
}
```

---

## 📊 Results
### 8. GET /results/:voting_id (Admin)
**Deskripsi:** Ambil hasil voting berdasarkan voting ID.

**Request Header:**
```
Authorization: Bearer <token_admin>
```

**Response:**
```json
[
  {
    "candidate_id": 1,
    "nama": "Arya Danuwarta",
    "total_votes": 42
  }
]
```

---

## 🚪 Logout (Client Side)
**Deskripsi:** Logout dilakukan dengan cara menghapus token JWT dari localStorage/session.
