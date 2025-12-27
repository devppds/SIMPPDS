import { UI } from '../core/ui.js';
import { apiCall } from '../core/api.js';
import { TableSort } from '../core/table_sort.js';
import { SYSTEM_PRICES } from '../core/config.js';

export const KeamananRegModule = {
    ...TableSort.createSortableModule('keamanan_reg', 'KeamananRegModule'),
    currentAction: null,
    currentCategory: null,

    async init(action) {
        this.currentAction = action;
        this.currentCategory = 'Kendaraan';
        this.currentUnit = 'Keamanan';

        const tabs = document.querySelectorAll('#keamanan_reg-view .tab-btn');
        tabs.forEach(btn => btn.classList.remove('active'));
        if (tabs[0]) tabs[0].classList.add('active');

        this.updateUIText();

        const searchInput = document.getElementById('search-keamanan_reg');
        if (searchInput) {
            searchInput.oninput = () => this.loadData(searchInput.value);
        }

        await this.loadData();
    },

    updateUIText() {
        const titleEl = document.getElementById('keamanan_reg-title');
        const descEl = document.getElementById('keamanan_reg-desc');
        const btnEl = document.getElementById('keamanan_reg-btn');

        if (titleEl) titleEl.textContent = `Registrasi ${this.currentCategory}`;
        if (descEl) {
            const descMap = {
                'Kendaraan': 'Pendataan Motor dan Sepeda santri.',
                'Elektronik': 'Pendataan Laptop, HP, dan alat elektronik lainnya.',
                'Kompor': 'Pendataan Kompor inventaris kamar.'
            };
            descEl.textContent = descMap[this.currentCategory];
        }
        if (btnEl) btnEl.innerHTML = `<i class="fas fa-plus-circle"></i> Tambah ${this.currentCategory}`;
    },

    async switchTab(category, btnEl) {
        this.currentCategory = category;
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        if (btnEl) btnEl.classList.add('active');
        this.updateUIText();
        await this.loadData();
    },

    async loadData(searchQuery = '') {
        const rows = await UI.loadTableData('keamanan_reg', (data) => {
            let filtered = data.filter(r => r.jenis_barang === this.currentCategory);
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                filtered = filtered.filter(r =>
                    (r.nama_santri || '').toLowerCase().includes(q) ||
                    (r.detail_barang || '').toLowerCase().includes(q) ||
                    (r.plat_nomor || '').toLowerCase().includes(q) ||
                    (r.merk || '').toLowerCase().includes(q) ||
                    (r.petugas_penerima || '').toLowerCase().includes(q) ||
                    (r.kamar_penempatan || '').toLowerCase().includes(q)
                );
            }
            return this.applySorting(filtered);
        });
        this.render(rows);
    },

    async setupFormLogic() {
        const container = document.getElementById('form-fields');
        if (!container) return;

        // Auto-fill and hide internals
        const nameInput = container.querySelector('[name="nama_santri"]');
        const kamarInput = container.querySelector('[name="kamar_penempatan"]');

        if (nameInput && kamarInput) {
            const santriData = await apiCall('getData', 'GET', { type: 'santri' });
            const syncRoom = () => {
                const val = nameInput.value.trim();
                const match = (santriData || []).find(s => s.nama_siswa === val);
                if (match && match.kamar) {
                    kamarInput.value = match.kamar;
                }
            };
            nameInput.addEventListener('change', syncRoom);
        }

        const alwaysHide = ['jenis_barang', 'detail_barang'];
        alwaysHide.forEach(name => {
            const el = container.querySelector(`.form-group[data-field="${name}"]`);
            if (el) el.style.display = 'none';
        });

        if (this.currentCategory === 'Kompor') {
            const toHide = ['nama_santri', 'merk', 'warna', 'plat_nomor', 'jenis_kendaraan', 'jenis_elektronik', 'aksesoris_1', 'aksesoris_2', 'aksesoris_3', 'keadaan', 'status_barang_reg'];
            toHide.forEach(name => {
                const el = container.querySelector(`.form-group[data-field="${name}"]`);
                if (el) el.style.display = 'none';
            });
        } else {
            const toHide = ['kondisi_kompor'];
            toHide.forEach(name => {
                const el = container.querySelector(`.form-group[data-field="${name}"]`);
                if (el) el.style.display = 'none';
            });

            if (this.currentCategory === 'Kendaraan') {
                const vHide = ['jenis_elektronik', 'aksesoris_1', 'aksesoris_2', 'aksesoris_3', 'keadaan'];
                vHide.forEach(name => {
                    const el = container.querySelector(`.form-group[data-field="${name}"]`);
                    if (el) el.style.display = 'none';
                });
            } else if (this.currentCategory === 'Elektronik') {
                const eHide = ['jenis_kendaraan', 'plat_nomor'];
                eHide.forEach(name => {
                    const el = container.querySelector(`.form-group[data-field="${name}"]`);
                    if (el) el.style.display = 'none';
                });
            }
        }
    },

    render(rows) {
        this.renderStats(rows);
        this.updateHeaders();
        const tbody = document.querySelector('#keamanan_reg-table tbody');
        if (!tbody) return;
        if (!rows || rows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:50px;color:var(--text-muted);">Belum ada data ${this.currentCategory.toLowerCase()} didaftarkan.</td></tr>`;
            return;
        }
        tbody.innerHTML = rows.map(row => {
            const rowDataStr = encodeURIComponent(JSON.stringify(row));
            if (this.currentCategory === 'Kompor') {
                return `<tr>
                    <td><strong>Km. ${row.kamar_penempatan || '-'}</strong></td>
                    <td>${UI.formatDate(row.tanggal_registrasi)}</td>
                    <td><span class="th-badge" style="background:#f1f5f9; color:var(--primary);">${row.kondisi_kompor || '-'}</span></td>
                    <td>${row.petugas_penerima || '-'}</td>
                    <td style="display:flex; gap:5px;">
                        <button class="btn btn-action btn-blue" onclick="viewDetail('keamanan_reg', '${rowDataStr}')"><i class="fas fa-eye"></i></button>
                        ${window.Auth && window.Auth.canEdit('keamanan_reg') ? `
                            <button class="btn btn-action btn-yellow" onclick="prepareEdit('keamanan_reg', '${row.id}', '${rowDataStr}')"><i class="fas fa-edit"></i></button>
                        ` : ''}
                    </td>
                </tr>`;
            } else {
                const specificType = row.jenis_kendaraan || row.jenis_elektronik || '-';
                const typeColor = this.currentCategory === 'Kendaraan' ? '#1e3a8a' : '#4f46e5';
                return `<tr>
                    <td><strong>${row.nama_santri}</strong></td>
                    <td><span class="th-badge" style="background:${typeColor}11; color:${typeColor}; border:1px solid ${typeColor}33;">${specificType}</span></td>
                    <td>${row.merk || '-'}</td>
                    <td><span style="font-weight:600; color:var(--text-muted);">${row.plat_nomor || row.warna || '-'}</span></td>
                    <td>${row.petugas_penerima || '-'}</td>
                    <td style="display:flex; gap:5px;">
                        <button class="btn btn-action btn-blue" onclick="viewDetail('keamanan_reg', '${rowDataStr}')"><i class="fas fa-eye"></i></button>
                        ${window.Auth && window.Auth.canEdit('keamanan_reg') ? `
                            <button class="btn btn-action btn-yellow" onclick="prepareEdit('keamanan_reg', '${row.id}', '${rowDataStr}')"><i class="fas fa-edit"></i></button>
                        ` : ''}
                    </td>
                </tr>`;
            }
        }).join('');
    },

    renderStats(rows) {
        const statsContainer = document.getElementById('keamanan_reg-stats');
        if (!statsContainer) return;
        const total = rows.length;

        let color = '#1e3a8a';
        let icon = 'fa-car-side';
        if (this.currentCategory === 'Elektronik') { color = '#4f46e5'; icon = 'fa-laptop-code'; }
        if (this.currentCategory === 'Kompor') { color = '#e11d48'; icon = 'fa-fire'; }

        statsContainer.innerHTML = `
            <div class="stat-card" style="border-left: 4px solid ${color};">
                <div class="stat-icon" style="background: ${color}11; color: ${color};">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="stat-info">
                    <div class="value">${total}</div>
                    <div class="label">Total ${this.currentCategory}</div>
                </div>
            </div>
        `;
    },

    updateHeaders() {
        const thead = document.querySelector('#keamanan_reg-table thead tr');
        if (!thead) return;
        if (this.currentCategory === 'Kompor') {
            thead.innerHTML = `
                <th>Kamar</th><th>Tgl Reg</th><th>Kondisi</th><th>Petugas</th><th>Aksi</th>
            `;
        } else {
            thead.innerHTML = `
                <th>Nama Santri</th><th>Jenis</th><th>Merk</th><th>Detail/Plat</th><th>Petugas</th><th>Aksi</th>
            `;
        }
    },

    async afterSave(formData) {
        if (!formData.nama_santri && this.currentCategory !== 'Kompor') return;

        let unit = 'Keamanan';
        let serviceName = '';
        let displayItem = formData.detail_barang || formData.jenis_barang || this.currentCategory;

        // Mapping to database service names
        if (this.currentCategory === 'Kendaraan') {
            if (formData.jenis_kendaraan === 'Motor Baru') serviceName = 'Motor Baru';
            else if (formData.jenis_kendaraan === 'Motor Lama') serviceName = 'Motor Lama';
            else if (formData.jenis_kendaraan === 'Sepeda/Ontel Baru') serviceName = 'Ontel Baru';
            else serviceName = 'Ontel Lama';
        } else if (this.currentCategory === 'Elektronik') {
            if (formData.jenis_elektronik === 'Laptop') serviceName = 'Laptop';
            else if (formData.jenis_elektronik === 'Hp') serviceName = 'Hp';
            else if (formData.jenis_elektronik === 'Flashdisk') serviceName = 'Flashdisk';
        } else if (this.currentCategory === 'Kompor') {
            serviceName = 'Kompor';
        }

        if (!serviceName) return;

        console.log(`AutoLayanan: Processing Registration fee for ${serviceName}`);

        try {
            // 1. Get Stambuk from Santri Data
            let stambuk = '';
            let namaSantri = formData.nama_santri;

            if (this.currentCategory !== 'Kompor') {
                const santri = await apiCall('getData', 'GET', { type: 'santri' });
                const match = (santri || []).find(s => s.nama_siswa === namaSantri);
                stambuk = match ? (match.stambuk_mondok || match.stambuk_pondok || '') : '';
            } else {
                namaSantri = `Kamar ${formData.kamar_penempatan || '-'}`;
            }

            // 2. Get Price from Layanan Info
            const services = await apiCall('getData', 'GET', { type: 'layanan_info' });
            const found = (services || []).find(s => s.nama_layanan === serviceName && s.unit === unit);
            const price = found ? found.harga : 0;

            // 3. Record to Layanan Admin
            await apiCall('saveData', 'POST', {
                type: 'layanan_admin',
                data: {
                    tanggal: new Date().toISOString().split('T')[0],
                    unit: unit,
                    nama_santri: namaSantri,
                    stambuk: stambuk,
                    jenis_layanan: serviceName,
                    nominal: price,
                    keterangan: `Administrasi Otomatis (Reg: ${displayItem})`,
                    pj: formData.petugas_penerima || `${unit} (Otomatis)`,
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
                    nama_santri: namaSantri,
                    stambuk: stambuk,
                    keterangan: `Registrasi ${serviceName} (${displayItem})`,
                    petugas: formData.petugas_penerima || `${unit} (Otomatis)`,
                    status_setor: 'Belum Setor'
                }
            });
        } catch (e) {
            console.error("AutoLayanan KeamananReg failed", e);
        }
    }
};

window.KeamananRegModule = KeamananRegModule;
