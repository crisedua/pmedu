import { useState, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { X, Send, Sparkles, Bot, User as UserIcon, Check, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { guidedProjectSetup, parseProjectSummary } from '../../services/aiService';

export default function ProjectSetupWizard({ onClose, onCreated }) {
    const { createProject, createMultipleTasks, currentUser } = useData();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [conversationHistory, setConversationHistory] = useState([]);
    const [projectData, setProjectData] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Start the conversation on mount
    useEffect(() => {
        startConversation();
    }, []);

    const startConversation = async () => {
        setIsTyping(true);
        try {
            const response = await guidedProjectSetup("Hello, I want to create a new project.", [], 'intro');
            setMessages([{ role: 'assistant', content: response }]);
            setConversationHistory([
                { role: 'user', content: "Hello, I want to create a new project." },
                { role: 'assistant', content: response }
            ]);
        } catch (err) {
            setMessages([{ role: 'assistant', content: `⚠️ Error: ${err.message}` }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isTyping) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsTyping(true);

        const newHistory = [...conversationHistory, { role: 'user', content: userMessage }];

        try {
            const response = await guidedProjectSetup(userMessage, conversationHistory);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
            setConversationHistory([...newHistory, { role: 'assistant', content: response }]);

            // Check if this is the summary response
            const parsed = parseProjectSummary(response);
            if (parsed) {
                setProjectData(parsed);
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${err.message}` }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleCreateProject = async () => {
        if (!projectData) return;

        setIsCreating(true);
        try {
            // Create the project
            const project = await createProject({
                name: projectData.projectName,
                description: projectData.description || projectData.problemStatement,
                status: 'Planning',
            });

            // Create suggested tasks if available
            if (projectData.suggestedTasks && projectData.suggestedTasks.length > 0) {
                const tasksToCreate = projectData.suggestedTasks.map((task, index) => ({
                    name: task.name,
                    description: task.description,
                    project_id: project.id,
                    status: 'To Do',
                    due_date: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(), // Spread over weeks
                    assigned_to: currentUser.id,
                    created_by_ai: true,
                }));
                await createMultipleTasks(tasksToCreate);
            }

            onCreated(project);
        } catch (error) {
            console.error('Error creating project:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error creating project: ${error.message}` }]);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal wizard-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: 'var(--radius-md)',
                            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                        }}>
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="modal-title" style={{ marginBottom: '2px' }}>AI Project Setup</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                                Guided by PMBOK & Agile best practices
                            </p>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="wizard-messages">
                    {messages.map((m, i) => (
                        <div key={i} className={`wizard-message ${m.role}`}>
                            <div className="wizard-avatar">
                                {m.role === 'assistant' ? <Bot size={14} /> : <UserIcon size={14} />}
                            </div>
                            <div className="wizard-content">
                                <ReactMarkdown>{m.content}</ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="wizard-message assistant">
                            <div className="wizard-avatar">
                                <Bot size={14} />
                            </div>
                            <div className="wizard-content typing">
                                <div className="dot"></div>
                                <div className="dot"></div>
                                <div className="dot"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="wizard-input-area">
                    {projectData ? (
                        <div className="wizard-actions">
                            <button className="btn btn-secondary" onClick={() => setProjectData(null)}>
                                Continue Editing
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleCreateProject}
                                disabled={isCreating}
                            >
                                {isCreating ? 'Creating...' : (
                                    <>
                                        <Check size={18} />
                                        Create Project
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="wizard-input-row">
                            <input
                                type="text"
                                placeholder="Type your response..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                disabled={isTyping}
                            />
                            <button
                                className="wizard-send-btn"
                                onClick={handleSendMessage}
                                disabled={!input.trim() || isTyping}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    )}
                </div>

                <style>{`
                    .wizard-modal {
                        width: 600px;
                        max-width: 95vw;
                        height: 80vh;
                        max-height: 700px;
                        display: flex;
                        flex-direction: column;
                    }

                    .wizard-messages {
                        flex: 1;
                        overflow-y: auto;
                        padding: var(--space-4);
                        display: flex;
                        flex-direction: column;
                        gap: var(--space-4);
                        background: var(--bg-secondary);
                    }

                    .wizard-message {
                        display: flex;
                        gap: var(--space-3);
                        max-width: 90%;
                    }

                    .wizard-message.assistant {
                        align-self: flex-start;
                    }

                    .wizard-message.user {
                        align-self: flex-end;
                        flex-direction: row-reverse;
                    }

                    .wizard-avatar {
                        width: 28px;
                        height: 28px;
                        border-radius: 50%;
                        background: var(--bg-tertiary);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: var(--text-secondary);
                        flex-shrink: 0;
                    }

                    .assistant .wizard-avatar {
                        background: var(--color-primary-100);
                        color: var(--color-primary-600);
                    }

                    .wizard-content {
                        padding: var(--space-3) var(--space-4);
                        border-radius: var(--radius-lg);
                        font-size: var(--text-sm);
                        line-height: 1.6;
                    }

                    .wizard-content p { margin-bottom: var(--space-2); }
                    .wizard-content p:last-child { margin-bottom: 0; }
                    .wizard-content ul, .wizard-content ol { margin-left: var(--space-4); margin-bottom: var(--space-2); }
                    .wizard-content li { margin-bottom: 4px; }
                    .wizard-content strong { font-weight: 600; }
                    .wizard-content pre { background: var(--bg-tertiary); padding: var(--space-3); border-radius: var(--radius-md); overflow-x: auto; font-size: 12px; }

                    .assistant .wizard-content {
                        background: var(--bg-primary);
                        border: 1px solid var(--border-light);
                        border-top-left-radius: 0;
                    }

                    .user .wizard-content {
                        background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
                        color: white;
                        border-top-right-radius: 0;
                    }

                    .wizard-input-area {
                        padding: var(--space-4);
                        border-top: 1px solid var(--border-light);
                        background: var(--bg-primary);
                    }

                    .wizard-input-row {
                        display: flex;
                        gap: var(--space-2);
                        background: var(--bg-tertiary);
                        padding: 8px;
                        border-radius: var(--radius-xl);
                        border: 1px solid var(--border-medium);
                    }

                    .wizard-input-row input {
                        flex: 1;
                        background: transparent;
                        border: none;
                        padding: 0 8px;
                        font-size: var(--text-sm);
                        color: var(--text-primary);
                    }

                    .wizard-input-row input:focus { outline: none; }

                    .wizard-send-btn {
                        width: 36px;
                        height: 36px;
                        border-radius: var(--radius-lg);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: var(--color-primary-100);
                        color: var(--color-primary-600);
                        border: none;
                        cursor: pointer;
                        transition: all 0.2s;
                    }

                    .wizard-send-btn:hover:not(:disabled) {
                        background: var(--color-primary-600);
                        color: white;
                    }

                    .wizard-send-btn:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }

                    .wizard-actions {
                        display: flex;
                        gap: var(--space-3);
                        justify-content: flex-end;
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
                `}</style>
            </div>
        </div>
    );
}
