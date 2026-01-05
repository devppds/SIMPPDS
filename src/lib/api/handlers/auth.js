/**
 * Auth Handler for OTP via WhatsApp (Fonnte)
 */

export async function handleSendOtp(request, db) {
    const { target } = await request.json();
    if (!target) return Response.json({ error: "Kolom target (Email/WA) wajib diisi" }, { status: 400 });

    // 1. Generate OTP (6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    // 2. Save OTP to users table (or a temporary table, but we added columns to users table)
    // If target is WA number, it might not exist yet in 'users' table if it's a new registration.
    // So we'll try to update existing or just respond with success for demo if it's new.
    // For real registration, we might need a separate 'temporary_registrations' table, 
    // but the user asked to add columns to 'users', so we'll assume we find by email or no_hp.

    // Check if user exists by no_hp or email
    let user = await db.prepare("SELECT * FROM users WHERE no_hp = ? OR email = ?")
        .bind(target, target).first();

    if (!user) {
        // For Registration: Create a 'pending' user or just use a dedicated table.
        // Since we are adding to 'users' table, let's create a pending user.
        const tempUsername = 'user_' + Date.now();
        await db.prepare("INSERT INTO users (username, password, no_hp, email, otp_code, otp_expires, role, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, 0)")
            .bind(tempUsername, 'pending_otp', target, target, otp, expires, 'absen_pengurus').run();
    } else {
        // For Login/Verification: Update existing
        await db.prepare("UPDATE users SET otp_code = ?, otp_expires = ? WHERE id = ?")
            .bind(otp, expires, user.id).run();
    }

    // 3. Get WhatsApp Config
    const configs = await db.prepare("SELECT key, value FROM system_configs WHERE key IN ('whatsapp_token', 'whatsapp_api_url')").all();
    const configMap = Object.fromEntries(configs.results.map(c => [c.key, c.value]));

    const token = configMap.whatsapp_token;
    const apiUrl = configMap.whatsapp_api_url || 'https://api.fonnte.com/send';

    if (!token || token === 'ISI_TOKEN_FONNTE_DISINI') {
        return Response.json({
            success: false,
            error: "CONFIG_MISSING",
            message: "Token WhatsApp belum dikonfigurasi di Pengaturan Sistem."
        }, { status: 500 });
    }

    // 4. Send Message via Fonnte
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': token
            },
            body: new URLSearchParams({
                target: target,
                message: `*PONDOK PESANTREN DARUSSALAM LIRBOYO*
_Sistem Informasi Manajemen (SIM-PPDS)_

--------------------------------------------------
*KODE VERIFIKASI (OTP)*
--------------------------------------------------

Halo Khodimin, 

Kode verifikasi Anda adalah: 
*${otp}*

Kode ini bersifat *RAHASIA* dan berlaku selama *5 menit*. 
Mohon jangan bagikan kode ini kepada siapapun demi keamanan akun Anda.

Terima Kasih,
*Admin SIM-PPDS*`
            })
        });

        const result = await response.json();

        if (result.status) {
            return Response.json({ success: true, message: "OTP terkirim via WhatsApp" });
        } else {
            return Response.json({ success: false, error: "GATEWAY_ERROR", message: result.reason || "Gagal mengirim pesan via WhatsApp" }, { status: 500 });
        }
    } catch (err) {
        return Response.json({ success: false, error: "FETCH_ERROR", message: err.message }, { status: 500 });
    }
}

export async function handleVerifyOtp(request, db) {
    const { target, otp } = await request.json();

    const user = await db.prepare("SELECT * FROM users WHERE (no_hp = ? OR email = ?) AND otp_code = ?")
        .bind(target, target, otp).first();

    if (!user) {
        return Response.json({ success: false, error: "INVALID_OTP", message: "Kode OTP salah atau tidak ditemukan." }, { status: 400 });
    }

    // Check expiry
    const now = new Date().toISOString();
    if (user.otp_expires < now) {
        return Response.json({ success: false, error: "EXPIRED_OTP", message: "Kode OTP sudah kedaluwarsa. Silakan kirim ulang." }, { status: 400 });
    }

    // OTP Valid! Update user status
    await db.prepare("UPDATE users SET is_verified = 1, otp_code = NULL, otp_expires = NULL WHERE id = ?")
        .bind(user.id).run();

    return Response.json({
        success: true,
        message: "Verifikasi Berhasil!",
        user: {
            id: user.id,
            username: user.username,
            fullname: user.fullname,
            role: user.role
        }
    });
}

export async function handleGoogleLogin(request, db) {
    const { idToken } = await request.json();
    if (!idToken) return Response.json({ error: "Token Google tidak valid" }, { status: 400 });

    try {
        // 1. Verify Token via Google API
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        const payload = await verifyRes.json();

        if (payload.error) {
            return Response.json({ status: "error", message: "Verifikasi Google Gagal: " + payload.error_description }, { status: 401 });
        }

        const email = payload.email;
        const name = payload.name;
        const googleId = payload.sub;

        // 2. Check if user exists by email
        let user = await db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();

        if (!user) {
            // Auto Register if user doesn't exist? (Or reject?)
            // For now, let's create a new user with default role
            const username = email.split('@')[0] + '_' + Math.random().toString(36).substring(7);
            await db.prepare("INSERT INTO users (username, fullname, email, password, role, is_verified) VALUES (?, ?, ?, ?, ?, 1)")
                .bind(username, name, email, 'google_auth', 'absen_pengurus').run();

            user = await db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
        }

        return Response.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                fullname: user.fullname,
                role: user.role,
                avatar: user.avatar || payload.picture
            }
        });

    } catch (err) {
        return Response.json({ status: "error", message: err.message }, { status: 500 });
    }
}

