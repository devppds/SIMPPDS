'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import SortableTable from '@/components/SortableTable';

export default function WajibBelajarPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [santriList, setSantriList] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => { loadData(); }, [filterDate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const resSantri = await apiCall('getData', 'GET', { type: 'santri' });
            // Strict Filter: MHM Ibtida'iyyah Only
            const mhmIbtida = (resSantri || []).filter(s =>
                (s.madrasah === 'MHM' || (s.kelas || '').toUpperCase().includes('IBTIDA')) &&
                !((s.kelas || '').toUpperCase().includes('ULA') || (s.kelas || '').toUpperCase().includes('WUSTHO') || (s.kelas || '').toUpperCase().includes('ULYA'))
            ).sort((a, b) => a.nama_siswa.localeCompare(b.nama_siswa));

            setSantriList(mhmIbtida);

            const resAbsen = await apiCall('getData', 'GET', { type: 'wajar_mhm_absen' });
            const logs = (resAbsen || []).filter(l => l.tanggal === filterDate && l.tipe === 'Wajib Belajar');

            const state = {};
            mhmIbtida.forEach(s => {
                const log = logs.find(l => l.santri_id === s.id);
                state[s.id] = { status: log ? log.status : 'H', id: log ? log.id : null };
            });
            setAttendance(state);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const promises = santriList.map(s => {
                const data = attendance[s.id];
                return apiCall('saveData', 'POST', {
                    type: 'wajar_mhm_absen',
                    data: {
                        id: data.id,
                        santri_id: s.id,
                        nama_santri: s.nama_siswa,
                        kelas: s.kelas,
                        tanggal: filterDate,
                        status: data.status,
                        tipe: 'Wajib Belajar',
                        petugas: user?.fullname || 'Admin'
                    }
                });
            });
            await Promise.all(promises);
            alert("Absensi Wajib Belajar berhasil disimpan!");
            loadData();
        } catch (e) { alert(e.message); } finally { setLoading(false); }
    };

    const columns = [
        { key: 'nama_siswa', label: 'Nama Santri', render: (row) => <div><div style={{ fontWeight: 700 }}>{row.nama_siswa}</div><small>{row.kelas}</small></div> },
        {
            key: 'status',
            label: 'Status Kehadiran',
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
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Absensi Wajib Belajar</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Khusus Santri MHM Ibtida'iyyah.</p>
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
