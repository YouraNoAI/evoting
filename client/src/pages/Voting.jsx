import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Voting() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [voting, setVoting] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const fetchVoting = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");

        const resVoting = await fetch(`http://localhost:4000/api/votings/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resVoting.ok) {
          console.error("Failed to fetch voting:", await resVoting.text());
          setVoting(null);
        } else {
          const votingData = await resVoting.json();
          setVoting(votingData);
        }

        const resCandidates = await fetch(`http://localhost:4000/api/votings/${id}/candidates`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resCandidates.ok) {
          const candData = await resCandidates.json();
          const mapped = (candData || []).map((c) => ({
            id: c.candidate_id ?? c.id,
            nama: c.nama ?? c.name,
            foto: c.foto_url ?? c.foto ?? c.photo ?? null,
            deskripsi: c.deskripsi ?? c.description ?? "",
          }));
          setCandidates(mapped);
        } else {
          console.error("Failed to fetch candidates:", await resCandidates.text());
          setCandidates([]);
        }

        setVoted(false);
      } catch (err) {
        console.error("Fetch voting detail error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVoting();
  }, [id]);

  const handleVote = async (candidateId) => {
    if (voted) return;
    if (!window.confirm("Yakin ingin memilih kandidat ini?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:4000/api/votings/${id}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ candidate_id: candidateId }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || result.message || "Gagal vote");

      setVoted(true);
      setShowThankYou(true);

      // countdown + auto logout
      let sec = 10;
      const timer = setInterval(() => {
        sec -= 1;
        setCountdown(sec);
        if (sec <= 0) {
          clearInterval(timer);
          handleLogout();
        }
      }, 1000);
    } catch (err) {
      alert(err.message || "Gagal vote");
      console.error("Vote error:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (!voting) return <div className="text-center mt-5">Voting tidak ditemukan</div>;

  return (
    <div className="container py-5 position-relative" style={{ minHeight: "100vh" }}>
      <div className="text-center mb-5">
        <h2 className="fw-bold text-dark border-bottom border-3 border-black">
          {voting.nama_voting ?? voting.judul ?? "-"}
        </h2>
        <p className="text-secondary">
          {voting.deskripsi ?? voting.visi_misi ?? ""}
        </p>
      </div>

      <div className="row g-4 d-flex justify-content-center align-items-stretch gap-4">
        {candidates.map((c) => (
          <div
            className="p-3 col-12 col-sm-6 col-md-4 col-lg-3 border border-3 border-black rounded-3"
            key={c.id}
          >
            <div className="card shadow-sm border-0 h-100">
              {c.foto && (
                <img
                  src={
                    c.foto.startsWith("/uploads")
                      ? `http://localhost:4000${c.foto}`
                      : c.foto
                  }
                  alt={c.nama}
                  className="card-img-top border border-3 border-black"
                  style={{ height: "200px", objectFit: "cover" }}
                />
              )}
              <div className="card-body text-center d-flex flex-column">
                <h5 className="card-title mb-2 fw-bold">{c.nama}</h5>
                <p className="card-text text-muted small flex-grow-1">
                  {c.deskripsi || "-"}
                </p>
                <button
                  className={`btn ${voted ? "btn-secondary" : "btn-warning fw-bold text-dark border border-3 border-black"}`}
                  onClick={() => handleVote(c.id)}
                  disabled={voted}
                >
                  {voted ? "Sudah Vote" : "Vote"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showThankYou && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            background: "rgba(0,0,0,0.6)",
            zIndex: 1050,
          }}
        >
          <div className="bg-light text-center p-5 border border-3 border-dark rounded-3 shadow-lg" style={{ maxWidth: 500 }}>
            <h2 className="fw-bold text-dark mb-3">
              Terimakasih Telah Berpartisipasi!
            </h2>
            <p className="text-dark">
              Anda telah ikut serta dalam pemilihan{" "}
              <span className="fw-semibold">{voting.nama_voting ?? voting.judul}</span>.
            </p>
            <p className="text-secondary mb-4">
              Silakan logout dan tunggu acara voting selanjutnya.<br />
              Anda akan logout otomatis dalam{" "}
              <span className="fw-bold text-dark">{countdown}</span> detik.
            </p>
            <button className="btn btn-dark fw-bold border border-3 border-black" onClick={handleLogout}>
              Logout Sekarang
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Voting;
