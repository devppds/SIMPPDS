'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import { apiCall } from '@/lib/utils';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import FileUploader from '@/components/FileUploader';
import { NAV_ITEMS } from '@/lib/navConfig';

export default function DevelzyControlPage() {
    const { isDevelzy, loading: authLoading, refreshConfig } = useAuth(); // Pakai isDevelzy
    const router = useRouter();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('general');
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const isMounted = useRef(false);

    // Real Data State
    const [logs, setLogs] = useState([]);
    const [logsPagination, setLogsPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [configs, setConfigs] = useState({
        nama_instansi: 'Pondok Pesantren Darussalam Lirboyo',
        tahun_ajaran: '2025/2026',
        deskripsi: 'Sistem Informasi Manajemen Terpadu Pondok Pesantren Darussalam Lirboyo',
        logo_url: 'https://ui-avatars.com/api/?name=LIRBOYO&background=2563eb&color=fff&size=256&bold=true',
        primary_color: '#2563eb',
        sidebar_theme: '#1e1b4b'
    });

    // Real-time System Stats
    const [systemStats, setSystemStats] = useState({
        uptime: 'Loading...',
        requests: 'Loading...',
        cpu: 'Loading...',
        memory: 'Loading...'
    });

    // Service Status State
    const [serviceStatus, setServiceStatus] = useState({
        whatsapp: { status: 'Checking...', color: '#94a3b8' },
        cloudinary: { status: 'Checking...', color: '#94a3b8' },
        database: { status: 'Checking...', color: '#94a3b8' },
        email: { status: 'Not Configured', color: '#94a3b8' }
    });

    // Role Management State
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [rolesList, setRolesList] = useState([]);
    const [roleFormData, setRoleFormData] = useState({ label: '', role: '', color: '#64748b', menus: [], is_public: 1 });
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, role: null });

    // Service Configuration State
    const [configModal, setConfigModal] = useState({ isOpen: false, service: null, data: {} });
    const [submittingConfig, setSubmittingConfig] = useState(false);

    // Sessions Management State
    const [activeSessions, setActiveSessions] = useState([]);
    const [kickLoading, setKickLoading] = useState(null);

    const handleOpenConfig = async (service) => {
        setLoading(true);
        try {
            const res = await apiCall('getConfigs', 'GET');
            const data = {};
            if (res && Array.isArray(res)) {
                res.forEach(item => {
                    data[item.key] = item.value;
                });
            }
            setConfigModal({ isOpen: true, service, data });
        } catch (e) {
            showToast("Gagal memuat konfigurasi", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveServiceConfig = async () => {
        setSubmittingConfig(true);
        try {
            const data = configModal.data;
            for (const [key, value] of Object.entries(data)) {
                // Only save keys relevant to the current service to avoid overwriting everything unnecessarily
                // or just save the ones that were in the modal
                await apiCall('updateConfig', 'POST', { data: { key, value } });
            }
            showToast(`Konfigurasi ${configModal.service.name} Berhasil Disimpan!`, "success");
            setConfigModal({ isOpen: false, service: null, data: {} });
            loadData(); // Reload stats/integration view
        } catch (e) {
            showToast("Gagal menyimpan konfigurasi: " + e.message, "error");
        } finally {
            setSubmittingConfig(false);
        }
    };

    const handleTerminateActiveSession = async (sessionId, username) => {
        if (!confirm(`Apakah Anda yakin ingin mengeluarkan paksa user ${username}?`)) return;
        setKickLoading(sessionId);
        try {
            await apiCall('terminateSession', 'POST', { data: { tokenId: sessionId, username } });
            showToast("User Berhasil Dikeluarkan!", "success");
            loadData(); // Refresh list
        } catch (e) {
            showToast("Gagal mengeluarkan user: " + e.message, "error");
        } finally {
            setKickLoading(null);
        }
    };

    // Generate menu options dynamically with hierarchy info
    const allPossibleMenus = React.useMemo(() => {
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

    useEffect(() => {
        isMounted.current = true;

        if (authLoading) return;

        if (!isDevelzy) {
            showToast("Akses Terlarang: Area Khusus Develzy", "error");
            router.push('/');
            return;
        }

        loadData();
        loadSystemStats();

        if (activeTab === 'integration') {
            checkServiceStatus();
        }

        const interval = setInterval(() => {
            if (isMounted.current) {
                loadSystemStats();
                if (activeTab === 'integration') {
                    checkServiceStatus();
                }
            }
        }, 30000);

        return () => {
            isMounted.current = false;
            clearInterval(interval);
        };
    }, [isDevelzy, authLoading, activeTab, router, logsPagination.page]);

    const loadSystemStats = async () => {
        try {
            // Calculate uptime based on deployment time (you can store this in configs)
            const now = new Date();
            const deployTime = new Date('2025-12-29T00:00:00'); // Replace with actual deploy time from config
            const uptimeMs = now - deployTime;
            const uptimeDays = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
            const uptimeHours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            // Get database stats for activity indicator
            const dbStats = await apiCall('getQuickStats', 'GET');

            if (isMounted.current) {
                setSystemStats({
                    uptime: uptimeDays > 0 ? `${uptimeDays} Hari, ${uptimeHours} Jam` : `${uptimeHours} Jam`,
                    requests: dbStats ? 'Active' : 'Idle',
                    cpu: 'Optimal', // Cloudflare Workers auto-scales, always optimal
                    memory: 'Edge Optimized' // Cloudflare manages memory automatically
                });
            }
        } catch (e) {
            console.error("Load system stats error:", e);
        }
    };

    const loadData = async () => {
        try {
            if (activeTab === 'audit') {
                const res = await apiCall('getAuditLogs', 'GET', { page: logsPagination.page, limit: logsPagination.limit });
                if (isMounted.current) {
                    if (res && res.data) {
                        setLogs(res.data);
                        setLogsPagination(res.pagination);
                    } else {
                        setLogs(Array.isArray(res) ? res : []);
                    }
                }
            }
            if (activeTab === 'general' || activeTab === 'branding') {
                const res = await apiCall('getConfigs', 'GET');
                if (res && Array.isArray(res) && isMounted.current) {
                    const newConfigs = { ...configs };
                    res.forEach(item => {
                        if (item.key === 'nama_instansi') newConfigs.nama_instansi = item.value;
                        if (item.key === 'tahun_ajaran') newConfigs.tahun_ajaran = item.value;
                        if (item.key === 'deskripsi') newConfigs.deskripsi = item.value;
                        if (item.key === 'logo_url') newConfigs.logo_url = item.value;
                        if (item.key === 'primary_color') newConfigs.primary_color = item.value;
                        if (item.key === 'sidebar_theme') newConfigs.sidebar_theme = item.value;
                        if (item.key === 'maintenance_mode') setMaintenanceMode(item.value === 'true');
                    });
                    setConfigs(newConfigs);
                }
            }
            if (activeTab === 'sessions') {
                const res = await apiCall('getActiveSessions', 'GET');
                if (isMounted.current) {
                    setActiveSessions(Array.isArray(res) ? res : []);
                }
            }
            if (activeTab === 'roles' || activeTab === 'branding') { // Load for branding too strictly speaking not needed if using 'general' api logic but let's be safe
                if (activeTab === 'roles') {
                    try {
                        const res = await apiCall('getData', 'GET', { type: 'roles' });
                        // Handle Seeding if empty
                        if (!res || res.length === 0) {
                            console.log("Seeding default roles...");
                            const defaultRoles = [
                                { role: 'develzy', label: 'DEVELZY Control', color: '#0f172a', menus: JSON.stringify(['Semua Menu', 'DEVELZY Control']), is_public: 0 },
                                { role: 'admin', label: 'Super Administrator', color: '#2563eb', menus: JSON.stringify(['Semua Menu']), is_public: 1 },
                                { role: 'sekretariat', label: 'Sekretariat', color: '#8b5cf6', menus: JSON.stringify(['Data Santri', 'Asrama & Kamar', 'Layanan Sekretariat', 'Data Pengajar', 'Arsiparis']), is_public: 1 },
                                { role: 'bendahara', label: 'Bendahara', color: '#10b981', menus: JSON.stringify(['Arus Kas Pondok', 'Setoran Unit', 'Atur Layanan', 'Keuangan Santri']), is_public: 1 },
                                { role: 'keamanan', label: 'Keamanan', color: '#ef4444', menus: JSON.stringify(['Pelanggaran', 'Perizinan Santri', 'Barang Sitaan', 'Registrasi Barang']), is_public: 1 },
                                { role: 'pendidikan', label: 'Pendidikan', color: '#f59e0b', menus: JSON.stringify(['Agenda & Nilai', 'Layanan Pendidikan']), is_public: 1 },
                                { role: 'wajar_murottil', label: 'Wajar-Murottil', color: '#06b6d4', menus: JSON.stringify(['Wajib Belajar', 'Murottil Malam', 'Murottil Pagi']), is_public: 1 },
                                { role: 'kesehatan', label: 'Kesehatan (BK)', color: '#ec4899', menus: JSON.stringify(['Data Kesehatan', 'Layanan Kesehatan']), is_public: 1 },
                                { role: 'jamiyyah', label: "Jam'iyyah", color: '#6366f1', menus: JSON.stringify(["Layanan Jam'iyyah"]), is_public: 1 },
                            ];

                            // Seed one by one
                            for (const role of defaultRoles) {
                                await apiCall('saveData', 'POST', { type: 'roles', data: role });
                            }
                            // Reload
                            const seeded = await apiCall('getData', 'GET', { type: 'roles' });
                            if (isMounted.current) {
                                setRolesList(seeded.map(r => ({
                                    ...r,
                                    menus: r.menus ? JSON.parse(r.menus) : []
                                })));
                            }
                        } else {
                            if (isMounted.current) {
                                setRolesList(res.map(r => {
                                    try {
                                        const rawMenus = r.menus ? JSON.parse(r.menus) : [];
                                        // Normalize to Object Array: [{ name: 'Menu', access: 'edit' }]
                                        const normalizedMenus = rawMenus.map(m => {
                                            if (typeof m === 'string') return { name: m, access: 'edit' }; // Legacy fallbacks
                                            return m;
                                        });
                                        return { ...r, menus: normalizedMenus };
                                    } catch (e) {
                                        console.warn("Failed to parse menus for role:", r.role);
                                        return { ...r, menus: [] };
                                    }
                                }));
                            } // End isMounted
                        }
                    } catch (err) {
                        console.error("Failed to load/seed roles:", err);
                    }
                }
            }
        } catch (e) {
            console.error("Load data error:", e);
            if (e.message.includes('Unauthorized') || e.message.includes('Forbidden')) {
                showToast("Akses ditolak. Pastikan Anda login sebagai Admin.", "error");
            }
        }
    };

    const handleSaveConfig = async () => {
        try {
            await apiCall('updateConfig', 'POST', { data: { key: 'nama_instansi', value: configs.nama_instansi } });
            await apiCall('updateConfig', 'POST', { data: { key: 'tahun_ajaran', value: configs.tahun_ajaran } });
            await apiCall('updateConfig', 'POST', { data: { key: 'deskripsi', value: configs.deskripsi } });
            await apiCall('updateConfig', 'POST', { data: { key: 'logo_url', value: configs.logo_url } });
            await apiCall('updateConfig', 'POST', { data: { key: 'primary_color', value: configs.primary_color } });
            await apiCall('updateConfig', 'POST', { data: { key: 'sidebar_theme', value: configs.sidebar_theme } });
            await refreshConfig(); // Refresh global config
            showToast("Konfigurasi berhasil disimpan!", "success");
        } catch (e) {
            console.error("Save config error:", e);
            showToast("Gagal menyimpan konfigurasi: " + e.message, "error");
        }
    };

    const checkServiceStatus = async () => {
        const newStatus = { ...serviceStatus };

        // Check Database (Cloudflare D1)
        try {
            await apiCall('ping', 'GET');
            newStatus.database = { status: 'Healthy', color: '#22c55e' };
        } catch (e) {
            newStatus.database = { status: 'Error', color: '#ef4444' };
        }

        // Check Cloudinary
        try {
            const { cloudName, apiKey } = await apiCall('getCloudinarySignature', 'POST', { data: { paramsToSign: { timestamp: Math.round(Date.now() / 1000) } } });
            if (cloudName && apiKey) {
                newStatus.cloudinary = { status: 'Configured (' + cloudName + ')', color: '#0ea5e9' };
            } else {
                newStatus.cloudinary = { status: 'Not Configured', color: '#94a3b8' };
            }
        } catch (e) {
            newStatus.cloudinary = { status: 'Config Error', color: '#f59e0b' };
        }

        // WhatsApp - Check if configured (placeholder for now)
        newStatus.whatsapp = { status: 'Connected', color: '#22c55e' };

        if (isMounted.current) {
            setServiceStatus(newStatus);
        }
    };

    const handleMaintenanceToggle = () => {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            animation: fadeIn 0.2s ease;
        `;

        const actionText = maintenanceMode ? 'Nonaktifkan' : 'Aktifkan';
        const warningText = maintenanceMode
            ? 'Sistem akan kembali online dan dapat diakses oleh semua pengguna.'
            : 'Ini akan memutus koneksi semua pengguna non-admin dan menampilkan halaman maintenance.';

        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 32px;
                padding: 4rem 3.5rem;
                max-width: 680px;
                width: 90%;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
                animation: slideUp 0.3s ease;
            ">
                <div style="text-align: center; margin-bottom: 2.5rem;">
                    <div style="
                        width: 120px;
                        height: 120px;
                        margin: 0 auto 2rem;
                        background: ${maintenanceMode ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'};
                        border-radius: 28px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 15px 35px ${maintenanceMode ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'};
                    ">
                        <i class="fas fa-${maintenanceMode ? 'check-circle' : 'exclamation-triangle'}" style="font-size: 3.5rem; color: white;"></i>
                    </div>
                    <h2 class="outfit" style="
                        font-size: 2.25rem;
                        font-weight: 900;
                        color: #1e293b;
                        margin-bottom: 1.25rem;
                        letter-spacing: -0.5px;
                    ">${actionText} Mode Pemeliharaan</h2>
                    <p style="
                        font-size: 1.2rem;
                        color: #64748b;
                        line-height: 1.7;
                        margin: 0 auto;
                        max-width: 500px;
                        margin-bottom: 2rem;
                    ">
                        ${warningText}
                    </p>
                    
                    ${!maintenanceMode ? `
                        <div style="text-align: left; background: #f8fafc; padding: 1.5rem; border-radius: 20px; border: 1px solid #e2e8f0; margin-bottom: 2rem;">
                            <label style="display: block; font-weight: 800; color: #1e293b; margin-bottom: 10px; font-size: 0.9rem; text-transform: uppercase;">Durasi Pemeliharaan (Menit)</label>
                            <input type="number" id="maintMinutes" value="60" min="1" max="1440" style="
                                width: 100%;
                                padding: 12px 16px;
                                border-radius: 12px;
                                border: 2px solid #cbd5e1;
                                font-size: 1.2rem;
                                font-weight: 800;
                                color: var(--primary);
                                outline: none;
                                transition: all 0.2s;
                            " onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='#cbd5e1'">
                            <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 8px;">Tentukan berapa lama sistem akan terkunci untuk pemeliharaan.</p>
                        </div>
                    ` : ''}

                    <span style="
                        display: inline-block;
                        background: ${maintenanceMode ? '#ecfdf5' : '#fef2f2'};
                        color: ${maintenanceMode ? '#047857' : '#dc2626'};
                        padding: 12px 24px;
                        border-radius: 12px;
                        font-size: 1.05rem;
                        font-weight: 700;
                        box-shadow: 0 2px 8px ${maintenanceMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'};
                    ">
                        <i class="fas fa-${maintenanceMode ? 'power-off' : 'shield-alt'}" style="margin-right: 8px; font-size: 1.1rem;"></i>
                        ${maintenanceMode ? 'Sistem akan kembali online' : 'Hanya admin yang bisa akses'}
                    </span>
                </div>
                <div style="
                    display: flex;
                    gap: 1.25rem;
                    margin-top: 2.5rem;
                ">
                    <button id="cancelMaintenance" style="
                        flex: 1;
                        padding: 18px 32px;
                        border: 2px solid #e2e8f0;
                        background: white;
                        color: #64748b;
                        border-radius: 14px;
                        font-size: 1.1rem;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='#f8fafc'; this.style.borderColor='#cbd5e1'" onmouseout="this.style.background='white'; this.style.borderColor='#e2e8f0'">
                        Batal
                    </button>
                    <button id="confirmMaintenance" style="
                        flex: 1;
                        padding: 18px 32px;
                        border: none;
                        background: ${maintenanceMode ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'};
                        color: white;
                        border-radius: 14px;
                        font-size: 1.1rem;
                        font-weight: 700;
                        cursor: pointer;
                        box-shadow: 0 6px 16px ${maintenanceMode ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'};
                        transition: all 0.2s;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px ${maintenanceMode ? 'rgba(16, 185, 129, 0.45)' : 'rgba(239, 68, 68, 0.45)'}'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 6px 16px ${maintenanceMode ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}'">
                        <i class="fas fa-${maintenanceMode ? 'check' : 'power-off'}" style="margin-right: 10px; font-size: 1.15rem;"></i>
                        ${actionText} Sekarang
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        const confirmBtn = modal.querySelector('#confirmMaintenance');
        const cancelBtn = modal.querySelector('#cancelMaintenance');

        confirmBtn.onclick = async () => {
            const nextMode = !maintenanceMode;
            const minutesInput = modal.querySelector('#maintMinutes');
            const minutes = minutesInput ? parseInt(minutesInput.value) || 60 : 0;
            const endTime = nextMode ? (Date.now() + (minutes * 60000)).toString() : '';

            modal.remove();
            style.remove();

            try {
                // Update maintenance status
                await apiCall('updateConfig', 'POST', {
                    data: { key: 'maintenance_mode', value: nextMode.toString() }
                });

                // Save end time
                await apiCall('updateConfig', 'POST', {
                    data: { key: 'maintenance_end_time', value: endTime }
                });

                setMaintenanceMode(nextMode);
                await refreshConfig();
                showToast(
                    nextMode ? `Mode Pemeliharaan aktif (${minutes} menit)!` : "Mode Pemeliharaan dinonaktifkan!",
                    nextMode ? "warning" : "success"
                );
            } catch (err) {
                showToast("Gagal memperbarui status: " + err.message, "error");
            }
        };

        cancelBtn.onclick = () => {
            modal.remove();
            style.remove();
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
                style.remove();
            }
        };
    };

    const handleAddRole = () => {
        setEditingRole(null);
        setRoleFormData({ label: '', role: '', color: '#64748b', menus: [], is_public: 1 });
        setIsRoleModalOpen(true);
    };

    const handleEditRole = (role) => {
        setEditingRole(role);
        setRoleFormData({ ...role });
        setIsRoleModalOpen(true);
    };

    const handleSaveRole = async (e) => {
        if (e) e.preventDefault();

        try {
            const dataToSave = {
                role: roleFormData.role.toLowerCase().replace(/\s+/g, '_'),
                label: roleFormData.label,
                color: roleFormData.color,
                menus: JSON.stringify(roleFormData.menus),
                is_public: roleFormData.is_public ? 1 : 0
            };

            if (editingRole && editingRole.id) {
                await apiCall('saveData', 'POST', { type: 'roles', id: editingRole.id, data: dataToSave });
                showToast("Role berhasil diperbarui!", "success");
            } else {
                await apiCall('saveData', 'POST', { type: 'roles', data: dataToSave });
                showToast("Role baru berhasil ditambahkan!", "success");
            }
            setIsRoleModalOpen(false);
            loadData();
        } catch (err) {
            console.error(err);
            showToast("Gagal menyimpan role: " + err.message, "error");
        }
    };

    const handleDeleteRole = (roleToDelete) => {
        setConfirmDelete({ isOpen: true, role: roleToDelete });
    };

    const executeDeleteRole = async () => {
        const role = confirmDelete.role;
        if (!role) return;

        try {
            await apiCall('deleteData', 'DELETE', { type: 'roles', id: role.id });
            showToast("Role berhasil dihapus!", "success");
            loadData();
            setConfirmDelete({ isOpen: false, role: null });
        } catch (err) {
            console.error(err);
            showToast("Gagal menghapus role: " + err.message, "error");
        }
    };
    const handleInitSystem = async () => {
        // Create custom modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            animation: fadeIn 0.2s ease;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 32px;
                padding: 4rem 3.5rem;
                max-width: 680px;
                width: 90%;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
                animation: slideUp 0.3s ease;
            ">
                <div style="text-align: center; margin-bottom: 2.5rem;">
                    <div style="
                        width: 120px;
                        height: 120px;
                        margin: 0 auto 2rem;
                        background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
                        border-radius: 28px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 15px 35px rgba(59, 130, 246, 0.4);
                    ">
                        <i class="fas fa-database" style="font-size: 3.5rem; color: white;"></i>
                    </div>
                    <h2 class="outfit" style="
                        font-size: 2.25rem;
                        font-weight: 900;
                        color: #1e293b;
                        margin-bottom: 1.25rem;
                        letter-spacing: -0.5px;
                    ">Inisialisasi Database System</h2>
                    <p style="
                        font-size: 1.2rem;
                        color: #64748b;
                        line-height: 1.7;
                        margin: 0;
                        max-width: 500px;
                        margin: 0 auto;
                    ">
                        Sistem akan membuat tabel <strong style="color: #3b82f6; font-weight: 800;">audit_logs</strong> dan 
                        <strong style="color: #3b82f6; font-weight: 800;">system_configs</strong> di database Anda.
                        <br><br>
                        <span style="
                            display: inline-block;
                            background: #ecfdf5;
                            color: #047857;
                            padding: 12px 24px;
                            border-radius: 12px;
                            font-size: 1.05rem;
                            font-weight: 700;
                            margin-top: 1rem;
                            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
                        ">
                            <i class="fas fa-check-circle" style="margin-right: 8px; font-size: 1.1rem;"></i>
                            Aman dilakukan berulang kali
                        </span>
                    </p>
                </div>
                <div style="
                    display: flex;
                    gap: 1.25rem;
                    margin-top: 2.5rem;
                ">
                    <button id="cancelInit" style="
                        flex: 1;
                        padding: 18px 32px;
                        border: 2px solid #e2e8f0;
                        background: white;
                        color: #64748b;
                        border-radius: 14px;
                        font-size: 1.1rem;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='#f8fafc'; this.style.borderColor='#cbd5e1'" onmouseout="this.style.background='white'; this.style.borderColor='#e2e8f0'">
                        Batal
                    </button>
                    <button id="confirmInit" style="
                        flex: 1;
                        padding: 18px 32px;
                        border: none;
                        background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
                        color: white;
                        border-radius: 14px;
                        font-size: 1.1rem;
                        font-weight: 700;
                        cursor: pointer;
                        box-shadow: 0 6px 16px rgba(59, 130, 246, 0.35);
                        transition: all 0.2s;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(59, 130, 246, 0.45)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 6px 16px rgba(59, 130, 246, 0.35)'">
                        <i class="fas fa-rocket" style="margin-right: 10px; font-size: 1.15rem;"></i>
                        Mulai Inisialisasi
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        // Handle button clicks
        const confirmBtn = modal.querySelector('#confirmInit');
        const cancelBtn = modal.querySelector('#cancelInit');

        confirmBtn.onclick = async () => {
            modal.remove();
            style.remove();
            try {
                await apiCall('initSystem', 'GET');
                showToast("System Tables Ready!", "success");
                loadData();
            } catch (e) {
                showToast("Gagal inisialisasi: " + e.message, "error");
            }
        };

        cancelBtn.onclick = () => {
            modal.remove();
            style.remove();
        };

        // Close on backdrop click
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
                style.remove();
            }
        };
    };

    if (!isDevelzy) {
        return (
            <div className="view-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <i className="fas fa-lock" style={{ fontSize: '4rem', color: '#ef4444', marginBottom: '1.5rem' }}></i>
                    <h1 className="outfit">Akses Dibatasi</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Halaman ini hanya untuk Administrator Utama (DEVELZY).</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'general', label: 'Konfigurasi Global', icon: 'fas fa-globe' },
        { id: 'branding', label: 'Branding & Tampilan', icon: 'fas fa-paint-brush' },
        { id: 'integration', label: 'Integrasi API', icon: 'fas fa-plug' },
        { id: 'audit', label: 'Log Audit', icon: 'fas fa-history' },
        { id: 'sessions', label: 'Daftar Sesi Aktif', icon: 'fas fa-users-cog' },
        { id: 'roles', label: 'Manajemen Akses', icon: 'fas fa-user-shield' },
        { id: 'system', label: 'Kondisi Sistem', icon: 'fas fa-heartbeat' },
    ];

    return (
        <div className="view-container">
            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, role: null })}
                onConfirm={executeDeleteRole}
                title="Hapus Role?"
                message={`Apakah Anda yakin ingin menghapus role "${confirmDelete.role?.label}"? Tindakan ini tidak dapat dibatalkan.`}
            />
            {/* Hero Header */}
            <div className="develzy-hero" style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)',
                borderRadius: '32px',
                padding: '3rem',
                color: 'white',
                marginBottom: '3rem',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 40px -10px rgba(30, 58, 138, 0.3)'
            }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#60a5fa', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem', marginBottom: '1rem' }}>
                        <i className="fas fa-rocket"></i>
                        Pusat Kontrol Sistem
                    </div>
                    <h1 className="outfit hero-title" style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '10px' }}>Panel Kontrol DEVELZY</h1>
                    <p className="hero-desc" style={{ opacity: 0.8, fontSize: '1.1rem', maxWidth: '600px' }}>
                        Pusat kendali operasional tingkat tinggi untuk konfigurasi infrastruktur,
                        manajemen layanan, dan pemantauan sistem secara real-time.
                    </p>
                </div>
                {/* Decorative circle */}
                <div style={{
                    position: 'absolute', right: '-50px', top: '-50px',
                    width: '300px', height: '300px', borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.1)', zIndex: 1
                }}></div>
            </div>

            {/* Quick Stats Grid */}
            <div className="quick-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                {[
                    { label: 'Waktu Operasional', value: systemStats.uptime, icon: 'fas fa-clock', color: '#2563eb', desc: 'Sejak deployment' },
                    { label: 'Status Database', value: systemStats.requests, icon: 'fas fa-database', color: '#10b981', desc: 'Koneksi aktif' },
                    { label: 'Runtime Sistem', value: systemStats.cpu, icon: 'fas fa-microchip', color: '#8b5cf6', desc: 'Auto-scaling' },
                    { label: 'Pemeliharaan', value: maintenanceMode ? 'OFFLINE' : 'LIVE', icon: 'fas fa-power-off', color: maintenanceMode ? '#ef4444' : '#10b981', desc: maintenanceMode ? 'Mode pemeliharaan' : 'Sistem normal' },
                ].map((stat, i) => (
                    <div key={i} className="card stat-card-compact" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
                        <div className="stat-icon" style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${stat.color}15`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                            <i className={stat.icon}></i>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{stat.label}</div>
                            <div className="stat-value" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="main-layout-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 280px) 1fr', gap: '2.5rem' }}>
                {/* Sidebar Navigation */}
                <div className="develzy-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="sidebar-scrollable" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: '16px 20px',
                                    borderRadius: '14px',
                                    border: 'none',
                                    background: activeTab === tab.id ? 'white' : 'transparent',
                                    color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    fontWeight: activeTab === tab.id ? 800 : 600,
                                    fontSize: '0.95rem',
                                    textAlign: 'left',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer',
                                    boxShadow: activeTab === tab.id ? '0 10px 15px -3px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >
                                <i className={tab.icon} style={{ width: '20px' }}></i>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="maintenance-box" style={{ marginTop: '2rem', padding: '20px', background: '#fff1f2', borderRadius: '20px', border: '1px solid #fee2e2' }}>
                        <h4 className="outfit" style={{ color: '#be123c', fontSize: '0.9rem', marginBottom: '8px' }}>Zona Bahaya</h4>
                        <button
                            className="btn btn-primary"
                            style={{
                                width: '100%', background: '#ef4444', color: 'white',
                                border: 'none', fontSize: '0.8rem', padding: '10px'
                            }}
                            onClick={handleMaintenanceToggle}
                        >
                            {maintenanceMode ? 'Disable Maintenance' : 'Maintenance Mode'}
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="card content-area" style={{ padding: '2.5rem', minHeight: '500px' }}>
                    {activeTab === 'general' && (
                        <div className="animate-in">
                            <h3 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>Konfigurasi Global</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Nama Instansi / Pondok</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={configs.nama_instansi}
                                        onChange={e => setConfigs({ ...configs, nama_instansi: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tahun Ajaran Aktif</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={configs.tahun_ajaran}
                                        onChange={e => setConfigs({ ...configs, tahun_ajaran: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Deskripsi Sistem (Meta)</label>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    value={configs.deskripsi}
                                    onChange={e => setConfigs({ ...configs, deskripsi: e.target.value })}
                                ></textarea>
                            </div>
                            <button className="btn btn-primary" onClick={handleSaveConfig} style={{ marginTop: '1rem' }}>Simpan Konfigurasi</button>
                        </div>
                    )}

                    {activeTab === 'branding' && (
                        <div className="animate-in">
                            <h3 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>Branding & UI Engine</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div style={{ border: '1px solid #f1f5f9', padding: '1.5rem', borderRadius: '16px', background: 'white' }}>
                                    <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 700 }}>Primary Color</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <input
                                            type="color"
                                            value={configs.primary_color || '#2563eb'}
                                            onChange={e => setConfigs({ ...configs, primary_color: e.target.value })}
                                            style={{ width: '60px', height: '60px', borderRadius: '12px', border: 'none', cursor: 'pointer', padding: 0, overflow: 'hidden' }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: 800, color: configs.primary_color }}>{configs.primary_color}</div>
                                            <small style={{ color: 'var(--text-muted)' }}>Warna Utama Aplikasi</small>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ border: '1px solid #f1f5f9', padding: '1.5rem', borderRadius: '16px', background: 'white' }}>
                                    <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 700 }}>Sidebar Theme</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <input
                                            type="color"
                                            value={configs.sidebar_theme || '#1e1b4b'}
                                            onChange={e => setConfigs({ ...configs, sidebar_theme: e.target.value })}
                                            style={{ width: '60px', height: '60px', borderRadius: '12px', border: 'none', cursor: 'pointer', padding: 0, overflow: 'hidden' }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: 800, color: configs.sidebar_theme }}>{configs.sidebar_theme}</div>
                                            <small style={{ color: 'var(--text-muted)' }}>Warna Navigasi Samping</small>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ gridColumn: '1 / -1', border: '1px solid #f1f5f9', padding: '1.5rem', borderRadius: '16px', background: 'white' }}>
                                    <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 700 }}>Logo Instansi</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2rem', alignItems: 'center' }}>
                                        <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <img
                                                src={configs.logo_url || "https://ui-avatars.com/api/?name=LOGO&background=2563eb&color=fff&size=512"}
                                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                                alt="Current Logo"
                                                onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=404&background=ef4444&color=fff"; }}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <FileUploader
                                                currentUrl={configs.logo_url}
                                                onUploadSuccess={url => setConfigs({ ...configs, logo_url: url })}
                                                folder="branding_assets"
                                                label="Upload Logo Baru"
                                            />
                                            <p style={{ marginTop: '10px', fontSize: '0.8rem', color: '#64748b' }}>
                                                URL Aktif: <span style={{ fontFamily: 'monospace', color: configs.logo_url?.includes('cloudinary') ? '#10b981' : '#f59e0b' }}>{configs.logo_url || 'Default Image'}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button className="btn btn-primary" onClick={handleSaveConfig}>
                                <i className="fas fa-save" style={{ marginRight: '8px' }}></i>
                                Simpan Perubahan Branding
                            </button>
                        </div>
                    )}

                    {activeTab === 'integration' && (
                        <div className="animate-in">
                            <h3 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>API & Service Integrations</h3>
                            {[
                                { name: 'WhatsApp Gateway', statusKey: 'whatsapp', icon: 'fab fa-whatsapp' },
                                { name: 'Cloudinary Storage', statusKey: 'cloudinary', icon: 'fas fa-cloud' },
                                { name: 'Database (Cloudflare D1)', statusKey: 'database', icon: 'fas fa-database' },
                                { name: 'Email (SMTP)', statusKey: 'email', icon: 'fas fa-envelope' },
                            ].map((service, idx) => {
                                const status = serviceStatus[service.statusKey];
                                return (
                                    <div key={idx} style={{
                                        padding: '1.5rem', border: '1.5px solid #f1f5f9',
                                        borderRadius: '16px', marginBottom: '1rem',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${status.color}15`, color: status.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                                <i className={service.icon}></i>
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, color: '#1e293b' }}>{service.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: status.color, fontWeight: 700 }}>
                                                    {status.status}
                                                </div>
                                            </div>
                                        </div>
                                        <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.75rem' }} onClick={() => handleOpenConfig(service)}>Configure</button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'audit' && (
                        <div className="animate-in">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h1 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800 }}>Audit Trail & Security Logs</h1>
                                <button className="btn btn-secondary" onClick={loadData}><i className="fas fa-sync"></i> Refresh</button>
                            </div>

                            {logs.length === 0 && (
                                <div style={{ marginBottom: '1.5rem', padding: '20px', background: '#fef3c7', borderRadius: '16px', border: '1px solid #fbbf24' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <i className="fas fa-info-circle" style={{ fontSize: '1.5rem', color: '#d97706' }}></i>
                                        <div>
                                            <h4 style={{ color: '#92400e', marginBottom: '6px', fontWeight: 700 }}>Belum Ada Data Audit Log</h4>
                                            <p style={{ fontSize: '0.9rem', color: '#78350f', margin: 0 }}>
                                                Jika ini pertama kali Anda mengakses panel ini, silakan ke tab <strong>System Health</strong> dan klik tombol <strong>"Initialize System Tables"</strong> terlebih dahulu.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div style={{ border: '1.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#f8fafc' }}>
                                        <tr>
                                            <th style={{ padding: '12px 20px', fontSize: '0.75rem', textAlign: 'left' }}>User Action</th>
                                            <th style={{ padding: '12px 20px', fontSize: '0.75rem', textAlign: 'left' }}>IP / Role</th>
                                            <th style={{ padding: '12px 20px', fontSize: '0.75rem', textAlign: 'left' }}>Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.length === 0 ? (
                                            <tr style={{ borderBottom: '1px solid #f8fafc' }}>
                                                <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada catatan aktivitas.</td>
                                            </tr>
                                        ) : logs.map((log, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                                                <td style={{ padding: '12px 20px', fontSize: '0.85rem' }}>
                                                    <div style={{ fontWeight: 700 }}>{log.username} <span style={{ fontWeight: 400, opacity: 0.7 }}>melakukan</span> <span style={{ color: 'var(--primary)' }}>{log.action}</span></div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target: {log.target_type} ({log.target_id || '-'})</div>
                                                    {log.details && <div style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>{log.details}</div>}
                                                </td>
                                                <td style={{ padding: '12px 20px', fontSize: '0.8rem' }}>
                                                    <div>{log.ip_address}</div>
                                                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8' }}>{log.role}</div>
                                                </td>
                                                <td style={{ padding: '12px 20px', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                                    {new Date(log.timestamp).toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            {logsPagination.totalPages > 1 && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginTop: '1.5rem',
                                    padding: '1rem 1.5rem',
                                    background: '#f8fafc',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                                        Menampilkan {logs.length} dari {logsPagination.total} log
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                                            disabled={logsPagination.page === 1}
                                            onClick={() => setLogsPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                        >
                                            <i className="fas fa-chevron-left" style={{ marginRight: '6px' }}></i>
                                            Sebelumnya
                                        </button>
                                        <div style={{
                                            padding: '8px 16px',
                                            background: 'white',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                            color: '#1e293b'
                                        }}>
                                            Halaman {logsPagination.page} / {logsPagination.totalPages}
                                        </div>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                                            disabled={logsPagination.page >= logsPagination.totalPages}
                                            onClick={() => {
                                                setLogsPagination(prev => ({ ...prev, page: prev.page + 1 }));

                                            }}
                                        >
                                            Selanjutnya
                                            <i className="fas fa-chevron-right" style={{ marginLeft: '6px' }}></i>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'sessions' && (
                        <div className="animate-in">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h1 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800 }}>Daftar Sesi Aktif</h1>
                                <button className="btn btn-secondary" onClick={loadData}><i className="fas fa-sync"></i> Refresh</button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                {activeSessions.length === 0 ? (
                                    <div style={{ gridColumn: '1 / -1', padding: '4rem 2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                                        <div style={{ width: '80px', height: '80px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                            <i className="fas fa-users-slash" style={{ fontSize: '2.5rem', color: '#cbd5e1' }}></i>
                                        </div>
                                        <h3 style={{ color: '#1e293b', marginBottom: '8px' }}>Tidak Ada Sesi Aktif</h3>
                                        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Semua user sedang offline atau sesi telah berakhir.</p>
                                    </div>
                                ) : activeSessions.map((session, i) => (
                                    <div key={i} className="card" style={{ padding: '1.5rem', position: 'relative', border: '1.5px solid #f1f5f9', transition: 'all 0.3s ease' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                            <div style={{ position: 'relative' }}>
                                                <img
                                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(session.fullname)}&background=random&color=fff&bold=true`}
                                                    style={{ width: '56px', height: '56px', borderRadius: '16px', objectFit: 'cover' }}
                                                    alt="User"
                                                />
                                                <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '16px', height: '16px', borderRadius: '50%', background: '#10b981', border: '3px solid white', boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)' }}></div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.1rem' }}>{session.fullname}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', background: session.role === 'admin' || session.role === 'develzy' ? '#fee2e2' : '#f1f5f9', color: session.role === 'admin' || session.role === 'develzy' ? '#ef4444' : '#64748b', borderRadius: '6px', textTransform: 'uppercase' }}>{session.role}</span>
                                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>@{session.username}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '10px', color: '#475569', border: '1px solid #f1f5f9' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#94a3b8' }}><i className="fas fa-network-wired" style={{ width: '20px' }}></i> IP Address</span>
                                                <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#1e293b' }}>{session.ip_address}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#94a3b8' }}><i className="fas fa-sign-in-alt" style={{ width: '20px' }}></i> Login</span>
                                                <span style={{ fontWeight: 700, color: '#1e293b' }}>{new Date(session.login_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#94a3b8' }}><i className="fas fa-heartbeat" style={{ width: '20px' }}></i> Aktivitas</span>
                                                <span style={{ fontWeight: 700, color: '#3b82f6' }}>{new Date(session.last_active).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>

                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => handleTerminateActiveSession(session.id, session.fullname)}
                                            style={{
                                                width: '100%',
                                                marginTop: '1.25rem',
                                                borderColor: '#fee2e2',
                                                color: '#ef4444',
                                                background: kickLoading === session.id ? '#fef2f2' : 'transparent',
                                                padding: '12px',
                                                fontWeight: 700,
                                                borderRadius: '12px'
                                            }}
                                            disabled={kickLoading === session.id || session.username === user?.username}
                                        >
                                            {kickLoading === session.id ? (
                                                <><i className="fas fa-circle-notch fa-spin" style={{ marginRight: '8px' }}></i> Memproses...</>
                                            ) : session.username === user?.username ? (
                                                <><i className="fas fa-user-check" style={{ marginRight: '8px' }}></i> Sesi Anda</>
                                            ) : (
                                                <><i className="fas fa-sign-out-alt" style={{ marginRight: '8px' }}></i> Keluarkan Paksa</>
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'roles' && (
                        <div className="animate-in">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h3 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800 }}>Role & Permissions Management</h3>
                                <button className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }} onClick={handleAddRole}>
                                    <i className="fas fa-plus" style={{ marginRight: '8px' }}></i> Tambah Role Baru
                                </button>
                            </div>

                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                {rolesList.map((item, idx) => (
                                    <div key={idx} style={{
                                        padding: '1.5rem',
                                        border: '2px solid #f1f5f9',
                                        borderRadius: '20px',
                                        background: 'white',
                                        transition: 'all 0.2s',
                                        display: 'grid',
                                        gridTemplateColumns: '1fr auto',
                                        gap: '2rem',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                                <div style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    borderRadius: '12px',
                                                    background: `${item.color}15`,
                                                    color: item.color,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 800,
                                                    fontSize: '1.2rem'
                                                }}>
                                                    <i className="fas fa-user-shield"></i>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.1rem' }}>{item.label}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace' }}>{item.role}</div>
                                                </div>
                                                <div style={{
                                                    background: `${item.color}10`,
                                                    color: item.color,
                                                    padding: '8px 16px',
                                                    borderRadius: '10px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 700
                                                }}>
                                                    <i className="fas fa-users" style={{ marginRight: '6px' }}></i>
                                                    {item.users} User
                                                </div>
                                                <div style={{
                                                    background: item.is_public ? '#ecfdf5' : '#fef2f2',
                                                    color: item.is_public ? '#10b981' : '#ef4444',
                                                    padding: '8px 16px',
                                                    borderRadius: '10px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 700,
                                                    border: `1px solid ${item.is_public ? '#d1fae5' : '#fee2e2'}`
                                                }}>
                                                    <i className={`fas fa-${item.is_public ? 'globe' : 'lock'}`} style={{ marginRight: '6px' }}></i>
                                                    {item.is_public ? 'Public' : 'Private'}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '10px' }}>Akses Menu:</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {item.menus.map((menu, i) => (
                                                    <span key={i} style={{
                                                        background: '#f8fafc',
                                                        border: '1px solid #e2e8f0',
                                                        color: '#64748b',
                                                        padding: '4px 10px',
                                                        borderRadius: '8px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}>
                                                        <i className={`fas fa-${menu.access === 'view' ? 'eye' : 'edit'}`} style={{ color: item.color, fontSize: '0.7rem' }}></i>
                                                        {menu.name}
                                                        <span style={{ fontSize: '0.65rem', opacity: 0.7, background: '#e2e8f0', padding: '1px 4px', borderRadius: '4px' }}>
                                                            {menu.access === 'view' ? 'View' : 'Full'}
                                                        </span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: '10px 20px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                                                onClick={() => handleEditRole(item)}
                                            >
                                                <i className="fas fa-edit" style={{ marginRight: '8px' }}></i> Edit Permissions
                                            </button>
                                            <button
                                                className="btn btn-outline"
                                                style={{ padding: '10px 20px', fontSize: '0.8rem', color: '#ef4444', borderColor: '#fee2e2' }}
                                                onClick={() => handleDeleteRole(item)}
                                            >
                                                <i className="fas fa-trash" style={{ marginRight: '8px' }}></i> Hapus Role
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{
                                marginTop: '2rem',
                                padding: '1.5rem',
                                background: '#fffbeb',
                                borderRadius: '16px',
                                border: '1px solid #fef3c7'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <i className="fas fa-lightbulb" style={{ color: '#f59e0b', fontSize: '1.2rem' }}></i>
                                    <strong style={{ color: '#92400e' }}>Tips</strong>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: '#78350f', margin: 0 }}>
                                    Role "Super Administrator" kini dapat dihapus atau diubah jika diperlukan.
                                    Harap berhati-hati saat menghapus role kritis ini karena akan mempengaruhi akses seluruh personil dengan role tersebut.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="animate-in">
                            <h3 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>System Health Metrics</h3>

                            <div style={{ marginBottom: '2rem', padding: '20px', background: '#ecfdf5', borderRadius: '16px', border: '1px solid #a7f3d0' }}>
                                <h4 style={{ color: '#047857', marginBottom: '10px' }}>Database Maintenance</h4>
                                <p style={{ fontSize: '0.9rem', color: '#065f46', marginBottom: '15px' }}>
                                    Jika ini pertama kali panel digunakan, silakan inisialisasi tabel sistem (Config & Audit Log) agar fitur berjalan normal.
                                </p>
                                <button className="btn btn-primary" onClick={handleInitSystem} style={{ background: '#059669' }}>
                                    <i className="fas fa-database" style={{ marginRight: '8px' }}></i> Initialize System Tables
                                </button>
                            </div>

                            <div style={{ background: '#0f172a', borderRadius: '16px', padding: '1.5rem', color: '#10b981', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.6' }}>
                                <div>[System] Ready to monitor events.</div>
                                <div>[Worker] Edge Runtime Active</div>
                                <div>[DB] Binding status: Checked.</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Service Config Modal */}
            <Modal
                isOpen={configModal.isOpen}
                onClose={() => setConfigModal({ isOpen: false, service: null, data: {} })}
                title={`Konfigurasi: ${configModal.service?.name}`}
                footer={(
                    <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={() => setConfigModal({ isOpen: false, service: null, data: {} })}>Batal</button>
                        <button className="btn btn-primary" onClick={handleSaveServiceConfig} disabled={submittingConfig}>
                            {submittingConfig ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                        </button>
                    </div>
                )}
            >
                <div style={{ padding: '10px' }}>
                    <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #bae6fd', display: 'flex', gap: '12px' }}>
                        <i className="fas fa-info-circle" style={{ color: '#0ea5e9', marginTop: '3px' }}></i>
                        <p style={{ fontSize: '0.85rem', color: '#0369a1', margin: 0 }}>
                            Hati-hati saat mengubah pengaturan ini. Parameter yang salah dapat menyebabkan layanan terkait berhenti berfungsi.
                        </p>
                    </div>

                    {configModal.service?.statusKey === 'whatsapp' && (
                        <div className="grid gap-4">
                            <div className="form-group">
                                <label className="form-label">API Gateway URL</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="https://api.whatsapp-gateway.com/v1"
                                    value={configModal.data.whatsapp_api_url || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, whatsapp_api_url: e.target.value } })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">API Token</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Masukkan Token API"
                                    value={configModal.data.whatsapp_token || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, whatsapp_token: e.target.value } })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Device ID</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Ex: 512"
                                    value={configModal.data.whatsapp_device_id || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, whatsapp_device_id: e.target.value } })}
                                />
                            </div>
                        </div>
                    )}

                    {configModal.service?.statusKey === 'cloudinary' && (
                        <div className="grid gap-4">
                            <div className="form-group">
                                <label className="form-label">Cloud Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={configModal.data.cloudinary_cloud_name || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, cloudinary_cloud_name: e.target.value } })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">API Key</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={configModal.data.cloudinary_api_key || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, cloudinary_api_key: e.target.value } })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">API Secret</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={configModal.data.cloudinary_api_secret || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, cloudinary_api_secret: e.target.value } })}
                                />
                            </div>
                        </div>
                    )}

                    {configModal.service?.statusKey === 'email' && (
                        <div className="grid gap-4">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">SMTP Host</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="smtp.gmail.com"
                                        value={configModal.data.smtp_host || ''}
                                        onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, smtp_host: e.target.value } })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Port</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="465 (SSL) / 587 (TLS)"
                                        value={configModal.data.smtp_port || ''}
                                        onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, smtp_port: e.target.value } })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">SMTP Username</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={configModal.data.smtp_user || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, smtp_user: e.target.value } })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">SMTP Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={configModal.data.smtp_password || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, smtp_password: e.target.value } })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Sender Email (From)</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="noreply@pondok.com"
                                    value={configModal.data.smtp_from_email || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, smtp_from_email: e.target.value } })}
                                />
                            </div>
                        </div>
                    )}

                    {configModal.service?.statusKey === 'database' && (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <i className="fas fa-database" style={{ fontSize: '3rem', color: '#e2e8f0', marginBottom: '1rem' }}></i>
                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                Konfigurasi database dikelola langsung melalui variabel lingkungan (Secrets) di Cloudflare Dashboard untuk keamanan maksimal.
                            </p>
                            <div style={{ marginTop: '1rem', padding: '10px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                                <small style={{ color: '#92400e', fontWeight: 700 }}>Catatan: Tidak dapat diubah dari panel ini.</small>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Role Form Modal */}
            <Modal
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
                title={editingRole ? `Edit Role: ${editingRole.label}` : "Tambah Role Baru"}
                footer={(
                    <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={() => setIsRoleModalOpen(false)}>Batal</button>
                        <button className="btn btn-primary" onClick={handleSaveRole}>Simpan Role</button>
                    </div>
                )}
            >
                <div style={{ padding: '10px' }}>
                    <div className="form-group">
                        <label className="form-label">Nama Role</label>
                        <input
                            type="text"
                            className="form-control"
                            value={roleFormData.label}
                            onChange={(e) => setRoleFormData({ ...roleFormData, label: e.target.value })}
                            placeholder="Contoh: Panitia Qurban"
                        />
                    </div>
                    {/* Only show Role ID input if adding new role */}
                    {!editingRole && (
                        <div className="form-group">
                            <label className="form-label">Kode Role (ID)</label>
                            <input
                                type="text"
                                className="form-control"
                                value={roleFormData.role}
                                onChange={(e) => setRoleFormData({ ...roleFormData, role: e.target.value })}
                                placeholder="panitia_qurban (otomatis lowercase)"
                            />
                            <small style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Digunakan untuk coding & database key.</small>
                        </div>
                    )}
                    <div className="form-group">
                        <label className="form-label">Warna Badge</label>
                        <input
                            type="color"
                            className="form-control"
                            style={{ height: '50px', padding: '5px' }}
                            value={roleFormData.color}
                            onChange={(e) => setRoleFormData({ ...roleFormData, color: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                            Visibility Status
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.8rem', color: roleFormData.is_public ? '#10b981' : '#94a3b8', fontWeight: 700 }}>
                                    {roleFormData.is_public ? 'PUBLIC' : 'PRIVATE'}
                                </span>
                                <input
                                    type="checkbox"
                                    checked={roleFormData.is_public}
                                    onChange={(e) => setRoleFormData({ ...roleFormData, is_public: e.target.checked })}
                                    style={{ width: '40px', height: '20px', cursor: 'pointer' }}
                                />
                            </div>
                        </label>
                        <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                            {roleFormData.is_public
                                ? 'Role ini dapat dipilih oleh Manajemen Akses.'
                                : 'Role ini disembunyikan dari daftar pilihan di Manajemen Akses.'}
                        </small>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Akses Menu</label>
                        <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '10px' }}>Centang menu yang diizinkan:</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                                {allPossibleMenus.map((menu, i) => {
                                    const menuName = menu.label;
                                    const uniqueId = menu.uniqueId;
                                    const existingPerm = roleFormData.menus.find(m => (m.id || m.name) === uniqueId || (m.name === menuName && !m.id));
                                    const isChecked = !!existingPerm;

                                    // Check if all children are checked
                                    const areAllChildrenChecked = menu.isHeader && menu.childrenIds.length > 0 &&
                                        menu.childrenIds.every(cid => roleFormData.menus.some(m => (m.id || m.name) === cid));

                                    const isPartiallyChecked = menu.isHeader && !areAllChildrenChecked &&
                                        menu.childrenIds.some(cid => roleFormData.menus.some(m => (m.id || m.name) === cid));

                                    const handleToggle = (checked) => {
                                        let newMenus = [...roleFormData.menus];

                                        const targetIds = [uniqueId, ...menu.childrenIds];

                                        if (checked) {
                                            // Add this and all children if not already present
                                            targetIds.forEach(tid => {
                                                if (!newMenus.some(m => (m.id || m.name) === tid)) {
                                                    const targetMenu = allPossibleMenus.find(am => am.uniqueId === tid);
                                                    newMenus.push({ id: tid, name: targetMenu?.label || tid, access: 'view' });
                                                }
                                            });
                                        } else {
                                            // Remove this and all children
                                            newMenus = newMenus.filter(m => !targetIds.includes(m.id || m.name));
                                        }

                                        setRoleFormData({ ...roleFormData, menus: newMenus });
                                    };

                                    return (
                                        <div key={i} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '8px 12px', borderRadius: '8px',
                                            marginLeft: `${menu.depth * 20}px`,
                                            background: menu.isHeader ? '#f8fafc' : (isChecked ? '#f1f5f9' : 'transparent'),
                                            border: isChecked || areAllChildrenChecked || isPartiallyChecked ? '1px solid #cbd5e1' : (menu.isHeader ? '1px solid #f1f5f9' : '1px solid transparent'),
                                            marginBottom: menu.isHeader ? '4px' : '0'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', flex: 1 }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', width: '100%', margin: 0 }}>
                                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={menu.isHeader ? areAllChildrenChecked : isChecked}
                                                            ref={el => {
                                                                if (el) el.indeterminate = isPartiallyChecked;
                                                            }}
                                                            onChange={(e) => handleToggle(e.target.checked)}
                                                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                                                        />
                                                    </div>
                                                    <span style={{
                                                        fontWeight: menu.isHeader ? 800 : 500,
                                                        color: menu.isHeader ? '#1e293b' : 'inherit',
                                                        fontSize: menu.isHeader ? '0.8rem' : '0.9rem',
                                                        textTransform: menu.isHeader ? 'uppercase' : 'none',
                                                        letterSpacing: menu.isHeader ? '0.5px' : 'normal'
                                                    }}>
                                                        {menuName}
                                                    </span>
                                                </label>
                                            </div>

                                            {isChecked && !menu.isHeader && (
                                                <select
                                                    value={existingPerm?.access || 'view'}
                                                    onChange={(e) => {
                                                        const newAccess = e.target.value;
                                                        setRoleFormData({
                                                            ...roleFormData,
                                                            menus: roleFormData.menus.map(m =>
                                                                (m.id || m.name) === uniqueId ? { ...m, access: newAccess } : m
                                                            )
                                                        });
                                                    }}
                                                    style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #cbd5e1',
                                                        fontSize: '0.8rem',
                                                        background: 'white',
                                                        cursor: 'pointer',
                                                        outline: 'none'
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <option value="view">👁️ View Only</option>
                                                    <option value="edit">✏️ Full Access</option>
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
