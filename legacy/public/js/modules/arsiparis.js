import { UI } from '../core/ui.js';
import { apiCall } from '../core/api.js';

export const ArsiparisModule = {
    async init() {
        const titleEl = document.getElementById('view-title');
        if (titleEl) titleEl.textContent = 'Arsiparis & Digital File';

        // Ensure the view is visible
        const viewEl = document.getElementById('arsiparis-view');
        if (viewEl) viewEl.style.display = 'block';

        // Bind Search & Filter
        const searchInput = document.getElementById('search-arsiparis');
        if (searchInput) searchInput.oninput = () => this.loadData(searchInput.value, document.getElementById('filter-kategori-arsiparis').value);

        const filterCat = document.getElementById('filter-kategori-arsiparis');
        if (filterCat) filterCat.onchange = () => this.loadData(document.getElementById('search-arsiparis').value, filterCat.value);

        this.setupEvents();
        await this.loadData();
    },

    setupEvents() {
        const form = document.getElementById('arsiparis-form');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                await this.handleUpload(e);
            };
        }
    },

    async loadData(search = '', category = '') {
        const rows = await UI.loadTableData('arsiparis', (data) => {
            let filtered = data;
            if (search) {
                filtered = filtered.filter(r => (r.nama_dokumen || '').toLowerCase().includes(search.toLowerCase()));
            }
            if (category) {
                filtered = filtered.filter(r => r.kategori === category);
            }
            return filtered;
        });

        this.render(rows);
    },

    render(rows) {
        const tbody = document.getElementById('arsiparis-tbody');
        if (!tbody) return;

        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:50px;color:var(--text-muted);">Tidak ada dokumen ditemukan.</td></tr>';
            return;
        }

        tbody.innerHTML = rows.map(row => {
            // Escape URL for safe HTML attribute usage
            const safeUrl = row.file_url ? row.file_url.replace(/'/g, "\\'") : '';
            return `
                <tr>
                    <td>${UI.formatDate(row.tanggal_upload)}</td>
                    <td><strong>${row.nama_dokumen}</strong></td>
                    <td><span class="th-badge" style="background:#e0f2fe; color:#0369a1;">${row.kategori}</span></td>
                    <td>${row.pj || '-'}</td>
                    <td>
                        <div style="display:flex; gap:8px;">
                            <button class="btn btn-secondary btn-action" onclick="ArsiparisModule.viewFile('${safeUrl}')" title="Lihat">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-secondary btn-action" onclick="ArsiparisModule.downloadFile('${safeUrl}', '${row.nama_dokumen.replace(/'/g, "")}')" title="Download">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="btn btn-secondary btn-action" style="color:var(--danger);" onclick="UI.deleteItem('arsiparis', '${row.id}')" title="Hapus">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    openUploadModal() {
        const form = document.getElementById('arsiparis-form');
        if (form) form.reset();
        UI.openModal('arsiparis-modal');
    },

    async handleUpload(e) {
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const fileInput = document.getElementById('arsiparis-file-input');

        if (!fileInput.files.length) {
            alert('Pilih file terlebih dahulu');
            return;
        }

        const file = fileInput.files[0];
        // Allow up to 20 MB
        if (file.size > 20 * 1024 * 1024) {
            alert('Ukuran file maksimal 20 MB');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sedang Mengunggah...';

            // 1. Dapatkan signature dari backend
            const folder = `PPDS/Arsip/${form.kategori.value}/${new Date().getFullYear()}`;
            const sigRes = await apiCall('getCloudinarySignature', 'GET', { folder });
            if (!sigRes.signature) throw new Error('Gagal mendapatkan signature upload');

            // 2. Upload langsung ke Cloudinary (Signed)
            // Hilangkan /auto/ dari URL agar resource_type dibaca dari body
            const cloudUrl = `https://api.cloudinary.com/v1_1/${sigRes.cloud_name}/upload`;
            const payload = new FormData();
            payload.append('file', file);
            payload.append('api_key', sigRes.api_key);
            payload.append('timestamp', sigRes.timestamp);
            payload.append('signature', sigRes.signature);
            payload.append('folder', folder);
            payload.append('access_mode', 'public');
            payload.append('use_filename', 'true');
            payload.append('unique_filename', 'true');
            payload.append('resource_type', 'auto'); // WAJIB ADA karena masuk di signature

            const cloudRes = await fetch(cloudUrl, {
                method: 'POST',
                body: payload
            });

            if (!cloudRes.ok) {
                const errData = await cloudRes.json();
                throw new Error(errData.error?.message || 'Upload ke Cloudinary gagal');
            }

            const cloudData = await cloudRes.json();
            const fileUrl = cloudData.secure_url;

            // 3. Simpan URL ke Database kami
            const formData = {
                tanggal_upload: new Date().toISOString().split('T')[0],
                nama_dokumen: form.nama_dokumen.value,
                kategori: form.kategori.value,
                keterangan: form.keterangan.value,
                file_url: fileUrl,
                pj: localStorage.getItem('user_name') || 'Admin'
            };

            await apiCall('saveData', 'POST', { type: 'arsiparis', data: formData });

            UI.closeModal('arsiparis-modal');
            await this.loadData();
            alert('Dokumen berhasil diarsip!');
        } catch (err) {
            console.error(err);
            alert('Gagal mengunggah dokumen: ' + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Mulai Unggah';
        }
    },

    viewFile(url) {
        if (!url) return;
        console.log('Viewing file:', url);
        if (url.startsWith('data:')) {
            const win = window.open();
            win.document.write('<iframe src="' + url + '" frameborder="0" style="border:0; top:0; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>');
        } else {
            // Untuk link Cloudinary/External langsung buka di tab baru
            window.open(url, '_blank');
        }
    },

    async downloadFile(url, filename) {
        if (!url) return;
        console.log('Downloading file:', url);

        try {
            let downloadUrl = url;
            let finalFilename = filename || 'Dokumen_Arsip';

            // Jika ini link Cloudinary, tambahkan flag fl_attachment untuk memaksa download
            if (url.includes('cloudinary.com')) {
                // Mendukung resource_type image maupun raw
                if (url.includes('/upload/')) {
                    downloadUrl = url.replace('/upload/', '/upload/fl_attachment/');
                }
            }

            if (url.startsWith('data:')) {
                const parts = url.split(',');
                const mime = parts[0].match(/:(.*?);/)[1];

                // Better Extension Mapping
                const mimeMap = {
                    'application/pdf': 'pdf',
                    'image/jpeg': 'jpg',
                    'image/jpg': 'jpg',
                    'image/png': 'png',
                    'application/msword': 'doc',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
                    'application/vnd.ms-excel': 'xls',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
                };

                const extension = mimeMap[mime] || (mime.split('/')[1] ? mime.split('/')[1].split('.').pop() : 'bin');

                // Add extension if not present
                if (!finalFilename.toLowerCase().endsWith('.' + extension)) {
                    finalFilename += '.' + extension;
                }

                // Convert to Blob for more stable download
                const bstr = atob(parts[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                const blob = new Blob([u8arr], { type: mime });
                downloadUrl = URL.createObjectURL(blob);
            }

            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = finalFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            if (downloadUrl.startsWith('blob:')) {
                setTimeout(() => URL.revokeObjectURL(downloadUrl), 500);
            }
        } catch (err) {
            console.error('Download failed:', err);
            alert('Gagal mendownload file: ' + err.message);
        }
    }
};

window.ArsiparisModule = ArsiparisModule;
