'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth, usePagePermission } from '@/lib/AuthContext';
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
    const { user, isAdmin } = useAuth();
    const { canEdit, canDelete } = usePagePermission();
    const [santriOptions, setSantriOptions] = useState([]);
    const [pengurusOptions, setPengurusOptions] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, loading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, formData, setFormData, editId,
        handleSave, handleDelete, openModal: baseOpenModal, openView
    } = useDataManagement('barang_sitaan', {
        tanggal: new Date().toISOString().split('T')[0],
        nama_santri: '', kelas: '', nama_barang: '', alasan_sita: '',
        status: 'Disita', petugas: '', tanggal_kembali: ''
    });

    const loadData = useCallback(async () => {
        try {
            const [santri, pengurus] = await Promise.all([
                apiCall('getData', 'GET', { type: 'santri' }),
                apiCall('getData', 'GET', { type: 'pengurus' })
            ]);
            setSantriOptions(santri || []);
            setPengurusOptions(pengurus || []);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const openModal = (row = null) => {
        if (!row) {
            baseOpenModal();
            setFormData(prev => ({
                ...prev,
                tanggal: new Date().toISOString().split('T')[0],
                petugas: user?.fullname || user?.username || ''
            }));
        } else {
            baseOpenModal(row);
        }
    };

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
                <span className="th-badge" style={{ background: row.status === 'Dikembalikan' ? '#dcfce7' : row.status === 'Proses' ? '#fffbeb' : '#fee2e2', color: row.status === 'Dikembalikan' ? '#166534' : row.status === 'Proses' ? '#9a3412' : '#991b1b' }}>{row.status}</span>
            )
        },
        {
            key: 'actions', label: 'Opsi', width: '150px', render: (row) => (
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
            <KopSurat judul="Pencatatan Barang Sitaan" subJudul="Log penertiban barang terlarang/tidak berizin." hideOnScreen={true} />

            <div style={{ marginBottom: '2.5rem' }}>
                <h1 className="outfit" style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>
                    Barang Sitaan
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Pencatatan inventaris barang santri yang disita oleh pihak keamanan.</p>
            </div>

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Management Barang Sitaan"
                subtitle={`Mencatat ${displayData.length} data penyitaan keamanan.`}
                headerActions={canEdit && <button className="btn btn-primary" onClick={() => openModal()}><i className="fas fa-plus"></i> Input Sitaan</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value) }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Data Sitaan" : "Catat Penyitaan Baru"} width="750px" footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Data'}</button>}>
                <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 800 }}>Nama Pemilik (Santri)</label>
                    <Autocomplete options={santriOptions} value={formData.nama_santri} onChange={v => setFormData({ ...formData, nama_santri: v })} onSelect={s => setFormData({ ...formData, nama_santri: s.nama_siswa, kelas: s.kelas })} placeholder="Cari santri..." labelKey="nama_siswa" subLabelKey="kelas" />
                </div>
                <div className="form-grid">
                    <TextInput label="Nama Barang / Jenis" value={formData.nama_barang} onChange={e => setFormData({ ...formData, nama_barang: e.target.value })} required icon="fas fa-mobile-alt" placeholder="Misal: HP Oppo A54" />
                    <TextInput label="Tanggal Penyitaan" type="date" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} />
                </div>
                <TextAreaInput label="Alasan Penyitaan" value={formData.alasan_sita} onChange={e => setFormData({ ...formData, alasan_sita: e.target.value })} placeholder="Jelaskan alasan barang disita..." />
                <div className="form-grid">
                    <SelectInput label="Status Barang" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} options={['Disita', 'Proses', 'Dikembalikan']} />
                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 800 }}>Petugas Keamanan</label>
                        <Autocomplete
                            options={pengurusOptions}
                            value={formData.petugas}
                            onChange={v => setFormData({ ...formData, petugas: v })}
                            onSelect={p => setFormData({ ...formData, petugas: p.nama })}
                            placeholder="Cari petugas..."
                            labelKey="nama"
                            subLabelKey="jabatan"
                        />
                    </div>
                </div>
                {formData.status === 'Dikembalikan' && <TextInput label="Tanggal Dikembalikan" type="date" value={formData.tanggal_kembali} onChange={e => setFormData({ ...formData, tanggal_kembali: e.target.value })} />}
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Barang Sitaan" width="600px">
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{
                                width: '100px', height: '100px', borderRadius: '25px',
                                background: 'var(--danger-light)', color: 'var(--danger)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1rem', fontSize: '2.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                            }}>
                                <i className="fas fa-box"></i>
                            </div>
                            <h2 className="outfit" style={{ fontSize: '1.8rem', fontWeight: 900 }}>{viewData.nama_barang}</h2>
                            <p style={{ color: 'var(--text-muted)' }}>Pemilik: <strong>{viewData.nama_santri}</strong></p>
                            <span className="th-badge" style={{ background: viewData.status === 'Dikembalikan' ? 'var(--success)' : 'var(--danger)', color: 'white', padding: '5px 15px' }}>{viewData.status}</span>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div><small>Tanggal Sita</small><div style={{ fontWeight: 700 }}>{formatDate(viewData.tanggal)}</div></div>
                            <div><small>Petugas</small><div style={{ fontWeight: 700 }}>{viewData.petugas || '-'}</div></div>
                            {viewData.status === 'Dikembalikan' && <div><small>Tanggal Kembali</small><div style={{ fontWeight: 700, color: 'var(--success)' }}>{formatDate(viewData.tanggal_kembali)}</div></div>}
                        </div>

                        <div style={{ marginTop: '1.5rem' }}>
                            <small>Alasan & Keterangan</small>
                            <div style={{ padding: '1.2rem', border: '1px solid #e2e8f0', borderRadius: '15px', marginTop: '8px', background: 'white', lineHeight: '1.6' }}>
                                {viewData.alasan_sita || 'Tidak ada keterangan detail.'}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}