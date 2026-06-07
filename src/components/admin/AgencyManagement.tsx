"use client";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/AppContext";
import { fadeSlideUp, staggerContainer, staggerItem, scaleIn } from "@/animations/variants";
import type { TravelAgency } from "@/types";

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

function BusIcon({ size = 28 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="2"/>
      <path d="M16 8h4l3 5v3h-7V8z"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  );
}

function AgencyLogo({ logo, name, size }: { logo: string; name: string; size: number }) {
  const src = logo?.startsWith("data:") || logo?.startsWith("http") ? logo : null;
  if (src) {
    return (
      <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
        onError={(e) => { e.currentTarget.style.display = "none"; const p = e.currentTarget.parentElement; if (p) p.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`; }} />
    );
  }
  return <BusIcon size={size} />;
}

function StarRating({ value }: { value: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#F59E0B", fontWeight: 700, fontSize: 14 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      {value.toFixed(1)}
    </div>
  );
}


const EMPTY_FORM: Omit<TravelAgency, "id"> = {
  name: "", logo: "🚌", description: "", contact: "", photos: "",
  rating: 5.0, totalBuses: 0, routes: [], ownerId: "",
};

export default function AgencyManagement() {
  const { agencies, addAgency, updateAgency, deleteAgency, user, myAgency } = useAppStore();
  const isProvider = user?.role === "provider";

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<TravelAgency, "id">>(EMPTY_FORM);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [photoPreviewError, setPhotoPreviewError] = useState(false);

  // Akun PO bus (hanya diisi saat admin buat agency baru)
  const [providerName, setProviderName] = useState("");
  const [providerEmail, setProviderEmail] = useState("");
  const [providerPassword, setProviderPassword] = useState("");
  const [providerError, setProviderError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((f) => ({ ...f, photos: ev.target?.result as string }));
      setPhotoPreviewError(false);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((f) => ({ ...f, logo: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const visibleAgencies = useMemo(() => {
    if (!isProvider) return agencies;
    return myAgency ? [myAgency] : [];
  }, [isProvider, agencies, myAgency]);

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setProviderName(""); setProviderEmail(""); setProviderPassword(""); setProviderError("");
    setPhotoPreviewError(false);
    setShowModal(true);
  };

  const openEdit = (a: TravelAgency) => {
    setEditId(a.id);
    setForm({ name: a.name, logo: a.logo, description: a.description, contact: a.contact || "", photos: a.photos || "", rating: a.rating, totalBuses: a.totalBuses, routes: a.routes, ownerId: a.ownerId || "" });
    setProviderName(""); setProviderEmail(""); setProviderPassword(""); setProviderError("");
    setPhotoPreviewError(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    setProviderError("");
    setIsSaving(true);

    let ownerId = form.ownerId || undefined;

    // Saat tambah agency baru, akun PO bus WAJIB dibuat
    if (!isProvider && !editId) {
      if (!providerName.trim()) {
        setProviderError("Nama pengelola PO bus wajib diisi.");
        setIsSaving(false);
        return;
      }
      if (!providerEmail.trim()) {
        setProviderError("Email login PO bus wajib diisi.");
        setIsSaving(false);
        return;
      }
      if (providerPassword.length < 6) {
        setProviderError("Password minimal 6 karakter.");
        setIsSaving(false);
        return;
      }
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: providerName.trim(), email: providerEmail, password: providerPassword, role: "provider" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setProviderError(err.error || "Gagal membuat akun — email mungkin sudah terdaftar.");
        setIsSaving(false);
        return;
      }
      const newUser = await res.json();
      ownerId = newUser.id;
    }

    const payload = { ...form, ownerId: ownerId || undefined };
    if (editId) {
      updateAgency({ ...payload, id: editId });
    } else {
      addAgency(payload);
    }
    setIsSaving(false);
    setShowModal(false);
  };

  const handleDelete = () => {
    if (showDelete) { deleteAgency(showDelete); setShowDelete(null); }
  };

  // Provider tanpa agency
  if (isProvider && !myAgency) {
    return (
      <motion.div variants={fadeSlideUp} initial="hidden" animate="visible">
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em", fontFamily: "Outfit" }}>Profil Armada</h1>
        </div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: "#EFF6FF", borderRadius: "var(--radius-xl)", border: "1px solid #BFDBFE", padding: "48px", textAlign: "center" }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1E40AF", marginBottom: 10, fontFamily: "Outfit" }}>Menunggu Data Armada</h2>
          <p style={{ color: "#3B82F6", fontSize: 14, margin: 0 }}>
            Admin akan mendaftarkan profil armada Anda. Hubungi admin untuk proses pendaftaran.
          </p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeSlideUp} initial="hidden" animate="visible">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em", fontFamily: "Outfit" }}>
            {isProvider ? "Profil Armada Saya" : "Travel Agency"}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 16, marginTop: 4 }}>
            {isProvider ? "Kelola profil dan data armada bus Anda" : "Kelola data dan profil travel agency"}
          </p>
        </div>
        {!isProvider && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn btn-primary btn-lg" onClick={openAdd} style={{ gap: 10, padding: "12px 24px", fontSize: 15 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Tambah Agency
          </motion.button>
        )}
      </div>

      {/* Provider: card view */}
      {isProvider && myAgency ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: "var(--bg-white)", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-md)", padding: "32px 36px" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 72, height: 72, borderRadius: "var(--radius)", background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AgencyLogo logo={myAgency.logo} name={myAgency.name} size={36} />
              </div>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-main)", margin: 0, fontFamily: "Outfit" }}>{myAgency.name}</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
                  <StarRating value={myAgency.rating} />
                  <span style={{ color: "var(--text-muted)", fontSize: 14 }}>·</span>
                  <span style={{ color: "var(--text-muted)", fontSize: 14 }}>{myAgency.totalBuses} unit bus</span>
                </div>
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn btn-primary" onClick={() => openEdit(myAgency)} style={{ gap: 8 }}>
              <IconEdit /> Edit Profil
            </motion.button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-light)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Deskripsi</div>
              <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, margin: 0 }}>{myAgency.description || "—"}</p>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-light)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Kontak</div>
              <p style={{ fontSize: 14, color: "var(--text-main)", fontWeight: 500, margin: 0 }}>{myAgency.contact || "—"}</p>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Admin: table view */
        <div style={{ background: "var(--bg-white)", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-md)", overflow: "hidden" }}>
          <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr>
                <th style={{ padding: "20px 24px" }}>Agency / PO Bus</th>
                <th style={{ padding: "20px 24px" }}>Kontak</th>
                <th style={{ padding: "20px 24px" }}>Rating</th>
                <th style={{ padding: "20px 24px" }}>Bus</th>
                <th style={{ padding: "20px 24px" }}>Akun Penyedia</th>
                <th style={{ padding: "20px 24px", textAlign: "center" }}>Edit</th>
                <th style={{ padding: "20px 24px", textAlign: "center" }}>Hapus</th>
              </tr>
            </thead>
            <motion.tbody variants={staggerContainer} initial="hidden" animate="visible">
              {visibleAgencies.length === 0 && (
                <tr><td colSpan={7} style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🚌</div>
                  <p>Belum ada agency. Klik "Tambah Agency" untuk mendaftarkan PO Bus.</p>
                </td></tr>
              )}
              {visibleAgencies.map((a) => (
                <motion.tr key={a.id} variants={staggerItem} style={{ transition: "background 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-main)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "16px 24px", borderTop: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 52, height: 52, borderRadius: "var(--radius)", background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <AgencyLogo logo={a.logo} name={a.name} size={26} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: 15 }}>{a.name}</div>
                        {a.description && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{a.description.slice(0, 40)}{a.description.length > 40 ? "…" : ""}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "16px 24px", borderTop: "1px solid var(--border-subtle)" }}>
                    {a.contact ? <div style={{ fontSize: 13, color: "var(--text-main)", fontWeight: 500 }}>{a.contact}</div>
                      : <span style={{ fontSize: 12, color: "var(--text-light)", fontStyle: "italic" }}>—</span>}
                  </td>
                  <td style={{ padding: "16px 24px", borderTop: "1px solid var(--border-subtle)" }}>
                    <StarRating value={a.rating} />
                  </td>
                  <td style={{ fontWeight: 700, color: "var(--text-main)", fontSize: 15, padding: "16px 24px", borderTop: "1px solid var(--border-subtle)" }}>{a.totalBuses}</td>
                  <td style={{ padding: "16px 24px", borderTop: "1px solid var(--border-subtle)" }}>
                    {a.ownerId
                      ? <span style={{ fontSize: 12, padding: "3px 8px", borderRadius: "var(--radius-full)", background: "#DCFCE7", color: "#166534", fontWeight: 600 }}>✓ Terhubung</span>
                      : <span style={{ fontSize: 12, color: "var(--text-light)", fontStyle: "italic" }}>Belum ada</span>}
                  </td>
                  <td style={{ padding: "16px 24px", borderTop: "1px solid var(--border-subtle)", textAlign: "center" }}>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn btn-ghost" onClick={() => openEdit(a)} style={{ margin: "0 auto", padding: "8px", height: "auto" }} title="Edit">
                      <IconEdit />
                    </motion.button>
                  </td>
                  <td style={{ padding: "16px 24px", borderTop: "1px solid var(--border-subtle)", textAlign: "center" }}>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn btn-ghost" onClick={() => setShowDelete(a.id)} style={{ margin: "0 auto", padding: "8px", height: "auto" }} title="Hapus">
                      <IconTrash />
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      )}

      {/* ── Modal Form ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
            <motion.div variants={scaleIn} initial="hidden" animate="visible" exit="exit" className="modal-content" onClick={(e) => e.stopPropagation()}
              style={{ width: 560, padding: 36, maxHeight: "90vh", overflowY: "auto" }}
            >
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-main)", marginBottom: 28, letterSpacing: "-0.02em", fontFamily: "Outfit" }}>
                {editId ? (isProvider ? "Edit Profil Armada" : "Edit Agency") : "Tambah Agency / PO Bus"}
              </h2>

              {/* Info dasar */}
              <div className="form-group">
                <label className="form-label">Nama PO Bus / Agency</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Contoh: PO Kurnia Aceh" />
              </div>

              <div className="form-group">
                <label className="form-label">Logo Armada</label>
                <input ref={logoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoFileChange} />
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    style={{
                      width: 72, height: 72, borderRadius: "var(--radius)",
                      border: "2px dashed var(--border-subtle)",
                      background: "var(--bg-subtle)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", overflow: "hidden", flexShrink: 0,
                      transition: "border-color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
                  >
                    {form.logo && form.logo.startsWith("data:") ? (
                      <img src={form.logo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      style={{
                        padding: "8px 16px", borderRadius: "var(--radius)",
                        border: "1px solid var(--border-subtle)", background: "var(--bg-subtle)",
                        color: "var(--text-main)", fontSize: 13, fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Pilih File Logo
                    </button>
                    {form.logo && form.logo.startsWith("data:") && (
                      <button
                        type="button"
                        onClick={() => { setForm((f) => ({ ...f, logo: "🚌" })); if (logoInputRef.current) logoInputRef.current.value = ""; }}
                        style={{ marginTop: 6, padding: "4px 10px", borderRadius: "var(--radius)", border: "none", background: "transparent", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", display: "block" }}
                      >
                        Hapus logo
                      </button>
                    )}
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>PNG, JPG, SVG — maks 2MB</p>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Deskripsi</label>
                <textarea className="form-input" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Deskripsi singkat PO bus" style={{ resize: "vertical" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Kontak (WhatsApp / Email)</label>
                  <input className="form-input" value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} placeholder="0812-3456-7890" />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Armada Bus</label>
                  <input className="form-input" type="number" min="0" value={form.totalBuses} onChange={(e) => setForm((f) => ({ ...f, totalBuses: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Foto Armada</label>
                {/* Pilih file */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    className="form-input"
                    value={form.photos.startsWith("data:") ? "" : form.photos}
                    onChange={(e) => { setForm((f) => ({ ...f, photos: e.target.value })); setPhotoPreviewError(false); }}
                    placeholder="https://... atau pilih file di bawah"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-subtle)",
                      color: "var(--text-main)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Pilih File
                  </button>
                </div>
                {form.photos && !photoPreviewError && (
                  <div style={{ marginTop: 10, position: "relative" }}>
                    <img
                      src={form.photos}
                      alt="preview"
                      onError={() => setPhotoPreviewError(true)}
                      style={{ width: "100%", maxHeight: 120, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border-subtle)" }}
                    />
                    <button
                      type="button"
                      onClick={() => { setForm((f) => ({ ...f, photos: "" })); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      style={{
                        position: "absolute", top: 6, right: 6,
                        width: 24, height: 24, borderRadius: "50%",
                        background: "rgba(0,0,0,0.55)", border: "none",
                        color: "#fff", fontSize: 14, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
                      }}
                    >×</button>
                  </div>
                )}
              </div>

              {/* Akun PO Bus — wajib diisi saat tambah baru */}
              {!isProvider && !editId && (
                <>
                  <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)", margin: "4px 0 20px" }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
                    Akun Login PO Bus
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Nama Pengelola</label>
                      <input className="form-input" value={providerName} onChange={(e) => setProviderName(e.target.value)} placeholder="Nama pengelola PO" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Login</label>
                      <input className="form-input" type="email" value={providerEmail} onChange={(e) => setProviderEmail(e.target.value)} placeholder="po@kurnia.com" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input className="form-input" type="password" value={providerPassword} onChange={(e) => setProviderPassword(e.target.value)} placeholder="Min. 6 karakter" />
                  </div>
                  {providerError && <p style={{ color: "#DC2626", fontSize: 13, marginTop: -8, marginBottom: 8 }}>{providerError}</p>}
                </>
              )}

              <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Batal</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Menyimpan..." : editId ? "Simpan" : "Tambah Agency"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDelete && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDelete(null)}>
            <motion.div variants={scaleIn} initial="hidden" animate="visible" exit="exit" className="modal-content" style={{ maxWidth: 420, textAlign: "center", padding: 36 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 32 }}>⚠️</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-main)", marginBottom: 12, fontFamily: "Outfit" }}>Hapus Agency?</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>Tindakan ini tidak dapat dibatalkan. Semua jadwal terkait juga akan dihapus.</p>
              <div style={{ display: "flex", gap: 16 }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => setShowDelete(null)}>Batal</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn btn-danger btn-lg" style={{ flex: 1 }} onClick={handleDelete}>Ya, Hapus</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
