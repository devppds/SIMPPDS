'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiCall, formatCurrency, formatDate } from '@/lib/utils';
import { useDataManagement } from '@/hooks/useDataManagement';
import { usePagePermission } from '@/lib/AuthContext';
import Modal from '@/components/Modal';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function KasUnitPage() {
    const { canEdit, canDelete } = usePagePermission();
    const [units, setUnits] = useState(['Keamanan', 'Pendidikan', 'Kesehatan', 'Sekretariat', 'Jamiyyah']);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, setData, loading, setLoading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, formData, setFormData, editId,
        handleSave, handleDelete, openModal
    } = useDataManagement('kas_unit', {
        tanggal: '',
        tipe: 'Masuk', nominal: '', kategori: 'Setoran Unit',
        keterangan: '', petugas: ''
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'kas_unit' });
            const services = await apiCall('getData', 'GET', { type: 'layanan_admin' });

            // Merge or handle data as needed
            setData(res?.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)) || []);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, [setData, setLoading]);

    useEffect(() => { loadData(); }, [loadData]);

    const stats = useMemo(() => {
        const total = data.reduce((acc, d) => acc + parseInt(d.nominal || 0), 0);
        return [
            { title: 'Total Setoran Unit', value: formatCurrency(total), icon: 'fas fa-file-invoice-dollar', color: 'var(--primary)' }
        ];
    }, [data]);

    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => formatDate(row.tanggal) },
        { key: 'kategori', label: 'Unit/Kategori', render: (row) => <strong>{row.kategori}</strong> },
        { key: 'nominal', label: 'Nominal', render: (row) => <span style={{ fontWeight: 800 }}>{formatCurrency(row.nominal)}</span> },
        { key: 'petugas', label: 'Petugas' },
        {
            key: 'actions', label: 'Aksi', width: '100px', render: (row) => (
                <div className="table-actions">
                    {canEdit && <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)}><i className="fas fa-edit"></i></button>}
                    {canDelete && <button className="btn-vibrant btn-vibrant-red" onClick={() => setConfirmDelete({ open: true, id: row.id })}><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <StatsPanel items={stats} />

            <DataViewContainer
                title="Log Setoran Kas Unit"
                subtitle="Pantau dana yang masuk dari berbagai unit pelayanan pondok."
                headerActions={canEdit && (
                    <button className="btn btn-primary btn-sm" onClick={() => openModal()}><i className="fas fa-plus"></i> Input Setoran</button>
                )}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value) }}
                tableProps={{ columns, data, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Setoran" : "Input Setoran Unit"} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>}>
                <TextInput label="Tanggal" type="date" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} />
                <SelectInput label="Pilih Unit" value={formData.kategori} onChange={e => setFormData({ ...formData, kategori: e.target.value })} options={units.map(u => `Setoran Unit ${u}`)} />
                <TextInput label="Nominal (Rp)" type="number" value={formData.nominal} onChange={e => setFormData({ ...formData, nominal: e.target.value })} />
                <TextInput label="Nama Petugas" value={formData.petugas} onChange={e => setFormData({ ...formData, petugas: e.target.value })} />
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id); setConfirmDelete({ open: false, id: null }); loadData(); }}
                title="Hapus Data Setoran?"
                message="Data ini akan dihapus dari log bendahara."
            />
        </div>
    );
}
