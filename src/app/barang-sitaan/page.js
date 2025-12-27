'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';

export default function BarangSitaanPage() {
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
        tanggal: new Date().toISOString().split('T')[0],
        nama_santri: '', nama_barang: '', alasan_sita: '',
        status: 'Disita', petugas: '', tanggal_kembali: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const [santriOptions, setSantriOptions] = useState([]);

    useEffect(() => {
        loadData();
        fetchSantri();
    }, []);

    const fetchSantri = async () => {
        try {
            const res = await apiCall('getData', 'GET', { type: 'santri' });
            setSantriOptions(res || []);
        } catch (e) { console.error(e); }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'barang_sitaan' });
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
                tanggal: new Date().toISOString().split('T')[0],
                nama_santri: '', nama_barang: '', alasan_sita: '',
                status: 'Disita', petugas: '', tanggal_kembali: ''
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
                type: 'barang_sitaan',
                data: editId ? { ...formData, id: editId } : formData
            });
            setIsModalOpen(false);
            loadData();
        } catch (err) { alert(err.message); }
        finally { setSubmitting(false); }
    };

    const deleteItem = async (id) => {
        if (!confirm('Hapus data penyitaan ini?')) return;
        try {
            await apiCall('deleteData', 'POST', { type: 'barang_sitaan', id });
            loadData();
        } catch (err) { alert(err.message); }
    };

    const displayData = data.filter(d =>
        (d.nama_santri || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.nama_barang || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Barang Sitaan / Keamanan</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mencatat {displayData.length} barang santri yang disita petugas.</p>
                    </div>
                    <div className="card-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                            <i className="fas fa-plus"></i> Input Sitaan
                        </button>
                    </div>
                </div>

                <div className="table-controls">
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Cari nama santri atau barang..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Tanggal Sita</th>
                                <th>Nama Santri</th>
                                <th>Nama Barang</th>
                                <th>Status</th>
                                <th style={{ width: '150px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>Sinkronisasi Data...</td></tr>
                            ) : displayData.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Belum ada data barang sitaan.</td></tr>
                            ) : displayData.map(d => (
                                <tr key={d.id}>
                                    <td>{formatDate(d.tanggal)}</td>
                                    <td><div style={{ fontWeight: 700 }}>{d.nama_santri}</div></td>
                                    <td>{d.nama_barang}</td>
                                    <td>
                                        <span className="th-badge" style={{
                                            background: d.status === 'Dikembalikan' ? '#dcfce7' : '#fee2e2',
                                            color: d.status === 'Dikembalikan' ? '#166534' : '#991b1b'
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
                title={editId ? "Update Data Sitaan" : "Input Penyitaan Baru"}
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
                        <input
                            type="text"
                            className="form-control"
                            list="santri-list"
                            value={formData.nama_santri}
                            onChange={e => setFormData({ ...formData, nama_santri: e.target.value })}
                            required
                            placeholder="Ketik nama untuk mencari..."
                        />
                        <datalist id="santri-list">
                            {santriOptions.map((s, idx) => (
                                <option key={idx} value={s.nama_siswa}>{s.stambuk_pondok ? `[${s.stambuk_pondok}] ` : ''}{s.kamar || ''}</option>
                            ))}
                        </datalist>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Nama Barang</label>
                            <input type="text" className="form-control" value={formData.nama_barang} onChange={e => setFormData({ ...formData, nama_barang: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tanggal Sita</label>
                            <input type="date" className="form-control" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Alasan Penyitaan</label>
                        <textarea className="form-control" value={formData.alasan_sita} onChange={e => setFormData({ ...formData, alasan_sita: e.target.value })} rows="2"></textarea>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Status Barang</label>
                            <select className="form-control" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                <option value="Disita">Disita</option>
                                <option value="Proses">Proses Mediasi</option>
                                <option value="Dikembalikan">Dikembalikan</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Petugas (Keamanan)</label>
                            <input type="text" className="form-control" value={formData.petugas} onChange={e => setFormData({ ...formData, petugas: e.target.value })} />
                        </div>
                    </div>
                    {formData.status === 'Dikembalikan' && (
                        <div className="form-group">
                            <label className="form-label">Tanggal Dikembalikan</label>
                            <input type="date" className="form-control" value={formData.tanggal_kembali} onChange={e => setFormData({ ...formData, tanggal_kembali: e.target.value })} />
                        </div>
                    )}
                </form>
            </Modal>

            {/* Modal View Detail */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Detail Penyitaan Barang"
                footer={<button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Selesai</button>}
            >
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pelanggar / Santri</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{viewData.nama_santri}</div>
                            <span className="th-badge" style={{
                                background: viewData.status === 'Dikembalikan' ? '#dcfce7' : '#fee2e2',
                                color: viewData.status === 'Dikembalikan' ? '#166534' : '#991b1b',
                                marginTop: '10px'
                            }}>
                                Barang {viewData.status}
                            </span>
                        </div>
                        <div className="form-grid" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px' }}>
                            <div>
                                <small style={{ color: 'var(--text-muted)' }}>Nama Barang</small>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{viewData.nama_barang}</div>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)' }}>Tanggal Sita</small>
                                <div style={{ fontWeight: 600 }}>{formatDate(viewData.tanggal)}</div>
                            </div>
                        </div>
                        <div style={{ marginTop: '1.5rem' }}>
                            <small style={{ color: 'var(--text-muted)' }}>Alasan Penyitaan</small>
                            <div style={{ padding: '1rem', background: '#fffbeb', borderRadius: '8px', borderLeft: '4px solid #f59e0b', marginTop: '5px' }}>
                                {viewData.alasan_sita || 'Tidak ada alasan detail.'}
                            </div>
                        </div>
                        <div style={{ marginTop: '1.5rem' }}>
                            <small style={{ color: 'var(--text-muted)' }}>Petugas Penanggung Jawab</small>
                            <div style={{ fontWeight: 600, marginTop: '5px' }}>{viewData.petugas || '-'}</div>
                        </div>
                        {viewData.status === 'Dikembalikan' && (
                            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#dcfce7', borderRadius: '8px' }}>
                                <small style={{ color: '#166534' }}>Tanggal Pengembalian</small>
                                <div style={{ fontWeight: 800, color: '#14532d' }}>{formatDate(viewData.tanggal_kembali)}</div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}