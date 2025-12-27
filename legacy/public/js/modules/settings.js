const SettingsModule = {
    init() {
        console.log("Settings Module Initialized");
        this.render();
    },

    async render() {
        // Load users if admin
        if (window.Auth && window.Auth.user && window.Auth.user.role === 'admin') {
            await this.loadUserList();
        }
    },

    async loadUserList() {
        const tbody = document.getElementById('users-list-body');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Memuat pengguna...</td></tr>';

        try {
            const users = await window.apiCall('getData', 'GET', { type: 'users' });
            if (!users || users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum ada pengguna.</td></tr>';
                return;
            }

            tbody.innerHTML = users.map(u => `
                <tr>
                    <td style="font-weight:600; color:var(--primary-dark);">${u.fullname || '-'}</td>
                    <td><code style="background:var(--bg-light); padding:2px 6px; border-radius:4px;">${u.username}</code></td>
                    <td><span style="font-family:monospace; color:var(--text-muted); font-size:0.8rem;">${u.password_plain || '********'}</span></td>
                    <td><span class="th-badge" style="background:var(--primary-light); color:var(--primary); font-size:0.75rem;">${u.role.toUpperCase()}</span></td>
                    <td>
                        <button class="btn btn-sm" onclick="SettingsModule.deleteUser(${u.id})" style="color:#ef4444; background:none; border:none; padding:5px; transition:all 0.2s;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            console.error("Failed to load users", e);
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Gagal memuat pengguna.</td></tr>';
        }
    },

    openAddUserForm() {
        window.UI.openForm('users');
    },

    async deleteUser(id) {
        if (!confirm("Hapus akun seksi ini?")) return;
        try {
            await window.apiCall('deleteData', 'DELETE', { type: 'users', id: id });
            await this.loadUserList();
        } catch (e) {
            alert("Gagal menghapus: " + e.message);
        }
    },

    async changePassword(btn) {
        const oldP = document.getElementById('set-pass-old').value;
        const newP = document.getElementById('set-pass-new').value;
        const confirmP = document.getElementById('set-pass-confirm').value;

        if (!oldP || !newP) return alert("Harap isi semua kolom");
        if (newP !== confirmP) return alert("Konfirmasi password tidak cocok");
        if (newP.length < 6) return alert("Password baru minimal 6 karakter");

        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Proses...';
        btn.disabled = true;

        try {
            const user = window.Auth.user;
            if (!user) throw new Error("Sesi habis. Silakan login ulang.");

            const res = await fetch('/api?action=changePassword', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: user.username,
                    oldPassword: oldP,
                    newPassword: newP
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal mengubah password");

            alert("Password berhasil diubah! Silakan login ulang.");
            window.Auth.logout();
        } catch (e) {
            alert(e.message);
            console.error(e);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
};

export { SettingsModule };
window.SettingsModule = SettingsModule;
