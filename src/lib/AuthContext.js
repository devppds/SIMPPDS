'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

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
                setUser({ username: 'admin', role: 'admin', fullname: 'Administrator' });
            }
        } else {
            setUser({ username: 'admin', role: 'admin', fullname: 'Administrator' });
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
        isAdmin: user?.role === 'admin'
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
