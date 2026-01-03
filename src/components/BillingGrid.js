'use client';

import React from 'react';
import { formatCurrency } from '@/lib/utils';

export default function BillingGrid({ pcs, onPcClick, onStopClick }) {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '2rem',
            padding: '2.5rem',
            background: 'rgba(255, 255, 255, 0.4)',
            borderRadius: '40px',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(15px)',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.02)'
        }}>
            {pcs.map((pc) => (
                <div
                    key={pc.id}
                    className={`billing-card ${pc.active ? 'active-grid-item' : ''}`}
                    style={{
                        background: pc.active ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : '#fff',
                        borderRadius: '28px',
                        padding: '1.8rem',
                        position: 'relative',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        boxShadow: pc.active ? '0 25px 30px -10px rgba(0, 0, 0, 0.3)' : 'var(--shadow-sm)',
                        color: pc.active ? '#fff' : 'var(--text-main)',
                        minHeight: '220px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        overflow: 'hidden'
                    }}
                >
                    {/* Status Pulse for Active */}
                    {pc.active && (
                        <div className="status-pulse" style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            width: '10px',
                            height: '10px',
                            background: '#10b981',
                            borderRadius: '50%',
                            boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.2)'
                        }}></div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 800, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '4px' }}>
                                Workstation
                            </div>
                            <h3 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '2px', fontFamily: 'Outfit' }}>{pc.id}</h3>
                        </div>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '18px',
                            background: pc.active ? 'rgba(37, 99, 235, 0.15)' : '#f8fafc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: pc.active ? '#3b82f6' : '#cbd5e1',
                            fontSize: '1.5rem',
                            border: `1px solid ${pc.active ? 'rgba(37,99,235,0.2)' : '#e2e8f0'}`
                        }}>
                            <i className={`fas ${pc.active ? 'fa-desktop' : 'fa-power-off'}`}></i>
                        </div>
                    </div>

                    {pc.active ? (
                        <div style={{ marginTop: '1.2rem' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px', color: '#fff', opacity: 0.95 }}>
                                {pc.userName}
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%' }}></div>
                                        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#3b82f6' }}>{pc.duration}</span>
                                    </div>
                                    <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#fff' }}>
                                        {formatCurrency(pc.cost)}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); onStopClick(pc); }}
                                className="btn-stop-billing"
                                style={{
                                    width: '100%',
                                    marginTop: '1.5rem',
                                    padding: '12px',
                                    borderRadius: '16px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    color: '#f87171',
                                    fontWeight: 800,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <i className="fas fa-stop-circle"></i> Selesai / Bayar
                            </button>
                        </div>
                    ) : (
                        <div
                            onClick={() => onPcClick(pc)}
                            style={{
                                border: '2px dashed #e2e8f0',
                                borderRadius: '20px',
                                padding: '1.5rem',
                                textAlign: 'center',
                                fontSize: '1rem',
                                fontWeight: 800,
                                color: '#94a3b8',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                background: 'transparent'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'rgba(37,99,235,0.02)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
                        >
                            <i className="fas fa-plus-circle" style={{ display: 'block', fontSize: '1.8rem', marginBottom: '8px', opacity: 0.5 }}></i>
                            MULAI RENTAL
                        </div>
                    )}
                </div>
            ))}

            <style jsx>{`
                .active-grid-item::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: linear-gradient(225deg, rgba(59, 130, 246, 0.1) 0%, transparent 50%);
                    pointer-events: none;
                }
                .btn-stop-billing:hover {
                    background: #ef4444 !important;
                    color: #fff !important;
                    box-shadow: 0 10px 20px rgba(239, 68, 68, 0.2);
                }
            `}</style>
        </div>
    );
}

