export async function handleGetQuickStats(db) {
    const s = await db.prepare("SELECT COUNT(*) as total FROM santri").first();
    const u = await db.prepare("SELECT COUNT(*) as total FROM ustadz").first();

    // Calculate Current Month Income
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const currentMonthPrefix = `${year}-${month}`;

    const p = await db.prepare("SELECT SUM(nominal) as total FROM arus_kas WHERE tipe = 'Masuk' AND tanggal LIKE ?").bind(`${currentMonthPrefix}%`).first();

    // Calculate Operational Cash (Total Masuk - Total Keluar)
    const tm = await db.prepare("SELECT SUM(nominal) as total FROM arus_kas WHERE tipe = 'Masuk'").first();
    const tk = await db.prepare("SELECT SUM(nominal) as total FROM arus_kas WHERE tipe = 'Keluar'").first();
    const kasTotal = (tm?.total || 0) - (tk?.total || 0);

    // Fetch Santri Distribution for Chart
    const { results: santriChart } = await db.prepare("SELECT kelas, COUNT(*) as count FROM santri GROUP BY kelas").all();

    return Response.json({
        santriTotal: s?.total || 0,
        ustadzTotal: u?.total || 0,
        keuanganTotal: p?.total || 0,
        kasTotal: kasTotal,
        santriChart: santriChart || []
    });
}
