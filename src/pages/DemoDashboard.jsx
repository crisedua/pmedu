import { useState, useEffect } from 'react';
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

    // Conversion Optimization State
    const [demoActionsUsed, setDemoActionsUsed] = useState(0);
    const [showSignupPrompt, setShowSignupPrompt] = useState(false);
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [hasSeenAiPower, setHasSeenAiPower] = useState(false);
    const [showExitIntent, setShowExitIntent] = useState(false);
    const [hasShownExitIntent, setHasShownExitIntent] = useState(false);
    const [showAiAssistant, setShowAiAssistant] = useState(false);
    const [aiDemoPhase, setAiDemoPhase] = useState(0); // 0=initial, 1=user typing, 2=AI typing, 3=AI responded, 4=quick actions

    // WALKTHROUGH STATE
    // 0: Welcome
    // 1: Click Mic
    // 2: Recording (Click X)
    // 3: Click Menu (Inbox)
    // 4: Click Smart Process
    // 5: Moved to Do Now (Transition)
    // 6: Click AI Assistant (Auto-triggered now)
    // 7: AI Chat
    // 8: Completion
    const [demoStep, setDemoStep] = useState(0);

    // Pre-launch signup form state
    const [signupName, setSignupName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupSubmitted, setSignupSubmitted] = useState(false);

    const DEMO_ACTION_LIMIT = 5; // Artificial limit to create urgency

    // Analytics Tracking Utility
    const trackEvent = (eventName, eventData = {}) => {
        const timestamp = new Date().toISOString();
        const eventPayload = {
            event: eventName,
            timestamp,
            demoActionsUsed,
            demoStep,
            hasSeenAiPower,
            ...eventData
        };

        // Log to console in development
        console.log('📊 Analytics Event:', eventPayload);

        // Send to analytics platform (ready for integration)
        // Example integrations:
        // window.gtag?.('event', eventName, eventData); // Google Analytics
        // window.mixpanel?.track(eventName, eventPayload); // Mixpanel
        // window.analytics?.track(eventName, eventPayload); // Segment

        // For now, store in localStorage for debugging
        try {
            const existingEvents = JSON.parse(localStorage.getItem('demo_analytics') || '[]');
            existingEvents.push(eventPayload);
            localStorage.setItem('demo_analytics', JSON.stringify(existingEvents.slice(-100))); // Keep last 100 events
        } catch (e) {
            console.warn('Could not store analytics event:', e);
        }
    };

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

    // Exit-Intent Detection
    useEffect(() => {
        const handleMouseLeave = (e) => {
            // Detect when mouse leaves at the top of the viewport (user trying to close tab/go back)
            if (e.clientY <= 0 && !hasShownExitIntent && demoActionsUsed >= 1) {
                setShowExitIntent(true);
                setHasShownExitIntent(true);
                trackEvent('exit_intent_triggered', { actionsUsed: demoActionsUsed });
            }
        };

        document.addEventListener('mouseout', handleMouseLeave);
        return () => document.removeEventListener('mouseout', handleMouseLeave);
    }, [hasShownExitIntent, demoActionsUsed]);

    // Track initial demo load
    useEffect(() => {
        trackEvent('demo_loaded');
    }, []);

    // Auto-trigger AI Assistant when demoStep reaches 6
    useEffect(() => {
        if (demoStep === 6 && !showAiAssistant) {
            const timer = setTimeout(() => {
                setShowAiAssistant(true);
                setDemoStep(7);
                trackEvent('ai_assistant_opened');

                // Play opening sound
                playBeep(800, 0.1);
                speak("Abriendo tu asistente de inteligencia artificial. Aquí puedes preguntarme lo que quieras sobre tus proyectos.");

                // Start typing animation sequence
                // Increased delays to ensure voice finishes before next action
                setTimeout(() => {
                    setAiDemoPhase(1); // User message appears
                    speak("Mira cómo puedo responderte.");
                }, 5500); // Was 4000

                setTimeout(() => {
                    setAiDemoPhase(2); // AI typing indicator
                }, 7500); // Was 6000

                setTimeout(() => {
                    setAiDemoPhase(3); // AI response appears
                    playBeep(600, 0.1);
                    speak("Te muestro tus tareas prioritarias y te ayudo a organizarlas. También puedo enviar mensajes, delegar tareas, y mucho más.");
                }, 9500); // Was 8000

                // Gave more time (9s) for the long explanation above
                setTimeout(() => {
                    setAiDemoPhase(4); // Highlight quick actions
                    speak("Usa los botones rápidos para consultas frecuentes, o habla conmigo usando el micrófono.");
                }, 18500); // Was 14000

                setTimeout(() => {
                    speak("Esto es solo una muestra. Con tu cuenta, tendrás acceso ilimitado a tu asistente personal de inteligencia artificial.");
                    setTimeout(() => {
                        setShowCompletionModal(true);
                        setDemoStep(8);
                        trackEvent('tour_completion_modal_shown');
                    }, 5000);
                }, 25500); // Was 19000
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [demoStep, showAiAssistant]);

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
        setDemoActionsUsed(prev => prev + 1); // Track demo usage

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
        setHasSeenAiPower(true); // Mark that user has seen AI in action

        const project = projects.find(p => p.id === projectId);
        const assignee = users.find(u => u.id === assignedTo);

        let feedback = "He analizado tu nota. ";
        if (project) feedback += `La he vinculado al proyecto ${project.name}. `;
        if (assignee && assignee.id !== currentUser.id) {
            feedback += `Se la he asignado a ${assignee.name.split(' ')[0]} automáticamente. `;
            feedback += `Le he enviado un correo electrónico con los detalles.`;
        } else {
            feedback += "La he añadido a tu lista de acciones priorizadas.";
        }

        speak(feedback);

        // Trigger AI Assistant demo if user hasn't seen it yet
        // Changed from (demoStep === 5) to (demoStep < 6) to work even if user skipped demo steps
        if (demoStep < 6) {
            // Wait 5 seconds to let user see the task appear in "Do Now" and read the feedback
            setTimeout(() => {
                setDemoStep(6); // This triggers the useEffect which auto-opens AI Assistant
                speak("¡Magia! " + feedback + " Ahora te muestro el Asistente IA.");
            }, 5000);
        }

        trackEvent('ai_processing_completed', {
            projectAssigned: projectId ? true : false,
            delegated: assignedTo !== currentUser.id
        });
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
                        setDemoStep(4); // Move to Step 4 (Ready to click menu)
                        speak("Nota guardada correctamente. Ahora haz clic en los tres puntos de la tarjeta.");
                    }
                }, 3500);
            }
        } else {
            setIsRecording(true);
            setRecordingText('');
            setDemoActionsUsed(prev => prev + 1); // Track recording as action
            trackEvent('voice_recording_started');
            playBeep(440, 0.1); // Start beep

            const targetText = simulatedTexts[Math.floor(Math.random() * simulatedTexts.length)];
            speak("Grabando... " + targetText); // Speak the text being recorded

            if (demoStep === 1) setDemoStep(2);

            let textIndex = 0;
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
        if (demoStep === 4 && isOpen && inbox.indexOf(item) === 0) {
            setDemoStep(5);
            // Wait 2 seconds to let user see the menu before instructing
            setTimeout(() => {
                speak("Selecciona 'Procesamiento Inteligente' para que la IA organice esto.");
            }, 2000);
        }
    };

    const handleAiSidebarToggle = () => {
        // Start the AI Assistant demo sequence
        setShowAiAssistant(true);
        trackEvent('ai_assistant_opened');

        if (demoStep === 6) {
            setDemoStep(7);
        }

        // Play opening sound
        playBeep(800, 0.1);
        speak("Abriendo tu asistente de inteligencia artificial. Aquí puedes preguntarme lo que quieras sobre tus proyectos.");

        // Start typing animation sequence after intro
        setTimeout(() => {
            setAiDemoPhase(1); // Start user typing
            speak("Mira cómo puedo responderte.");
        }, 4000);

        // Show AI typing after user message appears
        setTimeout(() => {
            setAiDemoPhase(2); // AI is typing
        }, 6000);

        // Show AI response
        setTimeout(() => {
            setAiDemoPhase(3); // AI responded
            playBeep(600, 0.1);
            speak("Te muestro tus " + immediateActions.length + " tareas prioritarias y te ayudo a organizarlas. También puedo enviar mensajes, delegar tareas, y mucho más.");
        }, 8000);

        // Show quick action demo
        setTimeout(() => {
            setAiDemoPhase(4); // Highlight quick actions
            speak("Usa los botones rápidos para consultas frecuentes, o habla conmigo usando el micrófono.");
        }, 14000);

        // Complete demo
        setTimeout(() => {
            speak("Esto es solo una muestra. Con tu cuenta gratis, tendrás acceso ilimitado a tu asistente personal de inteligencia artificial.");
            // Show completion modal
            setTimeout(() => {
                setShowCompletionModal(true);
                setDemoStep(8);
                trackEvent('tour_completion_modal_shown');
            }, 5000);
        }, 19000);
    };

    const handlePrelaunchSignup = (e) => {
        e.preventDefault();

        if (!signupName.trim() || !signupEmail.trim()) {
            alert('Por favor completa todos los campos');
            return;
        }

        if (!signupEmail.includes('@')) {
            alert('Por favor ingresa un email válido');
            return;
        }

        // Track signup
        trackEvent('prelaunch_signup_submitted', {
            name: signupName,
            email: signupEmail,
            demoActionsUsed,
            hasSeenAiPower
        });

        // Store in localStorage (in production, send to backend/API)
        const signups = JSON.parse(localStorage.getItem('prelaunch_signups') || '[]');
        signups.push({
            name: signupName,
            email: signupEmail,
            timestamp: new Date().toISOString(),
            demoActionsUsed,
            hasSeenAiPower
        });
        localStorage.setItem('prelaunch_signups', JSON.stringify(signups));

        setSignupSubmitted(true);
        playBeep(800, 0.2);
        speak("¡Gracias por registrarte! Te avisaremos cuando lancemos.");

        // Close modals after 3 seconds
        setTimeout(() => {
            setShowSignupPrompt(false);
            setShowCompletionModal(false);
            setShowExitIntent(false);
        }, 3000);
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
                        maxHeight: '90vh',
                        overflowY: 'auto',
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

                            {/* Feature 4 */}
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                <div style={{
                                    background: '#eef2ff',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    color: '#6366f1'
                                }}>
                                    <Sparkles size={24} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', margin: '0 0 4px 0' }}>
                                        Asistente IA
                                    </h3>
                                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, lineHeight: '1.5' }}>
                                        Tu segundo cerebro. Pregunta sobre el estado de proyectos, fechas y responsables.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div style={{ paddingTop: '24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setDemoStep(1);
                                    setDemoActionsUsed(prev => prev + 1);
                                }}
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
                    bottom: '250px',
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
                            onClick={() => {
                                setDemoStep(4); // Move directly to Step 4 (Point to dots)
                            }}
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


            {/* AI Assistant Popup - Top Right Corner */}
            {showAiAssistant && (
                <div style={{
                    position: 'fixed',
                    top: '80px',
                    right: '24px',
                    width: '380px',
                    maxHeight: '520px',
                    background: 'white',
                    borderRadius: '20px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
                    zIndex: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '16px 20px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                background: 'rgba(255,255,255,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Sparkles size={20} color="white" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 700, color: 'white', fontSize: '16px' }}>Asistente IA</h3>
                                <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>Tu segundo cerebro</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setDemoStep(8)}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px',
                                cursor: 'pointer',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Chat Messages - Animated based on demo phase */}
                    <div style={{ flex: 1, padding: '16px', background: '#f8fafc', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                        {/* AI Welcome - Always visible */}
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', animation: 'slideIn 0.3s ease-out' }}>
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <Sparkles size={14} color="white" />
                            </div>
                            <div style={{ background: 'white', padding: '12px 14px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', maxWidth: '85%' }}>
                                <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>
                                    ¡Hola! Soy tu asistente IA. ¿En qué te ayudo?
                                </p>
                            </div>
                        </div>

                        {/* User Question - Appears in phase 1+ */}
                        {aiDemoPhase >= 1 && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', animation: 'slideIn 0.3s ease-out' }}>
                                <div style={{ background: '#6366f1', padding: '12px 14px', borderRadius: '12px', maxWidth: '80%', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
                                    <p style={{ margin: 0, fontSize: '14px', color: 'white' }}>¿Qué tareas tengo pendientes para hoy?</p>
                                </div>
                            </div>
                        )}

                        {/* AI Typing Indicator - Shows in phase 2 only */}
                        {aiDemoPhase === 2 && (
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', animation: 'slideIn 0.3s ease-out' }}>
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Sparkles size={14} color="white" />
                                </div>
                                <div style={{
                                    background: 'white',
                                    padding: '14px 18px',
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                    display: 'flex',
                                    gap: '6px',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', animation: 'pulse 1s infinite' }} />
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', animation: 'pulse 1s infinite 0.2s' }} />
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', animation: 'pulse 1s infinite 0.4s' }} />
                                    <span style={{ marginLeft: '8px', fontSize: '13px', color: '#9ca3af' }}>Analizando tus datos...</span>
                                </div>
                            </div>
                        )}

                        {/* AI Full Response - Shows in phase 3+ */}
                        {aiDemoPhase >= 3 && (
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', animation: 'slideIn 0.3s ease-out' }}>
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Sparkles size={14} color="white" />
                                </div>
                                <div style={{ background: 'white', padding: '12px 14px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', maxWidth: '85%' }}>
                                    <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>
                                        📋 Tienes <strong style={{ color: '#6366f1' }}>{immediateActions.length} tareas prioritarias</strong>:
                                    </p>
                                    {immediateActions.slice(0, 3).map((task, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 10px',
                                            marginBottom: '4px',
                                            background: '#f8fafc',
                                            borderRadius: '8px'
                                        }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                                            <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{task.name}</span>
                                        </div>
                                    ))}
                                    {waitingFor.length > 0 && (
                                        <p style={{ margin: '12px 0 0 0', fontSize: '13px', color: '#6b7280', background: '#fef3c7', padding: '8px 10px', borderRadius: '8px' }}>
                                            ⏳ También tienes <strong>{waitingFor.length} tareas delegadas</strong> esperando respuesta.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions - Highlighted in phase 4 */}
                    <div style={{
                        padding: '12px 16px',
                        borderTop: '1px solid #e5e7eb',
                        background: aiDemoPhase === 4 ? '#eef2ff' : 'white',
                        transition: 'all 0.3s',
                        boxShadow: aiDemoPhase === 4 ? 'inset 0 0 0 2px #6366f1' : 'none'
                    }}>
                        <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: aiDemoPhase === 4 ? '#4f46e5' : '#9ca3af', fontWeight: 600 }}>
                            {aiDemoPhase === 4 ? '👇 PRUEBA ESTAS PREGUNTAS' : 'PREGUNTAS RÁPIDAS'}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            <button style={{
                                background: aiDemoPhase === 4 ? '#6366f1' : '#f1f5f9',
                                color: aiDemoPhase === 4 ? 'white' : '#475569',
                                border: 'none',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                animation: aiDemoPhase === 4 ? 'pulse 2s infinite' : 'none'
                            }}>
                                📊 Estado de proyectos
                            </button>
                            <button style={{
                                background: '#f1f5f9',
                                border: 'none',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                color: '#475569',
                                cursor: 'pointer'
                            }}>
                                📅 Próximas fechas
                            </button>
                            <button style={{
                                background: '#f1f5f9',
                                border: 'none',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                color: '#475569',
                                cursor: 'pointer'
                            }}>
                                👥 Mi equipo
                            </button>
                        </div>
                    </div>

                    {/* Input */}
                    <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', background: '#fafafa' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                                type="text"
                                placeholder="Pregúntame algo..."
                                style={{
                                    flex: 1,
                                    padding: '12px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #e5e7eb',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            />
                            <button style={{
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '12px 16px',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <Mic size={16} />
                            </button>
                        </div>
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
                                Tienes {immediateActions.length} acciones inmediatas y {recentCaptures.length} ideas sin procesar.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', position: 'relative', alignItems: 'center' }}>
                            {/* Action Counter - Creates Urgency */}
                            <div style={{
                                background: demoActionsUsed >= DEMO_ACTION_LIMIT - 1 ? '#fef2f2' : '#f0f9ff',
                                color: demoActionsUsed >= DEMO_ACTION_LIMIT - 1 ? '#dc2626' : '#0369a1',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 600,
                                border: `1px solid ${demoActionsUsed >= DEMO_ACTION_LIMIT - 1 ? '#fecaca' : '#bae6fd'}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <Clock size={14} />
                                {DEMO_ACTION_LIMIT - demoActionsUsed} {demoActionsUsed >= DEMO_ACTION_LIMIT - 1 ? 'acción restante' : 'acciones restantes'}
                            </div>

                            {/* AI Assistant Button - Key Demo Feature */}
                            <button
                                onClick={handleAiSidebarToggle}
                                style={{
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 18px',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    position: 'relative',
                                    zIndex: demoStep === 6 ? 65 : 1,
                                    boxShadow: demoStep === 6 ? '0 0 0 4px rgba(99, 102, 241, 0.5)' : '0 4px 12px rgba(99, 102, 241, 0.3)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.5)';
                                }}
                                onMouseLeave={e => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = demoStep === 6 ? '0 0 0 4px rgba(99, 102, 241, 0.5)' : '0 4px 12px rgba(99, 102, 241, 0.3)';
                                }}
                            >
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
                                    onMenuToggle={handleCardMenuToggle}
                                    tutorialStep={
                                        demoStep === 4 && inbox.indexOf(item) === 0 ? 'open_menu' :
                                            (demoStep === 5 && inbox.indexOf(item) === 0 ? 'click_smart_process' : null)
                                    }
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
                    left: '50%',
                    transform: 'translateX(-50%)',
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
                    left: '50%',
                    transform: 'translateX(-50%)',
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

            {/* Floating Signup Prompt - After AI Experience */}
            {showSignupPrompt && (
                <div style={{
                    position: 'fixed',
                    bottom: '110px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'white',
                    borderRadius: '16px',
                    padding: '20px 28px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                    zIndex: 9998,
                    maxWidth: '500px',
                    animation: 'slideUp 0.4s ease-out',
                    border: '2px solid #10b981'
                }}>
                    <button
                        onClick={() => setShowSignupPrompt(false)}
                        style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#9ca3af',
                            padding: '4px'
                        }}
                    >
                        <X size={18} />
                    </button>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            flexShrink: 0
                        }}>
                            <Sparkles size={24} />
                        </div>
                        <div style={{ flex: 1 }}>
                            {!signupSubmitted ? (
                                <>
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#111827' }}>
                                        ¡Únete al Pre-Lanzamiento!
                                    </h3>
                                    <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
                                        Sé de los primeros en acceder. Te avisaremos cuando lancemos con acceso ilimitado a IA, delegación automática y más.
                                    </p>
                                    <form onSubmit={handlePrelaunchSignup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <input
                                            type="text"
                                            placeholder="Nombre completo"
                                            value={signupName}
                                            onChange={(e) => setSignupName(e.target.value)}
                                            style={{
                                                padding: '12px 14px',
                                                borderRadius: '8px',
                                                border: '1px solid #d1d5db',
                                                fontSize: '14px',
                                                outline: 'none',
                                                transition: 'border-color 0.2s'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#10b981'}
                                            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                            required
                                        />
                                        <input
                                            type="email"
                                            placeholder="Email"
                                            value={signupEmail}
                                            onChange={(e) => setSignupEmail(e.target.value)}
                                            style={{
                                                padding: '12px 14px',
                                                borderRadius: '8px',
                                                border: '1px solid #d1d5db',
                                                fontSize: '14px',
                                                outline: 'none',
                                                transition: 'border-color 0.2s'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#10b981'}
                                            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                            required
                                        />
                                        <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                                            <button
                                                type="submit"
                                                style={{
                                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '12px 20px',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    flex: 1
                                                }}
                                            >
                                                🚀 Reservar Mi Lugar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowSignupPrompt(false)}
                                                style={{
                                                    background: '#f3f4f6',
                                                    color: '#6b7280',
                                                    border: 'none',
                                                    padding: '12px 16px',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Después
                                            </button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <>
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#10b981' }}>
                                        ✅ ¡Gracias por registrarte!
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
                                        Te hemos guardado en la lista. Te avisaremos por email cuando lancemos. ¡Prepárate para la magia! 🎉
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Demo Limit Reached Modal */}
            {demoActionsUsed >= DEMO_ACTION_LIMIT && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 10000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '24px',
                        maxWidth: '480px',
                        width: '100%',
                        padding: '40px',
                        textAlign: 'center',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            margin: '0 auto 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                        }}>
                            <Clock size={40} />
                        </div>
                        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>
                            ¡Has Alcanzado el Límite del Demo!
                        </h2>
                        <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: '1.6', marginBottom: '32px' }}>
                            ¿Viste el poder de Aido? Crea tu cuenta gratis ahora para obtener:
                        </p>
                        <div style={{ textAlign: 'left', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <CheckCircle2 size={20} color="#10b981" />
                                <span style={{ fontSize: '15px', color: '#374151' }}><strong>Acciones ilimitadas</strong> con IA</span>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <CheckCircle2 size={20} color="#10b981" />
                                <span style={{ fontSize: '15px', color: '#374151' }}>Sincronización en <strong>todos tus dispositivos</strong></span>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <CheckCircle2 size={20} color="#10b981" />
                                <span style={{ fontSize: '15px', color: '#374151' }}>Colaboración <strong>con tu equipo</strong></span>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <CheckCircle2 size={20} color="#10b981" />
                                <span style={{ fontSize: '15px', color: '#374151' }}>Asistente IA <strong>personal 24/7</strong></span>
                            </div>
                        </div>
                        {!signupSubmitted ? (
                            <>
                                <form onSubmit={handlePrelaunchSignup} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
                                    <input
                                        type="text"
                                        placeholder="Nombre completo"
                                        value={signupName}
                                        onChange={(e) => setSignupName(e.target.value)}
                                        style={{
                                            padding: '14px 16px',
                                            borderRadius: '10px',
                                            border: '2px solid #e5e7eb',
                                            fontSize: '15px',
                                            outline: 'none',
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#10b981'}
                                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                        required
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={signupEmail}
                                        onChange={(e) => setSignupEmail(e.target.value)}
                                        style={{
                                            padding: '14px 16px',
                                            borderRadius: '10px',
                                            border: '2px solid #e5e7eb',
                                            fontSize: '15px',
                                            outline: 'none',
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#10b981'}
                                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        style={{
                                            width: '100%',
                                            background: 'linear-gradient(135deg, #10b981, #059669)',
                                            color: 'white',
                                            border: 'none',
                                            padding: '16px',
                                            borderRadius: '12px',
                                            fontSize: '16px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            boxShadow: '0 10px 20px rgba(16,185,129,0.3)',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => {
                                            e.target.style.transform = 'translateY(-2px)';
                                            e.target.style.boxShadow = '0 12px 24px rgba(16,185,129,0.4)';
                                        }}
                                        onMouseLeave={e => {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = '0 10px 20px rgba(16,185,129,0.3)';
                                        }}
                                    >
                                        🚀 Reservar Mi Lugar
                                    </button>
                                </form>
                                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
                                    Sin tarjeta de crédito • Configuración en 30 segundos
                                </p>
                            </>
                        ) : (
                            <div style={{
                                background: '#d1fae5',
                                padding: '24px',
                                borderRadius: '12px',
                                border: '2px solid #10b981'
                            }}>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700, color: '#10b981' }}>
                                    ✅ ¡Perfecto!
                                </h3>
                                <p style={{ margin: 0, fontSize: '15px', color: '#065f46', lineHeight: '1.5' }}>
                                    Te contactaremos cuando lancemos. ¡Gracias! 🎉
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tour Completion Modal - Shows after interactive walkthrough */}
            {showCompletionModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(6px)',
                    zIndex: 10001,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    animation: 'fadeIn 0.3s ease-out'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)',
                        borderRadius: '32px',
                        maxWidth: '540px',
                        width: '100%',
                        padding: '48px 40px',
                        textAlign: 'center',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                        border: '2px solid #bae6fd',
                        position: 'relative'
                    }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            margin: '-80px auto 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            animation: 'bounce 2s infinite',
                            boxShadow: '0 20px 40px rgba(16,185,129,0.4)'
                        }}>
                            <CheckCircle2 size={50} strokeWidth={2.5} />
                        </div>

                        <h2 style={{
                            fontSize: '32px',
                            fontWeight: 900,
                            background: 'linear-gradient(135deg, #111827, #374151)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: '12px',
                            lineHeight: '1.2'
                        }}>
                            ¡Completaste el Tour!
                        </h2>

                        <p style={{ fontSize: '18px', color: '#6b7280', lineHeight: '1.6', marginBottom: '32px' }}>
                            Ahora sabes cómo <strong style={{ color: '#111827' }}>Aido puede transformar tu productividad</strong>.
                        </p>

                        <div style={{
                            background: '#f9fafb',
                            borderRadius: '16px',
                            padding: '24px',
                            marginBottom: '24px',
                            textAlign: 'left',
                            border: '1px solid #e5e7eb'
                        }}>
                            <p style={{ fontSize: '16px', color: '#111827', marginBottom: '16px', fontWeight: 700, marginTop: 0 }}>
                                Acceso de por vida incluye:
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[
                                    'Todas las funciones actuales de Aido',
                                    'Todas las funciones futuras, sin costo adicional',
                                    'Procesamiento con IA incluido',
                                    'Sin suscripciones — pagas una sola vez'
                                ].map((text, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <CheckCircle2 size={18} color="#10b981" fill="#ecfdf5" />
                                        <span style={{ fontSize: '14px', color: '#374151' }}>{text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>


                        {!signupSubmitted ? (
                            <>
                                <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                                    <div style={{ display: 'inline-block', background: '#fff7ed', color: '#ea580c', fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', marginBottom: '8px' }}>
                                        🔥 OFERTA DE PRE-LANZAMIENTO
                                    </div>
                                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827' }}>
                                        Acceso de por vida por solo <span style={{ color: '#10b981' }}>$15 USD</span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>
                                        (pago único) · Después del lanzamiento será solo por suscripción
                                    </p>
                                </div>

                                <form onSubmit={handlePrelaunchSignup} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                                    <input
                                        type="text"
                                        placeholder="Nombre completo"
                                        value={signupName}
                                        onChange={(e) => setSignupName(e.target.value)}
                                        style={{
                                            padding: '14px 16px',
                                            borderRadius: '12px',
                                            border: '2px solid #e5e7eb',
                                            fontSize: '15px',
                                            outline: 'none',
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#10b981'}
                                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                        required
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={signupEmail}
                                        onChange={(e) => setSignupEmail(e.target.value)}
                                        style={{
                                            padding: '14px 16px',
                                            borderRadius: '12px',
                                            border: '2px solid #e5e7eb',
                                            fontSize: '15px',
                                            outline: 'none',
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#10b981'}
                                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        style={{
                                            width: '100%',
                                            background: 'linear-gradient(135deg, #10b981, #059669)',
                                            color: 'white',
                                            border: 'none',
                                            padding: '18px',
                                            borderRadius: '14px',
                                            fontSize: '17px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            boxShadow: '0 12px 24px rgba(16,185,129,0.4)',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => {
                                            e.target.style.transform = 'translateY(-2px)';
                                            e.target.style.boxShadow = '0 16px 32px rgba(16,185,129,0.5)';
                                        }}
                                        onMouseLeave={e => {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = '0 12px 24px rgba(16,185,129,0.4)';
                                        }}
                                    >
                                        🚀 Desbloquear Acceso de por Vida — $15
                                    </button>
                                </form>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                    <div style={{ fontSize: '13px', color: '#6b7280' }}>Pago único</div>
                                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#d1d5db' }} />
                                    <div style={{ fontSize: '13px', color: '#6b7280' }}>Sin suscripciones</div>
                                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#d1d5db' }} />
                                    <div style={{ fontSize: '13px', color: '#6b7280' }}>Acceso para siempre</div>
                                </div>
                            </>
                        ) : (
                            <div style={{
                                background: '#d1fae5',
                                padding: '24px',
                                borderRadius: '16px',
                                marginBottom: '16px',
                                border: '2px solid #10b981'
                            }}>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700, color: '#10b981' }}>
                                    ✅ ¡Registro Exitoso!
                                </h3>
                                <p style={{ margin: 0, fontSize: '15px', color: '#065f46', lineHeight: '1.5' }}>
                                    Te avisaremos por email cuando lancemos. ¡Gracias por unirte! 🎉
                                </p>
                            </div>
                        )}

                        <button
                            onClick={() => setShowCompletionModal(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#9ca3af',
                                fontSize: '14px',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                padding: '8px'
                            }}
                        >
                            Continuar explorando el demo
                        </button>
                    </div>
                </div>
            )}

            {/* Exit-Intent Modal - Last chance to convert */}
            {showExitIntent && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 10002,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '24px',
                        maxWidth: '520px',
                        width: '100%',
                        padding: '40px',
                        textAlign: 'center',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
                        border: '3px solid #f59e0b',
                        position: 'relative'
                    }}>




                        <h2 style={{
                            fontSize: '28px',
                            fontWeight: 800,
                            color: '#111827',
                            marginBottom: '12px',
                            lineHeight: '1.2'
                        }}>
                            ¡Espera! No pierdas tu progreso
                        </h2>

                        <p style={{ fontSize: '17px', color: '#6b7280', lineHeight: '1.5', marginBottom: '32px' }}>
                            Ya has visto cómo <strong style={{ color: '#111827' }}>Aido puede transformar tu forma de trabajar</strong>.
                            {demoActionsUsed >= 2 && " Has usado " + demoActionsUsed + " acciones del demo."}
                        </p>




                        {!signupSubmitted ? (
                            <>
                                <form onSubmit={handlePrelaunchSignup} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
                                    <input
                                        type="text"
                                        placeholder="Nombre completo"
                                        value={signupName}
                                        onChange={(e) => setSignupName(e.target.value)}
                                        style={{
                                            padding: '14px 16px',
                                            borderRadius: '10px',
                                            border: '2px solid #fbbf24',
                                            fontSize: '15px',
                                            outline: 'none',
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                                        onBlur={(e) => e.target.style.borderColor = '#fbbf24'}
                                        required
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={signupEmail}
                                        onChange={(e) => setSignupEmail(e.target.value)}
                                        style={{
                                            padding: '14px 16px',
                                            borderRadius: '10px',
                                            border: '2px solid #fbbf24',
                                            fontSize: '15px',
                                            outline: 'none',
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                                        onBlur={(e) => e.target.style.borderColor = '#fbbf24'}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        style={{
                                            width: '100%',
                                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                            color: 'white',
                                            border: 'none',
                                            padding: '18px',
                                            borderRadius: '12px',
                                            fontSize: '17px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            boxShadow: '0 12px 24px rgba(245,158,11,0.4)',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => {
                                            e.target.style.transform = 'translateY(-2px)';
                                            e.target.style.boxShadow = '0 16px 32px rgba(245,158,11,0.5)';
                                        }}
                                        onMouseLeave={e => {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = '0 12px 24px rgba(245,158,11,0.4)';
                                        }}
                                    >
                                        🚀 Sí, Reservar Mi Lugar
                                    </button>
                                </form>

                                <button
                                    onClick={() => {
                                        setShowExitIntent(false);
                                        trackEvent('exit_intent_dismissed');
                                    }}
                                    style={{
                                        width: '100%',
                                        background: '#f3f4f6',
                                        color: '#6b7280',
                                        border: 'none',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    No gracias, seguir explorando
                                </button>
                            </>
                        ) : (
                            <div style={{
                                background: '#fef3c7',
                                padding: '24px',
                                borderRadius: '12px',
                                marginBottom: '12px',
                                border: '2px solid #f59e0b'
                            }}>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700, color: '#d97706' }}>
                                    ✅ ¡Excelente Decisión!
                                </h3>
                                <p style={{ margin: 0, fontSize: '15px', color: '#92400e', lineHeight: '1.5' }}>
                                    Te avisaremos cuando lancemos. ¡Gracias por quedarte! 🎉
                                </p>
                            </div>
                        )}


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
                @keyframes slideUp {
                    from { transform: translateX(-50%) translateY(20px); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
                @keyframes slideIn {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
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
