'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/AppContext';
import { fadeSlideUp, staggerContainer, staggerItem } from '@/animations/variants';
import type { Ticket } from '@/types';

function formatPrice(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

const selectStyle: React.CSSProperties = {
  height: 38,
  padding: '0 32px 0 12px',
  fontSize: 13,
  fontFamily: 'inherit',
  color: 'var(--text-main)',
  background: 'var(--bg-white)',
  border: '1.5px solid var(--border-subtle)',
  borderRadius: 'var(--radius)',
  outline: 'none',
  cursor: 'pointer',
  appearance: 'auto',
  minWidth: 160,
};

function formatDate(d: string) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <motion.div variants={staggerItem} style={{
      background: 'var(--bg-white)', borderRadius: 'var(--radius-xl)',
      padding: '24px 28px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)',
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || 'var(--text-main)', fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </motion.div>
  );
}

function methodBadge(method: string) {
  const map: Record<string, { bg: string; color: string }> = {
    'QRIS': { bg: '#EDE9FE', color: '#6D28D9' },
    'Virtual Account': { bg: '#DBEAFE', color: '#1D4ED8' },
    'E-Wallet': { bg: '#D1FAE5', color: '#065F46' },
  };
  const s = map[method] || { bg: 'var(--bg-subtle)', color: 'var(--text-muted)' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', background: s.bg, color: s.color, fontSize: 12, fontWeight: 600 }}>
      {method}
    </span>
  );
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; color: string }> = {
    'Lunas': { bg: '#D1FAE5', color: '#065F46' },
    'Menunggu Pembayaran': { bg: '#FEF3C7', color: '#92400E' },
    'Dibatalkan': { bg: '#FEE2E2', color: '#991B1B' },
    'Kedaluwarsa': { bg: '#F3F4F6', color: '#6B7280' },
  };
  const s = map[status] || { bg: 'var(--bg-subtle)', color: 'var(--text-muted)' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', background: s.bg, color: s.color, fontSize: 12, fontWeight: 600 }}>
      {status}
    </span>
  );
}

