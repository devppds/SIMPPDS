'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { apiCall } from '@/lib/utils';
import { useAuth, usePagePermission } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import Modal from '@/components/Modal';
import { TextInput } from '@/components/FormInput';
import StatsPanel from '@/components/StatsPanel';

// ✨ Fixed Formal Groups as requested
const FORMAL_GROUPS = [
    'SMP / MTS',
    'SMA / SMK',
    'Strata 1 - Smt 1-2',
    'Strata 1 - Smt 3-4',
    'Strata 1 - Smt 5-6',
    'Strata 1 - Smt 7-8',
    'Magister - Smt 1-2',
    'Magister - Smt 3-4'
];

export default function PengaturanFormalPage() {
    const { canEdit } = usePagePermission();
    const { showToast } = useToast();

    // State
    const [loading, setLoading] = useState(false);
    const [mapping, setMapping] = useState([]); // All student-to-group mappings
    const [allSantri, setAllSantri] = useState([]);

    // Student Selection Modal State
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [activeGroup, setActiveGroup] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [mappingSubmitting, setMappingSubmitting] = useState(false);

    const isMounted = React.useRef(true);

    useEffect(() => {
        isMounted.current = true;
        loadData();
        return () => { isMounted.current = false; };
    }, []);

    const loadData = async () => {
        if (isMounted.current) setLoading(true);
        try {
            const [resMapping, resSantri] = await Promise.all([
                apiCall('getData', 'GET', { type: 'keamanan_formal_mapping' }),
                apiCall('getData', 'GET', { type: 'santri' })
            ]);

            if (isMounted.current) {
                setMapping(Array.isArray(resMapping) ? resMapping : []);
                // 🎯 Filter strictly for MIU Active students
                setAllSantri((resSantri || []).filter(s => s.madrasah === 'MIU' && s.status_santri === 'Aktif'));
            }
        } catch (e) {
            console.error("Load Data Error:", e);
            if (isMounted.current) showToast("Gagal memuat data mapping.", "error");
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    // --- Student Mapping Actions ---
    const openManageModal = (groupName) => {
        setActiveGroup(groupName);
        setSearchTerm('');
        setIsManageModalOpen(true);
    };

    const filteredSantriForModal = useMemo(() => {
        if (!searchTerm) return [];
        return allSantri.filter(s =>
            s.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.kelas && s.kelas.toLowerCase().includes(searchTerm.toLowerCase()))
        ).slice(0, 50);
    }, [allSantri, searchTerm]);

    const activeGroupSantri = useMemo(() => {
        if (!activeGroup) return [];
        return mapping.filter(m => m.kelompok_formal === activeGroup);
    }, [mapping, activeGroup]);

    const toggleSantriMapping = async (santri) => {
        if (!activeGroup) return;
        setMappingSubmitting(true);
        try {
            const existing = mapping.find(m => m.santri_id === santri.id && m.kelompok_formal === activeGroup);

            if (existing) {
                await apiCall('deleteData', 'DELETE', { type: 'keamanan_formal_mapping', id: existing.id });
                showToast(`Dihapus: ${santri.nama_siswa}`, "info");
            } else {
                await apiCall('saveData', 'POST', {
                    type: 'keamanan_formal_mapping',
                    data: {
                        santri_id: santri.id,
                        nama_santri: santri.nama_siswa,
                        kelompok_formal: activeGroup,
                        kelas_miu: santri.kelas
                    }
                });
                showToast(`Ditambahkan: ${santri.nama_siswa}`, "success");
            }

            const resMapping = await apiCall('getData', 'GET', { type: 'keamanan_formal_mapping' });
            if (isMounted.current) setMapping(Array.isArray(resMapping) ? resMapping : []);
        } catch (e) {
            showToast(e.message, "error");
        } finally {
            setMappingSubmitting(false);
        }
    };

    // --- Table Config ---
    const groupColumns = [
        { key: 'nama', label: 'Nama Kelompok Sekolah', render: (row) => <strong>{row}</strong> },
        {
            key: 'total',
            label: 'Anggota Santri (MIU)',
            width: '200px',
            render: (row) => {
                const count = mapping.filter(m => m.kelompok_formal === row).length;
                return <span className="th-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', fontWeight: 800 }}>{count} Santri</span>;
            }
        },
        {
            key: 'actions',
            label: 'Pilih Siswa',
            width: '120px',
            render: (row) => (
                <button
                    className="btn-vibrant btn-vibrant-purple"
                    onClick={() => openManageModal(row)}
                    title="Kelola Santri"
                    style={{ width: '40px', height: '40px' }}
                >
                    <i className="fas fa-users"></i>
                </button>
            )
        }
    ];

    const statsItems = [
        { title: 'Total Kelompok', value: FORMAL_GROUPS.length, icon: 'fas fa-layer-group', color: 'var(--primary)' },
        { title: 'Santri Terpetakan', value: mapping.length, icon: 'fas fa-user-check', color: 'var(--success)' },
        { title: 'Data MIU Aktif', value: allSantri.length, icon: 'fas fa-graduation-cap', color: 'var(--info)' }
    ];

    // --- DEBUG SEEDER ---
    const generateTestData = async () => {
        if (!confirm("Generate 30 data santri percobaan?")) return;
        setLoading(true);
        try {
            const promises = [];
            // Generate 15 MIU and 15 MHM
            for (let i = 1; i <= 30; i++) {
                const isMIU = i <= 15;
                const unit = isMIU ? 'MIU' : 'MHM';
                const name = `Santri ${unit} Test ${String(i).padStart(2, '0')}`;

                promises.push(apiCall('saveData', 'POST', {
                    type: 'santri',
                    data: {
                        stambuk_pondok: `${isMIU ? '24' : '23'}${String(i).padStart(3, '0')}`,
                        nama_siswa: name,
                        madrasah: unit,
                        kelas: isMIU ? '1 ULA' : '1 IBTIDA',
                        kamar: `A ${String(Math.ceil(i / 5)).padStart(2, '0')}`,
                        status_santri: 'Aktif',
                        tahun_masuk: '2024',
                        tempat_tanggal_lahir: 'KEDIRI, 01-01-2010',
                        jenis_kelamin: 'Laki-laki'
                    }
                }));
            }
            await Promise.all(promises);
            showToast("Berhasil membuat 30 data santri test!", "success");
            loadData();
        } catch (e) {
            showToast(e.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Pengaturan Santri : Sekolah Formal" subJudul="Pilih santri MIU untuk dimasukkan ke dalam kelompok sekolah berikut." hideOnScreen={true} />

            <StatsPanel items={statsItems} />

            <DataViewContainer
                title="Manajemen Kelompok Formal"
                subtitle="Daftar tetap kelompok sekolah formal sesuai kriteria pondok."
                headerActions={(
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={generateTestData} style={{ opacity: 0.5 }}>
                            <i className="fas fa-flask"></i> DEBUG: Generate 30 Santri
                        </button>
                    </div>
                )}
                tableProps={{ columns: groupColumns, data: FORMAL_GROUPS, loading }}
            />

            {/* Modal Kelola Santri dalam Kelompok */}
            <Modal
                isOpen={isManageModalOpen}
                onClose={() => setIsManageModalOpen(false)}
                title={`Kelola Santri: ${activeGroup}`}
                width="900px"
            >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '10px' }}>

                    {/* Panel Kiri: Pencarian & Tambah */}
                    <div className="card-glass" style={{ padding: '20px', borderRadius: '15px' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '15px', color: 'var(--primary-dark)', fontWeight: 800 }}>
                            <i className="fas fa-search"></i> Cari Santri MIU
                        </h4>
                        <TextInput
                            placeholder="Ketik nama atau kelas..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ marginBottom: '15px' }}
                        />

                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {filteredSantriForModal.length > 0 ? (
                                filteredSantriForModal.map(s => {
                                    const inThisGroup = mapping.some(m => m.santri_id === s.id && m.kelompok_formal === activeGroup);
                                    const otherGroup = mapping.find(m => m.santri_id === s.id && m.kelompok_formal !== activeGroup);

                                    return (
                                        <div
                                            key={s.id}
                                            style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '12px', borderBottom: '1px solid #f1f5f9',
                                                background: inThisGroup ? 'var(--primary-light)' : 'transparent',
                                                borderRadius: '10px',
                                                transition: '0.2s'
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{s.nama_siswa}</div>
                                                <div style={{ fontSize: '0.7rem', color: otherGroup ? 'var(--warning-dark)' : 'var(--text-muted)' }}>
                                                    {otherGroup ? `⚠️ Terdaftar: ${otherGroup.kelompok_formal}` : `Kelas: ${s.kelas}`}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => !mappingSubmitting && toggleSantriMapping(s)}
                                                className={`btn-vibrant ${inThisGroup ? 'btn-vibrant-red' : 'btn-vibrant-blue'}`}
                                                style={{ width: '30px', height: '30px', padding: 0 }}
                                                disabled={mappingSubmitting}
                                            >
                                                <i className={`fas ${inThisGroup ? 'fa-minus' : 'fa-plus'}`}></i>
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    <i className="fas fa-user-graduate" style={{ fontSize: '2.5rem', opacity: 0.1, marginBottom: '10px' }}></i>
                                    <p style={{ fontSize: '0.8rem' }}>{searchTerm ? 'Santri tidak ditemukan.' : 'Cari nama santri MIU di sini.'}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Panel Kanan: Daftar Anggota Sekarang */}
                    <div className="card-glass" style={{ padding: '20px', borderRadius: '15px', border: '2px solid var(--primary-light)' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--secondary)', fontWeight: 800, marginBottom: '15px' }}>
                            <i className="fas fa-list-check"></i> Anggota Kelompok ({activeGroupSantri.length})
                        </h4>

                        <div style={{ maxHeight: '425px', overflowY: 'auto' }}>
                            {activeGroupSantri.length > 0 ? (
                                activeGroupSantri.map(m => (
                                    <div
                                        key={m.id}
                                        style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '12px', borderBottom: '1px solid #f1f5f9'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{m.nama_santri}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m.kelas_miu}</div>
                                        </div>
                                        <button
                                            onClick={() => !mappingSubmitting && toggleSantriMapping({ id: m.santri_id, nama_siswa: m.nama_santri })}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem' }}
                                            disabled={mappingSubmitting}
                                        >
                                            <i className="fas fa-times-circle"></i>
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                                    <p style={{ fontSize: '0.8rem' }}>Belum ada santri di kelompok ini.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </Modal>
        </div>
    );
}
