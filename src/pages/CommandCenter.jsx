import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import {
    Mic,
    Send,
    AlertTriangle,
    Calendar,
    CheckCircle2,
    User,
    ArrowRight,
    Activity,
    Search
} from 'lucide-react';
import { askAccountabilityQuery } from '../services/aiService';
import ReactMarkdown from 'react-markdown';

export default function CommandCenter() {
    const {
        tasks,
        users,
        projects,
        currentUser,
        getOverdueTasks,
        getTasksDueThisWeek,
        getVoiceCreatedTasks
    } = useData();

    const [query, setQuery] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [isQuerying, setIsQuerying] = useState(false);

    // Derived Stats
    const overdueTasks = getOverdueTasks();
    const dueThisWeek = getTasksDueThisWeek();
    const voiceTasks = getVoiceCreatedTasks();
    const pendingTasks = tasks.filter(t => t.status !== 'Done');

    const handleQuery = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsQuerying(true);
        try {
            const context = { projects, tasks, users, currentUser };
            const response = await askAccountabilityQuery(query, context);
            setAiResponse(response);
        } catch (error) {
            console.error('Query error:', error);
            setAiResponse('Sorry, I encountered an error processing your request.');
        } finally {
            setIsQuerying(false);
        }
    };

    return (
        <div className="command-center fade-in">
            {/* Header Section */}
            <div className="cc-header">
                <h1 className="cc-title">Command Center</h1>
                <p className="cc-subtitle">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* Critical Stats Row */}
            <div className="stats-grid">
                <div className="stat-card urgent">
                    <div className="stat-icon-wrapper red">
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <div className="stat-value">{overdueTasks.length}</div>
                        <div className="stat-label">Overdue</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon-wrapper orange">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <div className="stat-value">{dueThisWeek.length}</div>
                        <div className="stat-label">Due This Week</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon-wrapper blue">
                        <Activity size={20} />
                    </div>
                    <div>
                        <div className="stat-value">{pendingTasks.length}</div>
                        <div className="stat-label">Pending Total</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon-wrapper purple">
                        <Mic size={20} />
                    </div>
                    <div>
                        <div className="stat-value">{voiceTasks.length}</div>
                        <div className="stat-label">From Voice</div>
                    </div>
                </div>
            </div>

            {/* Query Section */}
            <div className="query-section">
                <div className="query-box-container">
                    <form onSubmit={handleQuery} className="query-form">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            className="query-input"
                            placeholder="Ask anything: 'What does Miguel owe?', 'What is overdue?'..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="query-send-btn"
                            disabled={isQuerying || !query.trim()}
                        >
                            {isQuerying ? <div className="spinner-sm" /> : <Send size={18} />}
                        </button>
                    </form>
                </div>

                {/* AI Response Area */}
                {aiResponse && (
                    <div className="ai-response-card slide-up">
                        <div className="ai-header">
                            <SparklesIcon />
                            <span>Analysis Result</span>
                        </div>
                        <div className="markdown-content">
                            <ReactMarkdown>{aiResponse}</ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Activity / Context */}
            <div className="section-header mt-8">
                <h2>Needs Attention</h2>
            </div>

            <div className="task-list-compact">
                {overdueTasks.length > 0 ? (
                    overdueTasks.slice(0, 5).map(task => (
                        <div key={task.id} className="task-row">
                            <div className={`status-dot ${task.status === 'Done' ? 'green' : 'red'}`} />
                            <div className="task-info">
                                <div className="task-name">{task.name}</div>
                                <div className="task-meta">
                                    <span className="overdue-tag">
                                        Overdue {new Date(task.due_date).toLocaleDateString()}
                                    </span>
                                    <span>•</span>
                                    <span>
                                        {users.find(u => u.id === task.assigned_to)?.name || 'Unassigned'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state-row">
                        <CheckCircle2 size={20} className="text-success" />
                        <span>No overdue tasks. Great job!</span>
                    </div>
                )}
            </div>

            <style>{`
                .command-center {
                    max-width: 900px;
                    margin: 0 auto;
                    padding-bottom: 4rem;
                }
                
                .cc-header {
                    margin-bottom: 2rem;
                }
                
                .cc-title {
                    font-size: 2rem;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                    color: var(--text-primary);
                }
                
                .cc-subtitle {
                    color: var(--text-tertiary);
                    font-size: 1.1rem;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 3rem;
                }

                .stat-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: var(--radius-xl);
                    box-shadow: var(--shadow-sm);
                    border: 1px solid var(--border-light);
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    transition: transform 0.2s;
                }
                
                .stat-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                }

                .stat-card.urgent {
                    border-color: #fecaca;
                    background: #fef2f2;
                }

                .stat-icon-wrapper {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .stat-icon-wrapper.red { background: #fee2e2; color: #ef4444; }
                .stat-icon-wrapper.orange { background: #ffedd5; color: #f97316; }
                .stat-icon-wrapper.blue { background: #dbeafe; color: #3b82f6; }
                .stat-icon-wrapper.purple { background: #f3e8ff; color: #a855f7; }

                .stat-value {
                    font-size: 1.75rem;
                    font-weight: 800;
                    line-height: 1;
                    margin-bottom: 0.25rem;
                }

                .stat-label {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    font-weight: 500;
                }

                /* Query Box */
                .query-section {
                    margin-bottom: 3rem;
                }
                
                .query-box-container {
                    position: relative;
                }
                
                .query-form {
                    display: flex;
                    align-items: center;
                    background: white;
                    border: 2px solid var(--border-medium);
                    border-radius: var(--radius-full);
                    padding: 0.5rem 0.5rem 0.5rem 1.5rem;
                    transition: all 0.2s;
                    box-shadow: var(--shadow-sm);
                }
                
                .query-form:focus-within {
                    border-color: var(--color-primary-500);
                    box-shadow: 0 0 0 4px var(--color-primary-100);
                }
                
                .search-icon {
                    color: var(--text-tertiary);
                    margin-right: 0.75rem;
                }
                
                .query-input {
                    flex: 1;
                    border: none;
                    background: transparent;
                    font-size: 1.1rem;
                    outline: none;
                    color: var(--text-primary);
                }
                
                .query-send-btn {
                    width: 42px;
                    height: 42px;
                    border-radius: 50%;
                    background: var(--color-primary-600);
                    color: white;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                
                .query-send-btn:hover { background: var(--color-primary-700); }
                .query-send-btn:disabled { background: var(--border-medium); cursor: not-allowed; }

                /* AI Response */
                .ai-response-card {
                    margin-top: 1.5rem;
                    background: white;
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--border-light);
                    padding: 1.5rem;
                    box-shadow: var(--shadow-md);
                    animation: slideUp 0.3s ease;
                }
                
                .ai-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                    padding-bottom: 0.75rem;
                    border-bottom: 1px solid var(--border-light);
                    color: var(--color-primary-600);
                    font-weight: 600;
                    font-size: 0.9rem;
                }

                .markdown-content ul { padding-left: 1.25rem; margin-bottom: 1rem; }
                .markdown-content li { margin-bottom: 0.25rem; }
                .markdown-content p { margin-bottom: 0.75rem; }
                .markdown-content strong { color: var(--text-primary); font-weight: 600; }

                /* Task List Compact */
                .task-list-compact {
                    background: white;
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--border-light);
                    overflow: hidden;
                }
                
                .task-row {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    border-bottom: 1px solid var(--border-light);
                }
                
                .task-row:last-child { border-bottom: none; }
                
                .status-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }
                .status-dot.red { background: var(--color-error); }
                .status-dot.green { background: var(--color-success); }
                
                .task-info { flex: 1; }
                
                .task-name {
                    font-weight: 500;
                    color: var(--text-primary);
                    margin-bottom: 0.25rem;
                }
                
                .task-meta {
                    font-size: 0.85rem;
                    color: var(--text-tertiary);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .overdue-tag {
                    color: var(--color-error);
                    font-weight: 500;
                }
                
                .empty-state-row {
                    padding: 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    color: var(--text-secondary);
                }
                
                .spinner-sm {
                    width: 18px;
                    height: 18px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

const SparklesIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
);
