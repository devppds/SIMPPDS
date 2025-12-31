'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import HijriDate from './HijriDate';
import Modal from './Modal';
import FileUploader from './FileUploader';
import { TextInput } from './FormInput';

export default function Header({ title }) {
    const { user, updateUser } = useAuth();
    const { showToast } = useToast();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [profileForm, setProfileForm] = useState({
        fullname: '',
        password: '',
        avatar: ''
    });

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const openProfile = () => {
        setProfileForm({
            fullname: user?.fullname || '',
            avatar: user?.avatar || '',
            password: ''
        });
        setIsProfileOpen(true);
    };

    const handleUpdateProfile = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        try {
            const dataToUpdate = { fullname: profileForm.fullname };
            if (profileForm.avatar) dataToUpdate.avatar = profileForm.avatar;
            if (profileForm.password) {
                dataToUpdate.password = profileForm.password;
                dataToUpdate.password_plain = profileForm.password; // Sync plain text if used
            }

            await updateUser(dataToUpdate);
            showToast("Profil berhasil diperbarui!", "success");
            setIsProfileOpen(false);
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleSidebar = () => {
        document.body.classList.toggle('sidebar-open');
    };

    return (
        <header>
            <div className="header-title">
                <div style={{ display: 'none' }} className="mobile-only">
                    <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', fontSize: '1.5rem', marginRight: '15px', color: 'var(--primary)' }}>
                        <i className="fas fa-bars"></i>
                    </button>
                </div>
                <h1>{title || 'Dashboard Overview'}</h1>
            </div>

            <div className="header-actions">
                <HijriDate />
                <div className="user-profile" onClick={openProfile} style={{ cursor: 'pointer' }}>
                    <div className="user-info">
                        <span className="user-name">{mounted ? (user?.fullname?.split(' ')[0] || 'User') : '...'}</span>
                        <span className="user-role">{mounted ? (user?.role?.toUpperCase() || 'USER') : 'USER'}</span>
                    </div>
                    <div className="user-avatar">
                        <img
                            src={mounted ? (user?.avatar || `https://ui-avatars.com/api/?name=${user?.username || 'U'}&background=1e3a8a&color=fff`) : `https://ui-avatars.com/api/?name=U&background=1e3a8a&color=fff`}
                            alt="User"
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                    </div>
                </div>
            </div>

            {/* Profile Edit Modal */}
            <Modal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                title="Pengaturan Profil Akun"
                footer={(
                    <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={() => setIsProfileOpen(false)}>Batal</button>
                        <button className="btn btn-primary" onClick={handleUpdateProfile} disabled={submitting}>
                            {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                )}
            >
                <form onSubmit={handleUpdateProfile}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <img
                                src={profileForm.avatar || `https://ui-avatars.com/api/?name=${user?.username || 'U'}&background=1e3a8a&color=fff&size=512`}
                                style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                alt="Profile Preview"
                            />
                            <div style={{
                                position: 'absolute',
                                bottom: '5px',
                                right: '5px',
                                background: 'white',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                border: '1px solid #e2e8f0'
                            }}>
                                <i className="fas fa-camera" style={{ fontSize: '0.8rem', color: '#64748b' }}></i>
                            </div>
                        </div>
                        <div style={{ marginTop: '1rem' }}>
                            <FileUploader
                                label="Ganti Foto Profil"
                                currentUrl={profileForm.avatar}
                                onUploadSuccess={(url) => setProfileForm({ ...profileForm, avatar: url })}
                                folder="user_avatars"
                            />
                        </div>
                    </div>

                    <TextInput
                        label="Nama Lengkap"
                        value={profileForm.fullname}
                        onChange={e => setProfileForm({ ...profileForm, fullname: e.target.value })}
                        icon="fas fa-user-circle"
                    />

                    <div style={{
                        background: '#f8fafc',
                        padding: '1.5rem',
                        borderRadius: '16px',
                        border: '1px solid #f1f5f9',
                        marginTop: '1.5rem'
                    }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 800, color: '#1e293b' }}>
                            <i className="fas fa-lock" style={{ marginRight: '8px', color: 'var(--primary)' }}></i>
                            Ubah Password
                        </h4>
                        <TextInput
                            label="Password Baru"
                            type="password"
                            value={profileForm.password}
                            onChange={e => setProfileForm({ ...profileForm, password: e.target.value })}
                            placeholder="Isi hanya jika ingin mengganti password"
                        />
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '-10px' }}>
                            Kosongkan jika tidak ingin mengganti password sistem.
                        </p>
                    </div>
                </form>
            </Modal>

        </header>
    );
}
