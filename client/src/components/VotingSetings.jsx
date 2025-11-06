import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function VotingSettings() {
  const [votings, setVotings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newVoting, setNewVoting] = useState({
    nama_voting: "",
    waktu_mulai: "",
    waktu_selesai: "",
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({
    nama_voting: "",
    waktu_mulai: "",
    waktu_selesai: "",
  });
  const [editCandidates, setEditCandidates] = useState([]);
  const [candidateModalFor, setCandidateModalFor] = useState(null);
  const [candidates, setCandidates] = useState([
    { nama: "", nim: "", deskripsi: "", foto: null },
  ]);
  const navigate = useNavigate();

  // Helpers
  const toServerDateTime = (dtLocal) => dtLocal ? dtLocal.replace("T", " ") + ":00" : "";
  const toLocalDateTime = (serverDt) => {
    if (!serverDt) return "";
    const parts = serverDt.replace("T", " ").split(".")[0].split(" ");
    if (parts.length < 2) return "";
    const [date, time] = parts;
    return `${date}T${time.slice(0, 5)}`;
  };

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const formatDisplay = (serverDt) => {
    if (!serverDt) return "-";
    const raw = serverDt.replace("T", " ").split(".")[0];
    const parts = raw.split(" ");
    if (parts.length < 2) return raw;
    const [y, m, d] = parts[0].split("-");
    const time = parts[1].slice(0, 5);
    const month = monthNames[parseInt(m, 10) - 1] || m;
    return `${parseInt(d, 10)} ${month} ${y} | ${time}`;
  };

  // Fetch votings
  useEffect(() => { fetchVotings(); }, []);
  const fetchVotings = async () => {
    setLoading(true);
    try {
      try {
        const { data } = await api.get("/admin/votings");
        setVotings(data);
        setIsAdmin(true);
      } catch (err) {
        if (err.response && [401, 403].includes(err.response.status)) {
          const { data } = await api.get("/votings");
          setVotings(data);
          setIsAdmin(false);
        } else throw err;
      }
    } catch (err) { console.error("Error fetching votings:", err); }
    finally { setLoading(false); }
  };

  // CREATE voting
  const handleAddVoting = async () => {
    if (!newVoting.nama_voting.trim() || !newVoting.waktu_mulai || !newVoting.waktu_selesai) return;
    try {
      const { data } = await api.post("/admin/votings", {
        nama_voting: newVoting.nama_voting,
        waktu_mulai: toServerDateTime(newVoting.waktu_mulai),
        waktu_selesai: toServerDateTime(newVoting.waktu_selesai),
      });
      setCandidateModalFor(data.voting_id);
      setCandidates([{ nama: "", nim: "", deskripsi: "", foto: null }]);
    } catch (err) { console.error("Error adding voting:", err); }
  };

  // Candidate helpers
  const addCandidateField = () => setCandidates([...candidates, { nama: "", nim: "", deskripsi: "", foto: null }]);
  const removeCandidateField = (idx) => setCandidates(candidates.filter((_, i) => i !== idx));
  const setCandidateValue = (idx, field, value) => {
    const copy = [...candidates]; copy[idx][field] = value; setCandidates(copy);
  };
  const handleCandidateFile = (idx, file) => setCandidateValue(idx, "foto", file || null);

  const submitCandidates = async () => {
    if (!candidateModalFor || candidates.length < 2) return;
    for (const c of candidates) if (!c.nama.trim() || !c.foto) return;
    try {
      for (const cand of candidates) {
        const formData = new FormData();
        formData.append("nama", cand.nama);
        formData.append("nim", cand.nim || "");
        formData.append("deskripsi", cand.deskripsi || "");
        if (cand.foto) formData.append("foto", cand.foto);
        await api.post(`/admin/votings/${candidateModalFor}/candidates`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      }
      setCandidateModalFor(null);
      setNewVoting({ nama_voting: "", waktu_mulai: "", waktu_selesai: "" });
      setCandidates([{ nama: "", nim: "", deskripsi: "", foto: null }]);
      await fetchVotings();
    } catch (err) { console.error("Error submitting candidates:", err); }
  };

  const cancelCandidates = async () => {
    setCandidateModalFor(null);
    setCandidates([{ nama: "", nim: "", deskripsi: "", foto: null }]);
    await fetchVotings();
  };

  // DELETE voting
  const handleDeleteVoting = async (id) => {
    if (!window.confirm("Yakin mau hapus voting ini?")) return;
    try { await api.delete(`/admin/votings/${id}`); fetchVotings(); }
    catch (err) { console.error("Error deleting voting:", err); }
  };

  // EDIT flow
  const loadCandidatesForEdit = async (votingId) => {
    try {
      const { data } = await api.get(`/votings/${votingId}/candidates`);
      const mapped = (data || []).map((c) => {
        const fotoUrlRaw = c.foto_url || null;
        const foto_url = fotoUrlRaw ? (fotoUrlRaw.startsWith("/uploads") ? fotoUrlRaw : `/uploads/${fotoUrlRaw}`) : null;
        return {
          candidate_id: c.candidate_id || c.id || null,
          nama: c.nama || "",
          nim: c.nim || "",
          deskripsi: c.deskripsi || "",
          fotoFile: null,
          foto_url,
          _original: { nama: c.nama || "", nim: c.nim || "", deskripsi: c.deskripsi || "", foto_url: fotoUrlRaw || null },
        };
      });
      setEditCandidates(mapped.length ? mapped : [{ nama: "", nim: "", deskripsi: "", fotoFile: null, foto_url: null, candidate_id: null }]);
    } catch (err) {
      console.error("Error loading candidates for edit:", err);
      setEditCandidates([{ nama: "", nim: "", deskripsi: "", fotoFile: null, foto_url: null, candidate_id: null }]);
    }
  };

  const startEdit = (voting) => {
    setEditingId(voting.voting_id);
    setEditValues({
      nama_voting: voting.nama_voting || "",
      waktu_mulai: toLocalDateTime(voting.waktu_mulai) || "",
      waktu_selesai: toLocalDateTime(voting.waktu_selesai) || "",
    });
    loadCandidatesForEdit(voting.voting_id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({ nama_voting: "", waktu_mulai: "", waktu_selesai: "" });
    setEditCandidates([]);
  };

  const addEditCandidateField = () => setEditCandidates([...editCandidates, { nama: "", nim: "", deskripsi: "", fotoFile: null, foto_url: null, candidate_id: null }]);
  const removeEditCandidateField = (idx) => setEditCandidates(editCandidates.filter((_, i) => i !== idx));
  const setEditCandidateValue = (idx, field, value) => { const copy = [...editCandidates]; copy[idx][field] = value; setEditCandidates(copy); };
  const handleEditCandidateFile = (idx, file) => setEditCandidateValue(idx, "fotoFile", file || null);

  const handleSaveEdit = async (votingId) => {
    if (!isAdmin) return;
    if (!editValues.nama_voting.trim() || !editValues.waktu_mulai || !editValues.waktu_selesai) return;
    if (editCandidates.length < 2) return;
    for (const c of editCandidates) if (!c.nama?.trim()) return;

    try {
      await api.put(`/admin/votings/${votingId}`, {
        nama_voting: editValues.nama_voting,
        waktu_mulai: toServerDateTime(editValues.waktu_mulai),
        waktu_selesai: toServerDateTime(editValues.waktu_selesai),
      });

      for (const cand of editCandidates) {
        const formData = new FormData();
        formData.append("nama", cand.nama);
        formData.append("nim", cand.nim || "");
        formData.append("deskripsi", cand.deskripsi || "");
        if (cand.fotoFile) formData.append("foto", cand.fotoFile);

        if (cand.candidate_id) {
          try {
            await api.put(`/admin/votings/${votingId}/candidates/${cand.candidate_id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
          } catch {
            try { await api.post(`/admin/votings/${votingId}/candidates`, formData, { headers: { "Content-Type": "multipart/form-data" } }); } catch (err2) { console.error("Failed to sync candidate id", cand.candidate_id, err2); }
          }
        } else {
          try { await api.post(`/admin/votings/${votingId}/candidates`, formData, { headers: { "Content-Type": "multipart/form-data" } }); }
          catch (err) { console.error("Failed to create candidate", err); }
        }
      }

      cancelEdit();
      fetchVotings();
    } catch (err) { console.error("Error updating voting:", err); }
  };

  if (loading) return <div className="loading">Loading daftar voting...</div>;

  return (
  <div className="container py-4">
      <h2 className="text-center fw-bold mb-4 text-dark border-bottom border-3 border-dark pb-2">
        Daftar Voting
      </h2>

      {/* Admin Section */}
      {isAdmin && (
        <div className="p-3 border border-3 border-dark mb-4 shadow-sm">
          <h5 className="fw-bold text-center mb-3 text-dark">Tambah Voting Baru</h5>
          <div className="d-flex flex-column gap-2">
            <input
              type="text"
              placeholder="Nama voting baru..."
              value={newVoting.nama_voting}
              onChange={(e) => setNewVoting({ ...newVoting, nama_voting: e.target.value })}
              className="form-control border border-2 border-dark"
            />
            <input
              type="datetime-local"
              value={newVoting.waktu_mulai}
              onChange={(e) => setNewVoting({ ...newVoting, waktu_mulai: e.target.value })}
              className="form-control border border-2 border-dark"
            />
            <input
              type="datetime-local"
              value={newVoting.waktu_selesai}
              onChange={(e) => setNewVoting({ ...newVoting, waktu_selesai: e.target.value })}
              className="form-control border border-2 border-dark"
            />
            <button
              onClick={handleAddVoting}
              className="btn btn-warning fw-bold mt-2 border border-3 border-dark"
            >
              Tambah Voting
            </button>
          </div>
        </div>
      )}

      {/* Kandidat Modal */}
      {candidateModalFor && (
        <div className="border border-3 border-dark p-3 mb-4">
          <h4 className="fw-bold text-center mb-3">
            Tambah Kandidat untuk Voting ID: {candidateModalFor}
          </h4>

          {candidates.map((cand, idx) => (
            <div key={idx} className="border border-2 border-dark p-2 mb-2">
              <input
                type="text"
                placeholder="Nama kandidat"
                value={cand.nama}
                onChange={(e) => setCandidateValue(idx, "nama", e.target.value)}
                className="form-control mb-2 border border-2 border-dark"
              />
              <input
                type="text"
                placeholder="NIM (opsional)"
                value={cand.nim}
                onChange={(e) => setCandidateValue(idx, "nim", e.target.value)}
                className="form-control mb-2 border border-2 border-dark"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleCandidateFile(idx, e.target.files?.[0] || null)}
                className="form-control mb-2 border border-2 border-dark"
              />
              <textarea
                placeholder="Deskripsi (opsional)"
                value={cand.deskripsi}
                onChange={(e) => setCandidateValue(idx, "deskripsi", e.target.value)}
                className="form-control border border-2 border-dark"
              />
              {candidates.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCandidateField(idx)}
                  className="btn btn-danger w-100 mt-2 border-3 border-dark"
                >
                  Hapus Kandidat
                </button>
              )}
            </div>
          ))}

          <div className="d-flex flex-column gap-2 mt-3">
            <button
              type="button"
              onClick={addCandidateField}
              className="btn btn-warning w-100 border border-3 border-dark fw-bold"
            >
              Tambah Kandidat Lagi
            </button>
            <button
              type="button"
              onClick={submitCandidates}
              disabled={candidates.length < 2}
              className="btn btn-success w-100 fw-bold border border-3 border-dark"
            >
              Selesai & Simpan Kandidat
            </button>
            <button
              type="button"
              onClick={cancelCandidates}
              className="btn btn-secondary w-100"
            >
              Batal
            </button>
          </div>
          <small className="text-muted fst-italic mt-2 d-block text-center">
            Minimal 2 kandidat wajib diisi.
          </small>
        </div>
      )}

      {/* Daftar Voting */}
      <div className="p-3 border border-3 border-dark shadow-sm">
        {votings.length === 0 ? (
          <p className="text-center fw-bold text-dark">
            Tidak ada data voting.
          </p>
        ) : (
          votings.map((voting) => (
            <div key={voting.voting_id} className="p-3 mb-3 border border-3 border-dark">
              <div
                className="fw-bold fs-5 text-dark text-center"
                role="button"
                onClick={() => navigate(`/voting/${voting.voting_id}`)}
              >
                {voting.nama_voting || "-"}
              </div>
              <p className="text-dark text-center mt-1 mb-3">
                Mulai: {formatDisplay(voting.waktu_mulai)} <br />
                Selesai: {formatDisplay(voting.waktu_selesai)}
              </p>

              {isAdmin && (
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  {editingId === voting.voting_id ? (
                    <div className="w-100 border border-2 border-dark p-2">
                      <input
                        type="text"
                        value={editValues.nama_voting}
                        onChange={(e) => setEditValues({ ...editValues, nama_voting: e.target.value })}
                        placeholder="Nama voting"
                        className="form-control mb-2 border border-2 border-dark"
                      />
                      <input
                        type="datetime-local"
                        value={editValues.waktu_mulai}
                        onChange={(e) => setEditValues({ ...editValues, waktu_mulai: e.target.value })}
                        className="form-control mb-2 border border-2 border-dark"
                      />
                      <input
                        type="datetime-local"
                        value={editValues.waktu_selesai}
                        onChange={(e) => setEditValues({ ...editValues, waktu_selesai: e.target.value })}
                        className="form-control mb-3 border border-2 border-dark"
                      />

                      <h6 className="fw-bold">Kandidat</h6>
                      {editCandidates.map((cand, idx) => (
                        <div key={idx} className="border border-2 border-dark rounded p-2 mb-2">
                          {cand.foto_url && !cand.fotoFile && (
                            <div className="text-center mb-2">
                              <img
                                src={
                                  cand.foto_url.startsWith("http")
                                    ? cand.foto_url
                                    : `http://localhost:4000${cand.foto_url}`
                                }
                                alt={cand.nama}
                                className="img-thumbnail"
                                style={{ maxHeight: 100 }}
                              />
                            </div>
                          )}
                          <input
                            type="text"
                            placeholder="Nama kandidat"
                            value={cand.nama}
                            onChange={(e) => setEditCandidateValue(idx, "nama", e.target.value)}
                            className="form-control mb-2 border border-2 border-dark"
                          />
                          <input
                            type="number"
                            placeholder="NIM (opsional)"
                            value={cand.nim}
                            onChange={(e) => setEditCandidateValue(idx, "nim", e.target.value)}
                            className="form-control mb-2 border border-2 border-dark"
                          />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleEditCandidateFile(idx, e.target.files?.[0] || null)}
                            className="form-control mb-2 border border-2 border-dark"
                          />
                          <textarea
                            placeholder="Deskripsi (opsional)"
                            value={cand.deskripsi}
                            onChange={(e) => setEditCandidateValue(idx, "deskripsi", e.target.value)}
                            className="form-control border border-2 border-dark"
                          />
                          {editCandidates.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeEditCandidateField(idx)}
                              className="btn btn-danger w-100 mt-2 border-3 border-dark"
                            >
                              Hapus Kandidat
                            </button>
                          )}
                        </div>
                      ))}

                      <div className="d-flex flex-column gap-2 mt-3">
                        <button
                          type="button"
                          onClick={addEditCandidateField}
                          className="btn btn-warning border border-3 border-dark fw-bold"
                        >
                          Tambah Kandidat
                        </button>
                        <button
                          onClick={() => handleSaveEdit(voting.voting_id)}
                          className="btn btn-success border border-3 border-dark fw-bold"
                        >
                          Simpan
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="btn btn-outline-secondary"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(voting)}
                        className="btn btn-outline-dark"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteVoting(voting.voting_id)}
                        className="btn btn-outline-danger"
                      >
                        Hapus
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default VotingSettings;
