'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';

export default function MutasiSantriPage() {
    const { isAdmin } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('Semua');
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'santri' });
            // Filter santri Boyong atau Pindah
            const mutasi = (res || []).filter(s => s.status_santri === 'Boyong' || s.status_santri === 'Pindah');
            setData(mutasi);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openViewModal = (item) => {
        setViewData(item);
        setIsViewModalOpen(true);
    };

    const displayData = data.filter(d => {
        const matchSearch = (d.nama_siswa || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.stambuk_pondok || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.pindah_ke || '').toLowerCase().includes(search.toLowerCase());

        const matchFilter = filterStatus === 'Semua' || d.status_santri === filterStatus;

        return matchSearch && matchFilter;
    });

    const columns = [
        {
            key: 'foto_santri',
            label: 'Foto',
            sortable: false,
            width: '80px',
            render: (row) => (
                <img
                    src={row.foto_santri || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.nama_siswa)}&background=1e3a8a&color=fff&bold=true`}
                    alt={row.nama_siswa}
                    style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                />
            )
        },
        {
            key: 'nama_siswa',
            label: 'Nama Santri',
            render: (row) => (
                <div>
                    <div style={{ fontWeight: 800 }}>{row.nama_siswa}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.stambuk_pondok}</div>
                </div>
            )
        },
        {
            key: 'status_santri',
            label: 'Status',
            render: (row) => (
                <span className="th-badge" style={{
                    background: row.status_santri === 'Boyong' ? '#fffbeb' : '#fee2e2',
                    color: row.status_santri === 'Boyong' ? '#9a3412' : '#991b1b'
                }}>
                    {row.status_santri}
                </span>
            )
        },
        { key: 'pindah_ke', label: 'Pindah Ke', render: (row) => row.pindah_ke || '-' },
        { key: 'tahun_pindah', label: 'Tahun', render: (row) => row.tahun_pindah || '-' },
        { key: 'tanggal_boyong', label: 'Tanggal Boyong', render: (row) => row.tanggal_boyong ? formatDate(row.tanggal_boyong) : '-' },
        {
            key: 'actions',
            label: 'Aksi',
            sortable: false,
            width: '100px',
            render: (row) => (
                <button className="btn-vibrant btn-vibrant-purple" onClick={() => openViewModal(row)} title="Lihat Detail">
                    <i className="fas fa-eye"></i>
                </button>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                            <i className="fas fa-exchange-alt" style={{ marginRight: '10px' }}></i>
                            Arsip Santri Boyong/Pindah
                        </h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Total {displayData.length} santri tercatat.
                        </p>
                    </div>
                </div>

                <div className="table-controls" style={{ padding: '1rem 1.5rem' }}>
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Cari nama, stambuk, atau tujuan pindah..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="form-control"
                        style={{ width: '200px', fontWeight: 700 }}
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="Semua">Semua Status</option>
                        <option value="Boyong">Boyong</option>
                        <option value="Pindah">Pindah</option>
                    </select>
                </div>

                <SortableTable
                    columns={columns}
                    data={displayData}
                    loading={loading}
                    emptyMessage="Belum ada data mutasi santri."
                />
            </div>

            {/* Modal View Detail */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Detail Mutasi Santri"
            >
                {viewData && (
                    <div style={{ padding: '1rem' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <img
                                src={viewData.foto_santri || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewData.nama_siswa)}&background=1e3a8a&color=fff&bold=true`}
                                alt={viewData.nama_siswa}
                                style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <h3 style={{ marginTop: '1rem', fontWeight: 800 }}>{viewData.nama_siswa}</h3>
                            <p style={{ color: 'var(--text-muted)' }}>{viewData.stambuk_pondok}</p>
                            <span className="th-badge" style={{
                                background: viewData.status_santri === 'Boyong' ? '#fffbeb' : '#fee2e2',
                                color: viewData.status_santri === 'Boyong' ? '#9a3412' : '#991b1b',
                                padding: '6px 16px',
                                fontSize: '0.9rem'
                            }}>
                                {viewData.status_santri}
                            </span>
                        </div>
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            <div><strong>Kamar Terakhir:</strong> {viewData.kamar}</div>
                            <div><strong>Kelas Terakhir:</strong> {viewData.kelas}</div>
                            <div><strong>Tahun Masuk:</strong> {viewData.tahun_masuk}</div>
                            {viewData.status_santri === 'Pindah' && (
                                <>
                                    <div><strong>Pindah Ke:</strong> {viewData.pindah_ke || '-'}</div>
                                    <div><strong>Tahun Pindah:</strong> {viewData.tahun_pindah || '-'}</div>
                                </>
                            )}
                            {viewData.status_santri === 'Boyong' && (
                                <div><strong>Tanggal Boyong:</strong> {viewData.tanggal_boyong ? formatDate(viewData.tanggal_boyong) : '-'}</div>
                            )}
                            <div><strong>Nama Ayah:</strong> {viewData.nama_ayah}</div>
                            <div><strong>No. Telp Ayah:</strong> {viewData.no_telp_ayah}</div>
                            <div><strong>Alamat:</strong> {viewData.desa_kelurahan}, {viewData.kecamatan}, {viewData.kota_kabupaten}</div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
