import { useState } from 'react';
import { useData } from '../context/DataContext';
import {
    Circle,
    Clock,
    CheckCircle2,
    Calendar,
    User,
    Sparkles,
    MoreVertical,
    Trash2,
    Edit3,
    GripVertical,
} from 'lucide-react';
import { format } from 'date-fns';
import EditTaskModal from './modals/EditTaskModal';

const STATUSES = [
    { id: 'To Do', label: 'To Do', icon: Circle, color: 'var(--color-neutral-500)' },
    { id: 'In Progress', label: 'In Progress', icon: Clock, color: 'var(--color-info)' },
    { id: 'Done', label: 'Done', icon: CheckCircle2, color: 'var(--color-accent-emerald)' },
];

export default function KanbanBoard({ projectId }) {
    const { getProjectTasks, updateTask, deleteTask, getUser } = useData();
    const tasks = getProjectTasks(projectId);

    const [draggedTask, setDraggedTask] = useState(null);
    const [dragOverColumn, setDragOverColumn] = useState(null);
    const [editingTask, setEditingTask] = useState(null);
    const [menuOpen, setMenuOpen] = useState(null);

    const handleDragStart = (e, task) => {
        setDraggedTask(task);
        e.dataTransfer.effectAllowed = 'move';
        // Add a delay to show the drag ghost properly
        setTimeout(() => {
            e.target.style.opacity = '0.5';
        }, 0);
    };

    const handleDragEnd = (e) => {
        e.target.style.opacity = '1';
        setDraggedTask(null);
        setDragOverColumn(null);
    };

    const handleDragOver = (e, status) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverColumn(status);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = (e, status) => {
        e.preventDefault();
        if (draggedTask && draggedTask.status !== status) {
            updateTask(draggedTask.id, { status });
        }
        setDragOverColumn(null);
    };

    const handleDeleteTask = (taskId) => {
        if (confirm('Delete this task?')) {
            deleteTask(taskId);
        }
        setMenuOpen(null);
    };

    return (
        <>
            <div className="kanban-board">
                {STATUSES.map(status => {
                    const StatusIcon = status.icon;
                    const columnTasks = tasks.filter(t => t.status === status.id);
                    const isDragOver = dragOverColumn === status.id;

                    return (
                        <div
                            key={status.id}
                            className="kanban-column"
                            onDragOver={(e) => handleDragOver(e, status.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, status.id)}
                            style={{
                                background: isDragOver
                                    ? 'rgba(99, 102, 241, 0.05)'
                                    : 'var(--bg-secondary)',
                                borderColor: isDragOver
                                    ? 'var(--color-primary-300)'
                                    : 'transparent',
                                borderWidth: '2px',
                                borderStyle: 'dashed',
                            }}
                        >
                            <div className="kanban-header">
                                <div className="kanban-title">
                                    <StatusIcon size={16} style={{ color: status.color }} />
                                    {status.label}
                                </div>
                                <span className="kanban-count">{columnTasks.length}</span>
                            </div>

                            <div className="kanban-tasks">
                                {columnTasks.map(task => {
                                    const assignee = getUser(task.assigned_to);
                                    const taskDate = task.due_date ? new Date(task.due_date) : null;
                                    const isOverdue = task.status !== 'Done' && taskDate && taskDate < new Date();
                                    const isValidDate = taskDate && !isNaN(taskDate.getTime());

                                    return (
                                        <div
                                            key={task.id}
                                            className={`kanban-task ${task.createdByAI ? 'ai-created' : ''}`}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, task)}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                marginBottom: 'var(--space-2)',
                                            }}>
                                                <div className="kanban-task-title" style={{
                                                    textDecoration: task.status === 'Done' ? 'line-through' : 'none',
                                                    color: task.status === 'Done' ? 'var(--text-tertiary)' : 'var(--text-primary)',
                                                }}>
                                                    {task.name}
                                                </div>

                                                <div style={{ position: 'relative' }}>
                                                    <button
                                                        className="btn btn-ghost btn-icon btn-sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setMenuOpen(menuOpen === task.id ? null : task.id);
                                                        }}
                                                        style={{ marginTop: '-4px', marginRight: '-8px' }}
                                                    >
                                                        <MoreVertical size={14} />
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

                                            {task.createdByAI && (
                                                <div style={{ marginBottom: 'var(--space-2)' }}>
                                                    <span className="badge badge-ai" style={{ fontSize: '10px' }}>
                                                        <Sparkles size={10} />
                                                        AI Generated
                                                    </span>
                                                </div>
                                            )}

                                            <div className="kanban-task-footer">
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 'var(--space-1)',
                                                    color: isOverdue ? 'var(--color-error)' : 'var(--text-tertiary)',
                                                }}>
                                                    <Calendar size={12} />
                                                    {isValidDate ? format(taskDate, 'MMM d') : 'No date'}
                                                </div>

                                                {assignee && (
                                                    <div className="avatar avatar-sm" title={assignee.name}>
                                                        {assignee.avatar}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {columnTasks.length === 0 && (
                                    <div style={{
                                        padding: 'var(--space-6)',
                                        textAlign: 'center',
                                        color: 'var(--text-muted)',
                                        fontSize: 'var(--text-sm)',
                                        background: isDragOver ? 'transparent' : 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px dashed var(--border-light)',
                                    }}>
                                        {isDragOver ? 'Drop here' : 'No tasks'}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
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
