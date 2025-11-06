import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api, { BASE_URL } from "../api/axios.jsx";

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
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resVoting, resCandidates] = await Promise.all([
          api.get(`/votings/${id}`),
          api.get(`/votings/${id}/candidates`),
        ]);

        setVoting(resVoting.data);
        const mapped = (resCandidates.data || []).map((c) => ({
          id: c.candidate_id ?? c.id,
          nama: c.nama ?? c.name,
          foto: c.foto_url ?? c.foto ?? c.photo ?? null,
          deskripsi: c.deskripsi ?? c.description ?? "",
        }));
        setCandidates(mapped);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleVote = async (candidateId) => {
    if (voted) return;
    if (!window.confirm("Yakin ingin memilih kandidat ini?")) return;

    try {
      await api.post(`/votings/${id}/vote`, { candidate_id: candidateId });

      setVoted(true);
      setShowThankYou(true);

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
      alert(err?.response?.data?.message || "Gagal vote");
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (!voting) return <div className="text-center mt-5">Voting tidak ditemukan</div>;

  return (
    <div className="container py-5 position-relative voting-page">
      <div className="running-text fw-semibold text-center">
        Pilih kandidat dengan bijak — masa depan kita ada di tanganmu.
      </div>

      <div className="text-center mb-4 mt-5">
        <h2 className="fw-bold text-dark border-bottom border-3 border-black mb-2">
          {voting.nama_voting ?? voting.judul ?? "-"}
        </h2>
        <p className="text-secondary small">
          {voting.deskripsi ?? voting.visi_misi ?? ""}
        </p>
      </div>

      <div className="row g-4 justify-content-center">
        {candidates.map((c) => (
          <div key={c.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
            <div className="card h-100 border border-3 border-dark shadow-sm">
              {c.foto && (
                <img
                  src={
                    c.foto.startsWith("/uploads")
                      ? `${BASE_URL}${c.foto}`
                      : c.foto
                  }
                  alt={c.nama}
                  className="card-img-top"
                />
              )}
              <div className="card-body text-center d-flex flex-column p-3">
                <h5 className="fw-bold mb-2">{c.nama}</h5>
                <p className="text-muted small flex-grow-1">{c.deskripsi || "-"}</p>
                <button
                  className={`btn mt-2 ${
                    voted
                      ? "btn-secondary"
                      : "btn-warning fw-bold text-dark border border-3 border-black"
                  }`}
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
        <div className="thankyou-overlay">
          <div className="thankyou-box">
            <h3 className="fw-bold text-dark mb-3">
              Terimakasih Telah Berpartisipasi!
            </h3>
            <p className="text-dark small">
              Anda ikut dalam pemilihan{" "}
              <span className="fw-semibold">{voting.nama_voting ?? voting.judul}</span>.
            </p>
            <p className="text-secondary small mb-3">
              Logout otomatis dalam{" "}
              <span className="fw-bold text-dark">{countdown}</span> detik.
            </p>
            <button
              className="btn btn-dark fw-bold border border-3 border-black"
              onClick={handleLogout}
            >
              Logout Sekarang
            </button>
          </div>
        </div>
      )}

      <button
        role="button"
        onClick={() => navigate("/users")}
        className="btn btn-warning position-fixed bottom-0 end-0 fw-bold border border-3 border-black"
      >
        Back
      </button>
    </div>
  );
}

export default Voting;
