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

const DEFAULT_CATEGORIES = [
    { nama_kategori: 'Biasa Lama', kode: 'BL', keterangan: 'Santri reguler lama', urutan: 1, aktif: true },
    { nama_kategori: 'Ndalem 50% Baru', kode: 'N50B', keterangan: 'Subsidi 50% untuk keluarga ndalem baru', urutan: 2, aktif: true },
    { nama_kategori: 'Ndalem 100% Baru', kode: 'N100B', keterangan: 'Gratis untuk keluarga ndalem baru', urutan: 3, aktif: true },
    { nama_kategori: 'PKJ', kode: 'PKJ', keterangan: 'Program Khusus Jawa', urutan: 4, aktif: true },
    { nama_kategori: 'Nduduk', kode: 'ND', keterangan: 'Santri mondok tanpa sekolah formal', urutan: 5, aktif: true }
];

export default function KategoriPembayaranPage() {
    const { user } = useAuth();
    const { canEdit } = usePagePermission();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isSeeding, setIsSeeding] = useState(false);

    const {
        data, setData, loading, submitting,
        formData, setFormData, handleSubmit, handleDelete
    } = useDataManagement('master_kategori_pembayaran', {
        nama_kategori: '',
        kode: '',
        keterangan: '',
        urutan: 1,
        aktif: true
    });

    // Auto-seed default categories if empty
    useEffect(() => {
        const seedDefaultCategories = async () => {
            if (data.length === 0 && !loading && !isSeeding) {
                setIsSeeding(true);
                try {
                    for (const category of DEFAULT_CATEGORIES) {
                        await apiCall('saveData', 'POST', {
                            type: 'master_kategori_pembayaran',
                            data: category
                        });
                    }
                    // Reload data
                    const newData = await apiCall('getData', 'GET', { type: 'master_kategori_pembayaran' });
                    setData(newData || []);
                } catch (e) {
                    console.error('Failed to seed categories:', e);
                } finally {
                    setIsSeeding(false);
                }
            }
        };

        seedDefaultCategories();
    }, [data.length, loading, isSeeding, setData]);

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
        e.preventDefault();
        const success = await handleSubmit(editingId);
        if (success) {
            setIsModalOpen(false);
            setEditingId(null);
        }
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
                    <button className="btn-vibrant btn-vibrant-red" onClick={() => handleDelete(row.id)}>
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
                subtitle={isSeeding ? "Membuat kategori default..." : `${data.length} kategori terdaftar`}
                headerActions={
                    canEdit && (
                        <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                            <i className="fas fa-plus"></i> Tambah Kategori
                        </button>
                    )
                }
                tableProps={{ columns, data, loading: loading || isSeeding }}
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
        </div>
    );
}
