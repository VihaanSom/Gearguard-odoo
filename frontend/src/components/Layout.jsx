import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/kanban', label: 'Kanban Board', icon: '📋' },
    { path: '/calendar', label: 'Calendar', icon: '📅' },
    { path: '/equipment', label: 'Equipment', icon: '🔧' },
    { path: '/teams', label: 'Teams', icon: '👥' },
    { path: '/reports', label: 'Reports', icon: '📈' },
]

function Layout() {
    const { user, logout } = useAuth()
    const location = useLocation()

    const getInitials = (name) => {
        return name
            ?.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'U'
    }

    return (
        <div className="flex">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">⚙️</div>
                    <span className="sidebar-logo-text">GearGuard</span>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-item-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* User Profile */}
                <div className="card" style={{ padding: 'var(--space-4)' }}>
                    <div className="flex items-center gap-3">
                        <div className="avatar">
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt={user.name} />
                            ) : (
                                getInitials(user?.name)
                            )}
                        </div>
                        <div className="flex-1" style={{ minWidth: 0 }}>
                            <div className="font-medium text-sm" style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {user?.name}
                            </div>
                            <div className="text-xs text-muted" style={{ textTransform: 'capitalize' }}>
                                {user?.role}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="btn btn-ghost btn-sm w-full mt-3"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    )
}

export default Layout
