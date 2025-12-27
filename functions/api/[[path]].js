const APP_VERSION = '4.2.0-d1';

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

// HELPER: Sign Cloudinary Request
async function signCloudinary(params, apiSecret) {
    const sortedKeys = Object.keys(params).sort();
    const signString = sortedKeys
        .map(key => `${key}=${params[key]}`)
        .join('&') + apiSecret;

    const encoder = new TextEncoder();
    const data = encoder.encode(signString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// HELPER: Simple SHA-256 Hash
async function hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { action, type } = params;
    const method = request.method;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
        'Content-Type': 'application/json'
    };

    if (method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const db = env.DB;

        // HELPER: Auto-initialize any table if it doesn't exist
        async function ensureTable(tableName) {
            if (!headersConfig[tableName]) return;
            try {
                const cols = headersConfig[tableName].map(col => {
                    if (col === 'id') return "id INTEGER PRIMARY KEY AUTOINCREMENT";
                    // Special types
                    if (col === 'password' && tableName === 'users') return "password TEXT";
                    if (col === 'username' && tableName === 'users') return "username TEXT UNIQUE";
                    return `${col} TEXT`;
                });

                // Ensure 'id' is always there even if not in headersConfig (D1 needs a PK usually)
                const schema = ["id INTEGER PRIMARY KEY AUTOINCREMENT", ...cols].join(', ');

                await db.prepare(`CREATE TABLE IF NOT EXISTS ${tableName} (${schema})`).run();

                // Safety: Ensure password_plain exists if it's the users table (for existing DBs)
                if (tableName === 'users') {
                    try {
                        await db.prepare("ALTER TABLE users ADD COLUMN password_plain TEXT").run();
                    } catch (e) { /* already exists */ }
                }

                // Special Case: Seed Users if it was just created/empty
                if (tableName === 'users') {
                    const check = await db.prepare("SELECT COUNT(*) as total FROM users").first();
                    if (check && check.total === 0) {
                        const users = [
                            ['admin', 'admin123', 'admin', 'Administrator'],
                            ['bendahara', 'uang123', 'bendahara', 'Bendahara Pondok'],
                            ['sekretariat', 'sekret123', 'sekretariat', 'Sekretariat'],
                            ['keamanan', 'aman123', 'keamanan', 'Bagian Keamanan'],
                            ['pendidikan', 'didik123', 'pendidikan', 'Bagian Pendidikan'],
                            ['kesehatan', 'sehat123', 'kesehatan', 'Bagian Kesehatan'],
                            ['jamiyyah', 'jam123', 'jamiyyah', 'Jamiyyah'],
                            ['madrasah_miu', 'miu123', 'madrasah_miu', 'Madrasah MIU']
                        ];
                        for (const u of users) {
                            const hp = await hashPassword(u[1]);
                            await db.prepare("INSERT INTO users (username, password, password_plain, role, fullname) VALUES (?, ?, ?, ?, ?)").bind(u[0], hp, u[1], u[2], u[3]).run();
                        }
                    }
                }
            } catch (e) {
                console.error(`Table Init Error [${tableName}]:`, e.message);
            }
        }

        // --- AUTH & SETTINGS ---
        if (method === 'POST' && action === 'initAuth') {
            for (const table of Object.keys(headersConfig)) {
                await ensureTable(table);
            }
            return new Response(JSON.stringify({ message: "All tables checked/initialized." }), { headers: corsHeaders });
        }

        if (method === 'POST' && action === 'login') {
            await ensureTable('users');
            const body = await request.json();
            const { username, password } = body;
            const hp = await hashPassword(password);
            const user = await db.prepare("SELECT username, role, fullname FROM users WHERE username = ? AND password = ?").bind(username, hp).first();

            if (!user) {
                return new Response(JSON.stringify({ error: "Username atau password salah" }), { status: 401, headers: corsHeaders });
            }
            return new Response(JSON.stringify({ user }), { headers: corsHeaders });
        }

        if (method === 'POST' && action === 'getCloudinarySignature') {
            const body = await request.json();
            const { paramsToSign } = body;
            const apiSecret = env.CLOUDINARY_API_SECRET;
            if (!apiSecret) return new Response(JSON.stringify({ error: "Cloudinary secret missing" }), { status: 500, headers: corsHeaders });
            const signature = await signCloudinary(paramsToSign, apiSecret);
            return new Response(JSON.stringify({
                signature,
                apiKey: env.CLOUDINARY_API_KEY,
                cloudName: env.CLOUDINARY_CLOUD_NAME,
                uploadPreset: env.CLOUDINARY_UPLOAD_PRESET
            }), { headers: corsHeaders });
        }

        if (method === 'POST' && action === 'changePassword') {
            const body = await request.json();
            const { username, oldPassword, newPassword } = body;
            const hop = await hashPassword(oldPassword);
            const user = await db.prepare("SELECT id FROM users WHERE username = ? AND password = ?").bind(username, hop).first();

            if (!user) return new Response(JSON.stringify({ error: "Password lama salah" }), { status: 403, headers: corsHeaders });

            const hnp = await hashPassword(newPassword);
            await db.prepare("UPDATE users SET password = ?, password_plain = ? WHERE id = ?").bind(hnp, newPassword, user.id).run();
            return new Response(JSON.stringify({ message: "Password updated" }), { headers: corsHeaders });
        }

        // --- CORE DATA ACTIONS ---
        if (action === 'getQuickStats') {
            const getCount = async (tbl) => {
                try {
                    const r = await db.prepare(`SELECT COUNT(*) as total FROM ${tbl}`).first();
                    return r?.total || 0;
                } catch {
                    await ensureTable(tbl);
                    return 0;
                }
            };
            const getSum = async (tbl, col, cond = "") => {
                try {
                    const query = cond ? `SELECT SUM(${col}) as total FROM ${tbl} WHERE ${cond}` : `SELECT SUM(${col}) as total FROM ${tbl}`;
                    const r = await db.prepare(query).first();
                    return r?.total || 0;
                } catch {
                    await ensureTable(tbl);
                    return 0;
                }
            };

            const santriCount = await getCount('santri');
            const ustadzCount = await getCount('ustadz');
            const keuanganSum = await getSum('keuangan', 'nominal', "tipe = 'Masuk'");

            // Fix Arus Kas Sum: Masuk - Keluar
            let kasTotal = 0;
            try {
                const results = await db.prepare("SELECT tipe, nominal FROM arus_kas").all();
                (results.results || []).forEach(row => {
                    const nom = parseInt(row.nominal || 0);
                    if (row.tipe === 'Masuk') kasTotal += nom;
                    else kasTotal -= nom;
                });
            } catch { await ensureTable('arus_kas'); }

            return new Response(JSON.stringify({
                santriTotal: santriCount,
                ustadzTotal: ustadzCount,
                keuanganTotal: keuanganSum,
                kasTotal: kasTotal
            }), { headers: corsHeaders });
        }

        if (method === 'GET' && action === 'getData') {
            const { type, id } = params;
            if (!headersConfig[type]) throw new Error('Invalid type');
            await ensureTable(type); // AUTO-OPEN Table

            if (id) {
                const data = await db.prepare(`SELECT * FROM ${type} WHERE id = ?`).bind(id).first();
                return new Response(JSON.stringify(data), { headers: corsHeaders });
            } else {
                const { results } = await db.prepare(`SELECT * FROM ${type} ORDER BY id DESC`).all();
                return new Response(JSON.stringify(results), { headers: corsHeaders });
            }
        }

        if (method === 'POST' && action === 'saveData') {
            const dataType = type;
            const data = await request.json();
            const config = headersConfig[dataType];

            if (!config) throw new Error('Invalid type');
            await ensureTable(dataType);

            // Hash password for users if provided
            if (dataType === 'users' && data.password) {
                data.password_plain = data.password;
                data.password = await hashPassword(data.password);
            }

            const fields = [];
            const placeholders = [];
            const values = [];

            config.forEach(col => {
                if (data.hasOwnProperty(col)) {
                    fields.push(col);
                    placeholders.push('?');
                    values.push(data[col] === '' ? null : data[col]);
                }
            });

            if (data.id) {
                const updateCols = fields.map(f => `${f} = ?`).join(', ');
                values.push(data.id);
                await db.prepare(`UPDATE ${dataType} SET ${updateCols} WHERE id = ?`).bind(...values).run();
                return new Response(JSON.stringify({ message: 'Updated' }), { headers: corsHeaders });
            } else {
                await db.prepare(`INSERT INTO ${dataType} (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`).bind(...values).run();
                return new Response(JSON.stringify({ message: 'Created' }), { headers: corsHeaders });
            }
        }

        if (action === 'deleteData') {
            const { type, id } = params;
            if (!headersConfig[type]) throw new Error('Invalid type');
            await db.prepare(`DELETE FROM ${type} WHERE id = ?`).bind(id).run();
            return new Response(JSON.stringify({ message: 'Deleted' }), { headers: corsHeaders });
        }

        return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, headers: corsHeaders });

    } catch (err) {
        console.error('API Error:', err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
}
