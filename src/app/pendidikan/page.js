'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';

export default function PendidikanPage() {
    const { isAdmin } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        tanggal: new Date().toISOString().split('T')[0],
        nama_santri: '', kegiatan: '', nilai: '',
        kehadiran: 'Hadir', keterangan: '', ustadz: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'pendidikan' });
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
                nama_santri: '', kegiatan: '', nilai: '',
                kehadiran: 'Hadir', keterangan: '', ustadz: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        try {
            await apiCall('saveData', 'POST', {
                type: 'pendidikan',
                data: editId ? { ...formData, id: editId } : formData
            });
            setIsModalOpen(false);
            loadData();
        } catch (err) { alert(err.message); }
        finally { setSubmitting(false); }
    };

    const deleteItem = async (id) => {
        if (!confirm('Hapus data pendidikan ini?')) return;
        try {
            await apiCall('deleteData', 'POST', { type: 'pendidikan', id });
            loadData();
        } catch (err) { alert(err.message); }
    };

    const displayData = data.filter(d =>
        (d.nama_santri || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.kegiatan || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Agenda & Data Pendidikan</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mencatat {displayData.length} agenda kegiatan pendidikan.</p>
                    </div>
                    <div className="card-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                            <i className="fas fa-plus"></i> Input Nilai / Agenda
                        </button>
                    </div>
                </div>

                <div className="table-controls">
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Cari nama santri atau kegiatan..."
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
                                <th>Kegiatan</th>
                                <th>Nilai</th>
                                <th>Kehadiran</th>
                                <th style={{ width: '100px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>Sinkronisasi Data...</td></tr>
                            ) : displayData.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Belum ada data pendidikan.</td></tr>
                            ) : displayData.map(d => (
                                <tr key={d.id}>
                                    <td>{formatDate(d.tanggal)}</td>
                                    <td><div style={{ fontWeight: 700 }}>{d.nama_santri}</div></td>
                                    <td>{d.kegiatan}</td>
                                    <td style={{ fontWeight: 800 }}>{d.nilai || '-'}</td>
                                    <td>
                                        <span className="th-badge" style={{
                                            background: d.kehadiran === 'Hadir' ? '#dcfce7' : '#fee2e2',
                                            color: d.kehadiran === 'Hadir' ? '#166534' : '#991b1b'
                                        }}>
                                            {d.kehadiran}
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
                title={editId ? "Update Data Pendidikan" : "Input Pendidikan Baru"}
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
                            <label className="form-label">Nama Kegiatan</label>
                            <input type="text" className="form-control" value={formData.kegiatan} onChange={e => setFormData({ ...formData, kegiatan: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tanggal</label>
                            <input type="date" className="form-control" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Nilai / Hasil</label>
                            <input type="text" className="form-control" value={formData.nilai} onChange={e => setFormData({ ...formData, nilai: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Kehadiran</label>
                            <select className="form-control" value={formData.kehadiran} onChange={e => setFormData({ ...formData, kehadiran: e.target.value })}>
                                <option value="Hadir">Hadir</option>
                                <option value="Izin">Izin</option>
                                <option value="Sakit">Sakit</option>
                                <option value="Alpha">Alpha</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Pengajar / Ustadz</label>
                        <input type="text" className="form-control" value={formData.ustadz} onChange={e => setFormData({ ...formData, ustadz: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Keterangan</label>
                        <textarea className="form-control" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} rows="2"></textarea>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
