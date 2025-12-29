'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiCall } from '@/lib/utils';
import { useDataManagement } from '@/hooks/useDataManagement';
import { usePagePermission } from '@/lib/AuthContext';
import Modal from '@/components/Modal';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import { TextInput, SelectInput, TextAreaInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function PengaturanWajarPage() {
    const { canEdit, canDelete } = usePagePermission();
    const [jabatanList, setJabatanList] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
    const isMounted = useRef(true);

    const {
        data, setData, loading, setLoading, submitting,
        isModalOpen, setIsModalOpen, formData, setFormData, editId,
        handleSave, handleDelete, openModal
    } = useDataManagement('wajar_pengurus', {
        nama_pengurus: '', kelompok: '', jabatan: 'Wajar & Murottil', keterangan: ''
    });

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const loadEnrichedData = useCallback(async () => {
        if (isMounted.current) setLoading(true);
        try {
            const [resPengurus, resJabatan] = await Promise.all([
                apiCall('getData', 'GET', { type: 'wajar_pengurus' }),
                apiCall('getData', 'GET', { type: 'master_jabatan' })
            ]);
            if (isMounted.current) {
                setData(resPengurus || []);
                setJabatanList(resJabatan || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }, [setData, setLoading]);

    useEffect(() => { loadEnrichedData(); }, [loadEnrichedData]);

    const columns = [
        { key: 'kelompok', label: 'Kelompok', render: (row) => <span className="th-badge">{row.kelompok || '-'}</span> },
        { key: 'nama_pengurus', label: 'Nama Pengurus', render: (row) => <strong>{row.nama_pengurus}</strong> },
        { key: 'jabatan', label: 'Jabatan' },
        {
            key: 'actions', label: 'Aksi', width: '120px', render: (row) => (
                <div className="table-actions">
                    {canEdit && <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)}><i className="fas fa-edit"></i></button>}
                    {canDelete && <button className="btn-vibrant btn-vibrant-red" onClick={() => setConfirmDelete({ open: true, id: row.id })}><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Pengaturan Struktur Wajar & Murottil" subJudul="Manajemen pengajar dan pembagian kelompok." hideOnScreen={true} />

            <DataViewContainer
                title="Daftar Pengurus / Pengajar"
                subtitle="Daftar asatidz penanggung jawab kelompok wajar."
                headerActions={canEdit && <button className="btn btn-primary btn-sm" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Pengurus</button>}
                tableProps={{ columns, data: data, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Data" : "Tambah Pengurus"} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>}>
                <TextInput label="Nama Lengkap Pengurus" value={formData.nama_pengurus} onChange={e => setFormData({ ...formData, nama_pengurus: e.target.value })} required />
                <div className="form-grid">
                    <TextInput label="Nama Kelompok" value={formData.kelompok} onChange={e => setFormData({ ...formData, kelompok: e.target.value })} placeholder="Contoh: Kelompok 1" />
                    <SelectInput label="Jabatan" value={formData.jabatan} onChange={e => setFormData({ ...formData, jabatan: e.target.value })} options={jabatanList.map(j => j.nama_jabatan)} />
                </div>
                <TextAreaInput label="Keterangan Tambahan" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} />
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Data Pengurus?"
                message="Data asatidz ini akan dihapus dari sistem manajemen kelompok."
            />
        </div>
    );
}
