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
        "Recordar enviar la propuesta comercial a Juan Pérez antes del mediodía y agendar una reunión de seguimiento para el viernes a las 3 de la tarde.",
        "Necesito revisar los números del Q1 con el equipo de finanzas, especialmente el presupuesto de marketing que parece estar desfasado.",
        "Llamar a María para confirmar la cena de equipo del jueves.",
    ];

    const toggleRecording = () => {
        if (isRecording) {
            setIsRecording(false);
            if (recordingText) {
                // Determine step for walkthrough
                if (demoStep === 2) {
                    setDemoStep(3); // Advance to processing explanation
                }

                setIsProcessing(true);
                setTimeout(() => {
                    const newItem = addInboxItem(recordingText);
                    setRecordingText('');
                    setIsProcessing(false);
                }, 1500);
            }
        } else {
            setIsRecording(true);
            setRecordingText('');

            // Advance walkthrough if on the mic step
            if (demoStep === 1) {
                // Stay on step 1 or move to fake "listening" state? 
                // Let's keep step 1 active until stop
            }

            let textIndex = 0;
            const targetText = simulatedTexts[Math.floor(Math.random() * simulatedTexts.length)];
            const words = targetText.split(' ');

            const interval = setInterval(() => {
                setRecordingText(prev => {
                    const nextWord = words[textIndex];
                    if (!nextWord) {
                        clearInterval(interval);
                        // Auto-stop for demo flow sweetness
                        if (demoStep === 1) {
                            setDemoStep(2); // Highlighting "Click Action to Process"
                        }
                        return prev;
                    }
                    textIndex++;
                    return prev + (prev ? ' ' : '') + nextWord;
                });
            }, 300);
        }
    };

    // WALKTHROUGH STATE
    const [demoStep, setDemoStep] = useState(0);
    // 0: Welcome Modal
    // 1: Click Mic (Highlight Mic)
    // 2: Processing / Inbox (Highlight Inbox item)
    // 3: Action columns (Highlight columns)
    // 4: Done

    return (
        <div className="dashboard-container relative">
            {/* Walkthrough Overlays */}
            {demoStep === 0 && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">Bienvenido a tu Segundo Cerebro</h2>
                            <button onClick={() => setDemoStep(4)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>
                        <p className="text-gray-600 mb-4 text-lg">
                            Esta aplicación está diseñada para ejecutivos que necesitan **capturar, organizar y ejecutar** sin fricción.
                        </p>
                        <ul className="space-y-3 mb-6">
                            <li className="flex gap-3 items-start">
                                <div className="bg-blue-100 p-2 rounded-lg text-blue-600 mt-1"><Mic size={18} /></div>
                                <div>
                                    <span className="font-semibold block text-gray-800">Captura de Voz Inteligente</span>
                                    <span className="text-sm text-gray-500">Habla naturalmente. La IA transcribe, resume y extrae tareas automáticamente.</span>
                                </div>
                            </li>
                            <li className="flex gap-3 items-start">
                                <div className="bg-purple-100 p-2 rounded-lg text-purple-600 mt-1"><Inbox size={18} /></div>
                                <div>
                                    <span className="font-semibold block text-gray-800">Bandeja de Entrada Unificada</span>
                                    <span className="text-sm text-gray-500">Todas tus ideas caen aquí. Procesa, delega o agenda con un clic.</span>
                                </div>
                            </li>
                            <li className="flex gap-3 items-start">
                                <div className="bg-green-100 p-2 rounded-lg text-green-600 mt-1"><Zap size={18} /></div>
                                <div>
                                    <span className="font-semibold block text-gray-800">Acción Inmediata</span>
                                    <span className="text-sm text-gray-500">Lo que debes hacer HOY, filtrado y priorizado para ti.</span>
                                </div>
                            </li>
                        </ul>
                        <div className="flex justify-end pt-4 border-t">
                            <button
                                onClick={() => setDemoStep(1)}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                            >
                                Iniciar Tour Interactivo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 1: Highlight Mic */}
            {demoStep === 1 && (
                <div className="fixed inset-0 z-40 pointer-events-none">
                    <div className="absolute inset-0 bg-black/40" />
                    {/* Hole punch handled via high z-index on local elements or replicated UI */}
                    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-white text-center animate-bounce">
                        <p className="text-xl font-bold mb-2">👇 Presiona aquí y habla</p>
                        <p className="opacity-90">Simularemos una captura de voz en español</p>
                    </div>
                </div>
            )}

            {/* Step 3: Explanation after recording */}
            {demoStep === 3 && (
                <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
                    <div className="bg-white p-6 rounded-xl shadow-xl max-w-md pointer-events-auto border-2 border-green-500">
                        <h3 className="font-bold text-lg mb-2">¡Captura Procesada!</h3>
                        <p className="text-gray-600 mb-4">
                            Tu nota de voz ha sido transcrita y guardada en el Inbox.
                            La IA ahora puede analizarla para crear tareas o delegar.
                        </p>
                        <button
                            onClick={() => setDemoStep(4)}
                            className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Ver mi Dashboard
                        </button>
                    </div>
                </div>
            )}

            {/* Connection Banner */}
            {(isProcessing) && (
                <div className="connection-banner bg-blue-50 border-blue-100 mb-6">
                    <Loader2 size={16} className="animate-spin text-blue-600" />
                    <span className="text-blue-800">
                        {isProcessing ? "IA procesando tu nota de voz..." : "Sincronizando..."}
                    </span>
                </div>
            )}

            {/* Header */}
            <div className="stream-header mb-8">
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h1 className="page-title">Command Center</h1>
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
            {/* Floating Mic Button */}
            <button
                onClick={toggleRecording}
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
                    animation: isRecording ? 'pulse 1.5s infinite' : 'bounce 2s infinite',
                    zIndex: demoStep === 1 ? 60 : 30 // Critical for walkthrough
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
                    border: '1px solid #e4e4e7',
                    zIndex: demoStep === 1 ? 60 : 30
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
                            Grabando...
                        </span>
                    </div>
                    <p style={{
                        margin: 0,
                        fontSize: '15px',
                        color: '#18181b',
                        minHeight: '60px',
                        lineHeight: 1.5
                    }}>
                        {recordingText || 'Escuchando...'}
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
