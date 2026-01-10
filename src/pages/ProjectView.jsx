import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import {
    Plus,
    Sparkles,
    FileText,
    MoreVertical,
    Trash2,
    Edit3,
    CheckCircle2,
    ArrowLeft,
    Users,
} from 'lucide-react';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import AITaskModal from '../components/modals/AITaskModal';
import CreateDocumentModal from '../components/modals/CreateDocumentModal';
import EditProjectModal from '../components/modals/EditProjectModal';
import ManageProjectMembersModal from '../components/modals/ManageProjectMembersModal';
import KanbanBoard from '../components/KanbanBoard';
import { format } from 'date-fns';

export default function ProjectView() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const {
        getProject,
        getProjectTasks,
        getProjectDocuments,
        getTaskStats,
        getProjectProgress,
        getUser,
        deleteProject,
        deleteDocument,
    } = useData();

    const project = getProject(projectId);
    const tasks = getProjectTasks(projectId);
    const documents = getProjectDocuments(projectId);
    const stats = getTaskStats(projectId);
    const progress = getProjectProgress(projectId);

    const [activeTab, setActiveTab] = useState('tasks');
    const [showMenu, setShowMenu] = useState(false);

    // Modals
    const [createTaskOpen, setCreateTaskOpen] = useState(false);
    const [aiTaskOpen, setAiTaskOpen] = useState(false);
    const [createDocOpen, setCreateDocOpen] = useState(false);
    const [editProjectOpen, setEditProjectOpen] = useState(false);
    const [manageMembersOpen, setManageMembersOpen] = useState(false);

    // Handle project not found
    if (!project) {
        return (
            <div className="empty-state">
                <h2>Project not found</h2>
                <p>The project you're looking for doesn't exist.</p>
                <button className="btn btn-primary" onClick={() => navigate('/')}>
                    Go to Dashboard
                </button>
            </div>
        );
    }

    const handleDeleteProject = () => {
        if (confirm('Are you sure you want to delete this project? All tasks, documents, and files will be deleted.')) {
            deleteProject(projectId);
            navigate('/');
        }
    };

    const handleDocumentCreated = (doc) => {
        navigate(`/project/${projectId}/document/${doc.id}`);
    };

    return (
        <div>
            {/* Back navigation */}
            <Link to="/" className="btn btn-ghost btn-sm mb-4" style={{ marginLeft: '-0.5rem' }}>
                <ArrowLeft size={16} />
                Back to Dashboard
            </Link>

            {/* Project Header & Stats Consolidated */}
            <div className="card mb-6" style={{ padding: 'var(--space-4) var(--space-6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flex: 1, minWidth: '300px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                <h1 style={{ fontSize: 'var(--text-xl)', margin: 0 }}>{project.name}</h1>
                                <span className={`status-badge status-${project.status.toLowerCase().replace(' ', '-')}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                                    {project.status}
                                </span>
                            </div>
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>{project.description}</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)' }}>{stats.total}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tasks</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', color: 'var(--color-accent-emerald)' }}>{stats.done}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Done</div>
                            </div>
                        </div>

                        {stats.total > 0 && (
                            <div style={{ width: '150px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px' }}>
                                    <span style={{ fontWeight: 'var(--font-medium)' }}>Progress</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="progress-bar" style={{ height: '6px' }}>
                                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}

                        <div className="page-actions">
                            <div className="dropdown" style={{ position: 'relative' }}>
                                <button
                                    className="btn btn-ghost btn-sm btn-icon"
                                    onClick={() => setShowMenu(!showMenu)}
                                >
                                    <MoreVertical size={16} />
                                </button>
                                {showMenu && (
                                    <>
                                        <div
                                            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                                            onClick={() => setShowMenu(false)}
                                        />
                                        <div className="dropdown-menu" style={{ opacity: 1, visibility: 'visible', transform: 'none', right: 0, top: '100%' }}>
                                            <div className="dropdown-item" onClick={() => { setEditProjectOpen(true); setShowMenu(false); }}>
                                                <Edit3 size={14} />
                                                Edit Project
                                            </div>
                                            <div className="dropdown-item" onClick={() => { setManageMembersOpen(true); setShowMenu(false); }}>
                                                <Users size={14} />
                                                Manage Members
                                            </div>
                                            <div className="dropdown-divider" />
                                            <div className="dropdown-item danger" onClick={() => { handleDeleteProject(); setShowMenu(false); }}>
                                                <Trash2 size={14} />
                                                Delete Project
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions - Simplified */}
            <div className="quick-actions mb-6">
                <button className="quick-action-btn" onClick={() => setCreateTaskOpen(true)}>
                    <Plus size={18} />
                    Add Task
                </button>
                <button className="quick-action-btn ai" onClick={() => setAiTaskOpen(true)}>
                    <Sparkles size={18} />
                    Generate with AI
                </button>
            </div>

            {/* Tabs - Simplified */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tasks')}
                >
                    <CheckCircle2 size={16} style={{ marginRight: 'var(--space-2)' }} />
                    Tasks ({tasks.length})
                </button>
                <button
                    className={`tab ${activeTab === 'documents' ? 'active' : ''}`}
                    onClick={() => setActiveTab('documents')}
                >
                    <FileText size={16} style={{ marginRight: 'var(--space-2)' }} />
                    Notes ({documents.length})
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'tasks' && (
                <div>
                    {tasks.length === 0 ? (
                        <div className="card">
                            <div className="empty-state">
                                <div className="empty-state-icon">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h3 className="empty-state-title">No tasks yet</h3>
                                <p className="empty-state-description">
                                    Create tasks manually or let AI generate them from your description
                                </p>
                                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                                    <button className="btn btn-secondary" onClick={() => setCreateTaskOpen(true)}>
                                        <Plus size={18} />
                                        Add Task
                                    </button>
                                    <button className="btn btn-ai" onClick={() => setAiTaskOpen(true)}>
                                        <span>
                                            <Sparkles size={18} />
                                            Generate with AI
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <KanbanBoard projectId={projectId} />
                    )}
                </div>
            )}

            {activeTab === 'documents' && (
                <div>
                    {documents.length === 0 ? (
                        <div className="card">
                            <div className="empty-state">
                                <div className="empty-state-icon">
                                    <FileText size={40} />
                                </div>
                                <h3 className="empty-state-title">No notes yet</h3>
                                <p className="empty-state-description">
                                    Add notes to document project decisions and information
                                </p>
                                <button className="btn btn-secondary" onClick={() => setCreateDocOpen(true)}>
                                    <Plus size={18} />
                                    Add Note
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid-auto">
                            {documents.map(doc => {
                                const author = getUser(doc.author_id);
                                // Fallback to created_at if last_edited is missing
                                const dateStr = doc.last_edited || doc.created_at;
                                const dateObj = dateStr ? new Date(dateStr) : null;
                                const isValid = dateObj && !isNaN(dateObj.getTime());

                                return (
                                    <Link
                                        key={doc.id}
                                        to={`/project/${projectId}/document/${doc.id}`}
                                        className="doc-card"
                                        style={{ position: 'relative' }}
                                    >
                                        <button
                                            className="delete-btn"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (window.confirm('Are you sure you want to delete this document?')) {
                                                    deleteDocument(doc.id);
                                                }
                                            }}
                                            title="Delete document"
                                            style={{
                                                position: 'absolute',
                                                top: '12px',
                                                right: '12px',
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--text-tertiary)',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                borderRadius: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                zIndex: 10,
                                            }}
                                            onMouseEnter={(e) => e.target.style.color = 'var(--color-error)'}
                                            onMouseLeave={(e) => e.target.style.color = 'var(--text-tertiary)'}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="doc-icon">
                                            <FileText size={20} />
                                        </div>
                                        <h4 className="doc-title">{doc.title}</h4>
                                        <div className="doc-meta">
                                            <div>Last edited {isValid ? format(dateObj, 'MMM d, yyyy') : 'N/A'}</div>
                                            <div>by {author?.name || 'Unknown'}</div>
                                        </div>
                                    </Link>
                                );
                            })}

                            {/* Add Document Card */}
                            <button
                                className="doc-card"
                                onClick={() => setCreateDocOpen(true)}
                                style={{
                                    border: '2px dashed var(--border-medium)',
                                    background: 'transparent',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: '150px',
                                    cursor: 'pointer',
                                }}
                            >
                                <Plus size={24} style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }} />
                                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                    Add Note
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            )}


            {/* Modals */}
            {createTaskOpen && (
                <CreateTaskModal
                    projectId={projectId}
                    onClose={() => setCreateTaskOpen(false)}
                />
            )}
            {aiTaskOpen && (
                <AITaskModal
                    projectId={projectId}
                    onClose={() => setAiTaskOpen(false)}
                />
            )}
            {createDocOpen && (
                <CreateDocumentModal
                    projectId={projectId}
                    onClose={() => setCreateDocOpen(false)}
                    onCreated={handleDocumentCreated}
                />
            )}
            {editProjectOpen && (
                <EditProjectModal
                    project={project}
                    onClose={() => setEditProjectOpen(false)}
                />
            )}
            {manageMembersOpen && (
                <ManageProjectMembersModal
                    project={project}
                    onClose={() => setManageMembersOpen(false)}
                />
            )}
        </div>
    );
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
