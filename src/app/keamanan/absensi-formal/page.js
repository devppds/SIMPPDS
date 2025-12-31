'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth, usePagePermission } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { TextInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

const FORMAL_GROUPS = [
    'SMP / MTS',
    'SMA / SMK',
    'Strata 1 - Smt 1-2',
    'Strata 1 - Smt 3-4',
    'Strata 1 - Smt 5-6',
    'Strata 1 - Smt 7-8',
    'Magister - Smt 1-2',
    'Magister - Smt 3-4'
];

export default function AbsensiFormalPage() {
    const { user } = useAuth();
    const { canEdit } = usePagePermission();
    const { showToast } = useToast();

    // State
    const [loading, setLoading] = useState(false);
    const [santriList, setSantriList] = useState([]);
    const [state, setState] = useState({});
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const isMounted = React.useRef(true);

    // Filters
    const [filterGroup, setFilterGroup] = useState('Semua');
    const [filterDate, setFilterDate] = useState('');
    const [mappedSantriStore, setMappedSantriStore] = useState([]);

    useEffect(() => {
        isMounted.current = true;
        setFilterDate(new Date().toISOString().split('T')[0]);
        return () => { isMounted.current = false; };
    }, []);

    const loadData = async () => {
        if (!filterDate) return;
        if (isMounted.current) setLoading(true);
        try {
            // 1. Ambil data santri dan data pemetaan formal
            const [resSantri, resMapping] = await Promise.all([
                apiCall('getData', 'GET', { type: 'santri' }),
                apiCall('getData', 'GET', { type: 'keamanan_formal_mapping' })
            ]);

            const mappingData = resMapping || [];
            if (isMounted.current) setMappedSantriStore(mappingData);

            // 2. Filter santri berdasarkan kelompok yang dipilih
            const students = (resSantri || []).filter(s => {
                const map = mappingData.find(m => m.santri_id === s.id);
                if (!map) return false;

                const groupMatch = filterGroup === 'Semua' || map.kelompok_formal === filterGroup;
                return groupMatch && s.status_santri === 'Aktif';
            }).sort((a, b) => a.nama_siswa.localeCompare(b.nama_siswa));

            if (isMounted.current) setSantriList(students);

            // 3. Ambil data absensi yang sudah ada
            const resAbsen = await apiCall('getData', 'GET', { type: 'absen_sekolah' });
            const logs = (resAbsen || []).filter(l => l.tanggal === filterDate && (filterGroup === 'Semua' || l.kelompok_formal === filterGroup));

            const newState = {};
            students.forEach(s => {
                const log = logs.find(l => l.santri_id === s.id);
                newState[s.id] = {
                    status: log ? log.status : 'H', // Default Hadir (H)
                    id: log ? log.id : null,
                    keterangan: log ? log.keterangan : ''
                };
            });
            if (isMounted.current) setState(newState);
        } catch (e) {
            console.error("Load Data Error:", e);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [filterDate, filterGroup]);

    const handleBulkHadir = () => {
        const newState = { ...state };
        santriList.forEach(s => {
            newState[s.id] = { ...newState[s.id], status: 'H' };
        });
        setState(newState);
        showToast(`Semua santri diatur Hadir (H)`, "info");
    };

    const handleSave = async () => {
        if (isMounted.current) setLoading(true);
        try {
            const promises = santriList.map(s => {
                const data = state[s.id];
                const map = mappedSantriStore.find(m => m.santri_id === s.id);

                return apiCall('saveData', 'POST', {
                    type: 'absen_sekolah',
                    data: {
                        id: data.id,
                        santri_id: s.id,
                        nama_santri: s.nama_siswa,
                        kelas: s.kelas,
                        tanggal: filterDate,
                        kelompok_formal: map?.kelompok_formal || filterGroup,
                        status: data.status,
                        keterangan: data.keterangan || '',
                        petugas: user?.fullname || 'Admin Sekolah'
                    }
                });
            });
            await Promise.all(promises);
            if (isMounted.current) {
                showToast(`Absensi ${filterGroup} berhasil disimpan!`, "success");
                loadData();
            }
        } catch (e) {
            if (isMounted.current) showToast(e.message, "error");
        } finally {
            if (isMounted.current) {
                setLoading(false);
                setIsConfirmOpen(false);
            }
        }
    };

    const stats = useMemo(() => {
        const values = Object.values(state);
        return [
            { title: 'Total Santri', value: santriList.length, icon: 'fas fa-users', color: 'var(--primary)' },
            { title: 'Hadir', value: values.filter(v => v.status === 'H').length, icon: 'fas fa-user-check', color: 'var(--success)' },
            { title: 'Izin/Sakit', value: values.filter(v => ['I', 'S'].includes(v.status)).length, icon: 'fas fa-envelope', color: 'var(--warning)' },
            { title: 'Alfa', value: values.filter(v => v.status === 'A').length, icon: 'fas fa-user-times', color: 'var(--danger)' }
        ];
    }, [state, santriList]);

    const columns = [
        {
            key: 'nama_siswa',
            label: 'Nama Santri',
            render: (row) => (
                <div>
                    <div style={{ fontWeight: 800 }}>{row.nama_siswa}</div>
                    <small style={{ color: 'var(--text-muted)' }}>{row.stambuk_pondok} • MIU {row.kelas}</small>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status Kehadiran',
            width: '180px',
            render: (row) => (
                <div style={{ display: 'flex', gap: '5px' }}>
                    {['H', 'S', 'I', 'A'].map(st => (
                        <button
                            key={st}
                            onClick={() => canEdit && setState({ ...state, [row.id]: { ...state[row.id], status: st } })}
                            disabled={!canEdit}
                            className={`btn-vibrant ${state[row.id]?.status === st ? 'btn-vibrant-blue' : 'btn-vibrant-gray'}`}
                            style={{ width: '35px', height: '35px', padding: 0, fontSize: '0.8rem', fontWeight: 800 }}
                        >{st}</button>
                    ))}
                </div>
            )
        },
        {
            key: 'keterangan',
            label: 'Keterangan',
            render: (row) => (
                <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Alasan (Opsional)..."
                    value={state[row.id]?.keterangan || ''}
                    onChange={e => canEdit && setState({ ...state, [row.id]: { ...state[row.id], keterangan: e.target.value } })}
                    disabled={!canEdit}
                />
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Laporan Kehadiran Formal" subJudul={`Kelompok: ${filterGroup}`} hideOnScreen={true} />

            {/* Group Selection Grid */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--primary-dark)' }}>
                    <i className="fas fa-layer-group" style={{ marginRight: '10px' }}></i> Pilih Kelompok Sekolah
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
                    {FORMAL_GROUPS.map((g, i) => (
                        <div
                            key={i}
                            onClick={() => setFilterGroup(g)}
                            className={`card-glass ${filterGroup === g ? 'active-group-card' : ''}`}
                            style={{
                                padding: '1.25rem',
                                borderRadius: '18px',
                                cursor: 'pointer',
                                border: filterGroup === g ? '2px solid var(--primary)' : '1px solid #f1f5f9',
                                transition: 'all 0.3s',
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '100px'
                            }}
                        >
                            <i className={`fas ${g.includes('SMP') ? 'fa-school' : g.includes('SMA') ? 'fa-building-columns' : 'fa-university'}`}
                                style={{ fontSize: '1.5rem', marginBottom: '10px', color: filterGroup === g ? 'var(--primary)' : '#94a3b8' }}></i>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{g}</div>
                        </div>
                    ))}
                </div>
            </div>

            {filterGroup !== 'Semua' && (
                <>
                    <StatsPanel items={stats} />

                    {/* Header Kontrol */}
                    <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '20px', marginBottom: '1.5rem', background: 'var(--primary-light)', border: '1px solid var(--primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-dark)' }}>KELOMPOK AKTIF</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{filterGroup}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <label className="form-label" style={{ marginBottom: 0 }}>Tanggal:</label>
                                <TextInput type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ width: '180px', marginBottom: 0 }} />
                            </div>
                        </div>
                    </div>

                    <DataViewContainer
                        title="Daftar Absensi"
                        subtitle={`Daftar santri di ${filterGroup} | ${santriList.length} Santri`}
                        headerActions={(
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="btn btn-secondary" onClick={handleBulkHadir} disabled={loading || santriList.length === 0}>
                                    <i className="fas fa-check-double"></i> <span className="hide-mobile">Semua Hadir</span>
                                </button>
                                {canEdit && <button className="btn btn-primary" onClick={() => setIsConfirmOpen(true)} disabled={loading || santriList.length === 0}>
                                    <i className="fas fa-save"></i> <span className="hide-mobile">Simpan Data</span>
                                </button>}
                            </div>
                        )}
                        tableProps={{ columns, data: santriList, loading }}
                    />
                </>
            )}

            {filterGroup === 'Semua' && (
                <div className="card-glass" style={{ textAlign: 'center', padding: '4rem 2rem', borderRadius: '30px', color: '#94a3b8' }}>
                    <i className="fas fa-arrow-up" style={{ fontSize: '3rem', marginBottom: '1.5rem', opacity: 0.3 }}></i>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Silakan Pilih Kelompok</h3>
                    <p>Klik salah satu kartu kelompok di atas untuk menginput absensi formal hari ini.</p>
                </div>
            )}

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleSave}
                title="Simpan Absensi Harian?"
                message={`Anda akan menyimpan log kehadiran untuk ${santriList.length} santri pada tanggal ${formatDate(filterDate)}.`}
                type="info"
            />

            <style jsx>{`
                .active-group-card {
                    background: var(--primary-light) !important;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    transform: translateY(-5px);
                }
                .form-label {
                    display: block;
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: var(--primary-dark);
                    text-transform: uppercase;
                }
                @media (max-width: 640px) {
                    .hide-mobile { display: none; }
                }
            `}</style>
        </div>
    );
}
