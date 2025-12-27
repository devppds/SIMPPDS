'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
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
        tanggal: new Date().toISOString().split('T')[0],
        nama_santri: '', keluhan: '', diagnosa: '',
        tindakan: '', obat: '', petugas: '', status: 'Rawat Jalan'
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
                tanggal: new Date().toISOString().split('T')[0],
                nama_santri: '', keluhan: '', diagnosa: '',
                tindakan: '', obat: '', petugas: '', status: 'Rawat Jalan'
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
        (d.keluhan || '').toLowerCase().includes(search.toLowerCase())
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
                            placeholder="Cari nama santri atau keluhan..."
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
                                <th>Keluhan</th>
                                <th>Diagnosa</th>
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
                                    <td>{formatDate(d.tanggal)}</td>
                                    <td><div style={{ fontWeight: 700 }}>{d.nama_santri}</div></td>
                                    <td style={{ fontSize: '0.85rem' }}>{d.keluhan}</td>
                                    <td style={{ fontSize: '0.85rem' }}>{d.diagnosa || '-'}</td>
                                    <td>
                                        <span className="th-badge" style={{
                                            background: d.status === 'Rawat Inap' ? '#fee2e2' : '#f1f5f9',
                                            color: d.status === 'Rawat Inap' ? '#dc2626' : '#475569'
                                        }}>
                                            {d.status}
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
                        <input type="text" className="form-control" value={formData.nama_santri} onChange={e => setFormData({ ...formData, nama_santri: e.target.value })} required placeholder="Nama santri yang diperiksa" />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Tanggal Pemeriksaan</label>
                            <input type="date" className="form-control" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Status Perawatan</label>
                            <select className="form-control" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                <option value="Rawat Jalan">Rawat Jalan</option>
                                <option value="Rawat Inap">Rawat Inap</option>
                                <option value="Rujukan">Rujukan (RS)</option>
                                <option value="Sembuh">Sembuh</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Keluhan Santri</label>
                        <textarea className="form-control" value={formData.keluhan} onChange={e => setFormData({ ...formData, keluhan: e.target.value })} rows="2"></textarea>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Diagnosa</label>
                            <input type="text" className="form-control" value={formData.diagnosa} onChange={e => setFormData({ ...formData, diagnosa: e.target.value })} placeholder="Hasil analisa medis" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Obat yang Diberikan</label>
                            <input type="text" className="form-control" value={formData.obat} onChange={e => setFormData({ ...formData, obat: e.target.value })} placeholder="Jenis obat dan dosis" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tindakan Medis</label>
                        <textarea className="form-control" value={formData.tindakan} onChange={e => setFormData({ ...formData, tindakan: e.target.value })} rows="2"></textarea>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Petugas Medis (Pemeriksa)</label>
                        <input type="text" className="form-control" value={formData.petugas} onChange={e => setFormData({ ...formData, petugas: e.target.value })} placeholder="Nama perawat atau ustadz BK" />
                    </div>
                </form>
            </Modal>
        </div>
    );
}
