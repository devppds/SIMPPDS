'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth, usePagePermission } from '@/lib/AuthContext';
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';
import Autocomplete from '@/components/Autocomplete';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import PremiumBanner from '@/components/PremiumBanner';
import { TextInput, TextAreaInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function PengajianKitabPage() {
    const { user, isAdmin } = useAuth();
    const { canEdit, canDelete } = usePagePermission();
    const [mounted, setMounted] = useState(false);
    const [pengurusList, setPengurusList] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, loading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, formData, setFormData, editId,
        handleSave, handleDelete, openModal: baseOpenModal, openView
    } = useDataManagement('edu_pengajian', {
        tanggal: new Date().toISOString().split('T')[0],
        qari: '', kitab: '', waktu: '', tempat: '', keterangan: '', petugas: ''
    });

    useEffect(() => { setMounted(true); }, []);

    const loadData = useCallback(async () => {
        try {
            const res = await apiCall('getData', 'GET', { type: 'pengurus' });
            setPengurusList(res || []);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const openModal = (row = null) => {
        if (!row) {
            baseOpenModal();
            setFormData(prev => ({
                ...prev,
                tanggal: new Date().toISOString().split('T')[0],
                petugas: user?.fullname || user?.username || ''
            }));
        } else {
            baseOpenModal(row);
        }
    };

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
            <PremiumBanner
                title="Agenda Pengajian Kitab"
                subtitle="Manajemen jadwal qari’, kitab, waktu, dan realisasi pengajian kitab kuning secara rutin."
                icon="fas fa-book-open"
                floatingIcon="fas fa-quran"
                bgGradient="linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)"
            />

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
                    <TextInput label="Nama Qari’ / Pembaca" value={formData.qari} onChange={e => setFormData({ ...formData, qari: e.target.value })} required placeholder="Misal: KH. Abdullah Kafabihi" />
                </div>
                <div className="form-grid">
                    <TextInput label="Nama Kitab" value={formData.kitab} onChange={e => setFormData({ ...formData, kitab: e.target.value })} required placeholder="Misal: Fathul Qadir" />
                    <TextInput label="Waktu" value={formData.waktu} onChange={e => setFormData({ ...formData, waktu: e.target.value })} placeholder="Bakda Maghrib" />
                </div>
                <div className="form-grid">
                    <TextInput label="Tempat / Lokasi" value={formData.tempat} onChange={e => setFormData({ ...formData, tempat: e.target.value })} placeholder="Masjid Jami'" />
                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 800 }}>Petugas (Pengurus)</label>
                        <Autocomplete
                            options={pengurusList}
                            value={formData.petugas}
                            onChange={v => setFormData({ ...formData, petugas: v })}
                            onSelect={p => setFormData({ ...formData, petugas: p.nama })}
                            placeholder="Cari petugas..."
                            labelKey="nama"
                            subLabelKey="jabatan"
                        />
                    </div>
                </div>
                <TextAreaInput label="Keterangan Lanjutan" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} />
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Agenda Pengajian">
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>Kitab {viewData.kitab}</div>
                            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--primary-dark)' }}>{viewData.qari}</h2>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '15px' }}>
                            <div><small>Waktu</small><div style={{ fontWeight: 700 }}>{viewData.waktu || '-'}</div></div>
                            <div><small>Tempat</small><div style={{ fontWeight: 700 }}>{viewData.tempat || '-'}</div></div>
                            <div><small>Tanggal</small><div style={{ fontWeight: 700 }}>{formatDate(viewData.tanggal)}</div></div>
                            <div><small>Petugas</small><div style={{ fontWeight: 700 }}>{viewData.petugas || '-'}</div></div>
                        </div>
                        <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                            <small>Catatan / Keterangan</small>
                            <p style={{ margin: '5px 0 0' }}>{viewData.keterangan || '-'}</p>
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
