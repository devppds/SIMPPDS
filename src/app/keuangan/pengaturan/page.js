'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';

export default function PengaturanKeuanganPage() {
    const { isAdmin } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        kategori_status: 'Biasa Baru',
        kelas: 'Semua',
        nominal: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const STATUS_OPTIONS = [
        'Biasa Baru', 'Biasa Lama',
        'Ndalem 50% Baru', 'Ndalem 100% Baru',
        'Ndalem 50% Lama', 'Ndalem 100% Lama',
        'PKJ', 'Nduduk', 'Dzuriyyah'
    ];

    const [listKelas, setListKelas] = useState([]); // Dynamic Classes
    // const KELAS_OPTIONS = ['Semua', '1', '2', '3', '4', '5', '6'];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [resTarif, resKelas] = await Promise.all([
                apiCall('getData', 'GET', { type: 'keuangan_tarif' }), // Updated table name
                apiCall('getData', 'GET', { type: 'master_kelas' })
            ]);
            setData(resTarif || []);

            const sortedKelas = (resKelas || []).sort((a, b) => a.urutan - b.urutan);
            setListKelas([{ nama_kelas: 'Semua', lembaga: 'Umum' }, ...sortedKelas]);
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
                kategori_status: 'Biasa Baru',
                kelas: 'Semua',
                nominal: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await apiCall('saveData', 'POST', {
                type: 'keuangan_tarif',
                data: editId ? { ...formData, id: editId } : formData
            });
            setIsModalOpen(false);
            loadData();
            alert('Tarif berhasil disimpan!');
        } catch (err) { alert(err.message); }
        finally { setSubmitting(false); }
    };

    const deleteItem = async (id) => {
        if (!confirm('Hapus tarif ini?')) return;
        try {
            await apiCall('deleteData', 'POST', { type: 'keuangan_tarif', id });
            loadData();
        } catch (err) { alert(err.message); }
    };

    const columns = [
        { key: 'kategori_status', label: 'Status Santri', render: (row) => <strong>{row.kategori_status}</strong> },
        { key: 'kelas', label: 'Kelas', render: (row) => <span className="th-badge">{row.kelas}</span> },
        { key: 'nominal', label: 'Nominal Syahriah', render: (row) => <span style={{ color: 'var(--success)', fontWeight: 700 }}>{formatCurrency(row.nominal)}</span> },
        {
            key: 'actions',
            label: 'Aksi',
            width: '100px',
            sortable: false,
            render: (row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)}><i className="fas fa-edit"></i></button>
                    <button className="btn-vibrant btn-vibrant-red" onClick={() => deleteItem(row.id)}><i className="fas fa-trash"></i></button>
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Pengaturan Tarif Syahriah</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Atur besaran pembayaran sesuai Status dan Kelas santri.</p>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                        <i className="fas fa-plus"></i> Tambah Tarif
                    </button>
                </div>

                <SortableTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    emptyMessage="Belum ada data tarif."
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? "Edit Tarif" : "Tambah Tarif Baru"}
                footer={(
                    <>
                        <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Batal</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </>
                )}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Status Santri</label>
                        <select
                            className="form-control"
                            value={formData.kategori_status}
                            onChange={e => setFormData({ ...formData, kategori_status: e.target.value })}
                        >
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Berlaku Untuk Kelas</label>
                        <select
                            className="form-control"
                            value={formData.kelas}
                            onChange={e => setFormData({ ...formData, kelas: e.target.value })}
                        >
                            {listKelas.map((k, idx) => (
                                <option key={idx} value={k.nama_kelas}>{k.nama_kelas} {k.lembaga !== 'Umum' ? `(${k.lembaga})` : ''}</option>
                            ))}
                        </select>
                        <small style={{ color: 'var(--text-muted)' }}>Pilih 'Semua' jika tarif ini berlaku untuk semua kelas dengan status tersebut.</small>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Nominal Pembayaran (Rp)</label>
                        <input
                            type="number"
                            className="form-control"
                            value={formData.nominal}
                            onChange={e => setFormData({ ...formData, nominal: e.target.value })}
                            required
                            placeholder="Contoh: 500000"
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
}
