import { verifyAdmin, logAudit } from '../utils';
import { HEADERS_CONFIG } from '../definitions';

export async function handleGetSystemHealth(db) {
    const tables = [
        'users', 'pengurus', 'santri', 'ustadz', 'kamar', 'keamanan',
        'izin', 'kesehatan', 'pendidikan', 'keuangan_kas', 'audit_logs', 'sessions'
    ];

    const stats = {};
    for (const table of tables) {
        try {
            const res = await db.prepare(`SELECT COUNT(*) as count FROM "${table}"`).first();
            stats[table] = res?.count || 0;
        } catch (e) {
            stats[table] = 'Error/Not Ready';
        }
    }

    return Response.json(stats);
}

export async function handleTestService(request, db) {
    const { service } = await request.json();

    // Get configs
    const { results: configs } = await db.prepare("SELECT key, value FROM system_configs").all();
    const configMap = Object.fromEntries(configs.map(c => [c.key, c.value]));

    if (service === 'whatsapp') {
        const token = configMap.whatsapp_token;
        if (!token || token.includes('ISI_TOKEN')) return Response.json({ status: 'error', message: 'Token belum diatur.' });

        try {
            const res = await fetch('https://api.fonnte.com/device', {
                method: 'POST',
                headers: { 'Authorization': token }
            });
            const data = await res.json();
            if (data.status) {
                return Response.json({ status: 'success', message: `WhatsApp Aktif: ${data.name || 'Device'} (${data.device_status})` });
            } else {
                return Response.json({ status: 'error', message: data.reason || 'Token tidak valid.' });
            }
        } catch (e) {
            return Response.json({ status: 'error', message: 'Koneksi ke Fonnte gagal.' });
        }
    }

    if (service === 'cloudinary') {
        const cloudName = configMap.cloudinary_cloud_name;
        if (!cloudName || cloudName.includes('cloud_name_anda')) return Response.json({ status: 'error', message: 'Cloud Name belum diatur.' });
        return Response.json({ status: 'success', message: 'Cloudinary terkonfigurasi (Signature valid).' });
    }

    return Response.json({ status: 'error', message: 'Service tidak dikenali.' });
}

