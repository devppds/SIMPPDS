import { UI } from '../core/ui.js';
import { apiCall } from '../core/api.js';
import { TableSort } from '../core/table_sort.js';

export const Arus_kasModule = {
    ...TableSort.createSortableModule('arus_kas'),
    currentFilter: 'Masuk',
    currentAction: 'masuk',

    async init(action) {
        this.currentAction = action || 'masuk';
        const titleEl = document.getElementById('arus_kas-title');
        const descEl = document.getElementById('arus_kas-desc');
        const actionsEl = document.querySelector('#arus_kas-view .card-actions');

        // Reset visibility of Add Button for Recap views
        if (actionsEl) {
            const addBtn = actionsEl.querySelector('.btn-primary');
            if (addBtn) {
                // Only hide on periodic recaps (monthly/yearly), allow on 'rekap' (general view)
                addBtn.style.display = (this.currentAction === 'rekap_bulanan' || this.currentAction === 'rekap_tahunan') ? 'none' : 'flex';
            }
        }

        if (this.currentAction === 'keluar') {
            this.currentFilter = 'Keluar';
            if (titleEl) titleEl.textContent = 'Data Pengeluaran';
            if (descEl) descEl.textContent = 'Daftar transaksi pengeluaran dana pondok.';
        } else if (this.currentAction === 'rekap') {
            this.currentFilter = 'Rekap';
            if (titleEl) titleEl.textContent = 'Rekap Kas Pondok';
            if (descEl) descEl.textContent = 'Gabungan seluruh mutasi masuk dan keluar.';
        } else if (this.currentAction === 'rekap_bulanan') {
            this.currentFilter = 'Rekap Bulanan';
            if (titleEl) titleEl.textContent = 'Rekap Kas Bulanan';
            if (descEl) descEl.textContent = 'Akumulasi pemasukan dan pengeluaran per bulan.';
        } else if (this.currentAction === 'rekap_tahunan') {
            this.currentFilter = 'Rekap Tahunan';
            if (titleEl) titleEl.textContent = 'Rekap Kas Tahunan';
            if (descEl) descEl.textContent = 'Akumulasi pemasukan dan pengeluaran per tahun.';
        } else {
            this.currentFilter = 'Masuk';
            if (titleEl) titleEl.textContent = 'Data Pemasukan';
            if (descEl) descEl.textContent = 'Daftar transaksi pemasukan dana pondok.';
        }

        // Bind Search & Filters
        const searchInput = document.getElementById('search-arus_kas');
        const monthFilter = document.getElementById('filter-month-arus_kas');
        const yearFilter = document.getElementById('filter-year-arus_kas');

        const refresh = () => this.loadAndRender(searchInput ? searchInput.value : '');

        if (searchInput) searchInput.oninput = refresh;
        if (monthFilter) monthFilter.onchange = refresh;
        if (yearFilter) yearFilter.onchange = refresh;

        await this.loadAndRender();
    },

    async loadAndRender(searchQuery = '') {
        try {
            const allData = await apiCall('getData', 'GET', { type: 'arus_kas' });
            let rows = allData || [];

            // Apply Month/Year Filters Globaly
            const mVal = document.getElementById('filter-month-arus_kas')?.value;
            const yVal = document.getElementById('filter-year-arus_kas')?.value;

            if (mVal || yVal) {
                rows = rows.filter(r => {
                    const d = new Date(r.tanggal);
                    if (isNaN(d)) return false;
                    if (mVal && (d.getMonth() + 1) != mVal) return false;
                    if (yVal && d.getFullYear() != yVal) return false;
                    return true;
                });
            }

            // Calculate Stats
            this.renderStats(rows);

            this.currentData = rows; // Store for export
            if (this.currentAction === 'rekap_bulanan') {
                this.renderMonthlyRecap(rows, searchQuery);
            } else if (this.currentAction === 'rekap_tahunan') {
                this.renderYearlyRecap(rows, searchQuery);
            } else {
                // Ordinary Filtered Table
                let filtered = rows;
                if (this.currentFilter !== 'Rekap') {
                    filtered = filtered.filter(r => (r.tipe || 'Masuk') === this.currentFilter);
                }

                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    filtered = filtered.filter(r =>
                        (r.kategori || '').toLowerCase().includes(q) ||
                        (r.keterangan || '').toLowerCase().includes(q) ||
                        (r.pj || '').toLowerCase().includes(q) ||
                        (UI.formatDate(r.tanggal) || '').toLowerCase().includes(q) ||
                        (r.nominal || 0).toString().includes(q) ||
                        (r.tipe || '').toLowerCase().includes(q)
                    );
                }

                const sorted = this.applySorting(filtered);
                this.renderTable(sorted);
                this.currentExportData = sorted; // Specific for current view
            }
        } catch (e) {
            console.error("Arus Kas: Load failed", e);
        }
    },

    exportData() {
        if (!this.currentData || this.currentData.length === 0) {
            alert("Tidak ada data untuk diekspor");
            return;
        }

        let dataToExport = [];
        let filename = `Export_Arus_Kas_${new Date().toISOString().slice(0, 10)}.xlsx`;

        if (this.currentAction === 'rekap_bulanan' || this.currentAction === 'rekap_tahunan') {
            // For periodic recaps, we export the calculated totals
            const tbody = document.querySelector('#arus_kas-table tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            dataToExport = rows.map(tr => {
                const tds = tr.querySelectorAll('td');
                if (tds.length < 4) return null;
                return {
                    "Periode": tds[0].innerText,
                    "Total Masuk": tds[1].innerText,
                    "Total Keluar": tds[2].innerText,
                    "Saldo Neto": tds[3].innerText,
                    "Status": tds[4].innerText
                };
            }).filter(d => d !== null);
            filename = `Rekap_${this.currentAction === 'rekap_bulanan' ? 'Bulanan' : 'Tahunan'}_${new Date().getFullYear()}.xlsx`;
        } else {
            // Standard transaction export
            dataToExport = (this.currentExportData || this.currentData).map(row => ({
                "Tanggal": UI.formatDate(row.tanggal),
                "Tipe": row.tipe,
                "Kategori": row.kategori,
                "Nominal": parseInt(row.nominal || 0),
                "Keterangan": row.keterangan || "-",
                "Penanggung Jawab": row.pj || "-"
            }));
        }

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Arus Kas");
        XLSX.writeFile(wb, filename);
    },

    loadData(q) { return this.loadAndRender(q); },

    renderStats(allRows) {
        const statsContainer = document.getElementById('bendahara-top-stats');
        if (!statsContainer) return;

        let totalMasuk = 0;
        let totalKeluar = 0;

        allRows.forEach(r => {
            const val = parseFloat(r.nominal || 0);
            if (r.tipe === 'Masuk') totalMasuk += val;
            else if (r.tipe === 'Keluar') totalKeluar += val;
        });

        const saldo = totalMasuk - totalKeluar;

        statsContainer.innerHTML = `
            <div class="kamar-stat-mini-card">
                <div class="mini-card-icon" style="background:#dcfce7; color:#16a34a;"><i class="fas fa-arrow-down"></i></div>
                <div class="mini-card-info">
                    <h4>Total Pemasukan</h4>
                    <p class="value" style="color:#16a34a;">Rp ${totalMasuk.toLocaleString()}</p>
                </div>
            </div>
            <div class="kamar-stat-mini-card">
                <div class="mini-card-icon" style="background:#fef2f2; color:#dc2626;"><i class="fas fa-arrow-up"></i></div>
                <div class="mini-card-info">
                    <h4>Total Pengeluaran</h4>
                    <p class="value" style="color:#dc2626;">Rp ${totalKeluar.toLocaleString()}</p>
                </div>
            </div>
            <div class="kamar-stat-mini-card" style="border-right: 4px solid var(--primary);">
                <div class="mini-card-icon" style="background:#e0f2fe; color:#0369a1;"><i class="fas fa-balance-scale"></i></div>
                <div class="mini-card-info">
                    <h4>Saldo Kas</h4>
                    <p class="value" style="color:var(--primary);">Rp ${saldo.toLocaleString()}</p>
                </div>
            </div>
        `;
    },

    renderMonthlyRecap(rows, searchQuery) {
        const groups = {};
        const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

        rows.forEach(r => {
            const d = new Date(r.tanggal);
            if (isNaN(d)) return;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!groups[key]) groups[key] = { masuk: 0, keluar: 0, label: `${months[d.getMonth()]} ${d.getFullYear()}` };

            const val = parseFloat(r.nominal || 0);
            if (r.tipe === 'Masuk') groups[key].masuk += val;
            else groups[key].keluar += val;
        });

        let sortedKeys = Object.keys(groups).sort().reverse();
        if (searchQuery) {
            sortedKeys = sortedKeys.filter(k => groups[k].label.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        this.updateTableHead(['Bulan / Tahun', 'Total Masuk', 'Total Keluar', 'Saldo Neto', 'Status']);

        const tbody = document.querySelector('#arus_kas-table tbody');
        if (!tbody) return;

        tbody.innerHTML = sortedKeys.map(key => {
            const data = groups[key];
            const neto = data.masuk - data.keluar;
            return `<tr>
                <td><strong>${data.label}</strong></td>
                <td style="color:#15803d; font-weight:600;">Rp ${data.masuk.toLocaleString()}</td>
                <td style="color:#b91c1c; font-weight:600;">Rp ${data.keluar.toLocaleString()}</td>
                <td style="font-weight:800; color: ${neto >= 0 ? 'var(--primary)' : '#b91c1c'}">Rp ${neto.toLocaleString()}</td>
                <td><span class="th-badge" style="background:${neto >= 0 ? '#dcfce7; color:#15803d;' : '#fee2e2; color:#b91c1c;'};">${neto >= 0 ? 'SURPLUS' : 'DEFISIT'}</span></td>
            </tr>`;
        }).join('');
    },

    renderYearlyRecap(rows, searchQuery) {
        const groups = {};
        rows.forEach(r => {
            const d = new Date(r.tanggal);
            if (isNaN(d)) return;
            const key = d.getFullYear();
            if (!groups[key]) groups[key] = { masuk: 0, keluar: 0 };

            const val = parseFloat(r.nominal || 0);
            if (r.tipe === 'Masuk') groups[key].masuk += val;
            else groups[key].keluar += val;
        });

        let sortedKeys = Object.keys(groups).sort().reverse();
        if (searchQuery) {
            sortedKeys = sortedKeys.filter(k => k.toString().includes(searchQuery));
        }

        this.updateTableHead(['Tahun', 'Total Masuk', 'Total Keluar', 'Saldo Neto', 'Status']);

        const tbody = document.querySelector('#arus_kas-table tbody');
        if (!tbody) return;

        tbody.innerHTML = sortedKeys.map(key => {
            const data = groups[key];
            const neto = data.masuk - data.keluar;
            return `<tr>
                <td><strong style="font-size:1.2rem;">${key}</strong></td>
                <td style="color:#15803d; font-weight:600;">Rp ${data.masuk.toLocaleString()}</td>
                <td style="color:#b91c1c; font-weight:600;">Rp ${data.keluar.toLocaleString()}</td>
                <td style="font-weight:800; color: ${neto >= 0 ? 'var(--primary)' : '#b91c1c'}">Rp ${neto.toLocaleString()}</td>
                <td><span class="th-badge" style="background:${neto >= 0 ? '#dcfce7; color:#15803d;' : '#fee2e2; color:#b91c1c;'}; font-size:0.8rem; padding:5px 15px;">${neto >= 0 ? 'SURPLUS' : 'DEFISIT'}</span></td>
            </tr>`;
        }).join('');
    },

    updateTableHead(labels) {
        const thead = document.querySelector('#arus_kas-table thead tr');
        if (thead) {
            thead.innerHTML = labels.map(l => `<th>${l}</th>`).join('');
        }
    },

    renderTable(rows) {
        this.updateHeaders();
        const tbody = document.querySelector('#arus_kas-table tbody');
        if (!tbody) return;

        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:50px;color:#94a3b8;">Tidak ada data transaksi ditemukan.</td></tr>';
            return;
        }

        tbody.innerHTML = rows.map(row => {
            const rowDataStr = encodeURIComponent(JSON.stringify(row));
            const isMasuk = row.tipe === 'Masuk';
            const badgeStyle = isMasuk
                ? 'background:#dcfce7; color:#15803d;'
                : 'background:#fee2e2; color:#b91c1c;';

            return `<tr>
                <td>${UI.formatDate(row.tanggal)}</td>
                <td><span class="th-badge" style="${badgeStyle}">${row.tipe}</span></td>
                <td><strong>${row.kategori}</strong></td>
                <td style="font-weight:700; color: ${isMasuk ? '#15803d' : '#b91c1c'}">
                    ${isMasuk ? '+' : '-'} Rp ${Number(row.nominal).toLocaleString()}
                </td>
                <td><div style="max-width:200px; font-size:0.85rem; color:#64748b;">${row.keterangan || '-'}</div></td>
                <td><span style="font-size:0.9rem; font-weight:600;">${row.pj || '-'}</span></td>
                <td style="display:flex; gap:8px; justify-content:center;">
                    <button class="btn btn-action btn-yellow" onclick="prepareEdit('arus_kas', '${row.id}', '${rowDataStr}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-action btn-red" onclick="deleteItem('arus_kas', '${row.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');
    },

    updateHeaders() {
        const thead = document.querySelector('#arus_kas-table thead tr');
        if (!thead) return;

        thead.innerHTML = `
            ${this.createSortableHeader('Tanggal', 'tanggal')}
            ${this.createSortableHeader('Tipe', 'tipe')}
            ${this.createSortableHeader('Kategori', 'kategori')}
            ${this.createSortableHeader('Nominal', 'nominal')}
            ${this.createSortableHeader('Keterangan', 'keterangan')}
            ${this.createSortableHeader('PJ', 'pj')}
            ${this.createSortableHeader('Aksi', null, '120px')}
        `;
    }
};

window.Arus_kasModule = Arus_kasModule;
