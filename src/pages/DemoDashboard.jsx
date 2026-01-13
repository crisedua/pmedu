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
    Loader2,
    CheckCircle2,
    Circle
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
        processInboxToTask,
        getProject,
        projects
    } = useDemoData();

    const [isRecording, setIsRecording] = useState(false);
    const [recordingText, setRecordingText] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Audio Helpers
    const playBeep = (freq = 440, duration = 0.1) => {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);
    };

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const speech = new SpeechSynthesisUtterance(text);
            speech.lang = 'es-ES';
            speech.rate = 1.05;
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
        // Simulation of deep AI analysis
        await new Promise(resolve => setTimeout(resolve, 2500));

        const content = item.content.toLowerCase();
        let projectId = null;
        let assignedTo = currentUser.id;
        let actionType = 'todo';

        // 🚀 SMART POWER: Auto-categorization by project
        if (content.includes('web') || content.includes('página')) projectId = 'proj-1';
        else if (content.includes('marketing') || content.includes('ventas')) projectId = 'proj-2';
        else if (content.includes('latam') || content.includes('expansión')) projectId = 'proj-3';

        // 🚀 SMART POWER: Auto-delegation by mentioning names
        if (content.includes('carlos')) assignedTo = 'user-3';
        else if (content.includes('ana')) assignedTo = 'user-2';
        else if (content.includes('sofía') || content.includes('sofia')) assignedTo = 'user-4';

        // 🚀 SMART POWER: Semantic intent extraction
        if (content.includes('llamar') || content.includes('reunión') || content.includes('cena')) actionType = 'meeting';
        else if (content.includes('analizar') || content.includes('revisar')) actionType = 'analyze';

        processInboxToTask(item, {
            name: item.content.split(/[.?!]/)[0].substring(0, 60), // Use first sentence as title
            project_id: projectId,
            assigned_to: assignedTo,
            action_type: actionType
        });

        setIsProcessing(false);

        const project = projects.find(p => p.id === projectId);
        const assignee = users.find(u => u.id === assignedTo);

        let feedback = "He analizado tu nota. ";
        if (project) feedback += `La he vinculado al proyecto ${project.name}. `;
        if (assignee && assignee.id !== currentUser.id) {
            feedback += `Se la he asignado a ${assignee.name.split(' ')[0]} automáticamente.`;
        } else {
            feedback += "La he añadido a tu lista de acciones priorizadas.";
        }

        speak(feedback);

        if (demoStep === 4) {
            setDemoStep(5);
            setTimeout(() => setDemoStep(6), 5000);
        }
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
        "Pedirle a Carlos que revise el código de la nueva página web antes del lanzamiento.",
        "Necesito que Ana revise el presupuesto de marketing para la expansión Latam.",
        "Agendar reunión con el equipo de finanzas para analizar los números del Q1.",
    ];

    // WALKTHROUGH STATE
    // 0: Welcome
    // 1: Click Mic
    // 2: Recording (Click X)
    // 3: Click Menu (Inbox)
    // 4: Click Smart Process
    // 5: Moved to Do Now (Transition)
    // 6: Click AI Assistant
    // 7: AI Chat
    const [demoStep, setDemoStep] = useState(0);

    const toggleRecording = () => {
        if (isRecording) {
            setIsRecording(false);
            playBeep(660, 0.15); // Higher pitched finish beep
            speak("Captura finalizada. Guardando en tu bandeja de entrada.");
            if (recordingText) {
                setIsProcessing(true);
                setTimeout(() => {
                    addInboxItem(recordingText);
                    setRecordingText('');
                    setIsProcessing(false);

                    if (demoStep === 2) {
                        setDemoStep(3);
                        speak("Nota guardada correctamente. Ahora haz clic en los tres puntos de la tarjeta.");
                    }
                }, 1500);
            }
        } else {
            setIsRecording(true);
            setRecordingText('');
            playBeep(440, 0.1); // Start beep
            speak("Grabando... puedes hablar ahora.");
            if (demoStep === 1) setDemoStep(2);

            let textIndex = 0;
            const targetText = simulatedTexts[Math.floor(Math.random() * simulatedTexts.length)];
            const words = targetText.split(' ');

            const interval = setInterval(() => {
                setRecordingText(prev => {
                    // Stop adding text but DON'T stop recording automatically
                    const nextWord = words[textIndex];
                    if (!nextWord) {
                        clearInterval(interval);
                        return prev;
                    }
                    textIndex++;
                    return prev + (prev ? ' ' : '') + nextWord;
                });
            }, 350); // Slightly slower for better readability
        }
    };

    const handleCardMenuToggle = (isOpen, item) => {
        // Only track the FIRST inbox item for the demo
        if (demoStep === 3 && isOpen && inbox.indexOf(item) === 0) {
            setDemoStep(4);
            speak("Selecciona 'Procesamiento Inteligente' para que la IA organice esto.");
        }
    };

    const handleAiSidebarToggle = () => {
        if (demoStep === 6) {
            setDemoStep(7);
            speak("Aquí está tu asistente. Puede responder preguntas sobre tus proyectos.");
        } else {
            // Toggle normal behavior if not in that step?
            // For demo, we just toggle step 7 off if clicked again?
            if (demoStep === 7) setDemoStep(6);
        }
    };

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
                            Simularemos una captura de voz en español.
                        </p>
                    </div>
                </div>
            )}

            {/* Step 2: During recording, tell them to click X */}
            {demoStep === 2 && isRecording && (
                <div style={{
                    position: 'fixed',
                    bottom: '120px',
                    right: '120px',
                    zIndex: 60,
                    pointerEvents: 'none',
                    animation: 'bounce 2s infinite',
                    textAlign: 'right'
                }}>
                    <p style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: 'white',
                        textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                        background: 'rgba(0,0,0,0.6)',
                        padding: '12px 20px',
                        borderRadius: '16px',
                        backdropFilter: 'blur(4px)'
                    }}>
                        Haz clic en la <span style={{ color: '#ef4444' }}>X</span> para terminar 👈
                    </p>
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

            {/* Overlays for Steps */}
            {demoStep === 3 && (
                <div style={{ position: 'fixed', bottom: '10%', left: '50%', transform: 'translateX(-50%)', zIndex: 60, pointerEvents: 'none', background: 'rgba(0,0,0,0.8)', color: 'white', padding: '12px 24px', borderRadius: '30px', animation: 'bounce 2s infinite' }}>
                    👆 Haz clic en los tres puntos
                </div>
            )}
            {demoStep === 6 && (
                <div style={{ position: 'fixed', top: '90px', right: '20px', zIndex: 60, pointerEvents: 'none', background: 'rgba(0,0,0,0.8)', color: 'white', padding: '12px 24px', borderRadius: '30px', animation: 'bounce 2s infinite' }}>
                    👆 Abre el Asistente IA
                </div>
            )}

            {/* AI Sidebar Mock */}
            <div style={{
                position: 'fixed',
                top: 0,
                right: demoStep === 7 ? 0 : '-400px',
                width: '350px',
                height: '100vh',
                background: 'white',
                boxShadow: '-5px 0 25px rgba(0,0,0,0.1)',
                transition: 'right 0.3s ease',
                zIndex: 200, // Top level
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><Sparkles size={18} color="#4f46e5" /> Asistente IA</h3>
                    <button onClick={() => setDemoStep(6)}><X size={20} /></button>
                </div>
                <div style={{ flex: 1, padding: '20px', background: '#f9fafb' }}>
                    <div style={{ background: 'white', padding: '12px', borderRadius: '12px', marginBottom: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>Hola, soy Aido. ¿En qué te ayudo hoy?</p>
                    </div>
                    <div style={{ background: '#eef2ff', padding: '12px', borderRadius: '12px', marginBottom: '12px', marginLeft: 'auto', maxWidth: '80%' }}>
                        <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>¿Qué tareas tengo pendientes?</p>
                    </div>
                    <div style={{ background: 'white', padding: '12px', borderRadius: '12px', marginBottom: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>Tienes {immediateActions.length} tareas prioritarias, incluyendo "Lanzamiento Web 2.0".</p>
                    </div>
                </div>
                <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
                    <input type="text" placeholder="Escribe un mensaje..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} disabled />
                </div>
            </div>

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
                                Tienes {immediateActions.length} acciones inmediatas y {recentCaptures.length} ideas sin procesar.
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
                                🎮 Modo Demo
                            </span>
                            <button
                                onClick={handleAiSidebarToggle}
                                style={{
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
                                    gap: '6px',
                                    position: 'relative',
                                    zIndex: demoStep === 6 ? 65 : 1, // Highlight button
                                    boxShadow: demoStep === 6 ? '0 0 0 4px rgba(99, 102, 241, 0.5)' : 'none'
                                }}>
                                <Sparkles size={16} />
                                Asistente IA
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
                        borderRadius: '24px',
                        textAlign: 'center',
                        maxWidth: '350px',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                        border: '1px solid #e5e7eb'
                    }}>
                        <div style={{ position: 'relative', width: '60px', height: '60px', margin: '0 auto 20px' }}>
                            <Loader2 size={60} className="animate-spin" style={{ color: '#6366f1' }} />
                            <Sparkles size={24} style={{ position: 'absolute', top: '18px', left: '18px', color: '#8b5cf6' }} className="animate-pulse" />
                        </div>
                        <p style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>Procesando con IA</p>
                        <div style={{ fontSize: '14px', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', opacity: 0.8 }}>
                                <CheckCircle2 size={14} color="#10b981" /> Transcribiendo audio...
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                <Loader2 size={14} className="animate-spin" /> Extrayendo acciones clave...
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', opacity: 0.5 }}>
                                <Circle size={14} /> Asignando prioridades...
                            </div>
                        </div>
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
                            <h2 style={{ flex: 1, margin: 0, fontSize: '18px', fontWeight: 700 }}>Hacer Ahora</h2>
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
                                <p>¡Todo al día! 🎉</p>
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
                                    getProject={getProject}
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
                            <h2 style={{ flex: 1, margin: 0, fontSize: '18px', fontWeight: 700 }}>En Espera</h2>
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
                                <p>Sin delegaciones pendientes.</p>
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
                                    getProject={getProject}
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
                            <h2 style={{ flex: 1, margin: 0, fontSize: '18px', fontWeight: 700 }}>Bandeja de Entrada</h2>
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
                                <p>¡Bandeja vacía! 🧠</p>
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
                                    getProject={getProject}
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
                                {editingItem.type === 'task' ? 'Editar Tarea' :
                                    editingItem.type === 'inbox' ? 'Editar Nota' : 'Procesar Nota de Voz'}
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
                                Contenido
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
                                Cancelar
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
                                Guardar Cambios
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
