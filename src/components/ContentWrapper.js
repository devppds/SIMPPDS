'use client';

import Header from '@/components/Header';
import { useAuth } from '@/lib/AuthContext';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/navConfig';

export default function ContentWrapper({ children }) {
    const { loading } = useAuth();
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw' }}>
                <div className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)' }}></div>
            </div>
        );
    }

    if (isLoginPage) return <>{children}</>;

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
        <div className="content-wrapper">
            <Header title={pageTitle} />
            <main id="main-content">
                {children}
            </main>
        </div>
    );
}
