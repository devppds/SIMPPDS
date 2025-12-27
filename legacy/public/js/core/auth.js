
export const Auth = {
    user: null,

    init() {
        // Expose globally
        window.Auth = this;

        const overlay = document.getElementById('login-overlay');
        const form = document.getElementById('login-form');
        const session = localStorage.getItem('sim_session');

        if (session) {
            try {
                this.user = JSON.parse(session);
                if (overlay) overlay.style.display = 'none';

                // Wait for sidebar to load, then apply role
                // Since sidebar loads async, we might need a MutationObserver or a callback mechanism.
                // For now, we rely on the fact that sidebar loads via fetch. 
                // We will hook into the global 'sidebarLoaded' event if exists, or poll.
                this.waitForSidebar(() => this.applyRole(this.user.role));

            } catch (e) {
                console.error("Auth: Session parse error", e);
                localStorage.removeItem('sim_session');
                if (overlay) overlay.style.display = 'flex';
            }
        } else {
            if (overlay) overlay.style.display = 'flex';
        }

        if (form) {
            form.onsubmit = (e) => this.handleLogin(e);
        }
    },

    waitForSidebar(callback) {
        const check = () => {
            if (document.querySelector('#sidebar nav')) {
                callback();
            } else {
                setTimeout(check, 100);
            }
        };
        check();
    },

    async handleLogin(e) {
        e.preventDefault();
        const role = document.getElementById('login-role').value;
        const pass = document.getElementById('login-password').value;
        const feedback = document.getElementById('login-feedback');
        const submitBtn = e.target.querySelector('button[type="submit"]');
        let originalBtnText = "";

        console.log(`Auth: Attempting login for role: ${role}`);

        if (submitBtn) {
            originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
            submitBtn.disabled = true;
        }

        const validPassLegacy = {
            'admin': 'admin123',
            'keamanan': 'aman123',
            'pendidikan': 'didik123',
            'kesehatan': 'sehat123',
            'bendahara': 'uang123',
            'sekretariat': 'sekret123',
            'jamiyyah': 'jam123'
        };

        try {
            let user = null;

            // 1. Attempt Database Login
            try {
                const res = await fetch('/api?action=login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: role, password: pass })
                });
                const data = await res.json();
                if (res.ok && data.user) {
                    user = data.user;
                    console.log("Auth: DB Login Success");
                } else if (res.status === 401) {
                    console.warn("Auth: DB Login Failed (401)");
                }
            } catch (apiErr) {
                console.warn("Auth: API Login failed or unavailable, trying legacy...", apiErr);
            }

            // 2. Fallback to Legacy if DB failed
            if (!user) {
                if (pass === validPassLegacy[role] || pass === 'demo' || pass === 'admin123') {
                    console.log("Auth: Legacy/Demo Login used");
                    user = { role: role, username: role, name: role.toUpperCase(), isLegacy: true };
                }
            }

            if (user) {
                // LOGGED IN
                user.loggedInAt = new Date();
                this.user = user;
                localStorage.setItem('sim_session', JSON.stringify(this.user));

                document.getElementById('login-overlay').style.display = 'none';
                this.applyRole(user.role);
                feedback.textContent = '';
                this.redirectBasedOnRole(user.role);
                console.log("Auth: Login Redirected");
            } else {
                throw new Error("Password salah! (Gunakan password standar atau 'demo')");
            }

        } catch (err) {
            console.error("Auth: Login Error", err);
            feedback.textContent = err.message;
            const card = document.querySelector('.login-card');
            if (card) {
                card.classList.add('shake');
                setTimeout(() => card.classList.remove('shake'), 500);
            }
        } finally {
            if (submitBtn) {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        }
    },

    logout() {
        localStorage.removeItem('sim_session');
        window.location.reload();
    },

    applyRole(role) {
        console.log("Applying Role:", role);
        const items = document.querySelectorAll('[data-allowed-roles]');
        items.forEach(el => {
            const allowed = el.getAttribute('data-allowed-roles').split(',');
            if (allowed.includes(role)) {
                el.style.display = ''; // Default display (usually block or flex)
            } else {
                el.style.display = 'none';
            }
        });

        const profile = document.getElementById('user-role-display');
        const profileHeader = document.getElementById('user-role-display-header');
        if (profile) profile.textContent = 'SEKSI: ' + role.toUpperCase();
        if (profileHeader) profileHeader.textContent = role.toUpperCase();
    },

    redirectBasedOnRole(role) {
        if (role === 'admin') {
            if (window.navigate) window.navigate('dashboard');
        } else {
            // Check if there is a specific dashboard
            const dashboardAction = role + '_dashboard';
            // We use navigate('dashboard') generally, but passing specific action for dashboard.js
            // Our dashboard.js handles logic based on action.
            // But main nav is data-view="dashboard". 
            // We can navigate to specific views instead.

            if (role === 'keamanan' || role === 'pendidikan' || role === 'kesehatan') {
                // Since Phase 2, we have specific stats on main dashboard. 
                // But navigating to 'dashboard' shows Main Overview.
                // We should probably filter Main Overview too?
                if (window.navigate) window.navigate('dashboard');
                // The dashboard implementation in dashboard.js filters based on action.
                // If we are just viewing 'dashboard' view, it shows all. 
                // We might need to update dashboard.js to respect Auth.user.role.
            } else {
                if (window.navigate) window.navigate('dashboard');
            }
        }
    },

    canEdit(module) {
        if (!this.user) return false;
        if (this.user.role === 'admin') return true;

        // Define permission mapping
        const perms = {
            'keamanan': ['keamanan', 'keamanan_reg', 'santri_list'],
            'pendidikan': ['pendidikan', 'absensi_formal', 'santri_list'],
            'kesehatan': ['kesehatan', 'santri_list'],
            'bendahara': ['bendahara', 'keuangan', 'arus_kas', 'layanan_info'],
            'sekretariat': ['santri', 'surat', 'santri_list', 'layanan_admin', 'kas_unit'],
            'jamiyyah': ['santri_list', 'layanan_admin', 'kas_unit'],
            'madrasah_miu': ['madrasah_miu']
        };

        const allowed = perms[this.user.role] || [];
        return allowed.includes(module) || allowed.some(p => module.startsWith(p));
    },

    updateBodyPermissions(viewKey) {
        console.log(`Auth: Updating permissions for view: ${viewKey}`);
        const canEdit = this.canEdit(viewKey);
        // We can add logic here to hide/show specific elements if needed
        // but most items are already handled by applyRole via data-allowed-roles.
    }
};
