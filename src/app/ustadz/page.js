'use client';

import React, { useState, useEffect } from 'react';
import { apiCall } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import Modal from '@/components/Modal';

export default function UstadzPage() {
    const { isAdmin } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        nama: '', nik_nip: '', kelas: '', alamat: '', no_hp: '', status: 'Aktif',
        foto_ustadz: '', tanggal_nonaktif: ''
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
                setFormData(prev => ({ ...prev, foto_ustadz: result.secure_url }));
                alert("Berhasil mengunggah foto!");
            } else { throw new Error(result.error?.message || "Gagal upload Cloudinary"); }
        } catch (err) { alert("Gagal mengunggah foto. Pastikan konfigurasi Cloudinary benar."); }
        finally { setUploading(false); }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: 'ustadz' });
            setData(res || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openModal = (item = null) => {
        if (item) { setEditId(item.id); setFormData({ ...item }); }
        else {
            setEditId(null);
            setFormData({
                nama: '', nik_nip: '', kelas: '', alamat: '', no_hp: '', status: 'Aktif',
                foto_ustadz: '', tanggal_nonaktif: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        try {
            await apiCall('saveData', 'POST', { type: 'ustadz', data: editId ? { ...formData, id: editId } : formData });
            setIsModalOpen(false);
            loadData();
            alert(editId ? 'Profil Ustadz diperbarui!' : 'Ustadz baru telah ditambahkan!');
        } catch (err) { alert(err.message); }
        finally { setSubmitting(false); }
    };

    const deleteItem = async (id) => {
        if (!confirm('Hapus data ustadz ini secara permanen?')) return;
        try { await apiCall('deleteData', 'POST', { type: 'ustadz', id }); loadData(); } catch (err) { alert(err.message); }
    };

    const displayData = data.filter(d =>
        (d.nama || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.nik_nip || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.kelas || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="view-container">
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '8px' }}>Direktori Asatidzah</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Database pengajar dan sumber daya manusia kependidikan.</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <i className="fas fa-plus"></i> Tambah Ustadz
                </button>
            </div>

            <div className="card">
                <div className="table-controls">
                    <div className="search-wrapper">
                        <i className="fas fa-search"></i>
                        <input type="text" className="search-input" placeholder="Cari nama, NIP, atau tugas mengajar..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Profil</th><th>Nama Lengkap</th><th>NIK / NIP</th><th>Tugas Utama</th><th>WhatsApp</th><th>Status</th><th>Opsi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '4rem' }}>Sinkronisasi Data...</td></tr>
                            ) : displayData.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Belum ada data asatidzah.</td></tr>
                            ) : displayData.map(d => (
                                <tr key={d.id}>
                                    <td>
                                        <img src={d.foto_ustadz || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.nama)}&background=1e3a8a&color=fff&bold=true`} style={{ width: '45px', height: '45px', borderRadius: '12px', objectFit: 'cover' }} alt="" />
                                    </td>
                                    <td><div style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>{d.nama}</div><div style={{ fontSize: '0.75rem' }}>{d.alamat || '-'}</div></td>
                                    <td>{d.nik_nip || '-'}</td>
                                    <td><span style={{ color: 'var(--primary)', fontWeight: 700 }}>{d.kelas || '-'}</span></td>
                                    <td><i className="fab fa-whatsapp" style={{ color: '#25D366' }}></i> {d.no_hp || '-'}</td>
                                    <td><span className="th-badge" style={{ background: d.status === 'Aktif' ? '#dcfce7' : '#fee2e2', color: d.status === 'Aktif' ? '#166534' : '#991b1b' }}>{d.status?.toUpperCase() || 'AKTIF'}</span></td>
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
                title={editId ? "Pembaruan Profil Ustadz" : "Input Data Pengajar Baru"}
                footer={(
                    <>
                        <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Kembali</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Menyimpan...' : 'Simpan Profil'}
                        </button>
                    </>
                )}
            >
                <form onSubmit={handleSubmit} className="animate-in">
                    <div className="form-group"><label className="form-label">Nama Lengkap & Gelar</label><input type="text" className="form-control" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} required /></div>
                    <div className="form-grid">
                        <div className="form-group"><label className="form-label">NIK / NIP</label><input type="text" className="form-control" value={formData.nik_nip} onChange={e => setFormData({ ...formData, nik_nip: e.target.value })} /></div>
                        <div className="form-group"><label className="form-label">Tugas Mengajar</label><input type="text" className="form-control" value={formData.kelas} onChange={e => setFormData({ ...formData, kelas: e.target.value })} /></div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group"><label className="form-label">WA Aktif</label><input type="text" className="form-control" value={formData.no_hp} onChange={e => setFormData({ ...formData, no_hp: e.target.value })} /></div>
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-control" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                <option>Aktif</option><option>Non-Aktif</option><option>Cuti</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Foto Profil</label>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: '#f8fafc', padding: '15px', borderRadius: '14px', border: '2px dashed #e2e8f0' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
                                <img src={formData.foto_ustadz || `https://ui-avatars.com/api/?name=U&background=f1f5f9&color=cbd5e1`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
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