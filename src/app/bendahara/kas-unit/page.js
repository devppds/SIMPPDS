'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';

export default function SetoranUnitPage() {
    const { isAdmin, user } = useAuth();
    const { showToast } = useToast();
    const [data, setData] = useState([]);
    const [layananLogs, setLayananLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedUnitDetails, setSelectedUnitDetails] = useState(null);
    const [formData, setFormData] = useState({
        tanggal: new Date().toISOString().split('T')[0],
        unit: 'Sekretariat',
        nominal: '',
        keterangan: '',
        petugas: user?.fullname || '',
        status_setor: 'Selesai'
    });
    const [submitting, setSubmitting] = useState(false);

    const UNITS = ['Sekretariat', 'Keamanan', 'Pendidikan', 'Kesehatan', "Jam'iyyah"];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [kasRes, layananRes] = await Promise.all([
                apiCall('getData', 'GET', { type: 'kas_unit' }),
                apiCall('getData', 'GET', { type: 'layanan_admin' })
            ]);
            setData(kasRes || []);
            setLayananLogs(layananRes || []);
        } catch (e) {
            console.error(e);
            showToast("Gagal memuat data setoran", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        try {
            await apiCall('saveData', 'POST', {
                type: 'kas_unit',
                data: {
                    ...formData,
                    tipe: 'Masuk',
                    kategori: 'Setoran Unit'
                }
            });

            // Also automatically add to Arus Kas Pondok for central tracking
            await apiCall('saveData', 'POST', {
                type: 'arus_kas',
                data: {
                    tanggal: formData.tanggal,
                    tipe: 'Masuk',
                    kategori: 'Setoran Unit',
                    nominal: formData.nominal,
                    keterangan: `Setoran dari Unit ${formData.unit}: ${formData.keterangan}`,
                    pj: formData.unit
                }
            });

            setIsModalOpen(false);
            showToast(`Setoran ${formData.unit} berhasil dicatat dan masuk ke Arus Kas!`, "success");
            loadData();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setSubmitting(false);
        }
    };

    const deleteItem = async (id) => {
        if (!confirm('Hapus catatan setoran ini? (Ini tidak akan menghapus data di Arus Kas secara otomatis)')) return;
        try {
            await apiCall('deleteData', 'POST', { type: 'kas_unit', id });
            showToast("Catatan dihapus.", "info");
            loadData();
        } catch (err) { showToast(err.message, "error"); }
    };

    // Calculate Summary per Unit
    const unitSummary = UNITS.map(unit => {
        const totalLayanan = layananLogs
            .filter(l => l.unit === unit)
            .reduce((sum, l) => sum + parseInt(l.nominal || 0), 0);

        const totalSetor = data
            .filter(d => d.unit === unit)
            .reduce((sum, d) => sum + parseInt(d.nominal || 0), 0);

        return {
            unit,
            totalLayanan,
            totalSetor,
            pending: totalLayanan - totalSetor
        };
    });

    const totalTerima = data.reduce((sum, d) => sum + parseInt(d.nominal || 0), 0);
    const totalPotential = layananLogs.reduce((sum, l) => sum + parseInt(l.nominal || 0), 0);

    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => <strong>{formatDate(row.tanggal)}</strong> },
        { key: 'unit', label: 'Unit', render: (row) => <span className="th-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{row.unit}</span> },
        { key: 'nominal', label: 'Nominal', render: (row) => <span style={{ fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(row.nominal)}</span> },
        { key: 'petugas', label: 'Penerima' },
        { key: 'keterangan', label: 'Keterangan' },
        {
            key: 'actions',
            label: 'Aksi',
            width: '100px',
            sortable: false,
            render: (row) => (
                isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => deleteItem(row.id)} title="Hapus"><i className="fas fa-trash"></i></button>
            )
        }
    ];

    const openDetails = (summary) => {
        setSelectedUnitDetails(summary);
        setIsDetailsOpen(true);
    };

    return (
        <div className="view-container animate-in">
            {/* Header Stats */}
            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: 'white' }}>
                    <div className="stat-icon" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}><i className="fas fa-hand-holding-dollar"></i></div>
                    <div className="stat-info">
                        <h3 style={{ color: 'rgba(255,255,255,0.8)' }}>Total Setoran Diterima</h3>
                        <div className="value" style={{ color: 'white' }}>{formatCurrency(totalTerima)}</div>
                        <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Sudah masuk ke Arus Kas Pondok</p>
                    </div>
                </div>
                <div className="stat-card" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
                    <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}><i className="fas fa-clock-rotate-left"></i></div>
                    <div className="stat-info">
                        <h3 style={{ color: 'var(--text-muted)' }}>Potensi Belum Setor (Estimasi)</h3>
                        <div className="value" style={{ color: '#d97706' }}>{formatCurrency(totalPotential - totalTerima)}</div>
                        <p style={{ fontSize: '0.75rem' }}>Berdasarkan log layanan semua unit</p>
                    </div>
                </div>
                <div className="stat-card" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
                    <div className="stat-icon" style={{ background: '#dcfce7', color: '#166534' }}><i className="fas fa-chart-line"></i></div>
                    <div className="stat-info">
                        <h3 style={{ color: 'var(--text-muted)' }}>Total Pendapatan Unit</h3>
                        <div className="value" style={{ color: '#166534' }}>{formatCurrency(totalPotential)}</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '2rem' }}>
                {/* Unit Summary Column */}
                <div className="card">
                    <div className="card-header">
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Ringkasan Pendapatan Unit</h2>
                    </div>
                    <div style={{ padding: '0 1.5rem 1.5rem' }}>
                        {unitSummary.map((s, idx) => (
                            <div key={idx} className="unit-summary-item" style={{
                                padding: '1rem',
                                background: '#f8fafc',
                                borderRadius: '12px',
                                marginBottom: '10px',
                                border: '1px solid #f1f5f9',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }} onClick={() => openDetails(s)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>{s.unit}</span>
                                    <span className="th-badge" style={{
                                        background: s.pending <= 0 ? '#dcfce7' : '#fee2e2',
                                        color: s.pending <= 0 ? '#166534' : '#991b1b',
                                        fontSize: '0.65rem'
                                    }}>
                                        {s.pending <= 0 ? 'SUDAH SETOR' : 'ADA PENDING'}
                                    </span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Total Layanan</small>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{formatCurrency(s.totalLayanan)}</div>
                                    </div>
                                    <div>
                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Belum Setor</small>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: s.pending > 0 ? '#dc2626' : '#059669' }}>{formatCurrency(Math.max(0, s.pending))}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Deposits Column */}
                <div className="card">
                    <div className="card-header" style={{ justifyContent: 'space-between' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Riwayat Setoran Masuk</h2>
                        <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
                            <i className="fas fa-plus"></i> Catat Setoran
                        </button>
                    </div>
                    <div className="table-controls" style={{ padding: '0.5rem 1.5rem' }}>
                        <div className="search-wrapper">
                            <i className="fas fa-search"></i>
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Cari unit atau keterangan..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <SortableTable
                        columns={columns}
                        data={data.filter(d => d.unit.toLowerCase().includes(search.toLowerCase()) || d.keterangan?.toLowerCase().includes(search.toLowerCase()))}
                        loading={loading}
                        emptyMessage="Belum ada catatan setoran unit."
                    />
                </div>
            </div>

            {/* Modal Add Setoran */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Pencatatan Setoran Kas Unit"
                footer={(
                    <>
                        <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Batal</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
                            {submitting ? 'Memproses...' : 'Simpan & Masukkan ke Kas'}
                        </button>
                    </>
                )}
            >
                <form onSubmit={handleSave}>
                    <div className="form-group">
                        <label className="form-label">Tanggal Penyerahan</label>
                        <input type="date" className="form-control" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Seksi / Unit Penyetor</label>
                            <select className="form-control" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Nominal Setoran (Rp)</label>
                            <input type="number" className="form-control" style={{ fontWeight: 800, color: '#2563eb' }} value={formData.nominal} onChange={e => setFormData({ ...formData, nominal: e.target.value })} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Keterangan / Catatan</label>
                        <textarea className="form-control" rows="2" placeholder="Misal: Penyetoran KTS bulan Desember" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })}></textarea>
                    </div>
                    <div style={{ padding: '1rem', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '10px', fontSize: '0.85rem', color: '#92400e' }}>
                        <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                        Data ini akan otomatis tercatat sebagai **Pemasukan** pada menu **Arus Kas Pondok**.
                    </div>
                </form>
            </Modal>

            {/* Details Modal */}
            <Modal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                title={selectedUnitDetails ? `Rincian Rekonsiliasi: Unit ${selectedUnitDetails.unit}` : ''}
                footer={<button className="btn btn-primary" onClick={() => setIsDetailsOpen(false)}>Selesai</button>}
            >
                {selectedUnitDetails && (
                    <div className="detail-view">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                            <div className="stat-card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                                <small style={{ color: 'var(--text-muted)' }}>Total Tercatat di Unit</small>
                                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary-dark)' }}>{formatCurrency(selectedUnitDetails.totalLayanan)}</div>
                            </div>
                            <div className="stat-card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                                <small style={{ color: 'var(--text-muted)' }}>Total Disetor ke Bendahara</small>
                                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#059669' }}>{formatCurrency(selectedUnitDetails.totalSetor)}</div>
                            </div>
                        </div>

                        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>Log Transaksi Rekonsiliasi</h3>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                            <table className="table table-sm">
                                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                    <tr>
                                        <th>Tanggal</th>
                                        <th>Jenis</th>
                                        <th style={{ textAlign: 'right' }}>Nominal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.filter(d => d.unit === selectedUnitDetails.unit).length === 0 ? (
                                        <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>Belum ada setoran masuk.</td></tr>
                                    ) : (
                                        data.filter(d => d.unit === selectedUnitDetails.unit).map((d, i) => (
                                            <tr key={i}>
                                                <td>{formatDate(d.tanggal)}</td>
                                                <td>SETORAN UNIT</td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}>{formatCurrency(d.nominal)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: selectedUnitDetails.pending > 0 ? '#fef2f2' : '#f0fdf4', borderRadius: '10px', textAlign: 'center' }}>
                            <div style={{ color: selectedUnitDetails.pending > 0 ? '#991b1b' : '#166534', fontWeight: 800 }}>
                                {selectedUnitDetails.pending > 0
                                    ? `Unit ini memiliki tunggakan setoran sebesar ${formatCurrency(selectedUnitDetails.pending)}`
                                    : `Saldo unit ini sudah seimbang (Reconciled).`
                                }
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <style jsx>{`
                .unit-summary-item:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                    border-color: var(--primary-light);
                    background: white;
                }
            `}</style>
        </div>
    );
}
