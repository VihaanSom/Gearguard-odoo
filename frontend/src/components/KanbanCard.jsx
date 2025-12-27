import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

function KanbanCard({
    request,
    isDragging,
    onEdit,
    onAssign,
    onComplete,
    isManager,
    isTechnician,
    currentUserId
}) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: request.id,
    })

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.8 : 1,
    }

    const getInitials = (name) => {
        return name
            ?.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || '?'
    }

    // Check if request is overdue (scheduled date is in the past and not completed)
    const isOverdue = () => {
        if (!request.scheduled_date) return false
        if (request.status === 'repaired' || request.status === 'scrap') return false
        const scheduledDate = new Date(request.scheduled_date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return scheduledDate < today
    }

    const canAssign = isTechnician && request.status === 'new'
    const canComplete = (isManager || request.assigned_to === currentUserId) && request.status === 'in_progress'
    const overdue = isOverdue()

    const handleAssignSelf = (e) => {
        e.stopPropagation()
        if (onAssign) onAssign(currentUserId)
    }

    const handleComplete = (e) => {
        e.stopPropagation()
        const hours = prompt('Enter duration in hours:')
        if (hours && !isNaN(hours)) {
            onComplete(parseFloat(hours))
        }
    }

    const handleEditClick = (e) => {
        e.stopPropagation()
        if (onEdit) onEdit()
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`kanban-card ${isDragging ? 'dragging' : ''} ${overdue ? 'kanban-card-overdue' : ''}`}
        >
            {/* Overdue Badge */}
            {overdue && (
                <div className="kanban-card-overdue-badge">OVERDUE</div>
            )}

            {/* Drag Handle */}
            <div className="kanban-card-drag-handle" {...listeners} {...attributes}>
                <span>⋮⋮</span>
            </div>

            <div className="kanban-card-body">
                <div className="kanban-card-header">
                    <div className="kanban-card-subject">{request.subject}</div>
                    <span className={`badge badge-${request.type} kanban-card-type`}>
                        {request.type}
                    </span>
                </div>

                <div className="kanban-card-meta">
                    {request.equipment_name && (
                        <div className="kanban-card-equipment">
                            <span>🔧</span>
                            <span>{request.equipment_name}</span>
                        </div>
                    )}
                    {request.scheduled_date && (
                        <div className={`kanban-card-date ${overdue ? 'text-error' : ''}`}>
                            <span>📅</span>
                            <span>{new Date(request.scheduled_date).toLocaleDateString()}</span>
                        </div>
                    )}
                    {/* Show duration for completed requests */}
                    {request.durationHours && request.status === 'repaired' && (
                        <div className="kanban-card-duration">
                            <span>⏱️</span>
                            <span>{request.durationHours}h</span>
                        </div>
                    )}
                </div>

                <div className="kanban-card-footer">
                    <div className="kanban-card-assignee">
                        {request.assigned_to_name ? (
                            <>
                                <div className="avatar avatar-sm">
                                    {request.assigned_to_avatar ? (
                                        <img src={request.assigned_to_avatar} alt={request.assigned_to_name} />
                                    ) : (
                                        getInitials(request.assigned_to_name)
                                    )}
                                </div>
                                <span className="text-xs text-muted">{request.assigned_to_name}</span>
                            </>
                        ) : (
                            <span className="text-xs text-muted">Unassigned</span>
                        )}
                    </div>

                    <div className="kanban-card-actions">
                        {canAssign && !request.assigned_to && (
                            <button
                                onClick={handleAssignSelf}
                                className="kanban-card-btn"
                                title="Assign to myself"
                            >
                                👤
                            </button>
                        )}
                        {canComplete && (
                            <button
                                onClick={handleComplete}
                                className="kanban-card-btn"
                                title="Mark as completed"
                            >
                                ✓
                            </button>
                        )}
                        {onEdit && (
                            <button
                                onClick={handleEditClick}
                                className="kanban-card-btn"
                                title="Edit request"
                            >
                                ✏️
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default KanbanCard
