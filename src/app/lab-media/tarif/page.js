'use client';

import React, { useState, useEffect } from 'react';
import { useDataManagement } from '@/hooks/useDataManagement';
import { usePagePermission } from '@/lib/AuthContext';
import { formatCurrency } from '@/lib/utils';
import Modal from '@/components/Modal';
import { TextInput, SelectInput } from '@/components/FormInput';
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import ConfirmModal from '@/components/ConfirmModal';

export default function AturTarifLabMediaPage() {
    const { canEdit, canDelete } = usePagePermission();

    const {
        data, loading, submitting,
        isModalOpen, setIsModalOpen, formData, setFormData, editId,
        handleSave, deleteState, setDeleteState, promptDelete, confirmDelete, openModal
    } = useDataManagement('unit_lab_media_tarif', {
        unit: 'Lab',
        nama_layanan: '',
        harga: '',
        keterangan: ''
    });

    const columns = [
        {
            key: 'unit',
            label: 'Unit',
            width: '120px',
            render: (row) => <span className={`th-badge ${row.unit === 'Lab' ? 'btn-vibrant-blue' : 'btn-vibrant-purple'}`} style={{ color: '#fff' }}>{row.unit}</span>
        },
        {
            key: 'nama_layanan',
            label: 'Nama Layanan',
            render: (row) => <strong>{row.nama_layanan}</strong>
        },
        {
            key: 'harga',
            label: 'Harga / Tarif',
            width: '150px',
            render: (row) => <span style={{ fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(row.harga)}</span>
        },
        {
            key: 'actions',
            label: 'Aksi',
            width: '120px',
            render: (row) => (
                <div className="table-actions">
                    {canEdit && <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)}><i className="fas fa-edit"></i></button>}
                    {canDelete && <button className="btn-vibrant btn-vibrant-red" onClick={() => promptDelete(row.id)}><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Pengaturan Tarif Lab & Media" subJudul="Kelola daftar harga layanan dan penyewaan alat." hideOnScreen={true} />

            <DataViewContainer
                title="Master Tarif Layanan"
                subtitle={`${data.length} layanan terdaftar`}
                headerActions={canEdit && <button className="btn btn-primary btn-sm" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Tarif</button>}
                tableProps={{ columns, data, loading }}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? "Update Tarif" : "Input Tarif Baru"}
                footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>}
            >
                <SelectInput
                    label="Unit"
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    options={['Lab', 'Media']}
                />
                <TextInput
                    label="Nama Layanan / Alat"
                    value={formData.nama_layanan}
                    onChange={e => setFormData({ ...formData, nama_layanan: e.target.value })}
                    placeholder="Contoh: Print Warna A4, Rental Kamera DSLR"
                />
                <TextInput
                    label="Harga (Rp)"
                    type="number"
                    value={formData.harga}
                    onChange={e => setFormData({ ...formData, harga: e.target.value })}
                    icon="fas fa-tag"
                />
                <TextInput
                    label="Keterangan"
                    value={formData.keterangan}
                    onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                    placeholder="Contoh: Per lembar, Per 24 jam"
                />
            </Modal>

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
