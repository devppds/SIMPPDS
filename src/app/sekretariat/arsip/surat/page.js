'use client';

import React, { useState, useMemo } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput, TextAreaInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';
import FileUploader from '@/components/FileUploader';

export default function SuratPage() {
    const [filterTipe, setFilterTipe] = useState('Semua');
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, loading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, formData, setFormData, editId,
        handleSave, handleDelete, openModal, openView, isAdmin
    } = useDataManagement('arsip_surat', {
        tanggal: '',
        nomor_surat: '', tipe: 'Masuk', pengirim_penerima: '',
        perihal: '', keterangan: '', file_surat: ''
    });

    React.useEffect(() => {
        setFormData(prev => ({ ...prev, tanggal: new Date().toISOString().split('T')[0] }));
    }, [setFormData]);

    const displayData = data.filter(d => {
        const matchSearch = (d.nomor_surat || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.pengirim_penerima || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.perihal || '').toLowerCase().includes(search.toLowerCase());
        const matchFilter = filterTipe === 'Semua' || d.tipe === filterTipe;
        return matchSearch && matchFilter;
    });

    const stats = useMemo(() => [
        { title: 'Total Surat', value: data.length, icon: 'fas fa-envelope', color: 'var(--primary)' },
        { title: 'Surat Masuk', value: data.filter(d => d.tipe === 'Masuk').length, icon: 'fas fa-inbox', color: 'var(--success)' },
        { title: 'Surat Keluar', value: data.filter(d => d.tipe === 'Keluar').length, icon: 'fas fa-paper-plane', color: 'var(--warning)' }
    ], [data]);

    const columns = [
        { key: 'tanggal', label: 'Tgl Surat', render: (row) => formatDate(row.tanggal) },
        { key: 'nomor_surat', label: 'No. Surat', render: (row) => <strong style={{ color: 'var(--primary-dark)' }}>{row.nomor_surat}</strong> },
        { key: 'tipe', label: 'Tipe', render: (row) => <span className="th-badge" style={{ background: row.tipe === 'Masuk' ? '#dcfce7' : '#dbeafe', color: row.tipe === 'Masuk' ? '#166534' : '#1e40af' }}>{row.tipe}</span> },
        { key: 'pengirim_penerima', label: 'Dari/Ke', render: (row) => <div><div style={{ fontWeight: 700 }}>{row.pengirim_penerima}</div><small style={{ color: 'var(--text-muted)' }}>{row.perihal}</small></div> },
        {
            key: 'actions', label: 'Ops', width: '150px', render: (row) => (
                <div className="table-actions">
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openView(row)}><i className="fas fa-eye"></i></button>
                    <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)}><i className="fas fa-edit"></i></button>
                    {isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => setConfirmDelete({ open: true, id: row.id })}><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Arsip Dokumentasi Surat" subJudul="Manajemen surat masuk dan keluar pondok pesantren." hideOnScreen={true} />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Log Arsip Surat"
                subtitle={`Daftar permohonan dan korespondensi pesantren.`}
                headerActions={<button className="btn btn-primary btn-sm" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Surat</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value) }}
                filters={<SelectInput value={filterTipe} onChange={e => setFilterTipe(e.target.value)} options={['Semua', 'Masuk', 'Keluar']} style={{ width: '150px', marginBottom: 0 }} />}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Arsip" : "Registrasi Surat"} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>}>
                <div className="form-grid">
                    <TextInput label="Tanggal Surat" type="date" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} required />
                    <SelectInput label="Tipe Surat" value={formData.tipe} onChange={e => setFormData({ ...formData, tipe: e.target.value })} options={['Masuk', 'Keluar']} required />
                </div>
                <TextInput label="Nomor Registrasi Surat" value={formData.nomor_surat} onChange={e => setFormData({ ...formData, nomor_surat: e.target.value })} required icon="fas fa-hashtag" />
                <TextInput label="Instansi Pengirim / Penerima" value={formData.pengirim_penerima} onChange={e => setFormData({ ...formData, pengirim_penerima: e.target.value })} required />
                <TextInput label="Perihal / Ringkasan Isi" value={formData.perihal} onChange={e => setFormData({ ...formData, perihal: e.target.value })} required />
                <FileUploader label="Scan Dokumen Digital" value={formData.file_surat} onUploadSuccess={url => setFormData({ ...formData, file_surat: url })} folder="arsip_surat" previewShape="square" />
                <TextAreaInput label="Keterangan Tambahan" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} />
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Rincian Arsip Surat" width="800px">
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ fontWeight: 900, fontSize: '1.8rem', color: 'var(--primary-dark)' }}>{viewData.nomor_surat}</div>
                            <span className="th-badge" style={{ marginTop: '10px', padding: '5px 15px' }}>{viewData.tipe.toUpperCase()}</span>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '15px', marginBottom: '1.5rem' }}>
                            <div className="form-grid">
                                <div><small>Tanggal</small><div style={{ fontWeight: 800 }}>{formatDate(viewData.tanggal)}</div></div>
                                <div><small>Unit Pesantren</small><div style={{ fontWeight: 800 }}>Sekretariat</div></div>
                                <div><small>Pengirim / Penerima</small><div style={{ fontWeight: 800, color: 'var(--primary)' }}>{viewData.pengirim_penerima}</div></div>
                                <div><small>Perihal</small><div style={{ fontWeight: 700 }}>{viewData.perihal}</div></div>
                            </div>
                        </div>
                        {viewData.file_surat && (
                            <div style={{ marginTop: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 900 }}><i className="fas fa-file-pdf"></i> Dokumen Digital</h3>
                                    <a href={viewData.file_surat} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">Buka di Tab Baru</a>
                                </div>
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '15px', overflow: 'hidden' }}>
                                    {viewData.file_surat.toLowerCase().endsWith('.pdf') ? (
                                        <iframe src={viewData.file_surat} style={{ width: '100%', height: '500px', border: 'none' }} title="Surat PDF"></iframe>
                                    ) : (
                                        <img src={viewData.file_surat} style={{ width: '100%' }} alt="Surat Image" />
                                    )}
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
                title="Hapus Arsip Surat?"
                message="Data arsip ini akan dihapus permanen. Pastikan file digital sudah diunduh jika masih diperlukan."
            />
        </div>
    );
}
