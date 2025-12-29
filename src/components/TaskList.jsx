import { useState } from 'react';
import { useData } from '../context/DataContext';
import {
    CheckCircle2,
    Circle,
    Calendar,
    Sparkles,
    MoreVertical,
    Trash2,
    Edit3,
    ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';
import EditTaskModal from './modals/EditTaskModal';

export default function TaskList({ projectId }) {
    const { getProjectTasks, updateTask, deleteTask, getUser, users } = useData();
    const tasks = getProjectTasks(projectId);

    const [editingTask, setEditingTask] = useState(null);
    const [menuOpen, setMenuOpen] = useState(null);
    const [editingField, setEditingField] = useState(null);

    const handleToggleComplete = (task) => {
        const newStatus = task.status === 'Done' ? 'To Do' : 'Done';
        updateTask(task.id, { status: newStatus });
    };

    const handleDeleteTask = (taskId) => {
        if (confirm('Delete this task?')) {
            deleteTask(taskId);
        }
        setMenuOpen(null);
    };

    const handleStatusChange = (taskId, newStatus) => {
        updateTask(taskId, { status: newStatus });
        setEditingField(null);
    };

    const handleAssigneeChange = (taskId, userId) => {
        updateTask(taskId, { assignedTo: userId });
        setEditingField(null);
    };

    const handleDueDateChange = (taskId, date) => {
        updateTask(taskId, { dueDate: new Date(date).toISOString() });
        setEditingField(null);
    };

    // Sort tasks: incomplete first, then by due date
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.status === 'Done' && b.status !== 'Done') return 1;
        if (a.status !== 'Done' && b.status === 'Done') return -1;
        const dateA = a.due_date ? new Date(a.due_date) : new Date(0);
        const dateB = b.due_date ? new Date(b.due_date) : new Date(0);
        return dateA - dateB;
    });

    return (
        <>
            <div className="card">
                <div className="task-list">
                    {sortedTasks.map(task => {
                        const assignee = getUser(task.assigned_to);
                        const taskDate = task.due_date ? new Date(task.due_date) : null;
                        const isOverdue = task.status !== 'Done' && taskDate && taskDate < new Date();
                        const isValidDate = taskDate && !isNaN(taskDate.getTime());
                        const isDone = task.status === 'Done';

                        return (
                            <div
                                key={task.id}
                                className={`task-item ${task.created_by_ai ? 'ai-created' : ''}`}
                            >
                                {/* Checkbox */}
                                <div
                                    className={`task-checkbox ${isDone ? 'checked' : ''}`}
                                    onClick={() => handleToggleComplete(task)}
                                >
                                    {isDone && <CheckCircle2 size={14} />}
                                </div>

                                {/* Task Content */}
                                <div className="task-content">
                                    <div className={`task-name ${isDone ? 'completed' : ''}`}>
                                        {task.name}
                                        {task.created_by_ai && (
                                            <span className="badge badge-ai" style={{
                                                marginLeft: 'var(--space-2)',
                                                fontSize: '10px',
                                                verticalAlign: 'middle',
                                            }}>
                                                <Sparkles size={10} />
                                                AI
                                            </span>
                                        )}
                                    </div>
                                    {task.description && (
                                        <p style={{
                                            fontSize: 'var(--text-xs)',
                                            color: 'var(--text-muted)',
                                            marginTop: 'var(--space-1)',
                                            marginBottom: 0,
                                        }}>
                                            {task.description}
                                        </p>
                                    )}
                                </div>

                                {/* Status */}
                                <div style={{ position: 'relative' }}>
                                    <button
                                        className={`task-status task-${task.status.toLowerCase().replace(' ', '-')}`}
                                        onClick={() => setEditingField(editingField === `status-${task.id}` ? null : `status-${task.id}`)}
                                        style={{ cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        {task.status}
                                        <ChevronDown size={12} />
                                    </button>

                                    {editingField === `status-${task.id}` && (
                                        <>
                                            <div
                                                style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                                                onClick={() => setEditingField(null)}
                                            />
                                            <div className="dropdown-menu" style={{
                                                opacity: 1,
                                                visibility: 'visible',
                                                transform: 'none',
                                                left: 0,
                                                top: '100%',
                                                minWidth: '120px',
                                            }}>
                                                {['To Do', 'In Progress', 'Done'].map(status => (
                                                    <div
                                                        key={status}
                                                        className="dropdown-item"
                                                        onClick={() => handleStatusChange(task.id, status)}
                                                        style={{
                                                            fontWeight: task.status === status ? 'bold' : 'normal',
                                                        }}
                                                    >
                                                        {status}
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Due Date */}
                                <div style={{ position: 'relative' }}>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => setEditingField(editingField === `date-${task.id}` ? null : `date-${task.id}`)}
                                        style={{
                                            color: isOverdue ? 'var(--color-error)' : 'var(--text-tertiary)',
                                            gap: 'var(--space-1)',
                                        }}
                                    >
                                        <Calendar size={14} />
                                        {isValidDate ? format(taskDate, 'MMM d') : 'No date'}
                                    </button>

                                    {editingField === `date-${task.id}` && (
                                        <>
                                            <div
                                                style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                                                onClick={() => setEditingField(null)}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                background: 'var(--bg-primary)',
                                                border: '1px solid var(--border-light)',
                                                borderRadius: 'var(--radius-lg)',
                                                padding: 'var(--space-2)',
                                                boxShadow: 'var(--shadow-lg)',
                                                zIndex: 100,
                                            }}>
                                                <input
                                                    type="date"
                                                    defaultValue={isValidDate ? format(taskDate, 'yyyy-MM-dd') : ''}
                                                    onChange={(e) => handleDueDateChange(task.id, e.target.value)}
                                                    className="form-input"
                                                    style={{ padding: 'var(--space-2)' }}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Assignee */}
                                <div style={{ position: 'relative' }}>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => setEditingField(editingField === `assignee-${task.id}` ? null : `assignee-${task.id}`)}
                                        style={{ gap: 'var(--space-2)' }}
                                    >
                                        {assignee ? (
                                            <>
                                                <div className="avatar avatar-sm">{assignee.avatar}</div>
                                                <span style={{ fontSize: 'var(--text-xs)' }}>{assignee.name.split(' ')[0]}</span>
                                            </>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                                        )}
                                        <ChevronDown size={12} />
                                    </button>

                                    {editingField === `assignee-${task.id}` && (
                                        <>
                                            <div
                                                style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                                                onClick={() => setEditingField(null)}
                                            />
                                            <div className="dropdown-menu" style={{
                                                opacity: 1,
                                                visibility: 'visible',
                                                transform: 'none',
                                                right: 0,
                                                top: '100%',
                                                minWidth: '180px',
                                            }}>
                                                <div
                                                    className="dropdown-item"
                                                    onClick={() => handleAssigneeChange(task.id, null)}
                                                >
                                                    Unassigned
                                                </div>
                                                <div className="dropdown-divider" />
                                                {users.map(user => (
                                                    <div
                                                        key={user.id}
                                                        className="dropdown-item"
                                                        onClick={() => handleAssigneeChange(task.id, user.id)}
                                                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                                                    >
                                                        <div className="avatar avatar-sm">{user.avatar}</div>
                                                        {user.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="task-actions" style={{ opacity: 1 }}>
                                    <div style={{ position: 'relative' }}>
                                        <button
                                            className="btn btn-ghost btn-icon btn-sm"
                                            onClick={() => setMenuOpen(menuOpen === task.id ? null : task.id)}
                                        >
                                            <MoreVertical size={16} />
                                        </button>

                                        {menuOpen === task.id && (
                                            <>
                                                <div
                                                    style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                                                    onClick={() => setMenuOpen(null)}
                                                />
                                                <div className="dropdown-menu" style={{
                                                    opacity: 1,
                                                    visibility: 'visible',
                                                    transform: 'none',
                                                    right: 0,
                                                    top: '100%',
                                                }}>
                                                    <div
                                                        className="dropdown-item"
                                                        onClick={() => {
                                                            setEditingTask(task);
                                                            setMenuOpen(null);
                                                        }}
                                                    >
                                                        <Edit3 size={14} />
                                                        Edit
                                                    </div>
                                                    <div
                                                        className="dropdown-item danger"
                                                        onClick={() => handleDeleteTask(task.id)}
                                                    >
                                                        <Trash2 size={14} />
                                                        Delete
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {tasks.length === 0 && (
                        <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No tasks yet
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Task Modal */}
            {editingTask && (
                <EditTaskModal
                    task={editingTask}
                    onClose={() => setEditingTask(null)}
                />
            )}
        </>
    );
}
