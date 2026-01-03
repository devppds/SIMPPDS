'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiCall } from '@/lib/utils';
import { useAuth, usePagePermission } from '@/lib/AuthContext';
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput, TextAreaInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function JamiyyahManajemenPage() {
    const { isAdmin } = useAuth();
    const { canEdit, canDelete } = usePagePermission();
    const [mounted, setMounted] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const WILAYAH_OPTIONS = ['Pusat (JSPD)', 'Ahlussalam', 'Tahiyatan Wasalaman', 'Al Huda'];

    const {
        data, loading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, formData, setFormData, editId,
        handleSave, handleDelete, openModal
    } = useDataManagement('jamiyyah_kelompok', {
        nama_kelompok: '', wilayah: WILAYAH_OPTIONS[0], jumlah_santri: '', ketua: '', pembimbing: '', keterangan: ''
    });

    useEffect(() => { setMounted(true); }, []);

    const stats = useMemo(() => [
        { title: 'Total Kelompok', value: data.length, icon: 'fas fa-users-cog', color: 'var(--primary)' },
        { title: 'Total Santri Jamiyyah', value: data.reduce((acc, curr) => acc + (parseInt(curr.jumlah_santri) || 0), 0), icon: 'fas fa-user-friends', color: 'var(--success)' },
        { title: 'Wilayah Aktif', value: [...new Set(data.map(d => d.wilayah))].length, icon: 'fas fa-map-marked-alt', color: 'var(--warning)' }
    ], [data]);

    const displayData = data.filter(d =>
        (d.nama_kelompok || d.kelompok || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.wilayah || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        {
            key: 'kelompok',
            label: 'Kelompok / Organisasi',
            render: (row) => (
                <div style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>{row.nama_kelompok || row.kelompok}</div>
            )
        },
        {
            key: 'wilayah',
            label: 'Wilayah',
            render: (row) => (
                <span className="th-badge" style={{
                    background: row.wilayah === WILAYAH_OPTIONS[0] ? 'var(--primary-light)' : '#f1f5f9',
                    color: row.wilayah === WILAYAH_OPTIONS[0] ? 'var(--primary)' : 'var(--text-main)'
                }}>
                    {row.wilayah}
                </span>
            )
        },
        { key: 'jumlah_santri', label: 'Jml Santri', align: 'center', render: (row) => <span style={{ fontWeight: 700 }}>{row.jumlah_santri || 0}</span> },
        { key: 'ketua', label: 'Ketua / PJ', render: (row) => <div>{row.ketua || '-'}</div> },
        {
            key: 'actions', label: 'Opsi', width: '100px', render: (row) => (
                <div className="table-actions">
                    {canEdit && <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)}><i className="fas fa-edit"></i></button>}
                    {canDelete && <button className="btn-vibrant btn-vibrant-red" onClick={() => setConfirmDelete({ open: true, id: row.id })}><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    if (!mounted) return null;

    return (
        <div className="view-container animate-in">
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 className="outfit" style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>
                    Manajemen Jam’iyyah
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Pengelolaan struktur kelompok dan wilayah organisasi jam'iyyah santri.</p>
            </div>

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Kelola Struktur Jamiyyah"
                subtitle="Daftar wilayah dan kelompok jam'iyyah yang aktif dalam organisasi pondok."
                headerActions={canEdit && <button className="btn btn-primary" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Kelompok</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari kelompok atau wilayah..." }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Data Jam'iyyah" : "Tambah Struktur Jam'iyyah Baru"} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Data'}</button>}>
                <div className="form-grid">
                    <TextInput label="Nama Kelompok / Organisasi" value={formData.nama_kelompok} onChange={e => setFormData({ ...formData, nama_kelompok: e.target.value })} required placeholder="Contoh: JSPD Pusat / Kelompok Sholawat" />
                    <SelectInput label="Wilayah / Afiliasi" value={formData.wilayah} onChange={e => setFormData({ ...formData, wilayah: e.target.value })} options={WILAYAH_OPTIONS} />
                </div>
                <div className="form-grid">
                    <TextInput label="Jumlah Santri" type="number" value={formData.jumlah_santri} onChange={e => setFormData({ ...formData, jumlah_santri: e.target.value })} placeholder="0" />
                    <TextInput label="Ketua / Penanggung Jawab" value={formData.ketua} onChange={e => setFormData({ ...formData, ketua: e.target.value })} placeholder="Nama Ketua" />
                </div>
                <TextInput label="Pembimbing" value={formData.pembimbing} onChange={e => setFormData({ ...formData, pembimbing: e.target.value })} placeholder="Nama Pembimbing" />
                <TextAreaInput label="Keterangan Lanjutan" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} />
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Struktur Jam'iyyah?"
                message="Data kelompok/wilayah ini akan dihapus permanen dari manajemen."
            />
        </div>
    );
}
