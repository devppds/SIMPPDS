'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';

export default function LayananInfoPage() {
    const { user, isAdmin } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState(null);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        unit: 'Sekretariat', nama_layanan: '', harga: '0', keterangan: '', aktif: '1'
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'layanan_info' });
            setData(res || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const myUnit = !isAdmin ? ({
        'sekretariat': 'Sekretariat',
        'bendahara': 'Bendahara',
        'keamanan': 'Keamanan',
        'pendidikan': 'Pendidikan',
        'kesehatan': 'Kesehatan',
        'jamiyyah': "Jam'iyyah",
        'madrasah_miu': 'Madrasah MIU'
    }[user?.role] || user?.role) : null;

    useEffect(() => {
        if (!isAdmin && myUnit) {
            setFormData(prev => ({ ...prev, unit: myUnit }));
        }
    }, [isAdmin, myUnit]);

    const displayData = data
        .filter(d => isAdmin || d.unit === myUnit)
        .filter(d => (d.nama_layanan || '').toLowerCase().includes(search.toLowerCase()) || (d.unit || '').toLowerCase().includes(search.toLowerCase()));

    const openModal = (item = null) => {
        if (item) {
            setEditId(item.id);
            setFormData({ ...item });
        } else {
            setEditId(null);
            setFormData({
                unit: isAdmin ? 'Sekretariat' : myUnit,
                nama_layanan: '',
                harga: '0',
                keterangan: '',
                aktif: '1'
            });
        }
        setIsModalOpen(true);
    };

    const openViewModal = (item) => {
        setViewData(item);
        setIsViewModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await apiCall('saveData', 'POST', {
                type: 'layanan_info',
                data: editId ? { ...formData, id: editId } : formData
            });
            setIsModalOpen(false);
            loadData();
            alert('Informasi layanan diperbarui!');
        } catch (err) { alert(err.message); }
        finally { setSubmitting(false); }
    };

    const deleteItem = async (id) => {
        if (!confirm('Hapus daftar layanan ini?')) return;
        try {
            await apiCall('deleteData', 'POST', { type: 'layanan_info', id });
            loadData();
        } catch (err) { alert(err.message); }
    };

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Informasi & Tarif Layanan</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daftar resmi tarif layanan administrasi pondok.</p>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                        <i className="fas fa-plus"></i> Tambah Layanan
                    </button>
                </div>

                <div className="table-controls" style={{ padding: '1rem 1.5rem' }}>
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
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Unit Pengampu</th>
                                <th>Nama Layanan</th>
                                <th>Tarif Terkini</th>
                                <th>Status</th>
                                <th style={{ width: '150px' }}>Opsi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>Memuat Data...</td></tr>
                            ) : displayData.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Belum ada data layanan.</td></tr>
                            ) : displayData.map(d => (
                                <tr key={d.id}>
                                    <td><span className="th-badge" style={{ background: '#eff6ff', color: '#1e40af' }}>{d.unit}</span></td>
                                    <td><div style={{ fontWeight: 800 }}>{d.nama_layanan}</div></td>
                                    <td style={{ fontWeight: 900, color: 'var(--success)' }}>{formatCurrency(d.harga)}</td>
                                    <td>
                                        <span className="th-badge" style={{ background: (d.aktif == 1 || d.aktif === 'Ya') ? '#dcfce7' : '#fee2e2', color: (d.aktif == 1 || d.aktif === 'Ya') ? '#166534' : '#991b1b' }}>
                                            {(d.aktif == 1 || d.aktif === 'Ya') ? 'TERSEDIA' : 'MENUNGGU'}
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
                title={editId ? "Pembaruan Info Layanan" : "Registrasi Layanan Baru"}
                footer={(
                    <>
                        <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Kembali</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Menyimpan...' : 'Simpan Info'}
                        </button>
                    </>
                )}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Nama Layanan</label>
                        <input type="text" className="form-control" value={formData.nama_layanan} onChange={e => setFormData({ ...formData, nama_layanan: e.target.value })} required placeholder="Contoh: Legalisir Ijazah" />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Unit Pengampu</label>
                            <select className="form-control" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} disabled={!isAdmin}>
                                {isAdmin ? ['Sekretariat', 'Bendahara', 'Pendidikan', 'Keamanan', 'Kesehatan', 'Jam\'iyyah'].map(u => <option key={u}>{u}</option>) : <option>{myUnit}</option>}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tarif Layanan (Rp)</label>
                            <input type="number" className="form-control" value={formData.harga} onChange={e => setFormData({ ...formData, harga: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Deskripsi / Syarat</label>
                        <textarea className="form-control" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} rows="3" placeholder="Informasi tambahan atau persyaratan layanan ini."></textarea>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Status Ketersediaan</label>
                        <select className="form-control" value={formData.aktif} onChange={e => setFormData({ ...formData, aktif: e.target.value })}>
                            <option value="1">Aktif (Tersedia)</option>
                            <option value="0">Non-Aktif (Tutup Sementara)</option>
                        </select>
                    </div>
                </form>
            </Modal>

            {/* Modal Detail View */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Rincian Informasi Layanan"
                footer={<button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Selesai</button>}
            >
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Katalog Layanan</div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary-dark)', margin: '5px 0' }}>{viewData.nama_layanan}</h2>
                            <div style={{ fontWeight: 700, color: 'var(--primary)' }}>Unit: {viewData.unit}</div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '15px', marginBottom: '1.5rem' }}>
                            <div style={{ textAlign: 'center' }}>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Tarif Layanan</small>
                                <div style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--success)' }}>{formatCurrency(viewData.harga)}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Status Saat Ini</small>
                                <span className="th-badge" style={{ background: (viewData.aktif == 1 || viewData.aktif === 'Ya') ? '#dcfce7' : '#fee2e2', color: (viewData.aktif == 1 || viewData.aktif === 'Ya') ? '#166534' : '#991b1b', padding: '6px 20px' }}>
                                    {(viewData.aktif == 1 || viewData.aktif === 'Ya') ? 'OPERASIONAL' : 'NON-AKTIF'}
                                </span>
                            </div>
                        </div>

                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '1.5rem', borderRadius: '15px' }}>
                            <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Deskripsi & Persyaratan</small>
                            <p style={{ lineHeight: '1.7', fontSize: '1.05rem', color: 'var(--primary-dark)', whiteSpace: 'pre-wrap' }}>
                                {viewData.keterangan || 'Tidak ada deskripsi atau persyaratan khusus untuk layanan ini.'}
                            </p>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}