'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';

export default function AlumniPage() {
    const { isAdmin } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'santri' });
            // Filter hanya santri dengan status Lulus
            const alumni = (res || []).filter(s => s.status_santri === 'Lulus');
            setData(alumni);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openViewModal = (item) => {
        setViewData(item);
        setIsViewModalOpen(true);
    };

    const displayData = data.filter(d =>
        (d.nama_siswa || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.stambuk_pondok || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.tahun_pindah || '').toLowerCase().includes(search.toLowerCase())
    );

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
            label: 'Nama Alumni',
            render: (row) => (
                <div>
                    <div style={{ fontWeight: 800 }}>{row.nama_siswa}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.stambuk_pondok}</div>
                </div>
            )
        },
        { key: 'kamar', label: 'Kamar (Terakhir)' },
        { key: 'kelas', label: 'Kelas (Terakhir)' },
        { key: 'tahun_pindah', label: 'Tahun Lulus', render: (row) => row.tahun_pindah || '-' },
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
                            <i className="fas fa-user-graduate" style={{ marginRight: '10px' }}></i>
                            Arsip Alumni Santri
                        </h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Total {displayData.length} alumni tercatat.
                        </p>
                    </div>
                </div>

                <div className="table-controls" style={{ padding: '1rem 1.5rem' }}>
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Cari nama alumni, stambuk, atau tahun lulus..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <SortableTable
                    columns={columns}
                    data={displayData}
                    loading={loading}
                    emptyMessage="Belum ada data alumni."
                />
            </div>

            {/* Modal View Detail */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Detail Alumni"
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
                        </div>
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            <div><strong>Kamar Terakhir:</strong> {viewData.kamar}</div>
                            <div><strong>Kelas Terakhir:</strong> {viewData.kelas}</div>
                            <div><strong>Tahun Masuk:</strong> {viewData.tahun_masuk}</div>
                            <div><strong>Tahun Lulus:</strong> {viewData.tahun_pindah || '-'}</div>
                            <div><strong>NIK:</strong> {viewData.nik}</div>
                            <div><strong>Nama Ayah:</strong> {viewData.nama_ayah}</div>
                            <div><strong>Nama Ibu:</strong> {viewData.nama_ibu}</div>
                            <div><strong>Alamat:</strong> {viewData.desa_kelurahan}, {viewData.kecamatan}, {viewData.kota_kabupaten}</div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
