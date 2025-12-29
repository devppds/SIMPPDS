'use client';

import React, { useState, useMemo } from 'react';

export default function SortableTable({
    columns,
    data,
    loading = false,
    emptyMessage = "Tidak ada data.",
    onRowClick = null
}) {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const sortedData = useMemo(() => {
        if (!sortConfig.key) return data;

        const sorted = [...data].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];

            // Handle null/undefined
            if (aVal == null) return 1;
            if (bVal == null) return -1;

            // Numeric comparison
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
            }

            // String comparison
            const aStr = String(aVal).toLowerCase();
            const bStr = String(bVal).toLowerCase();

            if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [data, sortConfig]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) {
            return <i className="fas fa-sort" style={{ opacity: 0.3, marginLeft: '8px' }}></i>;
        }
        return sortConfig.direction === 'asc'
            ? <i className="fas fa-sort-up" style={{ marginLeft: '8px', color: 'var(--primary)' }}></i>
            : <i className="fas fa-sort-down" style={{ marginLeft: '8px', color: 'var(--primary)' }}></i>;
    };

    return (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                style={{
                                    cursor: col.sortable !== false ? 'pointer' : 'default',
                                    userSelect: 'none',
                                    width: col.width || 'auto'
                                }}
                                onClick={() => col.sortable !== false && requestSort(col.key)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: col.align || 'left' }}>
                                    {col.label}
                                    {col.sortable !== false && getSortIcon(col.key)}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={columns.length} style={{ textAlign: 'center', padding: '4rem' }}>
                                Sinkronisasi Data...
                            </td>
                        </tr>
                    ) : sortedData.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        sortedData.map((row, idx) => (
                            <tr
                                key={row.id || idx}
                                onClick={() => onRowClick && onRowClick(row)}
                                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                            >
                                {columns.map((col) => (
                                    <td key={col.key} style={{ textAlign: col.align || 'left', width: col.width || 'auto' }}>
                                        {col.render ? col.render(row) : row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
