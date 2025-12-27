'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';

export default function WajarMurottilPage() {
    const { isAdmin } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Placeholder: Using 'pendidikan' type for now as 'wajar_murottil' table might not exist yet
            const res = await apiCall('getData', 'GET', { type: 'pendidikan' });
            setData(res || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => formatDate(row.tanggal) },
        { key: 'nama_santri', label: 'Nama Santri' },
        {
            key: 'materi',
            label: 'Materi / Surah',
            render: (row) => row.materi || row.kegiatan || '-'
        },
        {
            key: 'nilai',
            label: 'Nilai',
            render: (row) => <strong style={{ color: 'var(--primary)' }}>{row.nilai}</strong>
        },
        { key: 'petugas', label: 'Penguji', render: (row) => row.ustadz || '-' }
    ];

    const displayData = data.filter(d =>
        (d.nama_santri || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                            <i className="fas fa-microphone-alt" style={{ marginRight: '10px' }}></i>
                            Wajar-Murottil
                        </h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Monitoring progres bacaan dan hafalan santri.</p>
                    </div>
                    <button className="btn btn-primary btn-sm">
                        <i className="fas fa-plus"></i> Input Nilai Baru
                    </button>
                </div>

                <div className="table-controls" style={{ padding: '1rem 1.5rem' }}>
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Cari nama santri..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <SortableTable
                    columns={columns}
                    data={displayData}
                    loading={loading}
                    emptyMessage="Belum ada data Wajar-Murottil."
                />
            </div>
        </div>
    );
}
