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
    Inbox,
    Activity,
    Archive
} from 'lucide-react';
import { getTodaySummary } from '../services/aiService';
import CreateProjectModal from './modals/CreateProjectModal';
import GlobalVoiceCapture from './GlobalVoiceCapture';
import AIAssistantSidebar from './AIAssistantSidebar';

export default function Layout() {
    const { projects, tasks, currentUser, logout, language, setLanguage } = useData();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [createProjectOpen, setCreateProjectOpen] = useState(false);
    const [aiSummary, setAiSummary] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

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
                            <Activity size={20} />
                            {language === 'es' ? 'Flujo de Acción' : 'Action Stream'}
                        </NavLink>
                        <NavLink
                            to="/projects"
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <LayoutDashboard size={20} />
                            {language === 'es' ? 'Contextos' : 'Contexts'}
                        </NavLink>
                        <NavLink
                            to="/command"
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <Brain size={20} />
                            {language === 'es' ? 'Cerebro de Voz' : 'Voice Brain'}
                        </NavLink>
                        <NavLink
                            to="/inbox"
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <Inbox size={20} />
                            {language === 'es' ? 'Bandeja de Entrada' : 'Inbox'}
                        </NavLink>
                        <NavLink
                            to="/archive"
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <Archive size={20} />
                            {language === 'es' ? 'Historial' : 'History'}
                        </NavLink>

                        {currentUser?.role === 'admin' && (
                            <NavLink
                                to="/users"
                                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Users size={20} />
                                {language === 'es' ? 'Gestión de Usuarios' : 'User Management'}
                            </NavLink>
                        )}
                    </div>

                    <div className="sidebar-section">
                        <div className="sidebar-section-title">
                            {language === 'es' ? 'Contextos' : 'Contexts'}
                        </div>

                        <button
                            className="sidebar-link"
                            onClick={() => setCreateProjectOpen(true)}
                            style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none' }}
                        >
                            <Plus size={20} />
                            {language === 'es' ? 'Nuevo Contexto' : 'New Context'}
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
                                No contexts yet
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

                    {/* Logout Button - Standalone Row */}
                    <button
                        className="sidebar-link logout-btn"
                        onClick={() => {
                            console.log('[Logout] Button clicked');
                            logout();
                            navigate('/login');
                        }}
                        style={{
                            width: '100%',
                            textAlign: 'left',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                        }}
                    >
                        <LogOut size={18} />
                        <span>{language === 'es' ? 'Cerrar Sesión' : 'Log Out'}</span>
                    </button>
                </div>

                {/* Language Toggle */}
                <div style={{ padding: '0 var(--space-4) var(--space-4)' }}>
                    <div style={{
                        display: 'flex',
                        background: 'var(--bg-tertiary)',
                        padding: '4px',
                        borderRadius: 'var(--radius-lg)',
                        gap: '4px'
                    }}>
                        <button
                            onClick={() => setLanguage('en')}
                            style={{
                                flex: 1,
                                border: 'none',
                                background: language === 'en' ? 'var(--bg-primary)' : 'transparent',
                                color: language === 'en' ? 'var(--text-primary)' : 'var(--text-muted)',
                                padding: '4px',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                boxShadow: language === 'en' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            EN
                        </button>
                        <button
                            onClick={() => setLanguage('es')}
                            style={{
                                flex: 1,
                                border: 'none',
                                background: language === 'es' ? 'var(--bg-primary)' : 'transparent',
                                color: language === 'es' ? 'var(--text-primary)' : 'var(--text-muted)',
                                padding: '4px',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                boxShadow: language === 'es' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            ES
                        </button>
                    </div>
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

            <GlobalVoiceCapture />
            <AIAssistantSidebar
                isOpen={aiAssistantOpen}
                onClose={() => setAiAssistantOpen(false)}
            />
            <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: flex !important;
          }
        }

        .sidebar-badge-ai {
            background: var(--bg-gradient);
            color: white;
            font-size: 8px;
            font-weight: 800;
            padding: 1px 4px;
            border-radius: 4px;
            margin-left: auto;
            letter-spacing: 0.5px;
        }

        .text-primary-500 {
            color: var(--color-primary-500);
        }
      `}</style>
        </div >
    );
}
