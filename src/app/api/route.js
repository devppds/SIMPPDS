// Build trigger: update Cloudinary configuration
import { getRequestContext } from '@cloudflare/next-on-pages';
import { verifyAdmin } from '@/lib/api/utils';

// Import Handlers
import * as SystemHandler from '@/lib/api/handlers/system';
import * as StatsHandler from '@/lib/api/handlers/stats';
import * as DataHandler from '@/lib/api/handlers/data';
import * as FilesHandler from '@/lib/api/handlers/files';

export const runtime = 'edge';

export async function GET(request) { return dispatcher(request); }
export async function POST(request) { return dispatcher(request); }

async function dispatcher(request) {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const type = url.searchParams.get('type');
    const id = url.searchParams.get('id');

    // 1. Basic Test
    if (action === 'test') {
        return Response.json({ status: "success", message: "API endpoint is reachable" });
    }

    // 2. Setup Context
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
        // 3. Routing Logic

        // --- System & Config ---
        if (action === 'initSystem') return await SystemHandler.handleInitSystem(request, db);
        if (action === 'ping') return await SystemHandler.handlePing(db);
        if (action === 'getConfigs') return await SystemHandler.handleGetConfigs(db);
        if (action === 'updateConfig') {
            // Check Admin
            const isAdmin = await verifyAdmin(request, db);
            if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });
            return await SystemHandler.handleUpdateConfig(request, db);
        }
        if (action === 'getAuditLogs') {
            // Check Admin
            const isAdmin = await verifyAdmin(request, db);
            if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });
            return await SystemHandler.handleGetAuditLogs(db);
        }

        // --- Stats ---
        if (action === 'getQuickStats') return await StatsHandler.handleGetQuickStats(db);

        // --- Data CRUD ---
        if (action === 'getData') return await DataHandler.handleGetData(db, type);
        if (action === 'saveData') return await DataHandler.handleSaveData(request, db, type, id); // id from URL included
        if (action === 'deleteData') return await DataHandler.handleDeleteData(request, db, env, type, id);

        // --- Files ---
        if (action === 'getCloudinarySignature') return await FilesHandler.handleGetCloudinarySignature(request, env);

        return Response.json({ error: "Action Unknown" }, { status: 404 });

    } catch (err) {
        return Response.json({
            status: "error",
            error: "DB_RUNTIME_ERROR",
            details: err.message
        }, { status: 500 });
    }
}
