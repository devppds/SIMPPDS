'use client';

import React from 'react';

/**
 * StatsCard - Komponen kartu statistik tunggal
 */
export function StatsCard({ title, value, icon, color = 'var(--primary)', trend, background }) {
    return (
        <div className="stat-card" style={{
            background: background || '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            padding: '1.5rem',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            transition: 'transform 0.2s ease',
            cursor: 'default'
        }}>
            {icon && (
                <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    background: `${color}15`, // Light opacity
                    color: color
                }}>
                    <i className={icon}></i>
                </div>
            )}
            <div style={{ flex: 1 }}>
                <p style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    {title}
                </p>
                <h3 style={{
                    margin: '4px 0 0 0',
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: 'var(--primary-dark)'
                }}>
                    {value}
                </h3>
                {trend && (
                    <div style={{
                        fontSize: '0.75rem',
                        marginTop: '4px',
                        color: trend.startsWith('+') ? 'var(--success)' : 'var(--danger)',
                        fontWeight: 700
                    }}>
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
        <div className="stats-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
        }}>
            {items.map((item, idx) => (
                <StatsCard key={idx} {...item} />
            ))}
        </div>
    );
}
