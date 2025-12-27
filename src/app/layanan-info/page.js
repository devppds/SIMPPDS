'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';

export default function LayananInfoPage() {
    const { user, isAdmin } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
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

    // Default unit for new entries based on role
    useEffect(() => {
        if (!isAdmin && myUnit) {
            setFormData(prev => ({ ...prev, unit: myUnit }));
        }
    }, [isAdmin, myUnit]);

    const displayData = data.filter(d => isAdmin || d.unit === myUnit);

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
            alert('Sukses!');
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
        <div className="view">
            <div className="card">
                <div className="card-header">
                    <h2>Informasi & Tarif Layanan</h2>
                    <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                        <i className="fas fa-plus"></i> Tambah Layanan
                    </button>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Unit</th>
                                <th>Nama Layanan</th>
                                <th>Harga / Tarif</th>
                                <th>Keterangan</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center' }}>Memuat...</td></tr>
                            ) : displayData.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center' }}>Data Kosong.</td></tr>
                            ) : displayData.map(d => (
                                <tr key={d.id}>
                                    <td><span className="th-badge" style={{ background: '#eff6ff' }}>{d.unit}</span></td>
                                    <td><strong>{d.nama_layanan}</strong></td>
                                    <td style={{ fontWeight: 700 }}>{formatCurrency(d.harga)}</td>
                                    <td style={{ fontSize: '0.8rem' }}>{d.keterangan || '-'}</td>
                                    <td>
                                        <span className="th-badge" style={{ background: (d.aktif == 1 || d.aktif === 'Ya') ? '#dcfce7' : '#fee2e2' }}>
                                            {(d.aktif == 1 || d.aktif === 'Ya') ? 'Aktif' : 'Non-Aktif'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <button className="btn-vibrant btn-vibrant-blue btn-action" onClick={() => openModal(d)}><i className="fas fa-edit"></i></button>
                                            {isAdmin && <button className="btn-vibrant btn-vibrant-yellow btn-action" onClick={() => deleteItem(d.id)}><i className="fas fa-trash"></i></button>}
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
                title={editId ? "Edit Info Layanan" : "Tambah Info Layanan Baru"}
                footer={(
                    <>
                        <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Batal</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>Simpan</button>
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
                            <select
                                className="form-control"
                                value={formData.unit}
                                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                disabled={!isAdmin}
                            >
                                {isAdmin ? (
                                    <>
                                        <option>Sekretariat</option>
                                        <option>Bendahara</option>
                                        <option>Pendidikan</option>
                                        <option>Keamanan</option>
                                        <option>Kesehatan</option>
                                        <option>Jam'iyyah</option>
                                    </>
                                ) : (
                                    <option>{myUnit}</option>
                                )}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Harga / Biaya (Rp)</label>
                            <input type="number" className="form-control" value={formData.harga} onChange={e => setFormData({ ...formData, harga: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Keterangan</label>
                        <textarea className="form-control" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} rows="2"></textarea>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Status Aktif</label>
                        <select className="form-control" value={formData.aktif} onChange={e => setFormData({ ...formData, aktif: e.target.value })}>
                            <option value="1">Ya (Aktif)</option>
                            <option value="0">Tidak (Non-Aktif)</option>
                        </select>
                    </div>
                </form>
            </Modal>
        </div>
    );
}