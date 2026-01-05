'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import { apiCall } from '@/lib/utils';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import FileUploader from '@/components/FileUploader';
import { NAV_ITEMS } from '@/lib/navConfig';

export default function DevelzyControlPage() {
    const { user, isDevelzy, loading: authLoading, refreshConfig } = useAuth(); // Pakai isDevelzy
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab') || 'general';
    const activeTab = tabParam;
    const { showToast } = useToast();
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [loading, setLoading] = useState(false);
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
    const [dbHealth, setDbHealth] = useState({});

    // Service Status State
    const [serviceStatus, setServiceStatus] = useState({
        whatsapp: { status: 'Checking...', color: '#94a3b8' },
        cloudinary: { status: 'Checking...', color: '#94a3b8' },
        database: { status: 'Checking...', color: '#94a3b8' },
        email: { status: 'Not Configured', color: '#94a3b8' }
    });

    // Real-time Polling for Sessions & System Stats
    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }

        // Initial load
        loadData();
        loadSystemStats();

        // Protocol Sync Interval (Every 15 seconds)
        const pollInterval = setInterval(() => {
            if (activeTab === 'sessions' || activeTab === 'system') {
                loadData();
                loadSystemStats();
            }
        }, 15000);

        return () => clearInterval(pollInterval);
    }, [activeTab]);

    // Real-time Branding Preview
    useEffect(() => {
        if (activeTab === 'branding') {
            if (configs.primary_color) {
                document.documentElement.style.setProperty('--primary', configs.primary_color);
                document.documentElement.style.setProperty('--accent', configs.primary_color);
            }
            if (configs.sidebar_theme) {
                document.documentElement.style.setProperty('--sidebar-bg', configs.sidebar_theme);
            }
        }
    }, [configs.primary_color, configs.sidebar_theme, activeTab]);

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
    const [confirmKick, setConfirmKick] = useState({ isOpen: false, sessionId: null, username: '' });

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

    const handleTestService = async (serviceName) => {
        try {
            const res = await apiCall('testService', 'POST', { data: { service: serviceName } });
            if (res.status === 'success') {
                showToast(res.message, "success");
                checkServiceStatus();
            } else {
                showToast(res.message, "error");
            }
        } catch (e) {
            showToast("Gagal melakukan pengetesan layanan.", "error");
        }
    };

    const handleTerminateActiveSession = (sessionId, username) => {
        setConfirmKick({ isOpen: true, sessionId, username });
    };

    const executeTerminateSession = async () => {
        const { sessionId, username } = confirmKick;
        setKickLoading(sessionId);
        try {
            await apiCall('terminateSession', 'POST', { data: { tokenId: sessionId, username } });
            showToast("User Berhasil Dikeluarkan!", "success");
            setConfirmKick({ isOpen: false, sessionId: null, username: '' });
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

    const safeTime = (dateStr) => {
        if (!dateStr) return '--:--';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '--:--';
            return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '--:--';
        }
    };

    const loadSystemStats = async () => {
        try {
            // Calculate uptime
            const now = new Date();
            const deployTime = new Date('2025-12-29T00:00:00');
            const uptimeMs = now - deployTime;
            const uptimeDays = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
            const uptimeHours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            // Get database stats
            const [dbStats, health] = await Promise.all([
                apiCall('getQuickStats', 'GET'),
                apiCall('getSystemHealth', 'GET')
            ]);

            if (isMounted.current) {
                setSystemStats({
                    uptime: uptimeDays > 0 ? `${uptimeDays} Hari, ${uptimeHours} Jam` : `${uptimeHours} Jam`,
                    requests: dbStats ? 'Connected' : 'Disconnected',
                    cpu: 'Stable',
                    memory: 'Optimized'
                });
                setDbHealth(health || {});
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
                background: #020617;
                border-radius: 32px;
                padding: 4rem 3.5rem;
                max-width: 680px;
                width: 90%;
                border: 1px solid rgba(255,255,255,0.1);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
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
                        color: #f8fafc;
                        margin-bottom: 1.25rem;
                        letter-spacing: -0.5px;
                    ">${actionText} Mode Pemeliharaan</h2>
                    <p style="
                        font-size: 1.2rem;
                        color: #94a3b8;
                        line-height: 1.7;
                        margin: 0 auto;
                        max-width: 500px;
                        margin-bottom: 2rem;
                    ">
                        ${warningText}
                    </p>
                    
                    ${!maintenanceMode ? `
                        <div style="text-align: left; background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 2rem;">
                            <label style="display: block; font-weight: 800; color: #cbd5e1; margin-bottom: 10px; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">Durasi Pemeliharaan (Menit)</label>
                            <input type="number" id="maintMinutes" value="60" min="1" max="1440" style="
                                width: 100%;
                                padding: 14px 18px;
                                border-radius: 14px;
                                border: 1px solid rgba(255,255,255,0.1);
                                background: rgba(0,0,0,0.2);
                                font-size: 1.4rem;
                                font-weight: 800;
                                color: #10b981;
                                outline: none;
                                transition: all 0.2s;
                                font-family: 'monospace';
                            " onfocus="this.style.borderColor='#10b981'; this.style.boxShadow='0 0 10px rgba(16,185,129,0.2)'" onblur="this.style.borderColor='rgba(255,255,255,0.1)'; this.style.boxShadow='none'">
                            <p style="font-size: 0.8rem; color: #475569; margin-top: 10px; font-weight: 600;">Otorisasi kunci sistem untuk jangka waktu yang ditentukan.</p>
                        </div>
                    ` : ''}

                    <span style="
                        display: inline-block;
                        background: ${maintenanceMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
                        color: ${maintenanceMode ? '#10b981' : '#f87171'};
                        padding: 12px 24px;
                        border-radius: 12px;
                        font-size: 1.05rem;
                        font-weight: 800;
                        border: 1px solid ${maintenanceMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
                    ">
                        <i class="fas fa-${maintenanceMode ? 'power-off' : 'shield-alt'}" style="margin-right: 8px; font-size: 1.1rem;"></i>
                        ${maintenanceMode ? 'PROTOCOL: RESTORE ONLINE' : 'PROTOCOL: ADMIN_RESTRICTED'}
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
                        border: 1px solid rgba(255,255,255,0.1);
                        background: rgba(255,255,255,0.05);
                        color: #94a3b8;
                        border-radius: 16px;
                        font-size: 1.1rem;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='rgba(255,255,255,0.08)'; this.style.color='#f1f5f9'" onmouseout="this.style.background='rgba(255,255,255,0.05)'; this.style.color='#94a3b8'">
                        Abort Action
                    </button>
                    <button id="confirmMaintenance" style="
                        flex: 1;
                        padding: 18px 32px;
                        border: none;
                        background: ${maintenanceMode ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'};
                        color: white;
                        border-radius: 16px;
                        font-size: 1.1rem;
                        font-weight: 800;
                        cursor: pointer;
                        box-shadow: 0 6px 16px ${maintenanceMode ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'};
                        transition: all 0.2s;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px ${maintenanceMode ? 'rgba(16, 185, 129, 0.45)' : 'rgba(239, 68, 68, 0.45)'}'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 6px 16px ${maintenanceMode ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}'">
                        <i class="fas fa-${maintenanceMode ? 'check' : 'power-off'}" style="margin-right: 10px; font-size: 1.15rem;"></i>
                        Authorize ${actionText}
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
            <ConfirmModal
                isOpen={confirmKick.isOpen}
                onClose={() => setConfirmKick({ isOpen: false, sessionId: null, username: '' })}
                onConfirm={executeTerminateSession}
                title="Keluarkan Paksa User?"
                message={`Apakah Anda yakin ingin mengeluarkan paksa user ${confirmKick.username}? Sesi mereka akan segera dibatalkan.`}
                confirmText="Ya, Keluarkan"
                loading={kickLoading === confirmKick.sessionId}
            />
            {/* --- COMPACT SYSTEM HEADER --- */}
            <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.7rem', marginBottom: '8px' }}>
                        <i className="fas fa-microchip"></i>
                        Core Instance: Online
                    </div>
                    <h1 className="outfit" style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>
                        {tabs.find(t => t.id === activeTab)?.label || 'System Control'}
                    </h1>
                </div>

                <div className="maintenance-box" style={{ padding: '12px 24px', background: maintenanceMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', borderRadius: '16px', border: `1px solid ${maintenanceMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`, display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: maintenanceMode ? '#f87171' : '#34d399', textTransform: 'uppercase' }}>Service Status</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{maintenanceMode ? 'Maintenance Mode' : 'Production Live'}</div>
                    </div>
                    <button
                        onClick={handleMaintenanceToggle}
                        style={{ background: maintenanceMode ? '#ef4444' : '#10b981', border: 'none', padding: '10px 16px', borderRadius: '12px', color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem', boxShadow: `0 4px 12px ${maintenanceMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}` }}
                    >
                        {maintenanceMode ? 'Go Live' : 'Maintenance'}
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid - Specialized Dark Style */}
            <div className="quick-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '3rem' }}>
                {[
                    { label: 'System Uptime', value: systemStats.uptime, icon: 'fas fa-clock', color: '#6366f1' },
                    { label: 'Database Health', value: systemStats.requests, icon: 'fas fa-database', color: '#10b981' },
                    { label: 'Security Level', value: 'High-Alert', icon: 'fas fa-shield-alt', color: '#f59e0b' },
                    { label: 'Core Version', value: 'v3.2.0-ELZ', icon: 'fas fa-code-branch', color: '#ec4899' },
                ].map((stat, i) => (
                    <div key={i} style={{
                        background: 'rgba(15, 23, 42, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '20px', padding: '1.25rem',
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        backdropFilter: 'blur(5px)'
                    }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${stat.color}15`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                            <i className={stat.icon}></i>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f1f5f9' }}>{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="view-container" style={{ padding: 0 }}>
                {/* Main Content Area */}
                <div className="develzy-content-card" style={{
                    background: 'rgba(15, 23, 42, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '24px', padding: '2.5rem',
                    minHeight: '600px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
                }}>
                    {activeTab === 'general' && (
                        <div className="animate-in">
                            <h3 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem', color: '#f8fafc' }}>Konfigurasi Global</h3>
                            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem' }}>Nama Instansi / Pondok</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', padding: '12px 16px', borderRadius: '12px', width: '100%' }}
                                        value={configs.nama_instansi}
                                        onChange={e => setConfigs({ ...configs, nama_instansi: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem' }}>Tahun Ajaran Aktif</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', padding: '12px 16px', borderRadius: '12px', width: '100%' }}
                                        value={configs.tahun_ajaran}
                                        onChange={e => setConfigs({ ...configs, tahun_ajaran: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginTop: '1.5rem' }}>
                                <label className="form-label" style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem' }}>Deskripsi Sistem (Meta)</label>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', padding: '12px 16px', borderRadius: '12px', width: '100%', resize: 'none' }}
                                    value={configs.deskripsi}
                                    onChange={e => setConfigs({ ...configs, deskripsi: e.target.value })}
                                ></textarea>
                            </div>
                            <button className="btn" onClick={handleSaveConfig} style={{ marginTop: '2rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '12px 24px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', fontWeight: 800 }}>
                                <i className="fas fa-save" style={{ marginRight: '8px' }}></i> Simpan Konfigurasi
                            </button>
                        </div>
                    )}

                    {activeTab === 'branding' && (
                        <div className="animate-in">
                            <h3 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem', color: '#f8fafc' }}>Branding & UI Engine</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '1.75rem', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: configs.primary_color || '#2563eb', boxShadow: `0 0 10px ${configs.primary_color || '#2563eb'}` }}></div>
                                        <label style={{ fontWeight: 800, color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Primary Interface Color</label>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="color"
                                                value={configs.primary_color || '#2563eb'}
                                                onChange={e => setConfigs({ ...configs, primary_color: e.target.value })}
                                                style={{ width: '70px', height: '70px', borderRadius: '16px', border: '2px solid rgba(255,255,255,0.1)', cursor: 'pointer', padding: 0, overflow: 'hidden', background: 'transparent' }}
                                            />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1.2rem', fontFamily: 'monospace' }}>{configs.primary_color?.toUpperCase()}</div>
                                            <small style={{ color: '#475569', fontSize: '0.75rem' }}>HEX PROTOCOL</small>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '1.75rem', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: configs.sidebar_theme || '#1e1b4b', boxShadow: `0 0 10px ${configs.sidebar_theme || '#1e1b4b'}` }}></div>
                                        <label style={{ fontWeight: 800, color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Navigation Backdrop</label>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                        <input
                                            type="color"
                                            value={configs.sidebar_theme || '#1e1b4b'}
                                            onChange={e => setConfigs({ ...configs, sidebar_theme: e.target.value })}
                                            style={{ width: '70px', height: '70px', borderRadius: '16px', border: '2px solid rgba(255,255,255,0.1)', cursor: 'pointer', padding: 0, overflow: 'hidden', background: 'transparent' }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1.2rem', fontFamily: 'monospace' }}>{configs.sidebar_theme?.toUpperCase()}</div>
                                            <small style={{ color: '#475569', fontSize: '0.75rem' }}>HEX PROTOCOL</small>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ gridColumn: '1 / -1', border: '1px solid rgba(255,255,255,0.08)', padding: '2rem', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)' }}>
                                    <label style={{ display: 'block', marginBottom: '1.5rem', fontWeight: 800, color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Identity & Branding Logo</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '3rem', alignItems: 'center' }}>
                                        <div style={{
                                            padding: '1.5rem',
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: '24px',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            width: '160px',
                                            height: '160px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)'
                                        }}>
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
                                                label="Upload Identity Asset"
                                            />
                                            <div style={{
                                                marginTop: '1.5rem',
                                                padding: '10px 15px',
                                                background: 'rgba(0,0,0,0.2)',
                                                borderRadius: '10px',
                                                fontSize: '0.75rem',
                                                fontFamily: 'monospace',
                                                color: '#475569',
                                                border: '1px solid rgba(255,255,255,0.03)',
                                                wordBreak: 'break-all'
                                            }}>
                                                PATH: <span style={{ color: configs.logo_url?.includes('cloudinary') ? '#10b981' : '#f59e0b' }}>{configs.logo_url || 'DEFAULT_IDENTIFIER'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button className="btn" onClick={handleSaveConfig} style={{ marginTop: '2rem', padding: '14px 28px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.2)', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.3s' }}>
                                <i className="fas fa-microchip" style={{ marginRight: '8px' }}></i> Overwrite Global Branding
                            </button>
                        </div>
                    )}

                    {activeTab === 'integration' && (
                        <div className="animate-in">
                            <h3 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem', color: '#f8fafc' }}>API & Service Integrations</h3>
                            {[
                                { name: 'WhatsApp Gateway', statusKey: 'whatsapp', icon: 'fab fa-whatsapp' },
                                { name: 'Cloudinary Storage', statusKey: 'cloudinary', icon: 'fas fa-cloud' },
                                { name: 'Database (Cloudflare D1)', statusKey: 'database', icon: 'fas fa-database' },
                                { name: 'Email (SMTP)', statusKey: 'email', icon: 'fas fa-envelope' },
                            ].map((service, idx) => {
                                const status = serviceStatus[service.statusKey];
                                return (
                                    <div key={idx} style={{
                                        padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '20px', marginBottom: '1rem',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        background: 'rgba(255,255,255,0.02)',
                                        backdropFilter: 'blur(10px)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${status.color}15`, color: status.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', border: `1px solid ${status.color}30` }}>
                                                <i className={service.icon}></i>
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1.1rem' }}>{service.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: status.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    {status.status}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {(service.statusKey === 'whatsapp' || service.statusKey === 'cloudinary') && (
                                                <button
                                                    className="btn"
                                                    style={{ padding: '10px 18px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                                    onClick={() => handleTestService(service.statusKey)}
                                                >
                                                    <i className="fas fa-vial" style={{ marginRight: '6px' }}></i> Test
                                                </button>
                                            )}
                                            <button
                                                className="btn"
                                                style={{ padding: '10px 18px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', color: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: 700 }}
                                                onClick={() => handleOpenConfig(service)}
                                            >
                                                Configure
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'audit' && (
                        <div className="animate-in">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <div>
                                    <h1 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>Audit Trail & Security Logs</h1>
                                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                                        <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i> Data log dihapus otomatis setiap 24 jam untuk menjaga performa.
                                    </p>
                                </div>
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

                            <div className="develzy-audit-table-container">
                                <table className="develzy-table">
                                    <thead>
                                        <tr>
                                            <th>User Action</th>
                                            <th>IP / Role</th>
                                            <th>Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Belum ada catatan aktivitas.</td>
                                            </tr>
                                        ) : logs.map((log, i) => (
                                            <tr key={i}>
                                                <td>
                                                    <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{log.username} <span style={{ fontWeight: 400, opacity: 0.7 }}>melakukan</span> <span style={{ color: '#10b981' }}>{log.action}</span></div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Target: {log.target_type} ({log.target_id || '-'})</div>
                                                    {log.details && <div style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '4px', color: '#94a3b8' }}>{log.details}</div>}
                                                </td>
                                                <td style={{ fontSize: '0.8rem' }}>
                                                    <div>{log.ip_address}</div>
                                                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8' }}>{log.role}</div>
                                                </td>
                                                <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                                    {new Date(log.timestamp).toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <button
                                    className="btn"
                                    style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
                                    disabled={logsPagination.page <= 1}
                                    onClick={() => setLogsPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                >
                                    <i className="fas fa-chevron-left" style={{ marginRight: '6px' }}></i>
                                    Sebelumnya
                                </button>
                                <div style={{
                                    padding: '8px 16px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    color: '#cbd5e1'
                                }}>
                                    Halaman {logsPagination.page} / {logsPagination.totalPages}
                                </div>
                                <button
                                    className="btn"
                                    style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
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

                    {activeTab === 'sessions' && (
                        <div className="animate-in">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h1 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800 }}>Daftar Sesi Aktif</h1>
                                <button className="btn btn-secondary" onClick={loadData}><i className="fas fa-sync"></i> Refresh</button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                {activeSessions.length === 0 ? (
                                    <div style={{ gridColumn: '1 / -1', padding: '4rem 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '2px dashed rgba(255,255,255,0.1)' }}>
                                        <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                            <i className="fas fa-users-slash" style={{ fontSize: '2.5rem', color: '#475569' }}></i>
                                        </div>
                                        <h3 style={{ color: '#f1f5f9', marginBottom: '8px' }}>Tidak Ada Sesi Aktif</h3>
                                        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Semua user sedang offline atau sesi telah berakhir.</p>
                                    </div>
                                ) : activeSessions.map((session, i) => (
                                    <div key={i} className="develzy-card" style={{ position: 'relative' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                            <div style={{ position: 'relative' }}>
                                                <img
                                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(session.fullname)}&background=random&color=fff&bold=true`}
                                                    style={{ width: '56px', height: '56px', borderRadius: '16px', objectFit: 'cover' }}
                                                    alt="User"
                                                />
                                                <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '16px', height: '16px', borderRadius: '50%', background: '#10b981', border: '3px solid #0f172a', boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)' }}></div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1.1rem' }}>{session.fullname}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span className="develzy-badge" style={{ background: session.role === 'admin' || session.role === 'develzy' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)', color: session.role === 'admin' || session.role === 'develzy' ? '#f87171' : '#94a3b8' }}>{session.role}</span>
                                                    <span style={{ fontSize: '0.75rem', color: '#475569' }}>@{session.username}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="develzy-glass-card" style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#475569' }}><i className="fas fa-network-wired" style={{ width: '20px' }}></i> IP Address</span>
                                                <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#f1f5f9' }}>{session.ip_address}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#475569' }}><i className="fas fa-desktop" style={{ width: '20px' }}></i> Device</span>
                                                <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{session.user_agent?.includes('Windows') ? 'Windows / Laptop' : session.user_agent?.includes('Android') ? 'Android / Mobile' : 'Unknown Device'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#475569' }}><i className="fas fa-clock" style={{ width: '20px' }}></i> Login</span>
                                                <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{safeTime(session.login_at)}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleTerminateActiveSession(session.id, session.fullname)}
                                            className="develzy-btn-kick"
                                            style={{
                                                background: kickLoading === session.id ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                            }}
                                            disabled={kickLoading === session.id || session.username === user?.username}
                                        >
                                            {kickLoading === session.id ? (
                                                <><i className="fas fa-circle-notch fa-spin" style={{ marginRight: '8px' }}></i> Terminating...</>
                                            ) : session.username === user?.username ? (
                                                <><i className="fas fa-user-check" style={{ marginRight: '8px' }}></i> Active Session (You)</>
                                            ) : (
                                                <><i className="fas fa-power-off" style={{ marginRight: '8px' }}></i> Kick User</>
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
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="animate-in">
                            <h3 className="outfit" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>System Integrity & Health Dashboard</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '1px' }}>Database Record Counts</div>
                                    <div style={{ display: 'grid', gap: '10px' }}>
                                        {Object.entries(dbHealth).map(([table, count]) => (
                                            <div key={table} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                                                <span style={{ fontWeight: 600, textTransform: 'capitalize', color: '#94a3b8' }}>{table.replace('_', ' ')}</span>
                                                <span style={{ fontWeight: 800, color: '#10b981' }}>{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                                            <div style={{ width: '40px', height: '40px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <i className="fas fa-microchip"></i>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>Runtime Engine</div>
                                                <div style={{ fontWeight: 800, color: '#f1f5f9' }}>Cloudflare Edge (V8)</div>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.6' }}>
                                            Sistem berjalan di infrastruktur serverless global dengan latensi rendah dan auto-scaling cerdas.
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <h4 style={{ fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 800, color: '#f1f5f9' }}>Maintenance Tools</h4>
                                        <button
                                            className="btn"
                                            onClick={handleInitSystem}
                                            style={{ width: '100%', justifyContent: 'center', padding: '12px', background: 'rgba(255,255,255,0.05)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', fontWeight: 700 }}
                                        >
                                            <i className="fas fa-layer-group" style={{ marginRight: '8px', color: '#10b981' }}></i> Sync Table Schemas
                                        </button>
                                        <p style={{ fontSize: '0.7rem', color: '#475569', marginTop: '10px', textAlign: 'center' }}>
                                            Update struktur tabel database ke versi terbaru.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: '#0f172a', borderRadius: '24px', padding: '2rem', color: '#10b981', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.8', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
                                <div style={{ color: '#64748b', marginBottom: '10px', fontSize: '0.75rem', letterSpacing: '1px' }}>SYSTEM CONSOLE OUTPUT</div>
                                <div><span style={{ opacity: 0.5 }}>[{new Date().toLocaleTimeString()}]</span> [Monitor] All services reporting healthy.</div>
                                <div><span style={{ opacity: 0.5 }}>[{new Date().toLocaleTimeString()}]</span> [Security] Integrity check passed.</div>
                                <div><span style={{ opacity: 0.5 }}>[{new Date().toLocaleTimeString()}]</span> [DB] Connection to sim-ppds-db-v2 established.</div>
                                <div><span style={{ opacity: 0.5 }}>[{new Date().toLocaleTimeString()}]</span> [App] DEVELZY Control Panel v3.5.0 ready.</div>
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
                    <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.1)', display: 'flex', gap: '12px' }}>
                        <i className="fas fa-info-circle" style={{ color: '#3b82f6', marginTop: '3px' }}></i>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
                            Hati-hati saat mengubah pengaturan ini. Parameter yang salah dapat menyebabkan layanan terkait berhenti berfungsi.
                        </p>
                    </div>

                    {configModal.service?.statusKey === 'whatsapp' && (
                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            <div className="form-group">
                                <label className="develzy-label">API Gateway Interface</label>
                                <input
                                    type="text"
                                    className="develzy-input"
                                    placeholder="https://api.whatsapp-gateway.com/v1"
                                    value={configModal.data.whatsapp_api_url || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, whatsapp_api_url: e.target.value } })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="develzy-label">Authorization Secret (Token)</label>
                                <input
                                    type="password"
                                    className="develzy-input"
                                    placeholder="Masukkan Token API"
                                    value={configModal.data.whatsapp_token || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, whatsapp_token: e.target.value } })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="develzy-label">Default Transmission Channel (ID)</label>
                                <input
                                    type="text"
                                    className="develzy-input"
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
                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem' }}>SMTP Host Protocol</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', padding: '10px 14px', borderRadius: '10px', width: '100%' }}
                                        placeholder="smtp.gmail.com"
                                        value={configModal.data.smtp_host || ''}
                                        onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, smtp_host: e.target.value } })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem' }}>Port</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', padding: '10px 14px', borderRadius: '10px', width: '100%' }}
                                        placeholder="465 / 587"
                                        value={configModal.data.smtp_port || ''}
                                        onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, smtp_port: e.target.value } })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem' }}>Credential Identity (User)</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', padding: '10px 14px', borderRadius: '10px', width: '100%' }}
                                    value={configModal.data.smtp_user || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, smtp_user: e.target.value } })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem' }}>Secure Access Key (Pass)</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', padding: '10px 14px', borderRadius: '10px', width: '100%' }}
                                    value={configModal.data.smtp_password || ''}
                                    onChange={e => setConfigModal({ ...configModal, data: { ...configModal.data, smtp_password: e.target.value } })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem' }}>Outbound Alias (Sender)</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', padding: '10px 14px', borderRadius: '10px', width: '100%' }}
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
                    {/* Only show Role ID input if adding new role */}
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
                        <label className="form-label" style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem' }}>Warna Badge</label>
                        <input
                            type="color"
                            className="form-control"
                            style={{ height: '50px', padding: '5px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', width: '100%', cursor: 'pointer' }}
                            value={roleFormData.color}
                            onChange={(e) => setRoleFormData({ ...roleFormData, color: e.target.value })}
                        />
                    </div>
                    <div className="form-group" style={{ marginTop: '1.25rem' }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem' }}>
                            Visibility Status
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.8rem', color: roleFormData.is_public ? '#10b981' : '#f87171', fontWeight: 800 }}>
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
                        <small style={{ color: '#475569', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                            {roleFormData.is_public
                                ? 'Role ini dapat dipilih oleh Manajemen Akses.'
                                : 'Role ini disembunyikan dari daftar pilihan di Manajemen Akses.'}
                        </small>
                    </div>
                    <div className="form-group" style={{ marginTop: '1.5rem' }}>
                        <label className="form-label" style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem', marginBottom: '1rem', display: 'block' }}>Akses Menu</label>
                        <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <p style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '1.5rem', fontWeight: 700 }}>Pilih protokol akses yang diizinkan:</p>
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

        </div >
    );
}
