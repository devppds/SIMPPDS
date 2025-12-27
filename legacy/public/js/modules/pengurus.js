import { UI } from '../core/ui.js';
import { TableSort } from '../core/table_sort.js';
import { apiCall } from '../core/api.js';

export const PengurusModule = {
    ...TableSort.createSortableModule('pengurus'),
    dataMap: {}, // Memory cache for staff data
    currentAction: null,

    async init(action) {
        this.currentAction = action || 'pengurus_aktif';

        const isNonAktif = action === 'pengurus_nonaktif';

        // Update View Text
        const titleEl = document.getElementById('pengurus-title');
        const descEl = document.getElementById('pengurus-desc');
        const btnEl = document.getElementById('pengurus-btn');

        if (titleEl) titleEl.textContent = isNonAktif ? 'Data Pengurus Non-Aktif (Demisioner)' : 'Struktur & Data Pengurus Aktif';
        if (descEl) descEl.textContent = isNonAktif ? 'Daftar pengurus yang sudah menyelesaikan masa jabatan atau non-aktif.' : 'Informasi jabatan dan divisi pengurus periode saat ini.';

        // Hide Create button for Non-Aktif OR Non-Admins
        const canEdit = window.Auth && window.Auth.canEdit();
        if (btnEl) btnEl.style.display = (isNonAktif || !canEdit) ? 'none' : 'block';

        // Bind Search
        const searchInput = document.getElementById('search-pengurus');
        if (searchInput) {
            searchInput.oninput = () => this.loadData(searchInput.value);
        }

        await this.loadData();
    },

    async loadData(searchQuery = '') {
        let rows = await UI.loadTableData('pengurus', (data) => {
            const statusFilter = this.currentAction === 'pengurus_nonaktif' ? 'Non-Aktif' : 'Aktif';
            let filtered = data.filter(r => (r.status || 'Aktif') === statusFilter);

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                filtered = filtered.filter(r =>
                    (r.nama || '').toLowerCase().includes(q) ||
                    (r.divisi || '').toLowerCase().includes(q)
                );
            }
            return filtered;
        });

        rows = this.applySorting(rows);
        this.render(rows);
    },

    render(rows) {
        this.updateHeaders();
        const tbody = document.querySelector('#pengurus-table tbody');
        if (!tbody) return;

        this.dataMap = {}; // Reset cache

        if (!rows || rows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:50px;color:var(--text-muted);">Belum ada data pengurus yang sesuai.</td></tr>`;
            return;
        }

        const isNonAktif = this.currentAction === 'pengurus_nonaktif';

        if (isNonAktif) {
            // Grouping Logic for Alumni
            const groups = {};
            rows.forEach(row => {
                const periode = (row.tahun_mulai && row.tahun_akhir) ? `${row.tahun_mulai}/${row.tahun_akhir}` : (row.tahun_mulai || 'Periode Tidak Diketahui');
                if (!groups[periode]) groups[periode] = [];
                groups[periode].push(row);
            });

            // Sort periods descending
            const sortedPeriods = Object.keys(groups).sort((a, b) => b.localeCompare(a));

            tbody.innerHTML = sortedPeriods.map(periode => {
                const groupRows = groups[periode].map(row => {
                    this.dataMap[row.id] = row;
                    return this.renderRow(row, isNonAktif, periode);
                }).join('');

                return `
                    <tr class="group-header" style="background: #f8fafc;">
                        <td colspan="7" style="padding: 10px 15px; font-weight: bold; color: var(--primary); border-left: 4px solid var(--primary);">
                            <i class="fas fa-history mr-2"></i> PENGURUS PERIODE: ${periode} 
                            <span style="font-weight: normal; font-size: 0.8rem; color: #64748b; margin-left: 10px;">(${groups[periode].length} Orang)</span>
                        </td>
                    </tr>
                    ${groupRows}
                `;
            }).join('');
        } else {
            // Normal rendering for Active
            tbody.innerHTML = rows.map(row => {
                this.dataMap[row.id] = row;
                return this.renderRow(row, isNonAktif);
            }).join('');
        }
    },

    renderRow(row, isNonAktif, periodeLabel) {
        const img = row.foto_pengurus || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.nama)}&background=random`;
        const periode = periodeLabel || ((row.tahun_mulai && row.tahun_akhir) ? `${row.tahun_mulai}/${row.tahun_akhir}` : (row.tahun_mulai || '-'));

        return `<tr>
            <td><img src="${img}" style="width:30px;height:30px;border-radius:50%"></td>
            <td><strong>${row.nama}</strong></td>
            <td><span class="th-badge" style="background:#f1f5f9; color:var(--primary); font-size:0.75rem;">${row.jabatan}</span></td>
            <td>${row.divisi}</td>
            <td><span style="font-size:0.85rem; color:var(--text-muted); font-weight:600;">${periode}</span></td>
            ${isNonAktif ? `<td><span style="font-size:0.8rem; font-weight:bold; color:var(--primary);">${UI.formatDate(row.tanggal_nonaktif)}</span></td>` : ''}
            <td>${row.no_hp || '-'}</td>
            <td style="display:flex; gap:5px;">
                <button class="btn btn-action btn-blue" onclick="handleGlobalAction('pengurus', 'detail', '${row.id}')" title="Detail">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-action btn-yellow" onclick="handleGlobalAction('pengurus', 'edit', '${row.id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                ${isNonAktif ? `
                <button class="btn btn-action btn-green" onclick="PengurusModule.reactivate('${row.id}', '${row.nama}')" title="Aktifkan Kembali">
                    <i class="fas fa-user-check"></i>
                </button>` : `
                <button class="btn btn-action btn-orange" onclick="PengurusModule.deactivate('${row.id}', '${row.nama}')" title="Demisioner / Selesai">
                    <i class="fas fa-user-times"></i>
                </button>
                <button class="btn btn-action btn-red" onclick="deleteItem('pengurus', '${row.id}')" title="Hapus Permanen">
                    <i class="fas fa-trash"></i>
                </button>`}
            </td>
        </tr>`;
    },

    async reactivate(id, nama) {
        if (confirm(`Aktifkan kembali pengurus "${nama}" ke periode saat ini?`)) {
            try {
                await apiCall('saveData', 'POST', {
                    type: 'pengurus',
                    data: { id, status: 'Aktif', tanggal_nonaktif: '' }
                });
                alert('Berhasil diaktifkan kembali');
                this.loadData();
            } catch (err) {
                alert('Gagal: ' + err.message);
            }
        }
    },

    async deactivate(id, nama) {
        if (confirm(`Nyatakan pengurus "${nama}" telah menyelesaikan masa jabatannya (Demisioner)?`)) {
            try {
                await apiCall('saveData', 'POST', {
                    type: 'pengurus',
                    data: {
                        id,
                        status: 'Non-Aktif',
                        tanggal_nonaktif: new Date().toISOString().split('T')[0]
                    }
                });
                alert('Berhasil di-update ke status Demisioner/Non-Aktif');
                this.loadData();
            } catch (err) {
                alert('Gagal: ' + err.message);
            }
        }
    },

    updateHeaders() {
        const thead = document.querySelector('#pengurus-table thead tr');
        if (!thead) return;

        const isNonAktif = this.currentAction === 'pengurus_nonaktif';

        thead.innerHTML = `
            ${this.createSortableHeader('Foto', null, '50px')}
            ${this.createSortableHeader('Nama', 'nama')}
            ${this.createSortableHeader('Jabatan', 'jabatan')}
            ${this.createSortableHeader('Divisi', 'divisi')}
            ${this.createSortableHeader('Periode', 'tahun_mulai')}
            ${isNonAktif ? this.createSortableHeader('Tgl Selesai', 'tanggal_nonaktif') : ''}
            ${this.createSortableHeader('No. HP', 'no_hp')}
            ${this.createSortableHeader('Aksi', null, '120px')}
        `;
    }
};

window.PengurusModule = PengurusModule;
