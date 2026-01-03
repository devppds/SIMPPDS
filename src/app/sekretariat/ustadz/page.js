'use client';

import React, { useMemo } from 'react';
import { usePagePermission } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';

// ✨ Unified Components
import FileUploader from '@/components/FileUploader';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput, TextAreaInput } from '@/components/FormInput';
import DataViewContainer from '@/components/DataViewContainer';

export default function PengajarPage() {
    const { canEdit, canDelete } = usePagePermission();

    const {
        data, setData, loading, setLoading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, formData, setFormData, editId,
        handleSave, handleDelete, openModal, openView, isAdmin
    } = useDataManagement('ustadz', {
        nama: '', kelas: '', alamat: '', no_hp: '', status: 'Aktif',
        foto_ustadz: '', tanggal_nonaktif: ''
    });

    const [isMutasiModalOpen, setIsMutasiModalOpen] = useState(false);
    const [mutasiData, setMutasiData] = useState({ id: null, nama: '', status: 'Non-Aktif', tanggal: new Date().toISOString().split('T')[0] });

    const openMutasi = (row) => {
        setMutasiData({ id: row.id, nama: row.nama, status: 'Non-Aktif', tanggal: new Date().toISOString().split('T')[0] });
        setIsMutasiModalOpen(true);
    };

    const handleMutasi = async () => {
        try {
            setLoading(true);
            const target = data.find(d => d.id === mutasiData.id);
            if (!target) return;

            const updated = {
                ...target,
                status: mutasiData.status,
                tanggal_nonaktif: mutasiData.tanggal
            };

            const { apiCall: call } = await import('@/lib/utils');
            await call('saveData', 'POST', { type: 'ustadz', id: mutasiData.id, data: updated });
            setIsMutasiModalOpen(false);
            // Refresh data
            const res = await call('getData', 'GET', { type: 'ustadz' });
            setData(res || []);
        } catch (e) {
            console.error(e);
            alert("Gagal melakukan mutasi");
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => [
        { title: 'Total Pengajar', value: data.length, icon: 'fas fa-chalkboard-teacher', color: 'var(--primary)' },
        { title: 'Status Aktif', value: data.filter(d => d.status === 'Aktif').length, icon: 'fas fa-user-check', color: 'var(--success)' },
        { title: 'Cuti / Non-Aktif', value: data.filter(d => d.status !== 'Aktif').length, icon: 'fas fa-user-clock', color: 'var(--danger)' }
    ], [data]);

    const displayData = useMemo(() => {
        return data.filter(d =>
            (d.nama || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.kelas || '').toLowerCase().includes(search.toLowerCase())
        );
    }, [data, search]);

    const columns = [
        { key: 'nama', label: 'Nama Pengajar', render: (row) => <span style={{ fontWeight: 800 }}>{row.nama}</span> },
        { key: 'kelas', label: 'Tugas Mengajar' },
        { key: 'no_hp', label: 'WhatsApp', className: 'hide-mobile' },
        {
            key: 'status', label: 'Status', className: 'hide-mobile', render: (row) => (
                <span className="th-badge" style={{ background: row.status === 'Aktif' ? '#dcfce7' : '#fee2e2', color: row.status === 'Aktif' ? '#166534' : '#991b1b' }}>{row.status}</span>
            )
        },
        {
            key: 'actions', label: 'Aksi', width: '150px', render: (row) => (
                <div className="table-actions">
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openView(row)} title="Detail"><i className="fas fa-eye"></i></button>
                    {canEdit && <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)} title="Edit"><i className="fas fa-edit"></i></button>}
                    {canEdit && row.status === 'Aktif' && <button className="btn-vibrant btn-vibrant-yellow" onClick={() => openMutasi(row)} title="Mutasi / Berhenti"><i className="fas fa-exchange-alt"></i></button>}
                    {canDelete && <button className="btn-vibrant btn-vibrant-red" onClick={() => handleDelete(row.id, 'Hapus pengajar ini?')} title="Hapus"><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Direktori Tenaga Pengajar" subJudul="Pondok Pesantren Darussalam Lirboyo" hideOnScreen={true} />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Database Pengajar"
                subtitle={`Mencatat ${displayData.length} tenaga pendidik pondok pesantren.`}
                headerActions={(<>
                    <button className="btn btn-outline btn-sm" onClick={() => window.print()}><i className="fas fa-print"></i> Laporan</button>
                    {canEdit && <button className="btn btn-primary btn-sm" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Pengajar</button>}
                </>)}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari nama atau tugas..." }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Profil" : "Pengajar Baru"} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Profil'}</button>}>
                <TextInput label="Nama Lengkap & Gelar" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} required icon="fas fa-user-graduate" />
                <TextInput label="Tugas Mengajar" value={formData.kelas} onChange={e => setFormData({ ...formData, kelas: e.target.value })} icon="fas fa-chalkboard" />
                <div className="form-grid">
                    <TextInput label="WhatsApp" value={formData.no_hp} onChange={e => setFormData({ ...formData, no_hp: e.target.value })} icon="fab fa-whatsapp" />
                    <TextInput label="Status Saat Ini" value={formData.status} readOnly style={{ background: '#f8fafc' }} />
                </div>
                <TextAreaInput label="Alamat Domisili" value={formData.alamat} onChange={e => setFormData({ ...formData, alamat: e.target.value })} />
                <FileUploader label="Foto Profil" folder="simppds_pengajar" currentUrl={formData.foto_ustadz} onUploadSuccess={(url) => setFormData({ ...formData, foto_ustadz: url })} />
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Profil Pengajar" width="600px">
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <img src={viewData.foto_ustadz || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewData.nama)}&size=256&background=1e3a8a&color=fff&bold=true`} style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid var(--primary-light)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} alt="" />
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '1rem', color: 'var(--primary-dark)' }}>{viewData.nama}</h2>
                            <span className="th-badge" style={{ padding: '5px 15px' }}>{viewData.status.toUpperCase()}</span>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', border: '1px solid #f1f5f9' }}>
                            <div><small style={{ fontWeight: 800, color: 'var(--text-muted)' }}>WHATSAPP</small><div style={{ fontWeight: 700 }}>{viewData.no_hp || '-'}</div></div>
                            <div><small style={{ fontWeight: 800, color: 'var(--text-muted)' }}>TUGAS MENGAJAR</small><div style={{ fontWeight: 700 }}>{viewData.kelas || '-'}</div></div>
                            <div style={{ gridColumn: 'span 2' }}><small style={{ fontWeight: 800, color: 'var(--text-muted)' }}>ALAMAT DOMISILI</small><div style={{ fontWeight: 700 }}>{viewData.alamat || '-'}</div></div>
                        </div>
                        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                            <button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Tutup Profil</button>
                        </div>
                    </div>
                )}
            </Modal>
            <Modal
                isOpen={isMutasiModalOpen}
                onClose={() => setIsMutasiModalOpen(false)}
                title={`Mutasi Pengajar: ${mutasiData.nama}`}
                footer={<button className="btn btn-primary" onClick={handleMutasi} disabled={loading}>{loading ? 'Memproses...' : 'Simpan Mutasi'}</button>}
            >
                <div style={{ padding: '10px' }}>
                    <p style={{ marginBottom: '1.5rem', color: '#64748b', fontSize: '0.9rem' }}>Atur status non-aktif atau cuti untuk pengajar ini.</p>
                    <SelectInput
                        label="Status Baru"
                        value={mutasiData.status}
                        onChange={e => setMutasiData({ ...mutasiData, status: e.target.value })}
                        options={['Non-Aktif', 'Cuti', 'Pensiun', 'Lainnya']}
                    />
                    <TextInput
                        label="Tanggal Mutasi"
                        type="date"
                        value={mutasiData.tanggal}
                        onChange={e => setMutasiData({ ...mutasiData, tanggal: e.target.value })}
                    />
                </div>
            </Modal>
        </div >
    );
}