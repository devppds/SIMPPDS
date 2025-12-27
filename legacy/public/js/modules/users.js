import { UI } from '../core/ui.js';

export const UsersModule = {
    async init() {
        await this.loadData();
    },

    async loadData() {
        const rows = await UI.loadTableData('users');
        this.render(rows);
    },

    render(rows) {
        const tbody = document.querySelector('#users-table tbody');
        if (!tbody) return;

        if (!rows || rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:50px;color:var(--text-muted);">Belum ada data user.</td></tr>';
            return;
        }

        tbody.innerHTML = rows.map(row => {
            const rowDataStr = encodeURIComponent(JSON.stringify(row));
            return `<tr>
                <td><strong>${row.name}</strong></td>
                <td><span class="th-badge" style="background:#f1f5f9; color:var(--primary); font-family:monospace;">${row.username}</span></td>
                <td><span class="th-badge" style="background:var(--primary)11; color:var(--primary);">${row.role}</span></td>
                <td>********</td>
                <td style="display:flex; gap:5px;">
                    <button class="btn btn-action btn-yellow" title="Edit" onclick="prepareEdit('users', '${row.id}', '${rowDataStr}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-action btn-red" title="Hapus" onclick="deleteItem('users', '${row.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
    }
};
