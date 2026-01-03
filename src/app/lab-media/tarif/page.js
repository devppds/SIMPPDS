'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiCall, formatCurrency } from '@/lib/utils';
import { useAuth, usePagePermission } from '@/lib/AuthContext';
import { useDataManagement } from '@/hooks/useDataManagement';
import DataViewContainer from '@/components/DataViewContainer';
import PremiumBanner from '@/components/PremiumBanner';
import Modal from '@/components/Modal';
import { TextInput, SelectInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function LabTarifPage() {
    const { user } = useAuth();
    const { canEdit, canDelete } = usePagePermission();
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, loading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, formData, setFormData, editId,
        handleSave, handleDelete, openModal
    } = useDataManagement('unit_lab_media_tarif', {
        unit: 'Lab',
        nama_layanan: '',
        harga: '',
        kategori: 'Utama'
    });

    const columns = [
        { key: 'unit', label: 'Unit', width: '120px', render: (row) => <span className={`th-badge ${row.unit === 'Lab' ? 'bg-blue' : 'bg-purple'}`}>{row.unit}</span> },
        { key: 'nama_layanan', label: 'Nama Layanan/Barang', render: (row) => <strong style={{ fontSize: '1.1rem' }}>{row.nama_layanan}</strong> },
        { key: 'kategori', label: 'Kategori' },
        { key: 'harga', label: 'Harga / Tarif', render: (row) => <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '1.1rem' }}>{formatCurrency(row.harga)}</span> },
        {
            key: 'actions', label: 'Opsi', width: '120px', render: (row) => (
                <div className="table-actions">
                    {canEdit && <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)}><i className="fas fa-edit"></i></button>}
                    {canDelete && <button className="btn-vibrant btn-vibrant-red" onClick={() => setConfirmDelete({ open: true, id: row.id })}><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    const displayData = data.filter(d =>
        d.nama_layanan.toLowerCase().includes(search.toLowerCase()) ||
        d.unit.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="view-container animate-in">
            <PremiumBanner
                title="Pengaturan Tarif Layanan"
                subtitle="Konfigurasi harga rental PC, biaya cetak, dan tarif jasa media lainnya."
                icon="fas fa-tags"
                floatingIcon="fas fa-cog"
                bgGradient="linear-gradient(135deg, #1e293b 0%, #334155 100%)"
            />

            <DataViewContainer
                title="Daftar Master Tarif"
                subtitle="Gunakan tabel ini untuk mengatur harga standar layanan Lab & Media."
                headerActions={canEdit && <button className="btn btn-primary" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Tarif Baru</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari layanan..." }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Tarif" : "Tambah Tarif"} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>Simpan Perubahan</button>}>
                <div className="form-grid">
                    <SelectInput label="Pilih Unit" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} options={['Lab', 'Media']} />
                    <SelectInput label="Kategori" value={formData.kategori} onChange={e => setFormData({ ...formData, kategori: e.target.value })} options={['Utama', 'Rental', 'Percetakan', 'Dokumentasi', 'Lainnya']} />
                </div>
                <TextInput label="Nama Layanan" value={formData.nama_layanan} onChange={e => setFormData({ ...formData, nama_layanan: e.target.value })} placeholder="Contoh: Rental PC / Jam atau Print Warna" />
                <TextInput label="Harga (Rp)" type="number" value={formData.harga} onChange={e => setFormData({ ...formData, harga: e.target.value })} icon="fas fa-money-bill" />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    * Khusus layanan <strong>Rental</strong>, sistem akan menghitung tarif secara otomatis per menit berdasarkan harga per jam ini.
                </p>
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => {
                    await handleDelete(confirmDelete.id);
                    setConfirmDelete({ open: false, id: null });
                }}
                title="Hapus Tarif?"
                message="Data tarif ini akan dihapus permanen. Tindakan ini tidak dapat dibatalkan."
            />
        </div>
    );
}
