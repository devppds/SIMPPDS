import { UI } from './ui.js';

export const GenericModule = {
    async init(type, renderFn) {
        const rows = await UI.loadTableData(type);
        if (renderFn) renderFn(rows);
        else this.defaultRender(type, rows);
    },

    defaultRender(type, rows) {
        const tbody = document.querySelector(`#${type}-table tbody`);
        if (!tbody) return;

        if (rows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:30px;">Tidak ada data.</td></tr>`;
            return;
        }

        tbody.innerHTML = rows.map(row => {
            const rowDataStr = encodeURIComponent(JSON.stringify(row));
            const keys = Object.keys(row).slice(0, 4);
            const cols = keys.map(k => `<td>${row[k] || '-'}</td>`).join('');

            return `<tr>${cols}<td style="display:flex; gap:5px;">
                <button class="btn btn-secondary" style="padding:5px 10px;" onclick="prepareEdit('${type}', '${row.id}', '${rowDataStr}')"><i class="fas fa-edit"></i></button>
            </td></tr>`;
        }).join('');
    }
};
