'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';

export default function ArusKasKeuanganPage() {
    const { user } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ masuk: 0, keluar: 0, saldo: 0 });

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        tanggal: new Date().toISOString().split('T')[0],
        tipe: 'Keluar',
        kategori: 'Setor Bendahara Pondok',
        nominal: '',
        keterangan: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'keuangan_kas' });
            const list = res || [];

            // Calculate Stats
            let mas = 0, kel = 0;
            list.forEach(item => {
                if (item.tipe === 'Masuk') mas += parseInt(item.nominal);
                else kel += parseInt(item.nominal);
            });
            setStats({ masuk: mas, keluar: kel, saldo: mas - kel });

            // Sort Descending
            setData(list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openModal = (kategoriPreset = null) => {
        setFormData({
            tanggal: new Date().toISOString().split('T')[0],
            tipe: 'Keluar',
            kategori: kategoriPreset || 'Belanja Operasional',
            nominal: '',
            keterangan: ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await apiCall('saveData', 'POST', {
                type: 'keuangan_kas',
                data: {
                    ...formData,
                    nominal: parseInt(formData.nominal),
                    petugas: user?.fullname || 'Admin'
                }
            });
            setIsModalOpen(false);
            loadData();
            alert('Transaksi berhasil dicatat!');
        } catch (err) { alert(err.message); }
        finally { setSubmitting(false); }
    };

    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => formatDate(row.tanggal) },
        {
            key: 'kategori',
            label: 'Kategori',
            render: (row) => (
                <div>
                    <div style={{ fontWeight: 700 }}>{row.kategori}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.keterangan}</div>
                </div>
            )
        },
        {
            key: 'masuk',
            label: 'Masuk',
            render: (row) => row.tipe === 'Masuk' ? <span style={{ color: 'var(--success)', fontWeight: 700 }}>{formatCurrency(row.nominal)}</span> : '-'
        },
        {
            key: 'keluar',
            label: 'Keluar',
            render: (row) => row.tipe === 'Keluar' ? <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{formatCurrency(row.nominal)}</span> : '-'
        },
        { key: 'petugas', label: 'Petugas' }
    ];

    return (
        <div className="view-container animate-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Arus Kas Pelayanan Keuangan</h1>
                <p style={{ color: 'var(--text-muted)' }}>Pencatatan perputaran uang masuk dari santri dan pengeluaran/setoran.</p>
            </div>

            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#dcfce7', color: '#166534' }}><i className="fas fa-arrow-down"></i></div>
                    <div className="stat-info">
                        <div className="stat-label">Total Pemasukan</div>
                        <div className="stat-value">{formatCurrency(stats.masuk)}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#fee2e2', color: '#991b1b' }}><i className="fas fa-arrow-up"></i></div>
                    <div className="stat-info">
                        <div className="stat-label">Total Pengeluaran</div>
                        <div className="stat-value">{formatCurrency(stats.keluar)}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}><i className="fas fa-wallet"></i></div>
                    <div className="stat-info">
                        <div className="stat-label">Saldo Saat Ini</div>
                        <div className="stat-value" style={{ color: stats.saldo < 0 ? 'var(--danger)' : 'var(--primary)' }}>{formatCurrency(stats.saldo)}</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Buku Transaksi</h3>
                    <div className="card-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => openModal('Setor Bendahara Pondok')}>
                            <i className="fas fa-university"></i> Setor Pondok
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openModal('Setor Madrasah')}>
                            <i className="fas fa-school"></i> Setor Madrasah
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => openModal('Belanja Operasional')}>
                            <i className="fas fa-shopping-cart"></i> Belanja
                        </button>
                    </div>
                </div>

                <SortableTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    emptyMessage="Belum ada data arus kas."
                />
            </div>

            {/* Modal Input Pengeluaran */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Input Pengeluaran / Setoran"
                footer={(
                    <>
                        <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Batal</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
                        </button>
                    </>
                )}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Tanggal</label>
                        <input
                            type="date"
                            className="form-control"
                            value={formData.tanggal}
                            onChange={e => setFormData({ ...formData, tanggal: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Kategori Transaksi</label>
                        <select
                            className="form-control"
                            value={formData.kategori}
                            onChange={e => setFormData({ ...formData, kategori: e.target.value })}
                        >
                            <option value="Setor Bendahara Pondok">Setor Ke Bendahara Pondok</option>
                            <option value="Setor Madrasah">Setor Ke Madrasah (MHM/MIU)</option>
                            <option value="Belanja Operasional">Belanja Kebutuhan Keuangan</option>
                            <option value="Lainnya">Lainnya</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Nominal (Rp)</label>
                        <input
                            type="number"
                            className="form-control"
                            value={formData.nominal}
                            onChange={e => setFormData({ ...formData, nominal: e.target.value })}
                            required
                            placeholder="0"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Keterangan</label>
                        <textarea
                            className="form-control"
                            value={formData.keterangan}
                            onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                            rows="2"
                        ></textarea>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
