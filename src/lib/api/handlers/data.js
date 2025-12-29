import { HEADERS_CONFIG, FILE_COLUMNS } from '../definitions';
import { logAudit, deleteCloudinaryFile } from '../utils';

export async function handleGetData(db, type) {
    if (!type || !HEADERS_CONFIG[type]) return Response.json({ error: "Invalid type" }, { status: 400 });
    const { results } = await db.prepare(`SELECT * FROM "${type}" ORDER BY id DESC`).all();
    return Response.json(results || []);
}

export async function handleSaveData(request, db, type, idParam) {
    const body = await request.json();
    const config = HEADERS_CONFIG[type];
    if (!config) return Response.json({ error: "Invalid type" }, { status: 400 });

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
}

export async function handleDeleteData(request, db, env, type, id) {
    if (!type || !id) return Response.json({ error: "Type and ID required" }, { status: 400 });

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
