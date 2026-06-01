"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/AppContext";
import { fadeSlideUp, staggerContainer, staggerItem, scaleIn } from "@/animations/variants";
import type { TravelAgency } from "@/types";

const EMPTY_FORM: Omit<TravelAgency, "id"> = {
  name: "",
  logo: "🚌",
  description: "",
  contact: "",
  photos: "",
  rating: 4.0,
  totalBuses: 0,
  routes: [],
};

export default function AgencyManagement() {
  const { agencies, addAgency, updateAgency, deleteAgency } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<TravelAgency, "id">>(EMPTY_FORM);
  const [routeInput, setRouteInput] = useState("");
  const [showDelete, setShowDelete] = useState<string | null>(null);

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setRouteInput("");
    setShowModal(true);
  };
  const openEdit = (a: TravelAgency) => {
    setEditId(a.id);
    setForm({ name: a.name, logo: a.logo, description: a.description, contact: a.contact || "", photos: a.photos || "", rating: a.rating, totalBuses: a.totalBuses, routes: a.routes });
    setRouteInput(a.routes.join(", "));
    setShowModal(true);
  };

  const handleSave = () => {
    const routes = routeInput
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
    if (editId) {
      updateAgency({ ...form, id: editId, routes });
    } else {
      addAgency({ ...form, routes });
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (showDelete) {
      deleteAgency(showDelete);
      setShowDelete(null);
    }
  };

  return (
    <motion.div variants={fadeSlideUp} initial="hidden" animate="visible">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em", fontFamily: "Outfit" }}>Travel Agency</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 16, marginTop: 4 }}>Kelola data dan profil travel agency</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn btn-primary btn-lg" onClick={openAdd} style={{ gap: 10, padding: "12px 24px", fontSize: 15 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Tambah Agency
        </motion.button>
      </div>

      {/* Table */}
      <div
        style={{
          background: "var(--bg-white)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-md)",
          overflow: "hidden",
        }}
      >
        <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr>
              <th style={{ padding: "20px 24px" }}>Agency</th>
              <th style={{ padding: "20px 24px" }}>Deskripsi</th>
              <th style={{ padding: "20px 24px" }}>Rating</th>
              <th style={{ padding: "20px 24px" }}>Bus</th>
              <th style={{ padding: "20px 24px" }}>Rute</th>
              <th style={{ padding: "20px 24px", textAlign: "center" }}>EDIT AGENCY</th>
              <th style={{ padding: "20px 24px", textAlign: "center" }}>AKSI</th>
            </tr>
          </thead>
          <motion.tbody variants={staggerContainer} initial="hidden" animate="visible">
            {agencies.map((a) => (
              <motion.tr
                key={a.id}
                variants={staggerItem}
                style={{ transition: "background 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-main)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "20px 24px", borderTop: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "var(--radius)",
                        background: "var(--bg-white)",
                        border: "1px solid var(--border-subtle)",
                        boxShadow: "var(--shadow-sm)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 24,
                      }}
                    >
                      {a.logo}
                    </div>
                    <span style={{ fontWeight: 700, color: "var(--text-main)", fontSize: 15 }}>{a.name}</span>
                  </div>
                </td>
                <td style={{ maxWidth: 280, padding: "20px 24px", borderTop: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.description}</span>
                </td>
                <td style={{ padding: "20px 24px", borderTop: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--warning)", fontWeight: 700, fontSize: 15 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    {a.rating}
                  </div>
                </td>
                <td style={{ fontWeight: 700, color: "var(--text-main)", fontSize: 15, padding: "20px 24px", borderTop: "1px solid var(--border-subtle)" }}>{a.totalBuses}</td>
                <td style={{ padding: "20px 24px", borderTop: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {a.routes.map((r) => (
                      <span
                        key={r}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "var(--radius-full)",
                          background: "var(--bg-subtle)",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--text-muted)",
                        }}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: "20px 24px", borderTop: "1px solid var(--border-subtle)", textAlign: "center" }}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn btn-ghost"
                    onClick={() => openEdit(a)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, margin: "0 auto", padding: "8px", height: "auto" }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </motion.button>
                </td>
                <td style={{ padding: "20px 24px", borderTop: "1px solid var(--border-subtle)", textAlign: "center" }}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn btn-ghost"
                    onClick={() => setShowDelete(a.id)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, margin: "0 auto", padding: "8px", height: "auto" }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </motion.button>
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>

      {/* ── Add/Edit Modal ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
            <motion.div variants={scaleIn} initial="hidden" animate="visible" exit="exit" className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 500, padding: 36 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-main)", marginBottom: 28, letterSpacing: "-0.02em", fontFamily: "Outfit" }}>{editId ? "Edit Agency" : "Tambah Agency"}</h2>
              <div className="form-group">
                <label className="form-label">Nama Agency</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nama agency" />
              </div>
              <div className="form-group">
                <label className="form-label">Logo (Emoji)</label>
                <input className="form-input" value={form.logo} onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))} placeholder="🚌" />
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi</label>
                <textarea className="form-input" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Deskripsi agency" style={{ resize: "vertical" }} />
              </div>
              <div className="form-group">
                <label className="form-label">Kontak</label>
                <input className="form-input" value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} placeholder="No. Telepon / Email" />
              </div>
              <div className="form-group">
                <label className="form-label">URL Foto</label>
                <input className="form-input" value={form.photos} onChange={(e) => setForm((f) => ({ ...f, photos: e.target.value }))} placeholder="https://..." />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <input className="form-input" type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Bus</label>
                  <input className="form-input" type="number" min="0" value={form.totalBuses} onChange={(e) => setForm((f) => ({ ...f, totalBuses: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Rute (pisahkan dengan koma)</label>
                <input className="form-input" value={routeInput} onChange={(e) => setRouteInput(e.target.value)} placeholder="Jakarta – Semarang, Jakarta – Cirebon" />
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                  Batal
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleSave}>
                  {editId ? "Simpan Perubahan" : "Tambah Agency"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation ── */}
      <AnimatePresence>
        {showDelete && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDelete(null)}>
            <motion.div variants={scaleIn} initial="hidden" animate="visible" exit="exit" className="modal-content" style={{ maxWidth: 420, textAlign: "center", padding: 36 }} onClick={(e) => e.stopPropagation()}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "#FEE2E2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                  fontSize: 32,
                }}
              >
                ⚠️
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-main)", marginBottom: 12, fontFamily: "Outfit" }}>Hapus Agency?</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>Tindakan ini tidak dapat dibatalkan. Semua jadwal yang terkait juga akan dihapus.</p>
              <div style={{ display: "flex", gap: 16 }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => setShowDelete(null)}>
                  Batal
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn btn-danger btn-lg" style={{ flex: 1 }} onClick={handleDelete}>
                  Ya, Hapus
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
