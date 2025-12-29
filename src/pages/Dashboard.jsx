import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import {
    Plus,
    FolderKanban,
    CheckCircle2,
    Clock,
    FileText,
    Sparkles,
    ArrowRight,
} from 'lucide-react';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import { format } from 'date-fns';

export default function Dashboard() {
    const { projects, tasks, documents, getTaskStats, getProjectProgress, getUser } = useData();
    const navigate = useNavigate();
    const [createProjectOpen, setCreateProjectOpen] = useState(false);

    const handleProjectCreated = (project) => {
        setCreateProjectOpen(false);
        navigate(`/project/${project.id}`);
    };

    // Calculate overall stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Done').length;
    const aiCreatedTasks = tasks.filter(t => t.created_by_ai).length;

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Welcome back 👋</h1>
                    <p className="page-subtitle">Here's what's happening across your projects</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary btn-lg" onClick={() => setCreateProjectOpen(true)}>
                        <Plus size={20} />
                        New Project
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="stats-grid mb-6">
                <div className="stat-card">
                    <div className="stat-value">{projects.length}</div>
                    <div className="stat-label">Active Projects</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{totalTasks}</div>
                    <div className="stat-label">Total Tasks</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{completedTasks}</div>
                    <div className="stat-label">Completed</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--color-primary-600)' }}>
                        {aiCreatedTasks}
                    </div>
                    <div className="stat-label">AI-Created Tasks</div>
                </div>
            </div>

            {/* Projects Section */}
            <div className="section">
                <div className="section-header">
                    <h2 className="section-title">Your Projects</h2>
                    <button className="btn btn-ghost btn-sm" onClick={() => setCreateProjectOpen(true)}>
                        <Plus size={16} />
                        Add Project
                    </button>
                </div>

                {projects.length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <FolderKanban size={40} />
                            </div>
                            <h3 className="empty-state-title">No projects yet</h3>
                            <p className="empty-state-description">
                                Create your first project to start organizing your work with AI assistance
                            </p>
                            <button className="btn btn-primary" onClick={() => setCreateProjectOpen(true)}>
                                <Plus size={18} />
                                Create Your First Project
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid-auto">
                        {projects.map(project => {
                            const stats = getTaskStats(project.id);
                            const progress = getProjectProgress(project.id);
                            const owner = getUser(project.owner_id);

                            return (
                                <Link
                                    key={project.id}
                                    to={`/project/${project.id}`}
                                    className="project-card"
                                >
                                    <div className="project-card-header">
                                        <div className="project-icon">
                                            <FolderKanban size={24} />
                                        </div>
                                        <span className={`status-badge status-${project.status.toLowerCase().replace(' ', '-')}`}>
                                            {project.status}
                                        </span>
                                    </div>

                                    <h3 className="project-name">{project.name}</h3>
                                    <p className="project-description">{project.description}</p>

                                    {stats.total > 0 && (
                                        <div style={{ marginBottom: 'var(--space-4)' }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                fontSize: 'var(--text-xs)',
                                                marginBottom: 'var(--space-2)',
                                                color: 'var(--text-tertiary)'
                                            }}>
                                                <span>{progress}% complete</span>
                                                <span>{stats.done}/{stats.total} tasks</span>
                                            </div>
                                            <div className="progress-bar">
                                                <div className="progress-fill" style={{ width: `${progress}%` }} />
                                            </div>
                                        </div>
                                    )}

                                    <div className="project-stats">
                                        <div className="project-stat">
                                            <CheckCircle2 size={16} />
                                            <span>{stats.done} done</span>
                                        </div>
                                        <div className="project-stat">
                                            <Clock size={16} />
                                            <span>{stats.inProgress} in progress</span>
                                        </div>
                                        <div className="project-stat">
                                            <FileText size={16} />
                                            <span>{documents.filter(d => d.project_id === project.id).length} docs</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}

                        {/* Add Project Card */}
                        <button
                            className="project-card"
                            onClick={() => setCreateProjectOpen(true)}
                            style={{
                                border: '2px dashed var(--border-medium)',
                                background: 'transparent',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '250px',
                                cursor: 'pointer',
                            }}
                        >
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: 'var(--radius-full)',
                                background: 'var(--bg-tertiary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 'var(--space-3)',
                                color: 'var(--text-muted)',
                            }}>
                                <Plus size={24} />
                            </div>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 'var(--font-medium)' }}>
                                Add New Project
                            </span>
                        </button>
                    </div>
                )}
            </div>


            {/* Create Project Modal */}
            {createProjectOpen && (
                <CreateProjectModal
                    onClose={() => setCreateProjectOpen(false)}
                    onCreated={handleProjectCreated}
                />
            )}
        </div>
    );
}
