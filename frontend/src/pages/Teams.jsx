import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function Teams() {
    const { isManager } = useAuth()
    const [teams, setTeams] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [teamName, setTeamName] = useState('')
    const [editing, setEditing] = useState(null)

    useEffect(() => { fetchTeams() }, [])

    const fetchTeams = async () => {
        try {
            const response = await api.get('/teams')
            setTeams(response.data.data)
        } catch (error) {
            console.error('Failed to fetch teams:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editing) {
                await api.patch(`/teams/${editing.id}`, { name: teamName })
            } else {
                await api.post('/teams', { name: teamName })
            }
            setModalOpen(false)
            setEditing(null)
            setTeamName('')
            fetchTeams()
        } catch (error) {
            console.error('Failed to save team:', error)
        }
    }

    const handleEdit = (team) => {
        setEditing(team)
        setTeamName(team.name)
        setModalOpen(true)
    }

    const handleCreate = () => {
        setEditing(null)
        setTeamName('')
        setModalOpen(true)
    }

    if (loading) return <div className="flex items-center justify-center" style={{ minHeight: '400px' }}><div className="spinner"></div></div>

    return (
        <div style={{ animation: 'fadeIn var(--transition-normal) ease-out' }}>
            <div className="page-header">
                <div><h1 className="page-title">Maintenance Teams</h1><p className="page-subtitle">Manage your maintenance teams</p></div>
                {isManager && <button onClick={handleCreate} className="btn btn-primary">+ Add Team</button>}
            </div>
            <div className="grid grid-cols-3 gap-6">
                {teams.map(team => (
                    <div key={team.id} className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">{team.name}</h3>
                            {isManager && <button onClick={() => handleEdit(team)} className="btn btn-ghost btn-sm">Edit</button>}
                        </div>
                        <div className="flex items-center gap-2 text-muted">
                            <span>👥</span>
                            <span>{team.member_count || 0} members</span>
                        </div>
                    </div>
                ))}
            </div>
            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2 className="modal-title">{editing ? 'Edit' : 'Create'} Team</h2><button onClick={() => setModalOpen(false)} className="btn btn-ghost btn-icon">✕</button></div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body"><div className="form-group"><label className="form-label">Team Name *</label><input type="text" value={teamName} onChange={e => setTeamName(e.target.value)} className="form-input" required /></div></div>
                            <div className="modal-footer"><button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Teams
