export const NAV_ITEMS = [
    {
        label: 'Dashboard',
        icon: 'fas fa-th-large',
        path: '/dashboard',
        roles: ['admin', 'super_dashboard', 'keamanan', 'pendidikan', 'kesehatan', 'bendahara', 'sekretariat', 'jamiyyah', 'madrasah_miu', 'wajar_murottil']
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
            {
                label: 'Santri & Kamar',
                icon: 'fas fa-users-cog',
                submenu: [
                    { label: 'Data Santri', path: '/sekretariat/santri', icon: 'fas fa-user-graduate' },
                    { label: 'Asrama & Kamar', path: '/sekretariat/kamar', icon: 'fas fa-bed' }
                ]
            },
            {
                label: 'Manajemen Pengurus',
                icon: 'fas fa-user-tie',
                submenu: [
                    { label: 'Data Pengurus', path: '/sekretariat/pengurus', icon: 'fas fa-user-tie' },
                    { label: 'Absensi Pengurus', path: '/sekretariat/absen-pengurus', icon: 'fas fa-calendar-check' },
                    { label: 'Riwayat Absensi', path: '/sekretariat/absen-pengurus/riwayat', icon: 'fas fa-history' }
                ]
            },
            {
                label: 'Presensi QR Code',
                icon: 'fas fa-qrcode',
                submenu: [
                    { label: 'Scan Presensi HP', path: '/presensi/scan', icon: 'fas fa-camera' },
                    { label: 'Display QR Dinamis', path: '/presensi/generator', icon: 'fas fa-sync' },
                    { label: 'Display QR Statis', path: '/presensi/generator-static', icon: 'fas fa-print' },
                    { label: 'Log Scan Kehadiran', path: '/presensi/riwayat', icon: 'fas fa-list-alt' }
                ]
            },
            { label: 'Layanan Sekretariat', path: '/sekretariat/layanan', icon: 'fas fa-concierge-bell' },
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
            { label: 'Riwayat Absensi Formal', path: '/keamanan/absensi-formal/riwayat', icon: 'fas fa-history' },
            { label: 'Atur Kelompok Formal', path: '/keamanan/pengaturan-formal', icon: 'fas fa-users-cog' },
            { label: 'Layanan Keamanan', path: '/keamanan/layanan', icon: 'fas fa-concierge-bell' },
            { label: 'Log Scan Kehadiran', path: '/keamanan/riwayat-presensi', icon: 'fas fa-history' }
        ]
    },
    {
        label: 'Bagian Pendidikan',
        icon: 'fas fa-book-reader',
        roles: ['admin', 'pendidikan'],
        submenu: [
            { label: 'Agenda & Nilai', path: '/pendidikan', icon: 'fas fa-book' },
            { label: 'Pengajian Kitab', path: '/pendidikan/pengajian', icon: 'fas fa-book-open' },
            {
                label: 'LBM',
                icon: 'fas fa-university',
                submenu: [
                    { label: 'Siswa Pagi', path: '/pendidikan/lbm/pagi', icon: 'fas fa-sun' },
                    { label: 'Siswa Malam', path: '/pendidikan/lbm/malam', icon: 'fas fa-moon' },
                    { label: 'Delegasi', path: '/pendidikan/lbm/delegasi', icon: 'fas fa-bullhorn' }
                ]
            },
            {
                label: 'Sorogan',
                icon: 'fas fa-chalkboard-teacher',
                submenu: [
                    { label: 'Absensi', path: '/pendidikan/sorogan/absen', icon: 'fas fa-clipboard-check' },
                    { label: 'Kelola Kelompok', path: '/pendidikan/sorogan/kelompok', icon: 'fas fa-users-cog' }
                ]
            },
            { label: 'Takhōṣus & Seminar', path: '/pendidikan/takhosus', icon: 'fas fa-graduation-cap' },
            { label: 'Layanan Pendidikan', path: '/pendidikan/layanan', icon: 'fas fa-concierge-bell' },
            { label: 'Log Scan Kehadiran', path: '/pendidikan/riwayat-presensi', icon: 'fas fa-history' }
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
            { label: 'Riwayat Absensi', path: '/wajar-murottil/riwayat-absensi', icon: 'fas fa-history' },
            { label: 'Pengaturan Kelompok', path: '/wajar-murottil/pengaturan', icon: 'fas fa-users-cog' },
            { label: 'Log Scan Kehadiran', path: '/wajar-murottil/riwayat-presensi', icon: 'fas fa-history' }
        ]
    },
    {
        label: 'Kesehatan (BK)',
        icon: 'fas fa-heartbeat',
        roles: ['admin', 'kesehatan'],
        submenu: [
            { label: 'Data Kesehatan', path: '/kesehatan', icon: 'fas fa-notes-medical' },
            { label: 'Layanan Kesehatan', path: '/kesehatan/layanan', icon: 'fas fa-concierge-bell' },
            { label: 'Log Scan Kehadiran', path: '/kesehatan/riwayat-presensi', icon: 'fas fa-history' }
        ]
    },
    {
        label: 'Bendahara',
        icon: 'fas fa-money-bill-wave',
        roles: ['admin', 'bendahara'],
        submenu: [
            { label: 'Arus Kas Pondok', path: '/bendahara/arus-kas', icon: 'fas fa-exchange-alt' },
            { label: 'Setoran Unit', path: '/bendahara/kas-unit', icon: 'fas fa-file-invoice-dollar' },
            { label: 'Atur Layanan', path: '/bendahara/atur-layanan', icon: 'fas fa-cogs' },
            { label: 'Log Scan Kehadiran', path: '/bendahara/riwayat-presensi', icon: 'fas fa-history' }
        ]
    },
    {
        label: "Jam'iyyah",
        icon: 'fas fa-users',
        roles: ['admin', 'jamiyyah'],
        submenu: [
            {
                label: 'Penasihat Kamar',
                icon: 'fas fa-user-friends',
                path: '/jamiyyah/penasihat',
            },
            {
                label: 'Manajemen Jam’iyyah',
                icon: 'fas fa-sitemap',
                path: '/jamiyyah/manajemen',
            },
            { label: "Layanan Jam'iyyah", path: '/jamiyyah/layanan', icon: 'fas fa-concierge-bell' },
            { label: 'Log Scan Kehadiran', path: '/jamiyyah/riwayat-presensi', icon: 'fas fa-history' }
        ]
    },
    {
        label: 'Keuangan Santri',
        icon: 'fas fa-wallet',
        roles: ['admin', 'keamanan', 'bendahara', 'sekretariat'], // Allowing wider access for now or specific roll
        submenu: [
            { label: 'Pembayaran Santri', path: '/keuangan/pembayaran', icon: 'fas fa-cash-register' },
            { label: 'Arus Kas Harian', path: '/keuangan/arus-kas', icon: 'fas fa-book-open' },
            { label: 'Kategori Pembayaran', path: '/keuangan/kategori-pembayaran', icon: 'fas fa-tags' },
            { label: 'Atur Tarif Pembayaran', path: '/keuangan/pengaturan', icon: 'fas fa-sliders-h' },
            { label: 'Status Keuangan Santri', path: '/keuangan/status-santri', icon: 'fas fa-user-tag' }
        ]
    },
    {
        label: 'Lab & Media',
        icon: 'fas fa-laptop-code',
        roles: ['admin', 'bendahara'], // Adjust roles as needed
        submenu: [
            { label: 'Layanan Lab', path: '/lab-media/lab', icon: 'fas fa-desktop' },
            { label: 'Layanan Media', path: '/lab-media/media', icon: 'fas fa-camera' },
            { label: 'Histori & Rekap', path: '/lab-media/histori', icon: 'fas fa-history' },
            { label: 'Atur Tarif Layanan', path: '/lab-media/tarif', icon: 'fas fa-tags' },
            { label: 'Log Scan Kehadiran', path: '/lab-media/riwayat-presensi', icon: 'fas fa-history' }
        ]
    },


    {
        label: 'DEVELZY Control',
        icon: 'fas fa-rocket',
        path: '/develzy',
        roles: ['dev_elzy']
    }
];

