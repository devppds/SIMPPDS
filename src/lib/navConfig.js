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
        label: 'Sekretariat',
        icon: 'fas fa-file-signature',
        roles: ['admin', 'sekretariat'],
        submenu: [
            { label: 'Data Santri', path: '/santri', icon: 'fas fa-user-graduate' },
            { label: 'Asrama & Kamar', path: '/kamar', icon: 'fas fa-bed' },
            { label: 'Layanan Sekretariat', path: '/layanan-sekretariat', icon: 'fas fa-concierge-bell' },
            { label: 'Data Ustadz', path: '/ustadz', icon: 'fas fa-chalkboard-teacher' },
            { label: 'Data Pengurus', path: '/pengurus', icon: 'fas fa-user-tie' },
            { label: 'Arsiparis', path: '/arsiparis', icon: 'fas fa-archive' }
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
            { label: 'Registrasi Barang', path: '/keamanan-reg', icon: 'fas fa-clipboard-list' },
            { label: 'Layanan Keamanan', path: '/layanan-keamanan', icon: 'fas fa-concierge-bell' }
        ]
    },
    {
        label: 'Bagian Pendidikan',
        icon: 'fas fa-book-reader',
        roles: ['admin', 'pendidikan'],
        submenu: [
            { label: 'Agenda & Nilai', path: '/pendidikan', icon: 'fas fa-book' },
            { label: 'Layanan Pendidikan', path: '/layanan-pendidikan', icon: 'fas fa-concierge-bell' }
        ]
    },
    {
        label: 'Kesehatan (BK)',
        icon: 'fas fa-heartbeat',
        roles: ['admin', 'kesehatan'],
        submenu: [
            { label: 'Data Kesehatan', path: '/kesehatan', icon: 'fas fa-notes-medical' },
            { label: 'Layanan Kesehatan', path: '/layanan-kesehatan', icon: 'fas fa-concierge-bell' }
        ]
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
        label: "Jam'iyyah",
        icon: 'fas fa-users',
        roles: ['admin', 'jamiyyah'],
        submenu: [
            { label: "Layanan Jam'iyyah", path: '/layanan-jamiyyah', icon: 'fas fa-concierge-bell' }
        ]
    },
    {
        label: 'Madrasah MIU',
        icon: 'fas fa-school',
        path: '/madrasah-miu',
        roles: ['admin', 'madrasah_miu']
    },
    {
        label: 'Pengaturan',
        icon: 'fas fa-cog',
        path: '/settings',
        roles: ['admin', 'keamanan', 'pendidikan', 'kesehatan', 'bendahara', 'sekretariat', 'jamiyyah', 'madrasah_miu']
    }
];
