'use client';

import React from 'react';
import SortableTable from './SortableTable';
import { TextInput } from './FormInput';

/**
 * DataViewContainer - Wadah terpadu untuk tampilan data tabel (Satu Pintu)
 * Membungkus Card, Header, Search, dan SortableTable.
 */
export default function DataViewContainer({
    title,
    subtitle,
    headerActions,
    searchProps,
    filters,
    tableProps
}) {
    return (
        <div className="card animate-in" style={{
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #f1f5f9',
            borderRadius: '20px',
            overflow: 'hidden'
        }}>
            {/* Header Bagian Atas */}
            <div className="card-header" style={{
                padding: '1.5rem 2rem',
                borderBottom: '1px solid #f1f5f9',
                background: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div style={{ flex: 1 }}>
                    <h2 style={{
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: 'var(--primary-dark)',
                        margin: 0
                    }}>
                        {title}
                    </h2>
                    {subtitle && (
                        <p style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                            margin: '4px 0 0 0',
                            fontWeight: 500
                        }}>
                            {subtitle}
                        </p>
                    )}
                </div>
                {headerActions && (
                    <div className="card-actions" style={{ display: 'flex', gap: '10px' }}>
                        {headerActions}
                    </div>
                )}
            </div>

            {/* Kontrol Tabel (Search & Filters) */}
            {(searchProps || filters) && (
                <div className="table-controls" style={{
                    padding: '1rem 2rem',
                    background: '#f8fafc',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap'
                }}>
                    {searchProps && (
                        <div style={{ flex: '1 1 300px' }}>
                            <TextInput
                                {...searchProps}
                                style={{ marginBottom: 0 }}
                                icon="fas fa-search"
                                placeholder={searchProps.placeholder || "Cari data..."}
                            />
                        </div>
                    )}
                    {filters && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                            {filters}
                        </div>
                    )}
                </div>
            )}

            {/* Bagian Tabel Utuh */}
            <div style={{ padding: '0 1rem' }}>
                <SortableTable {...tableProps} />
            </div>
        </div>
    );
}
