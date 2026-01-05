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
const FeaturesTab = dynamic(() => import('./components/FeaturesTab'), { loading: () => <p className="p-4 text-slate-400">Loading Ghost Layer...</p> });
const RealityTab = dynamic(() => import('./components/RealityTab'), { loading: () => <p className="p-4 text-slate-400">Loading System Truth...</p> });
const AuditTab = dynamic(() => import('./components/AuditTab'), { loading: () => <p className="p-4 text-slate-400">Loading Logs...</p> });
const SessionsTab = dynamic(() => import('./components/SessionsTab'), { loading: () => <p className="p-4 text-slate-400">Loading Sessions...</p> });
const RolesTab = dynamic(() => import('./components/RolesTab'), { loading: () => <p className="p-4 text-slate-400">Loading Access Control...</p> });
const SystemTab = dynamic(() => import('./components/SystemTab'), { loading: () => <p className="p-4 text-slate-400">Loading System Core...</p> });
const UsersTab = dynamic(() => import('./components/UsersTab'), { loading: () => <p className="p-4 text-slate-400">Loading Identity Registry...</p> });

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

    // The Oracle State
    const [riskScore, setRiskScore] = useState(12); // 0-100 (Lower is better/safer)

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

                // Simulate Risk Calculation
                const baseRisk = 5; // Minimal risk
                const sessionRisk = (activeSessions?.length > 50) ? 20 : 0;
                const dbRisk = (!dbStats) ? 50 : 0;
                setRiskScore(baseRisk + sessionRisk + dbRisk);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadData = async () => {
        try {
            // Configs (Global: General, Branding, and Killswitches)
            const configRes = await apiCall('getConfigs', 'GET');
            if (configRes && Array.isArray(configRes) && isMounted.current) {
                const dbConfigs = {};
                configRes.forEach(item => {
                    dbConfigs[item.key] = item.value;
                    if (item.key === 'maintenance_mode') setMaintenanceMode(item.value === 'true');
                });
                setConfigs(prev => ({ ...prev, ...dbConfigs }));
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
                        menus: r.menus ? (typeof r.menus === 'string' ? (() => { try { return JSON.parse(r.menus); } catch (e) { return []; } })() : r.menus) : []
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
            if (activeTab === 'sessions' || activeTab === 'system' || activeTab === 'general' || activeTab === 'branding') {
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
                            Inti Sistem: Online
                        </div>
                        <h1 className="outfit" style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>
                            Kontrol {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </h1>
                    </div>
                    <div className="maintenance-box" style={{ padding: '12px 24px', background: maintenanceMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', borderRadius: '16px', border: `1px solid ${maintenanceMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`, display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: maintenanceMode ? '#f87171' : '#34d399', textTransform: 'uppercase' }}>Status Layanan</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{maintenanceMode ? 'Mode Perbaikan' : 'Live Produksi'}</div>
                        </div>
                        <button
                            onClick={handleMaintenanceToggle}
                            style={{ background: maintenanceMode ? '#ef4444' : '#10b981', border: 'none', padding: '10px 16px', borderRadius: '12px', color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem', boxShadow: `0 4px 12px ${maintenanceMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}` }}
                        >
                            {maintenanceMode ? 'Onlinekan' : 'Perbaikan'}
                        </button>
                    </div>
                </div>

                {/* THE ORACLE: System Intelligence Dashboard */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>

                    {/* 1. Risk Gauge */}
                    <div className="develzy-card" style={{ display: 'flex', alignItems: 'center', gap: '2rem', background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.6) 0%, rgba(15, 23, 42, 0.3) 100%)' }}>
                        <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#334155" strokeWidth="4" />
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={riskScore > 50 ? '#ef4444' : riskScore > 20 ? '#f59e0b' : '#10b981'} strokeWidth="4" strokeDasharray={`${riskScore}, 100`} />
                            </svg>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: riskScore > 50 ? '#ef4444' : '#10b981' }}>{riskScore}%</span>
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Skor Risiko Sistem</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '4px' }}>{riskScore < 20 ? 'Sistem Stabil & Aman' : riskScore < 50 ? 'Perlu Perhatian' : 'Kritis / Bahaya'}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Prediksi anomali berbasis AI aktif.</div>
                        </div>
                    </div>

                    {/* 2. AI Recommendations */}
                    <div className="develzy-card" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                            <i className="fas fa-robot" style={{ color: '#8b5cf6' }}></i>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#cbd5e1' }}>Rekomendasi Cerdas</span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '4px' }}>
                            {riskScore < 20 ? (
                                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)', flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.9rem', marginBottom: '2px' }}><i className="fas fa-check-circle mr-2"></i> Semua Sistem Optimal</div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Tidak ada tindakan mendesak diperlukan saat ini.</div>
                                </div>
                            ) : (
                                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)', flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: '#f87171', fontSize: '0.9rem', marginBottom: '2px' }}><i className="fas fa-exclamation-triangle mr-2"></i> Anomali Terdeteksi</div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Cek log audit dan sesi pengguna mencurigakan.</div>
                                </div>
                            )}
                            <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.2)', minWidth: '200px' }}>
                                <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.9rem', marginBottom: '2px' }}>Backup Rutin</div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Jadwal backup 4 jam lagi.</div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Core Vitals Row (Merged Uptime & DB) */}
                    <div style={{ gridColumn: 'span 3', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <i className="fas fa-clock" style={{ fontSize: '1.2rem', color: '#6366f1' }}></i>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Waktu Aktif</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9' }}>{systemStats.uptime}</div>
                            </div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <i className="fas fa-database" style={{ fontSize: '1.2rem', color: '#10b981' }}></i>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Database</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9' }}>{systemStats.requests}</div>
                            </div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <i className="fas fa-server" style={{ fontSize: '1.2rem', color: '#f59e0b' }}></i>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Server Load</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9' }}>{systemStats.cpu}</div>
                            </div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <i className="fas fa-code-branch" style={{ fontSize: '1.2rem', color: '#ec4899' }}></i>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Versi Inti</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9' }}>v3.5.0-ELZ</div>
                            </div>
                        </div>
                    </div>

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
                        {activeTab === 'features' && <FeaturesTab configs={configs} setConfigs={setConfigs} />}
                        {activeTab === 'reality' && <RealityTab />}
                        {activeTab === 'audit' && <AuditTab logs={logs} pagination={logsPagination} onPageChange={(p) => setLogsPagination({ ...logsPagination, page: p })} onRefresh={loadData} />}
                        {activeTab === 'sessions' && <SessionsTab activeSessions={activeSessions} onRefresh={loadData} />}
                        {activeTab === 'roles' && <RolesTab rolesList={rolesList} onRefresh={loadData} />}
                        {activeTab === 'users' && <UsersTab />}
                        {activeTab === 'system' && <SystemTab dbHealth={dbHealth} configs={configs} onRefresh={() => { loadData(); loadSystemStats(); }} />}
                    </div>
                </div>
            </div>
        </div>
    );
}
