import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import {
    Plus,
    Sparkles,
    FileText,
    Upload,
    MoreVertical,
    Trash2,
    Edit3,
    Calendar,
    User,
    CheckCircle2,
    Circle,
    Clock,
    Download,
    File,
    ArrowLeft,
    Brain,
    List,
    LayoutGrid,
    Users,
} from 'lucide-react';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import AITaskModal from '../components/modals/AITaskModal';
import CreateDocumentModal from '../components/modals/CreateDocumentModal';
import AIDocumentModal from '../components/modals/AIDocumentModal';
import UploadFileModal from '../components/modals/UploadFileModal';
import EditProjectModal from '../components/modals/EditProjectModal';
import ManageProjectMembersModal from '../components/modals/ManageProjectMembersModal';
import KanbanBoard from '../components/KanbanBoard';
import TaskList from '../components/TaskList';
import { format } from 'date-fns';
import { getTodaySummary } from '../services/aiService';

export default function ProjectView() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const {
        getProject,
        getProjectTasks,
        getProjectDocuments,
        getProjectFiles,
        getTaskStats,
        getProjectProgress,
        getUser,
        deleteProject,
        deleteDocument,
        deleteFile,
        createDocument,
        currentUser,
    } = useData();

    const project = getProject(projectId);
    const tasks = getProjectTasks(projectId);
    const documents = getProjectDocuments(projectId);
    const files = getProjectFiles(projectId);
    const stats = getTaskStats(projectId);
    const progress = getProjectProgress(projectId);

    const [activeTab, setActiveTab] = useState('tasks');
    const [taskView, setTaskView] = useState('kanban'); // 'kanban' or 'list'
    const [showMenu, setShowMenu] = useState(false);
    const [aiSummary, setAiSummary] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(false);

    // Modals
    const [createTaskOpen, setCreateTaskOpen] = useState(false);
    const [aiTaskOpen, setAiTaskOpen] = useState(false);
    const [createDocOpen, setCreateDocOpen] = useState(false);
    const [aiDocOpen, setAiDocOpen] = useState(false);
    const [uploadFileOpen, setUploadFileOpen] = useState(false);
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

            {/* Project Header */}
            <div className="page-header">
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
                        <h1 className="page-title">{project.name}</h1>
                        <span className={`status-badge status-${project.status.toLowerCase().replace(' ', '-')}`}>
                            {project.status}
                        </span>
                    </div>
                    <p className="page-subtitle">{project.description}</p>
                </div>

                <div className="page-actions">
                    <div className="dropdown" style={{ position: 'relative' }}>
                        <button
                            className="btn btn-ghost btn-icon"
                            onClick={() => setShowMenu(!showMenu)}
                        >
                            <MoreVertical size={20} />
                        </button>
                        {showMenu && (
                            <>
                                <div
                                    style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                                    onClick={() => setShowMenu(false)}
                                />
                                <div className="dropdown-menu" style={{ opacity: 1, visibility: 'visible', transform: 'none' }}>
                                    <div className="dropdown-item" onClick={() => { setEditProjectOpen(true); setShowMenu(false); }}>
                                        <Edit3 size={16} />
                                        Edit Project
                                    </div>
                                    <div className="dropdown-item" onClick={() => { setManageMembersOpen(true); setShowMenu(false); }}>
                                        <Users size={16} />
                                        Manage Members
                                    </div>
                                    <div className="dropdown-divider" />
                                    <div className="dropdown-item danger" onClick={() => { handleDeleteProject(); setShowMenu(false); }}>
                                        <Trash2 size={16} />
                                        Delete Project
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="stats-grid mb-6">
                <div className="stat-card">
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Total Tasks</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--color-neutral-500)' }}>{stats.todo}</div>
                    <div className="stat-label">To Do</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--color-info)' }}>{stats.inProgress}</div>
                    <div className="stat-label">In Progress</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--color-accent-emerald)' }}>{stats.done}</div>
                    <div className="stat-label">Completed</div>
                </div>
            </div>

            {/* Progress Bar */}
            {stats.total > 0 && (
                <div className="card mb-6" style={{ padding: 'var(--space-4) var(--space-6)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                        <span style={{ fontWeight: 'var(--font-medium)' }}>Project Progress</span>
                        <span style={{ color: 'var(--text-tertiary)' }}>{progress}%</span>
                    </div>
                    <div className="progress-bar" style={{ height: '10px' }}>
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="quick-actions mb-6">
                <button className="quick-action-btn" onClick={() => setCreateTaskOpen(true)}>
                    <Plus size={18} />
                    New Task
                </button>
                <button className="quick-action-btn ai" onClick={() => setAiTaskOpen(true)}>
                    <Sparkles size={18} />
                    AI Create Tasks
                </button>
                <button className="quick-action-btn" onClick={() => setCreateDocOpen(true)}>
                    <FileText size={18} />
                    New Document
                </button>
                <button className="quick-action-btn ai" onClick={() => setAiDocOpen(true)}>
                    <Brain size={18} />
                    AI Create Document
                </button>
                <button className="quick-action-btn" onClick={() => setUploadFileOpen(true)}>
                    <Upload size={18} />
                    Upload File
                </button>
            </div>

            {/* Tabs */}
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
                    Documents ({documents.length})
                </button>
                <button
                    className={`tab ${activeTab === 'files' ? 'active' : ''}`}
                    onClick={() => setActiveTab('files')}
                >
                    <File size={16} style={{ marginRight: 'var(--space-2)' }} />
                    Files ({files.length})
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'tasks' && (
                <div>
                    {/* View Toggle */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
                        <div style={{
                            display: 'flex',
                            background: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-1)',
                        }}>
                            <button
                                className={`btn btn-sm ${taskView === 'kanban' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setTaskView('kanban')}
                            >
                                <LayoutGrid size={16} />
                                Kanban
                            </button>
                            <button
                                className={`btn btn-sm ${taskView === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setTaskView('list')}
                            >
                                <List size={16} />
                                List
                            </button>
                        </div>
                    </div>

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
                                            AI Create Tasks
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : taskView === 'kanban' ? (
                        <KanbanBoard projectId={projectId} />
                    ) : (
                        <TaskList projectId={projectId} />
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
                                <h3 className="empty-state-title">No documents yet</h3>
                                <p className="empty-state-description">
                                    Create a document manually or generate one with AI
                                </p>
                                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                                    <button className="btn btn-secondary" onClick={() => setCreateDocOpen(true)}>
                                        <Plus size={18} />
                                        New Document
                                    </button>
                                    <button className="btn btn-ai" onClick={() => setAiDocOpen(true)}>
                                        <span>
                                            <Brain size={18} />
                                            AI Create Document
                                        </span>
                                    </button>
                                </div>
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
                                    Add Document
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'files' && (
                <div>
                    {files.length === 0 ? (
                        <div className="card">
                            <div className="empty-state">
                                <div className="empty-state-icon">
                                    <Upload size={40} />
                                </div>
                                <h3 className="empty-state-title">No files yet</h3>
                                <p className="empty-state-description">
                                    Upload files to share with your team
                                </p>
                                <button className="btn btn-primary" onClick={() => setUploadFileOpen(true)}>
                                    <Upload size={18} />
                                    Upload File
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="card">
                            <div className="file-list">
                                {files.map(file => {
                                    const uploader = getUser(file.uploaded_by);
                                    const fileDate = new Date(file.created_at || new Date());
                                    const isValidFileDate = !isNaN(fileDate.getTime());

                                    return (
                                        <div key={file.id} className="file-item">
                                            <div className="file-icon">
                                                <File size={18} />
                                            </div>
                                            <div className="file-info">
                                                <div className="file-name">{file.name}</div>
                                                <div className="file-meta">
                                                    Uploaded by {uploader?.name || 'Unknown'} on {isValidFileDate ? format(fileDate, 'MMM d, yyyy') : 'N/A'}
                                                    {' • '}{formatFileSize(file.size)}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                                <button className="btn btn-ghost btn-icon btn-sm" title="Download">
                                                    <Download size={16} />
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-icon btn-sm"
                                                    title="Delete"
                                                    onClick={() => {
                                                        if (confirm('Delete this file?')) {
                                                            deleteFile(file.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="card-footer">
                                <button className="btn btn-secondary btn-sm" onClick={() => setUploadFileOpen(true)}>
                                    <Upload size={16} />
                                    Upload More Files
                                </button>
                            </div>
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
            {aiDocOpen && (
                <AIDocumentModal
                    projectId={projectId}
                    onClose={() => setAiDocOpen(false)}
                    onCreated={handleDocumentCreated}
                />
            )}
            {uploadFileOpen && (
                <UploadFileModal
                    projectId={projectId}
                    onClose={() => setUploadFileOpen(false)}
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
