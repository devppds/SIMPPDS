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
    const [loading, setLoading] = useState(false);
    const [santriList, setSantriList] = useState([]);
    const [state, setState] = useState({});
    const [filterDate, setFilterDate] = useState('');
    const [filterKelompok, setFilterKelompok] = useState('Semua');
    const [kelompokOptions, setKelompokOptions] = useState([]);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const isMounted = React.useRef(true);

    React.useEffect(() => {
        isMounted.current = true;
        setFilterDate(new Date().toISOString().split('T')[0]);
        return () => { isMounted.current = false; };
    }, []);

    const loadData = useCallback(async () => {
        if (isMounted.current) setLoading(true);
        try {
            const [resSantri, resPengurus] = await Promise.all([
                apiCall('getData', 'GET', { type: 'santri' }),
                apiCall('getData', 'GET', { type: 'wajar_pengurus' })
            ]);

            if (isMounted.current) {
                setKelompokOptions([...new Set((resPengurus || []).map(p => p.kelompok))].filter(Boolean).sort());
            }

            let students = (resSantri || []).filter(s =>
                (s.madrasah === 'MHM' || (s.kelas || '').toUpperCase().includes('IBTIDA')) &&
                !((s.kelas || '').toUpperCase().includes('ULA') || (s.kelas || '').toUpperCase().includes('WUSTHO'))
            );

            if (filterKelompok !== 'Semua') {
                students = students.filter(s => s.kelompok === filterKelompok || s.kelompok_murottil === filterKelompok);
            }

            students.sort((a, b) => a.nama_siswa.localeCompare(b.nama_siswa));
            if (isMounted.current) setSantriList(students);

            const resAbsen = await apiCall('getData', 'GET', { type: 'wajar_mhm_absen' });
            const logs = (resAbsen || []).filter(l => l.tanggal === filterDate && l.tipe === 'Wajib Belajar');

            const newState = {};
            students.forEach(s => {
                const log = logs.find(l => l.santri_id === s.id);
                newState[s.id] = { status: log ? log.status : 'H', id: log ? log.id : null };
            });
            if (isMounted.current) setState(newState);
        } catch (e) {
            console.error(e);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }, [filterDate, filterKelompok]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleBulkHadir = () => {
        const newState = { ...state };
        santriList.forEach(s => {
            newState[s.id] = { ...newState[s.id], status: 'H' };
        });
        setState(newState);
        showToast("Semua santri diatur Hadir (H)", "info");
    };

    const handleSave = async () => {
        if (isMounted.current) setLoading(true);
        try {
            const promises = santriList.map(s => {
                const data = state[s.id];
                return apiCall('saveData', 'POST', {
                    type: 'wajar_mhm_absen',
                    data: {
                        id: data.id, santri_id: s.id, nama_santri: s.nama_siswa,
                        kelas: s.kelas, tanggal: filterDate, status: data.status,
                        tipe: 'Wajib Belajar', petugas: user?.fullname || 'Admin'
                    }
                });
            });
            await Promise.all(promises);
            if (isMounted.current) {
                showToast("Presensi Wajib Belajar berhasil disimpan!", "success");
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
            { title: 'Hadir', value: values.filter(v => v.status === 'H').length, icon: 'fas fa-check-double', color: 'var(--success)' },
            { title: 'Alfa / Bolos', value: values.filter(v => v.status === 'A').length, icon: 'fas fa-user-times', color: 'var(--danger)' }
        ];
    }, [state, santriList]);

    const columns = [
        { key: 'nama_siswa', label: 'Nama Santri', render: (row) => <div><div style={{ fontWeight: 800 }}>{row.nama_siswa}</div><small>{row.kelas}</small></div> },
        {
            key: 'status', label: 'Presensi', render: (row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    {['H', 'S', 'I', 'A'].map(st => (
                        <button key={st} onClick={() => canEdit && setState({ ...state, [row.id]: { ...state[row.id], status: st } })}
                            disabled={!canEdit}
                            className={`btn-vibrant ${state[row.id]?.status === st ? 'btn-vibrant-blue' : 'btn-vibrant-gray'}`}
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

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Input Kehadiran Wajib Belajar"
                subtitle={filterDate ? `Tanggal: ${formatDate(filterDate)} | ${filterKelompok}` : 'Memuat data...'}
                headerActions={canEdit && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-secondary" onClick={handleBulkHadir} disabled={loading || santriList.length === 0}>
                            <i className="fas fa-check-double"></i> <span className="hide-mobile">Semua Hadir</span>
                        </button>
                        <button className="btn btn-primary" onClick={() => setIsConfirmOpen(true)} disabled={loading || santriList.length === 0}>
                            <i className="fas fa-save"></i> <span className="hide-mobile">Simpan Data</span>
                        </button>
                    </div>
                )}
                filters={(<>
                    <TextInput type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ width: '180px', marginBottom: 0 }} />
                    <select className="form-control" value={filterKelompok} onChange={e => setFilterKelompok(e.target.value)} style={{ width: '180px' }}>
                        <option value="Semua">Semua Kelompok</option>
                        {kelompokOptions.map((k, i) => (
                            <option key={i} value={k}>{k}</option>
                        ))}
                    </select>
                </>)}
                tableProps={{ columns, data: santriList, loading }}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleSave}
                title="Simpan Presensi?"
                message="Data ini akan masuk ke dalam buku absen Wajib Belajar untuk tanggal yang dipilih."
                type="info"
            />
        </div>
    );
}

