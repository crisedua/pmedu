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

    // TTS Helper
    const speak = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const speech = new SpeechSynthesisUtterance(text);
            speech.lang = 'es-ES';
            speech.rate = 1.1;
            window.speechSynthesis.speak(speech);
        }
    };

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
        speak("He analizado tu nota y creado una tarea prioritaria.");
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
                    speak("Nota guardada en Inbox.");
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
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '24px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        maxWidth: '560px',
                        width: '100%',
                        padding: '32px',
                        animation: 'fadeIn 0.3s ease-out'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: 0 }}>
                                Bienvenido a Aido
                            </h2>
                            <button
                                onClick={() => setDemoStep(4)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <p style={{ fontSize: '18px', lineHeight: '1.6', color: '#4b5563', marginBottom: '32px' }}>
                            Esta aplicación está diseñada para ejecutivos que necesitan <strong style={{ color: '#111827' }}>capturar, organizar y ejecutar</strong> sin fricción.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
                            {/* Feature 1 */}
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                <div style={{
                                    background: '#eff6ff',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    color: '#2563eb'
                                }}>
                                    <Mic size={24} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', margin: '0 0 4px 0' }}>
                                        Captura de Voz Inteligente
                                    </h3>
                                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, lineHeight: '1.5' }}>
                                        Habla naturalmente. La IA transcribe, resume y extrae tareas automáticamente.
                                    </p>
                                </div>
                            </div>

                            {/* Feature 2 */}
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                <div style={{
                                    background: '#f3e8ff',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    color: '#9333ea'
                                }}>
                                    <Inbox size={24} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', margin: '0 0 4px 0' }}>
                                        Bandeja de Entrada Unificada
                                    </h3>
                                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, lineHeight: '1.5' }}>
                                        Todas tus ideas caen aquí. Procesa, delega o agenda con un clic.
                                    </p>
                                </div>
                            </div>

                            {/* Feature 3 */}
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                <div style={{
                                    background: '#dcfce7',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    color: '#16a34a'
                                }}>
                                    <Zap size={24} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', margin: '0 0 4px 0' }}>
                                        Acción Inmediata
                                    </h3>
                                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, lineHeight: '1.5' }}>
                                        Lo que debes hacer HOY, filtrado y priorizado para ti.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div style={{ paddingTop: '24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setDemoStep(1)}
                                style={{
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '16px',
                                    padding: '12px 24px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
                                    transition: 'transform 0.2s',
                                }}
                                onMouseEnter={e => e.target.style.transform = 'translateY(-1px)'}
                                onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
                            >
                                Iniciar Tour Interactivo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 1: Highlight Mic */}
            {demoStep === 1 && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 50,
                    pointerEvents: 'none'
                }}>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)'
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '120px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        textAlign: 'center',
                        color: 'white',
                        animation: 'bounce 2s infinite'
                    }}>
                        <p style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                            👇 Presiona aquí y habla
                        </p>
                        <p style={{ fontSize: '16px', opacity: 0.9 }}>
                            Simularemos una captura de voz en español
                        </p>
                    </div>
                </div>
            )}

            {/* Step 3: Explanation after recording */}
            {demoStep === 3 && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(2px)'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '32px',
                        borderRadius: '20px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        maxWidth: '400px',
                        width: '90%',
                        textAlign: 'center',
                        animation: 'fadeIn 0.3s ease-out'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: '#dcfce7',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            color: '#16a34a'
                        }}>
                            <Sparkles size={32} />
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
                            ¡Captura Procesada!
                        </h3>
                        <p style={{ fontSize: '15px', color: '#4b5563', lineHeight: '1.6', marginBottom: '24px' }}>
                            Tu nota de voz ha sido transcrita y guardada en el Inbox.
                            La IA puede ahora analizarla para crear tareas o delegar.
                        </p>
                        <button
                            onClick={() => setDemoStep(4)}
                            style={{
                                width: '100%',
                                backgroundColor: '#10b981',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '16px',
                                padding: '12px',
                                borderRadius: '12px',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
                            }}
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
                            <h1 className="page-title">Aido</h1>
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
