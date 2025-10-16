# Voting API Documentation

Base URL: `http://localhost:4000/api`

---

## 🔐 Auth

### Login

**POST** `/auth/login`
Body (JSON):

```json
{
  "nim": "33241006",
  "password": "password123"
}
```

Response (200 OK):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "nim": "33241006",
  "nama": "Arya Danuwarta",
  "role": "admin"
}
```

### Logout

**POST** `/auth/logout`
Headers: `Authorization: Bearer <token>`
Response (200 OK):

```json
{ "ok": true }
```

---

## 🗳 Votings

### Get all votings

**GET** `/votings`
Headers: `Authorization: Bearer <token>`
Response (200 OK):

```json
[
  {
    "voting_id": 20,
    "nama_voting": "Arya data",
    "waktu_mulai": "2025-10-16T13:46:00.000Z",
    "waktu_selesai": "2025-10-24T13:46:00.000Z"
  }
]
```

### Get candidates by voting

**GET** `/votings/:id/candidates`
Headers: `Authorization: Bearer <token>`
Response (200 OK):

```json
[
  {
    "candidate_id": 1,
    "nama": "Arya",
    "nim": "1234",
    "foto_url": "/uploads/12345.png",
    "deskripsi": "Calon hebat",
    "visi_misi": "Bawa perubahan"
  }
]
```

### Vote for a candidate

**POST** `/votings/:id/vote`
Headers: `Authorization: Bearer <token>`
Body (JSON):

```json
{
  "candidate_id": 1
}
```

Response (200 OK):

```json
{
  "ok": true,
  "message": "vote recorded"
}
```

Error jika sudah voting:

```json
{ "error": "already voted" }
```

---

## 🛠 Admin

> Semua endpoint admin butuh header: `Authorization: Bearer <admin_token>`

### Create user

**POST** `/admin/users`
Body (JSON):

```json
{
  "nim": "33241007",
  "nama": "Budi",
  "password": "secret",
  "role": "user"
}
```

Response (200 OK):

```json
{ "ok": true }
```

### Create voting

**POST** `/admin/votings`
Body (JSON):

```json
{
  "nama_voting": "Pemilu HIMATIF",
  "waktu_mulai": "2025-10-20T10:00:00Z",
  "waktu_selesai": "2025-10-25T10:00:00Z"
}
```

Response (201 Created):

```json
{ "ok": true, "voting_id": 21 }
```

### Upload candidate photo

**POST** `/admin/upload-foto`
FormData:

```
foto: <file>
```

Response:

```json
{ "url": "/uploads/123456.png" }
```

### Create candidate

**POST** `/admin/votings/:id/candidates`
FormData:

```
nama: "Arya"
nim: "1234"
foto: <file>
deskripsi: "Calon hebat"
visi_misi: "Bawa perubahan"
```

Response:

```json
{ "ok": true }
```

### List uploaded photos

**GET** `/admin/fotos`
Response:

```json
[
  "/uploads/12345.png",
  "/uploads/67890.png"
]
```

### Voting results

**GET** `/admin/votings/:id/results`
Response (200 OK):

```json
{
  "voting_id": 20,
  "results": [
    {
      "candidate_id": 1,
      "nama": "Arya",
      "nim": "1234",
      "votes": 10
    }
  ]
}
```

---

## ⚠️ Notes

* Semua request admin wajib pakai token admin.
* Endpoints `/votings/:id/candidates` & `/votings/:id/results` wajib voting ID yang valid.
* Foto candidate harus diupload sebelum membuat candidate agar `foto_url` tersedia.
* Password di-hash pakai bcrypt saat membuat user.
