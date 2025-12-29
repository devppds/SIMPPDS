'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { formatDate } from '@/lib/utils';
import { useDataManagement } from '@/hooks/useDataManagement';
import { apiCall } from '@/lib/utils';
import Modal from '@/components/Modal';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { SelectInput } from '@/components/FormInput';

export default function MutasiSantriPage() {
    const [filterStatus, setFilterStatus] = useState('Semua');

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

    useEffect(() => { loadMutasi(); }, [loadMutasi]);

    const displayData = useMemo(() => {
        return data.filter(d => {
            const matchSearch = (d.nama_siswa || '').toLowerCase().includes(search.toLowerCase()) ||
                (d.stambuk_pondok || '').toLowerCase().includes(search.toLowerCase()) ||
                (d.pindah_ke || '').toLowerCase().includes(search.toLowerCase());
            const matchFilter = filterStatus === 'Semua' || d.status_santri === filterStatus;
            return matchSearch && matchFilter;
        });
    }, [data, search, filterStatus]);

    const stats = useMemo(() => [
        { title: 'Total Mutasi', value: data.length, icon: 'fas fa-exchange-alt', color: 'var(--primary)' },
        { title: 'Santri Boyong', value: data.filter(d => d.status_santri === 'Boyong').length, icon: 'fas fa-walking', color: 'var(--warning)' },
        { title: 'Santri Pindah', value: data.filter(d => d.status_santri === 'Pindah').length, icon: 'fas fa-shipping-fast', color: 'var(--danger)' }
    ], [data]);

    const columns = [
        {
            key: 'foto_santri', label: 'Foto', sortable: false, width: '80px', render: (row) => (
                <img src={row.foto_santri || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.nama_siswa)}&background=1e3a8a&color=fff&bold=true`}
                    style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
            )
        },
        {
            key: 'nama_siswa', label: 'Nama Santri', render: (row) => (
                <div><div style={{ fontWeight: 800 }}>{row.nama_siswa}</div><small style={{ color: 'var(--text-muted)' }}>{row.stambuk_pondok}</small></div>
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
        { key: 'pindah_ke', label: 'Keterangan Mutasi', render: (row) => row.pindah_ke || (row.status_santri === 'Boyong' ? 'Berhenti/Boyong' : '-') },
        { key: 'tahun_pindah', label: 'Thn', width: '80px', render: (row) => row.tahun_pindah || '-' },
        {
            key: 'actions', label: 'Aksi', sortable: false, width: '100px', render: (row) => (
                <div className="table-actions">
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openView(row)} title="Detail"><i className="fas fa-eye"></i></button>
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Arsip Santri Keluar (Mutasi)" subJudul="Log perpindahan dan pemberhentian status santri." hideOnScreen={true} />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Log Mutasi Santri"
                subtitle={`Mencatat riwayat ${displayData.length} santri keluar.`}
                searchProps={{ value: search, onChange: (e) => setSearch(e.target.value) }}
                filters={<SelectInput value={filterStatus} onChange={e => setFilterStatus(e.target.value)} options={['Semua', 'Boyong', 'Pindah']} style={{ width: '180px', marginBottom: 0 }} />}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Riwayat Mutasi" width="650px">
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                                <img src={viewData.foto_santri || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewData.nama_siswa)}&background=1e3a8a&color=fff&bold=true`} style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid var(--primary-light)', objectFit: 'cover' }} alt="" />
                            </div>
                            <h2 style={{ fontWeight: 900, color: 'var(--primary-dark)' }}>{viewData.nama_siswa}</h2>
                            <p className="th-badge" style={{ padding: '4px 12px' }}>{viewData.status_santri.toUpperCase()}</p>
                        </div>

                        <div className="form-grid" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                            <div><small style={{ fontWeight: 800, color: 'var(--text-muted)' }}>Stambuk</small><div style={{ fontWeight: 700 }}>{viewData.stambuk_pondok}</div></div>
                            <div><small style={{ fontWeight: 800, color: 'var(--text-muted)' }}>Tahun Mutasi</small><div style={{ fontWeight: 700 }}>{viewData.tahun_pindah || '-'}</div></div>
                            <div style={{ gridColumn: 'span 2' }}><small style={{ fontWeight: 800, color: 'var(--text-muted)' }}>{viewData.status_santri === 'Pindah' ? 'Pindah Ke' : 'Tanggal Boyong'}</small>
                                <div style={{ fontWeight: 800, color: 'var(--primary)' }}>
                                    {viewData.status_santri === 'Pindah' ? (viewData.pindah_ke || '-') : (viewData.tanggal_boyong ? formatDate(viewData.tanggal_boyong) : '-')}
                                </div>
                            </div>
                            <hr style={{ gridColumn: 'span 2', margin: '0.5rem 0', opacity: 0.1 }} />
                            <div><small style={{ fontWeight: 800, color: 'var(--text-muted)' }}>Kamar Terakhir</small><div>{viewData.kamar}</div></div>
                            <div><small style={{ fontWeight: 800, color: 'var(--text-muted)' }}>Kelas Terakhir</small><div>{viewData.kelas}</div></div>
                            <div><small style={{ fontWeight: 800, color: 'var(--text-muted)' }}>Alasan Keluar</small><div>{viewData.alasan_nonaktif || '-'}</div></div>
                        </div>

                        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                            <button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Tutup Detail</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