export default function KeuanganPage() {
  const { tickets, agencies, myAgency, user } = useAppStore();
  const isProvider = user?.role === 'provider';

  const [filterAgency, setFilterAgency] = useState<string>('semua');
  const [filterMethod, setFilterMethod] = useState<string>('semua');
  const [filterStatus, setFilterStatus] = useState<string>('semua');
  const [search, setSearch] = useState('');

  // Provider hanya melihat tiket milik armada mereka
  const baseTickets: Ticket[] = useMemo(() => {
    if (isProvider && myAgency) {
      return tickets.filter((t) => t.agencyName === myAgency.name);
    }
    return tickets;
  }, [tickets, isProvider, myAgency]);

  // Daftar nama agency untuk filter (admin only)
  const agencyNames = useMemo(() => {
    return Array.from(new Set(tickets.map((t) => t.agencyName))).sort();
  }, [tickets]);

  // Filter
  const filtered = useMemo(() => {
    return baseTickets.filter((t) => {
      if (!isProvider && filterAgency !== 'semua' && t.agencyName !== filterAgency) return false;
      if (filterMethod !== 'semua' && t.paymentMethod !== filterMethod) return false;
      if (filterStatus !== 'semua' && t.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.passengerName.toLowerCase().includes(q) ||
          t.agencyName.toLowerCase().includes(q) ||
          t.origin.toLowerCase().includes(q) ||
          t.destination.toLowerCase().includes(q) ||
          t.seatNumber.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [baseTickets, filterAgency, filterMethod, filterStatus, search, isProvider]);

  // Stats dari tiket yang sudah difilter
  const stats = useMemo(() => {
    const lunas = filtered.filter((t) => t.status === 'Lunas');
    const totalPendapatan = lunas.reduce((s, t) => s + t.price, 0);
    const totalTransaksi = filtered.length;
    const totalLunas = lunas.length;
    const avgPerTransaksi = totalLunas > 0 ? Math.round(totalPendapatan / totalLunas) : 0;

    // Per metode
    const perMethod: Record<string, number> = {};
    lunas.forEach((t) => { perMethod[t.paymentMethod] = (perMethod[t.paymentMethod] || 0) + t.price; });

    // Per agency (admin only)
    const perAgency: Record<string, { jumlah: number; pendapatan: number }> = {};
    if (!isProvider) {
      lunas.forEach((t) => {
        if (!perAgency[t.agencyName]) perAgency[t.agencyName] = { jumlah: 0, pendapatan: 0 };
        perAgency[t.agencyName].jumlah++;
        perAgency[t.agencyName].pendapatan += t.price;
      });
    }

    return { totalPendapatan, totalTransaksi, totalLunas, avgPerTransaksi, perMethod, perAgency };
  }, [filtered, isProvider]);

  const title = isProvider ? `Keuangan — ${myAgency?.name || 'Armada Saya'}` : 'Pencatatan Keuangan';

  return (
    <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" exit="exit">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', fontFamily: 'Outfit', margin: 0 }}>{title}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, marginTop: 6 }}>
          {isProvider ? 'Riwayat transaksi dan pendapatan armada Anda' : 'Rekap seluruh transaksi dari semua armada bus'}
        </p>
      </div>

      {/* Stat Cards */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}
      >
        <StatCard label="Total Pendapatan" value={formatPrice(stats.totalPendapatan)} color="var(--primary)" />
        <StatCard label="Transaksi Lunas" value={stats.totalLunas.toString()} sub={`dari ${stats.totalTransaksi} total`} />
        <StatCard label="Rata-rata / Tiket" value={formatPrice(stats.avgPerTransaksi)} />
        <StatCard label="Total Tiket Terjual" value={stats.totalTransaksi.toString()} />
      </motion.div>

      {/* Ringkasan per metode & per agency */}
      <div style={{ display: 'grid', gridTemplateColumns: isProvider ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 32 }}>
        {/* Per metode pembayaran */}
        <div style={{ background: 'var(--bg-white)', borderRadius: 'var(--radius-xl)', padding: '24px 28px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 20, fontFamily: 'Outfit' }}>Per Metode Pembayaran</h3>
          {Object.keys(stats.perMethod).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Belum ada data</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(['QRIS', 'Virtual Account', 'E-Wallet'] as const).map((m) => {
                if (!stats.perMethod[m]) return null;
                const pct = stats.totalPendapatan > 0 ? Math.round((stats.perMethod[m] / stats.totalPendapatan) * 100) : 0;
                return (
                  <div key={m}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>{m}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>{formatPrice(stats.perMethod[m])}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 'var(--radius-full)', background: 'var(--bg-subtle)' }}>
                      <div style={{ height: '100%', borderRadius: 'var(--radius-full)', background: 'var(--grad-primary)', width: `${pct}%`, transition: 'width 0.5s ease' }} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{pct}% dari total</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Per agency (admin only) */}
        {!isProvider && (
          <div style={{ background: 'var(--bg-white)', borderRadius: 'var(--radius-xl)', padding: '24px 28px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 20, fontFamily: 'Outfit' }}>Per Armada Bus</h3>
            {Object.keys(stats.perAgency).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Belum ada data</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 260, overflowY: 'auto' }}>
                {Object.entries(stats.perAgency)
                  .sort((a, b) => b[1].pendapatan - a[1].pendapatan)
                  .map(([name, d]) => {
                    const pct = stats.totalPendapatan > 0 ? Math.round((d.pendapatan / stats.totalPendapatan) * 100) : 0;
                    return (
                      <div key={name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>{name}</span>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{formatPrice(d.pendapatan)}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.jumlah} tiket</div>
                          </div>
                        </div>
                        <div style={{ height: 6, borderRadius: 'var(--radius-full)', background: 'var(--bg-subtle)' }}>
                          <div style={{ height: '100%', borderRadius: 'var(--radius-full)', background: 'var(--grad-primary)', width: `${pct}%`, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter & Tabel */}
      <div style={{ background: 'var(--bg-white)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Baris 1: Search + jumlah */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="form-input"
                placeholder="Cari nama, rute, kursi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 36, height: 40, fontSize: 13, width: '100%' }}
              />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: 600 }}>
              {filtered.length} transaksi
            </div>
          </div>

          {/* Baris 2: Filter-filter */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Filter agency (admin only) */}
            {!isProvider && (
              <select
                value={filterAgency}
                onChange={(e) => setFilterAgency(e.target.value)}
                style={selectStyle}
              >
                <option value="semua">Semua Armada</option>
                {agencyNames.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            )}

            {/* Filter metode */}
            <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)} style={selectStyle}>
              <option value="semua">Semua Metode</option>
              <option value="QRIS">QRIS</option>
              <option value="Virtual Account">Virtual Account</option>
              <option value="E-Wallet">E-Wallet</option>
            </select>

            {/* Filter status */}
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectStyle}>
              <option value="semua">Semua Status</option>
              <option value="Lunas">Lunas</option>
              <option value="Menunggu Pembayaran">Menunggu Pembayaran</option>
              <option value="Dibatalkan">Dibatalkan</option>
              <option value="Kedaluwarsa">Kedaluwarsa</option>
            </select>

            {/* Reset filter */}
            {(filterAgency !== 'semua' || filterMethod !== 'semua' || filterStatus !== 'semua' || search) && (
              <button
                onClick={() => { setFilterAgency('semua'); setFilterMethod('semua'); setFilterStatus('semua'); setSearch(''); }}
                style={{ height: 38, padding: '0 14px', borderRadius: 'var(--radius)', border: '1.5px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Tabel */}
        {filtered.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-subtle)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', display: 'block' }}>
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
            <p style={{ fontSize: 15, marginBottom: 4 }}>Belum ada transaksi</p>
            <p style={{ fontSize: 13 }}>Data akan muncul setelah ada pemesanan tiket</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)' }}>
                  {[
                    'Tanggal',
                    'Penumpang',
                    ...(!isProvider ? ['Armada'] : []),
                    'Rute',
                    'Kursi',
                    'Metode',
                    'Status',
                    'Nominal',
                  ].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <motion.tbody variants={staggerContainer} initial="hidden" animate="visible">
                {filtered.map((t) => (
                  <motion.tr key={t.id} variants={staggerItem}
                    style={{ borderTop: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-main)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(t.bookingDate)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>{t.passengerName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.passengerPhone}</div>
                    </td>
                    {!isProvider && (
                      <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 500, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>{t.agencyName}</td>
                    )}
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                      {t.origin} → {t.destination}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', background: 'var(--primary-light)', color: 'var(--primary-dark)', fontSize: 12, fontWeight: 700 }}>
                        {t.seatNumber}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>{methodBadge(t.paymentMethod)}</td>
                    <td style={{ padding: '14px 16px' }}>{statusBadge(t.status)}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: 14, color: t.status === 'Lunas' ? 'var(--primary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatPrice(t.price)}
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        )}

        {/* Footer total */}
        {filtered.length > 0 && (
          <div style={{ padding: '16px 24px', borderTop: '2px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 32, background: 'var(--bg-subtle)' }}>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {stats.totalLunas} transaksi lunas dari {filtered.length} ditampilkan
            </span>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)', fontFamily: 'Outfit' }}>
              Total: {formatPrice(stats.totalPendapatan)}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
