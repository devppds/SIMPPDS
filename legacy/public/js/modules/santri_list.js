import { UI } from '../core/ui.js';
import { apiCall } from '../core/api.js';

export const SantriListModule = {
    currentUnit: null,
    currentData: [],

    async init(action) {
        this.currentUnit = action || 'all';

        const titleEl = document.getElementById('santri_list-title');
        const descEl = document.getElementById('santri_list-desc');

        const unitNames = {
            'keamanan': 'Keamanan',
            'pendidikan': 'Pendidikan',
            'kesehatan': 'Kesehatan',
            'sekretariat': 'Sekretariat',
            'jamiyyah': "Jam'iyyah"
        };

        const unitName = unitNames[this.currentUnit] || 'Semua Unit';

        if (titleEl) titleEl.textContent = `Daftar Santri - ${unitName}`;
        if (descEl) descEl.textContent = `Direktori santri aktif untuk keperluan ${unitName}. Data bersifat read-only.`;

        // Bind Search
        const searchInput = document.getElementById('search-santri_list');
        if (searchInput) {
            searchInput.oninput = () => this.renderCards(searchInput.value);
        }

        // Bind Filter
        const filterKelas = document.getElementById('filter-kelas');
        const filterStatus = document.getElementById('filter-status');

        if (filterKelas) filterKelas.onchange = () => this.renderCards();
        if (filterStatus) filterStatus.onchange = () => this.renderCards();

        await this.loadData();
    },

    async loadData() {
        try {
            const santri = await apiCall('getData', 'GET', { type: 'santri' });
            // Filter only active santri by default
            this.currentData = (santri || []).filter(s => !s.status_santri || s.status_santri === 'Aktif');
            this.renderCards();
            this.renderStats();
        } catch (err) {
            console.error('Failed to load santri:', err);
        }
    },

    renderCards(searchQuery = '') {
        const container = document.getElementById('santri-cards-container');
        if (!container) return;

        let filtered = this.currentData;

        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(s =>
                (s.nama_siswa || '').toLowerCase().includes(q) ||
                (s.stambuk_pondok || '').toLowerCase().includes(q) ||
                (s.kamar || '').toLowerCase().includes(q) ||
                (s.kelas || '').toLowerCase().includes(q)
            );
        }

        // Kelas filter
        const filterKelas = document.getElementById('filter-kelas');
        if (filterKelas && filterKelas.value) {
            filtered = filtered.filter(s => s.kelas === filterKelas.value);
        }

        // Status filter
        const filterStatus = document.getElementById('filter-status');
        if (filterStatus && filterStatus.value) {
            filtered = filtered.filter(s => (s.status_santri || 'Aktif') === filterStatus.value);
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding:60px 20px; color:var(--text-muted);">
                    <i class="fas fa-search" style="font-size:3rem; opacity:0.3; margin-bottom:1rem;"></i>
                    <p style="font-size:1.1rem;">Tidak ada santri yang sesuai dengan filter</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(s => {
            const foto = s.foto_santri || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.nama_siswa)}&background=random&size=200`;
            const statusColor = s.status_santri === 'Aktif' || !s.status_santri ? '#10b981' : '#ef4444';
            const statusText = s.status_santri || 'Aktif';

            return `
                <div class="santri-card" onclick="SantriListModule.viewDetail('${s.id}')">
                    <div class="santri-card-photo">
                        <img src="${foto}" alt="${s.nama_siswa}" loading="lazy">
                    </div>
                    <div class="santri-card-info">
                        <h3 class="santri-card-name">${s.nama_siswa}</h3>
                        <div class="santri-card-meta">
                            <span><i class="fas fa-id-card"></i> ${s.stambuk_pondok || '-'}</span>
                            <span><i class="fas fa-graduation-cap"></i> ${s.kelas || '-'}</span>
                        </div>
                        <div class="santri-card-meta">
                            <span><i class="fas fa-door-open"></i> ${s.kamar || '-'}</span>
                            <span style="color:${statusColor}; font-weight:600;"><i class="fas fa-circle" style="font-size:0.5rem;"></i> ${statusText}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderStats() {
        const statsContainer = document.getElementById('santri_list-stats');
        if (!statsContainer) return;

        const total = this.currentData.length;
        const putra = this.currentData.filter(s => s.jenis_kelamin === 'Laki-laki').length;
        const putri = this.currentData.filter(s => s.jenis_kelamin === 'Perempuan').length;

        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon" style="background:#eef2ff; color:#6366f1;">
                    <i class="fas fa-users"></i>
                </div>
                <div>
                    <div class="stat-value">${total}</div>
                    <div class="stat-label">Total Santri</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background:#dbeafe; color:#3b82f6;">
                    <i class="fas fa-male"></i>
                </div>
                <div>
                    <div class="stat-value">${putra}</div>
                    <div class="stat-label">Putra</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background:#fce7f3; color:#ec4899;">
                    <i class="fas fa-female"></i>
                </div>
                <div>
                    <div class="stat-value">${putri}</div>
                    <div class="stat-label">Putri</div>
                </div>
            </div>
        `;
    },

    viewDetail(id) {
        const santri = this.currentData.find(s => s.id == id);
        if (!santri) return;

        const foto = santri.foto_santri || `https://ui-avatars.com/api/?name=${encodeURIComponent(santri.nama_siswa)}&background=random&size=400`;

        const content = document.getElementById('detail-content');
        const titleEl = document.getElementById('detail-title');

        if (titleEl) titleEl.textContent = 'Detail Santri';

        const leftCol = `
            <div style="text-align:center;">
                <img src="${foto}" style="width:100%; max-width:200px; border-radius:12px; border:2px solid #ddd; margin-bottom:1rem;">
                <h3 style="font-size:1.2rem; margin-bottom:0.5rem;">${santri.nama_siswa}</h3>
                <span class="th-badge" style="background:#f1f5f9; color:#475569;">SANTRI</span>
            </div>
        `;

        let detailHTML = `<div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; align-content:start;">`;

        const fields = [
            { key: 'stambuk_pondok', label: 'Stambuk Pondok' },
            { key: 'stambuk_madrasah', label: 'Stambuk Madrasah' },
            { key: 'kelas', label: 'Kelas' },
            { key: 'kamar', label: 'Kamar' },
            { key: 'status_mb', label: 'Kelompok' },
            { key: 'jenis_kelamin', label: 'Jenis Kelamin' },
            { key: 'status_santri', label: 'Status' }
        ];

        fields.forEach(field => {
            detailHTML += `
                <div>
                    <label style="font-size:0.75rem; color:#666; display:block; margin-bottom:3px;">${field.label.toUpperCase()}</label>
                    <div style="font-weight:600; overflow-wrap: anywhere;">${santri[field.key] || '-'}</div>
                </div>
            `;
        });

        detailHTML += `</div>`;

        content.innerHTML = leftCol + detailHTML;
        UI.openModal('detail-modal');
    }
};

window.SantriListModule = SantriListModule;
