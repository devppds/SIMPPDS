'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';
import Autocomplete from '@/components/Autocomplete';

export default function IzinPage() {
    const { isAdmin } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState(null);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        tanggal_mulai: new Date().toISOString().split('T')[0],
        tanggal_selesai: '', nama_santri: '', kelas: '', alasan: '',
        keperluan: 'Pulang Rumah', status: 'Menunggu', penjemput: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const [santriOptions, setSantriOptions] = useState([]);

    useEffect(() => {
        loadData();
        fetchSantri();
    }, []);

    const fetchSantri = async () => {
        try {
            const res = await apiCall('getData', 'GET', { type: 'santri' });
            setSantriOptions(res || []);
        } catch (e) { console.error(e); }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'izin' });
            setData(res || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openModal = (item = null) => {
        if (item) {
            setEditId(item.id);
            setFormData({ ...item });
        } else {
            setEditId(null);
            setFormData({
                tanggal_mulai: new Date().toISOString().split('T')[0],
                tanggal_selesai: '', nama_santri: '', alasan: '',
                keperluan: 'Pulang Rumah', status: 'Menunggu', penjemput: ''
            });
        }
        setIsModalOpen(true);
    };

    const openViewModal = (item) => {
        setViewData(item);
        setIsViewModalOpen(true);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        try {
            await apiCall('saveData', 'POST', {
                type: 'izin',
                data: editId ? { ...formData, id: editId } : formData
            });
            setIsModalOpen(false);
            loadData();
        } catch (err) { alert(err.message); }
        finally { setSubmitting(false); }
    };

    const deleteItem = async (id) => {
        if (!confirm('Hapus data perizinan ini?')) return;
        try {
            await apiCall('deleteData', 'POST', { type: 'izin', id });
            loadData();
        } catch (err) { alert(err.message); }
    };

    const displayData = data.filter(d =>
        (d.nama_santri || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.alasan || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { key: 'nama_santri', label: 'Nama Santri', render: (row) => <span style={{ fontWeight: 800 }}>{row.nama_santri}</span> },
        { key: 'kelas', label: 'Kelas', render: (row) => <span className="th-badge">{row.kelas || '-'}</span> },
        { key: 'alasan', label: 'Alasan' },
        { key: 'tanggal_pulang', label: 'Tgl Pulang', render: (row) => formatDate(row.tanggal_pulang) },
        { key: 'tanggal_kembali', label: 'Tgl Kembali', render: (row) => formatDate(row.tanggal_kembali) },
        { key: 'tipe_izin', label: 'Tipe' },
        { key: 'petugas', label: 'Petugas' },
        {
            key: 'actions',
            label: 'Aksi',
            sortable: false,
            width: '150px',
            render: (row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openViewModal(row)} title="Detail"><i className="fas fa-eye"></i></button>
                    <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)} title="Edit"><i className="fas fa-edit"></i></button>
                    {isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => deleteItem(row.id)} title="Hapus"><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Perizinan & Keluar Pondok</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mengelola {displayData.length} data izin santri.</p>
                    </div>
                    <div className="card-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                            <i className="fas fa-plus"></i> Buat Surat Izin
                        </button>
                    </div>
                </div>

                <div className="table-controls">
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Cari nama santri atau alasan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <SortableTable
                    columns={columns}
                    data={displayData}
                    loading={loading}
                    emptyMessage="Belum ada data perizinan."
                />
            </div>

            {/* Modal Input/Edit */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? "Update Surat Izin" : "Buat Izin Baru"}
                footer={(
                    <>
                        <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Batal</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Memproses...' : 'Simpan'}
                        </button>
                    </>
                )}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Nama Santri</label>
                        <Autocomplete
                            options={santriOptions}
                            value={formData.nama_santri}
                            onChange={(val) => setFormData({ ...formData, nama_santri: val })}
                            onSelect={(s) => setFormData({ ...formData, nama_santri: s.nama_siswa, kelas: s.kelas })}
                            placeholder="Ketik nama santri untuk mencari..."
                            required
                        />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Tanggal Mulai</label>
                            <input type="date" className="form-control" value={formData.tanggal_mulai} onChange={e => setFormData({ ...formData, tanggal_mulai: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Estimasi Kembali</label>
                            <input type="date" className="form-control" value={formData.tanggal_selesai} onChange={e => setFormData({ ...formData, tanggal_selesai: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Keperluan</label>
                            <select className="form-control" value={formData.keperluan} onChange={e => setFormData({ ...formData, keperluan: e.target.value })}>
                                <option value="Pulang Rumah">Pulang Rumah</option>
                                <option value="Izin Keluar Sebentar">Izin Keluar Sebentar</option>
                                <option value="Sakit / Berobat">Sakit / Berobat</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Penjemput (Wali)</label>
                            <input type="text" className="form-control" value={formData.penjemput} onChange={e => setFormData({ ...formData, penjemput: e.target.value })} placeholder="Nama penjemput" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Alasan Detail</label>
                        <textarea className="form-control" value={formData.alasan} onChange={e => setFormData({ ...formData, alasan: e.target.value })} rows="3"></textarea>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Status Izin</label>
                        <select className="form-control" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                            <option value="Menunggu">Menunggu Persetujuan</option>
                            <option value="Aktif">Disetujui (Aktif)</option>
                            <option value="Kembali">Sudah Kembali</option>
                            <option value="Terlambat">Terlambat Kembali</option>
                        </select>
                    </div>
                </form>
            </Modal>

            {/* Modal View Detail */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Detail Perizinan"
                footer={<button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Selesai</button>}
            >
                {viewData && (() => {
                    const student = santriOptions.find(s => s.nama_siswa === viewData.nama_santri);
                    return (
                        <div className="detail-view">
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                                    <div style={{
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '50%',
                                        overflow: 'hidden',
                                        border: '4px solid var(--primary-light)',
                                        background: '#f1f5f9'
                                    }}>
                                        {student?.foto_santri ? (
                                            <img src={student.foto_santri} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                                                <i className="fas fa-user fa-3x"></i>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nama Santri</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{viewData.nama_santri}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>Kelas: <strong>{viewData.kelas || '-'}</strong></div>
                                <span className="th-badge" style={{
                                    background: viewData.status === 'Aktif' ? '#dcfce7' : viewData.status === 'Menunggu' ? '#fffbeb' : '#f1f5f9',
                                    color: viewData.status === 'Aktif' ? '#166534' : viewData.status === 'Menunggu' ? '#9a3412' : '#475569',
                                    marginTop: '10px'
                                }}>
                                    Izin {viewData.status}
                                </span>
                            </div>
                            <div className="form-grid" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px' }}>
                                <div>
                                    <small style={{ color: 'var(--text-muted)' }}>Mulai Izin</small>
                                    <div style={{ fontWeight: 600 }}>{formatDate(viewData.tanggal_mulai)}</div>
                                </div>
                                <div>
                                    <small style={{ color: 'var(--text-muted)' }}>Rencana Kembali</small>
                                    <div style={{ fontWeight: 600 }}>{formatDate(viewData.tanggal_selesai)}</div>
                                </div>
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <small style={{ color: 'var(--text-muted)' }}>Tujuan / Keperluan</small>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>{viewData.keperluan}</div>
                            </div>
                            <div style={{ marginTop: '1rem' }}>
                                <small style={{ color: 'var(--text-muted)' }}>Penjemput</small>
                                <div style={{ fontWeight: 600 }}>{viewData.penjemput || 'Diijinkan Sendiri'}</div>
                            </div>
                            <div style={{ marginTop: '1rem' }}>
                                <small style={{ color: 'var(--text-muted)' }}>Alasan Detail</small>
                                <div style={{ padding: '1rem', background: '#f1f5f9', borderRadius: '8px', marginTop: '5px' }}>
                                    {viewData.alasan || 'Tidak ada alasan detail.'}
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </Modal>
        </div>
    );
}