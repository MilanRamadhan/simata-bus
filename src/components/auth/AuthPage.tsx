'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { slideInRight, staggerContainer, staggerItem } from '../../animations/variants';
import { useAppStore } from '../../store/AppContext';

interface Props {
  role: 'admin' | 'customer';
  onSuccess: () => void;
  onSwitchRole?: () => void;
}

export default function AuthPage({ role, onSuccess, onSwitchRole }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nik, setNik] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      setLoading(true);
      const ok = await login(email, password, role);
      setLoading(false);
      if (!ok) { setError('Email atau password salah.'); return; }
      onSuccess();
    } else {
      if (!name.trim()) { setError('Nama wajib diisi.'); return; }
      if (role === 'customer') {
        if (!nik.trim() || nik.trim().length < 16) { setError('NIK harus 16 digit.'); return; }
        if (!phone.trim()) { setError('Nomor telepon wajib diisi.'); return; }
      }
      setLoading(true);
      const ok = await register(name.trim(), email, password, role, nik.trim() || undefined, phone.trim() || undefined);
      setLoading(false);
      if (!ok) { setError('Email sudah terdaftar.'); return; }
      onSuccess();
    }
  };

  const switchMode = () => {
    setIsLogin(v => !v);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
    setNik('');
    setPhone('');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-main)' }}>
      {/* Left — Brand Panel */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{
          flex: '0 0 46%',
          background: 'var(--grad-primary)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 64,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', top: -200, left: -200, filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', bottom: -100, right: -100, filter: 'blur(30px)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'grid\' width=\'60\' height=\'60\' patternUnits=\'userSpaceOnUse\'%3E%3Cpath d=\'M 60 0 L 0 0 0 60\' fill=\'none\' stroke=\'rgba(255,255,255,0.06)\' stroke-width=\'1\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'url(%23grid)\'/%3E%3C/svg%3E")', pointerEvents: 'none' }} />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: 440 }}
        >
          <motion.div variants={staggerItem} style={{ marginBottom: 32 }}>
            <div style={{
              width: 88, height: 88, borderRadius: 24,
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(12px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40, margin: '0 auto',
              border: '1px solid rgba(255,255,255,0.3)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
              🚍
            </div>
          </motion.div>

          <motion.h1 variants={staggerItem} style={{ fontSize: 48, fontWeight: 900, fontFamily: 'Outfit', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            SIMATA
          </motion.h1>
          <motion.p variants={staggerItem} style={{ fontSize: 18, opacity: 0.9, marginTop: 16, lineHeight: 1.6 }}>
            Platform pemesanan tiket bus modern, cerdas, dan terintegrasi penuh.
          </motion.p>

          <motion.div variants={staggerItem} style={{ marginTop: 40, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Reservasi Cepat', 'E-Tiket', 'Aman & Nyaman'].map(t => (
              <div key={t} style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.25)',
                fontSize: 14, fontWeight: 600,
              }}>
                ✓ {t}
              </div>
            ))}
          </motion.div>

          {/* Info sinkronisasi tiket */}
          {!isLogin && role === 'customer' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: 32, padding: '16px 20px',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.25)',
                textAlign: 'left',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>💡 Sudah pernah pesan tanpa login?</div>
              <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.6 }}>
                Daftar dengan email yang sama dan tiket kamu akan otomatis tersinkron ke akun ini.
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Right — Form Panel */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 64px', position: 'relative',
        background: 'var(--bg-white)',
        overflowY: 'auto',
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={isLogin ? 'login' : 'register'}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}
          >
            <div style={{ marginBottom: 32 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 16px', borderRadius: 'var(--radius-full)',
                background: 'var(--primary-light)', color: '#fff',
                fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
                textTransform: 'uppercase', marginBottom: 20,
              }}>
                {role === 'admin' ? '🔒 Admin Portal' : '👤 Customer Portal'}
              </div>
              <h2 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Outfit', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                {isLogin ? 'Selamat Datang Kembali' : 'Bergabung Bersama Kami'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 15, marginTop: 10, lineHeight: 1.6 }}>
                {isLogin
                  ? 'Masuk ke akun Anda untuk melanjutkan pengalaman pemesanan.'
                  : role === 'customer'
                    ? 'Lengkapi data diri Anda. NIK & telepon digunakan untuk sinkronisasi tiket.'
                    : 'Lengkapi data diri Anda untuk membuat akun baru.'}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Nama — hanya saat daftar */}
              {!isLogin && (
                <div className="form-group">
                  <label className="form-label">Nama Lengkap</label>
                  <input className="form-input" placeholder="Sesuai KTP" value={name} onChange={e => setName(e.target.value)} />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Alamat Email</label>
                <input className="form-input" type="email" placeholder="contoh@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              {/* NIK & Telepon — hanya saat daftar customer */}
              {!isLogin && role === 'customer' && (
                <>
                  <div className="form-group">
                    <label className="form-label">NIK (16 digit)</label>
                    <input
                      className="form-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={16}
                      placeholder="Nomor Induk Kependudukan"
                      value={nik}
                      onChange={e => setNik(e.target.value.replace(/\D/g, ''))}
                    />
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      Digunakan untuk mengidentifikasi tiket yang dibeli sebelum login
                    </p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nomor Telepon</label>
                    <input
                      className="form-input"
                      type="tel"
                      placeholder="08xxxxxxxxxx"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Kata Sandi</label>
                <input className="form-input" type="password" placeholder="Min. 6 karakter" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    color: '#991B1B',
                    fontSize: 14,
                    marginBottom: 20,
                    padding: '12px 16px',
                    background: '#FEE2E2',
                    border: '1px solid #F87171',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 500,
                  }}
                >
                  {error}
                </motion.div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12, padding: '16px', fontSize: 16 }} disabled={loading}>
                {loading ? 'Memproses...' : isLogin ? 'Masuk ke Sistem' : 'Daftar Akun Baru'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 28, fontSize: 15, color: 'var(--text-muted)' }}>
              {isLogin ? 'Baru pertama kali di sini?' : 'Sudah menjadi anggota?'}{' '}
              <button onClick={switchMode} style={{ background: 'none', border: 'none', color: 'var(--primary-dark)', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>
                {isLogin ? 'Buat Akun' : 'Masuk Sekarang'}
              </button>
            </p>

            {onSwitchRole && (
              <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14 }}>
                <button onClick={onSwitchRole} style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', textDecoration: 'underline', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-light)'}>
                  {role === 'admin' ? 'Beralih ke Portal Pelanggan' : 'Beralih ke Portal Admin'}
                </button>
              </p>
            )}

            {/* Demo credentials */}
            <div style={{
              marginTop: 36, padding: 20,
              background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8,
            }}>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: 8, fontSize: 14 }}>Data Uji Coba (Demo):</div>
              {role === 'admin'
                ? <div style={{ fontFamily: 'monospace', fontSize: 13 }}>admin@simata.com / admin123</div>
                : <div style={{ fontFamily: 'monospace', fontSize: 13 }}>budi@email.com / user123</div>}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
