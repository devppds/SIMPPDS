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
            <style jsx>{`
                .develzy-sidebar {
                    width: 280px;
                    height: 100vh;
                    background: #020617;
                    border-right: 1px solid rgba(16, 185, 129, 0.2);
                    display: flex;
                    flex-direction: column;
                    padding: 2rem 1.5rem;
                    position: fixed;
                    left: 0;
                    top: 0;
                    z-index: 1000;
                    color: #10b981;
                    box-shadow: 10px 0 30px rgba(0,0,0,0.5);
                }

                .sidebar-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 3rem;
                    padding: 0 10px;
                }

                .logo-icon {
                    width: 40px;
                    height: 40px;
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid #10b981;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
                }

                .logo-text {
                    font-family: 'Outfit', sans-serif;
                    font-weight: 900;
                    font-size: 1.25rem;
                    letter-spacing: 1px;
                    color: #f8fafc;
                }

                .logo-text span {
                    color: #10b981;
                }

                .nav-section-title {
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: #475569;
                    letter-spacing: 2px;
                    margin-bottom: 1rem;
                    padding-left: 10px;
                }

                .nav-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    flex: 1;
                }

                .nav-item {
                    margin-bottom: 0.5rem;
                }

                .nav-link {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border-radius: 12px;
                    color: #94a3b8;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 0.95rem;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 1px solid transparent;
                }

                .nav-link:hover {
                    background: rgba(16, 185, 129, 0.05);
                    color: #10b981;
                    transform: translateX(5px);
                }

                .nav-link.active {
                    background: rgba(16, 185, 129, 0.1);
                    color: #10b981;
                    border-color: rgba(16, 185, 129, 0.3);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                }

                .nav-link i {
                    width: 20px;
                    text-align: center;
                    font-size: 1.1rem;
                }

                .sidebar-footer {
                    margin-top: auto;
                    padding-top: 1rem;
                    border-top: 1px solid rgba(16, 185, 129, 0.1);
                }

                .logout-btn {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px;
                    background: rgba(239, 68, 68, 0.1);
                    color: #f87171;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    border-radius: 12px;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 0.9rem;
                    transition: all 0.3s;
                }

                .logout-btn:hover {
                    background: #ef4444;
                    color: white;
                    box-shadow: 0 10px 20px rgba(239, 68, 68, 0.2);
                }
            `}</style>

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
