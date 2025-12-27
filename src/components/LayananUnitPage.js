'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatDate, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';

// Service types by unit
const SERVICE_TYPES = {
    'Sekretariat': [
        'Legalisir Ijazah/Syahadah',
        'Surat Keterangan Santri',
        'Kartu Tanda Santri (KTS)',
        'Cetak Sertifikat/Piagam',
        'Mutasi Keluar/Pindah',
        'Surat Rekomendasi',
        'Lainnya'
    ],
    'Bendahara': [
        'Pembayaran SPP',
        'Pembayaran Syahriah',
        'Biaya Pendaftaran',
        'Biaya Ujian',
        'Lainnya'
    ],
    'Pendidikan': [
        'Pendaftaran Kelas',
        'Ujian/Imtihan',
        'Sertifikat Kelulusan',
        'Lainnya'
    ],
    'Keamanan': [
        'Izin Keluar/Pulang',
        'Perizinan Khusus',
        'Registrasi Barang',
        'Lainnya'
    ],
    'Kesehatan': [
        'Konsultasi Kesehatan',
        'Pemeriksaan Umum',
        'Rujukan Medis',
        'Obat & Alat Kesehatan',
        'Lainnya'
    ],
    "Jam'iyyah": [
        'Kegiatan Jam\'iyyah',
        'Perlengkapan Rebana',
        'Kostum & Atribut',
        'Lainnya'
    ]
};

export default function LayananUnitPage({ unit: forceUnit }) {
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
        tanggal: new Date().toISOString().split('T')[0],
        unit: forceUnit, nama_santri: '', stambuk: '', jenis_layanan: '',
        nominal: '0', jumlah: '1', keterangan: '', pj: '', pemohon_tipe: 'Santri'
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
            const res = await apiCall('getData', 'GET', { type: 'layanan_admin' });
            // Filter by unit if it's forced
            const filtered = res?.filter(d => d.unit === forceUnit) || [];
            setData(filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        const availableServices = SERVICE_TYPES[forceUnit] || [];
        if (availableServices.length > 0 && !availableServices.includes(formData.jenis_layanan)) {
            setFormData(prev => ({ ...prev, jenis_layanan: availableServices[0] }));
        }
    }, [forceUnit]);

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
            const defaultService = SERVICE_TYPES[forceUnit]?.[0] || '';
            setFormData({
                tanggal: new Date().toISOString().split('T')[0],
                unit: forceUnit,
                nama_santri: '',
                stambuk: '',
                jenis_layanan: defaultService,
                nominal: '0',
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

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Nama Pemohon</th>
                                <th>Layanan</th>
                                <th>Biaya</th>
                                <th style={{ width: '150px' }}>Opsi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '4rem' }}>Sinkronisasi Data...</td></tr>
                            ) : displayData.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Belum ada riwayat layanan {forceUnit}.</td></tr>
                            ) : displayData.map(d => (
                                <tr key={d.id}>
                                    <td style={{ fontWeight: 600 }}>{formatDate(d.tanggal)}</td>
                                    <td>
                                        <div style={{ fontWeight: 800 }}>{d.nama_santri}</div>
                                        <div style={{ fontSize: '0.7rem' }}>Stambuk: {d.stambuk || '-'}</div>
                                    </td>
                                    <td><span className="th-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{d.jenis_layanan}</span></td>
                                    <td><div style={{ fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(d.nominal)}</div></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn-vibrant btn-vibrant-purple" onClick={() => openViewModal(d)} title="Lihat Detail"><i className="fas fa-eye"></i></button>
                                            <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(d)} title="Edit"><i className="fas fa-edit"></i></button>
                                            {isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => deleteItem(d.id)} title="Hapus"><i className="fas fa-trash"></i></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
                                onChange={e => setFormData({ ...formData, nama_santri: e.target.value })}
                                required
                                placeholder="Ketik nama untuk mencari..."
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
                            <select className="form-control" value={formData.jenis_layanan} onChange={e => setFormData({ ...formData, jenis_layanan: e.target.value })}>
                                {(SERVICE_TYPES[forceUnit] || []).map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Biaya (IDR)</label>
                            <input type="number" className="form-control" value={formData.nominal} onChange={e => setFormData({ ...formData, nominal: e.target.value })} />
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
