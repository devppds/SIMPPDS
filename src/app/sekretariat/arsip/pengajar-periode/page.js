'use client';

import React, { useMemo, useState } from 'react';
import { useDataManagement } from '@/hooks/useDataManagement';
import { usePagePermission } from '@/lib/AuthContext';
import Modal from '@/components/Modal';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { TextInput } from '@/components/FormInput';
import FileUploader from '@/components/FileUploader';
import ConfirmModal from '@/components/ConfirmModal';

export default function PengajarPeriodePage() {
    const { canEdit, canDelete } = usePagePermission();
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
    const [mounted, setMounted] = useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const {
        data: archiveData, setData: setArchiveData, loading, setLoading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, formData, setFormData, editId,
        handleSave, handleDelete, openModal, openView,
        isAdmin
    } = useDataManagement('arsip_pengajar_periode', {
        nama: '', kelas_ampu: '', periode_mulai: '', periode_selesai: '', foto_pengajar: ''
    });

    const [mainUstadz, setMainUstadz] = useState([]);

    const loadData = React.useCallback(async () => {
        setLoading(true);
        try {
            const { apiCall: call } = await import('@/lib/utils');
            const [resArchive, resMain] = await Promise.all([
                call('getData', 'GET', { type: 'arsip_pengajar_periode' }),
                call('getData', 'GET', { type: 'ustadz' })
            ]);
            setArchiveData(resArchive || []);
            // Filter inactive from main ustadz
            setMainUstadz((resMain || []).filter(u => u.status !== 'Aktif').map(u => ({
                ...u,
                is_from_main: true,
                kelas_ampu: u.kelas,
                foto_pengajar: u.foto_ustadz,
                periode_mulai: 'Aktif',
                periode_selesai: u.tanggal_nonaktif?.split('-')[0] || '?'
            })));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [setArchiveData, setLoading]);

    React.useEffect(() => { loadData(); }, [loadData]);

    const combinedData = useMemo(() => [...archiveData, ...mainUstadz], [archiveData, mainUstadz]);

    const displayData = useMemo(() => {
        return combinedData.filter(d =>
            (d.nama || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.kelas_ampu || '').toLowerCase().includes(search.toLowerCase())
        );
    }, [combinedData, search]);

    const stats = useMemo(() => [
        { title: 'Total Pengajar', value: combinedData.length, icon: 'fas fa-chalkboard-teacher', color: 'var(--primary)' },
        { title: 'Kelas Ter-Arsip', value: [...new Set(combinedData.map(d => d.kelas_ampu))].length, icon: 'fas fa-school', color: 'var(--success)' },
        { title: 'Data Mutasi', value: mainUstadz.length, icon: 'fas fa-exchange-alt', color: 'var(--warning)' }
    ], [combinedData, mainUstadz]);

    const columns = [
        {
            key: 'foto_pengajar', label: 'Foto', sortable: false, width: '80px', render: (row) => (
                <img src={row.foto_pengajar || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.nama)}&background=1e3a8a&color=fff&bold=true`}
                    style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
            )
        },
        {
            key: 'nama', label: 'Nama Pengajar', render: (row) => (
                <div><div style={{ fontWeight: 800 }}>{row.nama}</div><small style={{ color: 'var(--text-muted)' }}>Periode: {row.periode_mulai} - {row.periode_selesai}</small></div>
            )
        },
        { key: 'kelas_ampu', label: 'Kelas Ampu', render: (row) => <span className="th-badge">{row.kelas_ampu}</span> },
        {
            key: 'actions', label: 'Aksi', sortable: false, width: '150px', render: (row) => (
                <div className="table-actions">
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openView(row)} title="Detail"><i className="fas fa-eye"></i></button>
                    {!row.is_from_main && canEdit && <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)} title="Edit"><i className="fas fa-edit"></i></button>}
                    {!row.is_from_main && canDelete && <button className="btn-vibrant btn-vibrant-red" onClick={() => setConfirmDelete({ open: true, id: row.id })} title="Hapus"><i className="fas fa-trash"></i></button>}
                    {row.is_from_main && <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}><i className="fas fa-lock"></i> System Sync</span>}
                </div>
            )
        }
    ];

    if (!mounted) return null;

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Arsip Riwayat Pengajar" subJudul="Database pendidik dan ustadz lintas periode pondok pesantren." hideOnScreen={true} />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Log Arsip Pengajar"
                subtitle={`Menampilkan ${displayData.length} data ustadz terdaftar.`}
                headerActions={(<>
                    <button className="btn btn-secondary btn-sm" onClick={loadData}><i className="fas fa-sync"></i> Refresh</button>
                    {canEdit && <button className="btn btn-primary btn-sm" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Arsip</button>}
                </>)}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari nama atau kelas..." }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? 'Edit Data Pengajar' : 'Tambah Pengajar Baru'} footer={<button className="btn btn-primary" onClick={async () => { await handleSave(); loadData(); }} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>}>
                <TextInput label="Nama Lengkap" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} required icon="fas fa-user-tie" />
                <TextInput label="Kelas yang Diampu" value={formData.kelas_ampu} onChange={e => setFormData({ ...formData, kelas_ampu: e.target.value })} required />
                <div className="form-grid">
                    <TextInput label="Mulai Periode" value={formData.periode_mulai} onChange={e => setFormData({ ...formData, periode_mulai: e.target.value })} placeholder="Cth: 2022" required />
                    <TextInput label="Selesai Periode" value={formData.periode_selesai} onChange={e => setFormData({ ...formData, periode_selesai: e.target.value })} placeholder="Cth: 2023" required />
                </div>
                <FileUploader label="Foto Profil Ustadz" value={formData.foto_pengajar} onUploadSuccess={url => setFormData({ ...formData, foto_pengajar: url })} folder="arsip_pengajar" />
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Profil Pengajar Pondok" width="600px">
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <img src={viewData.foto_pengajar || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewData.nama)}&background=1e3a8a&color=fff&bold=true`}
                                style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid var(--primary-light)', objectFit: 'cover' }} alt="" />
                            <h2 style={{ fontWeight: 900, marginTop: '1rem', color: 'var(--primary-dark)' }}>{viewData.nama}</h2>
                            <p className="th-badge" style={{ padding: '4px 15px' }}>USTADZ / ASATIDZ</p>
                        </div>
                        <div className="form-grid" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px' }}>
                            <div><small style={{ fontWeight: 800, color: 'var(--text-muted)' }}>KELAS AMPU</small><div style={{ fontWeight: 700 }}>{viewData.kelas_ampu}</div></div>
                            <div><small style={{ fontWeight: 800, color: 'var(--text-muted)' }}>STATUS PERIODE</small><div style={{ fontWeight: 700 }}>{viewData.periode_mulai} - {viewData.periode_selesai}</div></div>
                        </div>
                        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                            <button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Kembali</button>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id, null); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Arsip Pengajar?"
                message="Data historis pengajar ini akan dihapus permanen."
            />
        </div>
    );
}
