'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth, usePagePermission } from '@/lib/AuthContext';
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';
import Autocomplete from '@/components/Autocomplete';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, TextAreaInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function LBMDelegasiPage() {
    const { isAdmin } = useAuth();
    const { canEdit, canDelete } = usePagePermission();
    const [santriOptions, setSantriOptions] = useState([]);
    const [mounted, setMounted] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, loading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, formData, setFormData, editId,
        handleSave, handleDelete, openModal, openView
    } = useDataManagement('edu_lbm_delegasi', {
        tanggal: '', nama_santri: '', kelas: '', acara: '', tempat: '', hasil: '', petugas: ''
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
        { title: 'Total Delegasi', value: data.length, icon: 'fas fa-bullhorn', color: 'var(--primary)' },
        { title: 'Forum Diikuti', value: [...new Set(data.map(d => d.acara))].length, icon: 'fas fa-comments', color: 'var(--success)' }
    ], [data]);

    const handleSantriChange = (nama) => {
        const found = santriOptions.find(s => s.nama_siswa === nama);
        setFormData(prev => ({ ...prev, nama_santri: nama, kelas: found ? found.kelas : prev.kelas }));
    };

    const displayData = data.filter(d =>
        (d.nama_santri || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.acara || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => formatDate(row.tanggal) },
        { key: 'nama_santri', label: 'Nama Santri', render: (row) => <div style={{ fontWeight: 800 }}>{row.nama_santri}</div> },
        { key: 'kelas', label: 'Kelas', render: (row) => <span className="th-badge">{row.kelas}</span> },
        { key: 'acara', label: 'Acara / Forum' },
        { key: 'tempat', label: 'Lokasi' },
        {
            key: 'actions', label: 'Opsi', width: '150px', render: (row) => (
                <div className="table-actions">
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openView(row)} title="Detail"><i className="fas fa-eye"></i></button>
                    {canEdit && <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)} title="Edit"><i className="fas fa-edit"></i></button>}
                    {canDelete && <button className="btn-vibrant btn-vibrant-red" onClick={() => setConfirmDelete({ open: true, id: row.id })} title="Hapus"><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    if (!mounted) return null;

    return (
        <div className="view-container animate-in">
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 className="outfit" style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>
                    Delegasi LBM
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Data pengiriman utusan (delegasi) LBM Lirboyo ke berbagai acara eksternal.</p>
            </div>

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Riwayat Delegasi Forum"
                subtitle="Mencatat keikutsertaan delegasi dalam forum Bahtsul Masail."
                headerActions={canEdit && <button className="btn btn-primary" onClick={() => openModal()}><i className="fas fa-plus"></i> Input Delegasi</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari nama santri atau acara..." }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Data Delegasi" : "Input Delegasi Baru"} width="700px" footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Data'}</button>}>
                <div className="form-group">
                    <label className="form-label">Nama Santri Delegasi</label>
                    <Autocomplete options={santriOptions} value={formData.nama_santri} onChange={handleSantriChange} onSelect={s => handleSantriChange(s.nama_siswa)} placeholder="Ketik nama santri..." labelKey="nama_siswa" subLabelKey="kelas" />
                </div>
                <div className="form-grid">
                    <TextInput label="Tanggal Acara" type="date" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} required />
                    <TextInput label="Nama Forum / Acara" value={formData.acara} onChange={e => setFormData({ ...formData, acara: e.target.value })} required placeholder="Contoh: FMPP Se-Jawa Madura" />
                </div>
                <div className="form-grid">
                    <TextInput label="Tempat / Lokasi" value={formData.tempat} onChange={e => setFormData({ ...formData, tempat: e.target.value })} placeholder="Contoh: PP. Al-Falah Ploso" />
                    <TextInput label="Petugas" value={formData.petugas} onChange={e => setFormData({ ...formData, petugas: e.target.value })} readOnly={!isAdmin} style={!isAdmin ? { background: '#f8fafc' } : {}} />
                </div>
                <TextAreaInput label="Hasil Putusan / Keterangan" value={formData.hasil} onChange={e => setFormData({ ...formData, hasil: e.target.value })} placeholder="Ringkasan hasil musyawarah atau tugas khusus." />
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Profil Delegasi LBM">
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>{viewData.acara}</div>
                            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--primary-dark)' }}>{viewData.nama_santri}</h2>
                            <p style={{ fontSize: '1.2rem' }}>Kelas: <strong>{viewData.kelas}</strong></p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '15px' }}>
                            <div><label>Tanggal</label><div className="value">{formatDate(viewData.tanggal)}</div></div>
                            <div><label>Lokasi Acara</label><div className="value">{viewData.tempat}</div></div>
                        </div>
                        <div style={{ marginTop: '1.5rem', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '15px' }}>
                            <label>Hasil Putusan / Catatan</label>
                            <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{viewData.hasil || 'Tidak ada hasil tercatat.'}</p>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Delegasi?"
                message="Data delegasi ini akan dihapus dari riwayat LBM."
            />
        </div>
    );
}