export const getFirstAllowedPath = (user) => {
    if (!user) return '/';

    // Check if user has explicit access to Dashboard
    const dashboardItem = NAV_ITEMS.find(i => i.label === 'Dashboard');
    const canSeeDashboard = dashboardItem && (
        (dashboardItem.roles && dashboardItem.roles.includes(user.role)) ||
        (user.allowedMenus && user.allowedMenus.some(m => (m.id || m.name || m) === 'Dashboard' || (m.id || m) === '/dashboard'))
    );

    if (user.role === 'dev_elzy') return '/develzy';
    if (user.role === 'dev_elzy') return '/develzy';
    if (user.role === 'admin' || user.role === 'super_dashboard') return '/dashboard';

    const count = countAllowedMenus(user);

    // If they have multiple menus AND can see dashboard, go to dashboard
    if (count > 1 && canSeeDashboard) return '/dashboard';

    // Helper to check if a menu item is allowed
    const isAllowed = (item, parentLabels = []) => {
        if (!item.roles && !item.path && !item.submenu) return true;

        const currentLabels = [...parentLabels, item.label];
        const uniqueId = item.path || currentLabels.join(' > ');

        // Check dynamic permissions
        if (user.allowedMenus && Array.isArray(user.allowedMenus) && user.allowedMenus.length > 0) {
            const hasAccess = user.allowedMenus.some(m => {
                const mid = typeof m === 'string' ? m : (m.id || m.name);
                return mid === uniqueId || mid === item.label;
            });

            if (item.label === 'Dashboard') return canSeeDashboard;
            if (hasAccess) return true;
            if (item.submenu) return item.submenu.some(sub => isAllowed(sub, currentLabels));
            return false;
        }

        // Fallback to role-based
        if (!item.roles) return true;
        return item.roles.includes(user.role);
    };

    // Find first leaf path (excluding Dashboard if not allowed)
    for (const item of NAV_ITEMS) {
        if (item.label === 'Dashboard' && !canSeeDashboard) continue;
        if (isAllowed(item)) {
            if (item.path) return item.path;
            if (item.submenu) {
                for (const sub of item.submenu) {
                    if (isAllowed(sub, [item.label])) {
                        if (sub.path) return sub.path;
                        if (sub.submenu) {
                            for (const deep of sub.submenu) {
                                if (isAllowed(deep, [item.label, sub.label]) && deep.path) return deep.path;
                            }
                        }
                    }
                }
            }
        }
    }

    return canSeeDashboard ? '/dashboard' : '/'; // Fallback
};

