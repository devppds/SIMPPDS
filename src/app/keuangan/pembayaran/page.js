'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiCall, formatCurrency, formatDate } from '@/lib/utils';
import { useDataManagement } from '@/hooks/useDataManagement';
import { useAuth, usePagePermission } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import Autocomplete from '@/components/Autocomplete';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput } from '@/components/FormInput';

export default function PembayaranSantriPage() {
    const { user } = useAuth();
    const { canEdit } = usePagePermission();
    const { showToast } = useToast();
    const [santriList, setSantriList] = useState([]);
    const [tarifList, setTarifList] = useState([]);
    const [selectedSantri, setSelectedSantri] = useState(null);
    const [searchSantri, setSearchSantri] = useState('');

    const {
        data: history, setData: setHistory, loading, setLoading, submitting, setSubmitting,
        formData, setFormData
    } = useDataManagement('keuangan_pembayaran', {
        tanggal: '',
        jenis_pembayaran: 'Syahriah',
        bulan_tagihan: '',
        nominal: 0, keterangan: ''
    });

    const loadInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const [dataSantri, dataTarif, dataHistory] = await Promise.all([
                apiCall('getData', 'GET', { type: 'santri' }),
                apiCall('getData', 'GET', { type: 'keuangan_tarif' }),
                apiCall('getData', 'GET', { type: 'keuangan_pembayaran' })
            ]);
            setSantriList(dataSantri || []);
            setTarifList(dataTarif || []);
            setHistory((dataHistory || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, [setHistory, setLoading]);

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            tanggal: new Date().toISOString().split('T')[0],
            bulan_tagihan: new Date().toISOString().slice(0, 7)
        }));
        loadInitialData();
    }, [loadInitialData, setFormData]);

    useEffect(() => {
        if (!selectedSantri || formData.jenis_pembayaran === 'Tabungan') return;
        const status = selectedSantri.status_santri || 'Biasa Baru';
        const kelas = selectedSantri.kelas || 'Semua';
        let rule = tarifList.find(t => t.kategori_status === status && t.kelas === kelas);
        if (!rule) rule = tarifList.find(t => t.kategori_status === status && t.kelas === 'Semua');
        if (rule) setFormData(prev => ({ ...prev, nominal: rule.nominal }));
    }, [selectedSantri, formData.jenis_pembayaran, tarifList, setFormData]);

    const handleReset = () => {
        setSelectedSantri(null);
        setSearchSantri('');
        setFormData({
            tanggal: new Date().toISOString().split('T')[0],
            jenis_pembayaran: 'Syahriah',
            bulan_tagihan: new Date().toISOString().slice(0, 7),
            nominal: 0, keterangan: ''
        });
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!selectedSantri) return showToast("Pilih santri terlebih dahulu!", "warning");
        setSubmitting(true);
        try {
            const payload = {
                santri_id: selectedSantri.id, nama_santri: selectedSantri.nama_siswa, tanggal: formData.tanggal,
                jenis_pembayaran: formData.jenis_pembayaran, bulan_tagihan: formData.jenis_pembayaran === 'Syahriah' ? formData.bulan_tagihan : null,
                nominal: parseInt(formData.nominal), keterangan: formData.keterangan || '-', petugas: user?.fullname || 'Admin'
            };
            const res = await apiCall('saveData', 'POST', { type: 'keuangan_pembayaran', data: payload });
            await apiCall('saveData', 'POST', {
                type: 'keuangan_kas',
                data: {
                    tanggal: formData.tanggal, tipe: 'Masuk', kategori: 'Pembayaran Santri',
                    nominal: parseInt(formData.nominal), keterangan: `${formData.jenis_pembayaran} - ${selectedSantri.nama_siswa}`,
                    pembayaran_id: res?.id || null, petugas: user?.fullname || 'Admin'
                }
            });
            showToast('Pembayaran berhasil dicatat!', "success");
            handleReset();
            loadInitialData();
        } catch (err) { showToast(err.message, "error"); } finally { setSubmitting(false); }
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const stats = useMemo(() => [
        { title: 'Total Transaksi', value: history.length, icon: 'fas fa-file-invoice-dollar', color: 'var(--primary)' },
        { title: 'Pendapatan Hari Ini', value: formatCurrency(history.filter(h => mounted && h.tanggal === new Date().toISOString().split('T')[0]).reduce((acc, h) => acc + parseInt(h.nominal || 0), 0)), icon: 'fas fa-calendar-day', color: 'var(--success)' },
        { title: 'Rata-rata Bayar', value: formatCurrency(history.reduce((acc, h) => acc + parseInt(h.nominal || 0), 0) / (history.length || 1)), icon: 'fas fa-chart-line', color: 'var(--warning)' }
    ], [history, mounted]);

    const columns = [
        { key: 'tanggal', label: 'Tgl Bayar', render: (row) => formatDate(row.tanggal) },
        { key: 'nama_santri', label: 'Santri', render: (row) => <div style={{ fontWeight: 800 }}>{row.nama_santri}</div> },
        { key: 'jenis_pembayaran', label: 'Jenis', render: (row) => <span className="th-badge" style={{ background: row.jenis_pembayaran === 'Syahriah' ? '#e0e7ff' : '#fef3c7', color: row.jenis_pembayaran === 'Syahriah' ? '#4338ca' : '#d97706' }}>{row.jenis_pembayaran}</span> },
        { key: 'bulan_tagihan', label: 'Bulan', render: (row) => row.bulan_tagihan || '-' },
        { key: 'nominal', label: 'Nominal', render: (row) => <span style={{ fontWeight: 800 }}>{formatCurrency(row.nominal)}</span> }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Loket Pembayaran Syahriah & Tabungan" subJudul="Pusat administrasi keuangan santri." hideOnScreen={true} />

            <StatsPanel items={stats} />

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '2rem' }}>
                <div className="card" style={{ padding: '2rem' }}>
                    <div className="card-header" style={{ padding: '0 0 1.5rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Lakukan Pembayaran</h2>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Cari Data Santri</label>
                        {selectedSantri ? (
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--primary-light)', padding: '12px', borderRadius: '12px', border: '1px solid var(--primary)' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 800, color: 'var(--primary)' }}>{selectedSantri.nama_siswa}</div>
                                    <small style={{ color: 'var(--primary-dark)', opacity: 0.8 }}>{selectedSantri.kelas} | {selectedSantri.status_santri}</small>
                                </div>
                                <button onClick={handleReset} className="btn-vibrant btn-vibrant-red" style={{ padding: '8px 12px' }}><i className="fas fa-times"></i></button>
                            </div>
                        ) : (
                            <Autocomplete options={santriList} value={searchSantri} onChange={setSearchSantri} onSelect={setSelectedSantri} placeholder="Masukkan nama santri..." labelKey="nama_siswa" subLabelKey="kelas" />
                        )}
                    </div>

                    <form onSubmit={handleSubmit}>
                        <TextInput label="Tanggal Transaksi" type="date" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} />
                        <div className="form-grid">
                            <SelectInput label="Tipe Pembayaran" value={formData.jenis_pembayaran} onChange={e => setFormData({ ...formData, jenis_pembayaran: e.target.value })} options={['Syahriah', 'Tabungan']} />
                            {formData.jenis_pembayaran === 'Syahriah' && <TextInput label="Bulan Tagihan" type="month" value={formData.bulan_tagihan} onChange={e => setFormData({ ...formData, bulan_tagihan: e.target.value })} />}
                        </div>
                        <TextInput label="Nominal Rupiah (Rp)" type="number" value={formData.nominal} onChange={e => setFormData({ ...formData, nominal: e.target.value })} required icon="fas fa-wallet" style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--primary)' }} />
                        <TextInput label="Memo / Keterangan" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} />
                        {canEdit && <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', padding: '1rem', fontSize: '1rem' }} disabled={submitting}>
                            {submitting ? <><i className="fas fa-spinner fa-spin"></i> Memproses...</> : 'Proses Simpan Pembayaran'}
                        </button>}
                    </form>
                </div>

                <DataViewContainer
                    title="Riwayat Terbaru"
                    subtitle="Daftar 50 transaksi pembayaran terakhir."
                    tableProps={{ columns, data: history, loading }}
                />
            </div>
        </div>
    );
}
