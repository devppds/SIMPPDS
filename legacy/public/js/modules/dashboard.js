import { apiCall } from '../core/api.js';

export const DashboardModule = {
    chartInstance: null,

    async init(action) {
        this.showModuleDashboard(action || 'all');
        await this.loadStats();

        // Load data needed for various dashboard views
        if (action === 'santri_dashboard' || action === 'kamar_dashboard' || action === 'pendidikan_dashboard' || action === 'all' || action === 'dashboard') {
            await this.loadSharedDashboardData(action);
        }
    },

    showModuleDashboard(action) {
        const groups = document.querySelectorAll('.dashboard-group');
        const overviewGrid = document.getElementById('dashboard-overview-grid');
        const stats = document.getElementById('group-stats');
        const hero = document.getElementById('dashboard-hero');
        const titleEl = document.getElementById('view-title');

        groups.forEach(g => g.style.display = 'none');
        if (overviewGrid) overviewGrid.style.display = 'none';
        if (stats) stats.style.display = 'none';
        if (hero) hero.style.display = 'none';

        // Check Role
        const role = (window.Auth && window.Auth.user) ? window.Auth.user.role : 'admin';

        if (action === 'dashboard' || action === 'all') {
            if (titleEl) titleEl.textContent = 'Dashboard Utama';

            if (role === 'admin') {
                // Admin: Full Overview
                if (overviewGrid) overviewGrid.style.display = 'grid';
                if (stats) stats.style.display = 'grid';
                if (hero) {
                    hero.style.display = 'block';
                    const h2 = hero.querySelector('h2');
                    if (h2) h2.textContent = 'Selamat Datang, Admin Utama!';
                }
            } else {
                // Unit: Specific Dashboard automatically
                if (hero) {
                    hero.style.display = 'block';
                    const h2 = hero.querySelector('h2');
                    if (h2) h2.textContent = `Selamat Datang, Seksi ${role.charAt(0).toUpperCase() + role.slice(1)}!`;
                    // Hide admin-specific buttons in hero if not admin
                    const heroBtns = hero.querySelectorAll('.btn');
                    heroBtns.forEach(btn => btn.style.display = 'none');
                }

                const roleMap = {
                    'keamanan': 'group-keamanan',
                    'pendidikan': 'group-pendidikan',
                    'kesehatan': 'group-kesehatan',
                    'bendahara': ['group-bendahara', 'group-keuangan'],
                    'sekretariat': 'group-santri',
                };

                const targetIds = roleMap[role];
                if (targetIds) {
                    const ids = Array.isArray(targetIds) ? targetIds : [targetIds];
                    ids.forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.style.display = 'block';
                    });
                } else {
                    // Fallback
                    if (overviewGrid) overviewGrid.style.display = 'grid';
                }
            }
        } else {
            // Specific Action requested manually
            const module = action.replace('_dashboard', '').replace('_main', '');
            const target = document.getElementById('group-' + module);
            if (target) target.style.display = 'block';

            if (['santri', 'ustadz', 'pengurus'].includes(module) && stats) {
                stats.style.display = 'grid';
            }

            if (titleEl) titleEl.textContent = 'Dashboard ' + module.charAt(0).toUpperCase() + module.slice(1);
        }
    },

    async loadStats() {
        try {
            const stats = await apiCall('getQuickStats');
            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.textContent = val;
            };

            setVal('stats-santri', stats.santri || 0);
            setVal('hero-total-santri', stats.santri || 0);
            setVal('stats-ustadz', stats.ustadz || 0);
            setVal('stats-pengurus', stats.pengurus || 0);

            // Overview Grid Stats
            setVal('overview-santri-total', (stats.santri || 0) + ' Santri');
            setVal('overview-keuangan-tabungan', 'Rp ' + (stats.total_tabungan || 0).toLocaleString());
            setVal('overview-bendahara-saldo', 'Rp ' + (stats.saldo_kas || 0).toLocaleString());
            const totalPelanggaran = (stats.pelanggaran_ringan || 0) + (stats.pelanggaran_sedang || 0) + (stats.pelanggaran_berat || 0);
            setVal('overview-keamanan-kasus', totalPelanggaran + ' Kasus');

            const rooms = await apiCall('getData', 'GET', { type: 'kamar' });
            setVal('stats-kamar', (rooms || []).length);

            setVal('stats-security-ringan', stats.pelanggaran_ringan || 0);
            setVal('stats-security-sedang', stats.pelanggaran_sedang || 0);
            setVal('stats-security-berat', stats.pelanggaran_berat || 0);
            setVal('stats-edu-attendance', (stats.avg_kehadiran || 0) + '%');
            setVal('stats-fin-lunas', stats.pembayaran_lunas || 0);
            setVal('stats-fin-nunggak', stats.pembayaran_nunggak || 0);
            setVal('stats-fin-tabungan', 'Rp ' + (stats.total_tabungan || 0).toLocaleString());
            setVal('stats-bend-masuk', 'Rp ' + (stats.total_masuk || 0).toLocaleString());
            setVal('stats-bend-keluar', 'Rp ' + (stats.total_keluar || 0).toLocaleString());
            setVal('stats-bend-saldo', 'Rp ' + (stats.saldo_kas || 0).toLocaleString());

            // Ustadz & Pengurus Breakdown
            setVal('stats-ustadz-aktif', stats.ustadz_aktif || 0);
            setVal('stats-ustadz-nonaktif', stats.ustadz_nonaktif || 0);
            setVal('stats-ustadz-total', stats.ustadz || 0);

            setVal('stats-pengurus-aktif', stats.pengurus_aktif || 0);
            setVal('stats-pengurus-nonaktif', stats.pengurus_nonaktif || 0);
            setVal('stats-pengurus-total', stats.pengurus || 0);

            // MIU Summary
            const list = await apiCall('getData', 'GET', { type: 'santri' });
            const miuList = (list || []).filter(s => s.madrasah === 'MIU' && (s.status === 'Aktif' || !s.status));
            setVal('stats-miu', miuList.length);
            setVal('stats-miu-total', miuList.length);
            setVal('hero-total-miu', miuList.length);

            const badge = document.getElementById('badge-ta-container');
            if (badge) badge.style.display = 'inline-flex';
        } catch (e) {
            console.error("Dashboard: Stats load failed", e);
        }
    },

    async loadSharedDashboardData(action) {
        try {
            const promises = [
                apiCall('getData', 'GET', { type: 'santri' }),
                apiCall('getData', 'GET', { type: 'kamar' })
            ];

            // Helper to add promise based on condition
            const addP = (cond, type) => promises.push(cond ? apiCall('getData', 'GET', { type }) : Promise.resolve([]));
            const isAll = action === 'dashboard' || action === 'all';

            addP(isAll || action === 'pendidikan_dashboard', 'pendidikan');
            addP(isAll || action === 'ustadz_dashboard', 'ustadz');
            addP(isAll || action === 'keamanan_dashboard', 'keamanan');
            addP(isAll || action === 'kesehatan_dashboard', 'kesehatan');
            addP(isAll || action === 'bendahara_dashboard', 'arus_kas');
            addP(isAll || action === 'keuangan_dashboard', 'keuangan');

            const results = await Promise.all(promises);
            const list = results[0] || [];
            const roomList = results[1] || [];
            const eduList = results[2] || [];
            const ustadzList = results[3] || [];
            const keamananList = results[4] || [];
            const kesehatanList = results[5] || [];
            const arusKasList = results[6] || [];
            const keuanganList = results[7] || [];

            // Render Santri Information
            if (action.includes('santri') || isAll) {
                const aktif = list.filter(s => !s.status_santri || s.status_santri === 'Aktif').length;
                const boyong = list.filter(s => s.status_santri === 'Boyong').length;
                const pindah = list.filter(s => s.status_santri === 'Pindah').length;

                const setVal = (id, val) => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = val;
                };

                setVal('stats-santri-aktif', aktif);
                setVal('stats-santri-boyong', boyong);
                setVal('stats-santri-pindah', pindah);

                this.renderSantriChart(list);
            }

            // Render Room Occupancy (Main, Santri, or Kamar Dashboard)
            if (isAll || action === 'santri_dashboard' || action === 'kamar_dashboard') {
                this.renderRoomOccupancy(list, roomList);
            }

            // Render Education Activities (Main or Education Dashboard)
            if (isAll || action === 'pendidikan_dashboard') {
                this.renderEducationActivities(eduList);
            }

            // Render Ustadz List
            if (isAll || action === 'ustadz_dashboard') {
                this.renderUstadzList(ustadzList);
            }

            // Render Keamanan Dashboard
            if (isAll || action === 'keamanan_dashboard') {
                this.renderKeamananDashboard(keamananList);
            }

            // Render Kesehatan Dashboard
            if (isAll || action === 'kesehatan_dashboard') {
                this.renderKesehatanDashboard(kesehatanList);
            }

            // Render Bendahara Dashboard
            if (isAll || action === 'bendahara_dashboard') {
                this.renderBendaharaDashboard(arusKasList);
            }

            // Render Keuangan Dashboard
            if (isAll || action === 'keuangan_dashboard') {
                this.renderKeuanganDashboard(keuanganList);
            }

            // Render MIU Specifics
            if (isAll || action === 'madrasah_miu_dashboard' || action === 'madrasah_miu') {
                const miuList = list.filter(s => s.madrasah === 'MIU' && (s.status === 'Aktif' || !s.status));
                this.renderMiuStats(miuList);
            }

        } catch (e) {
            console.error("Dashboard Data: Load failed", e);
        }
    },

    renderKeamananDashboard(list) {
        // 1. Render Chart
        const chartCanvas = document.getElementById('keamananChart');
        if (chartCanvas) {
            const monthlyStats = Array(12).fill(0);
            list.forEach(item => {
                if (item.tanggal) {
                    const month = new Date(item.tanggal).getMonth();
                    if (month >= 0 && month < 12) monthlyStats[month]++;
                }
            });

            if (this.keamananChartInstance) this.keamananChartInstance.destroy();
            const ctx = chartCanvas.getContext('2d');

            this.keamananChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
                    datasets: [{
                        label: 'Jumlah Pelanggaran',
                        data: monthlyStats,
                        backgroundColor: '#ef4444',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { borderDash: [2, 4] } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        // 2. Render Recent List
        const listContainer = document.getElementById('recent-pelanggaran-list');
        if (listContainer) {
            const recent = [...list].sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0)).slice(0, 10);
            if (recent.length === 0) {
                listContainer.innerHTML = '<p style="text-align:center; color:#9cb3c9; margin-top:20px;">Belum ada data pelanggaran.</p>';
            } else {
                const formatDate = (dateString) => {
                    if (!dateString) return '-';
                    const d = new Date(dateString);
                    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                };

                listContainer.innerHTML = recent.map(item => {
                    const color = item.jenis_pelanggaran === 'Berat' ? '#ef4444' : item.jenis_pelanggaran === 'Sedang' ? '#f59e0b' : '#3b82f6';
                    return `
                    <div style="border-bottom:1px solid #f1f5f9; padding:12px 0; display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; gap:10px; align-items:center;">
                            <div style="width:8px; height:8px; border-radius:50%; background:${color};"></div>
                            <div>
                                <div style="font-weight:600; font-size:0.9rem; color:var(--text-main);">${item.nama_santri}</div>
                                <div style="font-size:0.8rem; color:var(--text-muted);">${item.takzir || item.jenis_pelanggaran}</div>
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600; background:#f8fafc; padding:2px 6px; border-radius:4px;">${formatDate(item.tanggal)}</div>
                        </div>
                    </div>
                 `}).join('');
            }
        }
    },

    renderUstadzList(ustadzList) {
        const container = document.getElementById('recent-ustadz-list');
        if (!container) return;

        if (!ustadzList || ustadzList.length === 0) {
            container.innerHTML = '<p style="color:#94a3b8; text-align:center; padding:20px;">Belum ada data pengajar.</p>';
            return;
        }

        container.innerHTML = ustadzList.map(u => {
            const img = u.foto_ustadz || `https://ui-avatars.com/api/?name=${u.nama}&background=random`;
            const statusColor = u.status === 'Aktif' ? '#10b981' : '#ef4444';
            return `
                <div style="display:flex; align-items:center; gap:15px; margin-bottom:12px; padding:10px; border-radius:12px; background:#f8fafc; border:1px solid #f1f5f9;">
                    <img src="${img}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
                    <div style="flex:1;">
                        <h5 style="margin:0; font-size:0.95rem;">${u.nama}</h5>
                        <div style="font-size:0.8rem; color:#64748b;">${u.nik_nip || '-'} | Kelas: ${u.kelas || '-'}</div>
                    </div>
                    <div style="text-align:right;">
                        <span class="th-badge" style="background:${statusColor}20; color:${statusColor}; font-size:0.7rem;">${u.status}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderSantriChart(santriList) {
        const canvas = document.getElementById('santriChart');
        if (!canvas) return;

        const counts = {};
        santriList.forEach(s => {
            const year = s.tahun_masuk || 'Lainnya';
            counts[year] = (counts[year] || 0) + 1;
        });

        const labels = Object.keys(counts).sort();
        const data = labels.map(l => counts[l]);

        if (this.chartInstance) this.chartInstance.destroy();

        const ctx = canvas.getContext('2d');

        // Premium Gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');   // Emerald
        gradient.addColorStop(0.6, 'rgba(20, 184, 166, 0.1)'); // Teal
        gradient.addColorStop(1, 'rgba(20, 184, 166, 0)');     // Transparent

        this.chartInstance = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Santri Baru',
                    data: data,
                    borderColor: '#10b981',
                    borderWidth: 4,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#10b981',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: '#10b981',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 3,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.45, // Super smooth curves
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#1e293b',
                        bodyColor: '#1e293b',
                        borderColor: '#e2e8f0',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 12,
                        displayColors: false,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        callbacks: {
                            label: function (context) {
                                return `📈 Pertumbuhan: ${context.parsed.y} Santri`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(226, 232, 240, 0.5)',
                            drawBorder: false,
                            dash: [5, 5]
                        },
                        ticks: {
                            font: { size: 11, weight: '500' },
                            color: '#64748b',
                            padding: 10
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            font: { size: 11, weight: '600' },
                            color: '#64748b',
                            padding: 10
                        }
                    }
                },
                animations: {
                    tension: {
                        duration: 1000,
                        easing: 'linear',
                        from: 1,
                        to: 0.45,
                        loop: false
                    },
                    y: {
                        easing: 'easeInOutQuart',
                        duration: 1200
                    }
                }
            }
        });
    },

    renderRoomOccupancy(santriList, roomList) {
        const container = document.getElementById('room-occupancy-list');
        if (!container) return;

        const summary = roomList.map(room => {
            const occupants = santriList.filter(s => (s.kamar || '').toLowerCase() === (room.nama_kamar || '').toLowerCase()).length;
            return { name: room.nama_kamar, count: occupants, cap: room.kapasitas };
        }).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

        container.innerHTML = summary.map(r => {
            const perc = Math.min(100, Math.round((r.count / (r.cap || 1)) * 100));
            const color = perc > 90 ? '#ef4444' : perc > 70 ? '#f97316' : '#0d9488';

            return `
                <div style="margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                    <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px;">
                        <span style="font-weight:600;">${r.name}</span>
                        <span style="font-weight:700; color:${color};">${r.count} / ${r.cap}</span>
                    </div>
                    <div style="background:#f1f5f9; height:8px; border-radius:10px; overflow:hidden;">
                        <div style="background:${color}; width:${perc}%; height:100%; transition: width 0.3s ease;"></div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderEducationActivities(eduList) {
        // 1. Render List
        let container = document.getElementById('education-activity-list');
        if (!container) container = document.getElementById('recent-pendidikan-list');

        if (container) {
            const recent = [...eduList].sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0)).slice(0, 10);

            if (recent.length === 0) {
                container.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:20px;">Belum ada laporan kegiatan.</p>';
            } else {
                container.innerHTML = recent.map(item => {
                    const dateStr = item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-';
                    return `
                        <div style="display:flex; gap:15px; margin-bottom:15px; border-bottom:1px solid #f1f5f9; padding-bottom:10px;">
                            <div style="background:var(--primary); color:white; padding:5px 10px; border-radius:8px; min-width:60px; text-align:center; height:fit-content;">
                                <div style="font-size:0.7rem; opacity:0.8;">TGL</div>
                                <div style="font-weight:800; font-size:0.85rem;">${dateStr}</div>
                            </div>
                            <div style="flex:1;">
                                <div style="display:flex; justify-content:space-between; align-items:start;">
                                    <h5 style="margin:0; font-size:0.95rem; color:var(--text-dark);">${item.nama_santri}</h5>
                                    <span class="th-badge" style="background:#f1f5f9; color:var(--primary); font-size:0.65rem;">${item.kegiatan}</span>
                                </div>
                                <div style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">
                                    <i class="fas fa-chalkboard-teacher" style="font-size:0.7rem;"></i> ${item.ustadz || 'Ustadz'} 
                                    <span style="margin:0 8px; opacity:0.3;">|</span>
                                    <i class="fas fa-star" style="color:#eab308; font-size:0.7rem;"></i> Nilai: <strong>${item.nilai || 0}</strong>
                                    <span style="margin:0 8px; opacity:0.3;">|</span>
                                    <i class="fas fa-clipboard-check" style="font-size:0.7rem;"></i> Absen: <strong>${item.kehadiran || '-'}</strong>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        // 2. Render Chart for Attendance
        const chartCanvas = document.getElementById('pendidikanChart');
        if (chartCanvas && eduList.length > 0) {
            const attendance = { 'Hadir': 0, 'Sakit': 0, 'Izin': 0, 'Alpha': 0 };
            eduList.forEach(item => {
                if (item.kehadiran && attendance.hasOwnProperty(item.kehadiran)) {
                    attendance[item.kehadiran]++;
                } else if (item.kehadiran) {
                    attendance['Hadir'] = (attendance['Hadir'] || 0) + 1;
                }
            });

            if (this.eduChartInstance) this.eduChartInstance.destroy();
            const ctx = chartCanvas.getContext('2d');

            this.eduChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(attendance),
                    datasets: [{
                        data: Object.values(attendance),
                        backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } }
                    },
                    layout: { padding: 20 }
                }
            });
        }
    },

    renderKesehatanDashboard(list) {
        // Stats
        const today = new Date().toISOString().split('T')[0];
        const sickToday = list.filter(item => item.tanggal === today).length;
        const dirawat = list.filter(item => item.status && item.status.includes('Dirawat')).length;

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };
        setVal('stats-kesehatan-harian', sickToday);
        setVal('stats-kesehatan-dirawat', dirawat);

        // List
        const container = document.getElementById('recent-kesehatan-list');
        if (container) {
            const recent = [...list].sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0)).slice(0, 10);
            if (recent.length === 0) {
                container.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Belum ada data kesehatan.</td></tr>';
            } else {
                const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-';
                container.innerHTML = recent.map(item => `
                     <tr>
                         <td>${formatDate(item.tanggal)}</td>
                         <td style="font-weight:600;">${item.nama_santri}</td>
                         <td>${item.keluhan || '-'}</td>
                         <td>${item.diagnosa || item.tindakan || '-'}</td>
                         <td><span class="badge" style="background:#fce7f3; color:#db2777; padding:2px 6px; font-size:0.75rem; border-radius:4px;">${item.status || 'Sakit'}</span></td>
                     </tr>
                 `).join('');
            }
        }
    },

    renderMiuStats(miuList) {
        const container = document.getElementById('miu-kelas-dist');
        if (!container) return;

        const kelasCount = {};
        miuList.forEach(s => {
            const k = s.kelas || 'Belum Ditentukan';
            kelasCount[k] = (kelasCount[k] || 0) + 1;
        });

        const sortedKelas = Object.keys(kelasCount).sort();

        container.innerHTML = sortedKelas.map(k => `
            <div style="display:flex; justify-content:space-between; margin-bottom:5px; padding:5px 0; border-bottom:1px solid #f1f5f9;">
                <span style="color:#475569;">${k}</span>
                <span style="font-weight:700; color:var(--gold);">${kelasCount[k]} Siswa</span>
            </div>
        `).join('');
    },

    renderBendaharaDashboard(list) {
        // 1. Chart Arus Kas
        const canvas = document.getElementById('bendaharaChart');
        if (canvas) {
            // Group by Month
            const masukPerMonth = Array(12).fill(0);
            const keluarPerMonth = Array(12).fill(0);

            list.forEach(item => {
                if (item.tanggal) {
                    const m = new Date(item.tanggal).getMonth();
                    const val = parseInt(item.nominal || 0);
                    if (item.jenis_transaksi === 'Masuk') masukPerMonth[m] += val;
                    else if (item.jenis_transaksi === 'Keluar') keluarPerMonth[m] += val;
                }
            });

            if (this.bendaharaChartInstance) this.bendaharaChartInstance.destroy();
            const ctx = canvas.getContext('2d');
            this.bendaharaChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
                    datasets: [
                        { label: 'Pemasukan', data: masukPerMonth, backgroundColor: '#10b981', borderRadius: 4 },
                        { label: 'Pengeluaran', data: keluarPerMonth, backgroundColor: '#ef4444', borderRadius: 4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } },
                    scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }
                }
            });
        }

        // 2. Recent List
        const container = document.getElementById('recent-bendahara-list');
        if (container) {
            const recent = [...list].sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0)).slice(0, 10);
            if (recent.length === 0) {
                container.innerHTML = '<p style="text-align:center; color:#9cb3c9; padding:20px;">Belum ada transaksi.</p>';
            } else {
                container.innerHTML = recent.map(item => {
                    const isIn = item.jenis_transaksi === 'Masuk';
                    const color = isIn ? '#16a34a' : '#dc2626';
                    const icon = isIn ? 'arrow-down' : 'arrow-up';
                    return `
                     <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1f5f9; padding:10px 0;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="width:32px; height:32px; border-radius:50%; background:${color}20; color:${color}; display:flex; align-items:center; justify-content:center;">
                                <i class="fas fa-${icon}" style="font-size:0.8rem; transform: ${isIn ? 'rotate(45deg)' : 'rotate(45deg)'}"></i>
                            </div>
                            <div>
                                <div style="font-weight:600; font-size:0.9rem;">${item.deskripsi || item.kategori}</div>
                                <div style="font-size:0.75rem; color:#64748b;">${new Date(item.tanggal).toLocaleDateString('id-ID')}</div>
                            </div>
                        </div>
                        <div style="font-weight:700; color:${color}; font-size:0.9rem;">
                            ${isIn ? '+' : '-'} Rp ${parseInt(item.nominal || 0).toLocaleString()}
                        </div>
                     </div>
                     `;
                }).join('');
            }
        }
    },

    renderKeuanganDashboard(list) {
        // 1. Chart trend pembayaran
        const canvas = document.getElementById('keuanganChart');
        if (canvas) {
            const monthly = Array(12).fill(0);
            list.forEach(item => {
                if (item.tanggal) {
                    const m = new Date(item.tanggal).getMonth();
                    monthly[m] += parseInt(item.nominal || 0);
                }
            });

            if (this.keuanganChartInstance) this.keuanganChartInstance.destroy();
            const ctx = canvas.getContext('2d');
            this.keuanganChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
                    datasets: [{
                        label: 'Total Pembayaran',
                        data: monthly,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true, tension: 0.4
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            });
        }

        // 2. Recent List
        const container = document.getElementById('recent-keuangan-list');
        if (container) {
            const recent = [...list].sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0)).slice(0, 10);
            if (recent.length === 0) {
                container.innerHTML = '<p style="text-align:center; color:#9cb3c9; padding:20px;">Belum ada pembayaran.</p>';
            } else {
                container.innerHTML = recent.map(item => `
                     <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1f5f9; padding:10px 0;">
                        <div>
                             <div style="font-weight:600; font-size:0.9rem;">${item.nama_santri}</div>
                             <div style="font-size:0.75rem; color:#64748b;">${item.jenis_pembayaran || 'Syahriah'} - ${new Date(item.tanggal).toLocaleDateString('id-ID')}</div>
                        </div>
                        <div style="font-weight:700; color:#3b82f6; font-size:0.9rem;">
                            Rp ${parseInt(item.nominal || 0).toLocaleString()}
                        </div>
                     </div>
                 `).join('');
            }
        }
    }
};