export const countAllowedMenus = (user) => {
    if (!user) return 0;
    if (user.role === 'admin' || user.role === 'dev_elzy' || user.role === 'super_dashboard') return 99; // Unlimited

    const isAllowed = (item, parentLabels = []) => {
        if (!item.roles && !item.path && !item.submenu) return true;

        const currentLabels = [...parentLabels, item.label];
        const uniqueId = item.path || currentLabels.join(' > ');

        if (user.allowedMenus && Array.isArray(user.allowedMenus) && user.allowedMenus.length > 0) {
            const hasAccess = user.allowedMenus.some(m => {
                const mid = typeof m === 'string' ? m : (m.id || m.name);
                return mid === uniqueId || mid === item.label;
            });

            if (item.label === 'Dashboard') {
                const dashboardItem = NAV_ITEMS.find(i => i.label === 'Dashboard');
                return dashboardItem && dashboardItem.roles && dashboardItem.roles.includes(user.role);
            }
            if (hasAccess) return true;
            if (item.submenu) return item.submenu.some(sub => isAllowed(sub, currentLabels));
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
                    if (isAllowed(sub, [item.label])) {
                        if (sub.path) count++;
                        if (sub.submenu) {
                            sub.submenu.forEach(deep => {
                                if (isAllowed(deep, [item.label, sub.label]) && deep.path) count++;
                            });
                        }
                    }
                });
            }
        }
    });
    return count;
};
