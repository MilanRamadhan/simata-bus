'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeSlideUp, staggerContainer, staggerItem, scaleIn } from '@/animations/variants';
import type { BusSchedule, PassengerData, PaymentMethod } from '@/types';

interface Props {
  schedule: BusSchedule;
  seatIds: string[];
  onConfirm: (passenger: PassengerData, payment: PaymentMethod) => void;
  onBack: () => void;
}

function formatPrice(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

const PAYMENT_METHODS: { method: PaymentMethod; icon: string; desc: string }[] = [
  { method: 'QRIS', icon: '📱', desc: 'Scan QR untuk bayar instan' },
  { method: 'Virtual Account', icon: '🏦', desc: 'Transfer via bank virtual account' },
  { method: 'E-Wallet', icon: '💳', desc: 'GoPay, OVO, DANA, ShopeePay' },
];

export default function PassengerPayment({ schedule, seatIds, onConfirm, onBack }: Props) {
  const totalPrice = schedule.price * seatIds.length;
  const [passenger, setPassenger] = useState<PassengerData>({
    fullName: '',
    nik: '',
    phone: '',
    email: '',
  });
  const [payment, setPayment] = useState<PaymentMethod | ''>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<1 | 2>(1);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!passenger.fullName.trim()) e.fullName = 'Nama lengkap wajib diisi';
    if (!passenger.nik.trim() || passenger.nik.length < 16) e.nik = 'NIK harus 16 digit';
    if (!passenger.phone.trim()) e.phone = 'Nomor telepon wajib diisi';
    if (!passenger.email.trim() || !passenger.email.includes('@')) e.email = 'Email tidak valid';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) setStep(2);
  };

  const handleConfirm = () => {
    if (!payment) return;
    onConfirm(passenger, payment);
  };

  return (
    <motion.div
      variants={fadeSlideUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 40px 80px' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40 }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn btn-secondary btn-icon"
          onClick={onBack}
          style={{ flexShrink: 0, width: 48, height: 48, borderRadius: 'var(--radius)', background: 'var(--bg-white)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}
        >
          <span style={{ fontSize: 24, lineHeight: 1, fontWeight: 700, color: 'var(--text-main)' }}>←</span>
        </motion.button>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', fontFamily: 'Outfit' }}>
            {step === 1 ? 'Data Penumpang' : 'Pembayaran'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, marginTop: 4 }}>
            Langkah {step} dari 2
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
        {[1, 2].map((s) => (
          <div key={s} style={{ flex: 1, height: 6, borderRadius: 'var(--radius-full)', background: s <= step ? 'var(--grad-primary)' : 'var(--bg-subtle)', transition: 'background 0.3s' }} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 36, alignItems: 'start' }}>
        {/* ── Form Area ── */}
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              variants={fadeSlideUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                background: 'var(--bg-white)',
                borderRadius: 'var(--radius-xl)',
                padding: 36,
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 28, color: 'var(--text-main)', fontFamily: 'Outfit' }}>
                Informasi Penumpang
              </h3>
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { key: 'fullName', label: 'Nama Lengkap', placeholder: 'Sesuai KTP', type: 'text' },
                  { key: 'nik', label: 'NIK', placeholder: '16 digit NIK', type: 'text' },
                  { key: 'phone', label: 'Nomor Telepon', placeholder: '08xxxxxxxxxx', type: 'tel' },
                  { key: 'email', label: 'Email', placeholder: 'email@example.com', type: 'email' },
                ].map((field) => (
                  <motion.div key={field.key} variants={staggerItem} className="form-group">
                    <label className="form-label">{field.label}</label>
                    <input
                      className="form-input"
                      type={field.type}
                      placeholder={field.placeholder}
                      value={passenger[field.key as keyof PassengerData]}
                      onChange={(e) => {
                        setPassenger((p) => ({ ...p, [field.key]: e.target.value }));
                        if (errors[field.key]) setErrors((prev) => { const n = { ...prev }; delete n[field.key]; return n; });
                      }}
                      style={{
                        borderColor: errors[field.key] ? 'var(--danger)' : undefined,
                        boxShadow: errors[field.key] ? '0 0 0 3px rgba(239,68,68,0.15)' : undefined,
                      }}
                    />
                    <AnimatePresence>
                      {errors[field.key] && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="form-error"
                        >
                          {errors[field.key]}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: 12, padding: '16px 24px', fontSize: 16 }}
                onClick={handleNext}
              >
                Lanjut Pilih Pembayaran
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              variants={fadeSlideUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                background: 'var(--bg-white)',
                borderRadius: 'var(--radius-xl)',
                padding: 36,
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 28, color: 'var(--text-main)', fontFamily: 'Outfit' }}>
                Metode Pembayaran
              </h3>
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {PAYMENT_METHODS.map((pm) => (
                    <motion.div
                      key={pm.method}
                      variants={staggerItem}
                      whileHover={{ y: -2, boxShadow: 'var(--shadow-sm)' }}
                      onClick={() => setPayment(pm.method)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '20px 24px',
                        borderRadius: 'var(--radius-lg)',
                        border: `2px solid ${payment === pm.method ? 'var(--primary)' : 'var(--border-subtle)'}`,
                        background: payment === pm.method ? 'var(--primary-light)' : 'var(--bg-white)',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      <div style={{
                        width: 52, height: 52, borderRadius: 'var(--radius)',
                        background: payment === pm.method ? 'var(--bg-white)' : 'var(--bg-subtle)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                        transition: 'background 0.2s',
                        boxShadow: payment === pm.method ? 'var(--shadow-sm)' : 'none',
                      }}>
                        {pm.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main)', fontFamily: 'Outfit' }}>
                          {pm.method}
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                          {pm.desc}
                        </div>
                      </div>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%',
                        border: `2px solid ${payment === pm.method ? 'var(--primary)' : 'var(--border-subtle)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                        background: payment === pm.method ? 'var(--bg-white)' : 'transparent',
                      }}>
                      {payment === pm.method && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                          style={{
                            width: 12, height: 12, borderRadius: '50%',
                            background: 'var(--primary)',
                          }}
                        />
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn btn-secondary btn-lg"
                  style={{ padding: '16px 24px' }}
                  onClick={() => setStep(1)}
                >
                  Kembali
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn btn-primary btn-lg"
                  style={{ flex: 1, padding: '16px 24px', fontSize: 16 }}
                  onClick={handleConfirm}
                  disabled={!payment}
                >
                  Bayar Sekarang
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Order Summary Sidebar ── */}
        <div style={{ position: 'sticky', top: 'calc(var(--header-h) + 32px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{
            background: 'var(--bg-white)',
            borderRadius: 'var(--radius-xl)',
            padding: 32,
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 24, fontFamily: 'Outfit' }}>
              Ringkasan Pesanan
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Bus', value: schedule.agencyName },
                { label: 'Rute', value: `${schedule.origin} → ${schedule.destination}` },
                { label: 'Tanggal', value: schedule.date },
                { label: 'Waktu', value: `${schedule.departureTime} – ${schedule.arrivalTime}` },
                { label: 'Kelas', value: schedule.busClass },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{item.label}</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-main)', textAlign: 'right', maxWidth: '60%' }}>{item.value}</span>
                </div>
              ))}

              {/* Daftar kursi */}
              <div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>
                  Kursi ({seatIds.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {seatIds.map((s) => (
                    <span key={s} style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', background: 'var(--primary-light)', color: 'var(--primary-dark)', fontWeight: 700, fontSize: 13 }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <hr className="divider" style={{ margin: '24px 0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{formatPrice(schedule.price)} × {seatIds.length} kursi</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-muted)' }}>Total Pembayaran</span>
                <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em', fontFamily: 'Outfit' }}>
                  {formatPrice(totalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Passenger preview (on step 2) */}
          <AnimatePresence>
            {step === 2 && passenger.fullName && (
              <motion.div
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{
                  background: 'var(--bg-white)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 32,
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 20, fontFamily: 'Outfit' }}>
                  Data Penumpang
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Nama', value: passenger.fullName },
                    { label: 'NIK', value: passenger.nik },
                    { label: 'Telepon', value: passenger.phone },
                    { label: 'Email', value: passenger.email },
                  ].map((item) => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{item.label}</span>
                      <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-main)' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
