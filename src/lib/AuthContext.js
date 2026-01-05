'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { apiCall } from '@/lib/utils';

import { useToast } from '@/lib/ToastContext';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const { showToast } = useToast();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState({
        logo_url: 'https://ui-avatars.com/api/?name=LIRBOYO&background=2563eb&color=fff&size=128&bold=true',
        nama_instansi: 'Pondok Pesantren Darussalam Lirboyo',
        primary_color: '#2563eb',
        sidebar_theme: '#1e1b4b'
    });

    const refreshConfig = async () => {
        try {
            const res = await apiCall('getConfigs', 'GET');
            if (res && Array.isArray(res)) {
                const newConfig = { ...config };
                res.forEach(item => { newConfig[item.key] = item.value; });
                setConfig(newConfig);

                // Apply Global Theme
                if (newConfig.primary_color) {
                    document.documentElement.style.setProperty('--primary', newConfig.primary_color);
                    document.documentElement.style.setProperty('--accent', newConfig.primary_color);
                    document.documentElement.style.setProperty('--primary-dark', newConfig.primary_color);
                }
                if (newConfig.sidebar_theme) {
                    document.documentElement.style.setProperty('--sidebar-bg', newConfig.sidebar_theme);
                }
            }
        } catch (e) {
            console.error("Failed to load configs:", e);
        }
    };

    useEffect(() => {
        const session = localStorage.getItem('sim_session');
        if (session) {
            try {
                const parsed = JSON.parse(session);
                setUser(parsed);
                // Verify session still active (Optional but recommended)
                checkSessionValidity(parsed);
            } catch (e) {
                localStorage.removeItem('sim_session');
                setUser(null);
            }
        } else {
            setUser(null);
        }
        refreshConfig();
        setLoading(false);

        // Heartbeat to keep session alive and check if revoked
        const interval = setInterval(() => {
            const currentSession = localStorage.getItem('sim_session');
            if (currentSession) {
                checkSessionValidity(JSON.parse(currentSession));
            }
        }, 60000); // Every 1 minute

        return () => clearInterval(interval);
    }, []);

    const checkSessionValidity = async (userData) => {
        if (!userData || !userData.token) return;
        try {
            // We could add a dedicated 'checkSession' action, 
            // but for now we can just check if any API call fails with 401/status error or check sessions table
            const activeSessions = await apiCall('getData', 'GET', { type: 'sessions' });
            const isStillActive = activeSessions.some(s => s.token === userData.token && s.status === 'active');

            if (!isStillActive) {
                // If not in active list (e.g. revoked/expired), force logout
                // This now applies to EVERYONE, including Develzy & Admin
                logout();
                showToast("Sesi Anda telah berakhir atau login di perangkat lain.", "error", 5000);
            }
        } catch (e) {
            // Silently ignore or handle connection issues
        }
    };

    const login = async (userData) => {
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        const enrichedUser = { ...userData, token };

        setUser(enrichedUser);
        localStorage.setItem('sim_session', JSON.stringify(enrichedUser));

        try {
            await apiCall('createSession', 'POST', {
                data: {
                    user: enrichedUser,
                    token,
                    userAgent: navigator.userAgent
                }
            });
        } catch (e) {
            console.error("Failed to record session:", e);
        }
    };

    const logout = async () => {
        const currentUser = user || JSON.parse(localStorage.getItem('sim_session') || '{}');
        if (currentUser.token) {
            try {
                await apiCall('logout', 'POST', {
                    data: { token: currentUser.token, username: currentUser.username }
                });
            } catch (e) {
                console.error("Logout report failed:", e);
            }
        }
        setUser(null);
        localStorage.removeItem('sim_session');
        window.location.href = '/';
    };

    const updateUser = async (newData) => {
        try {
            if (!user || !user.username) {
                throw new Error("User session tidak valid. Silakan login ulang.");
            }

            // Send update to database - include id (if exists), username, and changed fields
            const dataToSend = {
                ...newData
            };

            // Add identifier - prefer id, fallback to username
            if (user.id) {
                dataToSend.id = user.id;
            } else {
                // If no ID, we need to find by username first
                const users = await apiCall('getData', 'GET', { type: 'users' });
                const currentUser = users.find(u => u.username === user.username);
                if (!currentUser) throw new Error("User tidak ditemukan di database");
                dataToSend.id = currentUser.id;
            }

            await apiCall('saveData', 'POST', {
                type: 'users',
                data: dataToSend
            });

            // Update local state and localStorage with merged data
            const updatedUser = { ...user, ...newData };
            setUser(updatedUser);
            localStorage.setItem('sim_session', JSON.stringify(updatedUser));
            return true;
        } catch (e) {
            console.error("Update profile failed:", e);
            throw e;
        }
    };

    const value = {
        user,
        loading,
        config,
        refreshConfig,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin' || user?.role === 'develzy',
        isDevelzy: user?.role === 'develzy'
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}

