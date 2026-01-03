'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiCall, formatCurrency, formatDate } from '@/lib/utils';
import { useDataManagement } from '@/hooks/useDataManagement';
import { usePagePermission } from '@/lib/AuthContext';
import Modal from '@/components/Modal';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';
import SortableTable from '@/components/SortableTable';

const UNITS = ['Sekretariat', 'Keamanan', 'Pendidikan', 'Kesehatan', "Jam'iyyah", 'Lab', 'Media'];

export default function SetoranUnitPage() {
    const { canEdit, canDelete } = usePagePermission();
    const [servicesData, setServicesData] = useState([]);
    const [statsLoading, setStatsLoading] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // useDataManagement for kas_unit (The right side & the main focus for Bendahara)
    const {
        data: depositData, setData: setDepositData, loading: depositLoading,
        search: depositSearch, setSearch: setDepositSearch, submitting,
        isModalOpen, setIsModalOpen, formData, setFormData, editId,
        handleSave, handleDelete, openModal, user
    } = useDataManagement('kas_unit', {
        tanggal: '',
        tipe: 'Masuk',
        nominal: '',
        kategori: 'Setoran Unit Sekretariat',
        keterangan: '',
        petugas: ''
    });

    const loadAllData = useCallback(async () => {
        setStatsLoading(true);
        try {
            const [services, deposits] = await Promise.all([
                apiCall('getData', 'GET', { type: 'layanan_admin' }),
                apiCall('getData', 'GET', { type: 'kas_unit' })
            ]);

            setServicesData(services || []);
            setDepositData(deposits || []);
        } catch (e) {
            console.error(e);
        } finally {
            setStatsLoading(false);
        }
    }, [setDepositData]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    // Calculate Summaries for Stats & Units
    const unitSummaries = useMemo(() => {
        return UNITS.map(unit => {
            const income = servicesData
                .filter(s => s.unit === unit)
                .reduce((acc, curr) => acc + (parseInt(curr.nominal) || 0), 0);

            const deposited = depositData
                .filter(d => d.kategori === `Setoran Unit ${unit}`)
                .reduce((acc, curr) => acc + (parseInt(curr.nominal) || 0), 0);

            return {
                unit,
                income,
                deposited,
                balance: income - deposited
            };
        });
    }, [servicesData, depositData]);

    const globalStats = useMemo(() => {
        const totalIncome = unitSummaries.reduce((acc, s) => acc + s.income, 0);
        const totalDeposited = unitSummaries.reduce((acc, s) => acc + s.deposited, 0);
        return [
            { title: 'Total Pendapatan Unit', value: formatCurrency(totalIncome), icon: 'fas fa-hand-holding-usd', color: 'var(--success)' },
            { title: 'Total Disetorkan', value: formatCurrency(totalDeposited), icon: 'fas fa-file-invoice-dollar', color: 'var(--primary)' },
            { title: 'Sisa di Unit (Total)', value: formatCurrency(totalIncome - totalDeposited), icon: 'fas fa-wallet', color: 'var(--warning)' },
        ];
    }, [unitSummaries]);

    const serviceColumns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => formatDate(row.tanggal) },
        { key: 'unit', label: 'Unit', render: (row) => <span className="th-badge">{row.unit}</span> },
        {
            key: 'jenis_layanan',
            label: 'Layanan',
            render: (row) => (
                <div>
                    <div style={{ fontWeight: 700 }}>{row.jenis_layanan}</div>
                    <small style={{ color: 'var(--text-muted)' }}>{row.nama_santri}</small>
                </div>
            )
        },
        { key: 'nominal', label: 'Nominal', render: (row) => <span style={{ fontWeight: 800 }}>{formatCurrency(row.nominal)}</span> },
    ];

    const depositColumns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => formatDate(row.tanggal) },
        { key: 'kategori', label: 'Unit', render: (row) => <strong>{row.kategori.replace('Setoran Unit ', '')}</strong> },
        { key: 'nominal', label: 'Nominal', render: (row) => <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(row.nominal)}</span> },
        {
            key: 'actions', label: 'Aksi', width: '80px', render: (row) => (
                <div className="table-actions">
                    {canEdit && <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)}><i className="fas fa-edit"></i></button>}
                    {canDelete && <button className="btn-vibrant btn-vibrant-red" onClick={() => setConfirmDelete({ open: false, id: row.id })}><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    if (!mounted) return null;

    return (
        <div className="view-container animate-in">
            <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 className="outfit" style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--primary-dark)' }}>
                        Setoran Kas Unit
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                        Monitoring pendapatan layanan unit dan sinkronisasi kas bendahara.
                    </p>
                </div>
                {canEdit && (
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <i className="fas fa-plus"></i> Input Setoran Baru
                    </button>
                )}
            </div>

            <StatsPanel items={globalStats} />

            {/* Top Section: Unit Status Overview */}
            <div style={{ marginTop: '2.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-dark)', margin: 0 }}>Status Kas Per-Unit</h2>
                    <div className="th-badge" style={{ background: '#e0f2fe', color: '#0369a1' }}><i className="fas fa-info-circle"></i> Monitoring Kewajiban Setor</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {unitSummaries.map((s, i) => (
                        <div key={i} className="card-hover" style={{
                            background: '#fff',
                            padding: '1.5rem',
                            borderRadius: '16px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>UNIT</div>
                                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary-dark)' }}>{s.unit}</div>
                                </div>
                                <div className="th-badge" style={{
                                    background: s.balance <= 0 ? '#dcfce7' : '#fee2e2',
                                    color: s.balance <= 0 ? '#166534' : '#991b1b',
                                    fontSize: '0.7rem'
                                }}>
                                    {s.balance <= 0 ? 'LUNAS' : 'BELUM SETOR'}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
                                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px' }}>
                                    <small style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Pendapatan</small>
                                    <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.9rem' }}>{formatCurrency(s.income)}</div>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px' }}>
                                    <small style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Disetor</small>
                                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>{formatCurrency(s.deposited)}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px dashed #e2e8f0' }}>
                                <div>
                                    <small style={{ fontSize: '0.7rem', color: '#64748b' }}>Sisa (Saldo Unit)</small>
                                    <div style={{ fontWeight: 800, color: s.balance > 0 ? '#dc2626' : '#64748b' }}>{formatCurrency(s.balance)}</div>
                                </div>
                                {s.balance > 0 && (
                                    <button
                                        className="btn-vibrant btn-vibrant-blue"
                                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                        onClick={() => {
                                            openModal();
                                            setFormData(prev => ({
                                                ...prev,
                                                kategori: `Setoran Unit ${s.unit}`,
                                                nominal: s.balance.toString(),
                                                keterangan: `Penyetoran sisa kas unit ${s.unit.toLowerCase()}`
                                            }));
                                        }}
                                    >
                                        <i className="fas fa-hand-holding-usd"></i> Tagih
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="main-grid-layout">
                {/* Left Side: Activity of Unit Services */}
                <div className="primary-column">
                    <div className="card" style={{ padding: 0, overflow: 'hidden', height: '100%' }}>
                        <div className="card-header" style={{ padding: '1.5rem', marginBottom: 0, borderBottom: '1px solid #f1f5f9' }}>
                            <div>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Log Masuk (Layanan Unit)</h2>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rincian pendapatan dari layanan tiap unit.</p>
                            </div>
                        </div>
                        <div style={{ padding: '0' }}>
                            <SortableTable
                                columns={serviceColumns}
                                data={servicesData.slice(0, 50)}
                                loading={statsLoading}
                                emptyMessage="Belum ada aktivitas layanan unit."
                            />
                        </div>
                    </div>
                </div>

                {/* Right Side: Riwayat Setoran */}
                <div className="secondary-column">
                    <div className="card" style={{ padding: 0, overflow: 'hidden', height: '100%' }}>
                        <div className="card-header" style={{ padding: '1.5rem', marginBottom: 0, borderBottom: '1px solid #f1f5f9' }}>
                            <div>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Log Keluar (Setoran Bendahara)</h2>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Riwayat uang yang diserahkan ke bendahara.</p>
                            </div>
                        </div>
                        <div style={{ padding: '0' }}>
                            <SortableTable
                                columns={depositColumns}
                                data={depositData.filter(d => d.kategori.startsWith('Setoran Unit'))}
                                loading={depositLoading}
                                emptyMessage="Belum ada riwayat setoran."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Input Setoran */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? "Update Data Setoran" : "Input Setoran Unit"}
                footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>}
            >
                <TextInput label="Tanggal Setoran" type="date" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} />
                <SelectInput
                    label="Pilih Unit"
                    value={formData.kategori}
                    onChange={e => setFormData({ ...formData, kategori: e.target.value })}
                    options={UNITS.map(u => `Setoran Unit ${u}`)}
                />
                <TextInput label="Nominal (Rp)" type="number" value={formData.nominal} onChange={e => setFormData({ ...formData, nominal: e.target.value })} />
                <TextInput label="Nama Petugas / Bendahara" value={formData.petugas} onChange={e => setFormData({ ...formData, petugas: e.target.value })} />
                <TextInput label="Keterangan Lanjutan" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} />
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id); setConfirmDelete({ open: false, id: null }); loadAllData(); }}
                title="Hapus Riwayat Setoran?"
                message="Data ini akan dihapus dari log bendahara dan mempengaruhi saldo unit."
            />
        </div>
    );
}
