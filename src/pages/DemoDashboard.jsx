import { useState } from 'react';
import { DemoDataProvider, useDemoData } from '../context/DemoDataContext';
import DemoActionCard from '../components/DemoActionCard';
import {
    Sparkles,
    Zap,
    Clock,
    Inbox,
    Mic,
    X,
    Loader2
} from 'lucide-react';

function DemoDashboardContent() {
    const {
        tasks,
        inbox,
        users,
        currentUser,
        getUser,
        updateTask,
        deleteTask,
        updateInboxItem,
        deleteInboxItem,
        addInboxItem,
        processInboxToTask
    } = useDemoData();

    const [isRecording, setIsRecording] = useState(false);
    const [recordingText, setRecordingText] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Filter tasks
    const immediateActions = tasks.filter(t =>
        (t.assigned_to === currentUser.id || !t.assigned_to) && t.status !== 'Done'
    );
    const waitingFor = tasks.filter(t =>
        t.assigned_to && t.assigned_to !== currentUser.id && t.status !== 'Done'
    );
    const recentCaptures = inbox.filter(i => !i.processed);

    // Handlers
    const handleTaskComplete = (task) => {
        updateTask(task.id, { status: task.status === 'Done' ? 'To Do' : 'Done' });
    };

    const handleEditTask = (task) => {
        setEditingItem({ type: 'task', item: task });
    };

    const handleEditInbox = (item, mode) => {
        if (mode === 'auto') {
            handleSmartProcess(item);
        } else {
            setEditingItem({ type: 'inbox', item });
        }
    };

    const handleSmartProcess = async (item) => {
        setIsProcessing(true);
        // Simulate AI processing
        await new Promise(resolve => setTimeout(resolve, 1500));

        processInboxToTask(item, {
            name: item.content.substring(0, 50) + '...',
            assigned_to: currentUser.id,
            action_type: 'todo'
        });
        setIsProcessing(false);
    };

    const handleInboxProcess = (item, target) => {
        if (target === 'action') {
            processInboxToTask(item, {
                name: item.content.substring(0, 50),
                assigned_to: currentUser.id,
                action_type: 'todo'
            });
        } else if (target === 'waiting') {
            processInboxToTask(item, {
                name: item.content.substring(0, 50),
                assigned_to: users[1]?.id,
                action_type: 'delegate'
            });
        } else {
            setEditingItem({ type: 'process', item });
        }
    };

    const handleMarkProcessed = (item) => {
        updateInboxItem(item.id, { processed: true });
    };

    // Voice recording simulation
    const simulatedTexts = [
        "Need to follow up with the design team about the new mockups...",
        "Remember to schedule a meeting with Sarah about Q1 planning...",
        "Check if the report is ready for tomorrow's presentation...",
    ];

    const handleStartRecording = () => {
        setIsRecording(true);
        setRecordingText('');

        // Simulate gradual text appearing
        const text = simulatedTexts[Math.floor(Math.random() * simulatedTexts.length)];
        let index = 0;
        const interval = setInterval(() => {
            if (index < text.length) {
                setRecordingText(text.substring(0, index + 1));
                index++;
            } else {
                clearInterval(interval);
            }
        }, 50);
    };

    const handleStopRecording = () => {
        setIsRecording(false);
        if (recordingText) {
            addInboxItem(recordingText);
        }
        setRecordingText('');
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#fafafa',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
        }}>
            {/* Header */}
            <div style={{
                background: '#ffffff',
                borderBottom: '1px solid #e4e4e7',
                padding: '16px 24px'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h1 style={{
                                fontSize: '28px',
                                fontWeight: 700,
                                color: '#18181b',
                                margin: 0
                            }}>
                                Command Center
                            </h1>
                            <p style={{
                                fontSize: '14px',
                                color: '#71717a',
                                margin: '4px 0 0 0'
                            }}>
                                You have {immediateActions.length} immediate actions and {recentCaptures.length} unprocessed ideas.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <span style={{
                                background: '#eef2ff',
                                color: '#6366f1',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: 600
                            }}>
                                🎮 Demo Mode
                            </span>
                            <button style={{
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <Sparkles size={16} />
                                AI Assistant
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Processing Overlay */}
            {isProcessing && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        background: 'white',
                        padding: '32px',
                        borderRadius: '16px',
                        textAlign: 'center',
                        maxWidth: '300px'
                    }}>
                        <Loader2 size={40} className="animate-spin" style={{ color: '#6366f1', marginBottom: '16px' }} />
                        <p style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>AI is analyzing...</p>
                        <p style={{ fontSize: '14px', color: '#71717a', margin: '8px 0 0 0' }}>Creating task from voice note</p>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '24px',
                    alignItems: 'start'
                }}>
                    {/* Column 1: Do Now */}
                    <div style={{
                        background: '#f4f4f5',
                        borderRadius: '16px',
                        padding: '16px',
                        minHeight: '300px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '16px',
                            paddingBottom: '12px',
                            borderBottom: '2px solid #e4e4e7'
                        }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: '#fee2e2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#dc2626'
                            }}>
                                <Zap size={18} />
                            </div>
                            <h2 style={{ flex: 1, margin: 0, fontSize: '18px', fontWeight: 700 }}>Do Now</h2>
                            <span style={{
                                background: '#e4e4e7',
                                padding: '2px 8px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: 700
                            }}>{immediateActions.length}</span>
                        </div>
                        {immediateActions.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px', color: '#a1a1aa' }}>
                                <p>All caught up! 🎉</p>
                            </div>
                        ) : (
                            immediateActions.map(task => (
                                <DemoActionCard
                                    key={task.id}
                                    item={task}
                                    type="action"
                                    onAction={handleTaskComplete}
                                    onEdit={handleEditTask}
                                    onDelete={(t) => deleteTask(t.id)}
                                    users={users}
                                    getUser={getUser}
                                />
                            ))
                        )}
                    </div>

                    {/* Column 2: Waiting For */}
                    <div style={{
                        background: '#f4f4f5',
                        borderRadius: '16px',
                        padding: '16px',
                        minHeight: '300px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '16px',
                            paddingBottom: '12px',
                            borderBottom: '2px solid #e4e4e7'
                        }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: '#ffedd5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ea580c'
                            }}>
                                <Clock size={18} />
                            </div>
                            <h2 style={{ flex: 1, margin: 0, fontSize: '18px', fontWeight: 700 }}>Waiting For</h2>
                            <span style={{
                                background: '#e4e4e7',
                                padding: '2px 8px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: 700
                            }}>{waitingFor.length}</span>
                        </div>
                        {waitingFor.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px', color: '#a1a1aa' }}>
                                <p>No pending delegations.</p>
                            </div>
                        ) : (
                            waitingFor.map(task => (
                                <DemoActionCard
                                    key={task.id}
                                    item={task}
                                    type="waiting"
                                    onEdit={handleEditTask}
                                    onDelete={(t) => deleteTask(t.id)}
                                    users={users}
                                    getUser={getUser}
                                />
                            ))
                        )}
                    </div>

                    {/* Column 3: Inbox */}
                    <div style={{
                        background: '#f4f4f5',
                        borderRadius: '16px',
                        padding: '16px',
                        minHeight: '300px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '16px',
                            paddingBottom: '12px',
                            borderBottom: '2px solid #e4e4e7'
                        }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: '#dbeafe',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#2563eb'
                            }}>
                                <Inbox size={18} />
                            </div>
                            <h2 style={{ flex: 1, margin: 0, fontSize: '18px', fontWeight: 700 }}>Inbox</h2>
                            <span style={{
                                background: '#e4e4e7',
                                padding: '2px 8px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: 700
                            }}>{recentCaptures.length}</span>
                        </div>
                        {recentCaptures.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px', color: '#a1a1aa' }}>
                                <p>Inbox zero! 🧠</p>
                            </div>
                        ) : (
                            recentCaptures.map(item => (
                                <DemoActionCard
                                    key={item.id}
                                    item={item}
                                    type="inbox"
                                    onAction={handleInboxProcess}
                                    onEdit={handleEditInbox}
                                    onDelete={(i) => deleteInboxItem(i.id)}
                                    onMarkProcessed={handleMarkProcessed}
                                    users={users}
                                    getUser={getUser}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Voice Recording Button */}
            <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                style={{
                    position: 'fixed',
                    bottom: '32px',
                    right: '32px',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: isRecording
                        ? 'linear-gradient(135deg, #ef4444, #f97316)'
                        : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                    transition: 'all 0.3s ease',
                    animation: isRecording ? 'pulse 1.5s infinite' : 'none'
                }}
            >
                {isRecording ? <X size={28} /> : <Mic size={28} />}
            </button>

            {/* Recording Overlay */}
            {isRecording && (
                <div style={{
                    position: 'fixed',
                    bottom: '110px',
                    right: '32px',
                    width: '320px',
                    background: 'white',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                    border: '1px solid #e4e4e7'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '12px'
                    }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#ef4444',
                            animation: 'pulse 1s infinite'
                        }} />
                        <span style={{ fontSize: '12px', color: '#71717a', fontWeight: 600 }}>
                            Recording...
                        </span>
                    </div>
                    <p style={{
                        margin: 0,
                        fontSize: '15px',
                        color: '#18181b',
                        minHeight: '60px',
                        lineHeight: 1.5
                    }}>
                        {recordingText || 'Listening...'}
                        <span style={{
                            animation: 'blink 1s infinite',
                            marginLeft: '2px'
                        }}>|</span>
                    </p>
                </div>
            )}

            {/* Edit Modal */}
            {editingItem && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }} onClick={() => setEditingItem(null)}>
                    <div
                        style={{
                            background: 'white',
                            borderRadius: '16px',
                            width: '100%',
                            maxWidth: '500px',
                            margin: '16px'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{
                            padding: '20px',
                            borderBottom: '1px solid #e4e4e7',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                                {editingItem.type === 'task' ? 'Edit Task' :
                                    editingItem.type === 'inbox' ? 'Edit Note' : 'Process Voice Note'}
                            </h3>
                            <button
                                onClick={() => setEditingItem(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    color: '#71717a'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: 500,
                                marginBottom: '8px'
                            }}>
                                Content
                            </label>
                            <textarea
                                defaultValue={editingItem.item.name || editingItem.item.content}
                                style={{
                                    width: '100%',
                                    minHeight: '120px',
                                    padding: '12px',
                                    border: '1px solid #d4d4d8',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    resize: 'vertical'
                                }}
                            />
                        </div>
                        <div style={{
                            padding: '16px 20px',
                            borderTop: '1px solid #e4e4e7',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px',
                            background: '#fafafa',
                            borderRadius: '0 0 16px 16px'
                        }}>
                            <button
                                onClick={() => setEditingItem(null)}
                                style={{
                                    padding: '8px 16px',
                                    background: 'white',
                                    border: '1px solid #d4d4d8',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    // Simulate save
                                    setEditingItem(null);
                                }}
                                style={{
                                    padding: '8px 16px',
                                    background: '#6366f1',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.05); }
                }
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

// Wrapper component with provider
export default function DemoDashboard() {
    return (
        <DemoDataProvider>
            <DemoDashboardContent />
        </DemoDataProvider>
    );
}
