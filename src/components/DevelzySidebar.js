'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function DevelzySidebar() {
    const pathname = usePathname();
    const { logout } = useAuth();

    const menuItems = [
        { label: 'System Overview', icon: 'fas fa-terminal', path: '/develzy' },
        { label: 'Branding & Themes', icon: 'fas fa-palette', path: '/develzy?tab=branding' },
        { label: 'Integrations', icon: 'fas fa-plug', path: '/develzy?tab=integrations' },
        { label: 'Maintenance Log', icon: 'fas fa-database', path: '/develzy?tab=logs' },
        { label: 'User Roles', icon: 'fas fa-user-shield', path: '/develzy?tab=roles' },
        { label: 'Security Sockets', icon: 'fas fa-server', path: '/develzy?tab=system' },
    ];

    return (
        <aside className="develzy-sidebar">

            <div className="sidebar-logo">
                <div className="logo-icon">
                    <i className="fas fa-atom fa-spin"></i>
                </div>
                <div className="logo-text">DEVEL<span>ZY</span></div>
            </div>

            <div className="nav-section-title">CORE PROTOCOLS</div>
            <ul className="nav-list">
                {menuItems.map((item, idx) => (
                    <li key={idx} className="nav-item">
                        <Link
                            href={item.path}
                            className={`nav-link ${pathname === item.path ? 'active' : ''}`}
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
                    <span>Terminate Session</span>
                </button>
            </div>
        </aside>
    );
}
