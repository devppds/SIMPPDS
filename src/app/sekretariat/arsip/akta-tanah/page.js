'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';
import ArsipFileUpload from '@/components/ArsipFileUpload';

export default function AktaTanahPage() {
    const { isAdmin } = useAuth();
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

    const handleSubmit = async (e) => { e.preventDefault(); setSubmitting(true); try { await apiCall('saveData', 'POST', { type: 'arsip_akta_tanah', data: editId ? { ...formData, id: editId } : formData }); setIsModalOpen(false); loadData(); alert('Akta tanah berhasil disimpan!'); } catch (err) { alert(err.message); } finally { setSubmitting(false); } };

    const deleteItem = async (id) => { if (!confirm('Hapus akta tanah ini?')) return; try { await apiCall('deleteData', 'POST', { type: 'arsip_akta_tanah', id }); loadData(); } catch (err) { alert(err.message); } };

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
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Arsip Akta Tanah" width="700px" footer={<button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Tutup</button>}>
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nomor Akta / Sertifikat</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary-dark)' }}>{viewData.nomor_akta}</div>
                            <div style={{ marginTop: '10px' }}>
                                <span className="th-badge" style={{ background: '#dcfce7', color: '#166534', padding: '6px 20px', fontSize: '0.8rem' }}>
                                    {viewData.status_kepemilikan}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
                            <div>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Luas Tanah</small>
                                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)' }}>{viewData.luas_tanah} m²</div>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Atas Nama</small>
                                <div style={{ fontWeight: 700 }}>{viewData.atas_nama}</div>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tanggal Akta</small>
                                <div style={{ fontWeight: 600 }}>{formatDate(viewData.tanggal)}</div>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Lokasi</small>
                                <div style={{ fontWeight: 600 }}>{viewData.lokasi}</div>
                            </div>
                        </div>

                        {viewData.keterangan && (
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Catatan / Keterangan</small>
                                <p style={{ fontSize: '0.95rem', margin: 0 }}>{viewData.keterangan}</p>
                            </div>
                        )}

                        {viewData.file_akta && (
                            <div style={{ marginTop: '2rem', borderTop: '2px dashed #e2e8f0', paddingTop: '1.5rem' }}>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '1rem' }}>Dokumen Digital</small>
                                <a href={viewData.file_akta} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', gap: '10px', fontWeight: 800 }}>
                                    <i className="fas fa-file-pdf"></i> Buka Sertifikat Digital
                                </a>
                                {viewData.file_akta.match(/\.(jpg|jpeg|png|gif)$/i) && (
                                    <img src={viewData.file_akta} alt="Preview" style={{ width: '100%', marginTop: '15px', borderRadius: '12px', border: '1px solid #eee', boxShadow: 'var(--shadow-md)' }} />
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
