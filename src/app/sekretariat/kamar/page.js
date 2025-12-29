'use client';

import React, { useState, useEffect } from 'react';
import { apiCall } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';

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
        nama_kamar: '1', asrama: 'DS A', kapasitas: '10', penasihat: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [penasihatList, setPenasihatList] = useState([]); // List of Staff

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [res, santri, resUstadz, resPengurus] = await Promise.all([
                apiCall('getData', 'GET', { type: 'kamar' }),
                apiCall('getData', 'GET', { type: 'santri' }),
                apiCall('getData', 'GET', { type: 'ustadz' }),
                apiCall('getData', 'GET', { type: 'pengurus' })
            ]);
            setAllSantri(santri || []);

            // Combine Staff Data
            const staff = [
                ...(resUstadz || []).map(u => ({ id: `u-${u.id}`, nama: u.nama, role: 'Pengajar' })),
                ...(resPengurus || []).map(p => ({ id: `p-${p.id}`, nama: p.nama, role: p.jabatan || 'Pengurus' }))
            ].sort((a, b) => a.nama.localeCompare(b.nama));
            setPenasihatList(staff);

            const rooms = res || [];
            const occupancies = {};

            (santri || []).forEach(s => {
                if (s.kamar) {
                    occupancies[s.kamar] = (occupancies[s.kamar] || 0) + 1;
                }
            });

            const enrichedRooms = rooms.map(r => {
                // Format logic: "DS A 01"
                const num = r.nama_kamar.toString().padStart(2, '0');
                const fullName = `${r.asrama} ${num}`;

                // Matches "DS A 01" OR "DS A - 1" (legacy) OR raw "1"
                const occupiedCount = occupancies[fullName] || occupancies[`${r.asrama} - ${r.nama_kamar}`] || occupancies[r.nama_kamar] || 0;

                return {
                    ...r,
                    formattedName: fullName, // Store for easy access
                    terisi: occupiedCount
                };
            });

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
                nama_kamar: '1', asrama: 'DS A', kapasitas: '10', penasihat: ''
            });
        }
        setIsModalOpen(true);
    };

    const openViewModal = (item) => {
        const fullName = `${item.asrama} - ${item.nama_kamar}`;
        const occupants = allSantri.filter(s => s.kamar === fullName || s.kamar === item.nama_kamar);
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

    const columns = [
        { key: 'nama_kamar', label: 'Nama Kamar', render: (row) => <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-dark)' }}>{row.formattedName || `${row.asrama} ${row.nama_kamar}`}</div> },
        { key: 'kapasitas', label: 'Kapasitas', render: (row) => <span style={{ fontWeight: 600 }}>{row.kapasitas} Bed</span> },
        {
            key: 'terisi',
            label: 'Tingkat Hunian',
            render: (row) => {
                const persentase = Math.min(100, Math.round(((row.terisi || 0) / (row.kapasitas || 1)) * 100));
                let progressColor = 'var(--primary)';
                if (persentase > 95) progressColor = 'var(--danger)';
                else if (persentase > 75) progressColor = 'var(--warning)';

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '150px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                            <span>{row.terisi} Terisi</span>
                            <span style={{ color: progressColor }}>{persentase}%</span>
                        </div>
                        <div style={{ width: '100%', background: '#f1f5f9', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                            <div style={{ width: `${persentase}%`, background: progressColor, height: '100%', borderRadius: '5px', transition: 'width 0.5s ease' }}></div>
                        </div>
                    </div>
                );
            }
        },
        { key: 'penasihat', label: 'Pengurus / Pengajar', render: (row) => <span style={{ fontWeight: 600 }}>{row.penasihat || '-'}</span> },
        {
            key: 'actions',
            label: 'Opsi',
            sortable: false,
            width: '150px',
            render: (row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openViewModal(row)} title="Lihat Penghuni"><i className="fas fa-eye"></i></button>
                    <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)} title="Edit"><i className="fas fa-edit"></i></button>
                    {isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => deleteItem(row.id)} title="Hapus"><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

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

                <SortableTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    emptyMessage="Data kamar belum tersedia."
                />
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
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Blok / Kompleks (Komplek)</label>
                            <select className="form-control" value={formData.asrama} onChange={e => setFormData({ ...formData, asrama: e.target.value })}>
                                {['DS A', 'DS B', 'DS C'].map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Nomor Kamar</label>
                            <select className="form-control" value={formData.nama_kamar} onChange={e => setFormData({ ...formData, nama_kamar: e.target.value })}>
                                {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                                    <option key={num} value={num}>{num}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Maksimal Kapasitas (Bed)</label>
                        <input type="number" className="form-control" value={formData.kapasitas} onChange={e => setFormData({ ...formData, kapasitas: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Pengurus / Pengajar (Penasihat)</label>
                        <select className="form-control" value={formData.penasihat} onChange={e => setFormData({ ...formData, penasihat: e.target.value })}>
                            <option value="">- Pilih Penasihat -</option>
                            {penasihatList.map(p => (
                                <option key={p.id} value={p.nama}>{p.nama} ({p.role})</option>
                            ))}
                        </select>
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
                            <small style={{ color: 'var(--primary)', fontWeight: 700 }}>Pengajar Pembimbing</small>
                            <div style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>{viewData.penasihat || 'Belum Ditentukan'}</div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}