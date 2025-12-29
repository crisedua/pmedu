import { Navigate, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';

export default function ProtectedRoute({ children }) {
    const { currentUser, loading } = useData();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-primary)'
            }}>
                <div className="spinner" style={{ width: '32px', height: '32px' }} />
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}
