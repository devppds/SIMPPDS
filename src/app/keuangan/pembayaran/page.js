'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import SortableTable from '@/components/SortableTable';

export default function PembayaranSantriPage() {
    const { user } = useAuth();
    const [santriList, setSantriList] = useState([]);
    const [tarifList, setTarifList] = useState([]);

    // Search State
    const [search, setSearch] = useState('');
    const [selectedSantri, setSelectedSantri] = useState(null);
    const [suggestionList, setSuggestionList] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        tanggal: new Date().toISOString().split('T')[0],
        jenis_pembayaran: 'Syahriah',
        bulan_tagihan: new Date().toISOString().slice(0, 7), // YYYY-MM
        nominal: 0,
        keterangan: ''
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // History Data
    const [history, setHistory] = useState([]);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [dataSantri, dataTarif, dataHistory] = await Promise.all([
                apiCall('getData', 'GET', { type: 'santri' }),
                apiCall('getData', 'GET', { type: 'keuangan_tarif' }),
                apiCall('getData', 'GET', { type: 'keuangan_pembayaran' }) // Fetches all history
            ]);
            setSantriList(dataSantri || []);
            setTarifList(dataTarif || []);
            // Sort history by date desc
            setHistory((dataHistory || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    // Filter Suggestions based on search
    useEffect(() => {
        if (!search || selectedSantri) {
            setSuggestionList([]);
            return;
        }
        const lower = search.toLowerCase();
        const filtered = santriList.filter(s =>
            s.nama_siswa.toLowerCase().includes(lower) ||
            (s.stambuk_pondok || '').includes(lower)
        ).slice(0, 10);
        setSuggestionList(filtered);
    }, [search, santriList, selectedSantri]);

    // Calculate Fee when Santri or Type changes
    useEffect(() => {
        if (!selectedSantri) return;

        if (formData.jenis_pembayaran === 'Tabungan') {
            // Tabungan is manual input, default 0 or keep existing if editing
            // setFormData(prev => ({ ...prev, nominal: 0 })); 
            return;
        }

        // Logic for Syahriah
        const status = selectedSantri.status_santri || 'Biasa Baru'; // Fallback
        const kelas = selectedSantri.kelas || selectedSantri.kelas_diniyah || selectedSantri.kelas_formal || 'All'; // Include new 'kelas' field

        // Find tariff
        // Priority 1: Status Match AND Class Match
        let rule = tarifList.find(t =>
            t.kategori_status === status && t.kelas === kelas
        );

        // Priority 2: Status Match AND Class 'Semua'
        if (!rule) {
            rule = tarifList.find(t =>
                t.kategori_status === status && t.kelas === 'Semua'
            );
        }

        if (rule) {
            setFormData(prev => ({ ...prev, nominal: rule.nominal }));
        } else {
            // Fallback default
            setFormData(prev => ({ ...prev, nominal: 0 }));
        }

    }, [selectedSantri, formData.jenis_pembayaran, tarifList]);

    const handleSelectSantri = (s) => {
        setSelectedSantri(s);
        setSearch(`${s.nama_siswa} (${s.kelas_diniyah || '-'})`);
        setSuggestionList([]);
    };

    const handleReset = () => {
        setSelectedSantri(null);
        setSearch('');
        setFormData({
            tanggal: new Date().toISOString().split('T')[0],
            jenis_pembayaran: 'Syahriah',
            bulan_tagihan: new Date().toISOString().slice(0, 7),
            nominal: 0,
            keterangan: ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedSantri) return alert("Pilih santri terlebih dahulu");

        setSubmitting(true);
        try {
            // 1. Save Payment Data
            const paymentPayload = {
                santri_id: selectedSantri.id,
                nama_santri: selectedSantri.nama_siswa,
                tanggal: formData.tanggal,
                jenis_pembayaran: formData.jenis_pembayaran,
                bulan_tagihan: formData.jenis_pembayaran === 'Syahriah' ? formData.bulan_tagihan : null,
                nominal: parseInt(formData.nominal),
                keterangan: formData.keterangan || '-',
                petugas: user?.fullname || 'Admin'
            };

            const savedPayment = await apiCall('saveData', 'POST', {
                type: 'keuangan_pembayaran',
                data: paymentPayload
            });

            // 2. Auto-Entry to Arus Kas (Masuk)
            // Note: We use savedPayment ID if available, otherwise just link logic
            await apiCall('saveData', 'POST', {
                type: 'keuangan_kas',
                data: {
                    tanggal: formData.tanggal,
                    tipe: 'Masuk',
                    kategori: 'Pembayaran Santri',
                    nominal: parseInt(formData.nominal),
                    keterangan: `Pembayaran ${formData.jenis_pembayaran} oleh ${selectedSantri.nama_siswa}`,
                    pembayaran_id: savedPayment?.id || null, // Assuming backend returns ID
                    petugas: user?.fullname || 'Admin'
                }
            });

            alert('Transaksi Berhasil!');
            handleReset();
            loadInitialData(); // Refresh history
        } catch (err) {
            console.error(err);
            alert('Gagal menyimpan transaksi: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Table Columns for History
    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => formatDate(row.tanggal) },
        { key: 'nama_santri', label: 'Nama Santri', render: (row) => <div style={{ fontWeight: 700 }}>{row.nama_santri}</div> },
        {
            key: 'jenis_pembayaran', label: 'Jenis', render: (row) => (
                <span className="th-badge" style={{
                    background: row.jenis_pembayaran === 'Syahriah' ? 'var(--primary-light)' : '#fef3c7',
                    color: row.jenis_pembayaran === 'Syahriah' ? 'var(--primary)' : '#d97706'
                }}>
                    {row.jenis_pembayaran}
                </span>
            )
        },
        { key: 'detail', label: 'Detail', render: (row) => row.jenis_pembayaran === 'Syahriah' ? row.bulan_tagihan : '-' },
        { key: 'nominal', label: 'Nominal', render: (row) => <div style={{ fontWeight: 800 }}>{formatCurrency(row.nominal)}</div> },
        { key: 'petugas', label: 'Petugas' }
    ];

    return (
        <div className="view-container animate-in">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>

                {/* FORM SECTION */}
                <div className="card" style={{ height: 'fit-content' }}>
                    <div className="card-header">
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Input Transaksi</h2>
                    </div>

                    <div className="form-group" style={{ position: 'relative' }}>
                        <label className="form-label">Cari Santri</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Ketik Nama / Stambuk..."
                            value={search}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSearch(val);
                                if (!val && selectedSantri) setSelectedSantri(null);
                            }}
                            disabled={!!selectedSantri}
                        />
                        {selectedSantri && (
                            <button
                                onClick={handleReset}
                                style={{ position: 'absolute', right: '10px', top: '38px', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        )}
                        {/* Suggestions Dropdown */}
                        {suggestionList.length > 0 && !selectedSantri && (
                            <div style={{
                                position: 'absolute', top: '100%', left: 0, right: 0,
                                background: 'white', border: '1px solid #ddd', borderRadius: '0 0 8px 8px',
                                zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto'
                            }}>
                                {suggestionList.map(s => (
                                    <div
                                        key={s.id}
                                        onClick={() => handleSelectSantri(s)}
                                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                                        onMouseEnter={e => e.target.style.background = '#f8fafc'}
                                        onMouseLeave={e => e.target.style.background = 'white'}
                                    >
                                        <div style={{ fontWeight: 700 }}>{s.nama_siswa}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#666' }}>{s.stambuk_pondok} | {s.kelas || s.kelas_diniyah || s.kelas_formal}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedSantri && (
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>Status: <strong style={{ color: 'var(--primary)' }}>{selectedSantri.status_santri || 'Umum'}</strong></div>
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>Kelas: <strong>{selectedSantri.kelas || selectedSantri.kelas_diniyah || selectedSantri.kelas_formal || '-'}</strong></div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Tanggal Transaksi</label>
                            <input
                                type="date"
                                className="form-control"
                                value={formData.tanggal}
                                onChange={e => setFormData({ ...formData, tanggal: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Jenis Pembayaran</label>
                                <select
                                    className="form-control"
                                    value={formData.jenis_pembayaran}
                                    onChange={e => setFormData({ ...formData, jenis_pembayaran: e.target.value })}
                                >
                                    <option value="Syahriah">Syahriah (Bulanan)</option>
                                    <option value="Tabungan">Tabungan</option>
                                </select>
                            </div>

                            {formData.jenis_pembayaran === 'Syahriah' && (
                                <div className="form-group">
                                    <label className="form-label">Bulan Tagihan</label>
                                    <input
                                        type="month"
                                        className="form-control"
                                        value={formData.bulan_tagihan}
                                        onChange={e => setFormData({ ...formData, bulan_tagihan: e.target.value })}
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Nominal (Rp)</label>
                            <input
                                type="number"
                                className="form-control"
                                style={{ fontSize: '1.2rem', fontWeight: 800 }}
                                value={formData.nominal}
                                onChange={e => setFormData({ ...formData, nominal: e.target.value })}
                                required
                                min="0"
                            />
                            {formData.jenis_pembayaran === 'Syahriah' && selectedSantri && (
                                <small style={{ color: 'var(--text-muted)' }}>*Otomatis disesuaikan dengan tarif Status & Kelas</small>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Keterangan (Opsional)</label>
                            <textarea
                                className="form-control"
                                rows="2"
                                value={formData.keterangan}
                                onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                            ></textarea>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
                            {submitting ? 'Memproses...' : 'Simpan Pembayaran'}
                        </button>
                    </form>
                </div>

                {/* HISTORY SECTION */}
                <div className="card">
                    <div className="card-header">
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Riwayat Transaksi</h2>
                    </div>
                    <SortableTable
                        columns={columns}
                        data={history}
                        loading={loading}
                        emptyMessage="Belum ada transaksi hari ini."
                    />
                </div>
            </div>
        </div>
    );
}
