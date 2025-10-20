import { useEffect, useState } from "react";
import api from "../api/axios";

const EditUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingNim, setEditingNim] = useState(null);
  const [form, setForm] = useState({
    nim: "",
    nama: "",
    role: "user",
    password: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data || []);
    } catch (err) {
      // fallback try non-admin route if server exposes it
      try {
        const res = await api.get("/users");
        setUsers(res.data || []);
      } catch (e) {
        console.error("fetchUsers failed:", err.response?.data || err.message || err);
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const onChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const startAdd = () => {
    setError("");
    setShowAdd(true);
    setEditingNim(null);
    setForm({ nim: "", nama: "", role: "user", password: "" });
  };

  const cancelAdd = () => {
    setShowAdd(false);
    setForm({ nim: "", nama: "", role: "user", password: "" });
    setError("");
  };

  const createUser = async () => {
    setError("");
    if (!form.nim.trim() || !form.nama.trim() || !form.password.trim()) {
      setError("NIM, Nama, dan Password wajib untuk membuat user baru.");
      return;
    }
    try {
      await api.post("/admin/users", {
        nim: form.nim.trim(),
        nama: form.nama.trim(),
        role: form.role,
        password: form.password,
      });
      cancelAdd();
      fetchUsers();
    } catch (err) {
      console.error("createUser failed:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Gagal membuat user");
    }
  };

  const startEdit = (u) => {
    setError("");
    setEditingNim(u.nim);
    setShowAdd(false);
    setForm({ nim: u.nim, nama: u.nama || "", role: u.role || "user", password: "" });
  };

  const cancelEdit = () => {
    setEditingNim(null);
    setForm({ nim: "", nama: "", role: "user", password: "" });
    setError("");
  };

  const saveEdit = async () => {
    if (!editingNim) return;
    if (!form.nama.trim()) {
      setError("Nama tidak boleh kosong.");
      return;
    }
    try {
      const body = { nama: form.nama.trim(), role: form.role };
      if (form.password && form.password.trim()) body.password = form.password;
      await api.put(`/admin/users/${editingNim}`, body);
      cancelEdit();
      fetchUsers();
    } catch (err) {
      console.error("saveEdit failed:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Gagal menyimpan perubahan.");
    }
  };

  const deleteUser = async (nim) => {
    if (!window.confirm(`Hapus user ${nim}?`)) return;
    try {
      await api.delete(`/admin/users/${nim}`);
      fetchUsers();
    } catch (err) {
      console.error("deleteUser failed:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Gagal menghapus user.");
    }
  };

  return (
    <div className="container py-4">
      <h2 className="fw-bold text-center mb-4 border-bottom border-3 border-dark pb-2">
        Edit Users
      </h2>

      {/* Tambah User */}
      <div className="mb-4">
        {!showAdd && editingNim === null && (
          <button className="btn btn-warning fw-bold border border-3 border-black" onClick={startAdd}>
            + Tambah User
          </button>
        )}

        {showAdd && (
          <div className="bg-warning p-3 border border-3 border-dark rounded mt-3 shadow-sm" style={{ maxWidth: 520 }}>
            <h4 className="fw-bold text-center mb-3">Tambah User Baru</h4>

            <div className="d-flex flex-column gap-2">
              <input
                className="form-control border border-2 border-dark"
                placeholder="NIM"
                value={form.nim}
                onChange={(e) => onChange("nim", e.target.value)}
              />
              <input
                className="form-control border border-2 border-dark"
                placeholder="Nama"
                value={form.nama}
                onChange={(e) => onChange("nama", e.target.value)}
              />
              <select
                className="form-select border border-2 border-dark"
                value={form.role}
                onChange={(e) => onChange("role", e.target.value)}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
              <input
                className="form-control border border-2 border-dark"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => onChange("password", e.target.value)}
              />

              {error && (
                <div className="text-danger small text-center fw-bold mt-1">
                  {error}
                </div>
              )}

              <div className="d-flex justify-content-center gap-2 mt-3">
                <button className="btn btn-success fw-bold border border-3 border-black " onClick={createUser}>
                  Simpan
                </button>
                <button
                  className="btn btn-outline-dark fw-bold border border-3 border-black "
                  onClick={cancelAdd}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabel User */}
      <div className="bg-warning border border-3 border-dark rounded p-3 shadow-sm">
        {loading ? (
          <p className="text-center fw-bold text-dark mb-0">
            Loading users...
          </p>
        ) : users.length === 0 ? (
          <p className="text-center fw-bold text-dark mb-0">Tidak ada user.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered border-dark align-middle text-center">
              <thead className="table border-dark">
                <tr>
                  <th className="border-dark">NIM</th>
                  <th className="border-dark">Nama</th>
                  <th className="border-dark">Role</th>
                  <th className="border-dark">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.nim}>
                    <td className="border-dark">{u.nim}</td>
                    <td className="border-dark">
                      {editingNim === u.nim ? (
                        <input
                          className="form-control border border-2 border-dark"
                          value={form.nama}
                          onChange={(e) =>
                            onChange("nama", e.target.value)
                          }
                        />
                      ) : (
                        u.nama
                      )}
                    </td>
                    <td className="border-dark">
                      {editingNim === u.nim ? (
                        <select
                          className="form-select border border-2 border-dark"
                          value={form.role}
                          onChange={(e) =>
                            onChange("role", e.target.value)
                          }
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      ) : (
                        u.role
                      )}
                    </td>
                    <td className="border-dark">
                      {editingNim === u.nim ? (
                        <div className="d-flex flex-column gap-2 align-items-center">
                          <input
                            className="form-control border border-2 border-dark"
                            type="password"
                            placeholder="Kosongkan jika tidak ganti password"
                            value={form.password}
                            onChange={(e) =>
                              onChange("password", e.target.value)
                            }
                          />
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-dark btn-sm fw-bold"
                              onClick={saveEdit}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn-outline-dark btn-sm fw-bold"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="d-flex gap-2 justify-content-center">
                          <button
                            className="btn btn-outline-dark btn-sm fw-bold"
                            onClick={() => startEdit(u)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm fw-bold"
                            onClick={() => deleteUser(u.nim)}
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-center small text-muted mt-3 fst-italic">
        Catatan: endpoint yang dipanggil adalah <b>/admin/users</b> (untuk admin).  
        Jika server berbeda, sesuaikan endpoint di file ini.
      </p>
    </div>
  );
};

export default EditUsers;