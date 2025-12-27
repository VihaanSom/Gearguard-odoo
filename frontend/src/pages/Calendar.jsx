import { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import api from '../services/api'
import RequestModal from '../components/RequestModal'
import './Calendar.css'

function Calendar() {
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState(null)
    const calendarRef = useRef(null)

    useEffect(() => {
        fetchCalendarEvents()
    }, [])

    const fetchCalendarEvents = async (start, end) => {
        try {
            const startDate = start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
            const endDate = end || new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0).toISOString().split('T')[0]

            const response = await api.get(`/requests/calendar?start=${startDate}&end=${endDate}`)
            setEvents(response.data.data)
        } catch (error) {
            console.error('Failed to fetch calendar events:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDateClick = (arg) => {
        setSelectedDate(arg.dateStr)
        setModalOpen(true)
    }

    const handleEventClick = (arg) => {
        const request = arg.event.extendedProps
        alert(`${arg.event.title}\n\nType: ${request.type}\nStatus: ${request.status}\nEquipment: ${request.equipment_name || 'N/A'}`)
    }

    const handleDatesSet = (arg) => {
        fetchCalendarEvents(
            arg.start.toISOString().split('T')[0],
            arg.end.toISOString().split('T')[0]
        )
    }

    const handleSaveRequest = async (data) => {
        try {
            await api.post('/requests', {
                ...data,
                type: 'preventive',
                scheduled_date: selectedDate
            })
            setModalOpen(false)
            fetchCalendarEvents()
        } catch (error) {
            console.error('Failed to create request:', error)
            throw error
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
        <div className="calendar-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Maintenance Calendar</h1>
                    <p className="page-subtitle">Schedule and view preventive maintenance tasks</p>
                </div>
                <div className="calendar-legend">
                    <div className="legend-item">
                        <span className="legend-dot preventive"></span>
                        <span>Preventive</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot corrective"></span>
                        <span>Corrective</span>
                    </div>
                </div>
            </div>

            <div className="calendar-container card">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    events={events}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                    datesSet={handleDatesSet}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,dayGridWeek'
                    }}
                    height="auto"
                    dayMaxEvents={3}
                    eventDisplay="block"
                    eventTimeFormat={{
                        hour: 'numeric',
                        minute: '2-digit',
                        meridiem: 'short'
                    }}
                />
            </div>

            {modalOpen && (
                <RequestModal
                    onClose={() => setModalOpen(false)}
                    onSave={handleSaveRequest}
                />
            )}
        </div>
    )
}

export default Calendar
