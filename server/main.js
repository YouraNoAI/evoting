// server.js
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- ENV CONFIG ----------
const {
  DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME,
  JWT_SECRET, JWT_EXPIRES_IN = '7d', PORT = 4000
} = process.env;

if (!DB_HOST || !DB_USER || !DB_NAME || !JWT_SECRET) {
  console.error('Missing .env config');
  process.exit(1);
}

// ---------- DATABASE ----------
const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT || 3306,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// ---------- EXPRESS ----------
const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- UPLOADS ----------
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });
app.use('/uploads', express.static(uploadDir));

// ---------- HELPERS ----------
const signToken = (nim, role, sessionId) =>
  jwt.sign({ nim, role, sid: sessionId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

async function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ error: 'no token' });

  const token = auth.split(' ')[1];
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'invalid token' });
  }

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      'SELECT valid FROM sessions WHERE id = ? AND token = ? LIMIT 1',
      [payload.sid, token]
    );
    if (rows.length === 0 || rows[0].valid !== 1)
      return res.status(401).json({ error: 'session invalid' });
    req.user = { nim: payload.nim, role: payload.role, sid: payload.sid, token };
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  } finally {
    conn.release();
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'unauth' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  next();
}

// ---------- AUTH ----------
app.post('/api/auth/login', async (req, res) => {
  const { nim, password } = req.body;
  if (!nim || !password) return res.status(400).json({ error: 'nim & password required' });

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute('SELECT nim, nama, password, role FROM users WHERE nim = ? LIMIT 1', [nim]);
    if (rows.length === 0) return res.status(401).json({ error: 'invalid credentials' });

    const user = rows[0];
    const ok = password === user.password || await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    const [ins] = await conn.execute('INSERT INTO sessions (user_nim, token, valid) VALUES (?, ?, 1)', [nim, '']);
    const sid = ins.insertId;
    const token = signToken(nim, user.role, sid);
    await conn.execute('UPDATE sessions SET token = ? WHERE id = ?', [token, sid]);

    res.json({ token, nim: user.nim, nama: user.nama, role: user.role });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ error: 'server error' });
  } finally {
    conn.release();
  }
});

app.post('/api/auth/logout', authenticate, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.execute('UPDATE sessions SET valid = 0 WHERE id = ?', [req.user.sid]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  } finally {
    conn.release();
  }
});

// ---------- VOTING ----------
app.get('/api/votings', authenticate, async (_, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      'SELECT voting_id, nama_voting, waktu_mulai, waktu_selesai FROM votings ORDER BY waktu_mulai DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  } finally {
    conn.release();
  }
});

app.get('/api/votings/:id/candidates', authenticate, async (req, res) => {
  const id = Number(req.params.id);
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      'SELECT candidate_id, nama, nim, foto_url, deskripsi, visi_misi FROM candidates WHERE voting_id = ?',
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  } finally {
    conn.release();
  }
});

