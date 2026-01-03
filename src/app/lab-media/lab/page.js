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
            <KopSurat judul="Layanan Lab Komputer" subJudul="Manajemen rental dan jasa cetak." hideOnScreen={true} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <StatsPanel items={stats} style={{ flex: 1, marginRight: '1.5rem' }} />
                <button className="btn-vibrant btn-vibrant-purple" style={{ height: 'fit-content', padding: '1rem 2rem' }} onClick={handleSetoran}>
                    <i className="fas fa-university"></i> Setor ke Bendahara
                </button>
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
            <Modal isOpen={isIncomeModalOpen} onClose={() => setIsIncomeModalOpen(false)} title="Input Layanan Lab" footer={<button className="btn btn-primary" onClick={handleSaveIncome}>Simpan</button>}>
                <TextInput label="Tanggal" type="date" value={incomeForm.tanggal} onChange={e => setIncomeForm({ ...incomeForm, tanggal: e.target.value })} />
                <div className="form-group">
                    <label className="form-label">Nama Santri</label>
                    <Autocomplete options={santriOptions} value={incomeForm.nama_santri} onChange={v => setIncomeForm({ ...incomeForm, nama_santri: v })} onSelect={s => setIncomeForm({ ...incomeForm, nama_santri: s.nama_siswa, stambuk: s.stambuk_pondok })} placeholder="Cari santri..." labelKey="nama_siswa" subLabelKey="kelas" />
                </div>
                <SelectInput label="Jenis Layanan" value={incomeForm.jenis_layanan} onChange={e => {
                    const sel = tarifList.find(t => t.nama_layanan === e.target.value);
                    setIncomeForm({ ...incomeForm, jenis_layanan: e.target.value, nominal: sel?.harga || '0' });
                }} options={tarifList.map(t => t.nama_layanan)} />
                <TextInput label="Biaya (Rp)" type="number" value={incomeForm.nominal} onChange={e => setIncomeForm({ ...incomeForm, nominal: e.target.value })} />
                <TextAreaInput label="Memo" value={incomeForm.keterangan} onChange={e => setIncomeForm({ ...incomeForm, keterangan: e.target.value })} />
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
