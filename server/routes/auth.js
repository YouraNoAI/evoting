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
    console.error('LOGOUT ERROR:', err);
    res.status(500).json({ error: 'Server error during logout.' });
  } finally {
    conn.release();
  }
});
