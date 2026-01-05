'use client';

import React, { useState, useMemo } from 'react';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { apiCall } from '@/lib/utils';
import { useToast } from '@/lib/ToastContext';
import { NAV_ITEMS } from '@/lib/navConfig';

export default function RolesTab({ rolesList, onRefresh }) {
    const { showToast } = useToast();
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [roleFormData, setRoleFormData] = useState({ label: '', role: '', color: '#64748b', menus: [], is_public: 1 });
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, role: null });

    // Generate menu options dynamically with hierarchy info
    const allPossibleMenus = useMemo(() => {
        let menus = [];
        const extract = (items, depth = 0, parentLabels = []) => {
            const currentLevelItems = [];
            items.forEach(item => {
                if (item.label === 'DEVELZY Control') return;
                const currentLabels = [...parentLabels, item.label];
                const uniqueId = item.path || currentLabels.join(' > ');

                const menuObj = {
                    label: item.label,
                    uniqueId: uniqueId,
                    isHeader: !!item.submenu && item.label !== 'Dashboard',
                    depth: depth,
                    path: item.path,
                    childrenIds: []
                };

                menus.push(menuObj);
                currentLevelItems.push(menuObj);

                if (item.submenu) {
                    const children = extract(item.submenu, depth + 1, currentLabels);
                    // Collect all recursive children IDs
                    menuObj.childrenIds = children.reduce((acc, child) => {
                        return [...acc, child.uniqueId, ...(child.childrenIds || [])];
                    }, []);
                }
            });
            return currentLevelItems;
        };
        extract(NAV_ITEMS);
        return menus;
    }, []);

    const handleAddRole = () => {
        setEditingRole(null);
        setRoleFormData({ label: '', role: '', color: '#64748b', menus: [], is_public: 1 });
        setIsRoleModalOpen(true);
    };

    const handleEditRole = (role) => {
        setEditingRole(role);
        setRoleFormData({
            label: role.label,
            role: role.role,
            color: role.color,
            menus: role.menus || [],
            is_public: role.is_public
        });
        setIsRoleModalOpen(true);
    };

    const handleSaveRole = async () => {
        if (!roleFormData.label || !roleFormData.role) {
            showToast("Nama Role dan Kode Role wajib diisi!", "error");
            return;
        }

        try {
            // Encode menus to JSON string if backend expects it, or keep as array if handled
            // Based on previous code: menus: JSON.stringify(menus)
            const dataToSave = {
                ...roleFormData,
                role: roleFormData.role.toLowerCase().replace(/\s+/g, '_'),
                menus: JSON.stringify(roleFormData.menus)
            };

            if (editingRole) {
                await apiCall('updateData', 'POST', { type: 'roles', id: editingRole.id, data: dataToSave });
                showToast("Role berhasil diperbarui!", "success");
            } else {
                await apiCall('saveData', 'POST', { type: 'roles', data: dataToSave });
                showToast("Role baru berhasil ditambahkan!", "success");
            }
            setIsRoleModalOpen(false);
            onRefresh();
        } catch (e) {
            showToast("Gagal menyimpan role: " + e.message, "error");
        }
    };

    const handleDeleteRole = (role) => {
        setConfirmDelete({ isOpen: true, role });
    };

    const executeDeleteRole = async () => {
        const role = confirmDelete.role;
        try {
            await apiCall('deleteData', 'POST', { type: 'roles', id: role.id });
            showToast(`Role "${role.label}" berhasil dihapus.`, "success");
            setConfirmDelete({ isOpen: false, role: null });
            onRefresh();
        } catch (e) {
            showToast("Gagal menghapus role: " + e.message, "error");
        }
    };

    return (
        <div className="animate-in">
            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, role: null })}
                onConfirm={executeDeleteRole}
                title="Hapus Role?"
                message={`Apakah Anda yakin ingin menghapus role "${confirmDelete.role?.label}"? Tindakan ini tidak dapat dibatalkan.`}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800 }}>Role & Permissions Management</h3>
                <button className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }} onClick={handleAddRole}>
                    <i className="fas fa-plus" style={{ marginRight: '8px' }}></i> Tambah Role Baru
                </button>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {rolesList.map((item, idx) => (
                    <div key={idx} className="develzy-role-card">
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="develzy-role-icon" style={{ background: `${item.color}15`, color: item.color }}>
                                    <i className="fas fa-user-shield"></i>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1.1rem' }}>{item.label}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#475569', fontFamily: 'monospace' }}>{item.role}</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}>
                                    <i className="fas fa-users" style={{ marginRight: '6px', color: item.color }}></i>
                                    {item.users} User
                                </div>
                                <div style={{
                                    background: item.is_public ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: item.is_public ? '#10b981' : '#f87171',
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    border: `1px solid ${item.is_public ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                }}>
                                    <i className={`fas fa-${item.is_public ? 'globe' : 'lock'}`} style={{ marginRight: '6px' }}></i>
                                    {item.is_public ? 'Public' : 'Private'}
                                </div>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 800, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Access Protocol:</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {item.menus.map((menu, i) => (
                                    <span key={i} className="develzy-protocol-badge">
                                        <i className={`fas fa-${menu.access === 'view' ? 'eye-slash' : 'shield-alt'}`} style={{ color: item.color, fontSize: '0.7rem' }}></i>
                                        {menu.name}
                                        <span style={{ fontSize: '0.65rem', opacity: 0.6, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                            {menu.access === 'view' ? 'READ' : 'ROOT'}
                                        </span>
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button className="develzy-btn-action develzy-btn-action-primary" onClick={() => handleEditRole(item)}>
                                <i className="fas fa-terminal" style={{ color: '#6366f1' }}></i> Configure
                            </button>
                            <button className="develzy-btn-action develzy-btn-action-danger" onClick={() => handleDeleteRole(item)}>
                                <i className="fas fa-trash-alt"></i> Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{
                marginTop: '2rem',
                padding: '1.5rem',
                background: 'rgba(245, 158, 11, 0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(245, 158, 11, 0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <i className="fas fa-info-circle" style={{ color: '#f59e0b', fontSize: '1.2rem' }}></i>
                    <strong style={{ color: '#f59e0b' }}>Protocol Advisory</strong>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
                    Role "Super Administrator" adalah entitas tingkat tinggi. Harap berhati-hati saat memodifikasi akses pada peran ini karena perubahan akan berdampak langsung pada seluruh infrastruktur kendali.
                </p>
            </div>

            <Modal
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
                title={editingRole ? `Edit Role: ${editingRole.label}` : "Tambah Role Baru"}
                theme="dark"
                footer={(
                    <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={() => setIsRoleModalOpen(false)}>Batal</button>
                        <button className="btn btn-primary" onClick={handleSaveRole}>Simpan Role</button>
                    </div>
                )}
            >
                <div style={{ padding: '10px' }}>
                    <div className="form-group">
                        <label className="form-label" style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem' }}>Nama Role</label>
                        <input
                            type="text"
                            className="form-control"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', padding: '12px 16px', borderRadius: '12px', width: '100%' }}
                            value={roleFormData.label}
                            onChange={(e) => setRoleFormData({ ...roleFormData, label: e.target.value })}
                            placeholder="Contoh: Panitia Qurban"
                        />
                    </div>
                    {!editingRole && (
                        <div className="form-group" style={{ marginTop: '1.25rem' }}>
                            <label className="form-label" style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem' }}>Kode Role (ID)</label>
                            <input
                                type="text"
                                className="form-control"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', padding: '12px 16px', borderRadius: '12px', width: '100%' }}
                                value={roleFormData.role}
                                onChange={(e) => setRoleFormData({ ...roleFormData, role: e.target.value })}
                                placeholder="panitia_qurban (otomatis lowercase)"
                            />
                            <small style={{ color: '#475569', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>Digunakan untuk coding & database key.</small>
                        </div>
                    )}
                    <div className="form-group" style={{ marginTop: '1.25rem' }}>
                        <label className="form-label" style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem' }}>Identitas Warna</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input
                                type="color"
                                value={roleFormData.color}
                                onChange={(e) => setRoleFormData({ ...roleFormData, color: e.target.value })}
                                style={{ width: '50px', height: '50px', padding: 0, border: 'none', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer' }}
                            />
                            <div style={{ fontSize: '0.9rem', color: '#f1f5f9', fontFamily: 'monospace' }}>{roleFormData.color}</div>
                        </div>
                    </div>
                    <div className="form-group" style={{ marginTop: '1.25rem' }}>
                        <label className="form-label" style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem' }}>Level Visibilitas</label>
                        <select
                            className="form-control"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', padding: '12px 16px', borderRadius: '12px', width: '100%' }}
                            value={roleFormData.is_public}
                            onChange={(e) => setRoleFormData({ ...roleFormData, is_public: parseInt(e.target.value) })}
                        >
                            <option value={1}>Public (Terlihat di Pendaftaran)</option>
                            <option value={0}>Private (Internal Only)</option>
                        </select>
                    </div>

                    <div className="form-group" style={{ marginTop: '1.5rem' }}>
                        <label className="form-label" style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem', marginBottom: '1rem', display: 'block' }}>Akses Menu</label>
                        <div style={{ padding: '1.25rem', background: 'rgba(2, 6, 23, 0.5)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1.25rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pilih protokol akses yang diizinkan:</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
                                {allPossibleMenus.map((menu, i) => {
                                    const menuName = menu.label;
                                    const uniqueId = menu.uniqueId;
                                    const existingPerm = roleFormData.menus.find(m => (m.id || m.name) === uniqueId || (m.name === menuName && !m.id));
                                    const isChecked = !!existingPerm;

                                    const areAllChildrenChecked = menu.isHeader && menu.childrenIds.length > 0 &&
                                        menu.childrenIds.every(cid => roleFormData.menus.some(m => (m.id || m.name) === cid));

                                    const isPartiallyChecked = menu.isHeader && !areAllChildrenChecked &&
                                        menu.childrenIds.some(cid => roleFormData.menus.some(m => (m.id || m.name) === cid));

                                    const handleToggle = (checked) => {
                                        let newMenus = [...roleFormData.menus];
                                        const targetIds = [uniqueId, ...menu.childrenIds];
                                        if (checked) {
                                            targetIds.forEach(tid => {
                                                if (!newMenus.some(m => (m.id || m.name) === tid)) {
                                                    const targetMenu = allPossibleMenus.find(am => am.uniqueId === tid);
                                                    newMenus.push({ id: tid, name: targetMenu?.label || tid, access: 'view' });
                                                }
                                            });
                                        } else {
                                            newMenus = newMenus.filter(m => !targetIds.includes(m.id || m.name));
                                        }
                                        setRoleFormData({ ...roleFormData, menus: newMenus });
                                    };

                                    return (
                                        <div key={i} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px 14px', borderRadius: '10px',
                                            marginLeft: `${menu.depth * 24}px`,
                                            background: menu.isHeader ? 'rgba(16, 185, 129, 0.03)' : (isChecked ? 'rgba(255,255,255,0.02)' : 'transparent'),
                                            border: (isChecked || areAllChildrenChecked || isPartiallyChecked) ? `1px solid ${roleFormData.color}30` : (menu.isHeader ? '1px solid rgba(255,255,255,0.03)' : '1px solid transparent'),
                                            marginBottom: menu.isHeader ? '6px' : '2px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem', flex: 1 }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', width: '100%', margin: 0, color: menu.isHeader ? '#f8fafc' : '#94a3b8', fontWeight: menu.isHeader ? 800 : 600 }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={menu.isHeader ? areAllChildrenChecked : isChecked}
                                                        ref={el => {
                                                            if (el) el.indeterminate = isPartiallyChecked;
                                                        }}
                                                        onChange={(e) => handleToggle(e.target.checked)}
                                                        style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                                                    />
                                                    <span style={{
                                                        fontSize: menu.isHeader ? '0.75rem' : '0.85rem',
                                                        textTransform: menu.isHeader ? 'uppercase' : 'none',
                                                        letterSpacing: menu.isHeader ? '1px' : 'normal'
                                                    }}>
                                                        {menuName}
                                                    </span>
                                                </label>
                                            </div>

                                            {isChecked && !menu.isHeader && (
                                                <select
                                                    value={existingPerm?.access || 'view'}
                                                    className="develzy-input"
                                                    onChange={(e) => {
                                                        const newAccess = e.target.value;
                                                        setRoleFormData({
                                                            ...roleFormData,
                                                            menus: roleFormData.menus.map(m =>
                                                                (m.id || m.name) === uniqueId ? { ...m, access: newAccess } : m
                                                            )
                                                        });
                                                    }}
                                                    style={{ width: 'auto', padding: '4px 28px 4px 10px', fontSize: '0.75rem' }}
                                                >
                                                    <option value="view">READ ONLY</option>
                                                    <option value="edit">ROOT ACCESS</option>
                                                </select>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
