import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '../services/api'
import './Reports.css'

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444']

function Reports() {
    const [stats, setStats] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { fetchStats() }, [])

    const fetchStats = async () => {
        try {
            const response = await api.get('/requests/stats/by-team')
            setStats(response.data.data)
        } catch (error) {
            console.error('Failed to fetch stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const totals = stats.reduce((acc, s) => ({
        total: acc.total + parseInt(s.total_requests || 0),
        new: acc.new + parseInt(s.new_count || 0),
        in_progress: acc.in_progress + parseInt(s.in_progress_count || 0),
        repaired: acc.repaired + parseInt(s.repaired_count || 0),
        scrap: acc.scrap + parseInt(s.scrap_count || 0)
    }), { total: 0, new: 0, in_progress: 0, repaired: 0, scrap: 0 })

    const pieData = [
        { name: 'New', value: totals.new },
        { name: 'In Progress', value: totals.in_progress },
        { name: 'Repaired', value: totals.repaired },
        { name: 'Scrap', value: totals.scrap }
    ].filter(d => d.value > 0)

    if (loading) return <div className="flex items-center justify-center" style={{ minHeight: '400px' }}><div className="spinner"></div></div>

    return (
        <div className="reports-page">
            <div className="page-header"><div><h1 className="page-title">Reports</h1><p className="page-subtitle">Maintenance statistics and analytics</p></div></div>
            <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="stat-card"><div className="stat-value">{totals.total}</div><div className="stat-label">Total Requests</div></div>
                <div className="stat-card"><div className="stat-value text-info">{totals.new}</div><div className="stat-label">New</div></div>
                <div className="stat-card"><div className="stat-value text-warning">{totals.in_progress}</div><div className="stat-label">In Progress</div></div>
                <div className="stat-card"><div className="stat-value text-success">{totals.repaired}</div><div className="stat-label">Repaired</div></div>
            </div>
            <div className="grid grid-cols-2 gap-6">
                <div className="card"><h3 className="card-title mb-6">Requests by Team</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats}><CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" /><XAxis dataKey="team_name" stroke="var(--text-muted)" fontSize={12} /><YAxis stroke="var(--text-muted)" fontSize={12} /><Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} /><Bar dataKey="total_requests" fill="#6366f1" radius={[4, 4, 0, 0]} /></BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="card"><h3 className="card-title mb-6">Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>{pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /></PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}

export default Reports
