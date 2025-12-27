'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatDate, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';

export default function ProposalPage() {
    const { isAdmin } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
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

    const handleSubmit = async (e) => {
        e.preventDefault(); setSubmitting(true);
        try { await apiCall('saveData', 'POST', { type: 'arsip_proposal', data: editId ? { ...formData, id: editId } : formData }); setIsModalOpen(false); loadData(); alert('Proposal berhasil disimpan!'); }
        catch (err) { alert(err.message); } finally { setSubmitting(false); }
    };

    const deleteItem = async (id) => {
        if (!confirm('Hapus proposal ini?')) return;
        try { await apiCall('deleteData', 'POST', { type: 'arsip_proposal', id }); loadData(); } catch (err) { alert(err.message); }
    };

    const displayData = data.filter(d => (d.nomor_proposal || '').toLowerCase().includes(search.toLowerCase()) || (d.judul || '').toLowerCase().includes(search.toLowerCase()) || (d.pengaju || '').toLowerCase().includes(search.toLowerCase()));

    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => formatDate(row.tanggal) },
        { key: 'nomor_proposal', label: 'No. Proposal', render: (row) => <strong>{row.nomor_proposal}</strong> },
        { key: 'judul', label: 'Judul Proposal' },
        { key: 'pengaju', label: 'Pengaju' },
        { key: 'nominal', label: 'Nominal', render: (row) => <span style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(row.nominal)}</span> },
        { key: 'status', label: 'Status', render: (row) => <span className="th-badge" style={{ background: row.status === 'Disetujui' ? '#dcfce7' : row.status === 'Ditolak' ? '#fee2e2' : '#fffbeb', color: row.status === 'Disetujui' ? '#166534' : row.status === 'Ditolak' ? '#991b1b' : '#9a3412' }}>{row.status}</span> },
        { key: 'actions', label: 'Aksi', sortable: false, width: '150px', render: (row) => (<div style={{ display: 'flex', gap: '8px' }}><button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)} title="Edit"><i className="fas fa-edit"></i></button>{isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => deleteItem(row.id)} title="Hapus"><i className="fas fa-trash"></i></button>}</div>) }
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
                    <div><label>Keterangan</label><textarea className="form-control" rows="3" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })}></textarea></div>
                </form>
            </Modal>
        </div>
    );
}
