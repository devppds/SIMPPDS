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
        <div className="card data-view-container animate-in">
            {/* Header Bagian Atas */}
            <div className="card-header">
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
                    <div className="card-actions">
                        {headerActions}
                    </div>
                )}
            </div>

            {/* Kontrol Tabel (Search & Filters) */}
            {(searchProps || filters) && (
                <div className="table-controls-container">
                    {searchProps && (
                        <div className="search-box-wrapper">
                            <TextInput
                                {...searchProps}
                                style={{ marginBottom: 0 }}
                                icon="fas fa-search"
                                placeholder={searchProps.placeholder || "Cari data..."}
                            />
                        </div>
                    )}
                    {filters && (
                        <div className="filters-wrapper">
                            {filters}
                        </div>
                    )}
                </div>
            )}

            {/* Bagian Tabel Utuh */}
            <div className="table-wrapper-inner">
                <SortableTable {...tableProps} />
            </div>

        </div >
    );
}
