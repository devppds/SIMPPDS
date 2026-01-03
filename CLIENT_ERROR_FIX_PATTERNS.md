/**
 * Universal Client-Side Error Fix Template
 * 
 * Pola standar untuk mencegah client-side exceptions:
 * 1. Mounted state check
 * 2. Safe data access
 * 3. Consistent hook calls
 * 4. Loading states
 */

// ✅ PATTERN 1: Mounted Check
export function ComponentWithMountedCheck() {
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);
    
    if (!mounted) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <i className="fas fa-circle-notch fa-spin fa-2x" style={{ color: 'var(--primary)' }}></i>
                <p style={{ marginTop: '1rem', color: '#64748b' }}>Memuat...</p>
            </div>
        );
    }
    
    return <div>Content</div>;
}

// ✅ PATTERN 2: Safe Data Access
const safeValue = data?.field || 'default';
const safeArray = Array.isArray(data) ? data : [];
const safeNumber = Number(value) || 0;

// ✅ PATTERN 3: Consistent Hook Calls (Always at top level)
export function ComponentWithHooks() {
    // ✅ All hooks at top
    const { user, config } = useAuth();
    const { canEdit } = usePagePermission();
    const [data, setData] = useState([]);
    
    // ❌ NEVER call hooks conditionally
    // if (someCondition) {
    //     const { user } = useAuth(); // WRONG!
    // }
    
    return <div>Content</div>;
}

// ✅ PATTERN 4: Loading States
export function ComponentWithLoading() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    
    useEffect(() => {
        loadData();
    }, []);
    
    const loadData = async () => {
        setLoading(true);
        try {
            const result = await apiCall('getData');
            setData(result || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) return <LoadingSpinner />;
    
    return <div>{data.map(...)}</div>;
}

// ✅ PATTERN 5: Safe useEffect Dependencies
useEffect(() => {
    // Only run when mounted and dependencies are ready
    if (mounted && filterMonth && filterYear) {
        loadData();
    }
}, [mounted, filterMonth, filterYear]); // Include all dependencies

// ✅ PATTERN 6: Safe Object Access in JSX
<div>
    {user?.fullname || 'Guest'}
    {config?.logo_url || 'default.png'}
    {data?.length || 0} items
</div>
