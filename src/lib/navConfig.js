export const NAV_ITEMS = [
    {
        label: 'Dashboard',
        icon: 'fas fa-th-large',
        path: '/dashboard',
        roles: ['admin', 'keamanan', 'pendidikan', 'kesehatan', 'bendahara', 'sekretariat', 'jamiyyah', 'madrasah_miu', 'wajar_murottil']
    },
    {
        label: 'Laporan Pimpinan',
        icon: 'fas fa-chart-line',
        path: '/laporan',
        roles: ['admin']
    },
    {
        label: 'Manajemen Akses',
        icon: 'fas fa-user-shield',
        path: '/akses',
        roles: ['admin']
    },
    {
        label: 'Sekretariat',
        icon: 'fas fa-file-signature',
        roles: ['admin', 'sekretariat'],
        submenu: [
            { label: 'Data Santri', path: '/sekretariat/santri', icon: 'fas fa-user-graduate' },
            { label: 'Asrama & Kamar', path: '/sekretariat/kamar', icon: 'fas fa-bed' },
            { label: 'Layanan Sekretariat', path: '/sekretariat/layanan', icon: 'fas fa-concierge-bell' },
            { label: 'Data Pengajar', path: '/sekretariat/ustadz', icon: 'fas fa-chalkboard-teacher' },
            { label: 'Data Pengurus', path: '/sekretariat/pengurus', icon: 'fas fa-user-tie' },
            { label: 'Kalender Kerja', path: '/sekretariat/kalender', icon: 'fas fa-calendar-alt' },
            {
                label: 'Arsiparis',
                icon: 'fas fa-archive',
                submenu: [
                    { label: 'Alumni Santri', path: '/sekretariat/arsip/alumni', icon: 'fas fa-user-graduate' },
                    { label: 'Santri Boyong/Pindah', path: '/sekretariat/arsip/mutasi-santri', icon: 'fas fa-exchange-alt' },
                    { label: 'Surat Masuk/Keluar', path: '/sekretariat/arsip/surat', icon: 'fas fa-envelope' },
                    { label: 'Proposal', path: '/sekretariat/arsip/proposal', icon: 'fas fa-file-alt' },
                    { label: 'Akta Tanah', path: '/sekretariat/arsip/akta-tanah', icon: 'fas fa-file-contract' },
                    { label: 'Pengurus (Per-Periode)', path: '/sekretariat/arsip/pengurus-periode', icon: 'fas fa-users-cog' },
                    { label: 'Pengajar (Per-Periode)', path: '/sekretariat/arsip/pengajar-periode', icon: 'fas fa-chalkboard-teacher' }
                ]
            }
        ]
    },
    {
        label: 'Bagian Keamanan',
        icon: 'fas fa-shield-alt',
        roles: ['admin', 'keamanan'],
        submenu: [
            { label: 'Pelanggaran', path: '/keamanan/pelanggaran', icon: 'fas fa-exclamation-triangle' },
            { label: 'Perizinan Santri', path: '/keamanan/izin', icon: 'fas fa-id-card' },
            { label: 'Barang Sitaan', path: '/keamanan/barang-sitaan', icon: 'fas fa-box-open' },
            { label: 'Registrasi Barang', path: '/keamanan/registrasi-barang', icon: 'fas fa-clipboard-list' },
            { label: 'Absensi Formal', path: '/keamanan/absensi-formal', icon: 'fas fa-clipboard-check' },
            { label: 'Atur Kelompok Formal', path: '/keamanan/pengaturan-formal', icon: 'fas fa-users-cog' },
            { label: 'Layanan Keamanan', path: '/keamanan/layanan', icon: 'fas fa-concierge-bell' }
        ]
    },
    {
        label: 'Bagian Pendidikan',
        icon: 'fas fa-book-reader',
        roles: ['admin', 'pendidikan'],
        submenu: [
            { label: 'Agenda & Nilai', path: '/pendidikan', icon: 'fas fa-book' },
            { label: 'Layanan Pendidikan', path: '/pendidikan/layanan', icon: 'fas fa-concierge-bell' }
        ]
    },
    {
        label: 'Wajar-Murottil',
        icon: 'fas fa-microphone-alt',
        roles: ['admin', 'pendidikan', 'wajar_murottil'],
        submenu: [
            { label: 'Wajib Belajar', path: '/wajar-murottil/wajib-belajar', icon: 'fas fa-book-reader' },
            { label: 'Murottil Malam', path: '/wajar-murottil/murottil-malam', icon: 'fas fa-moon' },
            { label: 'Murottil Pagi', path: '/wajar-murottil/murottil-pagi', icon: 'fas fa-sun' },
            { label: 'Pengaturan Kelompok', path: '/wajar-murottil/pengaturan', icon: 'fas fa-users-cog' }
        ]
    },
    {
        label: 'Kesehatan (BK)',
        icon: 'fas fa-heartbeat',
        roles: ['admin', 'kesehatan'],
        submenu: [
            { label: 'Data Kesehatan', path: '/kesehatan', icon: 'fas fa-notes-medical' },
            { label: 'Layanan Kesehatan', path: '/kesehatan/layanan', icon: 'fas fa-concierge-bell' }
        ]
    },
    {
        label: 'Bendahara',
        icon: 'fas fa-money-bill-wave',
        roles: ['admin', 'bendahara'],
        submenu: [
            { label: 'Arus Kas Pondok', path: '/bendahara/arus-kas', icon: 'fas fa-exchange-alt' },
            { label: 'Setoran Unit', path: '/bendahara/kas-unit', icon: 'fas fa-file-invoice-dollar' },
            { label: 'Atur Layanan', path: '/bendahara/atur-layanan', icon: 'fas fa-cogs' }
        ]
    },
    {
        label: "Jam'iyyah",
        icon: 'fas fa-users',
        roles: ['admin', 'jamiyyah'],
        submenu: [
            { label: "Layanan Jam'iyyah", path: '/jamiyyah/layanan', icon: 'fas fa-concierge-bell' }
        ]
    },

    {
        label: 'Keuangan Santri',
        icon: 'fas fa-wallet',
        roles: ['admin', 'keamanan', 'bendahara', 'sekretariat'], // Allowing wider access for now or specific roll
        submenu: [
            { label: 'Pembayaran Santri', path: '/keuangan/pembayaran', icon: 'fas fa-cash-register' },
            { label: 'Arus Kas Harian', path: '/keuangan/arus-kas', icon: 'fas fa-book-open' },
            { label: 'Atur Pembayaran', path: '/keuangan/pengaturan', icon: 'fas fa-sliders-h' }
        ]
    },


    {
        label: 'DEVELZY Control',
        icon: 'fas fa-rocket',
        path: '/develzy',
        roles: ['develzy']
    }
];

