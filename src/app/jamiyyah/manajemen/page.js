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
        { title: 'Total Santri Jamiyyah', value: data.reduce((acc, curr) => acc + (parseInt(curr.jumlah_santri) || 0), 0), icon: 'fas fa-user-friends', color: 'var(--success)' }
    ], [data]);

    const displayData = data.filter(d =>
        (d.nama_kelompok || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.wilayah || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        {
            key: 'kelompok',
            label: 'Kelompok (Wilayah)',
            render: (row) => (
                <div>
                    <div style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>{row.nama_kelompok}</div>
                    <small style={{ color: 'var(--text-muted)' }}>{row.wilayah}</small>
                </div>
            )
        },
        { key: 'jumlah_santri', label: 'Jml Santri', align: 'center', render: (row) => <span style={{ fontWeight: 700 }}>{row.jumlah_santri || 0}</span> },
        { key: 'ketua', label: 'Ketua', render: (row) => <div style={{ fontWeight: 600 }}>{row.ketua || '-'}</div> },
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
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Pengelolaan struktur organisasi ke-jam'iyyahan pusat dan wilayah.</p>
            </div>

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Struktur Jamiyyah"
                subtitle="Daftar wilayah dan kelompok yang terdaftar dalam koordinasi jam'iyyah."
                headerActions={canEdit && <button className="btn btn-primary" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Struktur</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari kelompok atau wilayah..." }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Data Jam'iyyah" : "Tambah Struktur Jam'iyyah Baru"} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Data'}</button>}>
                <div className="form-grid">
                    <TextInput label="Kelompok / Organisasi" value={formData.nama_kelompok} onChange={e => setFormData({ ...formData, nama_kelompok: e.target.value })} required placeholder="Contoh: JSPD / Tahiyatan Wasalaman" />
                    <SelectInput label="Wilayah / Afiliasi" value={formData.wilayah} onChange={e => setFormData({ ...formData, wilayah: e.target.value })} options={WILAYAH_OPTIONS} />
                </div>
                <div className="form-grid">
                    <TextInput label="Jumlah Santri" type="number" value={formData.jumlah_santri} onChange={e => setFormData({ ...formData, jumlah_santri: e.target.value })} placeholder="0" />
                    <TextInput label="Ketua" value={formData.ketua} onChange={e => setFormData({ ...formData, ketua: e.target.value })} placeholder="Nama Ketua" />
                </div>
                <TextInput label="Pembimbing" value={formData.pembimbing} onChange={e => setFormData({ ...formData, pembimbing: e.target.value })} placeholder="Nama Pembimbing" />
                <TextAreaInput label="Keterangan Lanjutan" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} />
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Data Struktur?"
                message="Data ini akan dihapus secara permanen."
            />
        </div>
    );
}
