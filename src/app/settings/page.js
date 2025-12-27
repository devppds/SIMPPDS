'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiCall } from '@/lib/utils';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';

export default function SettingsPage() {
    const { user, isAdmin, logout } = useAuth();
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Password change state
    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [updatingPass, setUpdatingPass] = useState(false);

    // Create User state
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [userFormData, setUserFormData] = useState({
        username: '', fullname: '', password: '', role: 'sekretariat'
    });
    const [submittingUser, setSubmittingUser] = useState(false);

    useEffect(() => {
        if (isAdmin) {
            loadUsers();
        }
    }, [isAdmin]);

    const loadUsers = async () => {
        setLoadingUsers(true);
        try {
            const data = await apiCall('getData', 'GET', { type: 'users' });
            setUsers(data || []);
        } catch (e) {
            console.error("Load users failed", e);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPass !== confirmPass) return alert("Konfirmasi password tidak cocok");
        if (newPass.length < 6) return alert("Password baru minimal 6 karakter");

        setUpdatingPass(true);
        try {
            await apiCall('changePassword', 'POST', {
                data: {
                    username: user.username,
                    oldPassword: oldPass,
                    newPassword: newPass
                }
            });
            alert("Password berhasil diubah! Silakan login ulang.");
            logout();
        } catch (err) {
            alert(err.message);
        } finally {
            setUpdatingPass(false);
        }
    };

    const handleCreateUser = async (e) => {
        if (e) e.preventDefault();
        setSubmittingUser(true);
        try {
            await apiCall('saveData', 'POST', {
                type: 'users',
                data: userFormData
            });
            setIsUserModalOpen(false);
            setUserFormData({ username: '', fullname: '', password: '', role: 'sekretariat' });
            loadUsers();
            alert("Akun pengguna berhasil dibuat!");
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmittingUser(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!confirm("Hapus akun seksi ini?")) return;
        try {
            await apiCall('deleteData', 'POST', { type: 'users', id });
            loadUsers();
        } catch (e) {
            alert("Gagal menghapus user");
        }
    };

    return (
        <div className="view-container">
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '8px' }}>Pusat Pengaturan</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Kelola profil keamanan Anda dan manajemen hak akses tim operasional.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1.2fr 1.8fr' : '1fr', gap: '3rem' }}>

                    {/* Security Card */}
                    <div className="card" style={{ height: 'fit-content' }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '10px' }}>
                                <i className="fas fa-shield-halved" style={{ marginRight: '10px' }}></i> Keamanan Akun
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Perbarui kata sandi Anda secara berkala untuk menjaga keamanan data.</p>
                        </div>

                        <form onSubmit={handleChangePassword}>
                            <div className="form-group">
                                <label className="form-label">Password Saat Ini</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={oldPass}
                                    onChange={(e) => setOldPass(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Password Baru</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={newPass}
                                    onChange={(e) => setNewPass(e.target.value)}
                                    placeholder="Min. 6 karakter"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Ulangi Password Baru</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={confirmPass}
                                    onChange={(e) => setConfirmPass(e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={updatingPass}
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: '1rem', padding: '14px' }}
                            >
                                {updatingPass ? 'Memvalidasi...' : 'Update Password Akun'}
                            </button>
                        </form>
                    </div>

                    {/* Admin Management */}
                    {isAdmin && (
                        <div className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '10px' }}>
                                        <i className="fas fa-user-gear" style={{ marginRight: '10px' }}></i> Manajemen Pengguna
                                    </h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Hak akses untuk seksi sekretariat dan bendahara.</p>
                                </div>
                                <button className="btn btn-secondary" onClick={() => setIsUserModalOpen(true)}>
                                    <i className="fas fa-user-plus"></i> Tambah Akun
                                </button>
                            </div>



                            <SortableTable
                                columns={[
                                    {
                                        key: 'fullname',
                                        label: 'Pengguna',
                                        render: (row) => (
                                            <div>
                                                <div style={{ fontWeight: 800 }}>{row.fullname}</div>
                                                <code style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>@{row.username}</code>
                                            </div>
                                        )
                                    },
                                    {
                                        key: 'role',
                                        label: 'Role System',
                                        render: (row) => (
                                            <span className="th-badge" style={{ background: row.role === 'admin' ? 'var(--primary)' : 'var(--primary-light)', color: row.role === 'admin' ? 'white' : 'var(--primary)' }}>
                                                {row.role?.toUpperCase()}
                                            </span>
                                        )
                                    },
                                    {
                                        key: 'password_plain',
                                        label: 'Password (Plain)',
                                        render: (row) => <div style={{ fontFamily: 'monospace', letterSpacing: '1px', fontWeight: 600 }}>{row.password_plain || '********'}</div>
                                    },
                                    {
                                        key: 'actions',
                                        label: '',
                                        sortable: false,
                                        width: '50px',
                                        render: (row) => (
                                            row.username !== 'admin' && (
                                                <button onClick={() => handleDeleteUser(row.id)} className="btn-vibrant btn-vibrant-red" style={{ width: '32px', height: '32px' }} title="Hapus User">
                                                    <i className="fas fa-trash" style={{ fontSize: '0.8rem' }}></i>
                                                </button>
                                            )
                                        )
                                    }
                                ]}
                                data={users}
                                loading={loadingUsers}
                                emptyMessage="Belum ada akun lain."
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Create User Modal */}
            <Modal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                title="Daftarkan Pengelola Baru"
                footer={(
                    <>
                        <button className="btn btn-secondary" onClick={() => setIsUserModalOpen(false)}>Batal</button>
                        <button className="btn btn-primary" onClick={handleCreateUser} disabled={submittingUser}>
                            {submittingUser ? 'Memproses...' : 'Buat Akun Sekarang'}
                        </button>
                    </>
                )}
            >
                <form onSubmit={handleCreateUser} className="animate-in">
                    <div className="form-group">
                        <label className="form-label">Nama Lengkap (Ditampilkan)</label>
                        <input
                            type="text"
                            className="form-control"
                            value={userFormData.fullname}
                            onChange={e => setUserFormData({ ...userFormData, fullname: e.target.value })}
                            required
                            placeholder="Contoh: Ahmad Subardjo"
                        />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Username (ID Login)</label>
                            <input
                                type="text"
                                className="form-control"
                                value={userFormData.username}
                                onChange={e => setUserFormData({ ...userFormData, username: e.target.value })}
                                required
                                placeholder="ahmad123"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Hak Akses (Role)</label>
                            <select
                                className="form-control"
                                value={userFormData.role}
                                onChange={e => setUserFormData({ ...userFormData, role: e.target.value })}
                            >
                                <option value="sekretariat">Sekretariat</option>
                                <option value="bendahara">Bendahara</option>
                                <option value="admin">Administrator Full</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password Awal</label>
                        <input
                            type="text"
                            className="form-control"
                            value={userFormData.password}
                            onChange={e => setUserFormData({ ...userFormData, password: e.target.value })}
                            required
                            placeholder="Buatkan password awal untuk pengguna ini"
                        />
                    </div>
                </form>
            </Modal>
        </div >
    );
}
