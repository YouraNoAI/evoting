import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
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
    <div className="container py-4">
      <div className="d-flex justify-content-center align-items-center mb-4">
        <h2 className="mb-0 fw-bold border-bottom border-black border-3">VOTING YANG SEDANG BERLANGSUNG</h2>
      </div>

      <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
        {votings.map((v, idx) => {
          const id = v.voting_id ?? v.id ?? v._id ?? idx;
          const title = v.nama_voting ?? v.title ?? v.name ?? 'Untitled';
          const desc = v.description ?? v.deskripsi ?? '';
          const start = v.waktu_mulai ?? v.startDate ?? null;
          const end = v.waktu_selesai ?? v.endDate ?? null;
          const startStr = start ? new Date(start).toLocaleString() : '-';
          const endStr = end ? new Date(end).toLocaleString() : '-';

          return (
            <div key={id} className="col">
              <div
                role="button"
                tabIndex="0"
                onClick={() => navigate(`/select-voting/${id}`)}
                className="border border-2 border-black h-100 shadow-sm hover-shadow p-3 bg-warning"
                style={{ cursor: 'pointer' }}
              >
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title mb-1 fw-bold">{title}</h5>
                  {desc && <p className="card-text text-muted small mb-3">{desc}</p>}

                  <div className="mt-auto">
                    <div className="d-flex flex-column justify-content-between small text-muted text-start border-top pt-2 border-black">
                      <div>Mulai: <span className="fw-semibold">{startStr}</span></div>
                      <div className="mt-2 mt-sm-0">Selesai: <span className="fw-semibold">{endStr}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <button
      role='button'
        onClick={() => navigate("/")}
        className='btn btn-warning position-fixed bottom-0 end-0 fw-bold border border-3 border-black'
      >Logout</button>
    </div>
  );
}
