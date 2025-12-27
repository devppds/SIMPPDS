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
    'izin': ["nama_santri", "alasan", "tanggal_pulang", "tanggal_kembali", "jam_mulai", "jam_selesai", "tipe_izin", "petugas", "keterangan"],
    'barang_sitaan': ["tanggal", "nama_santri", "jenis_barang", "nama_barang", "petugas", "status_barang", "keterangan"],
    'keamanan_reg': ["nama_santri", "jenis_barang", "detail_barang", "jenis_kendaraan", "jenis_elektronik", "plat_nomor", "warna", "merk", "aksesoris_1", "aksesoris_2", "aksesoris_3", "keadaan", "kamar_penempatan", "tanggal_registrasi", "petugas_penerima", "keterangan", "status_barang_reg"],
    'kas_unit': ["tanggal", "unit", "tipe", "kategori", "nominal", "nama_santri", "stambuk", "keterangan", "petugas", "status_setor"],
    'jenis_tagihan': ["nama_tagihan", "nominal", "keterangan", "aktif"],
    'layanan_info': ["unit", "nama_layanan", "harga", "keterangan", "aktif"],
    'layanan_admin': ["tanggal", "unit", "nama_santri", "stambuk", "jenis_layanan", "nominal", "keterangan", "pj", "pemohon_tipe", "jumlah"],
    'arsiparis': ["tanggal_upload", "nama_dokumen", "kategori", "file_url", "keterangan", "pj"],
    'absensi_formal': ["tanggal", "nama_santri", "lembaga", "status_absen", "keterangan", "petugas_piket"],
    'lembaga': ["nama"]
};

export async function GET(request) { return handle(request); }
export async function POST(request) { return handle(request); }

async function handle(request) {
    let env;
    try {
        const ctx = getRequestContext();
        env = ctx.env;
    } catch (e) {
        return Response.json({ status: "error", error: "Context Missing", details: e.message }, { status: 500 });
    }

    if (!env || !env.DB) {
        return Response.json({ status: "error", error: "DATABASE_NOT_BOUND" }, { status: 500 });
    }

    const db = env.DB;
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const type = url.searchParams.get('type');
    const id = url.searchParams.get('id');

    try {
        if (action === 'getQuickStats') {
            const s = await db.prepare("SELECT COUNT(*) as total FROM santri").first();
            const u = await db.prepare("SELECT COUNT(*) as total FROM ustadz").first();
            const k = await db.prepare("SELECT SUM(nominal) as total FROM keuangan WHERE tipe = 'Masuk'").first();
            return Response.json({ santriTotal: s?.total || 0, ustadzTotal: u?.total || 0, keuanganTotal: k?.total || 0, kasTotal: 0 });
        }

        if (action === 'getData') {
            if (!type || !headersConfig[type]) return Response.json({ error: "Invalid type" }, { status: 400 });
            if (id) {
                const res = await db.prepare(`SELECT * FROM ${type} WHERE id = ?`).bind(id).first();
                return Response.json(res);
            } else {
                const { results } = await db.prepare(`SELECT * FROM ${type} ORDER BY id DESC`).all();
                return Response.json(results || []);
            }
        }

        if (action === 'saveData') {
            const body = await request.json();
            const config = headersConfig[type];
            if (!config) return Response.json({ error: "Invalid type: " + type }, { status: 400 });

            const fields = [];
            const values = [];
            config.forEach(col => {
                if (body.hasOwnProperty(col)) {
                    fields.push(col);
                    values.push(body[col] === '' ? null : body[col]);
                }
            });

            if (body.id) {
                const setClause = fields.map(f => `${f} = ?`).join(', ');
                values.push(body.id);
                await db.prepare(`UPDATE ${type} SET ${setClause} WHERE id = ?`).bind(...values).run();
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

        if (action === 'getCloudinarySignature') {
            const body = await request.json();
            const paramsToSign = body.data?.paramsToSign || body.paramsToSign;
            const apiSecret = env.CLOUDINARY_API_SECRET;
            const sortedKeys = Object.keys(paramsToSign).sort();
            const signString = sortedKeys.map(k => `${k}=${paramsToSign[k]}`).join('&') + apiSecret;
            const encoder = new TextEncoder();
            const hashBuffer = await crypto.subtle.digest('SHA-1', encoder.encode(signString));
            const signature = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
            return Response.json({ signature, apiKey: env.CLOUDINARY_API_KEY, cloudName: env.CLOUDINARY_CLOUD_NAME });
        }

        return Response.json({ error: "Unknown Action" }, { status: 404 });
    } catch (err) {
        return Response.json({ status: "error", error: "Runtime Error", details: err.message }, { status: 500 });
    }
}
