"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/AppContext";
import { fadeSlideUp, staggerContainer, staggerItem, scaleIn } from "@/animations/variants";
import type { Ticket, TransactionStatus } from "@/types";

function formatPrice(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

const STATUS_CONFIG: Record<TransactionStatus, { bg: string; color: string; dot: string }> = {
  Lunas: { bg: "#DCFCE7", color: "#166534", dot: "#16A34A" },
  "Menunggu Pembayaran": { bg: "#FEF9C3", color: "#854D0E", dot: "#D97706" },
  Kedaluwarsa: { bg: "var(--bg-subtle)", color: "var(--text-muted)", dot: "var(--text-light)" },
  Dibatalkan: { bg: "#FEE2E2", color: "#991B1B", dot: "#DC2626" },
};

const FILTERS: { label: string; value: string }[] = [
  { label: "Semua", value: "all" },
  { label: "Lunas", value: "Lunas" },
  { label: "Menunggu", value: "Menunggu Pembayaran" },
  { label: "Kedaluwarsa", value: "Kedaluwarsa" },
  { label: "Dibatalkan", value: "Dibatalkan" },
];

/* ── Star Rating Component ── */
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 2,
            fontSize: 28,
            color: star <= (hovered || value) ? "#F59E0B" : "#D1D5DB",
            transition: "color 0.15s, transform 0.1s",
            transform: star === (hovered || value) ? "scale(1.15)" : "scale(1)",
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/* ── Review Modal ── */
function ReviewModal({
  ticket,
  onClose,
  onSubmit,
}: {
  ticket: Ticket;
  onClose: () => void;
  onSubmit: (rating: number, comment: string, photos: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Pilih rating bintang terlebih dahulu.");
      return;
    }
    setError("");
    setSubmitting(true);
    const result = await onSubmit(rating, comment, photos);
    setSubmitting(false);
    if (result.ok) {
      setDone(true);
    } else {
      setError(result.error || "Gagal mengirim ulasan.");
    }
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="modal-content"
        style={{ width: 480, padding: 36 }}
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-main)", marginBottom: 10, fontFamily: "Outfit" }}>
              Terima Kasih!
            </h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 28 }}>
              Ulasan Anda untuk <strong>{ticket.agencyName}</strong> telah berhasil dikirim.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="btn btn-primary btn-lg"
              style={{ width: "100%" }}
              onClick={onClose}
            >
              Selesai
            </motion.button>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-main)", marginBottom: 6, fontFamily: "Outfit" }}>
              Beri Ulasan
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 28 }}>
              {ticket.agencyName} — {ticket.origin} → {ticket.destination}
            </p>

            {/* Star Rating */}
            <div className="form-group">
              <label className="form-label">Rating</label>
              <StarRating value={rating} onChange={setRating} />
              <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-muted)" }}>
                {rating === 0 && "Pilih rating bintang"}
                {rating === 1 && "1 – Sangat Buruk"}
                {rating === 2 && "2 – Buruk"}
                {rating === 3 && "3 – Cukup"}
                {rating === 4 && "4 – Bagus"}
                {rating === 5 && "5 – Sangat Bagus"}
              </div>
            </div>

            {/* Comment */}
            <div className="form-group">
              <label className="form-label">Ulasan (Opsional)</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Ceritakan pengalaman perjalanan Anda..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{ resize: "vertical" }}
              />
            </div>

            {/* Photo URL */}
            <div className="form-group">
              <label className="form-label">URL Foto (Opsional)</label>
              <input
                className="form-input"
                type="url"
                placeholder="https://..."
                value={photos}
                onChange={(e) => setPhotos(e.target.value)}
              />
              {photos && (
                <img
                  src={photos}
                  alt="preview"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                  style={{ marginTop: 8, width: "100%", maxHeight: 140, objectFit: "cover", borderRadius: 8 }}
                />
              )}
            </div>

            {error && <p style={{ color: "#DC2626", fontSize: 13, marginBottom: 16 }}>{error}</p>}

            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="btn btn-secondary btn-lg"
                style={{ flex: 1 }}
                onClick={onClose}
              >
                Batal
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="btn btn-primary btn-lg"
                style={{ flex: 1 }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Mengirim..." : "Kirim Ulasan"}
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function HistoryPage() {
  const { tickets, user, schedules, addReview, userReviews } = useAppStore();
  const [filter, setFilter] = useState("all");
  const [modalTicket, setModalTicket] = useState<Ticket | null>(null);
  const [reviewTicket, setReviewTicket] = useState<Ticket | null>(null);

  // Set agencyId yang sudah pernah direview user ini
  const reviewedAgencyIds = useMemo(
    () => new Set(userReviews.map((r) => r.agencyId)),
    [userReviews],
  );

  const userTickets = useMemo(() => {
    const mine = tickets.filter((t) => t.passengerId === user?.id);
    if (filter === "all") return mine;
    return mine.filter((t) => t.status === filter);
  }, [tickets, user, filter]);

  const handleSubmitReview = async (rating: number, comment: string, photos: string): Promise<{ ok: boolean; error?: string }> => {
    if (!reviewTicket) return { ok: false };
    const schedule = schedules.find((s) => s.agencyName === reviewTicket.agencyName);
    if (!schedule) return { ok: false, error: "Data armada tidak ditemukan." };
    return addReview({
      agencyId: schedule.agencyId,
      rating,
      comment: comment || undefined,
      photos: photos || undefined,
    });
  };

  return (
    <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 40px 80px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em", fontFamily: "Outfit" }}>Riwayat Pemesanan</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 16, marginTop: 4 }}>{userTickets.length} tiket ditemukan</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 32, background: "var(--bg-subtle)", borderRadius: "var(--radius-lg)", padding: 6, width: "fit-content" }}>
        {FILTERS.map((f) => (
          <motion.button
            key={f.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setFilter(f.value)}
            style={{
              padding: "10px 20px",
              borderRadius: "var(--radius)",
              border: "none",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all var(--transition)",
              background: filter === f.value ? "var(--bg-white)" : "transparent",
              color: filter === f.value ? "var(--text-main)" : "var(--text-muted)",
              boxShadow: filter === f.value ? "var(--shadow-sm)" : "none",
            }}
          >
            {f.label}
          </motion.button>
        ))}
      </div>

      {/* Table */}
      {userTickets.length === 0 ? (
        <motion.div variants={scaleIn} initial="hidden" animate="visible" style={{ textAlign: "center", padding: "100px 0" }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🎫</div>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-main)", marginBottom: 8, fontFamily: "Outfit" }}>Belum Ada Tiket</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 16 }}>Tiket yang telah dipesan akan muncul di sini</p>
        </motion.div>
      ) : (
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
                <th style={{ padding: "20px 24px" }}>ID Tiket</th>
                <th style={{ padding: "20px 24px" }}>Rute</th>
                <th style={{ padding: "20px 24px" }}>Tanggal</th>
                <th style={{ padding: "20px 24px" }}>Kursi</th>
                <th style={{ padding: "20px 24px" }}>Harga</th>
                <th style={{ padding: "20px 24px" }}>Status</th>
                <th style={{ width: 140, padding: "20px 24px", textAlign: "center" }}>Ulasan</th>
                <th style={{ width: 80, padding: "20px 24px" }}></th>
              </tr>
            </thead>
            <motion.tbody variants={staggerContainer} initial="hidden" animate="visible">
              {userTickets.map((ticket) => {
                const cfg = STATUS_CONFIG[ticket.status];
                return (
                  <motion.tr
                    key={ticket.id}
                    variants={staggerItem}
                    style={{ cursor: "pointer", transition: "background 0.2s" }}
                    onClick={() => setModalTicket(ticket)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-main)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "20px 24px", borderTop: "1px solid var(--border-subtle)" }}>
                      <span style={{ fontWeight: 700, color: "var(--text-main)", fontFamily: "monospace", fontSize: 14 }}>{ticket.id}</span>
                    </td>
                    <td style={{ padding: "20px 24px", borderTop: "1px solid var(--border-subtle)" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-main)", fontSize: 15 }}>
                        {ticket.origin} → {ticket.destination}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                        {ticket.agencyName} — {ticket.busName}
                      </div>
                    </td>
                    <td style={{ padding: "20px 24px", borderTop: "1px solid var(--border-subtle)" }}>
                      <div style={{ fontSize: 14, color: "var(--text-main)" }}>{ticket.date}</div>
                      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                        {ticket.departureTime} – {ticket.arrivalTime}
                      </div>
                    </td>
                    <td style={{ padding: "20px 24px", borderTop: "1px solid var(--border-subtle)" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: "var(--radius-full)",
                          background: "var(--secondary-light)",
                          color: "var(--primary-dark)",
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        {ticket.seatNumber}
                      </span>
                    </td>
                    <td style={{ padding: "20px 24px", borderTop: "1px solid var(--border-subtle)" }}>
                      <span style={{ fontWeight: 700, color: "var(--text-main)", fontSize: 15 }}>{formatPrice(ticket.price)}</span>
                    </td>
                    <td style={{ padding: "20px 24px", borderTop: "1px solid var(--border-subtle)" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 14px",
                          borderRadius: "var(--radius-full)",
                          background: cfg.bg,
                          color: cfg.color,
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot }} />
                        {ticket.status}
                      </span>
                    </td>
                    <td style={{ padding: "20px 24px", borderTop: "1px solid var(--border-subtle)", textAlign: "center" }}>
                      {ticket.status === "Lunas" && (() => {
                        const sc = schedules.find((s) => s.agencyName === ticket.agencyName);
                        const alreadyReviewed = sc ? reviewedAgencyIds.has(sc.agencyId) : false;
                        return alreadyReviewed ? (
                          <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                            ★ Sudah Direview
                          </span>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: 13, padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: 6 }}
                            onClick={(e) => { e.stopPropagation(); setReviewTicket(ticket); }}
                          >
                            ★ Beri Ulasan
                          </motion.button>
                        );
                      })()}
                    </td>
                    <td style={{ padding: "20px 24px", borderTop: "1px solid var(--border-subtle)" }}>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalTicket(ticket);
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </motion.button>
                    </td>
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </table>
        </div>
      )}

      {/* ── Ticket Detail Modal ── */}
      <AnimatePresence>
        {modalTicket && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalTicket(null)}>
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--white)",
                borderRadius: "var(--radius-xl)",
                width: 480,
                maxWidth: "95vw",
                overflow: "hidden",
                boxShadow: "var(--shadow-xl)",
              }}
            >
              {/* Ticket header */}
              <div
                style={{
                  background: "linear-gradient(135deg, var(--primary-dark), #7c3aed)",
                  padding: "28px 32px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                    pointerEvents: "none",
                  }}
                />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>E-Ticket</span>
                    <span style={{ fontFamily: "monospace", color: "#fff", fontWeight: 700, fontSize: 14 }}>{modalTicket.id}</span>
                  </div>
                  <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
                    {modalTicket.origin} → {modalTicket.destination}
                  </h2>
                </div>
              </div>

              {/* Ticket body */}
              <div style={{ padding: "32px 36px", backgroundColor: "var(--bg-main)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 36px", marginBottom: 28 }}>
                  {[
                    { label: "Penumpang", value: modalTicket.passengerName },
                    { label: "NIK", value: modalTicket.passengerNik },
                    { label: "Bus", value: `${modalTicket.agencyName} — ${modalTicket.busName}` },
                    { label: "Kelas", value: modalTicket.busClass },
                    { label: "Tanggal", value: modalTicket.date },
                    { label: "Waktu", value: `${modalTicket.departureTime} – ${modalTicket.arrivalTime}` },
                    { label: "Kursi", value: modalTicket.seatNumber },
                    { label: "Pembayaran", value: modalTicket.paymentMethod },
                  ].map((item) => (
                    <div key={item.label}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-light)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{item.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-main)" }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                <hr className="divider" />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>Total Harga</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "var(--primary)", letterSpacing: "-0.02em", fontFamily: "Outfit" }}>{formatPrice(modalTicket.price)}</div>
                  </div>
                  <span
                    style={{
                      padding: "8px 20px",
                      borderRadius: "var(--radius-full)",
                      background: STATUS_CONFIG[modalTicket.status].bg,
                      color: STATUS_CONFIG[modalTicket.status].color,
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {modalTicket.status}
                  </span>
                </div>

                {/* Simulated barcode */}
                <div
                  style={{
                    marginTop: 28,
                    padding: "20px 0",
                    borderTop: "2px dashed var(--border-subtle)",
                    display: "flex",
                    justifyContent: "center",
                    gap: 2,
                  }}
                >
                  {Array.from({ length: 40 }, (_, i) => (
                    <div
                      key={i}
                      style={{
                        width: i % 3 === 0 ? 3 : 2,
                        height: 40,
                        background: i % 5 === 0 ? "var(--gray-300)" : "var(--gray-900)",
                        borderRadius: 1,
                      }}
                    />
                  ))}
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  {modalTicket.status === "Lunas" && (() => {
                    const sc = schedules.find((s) => s.agencyName === modalTicket.agencyName);
                    const alreadyReviewed = sc ? reviewedAgencyIds.has(sc.agencyId) : false;
                    return alreadyReviewed ? (
                      <div style={{ flex: 1, textAlign: "center", fontSize: 13, color: "#16A34A", fontWeight: 600, padding: "10px 0" }}>
                        ★ Sudah Direview
                      </div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="btn btn-secondary"
                        style={{ flex: 1 }}
                        onClick={() => { setModalTicket(null); setReviewTicket(modalTicket); }}
                      >
                        ★ Beri Ulasan
                      </motion.button>
                    );
                  })()}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setModalTicket(null)}
                  >
                    Tutup
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Review Modal ── */}
      <AnimatePresence>
        {reviewTicket && (
          <ReviewModal
            ticket={reviewTicket}
            onClose={() => setReviewTicket(null)}
            onSubmit={handleSubmitReview}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
