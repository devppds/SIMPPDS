'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiCall } from '@/lib/utils';
import { useAuth, usePagePermission } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import Modal from '@/components/Modal';
import { TextInput, SelectInput, NumberInput } from '@/components/FormInput';
import StatsPanel from '@/components/StatsPanel';

import moment from 'moment-hijri';

const MONTHS = [
    'Muharram', 'Shafar', 'Rabiul Awal', 'Rabiul Akhir', 'Jumadil Awal', 'Jumadil Akhir',
    'Rajab', 'Sya\'ban', 'Ramadhan', 'Syawal', 'Dzulqa\'dah', 'Dzulhijjah'
];

export default function AbsensiPengurusPage() {
    const { user } = useAuth();
    const { canEdit } = usePagePermission();
    const { showToast } = useToast();

    // Filters (Default to current Hijri Month/Year)
    const nowHijri = moment();
    const currentHijriMonthIdx = nowHijri.iMonth(); // 0-indexed
    const currentHijriYear = nowHijri.iYear();

    const [filterMonth, setFilterMonth] = useState(MONTHS[currentHijriMonthIdx]);
    const [filterYear, setFilterYear] = useState(currentHijriYear.toString());

    // Data State
    const [loading, setLoading] = useState(false);
    const [pengurusList, setPengurusList] = useState([]);
    const [absenData, setAbsenData] = useState([]);
    const [targetData, setTargetData] = useState([]);

    // Form State (Local tracking for inputs)
    const [formState, setFormState] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Modal State
    const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
    const [targetForm, setTargetForm] = useState({ target: 30, applyToAll: true });

    const isMounted = React.useRef(true);

    useEffect(() => {
        isMounted.current = true;
        loadData();
        return () => { isMounted.current = false; };
    }, [filterMonth, filterYear]);

    const loadData = async () => {
        if (isMounted.current) setLoading(true);
        try {
            const [resPengurus, resAbsen, resTarget] = await Promise.all([
                apiCall('getData', 'GET', { type: 'pengurus' }),
                apiCall('getData', 'GET', { type: 'pengurus_absen' }),
                apiCall('getData', 'GET', { type: 'pengurus_target' })
            ]);

            if (isMounted.current) {
                const activePengurus = (resPengurus || []).filter(p => p.status === 'Aktif');
                setPengurusList(activePengurus);

                // Filter by month/year
                const monthAbsen = (resAbsen || []).filter(a => a.bulan === filterMonth && a.tahun === filterYear);
                const monthTarget = (resTarget || []).filter(t => t.bulan === filterMonth && t.tahun === filterYear);

                setAbsenData(monthAbsen);
                setTargetData(monthTarget);

                // Initialize formState from monthly data or default
                const initialState = {};
                activePengurus.forEach(p => {
                    const existing = monthAbsen.find(a => Number(a.pengurus_id) === Number(p.id));
                    initialState[p.id] = {
                        tugas: existing ? existing.tugas : 0,
                        izin: existing ? existing.izin : 0,
                        alfa: existing ? existing.alfa : 0,
                        alasan_izin: existing ? existing.alasan_izin : '',
                        id: existing ? existing.id : null
                    };
                });
                setFormState(initialState);
            }
        } catch (e) {
            console.error(e);
            if (isMounted.current) showToast("Gagal memuat data absensi.", "error");
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    const handleInputChange = (pengurusId, field, value) => {
        setFormState(prev => ({
            ...prev,
            [pengurusId]: {
                ...prev[pengurusId],
                [field]: value
            }
        }));
    };

    const handleSaveAbsensi = async () => {
        setSubmitting(true);
        try {
            const dataToSave = Object.entries(formState).map(([pid, val]) => {
                const pengurus = pengurusList.find(p => Number(p.id) === Number(pid));
                if (!pengurus) return null;
                return {
                    id: val.id,
                    pengurus_id: pid,
                    nama_pengurus: pengurus.nama,
                    bulan: filterMonth,
                    tahun: filterYear,
                    tugas: val.tugas,
                    izin: val.izin,
                    alfa: val.alfa,
                    alasan_izin: val.alasan_izin,
                    petugas: user?.fullname || 'Sekretariat'
                };
            }).filter(d => d !== null);

            // Execute sequentially to be safe
            for (const item of dataToSave) {
                await apiCall('saveData', 'POST', { type: 'pengurus_absen', data: item });
            }

            showToast(`Absensi pengurus bulan ${filterMonth} berhasil disimpan!`, "success");
            loadData();
        } catch (e) {
            showToast(e.message || "Gagal menyimpan absensi.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleApplyTarget = async () => {
        if (!targetForm.target) return showToast("Masukkan jumlah target!", "warning");
        setSubmitting(true);
        try {
            for (const p of pengurusList) {
                const existing = targetData.find(t => Number(t.pengurus_id) === Number(p.id));
                await apiCall('saveData', 'POST', {
                    type: 'pengurus_target',
                    data: {
                        id: existing ? existing.id : null,
                        pengurus_id: p.id,
                        nama_pengurus: p.nama,
                        bulan: filterMonth,
                        tahun: filterYear,
                        target_tugas: targetForm.target,
                        keterangan: `Target otomatis ${filterMonth} ${filterYear}`
                    }
                });
            }

            showToast("Target tugas bulanan berhasil diterapkan!", "success");
            setIsTargetModalOpen(false);
            loadData();
        } catch (e) {
            showToast(e.message || "Gagal menerapkan target.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    // Grouping logic
    const groupedData = useMemo(() => {
        const groups = {};
        pengurusList.forEach(p => {
            const jab = p.jabatan || 'Lainnya';
            if (!groups[jab]) groups[jab] = [];
            groups[jab].push(p);
        });
        return groups;
    }, [pengurusList]);

    const statsItems = useMemo(() => {
        const totalPengurus = pengurusList.length;
        const totalTugas = Object.values(formState).reduce((acc, curr) => acc + Number(curr.tugas || 0), 0);
        const totalIzin = Object.values(formState).reduce((acc, curr) => acc + Number(curr.izin || 0), 0);
        return [
            { title: 'Total Pengurus', value: totalPengurus, icon: 'fas fa-user-tie', color: 'var(--primary)' },
            { title: 'Total Tugas Hari Ini', value: totalTugas, icon: 'fas fa-check-circle', color: 'var(--success)' },
            { title: 'Total Izin', value: totalIzin, icon: 'fas fa-envelope-open-text', color: 'var(--warning)' }
        ];
    }, [pengurusList, formState]);

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Rekapitulasi Absensi Pengurus" subJudul={`Laporan kinerja bulanan pengurus Pondok Pesantren - ${filterMonth} ${filterYear}`} hideOnScreen={true} />

            <div className="filter-card card-glass" style={{ marginBottom: '20px', padding: '20px', borderRadius: '15px' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <SelectInput label="Pilih Bulan" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} options={MONTHS} />
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <SelectInput label="Pilih Tahun" value={filterYear} onChange={e => setFilterYear(e.target.value)} options={['1445', '1446', '1447', '1448', '1449']} />
                    </div>
                    <div style={{ flex: 2, display: 'flex', gap: '10px' }}>
                        <button className="btn btn-primary" onClick={handleSaveAbsensi} disabled={submitting || !canEdit} style={{ height: '45px', flex: 1 }}>
                            <i className="fas fa-save"></i> {submitting ? 'Menyimpan...' : 'Simpan Absensi'}
                        </button>
                        <button className="btn btn-outline" onClick={() => setIsTargetModalOpen(true)} disabled={!canEdit} style={{ height: '45px' }}>
                            <i className="fas fa-cog"></i> Atur Target
                        </button>
                    </div>
                </div>
            </div>

            <StatsPanel items={statsItems} />

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}><i className="fas fa-spinner fa-spin fa-2x"></i><p>Memuat data...</p></div>
            ) : (
                Object.entries(groupedData).map(([jabatan, list]) => (
                    <div key={jabatan} style={{ marginBottom: '30px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', borderLeft: '4px solid var(--primary)', paddingLeft: '15px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-dark)', margin: 0 }}>{jabatan}</h3>
                            <span className="th-badge" style={{ fontSize: '0.7rem' }}>{list.length} Orang</span>
                        </div>

                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Nama Pengurus</th>
                                        <th width="100px">Target</th>
                                        <th width="120px">Tugas</th>
                                        <th width="120px">Izin</th>
                                        <th width="120px">Alfa</th>
                                        <th>Alasan Izin / Keterangan</th>
                                        <th width="100px">Progres</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.map(p => {
                                        const values = formState[p.id] || { tugas: 0, izin: 0, alfa: 0, alasan_izin: '' };
                                        const targetObj = targetData.find(t => Number(t.pengurus_id) === Number(p.id));
                                        const targetVal = targetObj ? Number(targetObj.target_tugas) : 0;
                                        const progress = targetVal > 0 ? Math.min(100, Math.round((values.tugas / targetVal) * 100)) : 0;

                                        return (
                                            <tr key={p.id}>
                                                <td><strong>{p.nama}</strong><br /><small style={{ color: 'var(--text-muted)' }}>{p.divisi || '-'}</small></td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className="badge badge-info">{targetVal}</span>
                                                </td>
                                                <td>
                                                    <input type="number" className="form-control-sm" value={values.tugas} onChange={e => handleInputChange(p.id, 'tugas', e.target.value)} style={{ width: '80px', textAlign: 'center' }} />
                                                </td>
                                                <td>
                                                    <input type="number" className="form-control-sm" value={values.izin} onChange={e => handleInputChange(p.id, 'izin', e.target.value)} style={{ width: '80px', textAlign: 'center' }} />
                                                </td>
                                                <td>
                                                    <input type="number" className="form-control-sm" value={values.alfa} onChange={e => handleInputChange(p.id, 'alfa', e.target.value)} style={{ width: '80px', textAlign: 'center' }} />
                                                </td>
                                                <td>
                                                    <input type="text" className="form-control-sm" placeholder="Alasan jika izin..." value={values.alasan_izin} onChange={e => handleInputChange(p.id, 'alasan_izin', e.target.value)} style={{ width: '100%' }} />
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, marginBottom: '4px' }}>{progress}%</div>
                                                    <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${progress}%`, height: '100%', background: progress >= 100 ? 'var(--success)' : 'var(--primary)', transition: '0.3s' }}></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            )}

            <Modal isOpen={isTargetModalOpen} onClose={() => setIsTargetModalOpen(false)} title={`Atur Target Tugas: ${filterMonth} ${filterYear}`}>
                <div style={{ padding: '10px' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                        Tentukan berapa kali pengurus harus bertugas dalam bulan ini untuk menghitung persentase kinerja.
                    </p>
                    <NumberInput label="Target Tugas (Kali)" value={targetForm.target} onChange={e => setTargetForm({ ...targetForm, target: e.target.value })} required />
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button className="btn btn-outline" onClick={() => setIsTargetModalOpen(false)}>Batal</button>
                        <button className="btn btn-primary" onClick={handleApplyTarget} disabled={submitting}>
                            {submitting ? 'Menerapkan...' : 'Terapkan Ke Semua Pengurus'}
                        </button>
                    </div>
                </div>
            </Modal>

            <style jsx>{`
                .form-control-sm {
                    padding: 8px 12px;
                    border: 1px solid #e2e8f0;
                    borderRadius: 8px;
                    fontSize: 0.85rem;
                    transition: 0.2s;
                }
                .form-control-sm:focus {
                    border-color: var(--primary);
                    outline: none;
                    box-shadow: 0 0 0 3px var(--primary-light);
                }
                .table-wrapper {
                    background: white;
                    border-radius: 15px;
                    box-shadow: var(--shadow-sm);
                    overflow: hidden;
                }
                .table th { background: #f8fafc; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
            `}</style>
        </div>
    );
}
