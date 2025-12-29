'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';

export default function AbsensiFormalPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    // Data Lists
    const [kelasOptions, setKelasOptions] = useState([]);
    const [santriList, setSantriList] = useState([]);

    // Filters
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedKelas, setSelectedKelas] = useState('');

    // Form State: { [santriId]: { status: 'H', keterangan: '', id: null } }
    const [attendance, setAttendance] = useState({});
    const [stats, setStats] = useState({ H: 0, S: 0, I: 0, A: 0, T: 0 });

    useEffect(() => {
        loadMasterKelas();
    }, []);

    useEffect(() => {
        if (selectedKelas && filterDate) {
            loadAttendanceData();
        } else {
            setSantriList([]);
        }
    }, [selectedKelas, filterDate]);

    // Recalculate stats whenever attendance changes
    useEffect(() => {
        const counts = { H: 0, S: 0, I: 0, A: 0, T: 0 };
        Object.values(attendance).forEach(val => {
            if (counts[val.status] !== undefined) counts[val.status]++;
        });
        setStats(counts);
    }, [attendance]);

    const loadMasterKelas = async () => {
        try {
            const res = await apiCall('getData', 'GET', { type: 'master_kelas' });
            // Filter only MIU (Formal)
            const formal = (res || []).filter(k => k.lembaga === 'MIU');
            setKelasOptions(formal.sort((a, b) => a.urutan - b.urutan));
        } catch (e) { console.error(e); }
    };

    const loadAttendanceData = async () => {
        setLoading(true);
        try {
            // 1. Get Santri in Class
            const resSantri = await apiCall('getData', 'GET', { type: 'santri' });
            const students = (resSantri || [])
                .filter(s => s.kelas === selectedKelas && s.status_santri === 'Aktif')
                .sort((a, b) => a.nama_siswa.localeCompare(b.nama_siswa));

            setSantriList(students);

            // 2. Get Existing Attendance for Date (Client-side filtered for now)
            const resAbsensi = await apiCall('getData', 'GET', { type: 'keamanan_absensi' });
            const todaysLogs = (resAbsensi || []).filter(l => l.tanggal === filterDate);

            // 3. Map to Attendance State
            const initialState = {};
            students.forEach(s => {
                const log = todaysLogs.find(l => l.santri_id === s.id);
                initialState[s.id] = {
                    status: log ? log.status : 'H', // Default Hadir
                    keterangan: log ? log.keterangan : '',
                    id: log ? log.id : null // Record ID if exists
                };
            });
            setAttendance(initialState);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleStatusChange = (santriId, newStatus) => {
        setAttendance(prev => ({
            ...prev,
            [santriId]: { ...prev[santriId], status: newStatus }
        }));
    };

    const handleNoteChange = (santriId, newNote) => {
        setAttendance(prev => ({
            ...prev,
            [santriId]: { ...prev[santriId], keterangan: newNote }
        }));
    };

    const handleSave = async () => {
        if (!selectedKelas) return showToast("Pilih kelas terlebih dahulu!", "warning");
        if (santriList.length === 0) return showToast("Tidak ada data santri.", "info");

        if (!confirm(`Simpan absensi untuk ${santriList.length} santri?\nTanggal: ${filterDate}`)) return;

        setLoading(true);
        try {
            const promises = santriList.map(s => {
                const data = attendance[s.id];
                const payload = {
                    santri_id: s.id,
                    nama_santri: s.nama_siswa,
                    kelas: selectedKelas,
                    tanggal: filterDate,
                    status: data.status,
                    keterangan: data.keterangan,
                    petugas: user?.fullname || 'Keamanan'
                };

                // Add ID for Update, remove for Insert
                if (data.id) payload.id = data.id;

                return apiCall('saveData', 'POST', {
                    type: 'keamanan_absensi',
                    data: payload
                });
            });

            await Promise.all(promises);
            showToast("Absensi berhasil disimpan!", "success");
            loadAttendanceData(); // Refresh IDs
        } catch (e) {
            console.error(e);
            showToast("Gagal menyimpan: " + e.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // Helper for Status Badge
    const StatusBadge = ({ label, count, color }) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'white', padding: '10px', borderRadius: '8px', minWidth: '80px', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: color }}>{count}</span>
            <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: 600 }}>{label}</span>
        </div>
    );

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Absensi Formal / MIU</h2>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Security Checkpoint • Santri Sekolah</p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="date"
                                className="form-control"
                                value={filterDate}
                                onChange={e => setFilterDate(e.target.value)}
                                style={{ width: '160px' }}
                            />
                            <select
                                className="form-control"
                                value={selectedKelas}
                                onChange={e => setSelectedKelas(e.target.value)}
                                style={{ width: '200px' }}
                            >
                                <option value="">- Pilih Kelas -</option>
                                {kelasOptions.map((k, i) => (
                                    <option key={i} value={k.nama_kelas}>{k.nama_kelas} ({k.lembaga})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Stats Dashboard */}
                    {selectedKelas && (
                        <div style={{ display: 'flex', gap: '10px', width: '100%', background: '#f8fafc', padding: '10px', borderRadius: '12px' }}>
                            <StatusBadge label="HADIR" count={stats.H} color="var(--success)" />
                            <StatusBadge label="SAKIT" count={stats.S} color="var(--warning)" />
                            <StatusBadge label="IZIN" count={stats.I} color="#3b82f6" />
                            <StatusBadge label="ALPHA" count={stats.A} color="var(--danger)" />
                            <StatusBadge label="TELAT" count={stats.T} color="#a855f7" />
                            <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <button className="btn btn-primary" onClick={handleSave} disabled={loading} style={{ height: '50px', padding: '0 30px', fontSize: '1rem' }}>
                                    {loading ? 'Menyimpan...' : <><i className="fas fa-save" style={{ marginRight: '8px' }}></i> Simpan Absensi</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {!selectedKelas ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                        <i className="fas fa-chalkboard-teacher" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}></i>
                        <h3>Silakan pilih Kelas untuk memulai absensi.</h3>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ width: '50px' }}>No</th>
                                    <th>Nama Santri (Stambuk)</th>
                                    <th style={{ textAlign: 'center' }}>Status Kehadiran</th>
                                    <th>Keterangan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {santriList.length === 0 ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Tidak ada data santri di kelas ini.</td></tr>
                                ) : (
                                    santriList.map((s, idx) => (
                                        <tr key={s.id} style={{ background: attendance[s.id]?.status === 'H' ? 'transparent' : '#fffbeb' }}>
                                            <td>{idx + 1}</td>
                                            <td>
                                                <div style={{ fontWeight: 700 }}>{s.nama_siswa}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#666' }}>{s.stambuk_pondok}</div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', gap: '4px' }}>
                                                    {['H', 'S', 'I', 'A', 'T'].map(status => (
                                                        <label
                                                            key={status}
                                                            style={{
                                                                cursor: 'pointer',
                                                                padding: '6px 12px',
                                                                borderRadius: '6px',
                                                                fontWeight: 700,
                                                                background: attendance[s.id]?.status === status
                                                                    ? (status === 'H' ? 'var(--success)' : status === 'A' ? 'var(--danger)' : status === 'S' ? 'var(--warning)' : status === 'I' ? '#3b82f6' : '#a855f7')
                                                                    : 'transparent',
                                                                color: attendance[s.id]?.status === status ? 'white' : '#64748b',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            <input
                                                                type="radio"
                                                                name={`status-${s.id}`}
                                                                value={status}
                                                                checked={attendance[s.id]?.status === status}
                                                                onChange={() => handleStatusChange(s.id, status)}
                                                                style={{ display: 'none' }}
                                                            />
                                                            {status}
                                                        </label>
                                                    ))}
                                                </div>
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Contoh: Pulang ke rumah..."
                                                    value={attendance[s.id]?.keterangan || ''}
                                                    onChange={e => handleNoteChange(s.id, e.target.value)}
                                                    style={{ fontSize: '0.9rem' }}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