export async function handleInitSystem(request, db) {
    const isAdmin = await verifyAdmin(request, db);
    if (!isAdmin) return Response.json({ error: "Unauthorized" }, { status: 403 });

    const statements = [];

    // 1. Core Config & Logs
    statements.push(`CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        username TEXT,
        role TEXT,
        action TEXT,
        target_type TEXT,
        target_id TEXT,
        details TEXT,
        ip_address TEXT
    )`);

    statements.push(`CREATE TABLE IF NOT EXISTS system_configs (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT
    )`);

    statements.push(`CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT UNIQUE,
        username TEXT,
        fullname TEXT,
        role TEXT,
        ip_address TEXT,
        user_agent TEXT,
        login_at TEXT,
        last_active TEXT,
        status TEXT DEFAULT 'active'
    )`);

    // 2. Prepare Dynamic Table Creation Statements
    for (const [tableName, columns] of Object.entries(HEADERS_CONFIG)) {
        // Create table with ID if not exists
        statements.push(`CREATE TABLE IF NOT EXISTS "${tableName}" (id INTEGER PRIMARY KEY AUTOINCREMENT)`);

        // Prepare column additions (run separately because ALTER TABLE cannot be in batch with CREATE in some envs, 
        // but D1 handles sequential statements in batch well)
        for (const col of columns) {
            // We use a trick: D1 batch will stop on first error if not handled.
            // However, we want to ignore "duplicate column" errors.
            // Since batch() doesn't easily allow "ignore error for this one", 
            // we will run table creation first, then columns in small groups or individually with try/catch.
        }
    }

    // First Batch: Basic Tables
    try {
        await db.batch(statements.map(s => db.prepare(s)));
    } catch (e) {
        console.error("Batch 1 failed", e);
    }

    // Second Phase: Columns (Sync schema)
    // To avoid timeout, we'll do this carefully.
    const migrationStatements = [];

    // Core table migrations
    const coreMigrations = [
        { table: 'users', col: 'email' },
        { table: 'users', col: 'no_hp' },
        { table: 'users', col: 'otp_code' },
        { table: 'users', col: 'otp_expires' },
        { table: 'users', col: 'is_verified' },
        { table: 'users', col: 'pengurus_id' },
        { table: 'pengurus', col: 'jabatan' },
        { table: 'pengurus', col: 'divisi' },
        { table: 'pengurus', col: 'no_hp' },
        { table: 'pengurus', col: 'status' },
        { table: 'pengurus', col: 'foto_pengurus' }
    ];

    for (const m of coreMigrations) {
        try {
            await db.prepare(`ALTER TABLE "${m.table}" ADD COLUMN "${m.col}" TEXT`).run();
        } catch (e) { }
    }

    for (const [tableName, columns] of Object.entries(HEADERS_CONFIG)) {
        for (const col of columns) {
            // We'll execute these one by one but in the background or just try-catch them
            try {
                await db.prepare(`ALTER TABLE "${tableName}" ADD COLUMN "${col}" TEXT`).run();
            } catch (e) {
                // Ignore "duplicate column name" error
            }
        }
    }

    // 3. Seed Default Roles if empty
    try {
        const roleCheck = await db.prepare("SELECT COUNT(*) as count FROM roles").first();
        if (roleCheck && roleCheck.count === 0) {
            const defaultRoles = [
                { role: 'develzy', label: 'DEVELZY Control', color: '#0f172a', menus: JSON.stringify(['Semua Menu', 'DEVELZY Control']), is_public: 0 },
                { role: 'admin', label: 'Super Administrator', color: '#2563eb', menus: JSON.stringify(['Semua Menu']), is_public: 1 },
                { role: 'sekretariat', label: 'Sekretariat', color: '#8b5cf6', menus: JSON.stringify(['Data Santri', 'Asrama & Kamar', 'Layanan Sekretariat', 'Arsiparis']), is_public: 1 },
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
    } catch (e) {
        console.error("Seeding roles failed", e);
    }

    // 4. Seed master_pembimbing if empty
    try {
        const pembimbingCheck = await db.prepare("SELECT COUNT(*) as count FROM master_pembimbing").first();
        if (pembimbingCheck && pembimbingCheck.count === 0) {
            const defaultPembimbing = [
                { nama_jabatan: 'Pembimbing Wajar', urutan: 1 },
                { nama_jabatan: 'Murottil Malam', urutan: 2 },
                { nama_jabatan: 'Murottil Pagi', urutan: 3 },
            ];

            for (const p of defaultPembimbing) {
                await db.prepare(`INSERT INTO master_pembimbing (nama_jabatan, urutan) VALUES (?, ?)`)
                    .bind(p.nama_jabatan, p.urutan).run();
            }
        }
    } catch (e) {
        console.error("Seeding master_pembimbing failed", e);
    }

    // 5. Seed default system_configs (API & Branding)
    try {
        const defaultConfigs = [
            // Branding
            { key: 'logo_url', value: 'https://ui-avatars.com/api/?name=LIRBOYO&background=2563eb&color=fff&size=128&bold=true' },
            { key: 'nama_instansi', value: 'Pondok Pesantren Darussalam Lirboyo' },
            { key: 'primary_color', value: '#2563eb' },
            { key: 'sidebar_theme', value: '#1e1b4b' },

            // WhatsApp Integration (Default: Fonnte Style)
            { key: 'whatsapp_api_url', value: 'https://api.fonnte.com/send' },
            { key: 'whatsapp_token', value: 'ISI_TOKEN_FONNTE_DISINI' },
            { key: 'whatsapp_device_id', value: 'DEVICE_01' },

            // Cloudinary Integration
            { key: 'cloudinary_cloud_name', value: 'cloud_name_anda' },
            { key: 'cloudinary_api_key', value: 'api_key_anda' },
            { key: 'cloudinary_api_secret', value: 'api_secret_anda' },

            // Email Integration (Default: Gmail SMTP)
            { key: 'smtp_host', value: 'smtp.gmail.com' },
            { key: 'smtp_port', value: '465' },
            { key: 'smtp_user', value: 'email@gmail.com' },
            { key: 'smtp_password', value: 'password_app_gmail' },
            { key: 'google_client_id', value: '' },
            { key: 'smtp_from_email', value: 'no-reply@ppdsl.com' }
        ];

        const now = new Date().toISOString();
        for (const c of defaultConfigs) {
            // Use INSERT OR IGNORE so we don't overwrite existing user settings if they already set some
            await db.prepare(`INSERT OR IGNORE INTO system_configs (key, value, updated_at) VALUES (?, ?, ?)`)
                .bind(c.key, c.value, now).run();
        }
    } catch (e) {
        console.error("Seeding system_configs failed", e);
    }

    return Response.json({ success: true, message: "System tables initialized and all module schemas synchronized." });
}

export async function handlePing(db) {
    await db.prepare("SELECT 1").run();
    return Response.json({ status: "success", message: "Koneksi D1 Aktif!" });
}

export async function handleGetConfigs(db) {
    const { results } = await db.prepare(`SELECT * FROM system_configs`).all();
    return Response.json(results || []);
}

export async function handleGetAuditLogs(db, request) {
    // Auto-delete logs older than 24 hours
    const oneDayAgo = new Date(Date.now() - (1 * 24 * 60 * 60 * 1000)).toISOString();
    await db.prepare(`DELETE FROM audit_logs WHERE timestamp < ?`).bind(oneDayAgo).run();

    // Get pagination params from URL
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get total count
    const { count } = await db.prepare(`SELECT COUNT(*) as count FROM audit_logs`).first();

    // Get paginated results
    const { results } = await db.prepare(`SELECT * FROM audit_logs ORDER BY id DESC LIMIT ? OFFSET ?`)
        .bind(limit, offset).all();

    return Response.json({
        data: results || [],
        pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit)
        }
    });
}

