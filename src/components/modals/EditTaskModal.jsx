import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { X } from 'lucide-react';
import { format } from 'date-fns';

export default function EditTaskModal({ task, onClose }) {
    const { updateTask, users } = useData();
    const [name, setName] = useState(task.name);
    const [description, setDescription] = useState(task.description || '');
    const initialDate = task.due_date ? new Date(task.due_date) : null;
    const [dueDate, setDueDate] = useState(initialDate && !isNaN(initialDate.getTime()) ? format(initialDate, 'yyyy-MM-dd') : '');
    const [assignedTo, setAssignedTo] = useState(task.assigned_to || '');
    const [status, setStatus] = useState(task.status);
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        updateTask(task.id, {
            name: name.trim(),
            description: description.trim(),
            dueDate: new Date(dueDate).toISOString(),
            assignedTo: assignedTo || null,
            status,
        });

        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Edit Task</h3>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Task Name *</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="What needs to be done?"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-textarea"
                                placeholder="Add more details..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select
                                className="form-select"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="To Do">To Do</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Done">Done</option>
                            </select>
                        </div>

                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Due Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Assign To</label>
                                <select
                                    className="form-select"
                                    value={assignedTo}
                                    onChange={(e) => setAssignedTo(e.target.value)}
                                >
                                    <option value="">Unassigned</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {task.createdByAI && (
                            <div style={{
                                padding: 'var(--space-3)',
                                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: 'var(--text-xs)',
                                color: 'var(--color-primary-600)',
                            }}>
                                ✨ This task was created by AI
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!name.trim() || loading}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
