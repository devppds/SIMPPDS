import { Router } from './js/core/router.js';
import { apiCall } from './js/core/api.js';
import { UI } from './js/core/ui.js';

// Import All Modules
import { DashboardModule } from './js/modules/dashboard.js';
import { SantriModule } from './js/modules/santri.js';
import { UstadzModule } from './js/modules/ustadz.js';
import { PengurusModule } from './js/modules/pengurus.js';
import { KeamananModule } from './js/modules/keamanan.js';
import { PendidikanModule } from './js/modules/pendidikan.js';
import { KeuanganModule } from './js/modules/keuangan.js';
import { Arus_kasModule } from './js/modules/arus_kas.js';
import { KamarModule } from './js/modules/kamar.js';
import { KeamananRegModule } from './js/modules/keamanan_reg.js';
import { KesehatanModule } from './js/modules/kesehatan.js';
import { IzinModule } from './js/modules/izin.js';
import { BarangSitaanModule } from './js/modules/barang_sitaan.js';
import { Jenis_tagihanModule } from './js/modules/jenis_tagihan.js';
import { LaporanModule } from './js/modules/laporan.js';
import { ArsiparisModule } from './js/modules/arsiparis.js';
import { MadrasahMiuModule } from './js/modules/madrasah_miu.js';
import { AbsensiFormalModule } from './js/modules/absensi_formal.js';
import { LayananAdminModule } from './js/modules/layanan_admin.js';
// import { KasUnitModule } from './js/modules/kas_unit.js';
import { LayananInfoModule } from './js/modules/layanan_info.js';
import { SantriListModule } from './js/modules/santri_list.js';
import { SettingsModule } from './js/modules/settings.js';
import { Auth } from './js/core/auth.js';

// Register all modules to router
Router.registerModule('dashboard', DashboardModule);
Router.registerModule('santri', SantriModule);
Router.registerModule('ustadz', UstadzModule);
Router.registerModule('pengurus', PengurusModule);
Router.registerModule('madrasah_miu', MadrasahMiuModule);
Router.registerModule('keamanan', KeamananModule);
Router.registerModule('pendidikan', PendidikanModule);
Router.registerModule('keuangan', KeuanganModule);
Router.registerModule('arus_kas', Arus_kasModule);
Router.registerModule('kamar', KamarModule);
Router.registerModule('keamanan_reg', KeamananRegModule);
Router.registerModule('kesehatan', KesehatanModule);
Router.registerModule('izin', IzinModule);
Router.registerModule('barang_sitaan', BarangSitaanModule);
Router.registerModule('jenis_tagihan', Jenis_tagihanModule);
Router.registerModule('laporan', LaporanModule);
Router.registerModule('arsiparis', ArsiparisModule);
Router.registerModule('absensi_formal', AbsensiFormalModule);
Router.registerModule('layanan_admin', LayananAdminModule);
// Router.registerModule('kas_unit', KasUnitModule);
Router.registerModule('layanan_info', LayananInfoModule);
Router.registerModule('santri_list', SantriListModule);
Router.registerModule('settings', SettingsModule);

// --- GLOBAL BINDINGS (Safe Early Execution) ---
window.handleGlobalAction = async (moduleName, action, id) => {
    console.log(`GlobalAction: ${moduleName} ${action} ${id}`);
    const module = Router.modules[moduleName];
    if (!module || !module.dataMap[id]) return;

    const rowData = module.dataMap[id];
    const rowDataStr = encodeURIComponent(JSON.stringify(rowData));

    if (action === 'detail') await UI.viewDetail(moduleName, rowDataStr);
    if (action === 'edit') await UI.prepareEdit(moduleName, id, rowDataStr);
};

window.viewDetail = (t, d) => UI.viewDetail(t, d);
window.prepareEdit = (t, i, d) => UI.prepareEdit(t, i, d);
window.openForm = (t) => UI.openForm(t);
window.deleteItem = (t, i) => UI.deleteItem(t, i);
window.closeModal = (id) => UI.closeModal(id);

