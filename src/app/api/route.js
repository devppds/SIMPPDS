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

async function hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function GET(request) { return handle(request); }
export async function POST(request) { return handle(request); }

async function handle(request) {
    let env;
    try {
        const context = getRequestContext();
        env = context?.env;
    } catch (e) {
        return Response.json({ error: "Fatal: getRequestContext failed", details: e.message }, { status: 500 });
    }

    if (!env || !env.DB) {
        return Response.json({
            error: "DATABASE_NOT_FOUND",
            message: "Koneksi database (D1 Binding) belum terpasang di Cloudflare Dashboard.",
            instruction: "Silakan ke Dashboard Cloudflare > Pages > SIMPPDS > Settings > Functions > D1 database bindings, lalu tambahkan binding dengan nama 'DB' ke database 'sim-ppds-db'."
        }, { status: 500 });
    }

    const { DB: db } = env;
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const type = url.searchParams.get('type');
    const id = url.searchParams.get('id');

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
            if (!headersConfig[type]) return Response.json({ error: "Invalid type" }, { status: 400 });
            if (id) {
                const data = await db.prepare(`SELECT * FROM ${type} WHERE id = ?`).bind(id).first();
                return Response.json(data);
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
                if (body.hasOwnProperty(col)) {
                    fields.push(col);
                    values.push(body[col] === '' ? null : body[col]);
                }
            });

            if (body.id) {
                const updateStr = fields.map(f => `${f} = ?`).join(', ');
                values.push(body.id);
                await db.prepare(`UPDATE ${type} SET ${updateStr} WHERE id = ?`).bind(...values).run();
                return Response.json({ success: true });
            } else {
                const placeholders = fields.map(() => '?').join(', ');
                await db.prepare(`INSERT INTO ${type} (${fields.join(', ')}) VALUES (${placeholders})`).bind(...values).run();
                return Response.json({ success: true });
            }
        }

        if (action === 'deleteData') {
            await db.prepare(`DELETE FROM ${type} WHERE id = ?`).bind(id).run();
            return Response.json({ success: true });
        }

        if (action === 'login') {
            const { username, password } = await request.json();
            const hp = await hashPassword(password);
            const user = await db.prepare("SELECT username, role, fullname FROM users WHERE username = ? AND password = ?").bind(username, hp).first();
            if (!user) return Response.json({ error: "Login gagal" }, { status: 401 });
            return Response.json({ user });
        }

        return Response.json({ error: "Unknown action" }, { status: 404 });
    } catch (err) {
        return Response.json({ error: "Runtime Error", details: err.message }, { status: 500 });
    }
}
