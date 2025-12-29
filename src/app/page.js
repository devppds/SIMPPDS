'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { apiCall } from '@/lib/utils';

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
      router.push('/dashboard');
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

      // Sedikit delay artifisial biar user sempat lihat PIN penuh (UX)
      setTimeout(() => {
        login({
          username: matchedUser.username,
          fullname: matchedUser.fullname,
          role: matchedUser.role,
          allowedMenus: matchedUser.allowedMenus || []
        });
        router.push('/dashboard');
      }, 300); // 0.3 detik

      return true;
    }

    // Jika panjang sudah 6 (max) tapi tidak cocok
    if (currentPin.length === 6) {
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

  const handleHandleInput = (value) => {
    // Hanya angka
    if (!/^\d*$/.test(value)) return;

    // Update State
    if (value.length <= 6) {
      setPin(value);
      // Check langsung
      if (cachedUsers.length > 0 && value.length >= 4) {
        checkPinAndLogin(value);
      }
    }
  };

  const handleNumberClick = (num) => {
    if (loading || isVerifying) return;
    if (pin.length < 6) {
      handleHandleInput(pin + num);
    }
  };

  const handleBackspace = () => {
    if (loading || isVerifying) return;
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    if (loading || isVerifying) return;
    setPin('');
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      // Background Premium Dark Elegant
      background: `
        radial-gradient(circle at 10% 20%, rgba(37, 99, 235, 0.1) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 40%),
        linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)
      `,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Background Orbs Animation */}
      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .numpad-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          transition: all 0.2s ease;
        }
        .numpad-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .numpad-btn:active {
          transform: translateY(0);
        }
        .pin-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }
        .pin-dot.filled {
          background: #38bdf8;
          box-shadow: 0 0 15px #38bdf8;
          transform: scale(1.1);
        }
        .shake {
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
            10%, 90% { transform: translate3d(-1px, 0, 0); }
            20%, 80% { transform: translate3d(2px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
            40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>

      {/* Main Card */}
      <div className="glass-card" style={{
        borderRadius: '24px', // Adjusted
        padding: '2.5rem',    // Adjusted
        maxWidth: '380px',    // Adjusted: Compact for PC
        width: '100%',
        position: 'relative',
        zIndex: 10
      }}>
        {/* LOGO & TITLE */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            margin: '0 auto 1rem',
            animation: 'float 6s ease-in-out infinite'
          }}>
            <img
              src={config?.logo_url || "https://ui-avatars.com/api/?name=LIRBOYO&background=2563eb&color=fff&size=256&bold=true"}
              alt="Logo"
              style={{ width: '100px', marginBottom: '1.5rem', borderRadius: '20px', boxShadow: '0 8px 16px -4px rgba(0,0,0,0.1)' }}
            />
          </div>
          <h1 className="outfit" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: '0.25rem', letterSpacing: '-0.5px' }}>
            SIM-PPDS
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', letterSpacing: '0.5px', textTransform: 'uppercase', opacity: 0.8 }}>Access Control System</p>
        </div>

        {/* PIN DOTS */}
        <div style={{
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem', // Adjusted
          height: '30px',
          alignItems: 'center'
        }}>
          {/* Tampilkan loader jika sedang memverifikasi */}
          {isVerifying ? (
            <div style={{ color: '#38bdf8', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-circle-notch fa-spin"></i>
              <span>MEMVERIFIKASI...</span>
            </div>
          ) : (
            [...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`pin-dot ${i < pin.length ? 'filled' : ''}`}
                style={{ width: '12px', height: '12px' }} // Adjusted
              ></div>
            ))
          )}
        </div>

        {/* Error Message */}
        <div style={{
          height: '24px',
          marginBottom: '0.8rem',
          textAlign: 'center',
          opacity: error ? 1 : 0,
          transition: 'opacity 0.3s'
        }}>
          {error && (
            <span className="outfit" style={{
              color: '#ef4444',
              background: 'rgba(239, 68, 68, 0.1)',
              padding: '4px 12px',
              borderRadius: '16px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              fontSize: '0.8rem'
            }}>
              {error}
            </span>
          )}
        </div>

        {/* NUMPAD */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.8rem', // Adjusted
          marginBottom: '1.5rem'
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              type="button"
              className="numpad-btn outfit"
              onClick={() => handleNumberClick(num.toString())}
              disabled={loading || isVerifying}
              style={{
                padding: '1rem', // Adjusted
                fontSize: '1.4rem', // Adjusted
                fontWeight: 500,
                borderRadius: '16px',
                cursor: 'pointer',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.08)'
              }}
            >
              {num}
            </button>
          ))}

          {/* Clear Button */}
          <button
            type="button"
            className="numpad-btn"
            onClick={handleClear}
            disabled={loading || isVerifying}
            style={{
              padding: '1rem', // Adjusted
              fontSize: '1rem',
              borderRadius: '16px',
              cursor: 'pointer',
              color: '#ef4444',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.05)'
            }}
          >
            <i className="fas fa-times"></i>
          </button>

          {/* Zero */}
          <button
            type="button"
            className="numpad-btn outfit"
            onClick={() => handleNumberClick('0')}
            disabled={loading || isVerifying}
            style={{
              padding: '1rem', // Adjusted
              fontSize: '1.4rem', // Adjusted
              fontWeight: 500,
              borderRadius: '16px',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.08)'
            }}
          >
            0
          </button>

          {/* Backspace */}
          <button
            type="button"
            className="numpad-btn"
            onClick={handleBackspace}
            disabled={loading || isVerifying}
            style={{
              padding: '1rem', // Adjusted
              fontSize: '1rem',
              borderRadius: '16px',
              cursor: 'pointer',
              color: '#facc15',
              borderColor: 'rgba(250, 204, 21, 0.3)',
              background: 'rgba(250, 204, 21, 0.05)'
            }}
          >
            <i className="fas fa-backspace"></i>
          </button>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.7rem',
          color: 'rgba(255, 255, 255, 0.3)',
          letterSpacing: '1px'
        }}>
          <i className="fas fa-lock" style={{ marginRight: '6px' }}></i>
          SECURED BY DENYR A.K.A DEVELZY
        </div>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
