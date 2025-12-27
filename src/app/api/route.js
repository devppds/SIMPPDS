import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

const headersConfig = {
    'santri': ["foto_santri", "stambuk_pondok", "stambuk_madrasah", "tahun_masuk", "kamar", "status_mb", "madrasah", "kelas", "nik", "nama_siswa", "nisn", "tempat_tanggal_lahir", "jenis_kelamin", "agama", "hobi", "cita_cita", "kewarganegaraan", "no_kk", "nik_ayah", "nama_ayah", "pekerjaan_ayah", "pendidikan_ayah", "no_telp_ayah", "penghasilan_ayah", "nik_ibu", "nama_ibu", "pekerjaan_ibu", "pendidikan_ibu", "no_telp_ibu", "dusun_jalan", "rt_rw", "desa_kelurahan", "kecamatan", "kota_kabupaten", "provinsi", "kode_pos", "status_santri", "pindah_ke", "tahun_pindah", "tanggal_boyong"],
    'ustadz': ["foto_ustadz", "nama", "nik_nip", "kelas", "alamat", "no_hp", "status", "tanggal_nonaktif"],
    'pengurus': ["foto_pengurus", "nama", "jabatan", "divisi", "no_hp", "tahun_mulai", "tahun_akhir", "status", "tanggal_nonaktif"],
    'keamanan': ["tanggal", "nama_santri", "jenis_pelanggaran", "poin", "takzir", "keterangan", "petugas"],
    'pendidikan': ["tanggal", "nama_santri", "kegiatan", "nilai", "kehadiran", "keterangan", "ustadz"],
    'keuangan': ["tanggal", "nama_santri", "jenis_pembayaran", "nominal", "metode", "status", "bendahara", "tipe"],
    'arus_kas': ["tanggal", "tipe", "kategori", "nominal", "keterangan", "pj"],
    'users': ["fullname", "username", "password", "password_plain", "role"]
};

export async function GET(request) {
    return handleRequest(request);
}

export async function POST(request) {
    return handleRequest(request);
}

async function handleRequest(request) {
    let db;
    try {
        const context = getRequestContext();
        db = context?.env?.DB;
    } catch (e) {
        return Response.json({ error: "Cloudflare Context Error", details: e.message }, { status: 500 });
    }

    if (!db) {
        return Response.json({
            error: "DATABASE_NOT_BOUND",
            message: "Binding 'DB' tidak terbaca di Runtime. Pastikan nama Binding di Dashboard Cloudflare adalah 'DB' (huruf besar)."
        }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    try {
        if (action === 'getQuickStats') {
            const santriCount = await db.prepare("SELECT COUNT(*) as total FROM santri").first();
            const ustadzCount = await db.prepare("SELECT COUNT(*) as total FROM ustadz").first();
            const keuanganSum = await db.prepare("SELECT SUM(nominal) as total FROM keuangan WHERE tipe = 'Masuk'").first();
            return Response.json({
                santriTotal: santriCount?.total || 0,
                ustadzTotal: ustadzCount?.total || 0,
                keuanganTotal: keuanganSum?.total || 0,
                kasTotal: 0
            });
        }

        if (action === 'getData') {
            if (!type || !headersConfig[type]) {
                return Response.json({ error: "Invalid or missing type: " + type }, { status: 400 });
            }
            if (id) {
                const result = await db.prepare(`SELECT * FROM ${type} WHERE id = ?`).bind(id).first();
                return Response.json(result);
            } else {
                const { results } = await db.prepare(`SELECT * FROM ${type} ORDER BY id DESC`).all();
                return Response.json(results || []);
            }
        }

        if (action === 'saveData') {
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
                const updateStr = fields.map(f => `${f} = ?`).join(', ');
                values.push(body.id);
                await db.prepare(`UPDATE ${type} SET ${updateStr} WHERE id = ?`).bind(...values).run();
                return Response.json({ success: true, message: "Data updated" });
            } else {
                const placeholders = fields.map(() => '?').join(', ');
                await db.prepare(`INSERT INTO ${type} (${fields.join(', ')}) VALUES (${placeholders})`).bind(...values).run();
                return Response.json({ success: true, message: "Data created" });
            }
        }

        if (action === 'deleteData') {
            if (!id || !type) return Response.json({ error: "Missing ID or Type" }, { status: 400 });
            await db.prepare(`DELETE FROM ${type} WHERE id = ?`).bind(id).run();
            return Response.json({ success: true });
        }

        return Response.json({ error: "Unknown action: " + action }, { status: 404 });
    } catch (err) {
        console.error("D1 Execution Error:", err);
        return Response.json({
            error: "Database Execution Error",
            details: err.message,
            action,
            type
        }, { status: 500 });
    }
}
