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
        label: 'Sekretariat',
        icon: 'fas fa-file-signature',
        roles: ['admin', 'sekretariat'],
        submenu: [
            { label: 'Data Santri', path: '/sekretariat/santri', icon: 'fas fa-user-graduate' },
            { label: 'Asrama & Kamar', path: '/sekretariat/kamar', icon: 'fas fa-bed' },
            { label: 'Layanan Sekretariat', path: '/sekretariat/layanan', icon: 'fas fa-concierge-bell' },
            { label: 'Data Ustadz', path: '/sekretariat/ustadz', icon: 'fas fa-chalkboard-teacher' },
            { label: 'Data Pengurus', path: '/sekretariat/pengurus', icon: 'fas fa-user-tie' },
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
        label: 'Madrasah MIU',
        icon: 'fas fa-school',
        path: '/madrasah-miu',
        roles: ['admin', 'madrasah_miu']
    },
    {
        label: 'Pengaturan',
        icon: 'fas fa-cog',
        path: '/settings',
        roles: ['admin', 'keamanan', 'pendidikan', 'kesehatan', 'bendahara', 'sekretariat', 'jamiyyah', 'madrasah_miu', 'wajar_murottil']
    }
];
