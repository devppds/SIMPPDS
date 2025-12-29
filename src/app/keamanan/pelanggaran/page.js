'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { usePagePermission } from '@/lib/AuthContext'; // useAuth removed, handled by hook
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';
import Autocomplete from '@/components/Autocomplete';

export default function PelanggaranPage() {
    const { canEdit } = usePagePermission();

    // ✨ Use Universal Data Hook
    const {
        data, loading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, formData, setFormData, editId,
        handleSave, handleDelete, openModal, openView,
        isAdmin
    } = useDataManagement('keamanan', {
        tanggal: '',
        nama_santri: '', jenis_pelanggaran: 'Ringan', poin: '5',
        takzir: '', keterangan: '', petugas: ''
    });

    React.useEffect(() => {
        setFormData(prev => ({ ...prev, tanggal: new Date().toISOString().split('T')[0] }));
    }, [setFormData]);

    const [santriOptions, setSantriOptions] = useState([]);

    useEffect(() => {
        const fetchSantri = async () => {
            try {
                const res = await apiCall('getData', 'GET', { type: 'santri' });
                setSantriOptions(res || []);
            } catch (e) { console.error(e); }
        };
        fetchSantri();
    }, []);

    const displayData = data.filter(d =>
        (d.nama_santri || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => <span style={{ fontWeight: 600 }}>{formatDate(row.tanggal)}</span> },
        {
            key: 'nama_santri',
            label: 'Nama Santri',
            render: (row) => <span style={{ fontWeight: 800 }}>{row.nama_santri}</span>
        },
        { key: 'kelas', label: 'Kelas', render: (row) => <span className="th-badge">{row.kelas || '-'}</span> },
        { key: 'jenis_pelanggaran', label: 'Jenis Pelanggaran' },
        {
            key: 'poin',
            label: 'Poin',
            render: (row) => (
                <span style={{
                    fontWeight: 800,
                    color: row.poin >= 50 ? '#dc2626' : row.poin >= 20 ? '#f59e0b' : '#059669'
                }}>
                    {row.poin}
                </span>
            )
        },
        { key: 'takzir', label: 'Takzir' },
        { key: 'petugas', label: 'Petugas' },
        {
            key: 'actions',
            label: 'Aksi',
            sortable: false,
            width: '150px',
            render: (row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openView(row)} title="Detail"><i className="fas fa-eye"></i></button>
                    {canEdit && <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)} title="Edit"><i className="fas fa-edit"></i></button>}
                    {isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => handleDelete(row.id, 'Hapus catatan pelanggaran ini?')} title="Hapus"><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Ringkasan Kedisiplinan</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mencatat {displayData.length} pelanggaran santri.</p>
                    </div>
                    <div className="card-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => window.print()} title="Cetak Laporan">
                            <i className="fas fa-print"></i>
                        </button>
                        {canEdit && <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                            <i className="fas fa-plus"></i> Input Baru
                        </button>}
                    </div>
                </div>

                <div className="table-controls">
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
                    emptyMessage="Belum ada catatan pelanggaran."
                />
            </div>

            {/* Modal Input/Edit */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? "Pembaruan Catatan" : "Catat Pelanggaran"}
                footer={(
                    <>
                        <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Batal</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
                            {submitting ? 'Proses...' : 'Simpan'}
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
                        <div className="form-group">
                            <label className="form-label">Tanggal Kejadian</label>
                            <input type="date" className="form-control" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Jenis Pelanggaran</label>
                            <select className="form-control" value={formData.jenis_pelanggaran} onChange={e => setFormData({ ...formData, jenis_pelanggaran: e.target.value })}>
                                <option value="Ringan">Ringan</option>
                                <option value="Sedang">Sedang</option>
                                <option value="Berat">Berat</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Poin Pelanggaran</label>
                            <input type="number" className="form-control" value={formData.poin} onChange={e => setFormData({ ...formData, poin: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Petugas (Penindak)</label>
                            <input type="text" className="form-control" value={formData.petugas} onChange={e => setFormData({ ...formData, petugas: e.target.value })} placeholder="Nama petugas keamanan" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Takzir / Sanksi</label>
                        <textarea className="form-control" value={formData.takzir} onChange={e => setFormData({ ...formData, takzir: e.target.value })} rows="2" placeholder="Sanksi yang diberikan"></textarea>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Keterangan Tambahan</label>
                        <textarea className="form-control" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} rows="2"></textarea>
                    </div>
                </form>
            </Modal>

            {/* Modal View Detail */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Detail Pelanggaran"
                footer={<button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Selesai</button>}
            >
                {viewData && (() => {
                    const student = santriOptions.find(s => s.nama_siswa === viewData.nama_santri);
                    return (
                        <div className="detail-view">
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                                    <div style={{
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '50%',
                                        overflow: 'hidden',
                                        border: '4px solid var(--primary-light)',
                                        background: '#f1f5f9'
                                    }}>
                                        {student?.foto_santri ? (
                                            <img src={student.foto_santri} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                                                <i className="fas fa-user fa-3x"></i>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Nama Santri</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{viewData.nama_santri}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>Kelas: <strong>{viewData.kelas || '-'}</strong></div>
                                <span className="th-badge" style={{
                                    background: viewData.jenis_pelanggaran === 'Berat' ? '#fee2e2' : viewData.jenis_pelanggaran === 'Sedang' ? '#fffbeb' : '#f1f5f9',
                                    color: viewData.jenis_pelanggaran === 'Berat' ? '#dc2626' : viewData.jenis_pelanggaran === 'Sedang' ? '#9a3412' : '#475569',
                                    marginTop: '10px'
                                }}>
                                    Pelanggaran {viewData.jenis_pelanggaran}
                                </span>
                            </div>
                            <div className="form-grid" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px' }}>
                                <div>
                                    <small style={{ color: 'var(--text-muted)' }}>Tanggal Kejadian</small>
                                    <div style={{ fontWeight: 600 }}>{formatDate(viewData.tanggal)}</div>
                                </div>
                                <div>
                                    <small style={{ color: 'var(--text-muted)' }}>Poin Dicatat</small>
                                    <div style={{ fontWeight: 800, color: 'var(--danger)' }}>{viewData.poin} Poin</div>
                                </div>
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <small style={{ color: 'var(--text-muted)' }}>Takzir / Sanksi</small>
                                <div style={{ padding: '1rem', background: '#fffbeb', borderLeft: '4px solid #f59e0b', borderRadius: '4px', margin: '5px 0', fontSize: '0.95rem' }}>
                                    {viewData.takzir || 'Tidak Ada Sanksi'}
                                </div>
                            </div>
                            <div style={{ marginTop: '1rem' }}>
                                <small style={{ color: 'var(--text-muted)' }}>Petugas Penindak</small>
                                <div style={{ fontWeight: 600 }}>{viewData.petugas || '-'}</div>
                            </div>
                            <div style={{ marginTop: '1rem' }}>
                                <small style={{ color: 'var(--text-muted)' }}>Catatan Tambahan</small>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{viewData.keterangan || 'Tidak ada catatan tambahan.'}</p>
                            </div>
                        </div>
                    );
                })()}
            </Modal>
        </div>
    );
}