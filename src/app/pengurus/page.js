'use client';

import React, { useState, useEffect } from 'react';
import { apiCall } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';

export default function PengurusPage() {
    const { isAdmin } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        nama: '', jabatan: '', divisi: '', no_hp: '', status: 'Aktif',
        tahun_mulai: '', tahun_akhir: '', foto_pengurus: '', tanggal_nonaktif: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const timestamp = Math.round(new Date().getTime() / 1000);
            const paramsToSign = { timestamp };
            const { signature, apiKey, cloudName } = await apiCall('getCloudinarySignature', 'POST', { data: { paramsToSign } });
            const fd = new FormData();
            fd.append('file', file);
            fd.append('api_key', apiKey);
            fd.append('timestamp', timestamp);
            fd.append('signature', signature);
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
            const result = await res.json();
            if (result.secure_url) {
                setFormData(prev => ({ ...prev, foto_pengurus: result.secure_url }));
                alert("Berhasil mengunggah foto!");
            } else { throw new Error(result.error?.message || "Gagal upload Cloudinary"); }
        } catch (err) { alert("Gagal mengunggah foto. Pastikan konfigurasi Cloudinary benar."); }
        finally { setUploading(false); }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'pengurus' });
            setData(res || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openModal = (item = null) => {
        if (item) { setEditId(item.id); setFormData({ ...item }); }
        else {
            setEditId(null);
            setFormData({
                nama: '', jabatan: '', divisi: '', no_hp: '', status: 'Aktif',
                tahun_mulai: '', tahun_akhir: '', foto_pengurus: '', tanggal_nonaktif: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        try {
            await apiCall('saveData', 'POST', { type: 'pengurus', data: editId ? { ...formData, id: editId } : formData });
            setIsModalOpen(false);
            loadData();
            alert(editId ? 'Struktur pengurus diperbarui!' : 'Pengurus baru telah dikukuhkan!');
        } catch (err) { alert(err.message); }
        finally { setSubmitting(false); }
    };

    const deleteItem = async (id) => {
        if (!confirm('Hapus data pengurus ini secara permanen?')) return;
        try { await apiCall('deleteData', 'POST', { type: 'pengurus', id }); loadData(); } catch (err) { alert(err.message); }
    };

    const displayData = data.filter(d =>
        (d.nama || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.jabatan || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.divisi || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="view-container">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 style={{ marginBottom: '5px', fontSize: '1.5rem', fontWeight: 800 }}>Struktur Organisasi & Pengurus</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total {displayData.length} pengurus aktif.</p>
                    </div>
                    <div className="card-actions">
                        <button className="btn btn-secondary" onClick={() => window.print()}>
                            <i className="fas fa-print"></i>
                        </button>
                        <button className="btn btn-primary" onClick={() => openModal()}>
                            <i className="fas fa-plus-circle"></i> Tambah Pengurus
                        </button>
                    </div>
                </div>

                <div className="table-controls">
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input type="text" className="search-input" placeholder="Cari nama, jabatan, atau divisi..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Profil</th><th>Nama Lengkap</th><th>Jabatan</th><th>Divisi</th><th>Masa Bakti</th><th>Status</th><th>Opsi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '4rem' }}>Sinkronisasi Data...</td></tr>
                            ) : displayData.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Belum ada data pengurus.</td></tr>
                            ) : displayData.map(d => (
                                <tr key={d.id}>
                                    <td>
                                        <img src={d.foto_pengurus || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.nama)}&background=1e3a8a&color=fff&bold=true`} style={{ width: '45px', height: '45px', borderRadius: '12px', objectFit: 'cover' }} alt="" />
                                    </td>
                                    <td><div style={{ fontWeight: 800 }}>{d.nama}</div><div style={{ fontSize: '0.75rem' }}>WA: {d.no_hp || '-'}</div></td>
                                    <td><span style={{ fontWeight: 700, color: 'var(--primary)' }}>{d.jabatan || '-'}</span></td>
                                    <td>
                                        <span className="th-badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.7rem' }}>
                                            {d.divisi || '-'}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{d.tahun_mulai} - {d.tahun_akhir || '∞'}</td>
                                    <td>
                                        <span className="th-badge" style={{
                                            background: d.status === 'Aktif' ? '#dcfce7' : '#f1f5f9',
                                            color: d.status === 'Aktif' ? '#166534' : '#64748b',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.7rem',
                                            fontWeight: 700
                                        }}>
                                            {d.status?.toUpperCase() || 'AKTIF'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn-vibrant btn-vibrant-blue" onClick={() => openModal(d)}><i className="fas fa-edit"></i></button>
                                            {isAdmin && <button className="btn-vibrant btn-vibrant-red" onClick={() => deleteItem(d.id)}><i className="fas fa-trash"></i></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? "Pembaruan Jabatan Pengurus" : "Pelantikan Pengurus Baru"}
                footer={(
                    <>
                        <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Kembali</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Menyimpan...' : 'Simpan Data'}
                        </button>
                    </>
                )}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group"><label className="form-label">Nama Lengkap Pengurus</label><input type="text" className="form-control" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} required /></div>
                    <div className="form-grid">
                        <div className="form-group"><label className="form-label">Jabatan Struktural</label><input type="text" className="form-control" value={formData.jabatan} onChange={e => setFormData({ ...formData, jabatan: e.target.value })} /></div>
                        <div className="form-group"><label className="form-label">Divisi / Unit Kerja</label><input type="text" className="form-control" value={formData.divisi} onChange={e => setFormData({ ...formData, divisi: e.target.value })} /></div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group"><label className="form-label">Tahun Mulai</label><input type="text" className="form-control" value={formData.tahun_mulai} onChange={e => setFormData({ ...formData, tahun_mulai: e.target.value })} /></div>
                        <div className="form-group"><label className="form-label">Tahun Akhir</label><input type="text" className="form-control" value={formData.tahun_akhir} onChange={e => setFormData({ ...formData, tahun_akhir: e.target.value })} placeholder="Kosongkan jika aktif" /></div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group"><label className="form-label">No. WA Aktif</label><input type="text" className="form-control" value={formData.no_hp} onChange={e => setFormData({ ...formData, no_hp: e.target.value })} /></div>
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-control" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                <option value="Aktif">Aktif</option>
                                <option value="Demisioner">Demisioner</option>
                                <option value="Non-Aktif">Non-Aktif</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Foto Pengurus</label>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: '#f8fafc', padding: '15px', borderRadius: '14px', border: '2px dashed #e2e8f0' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
                                <img src={formData.foto_pengurus || `https://ui-avatars.com/api/?name=P&background=f1f5f9&color=cbd5e1`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                            </div>
                            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                                {uploading ? 'Proses...' : 'Unggah Foto'}
                                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
                            </label>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}