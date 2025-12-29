// Helper to verify admin role (Async with DB check)
export async function verifyAdmin(request, db) {
    const username = request.headers.get('x-user-id');
    if (!username) return false;

    try {
        const user = await db.prepare("SELECT role FROM users WHERE username = ?").bind(username).first();
        return user?.role === 'admin';
    } catch (e) {
        return false;
    }
}

// Helper to log actions automatically
export async function logAudit(db, request, action, type, id, details = "") {
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

export async function deleteCloudinaryFile(url, env) {
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
