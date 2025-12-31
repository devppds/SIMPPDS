'use client';

import React, { useMemo } from 'react';

/**
 * StatsCard - Komponen kartu statistik tunggal
 */
export function StatsCard({ title, value, icon, color = 'var(--primary)', trend, background, renderValue }) {
    const displayValue = useMemo(() => {
        if (renderValue && typeof renderValue === 'function') {
            return renderValue(value);
        }
        if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
        }
        return value;
    }, [value, renderValue]);

    return (
        <div className="stat-card" style={{ background: background || '#fff' }}>
            {icon && (
                <div className="stat-icon-wrapper" style={{ color: color, background: `${color}15` }}>
                    <i className={icon}></i>
                </div>
            )}
            <div className="stat-content">
                <p className="stat-card-title">{title}</p>
                <h3 className="stat-card-value">{displayValue}</h3>
                {trend && (
                    <div className="stat-trend" style={{ color: trend.startsWith('+') ? 'var(--success)' : 'var(--danger)' }}>
                        {trend} dibandingkan bulan lalu
                    </div>
                )}
            </div>

        </div>
    );
}

/**
 * StatsPanel - Kontainer untuk barisan kartu statistik
 * @param {Array} items - Array of card data { title, value, icon, color, trend }
 */
export default function StatsPanel({ items = [] }) {
    if (!items.length) return null;

    return (
        <div className="stats-panel-grid">
            {items.map((item, idx) => (
                <StatsCard key={idx} {...item} />
            ))}

        </div>
    );
}
