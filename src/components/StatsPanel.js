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
                <div className="stat-icon" style={{
                    color: color,
                    background: `${color}15`,
                    width: '64px',
                    height: '64px',
                    borderRadius: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    flexShrink: 0
                }}>
                    <i className={icon}></i>
                </div>
            )}
            <div className="stat-content">
                <div className="stat-label">{title}</div>
                <div className="stat-value" style={{ color: 'var(--text-main)' }}>{displayValue}</div>
                {trend && (
                    <div style={{
                        marginTop: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: trend.startsWith('+') ? 'var(--success)' : 'var(--danger)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <i className={`fas fa-caret-${trend.startsWith('+') ? 'up' : 'down'}`}></i>
                        {trend} vs bln lalu
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
