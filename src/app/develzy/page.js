'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import { apiCall } from '@/lib/utils';
import dynamic from 'next/dynamic';
import './develzy.css';

// Dynamic Imports for Tab Components
const GeneralTab = dynamic(() => import('./components/GeneralTab'), { loading: () => <p className="p-4 text-slate-400">Loading Module...</p> });
const BrandingTab = dynamic(() => import('./components/BrandingTab'), { loading: () => <p className="p-4 text-slate-400">Loading UI Engine...</p> });
const IntegrationTab = dynamic(() => import('./components/IntegrationTab'), { loading: () => <p className="p-4 text-slate-400">Loading Integrations...</p> });
const AuditTab = dynamic(() => import('./components/AuditTab'), { loading: () => <p className="p-4 text-slate-400">Loading Logs...</p> });
const SessionsTab = dynamic(() => import('./components/SessionsTab'), { loading: () => <p className="p-4 text-slate-400">Loading Sessions...</p> });
const RolesTab = dynamic(() => import('./components/RolesTab'), { loading: () => <p className="p-4 text-slate-400">Loading Roles...</p> });
const SystemTab = dynamic(() => import('./components/SystemTab'), { loading: () => <p className="p-4 text-slate-400">Loading Diagnostics...</p> });

export default function DevelzyControlPage() {
    const { user, isDevelzy, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'general';
    const { showToast } = useToast();
    const isMounted = useRef(false);

    // Global State
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    // Data State (Managed here, passed to tabs)
    const [configs, setConfigs] = useState({
        nama_instansi: 'Pondok Pesantren Darussalam Lirboyo',
        tahun_ajaran: '2025/2026',
        deskripsi: 'Sistem Informasi Manajemen Terpadu',
        logo_url: '',
        primary_color: '#2563eb',
        sidebar_theme: '#1e1b4b'
    });

    const [systemStats, setSystemStats] = useState({
        uptime: 'Loading...',
        requests: 'Standby',
        cpu: 'Optimal',
        memory: 'Optimized'
    });
    const [dbHealth, setDbHealth] = useState({});

    const [logs, setLogs] = useState([]);
    const [logsPagination, setLogsPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

    const [activeSessions, setActiveSessions] = useState([]);
    const [rolesList, setRolesList] = useState([]);

    // Handlers
    const handleMaintenanceToggle = async () => {
        try {
            const newMode = !maintenanceMode;
            await apiCall('updateConfig', 'POST', { data: { key: 'maintenance_mode', value: newMode.toString() } });
            setMaintenanceMode(newMode);
            showToast(`Maintenance Mode ${newMode ? 'ACTIVATED' : 'DEACTIVATED'}`, newMode ? "warning" : "success");
        } catch (e) {
            showToast("Gagal mengubah maintenance mode", "error");
        }
    };

    const loadSystemStats = async () => {
        try {
            const now = new Date();
            const deployTime = new Date('2025-12-29T00:00:00');
            const uptimeMs = now - deployTime;
            const uptimeDays = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
            const uptimeHours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

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
            console.error(e);
        }
    };

    const loadData = async () => {
        try {
            // Configs (General/Branding)
            if (activeTab === 'general' || activeTab === 'branding') {
                const res = await apiCall('getConfigs', 'GET');
                if (res && Array.isArray(res) && isMounted.current) {
                    const newConfigs = { ...configs };
                    res.forEach(item => {
                        if (newConfigs.hasOwnProperty(item.key)) newConfigs[item.key] = item.value;
                        if (item.key === 'maintenance_mode') setMaintenanceMode(item.value === 'true');
                    });
                    setConfigs(newConfigs);
                }
            }

            // Audit Logs
            if (activeTab === 'audit') {
                const res = await apiCall('getAuditLogs', 'GET', { page: logsPagination.page, limit: logsPagination.limit });
                if (isMounted.current) {
                    if (res && res.data) {
                        setLogs(res.data);
                        setLogsPagination(res.pagination);
                    } else {
                        setLogs([]);
                    }
                }
            }

            // Sessions
            if (activeTab === 'sessions') {
                const res = await apiCall('getActiveSessions', 'GET');
                if (isMounted.current) setActiveSessions(Array.isArray(res) ? res : []);
            }

            // Roles
            if (activeTab === 'roles') {
                let res = await apiCall('getData', 'GET', { type: 'roles' });
                // Simple seeding check could go here if really needed, but better in API.
                if (isMounted.current && res) {
                    setRolesList(res.map(r => ({
                        ...r,
                        menus: r.menus ? (typeof r.menus === 'string' ? JSON.parse(r.menus) : r.menus) : []
                    })));
                }
            }
        } catch (e) {
            console.error("Load data error", e);
        }
    };

    // Effects
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

        // Polling
        const interval = setInterval(() => {
            if (activeTab === 'sessions' || activeTab === 'system') {
                loadData();
                loadSystemStats();
            }
        }, 15000);

        return () => {
            isMounted.current = false;
            clearInterval(interval);
        };
    }, [isDevelzy, authLoading, activeTab, router, logsPagination.page]);

    // Apply basic branding CSS vars
    useEffect(() => {
        if (configs.primary_color) {
            document.documentElement.style.setProperty('--primary', configs.primary_color);
            document.documentElement.style.setProperty('--accent', configs.primary_color);
        }
        if (configs.sidebar_theme) {
            document.documentElement.style.setProperty('--sidebar-bg', configs.sidebar_theme);
        }
    }, [configs.primary_color, configs.sidebar_theme]);

    if (authLoading) return <div className="flex h-screen items-center justify-center bg-[#020617] text-[#10b981]">Initializing Core...</div>;

    if (!isDevelzy) return null;

    return (
        <div className="develzy-page-container">
            <div className="view-container">
                {/* Header and Stats reused from old code but simplified */}
                <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.7rem', marginBottom: '8px' }}>
                            <i className="fas fa-microchip"></i>
                            Core Instance: Online
                        </div>
                        <h1 className="outfit" style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>
                            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Control
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

                {/* Quick Stats Grid */}
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
                    <div className="develzy-content-card" style={{
                        background: 'rgba(15, 23, 42, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '24px', padding: '2.5rem',
                        minHeight: '600px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
                    }}>
                        {activeTab === 'general' && <GeneralTab configs={configs} setConfigs={setConfigs} />}
                        {activeTab === 'branding' && <BrandingTab configs={configs} setConfigs={setConfigs} />}
                        {activeTab === 'integration' && <IntegrationTab />}
                        {activeTab === 'audit' && <AuditTab logs={logs} pagination={logsPagination} onPageChange={(p) => setLogsPagination({ ...logsPagination, page: p })} onRefresh={loadData} />}
                        {activeTab === 'sessions' && <SessionsTab activeSessions={activeSessions} onRefresh={loadData} />}
                        {activeTab === 'roles' && <RolesTab rolesList={rolesList} onRefresh={loadData} />}
                        {activeTab === 'system' && <SystemTab dbHealth={dbHealth} onRefresh={() => { loadData(); loadSystemStats(); }} />}
                    </div>
                </div>
            </div>
        </div>
    );
}
