import { useState, useEffect, useCallback, useRef } from 'react';
import { apiCall } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';

export function useDataManagement(dataType, defaultFormData = {}) {
    const { isAdmin } = useAuth();
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
            // alert only if still mounted
            if (isMounted.current) alert('Gagal memuat data: ' + e.message);
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
            if (isMounted.current) alert(err.message);
        } finally {
            if (isMounted.current) setSubmitting(false);
        }
    };

    const handleDelete = async (id, confirmMsg = 'Hapus data ini?') => {
        if (confirmMsg && !confirm(confirmMsg)) return;
        try {
            await apiCall('deleteData', 'POST', { type: dataType, id });
            if (isMounted.current) loadData();
        } catch (err) {
            if (isMounted.current) alert(err.message);
        }
    };

    const openModal = (item = null) => {
        if (item) {
            setEditId(item.id);
            setFormData({ ...item });
        } else {
            setEditId(null);
            setFormData(defaultFormData);
        }
        setIsModalOpen(true);
    };

    const openView = (item) => {
        setViewData(item);
        setIsViewModalOpen(true);
    };

    return {
        data,
        setData,
        loading,
        setLoading,
        search,
        setSearch,
        submitting,
        isModalOpen,
        setIsModalOpen,
        isViewModalOpen,
        setIsViewModalOpen,
        viewData,
        editId,
        formData,
        setFormData,
        loadData,
        handleSave,
        handleDelete,
        openModal,
        openView,
        isAdmin // Convenience pass-through
    };
}
