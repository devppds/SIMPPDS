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

export default function LBMAbsenMalamPage() {
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
        tipe_lbm: 'Malam',
        status: 'Hadir',
        keterangan: '',
        petugas: ''
    });

    useEffect(() => { setMounted(true); }, []);

    const loadSantri = useCallback(async () => {
        try {
            const res = await apiCall('getData', 'GET', { type: 'santri' });
            // Filter: Siswa MIU & MHM Tsanawiyyah III – Ma’had Aly V–VI
            const filtered = (res || []).filter(s => {
                const madrasah = (s.madrasah || '').toUpperCase();
                const kelas = (s.kelas || '');

                const isTsanawiyyah3 = kelas.includes('III') && (madrasah === 'MIU' || madrasah === 'MHM');
                const isMaHadAly = madrasah === 'MAHAD ALY' || madrasah === "MA'HAD ALY";
                const isV_VI = kelas.includes('V') || kelas.includes('VI');

                return isTsanawiyyah3 || (isMaHadAly && isV_VI);
            });
            setSantriOptions(filtered);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { loadSantri(); }, [loadSantri]);

    // Filter only Malam type from attendance records
    const nightRecords = useMemo(() => data.filter(d => d.tipe_lbm === 'Malam'), [data]);
    const displayData = nightRecords.filter(d =>
        (d.nama_santri || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.kelas || '').toLowerCase().includes(search.toLowerCase())
    );

    const stats = useMemo(() => [
        { title: 'Absensi Hari Ini', value: nightRecords.filter(d => d.tanggal === new Date().toISOString().split('T')[0]).length, icon: 'fas fa-moon', color: 'var(--primary-dark)' },
        { title: 'Total Kehadiran', value: nightRecords.filter(d => d.status === 'Hadir').length, icon: 'fas fa-check-circle', color: 'var(--success)' },
        { title: 'Persentase Hadir', value: nightRecords.length ? Math.round((nightRecords.filter(d => d.status === 'Hadir').length / nightRecords.length) * 100) + '%' : '0%', icon: 'fas fa-percentage', color: 'var(--primary)' }
    ], [nightRecords]);

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
                    Absensi LBM Malam
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Pencatatan kehadiran siswa MIU/MHM Tsanawiyyah III – Ma’had Aly V–VI pada LBM Malam.</p>
            </div>

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Log Absensi LBM Malam"
                subtitle="Rekaman kehadiran harian peserta Bahtsul Masail malam."
                headerActions={canEdit && <button className="btn btn-primary" onClick={() => openModal()}><i className="fas fa-plus"></i> Input Absensi</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari nama atau kelas..." }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Absensi LBM" : "Input Absensi LBM Malam"} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Data'}</button>}>
                <TextInput label="Tanggal" type="date" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} required />
                <div className="form-group">
                    <label className="form-label">Nama Santri (Tsanawiyyah III - Ma'had Aly VI)</label>
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
                message="Data absensi santri ini akan dihapus dari log LBM Malam."
            />
        </div>
    );
}
