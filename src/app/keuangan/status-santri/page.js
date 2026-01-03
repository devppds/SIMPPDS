'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth, usePagePermission } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';

// ✨ Unified Components
import DataViewContainer from '@/components/DataViewContainer';
import KopSurat from '@/components/KopSurat';
import StatsPanel from '@/components/StatsPanel';
import Modal from '@/components/Modal';
import { TextInput, SelectInput, TextAreaInput } from '@/components/FormInput';

export default function StatusKeuanganSantriPage() {
    const { user } = useAuth();
    const { canEdit } = usePagePermission();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [santriList, setSantriList] = useState([]);
    const [statusList, setStatusList] = useState([]);
    const [kategoriList, setKategoriList] = useState([]);
    const [search, setSearch] = useState('');
    const [filterKategori, setFilterKategori] = useState('Semua');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSantri, setSelectedSantri] = useState(null);
    const [formData, setFormData] = useState({
        kategori_pembayaran: '',
        tanggal_mulai: new Date().toISOString().split('T')[0],
        keterangan: ''
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [resSantri, resStatus, resKategori] = await Promise.all([
                apiCall('getData', 'GET', { type: 'santri' }),
                apiCall('getData', 'GET', { type: 'keuangan_status_santri' }),
                apiCall('getData', 'GET', { type: 'master_kategori_pembayaran' })
            ]);
            setSantriList(resSantri || []);
            setStatusList(resStatus || []);
            setKategoriList((resKategori || []).filter(k => k.aktif).sort((a, b) => a.urutan - b.urutan));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // Merge santri dengan status keuangan
    const santriWithStatus = useMemo(() => {
        return santriList.map(santri => {
            // Cari status aktif (tanggal_selesai = null)
            const activeStatus = statusList.find(s =>
                s.santri_id === santri.id && !s.tanggal_selesai
            );

            return {
                ...santri,
                kategori_pembayaran: activeStatus?.kategori_pembayaran || 'Biasa Lama',
                tanggal_mulai: activeStatus?.tanggal_mulai || null,
                status_keterangan: activeStatus?.keterangan || null,
                has_custom_status: !!activeStatus,
                status_id: activeStatus?.id || null
            };
        });
    }, [santriList, statusList]);

    const displayData = useMemo(() => {
        return santriWithStatus.filter(s => {
            const matchSearch = (s.nama_siswa || '').toLowerCase().includes(search.toLowerCase()) ||
                (s.kelas || '').toLowerCase().includes(search.toLowerCase());
            if (!matchSearch) return false;

            if (filterKategori !== 'Semua' && s.kategori_pembayaran !== filterKategori) return false;

            return true;
        });
    }, [santriWithStatus, search, filterKategori]);

    const stats = useMemo(() => {
        const kategoryCounts = {};
        santriWithStatus.forEach(s => {
            kategoryCounts[s.kategori_pembayaran] = (kategoryCounts[s.kategori_pembayaran] || 0) + 1;
        });

        return [
            { title: 'Total Santri', value: santriWithStatus.length, icon: 'fas fa-users', color: 'var(--primary)' },
            { title: 'Biasa Lama', value: kategoryCounts['Biasa Lama'] || 0, icon: 'fas fa-user', color: 'var(--success)' },
            { title: 'Status Khusus', value: santriWithStatus.filter(s => s.has_custom_status).length, icon: 'fas fa-star', color: 'var(--warning)' },
            { title: 'Kategori Aktif', value: kategoriList.length, icon: 'fas fa-tags', color: '#8b5cf6' }
        ];
    }, [santriWithStatus, kategoriList]);

    const openModal = (santri) => {
        setSelectedSantri(santri);
        setFormData({
            kategori_pembayaran: santri.kategori_pembayaran,
            tanggal_mulai: santri.tanggal_mulai || new Date().toISOString().split('T')[0],
            keterangan: santri.status_keterangan || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedSantri) return;

        setSubmitting(true);
        try {
            // Logic Baru:
            // 1. Cek apakan santri punya status aktif custom saat ini (status_id tidak null)
            // 2. Jika ada, tutup status tersebut (set tanggal_selesai)
            // 3. Jika status baru yang dipilih BUKAN 'Biasa Lama', buat status baru

            const currentDate = new Date().toISOString().split('T')[0];

            // 1. Tutup status lama jika ada
            if (selectedSantri.status_id) {
                await apiCall('updateData', 'PUT', {
                    type: 'keuangan_status_santri',
                    id: selectedSantri.status_id,
                    data: { tanggal_selesai: currentDate }
                });
            }

            // 2. Buat status baru jika bukan default 'Biasa Lama'
            if (formData.kategori_pembayaran !== 'Biasa Lama') {
                await apiCall('saveData', 'POST', {
                    type: 'keuangan_status_santri',
                    data: {
                        santri_id: selectedSantri.id,
                        nama_santri: selectedSantri.nama_siswa,
                        kategori_pembayaran: formData.kategori_pembayaran,
                        tanggal_mulai: formData.tanggal_mulai,
                        tanggal_selesai: null,
                        keterangan: formData.keterangan || '-',
                        petugas: user?.fullname || 'Admin'
                    }
                });
            }

            showToast('Status keuangan berhasil diperbarui!', 'success');
            setIsModalOpen(false);
            loadData();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        {
            key: 'nama_siswa',
            label: 'Nama Santri',
            width: '220px',
            render: (row) => (
                <div>
                    <div style={{ fontWeight: 800 }}>{row.nama_siswa}</div>
                    <small style={{ color: 'var(--text-muted)' }}>{row.kelas}</small>
                </div>
            )
        },
        {
            key: 'kategori_pembayaran',
            label: 'Kategori Pembayaran',
            render: (row) => (
                <div>
                    <span className="th-badge" style={{
                        background: row.has_custom_status ? 'var(--primary-light)' : '#f1f5f9',
                        color: row.has_custom_status ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: row.has_custom_status ? 800 : 600
                    }}>
                        {row.kategori_pembayaran}
                    </span>
                    {!row.has_custom_status && <small style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>(default)</small>}
                </div>
            )
        },
        {
            key: 'tanggal_mulai',
            label: 'Sejak',
            width: '120px',
            className: 'hide-mobile',
            render: (row) => row.tanggal_mulai ? formatDate(row.tanggal_mulai) : '-'
        },
        {
            key: 'actions',
            label: 'Aksi',
            width: '100px',
            render: (row) => canEdit && (
                <div className="table-actions">
                    <button
                        className="btn-vibrant btn-vibrant-blue"
                        onClick={() => openModal(row)}
                        title={row.has_custom_status ? "Edit Status" : "Atur Status"}
                    >
                        <i className={row.has_custom_status ? "fas fa-edit" : "fas fa-cog"}></i>
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <KopSurat
                judul="Status Keuangan Santri"
                subJudul="Kelola kategori pembayaran untuk setiap santri"
                hideOnScreen={true}
            />

            <StatsPanel items={stats} />

            <DataViewContainer
                title="Daftar Status Keuangan Santri"
                subtitle={`Menampilkan ${displayData.length} santri`}
                searchProps={{
                    value: search,
                    onChange: e => setSearch(e.target.value),
                    placeholder: "Cari nama santri / kelas..."
                }}
                filters={
                    <SelectInput
                        value={filterKategori}
                        onChange={e => setFilterKategori(e.target.value)}
                        options={['Semua', ...kategoriList.map(k => k.nama_kategori)]}
                        style={{ width: '200px', marginBottom: 0 }}
                    />
                }
                tableProps={{ columns, data: displayData, loading }}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Atur Status Keuangan" width="600px">
                {selectedSantri && (
                    <form onSubmit={handleSubmit}>
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{selectedSantri.nama_siswa}</div>
                            <small style={{ color: 'var(--text-muted)' }}>{selectedSantri.kelas}</small>
                        </div>

                        <SelectInput
                            label="Kategori Pembayaran"
                            value={formData.kategori_pembayaran}
                            onChange={e => setFormData({ ...formData, kategori_pembayaran: e.target.value })}
                            options={['Biasa Lama', ...kategoriList.map(k => k.nama_kategori)]}
                            required
                        />

                        <TextInput
                            label="Tanggal Mulai Berlaku"
                            type="date"
                            value={formData.tanggal_mulai}
                            onChange={e => setFormData({ ...formData, tanggal_mulai: e.target.value })}
                            required
                        />

                        <TextAreaInput
                            label="Keterangan"
                            value={formData.keterangan}
                            onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                            placeholder="Alasan/catatan perubahan status"
                            rows={3}
                        />

                        <div className="modal-actions">
                            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                                Batal
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? <><i className="fas fa-spinner fa-spin"></i> Menyimpan...</> : 'Simpan'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}
