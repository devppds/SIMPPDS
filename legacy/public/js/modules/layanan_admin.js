import { UI } from '../core/ui.js';
import { TableSort } from '../core/table_sort.js';
import { apiCall } from '../core/api.js';
import { SYSTEM_PRICES } from '../core/config.js';

export const LayananAdminModule = {
    ...TableSort.createSortableModule('layanan_admin'),
    dataMap: {},
    currentAction: null,
    currentUnit: null,

    async init(action) {
        this.currentAction = action || 'sekretariat';

        // Map action to unit name
        const unitMap = {
            'sekretariat': 'Sekretariat',
            'jamiyyah': "Jam'iyyah",
            'keamanan': 'Keamanan',
            'pendidikan': 'Pendidikan',
            'kesehatan': 'Kesehatan'
        };

        this.currentUnit = unitMap[this.currentAction] || 'Sekretariat';

        const titleEl = document.getElementById('layanan_admin-title');
        const descEl = document.getElementById('layanan_admin-desc');
        const btnEl = document.getElementById('layanan_admin-btn');

        if (titleEl) titleEl.textContent = `Layanan ${this.currentUnit}`;
        if (descEl) descEl.textContent = `Manajemen layanan administrasi dan registrasi bagian ${this.currentUnit}.`;
        if (btnEl) {
            btnEl.innerHTML = `<i class="fas fa-plus-circle"></i> Catat Layanan Baru`;
            btnEl.onclick = () => openForm('layanan_admin', { unit: this.currentUnit });
        }

        // Bind Search
        const searchInput = document.getElementById('search-layanan_admin');
        if (searchInput) searchInput.oninput = () => this.loadAndRender(searchInput.value);

        await this.loadAndRender();
    },

    async loadAndRender(search = '') {
        try {
            const rows = await apiCall('getData', 'GET', { type: 'layanan_admin' });
            // Filter by current unit
            this.rows = (rows || []).filter(r => r.unit === this.currentUnit);
            this.renderTable(search);
        } catch (err) {
            console.error('Failed to load layanan_admin:', err);
        }
    },

    renderTable(search = '') {
        const tbody = document.querySelector('#layanan_admin-table tbody');
        if (!tbody) return;

        let filtered = this.rows;
        if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter(r =>
                (r.nama_santri || '').toLowerCase().includes(q) ||
                (r.jenis_layanan || '').toLowerCase().includes(q)
            );
        }

        tbody.innerHTML = filtered.map(r => {
            this.dataMap[r.id] = r;
            const canEdit = window.Auth && window.Auth.canEdit('layanan_admin');
            const color = r.unit === "Jam'iyyah" ? 'badge-gold' : 'badge-primary';

            return `
                <tr>
                    <td>${UI.formatDate(r.tanggal)}</td>
                    <td>
                        <div class="font-bold">${r.nama_santri}</div>
                        ${r.pemohon_tipe && r.pemohon_tipe !== 'Pribadi (Santri)' ? `<div class="text-xs" style="color:var(--gold)">Kelompok: ${r.pemohon_tipe}</div>` : ''}
                    </td>
                    <td><span class="badge ${color}">${r.jenis_layanan}</span> ${r.jumlah || ''}</td>
                    <td>${UI.formatRupiah(r.nominal)}</td>
                    <td>${r.pj || '-'}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-vibrant btn-vibrant-blue" onclick="viewDetail('layanan_admin', ${r.id})" title="Detail"><i class="fas fa-eye"></i></button>
                            ${canEdit ? `
                                <button class="btn-vibrant btn-vibrant-yellow" onclick="prepareEdit('layanan_admin', ${r.id})" title="Edit"><i class="fas fa-edit"></i></button>
                                <button class="btn-vibrant btn-vibrant-orange" onclick="deleteItem('layanan_admin', ${r.id})" title="Hapus"><i class="fas fa-arrows-rotate"></i></button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted);">Belum ada data layanan.</td></tr>';
    },

    async afterSave() {
        // Auto-record to kas_unit disabled
    },

    async setupFormLogic() {
        const container = document.getElementById('form-fields');
        if (!container) return;

        const unitSelect = container.querySelector('[name="unit"]');
        const pemohonTipeSelect = container.querySelector('[name="pemohon_tipe"]');
        const santriSearchWrapper = container.querySelector('.form-group[data-field="nama_santri"]');
        const santriInput = container.querySelector('[name="nama_santri"]');
        const jenisInput = container.querySelector('[name="jenis_layanan"]');
        const jumlahInput = container.querySelector('[name="jumlah"]');
        const nominalInput = container.querySelector('[name="nominal"]');
        const dropdownList = jenisInput ? jenisInput.nextElementSibling : null;

        // 1. Auto-fill and Hide Unit
        if (unitSelect) {
            unitSelect.value = this.currentUnit;
            const unitGroup = container.querySelector('.form-group[data-field="unit"]');
            if (unitGroup) unitGroup.style.display = 'none';
        }

        // Cache for prices
        let layananInfoCache = null;

        const loadLayananOptions = async () => {
            try {
                if (!layananInfoCache) {
                    layananInfoCache = await apiCall('getData', 'GET', { type: 'layanan_info' });
                }

                const options = (layananInfoCache || [])
                    .filter(l => l.unit === this.currentUnit && l.aktif);

                if (dropdownList) {
                    dropdownList.innerHTML = options.map(opt => `
                        <div class="search-dropdown-item" onclick="UI.selectStaticItem(this, '${opt.nama_layanan}')" style="display:flex; justify-content:space-between; align-items:center;">
                            <span>${opt.nama_layanan}</span>
                            <span style="font-size:0.75rem; color:var(--primary); font-weight:600;">${opt.harga > 0 ? UI.formatRupiah(opt.harga) : 'Manual'}</span>
                        </div>
                    `).join('') || '<div class="search-dropdown-item empty">Tidak ada layanan tersedia</div>';
                }
            } catch (err) {
                console.error('Failed to load layanan options:', err);
            }
        };

        // Load and filter PJ (Penanggung Jawab) based on unit
        const loadPJOptions = async () => {
            try {
                const pjSelect = container.querySelector('[name="pj"]');
                if (!pjSelect) return;

                const pengurus = await apiCall('getData', 'GET', { type: 'pengurus' });

                // Filter pengurus by division matching current unit
                const filtered = (pengurus || [])
                    .filter(p => {
                        const divisi = p.divisi || '';
                        const status = p.status || 'Aktif';

                        // Only active pengurus
                        if (status !== 'Aktif') return false;

                        // Match division to unit
                        if (this.currentUnit === 'Keamanan' && divisi.includes('Keamanan')) return true;
                        if (this.currentUnit === 'Sekretariat' && divisi.includes('Sekretariat')) return true;
                        if (this.currentUnit === "Jam'iyyah" && divisi.includes("Jam'iyyah")) return true;
                        if (this.currentUnit === 'Pendidikan' && (divisi.includes('Pendidikan') || divisi.includes('Wajar'))) return true;
                        if (this.currentUnit === 'Kesehatan' && divisi.includes('Kesehatan')) return true;

                        return false;
                    })
                    .map(p => p.nama)
                    .sort();

                pjSelect.innerHTML = `<option value="">-- Pilih Petugas ${this.currentUnit} --</option>` +
                    filtered.map(name => `<option value="${name}">${name}</option>`).join('');

            } catch (err) {
                console.error('Failed to load PJ options:', err);
            }
        };

        // 2. Handle Pemohon Logic (Only for Jam'iyyah)
        const updatePemohonUI = () => {
            if (this.currentAction === 'jamiyyah' && pemohonTipeSelect) {
                const val = pemohonTipeSelect.value;
                if (val === 'Pribadi (Santri)') {
                    if (santriSearchWrapper) santriSearchWrapper.style.display = 'block';
                    if (jumlahInput) jumlahInput.value = '1 Biji';
                } else {
                    if (santriSearchWrapper) santriSearchWrapper.style.display = 'none';
                    if (santriInput) santriInput.value = val;
                    if (jumlahInput) jumlahInput.value = '1 Set';
                }
            } else if (pemohonTipeSelect) {
                const pemohonField = container.querySelector('[data-field="pemohon_tipe"]');
                if (pemohonField) pemohonField.style.display = 'none';
            }
            updatePrice();
        };

        // 3. Price Automation
        const updatePrice = () => {
            const jenis = jenisInput.value;
            if (!jenis || !layananInfoCache) return;

            // Find price in cache
            let lookupName = jenis;

            // Special logic for Jam'iyyah Rebana prices (matching seed_tarif names)
            if (this.currentUnit === "Jam'iyyah" && jenis === 'Registrasi Alat Rebana') {
                const tipe = pemohonTipeSelect ? pemohonTipeSelect.value : 'Pribadi (Santri)';
                lookupName = (tipe === 'Pribadi (Santri)') ? 'Alat Rebana Perbiji' : 'Alat Rebana 1 Set';
            }

            const tarif = layananInfoCache.find(l => l.unit === this.currentUnit && l.nama_layanan === lookupName);

            if (tarif && tarif.harga > 0) {
                nominalInput.value = tarif.harga;
                nominalInput.readOnly = true;
                nominalInput.style.background = '#f0f9ff';
                nominalInput.style.fontWeight = 'bold';
                nominalInput.style.color = 'var(--primary)';
            } else {
                nominalInput.readOnly = false;
                nominalInput.style.background = '';
                nominalInput.style.fontWeight = 'normal';
                nominalInput.style.color = '';
                if (!nominalInput.value) nominalInput.placeholder = 'Masukkan nominal manual';
            }
        };

        // Event listeners
        if (pemohonTipeSelect) pemohonTipeSelect.addEventListener('change', updatePemohonUI);
        if (jenisInput) {
            jenisInput.addEventListener('change', updatePrice);
            jenisInput.addEventListener('input', updatePrice);
        }

        // Initialize
        await loadLayananOptions();
        await loadPJOptions();
        updatePemohonUI();
        updatePrice();
    }
};

