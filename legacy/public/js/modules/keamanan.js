import { UI } from '../core/ui.js';
import { TableSort } from '../core/table_sort.js';

export const KeamananModule = {
    ...TableSort.createSortableModule('keamanan'),

    async init() {
        const searchInput = document.getElementById('search-keamanan');
        if (searchInput) {
            searchInput.oninput = () => this.loadData(searchInput.value);
        }
        await this.loadData();
    },

    async loadData(searchQuery = '') {
        let rows = await UI.loadTableData('keamanan', (data) => {
            if (!searchQuery) return data;
            const q = searchQuery.toLowerCase();
            return data.filter(r =>
                (r.nama_santri || '').toLowerCase().includes(q) ||
                (r.jenis_pelanggaran || '').toLowerCase().includes(q) ||
                (r.petugas || '').toLowerCase().includes(q)
            );
        });

        rows = this.applySorting(rows);
        this.render(rows);
    },

    render(rows) {
        this.renderStats(rows);
        this.updateHeaders();

        const tbody = document.querySelector('#keamanan-table tbody');
        if (!tbody) return;

        if (!rows || rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:50px;color:var(--text-muted);">Belum ada catatan pelanggaran.</td></tr>';
            return;
        }

        tbody.innerHTML = rows.map(row => {
            const rowDataStr = encodeURIComponent(JSON.stringify(row));
            const badgeColor = row.jenis_pelanggaran === 'Berat' ? '#ef4444' : row.jenis_pelanggaran === 'Sedang' ? '#f59e0b' : '#3b82f6';

            return `<tr>
                <td>${UI.formatDate(row.tanggal)}</td>
                <td><strong>${row.nama_santri}</strong></td>
                <td><span class="th-badge" style="background:${badgeColor}11; color:${badgeColor}; border:1px solid ${badgeColor}33;">${row.jenis_pelanggaran}</span></td>
                <td>${row.takzir || '-'}</td>
                <td>${row.petugas || '-'}</td>
                <td style="display:flex; gap:5px;">
                    <button class="btn btn-action btn-blue" onclick="viewDetail('keamanan', '${rowDataStr}')"><i class="fas fa-eye"></i></button>
                    ${window.Auth && window.Auth.canEdit('keamanan') ? `
                        <button class="btn btn-action btn-yellow" onclick="prepareEdit('keamanan', '${row.id}', '${rowDataStr}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-action btn-red" onclick="deleteItem('keamanan', '${row.id}')"><i class="fas fa-trash"></i></button>
                    ` : ''}
                </td>
            </tr>`;
        }).join('');
    },

    updateHeaders() {
        const thead = document.querySelector('#keamanan-table thead tr');
        if (!thead) return;

        thead.innerHTML = `
            ${this.createSortableHeader('Tanggal', 'tanggal')}
            ${this.createSortableHeader('Nama Santri', 'nama_santri')}
            ${this.createSortableHeader('Jenis', 'jenis_pelanggaran')}
            ${this.createSortableHeader('Takzir', 'takzir')}
            ${this.createSortableHeader('Petugas', 'petugas')}
            ${this.createSortableHeader('Aksi', null, '150px')}
        `;
    },

    renderStats(rows) {
        const statsContainer = document.getElementById('keamanan-stats');
        if (!statsContainer) return;

        const total = rows.length;
        const ringan = rows.filter(r => r.jenis_pelanggaran === 'Ringan').length;
        const sedang = rows.filter(r => r.jenis_pelanggaran === 'Sedang').length;
        const berat = rows.filter(r => r.jenis_pelanggaran === 'Berat').length;

        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon stat-blue"><i class="fas fa-list-ul"></i></div>
                <div>
                    <div class="stat-value">${total}</div>
                    <div class="stat-label">Total Pelanggaran</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background:#e0f2fe; color:#3b82f6;"><i class="fas fa-info-circle"></i></div>
                <div>
                    <div class="stat-value">${ringan}</div>
                    <div class="stat-label">Ringan</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background:#fef3c7; color:#f59e0b;"><i class="fas fa-exclamation-triangle"></i></div>
                <div>
                    <div class="stat-value">${sedang}</div>
                    <div class="stat-label">Sedang</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background:#fee2e2; color:#ef4444;"><i class="fas fa-skull-crossbones"></i></div>
                <div>
                    <div class="stat-value">${berat}</div>
                    <div class="stat-label">Berat</div>
                </div>
            </div>
        `;
    }
};

window.KeamananModule = KeamananModule;
