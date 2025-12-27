'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';

export default function KeamananRegPage() {
    const { isAdmin } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        tanggal: new Date().toISOString().split('T')[0],
        nama_santri: '', nama_barang: '', merk: '',
        kategori: 'Elektronik', nomor_seri: '', keterangan: '', status: 'Tedaftar'
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'keamanan_reg' });
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
                nama_santri: '', nama_barang: '', merk: '',
                kategori: 'Elektronik', nomor_seri: '', keterangan: '', status: 'Terdaftar'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        try {
            await apiCall('saveData', 'POST', {
                type: 'keamanan_reg',
                data: editId ? { ...formData, id: editId } : formData
            });
            setIsModalOpen(false);
            loadData();
        } catch (err) { alert(err.message); }
        finally { setSubmitting(false); }
    };

    const deleteItem = async (id) => {
        if (!confirm('Hapus registrasi barang ini?')) return;
        try {
            await apiCall('deleteData', 'POST', { type: 'keamanan_reg', id });
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
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Registrasi Barang Santri</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mendata {displayData.length} barang milik santri yang diizinkan.</p>
                    </div>
                    <div className="card-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                            <i className="fas fa-plus"></i> Registrasi Barang
                        </button>
                    </div>
                </div>

                <div className="table-controls">
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Cari nama santri atau nama barang..."
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
                                <th>Nama Barang</th>
                                <th>Merk / Seri</th>
                                <th>Kategori</th>
                                <th style={{ width: '100px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>Sinkronisasi Data...</td></tr>
                            ) : displayData.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Belum ada registrasi barang.</td></tr>
                            ) : displayData.map(d => (
                                <tr key={d.id}>
                                    <td>{formatDate(d.tanggal)}</td>
                                    <td><div style={{ fontWeight: 700 }}>{d.nama_santri}</div></td>
                                    <td>{d.nama_barang}</td>
                                    <td>{d.merk} {d.nomor_seri ? `(${d.nomor_seri})` : ''}</td>
                                    <td>
                                        <span className="th-badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                                            {d.kategori}
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
                title={editId ? "Update Registrasi Barang" : "Registrasi Barang Baru"}
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
                        <label className="form-label">Nama Santri (Pemilik)</label>
                        <input type="text" className="form-control" value={formData.nama_santri} onChange={e => setFormData({ ...formData, nama_santri: e.target.value })} required placeholder="Nama santri pemilik barang" />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Nama Barang</label>
                            <input type="text" className="form-control" value={formData.nama_barang} onChange={e => setFormData({ ...formData, nama_barang: e.target.value })} required placeholder="Contoh: Laptop, Alat Musik, dsb" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Kategori</label>
                            <select className="form-control" value={formData.kategori} onChange={e => setFormData({ ...formData, kategori: e.target.value })}>
                                <option value="Elektronik">Elektronik</option>
                                <option value="Alat Musik">Alat Musik</option>
                                <option value="Peralatan">Peralatan</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Merk / Brand</label>
                            <input type="text" className="form-control" value={formData.merk} onChange={e => setFormData({ ...formData, merk: e.target.value })} placeholder="Contoh: ASUS, Sony, dsb" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Nomor Seri (Serial Number)</label>
                            <input type="text" className="form-control" value={formData.nomor_seri} onChange={e => setFormData({ ...formData, nomor_seri: e.target.value })} placeholder="Opsional" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tanggal Registrasi</label>
                        <input type="date" className="form-control" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Keterangan Kondisi / Tambahan</label>
                        <textarea className="form-control" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} rows="3"></textarea>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
