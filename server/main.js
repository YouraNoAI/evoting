import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { fileURLToPath } from 'url';

// --- CONFIGURATION ---
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {
  DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME,
  JWT_SECRET, JWT_EXPIRES_IN = '7d', PORT = 4000
} = process.env;

if (!DB_HOST || !DB_USER || !DB_NAME || !JWT_SECRET) {
  console.error('❌ Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

// --- DATABASE CONNECTION POOL ---
const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT || 3306,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// --- EXPRESS APP SETUP ---
const app = express();
app.use(cors({
  origin: "http://localhost:5173", // Allow requests from your frontend
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- FILE UPLOAD CONFIGURATION ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`📂 Created upload directory: ${uploadDir}`);
}
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });
app.use('/uploads', express.static(uploadDir)); // Serve static files from 'uploads'

// --- AUTHENTICATION & AUTHORIZATION HELPERS ---

/**
 * Signs a JWT token for a user.
 * @param {string} nim - User's NIM.
 * @param {string} role - User's role (e.g., 'user', 'admin').
 * @param {number} sessionId - ID of the user's session.
 * @returns {string} Signed JWT token.
 */
const signToken = (nim, role, sessionId) =>
  jwt.sign({ nim, role, sid: sessionId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

/**
 * Middleware to authenticate user via JWT token.
 * Populates `req.user` with nim, role, sid, and token if successful.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token required.' });
  }

  const token = authHeader.split(' ')[1];
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      'SELECT valid FROM sessions WHERE id = ? AND token = ? LIMIT 1',
      [payload.sid, token]
    );
    if (rows.length === 0 || rows[0].valid !== 1) {
      return res.status(401).json({ error: 'Session invalid or not found. Please log in again.' });
    }
    req.user = { nim: payload.nim, role: payload.role, sid: payload.sid, token };
    next();
  } catch (err) {
    console.error('🔑 AUTHENTICATION ERROR:', err);
    res.status(500).json({ error: 'Server error during authentication.' });
  } finally {
    conn.release();
  }
}

/**
 * Middleware to restrict access to admin users only.
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized. User not authenticated.' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Admin access required.' });
  }
  next();
}

// --- API ROUTES ---

// --- AUTHENTICATION ROUTES ---
app.post('/api/auth/login', async (req, res) => {
  const { nim, password } = req.body;
  if (!nim || !password) {
    return res.status(400).json({ error: 'NIM and password are required.' });
  }

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute('SELECT nim, nama, password, role FROM users WHERE nim = ? LIMIT 1', [nim]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = rows[0];
    // Check plaintext password or hashed password
    const passwordMatch = password === user.password || await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Create a new session for the user
    const [insertResult] = await conn.execute('INSERT INTO sessions (user_nim, token, valid) VALUES (?, ?, 1)', [nim, '']);
    const sessionId = insertResult.insertId;
    const token = signToken(nim, user.role, sessionId);
    await conn.execute('UPDATE sessions SET token = ? WHERE id = ?', [token, sessionId]);

    res.json({ token, nim: user.nim, nama: user.nama, role: user.role });
  } catch (err) {
    console.error('🔒 LOGIN ERROR:', err);
    res.status(500).json({ error: 'Server error during login.' });
  } finally {
    conn.release();
  }
});

app.post('/api/auth/logout', authenticate, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    // Invalidate the current session
    await conn.execute('UPDATE sessions SET valid = 0 WHERE id = ?', [req.user.sid]);
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error('🚪 LOGOUT ERROR:', err);
    res.status(500).json({ error: 'Server error during logout.' });
  } finally {
    conn.release();
  }
});

// --- USER VOTING ROUTES ---
app.get('/api/votings', authenticate, async (_, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      'SELECT voting_id, nama_voting, waktu_mulai, waktu_selesai FROM votings ORDER BY waktu_mulai DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('🗳️ GET VOTINGS ERROR:', err);
    res.status(500).json({ error: 'Server error fetching votings.' });
  } finally {
    conn.release();
  }
});

app.get('/api/votings/:id', authenticate, async (req, res) => {
  const votingId = Number(req.params.id);
  if (isNaN(votingId)) return res.status(400).json({ error: 'Invalid voting ID.' });

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      'SELECT voting_id, nama_voting, waktu_mulai, waktu_selesai FROM votings WHERE voting_id = ? LIMIT 1',
      [votingId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Voting tidak ditemukan di database' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('🗳️ GET VOTING DETAIL ERROR:', err);
    res.status(500).json({ error: 'Server error fetching voting detail.' });
  } finally {
    conn.release();
  }
});

app.get('/api/votings/:id/candidates', authenticate, async (req, res) => {
  const votingId = Number(req.params.id);
  if (isNaN(votingId)) return res.status(400).json({ error: 'Invalid voting ID.' });

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      'SELECT candidate_id, nama, nim, foto_url, deskripsi, visi_misi FROM candidates WHERE voting_id = ?',
      [votingId]
    );
    res.json(rows);
  } catch (err) {
    console.error('🧑‍🤝‍🧑 GET CANDIDATES ERROR:', err);
    res.status(500).json({ error: 'Server error fetching candidates.' });
  } finally {
    conn.release();
  }
});

app.post('/api/votings/:id/vote', authenticate, async (req, res) => {
  const votingId = Number(req.params.id);
  const { candidate_id } = req.body;
  const { nim, sid } = req.user;

  if (isNaN(votingId) || !candidate_id) {
    return res.status(400).json({ error: 'Invalid voting ID or candidate ID.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Check if candidate exists for this voting
    const [candidateCheck] = await conn.execute(
      'SELECT candidate_id FROM candidates WHERE candidate_id = ? AND voting_id = ? LIMIT 1',
      [candidate_id, votingId]
    );
    if (candidateCheck.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Candidate not found for this voting.' });
    }

    // Check if user has already voted in this voting
    const [previousVote] = await conn.execute(
      'SELECT 1 FROM votes WHERE user_nim = ? AND voting_id = ? LIMIT 1',
      [nim, votingId]
    );
    if (previousVote.length > 0) {
      await conn.rollback();
      return res.status(409).json({ error: 'Voting nya sekali aja bre, jangan serakah 😭' });
    }

    // Record the vote
    await conn.execute(
      'INSERT INTO votes (user_nim, candidate_id, voting_id) VALUES (?, ?, ?)',
      [nim, candidate_id, votingId]
    );
    // Invalidate the user's session after voting to prevent multiple votes
    await conn.execute('UPDATE sessions SET valid = 0 WHERE id = ?', [sid]);
    await conn.commit();

    res.json({ message: 'Your vote has been successfully recorded.' });
  } catch (err) {
    await conn.rollback();
    console.error('📩 VOTE RECORDING ERROR:', err);
    res.status(500).json({ error: 'Server error processing your vote.' });
  } finally {
    conn.release();
  }
});


// GET voting results for a specific voting (authenticated users)
app.get('/api/votings/:id/results', authenticate, async (req, res) => {
  const votingId = Number(req.params.id);
  if (isNaN(votingId)) return res.status(400).json({ error: 'Invalid voting ID.' });

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(`
      SELECT c.candidate_id, c.nama, c.nim, c.foto_url, c.deskripsi, c.visi_misi, COUNT(v.vote_id) AS votes
      FROM candidates c
      LEFT JOIN votes v ON v.candidate_id = c.candidate_id AND v.voting_id = ?
      WHERE c.voting_id = ?
      GROUP BY c.candidate_id, c.nama, c.nim, c.foto_url, c.deskripsi, c.visi_misi
      ORDER BY votes DESC
    `, [votingId, votingId]);

    const totalVotes = rows.reduce((sum, r) => sum + Number(r.votes || 0), 0);
    res.json({ voting_id: votingId, totalVotes, results: rows });
  } catch (err) {
    console.error('📈 GET RESULTS ERROR:', err);
    res.status(500).json({ error: 'Server error fetching voting results.' });
  } finally {
    conn.release();
  }
});

// DELETE a candidate from a specific voting
app.delete('/api/admin/votings/:id/candidates/:cid', authenticate, requireAdmin, async (req, res) => {
  const votingId = Number(req.params.id);
  const candidateId = Number(req.params.cid);
  if (isNaN(votingId) || isNaN(candidateId)) {
    return res.status(400).json({ error: 'Invalid voting ID or candidate ID.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Ambil data kandidat biar bisa hapus file foto juga
    const [rows] = await conn.execute(
      'SELECT foto_url FROM candidates WHERE candidate_id = ? AND voting_id = ? LIMIT 1',
      [candidateId, votingId]
    );
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Candidate not found for this voting.' });
    }

    const fotoUrl = rows[0].foto_url;
    // Hapus kandidat dari database
    const [result] = await conn.execute(
      'DELETE FROM candidates WHERE candidate_id = ? AND voting_id = ?',
      [candidateId, votingId]
    );

    await conn.commit();

    // Hapus file foto dari storage
    if (fotoUrl) {
      try {
        const filePath = path.join(__dirname, fotoUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Deleted candidate photo: ${filePath}`);
        }
      } catch (e) {
        console.warn('⚠️ Failed to delete candidate photo:', e.message);
      }
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    res.json({ message: 'Candidate deleted successfully.' });
  } catch (err) {
    await conn.rollback();
    console.error('🗑️ ADMIN DELETE CANDIDATE ERROR:', err);
    res.status(500).json({ error: 'Server error deleting candidate.' });
  } finally {
    conn.release();
  }
});


// --- ADMIN ROUTES ---

// GET all votings for admin view
app.get('/api/admin/votings', authenticate, requireAdmin, async (_, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      'SELECT voting_id, nama_voting, waktu_mulai, waktu_selesai FROM votings ORDER BY waktu_mulai DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('📊 ADMIN GET VOTINGS ERROR:', err);
    res.status(500).json({ error: 'Server error fetching votings for admin.' });
  } finally {
    conn.release();
  }
});

// CREATE a new voting
app.post('/api/admin/votings', authenticate, requireAdmin, async (req, res) => {
  const { nama_voting, waktu_mulai, waktu_selesai } = req.body;
  if (!nama_voting || !waktu_mulai || !waktu_selesai) {
    return res.status(400).json({ error: 'Voting name, start time, and end time are required.' });
  }

  const conn = await pool.getConnection();
  try {
    const [insertResult] = await conn.execute(
      'INSERT INTO votings (nama_voting, waktu_mulai, waktu_selesai) VALUES (?, ?, ?)',
      [nama_voting, waktu_mulai, waktu_selesai]
    );
    res.status(201).json({ message: 'Voting created successfully.', voting_id: insertResult.insertId });
  } catch (err) {
    console.error('➕ ADMIN CREATE VOTING ERROR:', err);
    res.status(500).json({ error: 'Server error creating new voting.' });
  } finally {
    conn.release();
  }
});

// UPDATE an existing voting
app.put('/api/admin/votings/:id', authenticate, requireAdmin, async (req, res) => {
  const votingId = Number(req.params.id);
  const { nama_voting, waktu_mulai, waktu_selesai } = req.body;
  if (isNaN(votingId) || !nama_voting || !waktu_mulai || !waktu_selesai) {
    return res.status(400).json({ error: 'Invalid voting ID or missing fields.' });
  }

  const conn = await pool.getConnection();
  try {
    const [result] = await conn.execute(
      'UPDATE votings SET nama_voting = ?, waktu_mulai = ?, waktu_selesai = ? WHERE voting_id = ?',
      [nama_voting, waktu_mulai, waktu_selesai, votingId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Voting not found.' });
    }
    res.json({ message: 'Voting updated successfully.' });
  } catch (err) {
    console.error('✏️ ADMIN UPDATE VOTING ERROR:', err);
    res.status(500).json({ error: 'Server error updating voting.' });
  } finally {
    conn.release();
  }
});

// DELETE a voting
app.delete('/api/admin/votings/:id', authenticate, requireAdmin, async (req, res) => {
  const votingId = Number(req.params.id);
  if (isNaN(votingId)) return res.status(400).json({ error: 'Invalid voting ID.' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('DELETE FROM votes WHERE voting_id = ?', [votingId]); // Delete associated votes
    await conn.execute('DELETE FROM candidates WHERE voting_id = ?', [votingId]); // Delete associated candidates
    const [result] = await conn.execute('DELETE FROM votings WHERE voting_id = ?', [votingId]); // Delete the voting itself
    await conn.commit();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Voting not found.' });
    }
    res.json({ message: 'Voting and all associated data deleted successfully.' });
  } catch (err) {
    await conn.rollback();
    console.error('🗑️ ADMIN DELETE VOTING ERROR:', err);
    res.status(500).json({ error: 'Server error deleting voting.' });
  } finally {
    conn.release();
  }
});

// --- ADMIN USER MANAGEMENT ROUTES ---

// List all users (admin)
app.get('/api/admin/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT nim, nama, role FROM users ORDER BY nim ASC');
    return res.json(rows);
  } catch (err) {
    console.error('GET /api/admin/users error:', err);
    return res.status(500).json({ error: 'server error' });
  }
});

// Get current user info (non-admin endpoint)
app.get('/api/users', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT nim, nama, role FROM users WHERE nim = ? LIMIT 1', [req.user.nim]);
    if (rows.length === 0) return res.status(404).json({ error: 'user not found' });
    return res.json(rows);
  } catch (err) {
    console.error('GET /api/users error:', err);
    return res.status(500).json({ error: 'server error' });
  }
});

// Update a user (admin)
app.put('/api/admin/users/:nim', authenticate, requireAdmin, async (req, res) => {
  const targetNim = String(req.params.nim);
  const { nama, role, password } = req.body || {};
  if (!nama && !role && !password) return res.status(400).json({ error: 'no fields to update' });

  try {
    const updates = [];
    const params = [];

    if (typeof nama !== 'undefined') { updates.push('nama = ?'); params.push(nama); }
    if (typeof role !== 'undefined') { updates.push('role = ?'); params.push(role); }
    if (typeof password !== 'undefined' && password) {
      // bcrypt may be available in your project; use a small fallback if not
      const hashed = (typeof bcrypt !== 'undefined') ? await bcrypt.hash(password, 10) : password;
      updates.push('password = ?'); params.push(hashed);
    }

    if (updates.length === 0) return res.status(400).json({ error: 'no valid fields' });

    params.push(targetNim);
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE nim = ?`;
    const [result] = await pool.execute(sql, params);

    if (result.affectedRows === 0) return res.status(404).json({ error: 'user not found' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/admin/users/:nim error:', err);
    return res.status(500).json({ error: 'server error' });
  }
});

// Delete a user (admin)
app.delete('/api/admin/users/:nim', authenticate, requireAdmin, async (req, res) => {
  const targetNim = String(req.params.nim);
  try {
    const [result] = await pool.execute('DELETE FROM users WHERE nim = ?', [targetNim]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'user not found' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/users/:nim error:', err);
    return res.status(500).json({ error: 'server error' });
  }
});



// CREATE a new user (admin only)
app.post('/api/admin/users', authenticate, requireAdmin, async (req, res) => {
  const { nim, nama, password, role = 'user' } = req.body;
  if (!nim || !nama || !password) {
    return res.status(400).json({ error: 'NIM, Name, and Password are required.' });
  }
  const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

  const conn = await pool.getConnection();
  try {
    await conn.execute(
      'INSERT INTO users (nim, nama, password, role) VALUES (?, ?, ?, ?)',
      [nim, nama, hashedPassword, role]
    );
    res.status(201).json({ message: 'User created successfully.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'User with this NIM already exists.' });
    }
    console.error('👤 ADMIN CREATE USER ERROR:', err);
    res.status(500).json({ error: 'Server error creating user.' });
  } finally {
    conn.release();
  }
});

// UPLOAD a single photo for candidates/etc.
app.post('/api/admin/upload-foto', authenticate, requireAdmin, upload.single('foto'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  res.json({ message: 'Photo uploaded successfully.', url: `/uploads/${req.file.filename}` });
});

// GET list of all uploaded photos (admin only)
app.get('/api/admin/fotos', authenticate, requireAdmin, (_, res) => {
  try {
    const files = fs.readdirSync(uploadDir);
    const urls = files.map(f => `/uploads/${f}`);
    res.json(urls);
  } catch (err) {
    console.error('🖼️ ADMIN GET PHOTOS ERROR:', err);
    res.status(500).json({ error: 'Server error reading uploaded photos.' });
  }
});

// ADD a candidate to a specific voting
app.post(
  '/api/admin/votings/:id/candidates',
  authenticate,
  requireAdmin,
  upload.single('foto'), // Handle single file upload for 'foto' field
  async (req, res) => {
    const votingId = Number(req.params.id);
    // Destructure body, providing default empty string for safety
    const { nama = '', nim = '', deskripsi = '', visi_misi = '' } = req.body;
    const foto_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (isNaN(votingId) || !nama || !nim || !foto_url) {
      // If no file was uploaded and foto_url is required, it will be null
      return res.status(400).json({ error: 'Voting ID, Name, NIM, and Photo are required.' });
    }

    const conn = await pool.getConnection();
    try {
      await conn.execute(
        'INSERT INTO candidates (voting_id, nama, nim, foto_url, deskripsi, visi_misi) VALUES (?, ?, ?, ?, ?, ?)',
        [votingId, nama, nim, foto_url, deskripsi, visi_misi]
      );
      res.status(201).json({ message: 'Candidate added successfully.' });
    } catch (err) {
      console.error('🧑‍💻 ADMIN ADD CANDIDATE ERROR:', err);
      res.status(500).json({ error: 'Server error adding candidate.' });
    } finally {
      conn.release();
    }
  }
);

// UPDATE a candidate in a specific voting (supports optional photo update)
app.put(
  '/api/admin/votings/:id/candidates/:cid',
  authenticate,
  requireAdmin,
  upload.single('foto'), // Handle single file upload for 'foto' field
  async (req, res) => {
    const votingId = Number(req.params.id);
    const candidateId = Number(req.params.cid);
    if (isNaN(votingId) || isNaN(candidateId)) {
      return res.status(400).json({ error: 'Invalid voting ID or candidate ID.' });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Get existing candidate data to check if photo needs to be deleted
      const [existingCandidate] = await conn.execute(
        'SELECT foto_url FROM candidates WHERE candidate_id = ? AND voting_id = ? LIMIT 1',
        [candidateId, votingId]
      );
      if (existingCandidate.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: 'Candidate not found for this voting.' });
      }
      const previousFotoUrl = existingCandidate[0].foto_url;

      const { nama, nim, deskripsi, visi_misi } = req.body;
      const newFotoUrl = req.file ? `/uploads/${req.file.filename}` : undefined; // Use undefined if no new file

      const updates = [];
      const params = [];

      if (typeof nama !== 'undefined') { updates.push('nama = ?'); params.push(nama); }
      if (typeof nim !== 'undefined') { updates.push('nim = ?'); params.push(nim); }
      if (typeof deskripsi !== 'undefined') { updates.push('deskripsi = ?'); params.push(deskripsi); }
      if (typeof visi_misi !== 'undefined') { updates.push('visi_misi = ?'); params.push(visi_misi); }
      if (newFotoUrl !== undefined) { updates.push('foto_url = ?'); params.push(newFotoUrl); }

      if (updates.length === 0) {
        await conn.rollback();
        return res.status(400).json({ error: 'No fields provided for update.' });
      }

      params.push(candidateId);
      params.push(votingId);

      const sql = `UPDATE candidates SET ${updates.join(', ')} WHERE candidate_id = ? AND voting_id = ?`;
      const [result] = await conn.execute(sql, params);

      if (result.affectedRows === 0) {
        await conn.rollback();
        return res.status(404).json({ error: 'Candidate not found or no changes made.' });
      }

      // If a new photo was uploaded and an old one existed, delete the old file
      if (newFotoUrl && previousFotoUrl && previousFotoUrl !== newFotoUrl) {
        try {
          const oldPath = path.join(__dirname, previousFotoUrl);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
            console.log(`🗑️ Deleted old photo: ${oldPath}`);
          }
        } catch (e) {
          console.warn('⚠️ Failed to remove old photo file:', e.message);
        }
      }
      await conn.commit();
      res.json({ message: 'Candidate updated successfully.' });
    } catch (err) {
      await conn.rollback();
      console.error('🔄 ADMIN UPDATE CANDIDATE ERROR:', err);
      res.status(500).json({ error: 'Server error updating candidate.' });
    } finally {
      conn.release();
    }
  }
);


// DELETE a candidate from a specific voting
app.delete('/api/admin/votings/:id/candidates/:cid', authenticate, requireAdmin, async (req, res) => {
  const votingId = Number(req.params.id);
  const candidateId = Number(req.params.cid);
  if (isNaN(votingId) || isNaN(candidateId)) {
    return res.status(400).json({ error: 'Invalid voting ID or candidate ID.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Get candidate's photo URL before deleting to remove the file
    const [candidateRows] = await conn.execute(
      'SELECT foto_url FROM candidates WHERE candidate_id = ? AND voting_id = ? LIMIT 1',
      [candidateId, votingId]
    );

    if (candidateRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    const fotoUrlToDelete = candidateRows[0].foto_url;

    await conn.execute('DELETE FROM votes WHERE candidate_id = ? AND voting_id = ?', [candidateId, votingId]); // Delete associated votes
    const [result] = await conn.execute('DELETE FROM candidates WHERE candidate_id = ? AND voting_id = ?', [candidateId, votingId]); // Delete the candidate

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    // Attempt to delete the associated photo file
    if (fotoUrlToDelete) {
      try {
        const filePath = path.join(__dirname, fotoUrlToDelete);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Deleted candidate photo file: ${filePath}`);
        }
      } catch (e) {
        console.warn('⚠️ Failed to remove candidate photo file:', e.message);
      }
    }

    await conn.commit();
    res.json({ message: 'Candidate and associated votes deleted successfully.' });
  } catch (err) {
    await conn.rollback();
    console.error('🔥 ADMIN DELETE CANDIDATE ERROR:', err);
    res.status(500).json({ error: 'Server error deleting candidate.' });
  } finally {
    conn.release();
  }
});


// GET voting results for a specific voting (admin only)
app.get('/api/admin/votings/:id/results', authenticate, requireAdmin, async (req, res) => {
  const votingId = Number(req.params.id);
  if (isNaN(votingId)) return res.status(400).json({ error: 'Invalid voting ID.' });

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(`
      SELECT c.candidate_id, c.nama, c.nim, c.foto_url, c.deskripsi, c.visi_misi, COUNT(v.vote_id) AS votes
      FROM candidates c
      LEFT JOIN votes v ON v.candidate_id = c.candidate_id AND v.voting_id = ?
      WHERE c.voting_id = ?
      GROUP BY c.candidate_id, c.nama, c.nim, c.foto_url, c.deskripsi, c.visi_misi
      ORDER BY votes DESC
    `, [votingId, votingId]);
    res.json({ voting_id: votingId, results: rows });
  } catch (err) {
    console.error('📈 ADMIN GET RESULTS ERROR:', err);
    res.status(500).json({ error: 'Server error fetching voting results.' });
  } finally {
    conn.release();
  }
});

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop.');
});