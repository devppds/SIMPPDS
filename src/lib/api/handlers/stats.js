export async function handleGetQuickStats(db) {
    // Helper to safely execute query
    const safeQuery = async (query, params = [], defaultValue = 0) => {
        try {
            const res = await db.prepare(query).bind(...params).first();
            return res;
        } catch (e) {
            console.error(`Query failed: ${query}`, e);
            return { total: defaultValue, count: defaultValue };
        }
    };

    const s = await safeQuery("SELECT COUNT(*) as total FROM santri");
    const u = await safeQuery("SELECT COUNT(*) as total FROM ustadz");
    const p_total = await safeQuery("SELECT COUNT(*) as total FROM pengurus");
    const k_total = await safeQuery("SELECT SUM(kapasitas) as total FROM kamar");

    // Calculate Current Month/Year Prefix
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const currentMonthPrefix = `${year}-${month}`;
    const today = `${year}-${month}-${day}`;

    // Financial Metrics
    const incomeMonth = await safeQuery("SELECT SUM(nominal) as total FROM arus_kas WHERE tipe = 'Masuk' AND tanggal LIKE ?", [`${currentMonthPrefix}%`]);
    const expenseMonth = await safeQuery("SELECT SUM(nominal) as total FROM arus_kas WHERE tipe = 'Keluar' AND tanggal LIKE ?", [`${currentMonthPrefix}%`]);

    const tm = await safeQuery("SELECT SUM(nominal) as total FROM arus_kas WHERE tipe = 'Masuk'");
    const tk = await safeQuery("SELECT SUM(nominal) as total FROM arus_kas WHERE tipe = 'Keluar'");
    const kasTotal = (tm?.total || 0) - (tk?.total || 0);

    // Keamanan Metrics
    const violationsMonth = await safeQuery("SELECT COUNT(*) as total FROM keamanan WHERE tanggal LIKE ?", [`${currentMonthPrefix}%`]);

    // Defensive query for activeIzin (check if keterangan exists if possible, but try-catch handles it)
    const activeIzin = await safeQuery("SELECT COUNT(*) as total FROM izin WHERE (tanggal_kembali >= ? OR tanggal_kembali IS NULL) AND keterangan != 'Selesai'", [today]);

    // Kesehatan Metrics
    const activeSakit = await safeQuery("SELECT COUNT(*) as total FROM kesehatan WHERE status_periksa != 'Sembuh'");

    // Fetch Santri Distribution for Chart
    let santriChart = [];
    try {
        const { results } = await db.prepare("SELECT kelas, COUNT(*) as count FROM santri GROUP BY kelas ORDER BY count DESC").all();
        santriChart = results || [];
    } catch (e) {
        console.error("Santri chart query failed", e);
    }

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

        santriChart: santriChart
    });
}
