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
        <div className="card data-view-container animate-in" style={{ padding: '0', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
            {/* Header Bagian Atas */}
            <div className="card-header" style={{ padding: '2.5rem', borderBottom: '1px solid #f1f5f9', marginBottom: 0 }}>
                <div style={{ flex: 1 }}>
                    <h2 className="outfit" style={{
                        fontSize: '1.5rem',
                        fontWeight: 900,
                        color: 'var(--primary-dark)',
                        margin: 0,
                        letterSpacing: '-0.5px'
                    }}>
                        {title}
                    </h2>
                    {subtitle && (
                        <p style={{
                            fontSize: '1rem',
                            color: 'var(--text-muted)',
                            margin: '6px 0 0 0',
                            fontWeight: 500,
                            opacity: 0.8
                        }}>
                            {subtitle}
                        </p>
                    )}
                </div>
                {headerActions && (
                    <div className="card-actions" style={{ display: 'flex', gap: '1rem' }}>
                        {headerActions}
                    </div>
                )}
            </div>

            {/* Kontrol Tabel (Search & Filters) */}
            {(searchProps || filters) && (
                <div className="table-controls-container" style={{ padding: '2rem 2.5rem', background: '#fcfdfe', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    {searchProps && (
                        <div className="search-box-wrapper" style={{ flex: 1, maxWidth: '450px' }}>
                            <TextInput
                                {...searchProps}
                                style={{ marginBottom: 0, borderRadius: '14px' }}
                                icon="fas fa-search"
                                placeholder={searchProps.placeholder || "Cari data..."}
                            />
                        </div>
                    )}
                    {filters && (
                        <div className="filters-wrapper" style={{ display: 'flex', gap: '1rem', flex: 1, justifyContent: 'flex-end' }}>
                            {filters}
                        </div>
                    )}
                </div>
            )}

            {/* Bagian Tabel Utuh */}
            <div className="table-wrapper-inner" style={{ padding: '1rem' }}>
                <SortableTable {...tableProps} />
            </div>

        </div >
    );
}
