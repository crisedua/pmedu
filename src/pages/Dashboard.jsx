import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import {
    Sparkles,
    Loader2,
    Zap,
    Clock,
    Inbox,
    AlertCircle
} from 'lucide-react';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import EditTaskModal from '../components/modals/EditTaskModal';
import EditInboxItemModal from '../components/modals/EditInboxItemModal';
import ActionCard from '../components/ActionCard';
import AIAssistantSidebar from '../components/AIAssistantSidebar';
import { format, isToday, isPast, isFuture } from 'date-fns';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
    const {
        tasks,
        inbox,
        currentUser,
        updateTask,
        deleteTask,
        deleteInboxItem,
        updateInboxItem,
        dataLoaded,
        loading,
        connectionError
    } = useData();
    const [isProcessing, setIsProcessing] = useState(false); // Local loading for AI
    const navigate = useNavigate();
    const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [editingInboxItem, setEditingInboxItem] = useState(null);
    const [processInboxItem, setProcessInboxItem] = useState(null);
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverColumn, setDragOverColumn] = useState(null);

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

    const handleInboxProcess = (item, targetColumn) => {
        if (targetColumn) {
            let overrides = {};
            if (targetColumn === 'action') {
                overrides = { assigned_to: currentUser.id, action_type: 'todo', status: 'To Do' };
            } else if (targetColumn === 'waiting') {
                overrides = { action_type: 'delegate', status: 'To Do' };
            }
            setProcessInboxItem({ ...item, ...overrides });
        } else {
            setProcessInboxItem(item);
        }
    };

    const handleProcessComplete = async (newTask) => {
        if (processInboxItem) {
            await updateInboxItem(processInboxItem.id, { processed: true });
        }
    };

    const handleEdit = async (task, mode) => {
        if (mode === 'auto') {
            // Smart Process Mode for Inbox Items
            setIsProcessing(true);
            try {
                // Import dynamically or assume it's imported? It needs import.
                const { analyzeInboxAction } = await import('../services/aiService');
                const analysis = await analyzeInboxAction(task.content, {
                    users: tasks.map(t => t.assigned_to).filter(Boolean), // Mock user context or use real users if available in context? 
                    // DataContext doesn't expose users list directly in `useData` return (line 21-31). 
                    // Wait, DataContext SHOULD expose users. Let's check `useData`.
                    // It returns `currentUser` but maybe not all users.
                    // For now, let's pass empty users and let AI infer from text, or we rely on `projects` which we have.
                    // projects: projects,
                    language: 'en' // Defaulting to EN, or detect from content?
                });

                // Open CreateTaskModal with AI results
                setProcessInboxItem({ ...task, ...analysis });
            } catch (error) {
                console.error("Smart process failed", error);
                setProcessInboxItem(task); // Fallback to manual
            } finally {
                setIsProcessing(false);
            }
        } else {
            setEditingTask(task);
        }
    };

    // Drag and Drop Handlers
    const handleDragStart = (e, item, source) => {
        setDraggedItem({ item, source });
        e.dataTransfer.effectAllowed = 'move';
        // HTML5 drag hack for ghost image opacity
        setTimeout(() => e.target.style.opacity = '0.5', 0);
    };

    const handleDragEnd = (e) => {
        e.target.style.opacity = '1';
        setDraggedItem(null);
        setDragOverColumn(null);
    };

    const handleDragOver = (e, columnId) => {
        e.preventDefault();
        if (!draggedItem) return;
        setDragOverColumn(columnId);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = (e, targetColumn) => {
        e.preventDefault();
        setDragOverColumn(null);
        if (!draggedItem) return;

        const { item, source } = draggedItem;

        // Logic: Moving from Inbox to Action/Waiting
        if (source === 'inbox') {
            let overrides = {};

            if (targetColumn === 'action') {
                // Moving to "Do Now" -> Assign to me, Type Todo
                overrides = {
                    assigned_to: currentUser.id,
                    action_type: 'todo',
                    status: 'To Do'
                };
            } else if (targetColumn === 'waiting') {
                // Moving to "Waiting For" -> Type Delegate (User must switch assignee if needed)
                overrides = {
                    action_type: 'delegate',
                    status: 'To Do' // Tasks are "To Do" even if waiting? Or "In Progress"? "To Do" is fine.
                };
            }

            // Open the Process Modal with these overrides pre-applied
            setProcessInboxItem({ ...item, ...overrides });
        }
    };

    return (
        <div className="dashboard-stream">
            {/* Connectivity Status */}
            {connectionError && (
                <div style={{ maxWidth: '800px', margin: '0 auto 20px auto' }}>
                    <div className="connection-banner danger" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <AlertCircle size={18} />
                            <div style={{ fontSize: '14px' }}>
                                <strong>Database Unavailable:</strong> Connection timed out (&gt;35s).
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={async () => {
                                    const btn = document.getElementById('test-conn-btn');
                                    if (btn) btn.innerText = 'Testing (Raw Fetch)...';

                                    try {
                                        const url = import.meta.env.VITE_SUPABASE_URL;
                                        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

                                        if (!url || !key) {
                                            alert('Missing Config! Check .env');
                                            return;
                                        }

                                        // 1. Raw Network Test (Bypass Supabase Client)
                                        console.log('Starting raw fetch test...');
                                        const start = Date.now();
                                        const response = await fetch(`${url}/rest/v1/pm_projects?select=count`, {
                                            method: 'HEAD',
                                            headers: {
                                                'apikey': key,
                                                'Authorization': `Bearer ${key}`
                                            }
                                        });
                                        const duration = Date.now() - start;

                                        if (response.ok) {
                                            alert(`✅ RAW FETCH SUCCESS (${duration}ms)\nNetwork is working!\n\nIf the app is still stuck, the issue is likely a corrupted user session.`);

                                            // Optional: Clear session if stuck
                                            if (confirm("Clear local session cache to fix potential auth issues?")) {
                                                localStorage.clear();
                                                window.location.reload();
                                            }
                                        } else {
                                            alert(`❌ API ERROR: ${response.status} ${response.statusText}`);
                                        }

                                    } catch (e) {
                                        alert(`❌ NETWORK BLOCK: ${e.message}\nCheck your Firewall/VPN.`);
                                    } finally {
                                        if (btn) btn.innerText = 'Test Connect';
                                    }
                                }}
                                id="test-conn-btn"
                                style={{
                                    background: '#991b1b',
                                    color: 'white',
                                    border: 'none',
                                    padding: '4px 12px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}
                            >
                                Test Connect
                            </button>
                        </div>
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #fee2e2', padding: '16px', borderRadius: '8px', animation: 'fadeIn 0.3s ease' }}>
                        <h3 style={{ color: '#991b1b', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                            <AlertCircle size={16} /> Diagnostic Steps
                        </h3>
                        <ul style={{ fontSize: '13px', color: '#7f1d1d', paddingLeft: '20px', margin: '10px 0 0 0' }}>
                            <li style={{ marginBottom: '4px' }}><strong>Project Paused?</strong> Log in to Supabase and check if your project is "Paused" (Free tier).</li>
                            <li style={{ marginBottom: '4px' }}><strong>RLS Policy Block?</strong> You MUST run the updated <code>fix_all_rls.sql</code> script in the SQL Editor.</li>
                            <li style={{ marginBottom: '4px' }}><strong>Network?</strong> Check your internet connection or firewall rules.</li>
                            <li>
                                <strong>Config Check:</strong> Using URL <code>{(import.meta.env.VITE_SUPABASE_URL || 'UNDEFINED').substring(0, 15)}...</code>
                            </li>
                        </ul>
                    </div>
                </div>
            )
            }

            {
                (isSlowConnection || isProcessing) && !connectionError && (
                    <div className="connection-banner" style={{ background: isProcessing ? 'var(--bg-primary)' : '#fff7ed', border: isProcessing ? '1px solid var(--color-primary-200)' : '1px solid #ffedd5' }}>
                        <Loader2 size={16} className="animate-spin" style={{ color: isProcessing ? 'var(--color-primary-600)' : '#9a3412' }} />
                        <span style={{ color: isProcessing ? 'var(--text-primary)' : '#9a3412' }}>
                            {isProcessing ? "AI is analyzing your action..." : "Syncing your action stream..."}
                        </span>
                    </div>
                )
            }

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
                    <button className="btn btn-primary" onClick={() => setAiSidebarOpen(true)}>
                        <Sparkles size={18} />
                        <span className="hidden md:inline ml-2">AI Assistant</span>
                    </button>

                </div>
            </div>

            {/* 3-Column Stream Layout */}
            <div className="stream-grid">

                {/* Column 1: Immediate Actions (Drop Zone) */}
                <div
                    className={`stream-column ${dragOverColumn === 'action' ? 'drag-over' : ''}`}
                    onDragOver={(e) => handleDragOver(e, 'action')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'action')}
                >
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
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Column 2: Waiting For (Drop Zone) */}
                <div
                    className={`stream-column ${dragOverColumn === 'waiting' ? 'drag-over' : ''}`}
                    onDragOver={(e) => handleDragOver(e, 'waiting')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'waiting')}
                >
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
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Column 3: Recent Captures (Draggable Source) */}
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
                                <div
                                    key={item.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, item, 'inbox')}
                                    onDragEnd={handleDragEnd}
                                    style={{ cursor: 'move' }}
                                >
                                    <ActionCard
                                        item={item}
                                        type="inbox"
                                        onAction={handleInboxProcess}
                                        onDelete={(i) => deleteInboxItem(i.id)}
                                        onEdit={(item, mode) => mode === 'auto' ? handleEdit(item, 'auto') : setEditingInboxItem(item)}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>



            {/* Edit Task Modal */}
            {
                editingTask && (
                    <EditTaskModal
                        task={editingTask}
                        onClose={() => setEditingTask(null)}
                    />
                )
            }

            {/* Edit Inbox Item Modal */}
            {
                editingInboxItem && (
                    <EditInboxItemModal
                        item={editingInboxItem}
                        onClose={() => setEditingInboxItem(null)}
                    />
                )
            }

            {/* Process Inbox Item Modal */}
            {
                processInboxItem && (
                    <CreateTaskModal
                        initialData={processInboxItem}
                        onClose={() => setProcessInboxItem(null)}
                        onSuccess={handleProcessComplete}
                    />
                )
            }

            {/* AI Sidebar */}
            <AIAssistantSidebar
                isOpen={aiSidebarOpen}
                onClose={() => setAiSidebarOpen(false)}
            />

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
                    transition: background 0.2s, border-color 0.2s;
                    border: 2px solid transparent;
                }
                .stream-column.drag-over {
                    background: rgba(99, 102, 241, 0.05); /* Indigo tint */
                    border-color: var(--color-primary-300);
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
        </div >
    );
}
