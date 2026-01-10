import { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import {
    Mic,
    Square,
    CheckCircle2,
    Sparkles,
    X
} from 'lucide-react';
import { transcribeAudio } from '../services/aiService';

export default function GlobalVoiceCapture() {
    const { createInboxItem } = useData();
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState(''); // '', 'recording', 'processing', 'success'
    const [detectedLanguage, setDetectedLanguage] = useState('');

    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);
    const timerInterval = useRef(null);

    useEffect(() => {
        if (status === 'success') {
            const timer = setTimeout(() => {
                setStatus('');
                setDetectedLanguage('');
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
                handleTranscription(audioBlob);
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
            if (timerInterval.current) clearInterval(timerInterval.current);
        }
    };

    const handleTranscription = async (blob) => {
        setIsLoading(true);
        setStatus('processing');
        try {
            const result = await transcribeAudio(blob);
            if (result && result.text) {
                await createInboxItem(result.text, result.language);
                setDetectedLanguage(result.language);
                setStatus('success');
            } else {
                setStatus('');
            }
        } catch (err) {
            console.error('Transcription error:', err);
            setStatus('');
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`global-voice-capture ${status}`}>
            {status === 'recording' && (
                <div className="capture-overlay">
                    <div className="capture-content">
                        <div className="capture-waves">
                            <div className="wave-bar"></div>
                            <div className="wave-bar"></div>
                            <div className="wave-bar"></div>
                            <div className="wave-bar"></div>
                            <div className="wave-bar"></div>
                        </div>
                        <div className="capture-timer">{formatTime(recordingTime)}</div>
                        <div className="capture-label">Listening to your thoughts...</div>
                        <button className="stop-action" onClick={stopRecording}>
                            <Square size={20} fill="currentColor" />
                            Stop & Transcribe
                        </button>
                    </div>
                </div>
            )}

            {status === 'processing' && (
                <div className="status-pill processing">
                    <div className="mini-spinner"></div>
                    <span>AI is transcribing...</span>
                </div>
            )}

            {status === 'success' && (
                <div className="status-pill success">
                    <CheckCircle2 size={16} />
                    <span>Captured in {detectedLanguage || 'auto'}!</span>
                    <button className="close-pill" onClick={() => setStatus('')}>
                        <X size={14} />
                    </button>
                </div>
            )}

            {!isRecording && !isLoading && status !== 'success' && (
                <button
                    className="voice-fab"
                    onClick={startRecording}
                    title="Quick Voice Note"
                >
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

                .status-pill.success {
                    background: var(--color-success);
                    color: white;
                    border: none;
                }

                .status-pill.processing {
                    background: white;
                    color: var(--text-primary);
                }

                .mini-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid var(--color-primary-100);
                    border-top-color: var(--color-primary-600);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                .close-pill {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    padding: 2px;
                    cursor: pointer;
                }

                /* Recording Overlay */
                .capture-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(255, 255, 255, 0.8);
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

                .stop-action {
                    display: flex;
                    align-items: center;
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

                .stop-action:hover {
                    transform: translateY(-2px);
                    background: #dc2626;
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
                    animation: wave-bar-anim 1s infinite ease-in-out;
                }

                .wave-bar:nth-child(2) { animation-delay: 0.1s; height: 30px; }
                .wave-bar:nth-child(3) { animation-delay: 0.2s; height: 40px; }
                .wave-bar:nth-child(4) { animation-delay: 0.3s; height: 25px; }
                .wave-bar:nth-child(5) { animation-delay: 0.4s; height: 15px; }

                @keyframes wave-bar-anim {
                    0%, 100% { transform: scaleY(0.5); opacity: 0.5; }
                    50% { transform: scaleY(1); opacity: 1; }
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
