'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { apiCall } from '@/lib/utils';
import { useToast } from '@/lib/ToastContext';
import { useAuth } from '@/lib/AuthContext';

export default function UsersTab() {
    const { user: currentUser } = useAuth();
    const { showToast } = useToast();
    const [usersList, setUsersList] = useState([]);
    const [rolesList, setRolesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userFormData, setUserFormData] = useState({
        fullname: '',
        username: '',
        role: 'absensi_pengurus',
        password_plain: '',
        email: '',
        no_hp: '',
        is_verified: 1
    });
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, user: null });
    const [searchTerm, setSearchTerm] = useState('');

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [users, roles] = await Promise.all([
                apiCall('getData', 'GET', { type: 'users' }),
                apiCall('getData', 'GET', { type: 'roles' })
            ]);
            setUsersList(users || []);
            setRolesList(roles || []);
        } catch (e) {
            showToast("Gagal memuat data: " + e.message, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    const sortedUsers = [...usersList].sort((a, b) => {
        if (a.role === 'develzy' && b.role !== 'develzy') return -1;
        if (a.role !== 'develzy' && b.role === 'develzy') return 1;
        return 0;
    });

    const filteredUsers = sortedUsers.filter(u =>
        u.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddUser = () => {
        setEditingUser(null);
        setUserFormData({
            fullname: '',
            username: '',
            role: 'absensi_pengurus',
            password_plain: Math.floor(1000 + Math.random() * 9000).toString(),
            email: '',
            no_hp: '',
            is_verified: 1
        });
        setIsUserModalOpen(true);
    };

    const handleEditUser = (user) => {
        if (user.role === 'develzy' && currentUser?.role !== 'develzy') {
            showToast("Otoritas Terbatas: Hanya Develzy yang bisa mengedit akun Develzy.", "error");
            return;
        }
        setEditingUser(user);
        setUserFormData({
            fullname: user.fullname,
            username: user.username,
            role: user.role,
            password_plain: user.password_plain || '',
            email: user.email || '',
            no_hp: user.no_hp || '',
            is_verified: user.is_verified
        });
        setIsUserModalOpen(true);
    };

    const handleSaveUser = async () => {
        if (!userFormData.fullname || !userFormData.username || !userFormData.password_plain) {
            showToast("Nama, Username, dan PIN wajib diisi!", "error");
            return;
        }

        try {
            if (editingUser) {
                await apiCall('saveData', 'POST', { type: 'users', id: editingUser.id, data: userFormData });
                showToast("Data user berhasil diperbarui!", "success");
            } else {
                await apiCall('saveData', 'POST', { type: 'users', data: userFormData });
                showToast("User baru berhasil ditambahkan!", "success");
            }
            setIsUserModalOpen(false);
            loadInitialData();
        } catch (e) {
            showToast("Gagal menyimpan user: " + e.message, "error");
        }
    };

    const handleDeleteUser = (user) => {
        if (user.role === 'develzy' && currentUser?.role !== 'develzy') {
            showToast("Otoritas Terbatas: Akun Develzy bersifat permanen dan hanya bisa dikelola oleh Develzy.", "error");
            return;
        }
        if (user.username === currentUser?.username) {
            showToast("Anda tidak bisa menghapus akun Anda sendiri!", "warning");
            return;
        }
        setConfirmDelete({ isOpen: true, user });
    };

    const executeDeleteUser = async () => {
        try {
            await apiCall('deleteData', 'POST', { type: 'users', id: confirmDelete.user.id });
            showToast(`User "${confirmDelete.user.fullname}" berhasil dihapus.`, "success");
            setConfirmDelete({ isOpen: false, user: null });
            loadInitialData();
        } catch (e) {
            showToast("Gagal menghapus user: " + e.message, "error");
        }
    };

    const getRoleColor = (roleName) => {
        const role = rolesList.find(r => r.role === roleName);
        return role ? role.color : '#64748b';
    };

    return (
        <div className="animate-in">
            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, user: null })}
                onConfirm={executeDeleteUser}
                title="Hapus User?"
                message={`Apakah Anda yakin ingin menghapus user "${confirmDelete.user?.fullname}"? Akses mereka ke sistem akan langsung dicabut.`}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h3 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800 }}>User Intelligence & Registry</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Mengelola seluruh entitas pengakses sistem, termasuk Otoritas Develzy.</p>
                </div>
                <button className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }} onClick={handleAddUser}>
                    <i className="fas fa-user-plus" style={{ marginRight: '8px' }}></i> Daftarkan User Baru
                </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative' }}>
                    <i className="fas fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }}></i>
                    <input
                        type="text"
                        placeholder="Cari berdasarkan nama, username, atau role..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="develzy-input"
                        style={{ paddingLeft: '45px' }}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: '#10b981' }}>
                    <i className="fas fa-circle-notch fa-spin fa-2x"></i>
                    <p style={{ marginTop: '1rem', fontWeight: 700 }}>Scanning Identity Grid...</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {filteredUsers.map((item, idx) => (
                        <div key={idx} className={`develzy-card ${item.role === 'develzy' ? 'pulse-online' : ''}`} style={{
                            border: item.role === 'develzy' ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
                            background: item.role === 'develzy'
                                ? 'linear-gradient(145deg, rgba(16, 185, 129, 0.1), rgba(2, 6, 23, 0.6))'
                                : 'rgba(15, 23, 42, 0.4)',
                            boxShadow: item.role === 'develzy' ? '0 0 25px rgba(16, 185, 129, 0.15)' : 'none',
                            position: 'relative'
                        }}>
                            {item.role === 'develzy' && (
                                <div style={{
                                    position: 'absolute', top: '12px', left: '12px',
                                    width: '8px', height: '8px', borderRadius: '50%',
                                    background: '#10b981', boxShadow: '0 0 10px #10b981'
                                }}></div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <div className="develzy-role-icon" style={{
                                        background: `${getRoleColor(item.role)}15`,
                                        color: getRoleColor(item.role),
                                        width: '50px', height: '50px', borderRadius: '14px'
                                    }}>
                                        <i className={`fas fa-${item.role === 'develzy' ? 'atom' : 'user'}`}></i>
                                    </div>
                                    {item.role === 'develzy' && (
                                        <div style={{ position: 'absolute', top: '-5px', right: '-5px', color: '#10b981', fontSize: '0.8rem' }}>
                                            <i className="fas fa-certificate"></i>
                                        </div>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {item.fullname}
                                        {item.username === currentUser?.username && <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#94a3b8' }}>YOU</span>}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#475569', fontFamily: 'monospace' }}>@{item.username}</div>
                                </div>
                                <div style={{
                                    background: `${getRoleColor(item.role)}15`,
                                    color: getRoleColor(item.role),
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    {item.role}
                                </div>
                            </div>

                            <div className="develzy-glass-card" style={{ fontSize: '0.8rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1.25rem' }}>
                                <div>
                                    <div style={{ color: '#475569', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>Security Key (PIN)</div>
                                    <div style={{ fontWeight: 700, color: '#f1f5f9', letterSpacing: '2px' }}>{item.password_plain || '****'}</div>
                                </div>
                                <div>
                                    <div style={{ color: '#475569', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>Verification</div>
                                    <div style={{ fontWeight: 700, color: item.is_verified ? '#10b981' : '#64748b' }}>
                                        <i className={`fas fa-${item.is_verified ? 'check-circle' : 'hourglass-half'} mr-1`}></i>
                                        {item.is_verified ? 'VERIFIED' : 'PENDING'}
                                    </div>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <div style={{ color: '#475569', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>Contact Identity</div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{item.email || item.no_hp || 'No identifier active'}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="develzy-btn-action develzy-btn-action-primary" style={{ flex: 1 }} onClick={() => handleEditUser(item)}>
                                    <i className="fas fa-edit"></i> Edit
                                </button>
                                <button
                                    className="develzy-btn-action develzy-btn-action-danger"
                                    style={{ flex: 1, opacity: item.username === currentUser?.username ? 0.3 : 1 }}
                                    onClick={() => handleDeleteUser(item)}
                                    disabled={item.username === currentUser?.username}
                                >
                                    <i className="fas fa-trash-alt"></i> Hapus
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredUsers.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                            <i className="fas fa-user-slash fa-3x" style={{ color: '#1e293b', marginBottom: '1rem' }}></i>
                            <h4 style={{ color: '#94a3b8' }}>Tidak ada user yang ditemukan</h4>
                        </div>
                    )}
                </div>
            )}

            <Modal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                title={editingUser ? `Configure Access: ${editingUser.fullname}` : "Daftarkan User Otoritas Baru"}
                theme="dark"
                footer={(
                    <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={() => setIsUserModalOpen(false)}>Batalkan</button>
                        <button className="btn btn-primary" onClick={handleSaveUser}>Deploy Account</button>
                    </div>
                )}
            >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">Nama Lengkap</label>
                        <input
                            type="text"
                            className="develzy-input"
                            value={userFormData.fullname}
                            onChange={(e) => setUserFormData({ ...userFormData, fullname: e.target.value })}
                            placeholder="Contoh: Ahmad Zam-Zami"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input
                            type="text"
                            className="develzy-input"
                            value={userFormData.username}
                            onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                            placeholder="zamzami"
                            readOnly={!!editingUser}
                            style={{ opacity: editingUser ? 0.6 : 1 }}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">PIN Keamanan (6 Digit)</label>
                        <input
                            type="text"
                            className="develzy-input"
                            value={userFormData.password_plain}
                            onChange={(e) => setUserFormData({ ...userFormData, password_plain: e.target.value })}
                            placeholder="123456"
                            maxLength={6}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Role / Otoritas</label>
                        <select
                            className="develzy-input"
                            value={userFormData.role}
                            onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                        >
                            {rolesList
                                .filter(r => r.role !== 'develzy' || currentUser?.role === 'develzy')
                                .map(r => (
                                    <option key={r.id} value={r.role}>{r.label} ({r.role})</option>
                                ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Status Verifikasi</label>
                        <select
                            className="develzy-input"
                            value={userFormData.is_verified}
                            onChange={(e) => setUserFormData({ ...userFormData, is_verified: parseInt(e.target.value) })}
                        >
                            <option value={1}>Verified (Aktif)</option>
                            <option value={0}>Pending (Butuh OTP)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="develzy-input"
                            value={userFormData.email}
                            onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                            placeholder="email@example.com"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">No. WhatsApp</label>
                        <input
                            type="text"
                            className="develzy-input"
                            value={userFormData.no_hp}
                            onChange={(e) => setUserFormData({ ...userFormData, no_hp: e.target.value })}
                            placeholder="08123456789"
                        />
                    </div>
                </div>
            </Modal>

            <style jsx>{`
                .develzy-card {
                    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
                }
                .develzy-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 15px 30px rgba(0,0,0,0.4), 0 0 20px rgba(16, 185, 129, 0.1);
                }
            `}</style>
        </div>
    );
}
