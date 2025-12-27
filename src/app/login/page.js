'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import './login.css';

export default function LoginPage() {
    const [role, setRole] = useState('admin');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/auth?action=login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: role, password })
            });

            const data = await res.json();

            if (res.ok && data.user) {
                login(data.user);
                router.push('/dashboard');
            } else {
                setError(data.error || 'Password salah!');
                const card = document.querySelector('.login-card');
                if (card) {
                    card.classList.add('shake');
                    setTimeout(() => card.classList.remove('shake'), 500);
                }
            }
        } catch (err) {
            console.error('Login Error:', err);
            setError('Gagal menghubungkan ke server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div id="login-overlay">
            <div className="login-card">
                <div className="login-logo">
                    <img
                        src="https://res.cloudinary.com/dceamfy3n/image/upload/v1766596001/logo_zdenyr.png"
                        alt="Logo SIMPPDS"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                </div>
                <h1 className="login-title">SIMPPDS</h1>
                <p className="login-desc">Sistem Informasi Manajemen Pesantren</p>

                <form onSubmit={handleLogin} style={{ width: '100%' }}>
                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Pilih Akses Unit</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="form-control"
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.1)',
                                height: '54px'
                            }}
                        >
                            <option value="admin" style={{ color: 'black' }}>Administrator</option>
                            <option value="bendahara" style={{ color: 'black' }}>Bendahara Pondok</option>
                            <option value="sekretariat" style={{ color: 'black' }}>Sekretariat</option>
                            <option value="keamanan" style={{ color: 'black' }}>Bagian Keamanan</option>
                            <option value="pendidikan" style={{ color: 'black' }}>Bagian Pendidikan</option>
                            <option value="kesehatan" style={{ color: 'black' }}>Bagian Kesehatan</option>
                            <option value="jamiyyah" style={{ color: 'black' }}>Jam'iyyah</option>
                            <option value="madrasah_miu" style={{ color: 'black' }}>Madrasah MIU</option>
                        </select>
                    </div>

                    <div className="form-group" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
                        <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Kata Sandi</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="form-control"
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.1)',
                                height: '54px'
                            }}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            justifyContent: 'center',
                            padding: '16px',
                            borderRadius: '15px',
                            background: 'var(--gold)',
                            color: 'var(--primary-dark)',
                            fontSize: '1rem',
                            boxShadow: '0 10px 20px rgba(212, 175, 55, 0.2)'
                        }}
                    >
                        {loading ? <i className="fas fa-spinner fa-spin"></i> : 'MASUK SEKARANG'}
                    </button>

                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#fca5a5',
                            padding: '12px',
                            borderRadius: '10px',
                            marginTop: '1.5rem',
                            fontSize: '0.85rem',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}>
                            <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
                            {error}
                        </div>
                    )}
                </form>

                <div className="login-footer">
                    © 2025 Pondok Pesantren PPTQ Darussalam. <br />
                    Digital Innovation by Antigravity.
                </div>
            </div>
        </div>
    );
}
