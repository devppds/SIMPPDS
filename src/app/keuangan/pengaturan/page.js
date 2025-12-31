'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiCall, formatCurrency } from '@/lib/utils';
import { useDataManagement } from '@/hooks/useDataManagement';
import { usePagePermission } from '@/lib/AuthContext';
import Modal from '@/components/Modal';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function PengaturanKeuanganPage() {
    const { canEdit, canDelete } = usePagePermission();
    const [listKelas, setListKelas] = useState([]);
    const [kategoriList, setKategoriList] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, setData, loading, setLoading, submitting,
        isModalOpen, setIsModalOpen, formData, setFormData, editId,
        handleSave, handleDelete
    } = useDataManagement('keuangan_tarif', {
        kategori_status: 'Biasa Lama', kelas: 'Semua', nominal: ''
    });

    const loadEnrichedData = useCallback(async () => {
        setLoading(true);
        try {
            const [resTarif, resKelas, resKategori] = await Promise.all([
                apiCall('getData', 'GET', { type: 'keuangan_tarif' }),
                apiCall('getData', 'GET', { type: 'master_kelas' }),
                apiCall('getData', 'GET', { type: 'master_kategori_pembayaran' })
            ]);
            setData(resTarif || []);
            const sortedKelas = (resKelas || []).sort((a, b) => a.urutan - b.urutan);
            setListKelas([{ nama_kelas: 'Semua', lembaga: 'Umum' }, ...sortedKelas]);
            setKategoriList((resKategori || []).filter(k => k.aktif).sort((a, b) => a.urutan - b.urutan));
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, [setData, setLoading]);

    useEffect(() => { loadEnrichedData(); }, [loadEnrichedData]);

    const stats = [
        { title: 'Total Tarif', value: data.length, icon: 'fas fa-file-invoice-dollar', color: 'var(--primary)' },
        { title: 'Kategori Terdaftar', value: [...new Set(data.map(d => d.kategori_status))].length, icon: 'fas fa-tags', color: 'var(--success)' },
        { title: 'Kelas Spesifik', value: data.filter(d => d.kelas !== 'Semua').length, icon: 'fas fa-graduation-cap', color: 'var(--warning)' }
    ];

    const columns = [
        {
            key: 'kategori_status',
            label: 'Kategori Pembayaran',
            width: '220px',
            render: (row) => <strong>{row.kategori_status}</strong>
        },
        {
            key: 'kelas',
            label: 'Berlaku Kelas',
            width: '150px',
            render: (row) => <span className="th-badge">{row.kelas}</span>
        },
        {
            key: 'nominal',
            label: 'Nominal Syahriah',
            width: '180px',
            render: (row) => <span style={{ color: 'var(--success)', fontWeight: 800, fontSize: '1.1rem' }}>{formatCurrency(row.nominal)}</span>
        },
        {
            key: 'actions', label: 'Aksi', width: '120px', render: (row) => (
                <div className="table-actions">
                    {canEdit && <button className="btn-vibrant btn-vibrant-blue" onClick={() => { setFormData(row); setIsModalOpen(true); }}><i className="fas fa-edit"></i></button>}
                    {canDelete && <button className="btn-vibrant btn-vibrant-red" onClick={() => setConfirmDelete({ open: true, id: row.id })}><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Atur Tarif Pembayaran" subJudul="Kelola besaran iuran berdasarkan kategori dan kelas santri" hideOnScreen={true} />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Management Tarif Pembayaran"
                subtitle={`${data.length} tarif terdaftar`}
                headerActions={canEdit && <button className="btn btn-primary btn-sm" onClick={() => { setFormData({ kategori_status: 'Biasa Lama', kelas: 'Semua', nominal: '' }); setIsModalOpen(true); }}><i className="fas fa-plus"></i> Tambah Tarif</button>}
                tableProps={{ columns, data: data, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Tarif" : "Tarif Baru"} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>}>
                <SelectInput
                    label="Kategori Pembayaran"
                    value={formData.kategori_status}
                    onChange={e => setFormData({ ...formData, kategori_status: e.target.value })}
                    options={kategoriList.map(k => k.nama_kategori)}
                />
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
