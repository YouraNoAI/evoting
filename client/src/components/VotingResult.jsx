import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";

export default function VotingResults() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [voting, setVoting] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [results, setResults] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");

        const resVoting = await fetch(`http://localhost:4000/api/votings/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resVoting.ok) throw new Error("Gagal mengambil data voting");
        const votingData = await resVoting.json();
        setVoting(votingData);

        const resCandidates = await fetch(`http://localhost:4000/api/votings/${id}/candidates`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resCandidates.ok) throw new Error("Gagal mengambil kandidat");
        const candData = await resCandidates.json();
        const mapped = (candData || []).map((c) => ({
          id: c.candidate_id ?? c.id,
          nim: c.nim ?? c.studentId ?? null,
          nama: c.nama ?? c.name,
          foto: c.foto_url ?? c.foto ?? c.photo ?? null,
          deskripsi: c.deskripsi ?? c.description ?? "",
        }));
        setCandidates(mapped);

        const resResults = await axios.get(`/votings/${id}/results`);
        const data = resResults.data;
        const r = data.results || data || [];
        setResults(r);
        setTotalVotes(data.totalVotes ?? r.reduce((s, c) => s + (c.votes || 0), 0));
      } catch (err) {
        console.error(err);
        setError(err.message || "Terjadi kesalahan saat mengambil data.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );

  if (error)
    return (
      <div className="container text-center py-5">
        <p className="text-danger">{error}</p>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Kembali
        </button>
      </div>
    );

  const merged = candidates.map((c) => {
    const result = results.find(
      (r) => r.candidate_id === c.id || r.candidateId === c.id || r.id === c.id
    );
    const votes = Number(result?.votes || 0);
    const pct = totalVotes ? ((votes / totalVotes) * 100).toFixed(1) : "0.0";
    return { ...c, votes, pct };
  });

  const maxVotes = merged.length ? Math.max(...merged.map((c) => c.votes)) : 0;
  const winner = merged.find((c) => c.votes === maxVotes);

  return (
    <div className="min-vh-100 bg-light py-5">
      <div className="container text-center">
        <h1 className="fw-bold mb-2 text-primary" onClick={() => navigate(-1)}>
          {voting?.judul || "Hasil Voting"}
        </h1>
        <p className="text-muted mb-5">
          Total suara masuk: <strong>{totalVotes}</strong>
        </p>

        {merged.length === 0 ? (
          <p className="text-muted">Belum ada kandidat atau belum ada suara.</p>
        ) : (
          <div className="row justify-content-center g-4">
            {merged.map((c) => (
              <div key={c.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                <div className="card shadow border border-3 border-black h-100">
                  {c.foto && (
                    <img
                      src={
                        c.foto.startsWith("/uploads")
                          ? `http://localhost:4000${c.foto}`
                          : c.foto
                      }
                      alt={c.nama}
                      className="card-img-top border-bottom border-3 border-black"
                      style={{ height: "200px", objectFit: "cover" }}
                    />
                  )}
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title fw-bold mb-1">{c.nama}</h5>
                    <h2 className="card-title fw-bold">{c.nim}</h2>
                    <p className="card-text text-muted small flex-grow-1">
                      {c.deskripsi || "-"}
                    </p>
                    <div className="progress border border-3 border-black" style={{ height: "20px" }}>
                      <div
                        className={`progress-bar ${
                          c.votes === maxVotes ? "bg-success" : "bg-primary"
                        }`}
                        role="progressbar"
                        style={{ width: `${c.pct}%` }}
                        aria-valuenow={c.pct}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        {c.pct}%
                      </div>
                    </div>
                    <p className="mt-2 mb-0 fw-semibold">{c.votes} suara</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {winner && (
          <div className="alert alert-success mt-5 shadow-sm">
            <h5 className="fw-bold mb-1">
              🎉 Selamat kepada {winner.nama} 🎉
            </h5>
            <p className="mb-0">
              yang telah memenangkan hasil voting ini dalam rangka{" "}
              <strong>{voting?.judul || "kegiatan ini"}</strong> dengan{" "}
              <strong>{winner.votes}</strong> suara dari total{" "}
              <strong>{totalVotes}</strong> peserta.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
