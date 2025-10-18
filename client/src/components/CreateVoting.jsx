// src/components/CreateVoting.jsx
import { useState } from "react";
import Swal from "sweetalert2";
import api from "../api/axios";

const CreateVoting = () => {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [candidates, setCandidates] = useState([
    { nama: "", nim: "", deskripsi: "", foto: null },
  ]);

  const handleCandidateChange = (index, field, value) => {
    const newCandidates = [...candidates];
    newCandidates[index][field] = value;
    setCandidates(newCandidates);
  };

  const addCandidate = () =>
    setCandidates([
      ...candidates,
      { nama: "", nim: "", deskripsi: "", foto: null },
    ]);

  const removeCandidate = (index) => {
    if (candidates.length <= 1) return;
    setCandidates(candidates.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !startTime || !endTime) {
      Swal.fire("Error", "Judul dan waktu voting wajib diisi", "error");
      return;
    }

    if (candidates.some((c) => !c.nama.trim())) {
      Swal.fire("Error", "Semua kandidat wajib punya nama", "error");
      return;
    }

    try {
      const { data } = await api.post("/admin/votings", {
        nama_voting: title,
        waktu_mulai: startTime,
        waktu_selesai: endTime,
      });

      const votingId = data.voting_id;

      for (const cand of candidates) {
        const formData = new FormData();
        formData.append("nama", cand.nama);
        formData.append("nim", cand.nim);
        formData.append("deskripsi", cand.deskripsi);
        if (cand.foto) formData.append("foto", cand.foto);

        await api.post(`/admin/votings/${votingId}/candidates`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      Swal.fire("Sukses", "Voting & kandidat berhasil dibuat!", "success");
      setTitle("");
      setStartTime("");
      setEndTime("");
      setCandidates([{ nama: "", nim: "", deskripsi: "", foto: null }]);
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.error || "Gagal membuat voting",
        "error"
      );
    }
  };

  return (
    <div>
      <h2>Buat Voting Baru</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Judul Voting:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Waktu Mulai:</label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Waktu Selesai:</label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>

        <h3>Kandidat</h3>
        {candidates.map((cand, i) => (
          <div
            key={i}
            style={{
              border: "1px solid #ccc",
              padding: "1rem",
              marginBottom: "0.5rem",
            }}
          >
            <input
              type="text"
              placeholder="Nama"
              value={cand.nama}
              onChange={(e) =>
                handleCandidateChange(i, "nama", e.target.value)
              }
              required
            />
            <input
              type="text"
              placeholder="NIM"
              value={cand.nim}
              onChange={(e) => handleCandidateChange(i, "nim", e.target.value)}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                handleCandidateChange(i, "foto", e.target.files[0])
              }
            />
            <textarea
              placeholder="Deskripsi"
              value={cand.deskripsi}
              onChange={(e) =>
                handleCandidateChange(i, "deskripsi", e.target.value)
              }
            />
            {candidates.length > 1 && (
              <button type="button" onClick={() => removeCandidate(i)}>
                Hapus Kandidat
              </button>
            )}
          </div>
        ))}

        <button type="button" onClick={addCandidate}>
          Tambah Kandidat
        </button>
        <br />
        <button type="submit">Buat Voting</button>
      </form>
    </div>
  );
};

export default CreateVoting;
