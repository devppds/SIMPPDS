'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth, usePagePermission } from '@/lib/AuthContext';
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';
import Autocomplete from '@/components/Autocomplete';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput, TextAreaInput } from '@/components/FormInput';
import PremiumBanner from '@/components/PremiumBanner';

export default function PelanggaranPage() {
    const { user, isAdmin } = useAuth();
    const { canEdit, canDelete } = usePagePermission();
    const [mounted, setMounted] = useState(false);
    const [santriOptions, setSantriOptions] = useState([]);
    const [pengurusOptions, setPengurusOptions] = useState([]);

    const {
        data, loading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, formData, setFormData, editId,
        handleSave, handleDelete, openModal: baseOpenModal, openView
    } = useDataManagement('keamanan', {
        tanggal: new Date().toISOString().split('T')[0],
        nama_santri: '', jenis_pelanggaran: 'Ringan', poin: '5',
        takzir: '', keterangan: '', petugas: ''
    });

    useEffect(() => { setMounted(true); }, []);

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

    const displayData = data.filter(d =>
        (d.nama_santri || '').toLowerCase().includes(search.toLowerCase())
    );

    const stats = useMemo(() => [
        { title: 'Total Pelanggaran', value: data.length, icon: 'fas fa-gavel', color: 'var(--danger)' },
        { title: 'Poin Tertinggi', value: data.length > 0 ? Math.max(...data.map(d => parseInt(d.poin) || 0)) : 0, icon: 'fas fa-exclamation-triangle', color: 'var(--warning)' },
        { title: 'Petugas Aktif', value: [...new Set(data.map(d => d.petugas))].filter(Boolean).length, icon: 'fas fa-user-shield', color: 'var(--primary)' }
    ], [data]);

    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => <span style={{ fontWeight: 600 }}>{formatDate(row.tanggal)}</span> },
        {
            key: 'nama_santri',
            label: 'Nama Santri',
            render: (row) => <div style={{ fontWeight: 800 }}>{row.nama_santri}</div>
        },
        { key: 'jenis_pelanggaran', label: 'Tipe', render: (row) => <span className="th-badge" style={{ background: row.jenis_pelanggaran === 'Berat' ? '#fee2e2' : '#f1f5f9' }}>{row.jenis_pelanggaran}</span> },
        {
            key: 'poin',
            label: 'Poin',
            render: (row) => (
                <span style={{
                    fontWeight: 800,
                    color: row.poin >= 50 ? '#dc2626' : row.poin >= 20 ? '#f59e0b' : '#059669'
                }}>
                    {row.poin}
                </span>
            )
        },
        { key: 'takzir', label: 'Takzir' },
        {
            key: 'actions',
            label: 'Opsi',
            width: '150px',
            render: (row) => (
                <div className="table-actions">
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openView(row)} title="Detail"><i className="fas fa-eye"></i></button>
                    {canEdit && <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)} title="Edit"><i className="fas fa-edit"></i></button>}
                    {canDelete && <button className="btn-vibrant btn-vibrant-red" onClick={() => handleDelete(row.id)} title="Hapus"><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    if (!mounted) return null;

    return (
        <div className="view-container animate-in">
            <PremiumBanner
                title="Pusat Kedisiplinan Santri"
                subtitle="Manajemen log pelanggaran, akumulasi poin kedisiplinan, dan kontrol takzir santri."
                icon="fas fa-shield-alt"
                floatingIcon="fas fa-gavel"
                bgGradient="linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)"
            />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Log Pelanggaran Santri"
                subtitle="Daftar catatan kedisiplinan yang terakumulasi."
                headerActions={canEdit && <button className="btn btn-primary" onClick={() => openModal()}><i className="fas fa-plus"></i> Catat Pelanggaran</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari nama santri..." }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Catatan Pelanggaran" : "Input Pelanggaran Baru"} width="750px" footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Data'}</button>}>
                <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 800 }}>Nama Santri</label>
                    <Autocomplete
                        options={santriOptions}
                        value={formData.nama_santri}
                        onChange={(val) => setFormData({ ...formData, nama_santri: val })}
                        onSelect={(s) => setFormData({ ...formData, nama_santri: s.nama_siswa, kelas: s.kelas })}
                        placeholder="Cari santri..."
                        labelKey="nama_siswa"
                        subLabelKey="kelas"
                    />
                </div>
                <div className="form-grid">
                    <TextInput label="Tanggal Kejadian" type="date" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} required />
                    <SelectInput label="Jenis Pelanggaran" value={formData.jenis_pelanggaran} onChange={e => setFormData({ ...formData, jenis_pelanggaran: e.target.value })} options={['Ringan', 'Sedang', 'Berat']} />
                </div>
                <div className="form-grid">
                    <TextInput label="Poin Pelanggaran" type="number" value={formData.poin} onChange={e => setFormData({ ...formData, poin: e.target.value })} />
                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 800 }}>Petugas Penindak (Pengurus)</label>
                        <Autocomplete
                            options={pengurusOptions}
                            value={formData.petugas}
                            onChange={v => setFormData({ ...formData, petugas: v })}
                            onSelect={p => setFormData({ ...formData, petugas: p.nama })}
                            placeholder="Cari pengurus..."
                            labelKey="nama"
                            subLabelKey="jabatan"
                        />
                    </div>
                </div>
                <TextInput label="Takzir / Sanksi Diberikan" value={formData.takzir} onChange={e => setFormData({ ...formData, takzir: e.target.value })} placeholder="Misal: Menyiram bunga" />
                <TextAreaInput label="Keterangan Kronologi" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} />
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Pelanggaran" width="600px">
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{
                                width: '100px', height: '100px', borderRadius: '50%',
                                background: 'var(--danger-light)', color: 'var(--danger)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1rem', fontSize: '2.5rem', border: '4px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                            }}>
                                <i className="fas fa-user-slash"></i>
                            </div>
                            <h2 className="outfit" style={{ fontSize: '1.8rem', fontWeight: 900 }}>{viewData.nama_santri}</h2>
                            <p style={{ color: 'var(--text-muted)' }}>{viewData.kelas || 'Tanpa Kelas'}</p>
                            <span className="th-badge" style={{ background: 'var(--danger)', color: 'white', padding: '5px 15px' }}>{viewData.jenis_pelanggaran}</span>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div><small>Poin Pelanggaran</small><div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--danger)' }}>{viewData.poin} Poin</div></div>
                            <div><small>Tanggal</small><div style={{ fontWeight: 700 }}>{formatDate(viewData.tanggal)}</div></div>
                            <div><small>Petugas</small><div style={{ fontWeight: 700 }}>{viewData.petugas || '-'}</div></div>
                            <div><small>Takzir</small><div style={{ fontWeight: 700, color: 'var(--warning-dark)' }}>{viewData.takzir || '-'}</div></div>
                        </div>

                        <div style={{ marginTop: '1.5rem' }}>
                            <small>Kronologi / Keterangan</small>
                            <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '15px', marginTop: '8px', lineHeight: '1.6' }}>
                                {viewData.keterangan || 'Tidak ada keterangan tambahan.'}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}