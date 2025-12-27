'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';
import ArsipFileUpload from '@/components/ArsipFileUpload';

export default function SuratPage() {
    const { isAdmin } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterTipe, setFilterTipe] = useState('Semua');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState(null);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        tanggal: new Date().toISOString().split('T')[0],
        nomor_surat: '', tipe: 'Masuk', pengirim_penerima: '',
        perihal: '', keterangan: '', file_surat: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'arsip_surat' });
            setData(res || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openModal = (item = null) => {
        if (item) { setEditId(item.id); setFormData({ ...item }); }
        else { setEditId(null); setFormData({ tanggal: new Date().toISOString().split('T')[0], nomor_surat: '', tipe: 'Masuk', pengirim_penerima: '', perihal: '', keterangan: '', file_surat: '' }); }
        setIsModalOpen(true);
    };

    const openViewModal = (item) => {
        setViewData(item);
        setIsViewModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await apiCall('saveData', 'POST', { type: 'arsip_surat', data: editId ? { ...formData, id: editId } : formData });
            setIsModalOpen(false);
            loadData();
            alert('Surat berhasil disimpan!');
        } catch (err) { alert(err.message); }
        finally { setSubmitting(false); }
    };

    const deleteItem = async (id) => {
        if (!confirm('Hapus arsip surat ini?')) return;
        try { await apiCall('deleteData', 'POST', { type: 'arsip_surat', id }); loadData(); } catch (err) { alert(err.message); }
    };

    const displayData = data.filter(d => {
        const matchSearch = (d.nomor_surat || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.pengirim_penerima || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.perihal || '').toLowerCase().includes(search.toLowerCase());
        const matchFilter = filterTipe === 'Semua' || d.tipe === filterTipe;
        return matchSearch && matchFilter;
    });

    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => formatDate(row.tanggal) },
        { key: 'nomor_surat', label: 'No. Surat', render: (row) => <strong>{row.nomor_surat}</strong> },
        {
            key: 'tipe',
            label: 'Tipe',
            render: (row) => (
                <span className="th-badge" style={{
                    background: row.tipe === 'Masuk' ? '#dcfce7' : '#dbeafe',
                    color: row.tipe === 'Masuk' ? '#166534' : '#1e40af'
                }}>
                    {row.tipe}
                </span>
            )
        },
        { key: 'pengirim_penerima', label: 'Pengirim/Penerima' },
        { key: 'perihal', label: 'Perihal' },
        {
            key: 'actions',
            label: 'Aksi',
            sortable: false,
            width: '150px',
            render: (row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openViewModal(row)} title="Detail"><i className="fas fa-eye"></i></button>
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
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                            <i className="fas fa-envelope" style={{ marginRight: '10px' }}></i>Arsip Surat Masuk/Keluar
                        </h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total {displayData.length} surat tercatat.</p>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                        <i className="fas fa-plus"></i> Tambah Surat
                    </button>
                </div>

                <div className="table-controls" style={{ padding: '1rem 1.5rem' }}>
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input type="text" className="search-input" placeholder="Cari nomor surat, pengirim, atau perihal..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <select className="form-control" style={{ width: '200px', fontWeight: 700 }} value={filterTipe} onChange={(e) => setFilterTipe(e.target.value)}>
                        <option value="Semua">Semua Tipe</option>
                        <option value="Masuk">Surat Masuk</option>
                        <option value="Keluar">Surat Keluar</option>
                    </select>
                </div>

                <SortableTable columns={columns} data={displayData} loading={loading} emptyMessage="Belum ada arsip surat." />
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? 'Edit Surat' : 'Tambah Surat'} footer={<button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>}>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                    <div><label>Tanggal</label><input type="date" className="form-control" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} required /></div>
                    <div><label>Nomor Surat</label><input type="text" className="form-control" value={formData.nomor_surat} onChange={e => setFormData({ ...formData, nomor_surat: e.target.value })} required /></div>
                    <div><label>Tipe</label><select className="form-control" value={formData.tipe} onChange={e => setFormData({ ...formData, tipe: e.target.value })} required><option value="Masuk">Masuk</option><option value="Keluar">Keluar</option></select></div>
                    <div><label>Pengirim/Penerima</label><input type="text" className="form-control" value={formData.pengirim_penerima} onChange={e => setFormData({ ...formData, pengirim_penerima: e.target.value })} required /></div>
                    <div><label>Perihal</label><input type="text" className="form-control" value={formData.perihal} onChange={e => setFormData({ ...formData, perihal: e.target.value })} required /></div>
                    <ArsipFileUpload
                        label="File Surat (Scan PDF/Image)"
                        currentFile={formData.file_surat}
                        onUploadComplete={(url) => setFormData({ ...formData, file_surat: url })}
                    />
                    <div><label>Keterangan</label><textarea className="form-control" rows="3" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })}></textarea></div>
                </form>
            </Modal>

            {/* View Detail Modal */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Arsip Surat" footer={<button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Tutup</button>}>
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nomor Surat</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{viewData.nomor_surat}</div>
                            <span className="th-badge" style={{
                                background: viewData.tipe === 'Masuk' ? '#dcfce7' : '#dbeafe',
                                color: viewData.tipe === 'Masuk' ? '#166534' : '#1e40af',
                                marginTop: '10px'
                            }}>
                                Surat {viewData.tipe}
                            </span>
                        </div>
                        <div className="form-grid" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                            <div>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tanggal</small>
                                <div style={{ fontWeight: 700 }}>{formatDate(viewData.tanggal)}</div>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Pengirim/Penerima</small>
                                <div style={{ fontWeight: 700 }}>{viewData.pengirim_penerima}</div>
                            </div>
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Perihal</small>
                            <div style={{ padding: '1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600 }}>
                                {viewData.perihal}
                            </div>
                        </div>
                        {viewData.keterangan && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Keterangan</small>
                                <p style={{ fontSize: '0.9rem', color: '#475569' }}>{viewData.keterangan}</p>
                            </div>
                        )}
                        {viewData.file_surat && (
                            <div style={{ marginTop: '2rem', borderTop: '2px dashed #e2e8f0', paddingTop: '1.5rem' }}>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '1rem' }}>Lampiran File</small>
                                <a href={viewData.file_surat} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', gap: '10px' }}>
                                    <i className="fas fa-external-link-alt"></i> Lihat / Download Dokumen
                                </a>
                                {viewData.file_surat.match(/\.(jpg|jpeg|png|gif)$/i) && (
                                    <img src={viewData.file_surat} alt="Preview" style={{ width: '100%', marginTop: '15px', borderRadius: '12px', border: '1px solid #eee' }} />
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
