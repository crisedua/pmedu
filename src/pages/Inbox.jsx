import { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import {
    Mic,
    Square,
    Trash2,
    ExternalLink,
    Sparkles,
    Clock,
    X,
    Save,
    CheckCircle2
} from 'lucide-react';
import { transcribeAudio } from '../services/aiService';
import { format } from 'date-fns';

export default function Inbox() {
    const {
        inbox,
        projects,
        createInboxItem,
        deleteInboxItem,
        createTask
    } = useData();

    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(null);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);
    const timerInterval = useRef(null);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

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
                handleTranscription(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.current.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerInterval.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Could not access microphone. Please ensure you have given permission.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.stop();
            setIsRecording(false);
            if (timerInterval.current) clearInterval(timerInterval.current);
        }
    };

    const handleTranscription = async (blob) => {
        setLoading(true);
        try {
            const result = await transcribeAudio(blob);
            if (result && result.text) {
                await createInboxItem(result.text, result.language);
                setSuccessMessage(`Thought captured in ${result.language || 'detected language'}!`);
            }
        } catch (err) {
            console.error('Transcription error:', err);
            alert('Failed to transcribe audio. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleMoveToProject = async () => {
        if (!selectedProjectId || !showMoveModal) return;

        try {
            const taskName = showMoveModal.content.length > 60
                ? showMoveModal.content.substring(0, 60) + '...'
                : showMoveModal.content;

            await createTask({
                name: taskName,
                description: showMoveModal.content,
                projectId: selectedProjectId,
                status: 'To Do'
            });
            await deleteInboxItem(showMoveModal.id);
            setShowMoveModal(null);
            setSelectedProjectId('');
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
                    <p className="page-subtitle">Capture ideas quickly, triage them later</p>
                </div>
                {successMessage && (
                    <div className="success-toast">
                        <CheckCircle2 size={16} />
                        {successMessage}
                    </div>
                )}
            </div>

            <div className="inbox-capture-section mb-12">
                <div className={`recorder-box ${isRecording ? 'is-recording' : ''}`}>
                    <div className="recorder-vibe">
                        {isRecording ? (
                            <div className="recording-ui">
                                <div className="waves">
                                    <div className="wave"></div>
                                    <div className="wave"></div>
                                    <div className="wave"></div>
                                </div>
                                <span className="timer">{formatTime(recordingTime)}</span>
                                <p>Listening...</p>
                            </div>
                        ) : loading ? (
                            <div className="processing-ui">
                                <div className="spinner mb-4" />
                                <p>Transcribing your voice...</p>
                            </div>
                        ) : (
                            <div className="idle-ui">
                                <div className="mic-circle">
                                    <Mic size={32} />
                                </div>
                                <h3>Record a Thought</h3>
                                <p>Your message will be automatically transcribed</p>
                            </div>
                        )}

                        <button
                            className={`action-btn ${isRecording ? 'stop-btn' : 'start-btn'}`}
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={loading}
                        >
                            {isRecording ? <Square size={24} fill="currentColor" /> : <Mic size={24} />}
                        </button>
                    </div>
                </div>
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
                        <p>Recorded tasks and ideas will appear here for you to organize into projects.</p>
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
                    <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Convert to Task</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowMoveModal(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="preview-content mb-6">
                                <label className="form-label">Task Preview</label>
                                <div className="preview-box">
                                    {showMoveModal.content}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Destination Project</label>
                                <select
                                    className="form-control"
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                >
                                    <option value="">Choose a project...</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowMoveModal(null)}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                onClick={handleMoveToProject}
                                disabled={!selectedProjectId}
                            >
                                <Save size={18} />
                                Create Task
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

                .inbox-capture-section {
                    display: flex;
                    justify-content: center;
                }

                .recorder-box {
                    width: 100%;
                    max-width: 600px;
                    background: var(--bg-primary);
                    border: 1px solid var(--border-light);
                    border-radius: var(--radius-2xl);
                    padding: var(--space-10);
                    box-shadow: var(--shadow-xl);
                    transition: all 0.3s ease;
                }

                .recorder-box.is-recording {
                    border-color: var(--color-error);
                    box-shadow: 0 0 30px rgba(239, 68, 68, 0.15);
                }

                .recorder-vibe {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: var(--space-6);
                }

                .mic-circle {
                    width: 80px;
                    height: 80px;
                    background: var(--color-primary-50);
                    color: var(--color-primary-600);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .idle-ui h3 {
                    margin-bottom: var(--space-2);
                    text-align: center;
                }

                .idle-ui p {
                    color: var(--text-tertiary);
                    text-align: center;
                }

                .action-btn {
                    width: 72px;
                    height: 72px;
                    border-radius: 50%;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                .start-btn {
                    background: var(--color-primary-600);
                    color: white;
                    box-shadow: 0 8px 16px rgba(79, 70, 229, 0.3);
                }

                .start-btn:hover {
                    transform: scale(1.05);
                    background: var(--color-primary-700);
                }

                .stop-btn {
                    background: var(--color-error);
                    color: white;
                    box-shadow: 0 8px 16px rgba(239, 68, 68, 0.3);
                }

                .stop-btn:active {
                    transform: scale(0.9);
                }

                .recording-ui {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: var(--space-3);
                }

                .timer {
                    font-size: var(--text-3xl);
                    font-weight: var(--font-bold);
                    font-family: var(--font-mono);
                }

                .waves {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    height: 30px;
                }

                .wave {
                    width: 4px;
                    height: 10px;
                    background: var(--color-error);
                    border-radius: var(--radius-full);
                    animation: wave-anim 1s infinite ease-in-out;
                }

                .wave:nth-child(2) { animation-delay: 0.2s; height: 20px; }
                .wave:nth-child(3) { animation-delay: 0.4s; height: 15px; }

                @keyframes wave-anim {
                    0%, 100% { transform: scaleY(1); }
                    50% { transform: scaleY(2); }
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

                .preview-box {
                    background: var(--bg-tertiary);
                    padding: var(--space-4);
                    border-radius: var(--radius-md);
                    font-size: var(--text-sm);
                    color: var(--text-secondary);
                    max-height: 100px;
                    overflow-y: auto;
                    border-left: 3px solid var(--color-primary-400);
                }
                
                .form-control {
                    width: 100%;
                    padding: var(--space-3);
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border-medium);
                    background: var(--bg-primary);
                }
            `}</style>
        </div>
    );
}
