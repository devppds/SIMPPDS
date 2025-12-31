'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { apiCall } from '@/lib/utils';
import { useAuth, usePagePermission } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import { SelectInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function PengaturanFormalPage() {
    const { canEdit } = usePagePermission();
    const { showToast } = useToast();

    // State
    const [loading, setLoading] = useState(false);
    const [santriList, setSantriList] = useState([]);
    const [mapping, setMapping] = useState({}); // { [santriId]: { jenjang: '', semester: '', id: null } }
    const [kelasOptions, setKelasOptions] = useState([]);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const isMounted = React.useRef(true);

    // Filters & Bulk Actions
    const [filterKelas, setFilterKelas] = useState('Semua');
    const [bulkJenjang, setBulkJenjang] = useState('SMP/MTS');
    const [bulkSemester, setBulkSemester] = useState('1');

    useEffect(() => {
        isMounted.current = true;
        loadData();
        return () => { isMounted.current = false; };
    }, []);

    const loadData = async () => {
        if (isMounted.current) setLoading(true);
        try {
            const [resSantri, resMapping] = await Promise.all([
                apiCall('getData', 'GET', { type: 'santri' }),
                apiCall('getData', 'GET', { type: 'keamanan_formal_mapping' })
            ]);

            // 1. Filter hanya siswa MIU yang aktif
            const miuStudents = (resSantri || []).filter(s => s.madrasah === 'MIU' && s.status_santri === 'Aktif')
                .sort((a, b) => a.nama_siswa.localeCompare(b.nama_siswa));

            if (isMounted.current) {
                setSantriList(miuStudents);
                // Dapatkan daftar kelas unik untuk filter
                const classes = [...new Set(miuStudents.map(s => s.kelas))].filter(Boolean).sort();
                setKelasOptions(classes);
            }

            // 2. Map data yang sudah ada
            const initialMapping = {};
            miuStudents.forEach(s => {
                const existing = (resMapping || []).find(m => m.santri_id === s.id);
                initialMapping[s.id] = {
                    jenjang: existing ? existing.jenjang : '',
                    semester: existing ? existing.semester : '',
                    id: existing ? existing.id : null
                };
            });
            if (isMounted.current) setMapping(initialMapping);
        } catch (e) {
            console.error("Load Data Error:", e);
            if (isMounted.current) showToast("Gagal memuat data santri.", "error");
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    const handleSingleChange = (santriId, field, value) => {
        setMapping(prev => ({
            ...prev,
            [santriId]: { ...prev[santriId], [field]: value }
        }));
    };

    const applyBulkAction = () => {
        const newMapping = { ...mapping };
        let count = 0;

        santriList.forEach(s => {
            if (filterKelas === 'Semua' || s.kelas === filterKelas) {
                newMapping[s.id] = { ...newMapping[s.id], jenjang: bulkJenjang, semester: bulkSemester };
                count++;
            }
        });

        setMapping(newMapping);
        showToast(`Berhasil menerapkan ke ${count} santri.`, "success");
    };

    const handleSave = async () => {
        if (isMounted.current) setLoading(true);
        try {
            const promises = santriList.map(s => {
                const data = mapping[s.id];
                // Hanya simpan jika data sudah diisi (Jenjang & Semester)
                if (!data.jenjang || !data.semester) return Promise.resolve();

                return apiCall('saveData', 'POST', {
                    type: 'keamanan_formal_mapping',
                    data: {
                        id: data.id,
                        santri_id: s.id,
                        nama_santri: s.nama_siswa,
                        kelas_miu: s.kelas,
                        jenjang: data.jenjang,
                        semester: data.semester
                    }
                });
            });

            await Promise.all(promises);
            if (isMounted.current) {
                showToast("Pengaturan kelompok formal berhasil disimpan!", "success");
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

    const filteredSantri = useMemo(() => {
        if (filterKelas === 'Semua') return santriList;
        return santriList.filter(s => s.kelas === filterKelas);
    }, [santriList, filterKelas]);

    const stats = [
        { title: 'Total Siswa MIU', value: santriList.length, icon: 'fas fa-graduation-cap', color: 'var(--primary)' },
        { title: 'Sudah Dipetakan', value: Object.values(mapping).filter(m => m.jenjang && m.semester).length, icon: 'fas fa-user-check', color: 'var(--success)' },
        { title: 'Belum Dipetakan', value: Object.values(mapping).filter(m => !m.jenjang || !m.semester).length, icon: 'fas fa-user-clock', color: 'var(--warning)' }
    ];

    const columns = [
        {
            key: 'nama_siswa',
            label: 'Nama Santri (MIU)',
            render: (row) => (
                <div>
                    <div style={{ fontWeight: 800 }}>{row.nama_siswa}</div>
                    <small>Kelas MIU: {row.kelas}</small>
                </div>
            )
        },
        {
            key: 'jenjang',
            label: 'Jenjang Formal',
            render: (row) => (
                <select
                    className="form-control form-control-sm"
                    value={mapping[row.id]?.jenjang || ''}
                    onChange={(e) => handleSingleChange(row.id, 'jenjang', e.target.value)}
                    disabled={!canEdit}
                >
                    <option value="">- Belum Diatur -</option>
                    <option value="SMP/MTS">SMP/MTS</option>
                    <option value="SMA/MA">SMA/MA</option>
                    <option value="Kuliah">Kuliah</option>
                </select>
            )
        },
        {
            key: 'semester',
            label: 'Semester',
            width: '120px',
            render: (row) => (
                <select
                    className="form-control form-control-sm"
                    value={mapping[row.id]?.semester || ''}
                    onChange={(e) => handleSingleChange(row.id, 'semester', e.target.value)}
                    disabled={!canEdit}
                >
                    <option value="">- Pilih -</option>
                    {['1', '2', '3', '4', '5', '6'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Pengaturan Kelompok Formal" subJudul="Pemetaan siswa madrasah MIU ke jenjang pendidikan formal." hideOnScreen={true} />

            <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {stats.map((s, i) => (
                    <div key={i} className="card-glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderRadius: '20px' }}>
                        <div style={{ width: '50px', height: '50px', borderRadius: '15px', background: s.color + '20', color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                            <i className={s.icon}></i>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.title}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{s.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bulk Action Controls */}
            <div className="card-glass" style={{ padding: '2rem', borderRadius: '24px', marginBottom: '2rem', border: '1px solid #f1f5f9' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                    <i className="fas fa-magic" style={{ marginRight: '10px' }}></i> Pengaturan Masal (Bulk Update)
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1 1 200px' }}>
                        <label className="form-label">Sasaran Kelas MIU</label>
                        <select className="form-control" value={filterKelas} onChange={e => setFilterKelas(e.target.value)}>
                            <option value="Semua">Semua Kelas</option>
                            {kelasOptions.map((k, i) => <option key={i} value={k}>{k}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: '1 1 150px' }}>
                        <label className="form-label">Setel Jenjang Ke</label>
                        <select className="form-control" value={bulkJenjang} onChange={e => setBulkJenjang(e.target.value)}>
                            <option value="SMP/MTS">SMP/MTS</option>
                            <option value="SMA/MA">SMA/MA</option>
                            <option value="Kuliah">Kuliah</option>
                        </select>
                    </div>
                    <div style={{ flex: '1 1 100px' }}>
                        <label className="form-label">Semester</label>
                        <select className="form-control" value={bulkSemester} onChange={e => setBulkSemester(e.target.value)}>
                            {['1', '2', '3', '4', '5', '6'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <button className="btn btn-secondary" onClick={applyBulkAction} style={{ flex: '1 1 150px', height: '50px' }}>
                        <i className="fas fa-bolt"></i> Terapkan Masal
                    </button>
                </div>
                <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    *Gunakan fitur ini untuk memetakan seluruh santri dalam satu kelas MIU ke Jenjang/Semester formal secara cepat.
                </p>
            </div>

            <DataViewContainer
                title="Daftar Pemetaan Siswa"
                subtitle={`Menampilkan ${filteredSantri.length} Santri MIU`}
                headerActions={canEdit && (
                    <button className="btn btn-primary" onClick={() => setIsConfirmOpen(true)} disabled={loading || santriList.length === 0}>
                        <i className="fas fa-save"></i> Simpan Semua Perubahan
                    </button>
                )}
                tableProps={{ columns, data: filteredSantri, loading }}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleSave}
                title="Simpan Pemetaan?"
                message="Data pemetaan jenjang dan semester formal akan disimpan ke dalam database. Ini akan mempengaruhi laporan absensi sekolah."
                type="info"
            />

            <style jsx>{`
                .form-label {
                    display: block;
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: var(--primary-dark);
                    margin-bottom: 8px;
                    text-transform: uppercase;
                }
            `}</style>
        </div>
    );
}
