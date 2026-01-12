import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { CheckCircle2, Calendar, ArrowUpCircle, MessageSquare, Trash2, RefreshCw } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

export default function Archive() {
    const { tasks, updateTask, inbox, deleteInboxItem, updateInboxItem } = useData();
    const [activeTab, setActiveTab] = useState('actions');

    // --- TASKS LOGIC ---
    // specific filtering for done tasks
    const doneTasks = useMemo(() => {
        return tasks
            .filter(t => t.status === 'Done')
            .sort((a, b) => new Date(b.due_date || b.created_at) - new Date(a.due_date || a.created_at));
    }, [tasks]);

    // Grouping
    const groupedTasks = useMemo(() => {
        const groups = {
            today: [],
            yesterday: [],
            older: []
        };

        doneTasks.forEach(task => {
            const date = new Date(task.due_date || task.created_at);
            if (isToday(date)) groups.today.push(task);
            else if (isYesterday(date)) groups.yesterday.push(task);
            else groups.older.push(task);
        });

        return groups;
    }, [doneTasks]);

    const handleReactivate = (task) => {
        updateTask(task.id, { status: 'To Do' });
    };

    // --- INBOX LOGIC ---
    const processedInboxItems = useMemo(() => {
        return inbox
            .filter(item => item.processed)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [inbox]);

    const handleRestoreInbox = async (item) => {
        await updateInboxItem(item.id, { processed: false });
    };

    const handleDeleteInbox = async (item) => {
        if (confirm('Are you sure you want to delete this item permanently?')) {
            await deleteInboxItem(item.id);
        }
    };

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Archive</h1>
                    <p className="page-subtitle">
                        {activeTab === 'actions'
                            ? `History of completed actions (${doneTasks.length})`
                            : `Processed Inbox Items (${processedInboxItems.length})`
                        }
                    </p>
                </div>
            </div>

            {/* TABS */}
            <div className="tabs">
                <button
                    className={`tab-btn ${activeTab === 'actions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('actions')}
                >
                    <CheckCircle2 size={18} />
                    Completed Actions
                </button>
                <button
                    className={`tab-btn ${activeTab === 'inbox' ? 'active' : ''}`}
                    onClick={() => setActiveTab('inbox')}
                >
                    <MessageSquare size={18} />
                    Inbox History
                </button>
            </div>

            <div className="archive-list">

                {/* --- COMPLETED ACTIONS VIEW --- */}
                {activeTab === 'actions' && (
                    <>
                        {doneTasks.length === 0 && (
                            <div className="empty-state">
                                <CheckCircle2 size={48} className="text-muted" />
                                <h3>No completed tasks yet</h3>
                                <p>Finish some actions to see them here.</p>
                            </div>
                        )}

                        {/* Today */}
                        {groupedTasks.today.length > 0 && (
                            <div className="archive-section">
                                <h3 className="section-title">Completed Today</h3>
                                {groupedTasks.today.map(task => <ArchiveItem key={task.id} task={task} onRestore={handleReactivate} />)}
                            </div>
                        )}

                        {/* Yesterday */}
                        {groupedTasks.yesterday.length > 0 && (
                            <div className="archive-section">
                                <h3 className="section-title">Yesterday</h3>
                                {groupedTasks.yesterday.map(task => <ArchiveItem key={task.id} task={task} onRestore={handleReactivate} />)}
                            </div>
                        )}

                        {/* Older */}
                        {groupedTasks.older.length > 0 && (
                            <div className="archive-section">
                                <h3 className="section-title">Older</h3>
                                {groupedTasks.older.map(task => <ArchiveItem key={task.id} task={task} onRestore={handleReactivate} />)}
                            </div>
                        )}
                    </>
                )}

                {/* --- INBOX HISTORY VIEW --- */}
                {activeTab === 'inbox' && (
                    <>
                        {processedInboxItems.length === 0 && (
                            <div className="empty-state">
                                <MessageSquare size={48} className="text-muted" />
                                <h3>No processed items</h3>
                                <p>Items you process from the Inbox will appear here.</p>
                            </div>
                        )}

                        <div className="archive-section">
                            {processedInboxItems.map(item => (
                                <div key={item.id} className="archive-item">
                                    <div className="text-muted">
                                        <MessageSquare size={20} />
                                    </div>
                                    <div className="item-content">
                                        <div className="item-title" style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>
                                            {item.content}
                                        </div>
                                        <div className="item-meta">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {format(new Date(item.created_at), 'MMM d, yyyy · HH:mm')}
                                            </span>
                                            <span>Language: {item.language || 'en'}</span>
                                        </div>
                                    </div>
                                    <div className="actions flex gap-2">
                                        <button
                                            className="restore-btn"
                                            onClick={() => handleRestoreInbox(item)}
                                            title="Move back to Inbox"
                                        >
                                            <RefreshCw size={18} />
                                        </button>
                                        <button
                                            className="restore-btn text-danger"
                                            onClick={() => handleDeleteInbox(item)}
                                            title="Delete Permanently"
                                            style={{ color: 'var(--color-danger)' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <style>{`
                .tabs {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 2rem;
                    border-bottom: 1px solid var(--border-light);
                    padding-bottom: 0px;
                }
                .tab-btn {
                    background: none;
                    border: none;
                    padding: 1rem 1.5rem;
                    cursor: pointer;
                    font-weight: 500;
                    color: var(--text-tertiary);
                    border-bottom: 2px solid transparent;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                }
                .tab-btn:hover {
                    color: var(--color-primary);
                }
                .tab-btn.active {
                    color: var(--color-primary);
                    border-bottom-color: var(--color-primary);
                }

                .archive-list {
                    max-width: 800px;
                    margin: 0 auto;
                }
                .archive-section {
                    margin-bottom: 2rem;
                }
                .section-title {
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    color: var(--text-tertiary);
                    letter-spacing: 1px;
                    margin-bottom: 1rem;
                    font-weight: 600;
                }
                .archive-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    background: white;
                    padding: 1rem;
                    border-bottom: 1px solid var(--border-light);
                    transition: background 0.2s;
                }
                .archive-item:first-child { border-top-left-radius: var(--radius-lg); border-top-right-radius: var(--radius-lg); }
                .archive-item:last-child { border-bottom: none; border-bottom-left-radius: var(--radius-lg); border-bottom-right-radius: var(--radius-lg); }
                
                .archive-item:hover {
                    background: var(--bg-primary);
                }
                
                .item-content { flex: 1; }
                .item-title {
                    font-weight: 500;
                    color: var(--text-secondary);
                    margin-bottom: 4px;
                }
                .item-meta {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    display: flex;
                    gap: 1rem;
                }

                .restore-btn {
                    color: var(--text-tertiary);
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 50%;
                    transition: all 0.2s;
                }
                .restore-btn:hover {
                    background: var(--bg-tertiary);
                    color: var(--color-primary);
                }
                .text-danger:hover {
                    color: #ef4444 !important;
                    background: #fee2e2 !important;
                }
            `}</style>
        </div>
    );
}

function ArchiveItem({ task, onRestore }) {
    return (
        <div className="archive-item">
            <div className="text-success">
                <CheckCircle2 size={20} />
            </div>
            <div className="item-content">
                <div className="item-title" style={{ textDecoration: 'line-through' }}>{task.name}</div>
                <div className="item-meta">
                    <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {format(new Date(task.due_date || task.created_at), 'MMM d, yyyy')}
                    </span>
                    {task.project_id && <span>Context: {task.project_id}</span>}
                </div>
            </div>
            <button
                className="restore-btn"
                onClick={() => onRestore(task)}
                title="Restore to active"
            >
                <ArrowUpCircle size={20} />
            </button>
        </div>
    );
}
