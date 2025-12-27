import { UI } from '../core/ui.js';
import { TableSort } from '../core/table_sort.js';
import { apiCall } from '../core/api.js';

export const UstadzModule = {
    ...TableSort.createSortableModule('ustadz'),
    dataMap: {}, // Memory cache
    currentAction: null,

    async init(action) {
        this.currentAction = action || 'ustadz_aktif';

        const isNonAktif = action === 'ustadz_nonaktif';

        // Update View Text
        const titleEl = document.getElementById('ustadz-title');
        const descEl = document.getElementById('ustadz-desc');
        const btnEl = document.getElementById('ustadz-btn');

        if (titleEl) titleEl.textContent = isNonAktif ? 'Data Pengajar Non-Aktif (Alumni)' : 'Data Tahfidz / Ustadz Aktif';
        if (descEl) descEl.textContent = isNonAktif ? 'Daftar ustadz yang berstatus alumni atau sudah tidak aktif mengajar.' : 'Kelola data guru dan staf pengajar pondok periode saat ini.';

        // Hide Create button for Non-Aktif OR Non-Admins
        const canEdit = window.Auth && window.Auth.canEdit();
        if (btnEl) btnEl.style.display = (isNonAktif || !canEdit) ? 'none' : 'block';

        // Bind Search
        const searchInput = document.getElementById('search-ustadz');
        if (searchInput) searchInput.oninput = () => this.loadData(searchInput.value);

        await this.loadData();
    },

    async loadData(searchQuery = '') {
        let rows = await UI.loadTableData('ustadz', (data) => {
            const statusFilter = this.currentAction === 'ustadz_nonaktif' ? 'Non-Aktif' : 'Aktif';
            let filtered = data.filter(r => (r.status || 'Aktif') === statusFilter);

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                filtered = filtered.filter(r =>
                    (r.nama || '').toLowerCase().includes(q) ||
                    (r.nik_nip || '').toLowerCase().includes(q)
                );
            }
            return filtered;
        });

        rows = this.applySorting(rows);
        this.render(rows);
    },

    render(rows) {
        this.updateHeaders();
        const tbody = document.querySelector('#ustadz-table tbody');
        if (!tbody) return;

        this.dataMap = {};

        if (!rows || rows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:50px;color:var(--text-muted);">Belum ada data pengajar yang sesuai.</td></tr>`;
            return;
        }

        const isNonAktif = this.currentAction === 'ustadz_nonaktif';

        if (isNonAktif) {
            // Grouping by "Tahun Masuk" or Period if available
            const groups = {};
            rows.forEach(row => {
                const periode = row.tahun_masuk || (row.tanggal_masuk ? new Date(row.tanggal_masuk).getFullYear() : 'Lama');
                if (!groups[periode]) groups[periode] = [];
                groups[periode].push(row);
            });

            const sortedPeriods = Object.keys(groups).sort((a, b) => b.localeCompare(a));

            tbody.innerHTML = sortedPeriods.map(periode => {
                const groupRows = groups[periode].map(row => {
                    this.dataMap[row.id] = row;
                    return this.renderRow(row, isNonAktif);
                }).join('');

                return `
                    <tr class="group-header" style="background: #f8fafc;">
                        <td colspan="7" style="padding: 10px 15px; font-weight: bold; color: #6366f1; border-left: 4px solid #6366f1;">
                            <i class="fas fa-calendar-alt mr-2"></i> ANGKATAN / PERIODE: ${periode}
                        </td>
                    </tr>
                    ${groupRows}
                `;
            }).join('');
        } else {
            tbody.innerHTML = rows.map(row => {
                this.dataMap[row.id] = row;
                return this.renderRow(row, isNonAktif);
            }).join('');
        }
    },

    renderRow(row, isNonAktif) {
        const img = row.foto_ustadz || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.nama)}&background=random`;
        return `<tr>
            <td><img src="${img}" style="width:30px;height:30px;border-radius:50%"></td>
            <td><strong>${row.nama}</strong></td>
            <td>${row.nik_nip || '-'}</td>
            <td>${row.kelas || '-'}</td>
            ${isNonAktif ? `<td><span style="font-size:0.8rem; font-weight:bold; color:var(--primary);">${UI.formatDate(row.tanggal_nonaktif)}</span></td>` : ''}
            <td>${row.no_hp || '-'}</td>
            <td style="display:flex; gap:5px;">
                <button class="btn btn-action btn-blue" onclick="handleGlobalAction('ustadz', 'detail', '${row.id}')" title="Detail">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-action btn-yellow" onclick="handleGlobalAction('ustadz', 'edit', '${row.id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                ${isNonAktif ? `
                <button class="btn btn-action btn-green" onclick="UstadzModule.reactivate('${row.id}', '${row.nama}')" title="Aktifkan Kembali">
                    <i class="fas fa-user-check"></i>
                </button>` : `
                <button class="btn btn-action btn-orange" onclick="UstadzModule.deactivate('${row.id}', '${row.nama}')" title="Non-Aktifkan">
                    <i class="fas fa-user-times"></i>
                </button>
                <button class="btn btn-action btn-red" onclick="deleteItem('ustadz', '${row.id}')" title="Hapus Permanen">
                    <i class="fas fa-trash"></i>
                </button>`}
            </td>
        </tr>`;
    },

    async reactivate(id, nama) {
        if (confirm(`Aktifkan kembali pengajar "${nama}"?`)) {
            try {
                await apiCall('saveData', 'POST', {
                    type: 'ustadz',
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
        if (confirm(`Nyatakan pengajar "${nama}" sebagai Non-Aktif/Alumni?`)) {
            try {
                await apiCall('saveData', 'POST', {
                    type: 'ustadz',
                    data: {
                        id,
                        status: 'Non-Aktif',
                        tanggal_nonaktif: new Date().toISOString().split('T')[0]
                    }
                });
                alert('Berhasil dinonaktifkan');
                this.loadData();
            } catch (err) {
                alert('Gagal: ' + err.message);
            }
        }
    },

    updateHeaders() {
        const thead = document.querySelector('#ustadz-table thead tr');
        if (!thead) return;

        const isNonAktif = this.currentAction === 'ustadz_nonaktif';

        thead.innerHTML = `
            ${this.createSortableHeader('Foto', null, '50px')}
            ${this.createSortableHeader('Nama', 'nama')}
            ${this.createSortableHeader('NIK/NIP', 'nik_nip')}
            ${this.createSortableHeader('Kelas', 'kelas')}
            ${isNonAktif ? this.createSortableHeader('Tgl Non-Aktif', 'tanggal_nonaktif') : ''}
            ${this.createSortableHeader('No. HP', 'no_hp')}
            ${this.createSortableHeader('Aksi', null, '120px')}
        `;
    }
};

window.UstadzModule = UstadzModule;
