'use client';

import React, { useState, useEffect } from 'react';
import { useDataManagement } from '@/hooks/useDataManagement';
import { usePagePermission } from '@/lib/AuthContext';
import { apiCall } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import Modal from '@/components/Modal';
import { TextInput, SelectInput, TextAreaInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function KategoriPembayaranPage() {
    const { user } = useAuth();
    const { canEdit } = usePagePermission();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // useDataManagement with Elegant Delete Support
    const {
        data, setData, loading, submitting,
        formData, setFormData, handleSave, handleDelete,
        deleteState, setDeleteState, promptDelete, confirmDelete
    } = useDataManagement('master_kategori_pembayaran', {
        nama_kategori: '',
        kode: '',
        keterangan: '',
        urutan: 1,
        aktif: true
    });

    const openModal = (item = null) => {
        if (item) {
            setFormData(item);
            setEditingId(item.id);
        } else {
            setFormData({
                nama_kategori: '',
                kode: '',
                keterangan: '',
                urutan: (data.length + 1),
                aktif: true
            });
            setEditingId(null);
        }
        setIsModalOpen(true);
    };

    const onSubmit = async (e) => {
        await handleSave(e);
        // We manually manage the modal open state here
        setIsModalOpen(false);
        setEditingId(null);
    };

    const stats = [
        { title: 'Total Kategori', value: data.length, icon: 'fas fa-tags', color: 'var(--primary)' },
        { title: 'Kategori Aktif', value: data.filter(d => d.aktif).length, icon: 'fas fa-check-circle', color: 'var(--success)' },
        { title: 'Kategori Nonaktif', value: data.filter(d => !d.aktif).length, icon: 'fas fa-times-circle', color: 'var(--danger)' }
    ];

    const columns = [
        {
            key: 'urutan',
            label: '#',
            width: '60px',
            render: (row) => <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)' }}>{row.urutan}</div>
        },
        {
            key: 'nama_kategori',
            label: 'Nama Kategori',
            width: '250px',
            render: (row) => (
                <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{row.nama_kategori}</div>
                    <small style={{ color: 'var(--text-muted)' }}>Kode: {row.kode}</small>
                </div>
            )
        },
        {
            key: 'keterangan',
            label: 'Keterangan',
            className: 'hide-mobile',
            render: (row) => <span style={{ color: 'var(--text-muted)' }}>{row.keterangan || '-'}</span>
        },
        {
            key: 'aktif',
            label: 'Status',
            width: '100px',
            render: (row) => (
                <span className="th-badge" style={{
                    background: row.aktif ? '#dcfce7' : '#fee2e2',
                    color: row.aktif ? '#166534' : '#991b1b'
                }}>
                    {row.aktif ? 'Aktif' : 'Nonaktif'}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Aksi',
            width: '120px',
            render: (row) => canEdit && (
                <div className="table-actions">
                    <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)}>
                        <i className="fas fa-edit"></i>
                    </button>
                    {/* Use promptDelete instead of handleDelete(row.id) to avoid native confirm */}
                    <button className="btn-vibrant btn-vibrant-red" onClick={() => promptDelete(row.id)}>
                        <i className="fas fa-trash"></i>
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat
                judul="Kategori Pembayaran Santri"
                subJudul="Kelola kategori pembayaran untuk menentukan tarif syahriah"
                hideOnScreen={true}
            />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Master Kategori Pembayaran"
                subtitle={`${data.length} kategori terdaftar`}
                headerActions={
                    canEdit && (
                        <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                            <i className="fas fa-plus"></i> Tambah Kategori
                        </button>
                    )
                }
                tableProps={{ columns, data, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Kategori" : "Tambah Kategori"} width="600px">
                <form onSubmit={onSubmit}>
                    <TextInput
                        label="Nama Kategori"
                        value={formData.nama_kategori}
                        onChange={e => setFormData({ ...formData, nama_kategori: e.target.value })}
                        placeholder="Contoh: Biasa Lama, Ndalem 50% Baru"
                        required
                    />
                    <div className="form-grid">
                        <TextInput
                            label="Kode"
                            value={formData.kode}
                            onChange={e => setFormData({ ...formData, kode: e.target.value.toUpperCase() })}
                            placeholder="Contoh: BL, N50B"
                            required
                            maxLength={10}
                        />
                        <TextInput
                            label="Urutan"
                            type="number"
                            value={formData.urutan}
                            onChange={e => setFormData({ ...formData, urutan: parseInt(e.target.value) })}
                            required
                            min={1}
                        />
                    </div>
                    <TextAreaInput
                        label="Keterangan"
                        value={formData.keterangan}
                        onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                        placeholder="Deskripsi kategori pembayaran"
                        rows={3}
                    />
                    <SelectInput
                        label="Status"
                        value={formData.aktif ? 'true' : 'false'}
                        onChange={e => setFormData({ ...formData, aktif: e.target.value === 'true' })}
                        options={[
                            { value: 'true', label: 'Aktif' },
                            { value: 'false', label: 'Nonaktif' }
                        ]}
                    />
                    <div className="modal-actions">
                        <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                            Batal
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? <><i className="fas fa-spinner fa-spin"></i> Menyimpan...</> : 'Simpan'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Elegant Confirmation Modal via useDataManagement */}
            <ConfirmModal
                isOpen={deleteState.isOpen}
                onClose={() => setDeleteState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDelete}
                title={deleteState.title}
                message={deleteState.message}
                loading={submitting}
            />
        </div>
    );
}
