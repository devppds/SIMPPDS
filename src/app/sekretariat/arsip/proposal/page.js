'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatDate, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';
import ArsipFileUpload from '@/components/ArsipFileUpload';

export default function ProposalPage() {
    const { isAdmin } = useAuth();
    const { showToast } = useToast();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState(null);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ tanggal: new Date().toISOString().split('T')[0], nomor_proposal: '', judul: '', pengaju: '', nominal: '', status: 'Diajukan', file_proposal: '', keterangan: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try { const res = await apiCall('getData', 'GET', { type: 'arsip_proposal' }); setData(res || []); }
        catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const openModal = (item = null) => {
        if (item) { setEditId(item.id); setFormData({ ...item }); }
        else { setEditId(null); setFormData({ tanggal: new Date().toISOString().split('T')[0], nomor_proposal: '', judul: '', pengaju: '', nominal: '', status: 'Diajukan', file_proposal: '', keterangan: '' }); }
        setIsModalOpen(true);
    };

    const openViewModal = (item) => {
        setViewData(item);
        setIsViewModalOpen(true);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        try { await apiCall('saveData', 'POST', { type: 'arsip_proposal', data: editId ? { ...formData, id: editId } : formData }); setIsModalOpen(false); loadData(); showToast('Proposal berhasil disimpan!', "success"); }
        catch (err) { showToast(err.message, "error"); } finally { setSubmitting(false); }
    };

    const deleteItem = async (id) => {
        if (!confirm('Hapus proposal ini?')) return;
        try { await apiCall('deleteData', 'POST', { type: 'arsip_proposal', id }); loadData(); showToast("Proposal dihapus.", "info"); } catch (err) { showToast(err.message, "error"); }
    };

    const displayData = data.filter(d => (d.nomor_proposal || '').toLowerCase().includes(search.toLowerCase()) || (d.judul || '').toLowerCase().includes(search.toLowerCase()) || (d.pengaju || '').toLowerCase().includes(search.toLowerCase()));

    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => formatDate(row.tanggal) },
        { key: 'nomor_proposal', label: 'No. Proposal', render: (row) => <strong>{row.nomor_proposal}</strong> },
        { key: 'judul', label: 'Judul Proposal' },
        { key: 'pengaju', label: 'Pengaju' },
        { key: 'nominal', label: 'Nominal', render: (row) => <span style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(row.nominal)}</span> },
        { key: 'status', label: 'Status', render: (row) => <span className="th-badge" style={{ background: row.status === 'Disetujui' ? '#dcfce7' : row.status === 'Ditolak' ? '#fee2e2' : '#fffbeb', color: row.status === 'Disetujui' ? '#166534' : row.status === 'Ditolak' ? '#991b1b' : '#9a3412' }}>{row.status}</span> },
        { key: 'actions', label: 'Aksi', sortable: false, width: '150px', render: (row) => (<div style={{ display: 'flex', gap: '8px' }}><button className="btn-vibrant btn-vibrant-purple" onClick={() => openViewModal(row)} title="Detail"><i className="fas fa-eye"></i></button><button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)} title="Edit"><i className="fas fa-edit"></i></button>{isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => deleteItem(row.id)} title="Hapus"><i className="fas fa-trash"></i></button>}</div>) }
    ];

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header">
                    <div><h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}><i className="fas fa-file-alt" style={{ marginRight: '10px' }}></i>Arsip Proposal</h2><p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total {displayData.length} proposal tercatat.</p></div>
                    <button className="btn btn-primary btn-sm" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Proposal</button>
                </div>
                <div className="table-controls" style={{ padding: '1rem 1.5rem' }}><div className="search-wrapper"><i className="fas fa-search"></i><input type="text" className="search-input" placeholder="Cari nomor, judul, atau pengaju..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
                <SortableTable columns={columns} data={displayData} loading={loading} emptyMessage="Belum ada arsip proposal." />
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? 'Edit Proposal' : 'Tambah Proposal'} footer={<button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>}>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                    <div><label>Tanggal</label><input type="date" className="form-control" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} required /></div>
                    <div><label>Nomor Proposal</label><input type="text" className="form-control" value={formData.nomor_proposal} onChange={e => setFormData({ ...formData, nomor_proposal: e.target.value })} required /></div>
                    <div><label>Judul</label><input type="text" className="form-control" value={formData.judul} onChange={e => setFormData({ ...formData, judul: e.target.value })} required /></div>
                    <div><label>Pengaju</label><input type="text" className="form-control" value={formData.pengaju} onChange={e => setFormData({ ...formData, pengaju: e.target.value })} required /></div>
                    <div><label>Nominal</label><input type="number" className="form-control" value={formData.nominal} onChange={e => setFormData({ ...formData, nominal: e.target.value })} required /></div>
                    <div><label>Status</label><select className="form-control" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} required><option value="Diajukan">Diajukan</option><option value="Disetujui">Disetujui</option><option value="Ditolak">Ditolak</option></select></div>
                    <ArsipFileUpload
                        label="File Proposal (PDF/Image, Max 15MB)"
                        currentFile={formData.file_proposal}
                        onUploadComplete={(url) => setFormData({ ...formData, file_proposal: url })}
                    />
                    <div><label>Keterangan</label><textarea className="form-control" rows="3" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })}></textarea></div>
                </form>
            </Modal>

            {/* View Detail Modal */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Arsip Proposal" width="800px" footer={<button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Tutup</button>}>
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Judul Proposal Dokumen</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary-dark)', lineHeight: 1.3 }}>{viewData.judul}</div>
                            <div style={{ marginTop: '10px' }}>
                                <span className="th-badge" style={{
                                    background: viewData.status === 'Disetujui' ? '#dcfce7' : viewData.status === 'Ditolak' ? '#fee2e2' : '#fffbeb',
                                    color: viewData.status === 'Disetujui' ? '#166534' : viewData.status === 'Ditolak' ? '#991b1b' : '#9a3412',
                                    padding: '6px 20px',
                                    fontWeight: 800
                                }}>
                                    STATUS: {viewData.status.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                            <div>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nominal Pengajuan</small>
                                <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--success)' }}>{formatCurrency(viewData.nominal)}</div>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Pengaju / PJ</small>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{viewData.pengaju}</div>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tanggal Pengajuan</small>
                                <div style={{ fontWeight: 600 }}>{formatDate(viewData.tanggal)}</div>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nomor Dokumen</small>
                                <div style={{ fontWeight: 600 }}>{viewData.nomor_proposal || '-'}</div>
                            </div>
                        </div>

                        {viewData.keterangan && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Keterangan / Alasan</small>
                                <div style={{ padding: '1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem', color: '#475569' }}>
                                    {viewData.keterangan}
                                </div>
                            </div>
                        )}

                        {viewData.file_proposal && (
                            <div style={{ marginTop: '2.5rem', borderTop: '2px dashed #cbd5e1', paddingTop: '2.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}><i className="fas fa-file-pdf" style={{ marginRight: '8px', color: '#ef4444' }}></i>Lampiran Proposal</h3>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <a href={viewData.file_proposal} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                                            <i className="fas fa-external-link-alt"></i> Buka Full
                                        </a>
                                        <a href={viewData.file_proposal.replace('/upload/', '/upload/fl_attachment/')} className="btn btn-primary btn-sm">
                                            <i className="fas fa-download"></i> Download
                                        </a>
                                    </div>
                                </div>

                                <div style={{ background: '#334155', borderRadius: '15px', padding: '10px', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' }}>
                                    {viewData.file_proposal.toLowerCase().endsWith('.pdf') ? (
                                        <iframe
                                            src={viewData.file_proposal}
                                            style={{ width: '100%', height: '550px', border: 'none', borderRadius: '10px' }}
                                            title="Proposal Preview"
                                        />
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '20px' }}>
                                            <img
                                                src={viewData.file_proposal}
                                                alt="Proposal Preview"
                                                style={{ maxWidth: '100%', borderRadius: '8px', cursor: 'zoom-in' }}
                                                onClick={() => window.open(viewData.file_proposal, '_blank')}
                                            />
                                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginTop: '10px' }}>Klik gambar untuk memperbesar.</p>
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
