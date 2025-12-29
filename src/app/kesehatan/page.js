'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiCall, formatDate, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { useDataManagement } from '@/hooks/useDataManagement';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';
import Autocomplete from '@/components/Autocomplete';

export default function KesehatanPage() {
    const [santriOptions, setSantriOptions] = useState([]);

    // ✨ Use Universal Data Hook
    const {
        data, setData, loading, setLoading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, formData, setFormData, editId,
        handleSave, handleDelete, openModal, openView,
        isAdmin
    } = useDataManagement('kesehatan', {
        nama_santri: '', kelas: '', mulai_sakit: new Date().toISOString().split('T')[0],
        gejala: '', obat_tindakan: '', status_periksa: 'Rawat Jalan', keterangan: '',
        biaya_obat: '0'
    });

    const isMounted = React.useRef(true);

    React.useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const loadEnrichedData = useCallback(async () => {
        if (isMounted.current) setLoading(true);
        try {
            const [res, resSantri] = await Promise.all([
                apiCall('getData', 'GET', { type: 'kesehatan' }),
                apiCall('getData', 'GET', { type: 'santri' })
            ]);
            if (isMounted.current) {
                setData(res || []);
                setSantriOptions(resSantri || []);
            }
        } catch (e) { console.error(e); }
        finally { if (isMounted.current) setLoading(false); }
    }, [setData, setLoading]);

    useEffect(() => {
        loadEnrichedData();
    }, [loadEnrichedData]);

    const displayData = data.filter(d =>
        (d.nama_santri || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.kelas || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.gejala || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { key: 'nama_santri', label: 'Nama Santri', render: (row) => <span style={{ fontWeight: 800 }}>{row.nama_santri}</span> },
        { key: 'kelas', label: 'Kelas', render: (row) => <span className="th-badge">{row.kelas || '-'}</span> },
        { key: 'gejala', label: 'Gejala' },
        {
            key: 'status_periksa',
            label: 'Status',
            render: (row) => (
                <span className="th-badge" style={{
                    background: row.status_periksa === 'Rawat Inap' ? '#fee2e2' : row.status_periksa === 'Sembuh' ? '#dcfce7' : '#f1f5f9',
                    color: row.status_periksa === 'Rawat Inap' ? '#dc2626' : row.status_periksa === 'Sembuh' ? '#166534' : '#475569',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.7rem',
                    fontWeight: 700
                }}>
                    {row.status_periksa}
                </span>
            )
        },
        { key: 'mulai_sakit', label: 'Tgl Mulai', render: (row) => formatDate(row.mulai_sakit) },
        {
            key: 'actions',
            label: 'Aksi',
            sortable: false,
            width: '150px',
            render: (row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openView(row)} title="Detail"><i className="fas fa-eye"></i></button>
                    <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)} title="Edit"><i className="fas fa-edit"></i></button>
                    {isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => handleDelete(row.id, 'Hapus data rekam medis ini?')} title="Hapus"><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Kesehatan Santri (BK)</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mencatat {displayData.length} data rekam medis.</p>
                    </div>
                    <div className="card-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                            <i className="fas fa-plus"></i> Rekam Medis Baru
                        </button>
                    </div>
                </div>

                <div className="table-controls">
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input type="text" className="search-input" placeholder="Cari nama santri, kelas atau gejala..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>

                <SortableTable columns={columns} data={displayData} loading={loading} emptyMessage="Belum ada data kesehatan." />
            </div>

            {/* Modal Input/Edit */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? "Update Rekam Medis" : "Input Rekam Medis"}
                footer={(
                    <>
                        <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Batal</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
                            {submitting ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </>
                )}
            >
                <form onSubmit={handleSave}>
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
                        <div className="form-group"><label className="form-label">Mulai Sakit</label><input type="date" className="form-control" value={formData.mulai_sakit} onChange={e => setFormData({ ...formData, mulai_sakit: e.target.value })} /></div>
                        <div className="form-group">
                            <label className="form-label">Status Periksa</label>
                            <select className="form-control" value={formData.status_periksa} onChange={e => setFormData({ ...formData, status_periksa: e.target.value })}>
                                <option value="Rawat Jalan">Rawat Jalan</option><option value="Rawat Inap">Rawat Inap</option><option value="Sembuh">Sudah Sembuh</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group"><label className="form-label">Gejala & Keluhan</label><textarea className="form-control" value={formData.gejala} onChange={e => setFormData({ ...formData, gejala: e.target.value })} rows="2"></textarea></div>
                    <div className="form-group"><label className="form-label">Obat & Tindakan</label><input type="text" className="form-control" value={formData.obat_tindakan} onChange={e => setFormData({ ...formData, obat_tindakan: e.target.value })} placeholder="Diberikan obat apa?" /></div>
                    <div className="form-grid">
                        <div className="form-group"><label className="form-label">Biaya Obat (Rp)</label><input type="number" className="form-control" value={formData.biaya_obat} onChange={e => setFormData({ ...formData, biaya_obat: e.target.value })} /></div>
                        <div className="form-group"><label className="form-label">Keterangan</label><input type="text" className="form-control" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} placeholder="Catatan tambahan" /></div>
                    </div>
                </form>
            </Modal>

            {/* Modal View Detail */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Kesehatan" width="600px" footer={<button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Selesai</button>}>
                {viewData && (() => {
                    const student = santriOptions.find(s => s.nama_siswa === viewData.nama_santri);
                    return (
                        <div className="detail-view">
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '4px solid var(--primary-light)' }}>
                                        {student?.foto_santri ? <img src={student.foto_santri} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <div style={{ background: '#f1f5f9', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-user fa-3x" style={{ color: '#cbd5e1' }}></i></div>}
                                    </div>
                                </div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary-dark)' }}>{viewData.nama_santri}</h2>
                                <p style={{ color: 'var(--text-muted)' }}>{viewData.kelas} • <span className="th-badge">{viewData.status_periksa}</span></p>
                            </div>
                            <div className="form-grid" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px' }}>
                                <div><small>Mulai Sakit</small><div style={{ fontWeight: 600 }}>{formatDate(viewData.mulai_sakit)}</div></div>
                                <div><small>Biaya Obat</small><div style={{ fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(viewData.biaya_obat)}</div></div>
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <small>Gejala & Keluhan</small>
                                <div style={{ padding: '1rem', background: '#fffbeb', borderRadius: '8px', borderLeft: '4px solid #f59e0b', marginTop: '5px' }}>{viewData.gejala}</div>
                            </div>
                        </div>
                    );
                })()}
            </Modal>
        </div>
    );
}
