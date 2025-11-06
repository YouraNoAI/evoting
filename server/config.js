import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {
  DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME,
  JWT_SECRET, JWT_EXPIRES_IN = '7d', PORT = 4000
} = process.env;

if (!DB_HOST || !DB_USER || !DB_NAME || !JWT_SECRET) {
  console.error('Missing required environment variables. Please check your .env file.');
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
  origin: true,
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
    console.error('AUTHENTICATION ERROR:', err);
    res.status(500).json({ error: 'Server error during authentication.' });
  } finally {
    conn.release();
  }
}

// Expose to other modules both via exports and globalThis so existing route files work without refactor
globalThis.app = app;
globalThis.pool = pool;
globalThis.authenticate = authenticate;
globalThis.signToken = signToken;
globalThis.upload = upload;
globalThis.uploadDir = uploadDir;
globalThis.fs = fs;
globalThis.path = path;
globalThis.bcrypt = bcrypt;
globalThis.PORT = PORT;

export { app, pool, authenticate, signToken, upload, uploadDir, PORT };
