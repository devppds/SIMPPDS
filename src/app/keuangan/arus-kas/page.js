'use client';

import React, { useMemo } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useDataManagement } from '@/hooks/useDataManagement';
import { usePagePermission } from '@/lib/AuthContext';
import Modal from '@/components/Modal';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import { TextInput, SelectInput, TextAreaInput } from '@/components/FormInput';

export default function ArusKasKeuanganPage() {
    const { canEdit } = usePagePermission();
    const {
        data, loading, submitting,
        isModalOpen, setIsModalOpen, formData, setFormData,
        handleSave
    } = useDataManagement('keuangan_kas', {
        tanggal: '',
        tipe: 'Keluar', kategori: 'Setor Bendahara Pondok', nominal: '', keterangan: ''
    });

    React.useEffect(() => {
        setFormData(prev => ({ ...prev, tanggal: new Date().toISOString().split('T')[0] }));
    }, [setFormData]);

    const stats = useMemo(() => {
        const mas = data.filter(d => d.tipe === 'Masuk').reduce((acc, d) => acc + parseInt(d.nominal || 0), 0);
        const kel = data.filter(d => d.tipe === 'Keluar').reduce((acc, d) => acc + parseInt(d.nominal || 0), 0);
        return [
            { title: 'Total Masuk', value: formatCurrency(mas), icon: 'fas fa-arrow-down', color: 'var(--success)' },
            { title: 'Total Keluar', value: formatCurrency(kel), icon: 'fas fa-arrow-up', color: 'var(--danger)' },
            { title: 'Saldo Kas', value: formatCurrency(mas - kel), icon: 'fas fa-wallet', color: 'var(--primary)' }
        ];
    }, [data]);

    const openModal = (kategoriPreset = 'Belanja Operasional') => {
        setFormData({
            tanggal: new Date().toISOString().split('T')[0],
            tipe: 'Keluar', kategori: kategoriPreset,
            nominal: '', keterangan: ''
        });
        setIsModalOpen(true);
    };

    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => formatDate(row.tanggal) },
        { key: 'kategori', label: 'Keterangan', render: (row) => <div><div style={{ fontWeight: 700 }}>{row.kategori}</div><div style={{ fontSize: '0.7rem' }}>{row.keterangan}</div></div> },
        { key: 'masuk', label: 'Masuk', render: (row) => row.tipe === 'Masuk' ? <span style={{ color: 'var(--success)', fontWeight: 700 }}>{formatCurrency(row.nominal)}</span> : '-' },
        { key: 'keluar', label: 'Keluar', render: (row) => row.tipe === 'Keluar' ? <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{formatCurrency(row.nominal)}</span> : '-' },
        { key: 'petugas', label: 'Petugas' }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat judul="Kas Pelayanan Keuangan" subJudul="Log harian kas unit keuangan." hideOnScreen={true} />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Buku Kas Keuangan"
                subtitle="Daftar mutasi dana unit keuangan."
                headerActions={canEdit && (<>
                    <button className="btn btn-outline btn-sm" onClick={() => openModal('Setor Bendahara Pondok')}>Setor Pondok</button>
                    <button className="btn btn-primary btn-sm" onClick={() => openModal('Belanja Operasional')}>Belanja</button>
                </>)}
                tableProps={{ columns, data: data.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)), loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Pencatatan Keuangan" footer={<button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>}>
                <TextInput label="Tanggal" type="date" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} />
                <SelectInput label="Kategori" value={formData.kategori} onChange={e => setFormData({ ...formData, kategori: e.target.value })} options={['Setor Bendahara Pondok', 'Setor Madrasah', 'Belanja Operasional', 'Lainnya']} />
                <TextInput label="Nominal (Rp)" type="number" value={formData.nominal} onChange={e => setFormData({ ...formData, nominal: e.target.value })} required icon="fas fa-coins" />
                <TextAreaInput label="Keterangan" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} />
            </Modal>
        </div>
    );
}
