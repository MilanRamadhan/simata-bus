"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/AppContext";
import type { BusSchedule, TravelAgency } from "@/types";
import { SUMATERA_CITIES } from "@/lib/cities";
import { getNextDepartureDate, hasUpcomingDeparture, formatTanggal, getDateOverride } from "@/lib/scheduleUtils";
import BookingDatePicker from "./BookingDatePicker";

interface Props {
  onSelectSchedule: (s: BusSchedule) => void;
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function getDuration(departure: string, arrival: string) {
  const [depHour, depMinute] = departure.split(":").map(Number);
  const [arrHour, arrMinute] = arrival.split(":").map(Number);
  let dep = depHour * 60 + depMinute;
  let arr = arrHour * 60 + arrMinute;
  if (arr < dep) arr += 24 * 60;

  const total = arr - dep;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (minutes === 0) return `${hours} Jam`;
  return `${hours} Jam ${minutes} Menit`;
}

function getFacilities(schedule: BusSchedule) {
  if (schedule.busClass === "Eksekutif") return ["AC", "Toilet", "Snack"];
  if (schedule.busClass === "Bisnis") return ["AC", "Reclining Seat"];
  return ["AC", "USB Port"];
}

function BusLogoIcon({ agency, size = 28 }: { agency?: TravelAgency; size?: number }) {
  const logoSrc = agency?.logo && (agency.logo.startsWith("data:") || agency.logo.startsWith("http")) ? agency.logo : null;
  const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;
  if (logoSrc) {
    return (
      <img src={logoSrc} alt={agency?.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
        onError={(e) => { e.currentTarget.style.display = "none"; const p = e.currentTarget.parentElement; if (p) p.innerHTML = fallbackSvg; }} />
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="2"/>
      <path d="M16 8h4l3 5v3h-7V8z"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  );
}

function AgencyDetailModal({ schedule, agency, onClose, onSelect }: { schedule: BusSchedule; agency?: TravelAgency; onClose: () => void; onSelect: () => void }) {
  const availableSeats = schedule.totalSeats - schedule.bookedSeats.length;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--bg-white)", borderRadius: "var(--radius-xl)", width: "100%", maxWidth: 520, overflow: "hidden", boxShadow: "var(--shadow-xl)" }}
      >
        {/* Foto armada */}
        {agency?.photos ? (
          <div style={{ width: "100%", height: 200, overflow: "hidden", background: "var(--bg-subtle)" }}>
            <img src={agency.photos} alt={agency.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ) : (
          <div style={{ width: "100%", height: 140, background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--border-subtle)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
        )}

        <div style={{ padding: 28 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: "var(--radius)", background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
              <BusLogoIcon agency={agency} size={26} />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-main)", margin: 0, fontFamily: "Outfit" }}>{schedule.agencyName}</h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>{schedule.busName} · {schedule.busClass}</p>
            </div>
            {agency?.rating && (
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, color: "#F59E0B", fontWeight: 700, fontSize: 14 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                {agency.rating.toFixed(1)}
              </div>
            )}
          </div>

          {/* Info rute */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--bg-subtle)", borderRadius: "var(--radius)", padding: "14px 18px", marginBottom: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-main)" }}>{schedule.departureTime}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{schedule.origin}</div>
            </div>
            <div style={{ flex: 1, borderTop: "2px dashed var(--border-subtle)", position: "relative" }}>
              <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", fontSize: 11, color: "var(--text-muted)", background: "var(--bg-subtle)", padding: "0 6px", whiteSpace: "nowrap" }}>
                {getDuration(schedule.departureTime, schedule.arrivalTime)}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-main)" }}>{schedule.arrivalTime}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{schedule.destination}</div>
            </div>
          </div>

          {/* Info tambahan */}
          {agency?.description && (
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 16 }}>{agency.description}</p>
          )}

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)", fontFamily: "Outfit" }}>{formatPrice(schedule.price)}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Tersisa {availableSeats} kursi</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onClose} style={{ padding: "10px 18px", borderRadius: "var(--radius-full)", border: "1px solid var(--border-subtle)", background: "transparent", color: "var(--text-main)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Tutup
              </button>
              <button onClick={onSelect} className="hc-btn-book" style={{ padding: "10px 22px", fontSize: 14 }}>
                Pilih Tiket
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TicketCard({ schedule, agency, onSelect }: { schedule: BusSchedule; agency?: TravelAgency; onSelect: () => void }) {
  const availableSeats = schedule.totalSeats - schedule.bookedSeats.length;
  const facilities = getFacilities(schedule);
  const [showDetail, setShowDetail] = useState(false);

  // Hitung tanggal keberangkatan berikutnya
  const nextDate = getNextDepartureDate(schedule);

  // Cek apakah tanggal berikutnya punya override (tunda/batal)
  const nextOverride = schedule.isRecurring && nextDate
    ? getDateOverride(schedule, nextDate)
    : null;

  const activeStatus = schedule.isRecurring
    ? (nextOverride?.status ?? "aktif")
    : (schedule.scheduleStatus ?? "aktif");

  const activeNote = schedule.isRecurring ? nextOverride?.note : schedule.delayNote;
  const activeNewTime = schedule.isRecurring ? nextOverride?.newDepartureTime : schedule.newDepartureTime;

  const isCancelled = activeStatus === "dibatalkan";
  const isDelayed = activeStatus === "ditunda";

  return (
    <>
      <motion.div
        whileHover={!isCancelled ? { y: -2 } : undefined}
        transition={{ duration: 0.2 }}
        className="hc-ticket-card"
        onClick={() => setShowDetail(true)}
        style={{ cursor: "pointer", opacity: isCancelled ? 0.7 : 1, position: "relative", overflow: "hidden" }}
      >
        {/* Banner status */}
        {(isCancelled || isDelayed) && (
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            padding: "6px 16px",
            background: isCancelled ? "#FEE2E2" : "#FEF3C7",
            color: isCancelled ? "#991B1B" : "#92400E",
            fontSize: 12, fontWeight: 700,
            display: "flex", alignItems: "center", gap: 6,
            zIndex: 2,
          }}>
            {isCancelled ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                Jadwal Dibatalkan{activeNote ? ` — ${activeNote}` : ""}
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Jadwal Ditunda
                {activeNewTime && (
                  <span style={{ fontWeight: 800, marginLeft: 4 }}>
                    · {schedule.departureTime} → {activeNewTime}
                  </span>
                )}
                {activeNote ? ` · ${activeNote}` : ""}
              </>
            )}
          </div>
        )}

        <div className="hc-ticket-left" style={(isCancelled || isDelayed) ? { paddingTop: 36 } : undefined}>
          <div className="hc-bus-info">
            <div className="hc-bus-logo">
              <BusLogoIcon agency={agency} size={28} />
            </div>
            <div className="hc-bus-name">
              <h3>{schedule.agencyName}</h3>
              <p>{schedule.busClass}</p>
            </div>
          </div>

          <div className="hc-route-info">
            <div className="hc-time-box">
              <h4>{schedule.departureTime}</h4>
              <p>{schedule.origin}</p>
            </div>

            <div className="hc-route-line">
              <div className="hc-duration">{getDuration(schedule.departureTime, schedule.arrivalTime)}</div>
              <div className="hc-line" />
            </div>

            <div className="hc-time-box">
              <h4>{schedule.arrivalTime}</h4>
              <p>{schedule.destination}</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            {/* Tanggal keberangkatan berikutnya */}
            {nextDate && (
              <span style={{
                fontSize: 12, fontWeight: 600,
                color: isCancelled ? "#991B1B" : isDelayed ? "#92400E" : "var(--primary-dark)",
                background: isCancelled ? "#FEE2E2" : isDelayed ? "#FEF3C7" : "var(--primary-light)",
                borderRadius: "var(--radius-full)", padding: "3px 10px",
                border: `1px solid ${isCancelled ? "#FCA5A5" : isDelayed ? "#FCD34D" : "var(--secondary-light)"}`,
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {formatTanggal(nextDate)}
              </span>
            )}
            {/* Label berulang */}
            {schedule.isRecurring && (
              <span style={{
                fontSize: 11, fontWeight: 600, color: "var(--text-muted)",
                background: "var(--bg-subtle)", borderRadius: "var(--radius-full)",
                padding: "3px 10px", border: "1px solid var(--border-subtle)",
              }}>
                Setiap {schedule.recurringDays}
              </span>
            )}
          </div>

          <div className="hc-facilities">
            {facilities.map((facility) => (
              <span key={facility} className="hc-facility-tag">
                {facility}
              </span>
            ))}
          </div>
        </div>

        <div className="hc-ticket-right">
          <div>
            <div className="hc-price" style={{ color: isCancelled ? "var(--text-muted)" : undefined }}>{formatPrice(schedule.price)}</div>
            <div className="hc-seats">Tersisa {availableSeats} Kursi</div>
          </div>
          <button
            className="hc-btn-book"
            disabled={isCancelled}
            onClick={(e) => { e.stopPropagation(); if (!isCancelled) onSelect(); }}
            style={isCancelled ? { background: "var(--bg-subtle)", color: "var(--text-muted)", cursor: "not-allowed", border: "1px solid var(--border-subtle)", boxShadow: "none" } : undefined}
          >
            {isCancelled ? "Tidak Tersedia" : isDelayed ? "Pilih Tiket" : "Pilih Tiket"}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showDetail && (
          <AgencyDetailModal
            schedule={schedule}
            agency={agency}
            onClose={() => setShowDetail(false)}
            onSelect={() => { setShowDetail(false); onSelect(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function CustomerHome({ onSelectSchedule }: Props) {
  const { schedules, agencies, setSelectedBookingDate } = useAppStore();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [searched, setSearched] = useState(false);
  const [priceSort, setPriceSort] = useState<"asc" | "desc" | "">("");
  const [classFilter, setClassFilter] = useState<"" | "Ekonomi" | "Bisnis" | "Eksekutif">("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // State untuk date picker jadwal berulang
  const [datePickerSchedule, setDatePickerSchedule] = useState<BusSchedule | null>(null);

  const handleSelectSchedule = (s: BusSchedule) => {
    if (s.isRecurring) {
      // Jadwal berulang → tampilkan date picker dulu
      setDatePickerSchedule(s);
    } else {
      // Jadwal tetap → tanggal sudah fix dari schedule.date
      setSelectedBookingDate(s.date || null);
      onSelectSchedule(s);
    }
  };

  const handleDatePickerConfirm = (date: string) => {
    if (!datePickerSchedule) return;
    setSelectedBookingDate(date);
    setDatePickerSchedule(null);
    onSelectSchedule(datePickerSchedule);
  };

  const agencyMap = useMemo(() => {
    const map: Record<string, TravelAgency> = {};
    agencies.forEach((agency) => {
      map[agency.id] = agency;
    });
    return map;
  }, [agencies]);

  const filtered = useMemo(() => {
    // Selalu filter jadwal yang sudah lewat terlebih dahulu
    let result = schedules.filter(hasUpcomingDeparture);

    if (searched) {
      result = result.filter((item) => {
        const matchOrigin = !origin || item.origin === origin;
        const matchDest = !destination || item.destination === destination;

        let matchDate = false;
        if (!date) {
          matchDate = true;
        } else {
          if (item.isRecurring && item.recurringDays) {
            const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
            const searchDay = days[new Date(date).getDay()];
            matchDate = item.recurringDays.includes(searchDay);
          } else {
            matchDate = item.date === date;
          }
        }

        return matchOrigin && matchDest && matchDate;
      });
    }

    if (classFilter) {
      result = result.filter((item) => item.busClass === classFilter);
    }

    if (minPrice) {
      result = result.filter((item) => item.price >= parseInt(minPrice));
    }
    if (maxPrice) {
      result = result.filter((item) => item.price <= parseInt(maxPrice));
    }

    if (priceSort === "asc") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (priceSort === "desc") {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [searched, schedules, origin, destination, date, priceSort, classFilter, minPrice, maxPrice]);

  const doSearch = () => setSearched(true);

  const resetSearch = () => {
    setSearched(false);
    setOrigin("");
    setDestination("");
    setDate("");
    setClassFilter("");
    setMinPrice("");
    setMaxPrice("");
    setPriceSort("");
  };

  return (
    <div className="hc-page">
      <section className="hc-hero">
        <h1>Jelajahi Aceh dengan Nyaman</h1>
        <p>Pesan tiket bus antarkota sekarang. Dapatkan harga terbaik dan fasilitas premium untuk perjalanan kamu.</p>
      </section>

      <div className="hc-search-wrapper">
        <div className="hc-search-field">
          <label>Keberangkatan</label>
          <select value={origin} onChange={(e) => setOrigin(e.target.value)} className="hc-city-select">
            <option value="">Pilih kota asal...</option>
            {SUMATERA_CITIES.map((p) => (
              <optgroup key={p.province} label={p.province}>
                {p.cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="hc-search-field">
          <label>Tujuan</label>
          <select value={destination} onChange={(e) => setDestination(e.target.value)} className="hc-city-select">
            <option value="">Pilih kota tujuan...</option>
            {SUMATERA_CITIES.map((p) => (
              <optgroup key={p.province} label={p.province}>
                {p.cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="hc-search-field">
          <label>Tanggal</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <button className="hc-btn-search" onClick={doSearch}>
          Cari Tiket
        </button>
      </div>

      <div className="hc-filter-bar">
        <div className="hc-filter-label">Filter:</div>
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value as typeof classFilter)} className="hc-select-filter">
          <option value="">Semua Kelas</option>
          <option value="Ekonomi">Ekonomi</option>
          <option value="Bisnis">Bisnis</option>
          <option value="Eksekutif">Eksekutif</option>
        </select>
        <select value={priceSort} onChange={(e) => setPriceSort(e.target.value as "asc" | "desc" | "")} className="hc-select-filter">
          <option value="">Urutkan Harga</option>
          <option value="asc">Harga Terendah</option>
          <option value="desc">Harga Tertinggi</option>
        </select>
        <div className="hc-price-range">
          <input
            type="number"
            placeholder="Harga min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="hc-price-input"
          />
          <span className="hc-price-sep">–</span>
          <input
            type="number"
            placeholder="Harga max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="hc-price-input"
          />
        </div>
      </div>

      <main className="hc-main-container">
        <div className="hc-section-header">
          <h2 className="hc-section-title">Tiket Tersedia</h2>
          <button className="hc-reset-filter" onClick={resetSearch}>
            Reset Filter
          </button>
        </div>

        {searched && filtered.length === 0 ? (
          <div className="hc-empty-state">
            <h3>Wah, tiket tidak ditemukan</h3>
            <p>Coba ganti kota asal atau tujuan kamu untuk melihat jadwal lain.</p>
          </div>
        ) : (
          <div className="hc-ticket-list">
            {filtered.map((schedule) => (
              <TicketCard key={schedule.id} schedule={schedule} agency={agencyMap[schedule.agencyId]} onSelect={() => handleSelectSchedule(schedule)} />
            ))}
          </div>
        )}
      </main>

      {/* Modal pilih tanggal untuk jadwal berulang */}
      <AnimatePresence>
        {datePickerSchedule && (
          <BookingDatePicker
            schedule={datePickerSchedule}
            onConfirm={handleDatePickerConfirm}
            onClose={() => setDatePickerSchedule(null)}
          />
        )}
      </AnimatePresence>

      <style jsx global>{`
        .hc-page {
          background-color: #f8fafc;
          color: #0f172a;
          font-family: "Plus Jakarta Sans", Inter, sans-serif;
          min-height: calc(100vh - var(--header-h));
          padding-bottom: 48px;
        }

        .hc-hero {
          background: linear-gradient(180deg, #e0f2fe 0%, #f8fafc 100%);
          padding: 153px 48px 120px;
          text-align: center;
        }

        .hc-hero h1 {
          font-size: 46px;
          font-weight: 800;
          margin-bottom: 16px;
          color: #0c4a6e;
          letter-spacing: -0.02em;
          font-family: "Plus Jakarta Sans", Inter, sans-serif;
        }

        .hc-hero p {
          font-size: 18px;
          color: #64748b;
          max-width: 500px;
          margin: 0 auto;
        }

        .hc-filter-bar {
          max-width: 1000px;
          margin: 16px auto 0;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 12px;
          flex-wrap: wrap;
        }

        .hc-filter-label {
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-right: 4px;
        }

        .hc-select-filter {
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          font-family: inherit;
          font-size: 14px;
          background-color: white;
          cursor: pointer;
          color: #0f172a;
        }

        .hc-price-range {
          display: flex;
          align-items: center;
          gap: 6px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 4px 12px;
        }

        .hc-price-input {
          border: none;
          outline: none;
          font-family: inherit;
          font-size: 14px;
          color: #0f172a;
          width: 110px;
          background: transparent;
        }

        .hc-price-input::placeholder {
          color: #cbd5e1;
        }

        .hc-price-sep {
          color: #94a3b8;
          font-weight: 600;
        }

        .hc-search-wrapper {
          max-width: 1000px;
          margin: -70px auto 0;
          background: #ffffff;
          border-radius: 24px;
          padding: 12px;
          box-shadow: 0 20px 25px -5px rgba(14, 165, 233, 0.1);
          display: flex;
          align-items: center;
          border: 1px solid #e2e8f0;
          position: relative;
          z-index: 10;
        }

        .hc-search-field {
          flex: 1;
          padding: 16px 24px;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .hc-search-field:last-of-type {
          border-right: none;
        }

        .hc-search-field label {
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .hc-search-field input,
        .hc-city-select {
          border: none;
          outline: none;
          font-size: 15px;
          font-weight: 600;
          color: #0f172a;
          font-family: inherit;
          background: transparent;
          width: 100%;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
        }

        .hc-city-select option,
        .hc-city-select optgroup {
          font-weight: 500;
          color: #0f172a;
          background: #fff;
        }

        .hc-search-field input::placeholder {
          color: #cbd5e1;
          font-weight: 500;
        }

        .hc-btn-search {
          background: #0ea5e9;
          color: white;
          border: none;
          border-radius: 16px;
          padding: 0 40px;
          height: 64px;
          font-size: 16px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          margin-left: 12px;
          transition: background 0.2s;
        }

        .hc-btn-search:hover {
          background: #0284c7;
        }

        .hc-main-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 60px 24px 100px;
        }

        .hc-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .hc-section-title {
          font-size: 24px;
          font-weight: 800;
          font-family: "Plus Jakarta Sans", Inter, sans-serif;
        }

        .hc-reset-filter {
          background: none;
          border: none;
          color: #0ea5e9;
          font-weight: 700;
          cursor: pointer;
          font-size: 14px;
          font-family: inherit;
        }

        .hc-ticket-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .hc-ticket-card {
          background: #ffffff;
          border-radius: 24px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s;
        }

        .hc-ticket-card:hover {
          border-color: #e0f2fe;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
        }

        .hc-ticket-left {
          display: flex;
          flex-direction: column;
          gap: 20px;
          flex: 1;
        }

        .hc-bus-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .hc-bus-logo {
          width: 48px;
          height: 48px;
          background: #f1f5f9;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .hc-bus-name h3 {
          font-size: 16px;
          font-weight: 800;
          margin: 0;
        }

        .hc-bus-name p {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
          margin: 0;
        }

        .hc-route-info {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .hc-time-box h4 {
          font-size: 20px;
          font-weight: 800;
          margin: 0;
          font-family: "Plus Jakarta Sans", Inter, sans-serif;
        }

        .hc-time-box p {
          font-size: 13px;
          color: #64748b;
          font-weight: 600;
          margin: 2px 0 0;
        }

        .hc-route-line {
          flex: 1;
          max-width: 150px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          position: relative;
        }

        .hc-line {
          width: 100%;
          height: 2px;
          background: #e2e8f0;
          position: relative;
        }

        .hc-line::before,
        .hc-line::after {
          content: "";
          position: absolute;
          width: 8px;
          height: 8px;
          background: #e2e8f0;
          border-radius: 50%;
          top: -3px;
        }

        .hc-line::before {
          left: 0;
        }

        .hc-line::after {
          right: 0;
        }

        .hc-duration {
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
          text-align: center;
        }

        .hc-facilities {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .hc-facility-tag {
          background: #f1f5f9;
          color: #64748b;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
        }

        .hc-ticket-right {
          text-align: right;
          padding-left: 32px;
          border-left: 2px dashed #e2e8f0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 12px;
        }

        .hc-price {
          font-size: 26px;
          font-weight: 800;
          color: #0ea5e9;
          font-family: "Plus Jakarta Sans", Inter, sans-serif;
        }

        .hc-seats {
          font-size: 13px;
          font-weight: 700;
          color: #10b981;
        }

        .hc-btn-book {
          background: #e0f2fe;
          color: #0284c7;
          border: none;
          padding: 12px 32px;
          border-radius: 16px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }

        .hc-btn-book:hover {
          background: #0ea5e9;
          color: white;
        }

        .hc-empty-state {
          text-align: center;
          padding: 60px 20px;
          background: #ffffff;
          border-radius: 24px;
          border: 1px solid #e2e8f0;
        }

        .hc-empty-state h3 {
          font-size: 18px;
          margin-bottom: 8px;
          font-family: "Plus Jakarta Sans", Inter, sans-serif;
        }

        .hc-empty-state p {
          color: #64748b;
          font-size: 14px;
          margin: 0;
        }

        @media (max-width: 900px) {
          .hc-search-wrapper {
            flex-direction: column;
            padding: 16px;
            gap: 12px;
            border-radius: 20px;
            margin-top: -50px;
          }

          .hc-search-field {
            border-right: none;
            border-bottom: 1px solid #e2e8f0;
            width: 100%;
            padding: 12px 8px;
          }

          .hc-search-field:last-of-type {
            border-bottom: none;
          }

          .hc-btn-search {
            width: 100%;
            margin-left: 0;
          }

          .hc-ticket-card {
            flex-direction: column;
            gap: 24px;
            align-items: stretch;
          }

          .hc-ticket-right {
            text-align: left;
            padding-left: 0;
            border-left: none;
            border-top: 2px dashed #e2e8f0;
            padding-top: 24px;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }

        @media (max-width: 760px) {
          .hc-hero {
            padding: 137px 20px 96px;
          }

          .hc-hero h1 {
            font-size: 34px;
          }

          .hc-hero p {
            font-size: 15px;
          }

          .hc-main-container {
            padding-left: 16px;
            padding-right: 16px;
          }

          .hc-section-title {
            font-size: 20px;
          }

          .hc-route-info {
            gap: 12px;
          }

          .hc-route-line {
            max-width: 90px;
          }

          .hc-time-box h4 {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
}
