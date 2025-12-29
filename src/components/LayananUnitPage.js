'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiCall, formatDate, formatCurrency } from '@/lib/utils';
import { useAuth, usePagePermission } from '@/lib/AuthContext';
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';
import Autocomplete from './Autocomplete';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput, TextAreaInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function LayananUnitPage({ unit: forceUnit }) {
    const { user } = useAuth();
    const { canEdit, canDelete } = usePagePermission();
    const [dynamicServices, setDynamicServices] = useState([]);
    const [dynamicPrices, setDynamicPrices] = useState({});
    const [santriOptions, setSantriOptions] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, setData, loading, setLoading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, formData, setFormData, editId,
        handleSave, handleDelete, openModal: baseOpenModal, openView, isAdmin
    } = useDataManagement('layanan_admin', {
        tanggal: '',
        unit: forceUnit, nama_santri: '', stambuk: '', jenis_layanan: '',
        nominal: '0', jumlah: '1', keterangan: '', pj: '', pemohon_tipe: 'Santri'
    });

    // Theme Configuration based on Unit
    const theme = useMemo(() => {
        switch (forceUnit) {
            case 'Keamanan': return { color: 'var(--danger)', icon: 'fas fa-shield-alt', bg: '#fef2f2', border: '#fee2e2' };
            case 'Kesehatan': return { color: '#ec4899', icon: 'fas fa-heartbeat', bg: '#fdf2f8', border: '#fce7f3' };
            case 'Pendidikan': return { color: '#f59e0b', icon: 'fas fa-graduation-cap', bg: '#fffbeb', border: '#fef3c7' };
            case "Jam'iyyah": return { color: '#6366f1', icon: 'fas fa-users', bg: '#eef2ff', border: '#e0e7ff' };
            case 'Sekretariat': default: return { color: 'var(--primary)', icon: 'fas fa-file-signature', bg: '#f8fafc', border: '#e2e8f0' };
        }
    }, [forceUnit]);

    React.useEffect(() => {
        setFormData(prev => ({ ...prev, tanggal: new Date().toISOString().split('T')[0] }));
    }, [setFormData]);

    const loadEnrichedData = useCallback(async () => {
        setLoading(true);
        try {
            const [res, resSantri, resMaster] = await Promise.all([
                apiCall('getData', 'GET', { type: 'layanan_admin' }),
                apiCall('getData', 'GET', { type: 'santri' }),
                apiCall('getData', 'GET', { type: 'layanan_master' })
            ]);

            const filtered = res?.filter(d => d.unit === forceUnit) || [];
            setData(filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)));
            setSantriOptions(resSantri || []);

            const unitServices = (resMaster || []).filter(s => s.unit === forceUnit && s.status === 'Aktif').map(s => s.nama_layanan);
            const prices = {};
            (resMaster || []).forEach(s => { prices[s.nama_layanan] = s.harga; });

            setDynamicServices(unitServices);
            setDynamicPrices(prices);

            if (unitServices.length > 0 && !formData.jenis_layanan) {
                setFormData(prev => ({ ...prev, jenis_layanan: unitServices[0], nominal: prices[unitServices[0]] || '0' }));
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, [forceUnit, setData, setLoading, formData.jenis_layanan, setFormData]);

    useEffect(() => { loadEnrichedData(); }, [loadEnrichedData]);

    const stats = useMemo(() => [
        { title: 'Total Layanan', value: data.length, icon: theme.icon, color: theme.color },
        { title: 'Pendapatan Unit', value: formatCurrency(data.reduce((acc, d) => acc + parseInt(d.nominal || 0), 0)), icon: 'fas fa-hand-holding-usd', color: '#10b981' },
        { title: 'Layanan Terpopuler', value: data.length > 0 ? (data.reduce((acc, d) => { acc[d.jenis_layanan] = (acc[d.jenis_layanan] || 0) + 1; return acc; }, {})) : '-', icon: 'fas fa-chart-line', color: '#f59e0b', renderValue: (v) => v === '-' ? '-' : Object.entries(v).sort((a, b) => b[1] - a[1])[0][0] }
    ], [data, theme]);

    const openModal = (item = null) => {
        if (!item) {
            baseOpenModal();
            const defaultService = dynamicServices?.[0] || '';
            setFormData(prev => ({ ...prev, tanggal: new Date().toISOString().split('T')[0], unit: forceUnit, jenis_layanan: defaultService, nominal: dynamicPrices[defaultService] || '0', pj: user?.fullname || user?.username || '' }));
        } else { baseOpenModal(item); }
    };

    const displayData = data.filter(d => d.unit === forceUnit && ((d.nama_santri || '').toLowerCase().includes(search.toLowerCase()) || (d.jenis_layanan || '').toLowerCase().includes(search.toLowerCase())));

    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => <span style={{ fontWeight: 600 }}>{formatDate(row.tanggal)}</span> },
        { key: 'nama_santri', label: 'Pemohon', render: (row) => <div><div style={{ fontWeight: 800 }}>{row.nama_santri}</div><small>Stambuk: {row.stambuk || '-'}</small></div> },
        { key: 'jenis_layanan', label: 'Layanan', render: (row) => <span className="th-badge">{row.jenis_layanan}</span> },
        { key: 'nominal', label: 'Biaya', render: (row) => <div style={{ fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(row.nominal)}</div> },
        {
            key: 'actions', label: 'Opsi', width: '150px', render: (row) => (
                <div className="table-actions">
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openView(row)}><i className="fas fa-eye"></i></button>
                    {canEdit && <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)}><i className="fas fa-edit"></i></button>}
                    {canDelete && <button className="btn-vibrant btn-vibrant-red" onClick={() => setConfirmDelete({ open: true, id: row.id })}><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul={`Administrasi ${forceUnit}`} subJudul={`Pusat layanan dan log aktivitas seksi ${forceUnit.toLowerCase()}.`} hideOnScreen={true} />

            <StatsPanel items={stats} />

            <div style={{ marginBottom: '2rem', padding: '1.5rem', background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: theme.color, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <i className={theme.icon}></i>
                </div>
                <div>
                    <h2 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>Layanan {forceUnit}</h2>
                    <p style={{ color: '#64748b', margin: 0 }}>Kelola transaksi dan pencatatan layanan khusus unit {forceUnit}.</p>
                </div>
            </div>

            <DataViewContainer
                title={`Administrasi Layanan ${forceUnit}`}
                subtitle={`Menampilkan riwayat transaksi unit.`}
                headerActions={canEdit && <button className="btn btn-primary btn-sm" onClick={() => openModal()}><i className="fas fa-plus"></i> Input Layanan Baru</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value) }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Form Layanan ${forceUnit}`} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>}>
                <TextInput label="Tanggal Log" type="date" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} />
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Nama Pemohon</label>
                        <Autocomplete options={santriOptions} value={formData.nama_santri} onChange={v => setFormData({ ...formData, nama_santri: v })} onSelect={s => setFormData({ ...formData, nama_santri: s.nama_siswa, stambuk: s.stambuk_pondok || formData.stambuk })} placeholder="Cari santri..." labelKey="nama_siswa" subLabelKey="kelas" />
                    </div>
                    <TextInput label="Nomor Stambuk" value={formData.stambuk} onChange={e => setFormData({ ...formData, stambuk: e.target.value })} />
                </div>
                <div className="form-grid">
                    <SelectInput label="Jenis Layanan" value={formData.jenis_layanan} onChange={e => { const val = e.target.value; setFormData({ ...formData, jenis_layanan: val, nominal: dynamicPrices[val] || '0' }); }} options={dynamicServices} />
                    <TextInput label="Biaya Tagihan (Rp)" type="number" value={formData.nominal} onChange={e => setFormData({ ...formData, nominal: e.target.value })} style={{ fontWeight: 800, color: 'var(--success)' }} icon="fas fa-札" />
                </div>
                <TextAreaInput label="Keterangan / PJ Layanan" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} />
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Transaksi Layanan" width="600px">
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>{viewData.jenis_layanan}</h2>
                            <div className="th-badge" style={{ padding: '5px 15px' }}>Unit {viewData.unit}</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '15px' }}>
                            <div><small>Pemohon</small><div style={{ fontWeight: 800 }}>{viewData.nama_santri}</div></div>
                            <div><small>Stambuk</small><div style={{ fontWeight: 700 }}>{viewData.stambuk || '-'}</div></div>
                            <div><small>Tanggal</small><div style={{ fontWeight: 700 }}>{formatDate(viewData.tanggal)}</div></div>
                            <div><small>Biaya</small><div style={{ fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(viewData.nominal)}</div></div>
                        </div>
                        <div style={{ marginTop: '1.5rem' }}><small>Catatan / Keterangan</small><p style={{ background: '#fff', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', marginTop: '5px' }}>{viewData.keterangan || '-'}</p></div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id, null); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Log Layanan?"
                message="Data pelayanan ini akan dihapus permanen dari buku unit."
            />
        </div>
    );
}
