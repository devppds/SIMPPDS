'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { apiCall } from '@/lib/utils';
import { getFirstAllowedPath } from '@/lib/navConfig';


export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading: authLoading, config } = useAuth();
  const [pin, setPin] = useState('');
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

  // 2. Logic Check PIN Real-time
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
        }

        .social-container a:hover {
          background: #f1f1f1;
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
        }
        
        .inpt:focus {
           background-color: #e0e0e0;
           box-shadow: 0 0 0 2px rgba(0,184,148, 0.2);
        }

        button.btn-login {
          border-radius: 20px;
          border: 1px solid #10b981;
          background-color: #10b981;
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
          background: #10b981;
          background: -webkit-linear-gradient(to right, #10b981, #059669);
          background: linear-gradient(to right, #10b981, #059669);
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
      `}</style>

      <div className="container">
        {/* Sign In Container */}
        <div className="form-container sign-in-container">
          <form onSubmit={handleManualSubmit} style={{ width: '100%' }}>
            <h1>Sign in</h1>
            <div className="social-container">
              <a href="#" className="social" onClick={e => e.preventDefault()}><i className="fab fa-facebook-f"></i></a>
              <a href="#" className="social" onClick={e => e.preventDefault()}><i className="fab fa-google-plus-g"></i></a>
              <a href="#" className="social" onClick={e => e.preventDefault()}><i className="fab fa-linkedin-in"></i></a>
            </div>
            <span>atau gunakan akun anda</span>

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
              {isVerifying && <span style={{ color: '#10b981' }}>Checking...</span>}
            </div>

            <a href="#" onClick={e => e.preventDefault()} style={{ fontSize: '12px', color: '#333', textDecoration: 'none', marginBottom: '15px', display: 'block' }}>Lupa kata sandi anda?</a>

            <button className="btn-login" type="submit" disabled={loading || isVerifying}>
              {loading ? 'LOADING...' : 'SIGN IN'}
            </button>
          </form>
        </div>

        {/* Overlay Container */}
        <div className="overlay-container">
          <h1>Halo, Teman!</h1>
          <p>
            Selamat datang di SIM-PPDS. Masukkan PIN anda untuk mulai mengelola data santri.
          </p>
          <button className="ghost" id="signUp" onClick={() => alert("Silahkan hubungi Administrator untuk pendaftaran.")}>
            SIGN UP
          </button>
        </div>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';

