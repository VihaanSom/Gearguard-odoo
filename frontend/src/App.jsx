import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Kanban from './pages/Kanban'
import Calendar from './pages/Calendar'
import Equipment from './pages/Equipment'
import EquipmentDetail from './pages/EquipmentDetail'
import Teams from './pages/Teams'
import Reports from './pages/Reports'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="kanban" element={<Kanban />} />
                        <Route path="calendar" element={<Calendar />} />
                        <Route path="equipment" element={<Equipment />} />
                        <Route path="equipment/:id" element={<EquipmentDetail />} />
                        <Route path="teams" element={<Teams />} />
                        <Route path="reports" element={<Reports />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App
