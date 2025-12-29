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

            <style jsx>{`
                .data-view-container {
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
                    border: 1px solid #f1f5f9;
                    border-radius: 20px;
                    overflow: hidden;
                }
                .card-header {
                    padding: 1.5rem 2rem;
                    border-bottom: 1px solid #f1f5f9;
                    background: #fff;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                .card-actions {
                    display: flex;
                    gap: 10px;
                }
                .table-controls-container {
                    padding: 1rem 2rem;
                    background: #f8fafc;
                    border-bottom: 1px solid #f1f5f9;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: wrap;
                }
                .search-box-wrapper {
                    flex: 1 1 300px;
                }
                .filters-wrapper {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    align-items: center;
                }
                .table-wrapper-inner {
                    padding: 0 1rem;
                }

                @media (max-width: 640px) {
                    .card-header, .table-controls-container {
                        padding: 1rem;
                    }
                    .table-wrapper-inner {
                        padding: 0 0.5rem;
                    }
                    .search-box-wrapper {
                        flex: 1 1 100%;
                    }
                }
            `}</style>
        </div>
    );
}
