'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatCurrency, formatDate, exportToCSV, exportToExcel } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';
import Autocomplete from '@/components/Autocomplete';

export default function ArusKasPage() {
    const { isAdmin } = useAuth();
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
        tipe: 'Masuk',
        nominal: '',
        kategori: 'Syahriah',
        keterangan: '',
        pj: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const [pjOptions, setPjOptions] = useState([]);

    useEffect(() => {
        loadData();
        fetchPJs();
    }, []);

    const fetchPJs = async () => {
        try {
            const [ustadz, pengurus] = await Promise.all([
                apiCall('getData', 'GET', { type: 'ustadz' }),
                apiCall('getData', 'GET', { type: 'pengurus' })
            ]);
            const combined = [
                ...(ustadz || []).map(u => ({ nama: u.nama, role: 'Ustadz' })),
                ...(pengurus || []).map(p => ({ nama: p.nama, role: 'Pengurus' }))
            ];
            setPjOptions(combined);
        } catch (e) { console.error(e); }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'arus_kas' });
            setData(res?.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)) || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleExport = () => {
        const headers = ['Tanggal', 'Tipe', 'Kategori', 'Nominal', 'Keterangan', 'PJ'];
        exportToExcel(data, 'Arus_Kas_Pondok_Full', headers);
    };

    const handleDownloadTemplate = () => {
        const headers = ['tanggal', 'tipe', 'kategori', 'nominal', 'keterangan', 'pj'];
        exportToCSV([], 'Template_Import_Kas', headers);
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const rows = text.split('\n').filter(row => row.trim() !== '');
            if (rows.length < 2) return;
            const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));

            setSubmitting(true);
            let successCount = 0;
            for (let i = 1; i < rows.length; i++) {
                if (!rows[i].trim()) continue;
                const values = rows[i].split(',').map(v => v.trim().replace(/"/g, ''));
                const obj = {};
                headers.forEach((header, index) => {
                    const key = header.toLowerCase().trim().replace(/ /g, '_');
                    obj[key] = values[index];
                });

                try {
                    await apiCall('saveData', 'POST', { type: 'arus_kas', data: obj });
                    successCount++;
                } catch (err) { console.error(err); }
            }
            setSubmitting(false);
            alert(`Impor kas selesai! ${successCount} baris berhasil.`);
            loadData();
        };
        reader.readAsText(file);
    };

    const openModal = (item = null) => {
        if (item) {
            setEditId(item.id);
            setFormData({ ...item });
        } else {
            setEditId(null);
            setFormData({
                tanggal: new Date().toISOString().split('T')[0],
                tipe: 'Masuk',
                nominal: '',
                kategori: 'Syahriah',
                keterangan: '',
                pj: ''
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
                type: 'arus_kas',
                data: editId ? { ...formData, id: editId } : formData
            });
            setIsModalOpen(false);
            loadData();
            alert(editId ? 'Transaksi berhasil diperbarui!' : 'Transaksi masuk ke pembukuan!');
        } catch (err) {
            alert('Gagal: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const deleteItem = async (id) => {
        if (!confirm('Hapus selamanya data transaksi ini?')) return;
        try {
            await apiCall('deleteData', 'POST', { type: 'arus_kas', id });
            loadData();
        } catch (err) { alert(err.message); }
    };

    const filteredData = data.filter(d =>
        (d.keterangan || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.kategori || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.pj || '').toLowerCase().includes(search.toLowerCase())
    );

    const totalMasuk = data.filter(d => d.tipe === 'Masuk').reduce((acc, d) => acc + parseInt(d.nominal || 0), 0);
    const totalKeluar = data.filter(d => d.tipe === 'Keluar').reduce((acc, d) => acc + parseInt(d.nominal || 0), 0);
    const saldo = totalMasuk - totalKeluar;

    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => <span style={{ fontWeight: 600 }}>{formatDate(row.tanggal)}</span> },
        {
            key: 'tipe',
            label: 'Jenis',
            render: (row) => (
                <span className="th-badge" style={{
                    background: row.tipe === 'Masuk' ? '#dcfce7' : '#fee2e2',
                    color: row.tipe === 'Masuk' ? '#166534' : '#991b1b',
                    fontSize: '0.65rem',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontWeight: 700
                }}>
                    {row.tipe.toUpperCase()}
                </span>
            )
        },
        { key: 'kategori', label: 'Kategori', render: (row) => <strong>{row.kategori}</strong> },
        {
            key: 'nominal',
            label: 'Nominal',
            render: (row) => (
                <span style={{ fontWeight: 800, color: row.tipe === 'Masuk' ? '#059669' : '#dc2626' }}>
                    {row.tipe === 'Masuk' ? '+' : '-'} {formatCurrency(row.nominal)}
                </span>
            )
        },
        { key: 'pj', label: 'PJ', render: (row) => row.pj || '-' },
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
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Laporan Pembukuan Arus Kas</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sinkronisasi keuangan pondok secara real-time.</p>
                    </div>
                    <div className="card-actions" style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-outline btn-sm" onClick={handleDownloadTemplate}>Template</button>
                        <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                            Import <input type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
                        </label>
                        <button className="btn btn-outline btn-sm" onClick={handleExport}>Export</button>
                        <button className="btn btn-primary btn-sm" onClick={() => openModal()}><i className="fas fa-plus"></i> Transaksi Baru</button>
                    </div>
                </div>

                <div className="stats-grid" style={{ padding: '0 1.5rem 1.5rem', marginBottom: '1rem' }}>
                    <div className="stat-card" style={{ background: '#f0fdf4', border: '1px solid #dcfce7', boxShadow: 'none' }}>
                        <div className="stat-icon" style={{ background: '#dcfce7', color: '#166534' }}><i className="fas fa-arrow-trend-up"></i></div>
                        <div className="stat-info">
                            <h3 style={{ color: '#166534', fontSize: '0.7rem' }}>Pemasukan</h3>
                            <div className="value" style={{ color: '#166534', fontSize: '1.1rem' }}>{formatCurrency(totalMasuk)}</div>
                        </div>
                    </div>
                    <div className="stat-card" style={{ background: '#fef2f2', border: '1px solid #fee2e2', boxShadow: 'none' }}>
                        <div className="stat-icon" style={{ background: '#fee2e2', color: '#991b1b' }}><i className="fas fa-arrow-trend-down"></i></div>
                        <div className="stat-info">
                            <h3 style={{ color: '#991b1b', fontSize: '0.7rem' }}>Pengeluaran</h3>
                            <div className="value" style={{ color: '#991b1b', fontSize: '1.1rem' }}>{formatCurrency(totalKeluar)}</div>
                        </div>
                    </div>
                    <div className="stat-card" style={{ background: '#eff6ff', border: '1px solid #dbeafe', boxShadow: 'none' }}>
                        <div className="stat-icon" style={{ background: '#dbeafe', color: '#1e40af' }}><i className="fas fa-vault"></i></div>
                        <div className="stat-info">
                            <h3 style={{ color: '#1e40af', fontSize: '0.7rem' }}>Saldo Kas</h3>
                            <div className="value" style={{ color: '#1e40af', fontSize: '1.1rem' }}>{formatCurrency(saldo)}</div>
                        </div>
                    </div>
                </div>

                <div className="table-controls">
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Cari keterangan, kategori, atau PJ..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-outline" onClick={loadData} title="Refresh Data"><i className="fas fa-sync-alt"></i></button>
                </div>

                <SortableTable
                    columns={columns}
                    data={filteredData}
                    loading={loading}
                    emptyMessage="Belum ada catatan transaksi."
                />
            </div>

            {/* Modal Input/Edit */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? "Pembaruan Catatan Transaksi" : "Pencatatan Transaksi Baru"}
                footer={(
                    <>
                        <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Batalkan</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
                        </button>
                    </>
                )}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Tanggal Transaksi</label>
                        <input type="date" className="form-control" value={formData.tanggal} onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })} />
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Jenis Arus Kas</label>
                            <select className="form-control" value={formData.tipe} onChange={(e) => setFormData({ ...formData, tipe: e.target.value })} style={{ fontWeight: 800, color: formData.tipe === 'Masuk' ? '#059669' : '#dc2626' }}>
                                <option value="Masuk">MASUK (DEBET)</option>
                                <option value="Keluar">KELUAR (KREDIT)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Kategori Anggaran</label>
                            <select className="form-control" value={formData.kategori} onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}>
                                <option>Syahriah</option><option>Dana Bantuan</option><option>Pembangunan</option><option>Kesehatan</option><option>Administrasi</option><option>Sarana Prasarana</option><option>Lain-lain</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Nominal Transaksi (Rupiah)</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#94a3b8' }}>Rp</span>
                            <input type="number" className="form-control" style={{ paddingLeft: '45px', fontWeight: 800, color: '#2563eb' }} placeholder="0" value={formData.nominal} onChange={(e) => setFormData({ ...formData, nominal: e.target.value })} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Keterangan Transaksi</label>
                        <input type="text" className="form-control" placeholder="Contoh: Iuran syahriah bulan juli" value={formData.keterangan} onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Penanggung Jawab (PJ)</label>
                        <Autocomplete
                            options={pjOptions}
                            value={formData.pj}
                            onChange={(val) => setFormData({ ...formData, pj: val })}
                            onSelect={(s) => setFormData({ ...formData, pj: s.nama })}
                            placeholder="Nama pelaksana transaksi"
                            labelKey="nama"
                            subLabelKey="role"
                        />
                    </div>
                </form>
            </Modal>

            {/* Modal Detail View */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Detail Transaksi Keuangan"
                footer={<button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Selesai</button>}
            >
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Nominal Transaksi</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: viewData.tipe === 'Masuk' ? '#059669' : '#dc2626' }}>
                                {viewData.tipe === 'Masuk' ? '+' : '-'} {formatCurrency(viewData.nominal)}
                            </div>
                            <span className="th-badge" style={{
                                background: viewData.tipe === 'Masuk' ? '#dcfce7' : '#fee2e2',
                                color: viewData.tipe === 'Masuk' ? '#166534' : '#991b1b',
                                padding: '6px 15px',
                                marginTop: '10px'
                            }}>
                                {viewData.tipe === 'Masuk' ? 'PEMASUKAN' : 'PENGELUARAN'}
                            </span>
                        </div>

                        <div className="form-grid" style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '15px' }}>
                            <div>
                                <small style={{ color: 'var(--text-muted)' }}>Kategori</small>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{viewData.kategori}</div>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)' }}>Tanggal</small>
                                <div style={{ fontWeight: 600 }}>{formatDate(viewData.tanggal)}</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <small style={{ color: 'var(--text-muted)' }}>Keterangan / Alasan Transaksi</small>
                            <div style={{ fontSize: '1.1rem', fontWeight: 500, lineHeight: '1.6', marginTop: '5px' }}>
                                {viewData.keterangan || 'Tidak ada keterangan tambahan.'}
                            </div>
                        </div>

                        <div style={{ padding: '1rem', background: 'var(--primary-light)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Penanggung Jawab:</span>
                            <span style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>{viewData.pj || '-'}</span>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}