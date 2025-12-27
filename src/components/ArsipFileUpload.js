import React, { useState } from 'react';
import { apiCall } from '@/lib/utils';

export default function ArsipFileUpload({ onUploadComplete, currentFile, label = "Upload File" }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 1. Validate Size (Max 15MB)
        const maxSize = 15 * 1024 * 1024; // 15MB in bytes
        if (file.size > maxSize) {
            setError('Ukuran file terlalu besar! Maksimal 15MB per file.');
            return;
        }

        setError('');
        setUploading(true);

        try {
            // 2. Prepare Upload Parameters
            const timestamp = Math.round(new Date().getTime() / 1000);
            const paramsToSign = {
                timestamp,
                folder: 'arsip_dokumen', // Organize in folder
            };

            // Optimize based on file type
            if (file.type === 'application/pdf') {
                // PDF Optimization: Use Cloudinary's quality auto
                paramsToSign.quality = 'auto';
            } else if (file.type.startsWith('image/')) {
                // Image Optimization: Convert to WebP, quality auto
                paramsToSign.format = 'webp';
                paramsToSign.quality = 'auto';
            }

            // 3. Get Signature
            const { signature, apiKey, cloudName } = await apiCall('getCloudinarySignature', 'POST', { data: { paramsToSign } });

            // 4. Upload to Cloudinary
            const fd = new FormData();
            fd.append('file', file);
            fd.append('api_key', apiKey);
            fd.append('timestamp', timestamp);
            fd.append('signature', signature);
            fd.append('folder', 'arsip_dokumen');

            if (file.type === 'application/pdf') {
                fd.append('quality', 'auto');
            } else if (file.type.startsWith('image/')) {
                fd.append('format', 'webp');
                fd.append('quality', 'auto');
            }

            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
                method: 'POST',
                body: fd
            });
            const data = await response.json();

            if (data.secure_url) {
                onUploadComplete(data.secure_url);
            } else {
                throw new Error('Gagal mendapatkan URL file.');
            }

        } catch (err) {
            console.error(err);
            setError('Gagal mengupload file. Silakan coba lagi.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="form-group">
            <label className="form-label">{label}</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                    type="file"
                    className="form-control"
                    onChange={handleFileChange}
                    accept=".pdf,image/*"
                    disabled={uploading}
                />
                {uploading && <span className="spinner-border spinner-border-sm text-primary" role="status"></span>}
            </div>
            {error && <small style={{ color: 'red' }}>{error}</small>}
            {currentFile && !uploading && !error && (
                <div style={{ marginTop: '5px' }}>
                    <a href={currentFile} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm" style={{ fontSize: '0.8rem' }}>
                        <i className="fas fa-paperclip"></i> Lihat File Terupload
                    </a>
                </div>
            )}
        </div>
    );
}