app.post('/api/votings/:id/vote', authenticate, async (req, res) => {
  const votingId = Number(req.params.id);
  const { candidate_id } = req.body;
  const nim = req.user.nim;
  if (!votingId || !candidate_id) return res.status(400).json({ error: 'invalid payload' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [cand] = await conn.execute(
      'SELECT candidate_id FROM candidates WHERE candidate_id = ? AND voting_id = ? LIMIT 1',
      [candidate_id, votingId]
    );
    if (!cand.length) {
      await conn.rollback();
      return res.status(400).json({ error: 'candidate not found' });
    }

    const [prev] = await conn.execute(
      'SELECT 1 FROM votes WHERE user_nim = ? AND voting_id = ? LIMIT 1',
      [nim, votingId]
    );
    if (prev.length) {
      await conn.rollback();
      return res.status(409).json({ error: 'already voted' });
    }

    await conn.execute(
      'INSERT INTO votes (user_nim, candidate_id, voting_id) VALUES (?, ?, ?)',
      [nim, candidate_id, votingId]
    );
    await conn.execute('UPDATE sessions SET valid = 0 WHERE id = ?', [req.user.sid]);
    await conn.commit();

    res.json({ ok: true, message: 'vote recorded' });
  } catch (err) {
    await conn.rollback();
    console.error('VOTE ERROR:', err);
    res.status(500).json({ error: 'server error' });
  } finally {
    conn.release();
  }
});

// ---------- ADMIN ----------
app.post('/api/admin/users', authenticate, requireAdmin, async (req, res) => {
  const { nim, nama, password, role = 'user' } = req.body;
  if (!nim || !nama || !password)
    return res.status(400).json({ error: 'nim,nama,password required' });
  const hash = await bcrypt.hash(password, 10);
  const conn = await pool.getConnection();
  try {
    await conn.execute(
      'INSERT INTO users (nim, nama, password, role) VALUES (?, ?, ?, ?)',
      [nim, nama, hash, role]
    );
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'nim exists' });
    console.error(err);
    res.status(500).json({ error: 'server error' });
  } finally {
    conn.release();
  }
});

app.post('/api/admin/votings', authenticate, requireAdmin, async (req, res) => {
  const { nama_voting, waktu_mulai, waktu_selesai } = req.body;
  if (!nama_voting || !waktu_mulai || !waktu_selesai)
    return res.status(400).json({ error: 'fields required' });
  const conn = await pool.getConnection();
  try {
    const [ins] = await conn.execute(
      'INSERT INTO votings (nama_voting, waktu_mulai, waktu_selesai) VALUES (?, ?, ?)',
      [nama_voting, waktu_mulai, waktu_selesai]
    );
    res.status(201).json({ ok: true, voting_id: ins.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  } finally {
    conn.release();
  }
});

app.post('/api/admin/upload-foto', authenticate, requireAdmin, upload.single('foto'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.get('/api/admin/fotos', authenticate, requireAdmin, (_, res) => {
  try {
    const files = fs.readdirSync(uploadDir);
    const urls = files.map(f => `/uploads/${f}`);
    res.json(urls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'cannot read uploads' });
  }
});

// FIX: pakai multer buat tangkap FormData
app.post(
  '/api/admin/votings/:id/candidates',
  authenticate,
  requireAdmin,
  upload.single('foto'),
  async (req, res) => {
    // fallback biar ga crash kalo req.body undefined
    const body = req.body || {};
    const nama = body.nama || '';
    const nim = body.nim || '';
    const deskripsi = body.deskripsi || '';
    const visi_misi = body.visi_misi || '';
    const votingId = Number(req.params.id);
    const foto_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (!nama || !nim || !foto_url)
      return res.status(400).json({ error: 'nama,nim,foto required' });

    const conn = await pool.getConnection();
    try {
      await conn.execute(
        'INSERT INTO candidates (voting_id, nama, nim, foto_url, deskripsi, visi_misi) VALUES (?, ?, ?, ?, ?, ?)',
        [votingId, nama, nim, foto_url, deskripsi, visi_misi]
      );
      res.json({ ok: true });
    } catch (err) {
      console.error('ADD CANDIDATE ERROR:', err);
      res.status(500).json({ error: 'server error' });
    } finally {
      conn.release();
    }
  }
);


app.get('/api/admin/votings/:id/results', authenticate, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(`
      SELECT c.candidate_id, c.nama, c.nim, COUNT(v.vote_id) AS votes
      FROM candidates c
      LEFT JOIN votes v ON v.candidate_id = c.candidate_id AND v.voting_id = ?
      WHERE c.voting_id = ?
      GROUP BY c.candidate_id, c.nama, c.nim
      ORDER BY votes DESC
    `, [id, id]);
    res.json({ voting_id: id, results: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  } finally {
    conn.release();
  }
});

// ---------- START ----------
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
