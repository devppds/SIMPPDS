'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';
import ArsipFileUpload from '@/components/ArsipFileUpload';

export default function AktaTanahPage() {
    const { isAdmin } = useAuth();
    const { showToast } = useToast();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState(null);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ nomor_akta: '', tanggal: new Date().toISOString().split('T')[0], lokasi: '', luas_tanah: '', atas_nama: '', status_kepemilikan: 'Milik Pondok', file_akta: '', keterangan: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => { setLoading(true); try { const res = await apiCall('getData', 'GET', { type: 'arsip_akta_tanah' }); setData(res || []); } catch (e) { console.error(e); } finally { setLoading(false); } };

    const openModal = (item = null) => {
        if (item) { setEditId(item.id); setFormData({ ...item }); }
        else { setEditId(null); setFormData({ nomor_akta: '', tanggal: new Date().toISOString().split('T')[0], lokasi: '', luas_tanah: '', atas_nama: '', status_kepemilikan: 'Milik Pondok', file_akta: '', keterangan: '' }); }
        setIsModalOpen(true);
    };

    const openViewModal = (item) => {
        setViewData(item);
        setIsViewModalOpen(true);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        try {
            await apiCall('saveData', 'POST', { type: 'arsip_akta_tanah', data: editId ? { ...formData, id: editId } : formData });
            setIsModalOpen(false);
            loadData();
            showToast('Akta tanah berhasil disimpan!', "success");
        } catch (err) { showToast(err.message, "error"); }
        finally { setSubmitting(false); }
    };

    const deleteItem = async (id) => {
        if (!confirm('Hapus akta tanah ini?')) return;
        try { await apiCall('deleteData', 'POST', { type: 'arsip_akta_tanah', id }); loadData(); showToast("Akta tanah dihapus dari arsip.", "info"); } catch (err) { showToast(err.message, "error"); }
    };

    const displayData = data.filter(d => (d.nomor_akta || '').toLowerCase().includes(search.toLowerCase()) || (d.lokasi || '').toLowerCase().includes(search.toLowerCase()) || (d.atas_nama || '').toLowerCase().includes(search.toLowerCase()));

    const columns = [
        { key: 'nomor_akta', label: 'No. Akta', render: (row) => <strong>{row.nomor_akta}</strong> },
        { key: 'tanggal', label: 'Tanggal', render: (row) => formatDate(row.tanggal) },
        { key: 'lokasi', label: 'Lokasi' },
        { key: 'luas_tanah', label: 'Luas', render: (row) => `${row.luas_tanah} m²` },
        { key: 'atas_nama', label: 'Atas Nama' },
        { key: 'status_kepemilikan', label: 'Status', render: (row) => <span className="th-badge" style={{ background: '#dcfce7', color: '#166534' }}>{row.status_kepemilikan}</span> },
        { key: 'actions', label: 'Aksi', sortable: false, width: '150px', render: (row) => (<div style={{ display: 'flex', gap: '8px' }}><button className="btn-vibrant btn-vibrant-purple" onClick={() => openViewModal(row)} title="Detail"><i className="fas fa-eye"></i></button><button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)} title="Edit"><i className="fas fa-edit"></i></button>{isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => deleteItem(row.id)} title="Hapus"><i className="fas fa-trash"></i></button>}</div>) }
    ];

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header">
                    <div><h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}><i className="fas fa-file-contract" style={{ marginRight: '10px' }}></i>Arsip Akta Tanah</h2><p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total {displayData.length} akta tercatat.</p></div>
                    <button className="btn btn-primary btn-sm" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Akta</button>
                </div>
                <div className="table-controls" style={{ padding: '1rem 1.5rem' }}><div className="search-wrapper"><i className="fas fa-search"></i><input type="text" className="search-input" placeholder="Cari nomor akta, lokasi, atau nama..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
                <SortableTable columns={columns} data={displayData} loading={loading} emptyMessage="Belum ada arsip akta tanah." />
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? 'Edit Akta Tanah' : 'Tambah Akta Tanah'} footer={<button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>}>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                    <div><label>Nomor Akta</label><input type="text" className="form-control" value={formData.nomor_akta} onChange={e => setFormData({ ...formData, nomor_akta: e.target.value })} required /></div>
                    <div><label>Tanggal</label><input type="date" className="form-control" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} required /></div>
                    <div><label>Lokasi</label><input type="text" className="form-control" value={formData.lokasi} onChange={e => setFormData({ ...formData, lokasi: e.target.value })} required /></div>
                    <div><label>Luas Tanah (m²)</label><input type="text" className="form-control" value={formData.luas_tanah} onChange={e => setFormData({ ...formData, luas_tanah: e.target.value })} required /></div>
                    <div><label>Atas Nama</label><input type="text" className="form-control" value={formData.atas_nama} onChange={e => setFormData({ ...formData, atas_nama: e.target.value })} required /></div>
                    <div><label>Status Kepemilikan</label><select className="form-control" value={formData.status_kepemilikan} onChange={e => setFormData({ ...formData, status_kepemilikan: e.target.value })} required><option value="Milik Pondok">Milik Pondok</option><option value="Wakaf">Wakaf</option><option value="Sewa">Sewa</option></select></div>
                    <ArsipFileUpload
                        label="File Akta/Sertifikat (PDF/Image, Max 15MB)"
                        currentFile={formData.file_akta}
                        onUploadComplete={(url) => setFormData({ ...formData, file_akta: url })}
                    />
                    <div><label>Keterangan</label><textarea className="form-control" rows="3" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })}></textarea></div>
                </form>
            </Modal>

            {/* View Detail Modal */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Sertifikat Akta Tanah" width="850px" footer={<button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Tutup</button>}>
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Nomor Sertifikat / Akta</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-dark)', letterSpacing: '-0.5px' }}>{viewData.nomor_akta}</div>
                            <div style={{ marginTop: '12px' }}>
                                <span className="th-badge" style={{ background: '#dcfce7', color: '#166534', padding: '8px 25px', fontSize: '0.85rem', fontWeight: 800 }}>
                                    STATUS: {viewData.status_kepemilikan.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                            <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '10px' }}>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Luas Tanah</small>
                                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)' }}>{viewData.luas_tanah} m²</div>
                            </div>
                            <div style={{ borderRight: '1px solid #e2e8f0', paddingLeft: '10px', paddingRight: '10px' }}>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Atas Nama</small>
                                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{viewData.atas_nama}</div>
                            </div>
                            <div style={{ borderRight: '1px solid #e2e8f0', paddingLeft: '10px', paddingRight: '10px' }}>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tanggal Akta</small>
                                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{formatDate(viewData.tanggal)}</div>
                            </div>
                            <div style={{ paddingLeft: '10px' }}>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Lokasi Aset</small>
                                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{viewData.lokasi}</div>
                            </div>
                        </div>

                        {viewData.keterangan && (
                            <div style={{ marginBottom: '1.5rem', padding: '1.2rem', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '15px' }}>
                                <small style={{ color: '#92400e', display: 'block', marginBottom: '6px', fontWeight: 700 }}>Catatan Penting</small>
                                <p style={{ fontSize: '0.95rem', margin: 0, color: '#92400e' }}>{viewData.keterangan}</p>
                            </div>
                        )}

                        {viewData.file_akta && (
                            <div style={{ marginTop: '3rem', borderTop: '2.5px solid #f1f5f9', paddingTop: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '45px', height: '45px', background: '#fee2e2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <i className="fas fa-file-pdf" style={{ fontSize: '1.5rem', color: '#ef4444' }}></i>
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Sertifikat Digital</h3>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dokumen resmi yang tersimpan di Cloud Server</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <a href={viewData.file_akta} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                            <i className="fas fa-external-link-alt"></i> Buka Fullscreen
                                        </a>
                                        <a href={viewData.file_akta.replace('/upload/', '/upload/fl_attachment/')} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
                                            <i className="fas fa-download"></i> Download Asli
                                        </a>
                                    </div>
                                </div>

                                <div style={{ background: '#334155', borderRadius: '20px', padding: '15px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}>
                                    {viewData.file_akta.toLowerCase().endsWith('.pdf') ? (
                                        <iframe
                                            src={viewData.file_akta}
                                            style={{ width: '100%', height: '600px', border: 'none', borderRadius: '15px' }}
                                            title="Sertifikat Digital Preview"
                                        />
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '10px' }}>
                                            <img
                                                src={viewData.file_akta}
                                                alt="Sertifikat Akta"
                                                style={{ maxWidth: '100%', borderRadius: '10px', cursor: 'zoom-in', transition: 'transform 0.3s ease' }}
                                                onClick={() => window.open(viewData.file_akta, '_blank')}
                                            />
                                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginTop: '15px' }}>Klik gambar untuk melihat resolusi penuh.</p>
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
