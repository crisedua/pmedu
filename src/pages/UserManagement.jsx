import { useState } from 'react';
import { useData } from '../context/DataContext';
import { Shield, User, Mail, Activity, ShieldAlert } from 'lucide-react';

export default function UserManagement() {
    const { users, tasks, currentUser } = useData();
    const [selectedUser, setSelectedUser] = useState(null);

    // Check if current user is admin
    if (currentUser?.role !== 'admin') {
        return (
            <div className="empty-state">
                <ShieldAlert size={48} className="text-error mb-4" />
                <h2>Access Denied</h2>
                <p>Only administrators can access user management.</p>
            </div>
        );
    }

    // Get stats for a specific user
    const getUserStats = (userId) => {
        const userTasks = tasks.filter(t => t.assigned_to === userId);
        const pending = userTasks.filter(t => t.status !== 'Done').length;
        const completed = userTasks.filter(t => t.status === 'Done').length;
        return { pending, completed };
    };

    return (
        <div className="page-container fade-in">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">User Management</h1>
                    <p className="page-subtitle">Manage system users and view their action status</p>
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
                    <div className="stat-value">{tasks.filter(t => t.status !== 'Done').length}</div>
                    <div className="stat-label">Open Actions</div>
                </div>
            </div>

            {/* User List */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">All Users</h3>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {users.map(user => {
                            const { pending, completed } = getUserStats(user.id);
                            const isExpanded = selectedUser === user.id;
                            const isAdmin = user.role === 'admin';

                            return (
                                <div
                                    key={user.id}
                                    style={{
                                        borderBottom: '1px solid var(--border-light)',
                                        padding: 'var(--space-4) var(--space-6)',
                                        background: isExpanded ? 'var(--bg-secondary)' : 'transparent',
                                        transition: 'background 0.2s'
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
                                            <div className="avatar">
                                                {user.avatar || user.name.charAt(0)}
                                            </div>
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
                                                            padding: '2px 8px'
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
                                            <div className="flex gap-4">
                                                <div className="text-center">
                                                    <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{pending}</div>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Open</div>
                                                </div>
                                                <div className="text-center">
                                                    <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{completed}</div>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Done</div>
                                                </div>
                                            </div>
                                            <button className="btn btn-ghost btn-sm">
                                                {isExpanded ? 'Hide' : 'Details'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded User Details */}
                                    {isExpanded && (
                                        <div style={{
                                            marginTop: 'var(--space-4)',
                                            padding: 'var(--space-4)',
                                            background: 'var(--bg-primary)',
                                            borderRadius: 'var(--radius-lg)',
                                            border: '1px solid var(--border-light)',
                                            animation: 'fadeIn 0.2s ease'
                                        }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                                <div>
                                                    <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>User Details</h4>
                                                    <p className="text-sm"><strong>Role:</strong> {user.role}</p>
                                                    <p className="text-sm"><strong>Status:</strong> Active</p>
                                                </div>
                                                <div>
                                                    <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Action Performance</h4>
                                                    <p className="text-sm"><strong>Total Actions:</strong> {pending + completed}</p>
                                                    <p className="text-sm"><strong>Completion Rate:</strong> {pending + completed > 0 ? Math.round((completed / (pending + completed)) * 100) : 0}%</p>
                                                </div>
                                            </div>
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
