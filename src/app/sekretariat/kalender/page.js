'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';
import ArsipFileUpload from '@/components/ArsipFileUpload';

export default function KalenderKerjaPage() {
    const { isAdmin } = useAuth();
    const { showToast } = useToast();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState(null);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        tanggal_kegiatan: new Date().toISOString().split('T')[0],
        nama_kegiatan: '',
        kategori: 'Kegiatan Pondok',
        periode: '2025/2026',
        file_kalender: '',
        keterangan: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'kalender_kerja' });
            setData(res || []);
        }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openModal = (item = null) => {
        if (item) {
            setEditId(item.id);
            setFormData({ ...item });
        } else {
            setEditId(null);
            setFormData({
                tanggal_kegiatan: new Date().toISOString().split('T')[0],
                nama_kegiatan: '',
                kategori: 'Kegiatan Pondok',
                periode: '2025/2026',
                file_kalender: '',
                keterangan: ''
            });
        }
        setIsModalOpen(true);
    };

    const openViewModal = (item) => {
        setViewData(item);
        setIsViewModalOpen(true);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!formData.nama_kegiatan || !formData.tanggal_kegiatan) {
            showToast("Nama dan Tanggal kegiatan wajib diisi", "error");
            return;
        }
        setSubmitting(true);
        try {
            await apiCall('saveData', 'POST', { type: 'kalender_kerja', data: editId ? { ...formData, id: editId } : formData });
            setIsModalOpen(false);
            loadData();
            showToast('Agenda Kalender Kerja berhasil disimpan!', "success");
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setSubmitting(false);
        }
    };

    const deleteItem = async (id) => {
        if (!confirm('Hapus agenda kalender ini?')) return;
        try {
            await apiCall('deleteData', 'POST', { type: 'kalender_kerja', id });
            loadData();
            showToast("Agenda dihapus dari kalender.", "info");
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    const displayData = data.filter(d =>
        (d.nama_kegiatan || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.periode || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.kategori || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { key: 'tanggal_kegiatan', label: 'Tanggal', render: (row) => formatDate(row.tanggal_kegiatan) },
        { key: 'nama_kegiatan', label: 'Nama Kegiatan', render: (row) => <strong>{row.nama_kegiatan}</strong> },
        { key: 'periode', label: 'Periode', render: (row) => <span className="th-badge" style={{ background: '#f1f5f9', color: '#475569' }}>{row.periode}</span> },
        {
            key: 'kategori',
            label: 'Kategori',
            render: (row) => (
                <span className="th-badge" style={{
                    background: row.kategori === 'Liburan' ? '#fee2e2' : row.kategori === 'Ujian' ? '#fef3c7' : '#dcfce7',
                    color: row.kategori === 'Liburan' ? '#991b1b' : row.kategori === 'Ujian' ? '#92400e' : '#166534'
                }}>
                    {row.kategori}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Aksi',
            width: '160px',
            render: (row) => (
                <div className="table-actions">
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openViewModal(row)} title="Detail & Dokumen"><i className="fas fa-eye"></i></button>
                    <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)} title="Edit"><i className="fas fa-edit"></i></button>
                    {isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => deleteItem(row.id)} title="Hapus"><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Kalender Kerja & Agenda</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manajemen agenda kegiatan dan pengarsipan kalender resmi pondok.</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Agenda</button>
                </div>

                <div className="table-controls">
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input type="text" className="search-input" placeholder="Cari kegiatan atau periode..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>

                <SortableTable columns={columns} data={displayData} loading={loading} emptyMessage="Belum ada agenda kalender." />
            </div>

            {/* Input/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Edit Agenda Kalender" : "Tambah Agenda Baru"} footer={(<>
                <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Batal</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Agenda'}</button>
            </>)}>
                <form className="form-grid">
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">Nama Kegiatan / Agenda *</label>
                        <input type="text" className="form-control" value={formData.nama_kegiatan} onChange={e => setFormData({ ...formData, nama_kegiatan: e.target.value })} placeholder="Contoh: Libur Akhir Semester" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tanggal Pelaksanaan *</label>
                        <input type="date" className="form-control" value={formData.tanggal_kegiatan} onChange={e => setFormData({ ...formData, tanggal_kegiatan: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Periode</label>
                        <input type="text" className="form-control" value={formData.periode} onChange={e => setFormData({ ...formData, periode: e.target.value })} placeholder="2025/2026" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Kategori</label>
                        <select className="form-control" value={formData.kategori} onChange={e => setFormData({ ...formData, kategori: e.target.value })}>
                            <option value="Kegiatan Pondok">Kegiatan Pondok</option>
                            <option value="Liburan">Liburan</option>
                            <option value="Ujian">Ujian</option>
                            <option value="Rapat">Rapat</option>
                            <option value="Hari Besar">Hari Besar</option>
                            <option value="Lainnya">Lainnya</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Dokumen Kalender (Opsional)</label>
                        <ArsipFileUpload onUploadComplete={(url) => setFormData({ ...formData, file_kalender: url })} currentFile={formData.file_kalender} label="File Kalender (PDF/Image)" />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">Keterangan / Catatan</label>
                        <textarea className="form-control" rows="3" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} placeholder="Catatan tambahan agenda..."></textarea>
                    </div>
                </form>
            </Modal>

            {/* View Detail Modal */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Agenda & Dokumen" width="850px" footer={<button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Tutup</button>}>
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Agenda Kegiatan</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary-dark)' }}>{viewData.nama_kegiatan}</div>
                            <div style={{ marginTop: '10px' }}>
                                <span className="th-badge" style={{ background: '#dcfce7', color: '#166534', padding: '6px 20px', fontWeight: 800 }}>
                                    PERIODE {viewData.periode}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                            <div>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tanggal Pelaksanaan</small>
                                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)' }}>{formatDate(viewData.tanggal_kegiatan)}</div>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kategori</small>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{viewData.kategori}</div>
                            </div>
                        </div>

                        {viewData.keterangan && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Keterangan Agenda</small>
                                <div style={{ padding: '1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem', color: '#475569', lineHeight: 1.5 }}>
                                    {viewData.keterangan}
                                </div>
                            </div>
                        )}

                        {viewData.file_kalender && (
                            <div style={{ marginTop: '2.5rem', borderTop: '2.5px solid #f1f5f9', paddingTop: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '45px', height: '45px', background: '#e0f2fe', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <i className="fas fa-file-invoice" style={{ fontSize: '1.5rem', color: '#0ea5e9' }}></i>
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Arsip Dokumen Kalender</h3>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dokumen resmi agenda periode {viewData.periode}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <a href={viewData.file_kalender} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                                            <i className="fas fa-external-link-alt"></i> Buka Full
                                        </a>
                                        <a href={viewData.file_kalender.replace('/upload/', '/upload/fl_attachment/')} className="btn btn-primary btn-sm">
                                            <i className="fas fa-download"></i> Download PDF
                                        </a>
                                    </div>
                                </div>

                                <div style={{ background: '#334155', borderRadius: '20px', padding: '15px', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' }}>
                                    {viewData.file_kalender.toLowerCase().endsWith('.pdf') ? (
                                        <iframe
                                            src={viewData.file_kalender}
                                            style={{ width: '100%', height: '600px', border: 'none', borderRadius: '15px' }}
                                            title="Kalender Document Preview"
                                        />
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '10px' }}>
                                            <img
                                                src={viewData.file_kalender}
                                                alt="Kalender Preview"
                                                style={{ maxWidth: '100%', borderRadius: '10px', cursor: 'zoom-in' }}
                                                onClick={() => window.open(viewData.file_kalender, '_blank')}
                                            />
                                        </div>
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
