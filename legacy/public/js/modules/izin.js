import { UI } from '../core/ui.js';
import { apiCall } from '../core/api.js';
import { TableSort } from '../core/table_sort.js';
import { SYSTEM_PRICES } from '../core/config.js';

export const IzinModule = {
    ...TableSort.createSortableModule('izin'),
    currentAction: null,
    currentType: null,

    async init(action) {
        this.currentAction = action;
        this.currentType = action === 'izin_pendidikan' ? 'Pendidikan' : 'Keamanan';
        this.currentUnit = this.currentType;

        const titleEl = document.getElementById('izin-title');
        const descEl = document.getElementById('izin-desc');
        if (titleEl) titleEl.textContent = `Perizinan ${this.currentType}`;
        if (descEl) descEl.textContent = `Manajemen izin santri di bagian ${this.currentType.toLowerCase()}.`;

        // Bind Search
        const searchInput = document.getElementById('search-izin');
        if (searchInput) {
            searchInput.oninput = () => this.loadData(searchInput.value);
        }

        await this.loadData();
    },

    async loadData(searchQuery = '') {
        let rows = await UI.loadTableData('izin', (data) => {
            let filtered = data.filter(r => r.tipe_izin === this.currentType);
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                filtered = filtered.filter(r =>
                    (r.nama_santri || '').toLowerCase().includes(q) ||
                    (r.alasan || '').toLowerCase().includes(q) ||
                    (r.petugas || '').toLowerCase().includes(q)
                );
            }
            return filtered;
        });

        rows = this.applySorting(rows);
        this.render(rows);
    },

    async openIzinForm() {
        const prefill = { tipe_izin: this.currentType };
        await UI.openForm('izin', prefill);

        const container = document.getElementById('form-fields');
        const petugasSelect = container.querySelector('[name="petugas"]');

        // Re-filter Petugas options based on current module (Keamanan/Pendidikan)
        if (petugasSelect) {
            try {
                const [ustadz, pengurus] = await Promise.all([
                    apiCall('getData', 'GET', { type: 'ustadz' }),
                    apiCall('getData', 'GET', { type: 'pengurus' })
                ]);
                const uNames = (ustadz || []).map(u => u.nama);
                const pList = pengurus || [];

                let filtered = [];
                if (this.currentType === 'Keamanan') {
                    filtered = pList.filter(p => (p.divisi || '').includes('Keamanan')).map(p => p.nama).sort();
                } else {
                    filtered = [...new Set([
                        ...uNames,
                        ...pList.filter(p => (p.divisi || '').includes('Pendidikan') || (p.divisi || '').includes('Wajar')).map(p => p.nama)
                    ])].sort();
                }

                petugasSelect.innerHTML = `<option value="">-- Pilih Petugas ${this.currentType} --</option>` +
                    filtered.map(name => `<option value="${name}">${name}</option>`).join('');
            } catch (e) {
                console.error("Failed to refilter petugas", e);
            }
        }

        const alasanSelect = container.querySelector('[name="alasan"]');
        const santriInput = container.querySelector('[name="nama_santri"]');
        const tglPulangRow = container.querySelector('.form-group-wrapper[data-field="tanggal_pulang"]');
        const tglKembaliRow = container.querySelector('.form-group-wrapper[data-field="tanggal_kembali"]');
        const jamMulaiRow = container.querySelector('.form-group-wrapper[data-field="jam_mulai"]');
        const jamSelesaiRow = container.querySelector('.form-group-wrapper[data-field="jam_selesai"]');

        // Filter Alasan based on current module
        if (alasanSelect) {
            let options = [];
            if (this.currentType === 'Keamanan') {
                options = ['Pulang', 'Keluar'];
            } else {
                options = ['Izin Sekolah', 'Izin Kegiatan'];
            }
            alasanSelect.innerHTML = `<option value="">-- Pilih Alasan --</option>` +
                options.map(o => `<option value="${o}">${o}</option>`).join('');
        }

        const updateVisibility = () => {
            const val = alasanSelect.value;
            if (val === 'Pulang') {
                if (tglPulangRow) tglPulangRow.style.display = 'block';
                if (tglKembaliRow) tglKembaliRow.style.display = 'block';
                if (jamMulaiRow) jamMulaiRow.style.display = 'none';
                if (jamSelesaiRow) jamSelesaiRow.style.display = 'none';
            } else if (val === 'Keluar') {
                if (tglPulangRow) tglPulangRow.style.display = 'none';
                if (tglKembaliRow) tglKembaliRow.style.display = 'none';
                if (jamMulaiRow) jamMulaiRow.style.display = 'block';
                if (jamSelesaiRow) jamSelesaiRow.style.display = 'block';
            } else {
                if (tglPulangRow) tglPulangRow.style.display = 'none';
                if (tglKembaliRow) tglKembaliRow.style.display = 'none';
                if (jamMulaiRow) jamMulaiRow.style.display = 'none';
                if (jamSelesaiRow) jamSelesaiRow.style.display = 'none';
            }
        };

        const checkSakitStatus = async () => {
            if (santriInput.value && this.currentType === 'Pendidikan') {
                const kesehatanData = await apiCall('getData', 'GET', { type: 'kesehatan' });
                const isSakit = kesehatanData.some(k => k.nama_santri === santriInput.value && k.status_periksa !== 'Sembuh');
                if (isSakit) {
                    const ketInput = container.querySelector('[name="keterangan"]');
                    if (ketInput && !ketInput.value) ketInput.value = 'Terdaftar di data Kesehatan (Sedang Sakit)';
                }
            }
        };

        alasanSelect.onchange = () => {
            updateVisibility();
            checkSakitStatus();
        };

        santriInput.onchange = checkSakitStatus;

        // Init visibility
        updateVisibility();
    },

    render(rows) {
        this.renderStats(rows);
        this.updateHeaders();

        const tbody = document.querySelector('#izin-table tbody');
        if (!tbody) return;

        if (!rows || rows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:50px;color:var(--text-muted);">Tidak ada data izin ${this.currentType.toLowerCase()}.</td></tr>`;
            return;
        }

        tbody.innerHTML = rows.map(row => {
            const rowDataStr = encodeURIComponent(JSON.stringify(row));
            const statusColor = row.alasan === 'Pulang' ? '#6366f1' : row.alasan === 'Keluar' ? '#f59e0b' : '#10b981';

            let dari = '-';
            let sampai = '-';

            if (row.alasan === 'Pulang') {
                dari = row.tanggal_pulang ? UI.formatDate(row.tanggal_pulang) : '-';
                sampai = row.tanggal_kembali ? UI.formatDate(row.tanggal_kembali) : '-';
            } else if (row.alasan === 'Keluar') {
                dari = row.jam_mulai || '-';
                sampai = row.jam_selesai || '-';
            }

            return `<tr>
                <td><strong>${row.nama_santri}</strong></td>
                <td><span class="th-badge" style="background:#f1f5f9; color:${statusColor};">${row.alasan}</span></td>
                <td>${dari}</td>
                <td>${sampai}</td>
                <td><span class="th-badge" style="background:#f1f5f9; color:var(--primary);">${row.keterangan ? 'Detail' : 'Normal'}</span></td>
                <td>${row.petugas || '-'}</td>
                <td style="display:flex; gap:5px;">
                    <button class="btn btn-action btn-blue" title="Detail" onclick="viewDetail('izin', '${rowDataStr}')"><i class="fas fa-eye"></i></button>
                    ${window.Auth && window.Auth.canEdit('izin') ? `
                        <button class="btn btn-action btn-yellow" title="Edit" onclick="prepareEdit('izin', '${row.id}', '${rowDataStr}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-action btn-red" title="Hapus" onclick="deleteItem('izin', '${row.id}')"><i class="fas fa-trash"></i></button>
                    ` : ''}
                </td>
            </tr>`;
        }).join('');
    },

    updateHeaders() {
        const thead = document.querySelector('#izin-table thead tr');
        if (!thead) return;

        thead.innerHTML = `
            ${this.createSortableHeader('Nama Santri', 'nama_santri')}
            ${this.createSortableHeader('Alasan', 'alasan')}
            ${this.createSortableHeader('Dari', 'tanggal_pulang')}
            ${this.createSortableHeader('Sampai', 'tanggal_kembali')}
            ${this.createSortableHeader('Status', null)}
            ${this.createSortableHeader('Petugas', 'petugas')}
            ${this.createSortableHeader('Aksi', null, '150px')}
        `;
    },

    renderStats(rows) {
        const statsContainer = document.getElementById('izin-stats');
        if (!statsContainer) return;

        const total = rows.length;
        let statsHTML = '';

        if (this.currentType === 'Keamanan') {
            const pulang = rows.filter(r => r.alasan === 'Pulang').length;
            const keluar = rows.filter(r => r.alasan === 'Keluar').length;
            statsHTML = `
                <div class="stat-card">
                    <div class="stat-icon" style="background:#eef2ff; color:#6366f1;"><i class="fas fa-home"></i></div>
                    <div>
                        <div class="stat-value">${pulang}</div>
                        <div class="stat-label">Sedang Pulang</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background:#fff7ed; color:#f59e0b;"><i class="fas fa-walking"></i></div>
                    <div>
                        <div class="stat-value">${keluar}</div>
                        <div class="stat-label">Izin Keluar</div>
                    </div>
                </div>
            `;
        } else {
            const sekolah = rows.filter(r => r.alasan === 'Izin Sekolah').length;
            const kegiatan = rows.filter(r => r.alasan === 'Izin Kegiatan').length;
            statsHTML = `
                <div class="stat-card">
                    <div class="stat-icon" style="background:#f0fdf4; color:#10b981;"><i class="fas fa-school"></i></div>
                    <div>
                        <div class="stat-value">${sekolah}</div>
                        <div class="stat-label">Izin Sekolah</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background:#f5f3ff; color:#8b5cf6;"><i class="fas fa-calendar-check"></i></div>
                    <div>
                        <div class="stat-value">${kegiatan}</div>
                        <div class="stat-label">Izin Kegiatan</div>
                    </div>
                </div>
            `;
        }

        statsContainer.innerHTML = statsHTML;
    },

    async afterSave(formData) {
        if (!formData.nama_santri || !formData.alasan) return;

        console.log(`AutoLayanan: Processing Izin fee for ${formData.nama_santri} (${formData.alasan})`);

        let serviceName = '';
        let unit = this.currentType; // Keamanan or Pendidikan

        if (unit === 'Keamanan') {
            serviceName = 'Izin KELUAR/PULANG';
        } else if (unit === 'Pendidikan') {
            serviceName = 'Izin SEKOLAH';
        }

        if (!serviceName) return;

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
                    keterangan: `Administrasi Otomatis (Izin: ${formData.alasan})`,
                    pj: formData.petugas || `${unit} (Otomatis)`,
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
                    keterangan: `Administrasi Izin ${formData.alasan}`,
                    petugas: formData.petugas || `${unit} (Otomatis)`,
                    status_setor: 'Belum Setor'
                }
            });
        } catch (e) {
            console.error("AutoLayanan Izin failed", e);
        }
    }
};

window.IzinModule = IzinModule;
