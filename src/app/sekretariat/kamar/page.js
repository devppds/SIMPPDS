'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiCall } from '@/lib/utils';
import { usePagePermission } from '@/lib/AuthContext';
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function KamarPage() {
    const { canEdit, canDelete } = usePagePermission();
    const [allSantri, setAllSantri] = useState([]);
    const [penasihatList, setPenasihatList] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const {
        data, setData, loading, setLoading, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, setViewData, formData, setFormData, editId,
        handleSave, handleDelete, openModal, isAdmin
    } = useDataManagement('kamar', {
        nama_kamar: '1', asrama: 'DS A', kapasitas: '10'
    });

    const loadEnrichedData = useCallback(async () => {
        setLoading(true);
        try {
            const [res, santri] = await Promise.all([
                apiCall('getData', 'GET', { type: 'kamar' }),
                apiCall('getData', 'GET', { type: 'santri' })
            ]);
            setAllSantri(santri || []);

            const rooms = res || [];
            const occupancies = {};
            (santri || []).forEach(s => { if (s.kamar) occupancies[s.kamar] = (occupancies[s.kamar] || 0) + 1; });

            const enrichedRooms = rooms.map(r => {
                const num = r.nama_kamar.toString().padStart(2, '0');
                const fullName = `${r.asrama} ${num}`;
                const occupiedCount = occupancies[fullName] || occupancies[`${r.asrama} - ${r.nama_kamar}`] || occupancies[r.nama_kamar] || 0;
                return { ...r, formattedName: fullName, terisi: occupiedCount };
            });

            setData(enrichedRooms);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, [setData, setLoading]);

    useEffect(() => { loadEnrichedData(); }, [loadEnrichedData]);

    const stats = useMemo(() => [
        { title: 'Kamar Terdaftar', value: data.length, icon: 'fas fa-door-open', color: 'var(--primary)' },
        { title: 'Santri Menetap', value: data.reduce((acc, r) => acc + (r.terisi || 0), 0), icon: 'fas fa-user-check', color: 'var(--success)' },
        { title: 'Total Kapasitas', value: data.reduce((acc, r) => acc + parseInt(r.kapasitas || 0), 0), icon: 'fas fa-bed', color: 'var(--warning)' }
    ], [data]);

    const openViewModal = (item) => {
        const fullName = `${item.asrama} - ${item.nama_kamar}`;
        const occupants = allSantri.filter(s => s.kamar === fullName || s.kamar === item.nama_kamar || s.kamar === item.formattedName);
        setViewData({ ...item, occupants });
        setIsViewModalOpen(true);
    };

    const columns = [
        { key: 'nama_kamar', label: 'Nama Kamar', render: (row) => <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-dark)' }}>{row.formattedName || `${row.asrama} ${row.nama_kamar}`}</div> },
        { key: 'kapasitas', label: 'Kapasitas', render: (row) => <span style={{ fontWeight: 600 }}>{row.kapasitas} Bed</span> },
        {
            key: 'terisi', label: 'Tingkat Hunian', render: (row) => {
                const perc = Math.min(100, Math.round(((row.terisi || 0) / (row.kapasitas || 1)) * 100));
                const color = perc > 95 ? 'var(--danger)' : (perc > 75 ? 'var(--warning)' : 'var(--primary)');
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '150px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800 }}><span>{row.terisi} Santri</span><span style={{ color }}>{perc}%</span></div>
                        <div style={{ width: '100%', background: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${perc}%`, background: color, height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'actions', label: 'Opsi', width: '150px', render: (row) => (
                <div className="table-actions">
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openViewModal(row)}><i className="fas fa-eye"></i></button>
                    {canEdit && <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)}><i className="fas fa-edit"></i></button>}
                    {canDelete && <button className="btn-vibrant btn-vibrant-red" onClick={() => setConfirmDelete({ open: true, id: row.id })}><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    if (!mounted) return null;

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Monitoring Hunian & Asrama" subJudul="Manajemen distribusi santri dan kapasitas kamar gending." hideOnScreen={true} />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Management Kamar"
                subtitle="Daftar blok asrama dan status hunian santri."
                headerActions={canEdit && <button className="btn btn-primary btn-sm" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Kamar</button>}
                tableProps={{ columns, data: data, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Kamar" : "Tambah Kamar"} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>}>
                <div className="form-grid">
                    <SelectInput label="Blok / Kompleks" value={formData.asrama} onChange={e => setFormData({ ...formData, asrama: e.target.value })} options={['DS A', 'DS B', 'DS C']} />
                    <SelectInput label="Nomor Kamar" value={formData.nama_kamar} onChange={e => setFormData({ ...formData, nama_kamar: e.target.value })} options={Array.from({ length: 30 }, (_, i) => (i + 1).toString())} />
                </div>
                <TextInput label="Kapasitas Bed" type="number" value={formData.kapasitas} onChange={e => setFormData({ ...formData, kapasitas: e.target.value })} icon="fas fa-bed" />
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Profil Detail Kamar" width="600px">
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Identitas Hunian</div>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-dark)' }}>{viewData.formattedName || viewData.nama_kamar}</h2>
                            <div style={{ padding: '5px 15px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '20px', display: 'inline-block', fontWeight: 800, marginTop: '10px' }}>{viewData.asrama}</div>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontWeight: 800 }}><span>Tingkat HUNIAN</span><span>{viewData.terisi} / {viewData.kapasitas} Bed</span></div>
                            <div style={{ width: '100%', background: '#e2e8f0', height: '10px', borderRadius: '5px', overflow: 'hidden' }}><div style={{ width: `${Math.min(100, (viewData.terisi / viewData.kapasitas) * 100)}%`, background: 'var(--primary)', height: '100%' }}></div></div>
                        </div>
                        <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '1rem' }}><i className="fas fa-users-cog"></i> Daftar Penghuni Santri</h3>
                            {viewData.occupants && viewData.occupants.length > 0 ? (
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    {viewData.occupants.map((s, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px', background: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                                            <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{i + 1}</div>
                                            <div><div style={{ fontWeight: 800 }}>{s.nama_siswa}</div><small>Kelas: {s.kelas || '-'} | {s.stambuk_pondok}</small></div>
                                        </div>
                                    ))}
                                </div>
                            ) : <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '15px' }}>Kamar ini masih kosong.</div>}
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id); setConfirmDelete({ open: false, id: null }); }}
                title="Hapus Data Kamar?"
                message="Data kamar ini akan dihapus permanen. Hal ini dapat mempengaruhi database penempatan santri."
            />
        </div>
    );
}