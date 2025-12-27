import { UI } from '../core/ui.js';
import { TableSort } from '../core/table_sort.js';
import { apiCall } from '../core/api.js';

export const AbsensiFormalModule = {
    ...TableSort.createSortableModule('absensi_formal'),

    async init() {
        const titleEl = document.getElementById('view-title');
        if (titleEl) titleEl.textContent = 'Absensi Sekolah Formal';

        const searchInput = document.getElementById('search-absensi_formal');
        if (searchInput) {
            searchInput.oninput = () => this.loadData(searchInput.value);
        }

        await this.loadData();
    },

    async loadData(searchQuery = '') {
        const rows = await UI.loadTableData('absensi_formal', (data) => {
            let filtered = data;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                filtered = filtered.filter(r =>
                    (r.nama_santri || '').toLowerCase().includes(q) ||
                    (r.lembaga || '').toLowerCase().includes(q) ||
                    (r.status_absen || '').toLowerCase().includes(q)
                );
            }
            return filtered;
        });

        const sorted = this.applySorting(rows);
        this.render(sorted);
    },

    render(rows) {
        const tbody = document.querySelector('#absensi_formal-table tbody');
        if (!tbody) return;

        if (!rows || rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:50px;color:var(--text-muted);">Tidak ada data absensi sekolah formal.</td></tr>';
            return;
        }

        tbody.innerHTML = rows.map(row => {
            const rowDataStr = encodeURIComponent(JSON.stringify(row));
            const statusColor = row.status_absen === 'Hadir' ? 'var(--success)' :
                (row.status_absen === 'Alfa/Tanpa Keterangan' ? 'var(--danger)' : 'var(--warning)');

            return `<tr>
                <td>${UI.formatDate(row.tanggal)}</td>
                <td><strong>${row.nama_santri}</strong></td>
                <td><span class="th-badge" style="background:#f1f5f9; color:var(--primary);">${row.lembaga || '-'}</span></td>
                <td><span style="font-weight:600; color:${statusColor}">${row.status_absen || '-'}</span></td>
                <td>${row.petugas_piket || '-'}</td>
                <td style="display:flex; gap:5px;">
                    <button class="btn btn-action btn-blue" title="Detail" onclick="viewDetail('absensi_formal', '${rowDataStr}')"><i class="fas fa-eye"></i></button>
                    ${window.Auth && window.Auth.canEdit('absensi_formal') ? `
                        <button class="btn btn-action btn-yellow" title="Edit" onclick="prepareEdit('absensi_formal', '${row.id}', '${rowDataStr}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-action btn-red" title="Hapus" onclick="deleteItem('absensi_formal', '${row.id}')"><i class="fas fa-trash"></i></button>
                    ` : ''}
                </td>
            </tr>`;
        }).join('');
    }
};

window.AbsensiFormalModule = AbsensiFormalModule;
