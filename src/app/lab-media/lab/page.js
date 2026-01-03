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
    const [activeSessions, setActiveSessions] = useState({});
    const [pcCount, setPcCount] = useState(20);
    const [now, setNow] = useState(null); // Initialize as null to prevent hydration mismatch
    const [mounted, setMounted] = useState(false); // Track client-side mounting

    // Initialize Client-Side Data
    useEffect(() => {
        setMounted(true);
        setNow(Date.now());

        try {
            const savedSessions = localStorage.getItem('lab_active_sessions');
            const savedCount = localStorage.getItem('lab_pc_count');
            if (savedSessions) setActiveSessions(JSON.parse(savedSessions));
            if (savedCount) setPcCount(parseInt(savedCount));
        } catch (err) {
            console.error("Failed to load lab session data:", err);
        }

        const interval = setInterval(() => setNow(Date.now()), 10000);
        return () => clearInterval(interval);
    }, []);

    // Save to local storage
    useEffect(() => {
        if (!mounted) return;
        try {
            localStorage.setItem('lab_active_sessions', JSON.stringify(activeSessions));
            localStorage.setItem('lab_pc_count', pcCount.toString());
        } catch (err) {
            console.error("Failed to save lab session data:", err);
        }
    }, [activeSessions, pcCount, mounted]);

    // 🔍 Filter Data strictly for Lab unit
    const labLayananData = useMemo(() => layananData.filter(d => d.unit === 'Lab'), [layananData]);

    // 📋 Organize tariffs by category
    const categorizedTariffs = useMemo(() => {
        const rental = tarifList.filter(t => t.kategori === 'Rental');
        const print = tarifList.filter(t => t.kategori === 'Percetakan');
        const media = tarifList.filter(t => t.kategori === 'Dokumentasi' || t.kategori === 'Media');
        return { rental, print, media };
    }, [tarifList]);

    // PC Workstations - ONLY generated after mount to avoid hydration errors
    const pcStations = useMemo(() => {
        if (!mounted || !now) return []; // Return empty or skeleton during server render

        // 1. Generate PC Cards based on dynamic count
        const computers = Array.from({ length: pcCount }, (_, i) => {
            const id = `PC ${String(i + 1).padStart(2, '0')}`;
            const session = activeSessions[id];
            let durationStr = '0j 0m';
            let currentCost = 0;

            if (session && session.startTime) {
                const diffMinutes = Math.floor((now - session.startTime) / 60000);
                const hours = Math.floor(diffMinutes / 60);
                const mins = diffMinutes % 60;
                durationStr = `${hours}j ${mins}m`;

                const rentalRate = parseInt(categorizedTariffs.rental[0]?.harga || 3000);
                currentCost = Math.ceil((diffMinutes / 60) * rentalRate);
                if (currentCost < 1000) currentCost = 1000;
            }

            return {
                id,
                type: 'PC',
                category: 'Rental',
                active: !!session,
                userName: session?.user || '',
                duration: durationStr,
                cost: currentCost,
                startTime: session?.startTime
            };
        });

        // 2. Add "Percetakan" Station
        const today = new Date().toLocaleDateString('en-CA');
        const todayPrintIncome = labLayananData
            .filter(d => d.tanggal === today && d.kategori === 'Percetakan')
            .reduce((acc, d) => acc + (parseInt(d.nominal) || 0), 0);

        const printStation = {
            id: 'PERCETAKAN',
            type: 'SERVICE',
            category: 'Percetakan',
            active: todayPrintIncome > 0,
            userName: 'Jasa Cetak',
            duration: 'Hari Ini',
            cost: todayPrintIncome,
            isSpecial: true
        };

        // 3. Add "Media" Station
        const todayMediaIncome = labLayananData
            .filter(d => d.tanggal === today && d.kategori === 'Media')
            .reduce((acc, d) => acc + (parseInt(d.nominal) || 0), 0);

        const mediaStation = {
            id: 'MEDIA',
            type: 'SERVICE',
            category: 'Media',
            active: todayMediaIncome > 0,
            userName: 'Dokumentasi',
            duration: 'Hari Ini',
            cost: todayMediaIncome,
            isSpecial: true
        };

        return [printStation, mediaStation, ...computers];
    }, [activeSessions, pcCount, now, categorizedTariffs, labLayananData, mounted]);

    // 1. Incomes (layanan_admin)
    const {
        data: layananData, setData: setLayananData, loading: loadingLayanan, submitting,
        isModalOpen: isIncomeModalOpen, setIsModalOpen: setIsIncomeModalOpen,
        formData: incomeForm, setFormData: setIncomeForm, editId: incomeEditId,
        handleSave: handleSaveIncome, handleDelete: handleDeleteIncome, openModal: openIncomeModal
    } = useDataManagement('layanan_admin', {
        tanggal: '', // Fix: Empty init to prevent hydration error
        unit: 'Lab',
        nama_santri: '',
        stambuk: '',
        kategori: 'Rental',  // New: Category field
        jenis_layanan: '',
        nominal: '0',
        jumlah: '1',
        keterangan: '',
        pj: user?.fullname || '',
        pemohon_tipe: 'Santri'
    });

    // 2. Expenses & Setoran (unit_lab_media_kas)
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [expenseForm, setExpenseForm] = useState({
        tanggal: '', // Fix: Empty init to prevent hydration error
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
        const income = labLayananData.reduce((acc, d) => acc + (parseInt(d.nominal) || 0), 0);
        const expense = kasData.filter(k => k.tipe === 'Keluar').reduce((acc, k) => acc + (parseInt(k.nominal) || 0), 0);
        return [
            { title: 'Total Pendapatan (Masuk)', value: formatCurrency(income), icon: 'fas fa-arrow-down', color: 'var(--success)' },
            { title: 'Total Pengeluaran (Keluar)', value: formatCurrency(expense), icon: 'fas fa-arrow-up', color: 'var(--danger)' },
            { title: 'Saldo Kas Lab', value: formatCurrency(income - expense), icon: 'fas fa-wallet', color: 'var(--primary)' }
        ];
    }, [labLayananData, kasData]);

    // ✨ Compute Active PC Grid from Logs
    const computedPcs = useMemo(() => {
        // ... (existing computedPcs logic but using labLayananData if needed for initializing stations based on logs)
        // Note: The new real-time system uses 'pcStations' derived from 'activeSessions', 
        // but if we want to show historical occupancy or sync, we might need this.
        // However, the current real-time implementation relies on 'pcStations' state.
        // We will keep 'pcStations' in use for the grid as per the previous successful real-time update.
        return pcStations;
    }, [pcStations]);

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

            {!mounted ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    <i className="fas fa-circle-notch fa-spin fa-2x"></i>
                    <p style={{ marginTop: '1rem' }}>Memuat Sistem Lab...</p>
                </div>
            ) : (
                <>
                    <div style={{ marginBottom: '4rem' }}>
                        <StatsPanel items={stats} />
                    </div>

                    <div style={{ marginBottom: '4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div className="welcome-section">
                                <h2 className="outfit" style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary-dark)', letterSpacing: '-0.5px' }}>
                                    Pusat Monitoring Billing
                                </h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>
                                    Pantau status <strong style={{ color: 'var(--primary)' }}>{pcCount} Workstation</strong> & Printer.
                                </p>
                            </div>

                            {/* PC Management Controls */}
                            <div className="flex gap-3">
                                <button
                                    className="btn btn-outline btn-sm"
                                    onClick={() => { if (pcCount > 5) setPcCount(c => c - 1); }}
                                    title="Kurangi Unit PC"
                                >
                                    <i className="fas fa-minus"></i>
                                </button>
                                <button
                                    className="btn btn-outline btn-sm"
                                    onClick={() => setPcCount(c => c + 1)}
                                    title="Tambah Unit PC"
                                >
                                    <i className="fas fa-plus"></i> Tambah PC
                                </button>
                            </div>
                        </div>

                        <BillingGrid
                            pcs={pcStations}
                            onPcClick={(pc) => {
                                // Special handling for Service Stations (Percetakan & Media)
                                if (pc.type === 'SERVICE') {
                                    openIncomeModal();

                                    let defaultService = '';
                                    let defaultPrice = '0';

                                    if (pc.category === 'Percetakan' && categorizedTariffs.print.length > 0) {
                                        defaultService = categorizedTariffs.print[0].nama_layanan;
                                        defaultPrice = categorizedTariffs.print[0].harga;
                                    } else if (pc.category === 'Media' && categorizedTariffs.media.length > 0) {
                                        defaultService = categorizedTariffs.media[0].nama_layanan;
                                        defaultPrice = categorizedTariffs.media[0].harga;
                                    }

                                    setIncomeForm(prev => ({
                                        ...prev,
                                        tanggal: new Date().toLocaleDateString('en-CA'), // Set default date
                                        kategori: pc.category,
                                        jenis_layanan: defaultService,
                                        keterangan: '',
                                        nominal: defaultPrice,
                                        jumlah: '1'
                                    }));
                                    return;
                                }

                                // Normal PC Rental Logic
                                if (!pc.active) {
                                    handleStartRentalClick(pc);
                                }
                            }}
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
                                        <button className="btn btn-primary" onClick={() => {
                                            openIncomeModal();
                                            // Set default date client-side
                                            setIncomeForm(prev => ({ ...prev, tanggal: new Date().toLocaleDateString('en-CA') }));
                                        }}>
                                            <i className="fas fa-plus"></i> Input Layanan Baru
                                        </button>
                                    </div>
                                )}
                                tableProps={{ columns: incomeColumns, data: labLayananData, loading: loadingLayanan }}
                            />
                        </div>
                        <div className="secondary-column">
                            <DataViewContainer
                                title="Log Pengeluaran Lab"
                                subtitle="Belanja & Setoran"
                                headerActions={canEdit && <button className="btn btn-outline btn-sm" onClick={() => {
                                    setIsExpenseModalOpen(true);
                                    setExpenseForm(prev => ({ ...prev, tanggal: new Date().toLocaleDateString('en-CA') }));
                                }}><i className="fas fa-minus"></i> Catat Biaya</button>}
                                tableProps={{ columns: kasColumns, data: kasData, loading: loadingKas }}
                            />
                        </div>
                    </div>
                </>
            )}

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

            {/* Income Modal (Manual Entry) */}
            <Modal isOpen={isIncomeModalOpen} onClose={() => setIsIncomeModalOpen(false)} title="Input Layanan Lab & Media" footer={<button className="btn btn-primary" onClick={handleSaveIncome} disabled={submitting}>Simpan</button>}>
                <TextInput label="Tanggal" type="date" value={incomeForm.tanggal} onChange={e => setIncomeForm({ ...incomeForm, tanggal: e.target.value })} />

                {/* Category Selector */}
                <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                    <SelectInput
                        label="Pilih Kategori Layanan"
                        value={incomeForm.kategori || 'Rental'}
                        onChange={e => {
                            const selectedCategory = e.target.value;
                            let defaultService = '';
                            let defaultPrice = '0';

                            if (selectedCategory === 'Rental' && categorizedTariffs.rental.length > 0) {
                                defaultService = categorizedTariffs.rental[0].nama_layanan;
                                defaultPrice = categorizedTariffs.rental[0].harga;
                            } else if (selectedCategory === 'Percetakan' && categorizedTariffs.print.length > 0) {
                                defaultService = categorizedTariffs.print[0].nama_layanan;
                                defaultPrice = categorizedTariffs.print[0].harga;
                            } else if (selectedCategory === 'Media' && categorizedTariffs.media.length > 0) {
                                defaultService = categorizedTariffs.media[0].nama_layanan;
                                defaultPrice = categorizedTariffs.media[0].harga;
                            }

                            setIncomeForm({
                                ...incomeForm,
                                kategori: selectedCategory,
                                jenis_layanan: defaultService,
                                nominal: defaultPrice,
                                jumlah: '1',
                                keterangan: ''
                            });
                        }}
                        options={['Rental', 'Percetakan', 'Media']}
                    />
                </div>

                {/* Service Type Selector based on Category */}
                {incomeForm.kategori && (
                    <SelectInput
                        label="Jenis Layanan"
                        value={incomeForm.jenis_layanan}
                        onChange={e => {
                            const selectedService = e.target.value;
                            const tariff = tarifList.find(t => t.nama_layanan === selectedService);
                            setIncomeForm({
                                ...incomeForm,
                                jenis_layanan: selectedService,
                                nominal: tariff?.harga || '0'
                            });
                        }}
                        options={
                            incomeForm.kategori === 'Rental' ? categorizedTariffs.rental.map(t => t.nama_layanan) :
                                incomeForm.kategori === 'Percetakan' ? categorizedTariffs.print.map(t => t.nama_layanan) :
                                    categorizedTariffs.media.map(t => t.nama_layanan)
                        }
                    />
                )}

                {/* Dynamic Fields based on Category */}
                {incomeForm.kategori === 'Percetakan' && (
                    <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
                        <TextInput
                            label="Jumlah Lembar"
                            type="number"
                            value={incomeForm.jumlah}
                            onChange={e => {
                                const pages = e.target.value;
                                const rate = tarifList.find(t => t.nama_layanan === incomeForm.jenis_layanan)?.harga || 0;
                                setIncomeForm({ ...incomeForm, jumlah: pages, nominal: parseInt(pages || 0) * parseInt(rate) });
                            }}
                        />
                        <TextInput
                            label="Keterangan"
                            value={incomeForm.keterangan}
                            onChange={e => setIncomeForm({ ...incomeForm, keterangan: e.target.value })}
                            placeholder="Contoh: A4, Warna"
                        />
                    </div>
                )}

                {incomeForm.kategori === 'Rental' && (
                    <TextInput
                        label="Keterangan (Opsional)"
                        value={incomeForm.keterangan}
                        onChange={e => setIncomeForm({ ...incomeForm, keterangan: e.target.value })}
                        placeholder="Contoh: PC 05, Dengan Internet"
                    />
                )}

                {incomeForm.kategori === 'Media' && (
                    <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
                        <TextInput
                            label="Durasi/Jumlah"
                            type="number"
                            value={incomeForm.jumlah}
                            onChange={e => {
                                const qty = e.target.value;
                                const rate = tarifList.find(t => t.nama_layanan === incomeForm.jenis_layanan)?.harga || 0;
                                setIncomeForm({ ...incomeForm, jumlah: qty, nominal: parseInt(qty || 0) * parseInt(rate) });
                            }}
                        />
                        <TextInput
                            label="Keterangan"
                            value={incomeForm.keterangan}
                            onChange={e => setIncomeForm({ ...incomeForm, keterangan: e.target.value })}
                            placeholder="Detail acara/kegiatan"
                        />
                    </div>
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
