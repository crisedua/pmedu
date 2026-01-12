import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { X } from 'lucide-react';
import { format } from 'date-fns';

export default function CreateTaskModal({ onClose, initialData, onSuccess }) {
    const { createTask, users } = useData();
    const [name, setName] = useState(initialData?.name || initialData?.content || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [dueDate, setDueDate] = useState(initialData?.due_date ? format(new Date(initialData.due_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
    const [assignedTo, setAssignedTo] = useState(initialData?.assigned_to || '');
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [actionType, setActionType] = useState(initialData?.action_type || 'todo');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            const newTask = await createTask({
                name: name.trim(),
                description: description.trim(),
                dueDate: new Date(dueDate).toISOString(),
                assignedTo: assignedTo || null,
                status: 'To Do',
                actionType
            });
            if (onSuccess) onSuccess(newTask);
            onClose();
        } catch (error) {
            console.error('Error creating task:', error);
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{initialData ? 'Process Action' : 'Create New Action'}</h3>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Action / Task Name *</label>
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

                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Action Type</label>
                                <select
                                    className="form-select"
                                    value={actionType}
                                    onChange={(e) => setActionType(e.target.value)}
                                >
                                    <option value="todo">To Do</option>
                                    <option value="delegate">Delegate</option>
                                    <option value="discuss">Discuss</option>
                                    <option value="buy">Buy</option>
                                    <option value="read">Read</option>
                                </select>
                            </div>


                        </div>

                        <div className="form-group">
                            <label className="form-label">Description / Notes</label>
                            <textarea
                                className="form-textarea"
                                placeholder="Add more details..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
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
                                <label className="form-label">Owner (Assign To)</label>
                                <select
                                    className="form-select"
                                    value={assignedTo}
                                    onChange={(e) => setAssignedTo(e.target.value)}
                                >
                                    <option value="">Me (Unassigned)</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
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
                            {loading ? 'Saving...' : (initialData ? 'Process & Save' : 'Create Action')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
