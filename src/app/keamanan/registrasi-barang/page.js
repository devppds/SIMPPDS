'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

export default function KeamananRegPage() {
    const { user, isAdmin } = useAuth();
    const { canEdit, canDelete } = usePagePermission();
    const [santriOptions, setSantriOptions] = useState([]);
    const [mounted, setMounted] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, setData, loading, setLoading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, formData, setFormData, editId,
        handleSave, handleDelete, openModal: baseOpenModal, openView
    } = useDataManagement('keamanan_reg', {
        nama_santri: '', kelas: '', jenis_barang: 'Kendaraan', detail_barang: '',
        jenis_kendaraan: '-', jenis_elektronik: '-', plat_nomor: '-',
        warna: '', merk: '', aksesoris_1: '-', aksesoris_2: '-', aksesoris_3: '-',
        keadaan: 'Baik', kamar_penempatan: '', tanggal_registrasi: '',
        petugas_penerima: '', keterangan: '', status_barang_reg: 'Aktif'
    });

    useEffect(() => {
        setMounted(true);
    }, []);

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
        { title: 'Total Inventaris', value: data.length, icon: 'fas fa-boxes', color: 'var(--primary)' },
        { title: 'Unit Kendaraan', value: data.filter(d => d.jenis_barang === 'Kendaraan').length, icon: 'fas fa-motorcycle', color: 'var(--success)' },
        { title: 'Barang Elektronik', value: data.filter(d => d.jenis_barang === 'Elektronik').length, icon: 'fas fa-laptop', color: 'var(--warning)' },
        { title: 'Peralatan Lainnya', value: data.filter(d => !['Kendaraan', 'Elektronik'].includes(d.jenis_barang)).length, icon: 'fas fa-tools', color: 'var(--accent)' }
    ], [data]);

    const handleSantriChange = (nama) => {
        const found = santriOptions.find(s => s.nama_siswa === nama);
        setFormData(prev => ({
            ...prev,
            nama_santri: nama,
            kelas: found ? found.kelas : prev.kelas,
            kamar_penempatan: found ? (found.kamar || found.asrama) : prev.kamar_penempatan
        }));
    };

    const getItemIcon = (type) => {
        switch (type) {
            case 'Kendaraan': return 'fas fa-motorcycle';
            case 'Elektronik': return 'fas fa-laptop';
            case 'Kompor': return 'fas fa-fire';
            default: return 'fas fa-tag';
        }
    };

    const displayData = data.filter(d =>
        (d.nama_santri || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.detail_barang || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.merk || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        {
            key: 'item',
            label: 'Barang',
            render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '1.2rem' }}>
                        <i className={getItemIcon(row.jenis_barang)}></i>
                    </div>
                    <div>
                        <div style={{ fontWeight: 800 }}>{row.detail_barang}</div>
                        <small style={{ color: 'var(--text-muted)' }}>{row.merk} - {row.warna}</small>
                    </div>
                </div>
            )
        },
        {
            key: 'pemilik',
            label: 'Pemilik',
            render: (row) => (
                <div>
                    <div style={{ fontWeight: 700 }}>{row.nama_santri}</div>
                    <small className="th-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.65rem' }}>{row.kelas || 'N/A'}</small>
                </div>
            )
        },
        {
            key: 'tanggal_registrasi',
            label: 'Tgl Reg',
            render: (row) => <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{formatDate(row.tanggal_registrasi)}</span>
        },
        {
            key: 'keadaan',
            label: 'Kondisi',
            render: (row) => (
                <span className="th-badge" style={{
                    background: row.keadaan === 'Baik' ? '#dcfce7' : '#fee2e2',
                    color: row.keadaan === 'Baik' ? '#166534' : '#991b1b'
                }}>
                    {row.keadaan}
                </span>
            )
        },
        {
            key: 'actions', label: 'Opsi', width: '150px', render: (row) => (
                <div className="table-actions">
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openView(row)} title="Detail"><i className="fas fa-eye"></i></button>
                    {canEdit && <button className="btn-vibrant btn-vibrant-blue" onClick={() => baseOpenModal(row)} title="Edit"><i className="fas fa-edit"></i></button>}
                    {canDelete && <button className="btn-vibrant btn-vibrant-red" onClick={() => setConfirmDelete({ open: true, id: row.id })} title="Hapus"><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    if (!mounted) return null;

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Registrasi Kepemilikan Barang" subJudul="Pusat pendataan inventaris pribadi santri (Kendaraan, Elektronik, & Peralatan)." hideOnScreen={true} />

            <div style={{ marginBottom: '2.5rem' }}>
                <h1 className="outfit" style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>
                    Registrasi Barang
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Kelola dan awasi kepemilikan inventaris santri untuk ketertiban asrama.</p>
            </div>

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Daftar Inventaris Terdaftar"
                subtitle="Daftar seluruh barang yang sudah memiliki izin masuk pondok."
                headerActions={canEdit && (
                    <button className="btn btn-primary" onClick={() => baseOpenModal()}>
                        <i className="fas fa-plus"></i> Registrasi Baru
                    </button>
                )}
                searchProps={{
                    value: search,
                    onChange: e => setSearch(e.target.value),
                    placeholder: "Cari berdasarkan nama santri atau barang..."
                }}
                tableProps={{ columns, data: displayData, loading }}
            />

            {/* Modal Input/Edit */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? "Update Data Registrasi" : "Registrasi Barang Baru"}
                width="800px"
                footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Data'}</button>}
            >
                <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'var(--primary-light)', borderRadius: '16px', border: '1px solid var(--primary)' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>Data Pemilik (Santri)</label>
                        <Autocomplete
                            options={santriOptions}
                            value={formData.nama_santri}
                            onChange={handleSantriChange}
                            onSelect={s => handleSantriChange(s.nama_siswa)}
                            placeholder="Ketik nama santri untuk mencari..."
                            labelKey="nama_siswa"
                            subLabelKey="kelas"
                        />
                    </div>
                </div>

                <div className="form-grid">
                    <SelectInput
                        label="Kategori Barang"
                        value={formData.jenis_barang}
                        onChange={e => setFormData({ ...formData, jenis_barang: e.target.value })}
                        options={['Kendaraan', 'Elektronik', 'Peralatan Masak', 'Lainnya']}
                    />
                    <TextInput
                        label="Nama & Detail Barang"
                        value={formData.detail_barang}
                        onChange={e => setFormData({ ...formData, detail_barang: e.target.value })}
                        required
                        placeholder="Contoh: Honda Vario 150 / Laptop ASUS"
                    />
                </div>

                <div className="form-grid">
                    <TextInput label="Merk" value={formData.merk} onChange={e => setFormData({ ...formData, merk: e.target.value })} placeholder="Contoh: Honda / Acer" />
                    <TextInput label="Warna" value={formData.warna} onChange={e => setFormData({ ...formData, warna: e.target.value })} placeholder="Contoh: Hitam / Silver" />
                </div>

                {formData.jenis_barang === 'Kendaraan' && (
                    <div className="form-grid animate-in" style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
                        <TextInput label="Nomor Plat" value={formData.plat_nomor} onChange={e => setFormData({ ...formData, plat_nomor: e.target.value })} placeholder="AG 1234 XY" />
                        <SelectInput label="Tipe Kendaraan" value={formData.jenis_kendaraan} onChange={e => setFormData({ ...formData, jenis_kendaraan: e.target.value })} options={['Sepeda Motor', 'Sepeda Listrik', 'Sepeda Gayung', 'Mobil']} />
                    </div>
                )}

                <div className="form-grid">
                    <SelectInput label="Kondisi Fisik" value={formData.keadaan} onChange={e => setFormData({ ...formData, keadaan: e.target.value })} options={['Baik', 'Rusak Ringan', 'Rusak Berat']} />
                    <TextInput label="Penempatan (Kamar)" value={formData.kamar_penempatan} onChange={e => setFormData({ ...formData, kamar_penempatan: e.target.value })} />
                </div>

                <div className="form-grid">
                    <TextInput label="Tanggal Registrasi" type="date" value={formData.tanggal_registrasi} onChange={e => setFormData({ ...formData, tanggal_registrasi: e.target.value })} />
                    <TextInput label="Petugas Keamanan" value={formData.petugas_penerima} onChange={e => setFormData({ ...formData, petugas_penerima: e.target.value })} readOnly={!isAdmin} style={!isAdmin ? { background: '#f8fafc' } : {}} />
                </div>

                <TextAreaInput label="Catatan Tambahan / Aksesoris" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} placeholder="Contoh: Ada stiker khusus, lecet di bagian kanan, dll." />
            </Modal>

            {/* Modal Detail (View) */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Profil Detail Inventaris" width="650px">
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                            <div style={{
                                width: '100px', height: '100px',
                                border: '3px solid var(--primary)',
                                borderRadius: '30px', margin: '0 auto 1.5rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '3rem', color: 'var(--primary)',
                                background: 'white', boxShadow: '0 10px 20px rgba(0,0,0,0.05)'
                            }}>
                                <i className={getItemIcon(viewData.jenis_barang)}></i>
                            </div>
                            <h2 className="outfit" style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>{viewData.detail_barang}</h2>
                            <div className="th-badge" style={{ background: 'var(--primary)', color: 'white', padding: '6px 20px', fontSize: '0.8rem' }}>
                                Unit {viewData.jenis_barang}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: '#f8fafc', padding: '2rem', borderRadius: '24px' }}>
                            <div className="detail-item">
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Pemilik</label>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{viewData.nama_santri}</div>
                                <small style={{ color: 'var(--primary)', fontWeight: 700 }}>Kelas: {viewData.kelas || '-'}</small>
                            </div>
                            <div className="detail-item">
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Keadaan</label>
                                <div>
                                    <span className="th-badge" style={{
                                        background: viewData.keadaan === 'Baik' ? '#dcfce7' : '#fee2e2',
                                        color: viewData.keadaan === 'Baik' ? '#166534' : '#991b1b',
                                        fontSize: '0.9rem',
                                        padding: '5px 15px'
                                    }}>
                                        {viewData.keadaan}
                                    </span>
                                </div>
                            </div>
                            <div className="detail-item">
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Merk / Warna</label>
                                <div style={{ fontWeight: 700 }}>{viewData.merk || '-'} / {viewData.warna || '-'}</div>
                            </div>
                            <div className="detail-item">
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Kamar/Lokasi</label>
                                <div style={{ fontWeight: 700 }}>{viewData.kamar_penempatan || '-'}</div>
                            </div>
                            {viewData.plat_nomor && viewData.plat_nomor !== '-' && (
                                <div className="detail-item" style={{ gridColumn: '1 / -1', background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nomor Plat</label>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--danger)', fontFamily: 'monospace' }}>{viewData.plat_nomor}</div>
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '1.5rem', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '18px' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Keterangan / Catatan</label>
                            <p style={{ margin: 0, lineHeight: '1.6', fontSize: '0.95rem' }}>{viewData.keterangan || 'Tidak ada catatan tambahan.'}</p>
                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <span>Registrasi: {formatDate(viewData.tanggal_registrasi)}</span>
                            <span>Petugas: {viewData.petugas_penerima}</span>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id, null); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Data Inventaris?"
                message="Data kepemilikan barang ini akan dihapus permanen dari buku besar keamanan."
            />
        </div>
    );
}
