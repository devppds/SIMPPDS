export async function handleGetQuickStats(db) {
    const s = await db.prepare("SELECT COUNT(*) as total FROM santri").first();
    const u = await db.prepare("SELECT COUNT(*) as total FROM ustadz").first();
    const p_total = await db.prepare("SELECT COUNT(*) as total FROM pengurus").first();
    const k_total = await db.prepare("SELECT SUM(kapasitas) as total FROM kamar").first();

    // Calculate Current Month/Year Prefix
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const currentMonthPrefix = `${year}-${month}`;
    const today = `${year}-${month}-${day}`;

    // Financial Metrics
    const incomeMonth = await db.prepare("SELECT SUM(nominal) as total FROM arus_kas WHERE tipe = 'Masuk' AND tanggal LIKE ?").bind(`${currentMonthPrefix}%`).first();
    const expenseMonth = await db.prepare("SELECT SUM(nominal) as total FROM arus_kas WHERE tipe = 'Keluar' AND tanggal LIKE ?").bind(`${currentMonthPrefix}%`).first();

    const tm = await db.prepare("SELECT SUM(nominal) as total FROM arus_kas WHERE tipe = 'Masuk'").first();
    const tk = await db.prepare("SELECT SUM(nominal) as total FROM arus_kas WHERE tipe = 'Keluar'").first();
    const kasTotal = (tm?.total || 0) - (tk?.total || 0);

    // Keamanan Metrics
    const violationsMonth = await db.prepare("SELECT COUNT(*) as total FROM keamanan WHERE tanggal LIKE ?").bind(`${currentMonthPrefix}%`).first();
    const activeIzin = await db.prepare("SELECT COUNT(*) as total FROM izin WHERE (tanggal_kembali >= ? OR tanggal_kembali IS NULL) AND keterangan != 'Selesai'").bind(today).first();

    // Kesehatan Metrics
    const activeSakit = await db.prepare("SELECT COUNT(*) as total FROM kesehatan WHERE status_periksa != 'Sembuh'").first();

    // Fetch Santri Distribution for Chart
    const { results: santriChart } = await db.prepare("SELECT kelas, COUNT(*) as count FROM santri GROUP BY kelas ORDER BY count DESC").all();

    return Response.json({
        // Generic / Admin
        santriTotal: s?.total || 0,
        ustadzTotal: u?.total || 0,
        pengurusTotal: p_total?.total || 0,
        kamarKapasitas: k_total?.total || 0,

        // Financial
        keuanganTotal: incomeMonth?.total || 0, // Monthly Income
        expenseMonth: expenseMonth?.total || 0,
        kasTotal: kasTotal,

        // Keamanan
        violationsMonth: violationsMonth?.total || 0,
        activeIzin: activeIzin?.total || 0,

        // Kesehatan
        activeSakit: activeSakit?.total || 0,

        santriChart: santriChart || []
    });
}
