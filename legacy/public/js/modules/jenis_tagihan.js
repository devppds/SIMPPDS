import { UI } from '../core/ui.js';
import { TableSort } from '../core/table_sort.js';

export const Jenis_tagihanModule = {
    ...TableSort.createSortableModule('jenis_tagihan'),

    async init() {
        const searchInput = document.getElementById('search-jenis_tagihan');
        if (searchInput) {
            searchInput.oninput = () => this.loadData(searchInput.value);
        }

        await this.loadData();
    },

    async loadData(searchQuery = '') {
        let rows = await UI.loadTableData('jenis_tagihan', (data) => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return data.filter(r =>
                    (r.nama_tagihan || '').toLowerCase().includes(q) ||
                    (r.keterangan || '').toLowerCase().includes(q)
                );
            }
            return data;
        });

        rows = this.applySorting(rows);
        this.render(rows);
    },

    render(rows) {
        this.updateHeaders();
        const tbody = document.querySelector('#jenis_tagihan-table tbody');
        if (!tbody) return;

        if (!rows || rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:50px;color:var(--text-muted);">Belum ada data tagihan.</td></tr>';
            return;
        }

        tbody.innerHTML = rows.map(row => {
            const rowDataStr = encodeURIComponent(JSON.stringify(row));
            const statusColor = row.aktif === 'Aktif' || row.aktif === true ? '#10b981' : '#ef4444';
            const statusText = row.aktif === 'Aktif' || row.aktif === true ? 'Aktif' : 'Non-Aktif';

            return `<tr>
                <td><strong>${row.nama_tagihan}</strong></td>
                <td><span style="font-weight:700;">Rp ${(Number(row.nominal) || 0).toLocaleString('id-ID')}</span></td>
                <td><span class="th-badge" style="background:#f1f5f9; color:var(--primary);">${row.keterangan || '-'}</span></td>
                <td><span class="th-badge" style="background:${statusColor}11; color:${statusColor}; border:1px solid ${statusColor}33;">${statusText}</span></td>
                <td style="display:flex; gap:5px;">
                    <button class="btn btn-action btn-yellow" title="Edit" onclick="prepareEdit('jenis_tagihan', '${row.id}', '${rowDataStr}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-action btn-red" title="Hapus" onclick="deleteItem('jenis_tagihan', '${row.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
    },

    updateHeaders() {
        const thead = document.querySelector('#jenis_tagihan-table thead tr');
        if (!thead) return;

        thead.innerHTML = `
            ${this.createSortableHeader('Nama Tagihan', 'nama_tagihan')}
            ${this.createSortableHeader('Nominal', 'nominal')}
            ${this.createSortableHeader('Kelompok', 'keterangan')}
            ${this.createSortableHeader('Status', 'aktif')}
            ${this.createSortableHeader('Aksi', null, '120px')}
        `;
    }
};

window.Jenis_tagihanModule = Jenis_tagihanModule;
