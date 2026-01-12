import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import {
    Plus,
    FolderKanban,
    CheckCircle2,
    Clock,
    LayoutGrid
} from 'lucide-react';
import CreateProjectModal from '../components/modals/CreateProjectModal';

export default function ProjectsList() {
    const { projects, getTaskStats, getProjectProgress, getUser, dataLoaded } = useData();
    const [createProjectOpen, setCreateProjectOpen] = useState(false);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Projects</h1>
                    <p className="page-subtitle">Organize your actions into buckets</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary" onClick={() => setCreateProjectOpen(true)} disabled={!dataLoaded}>
                        <Plus size={20} />
                        New Project
                    </button>
                </div>
            </div>

            {projects.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-state-icon">
                        <FolderKanban size={40} />
                    </div>
                    <h3>No projects yet</h3>
                    <p>Create a project (e.g., "Marketing", "Personal") to organize your actions.</p>
                    <button className="btn btn-primary" onClick={() => setCreateProjectOpen(true)}>
                        <Plus size={18} />
                        Create Project
                    </button>
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
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {createProjectOpen && (
                <CreateProjectModal
                    onClose={() => setCreateProjectOpen(false)}
                    onCreated={() => setCreateProjectOpen(false)}
                />
            )}
        </div>
    );
}
