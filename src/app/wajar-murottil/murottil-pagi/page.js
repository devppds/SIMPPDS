'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import SortableTable from '@/components/SortableTable';

export default function MurottilPagiPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [santriList, setSantriList] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterKelas, setFilterKelas] = useState('Semua');
    const [kelasOptions, setKelasOptions] = useState([]);

    useEffect(() => { loadData(); }, [filterDate, filterKelas]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [resSantri, resKelas] = await Promise.all([
                apiCall('getData', 'GET', { type: 'santri' }),
                apiCall('getData', 'GET', { type: 'master_kelas' })
            ]);

            // Filter MIU Only
            setKelasOptions(resKelas.filter(k => k.lembaga === 'MIU'));

            let students = (resSantri || []).filter(s => s.madrasah === 'MIU');
            if (filterKelas !== 'Semua') {
                students = students.filter(s => s.kelas === filterKelas);
            }
            students.sort((a, b) => a.nama_siswa.localeCompare(b.nama_siswa));

            setSantriList(students);

            const resAbsen = await apiCall('getData', 'GET', { type: 'wajar_absensi' });
            const logs = (resAbsen || []).filter(l => l.tanggal === filterDate && l.tipe === 'Murottil Pagi');

            const state = {};
            students.forEach(s => {
                const log = logs.find(l => l.santri_id === s.id);
                state[s.id] = { status: log ? log.status : 'H', id: log ? log.id : null };
            });
            setAttendance(state);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (santriList.length > 50 && !confirm(`Simpan absensi untuk ${santriList.length} santri?`)) return;
        setLoading(true);
        try {
            const promises = santriList.map(s => {
                const data = attendance[s.id];
                return apiCall('saveData', 'POST', {
                    type: 'wajar_absensi',
                    data: {
                        id: data.id,
                        santri_id: s.id,
                        nama_santri: s.nama_siswa,
                        kelas: s.kelas,
                        tanggal: filterDate,
                        status: data.status,
                        tipe: 'Murottil Pagi',
                        petugas: user?.fullname || 'Admin'
                    }
                });
            });
            await Promise.all(promises);
            alert("Absensi Murottil Pagi MIU berhasil disimpan!");
            loadData();
        } catch (e) { alert(e.message); } finally { setLoading(false); }
    };

    const columns = [
        { key: 'nama_siswa', label: 'Nama Santri', render: (row) => <div><div style={{ fontWeight: 700 }}>{row.nama_siswa}</div><small>{row.kelas} (MIU)</small></div> },
        {
            key: 'status',
            label: 'Status',
            render: (row) => (
                <div style={{ display: 'flex', gap: '5px' }}>
                    {['H', 'S', 'I', 'A'].map(st => (
                        <button
                            key={st}
                            onClick={() => setAttendance({ ...attendance, [row.id]: { ...attendance[row.id], status: st } })}
                            className={`btn btn-sm ${attendance[row.id]?.status === st ? 'btn-primary' : 'btn-outline'}`}
                            style={{ width: '35px', padding: '5px 0' }}
                        >{st}</button>
                    ))}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Murottil Pagi (MIU)</h2>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Absensi Semua Siswa MIU.</p>
                        </div>
                        <button className="btn btn-primary" onClick={handleSave} disabled={loading}><i className="fas fa-save"></i> Simpan Kehadiran</button>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                        <input type="date" className="form-control" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ maxWidth: '200px' }} />
                        <select className="form-control" value={filterKelas} onChange={e => setFilterKelas(e.target.value)} style={{ maxWidth: '200px' }}>
                            <option value="Semua">Semua Kelas MIU</option>
                            {kelasOptions.map((k, i) => <option key={i} value={k.nama_kelas}>{k.nama_kelas}</option>)}
                        </select>
                    </div>
                </div>
                <SortableTable columns={columns} data={santriList} loading={loading} emptyMessage="Tidak ada data santri MIU." />
            </div>
        </div>
    );
}
