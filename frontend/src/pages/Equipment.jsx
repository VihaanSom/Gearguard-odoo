import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './Equipment.css'

function Equipment() {
    const navigate = useNavigate()
    const { isManager, isTechnician } = useAuth()
    const [equipment, setEquipment] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [departmentFilter, setDepartmentFilter] = useState('')
    const [formData, setFormData] = useState({
        name: '', serial_number: '', department: '', owner_employee: '',
        purchase_date: '', warranty_expiry: '', location: '', maintenance_team_id: '', default_technician_id: ''
    })
    const [teams, setTeams] = useState([])
    const [technicians, setTechnicians] = useState([])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [eqRes, teamsRes, techRes] = await Promise.all([
                api.get('/equipment'),
                api.get('/teams'),
                api.get('/users/technicians')
            ])
            setEquipment(eqRes.data.data)
            setTeams(teamsRes.data.data)
            setTechnicians(techRes.data.data)
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Get unique departments for filter
    const departments = useMemo(() => {
        const depts = [...new Set(equipment.map(eq => eq.department).filter(Boolean))]
        return depts.sort()
    }, [equipment])

    // Filter equipment
    const filteredEquipment = useMemo(() => {
        return equipment.filter(eq => {
            const matchesSearch = !searchTerm ||
                eq.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                eq.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                eq.location?.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesDept = !departmentFilter || eq.department === departmentFilter
            return matchesSearch && matchesDept
        })
    }, [equipment, searchTerm, departmentFilter])

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editing) {
                await api.patch(`/equipment/${editing.id}`, formData)
            } else {
                await api.post('/equipment', formData)
            }
            setModalOpen(false)
            setEditing(null)
            fetchData()
        } catch (error) {
            console.error('Failed to save equipment:', error)
        }
    }

    const handleEdit = (e, eq) => {
        e.stopPropagation()
        setEditing(eq)
        setFormData({
            name: eq.name || '',
            serial_number: eq.serialNumber || '',
            department: eq.department || '',
            owner_employee: eq.ownerEmployee || '',
            purchase_date: eq.purchaseDate?.split('T')[0] || '',
            warranty_expiry: eq.warrantyExpiry?.split('T')[0] || '',
            location: eq.location || '',
            maintenance_team_id: eq.maintenanceTeamId || ''
        })
        setModalOpen(true)
    }

    const handleCreate = () => {
        setEditing(null)
        setFormData({
            name: '', serial_number: '', department: '', owner_employee: '',
            purchase_date: '', warranty_expiry: '', location: '', maintenance_team_id: '', default_technician_id: ''
        })
        setModalOpen(true)
    }

    const handleRowClick = (eq) => {
        navigate(`/equipment/${eq.id}`)
    }

    if (loading) return <div className="flex items-center justify-center" style={{ minHeight: '400px' }}><div className="spinner"></div></div>

    return (
        <div className="equipment-page">
            <div className="page-header">
                <div><h1 className="page-title">Equipment</h1><p className="page-subtitle">Manage your equipment inventory</p></div>
                {isTechnician && <button onClick={handleCreate} className="btn btn-primary">+ Add Equipment</button>}
            </div>

            {/* Search and Filters */}
            <div className="filter-bar card">
                <div className="filter-bar-content">
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search equipment..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="search-clear">✕</button>
                        )}
                    </div>
                    <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="form-select filter-select"
                    >
                        <option value="">All Departments</option>
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                    <span className="filter-count">{filteredEquipment.length} items</span>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table table-clickable">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Serial Number</th>
                                <th>Department</th>
                                <th>Location</th>
                                <th>Team</th>
                                <th>Warranty</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEquipment.map(eq => (
                                <tr key={eq.id} onClick={() => handleRowClick(eq)} className={eq.isScrapped ? 'row-scrapped' : ''}>
                                    <td className="font-medium">
                                        {eq.name}
                                        {eq.isScrapped && <span className="badge badge-error ml-2">Scrapped</span>}
                                    </td>
                                    <td className="text-muted">{eq.serialNumber}</td>
                                    <td>{eq.department || '-'}</td>
                                    <td>{eq.location || '-'}</td>
                                    <td>{eq.team_name || '-'}</td>
                                    <td className={eq.warrantyExpiry && new Date(eq.warrantyExpiry) < new Date() ? 'text-error' : ''}>
                                        {eq.warrantyExpiry ? new Date(eq.warrantyExpiry).toLocaleDateString() : '-'}
                                    </td>
                                    <td>
                                        <button onClick={(e) => handleEdit(e, eq)} className="btn btn-ghost btn-sm">Edit</button>
                                    </td>
                                </tr>
                            ))}
                            {filteredEquipment.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="text-center text-muted py-8">
                                        No equipment found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editing ? 'Edit' : 'Add'} Equipment</h2>
                            <button onClick={() => setModalOpen(false)} className="btn btn-ghost btn-icon">✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Name *</label>
                                    <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="form-input" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Serial Number *</label>
                                    <input type="text" value={formData.serial_number} onChange={e => setFormData({ ...formData, serial_number: e.target.value })} className="form-input" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Department</label>
                                        <input type="text" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} className="form-input" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Location</label>
                                        <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="form-input" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Owner/Employee</label>
                                    <input type="text" value={formData.owner_employee} onChange={e => setFormData({ ...formData, owner_employee: e.target.value })} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Team</label>
                                    <select value={formData.maintenance_team_id} onChange={e => setFormData({ ...formData, maintenance_team_id: e.target.value })} className="form-select">
                                        <option value="">Select team...</option>
                                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Default Technician</label>
                                    <select value={formData.default_technician_id} onChange={e => setFormData({ ...formData, default_technician_id: e.target.value })} className="form-select">
                                        <option value="">Select technician...</option>
                                        {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Equipment

