// Build trigger: update Cloudinary configuration
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

const headersConfig = {
    'santri': ["stambuk_pondok", "stambuk_madrasah", "tahun_masuk", "kamar", "status_mb", "madrasah", "kelas", "nik", "nisn", "nama_siswa", "tempat_tanggal_lahir", "jenis_kelamin", "agama", "kewarganegaraan", "anak_ke", "alamat", "dusun_jalan", "desa_kelurahan", "kecamatan", "kota_kabupaten", "provinsi", "kode_pos", "hobi", "cita_cita", "asal_sekolah", "no_kk", "nama_ayah", "nik_ayah", "tempat_tanggal_lahir_ayah", "pendidikan_ayah", "pekerjaan_ayah", "penghasilan_ayah", "no_telp_ayah", "nama_ibu", "nik_ibu", "tempat_tanggal_lahir_ibu", "pendidikan_ibu", "pekerjaan_ibu", "penghasilan_ibu", "no_telp_ibu", "status_santri", "tanggal_nonaktif", "alasan_nonaktif", "foto_santri", "created_at", "pindah_ke", "tahun_pindah", "tanggal_boyong", "jumlah_saudara", "pendidikan_terakhir", "no_ijazah", "tempat_lahir", "tanggal_lahir", "foto_kk"],
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
    'keuangan_kas': ["tanggal", "tipe", "kategori", "nominal", "keterangan", "pembayaran_id", "petugas"]
};

const FILE_COLUMNS = {
    'santri': ["foto_santri", "foto_kk"],
    'ustadz': ["foto_ustadz"],
    'pengurus': ["foto_pengurus"],
    'arsip_surat': ["file_surat"],
    'arsip_proposal': ["file_proposal"],
    'arsip_akta_tanah': ["file_akta"],
    'arsip_pengurus_periode': ["foto_pengurus"],
    'arsip_pengajar_periode': ["foto_pengajar"]
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
            message: "Gagal mengambil Cloudflare Context. Pastikan file dikelola oleh next-on-pages.",
            details: e.message
        }, { status: 500 });
    }

    if (!env || !env.DB) {
        return Response.json({
            status: "error",
            error: "DATABASE_NOT_BOUND",
            message: "Database 'DB' tidak terbaca. Pastikan sudah di-bind di Dashboard Cloudflare."
        }, { status: 500 });
    }

    const { DB: db } = env;

    try {
        if (action === 'ping') {
            await db.prepare("SELECT 1").run();
            return Response.json({ status: "success", message: "Koneksi D1 Aktif!" });
        }

        if (action === 'getQuickStats') {
            const s = await db.prepare("SELECT COUNT(*) as total FROM santri").first();
            const u = await db.prepare("SELECT COUNT(*) as total FROM ustadz").first();
            return Response.json({ santriTotal: s?.total || 0, ustadzTotal: u?.total || 0, keuanganTotal: 0, kasTotal: 0 });
        }

        if (action === 'getData') {
            if (!type || !headersConfig[type]) return Response.json({ error: "Invalid type" }, { status: 400 });
            const { results } = await db.prepare(`SELECT * FROM ${type} ORDER BY id DESC`).all();
            return Response.json(results || []);
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
                    message: "Konfigurasi Cloudinary (API Key/Secret/Cloud Name) tidak ditemukan di Environment Variables Cloudflare. Silakan atur di Dashboard Cloudflare Pages.",
                    missing: {
                        secret: !apiSecret,
                        key: !apiKey,
                        name: !cloudName
                    }
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
            details: err.message,
            action,
            type
        }, { status: 500 });
    }
}
