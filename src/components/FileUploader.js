'use client';

import React, { useState } from 'react';
import { apiCall } from '@/lib/utils';
import { useToast } from '@/lib/ToastContext';

/**
 * FileUploader - Komponen sentral untuk mengunggah file ke Cloudinary
 * @param {string} label - Label tombol (default: 'Unggah File')
 * @param {string} folder - Folder tujuan di Cloudinary (default: 'simppds_uploads')
 * @param {string} currentUrl - URL file saat ini untuk ditampilkan (opsional)
 * @param {function} onUploadSuccess - Callback saat berhasil (menerima URL baru)
 * @param {string} accept - Format file yang diterima (default: 'image/*')
 */
export default function FileUploader({
    label = 'Unggah File',
    folder = 'simppds_uploads',
    currentUrl = '',
    onUploadSuccess,
    accept = 'image/*'
}) {
    const [uploading, setUploading] = useState(false);
    const { showToast } = useToast();

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const timestamp = Math.round(new Date().getTime() / 1000);
            const paramsToSign = { timestamp, folder };

            // Ambil signature dari backend
            const { signature, apiKey, cloudName } = await apiCall('getCloudinarySignature', 'POST', {
                data: { paramsToSign }
            });

            if (!apiKey || !cloudName) {
                throw new Error('Konfigurasi Cloudinary tidak lengkap.');
            }

            const fd = new FormData();
            fd.append('file', file);
            fd.append('api_key', apiKey);
            fd.append('timestamp', timestamp);
            fd.append('signature', signature);
            fd.append('folder', folder);

            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${file.type.startsWith('image') ? 'image' : 'raw'}/upload`, {
                method: 'POST',
                body: fd
            });

            const result = await res.json();

            if (result.secure_url) {
                if (onUploadSuccess) onUploadSuccess(result.secure_url);
                showToast("File berhasil diunggah!", "success");
            } else {
                throw new Error(result.error?.message || "Gagal mengunggah ke Cloudinary");
            }
        } catch (err) {
            console.error(err);
            showToast("Upload gagal: " + err.message, "error");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="file-uploader-container" style={{
            display: 'flex',
            gap: '15px',
            alignItems: 'center',
            background: '#f8fafc',
            padding: '12px',
            borderRadius: '12px',
            border: '2px dashed #e2e8f0'
        }}>
            {accept.includes('image') && (
                <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    background: '#fff',
                    border: '1px solid #eee'
                }}>
                    <img
                        src={currentUrl || `https://ui-avatars.com/api/?name=?&background=f1f5f9&color=cbd5e1`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        alt="Preview"
                    />
                </div>
            )}

            <div style={{ flex: 1 }}>
                <label className={`btn ${uploading ? 'btn-disabled' : 'btn-secondary'} btn-sm`} style={{ cursor: uploading ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <i className={uploading ? "fas fa-spinner fa-spin" : "fas fa-cloud-upload-alt"}></i>
                    {uploading ? 'Memproses...' : label}
                    <input
                        type="file"
                        accept={accept}
                        onChange={handleUpload}
                        style={{ display: 'none' }}
                        disabled={uploading}
                    />
                </label>
                {uploading && <small style={{ marginLeft: '10px', color: 'var(--primary)', fontWeight: 600 }}>Mohon tunggu...</small>}
            </div>
        </div>
    );
}
