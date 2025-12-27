import { useState, useEffect } from 'react'
import api from '../services/api'

function RequestModal({ request, onClose, onSave }) {
    const [formData, setFormData] = useState({
        subject: '',
        type: 'corrective',
        description: '',
        priority: 'medium',
        equipment_id: '',
        scheduled_date: ''
    })
    const [equipment, setEquipment] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchEquipment()
        if (request) {
            setFormData({
                subject: request.subject || '',
                type: request.type || 'corrective',
                description: request.description || '',
                priority: request.priority || 'medium',
                equipment_id: request.equipment_id || '',
                scheduled_date: request.scheduled_date?.split('T')[0] || ''
            })
        }
    }, [request])

    const fetchEquipment = async () => {
        try {
            const response = await api.get('/equipment')
            setEquipment(response.data.data)
        } catch (error) {
            console.error('Failed to fetch equipment:', error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await onSave(formData)
        } catch (err) {
            setError(err.response?.data?.error?.message || 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {request ? 'Edit Request' : 'New Maintenance Request'}
                    </h2>
                    <button onClick={onClose} className="btn btn-ghost btn-icon">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Subject *</label>
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Brief description of the issue"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Type *</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="form-select"
                                    required
                                >
                                    <option value="corrective">Corrective (Breakdown)</option>
                                    <option value="preventive">Preventive</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Priority</label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    className="form-select"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Equipment *</label>
                            <select
                                name="equipment_id"
                                value={formData.equipment_id}
                                onChange={handleChange}
                                className="form-select"
                                required
                            >
                                <option value="">Select equipment...</option>
                                {equipment.map(eq => (
                                    <option key={eq.id} value={eq.id}>
                                        {eq.name} ({eq.serial_number})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {formData.type === 'preventive' && (
                            <div className="form-group">
                                <label className="form-label">Scheduled Date *</label>
                                <input
                                    type="date"
                                    name="scheduled_date"
                                    value={formData.scheduled_date}
                                    onChange={handleChange}
                                    className="form-input"
                                    required={formData.type === 'preventive'}
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="form-textarea"
                                placeholder="Detailed description of the maintenance request..."
                                rows={4}
                            />
                        </div>

                        {error && (
                            <div className="login-error" style={{ marginTop: 'var(--space-4)' }}>
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <span className="spinner spinner-sm"></span> : (request ? 'Update' : 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default RequestModal
