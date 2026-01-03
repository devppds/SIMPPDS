'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiCall, formatDate, formatCurrency } from '@/lib/utils';
import { useAuth, usePagePermission } from '@/lib/AuthContext';
import DataViewContainer from '@/components/DataViewContainer';
import StatsPanel from '@/components/StatsPanel';
import PremiumBanner from '@/components/PremiumBanner';
import SortableTable from '@/components/SortableTable';

export default function LabHistoriPage() {
    const { user } = useAuth();
    const { canDelete } = usePagePermission();
    const [layananData, setLayananData] = useState([]);
    const [kasData, setKasData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [resLayanan, resKas] = await Promise.all([
                apiCall('getData', 'GET', { type: 'layanan_admin' }),
                apiCall('getData', 'GET', { type: 'unit_lab_media_kas' })
            ]);

            // Filter only Lab & Media
            setLayananData((resLayanan || []).filter(d => d.unit === 'Lab' || d.unit === 'Media'));
            setKasData((resKas || []).filter(d => d.unit === 'Lab' || d.unit === 'Media'));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const stats = useMemo(() => {
        const totalIncome = layananData.reduce((acc, d) => acc + (parseInt(d.nominal) || 0), 0);
        const totalExpense = kasData.filter(k => k.tipe === 'Keluar' && !k.kategori.includes('Setoran')).reduce((acc, k) => acc + (parseInt(k.nominal) || 0), 0);
        const totalSetoran = kasData.filter(k => k.kategori.includes('Setoran')).reduce((acc, k) => acc + (parseInt(k.nominal) || 0), 0);

        return [
            { title: 'Total Omzet (Kotor)', value: formatCurrency(totalIncome), icon: 'fas fa-chart-bar', color: '#8b5cf6' },
            { title: 'Biaya Pengeluaran', value: formatCurrency(totalExpense), icon: 'fas fa-tools', color: 'var(--danger)' },
            { title: 'Total Setor ke Pusat', value: formatCurrency(totalSetoran), icon: 'fas fa-university', color: 'var(--success)' },
            { title: 'Saldo Kas Saat Ini', value: formatCurrency(totalIncome - totalExpense - totalSetoran), icon: 'fas fa-wallet', color: 'var(--accent)' }
        ];
    }, [layananData, kasData]);

    const combinedData = useMemo(() => {
        const logs = [
            ...layananData.map(d => ({ ...d, logType: 'Income', category: d.jenis_layanan, detail: d.nama_santri || 'Personal' })),
            ...kasData.map(k => ({ ...k, logType: k.tipe === 'Masuk' ? 'Income' : 'Expense', category: k.kategori, detail: k.keterangan }))
        ];

        return logs.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
            .filter(d =>
                (d.category || '').toLowerCase().includes(search.toLowerCase()) ||
                (d.detail || '').toLowerCase().includes(search.toLowerCase()) ||
                (d.unit || '').toLowerCase().includes(search.toLowerCase())
            );
    }, [layananData, kasData, search]);

    const columns = [
        { key: 'tanggal', label: 'Tanggal', width: '120px', render: (row) => <strong>{formatDate(row.tanggal)}</strong> },
        { key: 'unit', label: 'Unit', width: '100px', render: (row) => <span className={`th-badge ${row.unit === 'Lab' ? 'bg-blue' : 'bg-purple'}`}>{row.unit}</span> },
        {
            key: 'category',
            label: 'Aktivitas / Layanan',
            render: (row) => (
                <div>
                    <div style={{ fontWeight: 800 }}>{row.category}</div>
                    <small style={{ color: 'var(--text-muted)' }}>{row.detail}</small>
                </div>
            )
        },
        {
            key: 'logType',
            label: 'Tipe',
            width: '100px',
            render: (row) => (
                <span style={{
                    fontWeight: 700,
                    color: row.logType === 'Income' ? 'var(--success)' : 'var(--danger)',
                    fontSize: '0.85rem'
                }}>
                    {row.logType === 'Income' ? 'MASUK' : 'KELUAR'}
                </span>
            )
        },
        {
            key: 'nominal',
            label: 'Nominal',
            render: (row) => (
                <span style={{ fontWeight: 900, color: row.logType === 'Income' ? 'var(--success)' : 'var(--danger)', fontSize: '1.1rem' }}>
                    {row.logType === 'Income' ? '+' : '-'}{formatCurrency(row.nominal)}
                </span>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <PremiumBanner
                title="Histori & Rekapitulasi"
                subtitle="Logging terpadu seluruh transaksi pendapatan dan pengeluaran operasional Lab & Media."
                icon="fas fa-history"
                floatingIcon="fas fa-file-invoice-dollar"
                bgGradient="linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)"
            />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Log Transaksi Menyeluruh"
                subtitle={`Menampilkan ${combinedData.length} catatan riwayat terbaru.`}
                headerActions={<button className="btn btn-outline" style={{ borderStyle: 'dashed' }} onClick={() => window.print()}><i className="fas fa-print"></i> Cetak Rekap</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari riwayat..." }}
                tableProps={{ columns, data: combinedData, loading }}
            />
        </div>
    );
}
