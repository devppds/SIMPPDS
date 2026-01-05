'use client';

import React, { useMemo } from 'react';
import { useDataManagement } from '@/hooks/useDataManagement';
import { usePagePermission } from '@/lib/AuthContext';
import { formatDate } from '@/lib/utils';
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';

export default function RiwayatPresensiPage() {
    const { canDelete } = usePagePermission();

    const {
        data, loading, search, setSearch, handleDelete
    } = useDataManagement('presensi_pengurus');

    const stats = useMemo(() => [
        { title: 'Total Scanning', value: data.length, icon: 'fas fa-qrcode', color: 'var(--primary)' },
        { title: 'Presensi Hadir', value: data.filter(d => d.tipe === 'Hadir').length, icon: 'fas fa-user-check', color: 'var(--success)' },
        { title: 'Unique Staff', value: [...new Set(data.map(d => d.pengurus_id))].length, icon: 'fas fa-users', color: 'var(--warning)' }
    ], [data]);

    const displayData = useMemo(() => {
        return data.filter(d =>
            (d.nama || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.tipe || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.tanggal || '').includes(search)
        ).sort((a, b) => new Date(b.tanggal + ' ' + b.jam) - new Date(a.tanggal + ' ' + a.jam));
    }, [data, search]);

    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => <b>{formatDate(row.tanggal)}</b> },
        { key: 'jam', label: 'Waktu', render: (row) => <span className="th-badge" style={{ background: '#f1f5f9', color: '#475569' }}><i className="far fa-clock"></i> {row.jam}</span> },
        { key: 'nama', label: 'Nama Pengurus', render: (row) => <span style={{ fontWeight: 800 }}>{row.nama}</span> },
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
        { key: 'keterangan', label: 'Metode', className: 'hide-mobile' },
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
            <KopSurat judul="LAPORAN PRESENSI PENGURUS" subJudul="Rekapitulasi Kehadiran Digital Berbasis QR Code" hideOnScreen={true} />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Log Presensi"
                subtitle="Daftar kehadiran pengurus yang tercatat melalui sistem scan QR."
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari nama atau tanggal..." }}
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
