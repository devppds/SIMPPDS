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
import { SelectInput, TextAreaInput, TextInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function LBMAbsenPagiPage() {
    const { isAdmin } = useAuth();
    const { canEdit, canDelete } = usePagePermission();
    const [santriOptions, setSantriOptions] = useState([]);
    const [mounted, setMounted] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, loading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, formData, setFormData, editId,
        handleSave, handleDelete, openModal
    } = useDataManagement('edu_lbm_absen', {
        tanggal: new Date().toISOString().split('T')[0],
        nama_santri: '',
        kelas: '',
        tipe_lbm: 'Pagi',
        status: 'Hadir',
        keterangan: '',
        petugas: ''
    });

    useEffect(() => { setMounted(true); }, []);

    const loadSantri = useCallback(async () => {
        try {
            const res = await apiCall('getData', 'GET', { type: 'santri' });
            // Filter: MHM Ibtida’iyyah VI – Tsanawiyyah II
            const filtered = (res || []).filter(s => {
                const madrasah = (s.madrasah || '').toUpperCase();
                const kelas = (s.kelas || '');
                if (madrasah !== 'MHM') return false;

                return kelas.includes('VI') || kelas.includes('I') || kelas.includes('II');
            });
            setSantriOptions(filtered);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { loadSantri(); }, [loadSantri]);

    // Filter only Pagi type from attendance records
    const morningRecords = useMemo(() => data.filter(d => d.tipe_lbm === 'Pagi'), [data]);
    const displayData = morningRecords.filter(d =>
        (d.nama_santri || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.kelas || '').toLowerCase().includes(search.toLowerCase())
    );

    const stats = useMemo(() => [
        { title: 'Absensi Hari Ini', value: morningRecords.filter(d => d.tanggal === new Date().toISOString().split('T')[0]).length, icon: 'fas fa-calendar-check', color: 'var(--warning)' },
        { title: 'Total Kehadiran', value: morningRecords.filter(d => d.status === 'Hadir').length, icon: 'fas fa-check-circle', color: 'var(--success)' },
        { title: 'Persentase Hadir', value: morningRecords.length ? Math.round((morningRecords.filter(d => d.status === 'Hadir').length / morningRecords.length) * 100) + '%' : '0%', icon: 'fas fa-percentage', color: 'var(--primary)' }
    ], [morningRecords]);

    const handleSantriChange = (nama) => {
        const found = santriOptions.find(s => s.nama_siswa === nama);
        setFormData(prev => ({
            ...prev,
            nama_santri: nama,
            kelas: found ? found.kelas : prev.kelas
        }));
    };

    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => formatDate(row.tanggal) },
        { key: 'nama_santri', label: 'Nama Santri', render: (row) => <div style={{ fontWeight: 800 }}>{row.nama_santri}</div> },
        { key: 'kelas', label: 'Kelas', render: (row) => <span className="th-badge" style={{ background: '#f1f5f9' }}>{row.kelas}</span> },
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

    if (!mounted) return null;

    return (
        <div className="view-container animate-in">
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 className="outfit" style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>
                    Absensi LBM Pagi
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Pencatatan kehadiran santri MHM Ibtida’iyyah VI – Tsanawiyyah II pada forum LBM Pagi.</p>
            </div>

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Log Absensi LBM Pagi"
                subtitle="Rekaman kehadiran harian peserta Bahtsul Masail pagi."
                headerActions={canEdit && <button className="btn btn-warning" onClick={() => openModal()} style={{ color: 'white' }}><i className="fas fa-plus"></i> Input Absensi</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari nama atau kelas..." }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Absensi LBM" : "Input Absensi LBM Pagi"} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Data'}</button>}>
                <TextInput label="Tanggal" type="date" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} required />
                <div className="form-group">
                    <label className="form-label">Nama Santri (MHM VI - Tsanawiyyah II)</label>
                    <Autocomplete options={santriOptions} value={formData.nama_santri} onChange={handleSantriChange} onSelect={s => handleSantriChange(s.nama_siswa)} placeholder="Ketik nama santri..." labelKey="nama_siswa" subLabelKey="kelas" />
                </div>
                <div className="form-grid">
                    <SelectInput label="Status Kehadiran" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} options={['Hadir', 'Izin', 'Sakit', 'Alfa']} />
                    <TextInput label="Petugas" value={formData.petugas} onChange={e => setFormData({ ...formData, petugas: e.target.value })} readOnly={!isAdmin} style={!isAdmin ? { background: '#f8fafc' } : {}} />
                </div>
                <TextAreaInput label="Keterangan Lanjutan" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} placeholder="Contoh: Alasan izin atau materi musyawarah." />
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Absensi?"
                message="Data absensi santri ini akan dihapus dari log LBM Pagi."
            />
        </div>
    );
}
