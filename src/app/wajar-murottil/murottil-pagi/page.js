'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function MurottilPagiPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [santriList, setSantriList] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterKelas, setFilterKelas] = useState('Semua');
    const [kelasOptions, setKelasOptions] = useState([]);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const [resSantri, resKelas] = await Promise.all([
                apiCall('getData', 'GET', { type: 'santri' }),
                apiCall('getData', 'GET', { type: 'master_kelas' })
            ]);

            setKelasOptions(resKelas.filter(k => k.lembaga === 'MIU'));

            let students = (resSantri || []).filter(s =>
                s.madrasah === 'MIU' ||
                (s.kelas || '').toUpperCase().includes('ULA') ||
                (s.kelas || '').toUpperCase().includes('WUSTHO')
            );

            if (filterKelas !== 'Semua') students = students.filter(s => s.kelas === filterKelas);
            students.sort((a, b) => a.nama_siswa.localeCompare(b.nama_siswa));
            setSantriList(students);

            const resAbsen = await apiCall('getData', 'GET', { type: 'wajar_miu_absen' });
            const logs = (resAbsen || []).filter(l => l.tanggal === filterDate);

            const state = {};
            students.forEach(s => {
                const log = logs.find(l => l.santri_id === s.id);
                state[s.id] = { status: log ? log.status : 'H', id: log ? log.id : null };
            });
            setAttendance(state);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, [filterDate, filterKelas]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const promises = santriList.map(s => {
                const data = attendance[s.id];
                return apiCall('saveData', 'POST', {
                    type: 'wajar_miu_absen',
                    data: {
                        id: data.id, santri_id: s.id, nama_santri: s.nama_siswa,
                        kelas: s.kelas, tanggal: filterDate, status: data.status,
                        tipe: 'Murottil Pagi', petugas: user?.fullname || 'Admin'
                    }
                });
            });
            await Promise.all(promises);
            showToast("Absensi berhasil disimpan!", "success");
            loadData();
        } catch (e) { showToast(e.message, "error"); } finally { setLoading(false); setIsConfirmOpen(false); }
    };

    const stats = useMemo(() => {
        const values = Object.values(attendance);
        return [
            { title: 'Hadir', value: values.filter(v => v.status === 'H').length, icon: 'fas fa-check-circle', color: 'var(--success)' },
            { title: 'Izin/Sakit', value: values.filter(v => ['I', 'S'].includes(v.status)).length, icon: 'fas fa-envelope', color: 'var(--warning)' },
            { title: 'Alfa', value: values.filter(v => v.status === 'A').length, icon: 'fas fa-times-circle', color: 'var(--danger)' }
        ];
    }, [attendance]);

    const columns = [
        { key: 'nama_siswa', label: 'Nama Santri', render: (row) => <div><div style={{ fontWeight: 800 }}>{row.nama_siswa}</div><small>{row.kelas} (MIU)</small></div> },
        {
            key: 'status', label: 'Status Kehadiran', render: (row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    {['H', 'S', 'I', 'A'].map(st => (
                        <button
                            key={st}
                            onClick={() => setAttendance({ ...attendance, [row.id]: { ...attendance[row.id], status: st } })}
                            className={`btn-vibrant ${attendance[row.id]?.status === st ? 'btn-vibrant-blue' : 'btn-vibrant-gray'}`}
                            style={{ width: '40px', height: '35px', padding: 0, fontWeight: 800 }}
                        >{st}</button>
                    ))}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Monitoring Kehadiran Murottil Pagi" subJudul="Absensi rutin santri unit MIU." hideOnScreen={true} />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Absensi Murottil Pagi"
                subtitle={`Tanggal: ${formatDate(filterDate)} | ${santriList.length} Santri`}
                headerActions={<button className="btn btn-primary" onClick={() => setIsConfirmOpen(true)} disabled={loading}><i className="fas fa-save"></i> Simpan Absensi</button>}
                filters={(<>
                    <TextInput type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ width: '180px', marginBottom: 0 }} />
                    <SelectInput value={filterKelas} onChange={e => setFilterKelas(e.target.value)} options={['Semua', ...kelasOptions.map(k => k.nama_kelas)]} style={{ width: '180px', marginBottom: 0 }} />
                </>)}
                tableProps={{ columns, data: santriList, loading }}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleSave}
                title="Simpan Absensi?"
                message={`Anda akan menyimpan data kehadiran untuk ${santriList.length} santri pada tanggal ${formatDate(filterDate)}.`}
                type="info"
            />
        </div>
    );
}
