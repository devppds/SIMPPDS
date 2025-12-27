'use client';

import React from 'react';

export default function StatCard({ label, value, icon, colorClass }) {
    return (
        <div className="stat-card">
            <div className={`stat-icon ${colorClass}`}>
                <i className={icon}></i>
            </div>
            <div className="stat-info">
                <div className="stat-label">{label}</div>
                <div className="stat-value">{value}</div>
            </div>
        </div>
    );
}
