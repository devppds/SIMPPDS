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

export default function LayananAdminPage() {
    const { user, isAdmin } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        tanggal: new Date().toISOString().split('T')[0],
        unit: 'Sekretariat', nama_santri: '', stambuk: '', jenis_layanan: '',
        nominal: '0', jumlah: '1', keterangan: '', pj: '', pemohon_tipe: 'Santri'
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'layanan_admin' });
            setData(res?.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)) || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const myUnit = !isAdmin ? ({
        'sekretariat': 'Sekretariat',
        'bendahara': 'Bendahara',
        'keamanan': 'Keamanan',
        'pendidikan': 'Pendidikan',
        'kesehatan': 'Kesehatan',
        'jamiyyah': "Jam'iyyah",
        'madrasah_miu': 'Madrasah MIU'
    }[user?.role] || user?.role) : null;

    // Default unit for new entries based on role
    useEffect(() => {
        if (!isAdmin && myUnit) {
            setFormData(prev => ({ ...prev, unit: myUnit }));
        }
    }, [isAdmin, myUnit]);

    // Update service types when unit changes
    useEffect(() => {
        const availableServices = SERVICE_TYPES[formData.unit] || [];
        if (availableServices.length > 0 && !availableServices.includes(formData.jenis_layanan)) {
            setFormData(prev => ({ ...prev, jenis_layanan: availableServices[0] }));
        }
    }, [formData.unit]);

    const displayData = data
        .filter(d => isAdmin || d.unit === myUnit)
        .filter(d =>
            (d.nama_santri || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.jenis_layanan || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.unit || '').toLowerCase().includes(search.toLowerCase())
        );

    const openModal = (item = null) => {
        if (item) {
            setEditId(item.id);
            setFormData({ ...item });
        } else {
            setEditId(null);
            const defaultUnit = isAdmin ? 'Sekretariat' : myUnit;
            const defaultService = SERVICE_TYPES[defaultUnit]?.[0] || '';
            setFormData({
                tanggal: new Date().toISOString().split('T')[0],
                unit: defaultUnit,
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
            alert(editId ? 'Log layanan admin berhasil diperbarui!' : 'Layanan telah diregistrasikan!');
        } catch (err) { alert(err.message); }
        finally { setSubmitting(false); }
    };

    const deleteItem = async (id) => {
        if (!confirm('Hapus log layanan ini? Tindakan ini tidak dapat dibatalkan.')) return;
        try {
            await apiCall('deleteData', 'POST', { type: 'layanan_admin', id });
            loadData();
        } catch (err) { alert(err.message); }
    };

    return (
        <div className="view-container">
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '8px' }}>Layanan Administrasi</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Pencatatan legalisir, surat keterangan, dan layanan sekretariat lainnya.</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <i className="fas fa-plus"></i> Input Layanan Baru
                </button>
            </div>

            <div className="card">
                <div className="table-controls">
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
                                <th>Unit Pengelola</th>
                                <th>Identitas Pemohon</th>
                                <th>Jenis Layanan</th>
                                <th>Detail Biaya & Ket</th>
                                <th style={{ width: '120px' }}>Opsi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '4rem' }}>Sinkronisasi Data...</td></tr>
                            ) : displayData.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Belum ada riwayat layanan administrasi.</td></tr>
                            ) : displayData.map(d => (
                                <tr key={d.id}>
                                    <td style={{ fontWeight: 600 }}>{formatDate(d.tanggal)}</td>
                                    <td><span className="th-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{d.unit?.toUpperCase()}</span></td>
                                    <td>
                                        <div style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>{d.nama_santri}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stambuk: {d.stambuk || '-'}</div>
                                    </td>
                                    <td><strong>{d.jenis_layanan}</strong></td>
                                    <td>
                                        <div style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(d.nominal)}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{d.keterangan || '-'}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
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
                title={editId ? "Pembaruan Riwayat Layanan" : "Registrasi Layanan Administrasi"}
                footer={(
                    <>
                        <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Kembali</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Menyimpan...' : 'Simpan Log'}
                        </button>
                    </>
                )}
            >
                <form onSubmit={handleSubmit} className="animate-in">
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Tanggal Pengajuan</label>
                            <input type="date" className="form-control" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Unit Pengelola</label>
                            <select
                                className="form-control"
                                value={formData.unit}
                                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                disabled={!isAdmin}
                            >
                                {isAdmin ? (
                                    <>
                                        <option>Sekretariat</option>
                                        <option>Bendahara</option>
                                        <option>Pendidikan</option>
                                        <option>Keamanan</option>
                                        <option>Kesehatan</option>
                                        <option>Jam'iyyah</option>
                                    </>
                                ) : (
                                    <option>{myUnit}</option>
                                )}
                            </select>
                        </div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Nama Santri / Pemohon</label>
                            <input type="text" className="form-control" value={formData.nama_santri} onChange={e => setFormData({ ...formData, nama_santri: e.target.value })} required placeholder="Nama lengkap" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Nomor Stambuk (Opsional)</label>
                            <input type="text" className="form-control" value={formData.stambuk} onChange={e => setFormData({ ...formData, stambuk: e.target.value })} placeholder="Stambuk Pondok" />
                        </div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Jenis Layanan</label>
                            <select className="form-control" value={formData.jenis_layanan} onChange={e => setFormData({ ...formData, jenis_layanan: e.target.value })}>
                                {(SERVICE_TYPES[formData.unit] || []).map((service, idx) => (
                                    <option key={idx} value={service}>{service}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Biaya Administrasi (IDR)</label>
                            <input type="number" className="form-control" value={formData.nominal} onChange={e => setFormData({ ...formData, nominal: e.target.value })} placeholder="0" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Keterangan Tambahan / PJ</label>
                        <textarea className="form-control" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} rows="2" placeholder="Catatan khusus atau penanggung jawab layanan"></textarea>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
