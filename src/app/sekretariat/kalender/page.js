'use client';

import React, { useState, useEffect } from 'react';
import { apiCall } from '@/lib/utils';
import { useAuth, usePagePermission } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';
import ArsipFileUpload from '@/components/ArsipFileUpload';

export default function KalenderKerjaPage() {
    const { isAdmin, config } = useAuth();
    const { canEdit, canDelete } = usePagePermission();
    const { showToast } = useToast();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [mounted, setMounted] = useState(false);
    const isMounted = React.useRef(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState(null);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        hari: '',
        tanggal_masehi: '',
        tanggal_hijriyah: '',
        nama_kegiatan: '',
        kategori: 'Kegiatan Pondok',
        periode: '2025/2026',
        file_kalender: '',
        keterangan: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setMounted(true);
        isMounted.current = true;
        loadData();
        return () => { isMounted.current = false; };
    }, []);

    const loadData = async () => {
        if (isMounted.current) setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'kalender_kerja' });
            if (isMounted.current) setData(res || []);
        }
        catch (e) { console.error(e); }
        finally { if (isMounted.current) setLoading(false); }
    };

    const openModal = (item = null) => {
        if (item) {
            setEditId(item.id);
            setFormData({ ...item });
        } else {
            setEditId(null);
            setFormData({
                hari: '',
                tanggal_masehi: '',
                tanggal_hijriyah: '',
                nama_kegiatan: '',
                kategori: 'Kegiatan Pondok',
                periode: '2025/2026',
                file_kalender: '',
                keterangan: ''
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
        if (!formData.nama_kegiatan || !formData.tanggal_masehi) {
            showToast("Nama kegiatan dan Tanggal Masehi wajib diisi", "error");
            return;
        }
        setSubmitting(true);
        try {
            await apiCall('saveData', 'POST', { type: 'kalender_kerja', data: editId ? { ...formData, id: editId } : formData });
            setIsModalOpen(false);
            loadData();
            showToast('Agenda Kalender Kerja berhasil disimpan!', "success");
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setSubmitting(false);
        }
    };

    const deleteItem = async (id) => {
        if (!confirm('Hapus agenda kalender ini?')) return;
        try {
            await apiCall('deleteData', 'POST', { type: 'kalender_kerja', id });
            loadData();
            showToast("Agenda dihapus dari kalender.", "info");
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    const displayData = data.filter(d =>
        (d.nama_kegiatan || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.periode || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.hari || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.tanggal_masehi || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.tanggal_hijriyah || '').toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { key: 'hari', label: 'Hari', width: '100px' },
        {
            key: 'tanggal',
            label: 'Tanggal',
            render: (row) => (
                <div style={{ fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{row.tanggal_masehi}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{row.tanggal_hijriyah}</div>
                </div>
            )
        },
        { key: 'nama_kegiatan', label: 'Aktivitas / Kegiatan', render: (row) => <strong style={{ fontSize: '1rem' }}>{row.nama_kegiatan}</strong> },
        {
            key: 'kategori',
            label: 'Kategori',
            width: '130px',
            render: (row) => (
                <span className="th-badge" style={{
                    background: row.kategori === 'Liburan' ? '#fee2e2' : row.kategori === 'Ujian' ? '#fef3c7' : '#dcfce7',
                    color: row.kategori === 'Liburan' ? '#991b1b' : row.kategori === 'Ujian' ? '#92400e' : '#166534'
                }}>
                    {row.kategori}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Aksi',
            width: '160px',
            sortable: false,
            render: (row) => (
                <div className="table-actions">
                    <button className="btn-vibrant btn-vibrant-purple" onClick={() => openViewModal(row)} title="Detail & Dokumen"><i className="fas fa-eye"></i></button>
                    {canEdit && <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(row)} title="Edit"><i className="fas fa-edit"></i></button>}
                    {canDelete && <button className="btn-vibrant btn-vibrant-red" onClick={() => deleteItem(row.id)} title="Hapus"><i className="fas fa-trash"></i></button>}
                </div>
            )
        }
    ];

    return (
        <div className="view-container animate-in">
            {/* Professional Print Header */}
            <div className="print-header-corporate">
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '1.5rem' }}>
                    <img
                        src={config?.logo_url || "https://res.cloudinary.com/dceamfy3n/image/upload/v1766596001/logo_zdenyr.png"}
                        style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                        alt="Logo"
                        onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=LIRBOYO&background=2563eb&color=fff&size=128&bold=true"; }}
                    />
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#1e3a8a', fontWeight: 900 }}>PONDOK PESANTREN DARUSSALAM LIRBOYO</h1>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Sistem Informasi Manajemen Terpadu (SIM-PPDS)</p>
                    </div>
                </div>
                <div style={{ textAlign: 'center', borderTop: '2px solid #334155', paddingTop: '1rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase' }}>KALENDER KERJA & AGENDA KEGIATAN</h2>
                    <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Periode: {data[0]?.periode || '2025/2026'}</p>
                </div>
            </div>

            <div className="card no-print">
                <div className="card-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Kalender Kerja & Agenda</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manajemen agenda kegiatan sesuai format kalender resmi.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-outline" onClick={() => window.print()}><i className="fas fa-print"></i> Cetak</button>
                        {canEdit && <button className="btn btn-primary" onClick={() => openModal()}><i className="fas fa-plus"></i> Tambah Agenda</button>}
                    </div>
                </div>

                <div className="table-controls">
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input type="text" className="search-input" placeholder="Cari kegiatan, hari, atau tanggal..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Total: {displayData.length} Agenda</span>
                    </div>
                </div>

                <SortableTable columns={columns} data={displayData} loading={loading} emptyMessage="Belum ada agenda kalender." />
            </div>

            {/* Custom Print Table (Matches Image) */}
            <div className="only-print">
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000', marginTop: '1rem' }}>
                    <thead>
                        <tr>
                            <th rowSpan="2" style={{ border: '1px solid #000', padding: '8px', width: '40px' }}>NO</th>
                            <th rowSpan="2" style={{ border: '1px solid #000', padding: '8px', width: '120px' }}>HARI</th>
                            <th colSpan="2" style={{ border: '1px solid #000', padding: '8px' }}>TANGGAL</th>
                            <th rowSpan="2" style={{ border: '1px solid #000', padding: '8px' }}>AKTIVITAS</th>
                        </tr>
                        <tr>
                            <th style={{ border: '1px solid #000', padding: '8px', width: '150px' }}>MASEHI</th>
                            <th style={{ border: '1px solid #000', padding: '8px', width: '150px' }}>HIJRIYAH</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayData.map((item, index) => (
                            <tr key={item.id}>
                                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{index + 1}.</td>
                                <td style={{ border: '1px solid #000', padding: '8px' }}>{item.hari}</td>
                                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{item.tanggal_masehi}</td>
                                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{item.tanggal_hijriyah}</td>
                                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 700 }}>{item.nama_kegiatan}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', paddingRight: '2rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <p>Kediri, {mounted && new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p style={{ fontWeight: 800, marginTop: '5px' }}>Sekretaris Pondok,</p>
                        <div style={{ height: '80px' }}></div>
                        <p style={{ borderBottom: '1.5px solid #000', fontWeight: 800, display: 'inline-block', minWidth: '150px' }}>H. M. ABDULLAH FAHIM</p>
                    </div>
                </div>
            </div>

            {/* Input/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Edit Agenda Kalender" : "Tambah Agenda Baru"} footer={(<>
                <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Batal</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Agenda'}</button>
            </>)}>
                <form className="form-grid">
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">Aktivitas / Nama Kegiatan *</label>
                        <input type="text" className="form-control" value={formData.nama_kegiatan} onChange={e => setFormData({ ...formData, nama_kegiatan: e.target.value })} placeholder="Contoh: Pembukaan Pendaftaran Santri" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Hari (Opsional)</label>
                        <input type="text" className="form-control" value={formData.hari} onChange={e => setFormData({ ...formData, hari: e.target.value })} placeholder="Contoh: Malam Sabtu / Rabu" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Periode</label>
                        <input type="text" className="form-control" value={formData.periode} onChange={e => setFormData({ ...formData, periode: e.target.value })} placeholder="2025/2026" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tanggal Masehi *</label>
                        <input type="text" className="form-control" value={formData.tanggal_masehi} onChange={e => setFormData({ ...formData, tanggal_masehi: e.target.value })} placeholder="16 April 2025" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tanggal Hijriyah</label>
                        <input type="text" className="form-control" value={formData.tanggal_hijriyah} onChange={e => setFormData({ ...formData, tanggal_hijriyah: e.target.value })} placeholder="17 Syawal 1446" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Kategori</label>
                        <select className="form-control" value={formData.kategori} onChange={e => setFormData({ ...formData, kategori: e.target.value })}>
                            <option value="Kegiatan Pondok">Kegiatan Pondok</option>
                            <option value="Liburan">Liburan</option>
                            <option value="Ujian">Ujian</option>
                            <option value="Rapat">Rapat</option>
                            <option value="Hari Besar">Hari Besar</option>
                            <option value="Lainnya">Lainnya</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Dokumen Kalender (Opsional)</label>
                        <ArsipFileUpload onUploadComplete={(url) => setFormData({ ...formData, file_kalender: url })} currentFile={formData.file_kalender} label="File Kalender (PDF/Image)" />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">Keterangan / Catatan</label>
                        <textarea className="form-control" rows="3" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} placeholder="Catatan tambahan agenda..."></textarea>
                    </div>
                </form>
            </Modal>

            {/* View Detail Modal */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Agenda & Dokumen" width="850px" footer={<button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Tutup</button>}>
                {viewData && (
                    <div className="detail-view">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Agenda Kegiatan</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary-dark)' }}>{viewData.nama_kegiatan}</div>
                            <div style={{ marginTop: '10px' }}>
                                <span className="th-badge" style={{ background: '#dcfce7', color: '#166534', padding: '6px 20px', fontWeight: 800 }}>
                                    PERIODE {viewData.periode}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                            <div>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Hari</small>
                                <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{viewData.hari || '-'}</div>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tanggal Masehi</small>
                                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)' }}>{viewData.tanggal_masehi}</div>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tanggal Hijriyah</small>
                                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--success)' }}>{viewData.tanggal_hijriyah || '-'}</div>
                            </div>
                        </div>

                        {viewData.keterangan && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Keterangan Agenda</small>
                                <div style={{ padding: '1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem', color: '#475569', lineHeight: 1.5 }}>
                                    {viewData.keterangan}
                                </div>
                            </div>
                        )}

                        {viewData.file_kalender && (
                            <div style={{ marginTop: '2.5rem', borderTop: '2.5px solid #f1f5f9', paddingTop: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '45px', height: '45px', background: '#e0f2fe', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <i className="fas fa-file-invoice" style={{ fontSize: '1.5rem', color: '#0ea5e9' }}></i>
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Arsip Dokumen Kalender</h3>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dokumen resmi agenda periode {viewData.periode}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <a href={viewData.file_kalender} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                                            <i className="fas fa-external-link-alt"></i> Buka Full
                                        </a>
                                        <a href={viewData.file_kalender.replace('/upload/', '/upload/fl_attachment/')} className="btn btn-primary btn-sm">
                                            <i className="fas fa-download"></i> Download PDF
                                        </a>
                                    </div>
                                </div>

                                <div style={{ background: '#334155', borderRadius: '20px', padding: '15px', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' }}>
                                    {viewData.file_kalender.toLowerCase().endsWith('.pdf') ? (
                                        <iframe
                                            src={viewData.file_kalender}
                                            style={{ width: '100%', height: '600px', border: 'none', borderRadius: '15px' }}
                                            title="Kalender Document Preview"
                                        />
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '10px' }}>
                                            <img
                                                src={viewData.file_kalender}
                                                alt="Kalender Preview"
                                                style={{ maxWidth: '100%', borderRadius: '10px', cursor: 'zoom-in' }}
                                                onClick={() => window.open(viewData.file_kalender, '_blank')}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

