// Build trigger: update Cloudinary configuration
import { getRequestContext } from '@cloudflare/next-on-pages';
import { HEADERS_CONFIG, FILE_COLUMNS } from '@/lib/api/definitions';
import { verifyAdmin, logAudit, deleteCloudinaryFile } from '@/lib/api/utils';

export const runtime = 'edge';

export async function GET(request) { return handle(request); }
export async function POST(request) { return handle(request); }

async function handle(request) {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const type = url.searchParams.get('type');
    const id = url.searchParams.get('id');

    // 1. Basic Test (No Context needed)
    if (action === 'test') {
        return Response.json({ status: "success", message: "API endpoint is reachable" });
    }

    let env;
    try {
        const ctx = getRequestContext();
        env = ctx?.env;
    } catch (e) {
        return Response.json({ status: "error", error: "CONTEXT_ERROR", message: "Gagal mengambil Cloudflare Context.", details: e.message }, { status: 500 });
    }

    if (!env || !env.DB) {
        return Response.json({ status: "error", error: "DATABASE_NOT_BOUND", message: "Database 'DB' tidak terbaca." }, { status: 500 });
    }

    const { DB: db } = env;

    try {
        // --- SYSTEM INITIALIZATION (One-time or occasional) ---
        if (action === 'initSystem') {
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

        if (action === 'ping') {
            await db.prepare("SELECT 1").run();
            return Response.json({ status: "success", message: "Koneksi D1 Aktif!" });
        }

        // --- AUTH PROTECTED ACTIONS ---
        const adminActions = ['getAuditLogs', 'updateConfig', 'initSystem'];
        if (adminActions.includes(action)) {
            const isAdmin = await verifyAdmin(request, db);
            if (!isAdmin) return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        if (action === 'getQuickStats') {
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

        if (action === 'getData') {
            if (!type || !HEADERS_CONFIG[type]) return Response.json({ error: "Invalid type" }, { status: 400 });
            const { results } = await db.prepare(`SELECT * FROM ${type} ORDER BY id DESC`).all();
            return Response.json(results || []);
        }

        if (action === 'getAuditLogs') {
            const { results } = await db.prepare(`SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100`).all();
            return Response.json(results || []);
        }

        if (action === 'getConfigs') {
            const { results } = await db.prepare(`SELECT * FROM system_configs`).all();
            return Response.json(results || []);
        }

        if (action === 'updateConfig') {
            const body = await request.json();
            const { key, value } = body;
            await db.prepare(`INSERT OR REPLACE INTO system_configs (key, value, updated_at) VALUES (?, ?, ?)`)
                .bind(key, value, new Date().toISOString()).run();

            await logAudit(db, request, 'UPDATE_CONFIG', 'system_configs', key, `Value: ${value}`);
            return Response.json({ success: true });
        }

        if (action === 'saveData') {
            const body = await request.json();
            const config = HEADERS_CONFIG[type];
            if (!config) return Response.json({ error: "Invalid type" }, { status: 400 });

            const fields = [];
            const values = [];
            config.forEach(col => {
                if (Object.prototype.hasOwnProperty.call(body, col)) {
                    fields.push(col);
                    values.push(body[col] === '' ? null : body[col]);
                }
            });

            // FIX: Use ID from URL query param if body.id is missing (essential for updates)
            const recordId = body.id || id;

            if (recordId) {
                const setClause = fields.map(f => `${f} = ?`).join(', ');
                values.push(recordId);
                await db.prepare(`UPDATE ${type} SET ${setClause} WHERE id = ?`).bind(...values).run();
                await logAudit(db, request, 'UPDATE', type, recordId, `Fields: ${fields.join(', ')}`);
                return Response.json({ success: true });
            } else {
                const placeholders = fields.map(() => '?').join(', ');
                const res = await db.prepare(`INSERT INTO ${type} (${fields.join(', ')}) VALUES (${placeholders})`).bind(...values).run();
                await logAudit(db, request, 'CREATE', type, res.meta?.last_row_id || 'new');
                return Response.json({ success: true });
            }
        }

        if (action === 'deleteData') {
            if (!type || !id) return Response.json({ error: "Type and ID required" }, { status: 400 });

            // Check for files to delete
            const cols = FILE_COLUMNS[type];
            if (cols) {
                const item = await db.prepare(`SELECT * FROM ${type} WHERE id = ?`).bind(id).first();
                if (item) {
                    for (const col of cols) {
                        if (item[col]) await deleteCloudinaryFile(item[col], env);
                    }
                }
            }

            await db.prepare(`DELETE FROM ${type} WHERE id = ?`).bind(id).run();
            await logAudit(db, request, 'DELETE', type, id);
            return Response.json({ success: true });
        }

        if (action === 'getCloudinarySignature') {
            const body = await request.json();
            const paramsToSign = body.data?.paramsToSign || body.paramsToSign;
            const apiSecret = env.CLOUDINARY_API_SECRET?.trim();
            const apiKey = env.CLOUDINARY_API_KEY?.trim();
            const cloudName = env.CLOUDINARY_CLOUD_NAME?.trim();

            if (!apiSecret || !apiKey || !cloudName) {
                return Response.json({ status: "error", message: "Konfigurasi Cloudinary tidak ditemukan." }, { status: 500 });
            }

            const sortedKeys = Object.keys(paramsToSign).sort();
            const signString = sortedKeys.map(k => `${k}=${paramsToSign[k]}`).join('&') + apiSecret;
            const encoder = new TextEncoder();
            const hashBuffer = await crypto.subtle.digest('SHA-1', encoder.encode(signString));
            const signature = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
            return Response.json({ signature, apiKey, cloudName });
        }

        return Response.json({ error: "Action Unknown" }, { status: 404 });
    } catch (err) {
        return Response.json({
            status: "error",
            error: "DB_RUNTIME_ERROR",
            details: err.message
        }, { status: 500 });
    }
}
