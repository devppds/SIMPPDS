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

  // State: View Mode (login | register)
  const [view, setView] = useState('login');

  // State: Login
  const [pin, setPin] = useState('');

  // State: Register
  const [regData, setRegData] = useState({ identifier: '', otp: '', name: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Shared States
  const [loading, setLoading] = useState(false); // UI Loader
  const [isVerifying, setIsVerifying] = useState(false); // Logic Loader
  const [error, setError] = useState('');
  const [cachedUsers, setCachedUsers] = useState([]);
  const hasMounted = useRef(false);

  // 1. Initial Load: Check Auth & Pre-fetch Users for Instant Login
  useEffect(() => {
    hasMounted.current = true;

    // Redirect if already logged in
    if (!authLoading && user) {
      router.push(getFirstAllowedPath(user));
      return;
    }

    // Pre-fetch users and roles data silently
    const fetchUsers = async () => {
      try {
        const [usersData, rolesData] = await Promise.all([
          apiCall('getData', 'GET', { type: 'users' }),
          apiCall('getData', 'GET', { type: 'roles' })
        ]);

        if (hasMounted.current) {
          // Attach allowedMenus from Role DB
          const enrichedUsers = (usersData || []).map(u => {
            const userRoleConfig = (rolesData || []).find(r => r.role === u.role);
            let allowedMenus = [];
            try {
              if (userRoleConfig && userRoleConfig.menus) {
                allowedMenus = JSON.parse(userRoleConfig.menus);
              }
            } catch (e) {
              // Ignore parse error
            }
            return { ...u, allowedMenus };
          });
          setCachedUsers(enrichedUsers);
        }
      } catch (err) {
        console.error("Failed to pre-fetch data:", err);
      }
    };

    fetchUsers();

    return () => { hasMounted.current = false; };
  }, [user, authLoading, router]);

  // -- LOGIC: GOOGLE LOGIN --
  const onGoogleLoginSuccess = async (response) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiCall('googleLogin', 'POST', {
        data: { idToken: response.credential }
      });

      if (res.success) {
        login(res.user);
        router.push(getFirstAllowedPath(res.user));
      } else {
        setError(res.message || "Gagal login via Google");
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem saat login Google");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && view === 'login') {
      const clientId = (config && config.find(c => c.key === 'google_client_id')?.value) || '765273331300-9h789fbe1kvd1vt5bc4ccn9ve2t1lpav.apps.googleusercontent.com';

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: onGoogleLoginSuccess,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("googleBtn"),
        { theme: "outline", size: "large", width: 250 }
      );
    }
  }, [view, config]);

  // -- LOGIC: LOGIN (PIN) --
  const checkPinAndLogin = async (currentPin) => {
    // Cari user yang password_plain-nya cocok dengan PIN saat ini
    const matchedUser = cachedUsers.find(u => u.password_plain === currentPin);

    if (matchedUser) {
      // MATCH FOUND!
      setIsVerifying(true);
      setLoading(true);
      setError('');

      // Sedikit delay artifisial biar user sempat lihat (UX)
      setTimeout(() => {
        login({
          id: matchedUser.id,
          username: matchedUser.username,
          fullname: matchedUser.fullname,
          role: matchedUser.role,
          avatar: matchedUser.avatar || '',
          allowedMenus: matchedUser.allowedMenus || []
        });
        const targetPath = getFirstAllowedPath({ role: matchedUser.role, allowedMenus: matchedUser.allowedMenus });
        router.push(targetPath);
      }, 800);

      return true;
    }

    // Jika panjang sudah 4 (max) tapi tidak cocok
    if (currentPin.length === 4) {
      setError('PIN Salah!');
      // Auto clear setelah 0.5 detik
      setTimeout(() => {
        if (hasMounted.current) {
          setPin('');
          setError('');
        }
      }, 800);
      return false;
    }

    return false;
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Hanya angka
    if (!/^\d*$/.test(value)) return;

    // Update State
    if (value.length <= 4) {
      setPin(value);
      setError('');
      // Check langsung jika 4 digit
      if (cachedUsers.length > 0 && value.length === 4) {
        checkPinAndLogin(value);
      }
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (pin.length === 4) {
      checkPinAndLogin(pin);
    }
  };

  const handleGoogleLogin = () => {
    // This is now handled by the Google Rendered Button automatically
    // But we can trigger One Tap if we want
    if (window.google) {
      window.google.accounts.id.prompt();
    }
  };

  // -- LOGIC: REGISTER (OTP) --
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!regData.identifier) {
      setError("Masukkan Email atau No. WhatsApp");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiCall('sendOtp', 'POST', {
        data: { target: regData.identifier }
      });

      if (res.success) {
        setOtpSent(true);
        setLoading(false);
        setOtpTimer(60);
      }
    } catch (err) {
      setError(err.message || "Gagal mengirim kode. Periksa nomor/token.");
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regData.otp) {
      setError("Masukkan Kode OTP");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiCall('verifyOtp', 'POST', {
        data: {
          target: regData.identifier,
          otp: regData.otp
        }
      });

      if (res.success) {
        setLoading(false);
        setRegData({ identifier: '', otp: '', name: '' });
        setOtpSent(false);

        // Auto login
        login(res.user);
        router.push(getFirstAllowedPath(res.user));
      }
    } catch (err) {
      setError(err.message || "Kode OTP salah atau kedaluwarsa.");
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <style jsx global>{`
        
        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f6f5f7;
          font-family: 'Outfit', sans-serif;
        }

        .container {
          background-color: #fff;
          border-radius: 10px;
          box-shadow: 0 14px 28px rgba(0,0,0,0.25), 
                      0 10px 10px rgba(0,0,0,0.22);
          position: relative;
          overflow: hidden;
          width: 768px;
          max-width: 100%;
          min-height: 480px;
          display: flex;
        }

        .form-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0 50px;
          height: 100%;
          text-align: center;
          background: white;
          transition: all 0.6s ease-in-out;
        }

        .social-container {
          margin: 20px 0;
        }

        .social-container a {
          border: 1px solid #DDDDDD;
          border-radius: 50%;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          margin: 0 5px;
          height: 40px;
          width: 40px;
          color: #333;
          text-decoration: none;
          transition: 0.3s;
          cursor: pointer;
        }

        .social-container a:hover {
          background: #f1f1f1;
          border-color: #1075b9ff;
          color: #1075b9ff;
        }

        h1 {
          font-weight: bold;
          margin: 0;
          color: #333;
        }

        h2 {
          text-align: center;
        }

        p {
          font-size: 14px;
          font-weight: 100;
          line-height: 20px;
          letter-spacing: 0.5px;
          margin: 20px 0 30px;
        }

        span {
          font-size: 12px;
          color: #888;
          margin-bottom: 15px;
        }

        .inpt {
          background-color: #eee;
          border: none;
          padding: 12px 15px;
          margin: 8px 0;
          width: 100%;
          border-radius: 8px;
          font-size: 16px;
          text-align: center;
          letter-spacing: 4px;
          font-weight: bold;
          outline: none;
          color: #333;
        }
        
        .inpt:focus {
           background-color: #e0e0e0;
           box-shadow: 0 0 0 2px rgba(0, 132, 184, 0.21);
        }

        button.btn-login {
          border-radius: 20px;
          border: 1px solid #1075b9ff;
          background-color: #1075b9ff;
          color: #FFFFFF;
          font-size: 12px;
          font-weight: bold;
          padding: 12px 45px;
          letter-spacing: 1px;
          text-transform: uppercase;
          transition: transform 80ms ease-in;
          margin-top: 15px;
          cursor: pointer;
        }

        button.btn-login:active {
          transform: scale(0.95);
        }

        button.btn-login:focus {
          outline: none;
        }

        button.btn-google {
            background: white;
            color: #333;
            border: 1px solid #ddd;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 20px;
            border-radius: 50px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            margin-bottom: 1.5rem;
        }
        button.btn-google:hover {
            background: #f8fafc;
            border-color: #ccc;
        }

        button.ghost {
          background-color: transparent;
          border-color: #FFFFFF;
          border-radius: 20px;
          border: 1px solid #FFFFFF;
          color: #FFFFFF;
          font-size: 12px;
          font-weight: bold;
          padding: 12px 45px;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          margin-top: 20px;
        }

        .overlay-container {
          flex: 1;
          background: #1075b9ff;
          background: -webkit-linear-gradient(to right, #1075b9ff, #056696ff);
          background: linear-gradient(to right, #1075b9ff, #056696ff);
          background-repeat: no-repeat;
          background-size: cover;
          background-position: 0 0;
          color: #FFFFFF;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 0 40px;
          text-align: center;
        }

        .error-msg { 
          color: #ef4444; 
          font-size: 12px; 
          margin-top: 5px; 
          min-height: 20px;
        }
        
        .separator {
            display: flex;
            align-items: center;
            text-align: center;
            width: 100%;
            margin: 15px 0;
        }
        .separator::before, .separator::after {
            content: '';
            flex: 1;
            border-bottom: 1px solid #ddd;
        }
        .separator span {
            padding: 0 10px;
            color: #888;
            font-size: 12px;
            margin: 0;
        }
      `}</style>

      <div className="container" >

        {/* VIEW: LOGIN */}
        {view === 'login' && (
          <div className="form-container sign-in-container">
            <form onSubmit={handleManualSubmit} style={{ width: '100%' }}>
              <h1>Masuk</h1>
              <div style={{ margin: '20px 0', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <div id="googleBtn"></div>
              </div>

              <div className="separator"><span>atau</span></div>

              <input
                type="password"
                placeholder="PIN Access (4 Digit)"
                className="inpt"
                value={pin}
                onChange={handleInputChange}
                maxLength={4}
                disabled={loading || isVerifying}
                autoFocus
              />

              <div className="error-msg">
                {error && <span>{error}</span>}
                {isVerifying && <span style={{ color: '#1075b9ff' }}>Memverifikasi...</span>}
              </div>

              <a href="#" onClick={e => e.preventDefault()} style={{ fontSize: '12px', color: '#333', textDecoration: 'none', marginBottom: '15px', display: 'block' }}>Lupa PIN?</a>

              <button className="btn-login" type="submit" disabled={loading || isVerifying}>
                {loading ? 'LOADING...' : 'MASUK'}
              </button>
            </form>
          </div>
        )}

        {/* VIEW: REGISTER */}
        {view === 'register' && (
          <div className="form-container sign-in-container">
            <form onSubmit={otpSent ? handleRegister : handleSendOtp} style={{ width: '100%' }}>
              <h1>Daftar Akun</h1>
              <span style={{ margin: '15px 0 25px 0', display: 'block' }}>Gunakan Email atau WhatsApp Aktif</span>

              {!otpSent ? (
                <>
                  <input
                    type="text"
                    placeholder="Email / No. WhatsApp (08...)"
                    className="inpt"
                    style={{ fontSize: '0.9rem', letterSpacing: 'normal', textAlign: 'left' }}
                    value={regData.identifier}
                    onChange={e => setRegData({ ...regData, identifier: e.target.value })}
                    disabled={loading}
                    autoFocus
                  />
                  <button className="btn-login" type="submit" disabled={loading}>
                    {loading ? 'MENGIRIM...' : 'KIRIM KODE OTP'}
                  </button>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '15px', fontSize: '0.9rem', color: '#1075b9ff' }}>
                    Kode dikirim ke: <strong>{regData.identifier}</strong>
                  </div>
                  <input
                    type="text"
                    placeholder="X X X X X X"
                    className="inpt"
                    value={regData.otp}
                    onChange={e => setRegData({ ...regData, otp: e.target.value })}
                    maxLength={6}
                    disabled={loading}
                    autoFocus
                  />
                  <div className="error-msg">
                    {error && <span>{error}</span>}
                  </div>
                  <button className="btn-login" type="submit" disabled={loading}>
                    {loading ? 'MEMPROSES...' : 'VERIFIKASI & DAFTAR'}
                  </button>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#888', marginTop: '10px', fontSize: '0.8rem', cursor: 'pointer' }}
                    onClick={() => { setOtpSent(false); setOtpTimer(0); }}
                  >
                    Ubah Nomor/Email?
                  </button>
                </>
              )}

              <div className="error-msg" style={{ marginTop: '10px' }}>
                {error && <span>{error}</span>}
              </div>
            </form>
          </div>
        )}

        {/* Overlay Container */}
        <div className="overlay-container">
          <h1>{view === 'login' ? 'Halo, Khodimin!' : 'Mari Bergabung!'}</h1>
          <p>
            {view === 'login'
              ? 'Selamat datang di SIM-PPDS. Masukkan PIN anda untuk Masuk.'
              : 'Daftarkan diri anda untuk mendapatkan akses ke sistem manajemen santri.'}
          </p>
          <button className="ghost" id="actionBtn" onClick={() => {
            setView(view === 'login' ? 'register' : 'login');
            setError('');
            setPin('');
            setRegData({ identifier: '', otp: '', name: '' });
            setOtpSent(false);
          }}>
            {view === 'login' ? 'DAFTAR AKUN' : 'SUDAH PUNYA AKUN?'}
          </button>
        </div>
      </div>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          // Force re-render if loaded after mount
          setView(v => v);
        }}
      />
    </div>
  );
}

export const dynamic = 'force-dynamic';
