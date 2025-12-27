'use client';

import React, { useState, useEffect } from 'react';
import { apiCall } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';

export default function KamarPage() {
    const { isAdmin } = useAuth();
    const [data, setData] = useState([]);
    const [stats, setStats] = useState({ total: 0, filled: 0 });
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        nama_kamar: '', asrama: 'Pondok Pusat', kapasitas: '10', penasihat: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'kamar' });
            const santri = await apiCall('getData', 'GET', { type: 'santri' });

            const rooms = res || [];
            const occupancies = {};

            (santri || []).forEach(s => {
                if (s.kamar) {
                    occupancies[s.kamar] = (occupancies[s.kamar] || 0) + 1;
                }
            });

            const enrichedRooms = rooms.map(r => ({
                ...r,
                terisi: occupancies[r.nama_kamar] || 0
            }));

            setData(enrichedRooms);

            const totalKap = enrichedRooms.reduce((acc, r) => acc + parseInt(r.kapasitas || 0), 0);
            const totalFill = enrichedRooms.reduce((acc, r) => acc + (r.terisi || 0), 0);
            setStats({ total: totalKap, filled: totalFill });

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
                nama_kamar: '', asrama: 'Pondok Pusat', kapasitas: '10', penasihat: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        try {
            await apiCall('saveData', 'POST', {
                type: 'kamar',
                data: editId ? { ...formData, id: editId } : formData
            });
            setIsModalOpen(false);
            loadData();
            alert(editId ? 'Data kamar diperbarui!' : 'Kamar baru telah ditambahkan!');
        } catch (err) { alert(err.message); }
        finally { setSubmitting(false); }
    };

    const deleteItem = async (id) => {
        if (!confirm('Hapus data kamar ini? Semua riwayat okupansi akan terpengaruh.')) return;
        try {
            await apiCall('deleteData', 'POST', { type: 'kamar', id });
            loadData();
        } catch (err) { alert(err.message); }
    };

    return (
        <div className="view-container">
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '8px' }}>Manajemen Hunian</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Pemantauan kapasitas asrama dan distribusi santri di setiap gending.</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <i className="fas fa-plus"></i> Tambah Kamar
                </button>
            </div>

            <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}><i className="fas fa-bed"></i></div>
                    <div className="stat-info">
                        <div className="stat-label">Total Kapasitas Bed</div>
                        <div className="stat-value">{stats.total}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}><i className="fas fa-user-check"></i></div>
                    <div className="stat-info">
                        <div className="stat-label">Santri Menetap</div>
                        <div className="stat-value">{stats.filled}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#dcfce7', color: '#059669' }}><i className="fas fa-door-open"></i></div>
                    <div className="stat-info">
                        <div className="stat-label">Kamar Terdaftar</div>
                        <div className="stat-value">{data.length}</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Identitas Kamar</th>
                                <th>Lokasi Asrama</th>
                                <th>Kapasitas</th>
                                <th>Tingkat Hunian</th>
                                <th>Ustadz Pembimbing</th>
                                <th style={{ width: '120px' }}>Opsi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '4rem' }}>Menganalisa okupansi kamar...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Data kamar belum tersedia.</td></tr>
                            ) : data.map(d => {
                                const persentase = Math.min(100, Math.round(((d.terisi || 0) / (d.kapasitas || 1)) * 100));
                                let progressColor = 'var(--primary)';
                                if (persentase > 95) progressColor = 'var(--danger)';
                                else if (persentase > 75) progressColor = 'var(--warning)';

                                return (
                                    <tr key={d.id}>
                                        <td><div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-dark)' }}>{d.nama_kamar}</div></td>
                                        <td><span className="th-badge" style={{ background: '#f1f5f9', color: 'var(--text-main)' }}>{d.asrama}</span></td>
                                        <td style={{ fontWeight: 600 }}>{d.kapasitas} Bed</td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '150px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                                                    <span>{d.terisi} Terisi</span>
                                                    <span style={{ color: progressColor }}>{persentase}%</span>
                                                </div>
                                                <div style={{ width: '100%', background: '#f1f5f9', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${persentase}%`, background: progressColor, height: '100%', borderRadius: '5px', transition: 'width 0.5s ease' }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{d.penasihat || '-'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(d)} title="Edit"><i className="fas fa-edit"></i></button>
                                                {isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => deleteItem(d.id)} title="Hapus"><i className="fas fa-trash"></i></button>}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? "Pembaruan Informasi Kamar" : "Pendaftaran Kamar Baru"}
                footer={(
                    <>
                        <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Batalkan</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Menyimpan...' : 'Simpan Kamar'}
                        </button>
                    </>
                )}
            >
                <form onSubmit={handleSubmit} className="animate-in">
                    <div className="form-group">
                        <label className="form-label">Nama Kamar / Gending</label>
                        <input type="text" className="form-control" value={formData.nama_kamar} onChange={e => setFormData({ ...formData, nama_kamar: e.target.value })} required placeholder="Contoh: Bilal Bin Rabah 05" />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Gedung / Kompleks Asrama</label>
                            <input type="text" className="form-control" value={formData.asrama} onChange={e => setFormData({ ...formData, asrama: e.target.value })} placeholder="Contoh: Gedung A Lt. 2" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Maksimal Kapasitas (Bed)</label>
                            <input type="number" className="form-control" value={formData.kapasitas} onChange={e => setFormData({ ...formData, kapasitas: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Ustadz Penasihat Kamar</label>
                        <input type="text" className="form-control" value={formData.penasihat} onChange={e => setFormData({ ...formData, penasihat: e.target.value })} placeholder="Nama lengkap pembimbing kamar" />
                    </div>
                </form>
            </Modal>
        </div>
    );
}