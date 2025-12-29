'use client';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/AuthContext';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/navConfig';

export default function ContentWrapper({ children }) {
    const { loading, config, isAdmin, isDevelzy } = useAuth();
    const pathname = usePathname();
    const isLoginPage = pathname === '/'; // Login page is root

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', background: '#f8fafc' }}>
                <div style={{ padding: '20px', borderRadius: '12px', background: 'white', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                    <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: '#2563eb' }}></i>
                </div>
            </div>
        );
    }

    // Jika halaman login, tampilkan full screen tanpa sidebar/header
    if (isLoginPage) {
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

    // If maintenance is ON and user is NOT admin/develzy
    if (isMaintenance && !isAdmin && !isDevelzy && !isLoginPage) {
        return (
            <div style={{
                minHeight: '100vh',
                width: '100%',
                background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                textAlign: 'center',
                color: 'white'
            }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(20px)',
                    padding: '4rem 3rem',
                    borderRadius: '32px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    maxWidth: '600px',
                    width: '100%',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        margin: '0 auto 2.5rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <i className="fas fa-tools" style={{ fontSize: '3.5rem', color: '#38bdf8' }}></i>
                    </div>
                    <h1 className="outfit" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-1px' }}>
                        Sedang Pemeliharaan
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '2.5rem' }}>
                        Mohon maaf, sistem SIM-PPDS sedang dalam proses pembaruan untuk meningkatkan layanan. Kami akan segera kembali online.
                    </p>
                    <div style={{
                        background: 'rgba(56, 189, 248, 0.1)',
                        padding: '1rem 2rem',
                        borderRadius: '16px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: '#38bdf8',
                        fontWeight: 700
                    }}>
                        <i className="fas fa-clock"></i>
                        Estimasi selesai: Hari Ini
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            <Sidebar />
            <div className="content-wrapper">
                <Header title={pageTitle} />
                <main id="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
