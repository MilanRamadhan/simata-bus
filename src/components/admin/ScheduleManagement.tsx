"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/AppContext";
import { fadeSlideUp, staggerContainer, staggerItem, scaleIn } from "@/animations/variants";
import type { BusSchedule, ScheduleDateOverride } from "@/types";
import { getNextDepartureDate, formatTanggal, formatTanggalPanjang } from "@/lib/scheduleUtils";
import ScheduleCalendarPicker from "./ScheduleCalendarPicker";
import { SUMATERA_CITIES } from "@/lib/cities";

function IconEdit() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

function IconList() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function formatPrice(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

const EMPTY_FORM: Omit<BusSchedule, "id"> = {
  agencyId: "",
  agencyName: "",
  busName: "",        // diisi otomatis = agencyName
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

/* Dropdown kota Sumatera */
function CitySelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <select className="form-input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Pilih kota...</option>
        {SUMATERA_CITIES.map((p) => (
          <optgroup key={p.province} label={p.province}>
            {p.cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

// ── Status badge helper ──
function ScheduleStatusBadge({ status }: { status?: string }) {
  if (!status || status === "aktif") return null;
  const map: Record<string, { bg: string; color: string; label: string }> = {
    ditunda: { bg: "#FEF3C7", color: "#92400E", label: "Ditunda" },
    dibatalkan: { bg: "#FEE2E2", color: "#991B1B", label: "Dibatalkan" },
  };
  const s = map[status];
  if (!s) return null;
  return (
    <span style={{ padding: "3px 10px", borderRadius: "var(--radius-full)", background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, marginLeft: 6 }}>
      {s.label}
    </span>
  );
}

export default function ScheduleManagement() {
  const { schedules, agencies, addSchedule, updateSchedule, deleteSchedule, updateScheduleStatus, tickets, user, myAgency } = useAppStore();
  const isProvider = user?.role === "provider";

  // Provider hanya lihat jadwal agency-nya sendiri
  const visibleSchedules = useMemo(() => {
    if (!isProvider) return schedules;          // admin → semua
    if (!myAgency) return [];                   // provider tanpa agency → kosong
    return schedules.filter((s) => s.agencyId === myAgency.id);
  }, [isProvider, myAgency, schedules]);

  // Provider hanya bisa pilih agency sendiri di dropdown
  const availableAgencies = useMemo(() => {
    if (!isProvider) return agencies;           // admin → semua agency
    if (!myAgency) return [];                   // provider tanpa agency → kosong
    return [myAgency];
  }, [isProvider, myAgency, agencies]);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<BusSchedule, "id">>(EMPTY_FORM);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [manifestId, setManifestId] = useState<string | null>(null);

  // Tunda / Batalkan
  const [statusModal, setStatusModal] = useState<{ id: string; mode: "ditunda" | "dibatalkan"; isRecurring: boolean } | null>(null);
  const [statusNote, setStatusNote] = useState("");
  const [statusNewTime, setStatusNewTime] = useState("");
  const [statusTargetDate, setStatusTargetDate] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);

  // Daftar override yang sudah ada untuk jadwal berulang yang sedang dibuka
  const existingOverrides = useMemo(() => {
    if (!statusModal?.isRecurring) return [];
    const sched = visibleSchedules.find((s) => s.id === statusModal.id);
    return sched?.dateOverrides || [];
  }, [statusModal, visibleSchedules]);


  const openStatusModal = (id: string, mode: "ditunda" | "dibatalkan") => {
    const sched = visibleSchedules.find((s) => s.id === id);
    setStatusModal({ id, mode, isRecurring: !!sched?.isRecurring });
    setStatusNote("");
    setStatusNewTime("");
    setStatusTargetDate("");
  };

  const handleStatusSave = async () => {
    if (!statusModal || !statusNote.trim()) return;
    if (statusModal.isRecurring && !statusTargetDate) return;
    setStatusLoading(true);
    await updateScheduleStatus(
      statusModal.id,
      statusModal.mode,
      statusNote.trim(),
      statusNewTime || undefined,
      statusModal.isRecurring ? statusTargetDate : undefined,
    );
    setStatusLoading(false);
    setStatusModal(null);
  };

  const handleReaktifkan = async (id: string, targetDate?: string) => {
    const sched = visibleSchedules.find((s) => s.id === id);
    await updateScheduleStatus(id, "aktif", "", "", sched?.isRecurring ? targetDate : undefined);
  };

  // Hapus satu override dari jadwal berulang
  const handleHapusOverride = async (schedId: string, date: string) => {
    await updateScheduleStatus(schedId, "aktif", "", "", date);
  };

  const openAdd = () => {
    setEditId(null);
    // Provider: pre-fill agency mereka
    if (isProvider && myAgency) {
      setForm({ ...EMPTY_FORM, agencyId: myAgency.id, agencyName: myAgency.name });
    } else {
      setForm(EMPTY_FORM);
    }
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
    const ag = availableAgencies.find((a) => a.id === form.agencyId);
    const agencyName = ag?.name || form.agencyName;
    const updated = { ...form, agencyName, busName: agencyName }; // busName = agencyName
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
    const sc = visibleSchedules.find((s) => s.id === manifestId);
    if (!sc) return [];
    return tickets.filter((t) => t.agencyName === sc.agencyName && t.busName === sc.busName && t.date === sc.date);
  }, [manifestId, visibleSchedules, tickets]);

  return (
    <motion.div variants={fadeSlideUp} initial="hidden" animate="visible">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em", fontFamily: "Outfit" }}>
            {isProvider ? "Jadwal Saya" : "Jadwal Bus"}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 16, marginTop: 4 }}>
            {isProvider ? `Jadwal keberangkatan armada ${myAgency?.name || "Anda"}` : "Kelola jadwal keberangkatan dan armada"}
          </p>
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
              <th style={{ padding: "20px 24px", textAlign: "center" }}>AKSI</th>
            </tr>
          </thead>
          <motion.tbody variants={staggerContainer} initial="hidden" animate="visible">
            {visibleSchedules.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
                  <p>{isProvider && !myAgency ? "Atur profil armada Anda terlebih dahulu." : "Belum ada jadwal. Klik \"Tambah Jadwal\" untuk memulai."}</p>
                </td>
              </tr>
            )}
            {visibleSchedules.map((s) => {
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
                    <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: 15, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                      {s.agencyName}
                      <ScheduleStatusBadge status={s.scheduleStatus} />
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{s.busName}</div>
                    {s.scheduleStatus === "ditunda" && (
                      <div style={{ fontSize: 12, color: "#92400E", marginTop: 4 }}>
                        {s.newDepartureTime && (
                          <span style={{ fontWeight: 700 }}>
                            {s.departureTime} → {s.newDepartureTime}
                            {" · "}
                          </span>
                        )}
                        {s.delayNote && <span style={{ fontStyle: "italic" }}>{s.delayNote}</span>}
                      </div>
                    )}
                    {s.scheduleStatus === "dibatalkan" && s.delayNote && (
                      <div style={{ fontSize: 12, color: "#991B1B", marginTop: 4, fontStyle: "italic" }}>
                        {s.delayNote}
                      </div>
                    )}
                  </td>
                  <td style={{ fontWeight: 600, color: "var(--text-main)", padding: "20px 24px", borderTop: "1px solid var(--border-subtle)" }}>
                    {s.origin} → {s.destination}
                  </td>
                  <td style={{ padding: "20px 24px", borderTop: "1px solid var(--border-subtle)" }}>
                    {(() => {
                      const nextDate = getNextDepartureDate(s);
                      return (
                        <div>
                          {nextDate && (
                            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-main)" }}>
                              {formatTanggal(nextDate)}
                            </div>
                          )}
                          {s.isRecurring && (
                            <div style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, marginTop: 2 }}>
                              Setiap {s.recurringDays}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </td>
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
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="btn btn-ghost"
                      onClick={() => setManifestId(s.id)}
                      title="Manifest Penumpang"
                      style={{ margin: "0 auto", padding: "8px", height: "auto" }}
                    >
                      <IconList />
                    </motion.button>
                  </td>
                  {/* Kolom AKSI gabungan */}
                  <td style={{ padding: "12px 16px", borderTop: "1px solid var(--border-subtle)", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                      {/* Edit */}
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => openEdit(s)} title="Edit"
                        style={{ padding: "6px 10px", borderRadius: "var(--radius)", border: "1px solid var(--border-subtle)", background: "var(--bg-white)", cursor: "pointer", display: "flex", alignItems: "center" }}
                      >
                        <IconEdit />
                      </motion.button>

                      {/* Tunda — hanya jika aktif atau sudah tunda */}
                      {s.scheduleStatus !== "dibatalkan" && (
                        s.scheduleStatus === "ditunda" ? (
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => handleReaktifkan(s.id)} title="Aktifkan kembali"
                            style={{ padding: "6px 10px", borderRadius: "var(--radius)", border: "1px solid #A3E635", background: "#F7FEE7", cursor: "pointer", display: "flex", alignItems: "center" }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4D7C0F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </motion.button>
                        ) : (
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => openStatusModal(s.id, "ditunda")} title="Tunda Jadwal"
                            style={{ padding: "6px 10px", borderRadius: "var(--radius)", border: "1px solid #FCD34D", background: "#FFFBEB", cursor: "pointer", display: "flex", alignItems: "center" }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                              <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                          </motion.button>
                        )
                      )}

                      {/* Batalkan — hanya jika belum dibatalkan */}
                      {s.scheduleStatus !== "dibatalkan" ? (
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => openStatusModal(s.id, "dibatalkan")} title="Batalkan Jadwal"
                          style={{ padding: "6px 10px", borderRadius: "var(--radius)", border: "1px solid #FCA5A5", background: "#FEF2F2", cursor: "pointer", display: "flex", alignItems: "center" }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                        </motion.button>
                      ) : (
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => handleReaktifkan(s.id)} title="Aktifkan kembali"
                          style={{ padding: "6px 10px", borderRadius: "var(--radius)", border: "1px solid #A3E635", background: "#F7FEE7", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#4D7C0F" }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4D7C0F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                          </svg>
                          Aktifkan
                        </motion.button>
                      )}

                      {/* Hapus */}
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setShowDelete(s.id)} title="Hapus Jadwal"
                        style={{ padding: "6px 10px", borderRadius: "var(--radius)", border: "1px solid var(--border-subtle)", background: "var(--bg-white)", cursor: "pointer", display: "flex", alignItems: "center" }}
                      >
                        <IconTrash />
                      </motion.button>
                    </div>
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
                  {availableAgencies.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <CitySelect label="Kota Asal" value={form.origin} onChange={(v) => setForm((f) => ({ ...f, origin: v }))} />
                <CitySelect label="Kota Tujuan" value={form.destination} onChange={(v) => setForm((f) => ({ ...f, destination: v }))} />
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

      {/* ── Modal Tunda / Batalkan ── */}
      <AnimatePresence>
        {statusModal && (() => {
          const schedInfo = visibleSchedules.find((s) => s.id === statusModal.id);
          const isRecurring = statusModal.isRecurring;
          const canSave = !!statusNote.trim()
            && (!isRecurring || !!statusTargetDate)
            && (statusModal.mode !== "ditunda" || !!statusNewTime);
          return (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setStatusModal(null)}>
              <motion.div variants={scaleIn} initial="hidden" animate="visible" exit="exit" className="modal-content"
                style={{ maxWidth: 520, padding: 36 }} onClick={(e) => e.stopPropagation()}
              >
                {/* Icon + judul */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: statusModal.mode === "ditunda" ? "#FEF3C7" : "#FEE2E2",
                  }}>
                    {statusModal.mode === "ditunda" ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-main)", fontFamily: "Outfit", margin: 0 }}>
                      {statusModal.mode === "ditunda" ? "Tunda Jadwal" : "Batalkan Jadwal"}
                    </h2>
                    <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
                      {schedInfo?.agencyName} · {schedInfo?.origin} → {schedInfo?.destination}
                    </p>
                  </div>
                </div>

                {/* Jika berulang: pilih tanggal via kalender */}
                {isRecurring && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 14, background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: "var(--radius)", padding: "12px 14px" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <p style={{ fontSize: 13, color: "#9A3412", lineHeight: 1.5, margin: 0 }}>
                        Jadwal berulang. Klik tanggal keberangkatan yang ingin {statusModal.mode === "ditunda" ? "ditunda" : "dibatalkan"}. Tanggal lampau tidak dapat dipilih.
                      </p>
                    </div>

                    <ScheduleCalendarPicker
                      schedule={schedInfo!}
                      selectedDate={statusTargetDate}
                      onSelect={setStatusTargetDate}
                      overrides={existingOverrides}
                    />

                    {/* Tanggal terpilih */}
                    {statusTargetDate && (
                      <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: "var(--radius)", background: "#FEF3C7", border: "1px solid #FCD34D", display: "flex", alignItems: "center", gap: 8 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#92400E" }}>
                          Dipilih: {formatTanggalPanjang(statusTargetDate)}
                        </span>
                        <button onClick={() => setStatusTargetDate("")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#B45309", padding: 0 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Daftar override yang sudah ada (jadwal berulang) */}
                {isRecurring && existingOverrides.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10 }}>Penundaan/Pembatalan yang sudah ada:</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {existingOverrides.map((ov: ScheduleDateOverride) => (
                        <div key={ov.date} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "10px 14px", borderRadius: "var(--radius)",
                          background: ov.status === "dibatalkan" ? "#FEF2F2" : "#FFFBEB",
                          border: `1px solid ${ov.status === "dibatalkan" ? "#FCA5A5" : "#FCD34D"}`,
                        }}>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: ov.status === "dibatalkan" ? "#991B1B" : "#92400E" }}>
                              {new Date(ov.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                            </span>
                            <span style={{
                              marginLeft: 8, fontSize: 11, fontWeight: 700, padding: "2px 8px",
                              borderRadius: "var(--radius-full)",
                              background: ov.status === "dibatalkan" ? "#FEE2E2" : "#FEF3C7",
                              color: ov.status === "dibatalkan" ? "#991B1B" : "#92400E",
                            }}>
                              {ov.status === "dibatalkan" ? "Dibatalkan" : "Ditunda"}
                            </span>
                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                              {ov.status === "ditunda" && ov.newDepartureTime && (
                                <span style={{ fontWeight: 700, color: "#92400E", marginRight: 6 }}>
                                  {schedInfo?.departureTime} → {ov.newDepartureTime}
                                </span>
                              )}
                              {ov.note}
                            </div>
                          </div>
                          <button
                            onClick={() => handleHapusOverride(statusModal.id, ov.date)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--text-muted)", flexShrink: 0 }}
                            title="Aktifkan kembali tanggal ini"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alasan */}
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">
                    {statusModal.mode === "ditunda" ? "Alasan Penundaan *" : "Alasan Pembatalan *"}
                  </label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder={statusModal.mode === "ditunda" ? "Contoh: Kerusakan mesin, cuaca buruk..." : "Contoh: Force majeure, bencana alam..."}
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    style={{ resize: "vertical", fontFamily: "inherit", fontSize: 14 }}
                  />
                </div>

                {statusModal.mode === "ditunda" && (
                  <div style={{ marginBottom: 20 }}>
                    {/* Perbandingan jam asli vs jam baru */}
                    <div style={{ display: "flex", gap: 12, alignItems: "stretch", marginBottom: 8 }}>
                      {/* Jam asli */}
                      <div style={{ flex: 1, padding: "12px 16px", borderRadius: "var(--radius)", background: "var(--bg-subtle)", border: "1.5px solid var(--border-subtle)" }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                          Jam Keberangkatan Asli
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-main)", fontFamily: "Outfit", letterSpacing: "-0.02em" }}>
                          {schedInfo?.departureTime || "—"}
                        </div>
                      </div>

                      {/* Panah */}
                      <div style={{ display: "flex", alignItems: "center", color: "var(--text-muted)", flexShrink: 0 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                        </svg>
                      </div>

                      {/* Jam baru */}
                      <div style={{ flex: 1, padding: "12px 16px", borderRadius: "var(--radius)", background: statusNewTime ? "#FEF3C7" : "var(--bg-white)", border: `1.5px solid ${statusNewTime ? "#FCD34D" : "var(--border-subtle)"}`, transition: "all 0.2s" }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: statusNewTime ? "#92400E" : "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                          Di-delay Ke *
                        </div>
                        <input
                          type="time"
                          value={statusNewTime}
                          onChange={(e) => setStatusNewTime(e.target.value)}
                          style={{
                            fontSize: 24, fontWeight: 800, color: statusNewTime ? "#92400E" : "var(--text-light)",
                            fontFamily: "Outfit", letterSpacing: "-0.02em",
                            border: "none", background: "transparent", outline: "none",
                            width: "100%", padding: 0, cursor: "pointer",
                          }}
                        />
                      </div>
                    </div>

                    {statusNewTime && schedInfo?.departureTime && (
                      <div style={{ fontSize: 12, color: "#92400E", fontWeight: 600, textAlign: "center", marginTop: 6 }}>
                        Diundur {(() => {
                          const [oh, om] = schedInfo.departureTime.split(":").map(Number);
                          const [nh, nm] = statusNewTime.split(":").map(Number);
                          const diff = (nh * 60 + nm) - (oh * 60 + om);
                          if (diff <= 0) return "—";
                          const h = Math.floor(diff / 60), m = diff % 60;
                          return h > 0 ? `${h} jam${m > 0 ? ` ${m} menit` : ""}` : `${m} menit`;
                        })()}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", gap: 12 }}>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => setStatusModal(null)}
                  >
                    Tutup
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="btn btn-lg" disabled={!canSave || statusLoading}
                    style={{
                      flex: 1,
                      background: statusModal.mode === "ditunda" ? "#F59E0B" : "#DC2626",
                      color: "#fff", border: "none",
                      opacity: (!canSave || statusLoading) ? 0.5 : 1,
                      cursor: (!canSave || statusLoading) ? "not-allowed" : "pointer",
                    }}
                    onClick={handleStatusSave}
                  >
                    {statusLoading ? "Menyimpan..." : statusModal.mode === "ditunda" ? "Tunda Jadwal" : "Batalkan Jadwal"}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── Manifest Modal ── */}
      <AnimatePresence>
        {manifestId && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setManifestId(null)}>
            <motion.div variants={scaleIn} initial="hidden" animate="visible" exit="exit" className="modal-content" style={{ maxWidth: 680, padding: 36 }} onClick={(e) => e.stopPropagation()}>
              {(() => {
                const sc = visibleSchedules.find((s) => s.id === manifestId);
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
