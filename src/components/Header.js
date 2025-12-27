'use client';

import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import HijriDate from './HijriDate';

export default function Header({ title }) {
    const { user } = useAuth();

    const toggleSidebar = () => {
        document.body.classList.toggle('sidebar-open');
    };

    return (
        <header>
            <div className="header-title">
                <div style={{ display: 'none' }} className="mobile-only">
                    <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', fontSize: '1.5rem', marginRight: '15px', color: 'var(--primary)' }}>
                        <i className="fas fa-bars"></i>
                    </button>
                </div>
                <h1>{title || 'Dashboard Overview'}</h1>
            </div>

            <div className="header-actions">
                <HijriDate />
                <div className="user-profile">
                    <div className="user-info">
                        <span className="user-name">{user?.fullname?.split(' ')[0] || 'User'}</span>
                        <span className="user-role">{user?.role?.toUpperCase()}</span>
                    </div>
                    <div className="user-avatar">
                        <img src={`https://ui-avatars.com/api/?name=${user?.username || 'U'}&background=1e3a8a&color=fff`} alt="User" />
                    </div>
                </div>
            </div>

            <style jsx>{`
                @media (max-width: 1024px) {
                    .mobile-only { display: block !important; }
                }
            `}</style>
        </header>
    );
}
