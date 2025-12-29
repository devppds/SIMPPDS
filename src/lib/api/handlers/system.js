import { verifyAdmin, logAudit } from '../utils';

export async function handleInitSystem(request, db) {
    const isAdmin = await verifyAdmin(request, db);
    if (!isAdmin) return Response.json({ error: "Unauthorized" }, { status: 403 });

    await db.prepare(`CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        username TEXT,
        role TEXT,
        action TEXT,
        target_type TEXT,
        target_id TEXT,
        details TEXT,
        ip_address TEXT
    )`).run();

    await db.prepare(`CREATE TABLE IF NOT EXISTS system_configs (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT
    )`).run();

    return Response.json({ success: true, message: "System tables initialized" });
}

export async function handlePing(db) {
    await db.prepare("SELECT 1").run();
    return Response.json({ status: "success", message: "Koneksi D1 Aktif!" });
}

export async function handleGetConfigs(db) {
    const { results } = await db.prepare(`SELECT * FROM system_configs`).all();
    return Response.json(results || []);
}

export async function handleGetAuditLogs(db) {
    const { results } = await db.prepare(`SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100`).all();
    return Response.json(results || []);
}

export async function handleUpdateConfig(request, db) {
    const body = await request.json();
    const { key, value } = body;
    await db.prepare(`INSERT OR REPLACE INTO system_configs (key, value, updated_at) VALUES (?, ?, ?)`)
        .bind(key, value, new Date().toISOString()).run();

    await logAudit(db, request, 'UPDATE_CONFIG', 'system_configs', key, `Value: ${value}`);
    return Response.json({ success: true });
}
