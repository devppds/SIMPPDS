'use client';

import React from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/lib/AuthContext';
import { usePathname } from 'next/navigation';

export default function ContentWrapper({ children }) {
    const { user, loading } = useAuth();
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

    return (
        <div className="content-wrapper">
            <Header title={getPageTitle(pathname)} />
            <main className="view-container">
                {children}
            </main>
        </div>
    );
}

function getPageTitle(path) {
    const titles = {
        '/dashboard': 'Dashboard Overview',
        '/santri': 'Data Santri',
        '/kamar': 'Asrama & Kamar',
        '/ustadz': 'Data Pengajar (Ustadz)',
        '/pengurus': 'Data Pengurus Pondok',
        '/settings': 'Pengaturan Sistem',
        '/keamanan': 'Bagian Keamanan',
        '/pelanggaran': 'Catatan Pelanggaran',
        '/izin': 'Perizinan Santri',
        '/kesehatan': 'Layanan Kesehatan',
        '/arus-kas': 'Arus Kas Pondok',
        '/layanan-admin': 'Layanan & Administrasi'
    };
    return titles[path] || 'SIM PPDS';
}
