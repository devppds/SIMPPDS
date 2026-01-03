import { useState, useEffect, useCallback, useRef } from 'react';
import { apiCall } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';

export function useDataManagement(dataType, defaultFormData = {}) {
    const { isAdmin, user } = useAuth(); // Destructure user to get fullname
    const { showToast } = useToast();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState(null);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState(defaultFormData);

    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const loadData = useCallback(async () => {
        if (isMounted.current) setLoading(true);
        try {
            const res = await apiCall('getData', 'GET', { type: dataType });
            if (isMounted.current) setData(res || []);
        } catch (e) {
            console.error(e);
            if (isMounted.current) showToast('Gagal memuat data: ' + e.message, 'error');
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }, [dataType]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSave = async (e, payload = null) => {
        if (e && e.preventDefault) e.preventDefault();
        if (isMounted.current) setSubmitting(true);
        try {
            const dataToSend = payload || formData;
            await apiCall('saveData', 'POST', {
                type: dataType,
                data: editId ? { ...dataToSend, id: editId } : dataToSend
            });
            if (isMounted.current) {
                setIsModalOpen(false);
                loadData();
            }
        } catch (err) {
            if (isMounted.current) showToast(err.message, 'error');
        } finally {
            if (isMounted.current) setSubmitting(false);
        }
    };

    // --- Delete Confirmation State (One Door Pattern) ---
    const [deleteState, setDeleteState] = useState({ isOpen: false, id: null, title: 'Hapus Data?', message: 'Data yang dihapus tidak dapat dikembalikan.' });

    // Helper to open delete confirmation
    const promptDelete = (id, title = undefined, message = undefined) => {
        setDeleteState({
            isOpen: true,
            id,
            title: title || 'Hapus Data?',
            message: message || 'Apakah Anda yakin ingin menghapus data ini secara permanen?'
        });
    };

    // Actual delete execution (called by Modal)
    const confirmDelete = async () => {
        if (!deleteState.id) return;
        setSubmitting(true);
        try {
            await apiCall('deleteData', 'POST', { type: dataType, id: deleteState.id });
            if (isMounted.current) {
                showToast('Data berhasil dihapus', 'success');
                setDeleteState(prev => ({ ...prev, isOpen: false, id: null }));
                loadData();
            }
        } catch (err) {
            if (isMounted.current) showToast(err.message, 'error');
        } finally {
            if (isMounted.current) setSubmitting(false);
        }
    };

    // Legacy/Manual Delete (Updated to not use native confirm by default)
    const handleDelete = async (id, confirmMsg = null) => {
        if (confirmMsg && !confirm(confirmMsg)) return; // Only use native confirm if msg is explicitly provided

        try {
            await apiCall('deleteData', 'POST', { type: dataType, id });
            if (isMounted.current) {
                showToast('Data berhasil dihapus', 'success');
                loadData();
            }
        } catch (err) {
            if (isMounted.current) showToast(err.message, 'error');
        }
    };

    const openModal = (item = null) => {
        if (item) {
            setEditId(item.id);
            setFormData({ ...item });
        } else {
            setEditId(null);

            // ✨ Smart Auto-Fill for Records
            // Automatically fill dates and officer/reporter fields with current context
            const initialData = { ...defaultFormData };
            const userName = user?.fullname || user?.username || '';
            const today = new Date().toISOString().split('T')[0];

            // 1. Fill Date Fields
            const dateFields = ['tanggal', 'tanggal_registrasi', 'tgl_kejadian', 'tgl_lapor'];
            dateFields.forEach(field => {
                if (Object.prototype.hasOwnProperty.call(initialData, field) && !initialData[field]) {
                    initialData[field] = today;
                }
            });

            // 2. Fill Officer Fields
            const officerFields = ['petugas', 'pj', 'ustadz', 'bendahara', 'petugas_penerima', 'petugas_piket', 'petugas_registrasi'];
            if (userName) {
                officerFields.forEach(field => {
                    if (Object.prototype.hasOwnProperty.call(initialData, field)) {
                        initialData[field] = userName;
                    }
                });
            }

            setFormData(initialData);
        }
        setIsModalOpen(true);
    };

    const openView = (item) => {
        setViewData(item);
        setIsViewModalOpen(true);
    };

    return {
        data, setData, loading, setLoading, search, setSearch, submitting,
        isModalOpen, setIsModalOpen, isViewModalOpen, setIsViewModalOpen,
        viewData, editId, formData, setFormData, loadData, handleSave,
        handleDelete, openModal, openView, isAdmin, user,
        // New Exports for "One Door" Delete
        deleteState, setDeleteState, promptDelete, confirmDelete
    };
}
