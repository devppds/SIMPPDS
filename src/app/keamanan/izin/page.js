'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth, usePagePermission } from '@/lib/AuthContext';
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';
import Autocomplete from '@/components/Autocomplete';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput, TextAreaInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';
import PremiumBanner from '@/components/PremiumBanner';

export default function IzinPage() {
    const { user, isAdmin } = useAuth();
    const { canEdit, canDelete } = usePagePermission();
    const [santriOptions, setSantriOptions] = useState([]);
    const [pengurusOptions, setPengurusOptions] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, loading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, formData, setFormData, editId,
        handleSave, handleDelete, openModal: baseOpenModal, openView
    } = useDataManagement('izin', {
        tanggal_mulai: new Date().toISOString().split('T')[0],
        tanggal_selesai: '', nama_santri: '', kelas: '', alasan: '',
        keperluan: 'Pulang Rumah', status: 'Menunggu', penjemput: '', petugas: ''
    });

    const loadData = useCallback(async () => {
        try {
            const [santri, pengurus] = await Promise.all([
                apiCall('getData', 'GET', { type: 'santri' }),
                apiCall('getData', 'GET', { type: 'pengurus' })
            ]);
            setSantriOptions(santri || []);
            setPengurusOptions(pengurus || []);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const openModal = (row = null) => {
        if (!row) {
            baseOpenModal();
            setFormData(prev => ({
                ...prev,
                tanggal_mulai: new Date().toISOString().split('T')[0],
                petugas: user?.fullname || user?.username || ''
            }));
        } else {
            baseOpenModal(row);
        }
    };

    const stats = useMemo(() => [
        { title: 'Total Izin', value: data.length, icon: 'fas fa-id-badge', color: 'var(--primary)' },
        { title: 'Izin Aktif', value: data.filter(d => d.status === 'Aktif').length, icon: 'fas fa-plane-departure', color: 'var(--warning)' },
        { title: 'Selesai/Kembali', value: data.filter(d => d.status === 'Kembali').length, icon: 'fas fa-home', color: 'var(--success)' }
    ], [data]);

    const displayData = data.filter(d =>
        (d.nama_santri || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.alasan || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { key: 'nama_santri', label: 'Nama Santri', render: (row) => <span style={{ fontWeight: 800 }}>{row.nama_santri}</span> },
        { key: 'kelas', label: 'Kelas', className: 'hide-mobile', render: (row) => <span className="th-badge">{row.kelas || '-'}</span> },
        { key: 'alasan', label: 'Alasan', className: 'hide-mobile' },
        {
            key: 'status', label: 'Status', render: (row) => (
                <span className="th-badge" style={{ background: row.status === 'Aktif' ? '#dcfce7' : row.status === 'Menunggu' ? '#fffbeb' : '#f1f5f9', color: row.status === 'Aktif' ? '#166534' : row.status === 'Menunggu' ? '#9a3412' : '#475569' }}>{row.status}</span>
            )
        },
        {
            key: 'actions', label: 'Aksi', width: '150px', render: (row) => (
                <div className="table-actions">
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openView(row)} title="Detail"><i className="fas fa-eye"></i></button>
                    {canEdit && <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)} title="Edit"><i className="fas fa-edit"></i></button>}
                    {canDelete && <button className="btn-vibrant btn-vibrant-red" onClick={() => setConfirmDelete({ open: true, id: row.id })} title="Hapus"><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <PremiumBanner
                title="Perizinan & Mobilitas Santri"
                subtitle="Kontrol perizinan keluar pondok, pulang rumah, dan pelacakan riwayat kembali santri."
                icon="fas fa-passport"
                floatingIcon="fas fa-id-card"
                bgGradient="linear-gradient(135deg, #92400e 0%, #713f12 100%)"
                actionButton={canEdit && (
                    <button className="btn btn-primary" style={{ height: 'fit-content', padding: '1.2rem 2.5rem', borderRadius: '18px', fontWeight: 800, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)' }} onClick={() => openModal()}>
                        <i className="fas fa-plus"></i> Buat Surat Izin
                    </button>
                )}
            />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Management Perizinan"
                subtitle={`Menampilkan ${displayData.length} riwayat izin keluar pondok.`}
                headerActions={canEdit && <button className="btn btn-primary" onClick={() => openModal()}><i className="fas fa-plus"></i> Buat Surat Izin</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value) }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Data Izin" : "Buat Izin Baru"} width="750px" footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Izin'}</button>}>
                <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 800 }}>Nama Santri</label>
                    <Autocomplete options={santriOptions} value={formData.nama_santri} onChange={v => setFormData({ ...formData, nama_santri: v })} onSelect={s => setFormData({ ...formData, nama_santri: s.nama_siswa, kelas: s.kelas })} placeholder="Cari santri..." labelKey="nama_siswa" subLabelKey="kelas" />
                </div>
                <div className="form-grid">
                    <TextInput label="Tanggal Mulai" type="date" value={formData.tanggal_mulai} onChange={e => setFormData({ ...formData, tanggal_mulai: e.target.value })} />
                    <TextInput label="Estimasi Kembali" type="date" value={formData.tanggal_selesai} onChange={e => setFormData({ ...formData, tanggal_selesai: e.target.value })} />
                </div>
                <div className="form-grid">
                    <SelectInput label="Keperluan" value={formData.keperluan} onChange={e => setFormData({ ...formData, keperluan: e.target.value })} options={['Pulang Rumah', 'Izin Keluar Sebentar', 'Sakit / Berobat', 'Nikahan Keluarga', 'Duka Cita', 'Lainnya']} />
                    <TextInput label="Penjemput / Wali" value={formData.penjemput} onChange={e => setFormData({ ...formData, penjemput: e.target.value })} placeholder="Nama wali..." />
                </div>
                <TextAreaInput label="Alasan Detail / Keterangan" value={formData.alasan} onChange={e => setFormData({ ...formData, alasan: e.target.value })} />
                <div className="form-grid">
                    <SelectInput label="Status Izin" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} options={['Menunggu', 'Aktif', 'Kembali', 'Terlambat']} />
                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 800 }}>Petugas Record (Keamanan)</label>
                        <Autocomplete
                            options={pengurusOptions}
                            value={formData.petugas}
                            onChange={v => setFormData({ ...formData, petugas: v })}
                            onSelect={p => setFormData({ ...formData, petugas: p.nama })}
                            placeholder="Cari petugas..."
                            labelKey="nama"
                            subLabelKey="jabatan"
                        />
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Perizinan" width="650px">
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{
                                width: '100px', height: '100px', borderRadius: '50%',
                                background: 'var(--primary-light)', color: 'var(--primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1rem', fontSize: '2.5rem', border: '4px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                            }}>
                                <i className="fas fa-id-card"></i>
                            </div>
                            <h2 className="outfit" style={{ fontSize: '2rem', fontWeight: 900 }}>{viewData.nama_santri}</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{viewData.kelas || 'Unit Umum'}</p>
                            <span className="th-badge" style={{ background: 'var(--primary)', color: 'white', padding: '5px 20px', borderRadius: '50px' }}>{viewData.status}</span>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '25px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div><small>Tanggal Berangkat</small><div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{formatDate(viewData.tanggal_mulai)}</div></div>
                            <div><small>Estimasi Kembali</small><div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--danger)' }}>{formatDate(viewData.tanggal_selesai)}</div></div>
                            <div><small>Keperluan</small><div style={{ fontWeight: 700 }}>{viewData.keperluan}</div></div>
                            <div><small>Penjemput</small><div style={{ fontWeight: 700 }}>{viewData.penjemput || '-'}</div></div>
                            <div><small>Petugas</small><div style={{ fontWeight: 700 }}>{viewData.petugas || '-'}</div></div>
                        </div>

                        <div style={{ marginTop: '1.5rem' }}>
                            <small>Alasan / Catatan</small>
                            <div style={{ padding: '1.2rem', border: '1px solid #e2e8f0', borderRadius: '15px', marginTop: '8px', lineHeight: '1.6', background: 'white' }}>
                                {viewData.alasan || 'Tidak ada keterangan tambahan.'}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}