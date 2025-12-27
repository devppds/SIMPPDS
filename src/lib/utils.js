export const formatCurrency = (val) => {
    if (!val) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
};

export const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
        return dateStr;
    }
};

export const apiCall = async (action, method = 'GET', options = {}) => {
    const { type, id, data } = options;
    let url = `/api/data?action=${action}`;
    if (type) url += `&type=${type}`;
    if (id) url += `&id=${id}`;

    const config = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };

    if (data) config.body = JSON.stringify(data);

    try {
        const res = await fetch(url, config);
        const contentType = res.headers.get('content-type');

        let result;
        if (contentType && contentType.includes('application/json')) {
            result = await res.json();
        } else {
            result = { message: await res.text() };
        }

        if (!res.ok) {
            throw new Error(result.error || result.message || 'API Call failed');
        }
        return result;
    } catch (err) {
        if (err.message.includes('Unexpected end of JSON input')) {
            throw new Error('API returning non-JSON response. Check backend logs.');
        }
        throw err;
    }
};

export const exportToCSV = (data, filename, headers) => {
    if (!data || !data.length) return;

    const csvRows = [];
    // Header row
    csvRows.push(headers.join(','));

    // Data rows
    for (const row of data) {
        const values = headers.map(header => {
            const escaped = ('' + (row[header.toLowerCase().replace(/ /g, '_')] || '')).replace(/"/g, '\\"');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
