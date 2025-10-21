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