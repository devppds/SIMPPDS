'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';

export default function KeamananRegPage() {
    const { user, isAdmin } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState(null);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        nama_santri: '', jenis_barang: 'Kendaraan', detail_barang: '',
        jenis_kendaraan: '-', jenis_elektronik: '-', plat_nomor: '-',
        warna: '', merk: '', aksesoris_1: '-', aksesoris_2: '-', aksesoris_3: '-',
        keadaan: 'Baik', kamar_penempatan: '', tanggal_registrasi: new Date().toISOString().split('T')[0],
        petugas_penerima: '', keterangan: '', status_barang_reg: 'Aktif'
    });
    const [submitting, setSubmitting] = useState(false);

    const [santriOptions, setSantriOptions] = useState([]);

    useEffect(() => {
        loadData();
        fetchSantri();
    }, []);

    const fetchSantri = async () => {
        try {
            const res = await apiCall('getData', 'GET', { type: 'santri' });
            setSantriOptions(res || []);
        } catch (e) { console.error(e); }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'keamanan_reg' });
            setData(res || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openModal = (item = null) => {
        if (item) {
            setEditId(item.id);
            setFormData({ ...item });
        } else {
            setEditId(null);
            setFormData({
                nama_santri: '', jenis_barang: 'Kendaraan', detail_barang: '',
                jenis_kendaraan: '-', jenis_elektronik: '-', plat_nomor: '-',
                warna: '', merk: '', aksesoris_1: '-', aksesoris_2: '-', aksesoris_3: '-',
                keadaan: 'Baik', kamar_penempatan: '', tanggal_registrasi: new Date().toISOString().split('T')[0],
                petugas_penerima: user?.nama || user?.username || '', keterangan: '', status_barang_reg: 'Aktif'
            });
        }
        setIsModalOpen(true);
    };

    // Auto-fill kamar when santri is selected
    const handleSantriChange = (nama) => {
        const found = santriOptions.find(s => s.nama_siswa === nama);
        setFormData(prev => ({
            ...prev,
            nama_santri: nama,
            kamar_penempatan: found ? found.kamar : prev.kamar_penempatan
        }));
    };

    const isMotor = formData.jenis_barang === 'Kendaraan' && (formData.detail_barang || '').toLowerCase().includes('motor');

    const openViewModal = (item) => {
        setViewData(item);
        setIsViewModalOpen(true);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        try {
            await apiCall('saveData', 'POST', {
                type: 'keamanan_reg',
                data: editId ? { ...formData, id: editId } : formData
            });
            setIsModalOpen(false);
            loadData();
            alert('Data berhasil disimpan!');
        } catch (err) { alert(err.message); }
        finally { setSubmitting(false); }
    };

    const deleteItem = async (id) => {
        if (!confirm('Hapus registrasi ini?')) return;
        try {
            await apiCall('deleteData', 'POST', { type: 'keamanan_reg', id });
            loadData();
        } catch (err) { alert(err.message); }
    };

    const displayData = data.filter(d =>
        (d.nama_santri || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.detail_barang || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { key: 'tanggal_registrasi', label: 'Tanggal', render: (row) => formatDate(row.tanggal_registrasi) },
        { key: 'nama_santri', label: 'Pemilik', render: (row) => <div style={{ fontWeight: 800 }}>{row.nama_santri}</div> },
        { key: 'jenis_barang', label: 'Jenis' },
        { key: 'detail_barang', label: 'Detail Barang', render: (row) => `${row.detail_barang} ${row.merk ? `(${row.merk})` : ''}` },
        {
            key: 'status_barang_reg',
            label: 'Status',
            render: (row) => (
                <span className="th-badge" style={{
                    background: row.status_barang_reg === 'Aktif' ? '#dcfce7' : '#f1f5f9',
                    color: row.status_barang_reg === 'Aktif' ? '#166534' : '#475569'
                }}>
                    {row.status_barang_reg?.toUpperCase() || 'AKTIF'}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Aksi',
            sortable: false,
            width: '150px',
            render: (row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openViewModal(row)} title="Lihat Detail"><i className="fas fa-eye"></i></button>
                    <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)} title="Edit"><i className="fas fa-edit"></i></button>
                    {isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => deleteItem(row.id)} title="Hapus"><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Registrasi Barang Santri</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mencatat {displayData.length} barang milik santri.</p>
                    </div>
                    <div className="card-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                            <i className="fas fa-plus"></i> Registrasi Baru
                        </button>
                    </div>
                </div>

                <div className="table-controls">
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Cari nama santri atau barang..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <SortableTable
                    columns={columns}
                    data={displayData}
                    loading={loading}
                    emptyMessage="Belum ada data registrasi."
                />
            </div>

            {/* Modal Input/Edit */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? "Pembaruan Registrasi Barang" : "Registrasi Barang Baru"}
                footer={(
                    <>
                        <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Batalkan</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Memproses...' : 'Simpan Data'}
                        </button>
                    </>
                )}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Nama Santri (Pemilik)</label>
                        <input
                            type="text"
                            className="form-control"
                            list="santri-list"
                            value={formData.nama_santri}
                            onChange={e => handleSantriChange(e.target.value)}
                            required
                            placeholder="Ketik nama untuk mencari..."
                        />
                        <datalist id="santri-list">
                            {santriOptions.map((s, idx) => (
                                <option key={idx} value={s.nama_siswa}>{s.stambuk_pondok ? `[${s.stambuk_pondok}] ` : ''}{s.kamar || ''}</option>
                            ))}
                        </datalist>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Jenis Barang</label>
                            <select className="form-control" value={formData.jenis_barang} onChange={e => setFormData({ ...formData, jenis_barang: e.target.value, detail_barang: '' })}>
                                <option value="Kendaraan">Kendaraan</option>
                                <option value="Elektronik">Elektronik</option>
                                <option value="Kompor">Kompor</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Detail Nama Barang</label>
                            <input
                                type="text"
                                className="form-control"
                                list="dynamic-detail-list"
                                value={formData.detail_barang}
                                onChange={e => setFormData({ ...formData, detail_barang: e.target.value })}
                                required
                                placeholder="Ketik atau pilih dari saran..."
                            />
                            <datalist id="dynamic-detail-list">
                                {formData.jenis_barang === 'Kendaraan' && (
                                    <>
                                        <option value="Motor Baru">Motor Baru</option>
                                        <option value="Motor Lama">Motor Lama</option>
                                        <option value="Ontel Baru">Ontel Baru</option>
                                        <option value="Ontel Lama">Ontel Lama</option>
                                    </>
                                )}
                                {formData.jenis_barang === 'Elektronik' && (
                                    <>
                                        <option value="Handphone">Handphone</option>
                                        <option value="Laptop">Laptop</option>
                                        <option value="Flashdisk">Flashdisk</option>
                                    </>
                                )}
                                {formData.jenis_barang === 'Kompor' && (
                                    <>
                                        <option value="Kompor Baru">Kompor Baru</option>
                                        <option value="Kompor Lama">Kompor Lama</option>
                                    </>
                                )}
                            </datalist>
                        </div>
                    </div>

                    {isMotor && (
                        <div className="form-group animate-in">
                            <label className="form-label">Nomor Plat</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.plat_nomor}
                                onChange={e => setFormData({ ...formData, plat_nomor: e.target.value })}
                                placeholder="Contoh: DD 1234 AB"
                                required
                            />
                        </div>
                    )}

                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Merk</label>
                            <input type="text" className="form-control" value={formData.merk} onChange={e => setFormData({ ...formData, merk: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Warna</label>
                            <input type="text" className="form-control" value={formData.warna} onChange={e => setFormData({ ...formData, warna: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Kondisi Barang</label>
                            <select className="form-control" value={formData.keadaan} onChange={e => setFormData({ ...formData, keadaan: e.target.value })}>
                                <option value="Baik">Baik</option>
                                <option value="Rusak Ringan">Rusak Ringan</option>
                                <option value="Rusak Berat">Rusak Berat</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Kamar Penempatan</label>
                            <input type="text" className="form-control" value={formData.kamar_penempatan} onChange={e => setFormData({ ...formData, kamar_penempatan: e.target.value })} placeholder="Terisi otomatis jika santri dipilih" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Petugas Penerima</label>
                        <input type="text" className="form-control" value={formData.petugas_penerima} onChange={e => setFormData({ ...formData, petugas_penerima: e.target.value })} readOnly={!isAdmin} />
                    </div>
                </form>
            </Modal>

            {/* Modal Detail View */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Detail Registrasi Keamanan"
                footer={<button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Selesai</button>}
            >
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Pemilik Barang</div>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-dark)', margin: '5px 0' }}>{viewData.nama_santri}</h2>
                            <div className="th-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '5px 20px' }}>{viewData.kamar_penempatan || 'Kamar Belum Dicatat'}</div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '15px', marginBottom: '1.5rem' }}>
                            <div>
                                <small style={{ color: 'var(--text-muted)' }}>Jenis Barang</small>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{viewData.jenis_barang}</div>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)' }}>Nama & Merk</small>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{viewData.detail_barang} {viewData.merk && `(${viewData.merk})`}</div>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)' }}>Kondisi Fisik</small>
                                <div style={{ fontWeight: 700 }}>{viewData.keadaan}</div>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)' }}>Warna</small>
                                <div style={{ fontWeight: 600 }}>{viewData.warna || '-'}</div>
                            </div>
                        </div>

                        <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
                            <div style={{ padding: '1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                <small style={{ color: 'var(--text-muted)', display: 'block' }}>Petugas Registrasi</small>
                                <span style={{ fontWeight: 700 }}>{viewData.petugas_penerima || '-'}</span>
                            </div>
                            <div style={{ padding: '1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                <small style={{ color: 'var(--text-muted)', display: 'block' }}>Tanggal Input</small>
                                <span style={{ fontWeight: 700 }}>{formatDate(viewData.tanggal_registrasi)}</span>
                            </div>
                        </div>

                        {viewData.keterangan && (
                            <div style={{ marginTop: '1rem' }}>
                                <small style={{ color: 'var(--text-muted)' }}>Catatan Tambahan</small>
                                <p style={{ marginTop: '5px', lineHeight: '1.6' }}>{viewData.keterangan}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
