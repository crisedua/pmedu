import { useState } from 'react';
import { useData } from '../context/DataContext';
import { Shield, User, Mail, FolderKanban, UserPlus, UserMinus, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function UserManagement() {
    const { users, projects, updateProject, currentUser } = useData();
    const [selectedUser, setSelectedUser] = useState(null);

    // Check if current user is admin
    if (currentUser?.role !== 'admin') {
        return (
            <div className="empty-state">
                <h2>Access Denied</h2>
                <p>Only administrators can access user management.</p>
            </div>
        );
    }

    // Get projects for a specific user
    const getUserProjects = (userId) => {
        return projects.filter(p => p.members?.includes(userId) || p.owner_id === userId);
    };

    // Add user to project
    const addUserToProject = (userId, projectId) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const currentMembers = project.members || [];
        if (!currentMembers.includes(userId)) {
            updateProject(projectId, { members: [...currentMembers, userId] });
        }
    };

    // Remove user from project
    const removeUserFromProject = (userId, projectId) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        // Don't allow removing the owner
        if (project.owner_id === userId) {
            alert('Cannot remove project owner from their project');
            return;
        }

        const updatedMembers = (project.members || []).filter(id => id !== userId);
        updateProject(projectId, { members: updatedMembers });
    };

    // Get projects user is NOT in
    const getAvailableProjects = (userId) => {
        return projects.filter(p => {
            const members = p.members || [];
            return !members.includes(userId) && p.owner_id !== userId;
        });
    };

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">User Management</h1>
                    <p className="page-subtitle">Manage users and their project assignments</p>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid mb-6">
                <div className="stat-card">
                    <div className="stat-value">{users.length}</div>
                    <div className="stat-label">Total Users</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{users.filter(u => u.role === 'admin').length}</div>
                    <div className="stat-label">Admins</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{projects.length}</div>
                    <div className="stat-label">Total Projects</div>
                </div>
            </div>

            {/* User List */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">All Users</h3>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {users.map(user => {
                            const userProjects = getUserProjects(user.id);
                            const availableProjects = getAvailableProjects(user.id);
                            const isExpanded = selectedUser === user.id;
                            const isAdmin = user.role === 'admin';

                            return (
                                <div
                                    key={user.id}
                                    style={{
                                        borderBottom: '1px solid var(--border-light)',
                                        padding: 'var(--space-4) var(--space-6)',
                                    }}
                                >
                                    {/* User Header */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => setSelectedUser(isExpanded ? null : user.id)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                            <div className="avatar">{user.avatar}</div>
                                            <div>
                                                <div style={{
                                                    fontWeight: 'var(--font-semibold)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 'var(--space-2)',
                                                }}>
                                                    {user.name}
                                                    {isAdmin && (
                                                        <span className="badge badge-warning" style={{
                                                            fontSize: 'var(--text-xs)',
                                                            background: 'rgba(245, 158, 11, 0.1)',
                                                            color: 'var(--color-accent-amber)',
                                                        }}>
                                                            <Shield size={10} />
                                                            Admin
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{
                                                    fontSize: 'var(--text-sm)',
                                                    color: 'var(--text-muted)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 'var(--space-2)',
                                                }}>
                                                    <Mail size={14} />
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                                            <div className="badge badge-neutral">
                                                {userProjects.length} {userProjects.length === 1 ? 'project' : 'projects'}
                                            </div>
                                            <button className="btn btn-ghost btn-sm">
                                                {isExpanded ? 'Hide' : 'Manage'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded User Details */}
                                    {isExpanded && (
                                        <div style={{
                                            marginTop: 'var(--space-4)',
                                            paddingTop: 'var(--space-4)',
                                            borderTop: '1px solid var(--border-light)',
                                        }}>
                                            {/* Current Projects */}
                                            <div style={{ marginBottom: 'var(--space-4)' }}>
                                                <h4 style={{
                                                    fontSize: 'var(--text-sm)',
                                                    fontWeight: 'var(--font-semibold)',
                                                    marginBottom: 'var(--space-2)',
                                                }}>
                                                    Assigned Projects ({userProjects.length})
                                                </h4>
                                                {userProjects.length === 0 ? (
                                                    <div style={{
                                                        padding: 'var(--space-3)',
                                                        background: 'var(--bg-tertiary)',
                                                        borderRadius: 'var(--radius-md)',
                                                        fontSize: 'var(--text-sm)',
                                                        color: 'var(--text-muted)',
                                                        textAlign: 'center',
                                                    }}>
                                                        Not assigned to any projects
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                                        {userProjects.map(project => {
                                                            const isOwner = project.owner_id === user.id;
                                                            return (
                                                                <div
                                                                    key={project.id}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'space-between',
                                                                        padding: 'var(--space-2) var(--space-3)',
                                                                        background: 'var(--bg-secondary)',
                                                                        borderRadius: 'var(--radius-md)',
                                                                        border: '1px solid var(--border-light)',
                                                                    }}
                                                                >
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                                                        <FolderKanban size={16} style={{ color: 'var(--color-primary-600)' }} />
                                                                        <span style={{ fontSize: 'var(--text-sm)' }}>{project.name}</span>
                                                                        {isOwner && (
                                                                            <span className="badge badge-primary" style={{ fontSize: '10px' }}>
                                                                                Owner
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {!isOwner && (
                                                                        <button
                                                                            className="btn btn-ghost btn-icon btn-sm"
                                                                            onClick={() => removeUserFromProject(user.id, project.id)}
                                                                            title="Remove from project"
                                                                        >
                                                                            <UserMinus size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Available Projects to Add */}
                                            {availableProjects.length > 0 && (
                                                <div>
                                                    <h4 style={{
                                                        fontSize: 'var(--text-sm)',
                                                        fontWeight: 'var(--font-semibold)',
                                                        marginBottom: 'var(--space-2)',
                                                    }}>
                                                        Add to Project
                                                    </h4>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                                        {availableProjects.map(project => (
                                                            <div
                                                                key={project.id}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'space-between',
                                                                    padding: 'var(--space-2) var(--space-3)',
                                                                    background: 'var(--bg-secondary)',
                                                                    borderRadius: 'var(--radius-md)',
                                                                    border: '1px solid var(--border-light)',
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                                                    <FolderKanban size={16} style={{ color: 'var(--text-muted)' }} />
                                                                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                                                        {project.name}
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    className="btn btn-primary btn-sm"
                                                                    onClick={() => addUserToProject(user.id, project.id)}
                                                                >
                                                                    <UserPlus size={14} />
                                                                    Add
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
