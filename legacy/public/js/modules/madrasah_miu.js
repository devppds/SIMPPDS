import { UI } from '../core/ui.js';
import { TableSort } from '../core/table_sort.js';

export const MadrasahMiuModule = {
    ...TableSort.createSortableModule('miu'),
    dataMap: {},
    currentData: [],
    currentAction: 'siswa',

    async init(action = 'siswa') {
        this.currentAction = action;

        // Update Title & Desc based on action
        const titleEl = document.getElementById('miu-title');
        const descEl = document.getElementById('miu-desc');

        if (action === 'siswa' || action === 'siswa_miu') {
            titleEl.textContent = "Daftar Siswa MIU";
            descEl.textContent = "Data kesiswaan khusus unit Madrasah Ihya' Ulumuddin.";
            this.currentAction = 'siswa';
        } else if (action === 'pengurus') {
            titleEl.textContent = "Pengurus MIU";
            descEl.textContent = "Struktur kepengurusan Madrasah Ihya' Ulumuddin.";
        } else if (action === 'pengajar') {
            titleEl.textContent = "Asatidz / Pengajar MIU";
            descEl.textContent = "Daftar tenaga pendidik di Madrasah Ihya' Ulumuddin.";
        } else if (action === 'absensi') {
            titleEl.textContent = "Rekap Absensi MIU";
            descEl.textContent = "Monitoring kehadiran berkala siswa Madrasah MIU.";
        } else if (action === 'nilai') {
            titleEl.textContent = "Rekap Nilai MIU";
            descEl.textContent = "Hasil evaluasi dan nilai akademik siswa Madrasah MIU.";
        }

        // Bind Search & Filter
        const searchInput = document.getElementById('search-miu');
        if (searchInput) {
            searchInput.oninput = () => this.loadData();
        }

        const kelasFilter = document.getElementById('filter-miu-kelas');
        if (kelasFilter) {
            // Show kelas filter only for 'siswa'
            if (kelasFilter.parentElement && kelasFilter.parentElement.parentElement) {
                // Ensure the container of the select exists and is correct based on index.html
                const container = document.getElementById('miu-filter-container');
                if (container) container.style.display = (this.currentAction === 'siswa') ? 'block' : 'none';
            }
            kelasFilter.onchange = () => this.loadData();
        }

        await this.loadData();
    },

    async loadData() {
        const searchQuery = document.getElementById('search-miu')?.value || '';
        const kelasFilter = document.getElementById('filter-miu-kelas')?.value || '';
        const action = this.currentAction;

        let dataType = 'santri';
        if (action === 'pengurus') dataType = 'pengurus';
        if (action === 'pengajar') dataType = 'ustadz';
        if (action === 'absensi' || action === 'nilai') dataType = 'santri';

        const rows = await UI.loadTableData(dataType, (data) => {
            let filtered = [];

            if (action === 'siswa') {
                filtered = data.filter(r => {
                    const isMiu = (r.madrasah || '').toString().toUpperCase() === 'MIU';
                    const isActive = r.status === 'Aktif' || !r.status || r.status === 'Lama';
                    return isMiu && isActive;
                });
                if (kelasFilter) filtered = filtered.filter(f => f.kelas === kelasFilter);
            } else if (action === 'pengurus') {
                filtered = data.filter(r => {
                    const searchStr = `${r.divisi || ''} ${r.jabatan || ''} ${r.tugas_pengurus || ''}`.toUpperCase();
                    return searchStr.includes('MIU');
                });
            } else if (action === 'pengajar') {
                filtered = data.filter(r => {
                    const searchStr = `${r.tugas_mengajar || ''} ${r.kelas || ''} ${r.tugas || ''}`.toUpperCase();
                    const isMiuTugas = searchStr.includes('MIU');
                    const isMiuKelas = ['ULA', 'WUSTHO', 'ULYA'].some(k => (r.kelas || '').toString().toUpperCase().includes(k));
                    return isMiuTugas || isMiuKelas;
                });
            } else {
                filtered = data.filter(r => (r.madrasah || '').toString().toUpperCase() === 'MIU');
            }

            // Apply Search Query
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                filtered = filtered.filter(f =>
                    (f.nama || f.nama_siswa || '').toLowerCase().includes(q) ||
                    (f.stambuk_madrasah || f.id || '').toString().toLowerCase().includes(q)
                );
            }

            return filtered;
        });

        this.currentData = rows;
        const sorted = this.applySorting(rows);

        const countEl = document.getElementById('miu-total-count');
        if (countEl) countEl.textContent = rows.length;

        this.render(sorted);
    },

    render(rows) {
        this.updateHeaders();
        const tbody = document.querySelector('#miu-table tbody');
        if (!tbody) return;

        this.dataMap = {};

        if (rows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:100px 50px;color:var(--text-muted);background:#fff;">
                <i class="fas fa-folder-open" style="font-size:3rem;display:block;margin-bottom:1rem;opacity:0.2;"></i>
                Tidak ada data MIU (${this.currentAction}) yang ditemukan.<br>
                <span style="font-size:0.8rem;">Silakan pastikan unit Madrasah diatur ke "MIU" pada database santri.</span>
            </td></tr>`;
            return;
        }

        tbody.innerHTML = rows.map(row => {
            this.dataMap[row.id] = row;
            const name = row.nama_siswa || row.nama;
            const img = row.foto_santri || row.foto_ustadz || row.foto_pengurus || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

            let cols = `<td><img src="${img}" style="width:38px;height:38px;border-radius:12px;object-fit:cover;box-shadow:var(--shadow-sm);border:2px solid #fff;"></td>
                        <td><div style="font-weight:700; color:var(--primary-dark);">${name}</div><div style="font-size:0.7rem; color:var(--text-muted);">${row.id || ''}</div></td>`;

            if (this.currentAction === 'siswa') {
                cols += `<td style="color:var(--primary); font-weight:700;">${row.stambuk_madrasah || '-'}</td>
                         <td><span class="th-badge" style="background:var(--primary-light); color:var(--primary); border:1px solid #dbeafe;">${row.kelas || '-'}</span></td>
                         <td>${row.tempat_tanggal_lahir || '-'}</td>
                         <td>${row.nama_ayah || '-'}</td>
                         <td><span class="th-badge" style="background:#f0fdf4; color:#15803d; border:1px solid #dcfce7;">${row.status_mb || 'Lama'}</span></td>`;
            } else if (this.currentAction === 'pengurus') {
                cols += `<td>${row.jabatan || '-'}</td>
                         <td>${row.divisi || '-'}</td>
                         <td>${row.no_hp || '-'}</td>
                         <td><span class="th-badge" style="background:#eef2ff; color:#4338ca;">Aktif MIU</span></td>`;
            } else if (this.currentAction === 'pengajar') {
                cols += `<td>${row.tugas_mengajar || '-'}</td>
                         <td>${row.kelas || '-'}</td>
                         <td>${row.domisili || '-'}</td>
                         <td><span class="th-badge" style="background:#fffbeb; color:#b45309; border:1px solid #fef3c7;">Staff MIU</span></td>`;
            } else {
                cols += `<td colspan="5" style="color:var(--text-muted); font-style:italic;">Fitur rekap sedang disiapkan...</td>`;
            }

            return `<tr style="transition:all 0.2s;">
                ${cols}
                <td style="display:flex; gap:8px;">
                    <button class="btn btn-action btn-blue" onclick="handleGlobalAction('madrasah_miu', 'detail', '${row.id}')" title="Detail">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${window.Auth && window.Auth.canEdit('madrasah_miu') ? `
                        <button class="btn btn-action btn-yellow" onclick="handleGlobalAction('madrasah_miu', 'edit', '${row.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>`;
        }).join('');
    },

    updateHeaders() {
        const thead = document.querySelector('#miu-table thead');
        if (!thead) return;

        let headers = ``;
        if (this.currentAction === 'siswa') {
            headers = `${this.createSortableHeader('Foto', null, '60px')}
                       ${this.createSortableHeader('Nama Santri', 'nama_siswa')}
                       ${this.createSortableHeader('No. Stambuk', 'stambuk_madrasah')}
                       ${this.createSortableHeader('Kelas', 'kelas')}
                       ${this.createSortableHeader('TTL', 'tempat_tanggal_lahir')}
                       ${this.createSortableHeader('Wali/Ayah', 'nama_ayah')}
                       ${this.createSortableHeader('Status MB', 'status_mb')}`;
        } else if (this.currentAction === 'pengurus') {
            headers = `${this.createSortableHeader('Foto', null, '60px')}
                       ${this.createSortableHeader('Profil', 'nama')}
                       ${this.createSortableHeader('Jabatan', 'jabatan')}
                       ${this.createSortableHeader('Divisi', 'divisi')}
                       ${this.createSortableHeader('Kontak', 'no_hp')}
                       ${this.createSortableHeader('Status', null)}`;
        } else if (this.currentAction === 'pengajar') {
            headers = `${this.createSortableHeader('Foto', null, '60px')}
                       ${this.createSortableHeader('Profil', 'nama')}
                       ${this.createSortableHeader('Tugas', 'tugas_mengajar')}
                       ${this.createSortableHeader('Kelas', 'kelas')}
                       ${this.createSortableHeader('Domisili', 'domisili')}
                       ${this.createSortableHeader('Status', null)}`;
        } else {
            headers = `<th>Foto</th><th>Nama</th><th colspan="5">Rekap Data</th>`;
        }

        thead.innerHTML = `<tr>${headers}${this.createSortableHeader('Aksi', null, '120px')}</tr>`;
    },

    exportData() {
        if (!this.currentData || this.currentData.length === 0) {
            alert("Tidak ada data MIU untuk diekspor");
            return;
        }

        const exportRows = this.currentData.map(row => {
            const base = {
                "Nama": row.nama_siswa || row.nama,
                "Unit": "MIU"
            };

            if (this.currentAction === 'siswa') {
                return { ...base, "Stambuk": row.stambuk_madrasah, "Kelas": row.kelas, "Wali": row.nama_ayah };
            }
            return base;
        });

        const ws = XLSX.utils.json_to_sheet(exportRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `MIU ${this.currentAction}`);
        XLSX.writeFile(wb, `Data_Madrasah_MIU_${this.currentAction}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }
};

window.MadrasahMiuModule = MadrasahMiuModule;
