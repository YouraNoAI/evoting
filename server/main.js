require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const {
  DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME,
  JWT_SECRET, JWT_EXPIRES_IN = '7d', PORT = 4000
} = process.env;

if (!DB_HOST || !DB_USER || !DB_NAME || !JWT_SECRET) {
  console.error('Missing .env config');
  process.exit(1);
}

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT || 3306,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

const app = express();
app.use(cors());
app.use(express.json());

/* ---------- HELPERS ---------- */
const signToken = (nim, role, sessionId) => {
  return jwt.sign({ nim, role, sid: sessionId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// middleware: authenticate token & session valid
async function authenticate(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'no token' });
    const token = auth.split(' ')[1];
    let payload;
    try { payload = jwt.verify(token, JWT_SECRET); }
    catch (e) { return res.status(401).json({ error: 'invalid token' }); }

    // check session valid
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute('SELECT valid FROM sessions WHERE id = ? AND token = ? LIMIT 1', [payload.sid, token]);
      if (rows.length === 0 || rows[0].valid !== 1) return res.status(401).json({ error: 'session invalid' });
    } finally { conn.release(); }

    req.user = { nim: payload.nim, role: payload.role, sid: payload.sid, token };
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'unauth' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  next();
}

/* ---------- AUTH ---------- */
// login: nim + password -> buat session & return token
app.post('/api/auth/login', async (req, res) => {
  const { nim, password } = req.body;
  if (!nim || !password) return res.status(400).json({ error: 'nim & password required' });

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute('SELECT nim, nama, password, role FROM users WHERE nim = ? LIMIT 1', [nim]);
    if (rows.length === 0) return res.status(401).json({ error: 'invalid credentials' });

    const user = rows[0];
    const ok = password === user.password;
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    // create session record
    const [ins] = await conn.execute('INSERT INTO sessions (user_nim, token, valid) VALUES (?, ?, 1)', [nim, '']); // token placeholder
    const sessionId = ins.insertId;
    const token = signToken(nim, user.role, sessionId);

    // update session token
    await conn.execute('UPDATE sessions SET token = ? WHERE id = ?', [token, sessionId]);

    res.json({ token, nim: user.nim, nama: user.nama, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  } finally { conn.release(); }
});

// logout: invalidate session
app.post('/api/auth/logout', authenticate, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.execute('UPDATE sessions SET valid = 0 WHERE id = ?', [req.user.sid]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  } finally { conn.release(); }
});

/* ---------- USER FLOWS ---------- */
// list votings (only those that are ongoing; frontend can show all too)
app.get('/api/votings', authenticate, async (req, res) => {
  const now = new Date();
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      'SELECT voting_id, nama_voting, waktu_mulai, waktu_selesai FROM votings ORDER BY waktu_mulai DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  } finally { conn.release(); }
});

// list candidates per voting
app.get('/api/votings/:id/candidates', authenticate, async (req, res) => {
  const votingId = Number(req.params.id);
  if (!votingId) return res.status(400).json({ error: 'invalid voting id' });
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute('SELECT candidate_id, nama, nim, foto_url, deskripsi, visi_misi FROM candidates WHERE voting_id = ?', [votingId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  } finally { conn.release(); }
});

// vote -> insert vote, then auto-logout (invalidate session)
app.post('/api/votings/:id/vote', authenticate, async (req, res) => {
  const votingId = Number(req.params.id);
  const { candidate_id } = req.body;
  const userNim = req.user.nim;

  if (!votingId || !candidate_id) return res.status(400).json({ error: 'invalid payload' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // check candidate belongs to voting
    const [candRows] = await conn.execute('SELECT candidate_id FROM candidates WHERE candidate_id = ? AND voting_id = ? LIMIT 1', [candidate_id, votingId]);
    if (candRows.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'candidate not found for this voting' });
    }

    // check if user already voted in this voting
    const [prev] = await conn.execute('SELECT 1 FROM votes WHERE user_nim = ? AND voting_id = ? LIMIT 1', [userNim, votingId]);
    if (prev.length) {
      await conn.rollback();
      return res.status(409).json({ error: 'already voted' });
    }

    // insert vote
    await conn.execute('INSERT INTO votes (user_nim, candidate_id, voting_id) VALUES (?, ?, ?)', [userNim, candidate_id, votingId]);

    // invalidate session -> auto logout
    await conn.execute('UPDATE sessions SET valid = 0 WHERE id = ?', [req.user.sid]);

    await conn.commit();
    res.json({ ok: true, message: 'vote recorded, session invalidated (logged out)' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'server error' });
  } finally { conn.release(); }
});

