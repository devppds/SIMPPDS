export const NAV_ITEMS = [
    {
        label: 'Dashboard',
        icon: 'fas fa-th-large',
        path: '/dashboard',
        roles: ['admin', 'keamanan', 'pendidikan', 'kesehatan', 'bendahara', 'sekretariat', 'jamiyyah', 'madrasah_miu']
    },
    {
        label: 'Laporan Pimpinan',
        icon: 'fas fa-chart-line',
        path: '/laporan',
        roles: ['admin']
    },
    {
        label: 'Data Santri',
        icon: 'fas fa-user-graduate',
        path: '/santri',
        roles: ['admin', 'sekretariat', 'keamanan', 'pendidikan']
    },
    {
        label: 'Asrama & Kamar',
        icon: 'fas fa-bed',
        path: '/kamar',
        roles: ['admin', 'keamanan', 'sekretariat']
    },
    {
        label: 'SDM Pondok',
        icon: 'fas fa-users-cog',
        roles: ['admin', 'sekretariat'],
        submenu: [
            { label: 'Data Ustadz', path: '/ustadz', icon: 'fas fa-chalkboard-teacher' },
            { label: 'Data Pengurus', path: '/pengurus', icon: 'fas fa-user-tie' }
        ]
    },
    {
        label: 'Bagian Keamanan',
        icon: 'fas fa-shield-alt',
        roles: ['admin', 'keamanan'],
        submenu: [
            { label: 'Pelanggaran', path: '/pelanggaran', icon: 'fas fa-exclamation-triangle' },
            { label: 'Perizinan Santri', path: '/izin', icon: 'fas fa-id-card' },
            { label: 'Barang Sitaan', path: '/barang-sitaan', icon: 'fas fa-box-open' },
            { label: 'Registrasi Barang', path: '/keamanan-reg', icon: 'fas fa-clipboard-list' }
        ]
    },
    {
        label: 'Bagian Pendidikan',
        icon: 'fas fa-book-reader',
        path: '/pendidikan',
        roles: ['admin', 'pendidikan']
    },
    {
        label: 'Kesehatan (BK)',
        icon: 'fas fa-heartbeat',
        path: '/kesehatan',
        roles: ['admin', 'kesehatan']
    },
    {
        label: 'Bendahara',
        icon: 'fas fa-money-bill-wave',
        roles: ['admin', 'bendahara'],
        submenu: [
            { label: 'Arus Kas Pondok', path: '/arus-kas', icon: 'fas fa-exchange-alt' },
            { label: 'Setoran Unit', path: '/kas-unit', icon: 'fas fa-file-invoice-dollar' },
            { label: 'Master Tagihan', path: '/jenis-tagihan', icon: 'fas fa-tags' }
        ]
    },
    {
        label: 'Layanan & Administrasi',
        icon: 'fas fa-concierge-bell',
        roles: ['admin', 'sekretariat', 'keamanan', 'pendidikan', 'kesehatan', 'jamiyyah'],
        submenu: [
            { label: 'Input Layanan', path: '/layanan-admin', icon: 'fas fa-plus-circle' },
            { label: 'Master Harga', path: '/layanan-info', icon: 'fas fa-list-ul' }
        ]
    },
    {
        label: 'Madrasah MIU',
        icon: 'fas fa-school',
        path: '/madrasah-miu',
        roles: ['admin', 'madrasah_miu']
    },
    {
        label: 'Arsiparis',
        icon: 'fas fa-archive',
        path: '/arsiparis',
        roles: ['admin', 'sekretariat']
    },
    {
        label: 'Pengaturan',
        icon: 'fas fa-cog',
        path: '/settings',
        roles: ['admin', 'keamanan', 'pendidikan', 'kesehatan', 'bendahara', 'sekretariat', 'jamiyyah', 'madrasah_miu']
    }
];
