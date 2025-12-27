// Cloudflare Pages Mode: Unified Frontend & Backend
const API_BASE = '/api';
const APP_VERSION = '2.0.0';
const cache = new Map();

export async function apiCall(action, method = 'GET', data = null) {
    let url = `${API_BASE}?action=${action}`;
    const options = { method };

    if (method === 'GET' && data) {
        const params = new URLSearchParams(data);
        url += '&' + params.toString();
    } else if ((method === 'POST' || method === 'PUT') && data) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(data);
    } else if (method === 'DELETE' && data) {
        const params = new URLSearchParams(data);
        url += '&' + params.toString();
    }

    // Cache logic
    const cacheKey = `${method}:${url}`;
    if (method === 'GET' && cache.has(cacheKey)) {
        const entry = cache.get(cacheKey);
        if (Date.now() - entry.timestamp < 10000) { // 10s cache
            console.log(`[v${APP_VERSION}] Cache HIT: ${action}`);
            return entry.data;
        }
    }

    try {
        console.log(`[v${APP_VERSION}] API ${method} ${action} init`);
        const response = await fetch(url, options);

        if (response.status === 401) {
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            throw new Error(`Server Error (${response.status})`);
        }

        const result = await response.json();

        // Clear cache if data is modified
        if (['POST', 'PUT', 'DELETE'].includes(method)) {
            cache.clear();
        } else if (method === 'GET') {
            cache.set(cacheKey, { data: result, timestamp: Date.now() });
        }

        return result;
    } catch (error) {
        console.error(`[v${APP_VERSION}] API Error:`, { action, error });
        if (error.message === 'Unauthorized') throw error;

        if (action !== 'getQuickStats') {
            alert('Koneksi terputus atau server tidak merespon. Mohon cek internet Anda.\n\nDetail: ' + error.message);
        }
        throw error;
    }
}

window.apiCall = apiCall;
