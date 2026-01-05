'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useDataManagement } from '@/hooks/useDataManagement';
import { usePagePermission } from '@/lib/AuthContext';
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';

export default function RiwayatPresensiPage() {
    const { canDelete } = usePagePermission();
    const [pengurusList, setPengurusList] = useState([]);

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

    const stats = useMemo(() => [
        { title: 'Total Scanning', value: enrichedData.length, icon: 'fas fa-qrcode', color: 'var(--primary)' },
        { title: 'Presensi Hadir', value: enrichedData.filter(d => d.tipe === 'Hadir').length, icon: 'fas fa-user-check', color: 'var(--success)' },
        { title: 'Unique Staff', value: [...new Set(enrichedData.map(d => d.pengurus_id))].length, icon: 'fas fa-users', color: 'var(--warning)' }
    ], [enrichedData]);

    const displayData = useMemo(() => {
        return enrichedData.filter(d =>
            (d.nama || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.jabatan || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.divisi || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.tanggal || '').includes(search)
        ).sort((a, b) => new Date(b.tanggal + ' ' + b.jam) - new Date(a.tanggal + ' ' + a.jam));
    }, [enrichedData, search]);

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
        {
            key: 'divisi',
            label: 'Divisi',
            className: 'hide-mobile',
            render: (row) => <span className="th-badge">{row.divisi}</span>
        },
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
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="LOG PRESENSI DIGITAL" subJudul="Rekapitulasi Kehadiran Pengurus (QR Code Scanner)" hideOnScreen={true} />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Log Scan Kehadiran"
                subtitle="Data kehadiran real-time yang masuk melalui sistem scanner."
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari nama, jabatan, atau tanggal..." }}
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
