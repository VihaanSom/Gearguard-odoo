import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children, requiredRole }) {
    const { isAuthenticated, loading, user } = useAuth()

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full" style={{ minHeight: '100vh' }}>
                <div className="spinner"></div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    if (requiredRole && user?.role !== requiredRole && user?.role !== 'manager') {
        return <Navigate to="/dashboard" replace />
    }

    return children
}

export default ProtectedRoute
