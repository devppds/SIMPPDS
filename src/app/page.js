'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { apiCall } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      // Get all users and find matching PIN
      const users = await apiCall('getData', 'GET', { type: 'users' });
      const matchedUser = users.find(u => u.password_plain === pin);

      if (matchedUser) {
        // Login successful
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '32px',
        padding: '3rem',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 1.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <i className="fas fa-lock" style={{ fontSize: '2.5rem', color: 'white' }}></i>
          </div>
          <h1 className="outfit" style={{ fontSize: '2rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.5rem' }}>
            SIM-PPDS
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Masukkan PIN Anda</p>
        </div>

        <form onSubmit={handleLogin}>
          {/* PIN Display */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              letterSpacing: '1rem',
              color: '#1e293b',
              minHeight: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {pin ? pin.split('').map((_, i) => '●').join(' ') : '- - - -'}
            </div>
            {error && (
              <div style={{
                marginTop: '1rem',
                color: '#ef4444',
                fontSize: '0.9rem',
                fontWeight: 600
              }}>
                <i className="fas fa-exclamation-circle" style={{ marginRight: '6px' }}></i>
                {error}
              </div>
            )}
          </div>

          {/* Number Pad */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumberClick(num.toString())}
                disabled={loading}
                style={{
                  padding: '1.25rem',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  background: 'white',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: '#1e293b'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f8fafc';
                  e.target.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.borderColor = '#e2e8f0';
                }}
              >
                {num}
              </button>
            ))}

            {/* Clear Button */}
            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              style={{
                padding: '1.25rem',
                fontSize: '1rem',
                fontWeight: 700,
                background: 'white',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                cursor: 'pointer',
                color: '#ef4444'
              }}
            >
              <i className="fas fa-times"></i>
            </button>

            {/* Zero */}
            <button
              type="button"
              onClick={() => handleNumberClick('0')}
              disabled={loading}
              style={{
                padding: '1.25rem',
                fontSize: '1.5rem',
                fontWeight: 700,
                background: 'white',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                cursor: 'pointer',
                color: '#1e293b'
              }}
            >
              0
            </button>

            {/* Backspace */}
            <button
              type="button"
              onClick={handleBackspace}
              disabled={loading}
              style={{
                padding: '1.25rem',
                fontSize: '1rem',
                fontWeight: 700,
                background: 'white',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                cursor: 'pointer',
                color: '#64748b'
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
              padding: '1rem',
              fontSize: '1.1rem',
              fontWeight: 700,
              background: pin.length >= 4 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e2e8f0',
              color: pin.length >= 4 ? 'white' : '#94a3b8',
              border: 'none',
              borderRadius: '12px',
              cursor: pin.length >= 4 ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: pin.length >= 4 ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
            }}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                Memverifikasi...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt" style={{ marginRight: '8px' }}></i>
                Masuk
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: '#94a3b8'
        }}>
          <i className="fas fa-shield-alt" style={{ marginRight: '6px' }}></i>
          Sistem Informasi Pondok Pesantren
        </div>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
