'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { apiCall, formatDate, exportToExcel } from '@/lib/utils';
import { usePagePermission } from '@/lib/AuthContext';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { SelectInput } from '@/components/FormInput';
import Modal from '@/components/Modal';

export default function RiwayatAbsensiPage() {
    const { canEdit } = usePagePermission();
    const [loading, setLoading] = useState(false);
    const [absenData, setAbsenData] = useState([]);
    const [nilaiData, setNilaiData] = useState([]);
    const [santriList, setSantriList] = useState([]);
    const [search, setSearch] = useState('');
    const [filterTipe, setFilterTipe] = useState('Semua');
    const [filterBulan, setFilterBulan] = useState('');
    const [filterTahun, setFilterTahun] = useState('');
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState(null);

    const TIPE_OPTIONS = ['Semua', 'Murottil Pagi', 'Murottil Malam', 'Wajib Belajar'];
    const BULAN_OPTIONS = ['Semua', 'Muharram', 'Safar', 'Rabiul Awal', 'Rabiul Akhir', 'Jumadil Awal', 'Jumadil Akhir', 'Rajab', 'Syaban', 'Ramadhan', 'Syawal', 'Dzulqadah', 'Dzulhijjah'];
    const TAHUN_OPTIONS = ['Semua', '1445', '1446', '1447', '1448', '1449'];

    useEffect(() => {
        const today = new Date();
        const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
            month: 'numeric', year: 'numeric'
        }).formatToParts(today);

        const hMonth = parseInt(parts.find(p => p.type === 'month')?.value || '1');
        const hYear = parts.find(p => p.type === 'year')?.value?.split(' ')[0] || '1447';

        setFilterBulan(BULAN_OPTIONS[hMonth] || 'Semua');
        setFilterTahun(hYear);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [resAbsen, resNilai, resSantri] = await Promise.all([
                apiCall('getData', 'GET', { type: 'wajar_mhm_absen' }),
                apiCall('getData', 'GET', { type: 'wajar_nilai' }),
                apiCall('getData', 'GET', { type: 'santri' })
            ]);
            setAbsenData(resAbsen || []);
            setNilaiData(resNilai || []);
            setSantriList(resSantri || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // Group data by date and santri
    const processedData = useMemo(() => {
        const grouped = {};

        absenData.forEach(absen => {
            const key = `${absen.tanggal}_${absen.santri_id}_${absen.tipe}`;
            if (!grouped[key]) {
                const santri = santriList.find(s => s.id === absen.santri_id);
                const nilai = nilaiData.find(n =>
                    n.tanggal === absen.tanggal &&
                    n.santri_id === absen.santri_id &&
                    n.tipe === absen.tipe
                );

                grouped[key] = {
                    id: key,
                    tanggal: absen.tanggal,
                    santri_id: absen.santri_id,
                    nama_santri: santri?.nama_siswa || '-',
                    kelas: santri?.kelas || '-',
                    tipe: absen.tipe,
                    status: absen.status,
                    nilai: nilai?.nilai || '-',
                    materi: nilai?.materi || '-',
                    kelompok: absen.kelompok || '-'
                };
            }
        });

        return Object.values(grouped).sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    }, [absenData, nilaiData, santriList]);

    const displayData = useMemo(() => {
        return processedData.filter(d => {
            // Filter by search
            const matchSearch = (d.nama_santri || '').toLowerCase().includes(search.toLowerCase()) ||
                (d.kelompok || '').toLowerCase().includes(search.toLowerCase());
            if (!matchSearch) return false;

            // Filter by tipe
            if (filterTipe !== 'Semua' && d.tipe !== filterTipe) return false;

            // Filter by bulan/tahun
            if (filterBulan !== 'Semua' || filterTahun !== 'Semua') {
                const date = new Date(d.tanggal);
                const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
                    month: 'numeric', year: 'numeric'
                }).formatToParts(date);

                const hMonth = parseInt(parts.find(p => p.type === 'month')?.value || '1');
                const hYear = parts.find(p => p.type === 'year')?.value?.split(' ')[0] || '';

                if (filterBulan !== 'Semua' && BULAN_OPTIONS[hMonth] !== filterBulan) return false;
                if (filterTahun !== 'Semua' && hYear !== filterTahun) return false;
            }

            return true;
        });
    }, [processedData, search, filterTipe, filterBulan, filterTahun]);

    const stats = useMemo(() => {
        const totalHadir = displayData.filter(d => d.status === 'H').length;
        const totalIzin = displayData.filter(d => d.status === 'I').length;
        const totalAlfa = displayData.filter(d => d.status === 'A').length;

        return [
            { title: 'Total Rekaman', value: displayData.length, icon: 'fas fa-database', color: 'var(--primary)' },
            { title: 'Hadir', value: totalHadir, icon: 'fas fa-check-circle', color: 'var(--success)' },
            { title: 'Izin', value: totalIzin, icon: 'fas fa-envelope', color: 'var(--warning)' },
            { title: 'Alfa', value: totalAlfa, icon: 'fas fa-times-circle', color: 'var(--danger)' }
        ];
    }, [displayData]);

    const handleExport = () => {
        const exportData = displayData.map(d => ({
            Tanggal: formatDate(d.tanggal),
            'Nama Santri': d.nama_santri,
            Kelas: d.kelas,
            Kelompok: d.kelompok,
            Tipe: d.tipe,
            Status: d.status === 'H' ? 'Hadir' : d.status === 'I' ? 'Izin' : 'Alfa',
            Nilai: d.nilai,
            Materi: d.materi
        }));

        const fileName = `Riwayat_Absensi_${filterTipe}_${filterBulan}_${filterTahun}`;
        exportToExcel(exportData, fileName, Object.keys(exportData[0] || {}));
    };

    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => <span style={{ fontWeight: 600 }}>{formatDate(row.tanggal)}</span> },
        { key: 'nama_santri', label: 'Nama Santri', render: (row) => <div><div style={{ fontWeight: 800 }}>{row.nama_santri}</div><small style={{ color: 'var(--text-muted)' }}>{row.kelas}</small></div> },
        { key: 'kelompok', label: 'Kelompok', className: 'hide-mobile', render: (row) => <span className="th-badge">{row.kelompok}</span> },
        { key: 'tipe', label: 'Tipe', render: (row) => <span className="th-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{row.tipe}</span> },
        {
            key: 'status',
            label: 'Status',
            render: (row) => {
                const colors = {
                    'H': { bg: '#dcfce7', color: '#166534', text: 'Hadir' },
                    'I': { bg: '#fef3c7', color: '#92400e', text: 'Izin' },
                    'A': { bg: '#fee2e2', color: '#991b1b', text: 'Alfa' }
                };
                const style = colors[row.status] || colors['H'];
                return <span className="th-badge" style={{ background: style.bg, color: style.color }}>{style.text}</span>;
            }
        },
        { key: 'nilai', label: 'Nilai', className: 'hide-mobile', render: (row) => <strong style={{ color: 'var(--primary)' }}>{row.nilai}</strong> },
        {
            key: 'actions', label: 'Aksi', width: '100px', render: (row) => (
                <div className="table-actions">
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => { setViewData(row); setIsViewModalOpen(true); }}>
                        <i className="fas fa-eye"></i>
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Riwayat Absensi Wajar-Murottil" subJudul="Laporan lengkap kehadiran dan nilai santri" hideOnScreen={true} />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Database Riwayat Absensi"
                subtitle={`Menampilkan ${displayData.length} rekaman absensi`}
                headerActions={
                    <>
                        <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
                            <i className="fas fa-print"></i> Print
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={handleExport} disabled={displayData.length === 0}>
                            <i className="fas fa-file-excel"></i> Export Excel
                        </button>
                    </>
                }
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari nama santri / kelompok..." }}
                filters={
                    <>
                        <SelectInput value={filterTipe} onChange={e => setFilterTipe(e.target.value)} options={TIPE_OPTIONS} style={{ width: '180px', marginBottom: 0 }} />
                        <SelectInput value={filterBulan} onChange={e => setFilterBulan(e.target.value)} options={BULAN_OPTIONS} style={{ width: '150px', marginBottom: 0 }} />
                        <SelectInput value={filterTahun} onChange={e => setFilterTahun(e.target.value)} options={TAHUN_OPTIONS} style={{ width: '120px', marginBottom: 0 }} />
                    </>
                }
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Absensi" width="600px">
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(viewData.nama_santri)}&background=1e3a8a&color=fff&size=128`}
                                style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '1rem' }}
                                alt=""
                            />
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{viewData.nama_santri}</h2>
                            <p style={{ color: 'var(--text-muted)' }}>{viewData.kelas} - Kelompok {viewData.kelompok}</p>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '15px' }}>
                            <div className="form-grid">
                                <div><small>Tanggal</small><div style={{ fontWeight: 800 }}>{formatDate(viewData.tanggal)}</div></div>
                                <div><small>Tipe</small><div style={{ fontWeight: 800, color: 'var(--primary)' }}>{viewData.tipe}</div></div>
                                <div><small>Status</small><div style={{ fontWeight: 800 }}>{viewData.status === 'H' ? 'Hadir' : viewData.status === 'I' ? 'Izin' : 'Alfa'}</div></div>
                                <div><small>Nilai</small><div style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--success)' }}>{viewData.nilai}</div></div>
                            </div>
                            {viewData.materi && (
                                <div style={{ marginTop: '1rem' }}>
                                    <small>Materi</small>
                                    <p style={{ fontWeight: 600, marginTop: '5px' }}>{viewData.materi}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
