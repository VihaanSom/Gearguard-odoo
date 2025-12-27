import { useState, useEffect } from 'react'
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, rectIntersection } from '@dnd-kit/core'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import KanbanColumn from '../components/KanbanColumn'
import KanbanCard from '../components/KanbanCard'
import RequestModal from '../components/RequestModal'
import './Kanban.css'

const COLUMNS = [
    { id: 'new', title: 'New', icon: '🆕', color: '#3b82f6' },
    { id: 'in_progress', title: 'In Progress', icon: '🔄', color: '#f59e0b' },
    { id: 'repaired', title: 'Repaired', icon: '✅', color: '#10b981' },
    { id: 'scrap', title: 'Scrap', icon: '🗑️', color: '#ef4444' },
]

function Kanban() {
    const { isManager, isTechnician, user } = useAuth()
    const [kanbanData, setKanbanData] = useState({
        new: [],
        in_progress: [],
        repaired: [],
        scrap: []
    })
    const [activeCard, setActiveCard] = useState(null)
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingRequest, setEditingRequest] = useState(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    )

    useEffect(() => {
        fetchKanbanData()
    }, [])

    const fetchKanbanData = async () => {
        try {
            const response = await api.get('/requests/kanban')
            setKanbanData(response.data.data)
        } catch (error) {
            console.error('Failed to fetch kanban data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Find which column a card belongs to
    const findColumnByCardId = (cardId) => {
        for (const columnId of Object.keys(kanbanData)) {
            if (kanbanData[columnId].some(item => item.id === cardId)) {
                return columnId
            }
        }
        return null
    }

    const handleDragStart = (event) => {
        const { active } = event
        const activeColumn = findColumnByCardId(active.id)
        if (activeColumn) {
            const card = kanbanData[activeColumn].find(item => item.id === active.id)
            setActiveCard(card)
        }
    }

    const handleDragOver = (event) => {
        // This helps with visual feedback during drag
    }

    const handleDragEnd = async (event) => {
        const { active, over } = event
        setActiveCard(null)

        if (!over) return

        // Determine source column
        const sourceColumn = findColumnByCardId(active.id)
        if (!sourceColumn) return

        // Determine target column - over.id could be a column id or a card id
        let targetColumn = over.id

        // Check if we dropped over a card instead of a column
        if (!COLUMNS.some(col => col.id === targetColumn)) {
            // over.id is a card id, find its column
            targetColumn = findColumnByCardId(over.id)
        }

        // If still no valid column, or same column, exit
        if (!targetColumn || sourceColumn === targetColumn) return

        // Verify target is a valid column
        if (!COLUMNS.some(col => col.id === targetColumn)) return

        // Find the item being dragged
        const item = kanbanData[sourceColumn].find(i => i.id === active.id)
        if (!item) return

        // Optimistic update
        const newData = {
            ...kanbanData,
            [sourceColumn]: kanbanData[sourceColumn].filter(i => i.id !== active.id),
            [targetColumn]: [...kanbanData[targetColumn], { ...item, status: targetColumn }]
        }
        setKanbanData(newData)

        // API update
        try {
            await api.patch(`/requests/${active.id}/status`, { status: targetColumn })
        } catch (error) {
            console.error('Failed to update status:', error)
            fetchKanbanData() // Revert on error
        }
    }

    const handleCreateRequest = () => {
        setEditingRequest(null)
        setModalOpen(true)
    }

    const handleEditRequest = (request) => {
        setEditingRequest(request)
        setModalOpen(true)
    }

    const handleSaveRequest = async (data) => {
        try {
            if (editingRequest) {
                await api.patch(`/requests/${editingRequest.id}`, data)
            } else {
                await api.post('/requests', data)
            }
            setModalOpen(false)
            fetchKanbanData()
        } catch (error) {
            console.error('Failed to save request:', error)
            throw error
        }
    }

    const handleAssignRequest = async (requestId, userId) => {
        try {
            await api.patch(`/requests/${requestId}/assign`, { user_id: userId })
            fetchKanbanData()
        } catch (error) {
            console.error('Failed to assign request:', error)
        }
    }

    const handleCompleteRequest = async (requestId, durationHours) => {
        try {
            await api.patch(`/requests/${requestId}/complete`, { duration_hours: durationHours })
            fetchKanbanData()
        } catch (error) {
            console.error('Failed to complete request:', error)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full" style={{ minHeight: '400px' }}>
                <div className="spinner"></div>
            </div>
        )
    }

    return (
        <div className="kanban-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Kanban Board</h1>
                    <p className="page-subtitle">Drag and drop to update request status</p>
                </div>
                <button onClick={handleCreateRequest} className="btn btn-primary">
                    + New Request
                </button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={rectIntersection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="kanban-board">
                    {COLUMNS.map(column => (
                        <KanbanColumn
                            key={column.id}
                            column={column}
                            items={kanbanData[column.id] || []}
                            onEditRequest={handleEditRequest}
                            onAssignRequest={handleAssignRequest}
                            onCompleteRequest={handleCompleteRequest}
                            isManager={isManager}
                            isTechnician={isTechnician}
                            currentUserId={user?.id}
                        />
                    ))}
                </div>

                <DragOverlay dropAnimation={null}>
                    {activeCard && <KanbanCard request={activeCard} isDragging />}
                </DragOverlay>
            </DndContext>

            {modalOpen && (
                <RequestModal
                    request={editingRequest}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSaveRequest}
                />
            )}
        </div>
    )
}

export default Kanban
