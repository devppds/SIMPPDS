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
    'users': ["fullname", "username", "password", "password_plain", "role"],
    'kamar': ["nama_kamar", "asrama", "kapasitas", "penasihat"],
    'kesehatan': ["nama_santri", "mulai_sakit", "gejala", "obat_tindakan", "status_periksa", "keterangan", "biaya_obat"],
    'izin': ["nama_santri", "alasan", "tanggal_pulang", "tanggal_kembali", "jam_mulai", "jam_selesai", "tipe_izin", "petugas", "keterangan"]
};

export async function GET(request) { return handleRequest(request); }
export async function POST(request) { return handleRequest(request); }

async function handleRequest(request) {
    let env;
    try {
        const context = getRequestContext();
        env = context?.env;
    } catch (e) {
        return Response.json({ error: "Context Error", details: e.message }, { status: 500 });
    }

    const db = env?.DB;
    if (!db) {
        return Response.json({ error: "DATABASE_NOT_BOUND", message: "Binding 'DB' tidak ditemukan." }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    try {
        if (action === 'getQuickStats') {
            const s = await db.prepare("SELECT COUNT(*) as total FROM santri").first();
            const u = await db.prepare("SELECT COUNT(*) as total FROM ustadz").first();
            const k = await db.prepare("SELECT SUM(nominal) as total FROM keuangan WHERE tipe = 'Masuk'").first();
            return Response.json({ santriTotal: s?.total || 0, ustadzTotal: u?.total || 0, keuanganTotal: k?.total || 0, kasTotal: 0 });
        }

        if (action === 'getData') {
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
                const q = `INSERT INTO ${type} (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`;
                await db.prepare(q).bind(...values).run();
                return Response.json({ success: true });
            }
        }

        if (action === 'deleteData') {
            await db.prepare(`DELETE FROM ${type} WHERE id = ?`).bind(id).run();
            return Response.json({ success: true });
        }

        if (action === 'getCloudinarySignature') {
            const body = await request.json();
            const paramsToSign = body.data?.paramsToSign || body.paramsToSign;
            const apiSecret = env.CLOUDINARY_API_SECRET;

            const sortedKeys = Object.keys(paramsToSign).sort();
            const signString = sortedKeys.map(k => `${k}=${paramsToSign[k]}`).join('&') + apiSecret;
            const encoder = new TextEncoder();
            const hashBuffer = await crypto.subtle.digest('SHA-1', encoder.encode(signString));
            const signature = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

            return Response.json({
                signature,
                apiKey: env.CLOUDINARY_API_KEY,
                cloudName: env.CLOUDINARY_CLOUD_NAME
            });
        }

        return Response.json({ error: "Unknown action: " + action }, { status: 404 });
    } catch (err) {
        return Response.json({ error: "Critical Execution Error", details: err.message }, { status: 500 });
    }
}
