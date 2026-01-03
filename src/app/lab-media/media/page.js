'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiCall, formatDate, formatCurrency } from '@/lib/utils';
import { useAuth, usePagePermission } from '@/lib/AuthContext';
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';
import Autocomplete from '@/components/Autocomplete';
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput, TextAreaInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function MediaPage() {
    const { user } = useAuth();
    const { canEdit, canDelete } = usePagePermission();
    const [tarifList, setTarifList] = useState([]);
    const [santriOptions, setSantriOptions] = useState([]);
    const [kasData, setKasData] = useState([]);
    const [loadingKas, setLoadingKas] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, type: 'layanan' });

    // 1. Incomes (layanan_admin)
    const {
        data: layananData, setData: setLayananData, loading: loadingLayanan, submitting,
        isModalOpen: isIncomeModalOpen, setIsModalOpen: setIsIncomeModalOpen,
        formData: incomeForm, setFormData: setIncomeForm, editId: incomeEditId,
        handleSave: handleSaveIncome, handleDelete: handleDeleteIncome, openModal: openIncomeModal
    } = useDataManagement('layanan_admin', {
        tanggal: new Date().toISOString().split('T')[0],
        unit: 'Media', nama_santri: '', stambuk: '', jenis_layanan: '',
        nominal: '0', jumlah: '1', keterangan: '', pj: user?.fullname || '', pemohon_tipe: 'Santri'
    });

    // 2. Expenses & Setoran (unit_lab_media_kas)
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [expenseForm, setExpenseForm] = useState({
        tanggal: new Date().toISOString().split('T')[0],
        unit: 'Media', tipe: 'Keluar', kategori: 'Pemeliharaan Alat', nominal: '', keterangan: '', petugas: user?.fullname || ''
    });

    const loadData = useCallback(async () => {
        setLoadingKas(true);
        try {
            const [resTarif, resSantri, resKas] = await Promise.all([
                apiCall('getData', 'GET', { type: 'unit_lab_media_tarif' }),
                apiCall('getData', 'GET', { type: 'santri' }),
                apiCall('getData', 'GET', { type: 'unit_lab_media_kas' })
            ]);
            setTarifList((resTarif || []).filter(t => t.unit === 'Media'));
            setSantriOptions(resSantri || []);
            setKasData((resKas || []).filter(k => k.unit === 'Media'));
        } catch (e) { console.error(e); } finally { setLoadingKas(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const stats = useMemo(() => {
        const income = layananData.reduce((acc, d) => acc + (parseInt(d.nominal) || 0), 0);
        const expense = kasData.filter(k => k.tipe === 'Keluar').reduce((acc, k) => acc + (parseInt(k.nominal) || 0), 0);
        return [
            { title: 'Pendapatan Media', value: formatCurrency(income), icon: 'fas fa-arrow-down', color: '#8b5cf6' },
            { title: 'Biaya Pemeliharaan', value: formatCurrency(expense), icon: 'fas fa-arrow-up', color: 'var(--danger)' },
            { title: 'Saldo Kas Media', value: formatCurrency(income - expense), icon: 'fas fa-wallet', color: 'var(--primary)' }
        ];
    }, [layananData, kasData]);

    const handleSaveExpense = async (e) => {
        if (e) e.preventDefault();
        try {
            await apiCall('saveData', 'POST', { type: 'unit_lab_media_kas', data: expenseForm });
            setIsExpenseModalOpen(false);
            loadData();
        } catch (err) { alert(err.message); }
    };

    const handleSetoran = async () => {
        const income = layananData.reduce((acc, d) => acc + (parseInt(d.nominal) || 0), 0);
        const expense = kasData.filter(k => k.tipe === 'Keluar').reduce((acc, k) => acc + (parseInt(k.nominal) || 0), 0);
        const balance = income - expense;

        if (balance <= 0) return alert("Tidak ada saldo untuk disetorkan.");

        if (confirm(`Setorkan saldo Media sebesar ${formatCurrency(balance)} ke Bendahara?`)) {
            try {
                // 1. Record in Media Kas as Setoran (Keluar)
                await apiCall('saveData', 'POST', {
                    type: 'unit_lab_media_kas',
                    data: {
                        tanggal: new Date().toISOString().split('T')[0],
                        unit: 'Media', tipe: 'Keluar', kategori: 'Setoran ke Bendahara',
                        nominal: balance, keterangan: 'Penyetoran pendapatan Media ke pusat',
                        petugas: user?.fullname || 'Admin'
                    }
                });

                // 2. Record in Central Kas Unit (Masuk)
                await apiCall('saveData', 'POST', {
                    type: 'kas_unit',
                    data: {
                        tanggal: new Date().toISOString().split('T')[0],
                        tipe: 'Masuk', kategori: 'Setoran Unit Media',
                        nominal: balance, keterangan: 'Penerimaan biaya penyewaan Media',
                        petugas: user?.fullname || 'Admin'
                    }
                });

                loadData();
                alert("Setoran berhasil dicatat!");
            } catch (err) { alert(err.message); }
        }
    };

    const incomeColumns = [
        { key: 'tanggal', label: 'Tgl Pinjam', width: '120px', render: (row) => formatDate(row.tanggal) },
        { key: 'nama_santri', label: 'Santri / Peminjam', render: (row) => <div><strong>{row.nama_santri}</strong><br /><small>{row.jenis_layanan}</small></div> },
        { key: 'nominal', label: 'Biaya Sewa', render: (row) => <span style={{ fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(row.nominal)}</span> },
        {
            key: 'actions', label: 'Opsi', width: '80px', render: (row) => (
                <div className="table-actions">
                    {canEdit && <button className="btn-vibrant btn-vibrant-blue" onClick={() => openIncomeModal(row)}><i className="fas fa-edit"></i></button>}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <div style={{
                marginBottom: '3.5rem',
                padding: '2.5rem',
                background: 'linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: '2.5rem',
                boxShadow: 'var(--shadow-premium)',
                color: '#fff',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-20%',
                    right: '-10%',
                    fontSize: '15rem',
                    color: 'rgba(255,255,255,0.03)',
                    transform: 'rotate(-15deg)',
                    pointerEvents: 'none'
                }}>
                    <i className="fas fa-camera"></i>
                </div>

                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '24px',
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.2)'
                }}>
                    <i className="fas fa-photo-video"></i>
                </div>
                <div style={{ flex: 1 }}>
                    <h1 className="outfit" style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '6px', letterSpacing: '-0.5px' }}>
                        Layanan Media & Dokumentasi
                    </h1>
                    <p style={{ opacity: 0.8, margin: 0, fontSize: '1.1rem', fontWeight: 500 }}>
                        Pusat pengelolaan inventaris peralatan media, dokumentasi, dan penyewaan alat digital.
                    </p>
                </div>
                <button className="btn-vibrant btn-vibrant-purple" style={{ height: 'fit-content', padding: '1.25rem 2.5rem', borderRadius: '18px', fontSize: '1rem', fontWeight: 800, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)' }} onClick={handleSetoran}>
                    <i className="fas fa-university"></i> Setor ke Bendahara
                </button>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <StatsPanel items={stats} />
            </div>

            <div className="main-grid-layout">
                <div className="primary-column">
                    <DataViewContainer
                        title="Daftar Penyewaan Alat"
                        subtitle="Peminjaman Fasilitas Media"
                        headerActions={canEdit && <button className="btn btn-primary btn-sm" onClick={() => openIncomeModal()}><i className="fas fa-plus"></i> Input Sewa Baru</button>}
                        tableProps={{ columns: incomeColumns, data: layananData, loading: loadingLayanan }}
                    />
                </div>
                <div className="secondary-column">
                    <DataViewContainer
                        title="Log Kas Media"
                        subtitle="Pemeliharaan & Setoran"
                        headerActions={canEdit && <button className="btn btn-outline btn-sm" onClick={() => setIsExpenseModalOpen(true)}><i className="fas fa-minus"></i> Catat Pemeliharaan</button>}
                        tableProps={{
                            columns: [
                                { key: 'tanggal', label: 'Tgl', render: (row) => formatDate(row.tanggal) },
                                { key: 'kategori', label: 'Item', render: (row) => <strong>{row.kategori}</strong> },
                                { key: 'nominal', label: 'Biaya', render: (row) => <span style={{ fontWeight: 800, color: 'var(--danger)' }}>{formatCurrency(row.nominal)}</span> }
                            ], data: kasData, loading: loadingKas
                        }}
                    />
                </div>
            </div>

            {/* Income Modal */}
            <Modal isOpen={isIncomeModalOpen} onClose={() => setIsIncomeModalOpen(false)} title="Form Penyewaan Media" footer={<button className="btn btn-primary" onClick={handleSaveIncome}>Simpan</button>}>
                <TextInput label="Tanggal Pinjam" type="date" value={incomeForm.tanggal} onChange={e => setIncomeForm({ ...incomeForm, tanggal: e.target.value })} />
                <div className="form-group">
                    <label className="form-label">Nama Peminjam</label>
                    <Autocomplete options={santriOptions} value={incomeForm.nama_santri} onChange={v => setIncomeForm({ ...incomeForm, nama_santri: v })} onSelect={s => setIncomeForm({ ...incomeForm, nama_santri: s.nama_siswa, stambuk: s.stambuk_pondok })} placeholder="Cari santri..." labelKey="nama_siswa" subLabelKey="kelas" />
                </div>
                <SelectInput label="Alat Yang Disewa" value={incomeForm.jenis_layanan} onChange={e => {
                    const sel = tarifList.find(t => t.nama_layanan === e.target.value);
                    setIncomeForm({ ...incomeForm, jenis_layanan: e.target.value, nominal: sel?.harga || '0' });
                }} options={tarifList.map(t => t.nama_layanan)} />
                <TextInput label="Biaya Sewa (Rp)" type="number" value={incomeForm.nominal} onChange={e => setIncomeForm({ ...incomeForm, nominal: e.target.value })} />
                <TextAreaInput label="Keterangan Lanjutan" value={incomeForm.keterangan} onChange={e => setIncomeForm({ ...incomeForm, keterangan: e.target.value })} />
            </Modal>

            {/* Expense Modal */}
            <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Biaya Pemeliharaan Media" footer={<button className="btn btn-primary" onClick={handleSaveExpense}>Simpan</button>}>
                <TextInput label="Tanggal" type="date" value={expenseForm.tanggal} onChange={e => setExpenseForm({ ...expenseForm, tanggal: e.target.value })} />
                <SelectInput label="Kategori" value={expenseForm.kategori} onChange={e => setExpenseForm({ ...expenseForm, kategori: e.target.value })} options={['Servis Alat', 'Beli Aksesoris', 'Baterai / Memory', 'Lainnya']} />
                <TextInput label="Nominal (Rp)" type="number" value={expenseForm.nominal} onChange={e => setExpenseForm({ ...expenseForm, nominal: e.target.value })} />
                <TextAreaInput label="Keterangan Service" value={expenseForm.keterangan} onChange={e => setExpenseForm({ ...expenseForm, keterangan: e.target.value })} />
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => {
                    if (confirmDelete.type === 'kas') {
                        await apiCall('deleteData', 'POST', { type: 'unit_lab_media_kas', id: confirmDelete.id });
                    } else {
                        await handleDeleteIncome(confirmDelete.id);
                    }
                    setConfirmDelete({ open: false, id: null });
                    loadData();
                }}
                title="Hapus Data?"
                message="Data ini akan dihapus permanen."
            />
        </div>
    );
}
