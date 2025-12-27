'use client';

import Link from 'next/link';

export default function NotFound() {
    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000',
            color: '#fff',
            fontFamily: "'Outfit', sans-serif",
            textAlign: 'center',
            padding: '20px'
        }}>
            <div style={{
                fontSize: '150px',
                fontWeight: '900',
                lineHeight: '1',
                marginBottom: '20px',
                background: 'linear-gradient(to bottom, #fff 0%, #333 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-5px'
            }}>
                404
            </div>

            <h2 style={{
                fontSize: '2rem',
                fontWeight: '800',
                marginBottom: '10px',
                color: '#fff'
            }}>
                Mohon bersabar, masih dalam pengembangan.
            </h2>

            <p style={{
                fontSize: '1.1rem',
                opacity: '0.7',
                marginBottom: '40px',
                maxWidth: '600px'
            }}>
                Halaman yang Anda tuju sedang kami persiapkan dengan cinta dan dedikasi. Silakan kembali ke dashboard atau hubungi kami.
            </p>

            <div style={{ display: 'flex', gap: '15px' }}>
                <Link href="/dashboard" style={{
                    backgroundColor: '#fff',
                    color: '#000',
                    padding: '12px 30px',
                    borderRadius: '50px',
                    fontWeight: '800',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    fontSize: '0.9rem'
                }}>
                    KEMBALI KE DASHBOARD
                </Link>

                <a href="https://wa.me/6285171542025" target="_blank" rel="noopener noreferrer" style={{
                    backgroundColor: '#25D366',
                    color: '#fff',
                    padding: '12px 30px',
                    borderRadius: '50px',
                    fontWeight: '800',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.3s ease',
                    fontSize: '0.9rem'
                }}>
                    <i className="fab fa-whatsapp" style={{ fontSize: '1.2rem' }}></i>
                    HUBUNGI ADMIN
                </a>
            </div>

            <div style={{
                marginTop: '100px',
                fontSize: '0.8rem',
                opacity: '0.3',
                letterSpacing: '2px'
            }}>
                SIM-PPDS SYSTEM BY DEVELZ
            </div>
        </div>
    );
}
