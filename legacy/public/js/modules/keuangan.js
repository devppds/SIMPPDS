import { UI } from '../core/ui.js';
import { apiCall } from '../core/api.js';
import { TableSort } from '../core/table_sort.js';

export const KeuanganModule = {
    ...TableSort.createSortableModule('keuangan'),
    currentFilter: 'Semua',

    async init(action) {
        if (action === 'finance_lunas') this.currentFilter = 'Lunas';
        else if (action === 'finance_nunggak') this.currentFilter = 'Belum Lunas';
        else if (action === 'finance_tabungan') this.currentFilter = 'Tabungan';
        else this.currentFilter = 'Semua';

        // Bind Search
        const searchInput = document.getElementById('search-keuangan');
        if (searchInput) {
            searchInput.oninput = () => this.loadData(searchInput.value);
        }

        await this.loadData();
    },

    async loadData(searchQuery = '') {
        const params = searchQuery ? {} : { limit: 100 };
        let rows = await UI.loadTableData('keuangan', (data) => {
            let filtered = data;
            if (this.currentFilter === 'Lunas') filtered = data.filter(r => r.status === 'Lunas');
            else if (this.currentFilter === 'Belum Lunas') filtered = data.filter(r => r.status === 'Belum Lunas');
            else if (this.currentFilter === 'Tabungan') filtered = data.filter(r => (r.jenis_pembayaran || '').toLowerCase().includes('tabungan'));

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                filtered = filtered.filter(r =>
                    (r.nama_santri || '').toLowerCase().includes(q) ||
                    (r.jenis_pembayaran || '').toLowerCase().includes(q) ||
                    (UI.formatDate(r.tanggal) || '').toLowerCase().includes(q) ||
                    (r.nominal || 0).toString().includes(q)
                );
            }
            return filtered;
        }, params);

        rows = this.applySorting(rows);
        this.currentData = rows; // Store for export
        this.render(rows);
    },

    exportData() {
        if (!this.currentData || this.currentData.length === 0) {
            alert("Tidak ada data untuk diekspor");
            return;
        }

        const dataToExport = this.currentData.map(row => ({
            "Tanggal": UI.formatDate(row.tanggal),
            "Nama Santri": row.nama_santri,
            "Jenis Pembayaran": row.jenis_pembayaran,
            "Nominal": parseInt(row.nominal || 0),
            "Status": row.status,
            "Keterangan": row.keterangan || "-"
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Keuangan");
        XLSX.writeFile(wb, `Export_Keuangan_${new Date().toISOString().slice(0, 10)}.xlsx`);
    },

    async openKeuanganForm(prefill = {}, isEdit = false) {
        // Smart prefill based on current view/filter
        if (!isEdit && Object.keys(prefill).length === 0) {
            if (this.currentFilter === 'Tabungan') {
                prefill.jenis_pembayaran = 'Tabungan';
            }
        }

        await UI.openForm('keuangan', prefill);

        const container = document.getElementById('form-fields');
        const jenisSelect = container.querySelector('[name="jenis_pembayaran"]');
        const nominalInput = container.querySelector('[name="nominal"]');

        if (jenisSelect) {
            try {
                const tagihanList = await apiCall('getData', 'GET', { type: 'jenis_tagihan' });
                const activeTagihan = (tagihanList || []).filter(t => t.aktif !== 'Non-Aktif' && t.aktif !== false);

                let optionsHtml = `<option value="">-- Pilih Jenis Pembayaran --</option>`;
                optionsHtml += `<option value="Tabungan">Tabungan (Manual)</option>`;

                activeTagihan.forEach(t => {
                    optionsHtml += `<option value="${t.nama_tagihan}" data-nominal="${t.nominal}">${t.nama_tagihan} (Rp ${Number(t.nominal).toLocaleString()})</option>`;
                });

                jenisSelect.innerHTML = optionsHtml;

                // For Edit or Smart Prefill: Set the value back
                const initialVal = prefill.jenis_pembayaran || (this.currentFilter === 'Tabungan' ? 'Tabungan' : '');
                if (initialVal) {
                    jenisSelect.value = initialVal;
                    if (initialVal === 'Tabungan') {
                        nominalInput.readOnly = false;
                        nominalInput.placeholder = 'Input nominal tabungan...';
                    } else {
                        // Find nominal for the prefilled tagihan
                        const tag = activeTagihan.find(t => t.nama_tagihan === initialVal);
                        if (tag) {
                            nominalInput.value = tag.nominal;
                            nominalInput.readOnly = true;
                        }
                    }
                }

                jenisSelect.onchange = () => {
                    const selectedOption = jenisSelect.options[jenisSelect.selectedIndex];
                    const nominal = selectedOption.getAttribute('data-nominal');

                    if (jenisSelect.value === 'Tabungan') {
                        nominalInput.value = '';
                        nominalInput.placeholder = 'Input nominal tabungan...';
                        nominalInput.readOnly = false;
                    } else if (nominal) {
                        nominalInput.value = nominal;
                        nominalInput.readOnly = true;
                    } else {
                        nominalInput.value = '';
                        nominalInput.readOnly = false;
                    }
                };
            } catch (e) {
                console.error("Failed to load jenis_tagihan", e);
            }
        }
    },

    async prepareKeuanganEdit(id, rowDataEncoded) {
        const rowData = JSON.parse(decodeURIComponent(rowDataEncoded));
        await this.openKeuanganForm(rowData, true);
        document.getElementById('row_index').value = id;

        // Fill other fields that openKeuanganForm doesn't handle specifically
        const form = document.getElementById('dynamic-form');
        Object.keys(rowData).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input && key !== 'jenis_pembayaran' && key !== 'nominal') {
                if (input.type === 'date' && rowData[key]) {
                    const d = new Date(rowData[key]);
                    if (!isNaN(d)) input.value = d.toISOString().split('T')[0];
                } else {
                    input.value = rowData[key];
                }
            }
        });
    },

    async markAsLunas(id) {
        if (!confirm('Tandai pembayaran ini sebagai LUNAS?')) return;
        try {
            // Get current record first to preserve data
            const rows = await apiCall('getData', 'GET', { type: 'keuangan' });
            const record = rows.find(r => r.id == id);
            if (!record) throw new Error('Data tidak ditemukan');

            const updatedData = { ...record, status: 'Lunas', id: id };
            await apiCall('saveData', 'POST', { type: 'keuangan', data: updatedData });

            // Refresh
            this.loadData();
        } catch (e) {
            alert('Gagal memperbarui status: ' + e.message);
        }
    },

    render(rows) {
        this.updateHeaders();
        const tbody = document.querySelector('#keuangan-table tbody');
        if (!tbody) return;

        if (!rows || rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:50px;color:var(--text-muted);">Tidak ada catatan keuangan yang ditemukan.</td></tr>';
            return;
        }

        tbody.innerHTML = rows.map(row => {
            const rowDataStr = encodeURIComponent(JSON.stringify(row));
            const isLunas = row.status === 'Lunas';
            const statusColor = isLunas ? '#0d9488' : '#ef4444';

            let quickAction = '';
            if (!isLunas) {
                quickAction = `<button class="btn btn-action btn-green" title="Tandai Lunas" onclick="window.KeuanganModule.markAsLunas('${row.id}')"><i class="fas fa-check"></i></button>`;
            }

            return `<tr>
                <td>${UI.formatDate(row.tanggal)}</td>
                <td><strong>${row.nama_santri}</strong><br><span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">${row.jenis_pembayaran || '-'}</span></td>
                <td><span style="font-weight:700; color:var(--text-dark);">Rp ${(Number(row.nominal) || 0).toLocaleString('id-ID')}</span></td>
                <td><span class="th-badge" style="background:${statusColor}11; color:${statusColor}; border:1px solid ${statusColor}33;">${row.status}</span></td>
                <td style="display:flex; gap:5px;">
                    ${quickAction}
                    <button class="btn btn-action btn-blue" title="Detail" onclick="viewDetail('keuangan', '${rowDataStr}')"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-action btn-yellow" title="Edit" onclick="window.KeuanganModule.prepareKeuanganEdit('${row.id}', '${rowDataStr}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-action btn-red" title="Hapus" onclick="deleteItem('keuangan', '${row.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
    },

    updateHeaders() {
        const thead = document.querySelector('#keuangan-table thead tr');
        if (!thead) return;

        thead.innerHTML = `
            ${this.createSortableHeader('Tanggal', 'tanggal')}
            ${this.createSortableHeader('Santri / Jenis', 'nama_santri')}
            ${this.createSortableHeader('Nominal', 'nominal')}
            ${this.createSortableHeader('Status', 'status')}
            ${this.createSortableHeader('Aksi', null, '180px')}
        `;
    }
};

window.KeuanganModule = KeuanganModule;
