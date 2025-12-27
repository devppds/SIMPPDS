export const Router = {
    currentView: null,
    currentAction: null,
    modules: {},

    registerModule(name, moduleObj) {
        this.modules[name] = moduleObj;
    },

    async navigate(viewKey, actionKey = null, clickedEl = null) {
        console.log(`Router: Navigating to ${viewKey} [Action: ${actionKey}]`);
        this.currentAction = actionKey;

        // 1. Switch View Visibility
        this.switchViewVisibility(viewKey);

        // 2. Set Contextual Permissions (View-Only or Edit)
        const { Auth } = await import('./auth.js');
        if (Auth) Auth.updateBodyPermissions(viewKey);

        // 3. Handle Module Logic
        if (this.modules[viewKey] && this.modules[viewKey].init) {
            await this.modules[viewKey].init(actionKey);
        }

        // 3. Update Sidebar Active State
        this.updateSidebarActive(viewKey, clickedEl);

        // 4. Update Header Title
        this.updateHeaderTitle(viewKey);

        // 5. Close Mobile Sidebar
        if (window.innerWidth <= 1024) {
            document.body.classList.remove('sidebar-open');
        }
    },

    switchViewVisibility(viewKey) {
        document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
        const target = document.getElementById(viewKey + '-view');
        if (target) target.style.display = 'block';
        this.currentView = viewKey;
    },

    updateSidebarActive(viewKey, clickedEl) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

        let activeLink = clickedEl;
        if (!activeLink) {
            activeLink = document.querySelector(`.nav-link[data-view="${viewKey}"]:not(.nav-sub-link)`) ||
                document.querySelector(`.nav-link[data-view="${viewKey}"]`);
        }

        if (activeLink) activeLink.classList.add('active');
    },

    updateHeaderTitle(viewKey) {
        const titleEl = document.getElementById('view-title');
        if (titleEl) {
            const title = viewKey.charAt(0).toUpperCase() + viewKey.slice(1).replace('_', ' ');
            titleEl.textContent = title;
        }
    }
};

window.navigate = (view, action, el) => Router.navigate(view, action, el);
window.logoutSystem = () => {
    if (window.Auth) window.Auth.logout();
    else {
        localStorage.removeItem('sim_session');
        window.location.reload();
    }
};
