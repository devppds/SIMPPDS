export async function handleGetCloudinarySignature(request, env) {
    const body = await request.json();
    const paramsToSign = body.data?.paramsToSign || body.paramsToSign;
    const apiSecret = env.CLOUDINARY_API_SECRET?.trim();
    const apiKey = env.CLOUDINARY_API_KEY?.trim();
    const cloudName = env.CLOUDINARY_CLOUD_NAME?.trim();

    if (!apiSecret || !apiKey || !cloudName) {
        return Response.json({ status: "error", message: "Konfigurasi Cloudinary tidak ditemukan." }, { status: 500 });
    }

    const sortedKeys = Object.keys(paramsToSign).sort();
    const signString = sortedKeys.map(k => `${k}=${paramsToSign[k]}`).join('&') + apiSecret;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-1', encoder.encode(signString));
    const signature = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    return Response.json({ signature, apiKey, cloudName });
}
