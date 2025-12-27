import { apiCall } from './api.js';
import { FIELDS_CONFIG } from './config.js';
import { Router } from './router.js';

export const UI = {
    openModal(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'flex';
    },

    closeModal(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    },

    formatDate(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        return d.toLocaleDateString('id-ID');
    },

    formatRupiah(number) {
        return 'Rp ' + Number(number || 0).toLocaleString('id-ID');
    },

    async loadTableData(type, filterCallback, params = {}) {
        const tbody = document.querySelector(`#${type}-table tbody`);
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:30px;"><i class="fas fa-spinner fa-spin"></i> Memuat data...</td></tr>';

        try {
            const rows = await apiCall('getData', 'GET', { type, ...params });
            const dataToRender = filterCallback ? filterCallback(rows || []) : (rows || []);
            return dataToRender;
        } catch (e) {
            console.error(e);
            if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:red;padding:30px;">Gagal memuat data.</td></tr>';
            return [];
        }
    },

    populateFilterOptions(elementId, options, defaultLabel) {
        const select = document.getElementById(elementId);
        if (!select) return;

        const currentVal = select.value;
        select.innerHTML = `<option value="">${defaultLabel}</option>` +
            options.map(o => `<option value="${o}">${o}</option>`).join('');
        select.value = currentVal;
    },

    async deleteItem(type, id) {
        if (confirm('Hapus data ini?')) {
            try {
                await apiCall('deleteData', 'DELETE', { type, id });
                // Re-navigate to the same view to refresh the table without full reload
                const Router = (await import('./router.js')).Router;
                Router.navigate(Router.currentView);
            } catch (err) {
                alert('Gagal menghapus: ' + err.message);
            }
        }
    },

    async openForm(type, prefill = {}) {
        const container = document.getElementById('form-fields');
        container.innerHTML = '';
        document.getElementById('row_index').value = '';
        const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
        document.getElementById('modal-title').textContent = 'Tambah Data ' + capitalizedType;

        const config = FIELDS_CONFIG[type];
        if (!config) return;

        // Pre-fetch staff names based on roles
        let penasihatOptions = [];
        let keamananOptions = [];
        let pendidikanOptions = [];
        let bendaharaOptions = [];
        let sekretarisOptions = [];

        const staffTypes = ['penasihat_select', 'keamanan_select', 'pendidikan_select', 'bendahara_select', 'sekretaris_select', 'lembaga_select'];
        if (config.some(f => staffTypes.includes(f.type))) {
            try {
                const [ustadz, pengurus] = await Promise.all([
                    apiCall('getData', 'GET', { type: 'ustadz' }),
                    apiCall('getData', 'GET', { type: 'pengurus' })
                ]);
                const uNames = (ustadz || []).filter(u => (u.status || 'Aktif') === 'Aktif').map(u => u.nama);
                const pList = (pengurus || []).filter(p => (p.status || 'Aktif') === 'Aktif');

                // Filter functions (only active staff)
                keamananOptions = pList.filter(p => (p.divisi || '').includes('Keamanan')).map(p => p.nama).sort();
                pendidikanOptions = [...new Set([
                    ...uNames,
                    ...pList.filter(p => (p.divisi || '').includes('Pendidikan') || (p.divisi || '').includes('Wajar')).map(p => p.nama)
                ])].sort();
                bendaharaOptions = pList.filter(p => (p.divisi || '').includes('Bendahara') || (p.divisi || '').includes('Keuangan') || (p.jabatan || '').includes('Bendahara')).map(p => p.nama).sort();
                sekretarisOptions = pList.filter(p => (p.divisi || '').includes('Sekretaris') || (p.jabatan || '').includes('Sekretaris')).map(p => p.nama).sort();

                // Fetch Lembaga / Kelompok
                try {
                    const lembaga = await apiCall('getData', 'GET', { type: 'lembaga' });
                    window._lembagaOptions = (lembaga || []).map(l => l.nama).sort();
                } catch (e) {
                    console.error("Failed to load lembaga options", e);
                }

                // All staff for generic penasihat
                penasihatOptions = [...new Set([...uNames, ...pList.map(p => p.nama)])].sort();
            } catch (e) {
                console.error("Failed to load staff options", e);
            }
        }

        // Pre-fetch santri names if needed
        if (config.some(f => f.type === 'santri_search')) {
            try {
                // We keep names in a global array for the custom search
                const santri = await apiCall('getData', 'GET', { type: 'santri' });
                window._santriList = (santri || []).map(s => s.nama_siswa);
            } catch (e) {
                console.error("Failed to load santri options", e);
            }
        }

        // Pre-fetch room names if needed
        let kamarOptions = [];
        if (config.some(f => f.type === 'kamar_select')) {
            try {
                const kamars = await apiCall('getData', 'GET', { type: 'kamar' });
                kamarOptions = (kamars || []).map(k => k.nama_kamar).sort();
            } catch (e) {
                console.error("Failed to load kamar options", e);
            }
        }

        config.forEach(field => {
            if (field.section) {
                container.innerHTML += `<h4 class="form-section-title">${field.section}</h4>`;
                return;
            }
            const req = field.required ? ' required' : '';

            let inputHtml = ``;
            if (field.type === 'textarea') {
                inputHtml = `<textarea name="${field.name}" rows="3"${req}></textarea>`;
            } else if (field.type === 'select') {
                inputHtml = `<select name="${field.name}"${req}>${field.options.map(o => `<option value="${o}">${o}</option>`).join('')}</select>`;
            } else if (field.type === 'file') {
                inputHtml = `<input type="file" name="${field.name}" accept="image/*"${req}>`;
            } else if (field.type === 'santri_search') {
                inputHtml = `
                    <div class="search-select-wrapper">
                        <input type="text" name="${field.name}" 
                               placeholder="Cari & Pilih Santri..." 
                               class="search-select-input"
                               onfocus="UI.showSearchDropdown(this)"
                               oninput="UI.filterSearchDropdown(this)"
                               autocomplete="off"${req}>
                        <div class="search-dropdown-list" style="display:none;"></div>
                    </div>`;
            } else if (staffTypes.includes(field.type)) {
                let opts = [];
                if (field.type === 'keamanan_select') opts = keamananOptions;
                else if (field.type === 'pendidikan_select') opts = pendidikanOptions;
                else if (field.type === 'bendahara_select') opts = bendaharaOptions;
                else if (field.type === 'sekretaris_select') opts = sekretarisOptions;
                else if (field.type === 'lembaga_select') opts = window._lembagaOptions || [];
                else opts = penasihatOptions;

                inputHtml = `<select name="${field.name}"${req}>
                    <option value="">-- Pilih ${field.label} --</option>
                    ${opts.map(o => `<option value="${o}">${o}</option>`).join('')}
                </select>`;
            } else if (field.type === 'kamar_select') {
                inputHtml = `<select name="${field.name}"${req}>
                    <option value="">-- Lokasi Kamar --</option>
                    ${kamarOptions.map(o => `<option value="${o}">${o}</option>`).join('')}
                </select>`;
            } else if (field.type === 'datalist') {
                inputHtml = `
                    <div class="search-select-wrapper">
                        <input type="text" name="${field.name}" 
                               placeholder="Cari atau ketik baru..." 
                               class="search-select-input"
                               onfocus="UI.showStaticDropdown(this)"
                               oninput="UI.filterStaticDropdown(this)"
                               autocomplete="off"${req}>
                        <div class="search-dropdown-list" style="display:none;">
                            ${(field.options || []).map(o => `<div class="search-dropdown-item" onclick="UI.selectStaticItem(this, '${o}')">${o}</div>`).join('')}
                        </div>
                    </div>`;
            } else {
                inputHtml = `<input type="${field.type}" name="${field.name}"${req}>`;
            }
            container.innerHTML += `<div class="form-group" data-field="${field.name}"><label>${field.label}</label>${inputHtml}</div>`;
        });

        // Apply prefill
        Object.keys(prefill).forEach(key => {
            const input = container.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = prefill[key];
                // Hide the field if it's prefilled (to avoid user changing it as requested)
                const wrapper = container.querySelector(`.form-group[data-field="${key}"]`);
                if (wrapper) wrapper.style.display = 'none';
            }
        });

        const form = document.getElementById('dynamic-form');
        form.setAttribute('data-type', type);

        // --- SPECIAL LOGIC FOR PENGURUS JABATAN/DIVISI ---
        if (type === 'pengurus') {
            const jabatanSelect = container.querySelector('[name="jabatan"]');
            const divisiSelect = container.querySelector('[name="divisi"]');

            if (jabatanSelect && divisiSelect) {
                const allDivisi = FIELDS_CONFIG['pengurus'].find(f => f.name === 'divisi').options;
                const harianList = ['Ketua Umum', 'Ketua I', 'Ketua II', 'Ketua III', 'Sekretaris Umum', 'Sekretaris I', 'Sekretaris II', 'Sekretaris III', 'Bendahara Umum', 'Bendahara I', 'Bendahara II'];

                const updateDivisi = () => {
                    const selectedJabatan = jabatanSelect.value;
                    let filtered = [];
                    if (selectedJabatan === 'Dewan Harian') {
                        filtered = allDivisi.filter(d => harianList.includes(d));
                    } else if (selectedJabatan === 'Dewan Pleno') {
                        filtered = allDivisi.filter(d => !harianList.includes(d));
                    } else {
                        filtered = allDivisi;
                    }

                    const currentDivisi = divisiSelect.value;
                    divisiSelect.innerHTML = filtered.map(o => `<option value="${o}">${o}</option>`).join('');
                    if (filtered.includes(currentDivisi)) {
                        divisiSelect.value = currentDivisi;
                    }
                };

                jabatanSelect.onchange = updateDivisi;
                setTimeout(updateDivisi, 150);
            }
        }

        // --- SPECIAL LOGIC FOR REGISTRASI BARANG (Dynamic Fields) ---
        if (type === 'keamanan_reg') {
            const jenisSelect = container.querySelector('[name="jenis_barang"]');
            if (jenisSelect) {
                const toggleFields = () => {
                    const val = jenisSelect.value;
                    const allDynamic = ['detail_barang', 'jenis_kendaraan', 'jenis_elektronik', 'plat_nomor', 'aksesoris_1', 'aksesoris_2', 'aksesoris_3'];

                    // Hide all first
                    allDynamic.forEach(name => {
                        const el = container.querySelector(`[data-field="${name}"]`);
                        if (el) el.style.display = 'none';
                    });

                    // Show based on type
                    if (val === 'Kendaraan') {
                        ['jenis_kendaraan', 'plat_nomor'].forEach(name => {
                            const el = container.querySelector(`[data-field="${name}"]`);
                            if (el) el.style.display = 'block';
                        });
                    } else if (val === 'Elektronik') {
                        ['jenis_elektronik', 'aksesoris_1', 'aksesoris_2', 'aksesoris_3'].forEach(name => {
                            const el = container.querySelector(`[data-field="${name}"]`);
                            if (el) el.style.display = 'block';
                        });
                    } else if (val === 'Kompor') {
                        ['detail_barang'].forEach(name => {
                            const el = container.querySelector(`[data-field="${name}"]`);
                            if (el) {
                                el.style.display = 'block';
                                el.querySelector('label').textContent = 'Tipe/Ukuran Kompor';
                            }
                        });
                    }
                };
                jenisSelect.onchange = toggleFields;
                setTimeout(toggleFields, 150);
            }
        }

        // --- SPECIAL LOGIC FOR SANTRI MADRASAH/KELAS ---
        if (type === 'santri') {
            const madrasahSelect = container.querySelector('[name="madrasah"]');
            const kelasSelect = container.querySelector('[name="kelas"]');
            if (madrasahSelect && kelasSelect) {
                const miuClasses = ['I Ula', 'II Ula', 'III Ula', 'I Wustho', 'II Wustho', 'III Wustho', 'I Ulya', 'II Ulya', 'III Ulya'];
                const mhmClasses = ['V Ibtida\'iyyah', 'VI Ibtida\'iyyah', 'I Tsanawiyyah', 'II Tsanawiyyah', 'III Tsanawiyyah', 'I Aliyyah', 'II Aliyyah', 'III Aliyyah', 'Ma\'had Aly I-II', 'Ma\'had Aly III-IV', 'Ma\'had Aly V-VI', 'II Ma\'had Aly'];

                const updateKelas = () => {
                    const val = madrasahSelect.value;
                    let filtered = [];
                    if (val === 'MIU') filtered = miuClasses;
                    else if (val === 'MHM') filtered = mhmClasses;
                    else filtered = [...miuClasses, ...mhmClasses];

                    const currentVal = kelasSelect.value;
                    kelasSelect.innerHTML = filtered.map(o => `<option value="${o}">${o}</option>`).join('');
                    if (filtered.includes(currentVal)) kelasSelect.value = currentVal;
                };

                madrasahSelect.onchange = updateKelas;
                setTimeout(updateKelas, 150);
            }
        }

        // --- SPECIAL LOGIC FOR PERIZINAN (Dynamic Date/Time) ---
        if (type === 'izin') {
            const alasanSelect = container.querySelector('[name="alasan"]');
            if (alasanSelect) {
                const toggleIzinFields = () => {
                    const val = alasanSelect.value;
                    const dateFields = ['tanggal_pulang', 'tanggal_kembali'];
                    const timeFields = ['jam_mulai', 'jam_selesai'];

                    if (val === 'Pulang' || val === 'Izin Sekolah' || val === 'Izin Kegiatan') {
                        dateFields.forEach(f => {
                            const el = container.querySelector(`[data-field="${f}"]`);
                            if (el) el.style.display = 'block';
                        });
                        timeFields.forEach(f => {
                            const el = container.querySelector(`[data-field="${f}"]`);
                            if (el) el.style.display = 'none';
                        });
                    } else if (val === 'Keluar') {
                        dateFields.forEach(f => {
                            const el = container.querySelector(`[data-field="${f}"]`);
                            if (el) el.style.display = 'none';
                        });
                        timeFields.forEach(f => {
                            const el = container.querySelector(`[data-field="${f}"]`);
                            if (el) el.style.display = 'block';
                        });
                    } else {
                        // Default show all or specific logic
                        [...dateFields, ...timeFields].forEach(f => {
                            const el = container.querySelector(`[data-field="${f}"]`);
                            if (el) el.style.display = 'block';
                        });
                    }
                };
                alasanSelect.onchange = toggleIzinFields;
                setTimeout(toggleIzinFields, 150);
            }
        }

        // --- SPECIAL LOGIC FOR LAYANAN ADMIN (Auto Info) ---
        if (type === 'layanan_admin') {
            const unitSelect = container.querySelector('[name="unit"]');
            const jenisInput = container.querySelector('[name="jenis_layanan"]');
            const nominalInput = container.querySelector('[name="nominal"]');
            const pjSelect = container.querySelector('[name="pj"]');

            if (unitSelect && jenisInput) {
                try {
                    const services = await apiCall('getData', 'GET', { type: 'layanan_info' });
                    const activeServices = (services || []).filter(s => s.aktif !== 'Non-Aktif' && s.aktif !== false);

                    const updateServices = () => {
                        const selectedUnit = unitSelect.value;
                        const filtered = activeServices.filter(s => s.unit === selectedUnit);

                        // Targeting the correct dropdown list strictly
                        const jenisWrapper = container.querySelector('[data-field="jenis_layanan"] .search-select-wrapper');
                        const listWrapper = jenisWrapper ? jenisWrapper.querySelector('.search-dropdown-list') : null;

                        // Clear current input/nominal ONLY if adding new (not editing)
                        const isEdit = document.getElementById('row_index') && document.getElementById('row_index').value !== '';
                        if (!isEdit) {
                            jenisInput.value = '';
                            if (nominalInput) nominalInput.value = '';
                        }

                        // Toggle Tipe Pemohon (Only for Jam'iyyah)
                        const pemohonField = container.querySelector('[data-field="pemohon_tipe"]');
                        if (pemohonField) {
                            pemohonField.style.display = (selectedUnit === "Jam'iyyah") ? 'block' : 'none';
                        }

                        if (selectedUnit && listWrapper) {
                            listWrapper.innerHTML = filtered.map(s => `
                                <div class="search-dropdown-item" onclick="UI.selectLayananInfo(this, '${s.nama_layanan.replace(/'/g, "\\'")}', ${s.harga})">
                                    <i class="fas fa-tag" style="margin-right:10px; color:var(--primary); opacity:0.7;"></i>
                                    <div style="flex:1;">
                                        <div style="font-weight:600; font-size:0.9rem;">${s.nama_layanan}</div>
                                        <div style="font-size:0.75rem; color:var(--text-muted);">Rp ${Number(s.harga).toLocaleString()}</div>
                                    </div>
                                </div>
                            `).join('');

                            if (filtered.length === 0) {
                                listWrapper.innerHTML = `<div class="search-dropdown-item empty">Tidak ada layanan untuk unit ${selectedUnit}</div>`;
                            }
                        } else if (listWrapper) {
                            listWrapper.innerHTML = `<div class="search-dropdown-item empty">Pilih unit terlebih dahulu</div>`;
                        }
                    };

                    unitSelect.onchange = updateServices;
                    setTimeout(updateServices, 200);

                    if (pjSelect && !pjSelect.value && sekretarisOptions.length > 0) {
                        pjSelect.value = sekretarisOptions[0];
                    }

                } catch (e) {
                    console.error("Layanan Admin Logic Error", e);
                }
            }
        }

        this.openModal('form-modal');
    },

    selectLayananInfo(item, name, price) {
        const wrapper = item.closest('.search-select-wrapper');
        const input = wrapper.querySelector('input');
        const list = wrapper.querySelector('.search-dropdown-list');
        const form = item.closest('form');
        const nominalInput = form.querySelector('[name="nominal"]');

        input.value = name;
        list.style.display = 'none';

        if (nominalInput) {
            nominalInput.value = price;
            nominalInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
    },

    updateLayananAdminNominal(item, price) {
        const modal = item.closest('.modal-content');
        const nominalInput = modal.querySelector('[name="nominal"]');
        if (nominalInput) {
            nominalInput.value = price;
        }
    },

    async showSearchDropdown(input) {
        const wrapper = input.parentElement;
        const list = wrapper.querySelector('.search-dropdown-list');
        const items = window._santriList || [];

        this.renderDropdownItems(list, items, input);
        list.style.display = 'block';

        // Close on click outside
        const closeHandler = (e) => {
            if (!wrapper.contains(e.target)) {
                list.style.display = 'none';
                document.removeEventListener('click', closeHandler);

                // Force validation: if value not in list and required, clear it
                if (!items.includes(input.value)) {
                    input.value = '';
                }
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 10);
    },

    filterSearchDropdown(input) {
        const wrapper = input.parentElement;
        const list = wrapper.querySelector('.search-dropdown-list');
        const q = input.value.toLowerCase();
        const items = (window._santriList || []).filter(name => name.toLowerCase().includes(q));

        this.renderDropdownItems(list, items, input);
        list.style.display = 'block';
    },

    renderDropdownItems(list, items, input) {
        if (items.length === 0) {
            list.innerHTML = `<div class="search-dropdown-item empty">Tidak ada hasil</div>`;
            return;
        }

        list.innerHTML = items.slice(0, 50).map(name => `
            <div class="search-dropdown-item" onclick="UI.selectSearchItem(this, '${name.replace(/'/g, "\\'")}')">
                <i class="fas fa-user-graduate" style="margin-right: 10px; opacity: 0.5;"></i> ${name}
            </div>
        `).join('');
    },

    selectSearchItem(item, name) {
        const wrapper = item.closest('.search-select-wrapper');
        const input = wrapper.querySelector('input');
        const list = wrapper.querySelector('.search-dropdown-list');

        input.value = name;
        list.style.display = 'none';

        // Trigger change for auto-pricing
        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
    },

    showStaticDropdown(input) {
        const list = input.nextElementSibling;
        list.style.display = 'block';
        // Auto-scroll to top
        list.scrollTop = 0;
    },

    filterStaticDropdown(input) {
        const query = input.value.toLowerCase();
        const list = input.nextElementSibling;
        const items = list.querySelectorAll('.search-dropdown-item');
        let hasMatch = false;

        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(query)) {
                item.style.display = 'flex';
                hasMatch = true;
            } else {
                item.style.display = 'none';
            }
        });

        list.style.display = hasMatch ? 'block' : 'none';
    },

    selectStaticItem(item, value) {
        const wrapper = item.closest('.search-select-wrapper');
        const input = wrapper.querySelector('input');
        const list = wrapper.querySelector('.search-dropdown-list');

        input.value = value;
        list.style.display = 'none';

        // Trigger change for auto-pricing
        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
    },

    prepareEdit: async function (type, id, rowDataEncoded) {
        console.log(`UI.prepareEdit: ${type} ${id}`);
        let rowData;

        if (rowDataEncoded && typeof rowDataEncoded === 'string' && rowDataEncoded.length > 10) {
            try {
                rowData = JSON.parse(decodeURIComponent(rowDataEncoded));
            } catch (e) { console.error("Parse rowData failed", e); }
        }

        if (!rowData) {
            // Fallback: fetch from module dataMap
            const R = window.Router || Router;
            const module = R.modules ? R.modules[type] : null;
            if (module && module.dataMap) {
                // Try multiple ways to find the ID (number vs string)
                rowData = module.dataMap[id] || module.dataMap[String(id)] || module.dataMap[Number(id)];
            }
        }

        if (!rowData) {
            alert(`Maaf, data ${type} dengan ID ${id} tidak ditemukan di memori browser. Silakan refresh halaman.`);
            console.error(`Data for ${type} ID ${id} not found in any dataMap`, { type, id });
            return;
        }

        await this.openForm(type);

        // Crucial: Set ID for saving
        const rowIdInput = document.getElementById('row_index');
        if (rowIdInput) rowIdInput.value = id;

        const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
        document.getElementById('modal-title').textContent = 'Edit Data ' + capitalizedType;

        const form = document.getElementById('dynamic-form');
        if (!form) return;

        Object.keys(rowData).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'file') {
                    // For files, we show a preview of the existing one
                    if (rowData[key]) {
                        const previewWrap = document.createElement('div');
                        previewWrap.className = 'edit-preview-wrap';
                        previewWrap.style.marginTop = '10px';
                        previewWrap.innerHTML = `
                            <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:5px;">File/Foto saat ini:</p>
                            <img src="${rowData[key]}" style="width:80px; height: auto; border-radius:8px; border:1px solid #ddd;">
                        `;
                        input.parentNode.appendChild(previewWrap);
                    }
                    return;
                }

                if (input.type === 'date' && rowData[key]) {
                    try {
                        const d = new Date(rowData[key]);
                        if (!isNaN(d)) input.value = d.toISOString().split('T')[0];
                    } catch (e) { input.value = rowData[key]; }
                } else {
                    input.value = rowData[key];
                }

                // Trigger change event for any dependent logic (like price auto-fill)
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    },

    viewDetail(type, rowDataEncoded) {
        console.log(`UI.viewDetail: ${type}`);
        let row;

        if (typeof rowDataEncoded === 'string' && rowDataEncoded.length > 10 && rowDataEncoded.includes('%')) {
            try {
                row = JSON.parse(decodeURIComponent(rowDataEncoded));
            } catch (e) { console.error("Parse Detail failed", e); }
        }

        if (!row) {
            // Assume second arg might be an ID
            const id = rowDataEncoded;
            const R = window.Router || Router;
            const module = R.modules ? R.modules[type] : null;
            if (module && module.dataMap) {
                row = module.dataMap[id] || module.dataMap[String(id)] || module.dataMap[Number(id)];
            }
        }

        if (!row) {
            alert("Data detail tidak ditemukan.");
            return;
        }
        const content = document.getElementById('detail-content');
        const titleEl = document.getElementById('detail-title');
        if (titleEl) titleEl.textContent = 'Detail Data ' + type.charAt(0).toUpperCase() + type.slice(1);

        const name = row.nama || row.nama_siswa || row.nama_santri || (row.kamar_penempatan ? 'Kamar ' + row.kamar_penempatan : '-');
        let imgKey = 'foto_' + type;
        let img = row[imgKey] || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

        let subtitle = `<span class="th-badge">${type.toUpperCase()}</span>`;

        const leftCol = `
            <div style="text-align:center;">
                <img src="${img}" style="width:100%; border-radius:12px; border:2px solid #ddd; margin-bottom:1rem;">
                <h3 style="font-size:1.1rem; margin-bottom:0.5rem;">${name}</h3>
                ${subtitle}
            </div>
        `;

        let detailHTML = `<div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; align-content:start;">`;
        Object.keys(row).forEach(key => {
            if (['id', 'created_at', 'foto', 'foto_santri', 'foto_ustadz', 'foto_pengurus'].includes(key)) return;
            detailHTML += `
                <div>
                    <label style="font-size:0.75rem; color:#666; display:block;">${key.replace(/_/g, ' ').toUpperCase()}</label>
                    <div style="font-weight:600; overflow-wrap: anywhere;">${row[key] || '-'}</div>
                </div>
            `;
        });

        detailHTML += `</div>`;
        content.innerHTML = leftCol + detailHTML;
        this.openModal('detail-modal');
    }
};

window.viewDetail = (type, data) => UI.viewDetail(type, data);

// Global exports for inline HTML onclicks
window.Router = Router;
window.UI = UI;
window.closeModal = (id) => UI.closeModal(id);
window.deleteItem = (type, id) => UI.deleteItem(type, id);
window.openForm = (type) => UI.openForm(type);
window.prepareEdit = (type, id, data) => UI.prepareEdit(type, id, data);