/* ---------- ADMIN ---------- */
// create user (admin)
app.post('/api/admin/users', authenticate, requireAdmin, async (req, res) => {
  const { nim, nama, password, role = 'user' } = req.body;
  if (!nim || !nama || !password) return res.status(400).json({ error: 'nim,nama,password required' });
  const hash = await bcrypt.hash(password, 10);
  const conn = await pool.getConnection();
  try {
    await conn.execute('INSERT INTO users (nim, nama, password, role) VALUES (?, ?, ?, ?)', [nim, nama, hash, role]);
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'nim exists' });
    console.error(err);
    res.status(500).json({ error: 'server error' });
  } finally { conn.release(); }
});

// create voting (admin)
app.post('/api/admin/votings', authenticate, requireAdmin, async (req, res) => {
  const { nama_voting, waktu_mulai, waktu_selesai } = req.body;
  if (!nama_voting || !waktu_mulai || !waktu_selesai) return res.status(400).json({ error: 'missing fields' });
  const conn = await pool.getConnection();
  try {
    const [ins] = await conn.execute('INSERT INTO votings (nama_voting, waktu_mulai, waktu_selesai) VALUES (?, ?, ?)', [nama_voting, waktu_mulai, waktu_selesai]);
    res.json({ ok: true, voting_id: ins.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  } finally { conn.release(); }
});

// add candidate to voting (admin)
app.post('/api/admin/votings/:id/candidates', authenticate, requireAdmin, async (req, res) => {
  const votingId = Number(req.params.id);
  const { nama, nim, foto_url, deskripsi, visi_misi } = req.body;
  if (!votingId || !nama) return res.status(400).json({ error: 'invalid payload' });
  const conn = await pool.getConnection();
  try {
    // ensure voting exists
    const [v] = await conn.execute('SELECT 1 FROM votings WHERE voting_id = ? LIMIT 1', [votingId]);
    if (!v.length) return res.status(404).json({ error: 'voting not found' });

    const [ins] = await conn.execute('INSERT INTO candidates (nama, nim, foto_url, deskripsi, visi_misi, voting_id) VALUES (?, ?, ?, ?, ?, ?)', [nama, nim || null, foto_url || null, deskripsi || null, visi_misi || null, votingId]);
    res.json({ ok: true, candidate_id: ins.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  } finally { conn.release(); }
});

// admin view results for a voting
app.get('/api/admin/votings/:id/results', authenticate, requireAdmin, async (req, res) => {
  const votingId = Number(req.params.id);
  const conn = await pool.getConnection();
  try {
    // counts per candidate
    const [rows] = await conn.execute(`
      SELECT c.candidate_id, c.nama, c.nim, COUNT(v.vote_id) AS votes
      FROM candidates c
      LEFT JOIN votes v ON v.candidate_id = c.candidate_id AND v.voting_id = ?
      WHERE c.voting_id = ?
      GROUP BY c.candidate_id, c.nama, c.nim
      ORDER BY votes DESC
    `, [votingId, votingId]);
    res.json({ voting_id: votingId, results: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  } finally { conn.release(); }
});

/* ---------- START ---------- */
app.listen(PORT, () => console.log('Server listening on', PORT));