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

export default function MurottilMalamPage() {
    const { user } = useAuth();
    const { canEdit } = usePagePermission();
    const { showToast } = useToast();

    // State
    const [loading, setLoading] = useState(false);
    const [santriList, setSantriList] = useState([]);
    const [state, setState] = useState({});
    const [filterDate, setFilterDate] = useState('');
    const [filterKelompok, setFilterKelompok] = useState('Semua');
    const [kelompokList, setKelompokList] = useState([]);
    const [mappedSantri, setMappedSantri] = useState([]);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const isMounted = React.useRef(true);

    useEffect(() => {
        isMounted.current = true;
        setFilterDate(new Date().toISOString().split('T')[0]);
        return () => { isMounted.current = false; };
    }, []);

    const loadInitialData = async () => {
        if (isMounted.current) setLoading(true);
        try {
            const [resPengurus, resMapping] = await Promise.all([
                apiCall('getData', 'GET', { type: 'wajar_pengurus' }),
                apiCall('getData', 'GET', { type: 'wajar_kelompok_mapping' })
            ]);
            if (isMounted.current) {
                const groups = (resPengurus || []).filter(p => p.jabatan === 'Murottil Malam');
                const groupNames = groups.map(g => g.kelompok);

                setKelompokList(groups);
                // Filter mapped santri to only those in the correctly categorized groups
                setMappedSantri((resMapping || []).filter(m => groupNames.includes(m.kelompok)));
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    useEffect(() => { loadInitialData(); }, []);

    const loadAttendanceData = async () => {
        if (!filterDate) return;
        if (isMounted.current) setLoading(true);
        try {
            const [resAbsen, resNilai] = await Promise.all([
                apiCall('getData', 'GET', { type: 'wajar_mhm_absen' }),
                apiCall('getData', 'GET', { type: 'wajar_nilai' })
            ]);

            const logsAbsen = (resAbsen || []).filter(l => l.tanggal === filterDate && l.tipe === 'Murottil Malam');
            const logsNilai = (resNilai || []).filter(l => l.tanggal === filterDate && l.tipe === 'Murottil Malam');

            const newState = {};
            const relevantSantriIds = mappedSantri
                .filter(m => filterKelompok === 'Semua' || m.kelompok === filterKelompok)
                .map(m => m.santri_id);

            relevantSantriIds.forEach(sid => {
                const logAbsen = logsAbsen.find(l => Number(l.santri_id) === Number(sid));
                const logNilai = logsNilai.find(l => Number(l.santri_id) === Number(sid));
                newState[sid] = {
                    status: logAbsen ? logAbsen.status : 'H',
                    nilai: logNilai ? logNilai.nilai : '',
                    materi: logNilai ? logNilai.materi : '',
                    id_absen: logAbsen ? logAbsen.id : null,
                    id_nilai: logNilai ? logNilai.id : null
                };
            });
            if (isMounted.current) setState(newState);
        } catch (e) {
            console.error(e);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    useEffect(() => { loadAttendanceData(); }, [filterDate, filterKelompok, mappedSantri]);

    const activeKelompokData = useMemo(() => {
        if (filterKelompok === 'Semua') return null;
        return kelompokList.find(k => k.kelompok === filterKelompok);
    }, [filterKelompok, kelompokList]);

    const filteredSantri = useMemo(() => {
        if (filterKelompok === 'Semua') return [];
        return mappedSantri.filter(m => m.kelompok === filterKelompok);
    }, [mappedSantri, filterKelompok]);

    const handleBulkHadir = () => {
        const newState = { ...state };
        filteredSantri.forEach(s => {
            newState[s.santri_id] = { ...newState[s.santri_id], status: 'H' };
        });
        setState(newState);
        showToast("Semua santri diatur Hadir (H)", "info");
    };

    const handleSave = async () => {
        if (isMounted.current) setLoading(true);
        try {
            const promises = filteredSantri.map(s => {
                const data = state[s.santri_id] || { status: 'H', nilai: '', materi: '' };
                const p1 = apiCall('saveData', 'POST', {
                    type: 'wajar_mhm_absen',
                    data: {
                        id: data.id_absen, santri_id: s.santri_id, nama_santri: s.nama_santri,
                        tanggal: filterDate, status: data.status,
                        tipe: 'Murottil Malam', petugas: user?.fullname || 'Admin'
                    }
                });
                const p2 = apiCall('saveData', 'POST', {
                    type: 'wajar_nilai',
                    data: {
                        id: data.id_nilai, santri_id: s.santri_id, nama_santri: s.nama_santri,
                        tanggal: filterDate, tipe: 'Murottil Malam', nilai: data.nilai,
                        materi: data.materi, petugas: user?.fullname || 'Admin'
                    }
                });
                return Promise.all([p1, p2]);
            });
            await Promise.all(promises);
            if (isMounted.current) {
                showToast("Data Murottil Malam & Nilai berhasil disimpan!", "success");
                loadAttendanceData();
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
        const countHadir = Object.values(state).filter(v => v.status === 'H').length;
        const countNilai = Object.values(state).filter(v => v.nilai !== '').length;

        return [
            { title: 'Total Santri', value: filteredSantri.length, icon: 'fas fa-users', color: 'var(--primary)' },
            { title: 'Hadir', value: countHadir, icon: 'fas fa-user-check', color: 'var(--success)' },
            { title: 'Nilai Terisi', value: countNilai, icon: 'fas fa-star', color: 'var(--warning)' }
        ];
    }, [state, filteredSantri]);

    const columns = [
        { key: 'nama_santri', label: 'Santri', render: (row) => <strong>{row.nama_santri}</strong> },
        {
            key: 'status', label: 'Absen', width: '150px', render: (row) => (
                <div style={{ display: 'flex', gap: '5px' }}>
                    {['H', 'S', 'I', 'A'].map(st => (
                        <button
                            key={st}
                            onClick={() => canEdit && setState({ ...state, [row.santri_id]: { ...state[row.santri_id], status: st } })}
                            disabled={!canEdit}
                            className={`btn-vibrant ${state[row.santri_id]?.status === st ? 'btn-vibrant-blue' : 'btn-vibrant-gray'}`}
                            style={{ width: '30px', height: '30px', padding: 0, fontSize: '0.7rem' }}
                        >{st}</button>
                    ))}
                </div>
            )
        },
        { key: 'materi', label: 'Materi / Surah', render: (row) => <input type="text" className="form-control form-control-sm" style={{ border: '1px solid #e2e8f0' }} value={state[row.santri_id]?.materi || ''} onChange={e => canEdit && setState({ ...state, [row.santri_id]: { ...state[row.santri_id], materi: e.target.value } })} disabled={!canEdit} placeholder="Halaman/Ayat..." /> },
        { key: 'nilai', label: 'Nilai', width: '80px', render: (row) => <input type="text" className="form-control form-control-sm" style={{ textAlign: 'center', fontWeight: 800 }} value={state[row.santri_id]?.nilai || ''} onChange={e => canEdit && setState({ ...state, [row.santri_id]: { ...state[row.santri_id], nilai: e.target.value } })} disabled={!canEdit} placeholder="0-100" /> }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Murottil Malam & Penilaian" subJudul="Evaluasi bacaan Al-Qur'an santri MHM Ibtida'iyyah." hideOnScreen={true} />

            {/* Kelompok Selection Grid */}
            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '15px' }}>Pilih Kelompok Murottil</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                    {kelompokList.filter(k => (k.jabatan || '').toLowerCase().includes('murottil')).map((k, i) => (
                        <div
                            key={i}
                            onClick={() => setFilterKelompok(k.kelompok)}
                            className={`card-glass ${filterKelompok === k.kelompok ? 'active-card' : ''}`}
                            style={{
                                padding: '15px',
                                borderRadius: '15px',
                                cursor: 'pointer',
                                border: filterKelompok === k.kelompok ? '2px solid var(--primary)' : '1px solid #f1f5f9',
                                transition: 'all 0.3s'
                            }}
                        >
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>{k.jabatan}</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, margin: '5px 0' }}>{k.kelompok}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--primary-dark)' }}>
                                <i className="fas fa-user-tie" style={{ marginRight: '5px' }}></i> {k.nama_pengurus}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {filterKelompok !== 'Semua' && (
                <>
                    <StatsPanel items={stats} />

                    <div className="card-glass active-group-header" style={{ padding: '20px', borderRadius: '20px', marginBottom: '20px', background: 'var(--primary-light)', border: '1px solid var(--primary)' }}>
                        <div className="header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-dark)' }}>KELOMPOK AKTIF</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{filterKelompok}</div>
                                <div style={{ fontWeight: 600 }}>Pembimbing: <span style={{ fontWeight: 800 }}>{activeKelompokData?.nama_pengurus}</span></div>
                            </div>
                            <div className="filter-item" style={{ minWidth: '180px' }}>
                                <TextInput type="date" label="Pilih Tanggal" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ marginBottom: 0 }} />
                            </div>
                        </div>
                    </div>

                    <DataViewContainer
                        title="Input Kehadiran & Nilai"
                        subtitle={`Daftar santri kelompok ${activeKelompokData?.kelompok}`}
                        headerActions={canEdit && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <button className="btn btn-outline btn-sm" onClick={() => window.location.href = '/wajar-murottil/riwayat-absensi'}>
                                    <i className="fas fa-history"></i> <span>Riwayat</span>
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={handleBulkHadir} disabled={loading || filteredSantri.length === 0}>
                                    <i className="fas fa-check-double"></i> <span>Semua Hadir</span>
                                </button>
                                <button className="btn btn-primary btn-sm" onClick={() => setIsConfirmOpen(true)} disabled={loading || filteredSantri.length === 0}>
                                    <i className="fas fa-save"></i> <span>Simpan</span>
                                </button>
                            </div>
                        )}
                        tableProps={{ columns, data: filteredSantri, loading }}
                    />
                </>
            )}

            {filterKelompok === 'Semua' && (
                <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
                    <i className="fas fa-hand-pointer" style={{ fontSize: '3rem', marginBottom: '20px', opacity: 0.3 }}></i>
                    <p>Silakan pilih kelompok terlebih dahulu untuk menginput absensi.</p>
                </div>
            )}

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleSave}
                title="Konfirmasi Berkas"
                message="Anda akan menyimpan log kehadiran beserta nilai murottil untuk seluruh santri yang tampil."
                type="info"
            />

        </div>
    );
}


