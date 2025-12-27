import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './Dashboard.css'

function Dashboard() {
    const { user } = useAuth()
    const [stats, setStats] = useState({
        total: 0,
        new: 0,
        inProgress: 0,
        repaired: 0,
        scrap: 0
    })
    const [recentRequests, setRecentRequests] = useState([])
    const [expiringWarranty, setExpiringWarranty] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const [requestsRes, warrantyRes] = await Promise.all([
                api.get('/requests'),
                api.get('/equipment/warranty-expiring?days=30')
            ])

            const requests = requestsRes.data.data

            setStats({
                total: requests.length,
                new: requests.filter(r => r.status === 'new').length,
                inProgress: requests.filter(r => r.status === 'in_progress').length,
                repaired: requests.filter(r => r.status === 'repaired').length,
                scrap: requests.filter(r => r.status === 'scrap').length
            })

            setRecentRequests(requests.slice(0, 5))
            setExpiringWarranty(warrantyRes.data.data)
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good morning'
        if (hour < 18) return 'Good afternoon'
        return 'Good evening'
    }

    const statCards = [
        { label: 'Total Requests', value: stats.total, icon: '📋', color: 'primary' },
        { label: 'New', value: stats.new, icon: '🆕', color: 'info' },
        { label: 'In Progress', value: stats.inProgress, icon: '🔄', color: 'warning' },
        { label: 'Repaired', value: stats.repaired, icon: '✅', color: 'success' },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full" style={{ minHeight: '400px' }}>
                <div className="spinner"></div>
            </div>
        )
    }

    return (
        <div className="dashboard">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">{getGreeting()}, {user?.name?.split(' ')[0]}! 👋</h1>
                    <p className="page-subtitle">Here's what's happening with your maintenance operations today.</p>
                </div>
                <Link to="/kanban" className="btn btn-primary">
                    View Kanban Board
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {statCards.map((stat, index) => (
                    <div key={index} className={`stat-card stat-card-${stat.color}`}>
                        <div className="stat-icon">{stat.icon}</div>
                        <div className="stat-content">
                            <div className="stat-value">{stat.value}</div>
                            <div className="stat-label">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Grid */}
            <div className="dashboard-grid">
                {/* Recent Requests */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Recent Requests</h2>
                        <Link to="/kanban" className="btn btn-ghost btn-sm">View All</Link>
                    </div>

                    {recentRequests.length === 0 ? (
                        <div className="empty-state">
                            <p>No maintenance requests yet</p>
                        </div>
                    ) : (
                        <div className="request-list">
                            {recentRequests.map(request => (
                                <div key={request.id} className="request-item">
                                    <div className="request-info">
                                        <div className="request-subject">{request.subject}</div>
                                        <div className="request-meta">
                                            <span className="text-muted">{request.equipment_name || 'No equipment'}</span>
                                            <span className={`badge badge-${request.type}`}>
                                                {request.type}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`badge badge-${request.status.replace('_', '-')}`}>
                                        {request.status.replace('_', ' ')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Warranty Expiring */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">⚠️ Warranty Expiring Soon</h2>
                        <Link to="/equipment" className="btn btn-ghost btn-sm">View All</Link>
                    </div>

                    {expiringWarranty.length === 0 ? (
                        <div className="empty-state">
                            <p>No warranties expiring in the next 30 days</p>
                        </div>
                    ) : (
                        <div className="warranty-list">
                            {expiringWarranty.map(equipment => (
                                <div key={equipment.id} className="warranty-item">
                                    <div className="warranty-info">
                                        <div className="warranty-name">{equipment.name}</div>
                                        <div className="warranty-serial text-muted text-sm">
                                            {equipment.serial_number}
                                        </div>
                                    </div>
                                    <div className="warranty-date text-warning text-sm font-medium">
                                        {new Date(equipment.warranty_expiry).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="flex gap-4 flex-wrap">
                    <Link to="/kanban" className="action-card">
                        <span className="action-icon">📋</span>
                        <span>Create Request</span>
                    </Link>
                    <Link to="/equipment" className="action-card">
                        <span className="action-icon">🔧</span>
                        <span>Add Equipment</span>
                    </Link>
                    <Link to="/calendar" className="action-card">
                        <span className="action-icon">📅</span>
                        <span>Schedule Maintenance</span>
                    </Link>
                    <Link to="/reports" className="action-card">
                        <span className="action-icon">📊</span>
                        <span>View Reports</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
