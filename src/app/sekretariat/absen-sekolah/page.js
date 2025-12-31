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

export default function AbsenSekolahPage() {
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
    const [filterJenjang, setFilterJenjang] = useState('SMP/MTS'); // SMP/MTS or SMA/MA
    const [filterSemester, setFilterSemester] = useState('1'); // 1-6
    const [filterDate, setFilterDate] = useState('');

    useEffect(() => {
        isMounted.current = true;
        setFilterDate(new Date().toISOString().split('T')[0]);
        return () => { isMounted.current = false; };
    }, []);

    const loadData = async () => {
        if (!filterDate) return;
        if (isMounted.current) setLoading(true);
        try {
            // 1. Ambil data santri dari database pusat
            const resSantri = await apiCall('getData', 'GET', { type: 'santri' });

            // 2. Filter santri berdasarkan kriteria (Jenjang & Semester)
            // Catatan: Logika filter ini menyesuaikan data di database santri Anda.
            // Di sini saya mengasumsikan kita memilah berdasarkan metadata yang ada.
            const students = (resSantri || []).filter(s => {
                const jenjangMatch = (filterJenjang === 'SMP/MTS' && (s.madrasah === 'MTs' || s.madrasah === 'SMP')) ||
                    (filterJenjang === 'SMA/MA' && (s.madrasah === 'MA' || s.madrasah === 'SMA'));

                // Semester biasanya berkorelasi dengan kelas
                // Contoh: Semester 1-2 (Kelas 7/10), 3-4 (Kelas 8/11), 5-6 (Kelas 9/12)
                const semesterInt = parseInt(filterSemester);
                const gradeLevel = Math.ceil(semesterInt / 2); // 1, 2, 3

                // Logika pencocokan kelas (menyesuaikan format data Anda)
                const isCorrectSemester = s.kelas && (
                    (gradeLevel === 1 && (s.kelas.includes('7') || s.kelas.includes('10') || s.kelas.toLowerCase().includes('ula'))) ||
                    (gradeLevel === 2 && (s.kelas.includes('8') || s.kelas.includes('11') || s.kelas.toLowerCase().includes('wustho'))) ||
                    (gradeLevel === 3 && (s.kelas.includes('9') || s.kelas.includes('12') || s.kelas.toLowerCase().includes('ulya')))
                );

                return jenjangMatch && isCorrectSemester && s.status_santri === 'Aktif';
            }).sort((a, b) => a.nama_siswa.localeCompare(b.nama_siswa));

            if (isMounted.current) setSantriList(students);

            // 3. Ambil data absensi yang sudah ada
            const resAbsen = await apiCall('getData', 'GET', { type: 'absen_sekolah' });
            const logs = (resAbsen || []).filter(l => l.tanggal === filterDate && l.jenjang === filterJenjang && l.semester === filterSemester);

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

    useEffect(() => { loadData(); }, [filterDate, filterJenjang, filterSemester]);

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
                return apiCall('saveData', 'POST', {
                    type: 'absen_sekolah',
                    data: {
                        id: data.id,
                        santri_id: s.id,
                        nama_santri: s.nama_siswa,
                        kelas: s.kelas,
                        tanggal: filterDate,
                        jenjang: filterJenjang,
                        semester: filterSemester,
                        status: data.status,
                        keterangan: data.keterangan || '',
                        petugas: user?.fullname || 'Admin Sekolah'
                    }
                });
            });
            await Promise.all(promises);
            if (isMounted.current) {
                showToast(`Absensi ${filterJenjang} Semester ${filterSemester} berhasil disimpan!`, "success");
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
                    <small style={{ color: 'var(--text-muted)' }}>{row.stambuk_pondok} • Kelas {row.kelas}</small>
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
            <KopSurat judul="Laporan Kehadiran Sekolah" subJudul={`Jenjang ${filterJenjang} - Semester ${filterSemester}`} hideOnScreen={true} />

            <StatsPanel items={stats} />

            {/* Filter & Kontrol */}
            <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '20px', marginBottom: '1.5rem', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1 1 200px' }}>
                        <label className="form-label">Tanggal</label>
                        <TextInput type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ marginBottom: 0 }} />
                    </div>

                    <div style={{ flex: '1 1 200px' }}>
                        <label className="form-label">Pilih Jenjang Sekolah</label>
                        <div style={{ display: 'flex', background: '#f1f5f9', padding: '5px', borderRadius: '12px' }}>
                            {['SMP/MTS', 'SMA/MA'].map(j => (
                                <button
                                    key={j}
                                    onClick={() => setFilterJenjang(j)}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                                        fontWeight: 800, fontSize: '0.8rem',
                                        background: filterJenjang === j ? 'var(--primary)' : 'transparent',
                                        color: filterJenjang === j ? 'white' : '#64748b',
                                        transition: 'all 0.3s'
                                    }}
                                >{j}</button>
                            ))}
                        </div>
                    </div>

                    <div style={{ flex: '1 1 300px' }}>
                        <label className="form-label">Semester</label>
                        <div style={{ display: 'flex', background: '#f1f5f9', padding: '5px', borderRadius: '12px', gap: '5px' }}>
                            {['1', '2', '3', '4', '5', '6'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setFilterSemester(s)}
                                    style={{
                                        flex: 1, padding: '10px 0', borderRadius: '8px', border: 'none',
                                        fontWeight: 800,
                                        background: filterSemester === s ? 'var(--primary)' : 'transparent',
                                        color: filterSemester === s ? 'white' : '#64748b',
                                        transition: 'all 0.3s'
                                    }}
                                >{s}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <DataViewContainer
                title={`Daftar Absensi ${filterJenjang}`}
                subtitle={`Semester ${filterSemester} | ${santriList.length} Santri`}
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

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleSave}
                title="Simpan Absensi Harian?"
                message={`Anda akan menyimpan log kehadiran untuk ${santriList.length} santri pada tanggal ${formatDate(filterDate)}.`}
                type="info"
            />

            <style jsx>{`
                .form-label {
                    display: block;
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: var(--primary-dark);
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                @media (max-width: 640px) {
                    .hide-mobile { display: none; }
                    .btn { padding: 12px; }
                }
            `}</style>
        </div>
    );
}
