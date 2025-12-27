import { UI } from '../core/ui.js';
import { TableSort } from '../core/table_sort.js';
import { apiCall } from '../core/api.js';
import { SYSTEM_PRICES } from '../core/config.js';

export const KesehatanModule = {
    ...TableSort.createSortableModule('kesehatan'),

    async init() {
        this.currentUnit = 'Kesehatan';
        const searchInput = document.getElementById('search-kesehatan');
        if (searchInput) {
            searchInput.oninput = () => this.loadData(searchInput.value);
        }

        await this.loadData();
    },

    async loadData(searchQuery = '') {
        let rows = await UI.loadTableData('kesehatan', (data) => {
            let filtered = data;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                filtered = filtered.filter(r =>
                    (r.nama_santri || '').toLowerCase().includes(q) ||
                    (r.gejala || '').toLowerCase().includes(q) ||
                    (r.obat_tindakan || '').toLowerCase().includes(q)
                );
            }
            return filtered;
        });

        rows = this.applySorting(rows);
        this.render(rows);
    },

    render(rows) {
        this.renderStats(rows);
        this.updateHeaders();

        const tbody = document.querySelector('#kesehatan-table tbody');
        if (!tbody) return;

        if (!rows || rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:50px;color:var(--text-muted);">Tidak ada santri yang sedang sakit.</td></tr>';
            return;
        }

        tbody.innerHTML = rows.map(row => {
            const rowDataStr = encodeURIComponent(JSON.stringify(row));
            const statusColor = row.status_periksa === 'Sembuh' ? '#0d9488' : '#ef4444';

            return `<tr>
                <td><strong>${row.nama_santri}</strong></td>
                <td>${UI.formatDate(row.mulai_sakit)}</td>
                <td><span style="color:#dc2626; font-weight:500;">${row.gejala || '-'}</span></td>
                <td>${row.obat_tindakan || '-'}</td>
                <td><span class="th-badge" style="background:${statusColor}11; color:${statusColor}; border:1px solid ${statusColor}33;">${row.status_periksa || '-'}</span></td>
                <td style="display:flex; gap:5px;">
                    <button class="btn btn-action btn-blue" title="Detail" onclick="viewDetail('kesehatan', '${rowDataStr}')"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-action btn-yellow" title="Edit" onclick="prepareEdit('kesehatan', '${row.id}', '${rowDataStr}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-action btn-red" title="Hapus" onclick="deleteItem('kesehatan', '${row.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
    },

    updateHeaders() {
        const thead = document.querySelector('#kesehatan-table thead tr');
        if (!thead) return;

        thead.innerHTML = `
            ${this.createSortableHeader('Nama Santri', 'nama_santri')}
            ${this.createSortableHeader('Mulai Sakit', 'mulai_sakit')}
            ${this.createSortableHeader('Gejala', 'gejala')}
            ${this.createSortableHeader('Obat/Tindakan', 'obat_tindakan')}
            ${this.createSortableHeader('Status', 'status_periksa')}
            ${this.createSortableHeader('Aksi', null, '150px')}
        `;
    },

    renderStats(rows) {
        const statsContainer = document.getElementById('kesehatan-stats');
        if (!statsContainer) return;

        const total = rows.length;
        const rawatInap = rows.filter(r => r.status_periksa === 'Rawat Inap').length;
        const sakit = rows.filter(r => r.status_periksa !== 'Sembuh').length;
        const sembuh = rows.filter(r => r.status_periksa === 'Sembuh').length;

        const statsHTML = `
            <div class="stat-card">
                <div class="stat-icon" style="background:#fee2e2; color:#ef4444;"><i class="fas fa-user-nurse"></i></div>
                <div>
                    <div class="stat-value">${sakit}</div>
                    <div class="stat-label">Sedang Sakit</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background:#ffedd5; color:#f97316;"><i class="fas fa-bed"></i></div>
                <div>
                    <div class="stat-value">${rawatInap}</div>
                    <div class="stat-label">Rawat Inap</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background:#d1fae5; color:#10b981;"><i class="fas fa-smile-beam"></i></div>
                <div>
                    <div class="stat-value">${sembuh}</div>
                    <div class="stat-label">Total Sembuh</div>
                </div>
            </div>
        `;
        statsContainer.innerHTML = statsHTML;
    },

    async afterSave(formData) {
        if (!formData.nama_santri || !formData.status_periksa) return;

        // Only record if status is "Izin Sakit" or similar that incurs a fee
        // In the database, we have "IZIN SAKIT" for Kesehatan unit.
        if (formData.status_periksa !== 'Izin Sakit') return;

        console.log(`AutoLayanan: Processing Kesehatan fee for ${formData.nama_santri}`);

        let unit = 'Kesehatan';
        let serviceName = 'IZIN SAKIT';

        try {
            // 1. Get Stambuk from Santri Data
            const santri = await apiCall('getData', 'GET', { type: 'santri' });
            const match = (santri || []).find(s => s.nama_siswa === formData.nama_santri);
            const stambuk = match ? (match.stambuk_mondok || match.stambuk_pondok || '') : '';

            // 2. Get Price from Layanan Info
            const services = await apiCall('getData', 'GET', { type: 'layanan_info' });
            const found = (services || []).find(s => s.nama_layanan === serviceName && s.unit === unit);
            const price = found ? found.harga : 2000;

            // 3. Record to Layanan Admin
            await apiCall('saveData', 'POST', {
                type: 'layanan_admin',
                data: {
                    tanggal: new Date().toISOString().split('T')[0],
                    unit: unit,
                    nama_santri: formData.nama_santri,
                    stambuk: stambuk,
                    jenis_layanan: serviceName,
                    nominal: price,
                    keterangan: `Administrasi Otomatis (Status: ${formData.status_periksa})`,
                    pj: 'Kesehatan (Otomatis)',
                    jumlah: 1
                }
            });

            // 4. Record to Kas Unit
            await apiCall('saveData', 'POST', {
                type: 'kas_unit',
                data: {
                    tanggal: new Date().toISOString().split('T')[0],
                    unit: unit,
                    tipe: 'Masuk',
                    kategori: serviceName,
                    nominal: price,
                    nama_santri: formData.nama_santri,
                    stambuk: stambuk,
                    keterangan: `Administrasi Periksa: ${serviceName}`,
                    petugas: 'Kesehatan (Otomatis)',
                    status_setor: 'Belum Setor'
                }
            });
        } catch (e) {
            console.error("AutoLayanan Kesehatan failed", e);
        }
    }
};

window.KesehatanModule = KesehatanModule;
