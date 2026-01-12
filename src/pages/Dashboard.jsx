import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import {
    Plus,
    FolderKanban,
    Sparkles,
    Loader2,
    Zap,
    Clock,
    Inbox
} from 'lucide-react';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import EditTaskModal from '../components/modals/EditTaskModal';
import ActionCard from '../components/ActionCard';
import { format, isToday, isPast, isFuture } from 'date-fns';

export default function Dashboard() {
    const {
        projects,
        tasks,
        inbox,
        currentUser,
        updateTask,
        deleteTask,
        deleteInboxItem,
        updateInboxItem,
        dataLoaded,
        loading
    } = useData();
    const navigate = useNavigate();
    const [createProjectOpen, setCreateProjectOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    const isSlowConnection = !dataLoaded && loading;

    // Filter Logic
    const { immediateActions, waitingFor, recentCaptures } = useMemo(() => {
        if (!currentUser) return { immediateActions: [], waitingFor: [], recentCaptures: [] };

        // 1. Immediate Actions: Assigned to me, not done
        const myTasks = tasks.filter(t =>
            (t.assigned_to === currentUser.id || !t.assigned_to) &&
            t.status !== 'Done'
        ).sort((a, b) => {
            // Sort by due date (asc), then created_at (desc)
            if (!a.due_date && !b.due_date) return new Date(b.created_at) - new Date(a.created_at);
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return new Date(a.due_date) - new Date(b.due_date);
        });

        // 2. Waiting For: Assigned to others, not done
        const delegatedTasks = tasks.filter(t =>
            t.assigned_to &&
            t.assigned_to !== currentUser.id &&
            t.status !== 'Done'
        );

        // 3. Inbox: Unprocessed items
        const inboxItems = inbox.filter(i => !i.processed);

        return {
            immediateActions: myTasks,
            waitingFor: delegatedTasks,
            recentCaptures: inboxItems
        };
    }, [tasks, inbox, currentUser]);

    // Handlers
    const handleTaskComplete = (task) => {
        updateTask(task.id, { status: 'Done' });
    };

    const handleInboxProcess = (item) => {
        // Navigate to inbox page with this item focused or just go to inbox
        // For MVP, simply go to Inbox page
        navigate('/inbox', { state: { highlightItem: item.id } });
    };

    const handleEdit = (task) => {
        setEditingTask(task);
    };

    return (
        <div className="dashboard-stream">
            {/* Connectivity Status */}
            {isSlowConnection && (
                <div className="connection-banner">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Syncing your action stream...</span>
                </div>
            )}

            {/* Header */}
            <div className="stream-header mb-8">
                <div>
                    <h1 className="page-title">Command Center</h1>
                    <p className="page-subtitle">
                        {dataLoaded
                            ? `You have ${immediateActions.length} immediate actions and ${recentCaptures.length} unprocessed ideas.`
                            : "Loading your second brain..."
                        }
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="btn btn-ghost" onClick={() => navigate('/projects')}>
                        <FolderKanban size={18} />
                        <span className="hidden md:inline ml-2">Contexts</span>
                    </button>
                    {/* <button className="btn btn-primary" onClick={() => setCreateProjectOpen(true)}>
                        <Plus size={18} />
                        <span className="hidden md:inline ml-2">New Context</span>
                    </button> */}
                </div>
            </div>

            {/* 3-Column Stream Layout */}
            <div className="stream-grid">

                {/* Column 1: Immediate Actions */}
                <div className="stream-column">
                    <div className="column-header">
                        <div className="header-icon bg-red-100 text-red-600">
                            <Zap size={18} />
                        </div>
                        <h2>Do Now</h2>
                        <span className="badge">{immediateActions.length}</span>
                    </div>
                    <div className="column-content">
                        {immediateActions.length === 0 ? (
                            <div className="empty-stream">
                                <p>All caught up! 🎉</p>
                            </div>
                        ) : (
                            immediateActions.map(task => (
                                <ActionCard
                                    key={task.id}
                                    item={task}
                                    type="action"
                                    onAction={handleTaskComplete}
                                    onDelete={(t) => deleteTask(t.id)}
                                    onEdit={handleEdit}
                                    onClick={(t) => navigate(`/project/${t.project_id}`)} // Or open detail modal
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Column 2: Waiting For */}
                <div className="stream-column">
                    <div className="column-header">
                        <div className="header-icon bg-orange-100 text-orange-600">
                            <Clock size={18} />
                        </div>
                        <h2>Waiting For</h2>
                        <span className="badge">{waitingFor.length}</span>
                    </div>
                    <div className="column-content">
                        {waitingFor.length === 0 ? (
                            <div className="empty-stream">
                                <p>No pending delegations.</p>
                            </div>
                        ) : (
                            waitingFor.map(task => (
                                <ActionCard
                                    key={task.id}
                                    item={task}
                                    type="waiting"
                                    onDelete={(t) => deleteTask(t.id)}
                                    onEdit={handleEdit}
                                // onClick={(t) => navigate(`/project/${t.project_id}`)} 
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Column 3: Recent Captures */}
                <div className="stream-column">
                    <div className="column-header">
                        <div className="header-icon bg-blue-100 text-blue-600">
                            <Inbox size={18} />
                        </div>
                        <h2>Inbox</h2>
                        <span className="badge">{recentCaptures.length}</span>
                    </div>
                    <div className="column-content">
                        {recentCaptures.length === 0 ? (
                            <div className="empty-stream">
                                <p>Inbox zero! 🧠</p>
                            </div>
                        ) : (
                            recentCaptures.map(item => (
                                <ActionCard
                                    key={item.id}
                                    item={item}
                                    type="inbox"
                                    onAction={handleInboxProcess}
                                    onDelete={(i) => deleteInboxItem(i.id)}
                                // onEdit={(i) => navigate('/inbox')}
                                />
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* Create Project Modal (Hidden but preserved for now) */}
            {createProjectOpen && (
                <CreateProjectModal
                    onClose={() => setCreateProjectOpen(false)}
                    onCreated={(p) => navigate(`/project/${p.id}`)}
                />
            )}

            {/* Edit Task Modal */}
            {editingTask && (
                <EditTaskModal
                    task={editingTask}
                    onClose={() => setEditingTask(null)}
                />
            )}

            <style>{`
                .dashboard-stream {
                    padding-bottom: 4rem;
                }
                .connection-banner {
                    background: #fff7ed;
                    border: 1px solid #ffedd5;
                    padding: 8px 16px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 14px;
                    color: #9a3412;
                }
                .stream-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: var(--space-6);
                    align-items: start;
                }
                @media (max-width: 1024px) {
                    .stream-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                @media (max-width: 768px) {
                    .stream-grid {
                        grid-template-columns: 1fr;
                    }
                }
                .stream-column {
                    background: var(--bg-secondary);
                    border-radius: var(--radius-xl);
                    padding: var(--space-4);
                    min-height: 200px;
                }
                .column-header {
                    display: flex;
                    align-items: center;
                    gap: var(--space-3);
                    margin-bottom: var(--space-4);
                    padding-bottom: var(--space-3);
                    border-bottom: 2px solid var(--border-light);
                }
                .header-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: var(--radius-md);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .column-header h2 {
                    font-size: var(--text-lg);
                    font-weight: var(--font-bold);
                    color: var(--text-primary);
                    flex: 1;
                    margin: 0;
                }
                .badge {
                    background: var(--bg-tertiary);
                    color: var(--text-secondary);
                    padding: 2px 8px;
                    border-radius: var(--radius-full);
                    font-size: var(--text-xs);
                    font-weight: var(--font-bold);
                }
                .empty-stream {
                    text-align: center;
                    padding: var(--space-8);
                    color: var(--text-muted);
                    font-style: italic;
                }
                .bg-red-100 { background-color: #fee2e2; }
                .text-red-600 { color: #dc2626; }
                .bg-orange-100 { background-color: #ffedd5; }
                .text-orange-600 { color: #ea580c; }
                .bg-blue-100 { background-color: #dbeafe; }
                .text-blue-600 { color: #2563eb; }
                
                .hidden { display: none; }
                @media (min-width: 768px) {
                    .md\\:inline { display: inline; }
                }
            `}</style>
        </div>
    );
}
