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
        { title: 'Total Penasihat', value: [...new Set(data.flatMap(d => (d.nama_penasihat || '').split(', ').filter(Boolean)))].length, icon: 'fas fa-user-shield', color: 'var(--success)' }
    ], [data]);

    const displayData = data.filter(d =>
        (d.kamar || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.nama_penasihat || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.asrama || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleSelectPenasihat = (p) => {
        const current = formData.nama_penasihat ? formData.nama_penasihat.split(', ') : [];
        if (!current.includes(p.nama)) {
            const updated = [...current, p.nama].join(', ');
            setFormData(prev => ({ ...prev, nama_penasihat: updated }));
        }
    };

    const removePenasihat = (name) => {
        const current = formData.nama_penasihat ? formData.nama_penasihat.split(', ') : [];
        const updated = current.filter(n => n !== name).join(', ');
        setFormData(prev => ({ ...prev, nama_penasihat: updated }));
    };

    const columns = [
        {
            key: 'kamar',
            label: 'Kamar',
            render: (row) => (
                <div>
                    <div style={{ fontWeight: 800 }}>{row.kamar || row.nama_kamar}</div>
                    <small className="th-badge" style={{ background: '#f1f5f9', fontSize: '0.7rem' }}>{row.asrama}</small>
                </div>
            )
        },
        {
            key: 'nama_penasihat',
            label: 'Penasihat Kamar',
            render: (row) => (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(row.nama_penasihat || '').split(', ').filter(Boolean).map((n, i) => (
                        <span key={i} className="th-badge" style={{
                            background: 'var(--primary-light)',
                            color: 'var(--primary)',
                            fontSize: '0.75rem',
                            fontWeight: 700
                        }}>{n}</span>
                    ))}
                    {!(row.nama_penasihat) && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Belum diatur</span>}
                </div>
            )
        },
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
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Pengelolaan beberapa penasihat (diambil dari database pengurus) per kamar asrama.</p>
            </div>

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Daftar Penasihat Per-Kamar"
                subtitle="Data pengurus yang ditunjuk sebagai tim penasihat di asrama santri."
                headerActions={canEdit && <button className="btn btn-primary" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Penasihat</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari kamar, asrama, atau nama penasihat..." }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Data Penasihat" : "Atur Penasihat Baru"} width="750px" footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Perubahan'}</button>}>
                <div className="form-grid">
                    <SelectInput label="Pilih Asrama" value={selectedAsrama} onChange={e => { setSelectedAsrama(e.target.value); setFormData(prev => ({ ...prev, asrama: e.target.value, kamar: '' })); }} options={['-- Pilih Asrama --', ...asramaOptions]} />
                    <SelectInput label="Pilih Kamar" value={formData.kamar} onChange={e => setFormData({ ...formData, kamar: e.target.value })} options={['-- Pilih Kamar --', ...filteredRooms.map(r => r.nama_kamar || r.kamar)]} disabled={!selectedAsrama} />
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label className="form-label" style={{ fontWeight: 800 }}>Pilih Penasihat (Dari Database Pengurus)</label>
                    <Autocomplete
                        options={pengurusList}
                        value=""
                        onChange={() => { }}
                        onSelect={handleSelectPenasihat}
                        placeholder="Ketik nama pengurus..."
                        labelKey="nama"
                        subLabelKey="jabatan"
                    />

                    <div style={{ marginTop: '1rem' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Tim Penasihat Terpilih:</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '40px', padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                            {(formData.nama_penasihat || '').split(', ').filter(Boolean).map((n, i) => (
                                <div key={i} className="th-badge" style={{
                                    background: 'var(--primary)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '6px 12px',
                                    borderRadius: '10px'
                                }}>
                                    {n}
                                    <i className="fas fa-times-circle" style={{ cursor: 'pointer', opacity: 0.8 }} onClick={() => removePenasihat(n)}></i>
                                </div>
                            ))}
                            {!(formData.nama_penasihat) && <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>Belum ada penasihat yang dipilih</span>}
                        </div>
                    </div>
                </div>

                <TextAreaInput label="Keterangan / Tugas Khusus" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} />
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Data Penasihat?"
                message="Data penunjukan tim penasihat untuk kamar ini akan dihapus permanen."
            />
        </div>
    );
}