window.exportData = async (type) => {
    console.log(`Exporting: ${type}`);
    const module = Router.modules[type];

    // Check if the module has its own exportData method
    if (module && typeof module.exportData === 'function') {
        module.exportData();
        return;
    }

    // Generic Export Logic if module doesn't have custom one
    try {
        const rows = await apiCall('getData', 'GET', { type });
        if (!rows || rows.length === 0) {
            alert("Tidak ada data untuk diekspor");
            return;
        }

        const dataToExport = rows.map(row => {
            const clean = {};
            Object.keys(row).forEach(key => {
                if (['id', 'created_at', 'foto', 'foto_santri', 'foto_ustadz', 'foto_pengurus'].includes(key)) return;
                let val = row[key];
                if (key.includes('tanggal') || key === 'tanggal') val = UI.formatDate(val);
                clean[key.replace(/_/g, ' ').toUpperCase()] = val || "-";
            });
            return clean;
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data");
        XLSX.writeFile(wb, `Export_${type}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
        console.error("Export failed", e);
        alert("Gagal mengekspor data: " + e.message);
    }
};

window.apiCall = apiCall;

window.handleSantriAction = (id, status) => {
    const row = SantriModule.dataMap[id];
    if (!row) return;
    SantriModule.handleAction(id, status, encodeURIComponent(JSON.stringify(row)));
};

window.toggleMutasiFields = (v) => SantriModule.toggleMutasiFields(v);
window.SantriModule = SantriModule;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log('App: Booting Modular Architecture...');

    Auth.init(); // Initialize PIN Access

    await loadComponents(); // Wait for Header & Sidebar

    // If user is already authenticated, re-apply permissions to newly loaded sidebar
    // If user is already authenticated, re-apply permissions to newly loaded sidebar
    // Auth module handles this internally via waitForSidebar
    if (window.Auth && window.Auth.user) {
        window.Auth.applyRole(window.Auth.user.role);
    }

    // Load default view
    Router.navigate('dashboard', 'dashboard');

    // Global function bindings
    window.toggleSidebar = () => {
        const isMobile = window.innerWidth <= 1024;
        document.body.classList.toggle(isMobile ? 'sidebar-open' : 'sidebar-collapsed');
    };
});

async function loadComponents() {
    try {
        // Load Sidebar
        const sidebarRes = await fetch('components/sidebar.html');
        if (sidebarRes.ok) {
            const sidebarHtml = await sidebarRes.text();
            // We need to inject this into a container, but currently index.html has <aside id="sidebar"> directly.
            // We will change index.html to have <div id="sidebar-container"></div> later.
            // For now, let's assume we will replace the container content.
            const sidebarContainer = document.getElementById('sidebar-container');
            if (sidebarContainer) {
                sidebarContainer.innerHTML = sidebarHtml;
            }
        }

        // Load Header
        const headerRes = await fetch('components/header.html');
        if (headerRes.ok) {
            const headerHtml = await headerRes.text();
            const headerContainer = document.getElementById('header-container');
            if (headerContainer) {
                headerContainer.innerHTML = headerHtml;
                // Re-init dynamic header elements
                const now = new Date();
                const year = now.getFullYear();
                const displayTa = document.getElementById('display-ta');
                if (displayTa) displayTa.textContent = `${year}/${year + 1}`;
                const badgeContainer = document.getElementById('badge-ta-container');
                if (badgeContainer) badgeContainer.style.display = 'inline-flex';
            }
        }

        // Load Footer
        const footerRes = await fetch('components/footer.html');
        if (footerRes.ok) {
            const footerHtml = await footerRes.text();
            const footerContainer = document.getElementById('footer-container');
            if (footerContainer) {
                footerContainer.innerHTML = footerHtml;
                // Update Footer Year
                const footerYear = document.getElementById('footer-year');
                if (footerYear) footerYear.textContent = new Date().getFullYear();
            }
        }

        // Re-initialize UI events for new elements (nav links etc)
        setupUI();

    } catch (e) {
        console.error("Failed to load components", e);
    }
}

function setupUI() {
    const dashboardMain = document.getElementById('dashboard-main');
    if (dashboardMain) dashboardMain.style.display = 'flex';

    // Update Academic Year & Welcome Message
    const now = new Date();
    const year = now.getFullYear();
    const displayTa = document.getElementById('display-ta');
    const welcomeMsg = document.getElementById('welcome-msg');

    if (displayTa) displayTa.textContent = `${year}/${year + 1}`;
    if (welcomeMsg) welcomeMsg.textContent = 'Selamat Datang di Sistem Informasi Pondok';

    const badgeContainer = document.getElementById('badge-ta-container');
    if (badgeContainer) badgeContainer.style.display = 'inline-flex';

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            const view = this.getAttribute('data-view');
            const action = this.getAttribute('data-action');
            const isSubItem = this.classList.contains('nav-sub-link');

            // Submenu Logic
            const parentItem = this.closest('.nav-item');
            const submenu = parentItem ? parentItem.querySelector('.nav-item-submenu, .nav-sub-menu') : null;
            const arrow = this.querySelector('.arrow, .dropdown-arrow');

            if (submenu) {
                // If it's a parent link with a submenu
                const isOpened = submenu.classList.contains('open');

                // Toggle only if it's not already open or if clicking specifically to close
                if (!isOpened) {
                    // Close others
                    document.querySelectorAll('.nav-item-submenu.open').forEach(el => el.classList.remove('open'));
                    document.querySelectorAll('.dropdown-arrow.rotate').forEach(el => el.classList.remove('rotate'));

                    submenu.classList.add('open');
                    if (arrow) arrow.classList.add('rotate');
                } else if (!isSubItem && (!view || view === 'dashboard')) { // Only close if it's the parent link itself and it's already open
                    // Toggle off if clicking the parent again
                    submenu.classList.remove('open');
                    if (arrow) arrow.classList.remove('rotate');
                }
            } else if (!isSubItem) {
                // Clicking a top-level link that has NO submenu
                document.querySelectorAll('.nav-item-submenu.open').forEach(el => el.classList.remove('open'));
                document.querySelectorAll('.dropdown-arrow.rotate').forEach(el => el.classList.remove('rotate'));
            }

            if (view) {
                e.preventDefault();
                Router.navigate(view, action, this);
            }
        });
    });

    // Global Error Proofing: Event Delegation for dynamic content
    document.body.addEventListener('click', function (e) {
        // Cek apakah yang diklik adalah tombol dengan attribute onclick tertentu yang mungkin gagal
        // Namun, karena onclick attribute dieksekusi browser otomatis, kita hanya perlu memastikan fungsi global tersedia.
        // Jika browser gagal mengeksekusi onclick (karena fungsi not defined), event listener ini tidak bisa memperbaikinya secara langsung
        // TAPI, kita bisa menangkap tombol spesifik yang kita tahu sering error.

        const btn = e.target.closest('button');
        if (!btn) return;

        // Fallback untuk tombol Tambah
    });

    window.openForm = async (type, prefill = {}) => {
        // Auto-detect unit from active module if not provided
        if (window.Router && window.Router.modules && window.Router.modules[type]) {
            const module = window.Router.modules[type];
            if (module.currentUnit && !prefill.unit) {
                prefill.unit = module.currentUnit;
            }
        }

        await UI.openForm(type, prefill);

        // NEW: Trigger setupFormLogic if module has it
        if (window.Router && window.Router.modules && window.Router.modules[type]) {
            const module = window.Router.modules[type];
            if (typeof module.setupFormLogic === 'function') {
                console.log(`OpenForm: Triggering setupFormLogic for ${type}`);
                setTimeout(() => module.setupFormLogic(), 300);
            }
        }
    };

    // Form Submission Handler
    const dynamicForm = document.getElementById('dynamic-form');
    if (dynamicForm) {
        dynamicForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const type = this.getAttribute('data-type');
            const formData = {};
            const inputs = this.querySelectorAll('input, select, textarea');
            const processingPromises = [];

            inputs.forEach(input => {
                if (input.type === 'file' && input.files.length > 0) {
                    const file = input.files[0];
                    processingPromises.push(new Promise(resolve => {
                        const reader = new FileReader();
                        reader.onload = (re) => { formData[input.name] = re.target.result; resolve(); };
                        reader.readAsDataURL(file);
                    }));
                } else if (input.type !== 'submit' && input.type !== 'file' && input.name) {
                    let val = input.value;
                    // AUTO-CAPITALIZE: All text inputs to Title Case
                    if (input.type === 'text' || input.tagName === 'TEXTAREA') {
                        val = val.split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                            .join(' ');
                    }
                    formData[input.name] = val;
                }
            });

            await Promise.all(processingPromises);

            // AUTO-TIMESTAMP for Non-Aktif
            if ((type === 'ustadz' || type === 'pengurus') && formData.status === 'Non-Aktif') {
                if (!formData.tanggal_nonaktif) {
                    formData.tanggal_nonaktif = new Date().toISOString().split('T')[0];
                }
            } else if ((type === 'ustadz' || type === 'pengurus') && formData.status === 'Aktif') {
                formData.tanggal_nonaktif = ''; // Reset if reactivated
            }

            if (formData.row_index) formData.id = formData.row_index;

            try {
                await apiCall('saveData', 'POST', { type, data: formData });

                // NEW: Trigger afterSave hook if module has it (for unit cash recording)
                const module = Router.modules[type];
                if (module && typeof module.afterSave === 'function') {
                    await module.afterSave(formData);
                }

                UI.closeModal('form-modal');
                // Local refresh: only reload the view we are currently on
                if (Router.modules[Router.currentView]) {
                    Router.navigate(Router.currentView, Router.currentAction);
                }
            } catch (err) {
                alert('Gagal: ' + err.message);
            }
        });
    }
}
