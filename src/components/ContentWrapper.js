'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/AuthContext';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, countAllowedMenus } from '@/lib/navConfig';


export default function ContentWrapper({ children }) {
    const { loading, config, isAdmin, isDevelzy, user } = useAuth();
    const pathname = usePathname();
    const isLoginPage = pathname === '/'; // Login page is root
    const isDevelzyRoute = pathname?.startsWith('/develzy');

    const { logout } = useAuth();
    const isSingleMenuUser = user && countAllowedMenus(user) === 1;
    const isImmersiveMode = isSingleMenuUser && !isLoginPage;


    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', background: '#f8fafc' }}>
                <div style={{ padding: '20px', borderRadius: '12px', background: 'white', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                    <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: '#2563eb' }}></i>
                </div>
            </div>
        );
    }

    // Jika halaman login atau rute Develzy, tampilkan tanpa sidebar/header bawaan
    if (isLoginPage || isDevelzyRoute) {
        return <>{children}</>;
    }

    // Find title from NAV_ITEMS
    let pageTitle = 'SIM PPDS';
    NAV_ITEMS.forEach(item => {
        if (item.path === pathname) pageTitle = item.label;
        if (item.submenu) {
            const sub = item.submenu.find(s => s.path === pathname);
            if (sub) pageTitle = sub.label;
        }
    });

    // Check for Maintenance Mode
    const isMaintenance = config?.maintenance_mode === 'true';
    const [timeLeft, setTimeLeft] = useState('');

    // Bypass usernames - these users can access even during maintenance
    const bypassUsernames = ['develzy', 'muhammad khulal', 'admin'];
    const canBypassMaintenance = user && bypassUsernames.includes(user.username?.toLowerCase());

    useEffect(() => {
        if (!isMaintenance || isAdmin || isDevelzy) return;

        const timer = setInterval(() => {
            const endTime = parseInt(config?.maintenance_end_time || '0');
            const now = Date.now();
            const diff = endTime - now;

            if (diff <= 0) {
                setTimeLeft('Segera Kembali Online');
                // Optional: trigger a page refresh or config reload here
            } else {
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${h > 0 ? h + 'j ' : ''}${m}m ${s}s`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [isMaintenance, config?.maintenance_end_time, isAdmin, isDevelzy]);

    // If maintenance is ON and user is NOT admin/develzy/bypass
    if (isMaintenance && !isAdmin && !isDevelzy && !canBypassMaintenance && !isLoginPage) {
        return (
            <div style={{
                minHeight: '100vh',
                width: '100%',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                textAlign: 'center',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>

                <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(20px)',
                    padding: '4rem 3rem',
                    borderRadius: '40px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    maxWidth: '650px',
                    width: '100%',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    zIndex: 10,
                    animation: 'fadeInUp 0.6s ease-out'
                }}>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        margin: '0 auto 2.5rem',
                        background: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.2)',
                        borderRadius: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <i className="fas fa-tools" style={{ fontSize: '3rem', color: '#38bdf8' }}></i>
                    </div>
                    <h1 className="outfit" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1.2rem', letterSpacing: '-1px' }}>
                        Sedang Pemeliharaan
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.8', marginBottom: '2.5rem', maxWidth: '450px', marginInline: 'auto' }}>
                        Mohon maaf, sistem sedang diperbarui untuk kenyamanan Anda. Silakan tunggu hitung mundur di bawah ini.
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '3rem' }}>
                        <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '1.2rem 2.5rem', borderRadius: '20px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                            <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '2px' }}>Estimasi Selesai</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'monospace', color: 'white' }}>{timeLeft || '--:--'}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <a
                            href="https://wa.me/6285171542025"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                background: 'white',
                                color: '#0f172a',
                                padding: '16px 32px',
                                borderRadius: '16px',
                                textDecoration: 'none',
                                fontWeight: 800,
                                fontSize: '1rem',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <i className="fab fa-whatsapp" style={{ fontSize: '1.3rem', color: '#22c55e' }}></i>
                            Kontak Developer
                        </a>
                    </div>
                </div>

            </div>
        );
    }

    return (
        <div className="app-container">
            {isImmersiveMode ? (
                <>
                    <main id="main-content" style={{ padding: '1rem', width: '100%', minHeight: '100vh', background: '#f8fafc' }}>
                        {children}
                    </main>
                    {/* Floating Logout for Immersive Mode */}
                    <button
                        onClick={logout}
                        style={{
                            position: 'fixed',
                            bottom: '20px',
                            right: '20px',
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                            zIndex: 9999,
                            transition: 'all 0.3s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(-10deg)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        title="Keluar Sistem"
                    >
                        <i className="fas fa-sign-out-alt"></i>
                    </button>
                    <style jsx global>{`
                        .content-wrapper { margin-left: 0 !important; width: 100% !important; }
                    `}</style>
                </>
            ) : (
                <>
                    <Sidebar />
                    <div className="content-wrapper">
                        <Header title={pageTitle} />
                        <main id="main-content">
                            {children}
                        </main>
                    </div>
                </>
            )}
        </div>
    );
}

