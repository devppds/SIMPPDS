import { UI } from '../core/ui.js';
import { TableSort } from '../core/table_sort.js';
import { apiCall } from '../core/api.js';

export const KasUnitModule = {
    ...TableSort.createSortableModule('kas_unit'),
    dataMap: {},
    currentAction: null,
    currentUnit: null,

    async init(action) {
        this.currentAction = action;

        // Map action to unit name
        const unitMap = {
            'keamanan': 'Keamanan',
            'pendidikan': 'Pendidikan',
            'kesehatan': 'Kesehatan',
            'sekretariat': 'Sekretariat',
            'jamiyyah': "Jam'iyyah"
        };
        this.currentUnit = unitMap[action] || null;

        // Update UI if viewing specific unit
        if (this.currentUnit) {
            const titleEl = document.querySelector('#kas_unit-view h2');
            if (titleEl) titleEl.textContent = `Kas ${this.currentUnit}`;

            // Update button to prefill unit
            const btnEl = document.querySelector('#kas_unit-view .btn-primary');
            if (btnEl) {
                btnEl.onclick = () => openForm('kas_unit', { unit: this.currentUnit });
            }
        }

        const searchInput = document.getElementById('search-kas_unit');
        if (searchInput) searchInput.oninput = () => this.renderTable(searchInput.value);

        await this.loadAndRender();
    },

    async loadAndRender() {
        try {
            const rows = await apiCall('getData', 'GET', { type: 'kas_unit' });

            // Filter by current unit if specified
            if (this.currentUnit) {
                this.rows = (rows || []).filter(r => r.unit === this.currentUnit);
            } else {
                this.rows = rows || [];
            }

            this.renderTable();
            this.renderStats();
        } catch (err) {
            console.error('Failed to load kas_unit:', err);
        }
    },

    renderStats() {
        const statsGrid = document.getElementById('kas_unit-stats');
        if (!statsGrid) return;

        // If viewing specific unit, show only that unit's stats
        if (this.currentUnit) {
            let masuk = 0, keluar = 0;
            this.rows.forEach(r => {
                const nominal = parseFloat(r.nominal) || 0;
                if (r.tipe === 'Masuk') masuk += nominal;
                else keluar += nominal;
            });
            const saldo = masuk - keluar;

            statsGrid.innerHTML = `
                <div class="stat-card" style="border-left: 4px solid var(--gold);">
                    <div class="stat-icon" style="background: rgba(212, 175, 55, 0.1); color: var(--gold);">
                        <i class="fas fa-wallet"></i>
                    </div>
                    <div class="stat-info">
                        <h3>Saldo ${this.currentUnit}</h3>
                        <div class="value" style="font-size: 1.5rem;">${UI.formatRupiah(saldo)}</div>
                        <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px;">
                            <span style="color: green;">+${UI.formatRupiah(masuk)}</span> / 
                            <span style="color: red;">-${UI.formatRupiah(keluar)}</span>
                        </p>
                    </div>
                </div>
            `;
            return;
        }

        // Show all units stats (for Bendahara view - not used anymore)
        const unitStats = {};
        const units = ['Keamanan', 'Pendidikan', 'Kesehatan', 'Sekretariat', "Jam'iyyah"];

        units.forEach(u => {
            unitStats[u] = { masuk: 0, keluar: 0 };
        });

        this.rows.forEach(r => {
            if (unitStats[r.unit]) {
                const nominal = parseFloat(r.nominal) || 0;
                if (r.tipe === 'Masuk') unitStats[r.unit].masuk += nominal;
                else unitStats[r.unit].keluar += nominal;
            }
        });

        statsGrid.innerHTML = units.map(u => {
            const saldo = unitStats[u].masuk - unitStats[u].keluar;
            const icon = u === 'Keamanan' ? 'fa-shield-alt' : u === 'Pendidikan' ? 'fa-book' : u === 'Kesehatan' ? 'fa-heartbeat' : 'fa-file-invoice-dollar';

            return `
                <div class="stat-card" style="border-left: 4px solid var(--gold);">
                    <div class="stat-icon" style="background: rgba(212, 175, 55, 0.1); color: var(--gold);">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="stat-info">
                        <h3>Saldo ${u}</h3>
                        <div class="value" style="font-size: 1.2rem;">${UI.formatRupiah(saldo)}</div>
                        <p style="font-size: 0.7rem; color: var(--text-muted); margin-top: 5px;">
                            <span style="color: green;">+${UI.formatRupiah(unitStats[u].masuk)}</span> / 
                            <span style="color: red;">-${UI.formatRupiah(unitStats[u].keluar)}</span>
                        </p>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderTable(search = '') {
        const tbody = document.querySelector('#kas_unit-table tbody');
        const unitFilter = document.getElementById('filter-unit-kas');
        if (!tbody) return;

        let filtered = this.rows;

        if (unitFilter && unitFilter.value) {
            filtered = filtered.filter(r => r.unit === unitFilter.value);
        }

        if (search) {
            filtered = filtered.filter(r =>
                (r.kategori || '').toLowerCase().includes(search.toLowerCase()) ||
                (r.keterangan || '').toLowerCase().includes(search.toLowerCase()) ||
                (r.nama_santri || '').toLowerCase().includes(search.toLowerCase())
            );
        }

        tbody.innerHTML = filtered.map(r => {
            this.dataMap[r.id] = r;
            const canEdit = window.Auth && window.Auth.canEdit('kas_unit');
            const isMasuk = r.tipe === 'Masuk';

            return `
                <tr>
                    <td>${UI.formatDate(r.tanggal)}</td>
                    <td><strong>${r.unit}</strong></td>
                    <td>
                        <div style="font-weight:600;">${r.kategori}</div>
                        <div class="text-xs text-muted">${r.nama_santri ? 'Santri: ' + r.nama_santri : r.keterangan || ''}</div>
                    </td>
                    <td style="color: ${isMasuk ? '#16a34a' : '#dc2626'}; font-weight:700;">
                        ${isMasuk ? '+' : '-'}${UI.formatRupiah(r.nominal)}
                    </td>
                    <td>
                        <span class="badge ${r.status_setor === 'Sudah Diterima Bendahara' ? 'badge-success' : r.status_setor === 'Proses Setor' ? 'badge-warning' : 'badge-danger'}">
                            ${r.status_setor}
                        </span>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-icon" onclick="viewDetail('kas_unit', ${r.id})" title="Detail"><i class="fas fa-eye"></i></button>
                            ${canEdit ? `
                                <button class="btn-icon btn-edit" onclick="prepareEdit('kas_unit', ${r.id})" title="Edit"><i class="fas fa-edit"></i></button>
                                <button class="btn-icon btn-delete" onclick="deleteItem('kas_unit', ${r.id})" title="Hapus"><i class="fas fa-trash"></i></button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="6" style="text-align:center;padding:20px;">Belum ada riwayat kas untuk filter ini.</td></tr>';
    },

    async setorkan(unit) {
        if (!unit) {
            alert('Pilih unit terlebih dahulu.');
            return;
        }

        const unitRows = this.rows.filter(r => r.unit === unit && r.status_setor === 'Belum Setor');
        if (unitRows.length === 0) {
            alert(`Tidak ada dana "Belum Setor" untuk unit ${unit}.`);
            return;
        }

        const balance = unitRows.reduce((acc, r) => {
            const nominal = parseFloat(r.nominal) || 0;
            return acc + (r.tipe === 'Masuk' ? nominal : -nominal);
        }, 0);

        if (balance <= 0) {
            alert('Saldo unit tidak mencukupi untuk disetorkan.');
            return;
        }

        if (!confirm(`Konfirmasi: Setorkan saldo ${unit} sebesar ${UI.formatRupiah(balance)} ke Bendahara Pondok? Saldo unit akan di-reset (ditandai sudah setor).`)) return;

        try {
            UI.showLoading();

            // 1. Create entry in Arus Kas Pondok
            await apiCall('saveData', 'POST', {
                type: 'arus_kas',
                data: {
                    tanggal: new Date().toISOString().split('T')[0],
                    tipe: 'Masuk',
                    kategori: 'Setoran Unit',
                    nominal: balance,
                    keterangan: `Setoran Operasional Unit ${unit}`,
                    pj_penerima: 'Bendahara Pusat'
                }
            });

            // 2. Mark all unitRows as 'Sudah Diterima Bendahara'
            for (const r of unitRows) {
                await apiCall('saveData', 'POST', {
                    type: 'kas_unit',
                    data: { ...r, status_setor: 'Sudah Diterima Bendahara' }
                });
            }

            alert(`Berhasil menyetorkan ${UI.formatRupiah(balance)} ke Bendahara Pusat.`);
            await this.loadAndRender();
        } catch (err) {
            alert('Gagal: ' + err.message);
        } finally {
            UI.hideLoading();
        }
    },

    async setupFormLogic() {
        console.log('KasUnit: setupFormLogic called, currentUnit =', this.currentUnit);
        const container = document.getElementById('form-fields');
        if (!container) {
            console.error('KasUnit: form-fields not found!');
            return;
        }

        const unitSelect = container.querySelector('[name="unit"]');
        const tipeSelect = container.querySelector('[name="tipe"]');
        const kategoriInput = container.querySelector('[name="kategori"]');
        const kategoriDropdown = kategoriInput ? kategoriInput.nextElementSibling : null;
        const nominalInput = container.querySelector('[name="nominal"]');

        if (!unitSelect || !kategoriInput || !kategoriDropdown) return;

        // Auto-fill unit if currentUnit is set and HIDE the field
        if (this.currentUnit) {
            console.log('KasUnit: Hiding unit field for', this.currentUnit);
            unitSelect.value = this.currentUnit;
            const unitGroup = container.querySelector('.form-group[data-field="unit"]');
            if (unitGroup) {
                unitGroup.style.display = 'none';
                console.log('KasUnit: Unit field hidden successfully');
            } else {
                console.error('KasUnit: Unit group not found!');
            }
        }

        // Local cache and categories
        let layananInfoCache = null;
        const expenseCategories = [
            'Pembelian ATK', 'Biaya Transport', 'Konsumsi Rapat',
            'Uang Saku Petugas', 'Sewa Alat', 'Beli Sabun/Kebersihan',
            'Perbaikan Fasilitas', 'Honor Ustadz', 'Lain-lain'
        ];

        // Load kategori options based on Unit and Tipe
        const updateKategoriOptions = async () => {
            const unit = unitSelect.value;
            const tipe = tipeSelect.value;

            if (!unit) {
                kategoriDropdown.innerHTML = '<div class="search-dropdown-item empty">Pilih Unit terlebih dahulu</div>';
                return;
            }

            try {
                if (!layananInfoCache) {
                    layananInfoCache = await apiCall('getData', 'GET', { type: 'layanan_info' });
                }

                let dropdownHtml = '';

                if (tipe === 'Masuk') {
                    // 1. Common Income Categories (Not in database)
                    const commonIncome = ['Setoran Unit', 'Saldo Awal', 'Pemberian / Infaq'];
                    commonIncome.forEach(opt => {
                        dropdownHtml += `
                            <div class="search-dropdown-item" onclick="UI.selectStaticItem(this, '${opt}')" style="display:flex; justify-content:space-between; align-items:center;">
                                <span>${opt}</span>
                                <span style="font-size:0.75rem; color:var(--text-muted);">Umum</span>
                            </div>`;
                    });

                    dropdownHtml += '<div style="height:1px; background:#eee; margin:5px 0;"></div>';

                    // 2. Database Services
                    const incomeOptions = (layananInfoCache || [])
                        .filter(l => l.unit === unit && l.aktif)
                        .map(l => ({ name: l.nama_layanan, price: l.harga }));

                    if (incomeOptions.length > 0) {
                        incomeOptions.forEach(opt => {
                            dropdownHtml += `
                                <div class="search-dropdown-item" onclick="UI.selectStaticItem(this, '${opt.name}')" style="display:flex; justify-content:space-between; align-items:center;">
                                    <span>${opt.name}</span>
                                    <span style="font-size:0.75rem; color:var(--primary); font-weight:600;">${opt.price > 0 ? UI.formatRupiah(opt.price) : 'Manual'}</span>
                                </div>`;
                        });
                        dropdownHtml += '<div style="height:1px; background:#eee; margin:5px 0;"></div>';
                    }

                    // 3. Fallback
                    dropdownHtml += `
                        <div class="search-dropdown-item" onclick="UI.selectStaticItem(this, 'Lain-lain')" style="display:flex; justify-content:space-between; align-items:center;">
                            <span>Lain-lain / Masuk Manual</span>
                            <span style="font-size:0.75rem; color:var(--text-muted);">Manual</span>
                        </div>`;
                } else {
                    // Expense categories
                    expenseCategories.forEach(cat => {
                        dropdownHtml += `
                            <div class="search-dropdown-item" onclick="UI.selectStaticItem(this, '${cat}')" style="display:flex; justify-content:space-between; align-items:center;">
                                <span>${cat}</span>
                                <span style="font-size:0.7rem; color: #dc2626;">Pengeluaran</span>
                            </div>`;
                    });
                }

                kategoriDropdown.innerHTML = dropdownHtml || '<div class="search-dropdown-item empty">Tidak ada kategori tersedia</div>';
            } catch (err) {
                console.error('Failed to load kategori:', err);
            }
        };

        // Auto-fill nominal when kategori is selected
        const updateNominal = () => {
            const kategori = (kategoriInput.value || '').trim();
            const unit = unitSelect.value;
            const tipe = tipeSelect.value;

            if (!kategori) return;

            // Only auto-fill for Masuk if it's in the database
            if (tipe === 'Masuk' && unit) {
                const tarif = (layananInfoCache || []).find(l =>
                    l.unit === unit &&
                    (l.nama_layanan || '').toLowerCase() === kategori.toLowerCase() &&
                    l.aktif
                );

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
            } else {
                // For Keluar or unknown Masuk, allow manual
                nominalInput.readOnly = false;
                nominalInput.style.background = '';
                nominalInput.style.fontWeight = 'normal';
                nominalInput.style.color = '';
                if (!nominalInput.value) nominalInput.placeholder = 'Masukkan nominal...';
            }
        };

        // Event listeners
        unitSelect.addEventListener('change', async () => {
            await updateKategoriOptions();
            updateNominal();
        });

        tipeSelect.addEventListener('change', async () => {
            // If tipe changed, we should refresh categories and maybe clear the current one
            await updateKategoriOptions();
            updateNominal();
        });

        kategoriInput.addEventListener('change', updateNominal);
        kategoriInput.addEventListener('input', updateNominal);

        // Initial execution
        await updateKategoriOptions();
        updateNominal();
    }
};
