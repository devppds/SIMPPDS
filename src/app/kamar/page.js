'use client';

import React, { useState, useEffect } from 'react';
import { apiCall } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';

export default function KamarPage() {
    const { isAdmin } = useAuth();
    const [data, setData] = useState([]);
    const [allSantri, setAllSantri] = useState([]);
    const [stats, setStats] = useState({ total: 0, filled: 0 });
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState(null);
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
            setAllSantri(santri || []);

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

    const openViewModal = (item) => {
        const occupants = allSantri.filter(s => s.kamar === item.nama_kamar);
        setViewData({ ...item, occupants });
        setIsViewModalOpen(true);
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
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Manajemen Hunian (Kamar)</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pantau kapasitas asrama dan distribusi santri di setiap gending.</p>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                        <i className="fas fa-plus"></i> Tambah Kamar
                    </button>
                </div>

                <div className="stats-grid" style={{ marginBottom: '2.5rem', padding: '0 1.5rem' }}>
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

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Identitas Kamar</th>
                                <th>Lokasi Asrama</th>
                                <th>Kapasitas</th>
                                <th>Tingkat Hunian</th>
                                <th>Ustadz Pembimbing</th>
                                <th style={{ width: '150px' }}>Opsi</th>
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
                                                <button className="btn-vibrant btn-vibrant-purple" onClick={() => openViewModal(d)} title="Lihat Penghuni"><i className="fas fa-eye"></i></button>
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

            {/* Modal Input/Edit */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? "Pembaruan Informasi Kamar" : "Pendaftaran Kamar Baru"}
                footer={(
                    <>
                        <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Batalkan</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Menyimpan...' : 'Simpan Kamar'}
                        </button>
                    </>
                )}
            >
                <form onSubmit={handleSubmit}>
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

            {/* Modal View Detail */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Detail & Penghuni Kamar"
                footer={<button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Selesai</button>}
            >
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Identitas Kamar</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{viewData.nama_kamar}</div>
                            <div style={{ color: 'var(--primary)', fontWeight: 600 }}>{viewData.asrama}</div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '1.2rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ fontWeight: 700 }}>Okupansi Bed</span>
                                <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{viewData.terisi} / {viewData.kapasitas} Terisi</span>
                            </div>
                            <div style={{ width: '100%', background: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(100, (viewData.terisi / viewData.kapasitas) * 100)}%`, background: 'var(--primary)', height: '100%' }}></div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-dark)', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', marginBottom: '12px' }}>
                                <i className="fas fa-users" style={{ marginRight: '8px' }}></i> Daftar Penghuni Santri
                            </h4>
                            {viewData.occupants.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {viewData.occupants.map((s, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: '#fff', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem' }}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{s.nama_siswa}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stambuk: {s.stambuk_pondok || '-'} | Kelas: {s.kelas || '-'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: '#f8fafc', borderRadius: '8px' }}>
                                    Belum ada santri terdaftar di kamar ini.
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--primary-light)', borderRadius: '8px' }}>
                            <small style={{ color: 'var(--primary)', fontWeight: 700 }}>Ustadz Pembimbing</small>
                            <div style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>{viewData.penasihat || 'Belum Ditentukan'}</div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}