// Build trigger: update Cloudinary configuration
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

const headersConfig = {
    'santri': ["stambuk_pondok", "stambuk_madrasah", "tahun_masuk", "kamar", "status_mb", "madrasah", "kelas", "nisn", "nama_siswa", "tempat_tanggal_lahir", "jenis_kelamin", "agama", "kewarganegaraan", "anak_ke", "alamat", "dusun_jalan", "desa_kelurahan", "kecamatan", "kota_kabupaten", "provinsi", "kode_pos", "hobi", "cita_cita", "asal_sekolah", "nama_ayah", "tempat_tanggal_lahir_ayah", "pendidikan_ayah", "pekerjaan_ayah", "penghasilan_ayah", "no_telp_ayah", "nama_ibu", "tempat_tanggal_lahir_ibu", "pendidikan_ibu", "pekerjaan_ibu", "penghasilan_ibu", "no_telp_ibu", "status_santri", "tanggal_nonaktif", "alasan_nonaktif", "foto_santri", "created_at", "pindah_ke", "tahun_pindah", "tanggal_boyong", "jumlah_saudara", "pendidikan_terakhir", "no_ijazah", "tempat_lahir", "tanggal_lahir"],
    'ustadz': ["foto_ustadz", "nama", "kelas", "alamat", "no_hp", "status", "tanggal_nonaktif"],
    'pengurus': ["foto_pengurus", "nama", "jabatan", "divisi", "no_hp", "tahun_mulai", "tahun_akhir", "status", "tanggal_nonaktif"],
    'keamanan': ["tanggal", "nama_santri", "jenis_pelanggaran", "poin", "takzir", "keterangan", "petugas"],
    'pendidikan': ["tanggal", "nama_santri", "kegiatan", "nilai", "kehadiran", "keterangan", "ustadz"],
    'keuangan': ["tanggal", "nama_santri", "jenis_pembayaran", "nominal", "metode", "status", "bendahara", "tipe"],
    'arus_kas': ["tanggal", "tipe", "kategori", "nominal", "keterangan", "pj"],
    'users': ["fullname", "username", "email", "password", "password_plain", "role"],
    'kamar': ["nama_kamar", "asrama", "kapasitas", "penasihat"],
    'kesehatan': ["nama_santri", "mulai_sakit", "gejala", "obat_tindakan", "status_periksa", "keterangan", "biaya_obat"],
    'izin': ["nama_santri", "alasan", "tanggal_pulang", "tanggal_kembali", "jam_mulai", "jam_selesai", "tipe_izin", "petugas", "keterangan"],
    'barang_sitaan': ["tanggal", "nama_santri", "jenis_barang", "nama_barang", "petugas", "status_barang", "keterangan"],
    'keamanan_reg': ["nama_santri", "jenis_barang", "detail_barang", "jenis_kendaraan", "jenis_elektronik", "plat_nomor", "warna", "merk", "aksesoris_1", "aksesoris_2", "aksesoris_3", "keadaan", "kamar_penempatan", "tanggal_registrasi", "petugas_penerima", "keterangan", "status_barang_reg"],
    'kas_unit': ["tanggal", "unit", "tipe", "kategori", "nominal", "nama_santri", "stambuk", "keterangan", "petugas", "status_setor"],
    'jenis_tagihan': ["nama_tagihan", "nominal", "keterangan", "aktif"],
    'layanan_master': ["unit", "nama_layanan", "harga", "status"],
    'layanan_admin': ["tanggal", "unit", "nama_santri", "stambuk", "jenis_layanan", "nominal", "keterangan", "pj", "pemohon_tipe", "jumlah"],
    'arsiparis': ["tanggal_upload", "nama_dokumen", "kategori", "file_url", "keterangan", "pj"],
    'arsip_surat': ["tanggal", "nomor_surat", "tipe", "pengirim_penerima", "perihal", "keterangan", "file_surat"],
    'arsip_proposal': ["tanggal", "nomor_proposal", "judul", "pengaju", "nominal", "status", "file_proposal", "keterangan"],
    'arsip_akta_tanah': ["nomor_akta", "tanggal", "lokasi", "luas_tanah", "atas_nama", "status_kepemilikan", "file_akta", "keterangan"],
    'arsip_pengurus_periode': ["periode_mulai", "periode_selesai", "nama", "jabatan", "divisi", "foto_pengurus", "keterangan"],
    'arsip_pengajar_periode': ["periode_mulai", "periode_selesai", "nama", "kelas_ampu", "foto_pengajar", "keterangan"],
    'absensi_formal': ["tanggal", "nama_santri", "lembaga", "status_absen", "keterangan", "petugas_piket"],
    'lembaga': ["nama"],
    'master_kelas': ["lembaga", "nama_kelas", "urutan"],
    'master_jabatan': ["kelompok", "nama_jabatan", "urutan"],
    'keamanan_absensi': ["santri_id", "nama_santri", "kelas", "tanggal", "status", "keterangan", "petugas"],
    'keuangan_tarif': ["kategori_status", "kelas", "nominal", "keterangan"],
    'keuangan_pembayaran': ["santri_id", "nama_santri", "tanggal", "jenis_pembayaran", "bulan_tagihan", "nominal", "keterangan", "petugas"],
    'keuangan_kas': ["tanggal", "tipe", "kategori", "nominal", "keterangan", "pembayaran_id", "petugas"],
    'kalender_kerja': ["hari", "tanggal_masehi", "tanggal_hijriyah", "nama_kegiatan", "kategori", "file_kalender", "keterangan", "periode"],
    'roles': ["role", "label", "color", "menus"]
};

