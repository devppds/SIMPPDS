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

export default function BarangSitaanPage() {
    const { canEdit } = usePagePermission();
    const [santriOptions, setSantriOptions] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, loading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, formData, setFormData, editId,
        handleSave, handleDelete, openModal, openView, isAdmin
    } = useDataManagement('barang_sitaan', {
        tanggal: '',
        nama_santri: '', kelas: '', nama_barang: '', alasan_sita: '',
        status: 'Disita', petugas: '', tanggal_kembali: ''
    });

    useEffect(() => {
        setFormData(prev => ({ ...prev, tanggal: new Date().toISOString().split('T')[0] }));
        apiCall('getData', 'GET', { type: 'santri' }).then(res => setSantriOptions(res || []));
    }, [setFormData]);

    const stats = useMemo(() => [
        { title: 'Barang Disita', value: data.filter(d => d.status === 'Disita').length, icon: 'fas fa-box-open', color: 'var(--danger)' },
        { title: 'Status Mediasi', value: data.filter(d => d.status === 'Proses').length, icon: 'fas fa-sync-alt', color: 'var(--warning)' },
        { title: 'Dikembalikan', value: data.filter(d => d.status === 'Dikembalikan').length, icon: 'fas fa-undo-alt', color: 'var(--success)' }
    ], [data]);

    const displayData = data.filter(d =>
        (d.nama_santri || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.nama_barang || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { key: 'tanggal', label: 'Tgl Sita', render: (row) => formatDate(row.tanggal) },
        { key: 'nama_santri', label: 'Santri', render: (row) => <div style={{ fontWeight: 700 }}>{row.nama_santri}</div> },
        { key: 'nama_barang', label: 'Barang', render: (row) => <strong>{row.nama_barang}</strong> },
        {
            key: 'status', label: 'Status', render: (row) => (
                <span className="th-badge" style={{ background: row.status === 'Dikembalikan' ? '#dcfce7' : '#fee2e2', color: row.status === 'Dikembalikan' ? '#166534' : '#991b1b' }}>{row.status}</span>
            )
        },
        {
            key: 'actions', label: 'Aksi', width: '150px', render: (row) => (
                <div className="table-actions">
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openView(row)} title="Detail"><i className="fas fa-eye"></i></button>
                    {canEdit && <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)} title="Edit"><i className="fas fa-edit"></i></button>
                    }
                    {isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => setConfirmDelete({ open: true, id: row.id })} title="Hapus"><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Pencatatan Barang Sitaan" subJudul="Log penertiban barang terlarang/tidak berizin." hideOnScreen={true} />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Management Barang Sitaan"
                subtitle={`Mencatat ${displayData.length} data penyitaan keamanan.`}
                headerActions={canEdit && <button className="btn btn-primary btn-sm" onClick={() => openModal()}><i className="fas fa-plus"></i> Input Sitaan</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value) }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Data" : "Input Penyitaan"} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>}>
                <div className="form-group">
                    <label className="form-label">Nama Santri</label>
                    <Autocomplete options={santriOptions} value={formData.nama_santri} onChange={v => setFormData({ ...formData, nama_santri: v })} onSelect={s => setFormData({ ...formData, nama_santri: s.nama_siswa, kelas: s.kelas })} placeholder="Cari santri..." labelKey="nama_siswa" subLabelKey="kelas" />
                </div>
                <div className="form-grid">
                    <TextInput label="Nama Barang" value={formData.nama_barang} onChange={e => setFormData({ ...formData, nama_barang: e.target.value })} required icon="fas fa-mobile-alt" />
                    <TextInput label="Tanggal Sita" type="date" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} />
                </div>
                <TextAreaInput label="Alasan Penyitaan" value={formData.alasan_sita} onChange={e => setFormData({ ...formData, alasan_sita: e.target.value })} />
                <div className="form-grid">
                    <SelectInput label="Status Barang" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} options={['Disita', 'Proses', 'Dikembalikan']} />
                    <TextInput label="Petugas Keamanan" value={formData.petugas} onChange={e => setFormData({ ...formData, petugas: e.target.value })} />
                </div>
                {formData.status === 'Dikembalikan' && <TextInput label="Tgl Pengembalian" type="date" value={formData.tanggal_kembali} onChange={e => setFormData({ ...formData, tanggal_kembali: e.target.value })} />}
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Penyitaan" width="600px">
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(viewData.nama_santri)}&background=1e3a8a&color=fff&size=128`} style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '1rem' }} alt="" />
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{viewData.nama_santri}</h2>
                            <span className="th-badge" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>{viewData.status}</span>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '15px' }}>
                            <div className="form-grid">
                                <div><small>Barang</small><div style={{ fontWeight: 800 }}>{viewData.nama_barang}</div></div>
                                <div><small>Tgl Sita</small><div style={{ fontWeight: 700 }}>{formatDate(viewData.tanggal)}</div></div>
                            </div>
                            <div style={{ marginTop: '1rem' }}><small>Alasan</small><p>{viewData.alasan_sita || '-'}</p></div>
                            <div style={{ marginTop: '1rem' }}><small>Petugas</small><div style={{ fontWeight: 700 }}>{viewData.petugas || '-'}</div></div>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id, null); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Data Sitaan?"
                message="Data ini akan dihapus secara permanen dari log keamanan."
            />
        </div>
    );
}