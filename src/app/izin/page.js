'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';

export default function IzinPage() {
    const { isAdmin } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState(null);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        tanggal_mulai: new Date().toISOString().split('T')[0],
        tanggal_selesai: '', nama_santri: '', alasan: '',
        keperluan: 'Pulang Rumah', status: 'Menunggu', penjemput: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'izin' });
            setData(res || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openModal = (item = null) => {
        if (item) {
            setEditId(item.id);
            setFormData({ ...item });
        } else {
            setEditId(null);
            setFormData({
                tanggal_mulai: new Date().toISOString().split('T')[0],
                tanggal_selesai: '', nama_santri: '', alasan: '',
                keperluan: 'Pulang Rumah', status: 'Menunggu', penjemput: ''
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
            await apiCall('saveData', 'POST', {
                type: 'izin',
                data: editId ? { ...formData, id: editId } : formData
            });
            setIsModalOpen(false);
            loadData();
        } catch (err) { alert(err.message); }
        finally { setSubmitting(false); }
    };

    const deleteItem = async (id) => {
        if (!confirm('Hapus data perizinan ini?')) return;
        try {
            await apiCall('deleteData', 'POST', { type: 'izin', id });
            loadData();
        } catch (err) { alert(err.message); }
    };

    const displayData = data.filter(d =>
        (d.nama_santri || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.alasan || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Perizinan & Keluar Pondok</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mengelola {displayData.length} data izin santri.</p>
                    </div>
                    <div className="card-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                            <i className="fas fa-plus"></i> Buat Surat Izin
                        </button>
                    </div>
                </div>

                <div className="table-controls">
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Cari nama santri atau alasan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Berlaku</th>
                                <th>Nama Santri</th>
                                <th>Keperluan</th>
                                <th>Status</th>
                                <th style={{ width: '150px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>Sinkronisasi Data...</td></tr>
                            ) : displayData.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Belum ada data perizinan.</td></tr>
                            ) : displayData.map(d => (
                                <tr key={d.id}>
                                    <td style={{ fontSize: '0.85rem' }}>
                                        {formatDate(d.tanggal_mulai)} <br />
                                        <span style={{ opacity: 0.5 }}>s/d</span> {formatDate(d.tanggal_selesai)}
                                    </td>
                                    <td><div style={{ fontWeight: 700 }}>{d.nama_santri}</div></td>
                                    <td>{d.keperluan}</td>
                                    <td>
                                        <span className="th-badge" style={{
                                            background: d.status === 'Aktif' ? '#dcfce7' : d.status === 'Menunggu' ? '#fffbeb' : '#f1f5f9',
                                            color: d.status === 'Aktif' ? '#166534' : d.status === 'Menunggu' ? '#9a3412' : '#475569'
                                        }}>
                                            {d.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn-vibrant btn-vibrant-purple" onClick={() => openViewModal(d)} title="Lihat Detail"><i className="fas fa-eye"></i></button>
                                            <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(d)} title="Edit"><i className="fas fa-edit"></i></button>
                                            {isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => deleteItem(d.id)} title="Hapus"><i className="fas fa-trash"></i></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Input/Edit */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? "Update Surat Izin" : "Buat Izin Baru"}
                footer={(
                    <>
                        <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Batal</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Memproses...' : 'Simpan'}
                        </button>
                    </>
                )}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Nama Santri</label>
                        <input type="text" className="form-control" value={formData.nama_santri} onChange={e => setFormData({ ...formData, nama_santri: e.target.value })} required />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Tanggal Mulai</label>
                            <input type="date" className="form-control" value={formData.tanggal_mulai} onChange={e => setFormData({ ...formData, tanggal_mulai: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Estimasi Kembali</label>
                            <input type="date" className="form-control" value={formData.tanggal_selesai} onChange={e => setFormData({ ...formData, tanggal_selesai: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Keperluan</label>
                            <select className="form-control" value={formData.keperluan} onChange={e => setFormData({ ...formData, keperluan: e.target.value })}>
                                <option value="Pulang Rumah">Pulang Rumah</option>
                                <option value="Izin Keluar Sebentar">Izin Keluar Sebentar</option>
                                <option value="Sakit / Berobat">Sakit / Berobat</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Penjemput (Wali)</label>
                            <input type="text" className="form-control" value={formData.penjemput} onChange={e => setFormData({ ...formData, penjemput: e.target.value })} placeholder="Nama penjemput" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Alasan Detail</label>
                        <textarea className="form-control" value={formData.alasan} onChange={e => setFormData({ ...formData, alasan: e.target.value })} rows="3"></textarea>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Status Izin</label>
                        <select className="form-control" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                            <option value="Menunggu">Menunggu Persetujuan</option>
                            <option value="Aktif">Disetujui (Aktif)</option>
                            <option value="Kembali">Sudah Kembali</option>
                            <option value="Terlambat">Terlambat Kembali</option>
                        </select>
                    </div>
                </form>
            </Modal>

            {/* Modal View Detail */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Detail Perizinan"
                footer={<button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Selesai</button>}
            >
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nama Santri</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{viewData.nama_santri}</div>
                            <span className="th-badge" style={{
                                background: viewData.status === 'Aktif' ? '#dcfce7' : viewData.status === 'Menunggu' ? '#fffbeb' : '#f1f5f9',
                                color: viewData.status === 'Aktif' ? '#166534' : viewData.status === 'Menunggu' ? '#9a3412' : '#475569',
                                marginTop: '10px'
                            }}>
                                Izin {viewData.status}
                            </span>
                        </div>
                        <div className="form-grid" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px' }}>
                            <div>
                                <small style={{ color: 'var(--text-muted)' }}>Mulai Izin</small>
                                <div style={{ fontWeight: 600 }}>{formatDate(viewData.tanggal_mulai)}</div>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)' }}>Rencana Kembali</small>
                                <div style={{ fontWeight: 600 }}>{formatDate(viewData.tanggal_selesai)}</div>
                            </div>
                        </div>
                        <div style={{ marginTop: '1.5rem' }}>
                            <small style={{ color: 'var(--text-muted)' }}>Tujuan / Keperluan</small>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>{viewData.keperluan}</div>
                        </div>
                        <div style={{ marginTop: '1rem' }}>
                            <small style={{ color: 'var(--text-muted)' }}>Penjemput</small>
                            <div style={{ fontWeight: 600 }}>{viewData.penjemput || 'Diijinkan Sendiri'}</div>
                        </div>
                        <div style={{ marginTop: '1rem' }}>
                            <small style={{ color: 'var(--text-muted)' }}>Alasan Detail</small>
                            <div style={{ padding: '1rem', background: '#f1f5f9', borderRadius: '8px', marginTop: '5px' }}>
                                {viewData.alasan || 'Tidak ada alasan detail.'}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}