import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios.jsx';

export default function User() {
  const [votings, setVotings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetchVotings = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/votings');
        if (!mounted) return;
        setVotings(res.data || []);
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Gagal memuat votings');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchVotings();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div>Memuat daftar voting...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!votings.length) return <div>Tidak ada voting yang sedang berlangsung.</div>;

  return (
    <div className="user-votings-page">
      <h2>Voting yang sedang berlangsung</h2>
      <div className="voting-list" style={{ display: 'grid', gap: 12 }}>
        {votings.map((v, idx) => (
          <button
            key={v.voting_id ?? v.id ?? v._id ?? idx}
            onClick={() => navigate(`/select-voting/${v.voting_id ?? v.id ?? v._id}`)}
            className="voting-item"
            style={{
              textAlign: 'left',
              padding: 12,
              border: '1px solid #ddd',
              borderRadius: 6,
              cursor: 'pointer',
              background: '#fff'
            }}
          >
            <div style={{ fontWeight: 600 }}>{v.nama_voting ?? v.title ?? v.name}</div>
            {v.description && <div style={{ fontSize: 13, color: '#555' }}>{v.description}</div>}
            <div style={{ marginTop: 6, fontSize: 12, color: '#888' }}>
              Mulai: {v.waktu_mulai ? new Date(v.waktu_mulai).toLocaleString() : (v.startDate ? new Date(v.startDate).toLocaleString() : '-')} — Selesai: {v.waktu_selesai ? new Date(v.waktu_selesai).toLocaleString() : (v.endDate ? new Date(v.endDate).toLocaleString() : '-')}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}