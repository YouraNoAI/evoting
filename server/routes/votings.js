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