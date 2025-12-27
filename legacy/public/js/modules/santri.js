import { UI } from '../core/ui.js';
import { apiCall } from '../core/api.js';

export const SantriModule = {
    currentStatus: 'Aktif',

    async init(action) {
        if (action === 'santri_aktif') this.currentStatus = 'Aktif';
        if (action === 'santri_boyong') this.currentStatus = 'Boyong';
        if (action === 'santri_pindah') this.currentStatus = 'Pindah';
        if (action === 'santri_alumni') this.currentStatus = 'Lulus';

        const titleEl = document.getElementById('view-title');
        if (titleEl) titleEl.textContent = 'Data Santri ' + (this.currentStatus === 'Lulus' ? 'Alumni' : this.currentStatus);

        // UI Logic: Hide Add/Import buttons for Boyong/Pindah OR Non-Admins
        const canEdit = window.Auth && window.Auth.canEdit('santri');
        const isAktif = this.currentStatus === 'Aktif';
        const actionContainer = document.querySelector('#santri-view .card-actions');
        if (actionContainer) {
            const btnTambah = actionContainer.querySelector('button[onclick*="openForm"]');
            const btnImport = actionContainer.querySelector('button[onclick*="triggerImport"]');
            const btnTemplate = actionContainer.querySelector('button[onclick*="downloadTemplate"]');

            if (btnTambah) btnTambah.style.display = (isAktif && canEdit) ? 'inline-flex' : 'none';
            if (btnImport) btnImport.style.display = (isAktif && canEdit) ? 'inline-flex' : 'none';
            if (btnTemplate) btnTemplate.style.display = (isAktif && canEdit) ? 'inline-flex' : 'none';
        }

        // Bind Search
        const searchInput = document.getElementById('search-santri');
        if (searchInput) searchInput.oninput = () => this.loadData(searchInput.value);

        this.setupEvents();
        await this.loadData();
    },

    // Sorting State
    sortColumn: null,
    sortDirection: 'asc', // 'asc' or 'desc'

    async loadData(searchQuery = '') {
        let rows = await UI.loadTableData('santri', (data) => {
            let filtered = data;
            if (this.currentStatus === 'Aktif') {
                filtered = data.filter(r => !r.status_santri || r.status_santri === 'Aktif');
            } else {
                filtered = data.filter(r => r.status_santri === this.currentStatus);
            }

            if (searchQuery) {
                filtered = filtered.filter(r =>
                    (r.nama_siswa || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (r.stambuk_pondok || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (r.nik || '').toLowerCase().includes(searchQuery.toLowerCase())
                );
            }
            return filtered;
        });

        // Apply Sorting
        if (this.sortColumn) {
            rows.sort((a, b) => {
                let valA = (a[this.sortColumn] || '').toString().toLowerCase();
                let valB = (b[this.sortColumn] || '').toString().toLowerCase();
                if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
                if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        this.currentData = rows; // Store for export
        this.render(rows);
    },

    toggleSort(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        // Re-render headers to update icons
        this.updateHeaders();
        // Reload data to apply sort (using current search if any)
        const searchInput = document.getElementById('search-santri');
        this.loadData(searchInput ? searchInput.value : '');
    },

    dataMap: {}, // Store rows by ID for quick access without passing huge strings in HTML

    render(rows) {
        const tbody = document.querySelector('#santri-table tbody');
        if (!tbody) return;

        this.updateHeaders();
        this.dataMap = {}; // Reset map

        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:30px;">Tidak ada data santri.</td></tr>';
            return;
        }

        tbody.innerHTML = rows.map(row => {
            // Save to map for later access by ID
            this.dataMap[row.id] = row;

            const img = row.foto_santri || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.nama_siswa)}&background=random`;
            let cols = '';

            if (this.currentStatus === 'Boyong') {
                cols = `<td><img src="${img}" style="width:30px;height:30px;border-radius:50%"></td>
                    <td><strong>${row.nama_siswa}</strong></td>
                    <td>${row.stambuk_pondok || '-'}</td>
                    <td>${UI.formatDate(row.tanggal_boyong)}</td>
                    <td><span style="background:#fee2e2;color:#991b1b;padding:2px 6px;border-radius:4px;">Boyong</span></td>`;
            } else if (this.currentStatus === 'Pindah') {
                cols = `<td><img src="${img}" style="width:30px;height:30px;border-radius:50%"></td>
                    <td><strong>${row.nama_siswa}</strong></td>
                    <td>${row.stambuk_pondok || '-'}</td>
                    <td>${row.pindah_ke || '-'}</td>
                    <td>${row.tahun_pindah || '-'}</td>`;
            } else if (this.currentStatus === 'Lulus') {
                cols = `<td><img src="${img}" style="width:30px;height:30px;border-radius:50%"></td>
                    <td><strong>${row.nama_siswa}</strong></td>
                    <td>${row.stambuk_pondok || '-'}</td>
                    <td>${row.nik || '-'}</td>
                    <td><span class="th-badge" style="background:#dcfce7; color:#166534;">Lulus ${row.tahun_lulus || ''}</span></td>`;
            } else {
                cols = `<td><img src="${img}" style="width:30px;height:30px;border-radius:50%"></td>
                    <td><strong>${row.nama_siswa}</strong></td>
                    <td>${row.stambuk_mondok || row.stambuk_pondok || '-'}</td>
                    <td>${row.stambuk_madrasah || '-'}</td>
                    <td>${row.nik || '-'}</td>
                    <td>${row.kelas || '-'}</td>
                    <td>${row.kamar || '-'}</td>
                    <td><span class="th-badge" style="background:#f1f5f9; color:#475569; font-size:0.75rem;">${row.status_mb || 'Biasa Lama'}</span></td>`;
            }

            let actionBtns = `
                <button class="btn btn-primary" style="padding: 8px 12px; background: #0ea5e9; border-radius: 8px;" onclick="handleGlobalAction('santri', 'detail', '${row.id}')" title="Detail">
                    <i class="fas fa-eye" style="color: white; font-size: 0.9rem;"></i>
                </button>
            `;

            // Only Admin can Edit/Mutate
            if (window.Auth && window.Auth.canEdit()) {
                actionBtns += `
                    <button class="btn btn-primary" style="padding: 8px 12px; background: #eab308; border-radius: 8px;" onclick="handleGlobalAction('santri', 'edit', '${row.id}')" title="Edit">
                        <i class="fas fa-edit" style="color: white; font-size: 0.9rem;"></i>
                    </button>
                `;

                // Mutasi / Aktifkan Kembali Button
                const isAktif = this.currentStatus === 'Aktif';
                const btnColor = isAktif ? '#f97316' : '#10b981';
                const btnTitle = isAktif ? 'Mutasi Status' : 'Aktifkan Kembali';
                const btnIcon = isAktif ? 'fa-sync-alt' : 'fa-user-check';

                const onclickParam = isAktif
                    ? `handleSantriAction('${row.id}', '${this.currentStatus}')`
                    : `SantriModule.reactivate('${row.id}', '${row.nama_siswa.replace(/'/g, "\\'")}')`;

                actionBtns += `
                    <button class="btn btn-primary" style="padding: 8px 12px; background: ${btnColor}; border-radius: 8px;"
                        onclick="${onclickParam}" title="${btnTitle}">
                        <i class="fas ${btnIcon}" style="color: white; font-size: 0.9rem;"></i>
                    </button>
                `;

                if (this.currentStatus === 'Lulus') {
                    actionBtns += `
                        <button class="btn btn-primary" style="padding: 8px 12px; background: #6366f1; border-radius: 8px;"
                            onclick="SantriModule.promoteToStaff('${row.id}')" title="Angkat Jadi Staf">
                            <i class="fas fa-user-tie" style="color: white; font-size: 0.9rem;"></i>
                        </button>
                    `;
                }
            }

            return `<tr>${cols}<td style="display:flex; gap:5px;">${actionBtns}</td></tr>`;
        }).join('');
    },

    updateHeaders() {
        const thead = document.querySelector('#santri-table thead tr');
        if (!thead) return;

        const getSortIcon = (col) => {
            if (this.sortColumn !== col) return '<i class="fas fa-sort sort-btn"></i>';
            return this.sortDirection === 'asc' ? '<i class="fas fa-sort-up sort-btn active"></i>' : '<i class="fas fa-sort-down sort-btn active"></i>';
        };

        const th = (label, col, width) => {
            if (!col) return `<th${width ? ` style="width:${width}"` : ''}>${label}</th>`;
            return `<th${width ? ` style="width:${width}"` : ''} onclick="SantriModule.toggleSort('${col}')" style="cursor:pointer;" class="sortable-header">
                ${label} ${getSortIcon(col)}
            </th>`;
        };

        if (this.currentStatus === 'Boyong') {
            thead.innerHTML = `${th('Foto', null, '50px')}${th('Nama Santri', 'nama_siswa')}${th('Stambuk', 'stambuk_pondok')}${th('Tanggal Boyong', 'tanggal_boyong')}${th('Status', null)}${th('Aksi', null, '120px')}`;
        } else if (this.currentStatus === 'Pindah') {
            thead.innerHTML = `${th('Foto', null, '50px')}${th('Nama Santri', 'nama_siswa')}${th('Stambuk', 'stambuk_pondok')}${th('Pindah Ke', 'pindah_ke')}${th('Tahun Pindah', 'tahun_pindah')}${th('Aksi', null, '120px')}`;
        } else if (this.currentStatus === 'Lulus') {
            thead.innerHTML = `${th('Foto', null, '50px')}${th('Nama Santri', 'nama_siswa')}${th('Stambuk', 'stambuk_pondok')}${th('NIK', 'nik')}${th('Status', null)}${th('Aksi', null, '180px')}`;
        } else {
            // Nama Santri Stambuk Madrasah NIK Kelas Kamar
            thead.innerHTML = `${th('Foto', null, '50px')}
                ${th('Nama Siswa', 'nama_siswa')}
                ${th('STB. Pondok', 'stambuk_pondok')}
                ${th('STB. Madrasah', 'stambuk_madrasah')}
                ${th('NIK', 'nik')}
                ${th('Kelas', 'kelas')}
                ${th('Kamar', 'kamar')}
                ${th('Kelompok', 'status_mb')}
                ${th('Aksi', null, '130px')}`;
        }
    },

    // --- EXPORT / IMPORT / TEMPLATE ---
    getSantriFields() {
        return [
            "foto_santri", "stambuk_pondok", "stambuk_madrasah", "tahun_masuk", "kamar", "status_mb",
            "madrasah", "kelas", "nik", "nama_siswa", "nisn",
            "tempat_tanggal_lahir", "jenis_kelamin", "agama", "hobi", "cita_cita",
            "kewarganegaraan", "no_kk", "nik_ayah", "nama_ayah", "pekerjaan_ayah",
            "pendidikan_ayah", "no_telp_ayah", "penghasilan_ayah", "nik_ibu", "nama_ibu",
            "pekerjaan_ibu", "pendidikan_ibu", "no_telp_ibu", "dusun_jalan", "rt_rw",
            "desa_kelurahan", "kecamatan", "kota_kabupaten", "provinsi", "kode_pos"
        ];
    },

    downloadTemplate() {
        const fields = this.getSantriFields();
        // Create an empty row with headers
        const templateData = {};
        fields.forEach(f => templateData[f] = "");

        // Add one example row
        templateData.nama_siswa = "Contoh Nama Santri";
        templateData.stambuk_pondok = "2024001";
        templateData.nik = "1234567890123456";

        const ws = XLSX.utils.json_to_sheet([templateData]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template_Santri");
        XLSX.writeFile(wb, "Template_Import_Santri_Lengkap.xlsx");
    },

    exportData() {
        if (!this.currentData || this.currentData.length === 0) {
            alert("Tidak ada data untuk diekspor");
            return;
        }

        const fields = this.getSantriFields();
        const exportRows = this.currentData.map(row => {
            const cleanRow = {};
            fields.forEach(f => {
                cleanRow[f.replace(/_/g, ' ').toUpperCase()] = row[f] || "";
            });
            return cleanRow;
        });

        const ws = XLSX.utils.json_to_sheet(exportRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data Santri");
        XLSX.writeFile(wb, `Export_Santri_${this.currentStatus}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    },

    triggerImport() {
        document.getElementById('import-file-santri').click();
    },

    async handleFileImport(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length > 0) {
                if (confirm(`Akan mengimpor ${jsonData.length} data. Lanjutkan?`)) {
                    // Send to backend batch (mock loop for now or single bulk API if available)
                    // Assuming existing API handles one by one or we need a bulk endpoint.
                    // For safety, let's just alert for now or try one by one.
                    // Real implementation requires robust backend.
                    // alert("Fitur Import Backend belum fully implemented. Data terbaca: " + jsonData.length);
                    // Try naive loop
                    let successCount = 0;
                    for (const row of jsonData) {
                        try {
                            const payload = {
                                type: 'santri',
                                data: {
                                    nama_siswa: row['nama_siswa'] || row['Nama Santri'],
                                    stambuk_pondok: row['stambuk_pondok'] || row['Stambuk Pondok'],
                                    nik: row['nik'] || row['NIK'],
                                    // ... map other fields
                                }
                            };
                            await apiCall('saveData', 'POST', payload);
                            successCount++;
                        } catch (e) { console.error(e); }
                    }
                    alert(`Berhasil mengimpor ${successCount} data.`);
                    this.loadData();
                }
            }
            input.value = ''; // Reset
        };
        reader.readAsArrayBuffer(file);
    },

    async reactivate(id, nama) {
        const today = new Date();
        const dateStr = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        if (confirm(`Konfirmasi: Aktifkan kembali santri "${nama}"?\nTanggal Aktif: ${dateStr}`)) {
            try {
                const payload = {
                    id: id,
                    status_santri: 'Aktif',
                    tanggal_boyong: '',
                    pindah_ke: '',
                    tahun_pindah: ''
                };
                await apiCall('saveData', 'POST', { type: 'santri', data: payload });
                alert(`Berhasil! ${nama} telah dinyatakan Aktif kembali per tanggal ${dateStr}.`);
                this.loadData();
            } catch (err) {
                alert('Gagal mengaktifkan kembali: ' + err.message);
            }
        }
    },

    handleAction(id, type, rowDataEncoded) {
        const row = JSON.parse(decodeURIComponent(rowDataEncoded));
        const modal = document.getElementById('mutasi-modal');
        if (!modal) return;

        document.getElementById('mutasi-id').value = id;
        document.getElementById('mutasi-nama').value = row.nama_siswa;
        document.getElementById('mutasi-status').value = type;

        this.toggleMutasiFields(type);
        UI.openModal('mutasi-modal');
    },

    toggleMutasiFields(val) {
        const status = val || document.getElementById('mutasi-status').value;
        const fPindah = document.getElementById('field-pindah');
        const fBoyong = document.getElementById('field-boyong');
        const fLulus = document.getElementById('field-lulus');

        if (fPindah) fPindah.style.display = (status === 'Pindah') ? 'block' : 'none';
        if (fBoyong) fBoyong.style.display = (status === 'Boyong') ? 'block' : 'none';

        if (fLulus) {
            fLulus.style.display = (status === 'Lulus') ? 'block' : 'none';
            // Auto-set Graduation Year
            if (status === 'Lulus') {
                const yearInput = fLulus.querySelector('input[name="tahun_lulus"]');
                if (yearInput && !yearInput.value) {
                    const now = new Date();
                    const currentYear = now.getFullYear();
                    // Jika bulan Juli (6) ke atas, lulusnya tahun depan. Jika di bawah Juli, lulus tahun ini.
                    const gradYear = (now.getMonth() >= 6) ? currentYear + 1 : currentYear;
                    yearInput.value = gradYear;
                }
            }
        }
    },

    currentPromotee: null, // Added to store the student data for promotion

    promoteToStaff(rowDataEncoded) {
        const row = JSON.parse(decodeURIComponent(rowDataEncoded));
        this.currentPromotee = row;

        const modal = document.getElementById('promote-modal');
        const nameEl = document.getElementById('promote-name');
        const imgEl = document.getElementById('promote-img');

        if (nameEl) nameEl.textContent = row.nama_siswa;
        if (imgEl) imgEl.src = row.foto_santri || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.nama_siswa)}&background=random`;

        if (modal) UI.openModal('promote-modal');
    },

    async confirmPromotion(choice) {
        const row = this.currentPromotee;
        if (!row) return;

        const type = (choice === '1') ? 'ustadz' : (choice === '2') ? 'pengurus' : null;
        if (!type) return;

        try {
            const payload = {
                type: type,
                data: {
                    nama: row.nama_siswa,
                    nik_nip: row.nik,
                    no_hp: row.no_hp_ayah || row.no_hp_ibu || '',
                    foto_ustadz: row.foto_santri,
                    foto_pengurus: row.foto_santri,
                    status: 'Aktif',
                    kelas: row.kelas,
                    divisi: (type === 'pengurus') ? 'Belum Ditentukan' : '',
                    jabatan: (type === 'pengurus') ? 'Anggota' : ''
                }
            };
            await apiCall('saveData', 'POST', payload);
            alert(`Berhasil! ${row.nama_siswa} sekarang terdaftar sebagai ${type.toUpperCase()}.`);
            UI.closeModal('promote-modal');
            this.loadData(); // Reload data after promotion
        } catch (err) {
            alert('Gagal mempromosikan: ' + err.message);
        }
    },

    setupEvents() {
        const mutasiForm = document.getElementById('mutasi-form');
        if (mutasiForm && !mutasiForm.dataset.listenerSet) {
            mutasiForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(mutasiForm);
                const data = Object.fromEntries(formData.entries());

                try {
                    await apiCall('saveData', 'POST', { type: 'santri', data });

                    // Trigger afterSave manually for mutations
                    await this.afterSave({ ...data, nama_siswa: document.getElementById('mutasi-nama').value });

                    UI.closeModal('mutasi-modal');
                    alert('Status Santri berhasil diperbarui');
                    this.loadData();
                } catch (err) {
                    alert('Gagal: ' + err.message);
                }
            });
            mutasiForm.dataset.listenerSet = 'true';
        }
    },

    async afterSave(formData) {
        // If status is Boyong or Pindah, record to Sekretaris Cash & Layanan Admin
        if (formData.status_santri === 'Boyong' || formData.status_santri === 'Pindah') {
            console.log(`AutoLayanan: Recording mutation fee for ${formData.nama_siswa}`);

            // Get full santri data for stambuk
            const santriData = this.dataMap[formData.id] || {};
            const stambuk = santriData.stambuk_mondok || santriData.stambuk_pondok || '';

            const serviceName = `Surat ${formData.status_santri}`;
            let price = 0;

            try {
                // Fetch latest prices from database
                const services = await apiCall('getData', 'GET', { type: 'layanan_info' });
                const found = (services || []).find(s => s.nama_layanan === serviceName && s.unit === 'Sekretariat');
                if (found) {
                    price = found.harga;
                } else {
                    // Fallback to approximate values if not found (though they should exist)
                    price = 15000;
                }
            } catch (e) {
                console.error("AutoLayanan: Price fetch failed", e);
                price = 15000;
            }

            // 1. Record to Layanan Admin (Sekretariat Unit)
            try {
                await apiCall('saveData', 'POST', {
                    type: 'layanan_admin',
                    data: {
                        tanggal: new Date().toISOString().split('T')[0],
                        unit: 'Sekretariat',
                        nama_santri: formData.nama_siswa,
                        stambuk: stambuk,
                        jenis_layanan: serviceName,
                        nominal: price,
                        keterangan: `Administrasi Otomatis (Status: ${formData.status_santri})`,
                        pj: 'Sekretariat (Otomatis)',
                        jumlah: 1
                    }
                });
            } catch (e) { console.error("AutoLayanan: Record to layanan_admin failed", e); }

            // 2. Record to Kas Unit (for financial tracking)
            try {
                await apiCall('saveData', 'POST', {
                    type: 'kas_unit',
                    data: {
                        tanggal: new Date().toISOString().split('T')[0],
                        unit: 'Sekretariat',
                        tipe: 'Masuk',
                        kategori: serviceName,
                        nominal: price,
                        nama_santri: formData.nama_siswa,
                        stambuk: stambuk,
                        keterangan: `Administrasi Mutasi Status: ${formData.status_santri}`,
                        petugas: 'Sekretariat (Otomatis)',
                        status_setor: 'Belum Setor'
                    }
                });
            } catch (e) { console.error("AutoLayanan: Record to kas_unit failed", e); }
        }
    }
};

window.handleSantriAction = (id, type, data) => SantriModule.handleAction(id, type, data);
window.toggleMutasiFields = (val) => SantriModule.toggleMutasiFields(val);
window.SantriModule = SantriModule; // Expose to window for onclicks
