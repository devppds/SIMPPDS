'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiCall } from '@/lib/utils';
import { useAuth, usePagePermission } from '@/lib/AuthContext';
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';
import Autocomplete from '@/components/Autocomplete';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput, TextAreaInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function JamiyyahPenasihatPage() {
    const { isAdmin } = useAuth();
    const { canEdit, canDelete } = usePagePermission();
    const [rooms, setRooms] = useState([]);
    const [pengurusList, setPengurusList] = useState([]);
    const [mounted, setMounted] = useState(false);
    const [selectedAsrama, setSelectedAsrama] = useState('');
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, loading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, formData, setFormData, editId,
        handleSave, handleDelete, openModal: baseOpenModal
    } = useDataManagement('jamiyyah_penasihat', {
        kamar: '', asrama: '', nama_penasihat: '', keterangan: ''
    });

    useEffect(() => { setMounted(true); }, []);

    const loadInitialData = useCallback(async () => {
        try {
            const [roomsRes, pengurusRes] = await Promise.all([
                apiCall('getData', 'GET', { type: 'kamar' }),
                apiCall('getData', 'GET', { type: 'pengurus' })
            ]);
            setRooms(roomsRes || []);
            setPengurusList(pengurusRes || []);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { loadInitialData(); }, [loadInitialData]);

    const openModal = (row = null) => {
        if (row) {
            setSelectedAsrama(row.asrama || '');
        } else {
            setSelectedAsrama('');
        }
        baseOpenModal(row);
    };

    const asramaOptions = useMemo(() => {
        const unique = [...new Set(rooms.map(r => r.asrama))].filter(Boolean).sort();
        return unique;
    }, [rooms]);

    const filteredRooms = useMemo(() => {
        if (!selectedAsrama) return [];
        return rooms.filter(r => r.asrama === selectedAsrama).sort((a, b) => a.nama_kamar.localeCompare(b.nama_kamar, undefined, { numeric: true }));
    }, [rooms, selectedAsrama]);

    const stats = useMemo(() => [
        { title: 'Kamar Terdata', value: data.length, icon: 'fas fa-door-open', color: 'var(--primary)' },
        { title: 'Penasihat Aktif', value: [...new Set(data.map(d => d.nama_penasihat))].filter(Boolean).length, icon: 'fas fa-user-check', color: 'var(--success)' }
    ], [data]);

    const displayData = data.filter(d =>
        (d.kamar || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.nama_penasihat || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.asrama || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        {
            key: 'kamar',
            label: 'Kamar',
            render: (row) => (
                <div>
                    <div style={{ fontWeight: 800 }}>{row.kamar}</div>
                    <small className="th-badge" style={{ background: '#f1f5f9', fontSize: '0.7rem' }}>{row.asrama}</small>
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
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Pengelolaan nama penasihat santri per kamar asrama.</p>
            </div>

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Daftar Penasihat Per-Kamar"
                subtitle="Data penghubung asrama santri."
                headerActions={canEdit && <button className="btn btn-primary" onClick={() => openModal()}><i className="fas fa-plus"></i> Atur Penasihat</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari kamar atau penasihat..." }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Penasihat" : "Atur Penasihat Baru"} width="600px" footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Data'}</button>}>
                <div className="form-grid">
                    <SelectInput
                        label="Pilih Asrama"
                        value={selectedAsrama}
                        onChange={e => { setSelectedAsrama(e.target.value); setFormData(prev => ({ ...prev, asrama: e.target.value, kamar: '' })); }}
                        options={asramaOptions}
                        placeholder="-- Pilih Asrama --"
                    />
                    <SelectInput
                        label="Pilih Kamar"
                        value={formData.kamar}
                        onChange={e => setFormData({ ...formData, kamar: e.target.value })}
                        options={filteredRooms.map(r => r.nama_kamar || r.kamar)}
                        placeholder="-- Pilih Kamar --"
                        disabled={!selectedAsrama}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 800 }}>Nama Penasihat (Dari Pengurus)</label>
                    <Autocomplete
                        options={pengurusList}
                        value={formData.nama_penasihat}
                        onChange={v => setFormData({ ...formData, nama_penasihat: v })}
                        onSelect={p => setFormData({ ...formData, nama_penasihat: p.nama })}
                        placeholder="Cari pengurus..."
                        labelKey="nama"
                        subLabelKey="jabatan"
                    />
                </div>
                <TextAreaInput label="Keterangan Lanjutan" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} />
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Data Penasihat?"
                message="Data penasihat kamar ini akan dihapus permanen."
            />
        </div>
    );
}
