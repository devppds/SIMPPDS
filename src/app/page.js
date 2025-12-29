'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { apiCall } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading: authLoading } = useAuth();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handlePinInput = (value) => {
    // Only allow numbers and max 6 digits
    if (/^\d*$/.test(value) && value.length <= 6) {
      setPin(value);
      setError('');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (pin.length < 4) {
      setError('PIN minimal 4 digit');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const users = await apiCall('getData', 'GET', { type: 'users' });
      const matchedUser = users.find(u => u.password_plain === pin);

      if (matchedUser) {
        login({
          username: matchedUser.username,
          fullname: matchedUser.fullname,
          role: matchedUser.role
        });
        router.push('/dashboard');
      } else {
        setError('PIN tidak valid');
        setPin('');
      }
    } catch (err) {
      setError('Gagal login. Coba lagi.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNumberClick = (num) => {
    if (pin.length < 6) {
      handlePinInput(pin + num);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleClear = () => {
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
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 20px rgba(37, 99, 235, 0.2); }
          50% { box-shadow: 0 0 40px rgba(37, 99, 235, 0.4); }
          100% { box-shadow: 0 0 20px rgba(37, 99, 235, 0.2); }
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
          box-shadow: 0 0 10px #38bdf8;
        }
      `}</style>

      {/* Main Card */}
      <div className="glass-card" style={{
        borderRadius: '32px',
        padding: '3.5rem',
        maxWidth: '480px',
        width: '100%',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            margin: '0 auto 1.5rem',
            animation: 'float 6s ease-in-out infinite'
          }}>
            <img
              src="https://res.cloudinary.com/dceamfy3n/image/upload/v1766596001/logo_zdenyr.png"
              alt="Logo PPTQ"
              style={{
                width: '120px',
                height: 'auto',
                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))'
              }}
            />
          </div>
          <h1 className="outfit" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>
            SIM-PPDS
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', letterSpacing: '0.5px' }}>SISTEM INFORMASI MANAJEMEN TERPADU</p>
        </div>

        <form onSubmit={handleLogin}>
          {/* PIN Display */}
          <div style={{
            marginBottom: '2.5rem',
            display: 'flex',
            justifyContent: 'center',
            gap: '1.5rem',
            height: '40px',
            alignItems: 'center'
          }}>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`pin-dot ${i < pin.length ? 'filled' : ''}`}
              ></div>
            ))}
          </div>

          {error && (
            <div style={{
              textAlign: 'center',
              marginBottom: '1.5rem',
              color: '#ef4444',
              fontSize: '0.9rem',
              fontWeight: 600,
              background: 'rgba(239, 68, 68, 0.1)',
              padding: '10px',
              borderRadius: '12px',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
              {error}
            </div>
          )}

          {/* Number Pad */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                type="button"
                className="numpad-btn outfit"
                onClick={() => handleNumberClick(num.toString())}
                disabled={loading}
                style={{
                  padding: '1.25rem',
                  fontSize: '1.75rem',
                  fontWeight: 600,
                  borderRadius: '18px',
                  cursor: 'pointer',
                  border: 'none'
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
              disabled={loading}
              style={{
                padding: '1.25rem',
                fontSize: '1.2rem',
                borderRadius: '18px',
                cursor: 'pointer',
                color: '#ef4444',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.1)'
              }}
            >
              <i className="fas fa-times"></i>
            </button>

            {/* Zero */}
            <button
              type="button"
              className="numpad-btn outfit"
              onClick={() => handleNumberClick('0')}
              disabled={loading}
              style={{
                padding: '1.25rem',
                fontSize: '1.75rem',
                fontWeight: 600,
                borderRadius: '18px',
                cursor: 'pointer'
              }}
            >
              0
            </button>

            {/* Backspace */}
            <button
              type="button"
              className="numpad-btn"
              onClick={handleBackspace}
              disabled={loading}
              style={{
                padding: '1.25rem',
                fontSize: '1.2rem',
                borderRadius: '18px',
                cursor: 'pointer',
                color: '#facc15',
                borderColor: 'rgba(250, 204, 21, 0.3)',
                background: 'rgba(250, 204, 21, 0.1)'

              }}
            >
              <i className="fas fa-backspace"></i>
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading || pin.length < 4}
            style={{
              width: '100%',
              padding: '1.25rem',
              fontSize: '1.1rem',
              fontWeight: 700,
              background: pin.length >= 4 ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' : 'rgba(255,255,255,0.1)',
              color: pin.length >= 4 ? 'white' : 'rgba(255,255,255,0.3)',
              border: 'none',
              borderRadius: '16px',
              cursor: pin.length >= 4 ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: pin.length >= 4 ? '0 10px 25px -5px rgba(59, 130, 246, 0.5)' : 'none',
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
                VERIFYING...
              </>
            ) : (
              <>
                LOGIN SYSTEM
                <i className="fas fa-arrow-right" style={{ marginLeft: '10px' }}></i>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: '2.5rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'rgba(255, 255, 255, 0.4)',
          letterSpacing: '0.5px'
        }}>
          <i className="fas fa-shield-alt" style={{ marginRight: '8px' }}></i>
          SECURED BY DENYR A.K.A DEVELZY
        </div>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
