'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth, usePagePermission } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { TextInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function WajibBelajarPage() {
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
                setKelompokList(resPengurus || []);
                setMappedSantri(resMapping || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    useEffect(() => { loadInitialData(); }, []);

    const loadAttendanceData = useCallback(async () => {
        if (!filterDate) return;
        if (isMounted.current) setLoading(true);
        try {
            const resAbsen = await apiCall('getData', 'GET', { type: 'wajar_mhm_absen' });
            const logs = (resAbsen || []).filter(l => l.tanggal === filterDate && l.tipe === 'Wajib Belajar');

            const newState = {};
            const relevantSantriIds = mappedSantri
                .filter(m => filterKelompok === 'Semua' || m.kelompok === filterKelompok)
                .map(m => m.santri_id);

            relevantSantriIds.forEach(sid => {
                const log = logs.find(l => l.santri_id === sid);
                newState[sid] = { status: log ? log.status : 'H', id: log ? log.id : null };
            });
            if (isMounted.current) setState(newState);
        } catch (e) {
            console.error(e);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }, [filterDate, filterKelompok, mappedSantri]);

    useEffect(() => { loadAttendanceData(); }, [loadAttendanceData]);

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
                const data = state[s.santri_id] || { status: 'H', id: null };
                return apiCall('saveData', 'POST', {
                    type: 'wajar_mhm_absen',
                    data: {
                        id: data.id, santri_id: s.santri_id, nama_santri: s.nama_santri,
                        tanggal: filterDate, status: data.status,
                        tipe: 'Wajib Belajar', petugas: user?.fullname || 'Admin'
                    }
                });
            });
            await Promise.all(promises);
            if (isMounted.current) {
                showToast("Presensi Wajib Belajar berhasil disimpan!", "success");
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
        const values = Object.values(state);
        return [
            { title: 'Total Santri', value: filteredSantri.length, icon: 'fas fa-users', color: 'var(--primary)' },
            { title: 'Hadir', value: values.filter(v => v.status === 'H').length, icon: 'fas fa-check-double', color: 'var(--success)' },
            { title: 'Alfa / Bolos', value: values.filter(v => v.status === 'A').length, icon: 'fas fa-user-times', color: 'var(--danger)' }
        ];
    }, [state, filteredSantri]);

    const columns = [
        { key: 'nama_santri', label: 'Nama Santri', render: (row) => <strong>{row.nama_santri}</strong> },
        {
            key: 'status', label: 'Presensi', render: (row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    {['H', 'S', 'I', 'A'].map(st => (
                        <button key={st} onClick={() => canEdit && setState({ ...state, [row.santri_id]: { ...state[row.santri_id], status: st } })}
                            disabled={!canEdit}
                            className={`btn-vibrant ${state[row.santri_id]?.status === st ? 'btn-vibrant-blue' : 'btn-vibrant-gray'}`}
                            style={{ width: '40px', height: '35px', padding: 0, fontWeight: 800 }}>
                            {st}
                        </button>
                    ))}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Presensi Wajib Belajar Malam" subJudul="Santri MIU Ibtida'iyyah & Madin Ula." hideOnScreen={true} />

            {/* Kelompok Selection Grid */}
            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '15px' }}>Pilih Kelompok Wajar</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                    {kelompokList.filter(k => {
                        const j = (k.jabatan || '').toLowerCase();
                        return j.includes('wajar') || j.includes('wajib belajar');
                    }).map((k, i) => (
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

                    <div className="card-glass" style={{ padding: '20px', borderRadius: '20px', marginBottom: '20px', background: 'var(--primary-light)', border: '1px solid var(--primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-dark)' }}>KELOMPOK AKTIF</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{filterKelompok}</div>
                                <div style={{ fontWeight: 600 }}>Pembimbing: <span style={{ fontWeight: 800 }}>{activeKelompokData?.nama_pengurus}</span></div>
                            </div>
                            <TextInput type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ width: '180px', marginBottom: 0 }} />
                        </div>
                    </div>

                    <DataViewContainer
                        title="Input Kehadiran Wajib Belajar"
                        subtitle={`Daftar santri kelompok ${activeKelompokData?.kelompok}`}
                        headerActions={canEdit && (
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="btn btn-secondary" onClick={handleBulkHadir} disabled={loading || filteredSantri.length === 0}>
                                    <i className="fas fa-check-double"></i> <span className="hide-mobile">Semua Hadir</span>
                                </button>
                                <button className="btn btn-primary" onClick={() => setIsConfirmOpen(true)} disabled={loading || filteredSantri.length === 0}>
                                    <i className="fas fa-save"></i> <span className="hide-mobile">Simpan Data</span>
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
                    <p>Silakan pilih kelompok terlebih dahulu untuk menginput kehadiran.</p>
                </div>
            )}

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleSave}
                title="Simpan Presensi?"
                message="Data ini akan masuk ke dalam buku absen Wajib Belajar untuk tanggal yang dipilih."
                type="info"
            />

            <style jsx>{`
                .active-card {
                    background: var(--primary-light) !important;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                }
            `}</style>
        </div>
    );
}


