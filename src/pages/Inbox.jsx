import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import {
    Trash2,
    ExternalLink,
    Sparkles,
    Clock,
    X,
    Save,
    CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';

export default function Inbox() {
    const {
        inbox,
        projects,
        deleteInboxItem,
        createTask
    } = useData();

    const [showMoveModal, setShowMoveModal] = useState(null);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [taskTitle, setTaskTitle] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (showMoveModal) {
            const initialTitle = showMoveModal.content.length > 60
                ? showMoveModal.content.substring(0, 60) + '...'
                : showMoveModal.content;
            setTaskTitle(initialTitle);
            setDueDate(''); // Clear or set default
        }
    }, [showMoveModal]);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const handleMoveToProject = async () => {
        if (!selectedProjectId || !showMoveModal) return;

        try {
            await createTask({
                name: taskTitle || (showMoveModal.content.substring(0, 60) + '...'),
                description: showMoveModal.content,
                projectId: selectedProjectId,
                due_date: dueDate || null,
                status: 'To Do'
            });
            await deleteInboxItem(showMoveModal.id);
            setShowMoveModal(null);
            setSelectedProjectId('');
            setTaskTitle('');
            setDueDate('');
            setSuccessMessage('Converted to project task!');
        } catch (err) {
            console.error('Error moving item:', err);
            alert('Failed to convert to task.');
        }
    };

    return (
        <div className="inbox-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Voice Inbox</h1>
                    <p className="page-subtitle">Triage your captured thoughts and ideas</p>
                </div>
                {successMessage && (
                    <div className="success-toast">
                        <CheckCircle2 size={16} />
                        {successMessage}
                    </div>
                )}
            </div>

            <div className="inbox-content">
                <div className="header-with-count mb-6">
                    <h2 className="section-title">Captured Items</h2>
                    <span className="count-badge">{inbox.length}</span>
                </div>

                {inbox.length === 0 ? (
                    <div className="card empty-inbox">
                        <div className="empty-state-icon">
                            <Clock size={48} />
                        </div>
                        <h3>Your inbox is empty</h3>
                        <p>Recorded tasks and ideas captured with the floating button will appear here.</p>
                    </div>
                ) : (
                    <div className="inbox-items-grid">
                        {inbox.map(item => (
                            <div key={item.id} className="inbox-item-card">
                                <div className="item-header">
                                    <div className="ai-tag">
                                        <Sparkles size={12} />
                                        <span>Transcribed ({item.language || 'auto'})</span>
                                    </div>
                                    <span className="timestamp">{format(new Date(item.created_at), 'MMM d, h:mm a')}</span>
                                </div>
                                <div className="item-body">
                                    {item.content}
                                </div>
                                <div className="item-footer">
                                    <button
                                        className="btn btn-ghost btn-sm triage-btn"
                                        onClick={() => setShowMoveModal(item)}
                                    >
                                        <ExternalLink size={14} />
                                        Move to Project
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-sm delete-btn"
                                        onClick={() => deleteInboxItem(item.id)}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Move Modal */}
            {showMoveModal && (
                <div className="modal-overlay" onClick={() => setShowMoveModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px' }}>
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="modal-icon-wrapper">
                                    <Sparkles size={18} />
                                </div>
                                <h2 className="modal-title">Convert to Task</h2>
                            </div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowMoveModal(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-6">
                                <label className="form-label mb-2 block opacity-70">TRANSCRIPTION PREVIEW</label>
                                <div className="premium-preview-box">
                                    <div className="quote-mark">"</div>
                                    <p>{showMoveModal.content}</p>
                                </div>
                            </div>
                            <div className="form-group mb-4">
                                <label className="form-label block mb-2">Task Title</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter task name..."
                                    value={taskTitle}
                                    onChange={(e) => setTaskTitle(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="form-group">
                                    <label className="form-label block mb-2">Destination Project</label>
                                    <div className="custom-select-wrapper">
                                        <select
                                            className="form-select"
                                            value={selectedProjectId}
                                            onChange={(e) => setSelectedProjectId(e.target.value)}
                                        >
                                            <option value="">Choose project...</option>
                                            {projects.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label block mb-2">Due Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer flex gap-3 justify-end">
                            <button className="btn btn-ghost" onClick={() => setShowMoveModal(null)}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                onClick={handleMoveToProject}
                                disabled={!selectedProjectId}
                            >
                                <CheckCircle2 size={18} />
                                Create Project Task
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .inbox-page {
                    max-width: 900px;
                    margin: 0 auto;
                }
                
                .success-toast {
                    display: flex;
                    align-items: center;
                    gap: var(--space-2);
                    background: var(--color-success);
                    color: white;
                    padding: var(--space-2) var(--space-4);
                    border-radius: var(--radius-full);
                    font-size: var(--text-sm);
                    font-weight: var(--font-medium);
                    animation: slideUp 0.3s ease;
                }

                .modal-icon-wrapper {
                    width: 32px;
                    height: 32px;
                    border-radius: var(--radius-md);
                    background: var(--bg-gradient);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
                }

                .premium-preview-box {
                    background: var(--bg-tertiary);
                    padding: var(--space-6);
                    border-radius: var(--radius-lg);
                    position: relative;
                    border: 1px solid var(--border-light);
                    transition: all 0.3s ease;
                }

                .premium-preview-box:hover {
                    border-color: var(--color-primary-300);
                    background: white;
                }

                .premium-preview-box p {
                    font-size: var(--text-sm);
                    line-height: 1.6;
                    color: var(--text-secondary);
                    font-style: italic;
                    max-height: 120px;
                    overflow-y: auto;
                    padding-right: var(--space-2);
                }

                .quote-mark {
                    position: absolute;
                    top: -10px;
                    left: 20px;
                    font-size: 40px;
                    color: var(--color-primary-200);
                    font-family: serif;
                    line-height: 1;
                    height: 20px;
                }

                .header-with-count {
                    display: flex;
                    align-items: center;
                    gap: var(--space-3);
                }

                .count-badge {
                    background: var(--color-primary-100);
                    color: var(--color-primary-700);
                    padding: 2px 8px;
                    border-radius: var(--radius-full);
                    font-size: var(--text-xs);
                    font-weight: var(--font-bold);
                }

                .inbox-items-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: var(--space-6);
                }

                .inbox-item-card {
                    background: var(--bg-primary);
                    border: 1px solid var(--border-light);
                    border-radius: var(--radius-xl);
                    padding: var(--space-5);
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-4);
                    transition: all 0.2s ease;
                }

                .inbox-item-card:hover {
                    box-shadow: var(--shadow-md);
                    border-color: var(--color-primary-200);
                }

                .item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .ai-tag {
                    display: flex;
                    align-items: center;
                    gap: var(--space-1);
                    font-size: 10px;
                    font-weight: var(--font-bold);
                    text-transform: uppercase;
                    color: var(--color-primary-600);
                    letter-spacing: 0.05em;
                }

                .timestamp {
                    font-size: var(--text-xs);
                    color: var(--text-muted);
                }

                .item-body {
                    font-size: var(--text-sm);
                    line-height: 1.6;
                    color: var(--text-primary);
                    flex: 1;
                }

                .item-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: var(--space-3);
                    border-top: 1px solid var(--border-light);
                }

                .triage-btn {
                    color: var(--color-primary-600);
                    font-weight: var(--font-semibold);
                }

                .delete-btn {
                    color: var(--text-muted);
                }

                .delete-btn:hover {
                    color: var(--color-error);
                    background: rgba(239, 68, 68, 0.05);
                }

                .empty-inbox {
                    padding: var(--space-16);
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: var(--space-4);
                }

                .empty-inbox h3 { color: var(--text-secondary); }
                .empty-inbox p { color: var(--text-muted); max-width: 300px; }

                @keyframes slideUp {
                    from { transform: translateY(10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .custom-select-wrapper {
                    position: relative;
                }

                .form-control, .form-select {
                    width: 100%;
                    padding: var(--space-3) var(--space-4);
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--border-medium);
                    background: var(--bg-primary);
                    font-size: var(--text-sm);
                    color: var(--text-primary);
                    transition: all 0.2s ease;
                }

                .form-control:focus, .form-select:focus {
                    outline: none;
                    border-color: var(--color-primary-600);
                    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
                }

                .grid { display: grid; }
                .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                .gap-4 { gap: 1rem; }
                .mb-4 { margin-bottom: 1rem; }

            `}</style>
        </div>
    );
}
