'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatDate, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';

// Service types by unit
const SERVICE_TYPES = {
    'Sekretariat': ['KTK', 'SIM', 'KTS', 'Surat Domisili', 'Surat Pindah', 'Surat Boyong'],
    'Keamanan': ['Izin KELUAR/PULANG', 'Motor Baru', 'Motor Lama', 'Ontel Baru', 'Ontel Lama', 'Hp', 'Laptop', 'Flashdisk', 'Kompor', 'Video Call', 'Telfon biasa', 'Surat kehilangan', 'Paket Wesel'],
    'Pendidikan': ['Izin SEKOLAH'],
    'Kesehatan': ['OBAT', 'IZIN SAKIT'],
    "Jam'iyyah": ['Alat Rebana 1 Set', 'Alat Rebana Perbaikan']
};

const SERVICE_PRICES = {
    // Sekretariat
    'KTK': 5000,
    'SIM': 5000,
    'KTS': 15000,
    'Surat Domisili': 2000,
    'Surat Pindah': 5000,
    'Surat Boyong': 5000,
    // Keamanan
    'Izin KELUAR/PULANG': 2000,
    'Motor Baru': 100000,
    'Motor Lama': 50000,
    'Ontel Baru': 15000,
    'Ontel Lama': 10000,
    'Hp': 20000,
    'Laptop': 25000,
    'Flashdisk': 5000,
    'Kompor': 10000,
    'Video Call': 2000,
    'Telfon biasa': 1000,
    'Surat kehilangan': 2000,
    'Paket Wesel': 2000,
    // Pendidikan
    'Izin SEKOLAH': 2000,
    // Kesehatan
    'OBAT': 5000,
    'IZIN SAKIT': 2000
};

