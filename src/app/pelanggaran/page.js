'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';

export default function PelanggaranPage() {
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
        nama_santri: '', jenis_pelanggaran: 'Ringan', poin: '5',
        takzir: '', keterangan: '', petugas: ''
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
            const res = await apiCall('getData', 'GET', { type: 'keamanan' });
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
                nama_santri: '', jenis_pelanggaran: 'Ringan', poin: '5',
                takzir: '', keterangan: '', petugas: ''
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
                type: 'keamanan',
                data: editId ? { ...formData, id: editId } : formData
            });
            setIsModalOpen(false);
            loadData();
        } catch (err) { alert(err.message); }
        finally { setSubmitting(false); }
    };

    const deleteItem = async (id) => {
        if (!confirm('Hapus catatan ini?')) return;
        try {
            await apiCall('deleteData', 'POST', { type: 'keamanan', id });
            loadData();
        } catch (err) { alert(err.message); }
    };

    const displayData = data.filter(d =>
        (d.nama_santri || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="view-container">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Ringkasan Kedisiplinan</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mencatat {displayData.length} pelanggaran santri.</p>
                    </div>
                    <div className="card-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => window.print()} title="Cetak Laporan">
                            <i className="fas fa-print"></i>
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                            <i className="fas fa-plus"></i> Input Baru
                        </button>
                    </div>
                </div>

                <div className="table-controls">
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Cari nama santri..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Nama Santri</th>
                                <th>Jenis</th>
                                <th>Poin</th>
                                <th>Takzir (Sanksi)</th>
                                <th style={{ width: '150px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>Sinkronisasi Data...</td></tr>
                            ) : displayData.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Belum ada catatan pelanggaran.</td></tr>
                            ) : displayData.map(d => (
                                <tr key={d.id}>
                                    <td>{formatDate(d.tanggal)}</td>
                                    <td><div style={{ fontWeight: 700 }}>{d.nama_santri}</div></td>
                                    <td>
                                        <span className="th-badge" style={{
                                            background: d.jenis_pelanggaran === 'Berat' ? '#fee2e2' : d.jenis_pelanggaran === 'Sedang' ? '#fffbeb' : '#f1f5f9',
                                            color: d.jenis_pelanggaran === 'Berat' ? '#dc2626' : d.jenis_pelanggaran === 'Sedang' ? '#9a3412' : '#475569'
                                        }}>
                                            {d.jenis_pelanggaran}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 800 }}>{d.poin || 0}</td>
                                    <td style={{ fontSize: '0.85rem' }}>{d.takzir || '-'}</td>
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
                title={editId ? "Pembaruan Catatan" : "Catat Pelanggaran"}
                footer={(
                    <>
                        <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Batal</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Proses...' : 'Simpan'}
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
                            <label className="form-label">Tanggal Kejadian</label>
                            <input type="date" className="form-control" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Jenis Pelanggaran</label>
                            <select className="form-control" value={formData.jenis_pelanggaran} onChange={e => setFormData({ ...formData, jenis_pelanggaran: e.target.value })}>
                                <option value="Ringan">Ringan</option>
                                <option value="Sedang">Sedang</option>
                                <option value="Berat">Berat</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Poin Pelanggaran</label>
                            <input type="number" className="form-control" value={formData.poin} onChange={e => setFormData({ ...formData, poin: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Petugas (Penindak)</label>
                            <input type="text" className="form-control" value={formData.petugas} onChange={e => setFormData({ ...formData, petugas: e.target.value })} placeholder="Nama petugas keamanan" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Takzir / Sanksi</label>
                        <textarea className="form-control" value={formData.takzir} onChange={e => setFormData({ ...formData, takzir: e.target.value })} rows="2" placeholder="Sanksi yang diberikan"></textarea>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Keterangan Tambahan</label>
                        <textarea className="form-control" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} rows="2"></textarea>
                    </div>
                </form>
            </Modal>

            {/* Modal View Detail */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Detail Pelanggaran"
                footer={<button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Selesai</button>}
            >
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Nama Santri</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{viewData.nama_santri}</div>
                            <span className="th-badge" style={{
                                background: viewData.jenis_pelanggaran === 'Berat' ? '#fee2e2' : viewData.jenis_pelanggaran === 'Sedang' ? '#fffbeb' : '#f1f5f9',
                                color: viewData.jenis_pelanggaran === 'Berat' ? '#dc2626' : viewData.jenis_pelanggaran === 'Sedang' ? '#9a3412' : '#475569',
                                marginTop: '10px'
                            }}>
                                Pelanggaran {viewData.jenis_pelanggaran}
                            </span>
                        </div>
                        <div className="form-grid" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px' }}>
                            <div>
                                <small style={{ color: 'var(--text-muted)' }}>Tanggal Kejadian</small>
                                <div style={{ fontWeight: 600 }}>{formatDate(viewData.tanggal)}</div>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)' }}>Poin Dicatat</small>
                                <div style={{ fontWeight: 800, color: 'var(--danger)' }}>{viewData.poin} Poin</div>
                            </div>
                        </div>
                        <div style={{ marginTop: '1.5rem' }}>
                            <small style={{ color: 'var(--text-muted)' }}>Takzir / Sanksi</small>
                            <div style={{ padding: '1rem', background: '#fffbeb', borderLeft: '4px solid #f59e0b', borderRadius: '4px', margin: '5px 0', fontSize: '0.95rem' }}>
                                {viewData.takzir || 'Tidak Ada Sanksi'}
                            </div>
                        </div>
                        <div style={{ marginTop: '1rem' }}>
                            <small style={{ color: 'var(--text-muted)' }}>Petugas Penindak</small>
                            <div style={{ fontWeight: 600 }}>{viewData.petugas || '-'}</div>
                        </div>
                        <div style={{ marginTop: '1rem' }}>
                            <small style={{ color: 'var(--text-muted)' }}>Catatan Tambahan</small>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{viewData.keterangan || 'Tidak ada catatan tambahan.'}</p>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}