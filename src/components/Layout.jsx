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
    Brain,
} from 'lucide-react';
import { getTodaySummary } from '../services/aiService';
import CreateProjectModal from './modals/CreateProjectModal';

export default function Layout() {
    const { projects, tasks, currentUser, logout } = useData();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [createProjectOpen, setCreateProjectOpen] = useState(false);
    const [aiSummary, setAiSummary] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);

    const handleGetSummary = async () => {
        setLoadingSummary(true);
        setShowSummaryModal(true);
        const summary = await getTodaySummary(null, tasks, currentUser);
        setAiSummary(summary);
        setLoadingSummary(false);
    };

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

                    <div className="sidebar-section">
                        <div className="sidebar-ai-summary" style={{
                            margin: 'var(--space-4)',
                            padding: 'var(--space-4)',
                            background: 'rgba(99, 102, 241, 0.05)',
                            border: '1px solid rgba(99, 102, 241, 0.1)',
                            borderRadius: 'var(--radius-lg)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                }}>
                                    <Sparkles size={14} />
                                </div>
                                <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>AI Daily Focus</div>
                            </div>

                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                                Get personalized task focus for your day.
                            </p>

                            <button
                                className="btn btn-ai btn-sm"
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    padding: 'var(--space-3)',
                                    flexDirection: 'column',
                                    gap: 'var(--space-1)',
                                    textAlign: 'center',
                                    lineHeight: '1.2'
                                }}
                                onClick={handleGetSummary}
                                disabled={loadingSummary}
                            >
                                {loadingSummary ? (
                                    <>
                                        <div className="spinner" style={{ width: '14px', height: '14px' }} />
                                        Summarizing...
                                    </>
                                ) : (
                                    <>
                                        <Brain size={16} />
                                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)' }}>
                                            What should I<br />work on today?
                                        </div>
                                    </>
                                )}
                            </button>
                        </div>
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

            {showSummaryModal && (
                <div className="modal-overlay" onClick={() => setShowSummaryModal(false)}>
                    <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                }}>
                                    <Sparkles size={18} />
                                </div>
                                <h2 className="modal-title">Your Daily Focus</h2>
                            </div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowSummaryModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {loadingSummary ? (
                                <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                                    <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto var(--space-4)' }} />
                                    <p style={{ color: 'var(--text-secondary)' }}>AI is analyzing your tasks...</p>
                                </div>
                            ) : (
                                <div style={{
                                    background: 'var(--bg-tertiary)',
                                    padding: 'var(--space-6)',
                                    borderRadius: 'var(--radius-lg)',
                                    fontSize: 'var(--text-md)',
                                    lineHeight: '1.7',
                                    color: 'var(--text-primary)',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {aiSummary}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowSummaryModal(false)}>
                                Close
                            </button>
                            <button
                                className="btn btn-ai"
                                onClick={handleGetSummary}
                                disabled={loadingSummary}
                            >
                                <Sparkles size={18} />
                                Refresh Insights
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>
        </div >
    );
}
