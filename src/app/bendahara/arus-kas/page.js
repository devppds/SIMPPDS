'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiCall, formatCurrency, formatDate, exportToExcel } from '@/lib/utils';
import { useDataManagement } from '@/hooks/useDataManagement';
import { usePagePermission } from '@/lib/AuthContext';
import Modal from '@/components/Modal';
import Autocomplete from '@/components/Autocomplete';

// ✨ Unified Components (Satu Pintu)
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput } from '@/components/FormInput';
import ConfirmModal from '@/components/ConfirmModal';

export default function ArusKasPage() {
    const { canEdit, canDelete } = usePagePermission();
    const [pjOptions, setPjOptions] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const {
        data, setData, loading, setLoading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, formData, setFormData, editId,
        handleSave, handleDelete, openModal, openView, isAdmin
    } = useDataManagement('arus_kas', {
        tanggal: '',
        tipe: 'Masuk', nominal: '', kategori: 'Syahriah',
        keterangan: '', pj: ''
    });

    // Date auto-filled by hook
    const loadEnrichedData = useCallback(async () => {
        setLoading(true);
        try {
            const [res, ustadz, pengurus] = await Promise.all([
                apiCall('getData', 'GET', { type: 'arus_kas' }),
                apiCall('getData', 'GET', { type: 'ustadz' }),
                apiCall('getData', 'GET', { type: 'pengurus' })
            ]);
            setData(res?.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)) || []);
            setPjOptions([
                ...(ustadz || []).map(u => ({ nama: u.nama, role: 'Pengajar' })),
                ...(pengurus || []).map(p => ({ nama: p.nama, role: 'Pengurus' }))
            ]);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, [setData, setLoading]);

    useEffect(() => { loadEnrichedData(); }, [loadEnrichedData]);

    const stats = useMemo(() => {
        const mas = data.filter(d => d.tipe === 'Masuk').reduce((acc, d) => acc + parseInt(d.nominal || 0), 0);
        const kel = data.filter(d => d.tipe === 'Keluar').reduce((acc, d) => acc + parseInt(d.nominal || 0), 0);
        return [
            { title: 'Pemasukan', value: formatCurrency(mas), icon: 'fas fa-arrow-down', color: 'var(--success)' },
            { title: 'Pengeluaran', value: formatCurrency(kel), icon: 'fas fa-arrow-up', color: 'var(--danger)' },
            { title: 'Saldo Akhir', value: formatCurrency(mas - kel), icon: 'fas fa-wallet', color: 'var(--primary)' }
        ];
    }, [data]);

    const displayData = data.filter(d =>
        (d.keterangan || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.kategori || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.pj || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => <span style={{ fontWeight: 600 }}>{formatDate(row.tanggal)}</span> },
        { key: 'tipe', label: 'Jenis', render: (row) => <span className="th-badge" style={{ background: row.tipe === 'Masuk' ? '#dcfce7' : '#fee2e2', color: row.tipe === 'Masuk' ? '#166534' : '#991b1b' }}>{row.tipe.toUpperCase()}</span> },
        { key: 'kategori', label: 'Kategori', className: 'hide-mobile', render: (row) => <strong>{row.kategori}</strong> },
        { key: 'nominal', label: 'Nominal', render: (row) => <span style={{ fontWeight: 800, color: row.tipe === 'Masuk' ? '#059669' : '#dc2626' }}>{row.tipe === 'Masuk' ? '+' : '-'} {formatCurrency(row.nominal)}</span> },
        { key: 'pj', label: 'PJ', className: 'hide-mobile' },
        {
            key: 'actions', label: 'Aksi', width: '150px', render: (row) => (
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
            <KopSurat judul="Pembukuan Arus Kas Utama" subJudul="Bendahara Pondok Pesantren" hideOnScreen={true} />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Daftar Transaksi Keuangan"
                subtitle="Data pemasukan dan pengeluaran berkala."
                headerActions={canEdit && (<>
                    <button className="btn btn-outline btn-sm" onClick={() => exportToExcel(data, 'Arus_Kas_Full', ['Tanggal', 'Tipe', 'Kategori', 'Nominal', 'Keterangan', 'PJ'])}>Export Excel</button>
                    <button className="btn btn-primary btn-sm" onClick={() => openModal()}><i className="fas fa-plus"></i> Transaksi Baru</button>
                </>)}
                searchProps={{ value: search, onChange: e => setSearch(e.target.value) }}
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Update Transaksi" : "Input Transaksi Baru"} footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>}>
                <TextInput label="Tanggal" type="date" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} />
                <div className="form-grid">
                    <SelectInput label="Tipe" value={formData.tipe} onChange={e => setFormData({ ...formData, tipe: e.target.value })} options={['Masuk', 'Keluar']} />
                    <SelectInput label="Kategori" value={formData.kategori} onChange={e => setFormData({ ...formData, kategori: e.target.value })} options={['Syahriah', 'Dana Bantuan', 'Pembangunan', 'Kesehatan', 'Administrasi', 'Sarana Prasarana', 'Lain-lain']} />
                </div>
                <TextInput label="Nominal (Rp)" type="number" value={formData.nominal} onChange={e => setFormData({ ...formData, nominal: e.target.value })} style={{ fontWeight: 800, color: 'var(--primary)' }} />
                <TextInput label="Keterangan" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} />
                <div className="form-group">
                    <label className="form-label">PJ (Penanggung Jawab)</label>
                    <Autocomplete options={pjOptions} value={formData.pj} onChange={(val) => setFormData({ ...formData, pj: val })} onSelect={(s) => setFormData({ ...formData, pj: s.nama })} placeholder="Pilih PJ..." labelKey="nama" subLabelKey="role" />
                </div>
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Transaksi" footer={<button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Selesai</button>}>
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: viewData.tipe === 'Masuk' ? '#059669' : '#dc2626' }}>{viewData.tipe === 'Masuk' ? '+' : '-'} {formatCurrency(viewData.nominal)}</div>
                            <span className="th-badge" style={{ background: viewData.tipe === 'Masuk' ? '#dcfce7' : '#fee2e2', color: viewData.tipe === 'Masuk' ? '#166534' : '#991b1b', marginTop: '10px' }}>{viewData.tipe.toUpperCase()}</span>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '15px' }}>
                            <div className="form-grid">
                                <div><small>Kategori</small><div style={{ fontWeight: 800 }}>{viewData.kategori}</div></div>
                                <div><small>Tanggal</small><div>{formatDate(viewData.tanggal)}</div></div>
                                <div><small>PJ</small><div>{viewData.pj || '-'}</div></div>
                            </div>
                            <div style={{ marginTop: '1.5rem' }}><small>Keterangan</small><p>{viewData.keterangan || '-'}</p></div>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                onConfirm={async () => { await handleDelete(confirmDelete.id); setConfirmDelete({ open: false, id: null }); loadEnrichedData(); }}
                title="Hapus Transaksi?"
                message="Data ini akan dihapus permanen dari buku besar pembukuan."
            />
        </div>
    );
}