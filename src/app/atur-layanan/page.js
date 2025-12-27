'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';

export default function AturLayananPage() {
    const { isAdmin } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        unit: 'Sekretariat',
        nama_layanan: '',
        harga: '0',
        status: 'Aktif'
    });
    const [submitting, setSubmitting] = useState(false);

    const UNITS = ['Sekretariat', 'Keamanan', 'Pendidikan', 'Kesehatan', "Jam'iyyah"];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'layanan_master' });
            setData(res || []);
        } catch (e) {
            console.error(e);
            // If table doesn't exist, we'll get an empty array or error
            setData([]);
        }
        finally { setLoading(false); }
    };

    const openModal = (item = null) => {
        if (item) {
            setEditId(item.id);
            setFormData({ ...item });
        } else {
            setEditId(null);
            setFormData({
                unit: 'Sekretariat',
                nama_layanan: '',
                harga: '0',
                status: 'Aktif'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        try {
            await apiCall('saveData', 'POST', {
                type: 'layanan_master',
                data: editId ? { ...formData, id: editId } : formData
            });
            setIsModalOpen(false);
            loadData();
            alert('Konfigurasi layanan berhasil disimpan!');
        } catch (err) {
            alert('Gagal menyimpan: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const deleteItem = async (id) => {
        if (!confirm('Hapus master layanan ini?')) return;
        try {
            await apiCall('deleteData', 'POST', { type: 'layanan_master', id });
            loadData();
        } catch (err) { alert(err.message); }
    };

    const filteredData = data.filter(d =>
        (d.nama_layanan || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.unit || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Master Atur Layanan & Harga</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mengatur daftar layanan dan tarif resmi untuk setiap unit.</p>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                        <i className="fas fa-plus"></i> Tambah Layanan
                    </button>
                </div>

                <div className="table-controls">
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Cari layanan atau unit..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-outline" onClick={loadData} title="Refresh Data"><i className="fas fa-sync-alt"></i></button>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Unit</th>
                                <th>Nama Layanan</th>
                                <th>Harga (Tarif)</th>
                                <th>Status</th>
                                <th style={{ width: '150px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '4rem' }}>Sinkronisasi Data...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Belum ada data layanan. Tambahkan sekarang!</td></tr>
                            ) : filteredData.map(d => (
                                <tr key={d.id}>
                                    <td><span className="th-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{d.unit}</span></td>
                                    <td style={{ fontWeight: 700 }}>{d.nama_layanan}</td>
                                    <td style={{ fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(d.harga)}</td>
                                    <td>
                                        <span className={`th-badge ${d.status === 'Aktif' ? 'badge-success' : 'badge-danger'}`} style={{
                                            background: d.status === 'Aktif' ? '#dcfce7' : '#fee2e2',
                                            color: d.status === 'Aktif' ? '#166534' : '#991b1b',
                                        }}>
                                            {d.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
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

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? "Update Master Layanan" : "Tambah Master Layanan Baru"}
                footer={(
                    <>
                        <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Batal</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                        </button>
                    </>
                )}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Seksi / Unit</label>
                        <select className="form-control" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Nama Layanan</label>
                        <input
                            type="text"
                            className="form-control"
                            value={formData.nama_layanan}
                            onChange={e => setFormData({ ...formData, nama_layanan: e.target.value })}
                            placeholder="Contoh: KTS, Legalisir, Motor Baru..."
                            required
                        />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Harga Resmi (IDR)</label>
                            <input
                                type="number"
                                className="form-control"
                                value={formData.harga}
                                onChange={e => setFormData({ ...formData, harga: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-control" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                <option value="Aktif">Aktif</option>
                                <option value="Non-Aktif">Non-Aktif</option>
                            </select>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
