'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { apiCall } from '@/lib/utils';
import { getFirstAllowedPath } from '@/lib/navConfig';

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading: authLoading, config } = useAuth();

  // State: View Mode (login | register | verify)
  const [view, setView] = useState('login');

  // State: Login
  const [pin, setPin] = useState('');

  // State: Register
  const [regData, setRegData] = useState({ identifier: '', otp: '', username: '', fullname: '', jabatan: '' });
  const [jabatansList, setJabatansList] = useState([]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Shared States
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [cachedUsers, setCachedUsers] = useState([]);
  const hasMounted = useRef(false);

  useEffect(() => {
    hasMounted.current = true;
    if (!authLoading && user) {
      router.push(getFirstAllowedPath(user));
      return;
    }

    const fetchData = async () => {
      try {
        const [rolesData, jabRes] = await Promise.all([
          apiCall('getData', 'GET', { type: 'roles' }),
          apiCall('getData', 'GET', { type: 'master_jabatan' })
        ]);

        if (hasMounted.current) {
          setJabatansList(jabRes || []);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    fetchData();
    return () => { hasMounted.current = false; };
  }, [user, authLoading, router]);

  useEffect(() => {
    let timer;
    if (otpTimer > 0) {
      timer = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpTimer]);

  const checkPinAndLogin = async (currentPin) => {
    setIsVerifying(true);
    setLoading(true);
    setError('');

    try {
      const res = await apiCall('login', 'POST', { data: { pin: currentPin } });
      if (res.success && res.user) {
        login(res.user);
        router.push(getFirstAllowedPath(res.user));
        return true;
      } else {
        setError(res.error || 'PIN Akses tidak dikenali');
        setTimeout(() => { if (hasMounted.current) { setPin(''); setError(''); } }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Gagal memvalidasi identitas');
      setTimeout(() => { if (hasMounted.current) { setPin(''); setError(''); } }, 1500);
    } finally {
      setIsVerifying(false);
      setLoading(false);
    }
    return false;
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!regData.identifier || !regData.username || !regData.fullname || !regData.jabatan) {
      setError("Mohon lengkapi semua data pendaftaran");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiCall('sendOtp', 'POST', {
        data: { target: regData.identifier, username: regData.username, fullname: regData.fullname, jabatan: regData.jabatan }
      });
      if (res.success) {
        setOtpSent(true);
        setOtpTimer(60);
      }
    } catch (err) {
      setError(err.message || "Gagal mengirimkan kode OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regData.otp) return setError("Masukkan Kode OTP");
    setLoading(true);
    setError('');
    try {
      const res = await apiCall('verifyOtp', 'POST', { data: { target: regData.identifier, otp: regData.otp } });
      if (res.success) {
        login(res.user);
        router.push(getFirstAllowedPath(res.user));
      }
    } catch (err) {
      setError(err.message || "Kode OTP salah atau telah kadaluwarsa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <style jsx global>{`
        .auth-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #020617;
          font-family: 'Outfit', sans-serif;
          color: #f8fafc;
          padding: 20px;
          overflow: hidden;
          position: relative;
        }

        /* Animated Background Orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          z-index: 1;
          opacity: 0.35;
          animation: float 20s infinite alternate;
        }

        .orb-1 { width: 600px; height: 600px; background: rgba(37, 99, 235, 0.4); top: -200px; right: -100px; }
        .orb-2 { width: 400px; height: 400px; background: rgba(139, 92, 246, 0.3); bottom: -100px; left: -100px; animation-delay: -5s; }
        .orb-3 { width: 300px; height: 300px; background: rgba(16, 185, 129, 0.2); top: 50%; left: 10%; animation-delay: -10s; }

        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, 100px) scale(1.1); }
          100% { transform: translate(-50px, 50px) scale(0.9); }
        }

        .auth-card {
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(35px) saturate(180%);
          -webkit-backdrop-filter: blur(35px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 40px;
          width: 100%;
          max-width: 480px;
          padding: 4rem 3rem;
          box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.7);
          z-index: 10;
          animation: cardEntrance 1.2s cubic-bezier(0.2, 0.8, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .auth-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        }

        @keyframes cardEntrance {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .logo-area {
          text-align: center;
          margin-bottom: 3rem;
        }

        .logo-box {
          width: 88px;
          height: 88px;
          background: rgba(255, 255, 255, 0.03);
          margin: 0 auto 2rem;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 12px;
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.4);
          transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .logo-box:hover { transform: scale(1.05) rotate(5deg); }

        .logo-box img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 0 8px rgba(255,255,255,0.3));
        }

        h1 { 
          font-size: 2.25rem; 
          font-weight: 900; 
          margin-bottom: 0.75rem; 
          letter-spacing: -2px; 
          background: linear-gradient(to bottom, #fff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .subtitle { font-size: 1rem; color: #64748b; font-weight: 500; line-height: 1.6; text-wrap: balance; }

        .form-group { margin-bottom: 1.5rem; text-align: left; position: relative; }
        .form-label { display: block; font-size: 0.8rem; color: #475569; margin-bottom: 0.6rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding-left: 0.25rem; }

        .premium-input {
          width: 100%;
          background: rgba(2, 6, 23, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 16px 20px;
          color: white;
          font-size: 1rem;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
        }

        .premium-input:focus {
          border-color: var(--primary, #3b82f6);
          background: rgba(2, 6, 23, 0.8);
          box-shadow: 0 0 0 1px var(--primary, #3b82f6), 0 10px 30px -10px rgba(59, 130, 246, 0.4);
          transform: translateY(-2px);
        }

        .pin-container {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin: 2rem 0;
          cursor: pointer;
        }

        .pin-digit {
          width: 64px;
          height: 72px;
          background: rgba(2, 6, 23, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 900;
          color: white;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .pin-digit.active {
          border-color: var(--primary, #3b82f6);
          background: rgba(59, 130, 246, 0.05);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
          transform: translateY(-8px) scale(1.05);
        }

        .pin-digit.filled {
          background: var(--primary, #3b82f6);
          border-color: var(--primary, #3b82f6);
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
          animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1.1); }
        }

        button.primary-btn {
          width: 100%;
          background: linear-gradient(135deg, var(--primary, #3b82f6) 0%, var(--accent, #8b5cf6) 100%);
          color: white;
          border: none;
          border-radius: 22px;
          padding: 18px;
          font-size: 1.1rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          margin-top: 1.5rem;
          box-shadow: 0 15px 35px -10px rgba(59, 130, 246, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        button.primary-btn:hover:not(:disabled) {
          transform: translateY(-4px);
          filter: brightness(1.15);
          box-shadow: 0 25px 50px -15px rgba(59, 130, 246, 0.6);
        }

        button.primary-btn:active { transform: scale(0.96); }
        button.primary-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .auth-footer {
          margin-top: 2.5rem;
          text-align: center;
          font-size: 0.95rem;
          color: #475569;
          font-weight: 500;
        }

        .auth-toggle-link {
          color: var(--primary, #3b82f6);
          font-weight: 800;
          cursor: pointer;
          margin-left: 6px;
          transition: all 0.3s;
          display: inline-block;
        }
        
        .auth-toggle-link:hover {
          color: #fff;
          transform: translateX(4px);
        }

        .status-toast {
          padding: 12px 20px;
          border-radius: 16px;
          font-size: 0.9rem;
          margin-bottom: 2rem;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 600;
          animation: slideInDown 0.4s ease-out;
        }

        @keyframes slideInDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .error-toast { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171; }
        .success-toast { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); color: #34d399; }

        .hidden-pin-input { position: absolute; opacity: 0; pointer-events: none; }

        select.premium-input {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 20px center;
          background-size: 18px;
        }

        /* --- MOBILE RESPONSIVE --- */
        @media (max-width: 480px) {
          .orb-1 { width: 300px; height: 300px; }
          .orb-2 { width: 200px; height: 200px; }
          .orb-3 { width: 150px; height: 150px; }

          .auth-card {
            padding: 3rem 1.5rem;
            border-radius: 32px;
          }

          h1 {
            font-size: 1.75rem;
            letter-spacing: -1px;
          }

          .subtitle {
            font-size: 0.9rem;
          }

          .logo-area {
            margin-bottom: 2rem;
          }

          .logo-box {
            width: 72px;
            height: 72px;
            border-radius: 20px;
            margin-bottom: 1.5rem;
          }

          .pin-container {
            gap: 12px;
          }

          .pin-digit {
            width: 50px;
            height: 60px;
            border-radius: 16px;
            font-size: 1.5rem;
          }

          .premium-input {
            padding: 14px 16px;
            font-size: 0.95rem;
          }

          button.primary-btn {
            padding: 16px;
            font-size: 1rem;
          }
        }

        @media (max-width: 360px) {
          .auth-wrapper {
            padding: 10px;
          }

          .auth-card {
            padding: 2rem 1rem;
          }

          .logo-box {
            width: 64px;
            height: 64px;
            border-radius: 16px;
          }

          .pin-container {
            gap: 8px;
          }

          .pin-digit {
            width: 42px;
            height: 52px;
            border-radius: 12px;
          }

          h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>

      {/* Dynamic Background Elements */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      <div className="auth-card">
        <div className="logo-area">
          <div className="logo-box">
            <img
              src={config?.logo_url || "https://ui-avatars.com/api/?name=LOGO&background=2563eb&color=fff&size=512&bold=true"}
              alt="Logo Instansi"
              onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=PPDS&background=2563eb&color=fff"; }}
            />
          </div>
          <h1>{view === 'login' ? 'Selamat Datang' : 'Pendaftaran'}</h1>
          <p className="subtitle">
            {view === 'login' ? 'Sistem Manajemen Informasi SIM-PPDS' : 'Lengkapi data profil pengurus Anda'}
          </p>
        </div>

        {error && <div className="status-toast error-toast"><i className="fas fa-exclamation-circle"></i> {error}</div>}
        {isVerifying && <div className="status-toast success-toast"><i className="fas fa-circle-notch fa-spin"></i> Memvalidasi Identitas...</div>}

        {/* VIEW: LOGIN */}
        {view === 'login' && (
          <div className="animate-in">
            <div className="form-group" style={{ textAlign: 'center' }}>
              <span className="form-label">PIN AKSES KERJA</span>
              <div className="pin-container" onClick={() => document.getElementById('pinInput').focus()}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`pin-digit ${pin.length === i ? 'active' : ''} ${pin.length > i ? 'filled' : ''}`}>
                    {pin[i] ? '•' : ''}
                  </div>
                ))}
              </div>
              <input
                id="pinInput"
                type="tel"
                className="hidden-pin-input"
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPin(val);
                  if (val.length === 4) checkPinAndLogin(val);
                }}
                autoFocus
                disabled={loading}
                autoComplete="off"
              />
              <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '1rem' }}>Masukkan 4 digit PIN unik yang Anda miliki</p>
            </div>

            <div className="auth-footer">
              Personil baru?
              <span className="auth-toggle-link" onClick={() => { setView('register'); setError(''); }}>Registrasi Akun <i className="fas fa-arrow-right" style={{ fontSize: '0.7rem' }}></i></span>
            </div>
          </div>
        )}

        {/* VIEW: REGISTER */}
        {view === 'register' && !otpSent && (
          <form onSubmit={handleSendOtp} className="animate-in">
            <div className="form-group">
              <label className="form-label">Nama Lengkap</label>
              <input
                type="text"
                className="premium-input"
                placeholder="Nama sesuai identitas resmi"
                value={regData.fullname}
                onChange={e => setRegData({ ...regData, fullname: e.target.value })}
                required
              />
            </div>

            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="premium-input"
                  placeholder="ID Akses"
                  value={regData.username}
                  onChange={e => setRegData({ ...regData, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label">WhatsApp</label>
                <input
                  type="tel"
                  className="premium-input"
                  placeholder="08XXX"
                  value={regData.identifier}
                  onChange={e => setRegData({ ...regData, identifier: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Jabatan Struktural</label>
              <select
                className="premium-input"
                value={regData.jabatan}
                onChange={e => setRegData({ ...regData, jabatan: e.target.value })}
                required
              >
                <option value="" disabled>Pilih Posisi Anda</option>
                <optgroup label="[ DEWAN HARIAN ]">
                  {jabatansList.filter(j => j.kelompok === 'Dewan Harian').map((j, i) => (
                    <option key={i} value={j.nama_jabatan}>{j.nama_jabatan}</option>
                  ))}
                </optgroup>
                <optgroup label="[ DEWAN PLENO ]">
                  {jabatansList.filter(j => j.kelompok === 'Pleno').map((j, i) => (
                    <option key={i} value={j.nama_jabatan}>{j.nama_jabatan}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? (
                <><i className="fas fa-circle-notch fa-spin"></i> Memproses Pendaftaran...</>
              ) : (
                <><i className="fas fa-paper-plane"></i> Daftar & Kirim OTP</>
              )}
            </button>

            <div className="auth-footer">
              Telah terdaftar?
              <span className="auth-toggle-link" onClick={() => { setView('login'); setError(''); }}>Kembali Login <i className="fas fa-undo" style={{ fontSize: '0.7rem' }}></i></span>
            </div>
          </form>
        )}

        {/* VIEW: VERIFY OTP */}
        {otpSent && view === 'register' && (
          <form onSubmit={handleRegister} className="animate-in">
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <p className="subtitle" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Kami telah mengirimkan kode verifikasi 6 digit ke WhatsApp: <br />
                <strong style={{ color: 'white', fontSize: '1.1rem' }}>{regData.identifier}</strong>
              </p>

              <div className="form-group">
                <input
                  type="text"
                  className="premium-input"
                  style={{ textAlign: 'center', fontSize: '1.8rem', letterSpacing: '0.8rem', fontWeight: 900, background: 'rgba(2, 6, 23, 0.8)' }}
                  placeholder="000000"
                  maxLength={6}
                  value={regData.otp}
                  onChange={e => setRegData({ ...regData, otp: e.target.value })}
                  required
                  autoFocus
                  autoComplete="one-time-code"
                />
              </div>
            </div>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? <><i className="fas fa-circle-notch fa-spin"></i> Mengaktifkan...</> : <><i className="fas fa-check-double"></i> Verifikasi & Aktivasi</>}
            </button>

            <div className="auth-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
              Masalah dengan kode?
              <span
                className="auth-toggle-link"
                style={{ opacity: otpTimer > 0 ? 0.5 : 1, pointerEvents: otpTimer > 0 ? 'none' : 'auto' }}
                onClick={handleSendOtp}
              >
                {otpTimer > 0 ? `Kirim Ulang (${otpTimer}s)` : 'Kirim Ulang OTP'}
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