export default function LayananUnitPage({ unit: forceUnit }) {
    const { user, isAdmin } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Dynamic Master Data State
    const [dynamicServices, setDynamicServices] = useState([]);
    const [dynamicPrices, setDynamicPrices] = useState({});

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState(null);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        tanggal: new Date().toISOString().split('T')[0],
        unit: forceUnit, nama_santri: '', stambuk: '', jenis_layanan: '',
        nominal: '0', jumlah: '1', keterangan: '', pj: '', pemohon_tipe: 'Santri'
    });
    const [submitting, setSubmitting] = useState(false);
    const [santriOptions, setSantriOptions] = useState([]);

    useEffect(() => {
        loadData();
        fetchSantri();
        fetchMasterLayanan();
    }, [forceUnit]);

    const fetchMasterLayanan = async () => {
        try {
            const res = await apiCall('getData', 'GET', { type: 'layanan_master' });
            // Filter services for current unit and status 'Aktif'
            const unitServices = (res || [])
                .filter(s => s.unit === forceUnit && s.status === 'Aktif')
                .map(s => s.nama_layanan);

            // Build price mapping
            const prices = {};
            (res || []).forEach(s => {
                prices[s.nama_layanan] = s.harga;
            });

            setDynamicServices(unitServices);
            setDynamicPrices(prices);

            // Set default service if none selected
            if (unitServices.length > 0 && !formData.jenis_layanan) {
                setFormData(prev => ({
                    ...prev,
                    jenis_layanan: unitServices[0],
                    nominal: prices[unitServices[0]] || '0'
                }));
            }
        } catch (e) {
            console.error('Error fetching master layanan:', e);
            // Fallback to static if needed (optional)
        }
    };

    const fetchSantri = async () => {
        try {
            const res = await apiCall('getData', 'GET', { type: 'santri' });
            setSantriOptions(res || []);
        } catch (e) { console.error(e); }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'layanan_admin' });
            // Filter by unit if it's forced
            const filtered = res?.filter(d => d.unit === forceUnit) || [];
            setData(filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (dynamicServices.length > 0 && !dynamicServices.includes(formData.jenis_layanan)) {
            setFormData(prev => ({
                ...prev,
                jenis_layanan: dynamicServices[0],
                nominal: dynamicPrices[dynamicServices[0]] || '0'
            }));
        }
    }, [dynamicServices]);

    const displayData = data.filter(d =>
        (d.nama_santri || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.jenis_layanan || '').toLowerCase().includes(search.toLowerCase())
    );

    const openModal = (item = null) => {
        if (item) {
            setEditId(item.id);
            setFormData({ ...item });
        } else {
            setEditId(null);
            const defaultService = dynamicServices?.[0] || '';
            setFormData({
                tanggal: new Date().toISOString().split('T')[0],
                unit: forceUnit,
                nama_santri: '',
                stambuk: '',
                jenis_layanan: defaultService,
                nominal: dynamicPrices[defaultService] || '0',
                jumlah: '1',
                keterangan: '',
                pj: '',
                pemohon_tipe: 'Santri'
            });
        }
        setIsModalOpen(true);
    };

    const openViewModal = (item) => {
        setViewData(item);
        setIsViewModalOpen(true);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        try {
            await apiCall('saveData', 'POST', {
                type: 'layanan_admin',
                data: editId ? { ...formData, id: editId } : formData
            });
            setIsModalOpen(false);
            loadData();
            alert(`Log layanan ${forceUnit} tersimpan!`);
        } catch (err) { alert(err.message); }
        finally { setSubmitting(false); }
    };

    const deleteItem = async (id) => {
        if (!confirm('Hapus log layanan ini?')) return;
        try {
            await apiCall('deleteData', 'POST', { type: 'layanan_admin', id });
            loadData();
        } catch (err) { alert(err.message); }
    };

    const columns = [
        {
            key: 'tanggal',
            label: 'Tanggal',
            render: (row) => <span style={{ fontWeight: 600 }}>{formatDate(row.tanggal)}</span>
        },
        {
            key: 'nama_santri',
            label: 'Nama Pemohon',
            render: (row) => (
                <div>
                    <div style={{ fontWeight: 800 }}>{row.nama_santri}</div>
                    <div style={{ fontSize: '0.7rem' }}>Stambuk: {row.stambuk || '-'}</div>
                </div>
            )
        },
        {
            key: 'jenis_layanan',
            label: 'Layanan',
            render: (row) => (
                <span className="th-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                    {row.jenis_layanan}
                </span>
            )
        },
        {
            key: 'nominal',
            label: 'Biaya',
            render: (row) => (
                <div style={{ fontWeight: 800, color: 'var(--success)' }}>
                    {formatCurrency(row.nominal)}
                </div>
            )
        },
        {
            key: 'actions',
            label: 'Opsi',
            sortable: false,
            width: '150px',
            render: (row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openViewModal(row)} title="Lihat Detail">
                        <i className="fas fa-eye"></i>
                    </button>
                    <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)} title="Edit">
                        <i className="fas fa-edit"></i>
                    </button>
                    {isAdmin && (
                        <button className="btn-vibrant btn-vibrant-red" onClick={() => deleteItem(row.id)} title="Hapus">
                            <i className="fas fa-trash"></i>
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Layanan {forceUnit}</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mencatat {displayData.length} aktivitas pelayanan unit {forceUnit.toLowerCase()}.</p>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                        <i className="fas fa-plus"></i> Input Layanan Baru
                    </button>
                </div>

                <div className="table-controls" style={{ padding: '1rem 1.5rem' }}>
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Cari nama pemohon atau jenis layanan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <SortableTable
                    columns={columns}
                    data={displayData}
                    loading={loading}
                    emptyMessage={`Belum ada riwayat layanan ${forceUnit}.`}
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? `Update Layanan ${forceUnit}` : `Registrasi Layanan ${forceUnit}`}
                footer={(
                    <>
                        <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Kembali</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Menyimpan...' : 'Simpan Log'}
                        </button>
                    </>
                )}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Tanggal Pengajuan</label>
                        <input type="date" className="form-control" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Nama Pemohon</label>
                            <input
                                type="text"
                                className="form-control"
                                list="santri-list"
                                value={formData.nama_santri}
                                required
                                placeholder="Ketik nama untuk mencari..."
                                onChange={e => {
                                    const val = e.target.value;
                                    const found = santriOptions.find(s => s.nama_siswa.toLowerCase() === val.toLowerCase());
                                    setFormData({
                                        ...formData,
                                        nama_santri: val,
                                        stambuk: found?.stambuk_pondok || formData.stambuk
                                    });
                                }}
                            />
                            <datalist id="santri-list">
                                {santriOptions.map((s, idx) => (
                                    <option key={idx} value={s.nama_siswa}>{s.stambuk_pondok ? `[${s.stambuk_pondok}] ` : ''}{s.kamar || ''}</option>
                                ))}
                            </datalist>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Stambuk (Jika Ada)</label>
                            <input type="text" className="form-control" value={formData.stambuk} onChange={e => setFormData({ ...formData, stambuk: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Jenis Layanan</label>
                            <select
                                className="form-control"
                                value={formData.jenis_layanan}
                                onChange={e => {
                                    const val = e.target.value;
                                    setFormData({
                                        ...formData,
                                        jenis_layanan: val,
                                        nominal: dynamicPrices[val] || '0'
                                    });
                                }}
                            >
                                {(dynamicServices || []).map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Biaya (IDR)</label>
                            <input type="number" className="form-control" value={formData.nominal} onChange={e => setFormData({ ...formData, nominal: e.target.value })} style={{ fontWeight: 800, color: 'var(--success)' }} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Keterangan / PJ Layanan</label>
                        <textarea className="form-control" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} rows="2"></textarea>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={`Rincian Layanan ${forceUnit}`}
                footer={<button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Selesai</button>}
            >
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Jenis Pelayanan</div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary-dark)', margin: '5px 0' }}>{viewData.jenis_layanan}</h2>
                            <div style={{ fontWeight: 700, color: 'var(--primary)' }}>Unit {viewData.unit}</div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '15px', marginBottom: '1.5rem' }}>
                            <div>
                                <small style={{ color: 'var(--text-muted)' }}>Nama Pemohon</small>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{viewData.nama_santri}</div>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)' }}>No. Stambuk</small>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{viewData.stambuk || '-'}</div>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)' }}>Tanggal</small>
                                <div style={{ fontWeight: 700 }}>{formatDate(viewData.tanggal)}</div>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)' }}>Biaya Adm</small>
                                <div style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--success)' }}>{formatCurrency(viewData.nominal)}</div>
                            </div>
                        </div>

                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '1.5rem', borderRadius: '15px' }}>
                            <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Catatan Layanan</small>
                            <p style={{ lineHeight: '1.6', fontSize: '1rem', whiteSpace: 'pre-wrap' }}>{viewData.keterangan || 'Tidak ada catatan tambahan.'}</p>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
