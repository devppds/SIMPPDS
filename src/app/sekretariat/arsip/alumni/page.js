'use client';

import React, { useEffect, useCallback, useMemo } from 'react';
import { useDataManagement } from '@/hooks/useDataManagement';
import { apiCall } from '@/lib/utils';
import Modal from '@/components/Modal';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';

export default function AlumniPage() {
    const {
        data, setData, loading, setLoading, search, setSearch,
        isViewModalOpen, setIsViewModalOpen,
        viewData, openView
    } = useDataManagement('santri');

    const loadAlumni = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'santri' });
            const alumni = (res || []).filter(s => s.status_santri === 'Lulus');
            setData(alumni);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [setData, setLoading]);

    useEffect(() => { loadAlumni(); }, [loadAlumni]);

    const displayData = useMemo(() => {
        return data.filter(d =>
            (d.nama_siswa || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.stambuk_pondok || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.tahun_pindah || '').toLowerCase().includes(search.toLowerCase())
        );
    }, [data, search]);

    const stats = useMemo(() => [
        { title: 'Total Alumni', value: data.length, icon: 'fas fa-user-graduate', color: 'var(--primary)' },
        { title: 'Angkatan Terakhir', value: [...new Set(data.map(d => d.tahun_pindah))].sort().reverse()[0] || '-', icon: 'fas fa-calendar-check', color: 'var(--success)' },
        { title: 'Status Arsip', value: 'Terverifikasi', icon: 'fas fa-shield-alt', color: 'var(--warning)' }
    ], [data]);

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
                <div><div style={{ fontWeight: 800 }}>{row.nama_siswa}</div><small style={{ color: 'var(--text-muted)' }}>{row.stambuk_pondok}</small></div>
            )
        },
        { key: 'kelas', label: 'Kelas Terakhir' },
        { key: 'tahun_pindah', label: 'Thn Lulus', render: (row) => <span className="th-badge">{row.tahun_pindah || '-'}</span> },
        {
            key: 'actions', label: 'Aksi', sortable: false, width: '100px', render: (row) => (
                <div className="table-actions">
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openView(row)} title="Lihat Profil"><i className="fas fa-eye"></i></button>
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Arsip Alumni Pondok Pesantren" subJudul="Database lulusan dan tokoh alumni santri." hideOnScreen={true} />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Database Alumni"
                subtitle={`Menampilkan ${displayData.length} data alumni terdaftar.`}
                searchProps={{ value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Cari nama atau stambuk..." }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Profil Alumni Santri" width="650px">
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <img src={viewData.foto_santri || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewData.nama_siswa)}&background=1e3a8a&color=fff&bold=true`}
                                    style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid var(--primary-light)', objectFit: 'cover' }} alt="" />
                                <div style={{ position: 'absolute', bottom: 5, right: 5, background: 'var(--success)', color: 'white', padding: '4px 8px', borderRadius: '20px', fontSize: '0.6rem', fontWeight: 800 }}>ALUMNI</div>
                            </div>
                            <h2 style={{ fontWeight: 900, marginTop: '1rem', color: 'var(--primary-dark)' }}>{viewData.nama_siswa}</h2>
                            <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{viewData.stambuk_pondok}</p>
                        </div>

                        <div className="form-grid" style={{ background: '#f8fafc', padding: '2rem', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                            <div><small style={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>Lulus Tahun</small><div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{viewData.tahun_pindah || '-'}</div></div>
                            <div><small style={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>Kelas Terakhir</small><div style={{ fontWeight: 700 }}>{viewData.kelas}</div></div>
                            <div><small style={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>Asal Sekolah</small><div style={{ fontWeight: 700 }}>{viewData.asal_sekolah || '-'}</div></div>
                            <div><small style={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>Kota Asal</small><div style={{ fontWeight: 700 }}>{viewData.kota_kabupaten}</div></div>
                            <div style={{ gridColumn: 'span 2' }}><small style={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>Nama Wali</small><div style={{ fontWeight: 700 }}>{viewData.nama_ayah}</div></div>
                        </div>

                        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                            <button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Kembali ke Daftar</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
