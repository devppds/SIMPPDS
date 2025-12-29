'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiCall } from '@/lib/utils';
import { useToast } from '@/lib/ToastContext';
import Modal from '@/components/Modal';
import SortableTable from '@/components/SortableTable';

export default function AksesPage() {
    const { isAdmin } = useAuth();
    const { showToast } = useToast();
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isRoleConfigOpen, setIsRoleConfigOpen] = useState(false);

    // Create User state
    const [userFormData, setUserFormData] = useState({
        username: '', fullname: '', password: '', role: 'sekretariat', email: ''
    });
    const [submittingUser, setSubmittingUser] = useState(false);

    // Security Reveal States
    const [revealedPasswords, setRevealedPasswords] = useState({});
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [verifyPin, setVerifyPin] = useState('');
    const [targetUser, setTargetUser] = useState(null);

    const { user: currentUser } = useAuth();

    useEffect(() => {
        loadUsers();
        loadRoles();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await apiCall('getData', 'GET', { type: 'users' });
            setUsers(data || []);
        } catch (e) {
            console.error("Load users failed", e);
            showToast("Gagal memuat data pengguna", "error");
        } finally {
            setLoading(false);
        }
    };

    const loadRoles = async () => {
        try {
            const data = await apiCall('getData', 'GET', { type: 'roles' });
            if (data) {
                setRoles(data.map(r => ({
                    ...r,
                    menus: r.menus ? JSON.parse(r.menus) : []
                })));
            }
        } catch (e) {
            console.error("Load roles failed", e);
        }
    };

    const handleRequestReveal = (user) => {
        setTargetUser(user);
        setVerifyPin('');
        setIsVerifyModalOpen(true);
    };

    const handleVerify = () => {
        // Find current user's PIN from users list
        const adminAccount = users.find(u => u.username === currentUser.username);
        if (adminAccount && adminAccount.password_plain === verifyPin) {
            setRevealedPasswords(prev => ({ ...prev, [targetUser.id]: true }));
            setIsVerifyModalOpen(false);
            showToast("Verifikasi berhasil!", "success");
        } else {
            showToast("PIN yang Anda masukkan salah!", "error");
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
            setUserFormData({ username: '', fullname: '', password: '', role: 'sekretariat', email: '' });
            loadUsers();
            showToast("Akun pengguna berhasil dibuat!", "success");
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setSubmittingUser(false);
        }
    };

    const getRoleLabel = (roleId) => {
        if (roleId === 'admin') return 'Super Administrator';
        if (roleId === 'develzy') return 'DEVELZY Control';
        const role = roles.find(r => r.role === roleId);
        return role ? role.label : (roleId?.toUpperCase() || 'User');
    };

    return (
        <div className="view-container">
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 className="outfit" style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b', marginBottom: '8px' }}>Manajemen Akses</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>Kontrol keamanan dan hak akses pengguna sistem SIM-MIU.</p>
                </div>
                <button
                    className="btn btn-primary"
                    style={{
                        padding: '14px 28px',
                        borderRadius: '16px',
                        fontSize: '0.95rem',
                        background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                        boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)'
                    }}
                    onClick={() => setIsUserModalOpen(true)}
                >
                    <i className="fas fa-shield-alt" style={{ marginRight: '8px' }}></i> Tambah Administrator
                </button>
            </div>

            {/* Grid Stats & Action */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: '2rem', marginBottom: '3rem' }}>
                {/* Security Overview Card */}
                <div style={{
                    background: '#1e293b',
                    borderRadius: '24px',
                    padding: '2.5rem',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    minHeight: '220px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
                        <div style={{
                            width: '56px', height: '56px', background: 'rgba(255,255,255,0.1)',
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <i className="fas fa-user-shield" style={{ fontSize: '1.4rem' }}></i>
                        </div>
                        <div>
                            <h3 className="outfit" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '0.5px' }}>Security Overview</h3>
                            <p style={{ opacity: 0.7, margin: '4px 0 0 0', fontSize: '0.85rem' }}>Status keamanan sistem saat ini</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '5rem' }}>
                        <div>
                            <div style={{ fontSize: '2.8rem', fontWeight: 900, fontFamily: 'Outfit, sans-serif' }}>{loading ? '...' : users.length}</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.8, letterSpacing: '1.5px' }}>Admin Aktif</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '2.8rem', fontWeight: 900, fontFamily: 'Outfit, sans-serif' }}>SAFE</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.8, letterSpacing: '1.5px' }}>System Status</div>
                        </div>
                    </div>
                </div>

                {/* Role Config Card */}
                <div style={{
                    background: 'white',
                    borderRadius: '24px',
                    padding: '2.5rem',
                    border: '2px dashed #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    transition: 'all 0.3s'
                }}>
                    <p style={{ color: '#64748b', marginBottom: '1.5rem', fontWeight: 600, fontSize: '1rem' }}>Ingin menambah peran kustom?</p>
                    <button className="btn btn-outline" style={{ borderRadius: '14px', padding: '12px 28px', border: '1.5px solid #e2e8f0', fontWeight: 700 }} onClick={() => setIsRoleConfigOpen(true)}>
                        <i className="fas fa-cog" style={{ marginRight: '8px' }}></i> Konfigurasi Role
                    </button>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="card" style={{ padding: '0', overflow: 'hidden', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid #f8fafc' }}>
                    <h3 className="outfit" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b' }}>Daftar Pengguna Sistem</h3>
                </div>

                <div style={{ padding: '1rem' }}>
                    <SortableTable
                        columns={[
                            {
                                key: 'fullname',
                                label: 'Profil Pengguna',
                                render: (row) => (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '5px 0' }}>
                                        <div style={{
                                            width: '42px', height: '42px', borderRadius: '50%',
                                            background: `linear-gradient(135deg, ${row.role === 'admin' ? '#0ea5e9' : '#8b5cf6'} 0%, ${row.role === 'admin' ? '#2563eb' : '#6d28d9'} 100%)`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontWeight: 800, fontSize: '0.9rem',
                                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                        }}>
                                            {row.fullname?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>{row.fullname}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{row.email || `${row.username}@miu.ac.id`}</div>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                key: 'role',
                                label: 'Role',
                                render: (row) => (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', fontWeight: 700, fontSize: '0.85rem' }}>
                                        <i className="fas fa-book-reader" style={{ fontSize: '0.8rem', opacity: 0.8 }}></i>
                                        {getRoleLabel(row.role)}
                                    </div>
                                )
                            },
                            {
                                key: 'password_plain',
                                label: 'PIN Login',
                                render: (row) => {
                                    const isRevealed = revealedPasswords[row.id];
                                    return (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{
                                                fontFamily: isRevealed ? 'monospace' : 'inherit',
                                                fontWeight: isRevealed ? 800 : 400,
                                                letterSpacing: isRevealed ? '2px' : '0',
                                                fontSize: isRevealed ? '1.1rem' : '1rem',
                                                color: isRevealed ? '#1e293b' : '#94a3b8'
                                            }}>
                                                {isRevealed ? row.password_plain : '••••••'}
                                            </span>
                                            <button
                                                onClick={() => isRevealed ? setRevealedPasswords(prev => ({ ...prev, [row.id]: false })) : handleRequestReveal(row)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: isRevealed ? '#ef4444' : '#3b82f6',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem'
                                                }}
                                                title={isRevealed ? "Sembunyikan" : "Tampilkan PIN"}
                                            >
                                                <i className={`fas fa-eye${isRevealed ? '-slash' : ''}`}></i>
                                            </button>
                                        </div>
                                    );
                                }
                            },
                            {
                                key: 'status',
                                label: 'Status Akun',
                                render: (row) => {
                                    const isActive = row.is_active !== 0;
                                    return (
                                        <span className="th-badge" style={{
                                            background: isActive ? '#f0fdf4' : '#f1f5f9',
                                            color: isActive ? '#22c55e' : '#94a3b8',
                                            padding: '6px 14px',
                                            borderRadius: '8px',
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            letterSpacing: '0.5px'
                                        }}>
                                            {isActive ? 'AKTIF' : 'NON-AKTIF'}
                                        </span>
                                    );
                                }
                            },
                            {
                                key: 'actions',
                                label: 'Opsi',
                                sortable: false,
                                align: 'center',
                                width: '80px',
                                render: (row) => (
                                    <button className="btn-secondary" style={{
                                        width: '36px', height: '36px', borderRadius: '10px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: '#f8fafc', border: '1px solid #f1f5f9'
                                    }}>
                                        <i className="fas fa-ellipsis-h" style={{ color: '#94a3b8', fontSize: '0.9rem' }}></i>
                                    </button>
                                )
                            }
                        ]}
                        data={users}
                        loading={loading}
                        emptyMessage="Belum ada administrator yang terdaftar."
                    />
                </div>
            </div>

            {/* Create User Modal */}
            <Modal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                title="Tambah Administrator Baru"
                footer={(
                    <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={() => setIsUserModalOpen(false)}>Batal</button>
                        <button className="btn btn-primary" onClick={handleCreateUser} disabled={submittingUser}>
                            {submittingUser ? 'Memproses...' : 'Simpan Data'}
                        </button>
                    </div>
                )}
            >
                <form onSubmit={handleCreateUser} className="animate-in" style={{ padding: '10px' }}>
                    <div className="form-group">
                        <label className="form-label">Nama Lengkap</label>
                        <input
                            type="text"
                            className="form-control"
                            value={userFormData.fullname}
                            onChange={e => setUserFormData({ ...userFormData, fullname: e.target.value })}
                            required
                            placeholder="Contoh: Ust. Abdullah Faqih"
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
                                placeholder="abdullah_f"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-control"
                                value={userFormData.email}
                                onChange={e => setUserFormData({ ...userFormData, email: e.target.value })}
                                placeholder="abdullah@miu.ac.id"
                            />
                        </div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Hak Akses (Role)</label>
                            <select
                                className="form-control"
                                value={userFormData.role}
                                onChange={e => setUserFormData({ ...userFormData, role: e.target.value })}
                            >
                                <option value="">-- Pilih Role --</option>
                                {roles.filter(r => r.is_public == 1).map((r, i) => (
                                    <option key={i} value={r.role}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password Sementara</label>
                            <input
                                type="password"
                                className="form-control"
                                value={userFormData.password}
                                onChange={e => setUserFormData({ ...userFormData, password: e.target.value })}
                                required
                                placeholder="********"
                            />
                        </div>
                    </div>
                </form>
            </Modal>
            {/* Role Configuration Modal */}
            <Modal
                isOpen={isRoleConfigOpen}
                onClose={() => setIsRoleConfigOpen(false)}
                title="Konfigurasi Role & Permissions"
            >
                <div style={{ padding: '10px' }}>
                    <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.95rem' }}>
                        Berikut adalah daftar role yang tersedia di sistem. Setiap role memiliki akses ke menu tertentu.
                    </p>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {roles.map((item, idx) => (
                            <div key={idx} style={{
                                padding: '1.5rem',
                                border: '2px solid #f1f5f9',
                                borderRadius: '16px',
                                background: 'white',
                                transition: 'all 0.2s'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: `${item.color}15`,
                                        color: item.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 800
                                    }}>
                                        <i className="fas fa-user-tag"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{item.label}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>{item.role}</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>Akses Menu:</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {item.menus.map((menu, i) => {
                                        const menuName = typeof menu === 'string' ? menu : menu.name;
                                        return (
                                            <span key={i} style={{
                                                background: `${item.color}10`,
                                                color: item.color,
                                                padding: '4px 12px',
                                                borderRadius: '8px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700
                                            }}>
                                                {menuName}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{
                        marginTop: '2rem',
                        padding: '1.5rem',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        border: '1px dashed #cbd5e1'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <i className="fas fa-info-circle" style={{ color: '#3b82f6' }}></i>
                            <strong style={{ color: '#1e293b' }}>Informasi</strong>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                            Role dan permissions saat ini sudah dikonfigurasi di <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>navConfig.js</code>.
                            Untuk menambah role baru atau mengubah permissions, hubungi developer.
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Security Verification Modal */}
            <Modal
                isOpen={isVerifyModalOpen}
                onClose={() => setIsVerifyModalOpen(false)}
                title="Verifikasi Keamanan"
                width="400px"
                footer={(
                    <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={() => setIsVerifyModalOpen(false)}>Batal</button>
                        <button className="btn btn-primary" onClick={handleVerify}>Verifikasi</button>
                    </div>
                )}
            >
                <div style={{ padding: '10px', textAlign: 'center' }}>
                    <div style={{
                        width: '60px', height: '60px', background: '#fef2f2',
                        borderRadius: '50%', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 1.5rem',
                        color: '#ef4444'
                    }}>
                        <i className="fas fa-lock" style={{ fontSize: '1.5rem' }}></i>
                    </div>
                    <h3 className="outfit" style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>Konfirmasi Identitas</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Masukkan PIN Anda untuk melihat password <strong>{targetUser?.fullname}</strong>.
                    </p>
                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <label className="form-label">PIN Administrator</label>
                        <input
                            type="password"
                            className="form-control"
                            value={verifyPin}
                            onChange={e => setVerifyPin(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleVerify()}
                            placeholder="••••••"
                            autoFocus
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
