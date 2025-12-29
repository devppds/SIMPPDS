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
    const [attendance, setAttendance] = useState({});
    const [filterDate, setFilterDate] = useState('');
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
            const resSantri = await apiCall('getData', 'GET', { type: 'santri' });
            const mhmIbtida = (resSantri || []).filter(s =>
                (s.madrasah === 'MHM' || (s.kelas || '').toUpperCase().includes('IBTIDA')) &&
                !((s.kelas || '').toUpperCase().includes('ULA') || (s.kelas || '').toUpperCase().includes('WUSTHO'))
            ).sort((a, b) => a.nama_siswa.localeCompare(b.nama_siswa));

            if (isMounted.current) setSantriList(mhmIbtida);

            const resAbsen = await apiCall('getData', 'GET', { type: 'wajar_mhm_absen' });
            const logs = (resAbsen || []).filter(l => l.tanggal === filterDate && l.tipe === 'Wajib Belajar');

            const state = {};
            mhmIbtida.forEach(s => {
                const log = logs.find(l => l.santri_id === s.id);
                state[s.id] = { status: log ? log.status : 'H', id: log ? log.id : null };
            });
            if (isMounted.current) setAttendance(state);
        } catch (e) {
            console.error(e);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }, [filterDate]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSave = async () => {
        if (isMounted.current) setLoading(true);
        try {
            const promises = santriList.map(s => {
                const data = attendance[s.id];
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
        const values = Object.values(attendance);
        return [
            { title: 'Total Santri', value: santriList.length, icon: 'fas fa-users', color: 'var(--primary)' },
            { title: 'Hadir', value: values.filter(v => v.status === 'H').length, icon: 'fas fa-check-double', color: 'var(--success)' },
            { title: 'Alfa / Bolos', value: values.filter(v => v.status === 'A').length, icon: 'fas fa-user-times', color: 'var(--danger)' }
        ];
    }, [attendance, santriList]);

    const columns = [
        { key: 'nama_siswa', label: 'Nama Santri', render: (row) => <div><div style={{ fontWeight: 800 }}>{row.nama_siswa}</div><small>{row.kelas}</small></div> },
        {
            key: 'status', label: 'Presensi', render: (row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    {['H', 'S', 'I', 'A'].map(st => (
                        <button key={st} onClick={() => canEdit && setAttendance({ ...attendance, [row.id]: { ...attendance[row.id], status: st } })}
                            disabled={!canEdit}
                            className={`btn-vibrant ${attendance[row.id]?.status === st ? 'btn-vibrant-blue' : 'btn-vibrant-gray'}`}
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
                subtitle={filterDate ? `Tanggal: ${formatDate(filterDate)}` : 'Memuat data...'}
                headerActions={canEdit && <button className="btn btn-primary" onClick={() => setIsConfirmOpen(true)} disabled={loading}><i className="fas fa-save"></i> Simpan Data</button>}
                filters={<TextInput type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ width: '180px', marginBottom: 0 }} />}
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
