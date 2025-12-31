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
        <div className="stat-card">
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

            <style jsx>{`
                .stat-card {
                    background: ${background || '#fff'};
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                    padding: 1.5rem;
                    border-radius: 16px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    transition: all 0.2s ease;
                }
                .stat-icon-wrapper {
                    width: 56px;
                    height: 56px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    fontSize: 1.5rem;
                }
                .stat-content {
                    flex: 1;
                }
                .stat-card-title {
                    margin: 0;
                    font-size: 0.85rem;
                    color: var(--text-muted);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .stat-card-value {
                    margin: 4px 0 0 0;
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: var(--primary-dark);
                }
                .stat-trend {
                    font-size: 0.75rem;
                    marginTop: 4px;
                    font-weight: 700;
                }

                @media (max-width: 640px) {
                    .stat-card {
                        padding: 0.75rem;
                        gap: 0.5rem;
                        /* Force horizontal layout even on mobile */
                        flex-direction: row !important;
                        align-items: center !important;
                        text-align: left !important;
                    }
                    .stat-icon-wrapper {
                        width: 32px;
                        height: 32px;
                        font-size: 0.9rem;
                        border-radius: 8px;
                    }
                    .stat-card-title {
                        font-size: 0.55rem;
                    }
                    .stat-card-value {
                        font-size: 0.9rem;
                        margin: 0;
                    }
                }
            `}</style>
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

            <style jsx>{`
                .stats-panel-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }
                @media (max-width: 768px) {
                    .stats-panel-grid {
                        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                        gap: 1rem;
                    }
                }
                @media (max-width: 600px) {
                    .stats-panel-grid {
                        display: flex !important;
                        flex-direction: row !important;
                        overflow-x: auto !important;
                        padding-bottom: 12px !important;
                        gap: 10px !important;
                        -webkit-overflow-scrolling: touch;
                        scrollbar-width: none;
                    }
                    .stats-panel-grid::-webkit-scrollbar {
                        display: none;
                    }
                    :global(.stat-card) {
                        flex: 0 0 200px !important;
                        width: 200px !important;
                    }
                }
            `}</style>
        </div>
    );
}
