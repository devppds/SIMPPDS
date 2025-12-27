'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { NAV_ITEMS } from '@/lib/navConfig';

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [openSubmenus, setOpenSubmenus] = useState({});

    useEffect(() => {
        // Auto-open submenu if a child is active
        const newOpens = {};
        NAV_ITEMS.forEach((item, index) => {
            if (item.submenu) {
                const isActive = item.submenu.some(sub => sub.path === pathname);
                if (isActive) newOpens[index] = true;
            }
        });
        setOpenSubmenus(prev => ({ ...prev, ...newOpens }));
    }, [pathname]);

    const toggleSubmenu = (index) => {
        if (user?.role !== 'admin') return;
        setOpenSubmenus(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const isVisible = (roles) => {
        if (!roles) return true;
        if (!user) return false;
        return roles.includes(user.role);
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo">
                    <img
                        src="https://res.cloudinary.com/dceamfy3n/image/upload/v1766596001/logo_zdenyr.png"
                        alt="Logo PPTQ Darussalam"
                        style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px' }}
                    />
                    <span>SIMPPDS</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="menu-section">MENU UTAMA</div>
                <ul>
                    {NAV_ITEMS.map((item, index) => {
                        if (!isVisible(item.roles)) return null;

                        if (item.submenu) {
                            const isOpen = user?.role === 'admin' ? !!openSubmenus[index] : true;
                            const isParentActive = item.submenu.some(sub => sub.path === pathname);

                            return (
                                <li key={index} className={`has-submenu ${isOpen ? 'open' : ''}`}>
                                    <div
                                        className={`nav-link ${isParentActive ? 'active' : ''}`}
                                        onClick={() => toggleSubmenu(index)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <i className={item.icon}></i>
                                        <span>{item.label}</span>
                                        {user?.role === 'admin' && <i className={`fas fa-chevron-${isOpen ? 'down' : 'right'} submenu-arrow`}></i>}
                                    </div>
                                    <ul className="submenu">
                                        {item.submenu.map((sub, sIdx) => (
                                            <li key={sIdx}>
                                                <Link
                                                    href={sub.path}
                                                    className={`sub-nav-link ${pathname === sub.path ? 'active' : ''}`}
                                                    onClick={() => document.body.classList.remove('sidebar-open')}
                                                >
                                                    <i className={sub.icon || 'fas fa-circle'}></i>
                                                    <span>{sub.label}</span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            );
                        }

                        return (
                            <li key={index}>
                                <Link
                                    href={item.path}
                                    className={`nav-link ${pathname === item.path ? 'active' : ''}`}
                                    onClick={() => document.body.classList.remove('sidebar-open')}
                                >
                                    <i className={item.icon}></i>
                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="sidebar-footer">
                <button onClick={logout} className="logout-btn">
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Keluar Sistem</span>
                </button>
            </div>
        </aside>
    );
}
