'use client';

import { useState, useMemo } from 'react';
import type { BusSchedule, ScheduleDateOverride } from '@/types';
import { getScheduleDaysInMonth, isScheduleDay, localDateStr } from '@/lib/scheduleUtils';

interface Props {
  schedule: BusSchedule;
  selectedDate: string;
  onSelect: (date: string) => void;
  overrides: ScheduleDateOverride[];
}

const MONTH_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function ScheduleCalendarPicker({ schedule, selectedDate, onSelect, overrides }: Props) {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const todayStr = localDateStr(today);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  // Hari pertama bulan ini jatuh pada hari apa (0=Min)
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Set tanggal keberangkatan dalam bulan ini
  const scheduleDays = useMemo(
    () => new Set(getScheduleDaysInMonth(schedule, viewYear, viewMonth)),
    [schedule, viewYear, viewMonth]
  );

  // Override map: date -> override
  const overrideMap = useMemo(() => {
    const m: Record<string, ScheduleDateOverride> = {};
    overrides.forEach((o) => { m[o.date] = o; });
    return m;
  }, [overrides]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Disable navigasi ke bulan sebelum bulan ini
  const canGoPrev = viewYear > today.getFullYear() || viewMonth > today.getMonth();

  // Build grid cells: null = padding, number = tanggal
  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad akhir ke kelipatan 7
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ userSelect: 'none' }}>
      {/* Nav bulan */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          style={{
            width: 32, height: 32, borderRadius: 'var(--radius)', border: '1px solid var(--border-subtle)',
            background: canGoPrev ? 'var(--bg-white)' : 'var(--bg-subtle)',
            cursor: canGoPrev ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: canGoPrev ? 'var(--text-main)' : 'var(--text-light)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', fontFamily: 'Outfit' }}>
          {MONTH_ID[viewMonth]} {viewYear}
        </span>

        <button
          onClick={nextMonth}
          style={{
            width: 32, height: 32, borderRadius: 'var(--radius)', border: '1px solid var(--border-subtle)',
            background: 'var(--bg-white)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Header hari */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
        {DAY_LABELS.map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', padding: '4px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid tanggal */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((day, idx) => {
          if (day === null) return <div key={`pad-${idx}`} />;

          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const cellDate = new Date(dateStr + 'T00:00:00');

          const isPast = cellDate < today;
          const isToday = dateStr === todayStr;
          const isScheduleDate = scheduleDays.has(dateStr);
          const override = overrideMap[dateStr];
          const isSelected = dateStr === selectedDate;
          const isClickable = isScheduleDate && !isPast;

          // Warna
          let bg = 'transparent';
          let color = isPast ? 'var(--text-light)' : 'var(--text-main)';
          let border = 'transparent';
          let fontWeight = 400;

          if (isSelected) {
            bg = '#F59E0B'; color = '#fff'; border = '#F59E0B'; fontWeight = 700;
          } else if (override?.status === 'dibatalkan') {
            bg = '#FEE2E2'; color = '#991B1B'; border = '#FCA5A5'; fontWeight = 600;
          } else if (override?.status === 'ditunda') {
            bg = '#FEF3C7'; color = '#92400E'; border = '#FCD34D'; fontWeight = 600;
          } else if (isScheduleDate && !isPast) {
            bg = 'var(--primary-light)'; color = 'var(--primary-dark)'; border = 'var(--secondary-light)'; fontWeight = 700;
          } else if (isToday) {
            border = 'var(--primary)'; fontWeight = 700;
          }

          return (
            <button
              key={dateStr}
              onClick={() => isClickable && onSelect(dateStr)}
              disabled={!isClickable}
              title={
                override
                  ? `${override.status === 'dibatalkan' ? 'Dibatalkan' : 'Ditunda'}: ${override.note}`
                  : isScheduleDate && !isPast ? 'Klik untuk pilih' : ''
              }
              style={{
                position: 'relative',
                width: '100%', aspectRatio: '1',
                borderRadius: 'var(--radius)',
                border: `2px solid ${border}`,
                background: bg,
                color,
                fontWeight,
                fontSize: 13,
                cursor: isClickable ? 'pointer' : 'default',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
                padding: 0,
                opacity: isPast && isScheduleDate ? 0.45 : 1,
              }}
            >
              {day}
              {/* Dot indikator */}
              {isScheduleDate && !isSelected && (
                <span style={{
                  position: 'absolute', bottom: 3,
                  width: 4, height: 4, borderRadius: '50%',
                  background: override?.status === 'dibatalkan' ? '#DC2626'
                    : override?.status === 'ditunda' ? '#D97706'
                    : isPast ? 'var(--text-light)'
                    : 'var(--primary)',
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Legenda */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
        {[
          { color: 'var(--primary-light)', border: 'var(--secondary-light)', label: 'Jadwal berangkat' },
          { color: '#FEF3C7', border: '#FCD34D', label: 'Ditunda' },
          { color: '#FEE2E2', border: '#FCA5A5', label: 'Dibatalkan' },
        ].map((l) => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: l.color, border: `1.5px solid ${l.border}`, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
