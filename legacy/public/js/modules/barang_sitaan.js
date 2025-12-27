import { UI } from '../core/ui.js';
import { apiCall } from '../core/api.js';
import { TableSort } from '../core/table_sort.js';

export const BarangSitaanModule = {
    ...TableSort.createSortableModule('barang_sitaan', 'BarangSitaanModule'),
    async init() {
        // Bind Search
        const searchInput = document.getElementById('search-barang_sitaan');
        if (searchInput) {
            searchInput.oninput = () => this.loadData(searchInput.value);
        }
        await this.loadData();
    },

    async loadData(searchQuery = '') {
        let rows = await UI.loadTableData('barang_sitaan', (data) => {
            if (!searchQuery) return data;
            const q = searchQuery.toLowerCase();
            return data.filter(r =>
                (r.nama_santri || '').toLowerCase().includes(q) ||
                (r.nama_barang || '').toLowerCase().includes(q) ||
                (r.jenis_barang || '').toLowerCase().includes(q)
            );
        });

        rows = this.applySorting(rows);
        this.render(rows);
    },

    openForm() {
        UI.openForm('barang_sitaan');
    },

    render(rows) {
        this.updateHeaders();
        const tbody = document.querySelector('#barang_sitaan-table tbody');
        if (!tbody) return;

        tbody.innerHTML = rows.map(row => {
            const rowDataStr = encodeURIComponent(JSON.stringify(row));

            // Status style
            let badgeStyle = 'background: #f1f5f9; color: #475569;'; // Default Prosess
            if (row.status_barang === 'Disita') badgeStyle = 'background: #fff1f2; color: #e11d48;';
            if (row.status_barang === 'Dikembalikan') badgeStyle = 'background: #f0fdf4; color: #16a34a;';
            if (row.status_barang === 'Dihancurkan') badgeStyle = 'background: #1e293b; color: #fff;';

            return `
                <tr>
                    <td>${UI.formatDate(row.tanggal)}</td>
                    <td><strong>${row.nama_santri}</strong></td>
                    <td>${row.jenis_barang}</td>
                    <td>${row.nama_barang}</td>
                    <td>${row.petugas || '-'}</td>
                    <td><span class="th-badge" style="${badgeStyle}">${row.status_barang || 'PROSES'}</span></td>
                    <td style="display:flex; gap:5px;">
                        <button class="btn btn-action btn-blue" title="Detail" onclick="viewDetail('barang_sitaan', '${rowDataStr}')"><i class="fas fa-eye"></i></button>
                        ${window.Auth && window.Auth.canEdit('barang_sitaan') ? `
                            <button class="btn btn-action btn-yellow" title="Edit" onclick="prepareEdit('barang_sitaan', '${row.id}', '${rowDataStr}')"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-action btn-red" title="Hapus" onclick="deleteItem('barang_sitaan', '${row.id}')"><i class="fas fa-trash"></i></button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');

        this.renderStats(rows);
    },

    updateHeaders() {
        const thead = document.querySelector('#barang_sitaan-table thead tr');
        if (!thead) return;

        thead.innerHTML = `
            ${this.createSortableHeader('Tanggal', 'tanggal')}
            ${this.createSortableHeader('Nama Santri', 'nama_santri')}
            ${this.createSortableHeader('Jenis Barang', 'jenis_barang')}
            ${this.createSortableHeader('Nama/Merk', 'nama_barang')}
            ${this.createSortableHeader('Petugas', 'petugas')}
            ${this.createSortableHeader('Status', 'status_barang')}
            ${this.createSortableHeader('Aksi', null, '150px')}
        `;
    },

    renderStats(rows) {
        const statsContainer = document.getElementById('barang_sitaan-stats');
        if (!statsContainer) return;

        const total = rows.length;
        const disita = rows.filter(r => r.status_barang === 'Disita').length;
        const dikembalikan = rows.filter(r => r.status_barang === 'Dikembalikan').length;

        const cardBaseStyle = `
            display: flex; 
            flex-direction: column; 
            justify-content: space-between; 
            padding: 1.5rem; 
            border-radius: 20px; 
            transition: all 0.3s ease;
            min-height: 120px;
        `;

        statsContainer.innerHTML = `
            <div class="stat-card" style="${cardBaseStyle} background: linear-gradient(135deg, #475569, #1e293b); color: white;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <div style="font-size: 2rem; font-weight: 800; font-family:'Outfit';">${total}</div>
                        <div style="font-size: 0.75rem; font-weight: 600; opacity: 0.8; text-transform: uppercase;">Total Sitaan</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 12px; backdrop-filter: blur(4px);">
                        <i class="fas fa-box-open fa-lg"></i>
                    </div>
                </div>
            </div>
            <div class="stat-card" style="${cardBaseStyle} background: white; border: 1px solid #e2e8f0;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <div style="font-size: 1.8rem; font-weight: 800; color: #e11d48; font-family:'Outfit';">${disita}</div>
                        <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">Masih Disita</div>
                    </div>
                    <div style="background: #fff1f2; color: #e11d48; padding: 10px; border-radius: 12px;">
                        <i class="fas fa-lock fa-lg"></i>
                    </div>
                </div>
            </div>
            <div class="stat-card" style="${cardBaseStyle} background: white; border: 1px solid #e2e8f0;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <div style="font-size: 1.8rem; font-weight: 800; color: #16a34a; font-family:'Outfit';">${dikembalikan}</div>
                        <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">Sudah Kembali</div>
                    </div>
                    <div style="background: #f0fdf4; color: #16a34a; padding: 10px; border-radius: 12px;">
                        <i class="fas fa-undo fa-lg"></i>
                    </div>
                </div>
            </div>
        `;
    }
};

window.BarangSitaanModule = BarangSitaanModule;
