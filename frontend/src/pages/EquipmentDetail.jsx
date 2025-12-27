import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import RequestModal from '../components/RequestModal'
import './EquipmentDetail.css'

function EquipmentDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { isManager, isTechnician } = useAuth()
    const [equipment, setEquipment] = useState(null)
    const [requests, setRequests] = useState([])
    const [activeRequestCount, setActiveRequestCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [showRequests, setShowRequests] = useState(false)

    useEffect(() => {
        fetchEquipmentData()
    }, [id])

    const fetchEquipmentData = async () => {
        try {
            const [equipmentRes, requestsRes, countRes] = await Promise.all([
                api.get(`/equipment/${id}`),
                api.get(`/equipment/${id}/requests?activeOnly=false`),
                api.get(`/equipment/${id}/requests/count`)
            ])
            setEquipment(equipmentRes.data.data)
            setRequests(requestsRes.data.data)
            setActiveRequestCount(countRes.data.data.count)
        } catch (error) {
            console.error('Failed to fetch equipment:', error)
            navigate('/equipment')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateRequest = async (data) => {
        try {
            await api.post('/requests', { ...data, equipment_id: id })
            setModalOpen(false)
            fetchEquipmentData()
        } catch (error) {
            console.error('Failed to create request:', error)
            throw error
        }
    }

    const getStatusBadge = (status) => {
        const statusMap = {
            new: 'info',
            in_progress: 'warning',
            repaired: 'success',
            scrap: 'error'
        }
        return statusMap[status] || 'info'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
                <div className="spinner"></div>
            </div>
        )
    }

    if (!equipment) {
        return <div>Equipment not found</div>
    }

    return (
        <div className="equipment-detail">
            {/* Header */}
            <div className="page-header">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/equipment')} className="btn btn-ghost btn-icon">
                        ←
                    </button>
                    <div>
                        <h1 className="page-title">{equipment.name}</h1>
                        <p className="page-subtitle">{equipment.serialNumber}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {/* SMART BUTTON - Shows maintenance request count */}
                    <button
                        onClick={() => setShowRequests(!showRequests)}
                        className={`smart-button ${showRequests ? 'active' : ''}`}
                    >
                        <span className="smart-button-icon">🔧</span>
                        <span>Maintenance</span>
                        {activeRequestCount > 0 && (
                            <span className="smart-button-badge">{activeRequestCount}</span>
                        )}
                    </button>

                    <button
                        onClick={() => setModalOpen(true)}
                        className="btn btn-primary"
                    >
                        + New Request
                    </button>
                </div>
            </div>

            {/* Equipment Details Card */}
            <div className="equipment-detail-grid">
                <div className="card">
                    <h3 className="card-title mb-4">Equipment Information</h3>

                    <div className="detail-grid">
                        <div className="detail-item">
                            <span className="detail-label">Serial Number</span>
                            <span className="detail-value">{equipment.serialNumber || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Department</span>
                            <span className="detail-value">{equipment.department || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Owner/Employee</span>
                            <span className="detail-value">{equipment.ownerEmployee || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Location</span>
                            <span className="detail-value">{equipment.location || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Maintenance Team</span>
                            <span className="detail-value">{equipment.team_name || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Purchase Date</span>
                            <span className="detail-value">
                                {equipment.purchaseDate
                                    ? new Date(equipment.purchaseDate).toLocaleDateString()
                                    : '-'}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Warranty Expiry</span>
                            <span className={`detail-value ${equipment.warrantyExpiry && new Date(equipment.warrantyExpiry) < new Date() ? 'text-error' : ''}`}>
                                {equipment.warrantyExpiry
                                    ? new Date(equipment.warrantyExpiry).toLocaleDateString()
                                    : '-'}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Status</span>
                            <span className={`detail-value ${equipment.isScrapped ? 'text-error' : 'text-success'}`}>
                                {equipment.isScrapped ? '🚫 Scrapped' : '✅ Active'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Maintenance Requests Panel */}
                {showRequests && (
                    <div className="card requests-panel">
                        <div className="card-header">
                            <h3 className="card-title">Maintenance Requests</h3>
                            <span className="badge badge-info">{requests.length} total</span>
                        </div>

                        {requests.length === 0 ? (
                            <div className="empty-state">
                                <p>No maintenance requests for this equipment</p>
                            </div>
                        ) : (
                            <div className="request-list">
                                {requests.map(request => (
                                    <div key={request.id} className="request-item">
                                        <div className="request-info">
                                            <div className="request-subject">{request.subject}</div>
                                            <div className="request-meta">
                                                <span className={`badge badge-${request.type}`}>{request.type}</span>
                                                <span className="text-muted text-xs">
                                                    {new Date(request.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={`badge badge-${getStatusBadge(request.status)}`}>
                                            {request.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Request Modal */}
            {modalOpen && (
                <RequestModal
                    onClose={() => setModalOpen(false)}
                    onSave={handleCreateRequest}
                />
            )}
        </div>
    )
}

export default EquipmentDetail
