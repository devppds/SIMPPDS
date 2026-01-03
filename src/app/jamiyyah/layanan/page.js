'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiCall, formatDate, formatCurrency } from '@/lib/utils';
import { useAuth, usePagePermission } from '@/lib/AuthContext';
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';
import Autocomplete from '@/components/Autocomplete';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput, TextAreaInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function LayananJamiyyahPage() {
    const { user } = useAuth();
    const { canEdit, canDelete } = usePagePermission();
    const [dynamicServices, setDynamicServices] = useState([]);
    const [dynamicPrices, setDynamicPrices] = useState({});
    const [santriOptions, setSantriOptions] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const JAM_OPTIONS = ['Pusat (JSPD)', 'Ahlussalam', 'Tahiyatan Wasalaman', 'Al Huda'];

    const {
        data, setData, loading, setLoading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, formData, setFormData, editId,
        handleSave, handleDelete, openModal: baseOpenModal, openView
    } = useDataManagement('layanan_admin', {
        tanggal: new Date().toISOString().split('T')[0],
        unit: "Jam'iyyah", nama_santri: '', stambuk: '', jenis_layanan: '',
        nominal: '0', jumlah: '1', keterangan: '', pj: '', pemohon_tipe: 'Santri'
    });

    const loadEnrichedData = useCallback(async () => {
        setLoading(true);
        try {
            const [res, resSantri, resMaster] = await Promise.all([
                apiCall('getData', 'GET', { type: 'layanan_admin' }),
                apiCall('getData', 'GET', { type: 'santri' }),
                apiCall('getData', 'GET', { type: 'layanan_master' })
            ]);

            const filtered = res?.filter(d => d.unit === "Jam'iyyah") || [];
            setData(filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)));
            setSantriOptions(resSantri || []);

            const unitServices = (resMaster || []).filter(s => s.unit === "Jam'iyyah" && s.status === 'Aktif').map(s => s.nama_layanan);
            const prices = {};
            (resMaster || []).forEach(s => { prices[s.nama_layanan] = s.harga; });

            setDynamicServices(unitServices);
            setDynamicPrices(prices);

            if (unitServices.length > 0 && !formData.jenis_layanan) {
                setFormData(prev => ({ ...prev, jenis_layanan: unitServices[0], nominal: prices[unitServices[0]] || '0' }));
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, [setData, setLoading, formData.jenis_layanan, setFormData]);

    useEffect(() => { loadEnrichedData(); }, [loadEnrichedData]);

    const stats = useMemo(() => [
        { title: 'Total Layanan', value: data.length, icon: 'fas fa-users', color: '#6366f1' },
        { title: 'Pendapatan Unit', value: formatCurrency(data.reduce((acc, d) => acc + parseInt(d.nominal || 0), 0)), icon: 'fas fa-hand-holding-usd', color: '#10b981' },
        { title: 'Layanan Aktif', value: dynamicServices.length, icon: 'fas fa-list-check', color: '#f59e0b' }
    ], [data, dynamicServices]);

    const openModal = (item = null) => {
        if (!item) {
            baseOpenModal();
            const defaultService = dynamicServices?.[0] || '';
            setFormData(prev => ({
                ...prev,
                tanggal: new Date().toISOString().split('T')[0],
                unit: "Jam'iyyah",
                jenis_layanan: defaultService,
                nominal: dynamicPrices[defaultService] || '0',
                pj: user?.fullname || user?.username || '',
                nama_santri: '',
                stambuk: '',
                pemohon_tipe: defaultService.toLowerCase().includes('1 set') ? 'Organisasi' : 'Santri'
            }));
        } else { baseOpenModal(item); }
    };

    const handleServiceChange = (val) => {
        const isSet = val.toLowerCase().includes('1 set');
        setFormData(prev => ({
            ...prev,
            jenis_layanan: val,
            nominal: dynamicPrices[val] || '0',
            pemohon_tipe: isSet ? 'Organisasi' : 'Santri',
            nama_santri: isSet ? JAM_OPTIONS[0] : '', // Default to first Jam'iyyah if set
            stambuk: isSet ? '-' : ''
        }));
    };

    const displayData = data.filter(d =>
        (d.nama_santri || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.jenis_layanan || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => <span style={{ fontWeight: 600 }}>{formatDate(row.tanggal)}</span> },
        {
            key: 'nama_santri',
            label: 'Pemohon',
            render: (row) => (
                <div>
                    <div style={{ fontWeight: 800 }}>{row.nama_santri}</div>
                    <small style={{ color: 'var(--text-muted)' }}>{row.pemohon_tipe === 'Organisasi' ? 'Wilayah/Pusat' : `Stambuk: ${row.stambuk || '-'}`}</small>
                </div>
            )
        },
        { key: 'jenis_layanan', label: 'Layanan', render: (row) => <span className="th-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{row.jenis_layanan}</span> },
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
            <KopSurat judul="Layanan Jam'iyyah" subJudul="Pencatatan registrasi alat rebana dan layanan jam'iyyah lainnya." hideOnScreen={true} />

            <div style={{ marginBottom: '2rem' }}>
                <h1 className="outfit" style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>
                    Administrasi Jam’iyyah
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Pusat registrasi inventaris rebana dan administrasi wilayah jam'iyyah.</p>
            </div>

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Log Transaksi Layanan"
                subtitle="Daftar santri dan wilayah yang melakukan registrasi layanan."
                headerActions={canEdit && <button className="btn btn-primary" onClick={() => openModal()}><i className="fas fa-plus"></i> Input Layanan Baru</button>}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: "Cari pemohon atau layanan..." }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Form Layanan Jam'iyyah" footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Transaksi'}</button>}>
                <TextInput label="Tanggal Log" type="date" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} />

                <div className="form-group">
                    <SelectInput label="Jenis Layanan" value={formData.jenis_layanan} onChange={e => handleServiceChange(e.target.value)} options={dynamicServices} />
                </div>

                {formData.jenis_layanan.toLowerCase().includes('1 set') ? (
                    <div className="form-group animate-in">
                        <SelectInput
                            label="Pilih Jam'iyyah (Wilayah/Pusat)"
                            value={formData.nama_santri}
                            onChange={e => setFormData({ ...formData, nama_santri: e.target.value, stambuk: '-' })}
                            options={JAM_OPTIONS}
                        />
                    </div>
                ) : (
                    <div className="form-grid animate-in">
                        <div className="form-group">
                            <label className="form-label">Nama Pemohon (Santri)</label>
                            <Autocomplete options={santriOptions} value={formData.nama_santri} onChange={v => setFormData({ ...formData, nama_santri: v })} onSelect={s => setFormData({ ...formData, nama_santri: s.nama_siswa, stambuk: s.stambuk_pondok || formData.stambuk })} placeholder="Cari santri..." labelKey="nama_siswa" subLabelKey="kelas" />
                        </div>
                        <TextInput label="Nomor Stambuk" value={formData.stambuk} onChange={e => setFormData({ ...formData, stambuk: e.target.value })} />
                    </div>
                )}

                <div className="form-grid">
                    <TextInput label="Biaya Tagihan (Rp)" type="number" value={formData.nominal} onChange={e => setFormData({ ...formData, nominal: e.target.value })} style={{ fontWeight: 800, color: 'var(--success)' }} />
                    <TextInput label="Petugas" value={formData.pj} readOnly style={{ background: '#f8fafc' }} />
                </div>

                <TextAreaInput label="Keterangan Lanjutan" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} />
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Transaksi Layanan" width="600px">
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>{viewData.jenis_layanan}</div>
                            <h2 style={{ fontSize: '2.2rem', fontWeight: 900 }}>{viewData.nama_santri}</h2>
                            <div className="th-badge" style={{ background: '#f1f5f9' }}>{viewData.pemohon_tipe || 'Santri'}</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '20px' }}>
                            <div><small>Stambuk</small><div style={{ fontWeight: 700 }}>{viewData.stambuk || '-'}</div></div>
                            <div><small>Tanggal</small><div style={{ fontWeight: 700 }}>{formatDate(viewData.tanggal)}</div></div>
                            <div><small>Total Biaya</small><div style={{ fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(viewData.nominal)}</div></div>
                            <div><small>Petugas</small><div style={{ fontWeight: 700 }}>{viewData.pj || '-'}</div></div>
                        </div>
                        <div style={{ marginTop: '1.5rem' }}><small>Catatan / Keterangan</small><p style={{ background: '#fff', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '15px', marginTop: '8px', lineHeight: '1.6' }}>{viewData.keterangan || '-'}</p></div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id, null); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Log Transaksi?"
                message="Data registrasi ini akan dihapus permanen dari sistem."
            />
        </div>
    );
}
