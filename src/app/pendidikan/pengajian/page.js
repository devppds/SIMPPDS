'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth, usePagePermission } from '@/lib/AuthContext';
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, TextAreaInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function PengajianKitabPage() {
    const { isAdmin } = useAuth();
    const { canEdit, canDelete } = usePagePermission();
    const [mounted, setMounted] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, loading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, formData, setFormData, editId,
        handleSave, handleDelete, openModal, openView
    } = useDataManagement('edu_pengajian', {
        tanggal: '', qari: '', kitab: '', waktu: '', tempat: '', keterangan: '', petugas: ''
    });

    useEffect(() => { setMounted(true); }, []);

    const stats = useMemo(() => [
        { title: 'Total Pengajian', value: data.length, icon: 'fas fa-book-open', color: 'var(--primary)' },
        { title: 'Kitab Dikaji', value: [...new Set(data.map(d => d.kitab))].length, icon: 'fas fa-scroll', color: 'var(--success)' },
        { title: 'Lokasi Aktif', value: [...new Set(data.map(d => d.tempat))].length, icon: 'fas fa-map-marker-alt', color: 'var(--warning)' }
    ], [data]);

    const displayData = data.filter(d =>
        (d.qari || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.kitab || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.tempat || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => <span style={{ fontWeight: 600 }}>{formatDate(row.tanggal)}</span> },
        { key: 'qari', label: 'Qari’ / Pembaca', render: (row) => <div style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>{row.qari}</div> },
        { key: 'kitab', label: 'Nama Kitab', render: (row) => <span className="th-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{row.kitab}</span> },
        { key: 'waktu', label: 'Waktu' },
        { key: 'tempat', label: 'Tempat' },
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
            <KopSurat judul="Agenda Pengajian Kitab" subJudul="Manajemen jadwal dan realisasi pengajian kitab kuning." hideOnScreen={true} />

            <div style={{ marginBottom: '2.5rem' }}>
                <h1 className="outfit" style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>
                    Pengajian Kitab
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Data jadwal qari’, kitab, waktu, dan tempat pengajian.</p>
            </div>

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Log Daftar Pengajian"
                subtitle="Daftar pelaksanaan pengajian kitab secara rutin."
                headerActions={canEdit && <button className="btn btn-primary" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Agenda</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari qari, kitab, atau tempat..." }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Agenda Pengajian" : "Tambah Agenda Baru"} width="700px" footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Data'}</button>}>
                <div className="form-grid">
                    <TextInput label="Tanggal" type="date" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} required />
                    <TextInput label="Nama Qari’ / Pembaca" value={formData.qari} onChange={e => setFormData({ ...formData, qari: e.target.value })} required placeholder="Contoh: KH. Abdullah Kafabihi" />
                </div>
                <div className="form-grid">
                    <TextInput label="Nama Kitab" value={formData.kitab} onChange={e => setFormData({ ...formData, kitab: e.target.value })} required placeholder="Contoh: Fathul Qadir" />
                    <TextInput label="Waktu" value={formData.waktu} onChange={e => setFormData({ ...formData, waktu: e.target.value })} placeholder="Contoh: Barada Maghrib / 20.00 WIB" />
                </div>
                <div className="form-grid">
                    <TextInput label="Tempat / Lokasi" value={formData.tempat} onChange={e => setFormData({ ...formData, tempat: e.target.value })} placeholder="Contoh: Masjid Jami' / Aula" />
                    <TextInput label="Petugas" value={formData.petugas} onChange={e => setFormData({ ...formData, petugas: e.target.value })} readOnly={!isAdmin} style={!isAdmin ? { background: '#f8fafc' } : {}} />
                </div>
                <TextAreaInput label="Keterangan Tambahan" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} />
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Agenda Pengajian">
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>Kitab {viewData.kitab}</div>
                            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--primary-dark)' }}>{viewData.qari}</h2>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '15px' }}>
                            <div><label>Waktu</label><div className="value">{viewData.waktu}</div></div>
                            <div><label>Tempat</label><div className="value">{viewData.tempat}</div></div>
                            <div><label>Tanggal</label><div className="value">{formatDate(viewData.tanggal)}</div></div>
                            <div><label>Petugas</label><div className="value">{viewData.petugas}</div></div>
                        </div>
                        <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                            <label>Keterangan</label>
                            <p style={{ margin: 0 }}>{viewData.keterangan || '-'}</p>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Agenda?"
                message="Data agenda pengajian ini akan dihapus permanen."
            />
        </div>
    );
}
