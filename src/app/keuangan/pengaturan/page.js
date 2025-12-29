'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiCall, formatCurrency } from '@/lib/utils';
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import { TextInput, SelectInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

const STATUS_OPTIONS = [
    'Biasa Baru', 'Biasa Lama', 'Ndalem 50% Baru', 'Ndalem 100% Baru',
    'Ndalem 50% Lama', 'Ndalem 100% Lama', 'PKJ', 'Nduduk', 'Dzuriyyah'
];

export default function PengaturanKeuanganPage() {
    const [listKelas, setListKelas] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, setData, loading, setLoading, submitting,
        isModalOpen, setIsModalOpen, formData, setFormData, editId,
        handleSave, handleDelete
    } = useDataManagement('keuangan_tarif', {
        kategori_status: 'Biasa Baru', kelas: 'Semua', nominal: ''
    });

    const loadEnrichedData = useCallback(async () => {
        setLoading(true);
        try {
            const [resTarif, resKelas] = await Promise.all([
                apiCall('getData', 'GET', { type: 'keuangan_tarif' }),
                apiCall('getData', 'GET', { type: 'master_kelas' })
            ]);
            setData(resTarif || []);
            const sortedKelas = (resKelas || []).sort((a, b) => a.urutan - b.urutan);
            setListKelas([{ nama_kelas: 'Semua', lembaga: 'Umum' }, ...sortedKelas]);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, [setData, setLoading]);

    useEffect(() => { loadEnrichedData(); }, [loadEnrichedData]);

    const columns = [
        { key: 'kategori_status', label: 'Status Santri', render: (row) => <strong>{row.kategori_status}</strong> },
        { key: 'kelas', label: 'Berlaku Kelas', render: (row) => <span className="th-badge">{row.kelas}</span> },
        { key: 'nominal', label: 'Syahriah', render: (row) => <span style={{ color: 'var(--success)', fontWeight: 800 }}>{formatCurrency(row.nominal)}</span> },
        {
            key: 'actions', label: 'Aksi', width: '120px', render: (row) => (
                <div className="table-actions">
                    <button className="btn-vibrant btn-vibrant-blue" onClick={() => { setFormData(row); setIsModalOpen(true); }}><i className="fas fa-edit"></i></button>
                    <button className="btn-vibrant btn-vibrant-red" onClick={() => setConfirmDelete({ open: true, id: row.id })}><i className="fas fa-trash"></i></button>
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Konfigurasi Tarif Syahriah" subJudul="Master data iuran bulanan santri." hideOnScreen={true} />

            <DataViewContainer
                title="Management Tarif"
                subtitle="Daftar besaran iuran berdasarkan status dan tingkat kelas."
                headerActions={<button className="btn btn-primary btn-sm" onClick={() => { setFormData({ kategori_status: 'Biasa Baru', kelas: 'Semua', nominal: '' }); setIsModalOpen(true); }}><i className="fas fa-plus"></i> Tambah Tarif</button>}
                tableProps={{ columns, data: data, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Tarif" : "Tarif Baru"} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>}>
                <SelectInput label="Status Santri" value={formData.kategori_status} onChange={e => setFormData({ ...formData, kategori_status: e.target.value })} options={STATUS_OPTIONS} />
                <SelectInput label="Tingkat Kelas" value={formData.kelas} onChange={e => setFormData({ ...formData, kelas: e.target.value })} options={listKelas.map(k => ({ value: k.nama_kelas, label: `${k.nama_kelas} ${k.lembaga !== 'Umum' ? `(${k.lembaga})` : ''}` }))} />
                <TextInput label="Nominal Iuran (Rp)" type="number" value={formData.nominal} onChange={e => setFormData({ ...formData, nominal: e.target.value })} required icon="fas fa-tag" />
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Tarif?"
                message="Data tarif ini akan dihapus dan mungkin mempengaruhi perhitungan tagihan kedepannya."
            />
        </div>
    );
}
