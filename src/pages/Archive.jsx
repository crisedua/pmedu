import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { CheckCircle2, Calendar, ArrowUpCircle } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

export default function Archive() {
    const { tasks, updateTask } = useData();

    // specific filtering for done tasks
    const doneTasks = useMemo(() => {
        return tasks
            .filter(t => t.status === 'Done')
            .sort((a, b) => new Date(b.due_date || b.created_at) - new Date(a.due_date || a.created_at));
    }, [tasks]);

    // Grouping
    const groupedTasks = useMemo(() => {
        const groups = {
            today: [],
            yesterday: [],
            older: []
        };

        doneTasks.forEach(task => {
            const date = new Date(task.due_date || task.created_at);
            if (isToday(date)) groups.today.push(task);
            else if (isYesterday(date)) groups.yesterday.push(task);
            else groups.older.push(task);
        });

        return groups;
    }, [doneTasks]);

    const handleReactivate = (task) => {
        updateTask(task.id, { status: 'To Do' });
    };

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Archive</h1>
                    <p className="page-subtitle">History of completed actions ({doneTasks.length})</p>
                </div>
            </div>

            <div className="archive-list">
                {doneTasks.length === 0 && (
                    <div className="empty-state">
                        <CheckCircle2 size={48} className="text-muted" />
                        <h3>No completed tasks yet</h3>
                        <p>Finish some actions to see them here.</p>
                    </div>
                )}

                {/* Today */}
                {groupedTasks.today.length > 0 && (
                    <div className="archive-section">
                        <h3 className="section-title">Completed Today</h3>
                        {groupedTasks.today.map(task => <ArchiveItem key={task.id} task={task} onRestore={handleReactivate} />)}
                    </div>
                )}

                {/* Yesterday */}
                {groupedTasks.yesterday.length > 0 && (
                    <div className="archive-section">
                        <h3 className="section-title">Yesterday</h3>
                        {groupedTasks.yesterday.map(task => <ArchiveItem key={task.id} task={task} onRestore={handleReactivate} />)}
                    </div>
                )}

                {/* Older */}
                {groupedTasks.older.length > 0 && (
                    <div className="archive-section">
                        <h3 className="section-title">Older</h3>
                        {groupedTasks.older.map(task => <ArchiveItem key={task.id} task={task} onRestore={handleReactivate} />)}
                    </div>
                )}
            </div>

            <style>{`
                .archive-list {
                    max-width: 800px;
                    margin: 0 auto;
                }
                .archive-section {
                    margin-bottom: 2rem;
                }
                .section-title {
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    color: var(--text-tertiary);
                    letter-spacing: 1px;
                    margin-bottom: 1rem;
                    font-weight: 600;
                }
                .archive-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    background: white;
                    padding: 1rem;
                    border-bottom: 1px solid var(--border-light);
                    transition: background 0.2s;
                }
                .archive-item:first-child { border-top-left-radius: var(--radius-lg); border-top-right-radius: var(--radius-lg); }
                .archive-item:last-child { border-bottom: none; border-bottom-left-radius: var(--radius-lg); border-bottom-right-radius: var(--radius-lg); }
                
                .archive-item:hover {
                    background: var(--bg-primary);
                }
                
                .item-content { flex: 1; }
                .item-title {
                    font-weight: 500;
                    color: var(--text-secondary);
                    text-decoration: line-through;
                    margin-bottom: 4px;
                }
                .item-meta {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    display: flex;
                    gap: 1rem;
                }

                .restore-btn {
                    color: var(--text-tertiary);
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 50%;
                    transition: all 0.2s;
                }
                .restore-btn:hover {
                    background: var(--bg-tertiary);
                    color: var(--color-primary);
                }
            `}</style>
        </div>
    );
}

function ArchiveItem({ task, onRestore }) {
    return (
        <div className="archive-item">
            <div className="text-success">
                <CheckCircle2 size={20} />
            </div>
            <div className="item-content">
                <div className="item-title">{task.name}</div>
                <div className="item-meta">
                    <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {format(new Date(task.due_date || task.created_at), 'MMM d, yyyy')}
                    </span>
                    {task.project_id && <span>Context: {task.project_id}</span>}
                    {/* Note: We'd need to fetch project name from ID, simplified for now */}
                </div>
            </div>
            <button
                className="restore-btn"
                onClick={() => onRestore(task)}
                title="Restore to active"
            >
                <ArrowUpCircle size={20} />
            </button>
        </div>
    );
}
