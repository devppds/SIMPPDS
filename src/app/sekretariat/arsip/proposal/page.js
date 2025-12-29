'use client';

import React, { useMemo, useState } from 'react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput, TextAreaInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';
import FileUploader from '@/components/FileUploader';

export default function ProposalPage() {
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, loading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, formData, setFormData, editId,
        handleSave, handleDelete, openModal, openView, isAdmin
    } = useDataManagement('arsip_proposal', {
        tanggal: new Date().toISOString().split('T')[0],
        nomor_proposal: '', judul: '', pengaju: '', nominal: '', status: 'Diajukan', file_proposal: '', keterangan: ''
    });

    const displayData = data.filter(d =>
        (d.nomor_proposal || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.judul || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.pengaju || '').toLowerCase().includes(search.toLowerCase())
    );

    const stats = useMemo(() => [
        { title: 'Total Proposal', value: data.length, icon: 'fas fa-file-signature', color: 'var(--primary)' },
        { title: 'Disetujui', value: data.filter(d => d.status === 'Disetujui').length, icon: 'fas fa-check-double', color: 'var(--success)' },
        { title: 'Nilai Pengajuan', value: formatCurrency(data.reduce((acc, d) => acc + parseInt(d.nominal || 0), 0)), icon: 'fas fa-money-check-alt', color: 'var(--warning)' }
    ], [data]);

    const columns = [
        { key: 'tanggal', label: 'Tgl Pengajuan', render: (row) => formatDate(row.tanggal) },
        { key: 'nomor_proposal', label: 'No. Proposal', render: (row) => <strong style={{ color: 'var(--primary-dark)' }}>{row.nomor_proposal}</strong> },
        { key: 'judul', label: 'Judul Proposal', render: (row) => <div><div style={{ fontWeight: 800 }}>{row.judul}</div><small>{row.pengaju}</small></div> },
        { key: 'nominal', label: 'Nominal', render: (row) => <span style={{ fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(row.nominal)}</span> },
        {
            key: 'status', label: 'Status', render: (row) => (
                <span className="th-badge" style={{
                    background: row.status === 'Disetujui' ? '#dcfce7' : (row.status === 'Ditolak' ? '#fee2e2' : '#fffbeb'),
                    color: row.status === 'Disetujui' ? '#166534' : (row.status === 'Ditolak' ? '#991b1b' : '#9a3412')
                }}>{row.status}</span>
            )
        },
        {
            key: 'actions', label: 'Aksi', width: '150px', render: (row) => (
                <div className="table-actions">
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openView(row)} title="Detail"><i className="fas fa-eye"></i></button>
                    <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)} title="Edit"><i className="fas fa-edit"></i></button>
                    {isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => setConfirmDelete({ open: true, id: row.id })} title="Hapus"><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Manajemen Arsip Proposal" subJudul="Pencatatan usulan program kerja dan permohonan dana." hideOnScreen={true} />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Daftar Proposal Kegiatan"
                subtitle={`Menyeleksi ${displayData.length} dokumen proposal.`}
                headerActions={<button className="btn btn-primary btn-sm" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Proposal</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value) }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Proposal" : "Registrasi Proposal Baru"} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>}>
                <div className="form-grid">
                    <TextInput label="Tanggal " type="date" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} required />
                    <TextInput label="Nomor Dokumen" value={formData.nomor_proposal} onChange={e => setFormData({ ...formData, nomor_proposal: e.target.value })} required />
                </div>
                <TextInput label="Judul / Nama Kegiatan" value={formData.judul} onChange={e => setFormData({ ...formData, judul: e.target.value })} required icon="fas fa-heading" />
                <div className="form-grid">
                    <TextInput label="Pengaju / Unit" value={formData.pengaju} onChange={e => setFormData({ ...formData, pengaju: e.target.value })} required />
                    <TextInput label="Anggaran (IDR)" type="number" value={formData.nominal} onChange={e => setFormData({ ...formData, nominal: e.target.value })} required />
                </div>
                <SelectInput label="Status Verifikasi" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} options={['Diajukan', 'Disetujui', 'Ditolak']} required />
                <FileUploader label="Upload Berkas Digital" value={formData.file_proposal} onUploadSuccess={url => setFormData({ ...formData, file_proposal: url })} folder="arsip_proposal" previewShape="square" />
                <TextAreaInput label="Keterangan / Memo" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} />
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Profil Arsip Proposal" width="800px">
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ color: 'var(--primary)', fontSize: '2.5rem', marginBottom: '10px' }}><i className="fas fa-file-contract"></i></div>
                            <h2 style={{ fontSize: '1.6rem', fontWeight: 900 }}>{viewData.judul}</h2>
                            <div className="th-badge" style={{ padding: '5px 15px' }}>{viewData.status}</div>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '15px' }}>
                            <div className="form-grid">
                                <div><small>Nominal</small><div style={{ fontWeight: 800, color: 'var(--success)', fontSize: '1.2rem' }}>{formatCurrency(viewData.nominal)}</div></div>
                                <div><small>Pic / Pengaju</small><div style={{ fontWeight: 800 }}>{viewData.pengaju}</div></div>
                                <div><small>Tgl Pengajuan</small><div style={{ fontWeight: 700 }}>{formatDate(viewData.tanggal)}</div></div>
                                <div><small>No Dokumen</small><div style={{ fontWeight: 700 }}>{viewData.nomor_proposal || '-'}</div></div>
                            </div>
                        </div>
                        {viewData.file_proposal && (
                            <div style={{ marginTop: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Visual Dokumen</h3><a href={viewData.file_proposal} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">Fullscreen</a></div>
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '15px', overflow: 'hidden' }}>
                                    {viewData.file_proposal.toLowerCase().endsWith('.pdf') ? (
                                        <iframe src={viewData.file_proposal} style={{ width: '100%', height: '500px', border: 'none' }} title="Proposal PDF"></iframe>
                                    ) : <img src={viewData.file_proposal} style={{ width: '100%' }} alt="Proposal Image" />}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id, null); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Arsip Proposal?"
                message="Data proposal ini akan dihapus permanen dari sistem pengarsipan."
            />
        </div>
    );
}
