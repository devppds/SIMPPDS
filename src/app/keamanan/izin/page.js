'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { usePagePermission } from '@/lib/AuthContext';
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';
import Autocomplete from '@/components/Autocomplete';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput, TextAreaInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function IzinPage() {
    const { canEdit } = usePagePermission();
    const [santriOptions, setSantriOptions] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, loading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, formData, setFormData, editId,
        handleSave, handleDelete, openModal, openView, isAdmin
    } = useDataManagement('izin', {
        tanggal_mulai: new Date().toISOString().split('T')[0],
        tanggal_selesai: '', nama_santri: '', kelas: '', alasan: '',
        keperluan: 'Pulang Rumah', status: 'Menunggu', penjemput: ''
    });

    useEffect(() => {
        apiCall('getData', 'GET', { type: 'santri' }).then(res => setSantriOptions(res || []));
    }, []);

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
        { key: 'kelas', label: 'Kelas', render: (row) => <span className="th-badge">{row.kelas || '-'}</span> },
        { key: 'alasan', label: 'Alasan' },
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
                    {isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => setConfirmDelete({ open: true, id: row.id })} title="Hapus"><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Sistem Perizinan Santri" subJudul="Pusat Keamanan & Ketertiban Pondok." hideOnScreen={true} />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Management Perizinan"
                subtitle={`Menampilkan ${displayData.length} riwayat izin keluar pondok.`}
                headerActions={canEdit && <button className="btn btn-primary btn-sm" onClick={() => openModal()}><i className="fas fa-plus"></i> Buat Surat Izin</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value) }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Izin" : "Izin Baru"} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>}>
                <div className="form-group">
                    <label className="form-label">Nama Santri</label>
                    <Autocomplete options={santriOptions} value={formData.nama_santri} onChange={v => setFormData({ ...formData, nama_santri: v })} onSelect={s => setFormData({ ...formData, nama_santri: s.nama_siswa, kelas: s.kelas })} placeholder="Cari santri..." labelKey="nama_siswa" subLabelKey="kelas" />
                </div>
                <div className="form-grid">
                    <TextInput label="Tanggal Mulai" type="date" value={formData.tanggal_mulai} onChange={e => setFormData({ ...formData, tanggal_mulai: e.target.value })} />
                    <TextInput label="Estimasi Kembali" type="date" value={formData.tanggal_selesai} onChange={e => setFormData({ ...formData, tanggal_selesai: e.target.value })} />
                </div>
                <div className="form-grid">
                    <SelectInput label="Keperluan" value={formData.keperluan} onChange={e => setFormData({ ...formData, keperluan: e.target.value })} options={['Pulang Rumah', 'Izin Keluar Sebentar', 'Sakit / Berobat', 'Lainnya']} />
                    <TextInput label="Penjemput" value={formData.penjemput} onChange={e => setFormData({ ...formData, penjemput: e.target.value })} placeholder="Nama wali..." />
                </div>
                <TextAreaInput label="Alasan Detail" value={formData.alasan} onChange={e => setFormData({ ...formData, alasan: e.target.value })} />
                <SelectInput label="Status Izin" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} options={['Menunggu', 'Aktif', 'Kembali', 'Terlambat']} />
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Perizinan" width="600px">
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(viewData.nama_santri)}&background=1e3a8a&color=fff&size=128`} style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '1rem' }} alt="" />
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{viewData.nama_santri}</h2>
                            <p style={{ color: 'var(--text-muted)' }}>Unit/Kelas: {viewData.kelas || '-'}</p>
                            <span className="th-badge" style={{ background: 'var(--primary-light)', padding: '5px 15px' }}>{viewData.status}</span>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '15px' }}>
                            <div className="form-grid">
                                <div><small>Pulang</small><div style={{ fontWeight: 700 }}>{formatDate(viewData.tanggal_mulai)}</div></div>
                                <div><small>Rencana Kembali</small><div style={{ fontWeight: 700 }}>{formatDate(viewData.tanggal_selesai)}</div></div>
                            </div>
                            <div style={{ marginTop: '1rem' }}><small>Keperluan</small><div style={{ fontWeight: 700, color: 'var(--primary)' }}>{viewData.keperluan}</div></div>
                            <div style={{ marginTop: '1rem' }}><small>Alasan</small><p>{viewData.alasan || '-'}</p></div>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id); setConfirmDelete({ open: false, id: null }); }}
                title="Batalkan Izin?"
                message="Data perizinan ini akan dihapus secara permanen dari sistem."
            />
        </div>
    );
}