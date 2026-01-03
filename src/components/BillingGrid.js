'use client';

import React from 'react';
import { formatCurrency } from '@/lib/utils';

export default function BillingGrid({ pcs, onPcClick }) {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1.5rem',
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.5)',
            borderRadius: '32px',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            backdropFilter: 'blur(10px)'
        }}>
            {pcs.map((pc) => (
                <div
                    key={pc.id}
                    onClick={() => onPcClick(pc)}
                    className="billing-card"
                    style={{
                        background: pc.active ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : '#fff',
                        borderRadius: '24px',
                        padding: '1.5rem',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        boxShadow: pc.active ? '0 20px 25px -5px rgba(0, 0, 0, 0.2)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                        color: pc.active ? '#fff' : 'var(--text-main)',
                        minHeight: '180px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Workstation
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '2px' }}>{pc.id}</h3>
                        </div>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: pc.active ? 'rgba(16, 185, 129, 0.2)' : '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: pc.active ? '#10b981' : '#94a3b8'
                        }}>
                            <i className={`fas ${pc.active ? 'fa-desktop' : 'fa-power-off'}`}></i>
                        </div>
                    </div>

                    {pc.active ? (
                        <div style={{ marginTop: '1rem' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {pc.userName}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#10b981' }}>
                                    <i className="fas fa-clock" style={{ marginRight: '6px' }}></i>
                                    {pc.duration}
                                </div>
                                <div style={{ fontWeight: 900, fontSize: '1rem', color: '#fff' }}>
                                    {formatCurrency(pc.cost)}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            border: '2px dashed #e2e8f0',
                            borderRadius: '12px',
                            padding: '8px',
                            textAlign: 'center',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: '#94a3b8'
                        }}>
                            READY
                        </div>
                    )}

                    {/* Decorative badge for active status */}
                    {pc.active && (
                        <div style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            background: '#10b981',
                            color: '#fff',
                            padding: '4px 12px',
                            borderRadius: '50px',
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            boxShadow: '0 4px 10px rgba(16, 185, 129, 0.4)'
                        }}>
                            IN USE
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
