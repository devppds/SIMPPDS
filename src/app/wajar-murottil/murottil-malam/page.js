'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { TextInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function MurottilMalamPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [santriList, setSantriList] = useState([]);
    const [state, setState] = useState({});
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const isMounted = React.useRef(true);

    React.useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const loadData = async () => {
        if (isMounted.current) setLoading(true);
        try {
            const resSantri = await apiCall('getData', 'GET', { type: 'santri' });
            const students = (resSantri || []).filter(s =>
                (s.madrasah === 'MHM' || (s.kelas || '').toUpperCase().includes('IBTIDA')) &&
                !((s.kelas || '').toUpperCase().includes('ULA') || (s.kelas || '').toUpperCase().includes('WUSTHO'))
            ).sort((a, b) => a.nama_siswa.localeCompare(b.nama_siswa));

            if (isMounted.current) setSantriList(students);

            const [resAbsen, resNilai] = await Promise.all([
                apiCall('getData', 'GET', { type: 'wajar_mhm_absen' }),
                apiCall('getData', 'GET', { type: 'wajar_nilai' })
            ]);

            const logsAbsen = (resAbsen || []).filter(l => l.tanggal === filterDate && l.tipe === 'Murottil Malam');
            const logsNilai = (resNilai || []).filter(l => l.tanggal === filterDate && l.tipe === 'Murottil Malam');

            const newState = {};
            students.forEach(s => {
                const logA = logsAbsen.find(l => l.santri_id === s.id);
                const logN = logsNilai.find(l => l.santri_id === s.id);
                newState[s.id] = {
                    status: logA ? logA.status : 'H',
                    nilai: logN ? logN.nilai : '',
                    materi: logN ? logN.materi : '',
                    id_absen: logA ? logA.id : null,
                    id_nilai: logN ? logN.id : null
                };
            });
            if (isMounted.current) setState(newState);
        } catch (e) {
            console.error(e);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [filterDate]);

    const handleSave = async () => {
        if (isMounted.current) setLoading(true);
        try {
            const promises = santriList.map(s => {
                const data = state[s.id];
                const p1 = apiCall('saveData', 'POST', {
                    type: 'wajar_mhm_absen',
                    data: {
                        id: data.id_absen, santri_id: s.id, nama_santri: s.nama_siswa,
                        kelas: s.kelas, tanggal: filterDate, status: data.status,
                        tipe: 'Murottil Malam', petugas: user?.fullname || 'Admin'
                    }
                });
                const p2 = apiCall('saveData', 'POST', {
                    type: 'wajar_nilai',
                    data: {
                        id: data.id_nilai, santri_id: s.id, nama_santri: s.nama_siswa,
                        tanggal: filterDate, tipe: 'Murottil Malam', nilai: data.nilai,
                        materi: data.materi, petugas: user?.fullname || 'Admin'
                    }
                });
                return Promise.all([p1, p2]);
            });
            await Promise.all(promises);
            if (isMounted.current) {
                showToast("Data Murottil Malam & Nilai berhasil disimpan!", "success");
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
            { title: 'Nilai Terisi', value: values.filter(v => v.nilai !== '').length, icon: 'fas fa-star', color: 'var(--warning)' }
        ];
    }, [state, santriList]);

    const columns = [
        { key: 'nama_siswa', label: 'Santri', render: (row) => <div><div style={{ fontWeight: 800 }}>{row.nama_siswa}</div><small>{row.kelas}</small></div> },
        {
            key: 'status', label: 'Absen', width: '150px', render: (row) => (
                <div style={{ display: 'flex', gap: '5px' }}>
                    {['H', 'S', 'I', 'A'].map(st => (
                        <button
                            key={st}
                            onClick={() => setState({ ...state, [row.id]: { ...state[row.id], status: st } })}
                            className={`btn-vibrant ${state[row.id]?.status === st ? 'btn-vibrant-blue' : 'btn-vibrant-gray'}`}
                            style={{ width: '30px', height: '30px', padding: 0, fontSize: '0.7rem' }}
                        >{st}</button>
                    ))}
                </div>
            )
        },
        { key: 'materi', label: 'Materi / Surah', render: (row) => <input type="text" className="form-control form-control-sm" style={{ border: '1px solid #e2e8f0' }} value={state[row.id]?.materi || ''} onChange={e => setState({ ...state, [row.id]: { ...state[row.id], materi: e.target.value } })} placeholder="Halaman/Ayat..." /> },
        { key: 'nilai', label: 'Nilai', width: '80px', render: (row) => <input type="text" className="form-control form-control-sm" style={{ textAlign: 'center', fontWeight: 800 }} value={state[row.id]?.nilai || ''} onChange={e => setState({ ...state, [row.id]: { ...state[row.id], nilai: e.target.value } })} placeholder="0-100" /> }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Murottil Malam & Penilaian" subJudul="Evaluasi bacaan Al-Qur'an santri MHM Ibtida'iyyah." hideOnScreen={true} />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Input Kehadiran & Nilai"
                subtitle={`Periode: ${formatDate(filterDate)}`}
                headerActions={<button className="btn btn-primary" onClick={() => setIsConfirmOpen(true)} disabled={loading}><i className="fas fa-save"></i> Simpan Data</button>}
                filters={<TextInput type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ width: '180px', marginBottom: 0 }} />}
                tableProps={{ columns, data: santriList, loading }}
            />

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
