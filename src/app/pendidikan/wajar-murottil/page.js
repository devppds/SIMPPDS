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
        // Placeholder for data fetching
        setLoading(false);
    }, []);

    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => formatDate(row.tanggal) },
        { key: 'nama_santri', label: 'Nama Santri' },
        { key: 'kelas', label: 'Kelas' },
        { key: 'materi', label: 'Materi / Surah' },
        { key: 'nilai', label: 'Nilai', render: (row) => <strong>{row.nilai}</strong> },
        { key: 'keterangan', label: 'Keterangan' }
    ];

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                            <i className="fas fa-microphone-alt" style={{ marginRight: '10px' }}></i>
                            Wajar-Murottil
                        </h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manajemen nilai dan progres hafalan/bacaan santri.</p>
                    </div>
                    <button className="btn btn-primary btn-sm">
                        <i className="fas fa-plus"></i> Tambah Progres
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
                    data={data}
                    loading={loading}
                    emptyMessage="Belum ada data progres Wajar-Murottil."
                />
            </div>
        </div>
    );
}
