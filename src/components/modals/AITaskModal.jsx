import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { X, Sparkles, Calendar, User, Check, Edit3, Trash2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { generateTasksFromAI } from '../../services/aiService';

export default function AITaskModal({ projectId, onClose }) {
    const { createMultipleTasks, users } = useData();
    const [input, setInput] = useState('');
    const [dueDate, setDueDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
    const [assignedTo, setAssignedTo] = useState('');
    const [loading, setLoading] = useState(false);
    const [generatedTasks, setGeneratedTasks] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);

    const handleGenerate = async () => {
        if (!input.trim()) return;

        setLoading(true);
        try {
            const tasks = await generateTasksFromAI(input.trim(), {
                dueDate: dueDate ? new Date(dueDate) : null,
                assignedTo: assignedTo || null,
                projectId,
                users,
            });
            setGeneratedTasks(tasks);
        } catch (error) {
            console.error('Error generating tasks:', error);
            alert('Failed to generate tasks. Please try again.');
        }
        setLoading(false);
    };

    const handleCreateTasks = async () => {
        if (!generatedTasks || generatedTasks.length === 0) return;

        setLoading(true);
        try {
            await createMultipleTasks(generatedTasks);
            onClose();
        } catch (error) {
            console.error('Error creating tasks:', error);
            setLoading(false);
            alert('Failed to create tasks. Please try again.');
        }
    };

    const handleEditTask = (index, field, value) => {
        const updated = [...generatedTasks];
        updated[index] = { ...updated[index], [field]: value };
        setGeneratedTasks(updated);
    };

    const handleRemoveTask = (index) => {
        setGeneratedTasks(generatedTasks.filter((_, i) => i !== index));
    };

    const getAssigneeName = (userId) => {
        const user = users.find(u => u.id === userId);
        return user?.name || 'Unassigned';
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header" style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-md)',
                            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                        }}>
                            <Sparkles size={18} />
                        </div>
                        <h3 className="modal-title">AI Task Creation</h3>
                    </div>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body">
                    {!generatedTasks ? (
                        <>
                            {/* Input Section */}
                            <div className="ai-input-container">
                                <div className="ai-input-header">
                                    <Sparkles size={18} />
                                    <span>Describe what needs to be done</span>
                                </div>

                                <textarea
                                    className="ai-textarea"
                                    placeholder="Example: Prepare the product launch for next Friday. Juan will handle the design and Maria will write the copy."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    rows={4}
                                    autoFocus
                                />

                                <div className="ai-options">
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">
                                            <Calendar size={14} style={{ marginRight: 'var(--space-1)' }} />
                                            Target Due Date (optional)
                                        </label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">
                                            <User size={14} style={{ marginRight: 'var(--space-1)' }} />
                                            Default Assignee (optional)
                                        </label>
                                        <select
                                            className="form-select"
                                            value={assignedTo}
                                            onChange={(e) => setAssignedTo(e.target.value)}
                                        >
                                            <option value="">Auto-detect from input</option>
                                            {users.map(user => (
                                                <option key={user.id} value={user.id}>
                                                    {user.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                marginTop: 'var(--space-4)',
                                padding: 'var(--space-3)',
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: 'var(--text-xs)',
                                color: 'var(--text-tertiary)',
                            }}>
                                💡 <strong>Tip:</strong> Mention team member names and dates in your description.
                                AI will automatically create tasks with appropriate assignments and due dates.
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Generated Tasks Preview */}
                            <div style={{ marginBottom: 'var(--space-4)' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 'var(--space-4)',
                                }}>
                                    <h4>
                                        <Check size={18} style={{ color: 'var(--color-accent-emerald)', marginRight: 'var(--space-2)' }} />
                                        Generated {generatedTasks.length} Tasks
                                    </h4>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => setGeneratedTasks(null)}
                                    >
                                        ← Regenerate
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                    {generatedTasks.map((task, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                padding: 'var(--space-4)',
                                                background: 'var(--bg-secondary)',
                                                borderRadius: 'var(--radius-lg)',
                                                border: '1px solid var(--border-light)',
                                            }}
                                        >
                                            {editingIndex === index ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={task.name}
                                                        onChange={(e) => handleEditTask(index, 'name', e.target.value)}
                                                        autoFocus
                                                    />
                                                    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                                                        <input
                                                            type="date"
                                                            className="form-input"
                                                            value={format(new Date(task.dueDate), 'yyyy-MM-dd')}
                                                            onChange={(e) => handleEditTask(index, 'dueDate', new Date(e.target.value).toISOString())}
                                                            style={{ flex: 1 }}
                                                        />
                                                        <select
                                                            className="form-select"
                                                            value={task.assignedTo || ''}
                                                            onChange={(e) => handleEditTask(index, 'assignedTo', e.target.value || null)}
                                                            style={{ flex: 1 }}
                                                        >
                                                            <option value="">Unassigned</option>
                                                            {users.map(user => (
                                                                <option key={user.id} value={user.id}>
                                                                    {user.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => setEditingIndex(null)}
                                                        >
                                                            Done
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>
                                                            {task.name}
                                                        </div>
                                                        <div style={{
                                                            display: 'flex',
                                                            gap: 'var(--space-4)',
                                                            fontSize: 'var(--text-xs)',
                                                            color: 'var(--text-tertiary)',
                                                        }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                                                <Calendar size={12} />
                                                                {format(new Date(task.dueDate), 'MMM d, yyyy')}
                                                            </span>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                                                <User size={12} />
                                                                {getAssigneeName(task.assignedTo)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                                                        <button
                                                            className="btn btn-ghost btn-icon btn-sm"
                                                            onClick={() => setEditingIndex(index)}
                                                            title="Edit"
                                                        >
                                                            <Edit3 size={14} />
                                                        </button>
                                                        <button
                                                            className="btn btn-ghost btn-icon btn-sm"
                                                            onClick={() => handleRemoveTask(index)}
                                                            title="Remove"
                                                            style={{ color: 'var(--color-error)' }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {generatedTasks.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>
                                        No tasks to create. Generate new tasks or cancel.
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>

                    {!generatedTasks ? (
                        <button
                            className="btn btn-ai"
                            onClick={handleGenerate}
                            disabled={!input.trim() || loading}
                        >
                            <span>
                                {loading ? (
                                    <>
                                        <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        Generate Tasks
                                    </>
                                )}
                            </span>
                        </button>
                    ) : (
                        <button
                            className="btn btn-success"
                            onClick={handleCreateTasks}
                            disabled={generatedTasks.length === 0}
                        >
                            <Check size={18} />
                            Create {generatedTasks.length} Tasks
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
