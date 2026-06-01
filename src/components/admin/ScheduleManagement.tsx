"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/AppContext";
import { fadeSlideUp, staggerContainer, staggerItem, scaleIn } from "@/animations/variants";
import type { BusSchedule } from "@/types";

function formatPrice(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

const EMPTY_FORM: Omit<BusSchedule, "id"> = {
  agencyId: "",
  agencyName: "",
  busName: "",
  origin: "",
  destination: "",
  date: "",
  departureTime: "",
  arrivalTime: "",
  price: 0,
  totalSeats: 40,
  bookedSeats: [],
  busClass: "Ekonomi",
  isRecurring: false,
  recurringDays: "",
};

export default function ScheduleManagement() {
  const { schedules, agencies, addSchedule, updateSchedule, deleteSchedule, tickets } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<BusSchedule, "id">>(EMPTY_FORM);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [manifestId, setManifestId] = useState<string | null>(null);

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };
  const openEdit = (s: BusSchedule) => {
    setEditId(s.id);
    setForm({
      agencyId: s.agencyId,
      agencyName: s.agencyName,
      busName: s.busName,
      origin: s.origin,
      destination: s.destination,
      date: s.date,
      departureTime: s.departureTime,
      arrivalTime: s.arrivalTime,
      price: s.price,
      totalSeats: s.totalSeats,
      bookedSeats: s.bookedSeats,
      busClass: s.busClass,
      isRecurring: s.isRecurring,
      recurringDays: s.recurringDays,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    const ag = agencies.find((a) => a.id === form.agencyId);
    const updated = { ...form, agencyName: ag?.name || form.agencyName };
    if (editId) {
      updateSchedule({ ...updated, id: editId });
    } else {
      addSchedule(updated);
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (showDelete) {
      deleteSchedule(showDelete);
      setShowDelete(null);
    }
  };

  const manifestTickets = useMemo(() => {
    if (!manifestId) return [];
    const sc = schedules.find((s) => s.id === manifestId);
    if (!sc) return [];
    return tickets.filter((t) => t.agencyName === sc.agencyName && t.busName === sc.busName && t.date === sc.date);
  }, [manifestId, schedules, tickets]);

  return (
    <motion.div variants={fadeSlideUp} initial="hidden" animate="visible">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em", fontFamily: "Outfit" }}>Jadwal Bus</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 16, marginTop: 4 }}>Kelola jadwal keberangkatan dan armada</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn btn-primary btn-lg" onClick={openAdd} style={{ gap: 10, padding: "12px 24px", fontSize: 15 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Tambah Jadwal
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
              <th style={{ padding: "20px 24px" }}>Bus</th>
              <th style={{ padding: "20px 24px" }}>Rute</th>
              <th style={{ padding: "20px 24px" }}>Tanggal</th>
              <th style={{ padding: "20px 24px" }}>Waktu</th>
              <th style={{ padding: "20px 24px" }}>Kelas</th>
              <th style={{ padding: "20px 24px" }}>Kursi</th>
              <th style={{ padding: "20px 24px" }}>Harga</th>
              <th style={{ padding: "20px 24px", textAlign: "center" }}>MANIFEST</th>
              <th style={{ padding: "20px 24px", textAlign: "center" }}>EDIT</th>
              <th style={{ padding: "20px 24px", textAlign: "center" }}>AKSI</th>
            </tr>
          </thead>
          <motion.tbody variants={staggerContainer} initial="hidden" animate="visible">
            {schedules.map((s) => {
              const avail = s.totalSeats - s.bookedSeats.length;
              return (
                <motion.tr
                  key={s.id}
                  variants={staggerItem}
                  style={{ transition: "background 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-main)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "20px 24px", borderTop: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: 15 }}>{s.agencyName}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{s.busName}</div>
                  </td>
                  <td style={{ fontWeight: 600, color: "var(--text-main)", padding: "20px 24px", borderTop: "1px solid var(--border-subtle)" }}>
                    {s.origin} → {s.destination}
                  </td>
                  <td style={{ padding: "20px 24px", borderTop: "1px solid var(--border-subtle)" }}>{s.isRecurring ? <span style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600 }}>🔄 Setiap: {s.recurringDays}</span> : s.date}</td>
                  <td style={{ padding: "20px 24px", borderTop: "1px solid var(--border-subtle)" }}>
                    {s.departureTime} – {s.arrivalTime}
                  </td>
                  <td style={{ padding: "20px 24px", borderTop: "1px solid var(--border-subtle)" }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "var(--radius-full)",
                        fontSize: 12,
                        fontWeight: 700,
                        background: s.busClass === "Eksekutif" ? "var(--primary-light)" : s.busClass === "Bisnis" ? "#FEF9C3" : "var(--bg-subtle)",
                        color: s.busClass === "Eksekutif" ? "var(--primary-dark)" : s.busClass === "Bisnis" ? "#854D0E" : "var(--text-main)",
                      }}
                    >
                      {s.busClass}
                    </span>
                  </td>
                  <td style={{ padding: "20px 24px", borderTop: "1px solid var(--border-subtle)" }}>
                    <span style={{ fontWeight: 700, color: avail > 5 ? "#166534" : avail > 0 ? "#854D0E" : "#991B1B" }}>
                      {avail}/{s.totalSeats}
                    </span>
                  </td>
                  <td style={{ fontWeight: 800, color: "var(--text-main)", padding: "20px 24px", borderTop: "1px solid var(--border-subtle)" }}>{formatPrice(s.price)}</td>
                  <td style={{ padding: "20px 24px", borderTop: "1px solid var(--border-subtle)", textAlign: "center" }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn btn-ghost"
                      onClick={() => setManifestId(s.id)}
                      title="Manifest"
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
                      onClick={() => openEdit(s)}
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
                      onClick={() => setShowDelete(s.id)}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, margin: "0 auto", padding: "8px", height: "auto" }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </motion.button>
                  </td>
                </motion.tr>
              );
            })}
          </motion.tbody>
        </table>
      </div>

      {/* ── Add/Edit Modal ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
            <motion.div variants={scaleIn} initial="hidden" animate="visible" exit="exit" className="modal-content" style={{ maxWidth: 640, padding: 36 }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-main)", marginBottom: 28, letterSpacing: "-0.02em", fontFamily: "Outfit" }}>{editId ? "Edit Jadwal" : "Tambah Jadwal"}</h2>
              <div className="form-group">
                <label className="form-label">Agency</label>
                <select
                  className="form-input"
                  value={form.agencyId}
                  onChange={(e) => {
                    const ag = agencies.find((a) => a.id === e.target.value);
                    setForm((f) => ({ ...f, agencyId: e.target.value, agencyName: ag?.name || "" }));
                  }}
                >
                  <option value="">Pilih agency</option>
                  {agencies.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nama Bus</label>
                <input className="form-input" value={form.busName} onChange={(e) => setForm((f) => ({ ...f, busName: e.target.value }))} placeholder="SJ Express" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div className="form-group">
                  <label className="form-label">Kota Asal</label>
                  <input className="form-input" value={form.origin} onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))} placeholder="Jakarta" />
                </div>
                <div className="form-group">
                  <label className="form-label">Kota Tujuan</label>
                  <input className="form-input" value={form.destination} onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))} placeholder="Semarang" />
                </div>
              </div>
              <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", marginBottom: "20px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                  <input type="checkbox" checked={!!form.isRecurring} onChange={(e) => setForm((f) => ({ ...f, isRecurring: e.target.checked }))} style={{ width: "18px", height: "18px" }} />
                  Jadwal Berulang (Seperti Alarm)
                </label>
                {form.isRecurring && (
                  <div style={{ marginTop: "12px" }}>
                    <label className="form-label" style={{ fontSize: "13px" }}>
                      Pilih Hari Berulang
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
                      {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map((day) => {
                        const isSelected = form.recurringDays?.includes(day);
                        return (
                          <button
                            key={day}
                            onClick={() => {
                              const currentDays = form.recurringDays ? form.recurringDays.split(",").filter(Boolean) : [];
                              const newDays = isSelected ? currentDays.filter((d) => d !== day) : [...currentDays, day];
                              setForm((f) => ({ ...f, recurringDays: newDays.join(",") }));
                            }}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "20px",
                              border: `1px solid ${isSelected ? "var(--primary)" : "#cbd5e1"}`,
                              background: isSelected ? "var(--primary)" : "#fff",
                              color: isSelected ? "#fff" : "#475569",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              {!form.isRecurring && (
                <div className="form-group">
                  <label className="form-label">Tanggal</label>
                  <input className="form-input" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div className="form-group">
                  <label className="form-label">Jam Berangkat</label>
                  <input className="form-input" type="time" value={form.departureTime} onChange={(e) => setForm((f) => ({ ...f, departureTime: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Jam Tiba</label>
                  <input className="form-input" type="time" value={form.arrivalTime} onChange={(e) => setForm((f) => ({ ...f, arrivalTime: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
                <div className="form-group">
                  <label className="form-label">Kelas</label>
                  <select className="form-input" value={form.busClass} onChange={(e) => setForm((f) => ({ ...f, busClass: e.target.value as BusSchedule["busClass"] }))}>
                    <option value="Ekonomi">Ekonomi</option>
                    <option value="Bisnis">Bisnis</option>
                    <option value="Eksekutif">Eksekutif</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Total Kursi</label>
                  <input className="form-input" type="number" min="1" value={form.totalSeats} onChange={(e) => setForm((f) => ({ ...f, totalSeats: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Harga (Rp)</label>
                  <input className="form-input" type="number" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                  Batal
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleSave}>
                  {editId ? "Simpan Perubahan" : "Tambah Jadwal"}
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
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-main)", marginBottom: 12, fontFamily: "Outfit" }}>Hapus Jadwal?</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>Jadwal ini akan dihapus secara permanen.</p>
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

      {/* ── Manifest Modal ── */}
      <AnimatePresence>
        {manifestId && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setManifestId(null)}>
            <motion.div variants={scaleIn} initial="hidden" animate="visible" exit="exit" className="modal-content" style={{ maxWidth: 680, padding: 36 }} onClick={(e) => e.stopPropagation()}>
              {(() => {
                const sc = schedules.find((s) => s.id === manifestId);
                return (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                      <div>
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em", fontFamily: "Outfit" }}>Manifest Penumpang</h2>
                        {sc && (
                          <p style={{ color: "var(--text-muted)", fontSize: 15, marginTop: 4 }}>
                            {sc.agencyName} — {sc.busName} | {sc.origin} → {sc.destination} | {sc.date}
                          </p>
                        )}
                      </div>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn btn-ghost btn-icon" onClick={() => setManifestId(null)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </motion.button>
                    </div>
                    {manifestTickets.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "60px 0" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                        <p style={{ color: "var(--text-muted)", fontSize: 16 }}>Belum ada penumpang terdaftar</p>
                      </div>
                    ) : (
                      <div style={{ borderRadius: "var(--radius)", border: "1px solid var(--border-subtle)", overflow: "hidden" }}>
                        <table className="data-table" style={{ fontSize: 14, width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                          <thead>
                            <tr style={{ background: "var(--bg-subtle)" }}>
                              <th style={{ padding: "16px 20px" }}>Kursi</th>
                              <th style={{ padding: "16px 20px" }}>Nama</th>
                              <th style={{ padding: "16px 20px" }}>NIK</th>
                              <th style={{ padding: "16px 20px" }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {manifestTickets.map((t) => (
                              <tr key={t.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                                <td style={{ padding: "16px 20px" }}>
                                  <span
                                    style={{
                                      padding: "4px 12px",
                                      borderRadius: "var(--radius-full)",
                                      background: "var(--secondary-light)",
                                      color: "var(--primary-dark)",
                                      fontWeight: 700,
                                      fontSize: 13,
                                    }}
                                  >
                                    {t.seatNumber}
                                  </span>
                                </td>
                                <td style={{ fontWeight: 600, color: "var(--text-main)", padding: "16px 20px" }}>{t.passengerName}</td>
                                <td style={{ fontFamily: "monospace", fontSize: 13, color: "var(--text-muted)", padding: "16px 20px" }}>{t.passengerNik}</td>
                                <td style={{ padding: "16px 20px" }}>
                                  <span
                                    style={{
                                      padding: "4px 12px",
                                      borderRadius: "var(--radius-full)",
                                      fontSize: 12,
                                      fontWeight: 700,
                                      background: t.status === "Lunas" ? "#DCFCE7" : "#FEF9C3",
                                      color: t.status === "Lunas" ? "#166534" : "#854D0E",
                                    }}
                                  >
                                    {t.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
