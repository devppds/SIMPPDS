'use client';

import React, { useState, useMemo } from 'react';
import { formatDate } from '@/lib/utils';
import { usePagePermission } from '@/lib/AuthContext';
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput, TextAreaInput } from '@/components/FormInput';
import FileUploader from '@/components/FileUploader';
import ConfirmModal from '@/components/ConfirmModal';

export default function AktaTanahPage() {
    const { canEdit, canDelete } = usePagePermission();
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
    const [mounted, setMounted] = useState(false);

    const {
        data, loading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, formData, setFormData, editId,
        handleSave, handleDelete, openModal, openView,
        isAdmin
    } = useDataManagement('arsip_akta_tanah', {
        nomor_akta: '', tanggal: '',
        lokasi: '', luas_tanah: '', atas_nama: '', status_kepemilikan: 'Milik Pondok',
        file_akta: '', keterangan: ''
    });

    React.useEffect(() => {
        setMounted(true);
        setFormData(prev => ({ ...prev, tanggal: new Date().toISOString().split('T')[0] }));
    }, [setFormData]);

    const displayData = useMemo(() => {
        return data.filter(d =>
            (d.nomor_akta || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.lokasi || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.atas_nama || '').toLowerCase().includes(search.toLowerCase())
        );
    }, [data, search]);

    const stats = useMemo(() => [
        { title: 'Total Akta', value: data.length, icon: 'fas fa-file-contract', color: 'var(--primary)' },
        { title: 'Total Luas', value: `${data.reduce((acc, d) => acc + parseFloat(d.luas_tanah || 0), 0)} m²`, icon: 'fas fa-vector-square', color: 'var(--success)' },
        { title: 'Status Lahan', value: 'Sertifikasi Aman', icon: 'fas fa-shield-alt', color: 'var(--warning)' }
    ], [data]);

    if (!mounted) return null;

    const columns = [
        { key: 'nomor_akta', label: 'No. Akta', render: (row) => <strong style={{ color: 'var(--primary-dark)' }}>{row.nomor_akta}</strong> },
        { key: 'tanggal', label: 'Tgl Akta', render: (row) => formatDate(row.tanggal) },
        { key: 'lokasi', label: 'Lokasi Lahan' },
        { key: 'luas_tanah', label: 'Luas', render: (row) => <span className="th-badge" style={{ background: '#f0fdf4', color: '#15803d' }}>{row.luas_tanah} m²</span> },
        { key: 'atas_nama', label: 'Pemilik' },
        {
            key: 'actions', label: 'Aksi', sortable: false, width: '150px', render: (row) => (
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
            <KopSurat judul="Arsip Inventaris Akta Tanah" subJudul="Dokumentasi aset lahan dan properti pondok pesantren." hideOnScreen={true} />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Management Aset Tanah"
                subtitle={`Mencatat ${displayData.length} dokumen sertifikat tanah.`}
                headerActions={canEdit && <button className="btn btn-primary btn-sm" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Akta</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari nomor akta atau lokasi..." }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? 'Edit Data Properti' : 'Registrasi Akta Baru'} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>}>
                <TextInput label="Nomor Sertifikat / Akta" value={formData.nomor_akta} onChange={e => setFormData({ ...formData, nomor_akta: e.target.value })} required icon="fas fa-hashtag" />
                <div className="form-grid">
                    <TextInput label="Tanggal Terbit" type="date" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} required />
                    <TextInput label="Luas (m²)" type="number" value={formData.luas_tanah} onChange={e => setFormData({ ...formData, luas_tanah: e.target.value })} required icon="fas fa-expand-arrows-alt" />
                </div>
                <TextInput label="Lokasi Lahan" value={formData.lokasi} onChange={e => setFormData({ ...formData, lokasi: e.target.value })} required />
                <TextInput label="Atas Nama (Pemilik)" value={formData.atas_nama} onChange={e => setFormData({ ...formData, atas_nama: e.target.value })} required />
                <SelectInput label="Status Kepemilikan" value={formData.status_kepemilikan} onChange={e => setFormData({ ...formData, status_kepemilikan: e.target.value })} options={['Milik Pondok', 'Wakaf', 'Sewa', 'Pinjam Pakai']} required />
                <FileUploader label="Scan Sertifikat Digital" value={formData.file_akta} onUploadSuccess={url => setFormData({ ...formData, file_akta: url })} folder="arsip_akta_tanah" previewShape="square" />
                <TextAreaInput label="Keterangan / Batas Lahan" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} />
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Profil Detail Aset Tanah" width="850px">
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ color: 'var(--primary)', fontSize: '3rem', marginBottom: '10px' }}><i className="fas fa-map-marked-alt"></i></div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary-dark)' }}>{viewData.nomor_akta}</h2>
                            <span className="th-badge" style={{ marginTop: '10px', padding: '5px 15px' }}>{viewData.status_kepemilikan.toUpperCase()}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: '#f8fafc', padding: '2rem', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                            <div><small style={{ fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.7rem' }}>LUAS TANAH</small><div style={{ fontWeight: 900, fontSize: '1.3rem', color: 'var(--success)' }}>{viewData.luas_tanah} m²</div></div>
                            <div><small style={{ fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.7rem' }}>ATAS NAMA</small><div style={{ fontWeight: 800 }}>{viewData.atas_nama}</div></div>
                            <div><small style={{ fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.7rem' }}>TANGGAL TERBIT</small><div>{formatDate(viewData.tanggal)}</div></div>
                            <div><small style={{ fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.7rem' }}>LOKASI</small><div>{viewData.lokasi}</div></div>
                            <div style={{ gridColumn: 'span 2' }}><small style={{ fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.7rem' }}>KETERANGAN / BATAS</small><p style={{ margin: 0 }}>{viewData.keterangan || '-'}</p></div>
                        </div>
                        {viewData.file_akta && (
                            <div style={{ marginTop: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 900 }}><i className="fas fa-file-pdf"></i> Visual Sertifikat</h3>
                                    <a href={viewData.file_akta} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">Buka Penuh</a>
                                </div>
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '15px', overflow: 'hidden' }}>
                                    {viewData.file_akta.toLowerCase().endsWith('.pdf') ? (
                                        <iframe src={viewData.file_akta} style={{ width: '100%', height: '550px', border: 'none' }} title="Akta PDF" />
                                    ) : (
                                        <img src={viewData.file_akta} style={{ width: '100%', objectFit: 'contain' }} alt="Sertifikat" />
                                    )}
                                </div>
                            </div>
                        )}
                        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                            <button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Kembali ke List</button>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id, null); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Arsip Sertifikat?"
                message="Data akta tanah ini akan dihapus permanen. Pastikan Anda memiliki salinan fisiknya."
            />
        </div>
    );
}
