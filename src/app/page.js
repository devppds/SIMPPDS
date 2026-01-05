'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
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
        const [usersData, rolesData, jabRes] = await Promise.all([
          apiCall('getData', 'GET', { type: 'users' }),
          apiCall('getData', 'GET', { type: 'roles' }),
          apiCall('getData', 'GET', { type: 'master_jabatan' })
        ]);

        if (hasMounted.current) {
          const enrichedUsers = (usersData || []).map(u => {
            const userRoleConfig = (rolesData || []).find(r => r.role === u.role);
            let allowedMenus = [];
            try {
              if (userRoleConfig?.menus) allowedMenus = JSON.parse(userRoleConfig.menus);
            } catch (e) { }
            return { ...u, allowedMenus };
          });
          setCachedUsers(enrichedUsers);
          setJabatansList(jabRes || []);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    fetchData();
    return () => { hasMounted.current = false; };
  }, [user, authLoading, router]);

  // Google Login Logic
  const onGoogleLoginSuccess = async (response) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiCall('googleLogin', 'POST', { data: { idToken: response.credential } });
      if (res.success) {
        login(res.user);
        router.push(getFirstAllowedPath(res.user));
      } else {
        setError(res.message || "Gagal login via Google");
      }
    } catch (err) {
      setError("Kesalahan sistem login Google");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && view === 'login') {
      const clientId = config?.google_client_id || '765273331300-9h789fbe1kvd1vt5bc4ccn9ve2t1lpav.apps.googleusercontent.com';
      window.google.accounts.id.initialize({ client_id: clientId, callback: onGoogleLoginSuccess });
      window.google.accounts.id.renderButton(document.getElementById("googleBtn"), {
        theme: "filled_blue",
        size: "large",
        width: "100%",
        shape: "pill"
      });
    }
  }, [view, config]);

  const checkPinAndLogin = async (currentPin) => {
    const matchedUser = cachedUsers.find(u => u.password_plain === currentPin);
    if (matchedUser) {
      setIsVerifying(true);
      setLoading(true);
      setTimeout(() => {
        login({
          id: matchedUser.id,
          username: matchedUser.username,
          fullname: matchedUser.fullname,
          role: matchedUser.role,
          pengurus_id: matchedUser.pengurus_id,
          avatar: matchedUser.avatar || '',
          allowedMenus: matchedUser.allowedMenus || []
        });
        router.push(getFirstAllowedPath({ role: matchedUser.role, allowedMenus: matchedUser.allowedMenus }));
      }, 800);
      return true;
    }
    if (currentPin.length === 4) {
      setError('PIN Salah!');
      setTimeout(() => { if (hasMounted.current) { setPin(''); setError(''); } }, 1200);
    }
    return false;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!regData.identifier || !regData.username || !regData.fullname || !regData.jabatan) {
      setError("Semua kolom wajib diisi");
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
      setError(err.message || "Gagal mengirim OTP");
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
      setError(err.message || "OTP salah atau kadaluwarsa");
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
          background: radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%);
          font-family: 'Outfit', sans-serif;
          color: #f8fafc;
          padding: 20px;
          overflow: hidden;
          position: relative;
        }

        .auth-wrapper::before {
          content: '';
          position: absolute;
          width: 600px;
          height: 600px;
          background: rgba(37, 99, 235, 0.1);
          filter: blur(120px);
          border-radius: 50%;
          top: -100px;
          right: -100px;
          pointer-events: none;
        }

        .auth-wrapper::after {
          content: '';
          position: absolute;
          width: 500px;
          height: 500px;
          background: rgba(16, 185, 129, 0.05);
          filter: blur(100px);
          border-radius: 50%;
          bottom: -100px;
          left: -100px;
          pointer-events: none;
        }

        .auth-card {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 32px;
          width: 100%;
          max-width: 440px;
          padding: 3rem 2.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          z-index: 10;
          animation: cardFadeIn 0.8s ease-out;
        }

        @keyframes cardFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .logo-area {
          text-align: center;
          margin-bottom: 2rem;
        }

        .logo-box {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, var(--primary, #2563eb) 0%, var(--accent, #3b82f6) 100%);
          margin: 0 auto 1.5rem;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(37, 99, 235, 0.4);
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .logo-box img {
          width: 40px;
          height: 40px;
          filter: brightness(0) invert(1);
        }

        h1 { font-size: 1.75rem; font-weight: 800; margin-bottom: 0.5rem; letter-spacing: -0.025em; }
        .subtitle { font-size: 0.95rem; color: #94a3b8; font-weight: 400; }

        .form-group { margin-bottom: 1.25rem; text-align: left; }
        .form-label { display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 0.5rem; font-weight: 500; padding-left: 0.5rem; }

        .premium-input {
          width: 100%;
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 12px 16px;
          color: white;
          font-size: 1rem;
          transition: all 0.3s;
          outline: none;
        }

        .premium-input:focus {
          border-color: var(--primary, #2563eb);
          background: rgba(15, 23, 42, 0.6);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
        }

        .pin-container {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin: 1.5rem 0;
        }

        .pin-digit {
          width: 50px;
          height: 60px;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          transition: all 0.2s;
        }
        
        .pin-digit.active {
          border-color: var(--primary, #2563eb);
          box-shadow: 0 0 15px rgba(37, 99, 235, 0.2);
        }

        button.primary-btn {
          width: 100%;
          background: linear-gradient(135deg, var(--primary, #2563eb) 0%, var(--accent, #3b82f6) 100%);
          color: white;
          border: none;
          border-radius: 16px;
          padding: 14px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 1rem;
          box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.3);
        }

        button.primary-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.1);
          box-shadow: 0 15px 25px -5px rgba(37, 99, 235, 0.4);
        }

        button.primary-btn:active { transform: scale(0.98); }
        button.primary-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .divider {
          display: flex;
          align-items: center;
          margin: 2rem 0;
          color: #475569;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .divider span { padding: 0 15px; }

        .auth-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.9rem;
          color: #94a3b8;
        }

        .auth-toggle-link {
          color: var(--primary, #2563eb);
          font-weight: 700;
          cursor: pointer;
          margin-left: 5px;
          text-decoration: none;
        }

        .error-toast {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
          padding: 10px;
          border-radius: 12px;
          font-size: 0.85rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .success-toast {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #34d399;
          padding: 10px;
          border-radius: 12px;
          font-size: 0.85rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        /* Hide real input for PIN */
        .hidden-pin-input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }
      `}</style>

      <div className="auth-card">
        <div className="logo-area">
          <div className="logo-box">
            <img src="/logo.png" alt="PPDS" onError={(e) => e.target.src = "https://ui-avatars.com/api/?name=L&background=transparent&color=fff"} />
          </div>
          <h1>{view === 'login' ? 'Selamat Datang' : 'Pendaftaran Akun'}</h1>
          <p className="subtitle">
            {view === 'login' ? 'Masuk ke Sistem Informasi SIM-PPDS' : 'Lengkapi data pengurus untuk mendaftar'}
          </p>
        </div>

        {error && <div className="error-toast">{error}</div>}
        {isVerifying && <div className="success-toast">Memverifikasi identitas...</div>}

        {/* VIEW: LOGIN */}
        {view === 'login' && (
          <div className="animate-in">
            <div id="googleBtn" style={{ marginBottom: '1rem' }}></div>

            <div className="divider"><span>ATAU MASUK DENGAN PIN</span></div>

            <div className="form-group" style={{ textAlign: 'center' }}>
              <span className="form-label">Masukkan PIN Access (4 Digit)</span>
              <div className="pin-container" onClick={() => document.getElementById('pinInput').focus()}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`pin-digit ${pin.length === i ? 'active' : ''}`}>
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
              />
            </div>

            <div className="auth-footer">
              Belum punya akun?
              <span className="auth-toggle-link" onClick={() => { setView('register'); setError(''); }}>Daftar Sekarang</span>
            </div>
          </div>
        )}

        {/* VIEW: REGISTER */}
        {view === 'register' && !otpSent && (
          <form onSubmit={handleSendOtp} className="animate-in">
            <div className="form-group">
              <label className="form-label">Nama Lengkap Sesuai KTP</label>
              <input
                type="text"
                className="premium-input"
                placeholder="cth: Ahmad Fauzi"
                value={regData.fullname}
                onChange={e => setRegData({ ...regData, fullname: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Username Pilihan</label>
              <input
                type="text"
                className="premium-input"
                placeholder="cth: fauzi88"
                value={regData.username}
                onChange={e => setRegData({ ...regData, username: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Jabatan Struktural</label>
              <select
                className="premium-input"
                value={regData.jabatan}
                onChange={e => setRegData({ ...regData, jabatan: e.target.value })}
                required
              >
                <option value="" disabled>Pilih Jabatan Sesuai SK</option>
                <optgroup label="[ Dewan Harian ]">
                  {jabatansList.filter(j => j.kelompok === 'Dewan Harian').map((j, i) => (
                    <option key={i} value={j.nama_jabatan}>{j.nama_jabatan}</option>
                  ))}
                </optgroup>
                <optgroup label="[ Dewan Pleno ]">
                  {jabatansList.filter(j => j.kelompok === 'Pleno').map((j, i) => (
                    <option key={i} value={j.nama_jabatan}>{j.nama_jabatan}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">WhatsApp Utama (OTP)</label>
              <input
                type="tel"
                className="premium-input"
                placeholder="cth: 08123456789"
                value={regData.identifier}
                onChange={e => setRegData({ ...regData, identifier: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Mengirim Kode...' : 'Daftar & Kirim OTP'}
            </button>

            <div className="auth-footer">
              Sudah ada akun?
              <span className="auth-toggle-link" onClick={() => { setView('login'); setError(''); }}>Masuk Ke Akun</span>
            </div>
          </form>
        )}

        {/* VIEW: VERIFY OTP */}
        {otpSent && view === 'register' && (
          <form onSubmit={handleRegister} className="animate-in">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div className="subtitle" style={{ marginBottom: '1rem' }}>
                Kode OTP telah dikirim ke nomor WhatsApp Anda: <br />
                <strong style={{ color: 'white' }}>{regData.identifier}</strong>
              </div>

              <div className="form-group">
                <input
                  type="text"
                  className="premium-input"
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', fontWeight: 800 }}
                  placeholder="000000"
                  maxLength={6}
                  value={regData.otp}
                  onChange={e => setRegData({ ...regData, otp: e.target.value })}
                  required
                  autoFocus
                />
              </div>
            </div>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Verifikasi...' : 'Verifikasi & Aktivasi'}
            </button>

            <div className="auth-footer">
              Tidak menerima kode?
              <span className="auth-toggle-link" style={{ opacity: otpTimer > 0 ? 0.5 : 1 }} onClick={() => otpTimer === 0 && handleSendOtp()}>
                {otpTimer > 0 ? `Kirim Ulang (${otpTimer}s)` : 'Kirim Ulang'}
              </span>
            </div>
          </form>
        )}
      </div>

      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
    </div>
  );
}

export const dynamic = 'force-dynamic';
