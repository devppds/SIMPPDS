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
        // Auto-open submenu if a child is active (Recursive)
        const newOpens = {};
        const scan = (items) => {
            let activeFound = false;
            items.forEach(item => {
                if (item.submenu) {
                    const childActive = scan(item.submenu);
                    if (childActive) {
                        newOpens[item.label] = true;
                        activeFound = true;
                    }
                } else if (item.path === pathname) {
                    activeFound = true;
                }
            });
            return activeFound;
        };
        scan(NAV_ITEMS);
        setOpenSubmenus(prev => ({ ...prev, ...newOpens }));
    }, [pathname]);

    const toggleSubmenu = (label) => {
        setOpenSubmenus(prev => ({
            ...prev,
            [label]: !prev[label]
        }));
    };

    const isVisible = (item) => {
        if (!user) return false;

        // 1. Super Admin Bypass
        if (user.role === 'develzy') return true;

        // 2. Menu-based Permission (Dynamic from DB)
        if (user.allowedMenus && Array.isArray(user.allowedMenus) && user.allowedMenus.length > 0) {
            // Helper to check permission
            const hasAccess = (label) => {
                return user.allowedMenus.some(m => {
                    if (typeof m === 'string') return m === label;
                    return m.name === label; // New Object Structure
                });
            };

            // Dashboard is always visible
            if (item.label === 'Dashboard') return true;

            // Check direct permission
            if (hasAccess(item.label)) return true;

            // Also check if any child is visible (if it's a parent menu)
            if (item.submenu) {
                const hasVisibleChild = item.submenu.some(sub =>
                    hasAccess(sub.label) ||
                    (sub.submenu && sub.submenu.some(deep => hasAccess(deep.label)))
                );
                if (hasVisibleChild) return true;
            }

            return false;
        }

        // 3. Fallback to Role-based (Legacy navConfig)
        if (!item.roles) return true;
        return item.roles.includes(user.role);
    };

    const renderMenuItem = (item, index, level = 0) => {
        if (!isVisible(item)) return null;

        if (item.submenu) {
            const isOpen = !!openSubmenus[item.label];

            // Check recursive active
            const isChildActive = (subItems) => subItems.some(sub => sub.path === pathname || (sub.submenu && isChildActive(sub.submenu)));
            const isActive = isChildActive(item.submenu);

            return (
                <li key={index} className={`has-submenu ${isOpen ? 'open' : ''}`}>
                    <div
                        className={`nav-link ${isActive ? 'active' : ''}`}
                        onClick={() => toggleSubmenu(item.label)}
                        style={{ cursor: 'pointer', paddingLeft: `${1 + level * 0.8}rem`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <i className={item.icon} style={{ width: '24px', textAlign: 'center' }}></i>
                            <span style={{ marginLeft: '10px' }}>{item.label}</span>
                        </div>
                        <i className={`fas fa-chevron-${isOpen ? 'down' : 'right'} submenu-arrow`} style={{ fontSize: '0.8rem' }}></i>
                    </div>
                    {isOpen && (
                        <ul className="submenu" style={{ display: 'block', paddingLeft: 0 }}>
                            {item.submenu.map((sub, sIdx) => renderMenuItem(sub, sIdx, level + 1))}
                        </ul>
                    )}
                </li>
            );
        }

        return (
            <li key={index}>
                <Link
                    href={item.path}
                    className={`nav-link ${pathname === item.path ? 'active' : ''}`}
                    style={{ paddingLeft: `${1 + level * 0.8}rem`, display: 'flex', alignItems: 'center' }}
                    onClick={() => document.body.classList.remove('sidebar-open')}
                >
                    <i className={item.icon || 'fas fa-circle'} style={{ width: '24px', textAlign: 'center', fontSize: level > 0 ? '0.6rem' : '1rem', opacity: level > 0 ? 0.7 : 1 }}></i>
                    <span style={{ marginLeft: '10px' }}>{item.label}</span>
                </Link>
            </li>
        );
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
                    {NAV_ITEMS.map((item, index) => renderMenuItem(item, index))}
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
