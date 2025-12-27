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
        nama_santri: '', jenis_barang: 'Elektronik', detail_barang: '',
        jenis_kendaraan: '-', jenis_elektronik: '-', plat_nomor: '-',
        warna: '', merk: '', aksesoris_1: '-', aksesoris_2: '-', aksesoris_3: '-',
        keadaan: 'Baik', kamar_penempatan: '', tanggal_registrasi: new Date().toISOString().split('T')[0],
        petugas_penerima: '', keterangan: '', status_barang_reg: 'Aktif'
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
                nama_santri: '', jenis_barang: 'Elektronik', detail_barang: '',
                jenis_kendaraan: '-', jenis_elektronik: '-', plat_nomor: '-',
                warna: '', merk: '', aksesoris_1: '-', aksesoris_2: '-', aksesoris_3: '-',
                keadaan: 'Baik', kamar_penempatan: '', tanggal_registrasi: new Date().toISOString().split('T')[0],
                petugas_penerima: '', keterangan: '', status_barang_reg: 'Aktif'
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
        if (!confirm('Hapus registrasi ini?')) return;
        try {
            await apiCall('deleteData', 'POST', { type: 'keamanan_reg', id });
            loadData();
        } catch (err) { alert(err.message); }
    };

    const displayData = data.filter(d =>
        (d.nama_santri || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.detail_barang || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Registrasi Barang Santri</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mencatat {displayData.length} barang milik santri.</p>
                    </div>
                    <div className="card-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                            <i className="fas fa-plus"></i> Registrasi Baru
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
                                <th>Tanggal</th>
                                <th>Pemilik</th>
                                <th>Jenis</th>
                                <th>Detail Barang</th>
                                <th>Status</th>
                                <th style={{ width: '100px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>Sinkronisasi Data...</td></tr>
                            ) : displayData.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Belum ada data registrasi.</td></tr>
                            ) : displayData.map(d => (
                                <tr key={d.id}>
                                    <td>{formatDate(d.tanggal_registrasi)}</td>
                                    <td><div style={{ fontWeight: 700 }}>{d.nama_santri}</div></td>
                                    <td>{d.jenis_barang}</td>
                                    <td>{d.detail_barang} {d.merk && `(${d.merk})`}</td>
                                    <td>
                                        <span className="th-badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                                            {d.status_barang_reg}
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
                title={editId ? "Update Registrasi" : "Registrasi Barang Baru"}
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
                        <input type="text" className="form-control" value={formData.nama_santri} onChange={e => setFormData({ ...formData, nama_santri: e.target.value })} required />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Jenis Barang</label>
                            <select className="form-control" value={formData.jenis_barang} onChange={e => setFormData({ ...formData, jenis_barang: e.target.value })}>
                                <option value="Elektronik">Elektronik</option>
                                <option value="Kendaraan">Kendaraan</option>
                                <option value="Alat Musik">Alat Musik</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Detail Nama Barang</label>
                            <input type="text" className="form-control" value={formData.detail_barang} onChange={e => setFormData({ ...formData, detail_barang: e.target.value })} required />
                        </div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Merk</label>
                            <input type="text" className="form-control" value={formData.merk} onChange={e => setFormData({ ...formData, merk: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Warna</label>
                            <input type="text" className="form-control" value={formData.warna} onChange={e => setFormData({ ...formData, warna: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Kondisi Barang</label>
                            <select className="form-control" value={formData.keadaan} onChange={e => setFormData({ ...formData, keadaan: e.target.value })}>
                                <option value="Baik">Baik</option>
                                <option value="Rusak Ringan">Rusak Ringan</option>
                                <option value="Rusak Berat">Rusak Berat</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Kamar Penempatan</label>
                            <input type="text" className="form-control" value={formData.kamar_penempatan} onChange={e => setFormData({ ...formData, kamar_penempatan: e.target.value })} />
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
