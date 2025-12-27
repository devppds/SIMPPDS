'use client';

import React, { useState, useEffect } from 'react';
import { apiCall, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';

export default function PendidikanPage() {
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
        tanggal: new Date().toISOString().split('T')[0],
        nama_santri: '', kegiatan: '', nilai: '',
        kehadiran: 'Hadir', keterangan: '', ustadz: ''
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
            const res = await apiCall('getData', 'GET', { type: 'pendidikan' });
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
                tanggal: new Date().toISOString().split('T')[0],
                nama_santri: '', kegiatan: '', nilai: '',
                kehadiran: 'Hadir', keterangan: '', ustadz: ''
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
                type: 'pendidikan',
                data: editId ? { ...formData, id: editId } : formData
            });
            setIsModalOpen(false);
            loadData();
        } catch (err) { alert(err.message); }
        finally { setSubmitting(false); }
    };

    const deleteItem = async (id) => {
        if (!confirm('Hapus data pendidikan ini?')) return;
        try {
            await apiCall('deleteData', 'POST', { type: 'pendidikan', id });
            loadData();
        } catch (err) { alert(err.message); }
    };

    const displayData = data.filter(d =>
        (d.nama_santri || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.kegiatan || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { key: 'tanggal', label: 'Tanggal', render: (row) => formatDate(row.tanggal) },
        { key: 'nama_santri', label: 'Nama Santri', render: (row) => <span style={{ fontWeight: 800 }}>{row.nama_santri}</span> },
        { key: 'kegiatan', label: 'Kegiatan' },
        { key: 'nilai', label: 'Nilai', render: (row) => <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{row.nilai}</span> },
        { key: 'kehadiran', label: 'Kehadiran' },
        { key: 'ustadz', label: 'Ustadz' },
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
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Agenda & Data Pendidikan</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mencatat {displayData.length} agenda kegiatan pendidikan.</p>
                    </div>
                    <div className="card-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                            <i className="fas fa-plus"></i> Input Nilai / Agenda
                        </button>
                    </div>
                </div>

                <div className="table-controls">
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Cari nama santri atau kegiatan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <SortableTable
                    columns={columns}
                    data={displayData}
                    loading={loading}
                    emptyMessage="Belum ada data pendidikan."
                />
            </div>

            {/* Modal Input/Edit */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? "Update Data Pendidikan" : "Input Pendidikan Baru"}
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
                        <input
                            type="text"
                            className="form-control"
                            list="santri-list"
                            value={formData.nama_santri}
                            onChange={e => setFormData({ ...formData, nama_santri: e.target.value })}
                            required
                            placeholder="Ketik nama untuk mencari..."
                        />
                        <datalist id="santri-list">
                            {santriOptions.map((s, idx) => (
                                <option key={idx} value={s.nama_siswa}>{s.stambuk_pondok ? `[${s.stambuk_pondok}] ` : ''}{s.kamar || ''}</option>
                            ))}
                        </datalist>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Nama Kegiatan</label>
                            <input type="text" className="form-control" value={formData.kegiatan} onChange={e => setFormData({ ...formData, kegiatan: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tanggal</label>
                            <input type="date" className="form-control" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Nilai / Hasil</label>
                            <input type="text" className="form-control" value={formData.nilai} onChange={e => setFormData({ ...formData, nilai: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Kehadiran</label>
                            <select className="form-control" value={formData.kehadiran} onChange={e => setFormData({ ...formData, kehadiran: e.target.value })}>
                                <option value="Hadir">Hadir</option>
                                <option value="Izin">Izin</option>
                                <option value="Sakit">Sakit</option>
                                <option value="Alpha">Alpha</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Pengajar / Ustadz</label>
                        <input type="text" className="form-control" value={formData.ustadz} onChange={e => setFormData({ ...formData, ustadz: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Keterangan</label>
                        <textarea className="form-control" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} rows="2"></textarea>
                    </div>
                </form>
            </Modal>

            {/* Modal View Detail */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Detail Catatan Pendidikan"
                footer={<button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Selesai</button>}
            >
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nama Santri</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{viewData.nama_santri}</div>
                            <span className="th-badge" style={{
                                background: viewData.kehadiran === 'Hadir' ? '#dcfce7' : '#fee2e2',
                                color: viewData.kehadiran === 'Hadir' ? '#166534' : '#991b1b',
                                marginTop: '10px'
                            }}>
                                Status {viewData.kehadiran}
                            </span>
                        </div>
                        <div className="form-grid" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px' }}>
                            <div>
                                <small style={{ color: 'var(--text-muted)' }}>Jenis Kegiatan</small>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{viewData.kegiatan}</div>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)' }}>Tanggal</small>
                                <div style={{ fontWeight: 600 }}>{formatDate(viewData.tanggal)}</div>
                            </div>
                        </div>
                        <div className="form-grid" style={{ marginTop: '1.5rem' }}>
                            <div>
                                <small style={{ color: 'var(--text-muted)' }}>Nilai / Capaian</small>
                                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>{viewData.nilai || '-'}</div>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)' }}>Ustadz / Pengajar</small>
                                <div style={{ fontWeight: 600 }}>{viewData.ustadz || '-'}</div>
                            </div>
                        </div>
                        <div style={{ marginTop: '1.5rem' }}>
                            <small style={{ color: 'var(--text-muted)' }}>Keterangan / Evaluasi</small>
                            <div style={{ padding: '1rem', background: '#f1f5f9', borderRadius: '8px', marginTop: '5px' }}>
                                {viewData.keterangan || 'Tidak ada catatan tambahan.'}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
