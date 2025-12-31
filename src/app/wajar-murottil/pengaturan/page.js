'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { apiCall } from '@/lib/utils';
import { useDataManagement } from '@/hooks/useDataManagement';
import { usePagePermission } from '@/lib/AuthContext';
import Modal from '@/components/Modal';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import { TextInput, SelectInput, TextAreaInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function PengaturanWajarPage() {
    const { canEdit, canDelete } = usePagePermission();
    const [jabatanList, setJabatanList] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
    const [mappingModal, setMappingModal] = useState({ open: false, kelompok: '', pengurusId: null, pengurusNama: '' });
    const [allSantri, setAllSantri] = useState([]);
    const [mappedSantri, setMappedSantri] = useState([]);
    const [mappingSubmitting, setMappingSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const isMounted = useRef(true);

    const {
        data, setData, loading, setLoading, submitting,
        isModalOpen, setIsModalOpen, formData, setFormData, editId,
        handleSave, handleDelete, openModal
    } = useDataManagement('wajar_pengurus', {
        nama_pengurus: '', kelompok: '', jabatan: 'Wajar & Murottil', keterangan: ''
    });

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const loadEnrichedData = useCallback(async () => {
        if (isMounted.current) setLoading(true);
        try {
            const [resPengurus, resJabatan, resSantri, resMapping] = await Promise.all([
                apiCall('getData', 'GET', { type: 'wajar_pengurus' }),
                apiCall('getData', 'GET', { type: 'master_jabatan' }),
                apiCall('getData', 'GET', { type: 'santri' }),
                apiCall('getData', 'GET', { type: 'wajar_kelompok_mapping' })
            ]);
            if (isMounted.current) {
                setData(resPengurus || []);
                setJabatanList(resJabatan || []);
                setAllSantri(resSantri || []);
                setMappedSantri(resMapping || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }, [setData, setLoading]);

    useEffect(() => { loadEnrichedData(); }, [loadEnrichedData]);

    const handleOpenMapping = (row) => {
        setMappingModal({
            open: true,
            kelompok: row.kelompok,
            pengurusId: row.id,
            pengurusNama: row.nama_pengurus
        });
    };

    const isSantriInGroup = (santriId, kelompok) => {
        return mappedSantri.some(m => m.santri_id === santriId && m.kelompok === kelompok);
    };

    const toggleSantriMapping = async (santri) => {
        const inGroup = isSantriInGroup(santri.id, mappingModal.kelompok);
        setMappingSubmitting(true);
        try {
            if (inGroup) {
                // Remove
                const existing = mappedSantri.find(m => m.santri_id === santri.id && m.kelompok === mappingModal.kelompok);
                if (existing) {
                    await apiCall('deleteData', 'DELETE', { type: 'wajar_kelompok_mapping', id: existing.id });
                }
            } else {
                // Add
                await apiCall('saveData', 'POST', {
                    type: 'wajar_kelompok_mapping',
                    data: {
                        santri_id: santri.id,
                        nama_santri: santri.nama_siswa,
                        kelompok: mappingModal.kelompok,
                        pengurus_id: mappingModal.pengurusId
                    }
                });
            }
            // Refresh mappings
            const resMapping = await apiCall('getData', 'GET', { type: 'wajar_kelompok_mapping' });
            if (isMounted.current) setMappedSantri(resMapping || []);
        } catch (e) {
            console.error(e);
        } finally {
            if (isMounted.current) setMappingSubmitting(false);
        }
    };

    const filteredSantriForModal = useMemo(() => {
        return allSantri.filter(s =>
            s.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.kelas && s.kelas.toLowerCase().includes(searchTerm.toLowerCase()))
        ).slice(0, 50); // Limit display for performance
    }, [allSantri, searchTerm]);

    const activeGroupSantri = useMemo(() => {
        return mappedSantri.filter(m => m.kelompok === mappingModal.kelompok);
    }, [mappedSantri, mappingModal.kelompok]);

    const columns = [
        { key: 'kelompok', label: 'Kelompok', render: (row) => <span className="th-badge">{row.kelompok || '-'}</span> },
        { key: 'nama_pengurus', label: 'Nama Pengurus', render: (row) => <strong>{row.nama_pengurus}</strong> },
        { key: 'jabatan', label: 'Jabatan' },
        {
            key: 'total_santri',
            label: 'Total Santri',
            render: (row) => {
                const count = mappedSantri.filter(m => m.kelompok === row.kelompok).length;
                return <span className="badge badge-info">{count} Santri</span>;
            }
        },
        {
            key: 'actions', label: 'Aksi', width: '180px', render: (row) => (
                <div className="table-actions">
                    <button className="btn-vibrant btn-vibrant-purple" title="Kelola Santri" onClick={() => handleOpenMapping(row)}>
                        <i className="fas fa-users"></i>
                    </button>
                    {canEdit && <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)}><i className="fas fa-edit"></i></button>}
                    {canDelete && <button className="btn-vibrant btn-vibrant-red" onClick={() => setConfirmDelete({ open: true, id: row.id })}><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Pengaturan Struktur Wajar & Murottil" subJudul="Manajemen pengajar dan pembagian kelompok santri." hideOnScreen={true} />

            <DataViewContainer
                title="Daftar Pengurus / Pengajar"
                subtitle="Daftar asatidz penanggung jawab beserta pembagian santri."
                headerActions={canEdit && <button className="btn btn-primary btn-sm" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Pengurus</button>}
                tableProps={{ columns, data: data, loading }}
            />

            {/* Modal Edit/Add Pengurus */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Data" : "Tambah Pengurus"} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>}>
                <TextInput label="Nama Lengkap Pengurus" value={formData.nama_pengurus} onChange={e => setFormData({ ...formData, nama_pengurus: e.target.value })} required />
                <div className="form-grid">
                    <TextInput label="Nama Kelompok" value={formData.kelompok} onChange={e => setFormData({ ...formData, kelompok: e.target.value })} placeholder="Contoh: Kelompok 1" />
                    <SelectInput label="Jabatan" value={formData.jabatan} onChange={e => setFormData({ ...formData, jabatan: e.target.value })} options={jabatanList.map(j => j.nama_jabatan)} />
                </div>
                <TextAreaInput label="Keterangan Tambahan" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} />
            </Modal>

            {/* Modal Manage Santri in Group */}
            <Modal
                isOpen={mappingModal.open}
                onClose={() => setMappingModal({ ...mappingModal, open: false })}
                title={`Kelola Santri: ${mappingModal.kelompok}`}
                width="800px"
            >
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ padding: '15px', background: 'var(--primary-light)', borderRadius: '12px', borderLeft: '4px solid var(--primary)', marginBottom: '15px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-dark)' }}>PEMBIMBING</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{mappingModal.pengurusNama}</div>
                    </div>

                    <div className="search-box-wrapper" style={{ marginBottom: '15px' }}>
                        <i className="fas fa-search search-icon"></i>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Cari santri untuk ditambahkan..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {/* List Available Santri */}
                        <div className="card-glass" style={{ padding: '15px', borderRadius: '15px' }}>
                            <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', color: 'var(--primary-dark)' }}>Pilih Santri</h4>
                            <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '5px' }}>
                                {filteredSantriForModal.map(s => {
                                    const inAnyGroup = mappedSantri.some(m => m.santri_id === s.id);
                                    const inThisGroup = isSantriInGroup(s.id, mappingModal.kelompok);
                                    return (
                                        <div
                                            key={s.id}
                                            className={`santri-select-item ${inThisGroup ? 'active' : ''}`}
                                            onClick={() => !mappingSubmitting && toggleSantriMapping(s)}
                                            style={{
                                                padding: '10px',
                                                marginBottom: '5px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                border: '1px solid #f1f5f9',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                background: inThisGroup ? 'var(--primary-light)' : 'white'
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{s.nama_siswa}</div>
                                                <small>{s.kelas} {inAnyGroup && !inThisGroup && <span style={{ color: 'var(--warning-dark)' }}>(Sudah ada kelompok)</span>}</small>
                                            </div>
                                            <i className={`fas ${inThisGroup ? 'fa-check-circle text-primary' : 'fa-plus-circle text-muted'}`}></i>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Current Group Santri */}
                        <div className="card-glass" style={{ padding: '15px', borderRadius: '15px', border: '1px solid var(--primary-light)' }}>
                            <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', color: 'var(--primary-dark)' }}>Anggota Kelompok ({activeGroupSantri.length})</h4>
                            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                {activeGroupSantri.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Belum ada santri di kelompok ini.</div>
                                ) : (
                                    activeGroupSantri.map(m => (
                                        <div
                                            key={m.id}
                                            style={{
                                                padding: '8px 12px',
                                                marginBottom: '5px',
                                                background: '#f8fafc',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div style={{ fontSize: '0.85rem' }}>{m.nama_santri}</div>
                                            <button
                                                style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                                                onClick={() => !mappingSubmitting && toggleSantriMapping({ id: m.santri_id })}
                                            >
                                                <i className="fas fa-times-circle"></i>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Data Pengurus?"
                message="Data asatidz ini akan dihapus dari sistem manajemen kelompok."
            />

            <style jsx>{`
                .santri-select-item:hover {
                    background: #f1f5f9;
                }
                .santri-select-item.active {
                    border-color: var(--primary);
                }
                .text-primary { color: var(--primary); }
            `}</style>
        </div>
    );
}
