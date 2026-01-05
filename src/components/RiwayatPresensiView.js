'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useDataManagement } from '@/hooks/useDataManagement';
import { useAuth, usePagePermission } from '@/lib/AuthContext';
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';

export default function RiwayatPresensiView({ fixedDivisi: propFixedDivisi = null }) {
    const { user } = useAuth();
    const { canDelete } = usePagePermission();
    const [pengurusList, setPengurusList] = useState([]);

    // Determine effective fixedDivisi based on user role or linked pengurus data
    const effectiveFixedDivisi = useMemo(() => {
        if (propFixedDivisi) return propFixedDivisi;
        if (user?.role === 'admin' || user?.role === 'sekretariat') return null;

        // 1. Try to find division from official Pengurus Profile (Linked via pengurus_id)
        if (user?.pengurus_id && pengurusList.length > 0) {
            const profile = pengurusList.find(p => Number(p.id) === Number(user.pengurus_id));
            if (profile) {
                // If the division is set, use it. Otherwise guess from Jabatan.
                if (profile.divisi && profile.divisi !== '-') return profile.divisi;

                const job = (profile.jabatan || '').toLowerCase();
                const div = (profile.divisi || '').toLowerCase();
                if (job.includes('murottil') || job.includes('wajar') || div.includes('murottil') || div.includes('wajar')) return 'Wajar-Murottil';
                if (job.includes('pendidikan') || div.includes('pendidikan')) return 'Pendidikan';
                if (job.includes('keamanan') || div.includes('keamanan')) return 'Keamanan';
                if (job.includes('bendahara') || div.includes('bendahara')) return 'Bendahara';
                if (job.includes('kesehatan') || div.includes('kesehatan')) return 'Kesehatan';
                if (job.includes('jamiyyah') || div.includes('jamiyyah')) return 'Jamiyyah';
            }
        }

        // 2. Fallback to role-based mapping if pengurus_id is missing or profile not found
        const roleToDivisi = {
            'pendidikan': 'Pendidikan',
            'keamanan': 'Keamanan',
            'bendahara': 'Bendahara',
            'kesehatan': 'Kesehatan',
            'jamiyyah': 'Jamiyyah',
            'wajar_murottil': 'Wajar-Murottil'
        };

        return roleToDivisi[user?.role] || null;
    }, [user, propFixedDivisi, pengurusList]);

    const [filterDivisi, setFilterDivisi] = useState(effectiveFixedDivisi || 'Semua');

    const isSekretariat = (user?.role === 'admin' || user?.role === 'sekretariat') && !effectiveFixedDivisi;

    const {
        data, loading, search, setSearch, handleDelete
    } = useDataManagement('presensi_pengurus');

    const loadPengurus = useCallback(async () => {
        try {
            const res = await apiCall('getData', 'GET', { type: 'pengurus' });
            setPengurusList(res || []);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { loadPengurus(); }, [loadPengurus]);

    const divisiOptions = useMemo(() => {
        const unique = [...new Set(pengurusList.map(p => p.divisi).filter(Boolean))];
        return ['Semua', ...unique.sort()];
    }, [pengurusList]);

    const enrichedData = useMemo(() => {
        return data.map(d => {
            const p = pengurusList.find(pl => Number(pl.id) === Number(d.pengurus_id));
            return {
                ...d,
                jabatan: p?.jabatan || '-',
                divisi: p?.divisi || '-'
            };
        });
    }, [data, pengurusList]);

    const displayData = useMemo(() => {
        return enrichedData.filter(d => {
            const matchSearch = (d.nama || '').toLowerCase().includes(search.toLowerCase()) ||
                (d.jabatan || '').toLowerCase().includes(search.toLowerCase()) ||
                (d.tanggal || '').includes(search);

            // Re-check fixed division protection
            const currentFilter = effectiveFixedDivisi || filterDivisi;

            const matchDivisi = currentFilter === 'Semua' ||
                (d.divisi === currentFilter) ||
                (d.jabatan && (
                    d.jabatan.toLowerCase().includes(currentFilter.toLowerCase()) ||
                    (currentFilter === 'Wajar-Murottil' && (d.jabatan.toLowerCase().includes('wajar') || d.jabatan.toLowerCase().includes('murottil')))
                ));

            return matchSearch && matchDivisi;
        }).sort((a, b) => new Date(b.tanggal + ' ' + b.jam) - new Date(a.tanggal + ' ' + a.jam));
    }, [enrichedData, search, filterDivisi, effectiveFixedDivisi]);

    const stats = useMemo(() => [
        { title: 'Total Scanning', value: displayData.length, icon: 'fas fa-qrcode', color: 'var(--primary)' },
        { title: 'Presensi Hadir', value: displayData.filter(d => d.tipe === 'Hadir').length, icon: 'fas fa-user-check', color: 'var(--success)' },
        { title: 'Unique Staff', value: [...new Set(displayData.map(d => d.pengurus_id))].length, icon: 'fas fa-users', color: 'var(--warning)' }
    ], [displayData]);

    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => <b>{formatDate(row.tanggal)}</b> },
        { key: 'jam', label: 'Waktu', render: (row) => <span className="th-badge" style={{ background: '#f1f5f9', color: '#475569' }}><i className="far fa-clock"></i> {row.jam}</span> },
        {
            key: 'nama',
            label: 'Nama Pengurus',
            render: (row) => (
                <div>
                    <div style={{ fontWeight: 800 }}>{row.nama}</div>
                    <small style={{ color: 'var(--text-muted)' }}>{row.jabatan}</small>
                </div>
            )
        },
        (!fixedDivisi && {
            key: 'divisi',
            label: 'Divisi',
            className: 'hide-mobile',
            render: (row) => <span className="th-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{row.divisi}</span>
        }),
        {
            key: 'tipe',
            label: 'Status',
            render: (row) => (
                <span className="th-badge" style={{
                    background: '#dcfce7',
                    color: '#166534',
                    borderRadius: '8px',
                    fontWeight: 700
                }}>
                    <i className="fas fa-check-circle"></i> {row.tipe.toUpperCase()}
                </span>
            )
        },
        {
            key: 'actions', label: 'Aksi', width: '100px', render: (row) => (
                <div className="table-actions">
                    {canDelete && <button className="btn-vibrant btn-vibrant-red" onClick={() => handleDelete(row.id, 'Hapus catatan kehadiran ini?')} title="Hapus"><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ].filter(Boolean);

    return (
        <div className="view-container animate-in">
            <KopSurat judul="PRESENSI DIGITAL PENGURUS" subJudul={filterDivisi === 'Semua' ? 'Seluruh Devisi & Unit Kerja' : `Spesialisasi Unit: ${filterDivisi}`} hideOnScreen={true} />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Log Scan Kehadiran"
                subtitle={fixedDivisi ? `Khusus Unit Kerja ${fixedDivisi}` : "Data absensi real-time berbasis QR Code Scanner."}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari nama atau tanggal..." }}
                filters={
                    isSekretariat && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fas fa-filter" style={{ color: 'var(--primary)' }}></i>
                            <select
                                className="form-control-sm"
                                value={filterDivisi}
                                onChange={e => setFilterDivisi(e.target.value)}
                                style={{ borderRadius: '10px', padding: '5px 15px', border: '2px solid var(--primary-light)', fontWeight: 700 }}
                            >
                                {divisiOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    )
                }
                tableProps={{ columns, data: displayData, loading }}
                headerActions={
                    <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
                        <i className="fas fa-print"></i> Cetak Laporan
                    </button>
                }
            />
        </div>
    );
}
