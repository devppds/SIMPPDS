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

export default function JamiyyahPenasihatPage() {
    const { isAdmin } = useAuth();
    const { canEdit, canDelete } = usePagePermission();
    const [rooms, setRooms] = useState([]);
    const [mounted, setMounted] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, loading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, formData, setFormData, editId,
        handleSave, handleDelete, openModal
    } = useDataManagement('jamiyyah_penasihat', {
        kamar: '', asrama: '', nama_penasihat: '', keterangan: ''
    });

    useEffect(() => { setMounted(true); }, []);

    const loadRooms = useCallback(async () => {
        try {
            const res = await apiCall('getData', 'GET', { type: 'kamar' });
            setRooms(res || []);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { loadRooms(); }, [loadRooms]);

    const stats = useMemo(() => [
        { title: 'Total Kamar Terdata', value: data.length, icon: 'fas fa-door-open', color: 'var(--primary)' },
        { title: 'Penasihat Aktif', value: [...new Set(data.map(d => d.nama_penasihat))].filter(Boolean).length, icon: 'fas fa-user-check', color: 'var(--success)' }
    ], [data]);

    const displayData = data.filter(d =>
        (d.kamar || d.nama_kamar || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.nama_penasihat || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        {
            key: 'kamar',
            label: 'Kamar',
            render: (row) => (
                <div>
                    <div style={{ fontWeight: 800 }}>{row.kamar || row.nama_kamar}</div>
                    <small style={{ color: 'var(--text-muted)' }}>{row.asrama}</small>
                </div>
            )
        },
        { key: 'nama_penasihat', label: 'Nama Penasihat', render: (row) => <div style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{row.nama_penasihat}</div> },
        { key: 'keterangan', label: 'Keterangan' },
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
                    Penasihat Kamar
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Pengelolaan pendamping/penasihat santri di tiap kamar asrama.</p>
            </div>

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Daftar Penasihat Per-Kamar"
                subtitle="Data penghubung antara pengurus jam'iyyah dengan santri di asrama."
                headerActions={canEdit && <button className="btn btn-primary" onClick={() => openModal()}><i className="fas fa-plus"></i> Atur Penasihat</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari kamar atau nama penasihat..." }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Data Penasihat" : "Atur Penasihat Baru"} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Data'}</button>}>
                <div className="form-grid">
                    <SelectInput
                        label="Pilih Kamar"
                        value={formData.kamar}
                        onChange={e => {
                            const found = rooms.find(r => r.nama_kamar === e.target.value);
                            setFormData({ ...formData, kamar: e.target.value, asrama: found?.asrama || '' });
                        }}
                        options={['-- Pilih Kamar --', ...rooms.map(r => r.nama_kamar)]}
                    />
                    <TextInput label="Asrama" value={formData.asrama} readOnly style={{ background: '#f8fafc' }} />
                </div>
                <TextInput label="Nama Penasihat" value={formData.nama_penasihat} onChange={e => setFormData({ ...formData, nama_penasihat: e.target.value })} required placeholder="Contoh: Ust. M. Ilyas" />
                <TextAreaInput label="Keterangan / Catatan" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} />
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Data Penasihat?"
                message="Data penunjukan penasihat untuk kamar ini akan dihapus."
            />
        </div>
    );
}
