import moment from 'moment-hijri';
import { HEADERS_CONFIG, FILE_COLUMNS } from '../definitions';
import { logAudit, deleteCloudinaryFile } from '../utils';

const HIJRI_MONTHS = [
    'Muharram', 'Shafar', 'Rabiul Awal', 'Rabiul Akhir', 'Jumadil Awal', 'Jumadil Akhir',
    'Rajab', 'Sya\'ban', 'Ramadhan', 'Syawal', 'Dzulqa\'dah', 'Dzulhijjah'
];

async function syncToAttendance(db, body) {
    const { pengurus_id, nama, tanggal } = body;
    if (!nama || !tanggal) return;

    // 1. Resolve Staff ID (Attempt to match name to get correct ID from 'pengurus' table if possible)
    const staffRecord = await db.prepare('SELECT id FROM "pengurus" WHERE "nama" = ?').bind(nama).first();
    const effective_id = staffRecord ? staffRecord.id : pengurus_id;

    if (!effective_id) return;

    // 2. Validasi: Apakah sudah ada scan hari ini? (Gunakan effective_id)
    const existingScan = await db.prepare(
        'SELECT id FROM "presensi_pengurus" WHERE "pengurus_id" = ? AND "tanggal" = ?'
    ).bind(effective_id, tanggal).first();

    // Jika sudah ada (berarti ini scan ke-2 dst), jangan tambah hitungan tugas
    if (existingScan) return;

    // 3. Konversi tanggal ke Hijriyah
    const m = moment(tanggal);
    const hMonthIdx = m.iMonth();
    const hMonth = HIJRI_MONTHS[hMonthIdx];
    const hYear = m.iYear().toString();

    // 4. Cari rekap bulanan di pengurus_absen
    const existingAbsen = await db.prepare(
        'SELECT id, tugas FROM "pengurus_absen" WHERE "pengurus_id" = ? AND "bulan" = ? AND "tahun" = ?'
    ).bind(effective_id, hMonth, hYear).first();

    if (existingAbsen) {
        // Update: Tambah tugas + 1
        await db.prepare(
            'UPDATE "pengurus_absen" SET "tugas" = CAST("tugas" AS INTEGER) + 1 WHERE id = ?'
        ).bind(existingAbsen.id).run();
    } else {
        // Create new rekap for this month
        await db.prepare(
            'INSERT INTO "pengurus_absen" (pengurus_id, nama_pengurus, bulan, tahun, tugas, izin, alfa, petugas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(effective_id, nama, hMonth, hYear, 1, 0, 0, 'Auto-Scan').run();
    }
}

export async function handleGetData(db, type) {
    if (!type || !HEADERS_CONFIG[type]) return Response.json({ error: "Invalid type" }, { status: 400 });
    const { results } = await db.prepare(`SELECT * FROM "${type}" ORDER BY id DESC`).all();
    return Response.json(results || []);
}

export async function handleSaveData(request, db, type, idParam) {
    const body = await request.json();
    const config = HEADERS_CONFIG[type];
    if (!config) return Response.json({ error: "Invalid type" }, { status: 400 });

    const operatorRole = request.headers.get('x-user-role');
    // 🛡️ SECURITY: Protect DEVELZY scope
    if (type === 'users' && body.role === 'develzy' && operatorRole !== 'develzy') {
        return Response.json({ error: "Otoritas Terbatas: Hanya Develzy yang bisa mendaftarkan/mengatur akun Develzy." }, { status: 403 });
    }
    if (type === 'roles' && (body.role === 'develzy' || idParam)) {
        // If it's the develzy role, check if it's being modified
        const targetId = body.id || idParam;
        if (targetId) {
            const target = await db.prepare("SELECT role FROM roles WHERE id = ?").bind(targetId).first();
            if (target?.role === 'develzy') {
                return Response.json({ error: "Otoritas Terbatas: Role Develzy bersifat permanen dan tidak bisa diubah." }, { status: 403 });
            }
        }
    }

    // ✨ AUTO-SYNC logic
    if (type === 'presensi_pengurus' && !body.id && !idParam) {
        try {
            await syncToAttendance(db, body);
        } catch (e) {
            console.error("Auto-Sync Error:", e);
            // We don't block the scan even if sync fails
        }
    }

    const fields = [];
    const values = [];
    config.forEach(col => {
        if (Object.prototype.hasOwnProperty.call(body, col)) {
            fields.push(`"${col}"`);
            values.push(body[col] === '' ? null : body[col]);
        }
    });

    // FIX: Use ID from URL query param if body.id is missing (essential for updates)
    const recordId = body.id || idParam;

    try {
        if (recordId) {
            const setClause = fields.map(f => `${f} = ?`).join(', ');
            values.push(recordId);
            await db.prepare(`UPDATE "${type}" SET ${setClause} WHERE id = ?`).bind(...values).run();
            await logAudit(db, request, 'UPDATE', type, recordId, `Fields: ${fields.join(', ')}`);
            return Response.json({ success: true });
        } else {
            const placeholders = fields.map(() => '?').join(', ');
            const res = await db.prepare(`INSERT INTO "${type}" (${fields.join(', ')}) VALUES (${placeholders})`).bind(...values).run();
            await logAudit(db, request, 'CREATE', type, res.meta?.last_row_id || 'new');
            return Response.json({ success: true });
        }
    } catch (error) {
        console.error('DB Save Error:', error);
        if (error.message && error.message.includes('no such column')) {
            return Response.json({
                error: "Kolom database belum tersedia. Silakan buka DEVELZY Control > System Health dan klik 'Initialize System Tables'."
            }, { status: 500 });
        }
        return Response.json({ error: error.message || "Database error" }, { status: 500 });
    }
}

export async function handleDeleteData(request, db, env, type, id) {
    if (!type || !id) return Response.json({ error: "Type and ID required" }, { status: 400 });

    const operatorRole = request.headers.get('x-user-role');

    // 🛡️ SECURITY: Protect DEVELZY role and users from accidental deletion
    if (type === 'users') {
        const target = await db.prepare("SELECT role FROM users WHERE id = ?").bind(id).first();
        if (target?.role === 'develzy' && operatorRole !== 'develzy') {
            return Response.json({ error: "Otoritas Terbatas: Hanya Develzy yang bisa menghapus akun Develzy." }, { status: 403 });
        }
    }
    if (type === 'roles') {
        const target = await db.prepare("SELECT role FROM roles WHERE id = ?").bind(id).first();
        if (target?.role === 'develzy') {
            return Response.json({ error: "Otoritas Terbatas: Role Develzy bersifat permanen dan tidak bisa dihapus." }, { status: 403 });
        }
    }

    // Check for files to delete
    const cols = FILE_COLUMNS[type];
    if (cols) {
        const item = await db.prepare(`SELECT * FROM "${type}" WHERE id = ?`).bind(id).first();
        if (item) {
            for (const col of cols) {
                if (item[col]) await deleteCloudinaryFile(item[col], env);
            }
        }
    }

    await db.prepare(`DELETE FROM "${type}" WHERE id = ?`).bind(id).run();
    await logAudit(db, request, 'DELETE', type, id);
    return Response.json({ success: true });
}
