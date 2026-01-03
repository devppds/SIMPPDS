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
import PremiumBanner from '@/components/PremiumBanner';
import { TextInput, TextAreaInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function TakhosusSeminarPage() {
    const { user, isAdmin } = useAuth();
    const { canEdit, canDelete } = usePagePermission();
    const [mounted, setMounted] = useState(false);
    const [staffList, setStaffList] = useState([]); // Combination of Ustadz and Pengurus
    const [pengurusList, setPengurusList] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, loading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, formData, setFormData, editId,
        handleSave, handleDelete, openModal: baseOpenModal, openView
    } = useDataManagement('edu_takhosus_seminar', {
        tanggal: new Date().toISOString().split('T')[0],
        materi: '', pembimbing: '', waktu: '', tempat: '', peserta: '', petugas: ''
    });

    useEffect(() => { setMounted(true); }, []);

    const loadStaff = useCallback(async () => {
        try {
            const [ustadz, pengurus] = await Promise.all([
                apiCall('getData', 'GET', { type: 'ustadz' }),
                apiCall('getData', 'GET', { type: 'pengurus' })
            ]);

            const combined = [
                ...(ustadz || []).map(u => ({ ...u, type: 'Ustadz' })),
                ...(pengurus || []).map(p => ({ ...p, type: 'Pengurus' }))
            ].sort((a, b) => a.nama.localeCompare(b.nama));

            setStaffList(combined);
            setPengurusList(pengurus || []);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { loadStaff(); }, [loadStaff]);

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
        { title: 'Total Program', value: data.length, icon: 'fas fa-graduation-cap', color: 'var(--primary)' },
        { title: 'Seminar Mandiri', value: data.filter(d => (d.materi || '').toLowerCase().includes('seminar')).length, icon: 'fas fa-microphone', color: 'var(--success)' },
        { title: 'Kelas Takhosus', value: data.filter(d => !(d.materi || '').toLowerCase().includes('seminar')).length, icon: 'fas fa-brain', color: 'var(--warning)' }
    ], [data]);

    const displayData = data.filter(d =>
        (d.materi || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.pembimbing || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => <strong>{formatDate(row.tanggal)}</strong> },
        { key: 'materi', label: 'Program / Materi', render: (row) => <div style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>{row.materi}</div> },
        { key: 'pembimbing', label: 'Pembimbing/Pemateri' },
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
                title="Takhōṣus & Seminar Ilmiah"
                subtitle="Manajemen program khusus takhosus, kitab rujukan, dan agenda seminar ilmiah santri."
                icon="fas fa-brain"
                floatingIcon="fas fa-certificate"
                bgGradient="linear-gradient(135deg, #1e3a8a 0%, #030617 100%)"
            />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Daftar Program Terlaksana"
                subtitle="Mencatat riwayat pelaksanaan seminar dan kelas takhosus."
                headerActions={canEdit && <button className="btn btn-primary" onClick={() => openModal()}><i className="fas fa-plus"></i> Program Baru</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari materi atau pembimbing..." }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Data Program" : "Input Program Baru"} width="750px" footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Data'}</button>}>
                <div className="form-grid">
                    <TextInput label="Tanggal Pelaksanaan" type="date" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} required />
                    <TextInput label="Judul Materi / Tema" value={formData.materi} onChange={e => setFormData({ ...formData, materi: e.target.value })} required placeholder="Seminar Fiqh Kontemporer" />
                </div>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 800 }}>Pembimbing / Narasumber</label>
                        <Autocomplete
                            options={staffList}
                            value={formData.pembimbing}
                            onChange={v => setFormData({ ...formData, pembimbing: v })}
                            onSelect={s => setFormData({ ...formData, pembimbing: s.nama })}
                            placeholder="Cari pembimbing..."
                            labelKey="nama"
                            subLabelKey="type"
                        />
                    </div>
                    <TextInput label="Waktu (Jam)" value={formData.waktu} onChange={e => setFormData({ ...formData, waktu: e.target.value })} placeholder="09.00 - 12.00 WIB" />
                </div>
                <div className="form-grid">
                    <TextInput label="Tempat" value={formData.tempat} onChange={e => setFormData({ ...formData, tempat: e.target.value })} placeholder="Aula Muktamar" />
                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 800 }}>Petugas Pencatat</label>
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
                <TextAreaInput label="Daftar Peserta / Target Peserta" value={formData.peserta} onChange={e => setFormData({ ...formData, peserta: e.target.value })} placeholder="Sebutkan delegasi kelas atau target peserta program." />
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Program Takhosus/Seminar" width="600px">
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{
                                width: '80px', height: '80px', background: 'var(--primary-light)',
                                color: 'var(--primary)', borderRadius: '20px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1rem', fontSize: '2rem'
                            }}>
                                <i className="fas fa-graduation-cap"></i>
                            </div>
                            <h2 className="outfit" style={{ fontSize: '1.8rem', fontWeight: 900 }}>{viewData.materi}</h2>
                            <p style={{ color: 'var(--success)', fontWeight: 700 }}>{formatDate(viewData.tanggal)}</p>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div><small>Pembimbing</small><div style={{ fontWeight: 700 }}>{viewData.pembimbing}</div></div>
                            <div><small>Lokasi / Tempat</small><div style={{ fontWeight: 700 }}>{viewData.tempat}</div></div>
                            <div><small>Waktu</small><div style={{ fontWeight: 700 }}>{viewData.waktu}</div></div>
                            <div><small>Petugas</small><div style={{ fontWeight: 700 }}>{viewData.petugas}</div></div>
                        </div>
                        <div style={{ marginTop: '1.5rem', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '15px' }}>
                            <small style={{ fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Peserta / Keterangan</small>
                            <p style={{ margin: '8px 0 0', lineHeight: '1.6' }}>{viewData.peserta || 'Tidak ada daftar peserta spesifik.'}</p>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Program?"
                message="Data program takhosus/seminar ini akan dihapus dari riwayat sistem."
            />
        </div>
    );
}