// ✨ Universal Permission Hook
import { NAV_ITEMS } from '@/lib/navConfig';

export function usePagePermission() {
    const { user, isAdmin } = useAuth();
    const pathname = usePathname();

    if (!user) return { canEdit: false, canDelete: false };

    // 1. Super Admin / Develzy -> Full Access
    if (isAdmin) {
        return { canEdit: true, canDelete: true };
    }

    // 2. Check Granular Permissions from Menus
    try {
        const userMenus = user.menus || user.allowedMenus; // Support both keys
        if (userMenus && Array.isArray(userMenus) && userMenus.length > 0) {
            // Find label for current path
            // Find uniqueId/path for current pathname
            const findUniqueId = (items, path, parentLabels = []) => {
                if (!items || !Array.isArray(items)) return null;
                for (const item of items) {
                    const currentLabels = [...parentLabels, item.label];
                    const uniqueId = item.path || currentLabels.join(' > ');

                    if (item.path === path) return { uniqueId, label: item.label };

                    if (item.submenu) {
                        const found = findUniqueId(item.submenu, path, currentLabels);
                        if (found) return found;
                    }
                }
                return null;
            };

            const pageInfo = findUniqueId(NAV_ITEMS, pathname);

            if (pageInfo) {
                const permission = userMenus.find(m => {
                    if (typeof m === 'string') return m === pageInfo.label;
                    // Support both new 'id' field and legacy 'name' field (labels)
                    return m?.id === pageInfo.uniqueId || m?.name === pageInfo.uniqueId || m?.name === pageInfo.label;
                });

                if (permission) {
                    if (typeof permission === 'string') return { canEdit: true, canDelete: true };
                    return {
                        canEdit: ['edit', 'full'].includes(permission.access),
                        canDelete: permission.access === 'full'
                    };
                }
                return { canEdit: false, canDelete: false };
            }
        }
    } catch (e) {
        console.error("Permission Check Failed:", e);
    }

    // 3. Fallback: Module Context from URL (Legacy Role Logic)
    // e.g. /sekretariat/santri -> "sekretariat"
    const segments = pathname ? pathname.split('/').filter(Boolean) : [];
    const currentModule = segments[0] ? segments[0].toLowerCase() : '';

    // Normalize Role to match URL style
    // e.g. Role "wajar_murottil" -> URL "wajar-murottil"
    const normalizedRole = user.role.replace(/_/g, '-');

    // Check Ownership (Is this user the owner of this module?)
    let isOwner = normalizedRole === currentModule;

    // Special Case: "Keuangan" module is owned by "Bendahara" and "Sekretariat"
    if (currentModule === 'keuangan') {
        if (['bendahara', 'sekretariat'].includes(user.role)) isOwner = true;
    }

    // Special Case: "Wajar Murottil"
    if (currentModule === 'wajar-murottil' && user.role === 'wajar_murottil') isOwner = true;

    return {
        canEdit: isOwner,
        canDelete: isOwner // Allow owners to delete their own data
    };
}
