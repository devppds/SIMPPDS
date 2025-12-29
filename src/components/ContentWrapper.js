'use client';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/AuthContext';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/navConfig';

export default function ContentWrapper({ children }) {
    const { loading } = useAuth();
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
