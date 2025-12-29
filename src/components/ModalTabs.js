'use client';

import React from 'react';

/**
 * ModalTabs - Komponen tab navigasi di dalam modal (Satu Pintu)
 */
export default function ModalTabs({ tabs = [], activeTab, onChange }) {
    if (!tabs.length) return null;

    return (
        <div className="modal-tabs" style={{
            display: 'flex',
            gap: '5px',
            borderBottom: '2px solid #f1f5f9',
            paddingBottom: '2px',
            marginBottom: '1.5rem',
            overflowX: 'auto'
        }}>
            {tabs.map((tab) => {
                const key = typeof tab === 'object' ? tab.key : tab.toLowerCase();
                const label = typeof tab === 'object' ? tab.label : tab;
                const icon = typeof tab === 'object' ? tab.icon : null;
                const isActive = activeTab === key;

                return (
                    <button
                        key={key}
                        type="button"
                        onClick={() => onChange(key)}
                        style={{
                            padding: '10px 18px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            border: 'none',
                            background: isActive ? 'var(--primary-light)' : 'transparent',
                            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                            borderRadius: '10px 10px 0 0',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            borderBottom: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                            marginBottom: '-5px'
                        }}
                    >
                        {icon && <i className={icon}></i>}
                        {label.toUpperCase()}
                    </button>
                );
            })}
        </div>
    );
}
