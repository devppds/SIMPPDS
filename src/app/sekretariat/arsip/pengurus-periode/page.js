'use client';

import React from 'react';
import { useDataManagement } from '@/hooks/useDataManagement';
import SortableTable from '@/components/SortableTable';

export default function PengurusPeriodePage() {
    // ✨ Use Universal Data Hook
    const {
        data, loading, search, setSearch
    } = useDataManagement('arsip_pengurus_periode');

    const displayData = data.filter(d =>
        (d.nama || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.jabatan || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        {
            key: 'foto_pengurus', label: 'Foto', sortable: false, width: '80px', render: (row) => (
                <img src={row.foto_pengurus || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.nama)}&background=1e3a8a&color=fff&bold=true`}
                    style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
            )
        },
        {
            key: 'nama', label: 'Nama', render: (row) => (
                <div><div style={{ fontWeight: 800 }}>{row.nama}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Periode: {row.periode_mulai} - {row.periode_selesai}</div></div>
            )
        },
        { key: 'jabatan', label: 'Jabatan', render: (row) => <span className="th-badge">{row.jabatan}</span> },
        { key: 'divisi', label: 'Divisi' }
    ];

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Arsip Pengurus</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mencatat {displayData.length} pengurus per periode.</p>
                    </div>
                </div>
                <div className="table-controls" style={{ padding: '1rem 1.5rem' }}>
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input type="text" className="search-input" placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>
                <SortableTable columns={columns} data={displayData} loading={loading} emptyMessage="Belum ada arsip pengurus." />
            </div>
        </div>
    );
}
