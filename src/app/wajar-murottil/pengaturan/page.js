'use client';

import React, { useState, useEffect } from 'react';
import { apiCall } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';

export default function PengaturanWajarPage() {
    const { isAdmin } = useAuth();
    const [data, setData] = useState([]);
    const [jabatanList, setJabatanList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ nama_pengurus: '', kelompok: '', jabatan: 'Wajar & Murottil', keterangan: '' });
    const [editId, setEditId] = useState(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [resPengurus, resJabatan] = await Promise.all([
                apiCall('getData', 'GET', { type: 'wajar_pengurus' }),
                apiCall('getData', 'GET', { type: 'master_jabatan' })
            ]);
            setData(resPengurus || []);
            setJabatanList(resJabatan || []);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const openModal = (item = null) => {
        if (item) {
            setEditId(item.id);
            setFormData({ ...item });
        } else {
            setEditId(null);
            setFormData({ nama_pengurus: '', kelompok: '', jabatan: '', keterangan: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiCall('saveData', 'POST', {
                type: 'wajar_pengurus',
                data: editId ? { ...formData, id: editId } : formData
            });
            setIsModalOpen(false);
            loadData();
            alert('Data Pengurus Wajar-Murottil berhasil disimpan!');
        } catch (e) { alert(e.message); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus pengurus ini dari daftar Wajar-Murottil?')) return;
        try {
            await apiCall('deleteData', 'POST', { type: 'wajar_pengurus', id });
            loadData();
        } catch (e) { alert(e.message); }
    };

    const columns = [
        { key: 'kelompok', label: 'Kelompok', render: (row) => <span className="th-badge">{row.kelompok || '-'}</span> },
        { key: 'nama_pengurus', label: 'Nama Pengurus', render: (row) => <strong>{row.nama_pengurus}</strong> },
        { key: 'jabatan', label: 'Jabatan' },
        { key: 'keterangan', label: 'Keterangan' },
        {
            key: 'actions',
            label: 'Aksi',
            render: (row) => (
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)}><i className="fas fa-edit"></i></button>
                    <button className="btn-vibrant btn-vibrant-red" onClick={() => handleDelete(row.id)}><i className="fas fa-trash"></i></button>
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Pengaturan Kelompok</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manajemen staf pengajar & penempatan kelompok.</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Pengurus</button>
                </div>
                <SortableTable columns={columns} data={data} loading={loading} emptyMessage="Belum ada data pengurus Wajar-Murottil." />
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Edit Pengurus" : "Tambah Pengurus Baru"}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Nama Pengurus</label>
                        <input type="text" className="form-control" value={formData.nama_pengurus} onChange={e => setFormData({ ...formData, nama_pengurus: e.target.value })} required />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Kelompok</label>
                            <input type="text" className="form-control" value={formData.kelompok} onChange={e => setFormData({ ...formData, kelompok: e.target.value })} placeholder="Contoh: Kelompok 1" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Jabatan (Dari Master)</label>
                            <select
                                className="form-control"
                                value={formData.jabatan}
                                onChange={e => setFormData({ ...formData, jabatan: e.target.value })}
                            >
                                <option value="">- Pilih Jabatan -</option>
                                {jabatanList.map((j, i) => (
                                    <option key={i} value={j.nama_jabatan}>{j.nama_jabatan}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Keterangan</label>
                        <textarea className="form-control" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })}></textarea>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                        <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Batal</button>
                        <button type="submit" className="btn btn-primary">Simpan</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
