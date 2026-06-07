'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { scaleIn } from '@/animations/variants';
import type { BusSchedule } from '@/types';
import { getScheduleDaysInMonth, getDateOverride, formatTanggalPanjang, localDateStr } from '@/lib/scheduleUtils';

interface Props {
  schedule: BusSchedule;
  onConfirm: (date: string) => void;
  onClose: () => void;
}

const MONTH_ID = ['Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'];
const DAY_LABELS = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

function formatPrice(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

export default function BookingDatePicker({ schedule, onConfirm, onClose }: Props) {
  const today = useMemo(() => {
    const t = new Date(); t.setHours(0, 0, 0, 0); return t;
  }, []);
  const todayStr = localDateStr(today);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState('');

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const scheduleDays = useMemo(
    () => new Set(getScheduleDaysInMonth(schedule, viewYear, viewMonth)),
    [schedule, viewYear, viewMonth]
  );

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const canGoPrev = viewYear > today.getFullYear() || viewMonth > today.getMonth();

  const prevMonth = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectedOverride = selected ? getDateOverride(schedule, selected) : null;
  const isCancelled = selectedOverride?.status === 'dibatalkan';
  const isDelayed = selectedOverride?.status === 'ditunda';

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        variants={scaleIn} initial="hidden" animate="visible" exit="exit"
        className="modal-content"
        style={{ maxWidth: 440, padding: 32, width: '95vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)', fontFamily: 'Outfit', margin: 0 }}>
              Pilih Tanggal Keberangkatan
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              {schedule.agencyName} · {schedule.origin} → {schedule.destination}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Info jadwal */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--radius)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>JAM BERANGKAT</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)', fontFamily: 'Outfit' }}>{schedule.departureTime}</div>
          </div>
          <div style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--radius)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>TIBA</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)', fontFamily: 'Outfit' }}>{schedule.arrivalTime}</div>
          </div>
          <div style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--radius)', background: 'var(--primary-light)', border: '1px solid var(--secondary-light)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--primary-dark)', fontWeight: 600, marginBottom: 4 }}>HARGA</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary-dark)', fontFamily: 'Outfit' }}>{formatPrice(schedule.price)}</div>
          </div>
        </div>

        {/* Navigasi bulan */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button onClick={prevMonth} disabled={!canGoPrev}
            style={{ width: 34, height: 34, borderRadius: 'var(--radius)', border: '1px solid var(--border-subtle)', background: canGoPrev ? 'var(--bg-white)' : 'var(--bg-subtle)', cursor: canGoPrev ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: canGoPrev ? 'var(--text-main)' : 'var(--text-light)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', fontFamily: 'Outfit' }}>
            {MONTH_ID[viewMonth]} {viewYear}
          </span>
          <button onClick={nextMonth}
            style={{ width: 34, height: 34, borderRadius: 'var(--radius)', border: '1px solid var(--border-subtle)', background: 'var(--bg-white)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {/* Header hari */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 6 }}>
          {DAY_LABELS.map((d) => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', padding: '3px 0' }}>{d}</div>
          ))}
        </div>

        {/* Grid tanggal */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 16 }}>
          {cells.map((day, idx) => {
            if (day === null) return <div key={`p-${idx}`} />;

            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const cellDate = new Date(dateStr + 'T00:00:00');
            const isPast = cellDate < today;
            const isToday = dateStr === todayStr;
            const isScheduleDate = scheduleDays.has(dateStr);
            const override = getDateOverride(schedule, dateStr);
            const isCancelledDay = override?.status === 'dibatalkan';
            const isDelayedDay = override?.status === 'ditunda';
            const isSelected = dateStr === selected;
            const isClickable = isScheduleDate && !isPast && !isCancelledDay;

            let bg = 'transparent';
            let color = isPast ? 'var(--text-light)' : 'var(--text-main)';
            let border = 'transparent';
            let fw: number = 400;

            if (isSelected) {
              bg = 'var(--grad-primary)'; color = '#fff'; border = 'var(--primary)'; fw = 700;
            } else if (isCancelledDay) {
              bg = '#FEE2E2'; color = '#991B1B'; border = '#FCA5A5'; fw = 600;
            } else if (isDelayedDay) {
              bg = '#FEF3C7'; color = '#92400E'; border = '#FCD34D'; fw = 600;
            } else if (isScheduleDate && !isPast) {
              bg = 'var(--primary-light)'; color = 'var(--primary-dark)'; border = 'var(--secondary-light)'; fw = 700;
            } else if (isScheduleDate && isPast) {
              bg = 'var(--bg-subtle)'; fw = 500;
            } else if (isToday) {
              border = 'var(--primary)';
            }

            return (
              <button key={dateStr}
                onClick={() => isClickable && setSelected(dateStr)}
                disabled={!isClickable}
                title={
                  isCancelledDay ? 'Jadwal dibatalkan'
                  : isDelayedDay ? `Ditunda ke ${override!.newDepartureTime || '?'}`
                  : isScheduleDate && !isPast ? 'Pilih tanggal ini' : ''
                }
                style={{
                  position: 'relative', width: '100%', aspectRatio: '1',
                  borderRadius: 'var(--radius)', border: `2px solid ${border}`,
                  background: bg, color, fontWeight: fw, fontSize: 13,
                  cursor: isClickable ? 'pointer' : 'default',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', padding: 0,
                  opacity: isPast && isScheduleDate ? 0.4 : 1,
                }}
              >
                {day}
                {isScheduleDate && !isSelected && (
                  <span style={{
                    position: 'absolute', bottom: 3,
                    width: 4, height: 4, borderRadius: '50%',
                    background: isCancelledDay ? '#DC2626' : isDelayedDay ? '#D97706' : isPast ? 'var(--text-light)' : 'var(--primary)',
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Legenda */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { color: 'var(--primary-light)', border: 'var(--secondary-light)', label: 'Tersedia' },
            { color: '#FEF3C7', border: '#FCD34D', label: 'Ditunda' },
            { color: '#FEE2E2', border: '#FCA5A5', label: 'Dibatalkan' },
          ].map((l) => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color, border: `1.5px solid ${l.border}` }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Info tanggal terpilih */}
        <AnimatePresence mode="wait">
          {selected && (
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              style={{
                padding: '14px 16px', borderRadius: 'var(--radius)',
                background: isCancelled ? '#FEF2F2' : isDelayed ? '#FFF7ED' : 'var(--primary-light)',
                border: `1.5px solid ${isCancelled ? '#FCA5A5' : isDelayed ? '#FED7AA' : 'var(--secondary-light)'}`,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: isCancelled ? '#991B1B' : isDelayed ? '#92400E' : 'var(--primary-dark)', marginBottom: 4 }}>
                {formatTanggalPanjang(selected)}
              </div>
              {isCancelled && (
                <div style={{ fontSize: 12, color: '#DC2626' }}>
                  ⚠️ Jadwal ini dibatalkan — {selectedOverride?.note}
                </div>
              )}
              {isDelayed && (
                <div style={{ fontSize: 12, color: '#D97706' }}>
                  ⏰ Ditunda: {schedule.departureTime} → {selectedOverride?.newDepartureTime}
                  {selectedOverride?.note ? ` · ${selectedOverride.note}` : ''}
                </div>
              )}
              {!isCancelled && !isDelayed && (
                <div style={{ fontSize: 12, color: 'var(--primary-dark)' }}>
                  Berangkat {schedule.departureTime} · Tiba {schedule.arrivalTime} · {formatPrice(schedule.price)} / kursi
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tombol */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose}
            className="btn btn-secondary btn-lg" style={{ flex: 1 }}>
            Batal
          </button>
          <button
            onClick={() => selected && !isCancelled && onConfirm(selected)}
            disabled={!selected || isCancelled}
            className="btn btn-primary btn-lg"
            style={{ flex: 1, opacity: (!selected || isCancelled) ? 0.5 : 1, cursor: (!selected || isCancelled) ? 'not-allowed' : 'pointer' }}
          >
            {!selected ? 'Pilih Tanggal Dulu' : isCancelled ? 'Tidak Tersedia' : 'Lanjut Pesan'}
            {selected && !isCancelled && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
