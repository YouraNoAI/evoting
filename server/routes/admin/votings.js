app.get('/api/admin/votings', authenticate, requireAdmin, async (_, res) => {
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.execute(
            'SELECT voting_id, nama_voting, waktu_mulai, waktu_selesai FROM votings ORDER BY waktu_mulai DESC'
        );
        res.json(rows);
    } catch (err) {
        console.error('ADMIN GET VOTINGS ERROR:', err);
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
        console.error('ADMIN GET RESULTS ERROR:', err);
        res.status(500).json({ error: 'Server error fetching voting results.' });
    } finally {
        conn.release();
    }
});
