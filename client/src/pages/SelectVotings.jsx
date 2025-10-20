import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios.jsx';
import { AuthContext } from '../context/AuthContext.jsx'

export default function SelectVotings() {
  const { id: votingId } = useParams();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [voted, setVoted] = useState(false);
  const { user } = useContext(AuthContext || {});
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/votings/${votingId}/candidates`);
        if (!mounted) return;
        setCandidates(res.data || []);
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Gagal memuat kandidat');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchCandidates();

    const checkVoted = async () => {
      try {
        const res = await axios.get(`/votings/${votingId}/status`);
        if (mounted && res.data) setVoted(!!res.data.alreadyVoted);
      } catch (_) {}
    };
    checkVoted();

    return () => { mounted = false; };
  }, [votingId]);

  const handleVote = async (candidateId) => {
    if (voted) {
      alert('Anda sudah memilih pada voting ini.');
      return;
    }
    if (!confirm('Yakin ingin memilih kandidat ini?')) return;

    try {
      await axios.post(`/votings/${votingId}/vote`, { candidateId });
      setVoted(true);
      alert('Terima kasih, suara Anda tercatat.');
      navigate('/user');
    } catch (err) {
      alert(err?.response?.data?.message || 'Gagal melakukan vote');
    }
  };

  if (loading) return <div>Memuat kandidat...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!candidates.length) return <div>Tidak ada kandidat untuk voting ini.</div>;

  return (
    <div className="select-voting-page">
      <h2>Daftar Kandidat</h2>
      <div className="candidate-grid">
        {candidates.map(c => (
          <div
            key={c.id || c._id}
            className={`candidate-card ${voted ? 'disabled' : ''}`}
            onClick={() => !voted && handleVote(c.id || c._id)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => { if (e.key === 'Enter' && !voted) handleVote(c.id || c._id); }}
          >
            <img
              src={c.photo || c.image || '/public/default-avatar.png'}
              alt={c.name}
              className="candidate-img"
            />
            <div className="candidate-info">
              <div className="name">{c.name}</div>
              {c.nim && <div className="nim">NIM: {c.nim}</div>}
              {c.description && <div className="desc">{c.description}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
