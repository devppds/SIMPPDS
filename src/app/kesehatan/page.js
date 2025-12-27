'use client';

import React, { useState, useEffect } from 'react';
import { apiCall } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';

export default function KesehatanPage() {
    const { isAdmin } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        nama_santri: '', mulai_sakit: new Date().toISOString().split('T')[0],
        gejala: '', obat_tindakan: '', status_periksa: 'Rawat Jalan',
        keterangan: '', biaya_obat: '0'
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'kesehatan' });
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
                nama_santri: '', mulai_sakit: new Date().toISOString().split('T')[0],
                gejala: '', obat_tindakan: '', status_periksa: 'Rawat Jalan',
                keterangan: '', biaya_obat: '0'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        try {
            await apiCall('saveData', 'POST', {
                type: 'kesehatan',
                data: editId ? { ...formData, id: editId } : formData
            });
            setIsModalOpen(false);
            loadData();
        } catch (err) { alert(err.message); }
        finally { setSubmitting(false); }
    };

    const deleteItem = async (id) => {
        if (!confirm('Hapus rekam medis ini?')) return;
        try {
            await apiCall('deleteData', 'POST', { type: 'kesehatan', id });
            loadData();
        } catch (err) { alert(err.message); }
    };

    const displayData = data.filter(d =>
        (d.nama_santri || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.gejala || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Layanan Kesehatan (BK)</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mencatat {displayData.length} riwayat pemeriksaan santri.</p>
                    </div>
                    <div className="card-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                            <i className="fas fa-print"></i>
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                            <i className="fas fa-plus"></i> Input Rekam Medis
                        </button>
                    </div>
                </div>

                <div className="table-controls">
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Cari nama santri atau gejala..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Tanggal Mulai</th>
                                <th>Nama Santri</th>
                                <th>Gejala</th>
                                <th>Obat/Tindakan</th>
                                <th>Status</th>
                                <th style={{ width: '100px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>Sinkronisasi Data...</td></tr>
                            ) : displayData.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Belum ada data pemeriksaan.</td></tr>
                            ) : displayData.map(d => (
                                <tr key={d.id}>
                                    <td>{d.mulai_sakit}</td>
                                    <td><div style={{ fontWeight: 700 }}>{d.nama_santri}</div></td>
                                    <td style={{ fontSize: '0.85rem' }}>{d.gejala}</td>
                                    <td style={{ fontSize: '0.85rem' }}>{d.obat_tindakan || '-'}</td>
                                    <td>
                                        <span className="th-badge" style={{
                                            background: d.status_periksa === 'Rawat Inap' ? '#fee2e2' : '#f1f5f9',
                                            color: d.status_periksa === 'Rawat Inap' ? '#dc2626' : '#475569'
                                        }}>
                                            {d.status_periksa}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(d)}><i className="fas fa-edit"></i></button>
                                            {isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => deleteItem(d.id)}><i className="fas fa-trash"></i></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? "Pembaruan Rekam Medis" : "Input Rekam Medis Baru"}
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
                        <input type="text" className="form-control" value={formData.nama_santri} onChange={e => setFormData({ ...formData, nama_santri: e.target.value })} required placeholder="Nama santri" />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Mulai Sakit</label>
                            <input type="date" className="form-control" value={formData.mulai_sakit} onChange={e => setFormData({ ...formData, mulai_sakit: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Status Periksa</label>
                            <select className="form-control" value={formData.status_periksa} onChange={e => setFormData({ ...formData, status_periksa: e.target.value })}>
                                <option value="Rawat Jalan">Rawat Jalan</option>
                                <option value="Rawat Inap">Rawat Inap</option>
                                <option value="Rujukan">Rujukan</option>
                                <option value="Sembuh">Sembuh</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Gejala / Keluhan</label>
                        <textarea className="form-control" value={formData.gejala} onChange={e => setFormData({ ...formData, gejala: e.target.value })} rows="2"></textarea>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Obat & Tindakan</label>
                        <input type="text" className="form-control" value={formData.obat_tindakan} onChange={e => setFormData({ ...formData, obat_tindakan: e.target.value })} placeholder="Jenis obat dan dosis" />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Biaya Obat (Jika Ada)</label>
                            <input type="number" className="form-control" value={formData.biaya_obat} onChange={e => setFormData({ ...formData, biaya_obat: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Keterangan</label>
                            <input type="text" className="form-control" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} placeholder="Catatan tambahan" />
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
