'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiCall, formatCurrency, formatDate } from '@/lib/utils';
import { useDataManagement } from '@/hooks/useDataManagement';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput, TextAreaInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

const UNITS = ['Sekretariat', 'Keamanan', 'Pendidikan', 'Kesehatan', "Jam'iyyah"];

export default function SetoranUnitPage() {
    const { user } = useAuth();
    const [layananLogs, setLayananLogs] = useState([]);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedUnitDetails, setSelectedUnitDetails] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, setData, loading, setLoading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, formData, setFormData,
        handleDelete, isAdmin
    } = useDataManagement('kas_unit', {
        tanggal: new Date().toISOString().split('T')[0],
        unit: 'Sekretariat', nominal: '', keterangan: '', petugas: user?.fullname || '', status_setor: 'Selesai'
    });

    const loadEnrichedData = useCallback(async () => {
        setLoading(true);
        try {
            const [kasRes, layananRes] = await Promise.all([
                apiCall('getData', 'GET', { type: 'kas_unit' }),
                apiCall('getData', 'GET', { type: 'layanan_admin' })
            ]);
            setData(kasRes || []);
            setLayananLogs(layananRes || []);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, [setData, setLoading]);

    useEffect(() => { loadEnrichedData(); }, [loadEnrichedData]);

    const handleSaveSetoran = async (e) => {
        if (e) e.preventDefault();
        try {
            await apiCall('saveData', 'POST', { type: 'kas_unit', data: { ...formData, tipe: 'Masuk', kategori: 'Setoran Unit' } });
            await apiCall('saveData', 'POST', {
                type: 'arus_kas',
                data: {
                    tanggal: formData.tanggal, tipe: 'Masuk', kategori: 'Setoran Unit',
                    nominal: formData.nominal, keterangan: `Setoran Unit ${formData.unit}: ${formData.keterangan}`,
                    pj: formData.unit
                }
            });
            setIsModalOpen(false);
            loadEnrichedData();
        } catch (err) { console.error(err); }
    };

    const unitSummary = useMemo(() => UNITS.map(unit => {
        const totalLayanan = layananLogs.filter(l => l.unit === unit).reduce((sum, l) => sum + parseInt(l.nominal || 0), 0);
        const totalSetor = data.filter(d => d.unit === unit).reduce((sum, d) => sum + parseInt(d.nominal || 0), 0);
        return { unit, totalLayanan, totalSetor, pending: totalLayanan - totalSetor };
    }), [data, layananLogs]);

    const stats = useMemo(() => {
        const totalTerima = data.reduce((sum, d) => sum + parseInt(d.nominal || 0), 0);
        const totalPotential = layananLogs.reduce((sum, l) => sum + parseInt(l.nominal || 0), 0);
        return [
            { title: 'Total Setoran', value: formatCurrency(totalTerima), icon: 'fas fa-hand-holding-usd', color: 'var(--success)' },
            { title: 'Potential Unit', value: formatCurrency(totalPotential), icon: 'fas fa-calculator', color: 'var(--primary)' },
            { title: 'Pending Setor', value: formatCurrency(Math.max(0, totalPotential - totalTerima)), icon: 'fas fa-hourglass-half', color: 'var(--warning)' }
        ];
    }, [data, layananLogs]);

    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => <strong>{formatDate(row.tanggal)}</strong> },
        { key: 'unit', label: 'Unit', render: (row) => <span className="th-badge">{row.unit}</span> },
        { key: 'nominal', label: 'Nominal', render: (row) => <span style={{ fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(row.nominal)}</span> },
        { key: 'petugas', label: 'Penerima' },
        {
            key: 'actions', label: 'Aksi', width: '80px', render: (row) => (
                isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => setConfirmDelete({ open: true, id: row.id })}><i className="fas fa-trash"></i></button>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Monitoring Setoran Keuangan Unit" subJudul="Rekonsiliasi pendapatan harian seksi." hideOnScreen={true} />

            <StatsPanel items={stats} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                <div className="card">
                    <div className="card-header"><h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Ringkasan Unit</h2></div>
                    <div style={{ padding: '0 1.5rem 1.5rem' }}>
                        {unitSummary.map((s, idx) => (
                            <div key={idx} onClick={() => { setSelectedUnitDetails(s); setIsDetailsOpen(true); }} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', marginBottom: '10px', border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'transform 0.2s' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 800 }}>{s.unit}</span>
                                    <span className="th-badge" style={{ background: s.pending <= 0 ? '#dcfce7' : '#fee2e2', color: s.pending <= 0 ? '#166534' : '#991b1b', fontSize: '0.6rem' }}>{s.pending <= 0 ? 'LUNAS' : 'PENDING'}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                                    <div><small>Layanan</small><div style={{ fontWeight: 700 }}>{formatCurrency(s.totalLayanan)}</div></div>
                                    <div><small>Pending</small><div style={{ fontWeight: 700, color: s.pending > 0 ? '#dc2626' : '#059669' }}>{formatCurrency(Math.max(0, s.pending))}</div></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DataViewContainer
                    title="Riwayat Setoran"
                    subtitle="Log penerimaan dana dari unit seksi."
                    headerActions={<button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}><i className="fas fa-plus"></i> Catat Setoran</button>}
                    searchProps={{ value: search, onChange: e => setSearch(e.target.value) }}
                    tableProps={{ columns, data: data.filter(d => d.unit.toLowerCase().includes(search.toLowerCase())), loading }}
                />
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Pencatatan Setoran" footer={<button className="btn btn-primary" onClick={handleSaveSetoran} disabled={submitting}>{submitting ? 'Memproses...' : 'Simpan'}</button>}>
                <TextInput label="Tanggal" type="date" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} />
                <div className="form-grid">
                    <SelectInput label="Unit Cabang" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} options={UNITS} />
                    <TextInput label="Nominal Setoran" type="number" value={formData.nominal} onChange={e => setFormData({ ...formData, nominal: e.target.value })} required icon="fas fa-coins" />
                </div>
                <TextAreaInput label="Keterangan / Memo" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} />
            </Modal>

            <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title={selectedUnitDetails?.unit} width="600px">
                {selectedUnitDetails && (
                    <div className="detail-view">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div className="stat-card" style={{ background: '#f8fafc', boxShadow: 'none', padding: '1rem' }}><small>Total Layanan</small><div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{formatCurrency(selectedUnitDetails.totalLayanan)}</div></div>
                            <div className="stat-card" style={{ background: '#f8fafc', boxShadow: 'none', padding: '1rem' }}><small>Total Disetor</small><div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--success)' }}>{formatCurrency(selectedUnitDetails.totalSetor)}</div></div>
                        </div>
                        <h4 style={{ fontWeight: 800, marginBottom: '0.8rem' }}>Log Transaksi Setoran</h4>
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            <table className="table table-sm">
                                <thead><tr><th>Tanggal</th><th style={{ textAlign: 'right' }}>Nominal</th></tr></thead>
                                <tbody>
                                    {data.filter(d => d.unit === selectedUnitDetails.unit).map((d, i) => (
                                        <tr key={i}><td>{formatDate(d.tanggal)}</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(d.nominal)}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id); setConfirmDelete({ open: false, id: null }); loadEnrichedData(); }}
                title="Hapus Log Setoran?"
                message="Data ini akan dihapus. Pastikan saldo arus kas utama juga disesuaikan secara manual jika perlu."
            />
        </div>
    );
}
