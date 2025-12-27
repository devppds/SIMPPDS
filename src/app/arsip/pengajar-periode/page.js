'use client';
import React, { useState, useEffect } from 'react';
import { apiCall } from '@/lib/utils';
import SortableTable from '@/components/SortableTable';

export default function PengajarPeriodePage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => { loadData(); }, []);
    const loadData = async () => { setLoading(true); try { const res = await apiCall('getData', 'GET', { type: 'arsip_pengajar_periode' }); setData(res || []); } catch (e) { console.error(e); } finally { setLoading(false); } };
    const displayData = data.filter(d => (d.nama || '').toLowerCase().includes(search.toLowerCase()) || (d.kelas_ampu || '').toLowerCase().includes(search.toLowerCase()));

    const columns = [
        { key: 'foto_pengajar', label: 'Foto', sortable: false, width: '80px', render: (row) => <img src={row.foto_pengajar || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.nama)}&background=1e3a8a&color=fff&bold=true`} alt={row.nama} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} /> },
        { key: 'nama', label: 'Nama', render: (row) => <div><div style={{ fontWeight: 800 }}>{row.nama}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.periode_mulai} - {row.periode_selesai}</div></div> },
        { key: 'kelas_ampu', label: 'Kelas Ampu', render: (row) => <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{row.kelas_ampu}</span> }
    ];

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header"><div><h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}><i className="fas fa-chalkboard-teacher" style={{ marginRight: '10px' }}></i>Arsip Pengajar Per-Periode</h2><p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total {displayData.length} pengajar tercatat.</p></div></div>
                <div className="table-controls" style={{ padding: '1rem 1.5rem' }}><div className="search-wrapper"><i className="fas fa-search"></i><input type="text" className="search-input" placeholder="Cari nama atau kelas..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
                <SortableTable columns={columns} data={displayData} loading={loading} emptyMessage="Belum ada arsip pengajar." />
            </div>
        </div>
    );
}
