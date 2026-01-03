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

export default function JamiyyahManajemenPage() {
    const { isAdmin } = useAuth();
    const { canEdit, canDelete } = usePagePermission();
    const [pengurusList, setPengurusList] = useState([]);
    const [santriList, setSantriList] = useState([]);
    const [mounted, setMounted] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const WILAYAH_OPTIONS = ['Pusat (JSPD)', 'Ahlussalam', 'Tahiyatan Wasalaman', 'Al Huda'];

    const {
        data, loading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, formData, setFormData, editId,
        handleSave, handleDelete, openModal
    } = useDataManagement('jamiyyah_kelompok', {
        wilayah: WILAYAH_OPTIONS[0], jumlah_santri: '', ketua: '', pembimbing: '', keterangan: ''
    });

    useEffect(() => { setMounted(true); }, []);

    const loadInitialData = useCallback(async () => {
        try {
            const [pengurus, santri] = await Promise.all([
                apiCall('getData', 'GET', { type: 'pengurus' }),
                apiCall('getData', 'GET', { type: 'santri' })
            ]);
            setPengurusList(pengurus || []);
            setSantriList(santri || []);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { loadInitialData(); }, [loadInitialData]);

    const stats = useMemo(() => [
        { title: 'Total Kelompok', value: data.length, icon: 'fas fa-users-cog', color: 'var(--primary)' },
        { title: 'Total Santri Jamiyyah', value: data.reduce((acc, curr) => acc + (parseInt(curr.jumlah_santri) || 0), 0), icon: 'fas fa-user-friends', color: 'var(--success)' }
    ], [data]);

    const displayData = data.filter(d =>
        (d.wilayah || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.ketua || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleSelectPembimbing = (p) => {
        const current = formData.pembimbing ? formData.pembimbing.split(', ') : [];
        if (!current.includes(p.nama)) {
            const updated = [...current, p.nama].join(', ');
            setFormData(prev => ({ ...prev, pembimbing: updated }));
        }
    };

    const removePembimbing = (name) => {
        const current = formData.pembimbing ? formData.pembimbing.split(', ') : [];
        const updated = current.filter(n => n !== name).join(', ');
        setFormData(prev => ({ ...prev, pembimbing: updated }));
    };

    const columns = [
        {
            key: 'wilayah',
            label: 'Kelompok / Wilayah',
            render: (row) => (
                <div style={{ fontWeight: 800, color: 'var(--primary-dark)', fontSize: '1.1rem' }}>
                    {row.wilayah}
                </div>
            )
        },
        { key: 'jumlah_santri', label: 'Jml Santri', align: 'center', render: (row) => <span style={{ fontWeight: 700 }}>{row.jumlah_santri || 0}</span> },
        { key: 'ketua', label: 'Ketua', render: (row) => <div style={{ fontWeight: 600 }}>{row.ketua || '-'}</div> },
        {
            key: 'pembimbing',
            label: 'Pembimbing',
            render: (row) => (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {(row.pembimbing || '').split(', ').filter(Boolean).map((n, i) => (
                        <span key={i} className="th-badge" style={{ background: '#f1f5f9', fontSize: '0.65rem', fontWeight: 600 }}>{n}</span>
                    ))}
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
                    Manajemen Jam’iyyah
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Pengelolaan struktur wilayah/kelompok, ketua, dan tim pembimbing jam'iyyah.</p>
            </div>

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Struktur Wilayah Jamiyyah"
                subtitle="Manajemen data wilayah organisasi jam'iyyah santri."
                headerActions={canEdit && <button className="btn btn-primary" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Wilayah</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari wilayah atau ketua..." }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Data Wilayah" : "Tambah Wilayah Jam'iyyah Baru"} width="750px" footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Data'}</button>}>
                <div className="form-group">
                    <SelectInput
                        label="Pilih Kelompok / Wilayah"
                        value={formData.wilayah}
                        onChange={e => setFormData({ ...formData, wilayah: e.target.value })}
                        options={WILAYAH_OPTIONS}
                    />
                </div>
                <div className="form-grid">
                    <TextInput label="Jumlah Santri" type="number" value={formData.jumlah_santri} onChange={e => setFormData({ ...formData, jumlah_santri: e.target.value })} placeholder="0" />
                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 800 }}>Pilih Ketua (Dari Santri)</label>
                        <Autocomplete
                            options={santriList}
                            value={formData.ketua}
                            onChange={v => setFormData({ ...formData, ketua: v })}
                            onSelect={s => setFormData({ ...formData, ketua: s.nama_siswa })}
                            placeholder="Cari nama santri..."
                            labelKey="nama_siswa"
                            subLabelKey="kelas"
                        />
                    </div>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label className="form-label" style={{ fontWeight: 800 }}>Pilih Beberapa Pembimbing (Dari Database Pengurus)</label>
                    <Autocomplete options={pengurusList} value="" onChange={() => { }} onSelect={handleSelectPembimbing} placeholder="Cari nama pengurus..." labelKey="nama" subLabelKey="jabatan" />

                    <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '40px', padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                        {(formData.pembimbing || '').split(', ').filter(Boolean).map((n, i) => (
                            <div key={i} className="th-badge" style={{ background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 10px' }}>
                                {n}
                                <i className="fas fa-times-circle" style={{ cursor: 'pointer' }} onClick={() => removePembimbing(n)}></i>
                            </div>
                        ))}
                        {!(formData.pembimbing) && <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Belum ada pembimbing dipilih</span>}
                    </div>
                </div>

                <TextAreaInput label="Keterangan Lanjutan" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} />
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Data Wilayah?"
                message="Seluruh data terkait wilayah ini akan dihapus dari sistem."
            />
        </div>
    );
}
