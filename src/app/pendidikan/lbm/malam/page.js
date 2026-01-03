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
import { SelectInput, TextAreaInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function LBMSiswaMalamPage() {
    const { canEdit, canDelete } = usePagePermission();
    const [santriOptions, setSantriOptions] = useState([]);
    const [mounted, setMounted] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, setData, loading, setLoading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, formData, setFormData, editId,
        handleSave, handleDelete, openModal
    } = useDataManagement('edu_lbm_peserta', {
        nama_santri: '', kelas: '', tipe_lbm: 'Malam', keterangan: ''
    });

    useEffect(() => { setMounted(true); }, []);

    const loadSantri = useCallback(async () => {
        try {
            const res = await apiCall('getData', 'GET', { type: 'santri' });
            setSantriOptions(res || []);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { loadSantri(); }, [loadSantri]);

    // Filter only Malam type
    const nightData = useMemo(() => data.filter(d => d.tipe_lbm === 'Malam'), [data]);
    const displayData = nightData.filter(d =>
        (d.nama_santri || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.kelas || '').toLowerCase().includes(search.toLowerCase())
    );

    const stats = useMemo(() => [
        { title: 'Total Siswa Malam', value: nightData.length, icon: 'fas fa-moon', color: 'var(--primary-dark)' },
        { title: 'Kelas Terdaftar', value: [...new Set(nightData.map(d => d.kelas))].length, icon: 'fas fa-graduation-cap', color: 'var(--primary)' }
    ], [nightData]);

    const handleSantriChange = (nama) => {
        const found = santriOptions.find(s => s.nama_siswa === nama);
        setFormData(prev => ({
            ...prev,
            nama_santri: nama,
            kelas: found ? found.kelas : prev.kelas
        }));
    };

    const columns = [
        { key: 'nama_santri', label: 'Nama Santri', render: (row) => <div style={{ fontWeight: 800 }}>{row.nama_santri}</div> },
        { key: 'kelas', label: 'Kelas', render: (row) => <span className="th-badge" style={{ background: '#f1f5f9' }}>{row.kelas}</span> },
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
                    LBM Siswa Malam
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Siswa MIU & MHM Tsanawiyyah III – Ma’had Aly V–VI yang mengikuti musyawarah malam.</p>
            </div>

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Daftar Peserta LBM Malam"
                subtitle="Daftar santri delegasi tiap kelas untuk musyawarah malam."
                headerActions={canEdit && <button className="btn btn-primary" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Peserta</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari nama atau kelas..." }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Peserta LBM" : "Tambah Peserta LBM Malam"} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Data'}</button>}>
                <div className="form-group">
                    <label className="form-label">Cari Santri</label>
                    <Autocomplete options={santriOptions} value={formData.nama_santri} onChange={handleSantriChange} onSelect={s => handleSantriChange(s.nama_siswa)} placeholder="Ketik nama santri..." labelKey="nama_siswa" subLabelKey="kelas" />
                </div>
                <div className="form-grid">
                    <SelectInput label="Status LBM" value={formData.tipe_lbm} onChange={e => setFormData({ ...formData, tipe_lbm: e.target.value })} options={['Pagi', 'Malam']} readOnly />
                    <TextAreaInput label="Keterangan / Jabatan" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} placeholder="Contoh: Moderator / Notulis" />
                </div>
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Peserta?"
                message="Data keikutsertaan santri ini akan dihapus dari daftar LBM Malam."
            />
        </div>
    );
}
