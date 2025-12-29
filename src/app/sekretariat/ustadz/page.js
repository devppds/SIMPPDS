'use client';

import React, { useState, useEffect } from 'react';
import { apiCall } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';

export default function PengajarPage() {
    const { isAdmin } = useAuth();
    const { showToast } = useToast();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState(null);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        nama: '', kelas: '', alamat: '', no_hp: '', status: 'Aktif',
        foto_ustadz: '', tanggal_nonaktif: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const timestamp = Math.round(new Date().getTime() / 1000);
            const paramsToSign = { timestamp, folder: 'simppds_pengajar' };
            const { signature, apiKey, cloudName } = await apiCall('getCloudinarySignature', 'POST', { data: { paramsToSign } });

            if (!apiKey || !cloudName) {
                throw new Error('Konfigurasi Cloudinary tidak ditemukan. Harap atur Environment Variables di Dashboard Cloudflare.');
            }

            const fd = new FormData();
            fd.append('file', file);
            fd.append('api_key', apiKey);
            fd.append('timestamp', timestamp);
            fd.append('signature', signature);
            fd.append('folder', 'simppds_pengajar');
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
            const result = await res.json();
            if (result.secure_url) {
                setFormData(prev => ({ ...prev, foto_ustadz: result.secure_url }));
                showToast("Berhasil mengunggah foto!", "success");
            } else { throw new Error(result.error?.message || "Gagal upload Cloudinary"); }
        } catch (err) {
            console.error(err);
            showToast("Gagal: " + err.message, "error");
        } finally { setUploading(false); }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'ustadz' });
            setData(res || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openModal = (item = null) => {
        if (item) { setEditId(item.id); setFormData({ ...item }); }
        else {
            setEditId(null);
            setFormData({
                nama: '', kelas: '', alamat: '', no_hp: '', status: 'Aktif',
                foto_ustadz: '', tanggal_nonaktif: ''
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
        setSubmitting(true);
        try {
            await apiCall('saveData', 'POST', { type: 'ustadz', data: editId ? { ...formData, id: editId } : formData });
            setIsModalOpen(false);
            loadData();
            showToast(editId ? 'Profil Pengajar diperbarui!' : 'Pengajar baru telah ditambahkan!', "success");
        } catch (err) { showToast(err.message, "error"); }
        finally { setSubmitting(false); }
    };

    const deleteItem = async (id) => {
        if (!confirm('Hapus data pengajar ini secara permanen?')) return;
        try { await apiCall('deleteData', 'POST', { type: 'ustadz', id }); loadData(); showToast("Data pengajar dihapus.", "info"); } catch (err) { showToast(err.message, "error"); }
    };

    const displayData = data.filter(d =>
        (d.nama || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.kelas || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { key: 'nama', label: 'Nama Pengajar', render: (row) => <span style={{ fontWeight: 800 }}>{row.nama}</span> },
        { key: 'kelas', label: 'Kelas Ampu' },
        { key: 'no_hp', label: 'No. HP' },
        {
            key: 'status',
            label: 'Status',
            render: (row) => (
                <span className="th-badge" style={{
                    background: row.status === 'Aktif' ? '#dcfce7' : '#fee2e2',
                    color: row.status === 'Aktif' ? '#166534' : '#991b1b'
                }}>
                    {row.status}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Aksi',
            sortable: false,
            width: '150px',
            render: (row) => (
                <div className="table-actions">
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openViewModal(row)} title="Detail"><i className="fas fa-eye"></i></button>
                    <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)} title="Edit"><i className="fas fa-edit"></i></button>
                    {isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => deleteItem(row.id)} title="Hapus"><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    return (
        <div className="view-container">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ marginBottom: '5px', fontSize: '1.5rem', fontWeight: 800 }}>Direktori Tenaga Pengajar</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total {displayData.length} pengajar terdaftar.</p>
                    </div>
                    <div className="card-actions">
                        <button className="btn btn-secondary" onClick={() => window.print()}>
                            <i className="fas fa-print"></i>
                        </button>
                        <button className="btn btn-primary" onClick={() => openModal()}>
                            <i className="fas fa-plus-circle"></i> Tambah Pengajar
                        </button>
                    </div>
                </div>

                <div className="table-controls">
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input type="text" className="search-input" placeholder="Cari nama atau tugas mengajar..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>

                <SortableTable
                    columns={columns}
                    data={displayData}
                    loading={loading}
                    emptyMessage="Belum ada data pengajar."
                />
            </div>

            {/* Modal Input/Edit */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? "Pembaruan Profil Pengajar" : "Input Data Pengajar Baru"}
                footer={(
                    <>
                        <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Kembali</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Menyimpan...' : 'Simpan Profil'}
                        </button>
                    </>
                )}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group"><label className="form-label">Nama Lengkap & Gelar</label><input type="text" className="form-control" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} required /></div>
                    <div className="form-group"><label className="form-label">Tugas Mengajar</label><input type="text" className="form-control" value={formData.kelas} onChange={e => setFormData({ ...formData, kelas: e.target.value })} /></div>
                    <div className="form-grid">
                        <div className="form-group"><label className="form-label">WA Aktif</label><input type="text" className="form-control" value={formData.no_hp} onChange={e => setFormData({ ...formData, no_hp: e.target.value })} /></div>
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-control" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                <option value="Aktif">Aktif</option>
                                <option value="Non-Aktif">Non-Aktif</option>
                                <option value="Cuti">Cuti</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Alamat Lengkap</label>
                        <textarea className="form-control" value={formData.alamat} onChange={e => setFormData({ ...formData, alamat: e.target.value })} rows="2"></textarea>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Foto Profil</label>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: '#f8fafc', padding: '15px', borderRadius: '14px', border: '2px dashed #e2e8f0' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
                                <img src={formData.foto_ustadz || `https://ui-avatars.com/api/?name=U&background=f1f5f9&color=cbd5e1`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                            </div>
                            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                                {uploading ? 'Proses...' : 'Unggah Foto'}
                                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
                            </label>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Modal View Detail */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Profil Lengkap Pengajar"
                width="600px"
                footer={<button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Selesai</button>}
            >
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 1rem', border: '4px solid #fff', boxShadow: 'var(--shadow-lg)' }}>
                                <img src={viewData.foto_ustadz || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewData.nama)}&size=256&background=1e3a8a&color=fff&bold=true`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary-dark)', marginBottom: '5px' }}>{viewData.nama}</h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '15px' }}>
                            <div>
                                <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem' }}>WhatsApp</small>
                                {viewData.no_hp ? (
                                    <a href={`https://wa.me/${viewData.no_hp.replace(/^0/, '62').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, fontSize: '1.1rem', color: '#25D366', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <i className="fab fa-whatsapp"></i> {viewData.no_hp}
                                    </a>
                                ) : <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>-</div>}
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem' }}>Tugas Mengajar</small>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>{viewData.kelas || '-'}</div>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem' }}>Status Keaktifan</small>
                                <div style={{ fontWeight: 700 }}>{viewData.status}</div>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem' }}>ID Cloud</small>
                                <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{viewData.id}</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem' }}>Alamat Domisili</small>
                            <p style={{ marginTop: '8px', fontSize: '1rem', lineHeight: '1.6' }}>{viewData.alamat || 'Alamat belum dilengkapi.'}</p>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}