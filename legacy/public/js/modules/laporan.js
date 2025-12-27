import { UI } from '../core/ui.js';
import { apiCall } from '../core/api.js';
import { Router } from '../core/router.js';

export const LaporanModule = {
    currentMonth: null,

    init() {
        const now = new Date();
        this.currentMonth = now.getMonth() + 1; // 1-12
        const monthSelect = document.getElementById('laporan-month');
        if (monthSelect) monthSelect.value = this.currentMonth;

        // Print Date
        const dateEl = document.getElementById('laporan-print-date');
        if (dateEl) dateEl.textContent = UI.formatDate(new Date().toISOString().split('T')[0]);

        this.loadData();
    },

    goTo(view, action = null) {
        Router.navigate(view, action);
    },

    async exportPDF(btn) {
        if (!this.rawData) return alert("Data belum dimuat.");
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Proses...';
        btn.disabled = true;

        const element = document.getElementById('laporan-canvas');
        const monthNames = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const monthName = monthNames[this.currentMonth] || "";
        const year = new Date().getFullYear();

        const opt = {
            margin: 0,
            filename: `Laporan_Eksekutif_${monthName}_${year}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            // Check if html2pdf is loaded
            if (typeof html2pdf === 'undefined') {
                throw new Error("Library PDF belum dimuat. Coba refresh halaman.");
            }
            await html2pdf().set(opt).from(element).save();
        } catch (e) {
            console.error("PDF Export Error", e);
            alert("Gagal membuat PDF: " + e.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },

    async loadData() {
        const monthSelect = document.getElementById('laporan-month');
        if (monthSelect) this.currentMonth = parseInt(monthSelect.value);

        // Show loading state
        const els = ['laporan-summary-grid', 'laporan-keuangan-detail', 'laporan-pendidikan-detail', 'laporan-keamanan-detail', 'laporan-kesehatan-detail'];
        els.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Memuat Data...</div>';
        });

        const fetchSafe = async (type) => {
            try {
                const res = await apiCall('getData', 'GET', { type });
                return res || [];
            } catch (e) {
                console.warn(`Laporan Partial Fail: ${type}`, e);
                return [];
            }
        };

        try {
            // Parallel Fetching with error handling per request
            const [santri, keuangan, arusKas, keamanan, pendidikan, kesehatan] = await Promise.all([
                fetchSafe('santri'),
                fetchSafe('keuangan'),
                fetchSafe('arus_kas'),
                fetchSafe('keamanan'),
                fetchSafe('pendidikan'),
                fetchSafe('kesehatan')
            ]);

            this.render({ santri, keuangan, arusKas, keamanan, pendidikan, kesehatan });
        } catch (e) {
            console.error("Critical/Unexpected Logic Error in Laporan", e);
            document.getElementById('laporan-summary-grid').innerHTML = `<div style="color:red; text-align:center;">Gagal memuat: ${e.message}</div>`;
        }
    },

    downloadText() {
        if (!this.rawData) return alert("Data belum dimuat. Tunggu sebentar.");

        const { santri, keuangan, arusKas, keamanan, pendidikan, kesehatan } = this.rawData;
        const month = this.currentMonth;
        const monthName = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][month] || "-";
        const year = new Date().getFullYear();

        // Helpers (Mirrored from render)
        const isSelectedMonth = (dateStr) => {
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return (d.getMonth() + 1) === month && d.getFullYear() === year;
        };
        const fmtMoney = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

        // --- CALCULATIONS ---
        const totalSantriAktif = santri.filter(s => !s.status_santri || s.status_santri === 'Aktif').length;

        const keuanganBulan = keuangan.filter(k => isSelectedMonth(k.tanggal));
        const arusKasBulan = arusKas.filter(k => isSelectedMonth(k.tanggal));
        const keamananBulan = keamanan.filter(k => isSelectedMonth(k.tanggal));
        const pendidikanBulan = pendidikan.filter(k => isSelectedMonth(k.tanggal));
        const kesehatanBulan = kesehatan.filter(k => isSelectedMonth(k.tanggal));

        const pemasukan = arusKasBulan.filter(k => k.tipe === 'Masuk').reduce((sum, item) => sum + parseInt(item.nominal || 0), 0);
        const pengeluaran = arusKasBulan.filter(k => k.tipe === 'Keluar').reduce((sum, item) => sum + parseInt(item.nominal || 0), 0);
        const kasBersih = pemasukan - pengeluaran;
        const efisiensi = pemasukan > 0 ? ((kasBersih / pemasukan) * 100).toFixed(1) : 0;

        const berat = keamananBulan.filter(k => k.jenis_pelanggaran === 'Berat').length;
        const sedang = keamananBulan.filter(k => k.jenis_pelanggaran === 'Sedang').length;
        const ringan = keamananBulan.filter(k => k.jenis_pelanggaran === 'Ringan').length;

        const validScores = pendidikanBulan.map(p => parseInt(p.nilai)).filter(n => !isNaN(n));
        const avgScore = validScores.length ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1) : 0;

        const sakit = kesehatanBulan.filter(k => k.status_periksa === 'Sakit' || k.status_periksa === 'Opname').length;

        // --- GENERATE TEXT ---
        const lines = [];
        lines.push("==================================================");
        lines.push("          LAPORAN EKSEKUTIF PIMPINAN");
        lines.push("         PONDOK PESANTREN DARUSSALAM");
        lines.push("==================================================");
        lines.push(`Periode  : ${monthName} ${year}`);
        lines.push(`Dicetak  : ${new Date().toLocaleString('id-ID')}`);
        lines.push("");

        lines.push("[1] RINGKASAN UTAMA");
        lines.push("-------------------");
        lines.push(`Santri Aktif       : ${totalSantriAktif} Santri`);
        lines.push(`Surplus/Defisit    : ${fmtMoney(kasBersih)}`);
        lines.push(`Pelanggaran Berat  : ${berat} Kasus`);
        lines.push(`Efisiensi Anggaran : ${efisiensi}%`);
        lines.push("");

        lines.push("[2] KEUANGAN PONDOK");
        lines.push("-------------------");
        lines.push(`Total Pemasukan    : ${fmtMoney(pemasukan)}`);
        lines.push(`Total Pengeluaran  : ${fmtMoney(pengeluaran)}`);
        lines.push(`Syahriah Lunas     : ${keuanganBulan.filter(k => k.status === 'Lunas').length} Santri`);
        lines.push("");

        lines.push("[3] INDEKS KEAMANAN");
        lines.push("-------------------");
        lines.push(`Pelanggaran Berat  : ${berat}`);
        lines.push(`Pelanggaran Sedang : ${sedang}`);
        lines.push(`Pelanggaran Ringan : ${ringan}`);
        lines.push(`Total Pelanggaran  : ${berat + sedang + ringan}`);
        lines.push("");

        lines.push("[4] KUALITAS PENDIDIKAN");
        lines.push("-----------------------");
        lines.push(`Rata-rata Nilai    : ${avgScore}`);
        lines.push(`Total Kegiatan     : ${pendidikanBulan.length}`);
        lines.push("");

        lines.push("[5] KESEHATAN SANTRI");
        lines.push("--------------------");
        lines.push(`Santri Sakit       : ${sakit}`);
        lines.push(`Total Kunjungan    : ${kesehatanBulan.length}`);
        lines.push("");
        lines.push("==================================================");
        lines.push("           (Akhir Laporan Eksekutif)");
        lines.push("==================================================");

        // Download
        const blob = new Blob([lines.join("\n")], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Laporan_Pimpinan_${monthName}_${year}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },

    render(data) {
        this.rawData = data; // Cache for Text Export
        const { santri, keuangan, arusKas, keamanan, pendidikan, kesehatan } = data;
        const month = this.currentMonth;

        // --- FILTER HELPERS ---
        const isSelectedMonth = (dateStr) => {
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return (d.getMonth() + 1) === month && d.getFullYear() === new Date().getFullYear();
        };

        // --- 1. KEY METRICS (SUMMARY GRID) ---
        // Santri Logic: status_santri is 'Aktif' or undefined (default)
        const totalSantriAktif = santri.filter(s => !s.status_santri || s.status_santri === 'Aktif').length;

        // Filter Data by Month
        const keuanganBulan = keuangan.filter(k => isSelectedMonth(k.tanggal));
        const arusKasBulan = arusKas.filter(k => isSelectedMonth(k.tanggal));
        const keamananBulan = keamanan.filter(k => isSelectedMonth(k.tanggal));
        const pendidikanBulan = pendidikan.filter(k => isSelectedMonth(k.tanggal));
        const kesehatanBulan = kesehatan.filter(k => isSelectedMonth(k.tanggal));

        // Calculations
        const pemasukan = arusKasBulan.filter(k => k.tipe === 'Masuk').reduce((sum, item) => sum + parseInt(item.nominal || 0), 0);
        const pengeluaran = arusKasBulan.filter(k => k.tipe === 'Keluar').reduce((sum, item) => sum + parseInt(item.nominal || 0), 0);
        const kasBersih = pemasukan - pengeluaran;

        const totalPelanggaran = keamananBulan.length;
        const pelanggaranBerat = keamananBulan.filter(k => k.jenis_pelanggaran === 'Berat').length;

        // Render Summary Grid with Click Actions
        const gridEl = document.getElementById('laporan-summary-grid');
        if (gridEl) {
            gridEl.innerHTML = `
                <div class="stat-card" onclick="LaporanModule.goTo('santri')" style="cursor:pointer; background: linear-gradient(135deg, #1e3a8a, #3b82f6); color:white; border:none; transition:transform 0.2s;">
                    <div class="stat-icon" style="background:rgba(255,255,255,0.2); color:white;"><i class="fas fa-users"></i></div>
                    <div>
                        <div class="stat-value" style="color:white;">${totalSantriAktif}</div>
                        <div class="stat-label" style="opacity:0.8; color:white;">Santri Aktif &raquo;</div>
                    </div>
                </div>
                <div class="stat-card" onclick="LaporanModule.goTo('arus_kas', 'rekap_bulanan')" style="cursor:pointer; transition:transform 0.2s;">
                    <div class="stat-icon stat-green"><i class="fas fa-coins"></i></div>
                    <div>
                        <div class="stat-value" style="font-size:1.5rem;">${UI.formatRupiah(kasBersih)}</div>
                        <div class="stat-label">Surplus/Defisit &raquo;</div>
                    </div>
                </div>
                <div class="stat-card" onclick="LaporanModule.goTo('keamanan')" style="cursor:pointer; transition:transform 0.2s;">
                    <div class="stat-icon stat-red"><i class="fas fa-exclamation-triangle"></i></div>
                    <div>
                        <div class="stat-value">${pelanggaranBerat}</div>
                        <div class="stat-label">Pelanggaran Berat &raquo;</div>
                    </div>
                </div>
                <div class="stat-card" onclick="LaporanModule.goTo('arus_kas', 'rekap')" style="cursor:pointer; transition:transform 0.2s;">
                    <div class="stat-icon stat-blue"><i class="fas fa-chart-pie"></i></div>
                    <div>
                        <div class="stat-value">${pemasukan > 0 ? ((kasBersih / pemasukan) * 100).toFixed(1) : 0}%</div>
                        <div class="stat-label">Efisiensi Anggaran &raquo;</div>
                    </div>
                </div>
            `;
        }

        // --- 2. KEUANGAN DETAIL ---
        const finDetailEl = document.getElementById('laporan-keuangan-detail');
        if (finDetailEl) {
            finDetailEl.parentElement.style.cursor = 'pointer';
            finDetailEl.parentElement.onclick = () => this.goTo('keuangan');
            finDetailEl.innerHTML = `
                <table style="width:100%; font-size:0.9rem;">
                    <tr>
                        <td style="padding:8px 0; border-bottom:1px dashed #ddd;">Total Pemasukan</td>
                        <td style="text-align:right; font-weight:700; color:#16a34a;">${UI.formatRupiah(pemasukan)}</td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0; border-bottom:1px dashed #ddd;">Total Pengeluaran</td>
                        <td style="text-align:right; font-weight:700; color:#dc2626;">${UI.formatRupiah(pengeluaran)}</td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0; border-bottom:1px dashed #ddd;">Syahriah Lunas</td>
                        <td style="text-align:right; font-weight:700;">${keuanganBulan.filter(k => k.status === 'Lunas').length} Santri</td>
                    </tr>
                </table>
                <div style="margin-top:10px; text-align:right; font-size:0.8rem; color:var(--primary);">Lihat Detail Keuangan <i class="fas fa-arrow-right"></i></div>
            `;
        }

        // --- 3. KEAMANAN DETAIL ---
        const secDetailEl = document.getElementById('laporan-keamanan-detail');
        if (secDetailEl) {
            secDetailEl.parentElement.style.cursor = 'pointer';
            secDetailEl.parentElement.onclick = () => this.goTo('keamanan');

            const ringan = keamananBulan.filter(k => k.jenis_pelanggaran === 'Ringan').length;
            const sedang = keamananBulan.filter(k => k.jenis_pelanggaran === 'Sedang').length;

            secDetailEl.innerHTML = `
                <div style="display:flex; gap:10px; margin-bottom:10px;">
                    <div style="flex:1; background:#fff; padding:10px; border-radius:8px; text-align:center; border:1px solid #fee2e2;">
                        <div style="font-size:1.5rem; font-weight:800; color:#dc2626;">${pelanggaranBerat}</div>
                        <div style="font-size:0.75rem;">Berat</div>
                    </div>
                    <div style="flex:1; background:#fff; padding:10px; border-radius:8px; text-align:center; border:1px solid #ffedd5;">
                        <div style="font-size:1.5rem; font-weight:800; color:#ea580c;">${sedang}</div>
                        <div style="font-size:0.75rem;">Sedang</div>
                    </div>
                    <div style="flex:1; background:#fff; padding:10px; border-radius:8px; text-align:center; border:1px solid #dbeafe;">
                        <div style="font-size:1.5rem; font-weight:800; color:#2563eb;">${ringan}</div>
                        <div style="font-size:0.75rem;">Ringan</div>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-size:0.85rem; color:var(--text-muted); font-style:italic;">* Data bulan ini</div>
                    <div style="font-size:0.8rem; color:#dc2626;">Lihat Laporan Pelanggaran <i class="fas fa-arrow-right"></i></div>
                </div>
            `;
        }

        // --- 4. PENDIDIKAN DETAIL ---
        const eduDetailEl = document.getElementById('laporan-pendidikan-detail');
        if (eduDetailEl) {
            eduDetailEl.parentElement.style.cursor = 'pointer';
            eduDetailEl.parentElement.onclick = () => this.goTo('pendidikan');

            const validScores = pendidikanBulan.map(p => parseInt(p.nilai)).filter(n => !isNaN(n));
            const avgScore = validScores.length ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1) : 0;
            const totalKegiatan = pendidikanBulan.length;

            eduDetailEl.innerHTML = `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                    <div>
                        <div style="font-size:0.8rem; color:var(--text-muted);">Rata-rata Nilai</div>
                        <div style="font-size:1.4rem; font-weight:700; color:var(--primary);">${avgScore}</div>
                    </div>
                    <div>
                        <div style="font-size:0.8rem; color:var(--text-muted);">Total Kegiatan</div>
                        <div style="font-size:1.4rem; font-weight:700; color:var(--primary);">${totalKegiatan}</div>
                    </div>
                </div>
                <div style="margin-top:10px; text-align:right; font-size:0.8rem; color:var(--primary);">Lihat Laporan Pendidikan <i class="fas fa-arrow-right"></i></div>
            `;
        }

        // --- 5. KESEHATAN DETAIL ---
        const healthDetailEl = document.getElementById('laporan-kesehatan-detail');
        if (healthDetailEl) {
            healthDetailEl.parentElement.style.cursor = 'pointer';
            healthDetailEl.parentElement.onclick = () => this.goTo('kesehatan');

            const sakit = kesehatanBulan.filter(k => k.status_periksa === 'Sakit' || k.status_periksa === 'Opname').length;

            healthDetailEl.innerHTML = `
                <div style="display:flex; align-items:center; gap:1rem;">
                    <i class="fas fa-user-nurse" style="font-size:2rem; color:#10b981;"></i>
                    <div>
                        <div style="font-size:1.1rem; font-weight:700;">${sakit} Santri Sakit</div>
                        <div style="font-size:0.85rem; color:var(--text-muted);">Total kunjungan klinik: ${kesehatanBulan.length}</div>
                    </div>
                </div>
                <div style="margin-top:10px; height:8px; background:#e2e8f0; border-radius:4px; overflow:hidden; display:flex;">
                    <div style="width:${(sakit / Math.max(1, kesehatanBulan.length)) * 100}%; background:#ef4444;"></div>
                    <div style="flex:1; background:#10b981;"></div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:0.7rem; margin-top:4px;">
                    <span>Sakit (${kesehatanBulan.length ? ((sakit / kesehatanBulan.length) * 100).toFixed(0) : 0}%)</span>
                    <span>Sembuh</span>
                </div>
                <div style="margin-top:10px; text-align:right; font-size:0.8rem; color:#16a34a;">Lihat Laporan Kesehatan <i class="fas fa-arrow-right"></i></div>
            `;
        }
    }
};

window.LaporanModule = LaporanModule;
