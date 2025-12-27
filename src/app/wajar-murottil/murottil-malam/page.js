'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import SortableTable from '@/components/SortableTable';

export default function MurottilMalamPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [santriList, setSantriList] = useState([]);
    const [state, setState] = useState({}); // { [id]: { status: 'H', nilai: '', materi: '', id_absen: null, id_nilai: null } }
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => { loadData(); }, [filterDate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const resSantri = await apiCall('getData', 'GET', { type: 'santri' });
            const students = (resSantri || []).filter(s =>
                (s.madrasah === 'MHM' || (s.kelas || '').toUpperCase().includes('IBTIDA')) &&
                !((s.kelas || '').toUpperCase().includes('ULA') || (s.kelas || '').toUpperCase().includes('WUSTHO') || (s.kelas || '').toUpperCase().includes('ULYA'))
            ).sort((a, b) => a.nama_siswa.localeCompare(b.nama_siswa));

            setSantriList(students);

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
            setState(newState);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const promises = santriList.map(s => {
                const data = state[s.id];
                const p1 = apiCall('saveData', 'POST', {
                    type: 'wajar_mhm_absen',
                    data: {
                        id: data.id_absen,
                        santri_id: s.id,
                        nama_santri: s.nama_siswa,
                        kelas: s.kelas,
                        tanggal: filterDate,
                        status: data.status,
                        tipe: 'Murottil Malam',
                        petugas: user?.fullname || 'Admin'
                    }
                });
                const p2 = apiCall('saveData', 'POST', {
                    type: 'wajar_nilai',
                    data: {
                        id: data.id_nilai,
                        santri_id: s.id,
                        nama_santri: s.nama_siswa,
                        tanggal: filterDate,
                        tipe: 'Murottil Malam',
                        nilai: data.nilai,
                        materi: data.materi,
                        petugas: user?.fullname || 'Admin'
                    }
                });
                return Promise.all([p1, p2]);
            });
            await Promise.all(promises);
            alert("Data Murottil Malam berhasil disimpan!");
            loadData();
        } catch (e) { alert(e.message); } finally { setLoading(false); }
    };

    const columns = [
        { key: 'nama_siswa', label: 'Santri', render: (row) => <div><div style={{ fontWeight: 700 }}>{row.nama_siswa}</div><small>{row.kelas}</small></div> },
        {
            key: 'status',
            label: 'Absen',
            width: '180px',
            render: (row) => (
                <div style={{ display: 'flex', gap: '3px' }}>
                    {['H', 'S', 'I', 'A'].map(st => (
                        <button
                            key={st}
                            onClick={() => setState({ ...state, [row.id]: { ...state[row.id], status: st } })}
                            className={`btn btn-sm ${state[row.id]?.status === st ? 'btn-primary' : 'btn-outline'}`}
                            style={{ width: '30px', padding: '3px 0', fontSize: '10px' }}
                        >{st}</button>
                    ))}
                </div>
            )
        },
        { key: 'materi', label: 'Materi/Surah', render: (row) => <input type="text" className="form-control form-control-sm" value={state[row.id]?.materi || ''} onChange={e => setState({ ...state, [row.id]: { ...state[row.id], materi: e.target.value } })} /> },
        { key: 'nilai', label: 'Nilai', width: '80px', render: (row) => <input type="text" className="form-control form-control-sm" value={state[row.id]?.nilai || ''} onChange={e => setState({ ...state, [row.id]: { ...state[row.id], nilai: e.target.value } })} /> }
    ];

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Murottil Malam & Nilai</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>MHM Ibtida'iyyah (Wajib Belajar).</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input type="date" className="form-control" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                        <button className="btn btn-primary" onClick={handleSave} disabled={loading}><i className="fas fa-save"></i> Simpan</button>
                    </div>
                </div>
                <SortableTable columns={columns} data={santriList} loading={loading} emptyMessage="Tidak ada data santri MHM Ibtida'iyyah." />
            </div>
        </div>
    );
}
