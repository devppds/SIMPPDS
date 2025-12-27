import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

const headersConfig = {
    'santri': [
        "foto_santri", "stambuk_pondok", "stambuk_madrasah", "tahun_masuk", "kamar", "status_mb",
        "madrasah", "kelas", "nik", "nama_siswa", "nisn",
        "tempat_tanggal_lahir", "jenis_kelamin", "agama", "hobi", "cita_cita",
        "kewarganegaraan", "no_kk", "nik_ayah", "nama_ayah", "pekerjaan_ayah",
        "pendidikan_ayah", "no_telp_ayah", "penghasilan_ayah", "nik_ibu", "nama_ibu",
        "pekerjaan_ibu", "pendidikan_ibu", "no_telp_ibu", "dusun_jalan", "rt_rw",
        "desa_kelurahan", "kecamatan", "kota_kabupaten", "provinsi", "kode_pos",
        "status_santri", "pindah_ke", "tahun_pindah", "tanggal_boyong"
    ],
    'ustadz': ["foto_ustadz", "nama", "nik_nip", "kelas", "alamat", "no_hp", "status", "tanggal_nonaktif"],
    'pengurus': ["foto_pengurus", "nama", "jabatan", "divisi", "no_hp", "tahun_mulai", "tahun_akhir", "status", "tanggal_nonaktif"],
    'keamanan': ["tanggal", "nama_santri", "jenis_pelanggaran", "poin", "takzir", "keterangan", "petugas"],
    'pendidikan': ["tanggal", "nama_santri", "kegiatan", "nilai", "kehadiran", "keterangan", "ustadz"],
    'keuangan': ["tanggal", "nama_santri", "jenis_pembayaran", "nominal", "metode", "status", "bendahara", "tipe"],
    'arus_kas': ["tanggal", "tipe", "kategori", "nominal", "keterangan", "pj"],
    'jenis_tagihan': ["nama_tagihan", "nominal", "keterangan", "aktif"],
    'kamar': ["nama_kamar", "asrama", "kapasitas", "penasihat"],
    'keamanan_reg': ["nama_santri", "jenis_barang", "detail_barang", "jenis_kendaraan", "jenis_elektronik", "plat_nomor", "warna", "merk", "aksesoris_1", "aksesoris_2", "aksesoris_3", "keadaan", "kamar_penempatan", "tanggal_registrasi", "petugas_penerima", "keterangan", "status_barang_reg"],
    'kesehatan': ["nama_santri", "mulai_sakit", "gejala", "obat_tindakan", "status_periksa", "keterangan", "biaya_obat"],
    'izin': ["nama_santri", "alasan", "tanggal_pulang", "tanggal_kembali", "jam_mulai", "jam_selesai", "tipe_izin", "petugas", "keterangan"],
    'barang_sitaan': ["tanggal", "nama_santri", "jenis_barang", "nama_barang", "petugas", "status_barang", "keterangan"],
    'arsiparis': ["tanggal_upload", "nama_dokumen", "kategori", "file_url", "keterangan", "pj"],
    'absensi_formal': ["tanggal", "nama_santri", "lembaga", "status_absen", "keterangan", "petugas_piket"],
    'layanan_info': ["unit", "nama_layanan", "harga", "keterangan", "aktif"],
    'kas_unit': ["tanggal", "unit", "tipe", "kategori", "nominal", "nama_santri", "stambuk", "keterangan", "petugas", "status_setor"],
    'layanan_admin': ["tanggal", "unit", "nama_santri", "stambuk", "jenis_layanan", "nominal", "keterangan", "pj", "pemohon_tipe", "jumlah"],
    'lembaga': ["nama"],
    'users': ["fullname", "username", "password", "password_plain", "role"]
};

async function hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function handleRequest(request) {
    const { env } = getRequestContext();
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { action, type } = params;
    const method = request.method;
    const db = env.DB;

    if (!db) {
        return Response.json({ error: "Database binding 'DB' not found" }, { status: 500 });
    }

    try {
        if (method === 'POST' && action === 'login') {
            const body = await request.json();
            const { username, password } = body;
            const hp = await hashPassword(password);
            const user = await db.prepare("SELECT username, role, fullname FROM users WHERE username = ? AND password = ?")
                .bind(username, hp)
                .first();

            if (!user) {
                return Response.json({ error: "Username atau password salah" }, { status: 401 });
            }
            return Response.json({ user });
        }

        if (action === 'getQuickStats') {
            const santriCount = await db.prepare("SELECT COUNT(*) as total FROM santri").first();
            const ustadzCount = await db.prepare("SELECT COUNT(*) as total FROM ustadz").first();
            const keuanganSum = await db.prepare("SELECT SUM(nominal) as total FROM keuangan WHERE tipe = 'Masuk'").first();

            return Response.json({
                santriTotal: santriCount?.total || 0,
                ustadzTotal: ustadzCount?.total || 0,
                keuanganTotal: keuanganSum?.total || 0,
                kasTotal: 0 // Simplifikasi sementara
            });
        }

        if (method === 'GET' && action === 'getData') {
            const { type: dataType, id } = params;
            if (!headersConfig[dataType]) throw new Error('Invalid type');

            if (id) {
                const data = await db.prepare(`SELECT * FROM ${dataType} WHERE id = ?`).bind(id).first();
                return Response.json(data);
            } else {
                const { results } = await db.prepare(`SELECT * FROM ${dataType} ORDER BY id DESC`).all();
                return Response.json(results);
            }
        }

        // Action lainnya bisa ditambahkan nanti, fokus utama adalah LOGIN dulu
        return Response.json({ error: "Action not implemented" }, { status: 404 });

    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}

export const GET = handleRequest;
export const POST = handleRequest;
