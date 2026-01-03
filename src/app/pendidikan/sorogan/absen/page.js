'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth, usePagePermission } from '@/lib/AuthContext';
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput, TextAreaInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function SoroganAbsenPage() {
    const { isAdmin } = useAuth();
    const { canEdit, canDelete } = usePagePermission();
    const [kelompokData, setKelompokData] = useState([]);
    const [mounted, setMounted] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, loading, setLoading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, formData, setFormData, editId,
        handleSave, handleDelete, openModal
    } = useDataManagement('edu_sorogan_absen', {
        tanggal: new Date().toISOString().split('T')[0], nama_santri: '', kelas: '', kelompok: '', status: 'Hadir', keterangan: '', petugas: ''
    });

    useEffect(() => { setMounted(true); }, []);

    const loadContext = useCallback(async () => {
        setLoading(true);
        try {
            const [absensi, kelompok] = await Promise.all([
                apiCall('getData', 'GET', { type: 'edu_sorogan_absen' }),
                apiCall('getData', 'GET', { type: 'edu_sorogan_kelompok' })
            ]);
            // data is handled by hook but we need to merge or use it
            setKelompokData(kelompok || []);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, [setLoading]);

    useEffect(() => { loadContext(); }, [loadContext]);

    const stats = useMemo(() => [
        { title: 'Absensi Hari Ini', value: data.filter(d => d.tanggal === new Date().toISOString().split('T')[0]).length, icon: 'fas fa-calendar-day', color: 'var(--primary)' },
        { title: 'Persentase Hadir', value: data.length ? Math.round((data.filter(d => d.status === 'Hadir').length / data.length) * 100) + '%' : '0%', icon: 'fas fa-check-circle', color: 'var(--success)' }
    ], [data]);

    const displayData = data.filter(d =>
        (d.nama_santri || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.kelompok || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => formatDate(row.tanggal) },
        { key: 'nama_santri', label: 'Nama Santri', render: (row) => <div style={{ fontWeight: 800 }}>{row.nama_santri}</div> },
        { key: 'kelompok', label: 'Kelompok', render: (row) => <span className="th-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{row.kelompok}</span> },
        {
            key: 'status',
            label: 'Status',
            render: (row) => (
                <span className="th-badge" style={{
                    background: row.status === 'Hadir' ? '#dcfce7' : row.status === 'Izin' ? '#fef9c3' : '#fee2e2',
                    color: row.status === 'Hadir' ? '#166534' : row.status === 'Izin' ? '#854d0e' : '#991b1b'
                }}>
                    {row.status}
                </span>
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

    const bulkCreateAbsensi = async (status) => {
        // Logic for bulk attendance could be complex, for now we keep it standard as per useDataManagement
    };

    if (!mounted) return null;

    return (
        <div className="view-container animate-in">
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 className="outfit" style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>
                    Absensi Sorogan
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Pencatatan kehadiran santri pada kegiatan pengajian sorogan.</p>
            </div>

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Log Absensi Sorogan"
                subtitle="Rekaman kehadiran santri per tanggal dan kelompok."
                headerActions={canEdit && <button className="btn btn-success" onClick={() => openModal()} style={{ color: 'white' }}><i className="fas fa-plus"></i> Input Absen</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari nama santri..." }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Absensi" : "Input Absensi Sorogan"} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Data'}</button>}>
                <div className="form-grid">
                    <TextInput label="Tanggal" type="date" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} required />
                    <SelectInput
                        label="Pilih Santri (Dari Kelompok)"
                        value={formData.nama_santri}
                        onChange={e => {
                            const found = kelompokData.find(k => k.nama_santri === e.target.value);
                            setFormData({ ...formData, nama_santri: e.target.value, kelas: found?.kelas || '', kelompok: found?.kelompok || '' });
                        }}
                        options={['-- Pilih Santri --', ...kelompokData.map(k => k.nama_santri)]}
                    />
                </div>
                <div className="form-grid">
                    <SelectInput label="Status Kehadiran" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} options={['Hadir', 'Izin', 'Sakit', 'Alfa']} />
                    <TextInput label="Kelompok" value={formData.kelompok} readOnly style={{ background: '#f8fafc' }} />
                </div>
                <div className="form-grid">
                    <TextInput label="Petugas" value={formData.petugas} onChange={e => setFormData({ ...formData, petugas: e.target.value })} readOnly={!isAdmin} style={!isAdmin ? { background: '#f8fafc' } : {}} />
                </div>
                <TextAreaInput label="Keterangan / Materi Sorogan" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} placeholder="Contoh: Sampai bab Sholat, atau alasan izin." />
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Data Absen?"
                message="Data absensi ini akan dihapus permanen."
            />
        </div>
    );
}
