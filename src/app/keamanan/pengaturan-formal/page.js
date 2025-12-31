'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiCall } from '@/lib/utils';
import { useAuth, usePagePermission } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import Modal from '@/components/Modal';
import { TextInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';
import StatsPanel from '@/components/StatsPanel';

export default function PengaturanFormalPage() {
    const { canEdit } = usePagePermission();
    const { showToast } = useToast();

    // State
    const [loading, setLoading] = useState(false);
    const [groups, setGroups] = useState([]); // Array of group names or objects
    const [mapping, setMapping] = useState([]); // All student-to-group mappings
    const [allSantri, setAllSantri] = useState([]);

    // Group Form State
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [groupForm, setGroupForm] = useState({ id: null, nama: '' });

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
            const [resGroups, resMapping, resSantri] = await Promise.all([
                apiCall('getData', 'GET', { type: 'keamanan_formal_groups' }),
                apiCall('getData', 'GET', { type: 'keamanan_formal_mapping' }),
                apiCall('getData', 'GET', { type: 'santri' })
            ]);

            if (isMounted.current) {
                // If no groups yet, provide default ones as fallback or start empty
                setGroups(resGroups || []);
                setMapping(resMapping || []);
                // Filter only active MIU students
                setAllSantri((resSantri || []).filter(s => s.madrasah === 'MIU' && s.status_santri === 'Aktif'));
            }
        } catch (e) {
            console.error("Load Data Error:", e);
            if (isMounted.current) showToast("Gagal memuat data.", "error");
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    // --- Group Actions ---
    const handleSaveGroup = async () => {
        if (!groupForm.nama.trim()) return showToast("Nama kelompok harus diisi", "warning");
        setLoading(true);
        try {
            await apiCall('saveData', 'POST', {
                type: 'keamanan_formal_groups',
                data: groupForm
            });
            showToast("Kelompok berhasil disimpan", "success");
            setIsGroupModalOpen(false);
            setGroupForm({ id: null, nama: '' });
            loadData();
        } catch (e) {
            showToast(e.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteGroup = async (id) => {
        if (!confirm("Hapus kelompok ini? Semua pemetaan santri di dalamnya akan ikut terhapus.")) return;
        setLoading(true);
        try {
            await apiCall('deleteData', 'DELETE', { type: 'keamanan_formal_groups', id });
            // Also clean up mappings for this group? (Usually backend handles this or we filter it)
            showToast("Kelompok dihapus", "success");
            loadData();
        } catch (e) {
            showToast(e.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // --- Student Mapping Actions ---
    const openManageModal = (group) => {
        setActiveGroup(group);
        setSearchTerm('');
        setIsManageModalOpen(true);
    };

    const filteredSantriForModal = useMemo(() => {
        if (!searchTerm) return [];
        return allSantri.filter(s =>
            s.madrasah === 'MIU' && (
                s.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (s.kelas && s.kelas.toLowerCase().includes(searchTerm.toLowerCase()))
            )
        ).slice(0, 50);
    }, [allSantri, searchTerm]);

    const activeGroupSantri = useMemo(() => {
        if (!activeGroup) return [];
        return mapping.filter(m => m.kelompok_formal === activeGroup.nama);
    }, [mapping, activeGroup]);

    const toggleSantriMapping = async (santri) => {
        if (!activeGroup) return;
        setMappingSubmitting(true);
        try {
            const existing = mapping.find(m => m.santri_id === santri.id && m.kelompok_formal === activeGroup.nama);

            if (existing) {
                await apiCall('deleteData', 'DELETE', { type: 'keamanan_formal_mapping', id: existing.id });
                showToast(`Dihapus: ${santri.nama_siswa}`, "info");
            } else {
                await apiCall('saveData', 'POST', {
                    type: 'keamanan_formal_mapping',
                    data: {
                        santri_id: santri.id,
                        nama_santri: santri.nama_siswa,
                        kelompok_formal: activeGroup.nama,
                        kelas_miu: santri.kelas
                    }
                });
                showToast(`Ditambahkan: ${santri.nama_siswa}`, "success");
            }

            const resMapping = await apiCall('getData', 'GET', { type: 'keamanan_formal_mapping' });
            if (isMounted.current) setMapping(resMapping || []);
        } catch (e) {
            showToast(e.message, "error");
        } finally {
            setMappingSubmitting(false);
        }
    };

    // --- Table Config ---
    const groupColumns = [
        { key: 'nama', label: 'Nama Kelompok Sekolah', render: (row) => <strong>{row.nama}</strong> },
        {
            key: 'total',
            label: 'Total Santri',
            width: '150px',
            render: (row) => {
                const count = mapping.filter(m => m.kelompok_formal === row.nama).length;
                return <span className="th-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)' }}>{count} Santri</span>;
            }
        },
        {
            key: 'actions',
            label: 'Aksi',
            width: '180px',
            render: (row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        className="btn-vibrant btn-vibrant-purple"
                        onClick={() => openManageModal(row)}
                        title="Kelola Santri"
                    >
                        <i className="fas fa-users"></i>
                    </button>
                    {canEdit && (
                        <>
                            <button
                                className="btn-vibrant btn-vibrant-blue"
                                onClick={() => { setGroupForm(row); setIsGroupModalOpen(true); }}
                                title="Edit Nama"
                            >
                                <i className="fas fa-edit"></i>
                            </button>
                            <button
                                className="btn-vibrant btn-vibrant-red"
                                onClick={() => handleDeleteGroup(row.id)}
                                title="Hapus Kelompok"
                            >
                                <i className="fas fa-trash"></i>
                            </button>
                        </>
                    )}
                </div>
            )
        }
    ];

    const statsItems = [
        { title: 'Total Kelompok', value: groups.length, icon: 'fas fa-layer-group', color: 'var(--primary)' },
        { title: 'Santri Terpetakan', value: mapping.length, icon: 'fas fa-user-check', color: 'var(--success)' },
        { title: 'Siswa MIU Aktif', value: allSantri.length, icon: 'fas fa-graduation-cap', color: 'var(--info)' }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Pengaturan Struktur Kelompok Formal" subJudul="Definisikan kelompok sekolah dan masukkan santri ke dalamnya." hideOnScreen={true} />

            <StatsPanel items={statsItems} />

            <DataViewContainer
                title="Daftar Kelompok Sekolah"
                subtitle="Gunakan menu ini untuk membagi santri ke dalam kelompok formal (SMP, SMA, Kuliah, dsb)."
                headerActions={canEdit && (
                    <button className="btn btn-primary" onClick={() => { setGroupForm({ id: null, nama: '' }); setIsGroupModalOpen(true); }}>
                        <i className="fas fa-plus"></i> Tambah Kelompok
                    </button>
                )}
                tableProps={{ columns: groupColumns, data: groups, loading }}
            />

            {/* Modal Tambah/Edit Kelompok */}
            <Modal
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
                title={groupForm.id ? "Edit Kelompok" : "Tambah Kelompok Baru"}
            >
                <div style={{ padding: '10px' }}>
                    <TextInput
                        label="Nama Kelompok"
                        value={groupForm.nama}
                        onChange={e => setGroupForm({ ...groupForm, nama: e.target.value })}
                        placeholder="Contoh: SMA / SMK"
                        required
                    />
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary" onClick={handleSaveGroup} disabled={loading}>
                            {loading ? 'Menyimpan...' : 'Simpan Kelompok'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal Kelola Santri dalam Kelompok */}
            <Modal
                isOpen={isManageModalOpen}
                onClose={() => setIsManageModalOpen(false)}
                title={`Kelola Santri: ${activeGroup?.nama}`}
                width="900px"
            >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '10px' }}>

                    {/* Panel Kiri: Pencarian & Tambah */}
                    <div className="card-glass" style={{ padding: '20px', borderRadius: '15px' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '15px', color: 'var(--primary-dark)' }}>Cari & Tambah Santri</h4>
                        <TextInput
                            icon="fas fa-search"
                            placeholder="Ketik nama santri atau kelas..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />

                        <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '10px' }}>
                            {filteredSantriForModal.length > 0 ? (
                                filteredSantriForModal.map(s => {
                                    const inThisGroup = activeGroupSantri.some(m => m.santri_id === s.id);
                                    const inAnyGroup = mapping.find(m => m.santri_id === s.id && m.kelompok_formal !== activeGroup?.nama);

                                    return (
                                        <div
                                            key={s.id}
                                            style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '12px', borderBottom: '1px solid #f1f5f9',
                                                background: inThisGroup ? 'var(--primary-light)' : 'transparent',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{s.nama_siswa}</div>
                                                <div style={{ fontSize: '0.7rem', color: inAnyGroup ? 'var(--warning-dark)' : 'var(--text-muted)' }}>
                                                    {inAnyGroup ? `⚠️ Terdaftar di: ${inAnyGroup.kelompok_formal}` : `Kelas MIU: ${s.kelas}`}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => !mappingSubmitting && toggleSantriMapping(s)}
                                                className={`btn-vibrant ${inThisGroup ? 'btn-vibrant-red' : 'btn-vibrant-blue'}`}
                                                style={{ width: '32px', height: '32px', padding: 0 }}
                                                disabled={mappingSubmitting}
                                            >
                                                <i className={`fas ${inThisGroup ? 'fa-minus' : 'fa-plus'}`}></i>
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    <i className="fas fa-search" style={{ fontSize: '2rem', opacity: 0.1, marginBottom: '10px' }}></i>
                                    <p style={{ fontSize: '0.8rem' }}>{searchTerm ? 'Santri tidak ditemukan.' : 'Silakan cari nama santri untuk mulai memetakan.'}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Panel Kanan: Daftar Anggota Sekarang */}
                    <div className="card-glass" style={{ padding: '20px', borderRadius: '15px', border: '1px solid var(--primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h4 style={{ fontSize: '0.9rem', color: 'var(--primary-dark)' }}>Anggota Kelompok ({activeGroupSantri.length})</h4>
                        </div>

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
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MIU {m.kelas_miu}</div>
                                        </div>
                                        <button
                                            onClick={() => !mappingSubmitting && toggleSantriMapping({ id: m.santri_id, nama_siswa: m.nama_santri })}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
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
