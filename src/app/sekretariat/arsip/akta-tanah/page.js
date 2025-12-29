'use client';

import React from 'react';
import { formatDate } from '@/lib/utils';
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';
import ArsipFileUpload from '@/components/ArsipFileUpload';

export default function AktaTanahPage() {
    // ✨ Use Universal Data Hook
    const {
        data, loading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, formData, setFormData, editId,
        handleSave, handleDelete, openModal, openView,
        isAdmin
    } = useDataManagement('arsip_akta_tanah', {
        nomor_akta: '', tanggal: new Date().toISOString().split('T')[0],
        lokasi: '', luas_tanah: '', atas_nama: '', status_kepemilikan: 'Milik Pondok',
        file_akta: '', keterangan: ''
    });

    const displayData = data.filter(d =>
        (d.nomor_akta || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.lokasi || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.atas_nama || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { key: 'nomor_akta', label: 'No. Akta', render: (row) => <strong>{row.nomor_akta}</strong> },
        { key: 'tanggal', label: 'Tanggal', render: (row) => formatDate(row.tanggal) },
        { key: 'lokasi', label: 'Lokasi' },
        { key: 'luas_tanah', label: 'Luas', render: (row) => `${row.luas_tanah} m²` },
        { key: 'atas_nama', label: 'Atas Nama' },
        {
            key: 'status_kepemilikan', label: 'Status', render: (row) => (
                <span className="th-badge" style={{ background: '#dcfce7', color: '#166534' }}>{row.status_kepemilikan}</span>
            )
        },
        {
            key: 'actions', label: 'Aksi', sortable: false, width: '150px', render: (row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openView(row)} title="Detail"><i className="fas fa-eye"></i></button>
                    <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)} title="Edit"><i className="fas fa-edit"></i></button>
                    {isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => handleDelete(row.id, 'Hapus akta tanah ini?')} title="Hapus"><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Arsip Akta Tanah</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mencatat {displayData.length} akta.</p>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Akta</button>
                </div>
                <div className="table-controls" style={{ padding: '1rem 1.5rem' }}>
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input type="text" className="search-input" placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>
                <SortableTable columns={columns} data={displayData} loading={loading} emptyMessage="Belum ada arsip akta tanah." />
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? 'Edit Akta Tanah' : 'Tambah Akta Tanah'} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>}>
                <form onSubmit={handleSave}>
                    <div className="form-group"><label className="form-label">Nomor Akta</label><input type="text" className="form-control" value={formData.nomor_akta} onChange={e => setFormData({ ...formData, nomor_akta: e.target.value })} required /></div>
                    <div className="form-grid">
                        <div className="form-group"><label className="form-label">Tanggal</label><input type="date" className="form-control" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} required /></div>
                        <div className="form-group"><label className="form-label">Luas Tanah (m²)</label><input type="text" className="form-control" value={formData.luas_tanah} onChange={e => setFormData({ ...formData, luas_tanah: e.target.value })} required /></div>
                    </div>
                    <div className="form-group"><label className="form-label">Lokasi</label><input type="text" className="form-control" value={formData.lokasi} onChange={e => setFormData({ ...formData, lokasi: e.target.value })} required /></div>
                    <div className="form-group"><label className="form-label">Atas Nama</label><input type="text" className="form-control" value={formData.atas_nama} onChange={e => setFormData({ ...formData, atas_nama: e.target.value })} required /></div>
                    <div className="form-group"><label className="form-label">Status Kepemilikan</label><select className="form-control" value={formData.status_kepemilikan} onChange={e => setFormData({ ...formData, status_kepemilikan: e.target.value })} required><option value="Milik Pondok">Milik Pondok</option><option value="Wakaf">Wakaf</option><option value="Sewa">Sewa</option></select></div>
                    <ArsipFileUpload label="Scan Sertifikat" currentFile={formData.file_akta} onUploadComplete={(url) => setFormData({ ...formData, file_akta: url })} />
                    <div className="form-group"><label className="form-label">Keterangan</label><textarea className="form-control" rows="2" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })}></textarea></div>
                </form>
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Sertifikat Akta" width="800px" footer={<button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Selesai</button>}>
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary-dark)' }}>{viewData.nomor_akta}</h2>
                            <span className="th-badge" style={{ marginTop: '10px' }}>{viewData.status_kepemilikan.toUpperCase()}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '15px' }}>
                            <div><small>Luas Tanah</small><div style={{ fontWeight: 800 }}>{viewData.luas_tanah} m²</div></div>
                            <div><small>Atas Nama</small><div style={{ fontWeight: 700 }}>{viewData.atas_nama}</div></div>
                            <div><small>Tanggal</small><div>{formatDate(viewData.tanggal)}</div></div>
                            <div><small>Lokasi</small><div>{viewData.lokasi}</div></div>
                        </div>
                        {viewData.file_akta && (
                            <div style={{ marginTop: '2rem' }}>
                                <div style={{ background: '#334155', borderRadius: '15px', padding: '10px' }}>
                                    {viewData.file_akta.toLowerCase().endsWith('.pdf') ? (
                                        <iframe src={viewData.file_akta} style={{ width: '100%', height: '500px', border: 'none' }} title="PDF" />
                                    ) : (
                                        <img src={viewData.file_akta} style={{ maxWidth: '100%', borderRadius: '8px' }} alt="" />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
