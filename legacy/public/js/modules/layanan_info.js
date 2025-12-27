import { UI } from '../core/ui.js';
import { TableSort } from '../core/table_sort.js';
import { apiCall } from '../core/api.js';

export const LayananInfoModule = {
    ...TableSort.createSortableModule('layanan_info'),
    dataMap: {},

    async init() {
        await this.loadAndRender();
    },

    async loadAndRender() {
        try {
            const rows = await apiCall('getData', 'GET', { type: 'layanan_info' });
            this.rows = rows || [];
            this.renderTable();
        } catch (err) {
            console.error('Failed to load layanan_info:', err);
        }
    },

    renderTable() {
        const tbody = document.querySelector('#layanan_info-table tbody');
        if (!tbody) return;

        tbody.innerHTML = this.rows.map(r => {
            this.dataMap[r.id] = r;
            const canEdit = window.Auth && window.Auth.canEdit('layanan_info');

            return `
                <tr>
                    <td><strong>${r.unit}</strong></td>
                    <td>${r.nama_layanan}</td>
                    <td>${UI.formatRupiah(r.harga)}</td>
                    <td>
                        <span class="badge ${r.aktif ? 'badge-success' : 'badge-danger'}">
                            ${r.aktif ? 'Aktif' : 'Non-Aktif'}
                        </span>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-vibrant btn-vibrant-blue" onclick="viewDetail('layanan_info', ${r.id})" title="Detail"><i class="fas fa-eye"></i></button>
                            ${canEdit ? `
                                <button class="btn-vibrant btn-vibrant-yellow" onclick="prepareEdit('layanan_info', ${r.id})" title="Edit"><i class="fas fa-edit"></i></button>
                                <button class="btn-vibrant btn-vibrant-orange" onclick="deleteItem('layanan_info', ${r.id})" title="Hapus"><i class="fas fa-arrows-rotate"></i></button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="5" style="text-align:center;padding:20px;">Belum ada tarif yang dikonfigurasi.</td></tr>';
    },

    setupFormLogic() {
        const container = document.getElementById('form-fields');
        if (!container) return;

        const unitSelect = container.querySelector('[name="unit"]');
        const layananInput = container.querySelector('[name="nama_layanan"]');
        const dropdownList = layananInput ? layananInput.nextElementSibling : null;

        if (!unitSelect || !layananInput || !dropdownList) return;

        const MAPPING = {
            'Keamanan': ['Motor Baru', 'Motor Lama', 'Ontel Baru', 'Ontel Lama', 'Hp', 'Laptop', 'Flashdisk', 'Kompor', 'Izin Pulang', 'Izin Keluar'],
            'Pendidikan': ['Izin Sekolah'],
            'Kesehatan': ['Izin Sakit'],
            'Sekretariat': ['KTK', 'SIM', 'KTS', 'Surat Domisili', 'Surat Pindah', 'Surat Boyong'],
            "Jam'iyyah": ['Alat Rebana 1 Set', 'Alat Rebana Perbiji']
        };

        const updateLayananOptions = () => {
            const unit = unitSelect.value;
            const options = MAPPING[unit] || [];

            // Clear and rebuild dropdown items
            dropdownList.innerHTML = options.map(o => `
                <div class="search-dropdown-item" onclick="UI.selectStaticItem(this, '${o}')">${o}</div>
            `).join('') || '<div class="search-dropdown-item empty">Pilih Unit terlebih dahulu</div>';

            // Clear current input if it doesn't match new unit options
            if (!options.includes(layananInput.value)) {
                // optional: layananInput.value = '';
            }
        };

        unitSelect.addEventListener('change', updateLayananOptions);

        // Initial call
        updateLayananOptions();
    }
};
