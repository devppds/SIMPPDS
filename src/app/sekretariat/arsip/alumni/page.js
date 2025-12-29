'use client';

import React, { useEffect, useCallback } from 'react';
import { useDataManagement } from '@/hooks/useDataManagement';
import { apiCall } from '@/lib/utils';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';

export default function AlumniPage() {
    // ✨ Use Universal Data Hook
    const {
        data, setData, loading, setLoading, search, setSearch,
        isViewModalOpen, setIsViewModalOpen,
        viewData, openView
    } = useDataManagement('santri'); // Read from santri table

    const loadAlumni = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'santri' });
            const alumni = (res || []).filter(s => s.status_santri === 'Lulus');
            setData(alumni);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [setData, setLoading]);

    useEffect(() => {
        loadAlumni();
    }, [loadAlumni]);

    const displayData = data.filter(d =>
        (d.nama_siswa || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.stambuk_pondok || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.tahun_pindah || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        {
            key: 'foto_santri', label: 'Foto', sortable: false, width: '80px', render: (row) => (
                <img
                    src={row.foto_santri || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.nama_siswa)}&background=1e3a8a&color=fff&bold=true`}
                    alt="" style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }}
                />
            )
        },
        {
            key: 'nama_siswa', label: 'Nama Alumni', render: (row) => (
                <div><div style={{ fontWeight: 800 }}>{row.nama_siswa}</div><div style={{ fontSize: '0.7rem' }}>{row.stambuk_pondok}</div></div>
            )
        },
        { key: 'kamar', label: 'Asrama' },
        { key: 'kelas', label: 'Kelas' },
        { key: 'tahun_pindah', label: 'Lulusan', render: (row) => row.tahun_pindah || '-' },
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
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Arsip Alumni</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mencatat {displayData.length} alumni.</p>
                    </div>
                </div>

                <div className="table-controls" style={{ padding: '1rem 1.5rem' }}>
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input type="text" className="search-input" placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>

                <SortableTable columns={columns} data={displayData} loading={loading} emptyMessage="Belum ada data alumni." />
            </div>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Alumni" width="600px" footer={<button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Selesai</button>}>
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                                <img src={viewData.foto_santri || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewData.nama_siswa)}&background=1e3a8a&color=fff&bold=true`} style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid var(--primary-light)' }} alt="" />
                            </div>
                            <h2 style={{ fontWeight: 900 }}>{viewData.nama_siswa}</h2>
                            <p className="th-badge">{viewData.stambuk_pondok}</p>
                        </div>
                        <div className="form-grid" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '15px' }}>
                            <div><small>Lulus Tahun</small><div style={{ fontWeight: 700 }}>{viewData.tahun_pindah || '-'}</div></div>
                            <div><small>Kelas Terakhir</small><div style={{ fontWeight: 700 }}>{viewData.kelas}</div></div>
                            <div><small>Nama Ayah</small><div style={{ fontWeight: 700 }}>{viewData.nama_ayah}</div></div>
                            <div><small>Kota Asal</small><div style={{ fontWeight: 700 }}>{viewData.kota_kabupaten}</div></div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
