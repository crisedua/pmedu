import { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import {
    Mic,
    Square,
    CheckCircle2,
    Sparkles,
    X,
    MessageSquare,
    Calendar,
    User,
    ArrowRight,
    Loader2
} from 'lucide-react';
import { transcribeAudio, extractTasksFromVoice, classifyVoiceContent, generateFollowUpQuestion } from '../services/aiService';

export default function GlobalVoiceCapture() {
    const { createInboxItem, users, projects, language, createMultipleTasks } = useData();
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [processingStage, setProcessingStage] = useState(''); // 'transcribing', 'analyzing'
    const [status, setStatus] = useState(''); // '', 'recording', 'review', 'success'

    // Extracted Data State
    const [extractedTasks, setExtractedTasks] = useState([]);
    const [transcription, setTranscription] = useState('');
    const [followUpQuestion, setFollowUpQuestion] = useState(null);
    const [needsClarification, setNeedsClarification] = useState(false);

    const t = {
        listening: language === 'es' ? 'Escuchando...' : 'Listening...',
        stopProcess: language === 'es' ? 'Detener y Procesar' : 'Stop & Process',
        transcribing: language === 'es' ? 'Transcribiendo...' : 'Transcribing...',
        analyzing: language === 'es' ? 'Analizando contenido...' : 'Analyzing content...',
        extracting: language === 'es' ? 'Extrayendo Tareas...' : 'Extracting Tasks...',
        captured: language === 'es' ? 'Capturadas' : 'Captured',
        tasks: language === 'es' ? 'Tarea(s)' : 'Task(s)',
        unknown: language === 'es' ? 'Desconocido' : 'Unknown',
        unassigned: language === 'es' ? 'Sin Asignar' : 'Unassigned',
        noDate: language === 'es' ? 'Sin Fecha' : 'No Date',
        saveInbox: language === 'es' ? 'Guardar en Inbox' : 'Save to Inbox',
        confirmCreate: language === 'es' ? 'Confirmar y Crear' : 'Confirm & Create',
        success: language === 'es' ? '¡Capturado Exitosamente!' : 'Captured Successfully!',
        voiceCommand: language === 'es' ? 'Nota de Voz' : 'Voice Note'
    };

    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);
    const timerInterval = useRef(null);

    // Auto-close success message
    useEffect(() => {
        if (status === 'success') {
            const timer = setTimeout(() => {
                setStatus('');
                setExtractedTasks([]);
                setTranscription('');
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (event) => {
                audioChunks.current.push(event.data);
            };

            mediaRecorder.current.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
                handleProcessing(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.current.start();
            setIsRecording(true);
            setStatus('recording');
            setRecordingTime(0);
            timerInterval.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error('Mic error:', err);
            alert('Could not access microphone.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.stop();
            setIsRecording(false);
            setStatus(''); // Close the recording overlay immediately
            if (timerInterval.current) clearInterval(timerInterval.current);
        }
    };

    const handleProcessing = async (blob) => {
        setIsLoading(true);
        setProcessingStage('transcribing');

        try {
            // 1. Transcribe
            const result = await transcribeAudio(blob);
            if (!result || !result.text) throw new Error("No transcription");

            setTranscription(result.text);

            // 2. CLASSIFY CONTENT with timeout protection
            setProcessingStage('analyzing');
            let classification;

            try {
                // Add 10-second timeout to classification
                const classificationPromise = classifyVoiceContent(result.text, { language });
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Classification timeout')), 10000)
                );

                classification = await Promise.race([classificationPromise, timeoutPromise]);
                console.log('[Voice Capture] Classification:', classification);
            } catch (classErr) {
                console.warn('[Voice Capture] Classification failed, using fallback:', classErr);
                // Fallback: treat as unclear content → save to inbox
                classification = {
                    contentType: 'note',
                    confidence: 0.5,
                    suggestedAction: 'save_to_inbox',
                    summary: result.text.substring(0, 100)
                };
            }

            // 3. Route based on classification
            if (classification.suggestedAction === 'extract_tasks') {
                // Content is task-related → extract tasks
                setProcessingStage('extracting');
                const extraction = await extractTasksFromVoice(result.text, { users, projects, language });

                if (extraction.tasks.length > 0) {
                    setExtractedTasks(extraction.tasks);

                    // If AI flags need for follow up, set it
                    if (extraction.needsFollowUp) {
                        setNeedsClarification(true);
                        setFollowUpQuestion(extraction.followUpQuestion);
                    }

                    setStatus('review');
                } else {
                    // Extraction found no tasks → save to inbox
                    await createInboxItem(result.text, result.language);
                    setStatus('success');
                }
            } else if (classification.suggestedAction === 'save_to_inbox') {
                // Content is note/idea/question → save directly to inbox
                await createInboxItem(result.text, result.language);
                setStatus('success');
            } else {
                // Content is unclear → ask for clarification
                setNeedsClarification(true);
                setFollowUpQuestion(classification.intent || (language === 'es'
                    ? '¿Podrías aclarar qué quieres registrar?'
                    : 'Could you clarify what you want to record?'));
                // Still save to inbox for now
                await createInboxItem(result.text, result.language);
                setStatus('success');
            }

        } catch (err) {
            console.error('Processing error:', err);
            setStatus('');
        } finally {
            setIsLoading(false);
            setProcessingStage('');
        }
    };

    const handleConfirmTasks = async () => {
        try {
            // Add metadata source = 'voice'
            const tasksToCreate = extractedTasks.map(t => ({
                ...t,
                source: 'voice',
                created_by_ai: true
            }));

            await createMultipleTasks(tasksToCreate);
            setStatus('success');
        } catch (err) {
            console.error('Error creating tasks:', err);
            alert('Failed to create tasks');
        }
    };

    const handleDiscard = () => {
        setStatus('');
        setExtractedTasks([]);
        setTranscription('');
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`global-voice-capture ${status}`}>
            {/* 1. Recording Overlay */}
            {status === 'recording' && (
                <div className="capture-overlay">
                    <div className="capture-content">
                        <div className="capture-waves">
                            {[1, 2, 3, 4, 5].map(i => <div key={i} className="wave-bar"></div>)}
                        </div>
                        <div className="capture-timer">{formatTime(recordingTime)}</div>
                        <div className="capture-label">{t.listening}</div>
                        <button className="stop-action" onClick={stopRecording}>
                            <Square size={20} fill="currentColor" />
                            {t.stopProcess}
                        </button>
                    </div>
                </div>
            )}

            {/* 2. Loading State */}
            {isLoading && (
                <div className="status-pill processing">
                    <Loader2 className="animate-spin" size={18} />
                    <span>
                        {processingStage === 'transcribing' && t.transcribing}
                        {processingStage === 'analyzing' && t.analyzing}
                        {processingStage === 'extracting' && t.extracting}
                    </span>
                </div>
            )}

            {/* 3. Task Review Modal (Mini) */}
            {status === 'review' && !isLoading && (
                <div className="review-card">
                    <div className="review-header">
                        <Sparkles size={16} className="text-secondary" />
                        <span className="text-sm font-medium">{t.captured} {extractedTasks.length} {t.tasks}</span>
                        <button className="close-btn" onClick={handleDiscard}><X size={14} /></button>
                    </div>

                    <div className="tasks-preview">
                        {extractedTasks.map((task, idx) => (
                            <div key={idx} className="task-preview-item">
                                <div className="task-preview-title">{task.name}</div>
                                <div className="task-preview-meta">
                                    {task.assignedTo ? (
                                        <span className="meta-tag">
                                            <User size={12} /> {users.find(u => u.id === task.assignedTo)?.name || t.unknown}
                                        </span>
                                    ) : (
                                        <span className="meta-tag warning">
                                            <User size={12} /> {t.unassigned}
                                        </span>
                                    )}
                                    {task.dueDate ? (
                                        <span className="meta-tag">
                                            <Calendar size={12} /> {new Date(task.dueDate).toLocaleDateString()}
                                        </span>
                                    ) : (
                                        <span className="meta-tag warning">
                                            <Calendar size={12} /> {t.noDate}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {needsClarification && followUpQuestion && (
                        <div className="clarification-box">
                            <MessageSquare size={14} />
                            {followUpQuestion}
                            {/* Future: Add input for clarification */}
                        </div>
                    )}

                    <div className="review-actions">
                        <button className="btn-secondary-sm" onClick={() => {
                            // Save to inbox instead
                            createInboxItem(transcription, language);
                            setStatus('success');
                        }}>
                            {t.saveInbox}
                        </button>
                        <button className="btn-primary-sm" onClick={handleConfirmTasks}>
                            {t.confirmCreate}
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* 4. Success State */}
            {status === 'success' && (
                <div className="status-pill success">
                    <CheckCircle2 size={16} />
                    <span>{t.success}</span>
                </div>
            )}

            {/* 5. Floating Action Button (Idle) */}
            {!isRecording && !isLoading && status !== 'review' && status !== 'success' && (
                <button className="voice-fab" onClick={startRecording} title={t.voiceCommand}>
                    <Mic size={24} />
                    <div className="fab-glow"></div>
                </button>
            )}

            <style>{`
                .global-voice-capture {
                    position: fixed;
                    right: 2rem;
                    bottom: 2rem;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 1rem;
                    font-family: var(--font-sans);
                }

                .voice-fab {
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    background: var(--bg-gradient);
                    color: white;
                    border: none;
                    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    position: relative;
                }

                .voice-fab:hover {
                    transform: scale(1.1) translateY(-4px);
                    box-shadow: 0 12px 32px rgba(99, 102, 241, 0.5);
                }

                .fab-glow {
                    position: absolute;
                    inset: -4px;
                    border-radius: 50%;
                    background: var(--bg-gradient);
                    opacity: 0.3;
                    filter: blur(8px);
                    z-index: -1;
                    animation: fab-pulse 2s infinite;
                }

                @keyframes fab-pulse {
                    0% { transform: scale(1); opacity: 0.3; }
                    50% { transform: scale(1.2); opacity: 0.1; }
                    100% { transform: scale(1); opacity: 0.3; }
                }

                .capture-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    animation: fadeIn 0.2s ease;
                }

                .capture-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.5rem;
                    background: white;
                    padding: 3rem;
                    border-radius: 2rem;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
                    border: 1px solid var(--border-light);
                    text-align: center;
                    width: 100%;
                    max-width: 400px;
                }

                .capture-timer {
                    font-size: 3rem;
                    font-weight: 800;
                    font-family: var(--font-mono);
                    color: var(--color-primary-600);
                }

                .capture-label {
                    font-size: var(--text-lg);
                    color: var(--text-secondary);
                    font-weight: 500;
                }

                .capture-waves {
                    display: flex;
                    gap: 0.5rem;
                    height: 40px;
                    align-items: center;
                }

                .wave-bar {
                    width: 6px;
                    height: 15px;
                    background: var(--color-primary-500);
                    border-radius: 3px;
                    animation: wave-anim 1s infinite ease-in-out;
                }
                .wave-bar:nth-child(2) { animation-delay: 0.1s; height: 30px; }
                .wave-bar:nth-child(3) { animation-delay: 0.2s; height: 40px; }
                .wave-bar:nth-child(4) { animation-delay: 0.1s; height: 25px; }

                @keyframes wave-anim {
                    0%, 100% { transform: scaleY(0.5); opacity: 0.5; }
                    50% { transform: scaleY(1); opacity: 1; }
                }

                .stop-action {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    padding: 1rem 2rem;
                    background: var(--color-error);
                    color: white;
                    border: none;
                    border-radius: var(--radius-xl);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 8px 16px rgba(239, 68, 68, 0.3);
                }

                .status-pill {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1.25rem;
                    border-radius: var(--radius-full);
                    background: white;
                    box-shadow: var(--shadow-lg);
                    border: 1px solid var(--border-light);
                    font-size: var(--text-sm);
                    font-weight: var(--font-medium);
                    animation: slideInRight 0.3s ease;
                }

                .status-pill.success { background: var(--color-success); color: white; border: none; }
                .status-pill.processing { color: var(--text-primary); }

                /* Review Card */
                .review-card {
                    background: white;
                    border-radius: var(--radius-xl);
                    box-shadow: var(--shadow-xl);
                    border: 1px solid var(--border-light);
                    width: 320px;
                    overflow: hidden;
                    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .review-header {
                    padding: 1rem;
                    background: var(--bg-tertiary);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    border-bottom: 1px solid var(--border-light);
                }

                .close-btn {
                    margin-left: auto;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--text-tertiary);
                    padding: 4px;
                    border-radius: 4px;
                }

                .close-btn:hover { background: rgba(0,0,0,0.05); color: var(--text-primary); }

                .tasks-preview {
                    padding: 1rem;
                    max-height: 300px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .task-preview-item {
                    border: 1px solid var(--border-light);
                    border-radius: var(--radius-md);
                    padding: 0.75rem;
                    background: var(--bg-primary);
                }

                .task-preview-title {
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    font-size: 0.95rem;
                }

                .task-preview-meta {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }

                .meta-tag {
                    font-size: 0.75rem;
                    padding: 2px 6px;
                    border-radius: 4px;
                    background: var(--bg-secondary);
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .meta-tag.warning {
                    background: #fff7ed;
                    color: #c2410c;
                    border: 1px solid #ffedd5;
                }

                .clarification-box {
                    margin: 0 1rem 1rem;
                    padding: 0.75rem;
                    background: #eff6ff;
                    border-radius: var(--radius-md);
                    color: #1e40af;
                    font-size: 0.85rem;
                    display: flex;
                    gap: 0.5rem;
                    align-items: flex-start;
                }

                .review-actions {
                    padding: 1rem;
                    border-top: 1px solid var(--border-light);
                    display: flex;
                    gap: 0.5rem;
                    justify-content: flex-end;
                }

                .btn-primary-sm, .btn-secondary-sm {
                    padding: 0.5rem 1rem;
                    border-radius: var(--radius-lg);
                    font-size: 0.85rem;
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .btn-primary-sm {
                    background: var(--color-primary-600);
                    color: white;
                    border: none;
                }

                .btn-primary-sm:hover { background: var(--color-primary-700); }

                .btn-secondary-sm {
                    background: white;
                    border: 1px solid var(--border-medium);
                    color: var(--text-secondary);
                }

                .btn-secondary-sm:hover { background: var(--bg-secondary); }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                /* Mobile Responsiveness */
                @media (max-width: 768px) {
                    .global-voice-capture {
                        right: 1rem;
                        bottom: 5rem; /* Raised to avoid potential bottom tabs */
                    }
                    
                    .voice-fab {
                        width: 56px;
                        height: 56px;
                    }
                    
                    .review-card {
                        width: calc(100vw - 2rem);
                        max-width: 350px;
                    }
                    
                    .capture-content {
                        padding: 1.5rem;
                        width: 90%;
                        max-width: 320px;
                    }
                    
                    .capture-timer {
                        font-size: 2.5rem;
                    }
                }
            `}</style>
        </div>
    );
}
