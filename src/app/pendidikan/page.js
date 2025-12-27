'use client';

import React, { useState, useEffect } from 'react';
import { apiCall } from '@/lib/utils';
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
        nama_kegiatan: '', kategori: 'Kurikulum', tanggal: new Date().toISOString().split('T')[0],
        pj: '', keterangan: '', status: 'Terlaksana'
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
                nama_kegiatan: '', kategori: 'Kurikulum', tanggal: new Date().toISOString().split('T')[0],
                pj: '', keterangan: '', status: 'Terlaksana'
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
        (d.nama_kegiatan || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.pj || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Agenda & Data Pendidikan</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mengelola {displayData.length} catatan kegiatan akademik.</p>
                    </div>
                    <div className="card-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                            <i className="fas fa-plus"></i> Tambah Agenda
                        </button>
                    </div>
                </div>

                <div className="table-controls">
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Cari agenda atau penanggung jawab..."
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
                                <th>Nama Kegiatan / Agenda</th>
                                <th>Kategori</th>
                                <th>Penanggung Jawab</th>
                                <th>Status</th>
                                <th style={{ width: '100px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>Sinkronisasi Data...</td></tr>
                            ) : displayData.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Belum ada agenda pendidikan.</td></tr>
                            ) : displayData.map(d => (
                                <tr key={d.id}>
                                    <td>{new Date(d.tanggal).toLocaleDateString('id-ID')}</td>
                                    <td><div style={{ fontWeight: 700 }}>{d.nama_kegiatan}</div></td>
                                    <td>{d.kategori}</td>
                                    <td>{d.pj}</td>
                                    <td>
                                        <span className="th-badge" style={{
                                            background: d.status === 'Terlaksana' ? '#dcfce7' : '#f1f5f9',
                                            color: d.status === 'Terlaksana' ? '#166534' : '#475569'
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
                title={editId ? "Edit Agenda Pendidikan" : "Tambah Agenda Pendidikan Baru"}
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
                        <label className="form-label">Nama Kegiatan / Agenda</label>
                        <input type="text" className="form-control" value={formData.nama_kegiatan} onChange={e => setFormData({ ...formData, nama_kegiatan: e.target.value })} required placeholder="Contoh: Ujian Semester Ganjil" />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Kategori</label>
                            <select className="form-control" value={formData.kategori} onChange={e => setFormData({ ...formData, kategori: e.target.value })}>
                                <option value="Kurikulum">Kurikulum</option>
                                <option value="Kesiswaan">Kesiswaan</option>
                                <option value="Sarpras">Sarana Prasarana</option>
                                <option value="Ekstrakurikuler">Ekstrakurikuler</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tanggal</label>
                            <input type="date" className="form-control" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Penanggung Jawab</label>
                            <input type="text" className="form-control" value={formData.pj} onChange={e => setFormData({ ...formData, pj: e.target.value })} placeholder="Nama koordinator" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-control" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                <option value="Rencana">Rencana</option>
                                <option value="Terlaksana">Terlaksana</option>
                                <option value="Batal">Batal</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Keterangan Tambahan</label>
                        <textarea className="form-control" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} rows="3"></textarea>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
