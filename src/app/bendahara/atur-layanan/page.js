'use client';

import React, { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/utils';
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

const UNITS = ['Sekretariat', 'Keamanan', 'Pendidikan', 'Kesehatan', "Jam'iyyah"];

export default function AturLayananPage() {
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, loading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, formData, setFormData, editId,
        handleSave, handleDelete, openModal, isAdmin
    } = useDataManagement('layanan_master', {
        unit: 'Sekretariat', nama_layanan: '', harga: '0', status: 'Aktif'
    });

    const stats = useMemo(() => [
        { title: 'Total Layanan', value: data.length, icon: 'fas fa-concierge-bell', color: 'var(--primary)' },
        { title: 'Layanan Aktif', value: data.filter(d => d.status === 'Aktif').length, icon: 'fas fa-check-circle', color: 'var(--success)' },
        { title: 'Rata-rata Tarif', value: formatCurrency(data.reduce((acc, d) => acc + parseInt(d.harga || 0), 0) / (data.length || 1)), icon: 'fas fa-tag', color: 'var(--warning)' }
    ], [data]);

    const displayData = data.filter(d =>
        (d.nama_layanan || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.unit || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { key: 'unit', label: 'Unit', render: (row) => <span className="th-badge">{row.unit}</span> },
        { key: 'nama_layanan', label: 'Nama Layanan', render: (row) => <span style={{ fontWeight: 700 }}>{row.nama_layanan}</span> },
        { key: 'harga', label: 'Tarif', render: (row) => <span style={{ fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(row.harga)}</span> },
        {
            key: 'status', label: 'Status', render: (row) => (
                <span className="th-badge" style={{ background: row.status === 'Aktif' ? '#dcfce7' : '#fee2e2', color: row.status === 'Aktif' ? '#166534' : '#991b1b' }}>{row.status}</span>
            )
        },
        {
            key: 'actions', label: 'Aksi', width: '150px', render: (row) => (
                <div className="table-actions">
                    <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)}><i className="fas fa-edit"></i></button>
                    {isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => setConfirmDelete({ open: true, id: row.id })}><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Master Layanan & Tarif Unit" subJudul="Konfigurasi administrasi seksi-seksi." />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Daftar Layanan Resmi"
                subtitle="Daftar harga layanan untuk tiap unit."
                headerActions={<button className="btn btn-primary btn-sm" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Layanan</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value) }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Layanan" : "Tambah Layanan"} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>}>
                <SelectInput label="Unit Terkait" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} options={UNITS} />
                <TextInput label="Nama Layanan" value={formData.nama_layanan} onChange={e => setFormData({ ...formData, nama_layanan: e.target.value })} required />
                <div className="form-grid">
                    <TextInput label="Harga Resmi (Rp)" type="number" value={formData.harga} onChange={e => setFormData({ ...formData, harga: e.target.value })} required icon="fas fa-money-bill-wave" />
                    <SelectInput label="Status" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} options={['Aktif', 'Non-Aktif']} />
                </div>
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Layanan?"
                message="Layanan ini tidak akan muncul lagi di menu transaksi unit."
            />
        </div>
    );
}
