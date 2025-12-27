import { UI } from '../core/ui.js';
import { TableSort } from '../core/table_sort.js';
import { apiCall } from '../core/api.js';

export const PendidikanModule = {
    ...TableSort.createSortableModule('pendidikan'),

    async init(action) {
        this.currentAction = action || 'pendidikan_all';
        this.currentUnit = 'Pendidikan';
        let filterCallback = null;

        const titleEl = document.getElementById('pendidikan-title');
        const descEl = document.getElementById('pendidikan-desc');
        const btnEl = document.querySelector('#pendidikan-view .card-header .btn-primary');

        if (this.currentAction === 'pendidikan_wajar_murottil') {
            if (titleEl) titleEl.textContent = 'Wajar & Murottil';
            if (descEl) descEl.textContent = 'Pencatatan nilai dan kehadiran kegiatan Wajib Belajar, Murottil (Pagi/Malam), dan Talaqqi.';
            if (btnEl) {
                btnEl.textContent = 'Input Nilai Wajar';
                btnEl.onclick = () => this.openPendidikanForm();
            }
            filterCallback = (rows) => rows.filter(r => ['Wajib Belajar', 'Murrotil', 'Murottil Pagi', 'Murottil Malam', 'Talaqqi'].includes(r.kegiatan));
        } else {
            if (titleEl) titleEl.textContent = 'Laporan Pendidikan';
            if (descEl) descEl.textContent = 'Pencatatan nilai dan kehadiran kegiatan Musyawaroh dan Sorogan.';
            if (btnEl) {
                btnEl.textContent = 'Input Nilai';
                btnEl.onclick = () => this.openPendidikanForm();
            }
            filterCallback = (rows) => rows.filter(r => ['Musyawaroh', 'Sorogan'].includes(r.kegiatan));
        }

        const searchInput = document.getElementById('search-pendidikan');
        if (searchInput) {
            searchInput.oninput = () => this.loadData(searchInput.value, filterCallback);
        }

        await this.loadData('', filterCallback);
    },

    async openPendidikanForm() {
        await UI.openForm('pendidikan');

        // Fetch Pengurus to filter correctly
        const pengurus = await apiCall('getData', 'GET', { type: 'pengurus' });
        const isWajar = this.currentAction === 'pendidikan_wajar_murottil';

        // 1. Filter Activities
        const kegiatanSelect = document.querySelector('select[name="kegiatan"]');
        if (kegiatanSelect) {
            const options = isWajar
                ? ['Wajib Belajar', 'Murottil Pagi', 'Murottil Malam', 'Talaqqi']
                : ['Musyawaroh', 'Sorogan'];
            kegiatanSelect.innerHTML = options.map(o => `<option value="${o}">${o}</option>`).join('');
        }

        // 2. Filter Teachers (Nama Pengajar) - Taken from Pengurus with specific Division
        const ustadzSelect = document.querySelector('select[name="ustadz"]');
        if (ustadzSelect) {
            const targetDivisi = isWajar ? 'Wajar & Murottil' : 'Pendidikan';
            const filteredStaff = (pengurus || [])
                .filter(p => p.divisi === targetDivisi && (p.status || 'Aktif') === 'Aktif')
                .map(p => p.nama)
                .sort();

            ustadzSelect.innerHTML = `<option value="">-- Pilih ${isWajar ? 'Petugas Wajar' : 'Ustadz Pendidikan'} --</option>` +
                filteredStaff.map(name => `<option value="${name}">${name}</option>`).join('');
        }
    },

    async loadData(searchQuery = '', filterCallback = null) {
        let rows = await UI.loadTableData('pendidikan', (data) => {
            let filtered = filterCallback ? filterCallback(data) : data;

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                filtered = filtered.filter(r =>
                    (r.nama_santri || '').toLowerCase().includes(q) ||
                    (r.kegiatan || '').toLowerCase().includes(q) ||
                    (r.ustadz || '').toLowerCase().includes(q)
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

        const tbody = document.querySelector('#pendidikan-table tbody');
        if (!tbody) return;

        if (!rows || rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:50px;color:var(--text-muted);">Tidak ada data untuk kegiatan ini.</td></tr>';
            return;
        }

        tbody.innerHTML = rows.map(row => {
            const rowDataStr = encodeURIComponent(JSON.stringify(row));
            return `<tr>
                <td>${UI.formatDate(row.tanggal)}</td>
                <td><strong>${row.nama_santri}</strong></td>
                <td><span class="th-badge" style="background:#f1f5f9; color:var(--primary);">${row.kegiatan || '-'}</span></td>
                <td><span style="font-weight:bold; color:${row.nilai < 60 ? '#ef4444' : '#0d9488'}">${row.nilai || 0}</span></td>
                <td>${row.kehadiran || '-'}</td>
                <td>${row.ustadz || '-'}</td>
                <td style="display:flex; gap:5px;">
                    <button class="btn btn-action btn-blue" title="Detail" onclick="viewDetail('pendidikan', '${rowDataStr}')"><i class="fas fa-eye"></i></button>
                    ${window.Auth && window.Auth.canEdit('pendidikan') ? `
                        <button class="btn btn-action btn-yellow" title="Edit" onclick="prepareEdit('pendidikan', '${row.id}', '${rowDataStr}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-action btn-red" title="Hapus" onclick="deleteItem('pendidikan', '${row.id}')"><i class="fas fa-trash"></i></button>
                    ` : ''}
                </td>
            </tr>`;
        }).join('');
    },

    updateHeaders() {
        const thead = document.querySelector('#pendidikan-table thead tr');
        if (!thead) return;

        thead.innerHTML = `
            ${this.createSortableHeader('Tanggal', 'tanggal')}
            ${this.createSortableHeader('Nama Santri', 'nama_santri')}
            ${this.createSortableHeader('Kegiatan', 'kegiatan')}
            ${this.createSortableHeader('Nilai', 'nilai')}
            ${this.createSortableHeader('Kehadiran', 'kehadiran')}
            ${this.createSortableHeader('Ustadz', 'ustadz')}
            ${this.createSortableHeader('Aksi', null, '150px')}
        `;
    },

    renderStats(rows) {
        const statsContainer = document.getElementById('pendidikan-stats');
        if (!statsContainer) return;

        const total = rows.length;
        const avgNilai = total > 0 ? (rows.reduce((acc, r) => acc + (parseFloat(r.nilai) || 0), 0) / total).toFixed(1) : 0;
        const hadirCount = rows.filter(r => r.kehadiran === 'Hadir').length;
        const attendanceRate = total > 0 ? ((hadirCount / total) * 100).toFixed(1) : 0;

        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon stat-blue"><i class="fas fa-graduation-cap"></i></div>
                <div>
                    <div class="stat-value">${total}</div>
                    <div class="stat-label">Total Kegiatan</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon stat-green"><i class="fas fa-star"></i></div>
                <div>
                    <div class="stat-value">${avgNilai}</div>
                    <div class="stat-label">Rata-rata Nilai</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon stat-purple"><i class="fas fa-user-check"></i></div>
                <div>
                    <div class="stat-value">${attendanceRate}%</div>
                    <div class="stat-label">Persentase Hadir</div>
                </div>
            </div>
        `;
    }
};

window.PendidikanModule = PendidikanModule;
