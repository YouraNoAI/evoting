# 📄 Voting App API Documentation

Base URL: `http://localhost:4000/api`

---

## 🔐 Authentication

### POST `/auth/login`

Login user dengan NIM dan password.

**Request Body**

```json
{
  "nim": "123456",
  "password": "secret"
}
```

**Response**

```json
{
  "token": "JWT_TOKEN",
  "nim": "123456",
  "nama": "Arya Danuwarta",
  "role": "user"
}
```

**Errors**

* 400: NIM and password required
* 401: Invalid credentials

---

### POST `/auth/logout`

Logout user, menonaktifkan sesi.

**Headers**

```
Authorization: Bearer JWT_TOKEN
```

**Response**

```json
{
  "message": "Logged out successfully."
}
```

---

## 🗳 Voting Endpoints (User)

### GET `/votings`

Ambil daftar voting.

**Headers**

```
Authorization: Bearer JWT_TOKEN
```

**Response**

```json
[
  {
    "voting_id": 1,
    "nama_voting": "Pemilihan Ketua",
    "waktu_mulai": "2025-10-01T08:00:00Z",
    "waktu_selesai": "2025-10-05T17:00:00Z"
  }
]
```

---

### GET `/votings/:id/candidates`

Ambil daftar kandidat untuk voting tertentu.

**Response**

```json
[
  {
    "candidate_id": 1,
    "nama": "John Doe",
    "nim": "123456",
    "foto_url": "/uploads/abc123.jpg",
    "deskripsi": "Deskripsi kandidat",
    "visi_misi": "Visi misi kandidat"
  }
]
```

---

### POST `/votings/:id/vote`

Voting untuk kandidat.

**Request Body**

```json
{
  "candidate_id": 1
}
```

**Response**

```json
{
  "message": "Your vote has been successfully recorded."
}
```

**Errors**

* 400: Invalid voting ID or candidate ID
* 409: User already voted

---

## 🛠 Admin Endpoints

### GET `/admin/votings`

Ambil daftar voting (admin only).

### POST `/admin/votings`

Buat voting baru.

**Request Body**

```json
{
  "nama_voting": "Pemilihan Ketua",
  "waktu_mulai": "2025-10-01T08:00:00Z",
  "waktu_selesai": "2025-10-05T17:00:00Z"
}
```

**Response**

```json
{
  "message": "Voting created successfully.",
  "voting_id": 1
}
```

### PUT `/admin/votings/:id`

Update voting tertentu.

**Request Body**

```json
{
  "nama_voting": "Pemilihan Ketua Baru",
  "waktu_mulai": "2025-10-02T08:00:00Z",
  "waktu_selesai": "2025-10-06T17:00:00Z"
}
```

### DELETE `/admin/votings/:id`

Hapus voting beserta kandidat dan vote.

---

### POST `/admin/users`

Buat user baru.

**Request Body**

```json
{
  "nim": "123456",
  "nama": "Arya Danuwarta",
  "password": "secret",
  "role": "user"
}
```

---

### POST `/admin/upload-foto`

Upload foto kandidat.

**Form-data**

* `foto` (file)

**Response**

```json
{
  "message": "Photo uploaded successfully.",
  "url": "/uploads/abc123.jpg"
}
```

---

### POST `/admin/votings/:id/candidates`

Tambahkan kandidat ke voting.

**Form-data**

* `nama`
* `nim`
* `deskripsi` (opsional)
* `visi_misi` (opsional)
* `foto` (file)

---

### PUT `/admin/votings/:id/candidates/:cid`

Update kandidat (foto opsional).

### DELETE `/admin/votings/:id/candidates/:cid`

Hapus kandidat beserta vote dan foto.

---

### GET `/admin/votings/:id/results`

Dapatkan hasil voting.

**Response**

```json
{
  "voting_id": 1,
  "results": [
    {
      "candidate_id": 1,
      "nama": "John Doe",
      "nim": "123456",
      "foto_url": "/uploads/abc123.jpg",
      "deskripsi": "Deskripsi kandidat",
      "visi_misi": "Visi misi kandidat",
      "votes": 10
    }
  ]
}
```

> Semua endpoint admin membutuhkan header `Authorization: Bearer JWT_TOKEN` dan role admin. User biasa hanya bisa akses voting, candidates, dan voting submission.
