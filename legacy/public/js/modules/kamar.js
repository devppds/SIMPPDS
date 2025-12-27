import { UI } from '../core/ui.js';
import { apiCall } from '../core/api.js';
import { TableSort } from '../core/table_sort.js';

export const KamarModule = {
    ...TableSort.createSortableModule('kamar'),
    allSantri: [],
    allRooms: [],

    async init() {
        const titleEl = document.getElementById('view-title');
        if (titleEl) titleEl.textContent = 'Dashboard Kamar';

        // Bind Search
        const searchInput = document.getElementById('search-kamar');
        if (searchInput) searchInput.oninput = () => this.loadData(searchInput.value);

        await this.loadData();
    },

    async loadData(searchQuery = '') {
        try {
            const [rooms, santri] = await Promise.all([
                apiCall('getData', 'GET', { type: 'kamar' }),
                apiCall('getData', 'GET', { type: 'santri' })
            ]);

            this.allSantri = santri || [];
            this.allRooms = rooms || [];

            const filteredRooms = (rooms || []).filter(r =>
                (r.nama_kamar || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.asrama || '').toLowerCase().includes(searchQuery.toLowerCase())
            );

            const sortedRooms = this.applySorting(filteredRooms);
            this.render(sortedRooms, this.allSantri, this.allRooms);
        } catch (e) {
            console.error("Kamar: Load failed", e);
        }
    },

    render(filteredRooms, santriList, allRooms) {
        this.renderTopStats(allRooms, santriList);
        this.renderSummary(allRooms, santriList);
        this.renderTable(filteredRooms, santriList);
    },

    renderTopStats(allRooms, santriList) {
        const statsContainer = document.getElementById('kamar-top-stats');
        if (!statsContainer) return;

        let totalCapacity = 0;
        allRooms.forEach(r => {
            totalCapacity += parseInt(r.kapasitas || 0);
        });

        const occupiedCount = santriList.filter(s =>
            s.kamar && allRooms.some(r => r.nama_kamar.toLowerCase() === s.kamar.toLowerCase())
        ).length;

        const available = totalCapacity - occupiedCount;

        statsContainer.innerHTML = `
            <div class="kamar-stat-mini-card">
                <div class="mini-card-icon" style="background:#e0f2fe; color:#0369a1;"><i class="fas fa-door-open"></i></div>
                <div class="mini-card-info">
                    <h4>Total Kamar</h4>
                    <p class="value">${allRooms.length}</p>
                </div>
            </div>
            <div class="kamar-stat-mini-card">
                <div class="mini-card-icon" style="background:#f0fdf4; color:#16a34a;"><i class="fas fa-users"></i></div>
                <div class="mini-card-info">
                    <h4>Total Penghuni</h4>
                    <p class="value">${occupiedCount}</p>
                </div>
            </div>
            <div class="kamar-stat-mini-card">
                <div class="mini-card-icon" style="background:#fff7ed; color:#c2410b;"><i class="fas fa-bed"></i></div>
                <div class="mini-card-info">
                    <h4>Slot Tersedia</h4>
                    <p class="value">${available > 0 ? available : 0}</p>
                </div>
            </div>
            <div class="kamar-stat-mini-card">
                <div class="mini-card-icon" style="background:#faf5ff; color:#7e22ce;"><i class="fas fa-percentage"></i></div>
                <div class="mini-card-info">
                    <h4>Rasio Hunian</h4>
                    <p class="value">${totalCapacity > 0 ? Math.round((occupiedCount / totalCapacity) * 100) : 0}%</p>
                </div>
            </div>
        `;
    },

    renderSummary(allRooms, santriList) {
        const summaryContainer = document.getElementById('kamar-summary');
        if (!summaryContainer) return;

        const blocks = {};
        allRooms.forEach(room => {
            const blockName = room.asrama || 'Lainnya';
            if (!blocks[blockName]) {
                blocks[blockName] = { rooms: 0, totalCapacity: 0, totalOccupants: 0 };
            }
            blocks[blockName].rooms++;
            blocks[blockName].totalCapacity += parseInt(room.kapasitas || 0);

            const inRoomCount = santriList.filter(s => (s.kamar || '').toLowerCase() === (room.nama_kamar || '').toLowerCase()).length;
            blocks[blockName].totalOccupants += inRoomCount;
        });

        summaryContainer.innerHTML = Object.entries(blocks).map(([name, data]) => {
            const occupancyRate = data.totalCapacity > 0 ? Math.round((data.totalOccupants / data.totalCapacity) * 100) : 0;
            let progressColor = '#10b981';
            let iconBg = '#f0fdf4';
            let iconColor = '#16a34a';

            if (occupancyRate > 90) {
                progressColor = '#ef4444';
                iconBg = '#fef2f2';
                iconColor = '#dc2626';
            } else if (occupancyRate > 75) {
                progressColor = '#f59e0b';
                iconBg = '#fffbeb';
                iconColor = '#d97706';
            }

            return `
                <div class="kamar-summary-card">
                    <div class="kamar-block-header">
                        <div class="kamar-block-icon" style="background:${iconBg}; color:${iconColor};">
                            <i class="fas fa-th-large"></i>
                        </div>
                        <div class="kamar-block-info">
                            <span class="kamar-block-name">${name}</span>
                            <span style="font-size:0.8rem; color:#64748b; font-weight:600;">${data.rooms} Unit Kamar</span>
                        </div>
                    </div>
                    <div class="kamar-stats-grid">
                        <div class="kamar-stat-cell">
                            <span class="kamar-stat-label">Kapasitas</span>
                            <span class="kamar-stat-value">${data.totalCapacity}</span>
                        </div>
                        <div class="kamar-stat-cell">
                            <span class="kamar-stat-label">Terisi</span>
                            <span class="kamar-stat-value">${data.totalOccupants}</span>
                        </div>
                    </div>
                    <div class="kamar-occupancy-info">
                        <div class="kamar-occupancy-text">
                            <span>Kepadatan</span>
                            <span style="color:${progressColor}">${occupancyRate}%</span>
                        </div>
                        <div class="kamar-progress-container">
                            <div class="kamar-progress-bar" style="width:${occupancyRate}%; background: ${progressColor};"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderTable(rooms, santriList) {
        this.updateHeaders();
        const tbody = document.querySelector('#kamar-table tbody');
        if (!tbody) return;

        if (rooms.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:50px;color:#94a3b8;">Tidak ada data kamar ditemukan.</td></tr>';
            return;
        }

        tbody.innerHTML = rooms.map(row => {
            const rowDataStr = encodeURIComponent(JSON.stringify(row));
            const inRoomCount = santriList.filter(s => (s.kamar || '').toLowerCase() === (row.nama_kamar || '').toLowerCase()).length;
            const occupancyColor = inRoomCount >= row.kapasitas ? '#ef4444' : (inRoomCount > row.kapasitas * 0.7 ? '#f59e0b' : '#10b981');

            return `<tr>
                <td><strong>${row.nama_kamar}</strong></td>
                <td><span class="th-badge" style="background:#f1f5f9; color:#475569;">${row.asrama || '-'}</span></td>
                <td>${row.penasihat || '-'}</td>
                <td>${row.kapasitas || 0} Orang</td>
                <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="color:${occupancyColor}; font-weight:800; font-size:1.1rem;">${inRoomCount}</span>
                        <small style="color:#64748b;">/${row.kapasitas}</small>
                    </div>
                </td>
                <td style="display:flex; gap:8px; justify-content:center;">
                    <button class="btn btn-action btn-blue" onclick="window.KamarModule.viewRoomDetail('${rowDataStr}')" title="Lihat Penghuni">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-action btn-yellow" onclick="prepareEdit('kamar', '${row.id}', '${rowDataStr}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-action btn-red" onclick="deleteItem('kamar', '${row.id}')" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');
    },

    updateHeaders() {
        const thead = document.querySelector('#kamar-table thead tr');
        if (!thead) return;

        thead.innerHTML = `
            ${this.createSortableHeader('Nama Kamar', 'nama_kamar')}
            ${this.createSortableHeader('Asrama', 'asrama')}
            ${this.createSortableHeader('Penasihat', 'penasihat')}
            ${this.createSortableHeader('Kapasitas', 'kapasitas')}
            ${this.createSortableHeader('Terisi', null)}
            ${this.createSortableHeader('Aksi', null, '150px')}
        `;
    },

    viewRoomDetail(dataEncoded) {
        const room = JSON.parse(decodeURIComponent(dataEncoded));
        const occupants = this.allSantri.filter(s => (s.kamar || '').toLowerCase() === (room.nama_kamar || '').toLowerCase());

        const content = document.getElementById('detail-content');
        const titleEl = document.getElementById('detail-title');

        // Ensure broad modal for side-by-side or large layout
        const modalContent = content.closest('.modal-content');
        if (modalContent) {
            modalContent.style.maxWidth = '850px';
            modalContent.style.width = '90%';
        }

        if (titleEl) titleEl.textContent = 'Manajemen Penghuni Kamar';

        const infoCardsHtml = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                <div style="background: #f8fafc; padding: 1.25rem; border-radius: 12px; border-left: 4px solid var(--primary);">
                    <label style="font-size: 0.65rem; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 5px;">Nama Kamar</label>
                    <div style="font-size: 1.1rem; font-weight: 800; color: var(--primary-dark);">${room.nama_kamar}</div>
                </div>
                <div style="background: #f8fafc; padding: 1.25rem; border-radius: 12px; border-left: 4px solid #10b981;">
                    <label style="font-size: 0.65rem; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 5px;">Asrama / Blok</label>
                    <div style="font-size: 1.1rem; font-weight: 800; color: #065f46;">${room.asrama || '-'}</div>
                </div>
                <div style="background: #f8fafc; padding: 1.25rem; border-radius: 12px; border-left: 4px solid #f59e0b;">
                    <label style="font-size: 0.65rem; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 5px;">Penasihat</label>
                    <div style="font-size: 1.1rem; font-weight: 800; color: #92400e;">${room.penasihat || '-'}</div>
                </div>
                <div style="background: #f8fafc; padding: 1.25rem; border-radius: 12px; border-left: 4px solid #6366f1;">
                    <label style="font-size: 0.65rem; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 5px;">Kapasitas/Terisi</label>
                    <div style="font-size: 1.1rem; font-weight: 800; color: #3730a3;">${occupants.length} / ${room.kapasitas}</div>
                </div>
            </div>
        `;

        let tableHtml = `
            <div style="background: white; border-radius: 15px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: var(--shadow-sm);">
                <div style="padding: 1rem 1.5rem; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                    <h4 style="margin: 0; color: var(--primary-dark); font-family: 'Outfit', sans-serif;"><i class="fas fa-users" style="margin-right: 8px;"></i> Daftar Santri Penghuni</h4>
                    <span class="th-badge" style="background: var(--primary); color: white;">${occupants.length} Santri</span>
                </div>
                <div style="max-height: 400px; overflow-y: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead style="position: sticky; top: 0; background: white; box-shadow: 0 2px 2px rgba(0,0,0,0.02); z-index: 5;">
                            <tr>
                                <th style="padding: 12px 20px; text-align: left; font-size: 0.75rem; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #f1f5f9;">Nama Santri</th>
                                <th style="padding: 12px 20px; text-align: left; font-size: 0.75rem; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #f1f5f9;">Kelas</th>
                                <th style="padding: 12px 20px; text-align: center; font-size: 0.75rem; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #f1f5f9;">Sakit/Izin</th>
                                <th style="padding: 12px 20px; text-align: center; font-size: 0.75rem; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #f1f5f9;">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${occupants.length === 0 ? `
                                <tr>
                                    <td colspan="4" style="padding: 40px; text-align: center; color: #94a3b8;">
                                        <i class="fas fa-user-slash" style="font-size: 2rem; display: block; margin-bottom: 10px; opacity: 0.3;"></i>
                                        Belum ada santri yang terdaftar di kamar ini.
                                    </td>
                                </tr>
                            ` : occupants.map(s => `
                                <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                                    <td style="padding: 12px 20px;">
                                        <div style="font-weight: 700; color: var(--primary-dark);">${s.nama_siswa}</div>
                                        <div style="font-size: 0.7rem; color: #94a3b8;">STAMBUK: ${s.stambuk_pondok || '-'}</div>
                                    </td>
                                    <td style="padding: 12px 20px;">
                                        <span class="th-badge" style="background: #eff6ff; color: #1e40af; border: 1px solid #dbeafe;">${s.kelas || '-'}</span>
                                    </td>
                                    <td style="padding: 12px 20px; text-align: center;">
                                        <span class="th-badge" style="background: #f0fdf4; color: #166534;">NORMAL</span>
                                    </td>
                                    <td style="padding: 12px 20px; text-align: center;">
                                        <button class="btn btn-action btn-blue" style="width: 28px; height: 28px; font-size: 0.7rem;" onclick="viewDetail('santri', '${encodeURIComponent(JSON.stringify(s))}')">
                                            <i class="fas fa-user"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        content.innerHTML = infoCardsHtml + tableHtml;
        UI.openModal('detail-modal');
    }
};

window.KamarModule = KamarModule;