const FILE_COLUMNS = {
    'santri': ["foto_santri"],
    'ustadz': ["foto_ustadz"],
    'pengurus': ["foto_pengurus"],
    'arsip_surat': ["file_surat"],
    'arsip_proposal': ["file_proposal"],
    'arsip_akta_tanah': ["file_akta"],
    'arsip_pengurus_periode': ["foto_pengurus"],
    'arsip_pengajar_periode': ["foto_pengajar"],
    'kalender_kerja': ["file_kalender"]
};

async function deleteCloudinaryFile(url, env) {
    if (!url || !url.includes('cloudinary.com')) return;
    try {
        const cloudName = env.CLOUDINARY_CLOUD_NAME?.trim();
        const apiKey = env.CLOUDINARY_API_KEY?.trim();
        const apiSecret = env.CLOUDINARY_API_SECRET?.trim();
        if (!cloudName || !apiKey || !apiSecret) return;

        // Extract Public ID and Resource Type
        const match = url.match(/\/([^\/]+)\/upload\/v?\d*\/?(.*)$/);
        if (!match) return;
        const resourceType = match[1]; // image, raw, etc.
        let publicId = match[2];
        const lastDot = publicId.lastIndexOf('.');
        if (lastDot !== -1) publicId = publicId.substring(0, lastDot);

        const timestamp = Math.round(new Date().getTime() / 1000);
        const signString = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-1', encoder.encode(signString));
        const signature = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

        const fd = new FormData();
        fd.append('public_id', publicId);
        fd.append('api_key', apiKey);
        fd.append('timestamp', timestamp);
        fd.append('signature', signature);

        await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, {
            method: 'POST',
            body: fd
        });
    } catch (e) { console.error('Cloudinary Delete Error:', e.message); }
}

export async function GET(request) { return handle(request); }
export async function POST(request) { return handle(request); }

// Helper to log actions automatically
async function logAudit(db, request, action, type, id, details = "") {
    try {
        const username = request.headers.get('x-user-id') || 'system';
        const role = request.headers.get('x-user-role') || 'unknown';
        const ip = request.headers.get('cf-connecting-ip') || '0.0.0.0';

        await db.prepare(`
            INSERT INTO audit_logs (timestamp, username, role, action, target_type, target_id, details, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            new Date().toISOString(),
            username,
            role,
            action,
            type,
            id?.toString() || null,
            details,
            ip
        ).run();
    } catch (e) {
        console.error("Audit log failed:", e.message);
    }
}

// Helper to verify admin role (Async with DB check)
async function verifyAdmin(request, db) {
    const username = request.headers.get('x-user-id');
    if (!username) return false;

    try {
        const user = await db.prepare("SELECT role FROM users WHERE username = ?").bind(username).first();
        return user?.role === 'admin';
    } catch (e) {
        return false;
    }
}

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
        return Response.json({
            status: "error",
            error: "CONTEXT_ERROR",
            message: "Gagal mengambil Cloudflare Context.",
            details: e.message
        }, { status: 500 });
    }

    if (!env || !env.DB) {
        return Response.json({
            status: "error",
            error: "DATABASE_NOT_BOUND",
            message: "Database 'DB' tidak terbaca."
        }, { status: 500 });
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
        const writeActions = ['saveData', 'deleteData', 'updateConfig'];
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
            if (!type || !headersConfig[type]) return Response.json({ error: "Invalid type" }, { status: 400 });
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
            // Check write permission? For now let's assume valid login is enough for basic CRUD
            // But for higher security, we might want to check role here too.
            // Current req only asked for 'initSystem' and 'updateConfig' to be strictly admin.
            // But let's log everything.

            const body = await request.json();
            const config = headersConfig[type];
            if (!config) return Response.json({ error: "Invalid type" }, { status: 400 });

            const fields = [];
            const values = [];
            config.forEach(col => {
                if (Object.prototype.hasOwnProperty.call(body, col)) {
                    fields.push(col);
                    values.push(body[col] === '' ? null : body[col]);
                }
            });

            if (body.id) {
                const setClause = fields.map(f => `${f} = ?`).join(', ');
                values.push(body.id);
                await db.prepare(`UPDATE ${type} SET ${setClause} WHERE id = ?`).bind(...values).run();
                await logAudit(db, request, 'UPDATE', type, body.id, `Fields: ${fields.join(', ')}`);
                return Response.json({ success: true });
            } else {
                const placeholders = fields.map(() => '?').join(', ');
                const res = await db.prepare(`INSERT INTO ${type} (${fields.join(', ')}) VALUES (${placeholders})`).bind(...values).run();
                await logAudit(db, request, 'CREATE', type, res.meta?.last_row_id || 'new');
                return Response.json({ success: true });
            }
        }

        if (action === 'deleteData') {
            // Optional: Restricted delete
            // const isAdmin = await verifyAdmin(request, db); 
            // if (!isAdmin && type === 'users') ... 

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
                return Response.json({
                    status: "error",
                    message: "Konfigurasi Cloudinary tidak ditemukan.",
                }, { status: 500 });
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
