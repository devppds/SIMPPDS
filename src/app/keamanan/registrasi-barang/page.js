'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';
import Autocomplete from '@/components/Autocomplete';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function KeamananRegPage() {
    const { user } = useAuth();
    const [santriOptions, setSantriOptions] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, setData, loading, setLoading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, formData, setFormData, editId,
        handleSave, handleDelete, openModal: baseOpenModal, openView, isAdmin
    } = useDataManagement('keamanan_reg', {
        nama_santri: '', kelas: '', jenis_barang: 'Kendaraan', detail_barang: '',
        jenis_kendaraan: '-', jenis_elektronik: '-', plat_nomor: '-',
        warna: '', merk: '', aksesoris_1: '-', aksesoris_2: '-', aksesoris_3: '-',
        keadaan: 'Baik', kamar_penempatan: '', tanggal_registrasi: '',
        petugas_penerima: '', keterangan: '', status_barang_reg: 'Aktif'
    });

    const loadEnrichedData = useCallback(async () => {
        setLoading(true);
        try {
            const [res, resSantri] = await Promise.all([
                apiCall('getData', 'GET', { type: 'keamanan_reg' }),
                apiCall('getData', 'GET', { type: 'santri' })
            ]);
            setData(res || []);
            setSantriOptions(resSantri || []);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, [setData, setLoading]);

    useEffect(() => { loadEnrichedData(); }, [loadEnrichedData]);

    const stats = useMemo(() => [
        { title: 'Total Barang', value: data.length, icon: 'fas fa-clipboard-list', color: 'var(--primary)' },
        { title: 'Kendaraan', value: data.filter(d => d.jenis_barang === 'Kendaraan').length, icon: 'fas fa-motorcycle', color: 'var(--success)' },
        { title: 'Elektronik', value: data.filter(d => d.jenis_barang === 'Elektronik').length, icon: 'fas fa-laptop', color: 'var(--warning)' }
    ], [data]);

    const openModal = (item = null) => {
        if (!item) {
            baseOpenModal();
            setFormData(prev => ({
                ...prev,
                petugas_penerima: user?.fullname || user?.username || '',
                tanggal_registrasi: new Date().toISOString().split('T')[0]
            }));
        } else { baseOpenModal(item); }
    };

    const handleSantriChange = (nama) => {
        const found = santriOptions.find(s => s.nama_siswa === nama);
        setFormData(prev => ({ ...prev, nama_santri: nama, kelas: found ? found.kelas : prev.kelas, kamar_penempatan: found ? found.kamar : prev.kamar_penempatan }));
    };

    const isMotor = formData.jenis_barang === 'Kendaraan' && (formData.detail_barang || '').toLowerCase().includes('motor');

    const displayData = data.filter(d => (d.nama_santri || '').toLowerCase().includes(search.toLowerCase()) || (d.detail_barang || '').toLowerCase().includes(search.toLowerCase()));

    const columns = [
        { key: 'tanggal_registrasi', label: 'Tgl Reg', render: (row) => formatDate(row.tanggal_registrasi) },
        { key: 'nama_santri', label: 'Pemilik', render: (row) => <div style={{ fontWeight: 800 }}>{row.nama_santri}</div> },
        { key: 'kelas', label: 'Kelas', render: (row) => <span className="th-badge">{row.kelas || '-'}</span> },
        { key: 'jenis_barang', label: 'Jenis' },
        { key: 'detail_barang', label: 'Barang', render: (row) => `${row.detail_barang} ${row.merk ? `(${row.merk})` : ''}` },
        {
            key: 'actions', label: 'Aksi', width: '150px', render: (row) => (
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
            <KopSurat judul="Registrasi Kepemilikan Barang" subJudul="Pendataan kendaraan, elektronik, dan peralatan santri." hideOnScreen={true} />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Log Registrasi Barang"
                subtitle={`Mencatat ${displayData.length} inventaris milik santri.`}
                headerActions={<button className="btn btn-primary btn-sm" onClick={() => openModal()}><i className="fas fa-plus"></i> Registrasi Baru</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value) }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Registrasi" : "Registrasi Baru"} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>}>
                <div className="form-group">
                    <label className="form-label">Nama Santri (Pemilik)</label>
                    <Autocomplete options={santriOptions} value={formData.nama_santri} onChange={handleSantriChange} onSelect={s => handleSantriChange(s.nama_siswa)} placeholder="Cari santri..." labelKey="nama_siswa" subLabelKey="kelas" />
                </div>
                <div className="form-grid">
                    <SelectInput label="Jenis Barang" value={formData.jenis_barang} onChange={e => setFormData({ ...formData, jenis_barang: e.target.value })} options={['Kendaraan', 'Elektronik', 'Kompor']} />
                    <TextInput label="Detail Nama Barang" value={formData.detail_barang} onChange={e => setFormData({ ...formData, detail_barang: e.target.value })} required placeholder="Contoh: Motor Honda Beat" />
                </div>
                {isMotor && <TextInput label="Nomor Plat" value={formData.plat_nomor} onChange={e => setFormData({ ...formData, plat_nomor: e.target.value })} placeholder="DD 1234 AB" required />}
                <div className="form-grid">
                    <TextInput label="Merk" value={formData.merk} onChange={e => setFormData({ ...formData, merk: e.target.value })} />
                    <TextInput label="Warna" value={formData.warna} onChange={e => setFormData({ ...formData, warna: e.target.value })} />
                </div>
                <div className="form-grid">
                    <SelectInput label="Kondisi" value={formData.keadaan} onChange={e => setFormData({ ...formData, keadaan: e.target.value })} options={['Baik', 'Rusak Ringan', 'Rusak Berat']} />
                    <TextInput label="Kamar" value={formData.kamar_penempatan} onChange={e => setFormData({ ...formData, kamar_penempatan: e.target.value })} />
                </div>
                <TextInput label="Petugas Penerima" value={formData.petugas_penerima} onChange={e => setFormData({ ...formData, petugas_penerima: e.target.value })} />
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Profil Barang" width="600px">
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '1rem' }}><i className={viewData.jenis_barang === 'Kendaraan' ? 'fas fa-motorcycle' : 'fas fa-laptop'}></i></div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{viewData.detail_barang}</h2>
                            <p>Milik: <strong>{viewData.nama_santri}</strong> ({viewData.kelas})</p>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '15px' }}>
                            <div className="form-grid">
                                <div><small>Merk</small><div style={{ fontWeight: 700 }}>{viewData.merk || '-'}</div></div>
                                <div><small>Warna</small><div style={{ fontWeight: 700 }}>{viewData.warna || '-'}</div></div>
                                {viewData.plat_nomor !== '-' && <div><small>Plat</small><div style={{ fontWeight: 800, color: 'var(--danger)' }}>{viewData.plat_nomor}</div></div>}
                                <div><small>Kondisi</small><div style={{ fontWeight: 700 }}>{viewData.keadaan}</div></div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id, null); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Registrasi?"
                message="Data kepemilikan barang ini akan dihapus dari sistem keamanan."
            />
        </div>
    );
}
