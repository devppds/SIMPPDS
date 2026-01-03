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

export default function RiwayatAbsensiPengurusPage() {
    const { canEdit } = usePagePermission();
    const [loading, setLoading] = useState(false);
    const [absenData, setAbsenData] = useState([]);
    const [pengurusList, setPengurusList] = useState([]);
    const [targetData, setTargetData] = useState([]);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('Semua');
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState(null);
    const [mounted, setMounted] = useState(false);

    const STATUS_OPTIONS = ['Semua', 'Hadir', 'Izin', 'Alfa'];

    const loadData = async () => {
        setLoading(true);
        try {
            const [resAbsen, resPengurus, resTarget] = await Promise.all([
                apiCall('getData', 'GET', { type: 'pengurus_absen' }),
                apiCall('getData', 'GET', { type: 'pengurus' }),
                apiCall('getData', 'GET', { type: 'pengurus_target' })
            ]);
            setAbsenData(resAbsen || []);
            setPengurusList(resPengurus || []);
            setTargetData(resTarget || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        loadData();
    }, []);

    if (!mounted) return null;

    // Group data by pengurus and aggregate attendance
    const processedData = useMemo(() => {
        const grouped = {};

        absenData.forEach(absen => {
            const pengurus = pengurusList.find(p => Number(p.id) === Number(absen.pengurus_id));
            if (!pengurus) return;

            const key = absen.pengurus_id;
            const target = targetData.find(t => Number(t.pengurus_id) === Number(absen.pengurus_id) && t.bulan === absen.bulan && t.tahun === absen.tahun);

            if (!grouped[key]) {
                grouped[key] = {
                    id: key,
                    pengurus_id: absen.pengurus_id,
                    nama_pengurus: pengurus.nama,
                    jabatan: pengurus.jabatan || '-',
                    divisi: pengurus.divisi || '-',
                    hadir: 0,
                    izin: 0,
                    alfa: 0,
                    total_target: 0,
                    total_tugas: 0
                };
            }

            // Sum historical counts
            grouped[key].hadir += Number(absen.tugas || 0);
            grouped[key].izin += Number(absen.izin || 0);
            grouped[key].alfa += Number(absen.alfa || 0);
            grouped[key].total_target += Number(target?.target_tugas || 0);
            grouped[key].total_tugas += (Number(absen.tugas || 0) + Number(absen.izin || 0) + Number(absen.alfa || 0));
        });

        // Calculate percentages
        return Object.values(grouped).map(item => {
            const persentaseKehadiran = item.total_target > 0
                ? ((item.hadir / item.total_target) * 100).toFixed(1)
                : 0;

            return {
                ...item,
                persentaseKehadiran: parseFloat(persentaseKehadiran)
            };
        }).sort((a, b) => b.hadir - a.hadir);
    }, [absenData, pengurusList, targetData]);

    const displayData = useMemo(() => {
        return processedData.filter(d => {
            const matchSearch = (d.nama_pengurus || '').toLowerCase().includes(search.toLowerCase()) ||
                (d.jabatan || '').toLowerCase().includes(search.toLowerCase()) ||
                (d.divisi || '').toLowerCase().includes(search.toLowerCase());
            if (!matchSearch) return false;

            // Filter by status (has any of this type)
            if (filterStatus !== 'Semua') {
                if (filterStatus === 'Hadir' && d.hadir === 0) return false;
                if (filterStatus === 'Izin' && d.izin === 0) return false;
                if (filterStatus === 'Alfa' && d.alfa === 0) return false;
            }

            return true;
        });
    }, [processedData, search, filterStatus]);

    const stats = useMemo(() => {
        const totalHadir = displayData.reduce((sum, d) => sum + d.hadir, 0);
        const totalIzin = displayData.reduce((sum, d) => sum + d.izin, 0);
        const totalAlfa = displayData.reduce((sum, d) => sum + d.alfa, 0);

        return [
            { title: 'Total Pengurus', value: displayData.length, icon: 'fas fa-user-tie', color: 'var(--primary)' },
            { title: 'Total Hadir', value: totalHadir, icon: 'fas fa-check-circle', color: 'var(--success)' },
            { title: 'Total Izin', value: totalIzin, icon: 'fas fa-envelope', color: 'var(--warning)' },
            { title: 'Total Alfa', value: totalAlfa, icon: 'fas fa-times-circle', color: 'var(--danger)' }
        ];
    }, [displayData]);

    const handleExport = () => {
        const exportData = displayData.map(d => ({
            'Nama Pengurus': d.nama_pengurus,
            Jabatan: d.jabatan,
            Divisi: d.divisi,
            'Target Tugas': d.total_target,
            'Tugas Selesai': d.hadir,
            Izin: d.izin,
            Alfa: d.alfa,
            '% Kehadiran': d.persentaseKehadiran + '%'
        }));

        exportToExcel(exportData, 'Rekap_Absensi_Pengurus', Object.keys(exportData[0] || {}));
    };

    const columns = [
        { key: 'nama_pengurus', label: 'Nama Pengurus', width: '200px', render: (row) => <div><div style={{ fontWeight: 800 }}>{row.nama_pengurus}</div><small style={{ color: 'var(--text-muted)' }}>{row.jabatan}</small></div> },
        { key: 'divisi', label: 'Divisi', width: '120px', className: 'hide-mobile', render: (row) => <span className="th-badge">{row.divisi}</span> },
        { key: 'total_target', label: 'Target', width: '80px', render: (row) => <strong style={{ fontSize: '1.1rem' }}>{row.total_target}x</strong> },
        {
            key: 'hadir',
            label: 'Tugas',
            width: '80px',
            render: (row) => <span className="th-badge" style={{ background: '#dcfce7', color: '#166534', fontWeight: 800 }}>{row.hadir}x</span>
        },
        {
            key: 'izin',
            label: 'Izin',
            width: '80px',
            className: 'hide-mobile',
            render: (row) => <span className="th-badge" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 800 }}>{row.izin}x</span>
        },
        {
            key: 'alfa',
            label: 'Alfa',
            width: '80px',
            className: 'hide-mobile',
            render: (row) => <span className="th-badge" style={{ background: '#fee2e2', color: '#991b1b', fontWeight: 800 }}>{row.alfa}x</span>
        },
        {
            key: 'persentase',
            label: '% Hadir',
            width: '100px',
            render: (row) => {
                const color = row.persentaseKehadiran >= 80 ? '#166534' : row.persentaseKehadiran >= 60 ? '#92400e' : '#991b1b';
                return <div style={{ fontWeight: 800, color, fontSize: '1rem' }}>{row.persentaseKehadiran}%</div>;
            }
        },
        {
            key: 'actions', label: 'Aksi', width: '80px', render: (row) => (
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
            <KopSurat judul="Riwayat Absensi Pengurus" subJudul="Rekapitulasi kehadiran pengurus dalam rapat dan kegiatan" hideOnScreen={true} />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Rekap Absensi Pengurus"
                subtitle={`Menampilkan ${displayData.length} pengurus`}
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
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari nama / jabatan / divisi..." }}
                filters={
                    <SelectInput value={filterStatus} onChange={e => setFilterStatus(e.target.value)} options={STATUS_OPTIONS} style={{ width: '150px', marginBottom: 0 }} />
                }
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Ringkasan Kehadiran" width="600px">
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(viewData.nama_pengurus)}&background=1e3a8a&color=fff&size=128`}
                                style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '1rem' }}
                                alt=""
                            />
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{viewData.nama_pengurus}</h2>
                            <p style={{ color: 'var(--text-muted)' }}>{viewData.jabatan}</p>
                            <span className="th-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '5px 15px' }}>{viewData.divisi}</span>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '15px', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-muted)' }}>REKAPITULASI KEHADIRAN</h3>
                            <div className="form-grid">
                                <div style={{ textAlign: 'center', padding: '1rem', background: 'white', borderRadius: '12px' }}>
                                    <small style={{ color: 'var(--text-muted)' }}>Target Tugas</small>
                                    <div style={{ fontWeight: 900, fontSize: '2rem', color: 'var(--primary)' }}>{viewData.total_target}</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '1rem', background: '#dcfce7', borderRadius: '12px' }}>
                                    <small style={{ color: '#166534' }}>Tugas Selesai</small>
                                    <div style={{ fontWeight: 900, fontSize: '2rem', color: '#166534' }}>{viewData.hadir}</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '1rem', background: '#fef3c7', borderRadius: '12px' }}>
                                    <small style={{ color: '#92400e' }}>Total Izin</small>
                                    <div style={{ fontWeight: 900, fontSize: '2rem', color: '#92400e' }}>{viewData.izin}</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '1rem', background: '#fee2e2', borderRadius: '12px' }}>
                                    <small style={{ color: '#991b1b' }}>Total Alfa</small>
                                    <div style={{ fontWeight: 900, fontSize: '2rem', color: '#991b1b' }}>{viewData.alfa}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%)', padding: '1.5rem', borderRadius: '15px', color: 'white', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '5px' }}>Persentase Kehadiran</div>
                            <div style={{ fontSize: '3rem', fontWeight: 900 }}>{viewData.persentaseKehadiran}%</div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
