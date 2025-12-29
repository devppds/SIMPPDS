'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';
import Autocomplete from '@/components/Autocomplete';

export default function PendidikanPage() {
    const [santriOptions, setSantriOptions] = useState([]);

    // ✨ Use Universal Data Hook
    const {
        data, setData, loading, setLoading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, formData, setFormData, editId,
        handleSave, handleDelete, openModal, openView,
        isAdmin
    } = useDataManagement('pendidikan', {
        tanggal: new Date().toISOString().split('T')[0],
        nama_santri: '', kelas: '', kegiatan: '', nilai: '',
        kehadiran: 'Hadir', keterangan: '', ustadz: ''
    });

    const loadEnrichedData = useCallback(async () => {
        setLoading(true);
        try {
            const [res, resSantri] = await Promise.all([
                apiCall('getData', 'GET', { type: 'pendidikan' }),
                apiCall('getData', 'GET', { type: 'santri' })
            ]);
            setData(res || []);
            setSantriOptions(resSantri || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [setData, setLoading]);

    useEffect(() => {
        loadEnrichedData();
    }, [loadEnrichedData]);

    const displayData = data.filter(d =>
        (d.nama_santri || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.kegiatan || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => formatDate(row.tanggal) },
        { key: 'nama_santri', label: 'Nama Santri', render: (row) => <span style={{ fontWeight: 800 }}>{row.nama_santri}</span> },
        { key: 'kelas', label: 'Kelas', render: (row) => <span className="th-badge">{row.kelas || '-'}</span> },
        { key: 'kegiatan', label: 'Kegiatan' },
        { key: 'nilai', label: 'Nilai', render: (row) => <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{row.nilai}</span> },
        { key: 'kehadiran', label: 'Kehadiran' },
        { key: 'ustadz', label: 'Pengajar' },
        {
            key: 'actions',
            label: 'Aksi',
            sortable: false,
            width: '150px',
            render: (row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openView(row)} title="Detail"><i className="fas fa-eye"></i></button>
                    <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)} title="Edit"><i className="fas fa-edit"></i></button>
                    {isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => handleDelete(row.id, 'Hapus data pendidikan ini?')} title="Hapus"><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Agenda & Data Pendidikan</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mencatat {displayData.length} agenda kegiatan pendidikan.</p>
                    </div>
                    <div className="card-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                            <i className="fas fa-plus"></i> Input Nilai / Agenda
                        </button>
                    </div>
                </div>

                <div className="table-controls">
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input type="text" className="search-input" placeholder="Cari nama santri atau kegiatan..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>

                <SortableTable columns={columns} data={displayData} loading={loading} emptyMessage="Belum ada data pendidikan." />
            </div>

            {/* Modal Input/Edit */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? "Update Data Pendidikan" : "Input Pendidikan Baru"}
                footer={(
                    <>
                        <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Batal</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
                            {submitting ? 'Memproses...' : 'Simpan'}
                        </button>
                    </>
                )}
            >
                <form onSubmit={handleSave}>
                    <div className="form-group">
                        <label className="form-label">Nama Santri</label>
                        <Autocomplete
                            options={santriOptions}
                            value={formData.nama_santri}
                            onChange={(val) => setFormData({ ...formData, nama_santri: val })}
                            onSelect={(s) => setFormData({ ...formData, nama_santri: s.nama_siswa, kelas: s.kelas })}
                            placeholder="Ketik nama santri untuk mencari..."
                            required
                        />
                    </div>
                    <div className="form-grid">
                        <div className="form-group"><label className="form-label">Nama Kegiatan</label><input type="text" className="form-control" value={formData.kegiatan} onChange={e => setFormData({ ...formData, kegiatan: e.target.value })} required /></div>
                        <div className="form-group"><label className="form-label">Tanggal</label><input type="date" className="form-control" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} /></div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group"><label className="form-label">Nilai / Hasil</label><input type="text" className="form-control" value={formData.nilai} onChange={e => setFormData({ ...formData, nilai: e.target.value })} /></div>
                        <div className="form-group">
                            <label className="form-label">Kehadiran</label>
                            <select className="form-control" value={formData.kehadiran} onChange={e => setFormData({ ...formData, kehadiran: e.target.value })}>
                                <option value="Hadir">Hadir</option><option value="Izin">Izin</option><option value="Sakit">Sakit</option><option value="Alpha">Alpha</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group"><label className="form-label">Tenaga Pengajar</label><input type="text" className="form-control" value={formData.ustadz} onChange={e => setFormData({ ...formData, ustadz: e.target.value })} /></div>
                    <div className="form-group"><label className="form-label">Keterangan</label><textarea className="form-control" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} rows="2"></textarea></div>
                </form>
            </Modal>

            {/* Modal View Detail */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Catatan Pendidikan" width="600px" footer={<button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Selesai</button>}>
                {viewData && (() => {
                    const student = santriOptions.find(s => s.nama_siswa === viewData.nama_santri);
                    return (
                        <div className="detail-view">
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '4px solid var(--primary-light)' }}>
                                        {student?.foto_santri ? <img src={student.foto_santri} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <div style={{ background: '#f1f5f9', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-user fa-3x" style={{ color: '#cbd5e1' }}></i></div>}
                                    </div>
                                </div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary-dark)' }}>{viewData.nama_santri}</h2>
                                <p style={{ color: 'var(--text-muted)' }}>{viewData.kelas} • <span className="th-badge">{viewData.kehadiran}</span></p>
                            </div>
                            <div className="form-grid" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px' }}>
                                <div><small>Kegiatan</small><div style={{ fontWeight: 800 }}>{viewData.kegiatan}</div></div>
                                <div><small>Tanggal</small><div style={{ fontWeight: 600 }}>{formatDate(viewData.tanggal)}</div></div>
                                <div><small>Nilai</small><div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>{viewData.nilai || '-'}</div></div>
                                <div><small>Pengajar</small><div style={{ fontWeight: 600 }}>{viewData.ustadz || '-'}</div></div>
                            </div>
                        </div>
                    );
                })()}
            </Modal>
        </div>
    );
}