export const getFirstAllowedPath = (user) => {
    if (!user) return '/';
    if (user.role === 'admin' || user.role === 'develzy') return '/dashboard';

    const count = countAllowedMenus(user);
    if (count > 1) return '/dashboard';

    // Helper to check if a menu item is allowed
    const isAllowed = (item) => {
        if (!item.roles && !item.path && !item.submenu) return true;

        // Check dynamic permissions
        if (user.allowedMenus && Array.isArray(user.allowedMenus) && user.allowedMenus.length > 0) {
            const hasAccess = (label) => user.allowedMenus.some(m => {
                if (typeof m === 'string') return m === label;
                return m.name === label;
            });
            if (item.label === 'Dashboard') return true;
            if (hasAccess(item.label)) return true;
            if (item.submenu) return item.submenu.some(sub => hasAccess(sub.label));
            return false;
        }

        // Fallback to role-based
        if (!item.roles) return true;
        return item.roles.includes(user.role);
    };

    // Find first leaf path (excluding Dashboard)
    for (const item of NAV_ITEMS) {
        if (item.label === 'Dashboard') continue;
        if (isAllowed(item)) {
            if (item.path) return item.path;
            if (item.submenu) {
                for (const sub of item.submenu) {
                    if (isAllowed(sub)) {
                        if (sub.path) return sub.path;
                        if (sub.submenu) {
                            for (const deep of sub.submenu) {
                                if (isAllowed(deep) && deep.path) return deep.path;
                            }
                        }
                    }
                }
            }
        }
    }

    return '/dashboard'; // Fallback
};

export const countAllowedMenus = (user) => {
    if (!user) return 0;
    if (user.role === 'admin' || user.role === 'develzy') return 99; // Unlimited

    const isAllowed = (item) => {
        if (!item.roles && !item.path && !item.submenu) return true;

        if (user.allowedMenus && Array.isArray(user.allowedMenus) && user.allowedMenus.length > 0) {
            const hasAccess = (label) => user.allowedMenus.some(m => {
                if (typeof m === 'string') return m === label;
                return m.name === label;
            });
            if (item.label === 'Dashboard') return true;
            if (hasAccess(item.label)) return true;
            if (item.submenu) return item.submenu.some(sub => hasAccess(sub.label));
            return false;
        }

        if (!item.roles) return true;
        return item.roles.includes(user.role);
    };

    let count = 0;
    NAV_ITEMS.forEach(item => {
        if (item.label === 'Dashboard') return;
        if (isAllowed(item)) {
            if (item.path) count++;
            if (item.submenu) {
                item.submenu.forEach(sub => {
                    if (isAllowed(sub)) {
                        if (sub.path) count++;
                        if (sub.submenu) {
                            sub.submenu.forEach(deep => {
                                if (isAllowed(deep) && deep.path) count++;
                            });
                        }
                    }
                });
            }
        }
    });
    return count;
};
