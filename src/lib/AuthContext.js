'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

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
export function usePagePermission() {
    const { user, isAdmin } = useAuth();
    const pathname = usePathname();

    if (!user) return { canEdit: false, canDelete: false };

    // 1. Super Admin / Develzy -> Full Access
    if (isAdmin) {
        return { canEdit: true, canDelete: true };
    }

    // 2. Determine Module Context from URL
    // e.g. /sekretariat/santri -> "sekretariat"
    const segments = pathname ? pathname.split('/').filter(Boolean) : [];
    const currentModule = segments[0] ? segments[0].toLowerCase() : '';

    // 3. Normalize Role to match URL style
    // e.g. Role "wajar_murottil" -> URL "wajar-murottil"
    const normalizedRole = user.role.replace(/_/g, '-');

    // 4. Check Ownership (Is this user the owner of this module?)
    let isOwner = normalizedRole === currentModule;

    // Special Case: "Keuangan" module is owned by "Bendahara" and "Sekretariat"
    if (currentModule === 'keuangan') {
        if (['bendahara', 'sekretariat'].includes(user.role)) isOwner = true;
    }

    // Special Case: "Wajar Murottil"
    if (currentModule === 'wajar-murottil' && user.role === 'wajar_murottil') isOwner = true;

    // --- DEBUG CONSOLE ---
    if (process.env.NODE_ENV === 'development') {
        console.groupCollapsed(`🛡️ Permission Check: ${currentModule || 'Home'}`);
        console.log(`Path: ${pathname}`);
        console.log(`User Role: ${user.role}`);
        console.log(`Is Owner: ${isOwner}`);
        console.log(`Result: ${isOwner ? '✅ CAN EDIT' : '👁️ READ ONLY'}`);
        console.groupEnd();
    }
    // ---------------------

    return {
        canEdit: isOwner,
        // Delete biasanya dibatasi hanya untuk Super Admin untuk keamanan data,
        // Tapi jika Owner dipercaya, bisa diganti "isOwner".
        // Saat ini kita biarkan Delete hanya untuk Admin.
        canDelete: false
    };
}
