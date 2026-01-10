import { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import {
    Sparkles,
    X,
    Send,
    Mic,
    MicOff,
    Square,
    Bot,
    User as UserIcon,
    Loader2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { askAiAssistant, transcribeAudio } from '../services/aiService';

export default function AIAssistantSidebar({ isOpen, onClose }) {
    const { projects, tasks, currentUser } = useData();
    const [messages, setMessages] = useState([
        { role: 'assistant', content: `Hello ${currentUser.name}! I'm your AI Project Manager. How can I help you today?` }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    // Voice recording refs
    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSendMessage = async (text = null) => {
        const messageText = text || input;
        if (!messageText.trim()) return;

        const newUserMessage = { role: 'user', content: messageText };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await askAiAssistant(messageText, { projects, tasks, currentUser });
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I had an error processing that. Could you try again?" }]);
        } finally {
            setIsTyping(false);
        }
    };

    // Voice logic
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
                setIsTyping(true);
                try {
                    const result = await transcribeAudio(audioBlob);
                    if (result && result.text) {
                        handleSendMessage(result.text);
                    }
                } catch (err) {
                    console.error("Transcription error in chat:", err);
                } finally {
                    setIsTyping(false);
                }
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.current.start();
            setIsRecording(true);
        } catch (err) {
            alert('Could not access microphone');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.stop();
            setIsRecording(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`ai-sidebar-overlay ${isOpen ? 'show' : ''}`}
                onClick={onClose}
            />
            <div className={`ai-assistant-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="ai-sidebar-header">
                    <div className="flex items-center gap-3">
                        <div className="ai-icon-pulse">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold">AI Assistant</h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Project Manager</p>
                        </div>
                    </div>
                    <button className="btnClose" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="ai-messages-container">
                    {messages.map((m, i) => (
                        <div key={i} className={`message-wrapper ${m.role}`}>
                            <div className="message-avatar">
                                {m.role === 'assistant' ? <Bot size={14} /> : <UserIcon size={14} />}
                            </div>
                            <div className="message-content">
                                <ReactMarkdown>{m.content}</ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="message-wrapper assistant">
                            <div className="message-avatar">
                                <Bot size={14} />
                            </div>
                            <div className="message-content typing">
                                <div className="dot"></div>
                                <div className="dot"></div>
                                <div className="dot"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="ai-input-area">
                    <div className="input-row">
                        <input
                            type="text"
                            placeholder="Ask anything about your projects..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <button
                            className={`action-btn ${isRecording ? 'recording' : ''}`}
                            onClick={isRecording ? stopRecording : startRecording}
                        >
                            {isRecording ? <Square size={18} fill="currentColor" /> : <Mic size={18} />}
                        </button>
                        <button
                            className="send-btn"
                            onClick={() => handleSendMessage()}
                            disabled={!input.trim() || isTyping}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    {isRecording && (
                        <div className="recording-status">
                            <div className="pulse-dot"></div>
                            Listening...
                        </div>
                    )}
                </div>

                <style>{`
                .ai-assistant-sidebar {
                    position: fixed;
                    top: 0;
                    right: 0;
                    width: 360px;
                    height: 100vh;
                    background: var(--bg-primary);
                    border-left: 1px solid var(--border-light);
                    z-index: 1100;
                    display: flex;
                    flex-direction: column;
                    box-shadow: -10px 0 30px rgba(0,0,0,0.05);
                    transform: translateX(100%);
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .ai-assistant-sidebar.open {
                    transform: translateX(0);
                }

                .ai-sidebar-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.2);
                    backdrop-filter: blur(2px);
                    z-index: 1050;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                }

                .ai-sidebar-overlay.show {
                    opacity: 1;
                    visibility: visible;
                }

                @media (max-width: 768px) {
                    .ai-assistant-sidebar {
                        width: 100%;
                    }
                }


                .ai-sidebar-header {
                    padding: var(--space-4) var(--space-6);
                    border-bottom: 1px solid var(--border-light);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .ai-icon-pulse {
                    width: 32px;
                    height: 32px;
                    background: var(--bg-gradient);
                    color: white;
                    border-radius: var(--radius-md);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .ai-messages-container {
                    flex: 1;
                    overflow-y: auto;
                    padding: var(--space-6);
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-4);
                }

                .message-wrapper {
                    display: flex;
                    gap: var(--space-3);
                    max-width: 85%;
                }

                .message-wrapper.assistant {
                    align-self: flex-start;
                }

                .message-wrapper.user {
                    align-self: flex-end;
                    flex-direction: row-reverse;
                }

                .message-avatar {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: var(--bg-tertiary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-secondary);
                    flex-shrink: 0;
                }

                .assistant .message-avatar {
                    background: var(--color-primary-100);
                    color: var(--color-primary-600);
                }

                .message-content {
                    padding: var(--space-3) var(--space-4);
                    border-radius: var(--radius-lg);
                    font-size: var(--text-sm);
                    line-height: 1.6;
                }

                .message-content h1, .message-content h2, .message-content h3 {
                    margin-top: var(--space-3);
                    margin-bottom: var(--space-1);
                    font-weight: 700;
                    font-size: var(--text-base);
                }

                .message-content p {
                    margin-bottom: var(--space-2);
                }

                .message-content p:last-child {
                    margin-bottom: 0;
                }

                .message-content ul, .message-content ol {
                    margin-left: var(--space-4);
                    margin-bottom: var(--space-2);
                }

                .message-content li {
                    margin-bottom: 4px;
                }

                .message-content strong {
                    font-weight: 700;
                    color: inherit;
                }

                .assistant .message-content {
                    background: #f8fafc;
                    color: var(--text-primary);
                    border: 1px solid var(--border-light);
                    border-top-left-radius: 0;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                }

                .user .message-content {
                    background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
                    color: white;
                    border-top-right-radius: 0;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
                }

                .ai-input-area {
                    padding: var(--space-4);
                    border-top: 1px solid var(--border-light);
                    background: var(--bg-primary);
                }

                .input-row {
                    display: flex;
                    gap: var(--space-2);
                    background: var(--bg-tertiary);
                    padding: 8px;
                    border-radius: var(--radius-xl);
                    border: 1px solid var(--border-medium);
                }

                .input-row input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    padding: 0 8px;
                    font-size: var(--text-sm);
                    color: var(--text-primary);
                }

                .input-row input:focus { outline: none; }

                .action-btn, .send-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: var(--radius-lg);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    border: none;
                    cursor: pointer;
                }

                .action-btn {
                    background: transparent;
                    color: var(--text-muted);
                }

                .action-btn:hover {
                    background: var(--bg-secondary);
                    color: var(--color-primary-600);
                }

                .action-btn.recording {
                    background: var(--color-error);
                    color: white;
                    animation: pulse 1.5s infinite;
                }

                .send-btn {
                    background: var(--color-primary-100);
                    color: var(--color-primary-600);
                }

                .send-btn:hover:not(:disabled) {
                    background: var(--color-primary-600);
                    color: white;
                }

                .send-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .typing {
                    display: flex;
                    gap: 4px;
                    padding: 12px 16px;
                }

                .dot {
                    width: 6px;
                    height: 6px;
                    background: var(--text-muted);
                    border-radius: 50%;
                    animation: typing-dot 1.4s infinite;
                }

                .dot:nth-child(2) { animation-delay: 0.2s; }
                .dot:nth-child(3) { animation-delay: 0.4s; }

                @keyframes typing-dot {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }

                .recording-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 10px;
                    color: var(--color-error);
                    font-weight: 600;
                    margin-top: 8px;
                    margin-left: 12px;
                    text-transform: uppercase;
                }

                .pulse-dot {
                    width: 6px;
                    height: 6px;
                    background: var(--color-error);
                    border-radius: 50%;
                    animation: pulse 1s infinite;
                }

                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }

                .btnClose {
                    background: transparent;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: var(--radius-md);
                }

                .btnClose:hover {
                    background: var(--bg-tertiary);
                    color: var(--text-primary);
                }
            `}</style>
            </div>
        </>
    );
}
