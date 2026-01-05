'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiCall, exportToExcel } from '@/lib/utils';
import { useAuth, usePagePermission } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import Modal from '@/components/Modal';
import { TextInput, SelectInput, NumberInput } from '@/components/FormInput';
import StatsPanel from '@/components/StatsPanel';

const MONTHS = [
    'Muharram', 'Shafar', 'Rabiul Awal', 'Rabiul Akhir', 'Jumadil Awal', 'Jumadil Akhir',
    'Rajab', 'Sya\'ban', 'Ramadhan', 'Syawal', 'Dzulqa\'dah', 'Dzulhijjah'
];

export default function AbsensiPengurusPage() {
    const { user, loading: authLoading } = useAuth();
    const { canEdit } = usePagePermission();
    const { showToast } = useToast();

    // Filters (Default to current Hijri Month/Year)
    const [filterMonth, setFilterMonth] = useState('');
    const [filterYear, setFilterYear] = useState('');

    // Data State
    const [loading, setLoading] = useState(false);
    const [pengurusList, setPengurusList] = useState([]);
    const [absenData, setAbsenData] = useState([]);

    // Form State (Local tracking for inputs)
    const [formState, setFormState] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [expandedSections, setExpandedSections] = useState(['DEWAN HARIAN', 'PLENO']);

    const isMounted = React.useRef(false);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const loadData = useCallback(async () => {
        if (!filterMonth || !filterYear) return;
        if (isMounted.current) setLoading(true);
        try {
            const [resPengurus, resAbsen] = await Promise.all([
                apiCall('getData', 'GET', { type: 'pengurus' }),
                apiCall('getData', 'GET', { type: 'pengurus_absen' })
            ]);

            if (isMounted.current) {
                const activePengurus = (resPengurus || []).filter(p => p.status === 'Aktif');
                setPengurusList(activePengurus);

                const monthAbsen = (resAbsen || []).filter(a => a.bulan === filterMonth && a.tahun === filterYear);

                setAbsenData(monthAbsen);

                const initialState = {};
                activePengurus.forEach(p => {
                    const existing = monthAbsen.find(a => Number(a.pengurus_id) === Number(p.id));
                    initialState[p.id] = {
                        tugas: existing ? existing.tugas : 0,
                        izin: existing ? existing.izin : 0,
                        alfa: existing ? existing.alfa : 0,
                        alasan_izin: existing ? existing.alasan_izin : '',
                        id: existing ? existing.id : null
                    };
                });
                setFormState(initialState);
            }
        } catch (e) {
            console.error(e);
            if (isMounted.current) showToast("Gagal memuat data absensi.", "error");
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }, [filterMonth, filterYear]);

    useEffect(() => {
        const initDate = async () => {
            try {
                // Dynamic import to prevent SSR/Hydration issues
                const momentModule = await import('moment-hijri');
                const moment = momentModule.default || momentModule;

                if (!mounted) {
                    const nowHijri = moment();
                    // Check if iMonth exists
                    if (typeof nowHijri.iMonth === 'function') {
                        const currentHijriMonthIdx = nowHijri.iMonth();
                        const currentHijriYear = nowHijri.iYear();
                        setFilterMonth(MONTHS[currentHijriMonthIdx] || MONTHS[0]);
                        setFilterYear(currentHijriYear ? currentHijriYear.toString() : '1446');
                    } else {
                        // Fallback
                        setFilterMonth(MONTHS[0]);
                        setFilterYear('1446');
                    }
                    setMounted(true);
                }
            } catch (e) {
                console.error("Failed to load moment-hijri:", e);
                setFilterMonth(MONTHS[0]);
                setFilterYear('1446');
                setMounted(true);
            }
        };

        if (!mounted) {
            initDate();
        }
    }, [mounted]);

    useEffect(() => {
        if (mounted && filterMonth && filterYear) {
            loadData();
        }
    }, [mounted, filterMonth, filterYear, loadData]);

    const handleInputChange = (pengurusId, field, value) => {
        setFormState(prev => ({
            ...prev,
            [pengurusId]: {
                ...prev[pengurusId],
                [field]: value
            }
        }));
    };

    const handleSaveAbsensi = async () => {
        setSubmitting(true);
        try {
            const entries = Object.entries(formState);

            // Sequential execution to prevent D1 concurrency issues
            for (const [pid, val] of entries) {
                const pengurus = pengurusList.find(p => Number(p.id) === Number(pid));
                if (!pengurus) continue;

                // 1. Save Attendance
                await apiCall('saveData', 'POST', {
                    type: 'pengurus_absen',
                    data: {
                        id: val.id,
                        pengurus_id: pid,
                        nama_pengurus: pengurus.nama,
                        bulan: filterMonth,
                        tahun: filterYear,
                        tugas: val.tugas,
                        izin: val.izin,
                        alfa: val.alfa,
                        alasan_izin: val.alasan_izin,
                        petugas: user?.fullname || 'Sekretariat'
                    }
                });
            }

            showToast(`Data absensi bulan ${filterMonth} berhasil disimpan!`, "success");
            loadData();
        } catch (e) {
            showToast(e.message || "Gagal menyimpan data.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleExportExcel = () => {
        const sortedList = [...pengurusList].sort((a, b) => (a.jabatan || '').localeCompare(b.jabatan || ''));
        const exportData = sortedList.map(p => {
            const values = formState[p.id] || { tugas: 0, izin: 0, alfa: 0, alasan_izin: '' };
            return {
                'Jabatan / Seksi': p.jabatan || '-',
                'Nama Pengurus': p.nama,
                'Unit': p.divisi || '-',
                'Total Tugas': values.tugas,
                'Total Izin': values.izin,
                'Total Alfa': values.alfa,
                'Keterangan': values.alasan_izin || '-'
            };
        });

        exportToExcel(exportData, `Rekap_Absensi_Pengurus_${filterMonth}_${filterYear}`, ['Jabatan / Seksi', 'Nama Pengurus', 'Unit', 'Total Tugas', 'Total Izin', 'Total Alfa', 'Keterangan']);
    };

    const toggleSection = (section) => {
        setExpandedSections(prev =>
            prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
        );
    };

    // Grouping logic (2-level: Division -> Jabatan)
    const groupedData = useMemo(() => {
        const divisions = {
            'DEWAN HARIAN': {},
            'PLENO': {},
            'LAINNYA': {}
        };

        pengurusList.forEach(p => {
            const div = (p.divisi || 'LAINNYA').toUpperCase();
            const role = p.jabatan || 'Lainnya';
            const targetDiv = divisions[div] ? div : 'PLENO'; // Map unknown to PLENO as fallback or LAINNYA

            if (!divisions[targetDiv][role]) divisions[targetDiv][role] = [];
            divisions[targetDiv][role].push(p);
        });

        // Remove empty divisions
        if (Object.keys(divisions['LAINNYA']).length === 0) delete divisions['LAINNYA'];

        return divisions;
    }, [pengurusList]);

    const statsItems = useMemo(() => {
        const totalPengurus = pengurusList.length;
        const totalTugas = Object.values(formState).reduce((acc, curr) => acc + Number(curr.tugas || 0), 0);
        const totalIzin = Object.values(formState).reduce((acc, curr) => acc + Number(curr.izin || 0), 0);
        return [
            { title: 'Total Pengurus', value: totalPengurus, icon: 'fas fa-user-tie', color: 'var(--primary)' },
            { title: 'Total Tugas Bulan Ini', value: totalTugas, icon: 'fas fa-check-circle', color: 'var(--success)' },
            { title: 'Total Izin', value: totalIzin, icon: 'fas fa-envelope-open-text', color: 'var(--warning)' }
        ];
    }, [pengurusList, formState]);

    if (!mounted) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
            <div style={{ textAlign: 'center' }}>
                <i className="fas fa-circle-notch fa-spin fa-2x" style={{ color: 'var(--primary)', marginBottom: '1rem' }}></i>
                <p style={{ fontWeight: 600, color: '#64748b' }}>Menyiapkan Dashboard Absensi...</p>
            </div>
        </div>
    );

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Rekapitulasi Absensi Pengurus" subJudul={`Laporan kinerja bulanan pengurus Pondok Pesantren - ${filterMonth} ${filterYear}`} hideOnScreen={true} />

            <div className="filter-card card-glass" style={{ marginBottom: '20px', padding: '20px', borderRadius: '15px' }}>
                <div className="filter-grid" style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div className="filter-col" style={{ flex: 1, minWidth: '150px' }}>
                        <SelectInput label="Pilih Bulan" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} options={MONTHS} style={{ marginBottom: 0 }} />
                    </div>
                    <div className="filter-col" style={{ flex: 1, minWidth: '100px' }}>
                        <SelectInput label="Pilih Tahun" value={filterYear} onChange={e => setFilterYear(e.target.value)} options={['1445', '1446', '1447', '1448', '1449']} style={{ marginBottom: 0 }} />
                    </div>
                    <div className="filter-actions" style={{ flex: '0 0 100%', display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button className="btn btn-outline" onClick={() => window.location.href = '/sekretariat/absen-pengurus/riwayat'} style={{ height: '45px' }}>
                            <i className="fas fa-history"></i> <span className="hide-mobile">Riwayat</span>
                        </button>
                        <button className="btn btn-outline" onClick={handleExportExcel} style={{ height: '45px' }}>
                            <i className="fas fa-file-excel"></i> <span className="hide-mobile">Export Excel</span>
                        </button>
                        <button className="btn btn-primary" onClick={handleSaveAbsensi} disabled={submitting || !canEdit} style={{ height: '45px', flex: 1 }}>
                            <i className="fas fa-save"></i> <span>{submitting ? 'Menyimpan...' : 'Simpan Absensi'}</span>
                        </button>
                    </div>
                </div>
            </div>

            <StatsPanel items={statsItems} />

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}><i className="fas fa-spinner fa-spin fa-2x"></i><p>Memuat data...</p></div>
            ) : (
                Object.entries(groupedData).map(([divName, roles]) => (
                    <div key={divName} className="division-section" style={{ marginBottom: '40px' }}>
                        {/* Division Accordion Header */}
                        <div
                            onClick={() => toggleSection(divName)}
                            style={{
                                background: 'white',
                                padding: '1.25rem 1.5rem',
                                borderRadius: '18px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                border: '1px solid #e2e8f0',
                                marginBottom: '20px',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                                transition: 'all 0.3s'
                            }}
                            className="accordion-header"
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{
                                    width: '45px', height: '45px', borderRadius: '14px',
                                    background: divName === 'DEWAN HARIAN' ? '#eff6ff' : '#f0fdf4',
                                    color: divName === 'DEWAN HARIAN' ? '#2563eb' : '#16a34a',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
                                }}>
                                    <i className={divName === 'DEWAN HARIAN' ? 'fas fa-landmark' : 'fas fa-users-cog'}></i>
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>{divName}</h2>
                                    <small style={{ color: '#64748b', fontWeight: 600 }}>{Object.values(roles).flat().length} Pengurus Terdata</small>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <span className="th-badge" style={{ background: '#f1f5f9' }}>{Object.keys(roles).length} Kelompok Bidang</span>
                                <i className={`fas fa-chevron-${expandedSections.includes(divName) ? 'up' : 'down'}`} style={{ color: '#94a3b8' }}></i>
                            </div>
                        </div>

                        {/* Subgroups (Jabatan) */}
                        {expandedSections.includes(divName) && (
                            <div className="animate-in" style={{ paddingLeft: '10px' }}>
                                {Object.entries(roles).map(([role, list]) => (
                                    <div key={role} style={{ marginBottom: '30px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', borderLeft: '4px solid var(--primary)', paddingLeft: '15px' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-dark)', margin: 0 }}>Jabatan / Seksi: {role}</h3>
                                            <span className="th-badge" style={{ fontSize: '0.7rem' }}>{list.length} Orang</span>
                                        </div>

                                        <div className="table-wrapper">
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th>Nama Pengurus</th>
                                                        <th width="120px">Tugas</th>
                                                        <th width="120px">Izin</th>
                                                        <th width="120px">Alfa</th>
                                                        <th>Alasan Izin / Keterangan</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {list.map(p => {
                                                        const values = formState[p.id] || { tugas: 0, izin: 0, alfa: 0, alasan_izin: '' };

                                                        return (
                                                            <tr key={p.id}>
                                                                <td><strong>{p.nama}</strong></td>
                                                                <td>
                                                                    <input type="number" className="form-control-sm" value={values.tugas} onChange={e => handleInputChange(p.id, 'tugas', e.target.value)} style={{ width: '80px', textAlign: 'center' }} />
                                                                </td>
                                                                <td>
                                                                    <input type="number" className="form-control-sm" value={values.izin} onChange={e => handleInputChange(p.id, 'izin', e.target.value)} style={{ width: '80px', textAlign: 'center' }} />
                                                                </td>
                                                                <td>
                                                                    <input type="number" className="form-control-sm" value={values.alfa} onChange={e => handleInputChange(p.id, 'alfa', e.target.value)} style={{ width: '80px', textAlign: 'center' }} />
                                                                </td>
                                                                <td>
                                                                    <input type="text" className="form-control-sm" placeholder="Alasan..." value={values.alasan_izin} onChange={e => handleInputChange(p.id, 'alasan_izin', e.target.value)} style={{ width: '100%' }} />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}
