'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function DevelzySidebar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'general';
    const { logout } = useAuth();
    // Helper to check if item is active
    const isActive = (path) => {
        if (path === '/develzy' && activeTab === 'general') return true;
        if (path.includes(`tab=${activeTab}`)) return true;
        return false;
    };

    const menuItems = [
        { label: 'Ringkasan Sistem', icon: 'fas fa-terminal', path: '/develzy' }, // tab=general
        { label: 'Tampilan & UI', icon: 'fas fa-palette', path: '/develzy?tab=branding' },
        { label: 'Integrasi', icon: 'fas fa-plug', path: '/develzy?tab=integration' },
        { label: 'Kontrol Fitur', icon: 'fas fa-toggle-on', path: '/develzy?tab=features' },
        { label: 'Intelijen Sistem', icon: 'fas fa-brain', path: '/develzy?tab=reality' },
        { label: 'Log Audit', icon: 'fas fa-file-contract', path: '/develzy?tab=audit' },
        { label: 'Sesi Aktif', icon: 'fas fa-users-viewfinder', path: '/develzy?tab=sessions' },
        { label: 'Manajemen Role', icon: 'fas fa-user-shield', path: '/develzy?tab=roles' },
        { label: 'Kesehatan Sistem', icon: 'fas fa-server', path: '/develzy?tab=system' },
    ];

    return (
        <aside className="develzy-sidebar">

            <div className="sidebar-logo">
                <div className="logo-icon">
                    <i className="fas fa-atom fa-spin"></i>
                </div>
                <div className="logo-text">DEVEL<span>ZY</span></div>
            </div>

            <div className="nav-section-title">PROTOKOL UTAMA</div>
            <ul className="nav-list">
                {menuItems.map((item, idx) => (
                    <li key={idx} className="nav-item">
                        <Link
                            href={item.path}
                            className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                        >
                            <i className={item.icon}></i>
                            <span>{item.label}</span>
                        </Link>
                    </li>
                ))}
            </ul>

            <div className="sidebar-footer">
                <button className="logout-btn" onClick={logout}>
                    <i className="fas fa-power-off"></i>
                    <span>Akhiri Sesi</span>
                </button>
            </div>
        </aside>
    );
}
