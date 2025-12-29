import { verifyAdmin, logAudit } from '../utils';
import { HEADERS_CONFIG } from '../definitions';

export async function handleInitSystem(request, db) {
    const isAdmin = await verifyAdmin(request, db);
    if (!isAdmin) return Response.json({ error: "Unauthorized" }, { status: 403 });

    // 1. Core Config & Logs
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

    // 2. Dynamic Table Creation for all modules
    for (const [tableName, columns] of Object.entries(HEADERS_CONFIG)) {
        // Create table with ID if not exists
        await db.prepare(`CREATE TABLE IF NOT EXISTS ${tableName} (id INTEGER PRIMARY KEY AUTOINCREMENT)`).run();

        // Add columns one by one (D1 ALTER TABLE limitation)
        for (const col of columns) {
            try {
                await db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${col} TEXT`).run();
            } catch (e) {
                // Ignore "duplicate column name" error
            }
        }
    }

    // 3. Seed Default Roles if empty
    const roleCheck = await db.prepare("SELECT COUNT(*) as count FROM roles").first();
    if (roleCheck && roleCheck.count === 0) {
        const defaultRoles = [
            { role: 'admin', label: 'Super Administrator', color: '#2563eb', menus: JSON.stringify(['Semua Menu']), is_public: 1 },
            { role: 'sekretariat', label: 'Sekretariat', color: '#8b5cf6', menus: JSON.stringify(['Data Santri', 'Asrama & Kamar', 'Layanan Sekretariat', 'Data Pengajar', 'Arsiparis']), is_public: 1 },
            { role: 'bendahara', label: 'Bendahara', color: '#10b981', menus: JSON.stringify(['Arus Kas Pondok', 'Setoran Unit', 'Atur Layanan', 'Keuangan Santri']), is_public: 1 },
            { role: 'keamanan', label: 'Keamanan', color: '#ef4444', menus: JSON.stringify(['Pelanggaran', 'Perizinan Santri', 'Barang Sitaan', 'Registrasi Barang']), is_public: 1 },
            { role: 'pendidikan', label: 'Pendidikan', color: '#f59e0b', menus: JSON.stringify(['Agenda & Nilai', 'Layanan Pendidikan', 'Wajar-Murottil']), is_public: 1 },
            { role: 'kesehatan', label: 'Kesehatan (BK)', color: '#ec4899', menus: JSON.stringify(['Data Kesehatan', 'Layanan Kesehatan']), is_public: 1 },
            { role: 'jamiyyah', label: "Jam'iyyah", color: '#6366f1', menus: JSON.stringify(["Layanan Jam'iyyah"]), is_public: 1 },
        ];

        for (const r of defaultRoles) {
            await db.prepare(`INSERT INTO roles (role, label, color, menus, is_public) VALUES (?, ?, ?, ?, ?)`)
                .bind(r.role, r.label, r.color, r.menus, r.is_public).run();
        }
    }

    return Response.json({ success: true, message: "System tables initialized, module schemas synced, and default roles seeded." });
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
