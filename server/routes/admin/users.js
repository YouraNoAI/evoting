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