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
import { TextInput, TextAreaInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function SoroganKelompokPage() {
    const { canEdit, canDelete } = usePagePermission();
    const [santriOptions, setSantriOptions] = useState([]);
    const [mounted, setMounted] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, loading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, formData, setFormData, editId,
        handleSave, handleDelete, openModal
    } = useDataManagement('edu_sorogan_kelompok', {
        nama_santri: '', kelas: '', kelompok: '', pembimbing: '', keterangan: ''
    });

    useEffect(() => { setMounted(true); }, []);

    const loadSantri = useCallback(async () => {
        try {
            const res = await apiCall('getData', 'GET', { type: 'santri' });
            setSantriOptions(res || []);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { loadSantri(); }, [loadSantri]);

    const stats = useMemo(() => [
        { title: 'Total Santri Sorogan', value: data.length, icon: 'fas fa-users', color: 'var(--primary)' },
        { title: 'Total Kelompok', value: [...new Set(data.map(d => d.kelompok))].length, icon: 'fas fa-layer-group', color: 'var(--success)' },
        { title: 'Pembimbing Aktif', value: [...new Set(data.map(d => d.pembimbing))].length, icon: 'fas fa-user-tie', color: 'var(--warning)' }
    ], [data]);

    const handleSantriChange = (nama) => {
        const found = santriOptions.find(s => s.nama_siswa === nama);
        setFormData(prev => ({ ...prev, nama_santri: nama, kelas: found ? found.kelas : prev.kelas }));
    };

    const displayData = data.filter(d =>
        (d.nama_santri || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.kelompok || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.pembimbing || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { key: 'nama_santri', label: 'Nama Santri', render: (row) => <div style={{ fontWeight: 800 }}>{row.nama_santri}</div> },
        { key: 'kelas', label: 'Kelas', render: (row) => <span className="th-badge">{row.kelas}</span> },
        { key: 'kelompok', label: 'Kelompok', render: (row) => <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{row.kelompok}</span> },
        { key: 'pembimbing', label: 'Pembimbing Sorogan', render: (row) => <div style={{ fontWeight: 600 }}>{row.pembimbing}</div> },
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
                    Kelola Kelompok Sorogan
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Pengaturan kelompok dan pembimbing santri untuk pengajian sorogan.</p>
            </div>

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Daftar Pembagian Kelompok"
                subtitle="Daftar santri yang terdaftar dalam program sorogan beserta pembimbingnya."
                headerActions={canEdit && <button className="btn btn-primary" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Anggota</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari nama, kelompok, atau pembimbing..." }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Data Kelompok" : "Tambah Anggota Sorogan"} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Data'}</button>}>
                <div className="form-group">
                    <label className="form-label">Nama Santri</label>
                    <Autocomplete options={santriOptions} value={formData.nama_santri} onChange={handleSantriChange} onSelect={s => handleSantriChange(s.nama_siswa)} placeholder="Ketik nama santri..." labelKey="nama_siswa" subLabelKey="kelas" />
                </div>
                <div className="form-grid">
                    <TextInput label="Nama Kelompok" value={formData.kelompok} onChange={e => setFormData({ ...formData, kelompok: e.target.value })} required placeholder="Contoh: Kelompok A1 / Tingkat Dasar" />
                    <TextInput label="Nama Pembimbing" value={formData.pembimbing} onChange={e => setFormData({ ...formData, pembimbing: e.target.value })} required placeholder="Contoh: Ust. Ahmad Fauzi" />
                </div>
                <TextAreaInput label="Keterangan Lanjutan" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} />
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Anggota?"
                message="Data keikutsertaan sorogan santri ini akan dihapus permanen."
            />
        </div>
    );
}
