'use client';

import React, { useMemo, useState } from 'react';
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput } from '@/components/FormInput';
import FileUploader from '@/components/FileUploader';
import ConfirmModal from '@/components/ConfirmModal';

export default function PengurusPeriodePage() {
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, loading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, formData, setFormData, editId,
        handleSave, handleDelete, openModal, openView,
        isAdmin
    } = useDataManagement('arsip_pengurus_periode', {
        nama: '', jabatan: '', divisi: '', periode_mulai: '', periode_selesai: '', foto_pengurus: ''
    });

    const displayData = useMemo(() => {
        return data.filter(d =>
            (d.nama || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.jabatan || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.divisi || '').toLowerCase().includes(search.toLowerCase())
        );
    }, [data, search]);

    const stats = useMemo(() => [
        { title: 'Total Pengurus', value: data.length, icon: 'fas fa-users-cog', color: 'var(--primary)' },
        { title: 'Divisi Aktif', value: [...new Set(data.map(d => d.divisi))].length, icon: 'fas fa-sitemap', color: 'var(--success)' },
        { title: 'Update Terakhir', value: '2025', icon: 'fas fa-clock', color: 'var(--warning)' }
    ], [data]);

    const columns = [
        {
            key: 'foto_pengurus', label: 'Foto', sortable: false, width: '80px', render: (row) => (
                <img src={row.foto_pengurus || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.nama)}&background=1e3a8a&color=fff&bold=true`}
                    style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
            )
        },
        {
            key: 'nama', label: 'Nama Pengurus', render: (row) => (
                <div><div style={{ fontWeight: 800 }}>{row.nama}</div><small style={{ color: 'var(--text-muted)' }}>Periode: {row.periode_mulai} - {row.periode_selesai}</small></div>
            )
        },
        { key: 'jabatan', label: 'Jabatan', render: (row) => <span className="th-badge">{row.jabatan}</span> },
        { key: 'divisi', label: 'Divisi' },
        {
            key: 'actions', label: 'Aksi', sortable: false, width: '150px', render: (row) => (
                <div className="table-actions">
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openView(row)} title="Detail"><i className="fas fa-eye"></i></button>
                    <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)} title="Edit"><i className="fas fa-edit"></i></button>
                    {isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => setConfirmDelete({ open: true, id: row.id })} title="Hapus"><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Arsip Struktur Kepengurusan" subJudul="Dokumentasi riwayat jabatan dan pengurus pondok pesantren." hideOnScreen={true} />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Manajemen Arsip Pengurus"
                subtitle={`Menampilkan ${displayData.length} data pengurus lintas periode.`}
                headerActions={<button className="btn btn-primary btn-sm" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Arsip</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari nama, jabatan atau divisi..." }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? 'Edit Data Pengurus' : 'Registrasi Pengurus Baru'} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>}>
                <TextInput label="Nama Lengkap" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} required icon="fas fa-user" />
                <div className="form-grid">
                    <TextInput label="Jabatan" value={formData.jabatan} onChange={e => setFormData({ ...formData, jabatan: e.target.value })} required />
                    <TextInput label="Divisi / Bagian" value={formData.divisi} onChange={e => setFormData({ ...formData, divisi: e.target.value })} required />
                </div>
                <div className="form-grid">
                    <TextInput label="Mulai Periode" value={formData.periode_mulai} onChange={e => setFormData({ ...formData, periode_mulai: e.target.value })} placeholder="Cth: 2023" required />
                    <TextInput label="Selesai Periode" value={formData.periode_selesai} onChange={e => setFormData({ ...formData, periode_selesai: e.target.value })} placeholder="Cth: 2024" required />
                </div>
                <FileUploader label="Foto Profil Pengurus" value={formData.foto_pengurus} onUploadSuccess={url => setFormData({ ...formData, foto_pengurus: url })} folder="arsip_pengurus" />
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Profil Pengurus Periode" width="600px">
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <img src={viewData.foto_pengurus || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewData.nama)}&background=1e3a8a&color=fff&bold=true`}
                                style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid var(--primary-light)', objectFit: 'cover' }} alt="" />
                            <h2 style={{ fontWeight: 900, marginTop: '1rem', color: 'var(--primary-dark)' }}>{viewData.nama}</h2>
                            <p className="th-badge" style={{ padding: '4px 15px' }}>{viewData.jabatan}</p>
                        </div>
                        <div className="form-grid" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px' }}>
                            <div><small style={{ fontWeight: 800, color: 'var(--text-muted)' }}>DIVISI</small><div style={{ fontWeight: 700 }}>{viewData.divisi}</div></div>
                            <div><small style={{ fontWeight: 800, color: 'var(--text-muted)' }}>STATUS PERIODE</small><div style={{ fontWeight: 700 }}>{viewData.periode_mulai} - {viewData.periode_selesai}</div></div>
                        </div>
                        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                            <button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Tutup</button>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id, null); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Arsip Pengurus?"
                message="Data kepengurusan ini akan dihapus dari arsip permanen."
            />
        </div>
    );
}
