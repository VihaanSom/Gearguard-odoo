import { useDroppable } from '@dnd-kit/core'
import KanbanCard from './KanbanCard'

function KanbanColumn({
    column,
    items,
    onEditRequest,
    onAssignRequest,
    onCompleteRequest,
    isManager,
    isTechnician,
    currentUserId
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: column.id,
    })

    return (
        <div
            className="kanban-column"
            style={{
                borderTopColor: column.color,
                borderTopWidth: '3px',
            }}
        >
            <div className="kanban-column-header">
                <div className="kanban-column-title">
                    <span className="kanban-column-icon">{column.icon}</span>
                    <span>{column.title}</span>
                </div>
                <div className="kanban-column-count">{items.length}</div>
            </div>

            <div
                ref={setNodeRef}
                className={`kanban-column-content ${isOver ? 'kanban-column-over' : ''}`}
            >
                {items.map(request => (
                    <KanbanCard
                        key={request.id}
                        request={request}
                        onEdit={() => onEditRequest(request)}
                        onAssign={(userId) => onAssignRequest(request.id, userId)}
                        onComplete={(hours) => onCompleteRequest(request.id, hours)}
                        isManager={isManager}
                        isTechnician={isTechnician}
                        currentUserId={currentUserId}
                    />
                ))}

                {items.length === 0 && (
                    <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                        <p className="text-sm text-muted">Drop cards here</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default KanbanColumn
