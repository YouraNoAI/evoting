import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function VotingResults() {
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
    <div className="results-container">
      <h2>Daftar Voting</h2>

      {isAdmin && (
        <div className="add-voting">
          <input type="text" placeholder="Nama voting baru..." value={newVoting.nama_voting} onChange={(e) => setNewVoting({ ...newVoting, nama_voting: e.target.value })} />
          <input type="datetime-local" value={newVoting.waktu_mulai} onChange={(e) => setNewVoting({ ...newVoting, waktu_mulai: e.target.value })} />
          <input type="datetime-local" value={newVoting.waktu_selesai} onChange={(e) => setNewVoting({ ...newVoting, waktu_selesai: e.target.value })} />
          <button onClick={handleAddVoting}>Tambah Voting</button>
        </div>
      )}

      {candidateModalFor && (
        <div className="candidate-modal">
          <h3>Tambah Kandidat untuk Voting ID: {candidateModalFor}</h3>
          {candidates.map((cand, idx) => (
            <div key={idx} className="candidate-row">
              <input
                type="text"
                placeholder="Nama kandidat"
                value={cand.nama}
                onChange={(e) => setCandidateValue(idx, "nama", e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="NIM (opsional)"
                value={cand.nim}
                onChange={(e) => setCandidateValue(idx, "nim", e.target.value)}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleCandidateFile(idx, e.target.files?.[0] || null)}
              />
              <textarea
                placeholder="Deskripsi (opsional)"
                value={cand.deskripsi}
                onChange={(e) => setCandidateValue(idx, "deskripsi", e.target.value)}
              />
              {candidates.length > 1 && (
                <button type="button" onClick={() => removeCandidateField(idx)}>
                  Hapus Kandidat
                </button>
              )}
            </div>
          ))}

          <div className="candidate-actions">
            <button type="button" onClick={addCandidateField}>
              Tambah Kandidat Lagi
            </button>
            <button
              type="button"
              onClick={submitCandidates}
              disabled={candidates.length < 2}
            >
              Selesai & Simpan Kandidat
            </button>
            <button type="button" onClick={cancelCandidates}>Cancel</button>
          </div>
          <p className="note">Minimal 2 kandidat wajib. Tidak boleh dilewati.</p>
        </div>
      )}

      <div className="results-grid">
        {votings.length === 0 ? (
          <p>Tidak ada data voting.</p>
        ) : (
          votings.map((voting) => (
            <div key={voting.voting_id} className="voting-card">
              <h3 onClick={() => navigate(`/voting/${voting.voting_id}`)}>
                {voting.nama_voting || "-"}
              </h3>
              <p className="meta">
                Mulai: {formatDisplay(voting.waktu_mulai)} <br />
                Selesai: {formatDisplay(voting.waktu_selesai)}
              </p>

              {isAdmin && (
                <div className="voting-actions">
                  {editingId === voting.voting_id ? (
                    <div className="edit-dropdown">
                      <input
                        type="text"
                        value={editValues.nama_voting}
                        onChange={(e) => setEditValues({ ...editValues, nama_voting: e.target.value })}
                        placeholder="Nama voting"
                      />
                      <input
                        type="datetime-local"
                        value={editValues.waktu_mulai}
                        onChange={(e) => setEditValues({ ...editValues, waktu_mulai: e.target.value })}
                      />
                      <input
                        type="datetime-local"
                        value={editValues.waktu_selesai}
                        onChange={(e) => setEditValues({ ...editValues, waktu_selesai: e.target.value })}
                      />

                      <h4>Kandidat</h4>
                      {editCandidates.map((cand, idx) => (
                        <div key={idx} className="candidate-row">
                          <input
                            type="text"
                            placeholder="Nama kandidat"
                            value={cand.nama}
                            onChange={(e) => setEditCandidateValue(idx, "nama", e.target.value)}
                            required
                          />
                          <input
                            type="text"
                            placeholder="NIM (opsional)"
                            value={cand.nim}
                            onChange={(e) => setEditCandidateValue(idx, "nim", e.target.value)}
                          />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleEditCandidateFile(idx, e.target.files?.[0] || null)}
                          />
                          {cand.foto_url && !cand.fotoFile && (
                            <div className="thumb">
                              <img
                                src={cand.foto_url.startsWith('http')
                                  ? cand.foto_url
                                  : `http://localhost:4000${cand.foto_url}`}
                                alt={cand.nama}
                              />
                            </div>
                          )}
                          <textarea
                            placeholder="Deskripsi (opsional)"
                            value={cand.deskripsi}
                            onChange={(e) => setEditCandidateValue(idx, "deskripsi", e.target.value)}
                          />
                          {editCandidates.length > 1 && (
                            <button type="button" onClick={() => removeEditCandidateField(idx)}>
                              Hapus Kandidat
                            </button>
                          )}
                        </div>
                      ))}

                      <div className="edit-candidate-actions">
                        <button type="button" onClick={addEditCandidateField}>
                          Tambah Kandidat
                        </button>
                      </div>

                      <div className="edit-buttons">
                        <button onClick={() => handleSaveEdit(voting.voting_id)}>Save</button>
                        <button onClick={cancelEdit}>Cancel</button>
                      </div>
                      <p className="note">Minimal 2 kandidat wajib.</p>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => startEdit(voting)}>✏️ Edit</button>
                      <button onClick={() => handleDeleteVoting(voting.voting_id)}>🗑️ Hapus</button>
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

export default VotingResults;
