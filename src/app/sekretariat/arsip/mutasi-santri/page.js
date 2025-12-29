'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { formatDate } from '@/lib/utils';
import { useDataManagement } from '@/hooks/useDataManagement';
import { apiCall } from '@/lib/utils';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';

export default function MutasiSantriPage() {
    const [filterStatus, setFilterStatus] = useState('Semua');

    // ✨ Use Universal Data Hook
    const {
        data, setData, loading, setLoading, search, setSearch,
        isViewModalOpen, setIsViewModalOpen,
        viewData, openView
    } = useDataManagement('santri');

    const loadMutasi = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'santri' });
            const mutasi = (res || []).filter(s => s.status_santri === 'Boyong' || s.status_santri === 'Pindah');
            setData(mutasi);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [setData, setLoading]);

    useEffect(() => {
        loadMutasi();
    }, [loadMutasi]);

    const displayData = data.filter(d => {
        const matchSearch = (d.nama_siswa || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.stambuk_pondok || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.pindah_ke || '').toLowerCase().includes(search.toLowerCase());
        const matchFilter = filterStatus === 'Semua' || d.status_santri === filterStatus;
        return matchSearch && matchFilter;
    });

    const columns = [
        {
            key: 'foto_santri', label: 'Foto', sortable: false, width: '80px', render: (row) => (
                <img src={row.foto_santri || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.nama_siswa)}&background=1e3a8a&color=fff&bold=true`}
                    style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
            )
        },
        {
            key: 'nama_siswa', label: 'Nama Santri', render: (row) => (
                <div><div style={{ fontWeight: 800 }}>{row.nama_siswa}</div><div style={{ fontSize: '0.7rem' }}>{row.stambuk_pondok}</div></div>
            )
        },
        {
            key: 'status_santri', label: 'Status', render: (row) => (
                <span className="th-badge" style={{
                    background: row.status_santri === 'Boyong' ? '#fffbeb' : '#fee2e2',
                    color: row.status_santri === 'Boyong' ? '#9a3412' : '#991b1b'
                }}>{row.status_santri}</span>
            )
        },
        { key: 'pindah_ke', label: 'Tujuan Pindah', render: (row) => row.pindah_ke || '-' },
        { key: 'tahun_pindah', label: 'Tahun', render: (row) => row.tahun_pindah || '-' },
        {
            key: 'actions', label: 'Opsi', sortable: false, width: '100px', render: (row) => (
                <button className="btn-vibrant btn-vibrant-purple" onClick={() => openView(row)} title="Detail"><i className="fas fa-eye"></i></button>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Arsip Santri Keluar</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mencatat {displayData.length} santri boyong/pindah.</p>
                    </div>
                </div>

                <div className="table-controls" style={{ padding: '1rem 1.5rem' }}>
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input type="text" className="search-input" placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <select className="form-control" style={{ width: '200px' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="Semua">Semua Status</option><option value="Boyong">Boyong</option><option value="Pindah">Pindah</option>
                    </select>
                </div>

                <SortableTable columns={columns} data={displayData} loading={loading} emptyMessage="Belum ada data mutasi santri." />
            </div>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Mutasi" width="600px" footer={<button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Selesai</button>}>
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                                <img src={viewData.foto_santri || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewData.nama_siswa)}&background=1e3a8a&color=fff&bold=true`} style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid var(--primary-light)' }} alt="" />
                            </div>
                            <h2 style={{ fontWeight: 900 }}>{viewData.nama_siswa}</h2>
                            <p className="th-badge">{viewData.stambuk_pondok}</p>
                            <div style={{ marginTop: '10px' }}><span className="th-badge">{viewData.status_santri}</span></div>
                        </div>
                        <div className="form-grid" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '15px' }}>
                            <div><small>Kamar Terakhir</small><div style={{ fontWeight: 700 }}>{viewData.kamar}</div></div>
                            <div><small>Kelas Terakhir</small><div style={{ fontWeight: 700 }}>{viewData.kelas}</div></div>
                            {viewData.status_santri === 'Pindah' && <div><small>Pindah Ke</small><div style={{ fontWeight: 700 }}>{viewData.pindah_ke || '-'}</div></div>}
                            {viewData.status_santri === 'Boyong' && <div><small>Tanggal Boyong</small><div style={{ fontWeight: 700 }}>{viewData.tanggal_boyong ? formatDate(viewData.tanggal_boyong) : '-'}</div></div>}
                            <div><small>Nama Ayah</small><div style={{ fontWeight: 700 }}>{viewData.nama_ayah}</div></div>
                            <div><small>Alamat</small><div style={{ fontSize: '0.85rem' }}>{viewData.desa_kelurahan}, {viewData.kecamatan}</div></div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
