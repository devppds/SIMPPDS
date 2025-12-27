import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';
// Version: 1.0.1 - Deploy Refresh

async function hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(request) {
    const { env } = getRequestContext();
    const db = env.DB;

    if (!db) {
        return Response.json({ error: "Database binding 'DB' not ditemukan di Cloudflare" }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { username, password } = body;

        // Hash password input untuk mengecek ke DB yang tersimpan dalam bentuk hash
        const hashedPassword = await hashPassword(password);

        const user = await db.prepare("SELECT username, role, fullname FROM users WHERE username = ? AND password = ?")
            .bind(username, hashedPassword)
            .first();

        if (!user) {
            return Response.json({ error: "Username atau password salah" }, { status: 401 });
        }

        return Response.json({ user });
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}