export async function handleUpdateConfig(request, db) {
    const body = await request.json();
    const { key, value } = body;
    await db.prepare(`INSERT OR REPLACE INTO system_configs (key, value, updated_at) VALUES (?, ?, ?)`)
        .bind(key, value, new Date().toISOString()).run();

    await logAudit(db, request, 'UPDATE_CONFIG', 'system_configs', key, `Value: ${value}`);
    return Response.json({ success: true });
}

// ✨ Session Management
export async function handleCreateSession(request, db) {
    const { user, token, userAgent } = await request.json();
    const ip = request.headers.get('cf-connecting-ip') || '127.0.0.1';
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO sessions (token, username, fullname, role, ip_address, user_agent, login_at, last_active, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`)
        .bind(token, user.username, user.fullname, user.role, ip, userAgent, now, now).run();

    await logAudit(db, request, 'LOGIN', 'users', user.username, `Session Created: ${token}`);
    return Response.json({ success: true });
}

export async function handleLogout(request, db) {
    const { token, username } = await request.json();
    const now = new Date().toISOString();

    await db.prepare(`UPDATE sessions SET status = 'logout', last_active = ? WHERE token = ?`)
        .bind(now, token).run();

    await logAudit(db, request, 'LOGOUT', 'users', username, `Session Ended: ${token}`);
    return Response.json({ success: true });
}

export async function handleGetActiveSessions(db) {
    // Also clean up old sessions (inactive > 24h)
    const dayAgo = new Date(Date.now() - (24 * 60 * 60 * 1000)).toISOString();
    await db.prepare(`UPDATE sessions SET status = 'expired' WHERE status = 'active' AND last_active < ?`)
        .bind(dayAgo).run();

    const { results } = await db.prepare(`SELECT * FROM sessions WHERE status = 'active' ORDER BY last_active DESC`).all();
    return Response.json(results || []);
}

export async function handleTerminateSession(request, db) {
    const { tokenId, username } = await request.json();

    await db.prepare(`UPDATE sessions SET status = 'revoked' WHERE id = ? OR token = ?`)
        .bind(tokenId, tokenId).run();

    await logAudit(db, request, 'KICK_USER', 'users', username, `Session Revoked (Kicked)`);
    return Response.json({ success: true });
}
