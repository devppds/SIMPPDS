'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { apiCall } from '@/lib/utils';

const AuthContext = createContext();

export function AuthProvider({ children }) {
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
                setUser(JSON.parse(session));
            } catch (e) {
                localStorage.removeItem('sim_session');
                setUser(null);
            }
        } else {
            setUser(null);
        }
        refreshConfig();
        setLoading(false);
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('sim_session', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('sim_session');
        window.location.href = '/';
    };

    const value = {
        user,
        loading,
        config,
        refreshConfig,
        login,
        logout,
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
            const findLabel = (items, path) => {
                if (!items || !Array.isArray(items)) return null;
                for (const item of items) {
                    if (item.path === path) return item.label;
                    if (item.submenu) {
                        const found = findLabel(item.submenu, path);
                        if (found) return found;
                    }
                }
                return null;
            };

            const currentLabel = findLabel(NAV_ITEMS, pathname);

            if (currentLabel) {
                const permission = userMenus.find(m => {
                    if (typeof m === 'string') return m === currentLabel;
                    return m?.name === currentLabel;
                });

                if (permission) {
                    // If string (legacy), assume Full Access (Edit + Delete)
                    if (typeof permission === 'string') return { canEdit: true, canDelete: true };
                    // If object, check access level
                    return {
                        canEdit: ['edit', 'full'].includes(permission.access),
                        canDelete: permission.access === 'full'
                    };
                }
                // If label found in NAV but not in userMenus -> No Access (but we return false here)
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
