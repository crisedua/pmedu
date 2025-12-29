import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import {
    LayoutDashboard,
    FolderKanban,
    Plus,
    Sparkles,
    Settings,
    User,
    Menu,
    X,
    ChevronRight,
    LogOut,
    Shield,
    Users,
} from 'lucide-react';
import CreateProjectModal from './modals/CreateProjectModal';

export default function Layout() {
    const { projects, currentUser, logout } = useData();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [createProjectOpen, setCreateProjectOpen] = useState(false);

    const handleProjectCreated = (project) => {
        setCreateProjectOpen(false);
        navigate(`/project/${project.id}`);
    };

    return (
        <div className="app-layout">
            {/* Mobile Menu Button */}
            <button
                className="mobile-menu-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                    position: 'fixed',
                    top: '1rem',
                    left: '1rem',
                    zIndex: 250,
                    display: 'none',
                    padding: '0.5rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                }}
            >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Sidebar */}
            <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <Sparkles size={20} />
                    </div>
                    <span className="sidebar-brand">AI Project Hub</span>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section">
                        <NavLink
                            to="/"
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <LayoutDashboard size={20} />
                            Dashboard
                        </NavLink>
                        {currentUser?.role === 'admin' && (
                            <NavLink
                                to="/users"
                                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Users size={20} />
                                User Management
                            </NavLink>
                        )}
                    </div>

                    <div className="sidebar-section">
                        <div className="sidebar-section-title">Projects</div>

                        <button
                            className="sidebar-link"
                            onClick={() => setCreateProjectOpen(true)}
                            style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none' }}
                        >
                            <Plus size={20} />
                            New Project
                        </button>

                        {projects.map(project => (
                            <NavLink
                                key={project.id}
                                to={`/project/${project.id}`}
                                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <FolderKanban size={20} />
                                <span className="truncate" style={{ flex: 1 }}>{project.name}</span>
                                <ChevronRight size={16} style={{ opacity: 0.5 }} />
                            </NavLink>
                        ))}

                        {projects.length === 0 && (
                            <p style={{
                                padding: 'var(--space-3)',
                                fontSize: 'var(--text-xs)',
                                color: 'var(--text-muted)',
                                fontStyle: 'italic'
                            }}>
                                No projects yet
                            </p>
                        )}
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-link" style={{ cursor: 'default' }}>
                        <div className="avatar avatar-sm">
                            {currentUser.avatar}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>
                                {currentUser.name}
                            </div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                {currentUser.email}
                            </div>
                            {currentUser.role === 'admin' && (
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    marginTop: '4px',
                                    padding: '2px 6px',
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    color: 'var(--color-accent-amber)',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: '10px',
                                    fontWeight: 'var(--font-semibold)',
                                }}>
                                    <Shield size={10} />
                                    Admin
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => {
                            logout();
                            navigate('/login');
                        }}
                        title="Log out"
                        style={{ marginLeft: 'var(--space-2)' }}
                    >
                        <LogOut size={16} style={{ color: 'var(--text-tertiary)' }} />
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="app-main">
                <div className="app-content">
                    <Outlet />
                </div>
            </main>

            {/* Modals */}
            {createProjectOpen && (
                <CreateProjectModal
                    onClose={() => setCreateProjectOpen(false)}
                    onCreated={handleProjectCreated}
                />
            )}

            <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>
        </div>
    );
}
