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
import SortableTable from '@/components/SortableTable';
import PremiumBanner from '@/components/PremiumBanner';

export default function LabPage() {
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
        unit: 'Lab', nama_santri: '', stambuk: '', jenis_layanan: '',
        nominal: '0', jumlah: '1', keterangan: '', pj: user?.fullname || '', pemohon_tipe: 'Santri'
    });

    // 2. Expenses & Setoran (unit_lab_media_kas)
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [expenseForm, setExpenseForm] = useState({
        tanggal: new Date().toISOString().split('T')[0],
        unit: 'Lab', tipe: 'Keluar', kategori: 'Belanja Alat', nominal: '', keterangan: '', petugas: user?.fullname || ''
    });

    const loadData = useCallback(async () => {
        setLoadingKas(true);
        try {
            const [resTarif, resSantri, resKas] = await Promise.all([
                apiCall('getData', 'GET', { type: 'unit_lab_media_tarif' }),
                apiCall('getData', 'GET', { type: 'santri' }),
                apiCall('getData', 'GET', { type: 'unit_lab_media_kas' })
            ]);
            setTarifList((resTarif || []).filter(t => t.unit === 'Lab'));
            setSantriOptions(resSantri || []);
            setKasData((resKas || []).filter(k => k.unit === 'Lab'));
        } catch (e) { console.error(e); } finally { setLoadingKas(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const stats = useMemo(() => {
        const income = layananData.reduce((acc, d) => acc + (parseInt(d.nominal) || 0), 0);
        const expense = kasData.filter(k => k.tipe === 'Keluar').reduce((acc, k) => acc + (parseInt(k.nominal) || 0), 0);
        return [
            { title: 'Total Pendapatan (Masuk)', value: formatCurrency(income), icon: 'fas fa-arrow-down', color: 'var(--success)' },
            { title: 'Total Pengeluaran (Keluar)', value: formatCurrency(expense), icon: 'fas fa-arrow-up', color: 'var(--danger)' },
            { title: 'Saldo Kas Lab', value: formatCurrency(income - expense), icon: 'fas fa-wallet', color: 'var(--primary)' }
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

        if (confirm(`Setorkan saldo Lab sebesar ${formatCurrency(balance)} ke Bendahara?`)) {
            try {
                // 1. Record in Lab Kas as Setoran (Keluar)
                await apiCall('saveData', 'POST', {
                    type: 'unit_lab_media_kas',
                    data: {
                        tanggal: new Date().toISOString().split('T')[0],
                        unit: 'Lab', tipe: 'Keluar', kategori: 'Setoran ke Bendahara',
                        nominal: balance, keterangan: 'Penyetoran pendapatan Lab ke pusat',
                        petugas: user?.fullname || 'Admin'
                    }
                });

                // 2. Record in Central Kas Unit (Masuk)
                await apiCall('saveData', 'POST', {
                    type: 'kas_unit',
                    data: {
                        tanggal: new Date().toISOString().split('T')[0],
                        tipe: 'Masuk', kategori: 'Setoran Unit Lab',
                        nominal: balance, keterangan: 'Penerimaan biaya layanan Lab',
                        petugas: user?.fullname || 'Admin'
                    }
                });

                loadData();
                alert("Setoran berhasil dicatat!");
            } catch (err) { alert(err.message); }
        }
    };

    const incomeColumns = [
        { key: 'tanggal', label: 'Tgl', width: '100px', render: (row) => formatDate(row.tanggal) },
        { key: 'nama_santri', label: 'Santri', render: (row) => <div><strong>{row.nama_santri}</strong><br /><small>{row.jenis_layanan}</small></div> },
        { key: 'nominal', label: 'Nominal', render: (row) => <span style={{ fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(row.nominal)}</span> },
        {
            key: 'actions', label: 'Opsi', width: '80px', render: (row) => (
                <div className="table-actions">
                    {canEdit && <button className="btn-vibrant btn-vibrant-blue" onClick={() => openIncomeModal(row)}><i className="fas fa-edit"></i></button>}
                </div>
            )
        }
    ];

    const kasColumns = [
        { key: 'tanggal', label: 'Tgl', width: '100px', render: (row) => formatDate(row.tanggal) },
        { key: 'kategori', label: 'Kategori', render: (row) => <div><strong>{row.kategori}</strong><br /><small>{row.keterangan}</small></div> },
        { key: 'nominal', label: 'Nominal', render: (row) => <span style={{ fontWeight: 800, color: row.tipe === 'Masuk' ? 'var(--success)' : 'var(--danger)' }}>{formatCurrency(row.nominal)}</span> },
        {
            key: 'actions', label: 'Opsi', width: '80px', render: (row) => (
                <div className="table-actions">
                    {canDelete && <button className="btn-vibrant btn-vibrant-red" onClick={() => setConfirmDelete({ open: true, id: row.id, type: 'kas' })}><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <PremiumBanner
                title="Layanan Lab Komputer"
                subtitle="Manajemen operasional rental PC, jasa pengetikan, dan percetakan dokumen."
                icon="fas fa-microchip"
                floatingIcon="fas fa-desktop"
                bgGradient="linear-gradient(135deg, var(--primary-dark) 0%, #1e1b4b 100%)"
                actionButton={
                    <button className="btn-vibrant btn-vibrant-purple" style={{ height: 'fit-content', padding: '1.25rem 2.5rem', borderRadius: '18px', fontSize: '1rem', fontWeight: 800 }} onClick={handleSetoran}>
                        <i className="fas fa-university"></i> Setor ke Bendahara
                    </button>
                }
            />

            <div style={{ marginBottom: '2rem' }}>
                <StatsPanel items={stats} />
            </div>

            <div className="main-grid-layout">
                <div className="primary-column">
                    <DataViewContainer
                        title="Daftar Layanan Masuk"
                        subtitle="Rental & Print Santri"
                        headerActions={canEdit && <button className="btn btn-primary btn-sm" onClick={() => openIncomeModal()}><i className="fas fa-plus"></i> Input Layanan</button>}
                        tableProps={{ columns: incomeColumns, data: layananData, loading: loadingLayanan }}
                    />
                </div>
                <div className="secondary-column">
                    <DataViewContainer
                        title="Log Pengeluaran Lab"
                        subtitle="Belanja & Setoran"
                        headerActions={canEdit && <button className="btn btn-outline btn-sm" onClick={() => setIsExpenseModalOpen(true)}><i className="fas fa-minus"></i> Catat Biaya</button>}
                        tableProps={{ columns: kasColumns, data: kasData, loading: loadingKas }}
                    />
                </div>
            </div>

            {/* Income Modal */}
            <Modal isOpen={isIncomeModalOpen} onClose={() => setIsIncomeModalOpen(false)} title="Input Layanan Lab" footer={<button className="btn btn-primary" onClick={handleSaveIncome} disabled={submitting}>Simpan</button>}>
                <TextInput label="Tanggal" type="date" value={incomeForm.tanggal} onChange={e => setIncomeForm({ ...incomeForm, tanggal: e.target.value })} />

                <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                    <SelectInput
                        label="Pilih Kategori Layanan"
                        value={incomeForm.jenis_layanan.includes('Rental') ? 'Rental' : incomeForm.jenis_layanan.includes('Print') ? 'Print' : incomeForm.jenis_layanan}
                        onChange={e => {
                            const val = e.target.value;
                            const t = tarifList.find(tarif => tarif.nama_layanan.toLowerCase().includes(val.toLowerCase()));
                            setIncomeForm({
                                ...incomeForm,
                                jenis_layanan: t ? t.nama_layanan : val,
                                nominal: t ? t.harga : '0',
                                jumlah: '1',
                                keterangan: ''
                            });
                        }}
                        options={['Rental', 'Print', ...tarifList.map(t => t.nama_layanan).filter(n => !n.includes('Rental') && !n.includes('Print'))]}
                    />
                </div>

                {/* Conditional Fields Based on Service Type */}
                {incomeForm.jenis_layanan.toLowerCase().includes('rental') && (
                    <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
                        <SelectInput
                            label="Pilih PC / Unit"
                            value={incomeForm.keterangan || ''}
                            onChange={e => setIncomeForm({ ...incomeForm, keterangan: e.target.value })}
                            options={Array.from({ length: 20 }, (_, i) => `PC ${String(i + 1).padStart(2, '0')}`)}
                        />
                        <TextInput
                            label="Durasi (Jam)"
                            type="number"
                            value={incomeForm.jumlah}
                            onChange={e => {
                                const hours = e.target.value;
                                const rate = tarifList.find(t => t.nama_layanan.toLowerCase().includes('rental'))?.harga || 0;
                                setIncomeForm({ ...incomeForm, jumlah: hours, nominal: parseInt(hours || 0) * parseInt(rate) });
                            }}
                        />
                    </div>
                )}

                {incomeForm.jenis_layanan.toLowerCase().includes('print') && (
                    <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
                        <TextInput
                            label="Jumlah Lembar"
                            type="number"
                            value={incomeForm.jumlah}
                            onChange={e => {
                                const pages = e.target.value;
                                const rate = tarifList.find(t => t.nama_layanan.toLowerCase().includes('print'))?.harga || 0;
                                setIncomeForm({ ...incomeForm, jumlah: pages, nominal: parseInt(pages || 0) * parseInt(rate) });
                            }}
                        />
                        <TextInput
                            label="Keterangan (Warna/BW)"
                            value={incomeForm.keterangan}
                            onChange={e => setIncomeForm({ ...incomeForm, keterangan: e.target.value })}
                            placeholder="Contoh: Print Warna"
                        />
                    </div>
                )}

                {!incomeForm.jenis_layanan.toLowerCase().includes('rental') && !incomeForm.jenis_layanan.toLowerCase().includes('print') && (
                    <TextInput label="Jumlah / Kuantitas" type="number" value={incomeForm.jumlah} onChange={e => {
                        const qty = e.target.value;
                        const basePrice = tarifList.find(t => t.nama_layanan === incomeForm.jenis_layanan)?.harga || 0;
                        setIncomeForm({ ...incomeForm, jumlah: qty, nominal: parseInt(qty || 0) * parseInt(basePrice) });
                    }} />
                )}

                <div className="form-group" style={{ marginTop: '1rem', borderTop: '1px dashed #e2e8f0', paddingTop: '1.5rem' }}>
                    <label className="form-label" style={{ fontWeight: 800 }}>Identitas Pemohon (Opsional)</label>
                    <Autocomplete
                        options={santriOptions}
                        value={incomeForm.nama_santri}
                        onChange={v => setIncomeForm({ ...incomeForm, nama_santri: v })}
                        onSelect={s => setIncomeForm({ ...incomeForm, nama_santri: s.nama_siswa, stambuk: s.stambuk_pondok })}
                        placeholder="Ketik nama santri jika ada..."
                        labelKey="nama_siswa"
                        subLabelKey="kelas"
                    />
                </div>

                <div style={{ marginTop: '1.5rem', background: 'var(--primary-light)', padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>Total Biaya:</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)' }}>{formatCurrency(incomeForm.nominal)}</span>
                </div>
            </Modal>

            {/* Expense Modal */}
            <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Pencatatan Biaya Lab" footer={<button className="btn btn-primary" onClick={handleSaveExpense}>Simpan Biaya</button>}>
                <TextInput label="Tanggal" type="date" value={expenseForm.tanggal} onChange={e => setExpenseForm({ ...expenseForm, tanggal: e.target.value })} />
                <SelectInput label="Kategori" value={expenseForm.kategori} onChange={e => setExpenseForm({ ...expenseForm, kategori: e.target.value })} options={['Belanja Alat', 'Tinta / Kertas', 'Listrik / Internet', 'Lainnya']} />
                <TextInput label="Nominal (Rp)" type="number" value={expenseForm.nominal} onChange={e => setExpenseForm({ ...expenseForm, nominal: e.target.value })} />
                <TextAreaInput label="Keterangan" value={expenseForm.keterangan} onChange={e => setExpenseForm({ ...expenseForm, keterangan: e.target.value })} />
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
