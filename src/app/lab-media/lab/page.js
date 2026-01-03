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
import BillingGrid from '@/components/BillingGrid';

export default function LabPage() {
    const { user } = useAuth();
    const { canEdit, canDelete } = usePagePermission();
    const [tarifList, setTarifList] = useState([]);
    const [santriOptions, setSantriOptions] = useState([]);
    const [kasData, setKasData] = useState([]);
    const [loadingKas, setLoadingKas] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, type: 'layanan' });

    // Real-time Active Sessions Logic
    const [activeSessions, setActiveSessions] = useState({}); // { "PC 01": { startTime: timestamp, user: "Nama" } }
    const [now, setNow] = useState(Date.now());

    // Update timer every minute for UI duration
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 10000); // Update every 10s is enough for UI
        return () => clearInterval(interval);
    }, []);

    // Load active sessions from local storage on mount (Simulation of persistence)
    useEffect(() => {
        const saved = localStorage.getItem('lab_active_sessions');
        if (saved) setActiveSessions(JSON.parse(saved));
    }, []);

    // Save to local storage whenever changed
    useEffect(() => {
        localStorage.setItem('lab_active_sessions', JSON.stringify(activeSessions));
    }, [activeSessions]);

    // PC Workstations Configuration (30 units)
    const pcStations = useMemo(() => Array.from({ length: 30 }, (_, i) => {
        const id = `PC ${String(i + 1).padStart(2, '0')}`;
        const session = activeSessions[id];
        let durationStr = '';
        let currentCost = 0;

        if (session) {
            const diffMinutes = Math.floor((now - session.startTime) / 60000);
            const hours = Math.floor(diffMinutes / 60);
            const mins = diffMinutes % 60;
            durationStr = `${hours}j ${mins}m`;

            // Calculate cost based on tariff
            const ratePerHour = parseInt(tarifList.find(t => t.nama_layanan.toLowerCase().includes('rental'))?.harga || 3000);
            // Cost = (minutes / 60) * rate. Round up to nearest 500 maybe? or just raw.
            // Let's do raw calculation first, maybe integer.
            currentCost = Math.ceil((diffMinutes / 60) * ratePerHour);
            // Minimum 1000 maybe?
            if (currentCost < 1000) currentCost = 1000;
        }

        return {
            id,
            active: !!session,
            userName: session?.user || '',
            duration: durationStr,
            cost: currentCost,
            startTime: session?.startTime
        };
    }), [activeSessions, now, tarifList]);

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

    const [isStartRentalOpen, setIsStartRentalOpen] = useState(false);
    const [selectedPcForRental, setSelectedPcForRental] = useState(null);
    const [rentalForm, setRentalForm] = useState({ nama_santri: '', stambuk: '' });

    const [isStopRentalOpen, setIsStopRentalOpen] = useState(false);
    const [stopSessionData, setStopSessionData] = useState(null);

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

    // --- Actions ---

    const handleStartRentalClick = (pc) => {
        if (pc.active) return;
        setSelectedPcForRental(pc.id);
        setRentalForm({ nama_santri: '', stambuk: '' });
        setIsStartRentalOpen(true);
    };

    const confirmStartRental = () => {
        setActiveSessions(prev => ({
            ...prev,
            [selectedPcForRental]: {
                startTime: Date.now(),
                user: rentalForm.nama_santri || 'Umum'
            }
        }));
        setIsStartRentalOpen(false);
    };

    const handleStopRentalClick = (pc) => {
        setStopSessionData(pc);
        setIsStopRentalOpen(true);
    };

    const confirmStopRental = async () => {
        if (!stopSessionData) return;

        // 1. Save to DB
        try {
            const diffMinutes = Math.floor((Date.now() - stopSessionData.startTime) / 60000);
            // Default "Rental PC" tariff if exists, else derive from page cost
            const tariffName = tarifList.find(t => t.nama_layanan.toLowerCase().includes('rental'))?.nama_layanan || 'Rental Komputer';

            const payload = {
                tanggal: new Date().toISOString().split('T')[0],
                unit: 'Lab',
                nama_santri: stopSessionData.userName,
                jenis_layanan: tariffName,
                nominal: stopSessionData.cost, // Calculated cost
                jumlah: diffMinutes, // We store minutes in 'jumlah' or maybe convert to hours string? Let's assume schema allows number. Or string "X menit".
                keterangan: `${stopSessionData.id} - ${diffMinutes} Menit`,
                pj: user?.fullname || '',
                pemohon_tipe: 'Santri'
            };

            await apiCall('saveData', 'POST', { type: 'layanan_admin', data: payload });

            // 2. Clear Session
            setActiveSessions(prev => {
                const copy = { ...prev };
                delete copy[stopSessionData.id];
                return copy;
            });

            setIsStopRentalOpen(false);
            setStopSessionData(null);
            loadData(); // Refresh logs

        } catch (err) {
            alert("Gagal menyimpan log: " + err.message);
        }
    };

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
        { key: 'keterangan', label: 'Detail' },
        { key: 'nominal', label: 'Nominal', render: (row) => <span style={{ fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(row.nominal)}</span> },
        {
            key: 'actions', label: 'Opsi', width: '80px', render: (row) => (
                <div className="table-actions">
                    {canEdit && <button className="btn-vibrant btn-vibrant-blue" onClick={() => openIncomeModal(row)}><i className="fas fa-edit"></i></button>}
                    {canDelete && <button className="btn-vibrant btn-vibrant-red" onClick={() => handleDeleteIncome(row.id)}><i className="fas fa-trash"></i></button>}
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
            />

            <div style={{ marginBottom: '4rem' }}>
                <StatsPanel items={stats} />
            </div>

            <div style={{ marginBottom: '4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div className="welcome-section">
                        <h2 className="outfit" style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary-dark)', letterSpacing: '-0.5px' }}>
                            Pusat Monitoring Billing
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>Pantau status workstation dan durasi rental santri secara real-time.</p>
                    </div>
                </div>
                <BillingGrid
                    pcs={pcStations}
                    onPcClick={handleStartRentalClick}
                    onStopClick={handleStopRentalClick}
                />
            </div>

            <div className="main-grid-layout">
                <div className="primary-column">
                    <DataViewContainer
                        title="Log Pendapatan Lab"
                        subtitle="Catatan pendapatan dari rental PC dan jasa print."
                        headerActions={(
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn btn-outline" style={{ borderStyle: 'dashed' }} onClick={handleSetoran}>
                                    <i className="fas fa-university"></i> Setor ke Bendahara
                                </button>
                                <button className="btn btn-primary" onClick={() => openIncomeModal()}>
                                    <i className="fas fa-plus"></i> Input Layanan Baru
                                </button>
                            </div>
                        )}
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

            {/* Modal Start Rental */}
            <Modal isOpen={isStartRentalOpen} onClose={() => setIsStartRentalOpen(false)} title={`Mulai Rental: ${selectedPcForRental}`} footer={<button className="btn btn-primary" onClick={confirmStartRental}>Mulai Timer</button>}>
                <div style={{ marginBottom: '1rem' }}>
                    <p>Mulai sesi baru untuk <strong>{selectedPcForRental}</strong>. Waktu akan berjalan mulai sekarang.</p>
                </div>
                <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 800 }}>Identitas Pengguna</label>
                    <Autocomplete
                        options={santriOptions}
                        value={rentalForm.nama_santri}
                        onChange={v => setRentalForm({ ...rentalForm, nama_santri: v })}
                        onSelect={s => setRentalForm({ ...rentalForm, nama_santri: s.nama_siswa, stambuk: s.stambuk_pondok })}
                        placeholder="Cari nama santri..."
                        labelKey="nama_siswa"
                        subLabelKey="kelas"
                    />
                </div>
            </Modal>

            {/* Modal Stop Rental */}
            <Modal isOpen={isStopRentalOpen} onClose={() => setIsStopRentalOpen(false)} title="Selesaikan Sesi?" footer={<button className="btn btn-success" onClick={confirmStopRental}>Bayar & Simpan</button>}>
                {stopSessionData && (
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                        <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Total Durasi</div>
                        <div className="outfit" style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary-dark)' }}>{stopSessionData.duration}</div>

                        <div style={{ margin: '1.5rem 0', borderTop: '1px dashed #e2e8f0' }}></div>

                        <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Total Tagihan</div>
                        <div className="outfit" style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--success)' }}>{formatCurrency(stopSessionData.cost)}</div>

                        <div style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
                            Pengguna: <strong>{stopSessionData.userName}</strong>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Income Modal (Manual) */}
            <Modal isOpen={isIncomeModalOpen} onClose={() => setIsIncomeModalOpen(false)} title="Input Layanan (Manual)" footer={<button className="btn btn-primary" onClick={handleSaveIncome} disabled={submitting}>Simpan</button>}>
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

                {/* Manual form can be simpler if billing is automated */}
                {!incomeForm.jenis_layanan.toLowerCase().includes('print') && (
                    <TextInput label="Nominal Manual (Rp)" type="number" value={incomeForm.nominal} onChange={e => setIncomeForm({ ...incomeForm, nominal: e.target.value })} icon="fas fa-money-bill" />
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
