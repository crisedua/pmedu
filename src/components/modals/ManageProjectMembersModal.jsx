import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { X, UserPlus, Trash2, Shield, User as UserIcon } from 'lucide-react';

export default function ManageProjectMembersModal({ project, onClose }) {
    const { users, currentUser, updateProject } = useData();
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);

    useEffect(() => {
        // Get current members
        const currentMembers = project.members || [];
        setSelectedUsers(currentMembers);

        // Filter out current members from available users
        const available = users.filter(u => !currentMembers.includes(u.id));
        setAvailableUsers(available);
    }, [project, users]);

    const handleAddMember = (userId) => {
        const updatedMembers = [...selectedUsers, userId];
        setSelectedUsers(updatedMembers);
        updateProject(project.id, { members: updatedMembers });
        setAvailableUsers(availableUsers.filter(u => u.id !== userId));
    };

    const handleRemoveMember = (userId) => {
        // Don't allow removing the project owner
        if (userId === project.owner_id) {
            alert('Cannot remove the project owner');
            return;
        }

        const updatedMembers = selectedUsers.filter(id => id !== userId);
        setSelectedUsers(updatedMembers);
        updateProject(project.id, { members: updatedMembers });

        const removedUser = users.find(u => u.id === userId);
        if (removedUser) {
            setAvailableUsers([...availableUsers, removedUser]);
        }
    };

    // Check if current user can manage members (admin or project owner)
    const canManage = currentUser?.role === 'admin' || currentUser?.id === project.owner_id;

    if (!canManage) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2 className="modal-title">Permission Denied</h2>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                    <div className="modal-body">
                        <p>Only project owners and admins can manage project members.</p>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const getMemberUser = (userId) => users.find(u => u.id === userId);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Manage Project Members</h2>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Current Members */}
                    <div style={{ marginBottom: 'var(--space-6)' }}>
                        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>
                            Current Members ({selectedUsers.length})
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            {selectedUsers.length === 0 ? (
                                <div style={{
                                    padding: 'var(--space-4)',
                                    textAlign: 'center',
                                    color: 'var(--text-muted)',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-md)'
                                }}>
                                    No members added yet
                                </div>
                            ) : (
                                selectedUsers.map(userId => {
                                    const user = getMemberUser(userId);
                                    if (!user) return null;

                                    const isOwner = userId === project.owner_id;
                                    const isAdmin = user.role === 'admin';

                                    return (
                                        <div
                                            key={userId}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: 'var(--space-3)',
                                                background: 'var(--bg-secondary)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border-light)',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                                <div className="avatar">{user.avatar}</div>
                                                <div>
                                                    <div style={{ fontWeight: 'var(--font-medium)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                                        {user.name}
                                                        {isOwner && (
                                                            <span className="badge badge-primary" style={{ fontSize: 'var(--text-xs)' }}>
                                                                Owner
                                                            </span>
                                                        )}
                                                        {isAdmin && (
                                                            <span className="badge badge-warning" style={{ fontSize: 'var(--text-xs)', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-accent-amber)' }}>
                                                                <Shield size={10} />
                                                                Admin
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                            {!isOwner && (
                                                <button
                                                    className="btn btn-ghost btn-icon btn-sm"
                                                    onClick={() => handleRemoveMember(userId)}
                                                    title="Remove member"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Add Members */}
                    <div>
                        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>
                            Add Members
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            {availableUsers.length === 0 ? (
                                <div style={{
                                    padding: 'var(--space-4)',
                                    textAlign: 'center',
                                    color: 'var(--text-muted)',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-md)'
                                }}>
                                    All users are already members of this project
                                </div>
                            ) : (
                                availableUsers.map(user => {
                                    const isAdmin = user.role === 'admin';

                                    return (
                                        <div
                                            key={user.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: 'var(--space-3)',
                                                background: 'var(--bg-secondary)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border-light)',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                                <div className="avatar">{user.avatar}</div>
                                                <div>
                                                    <div style={{ fontWeight: 'var(--font-medium)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                                        {user.name}
                                                        {isAdmin && (
                                                            <span className="badge badge-warning" style={{ fontSize: 'var(--text-xs)', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-accent-amber)' }}>
                                                                <Shield size={10} />
                                                                Admin
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => handleAddMember(user.id)}
                                            >
                                                <UserPlus size={16} />
                                                Add
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
