import { useState, useRef } from 'react';
import {
    CheckCircle2,
    Circle,
    Clock,
    MoreVertical,
    Trash2,
    Edit3,
    User,
    UserPlus,
    ArrowRight,
    Sparkles,
    MessageSquare,
    ShoppingCart,
    BookOpen,
    Zap,
    ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { useData } from '../context/DataContext';

export default function ActionCard({ item, type, onAction, onEdit, onDelete, onMarkProcessed, onClick, onAssign }) {
    const { getUser, getProject, users, updateTask } = useData();
    const [menuOpen, setMenuOpen] = useState(false);
    const [showAssignMenu, setShowAssignMenu] = useState(false);
    const menuButtonRef = useRef(null);

    // Calculate dropdown position based on button location
    const getDropdownPosition = () => {
        if (!menuButtonRef.current) return { top: 0, right: 0 };
        const rect = menuButtonRef.current.getBoundingClientRect();
        return {
            top: rect.bottom + 4,
            right: window.innerWidth - rect.right
        };
    };

    // Determine visual style based on type
    const isInbox = type === 'inbox';
    const isWaiting = type === 'waiting';
    const isAction = type === 'action';

    // Get related data
    const assignee = item.assigned_to ? getUser(item.assigned_to) : null;
    const project = item.project_id ? getProject(item.project_id) : null;

    // Date formatting
    const dateObj = item.due_date ? new Date(item.due_date) : (item.created_at ? new Date(item.created_at) : null);
    const dateStr = dateObj ? format(dateObj, 'MMM d') : '';
    const isOverdue = dateObj && dateObj < new Date() && item.status !== 'Done';

    const handleMainAction = (e) => {
        e.stopPropagation();
        if (onAction) onAction(item);
    };

    return (
        <div
            className={`action-card ${type}`}
            onClick={() => onClick && onClick(item)}
            style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-3)',
                marginBottom: 'var(--space-3)',
                display: 'flex',
                gap: 'var(--space-3)',
                alignItems: 'flex-start',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                position: 'relative'
            }}
        >
            {/* Left Icon / Checkbox */}
            <div className="action-leading" style={{ marginTop: '2px' }}>
                {isAction && (
                    <button
                        className="btn-icon-ghost"
                        onClick={handleMainAction}
                        style={{ color: item.status === 'Done' ? 'var(--color-success)' : 'var(--text-tertiary)' }}
                    >
                        {item.status === 'Done' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </button>
                )}

                {isWaiting && (
                    <div className="avatar avatar-xs" title={assignee?.name || 'Unassigned'}>
                        {assignee?.avatar || <User size={12} />}
                    </div>
                )}

                {isInbox && (
                    <div style={{
                        color: 'var(--color-primary-500)',
                        background: 'var(--color-primary-50)',
                        padding: '4px',
                        borderRadius: '6px'
                    }}>
                        <Sparkles size={14} />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="action-content" style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '8px'
                }}>
                    <h4 style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--font-medium)',
                        color: item.status === 'Done' ? 'var(--text-tertiary)' : 'var(--text-primary)',
                        textDecoration: item.status === 'Done' ? 'line-through' : 'none',
                        margin: 0,
                        lineHeight: '1.4'
                    }}>
                        {item.name || item.content}
                    </h4>
                </div>

                <div className="action-meta" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '6px',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-tertiary)'
                }}>
                    {item.action_type && item.action_type !== 'todo' && (
                        <span className="meta-tag" style={{
                            background: 'var(--bg-tertiary)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontWeight: 600,
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                        }}>
                            {/* Map Action Types to Icons */}
                            {item.action_type === 'delegate' && <User size={10} />}
                            {item.action_type === 'discuss' && <MessageSquare size={10} />}
                            {item.action_type === 'buy' && <ShoppingCart size={10} />}
                            {item.action_type === 'read' && <BookOpen size={10} />}
                            {item.action_type}
                        </span>
                    )}



                    {dateStr && (
                        <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            color: isOverdue ? 'var(--color-error)' : 'inherit'
                        }}>
                            <Clock size={10} />
                            {dateStr}
                        </span>
                    )}

                    {isWaiting && assignee && (
                        <span>→ {assignee.name.split(' ')[0]}</span>
                    )}
                </div>
            </div>

            {/* Actions Menu */}
            <div className="action-trailing" style={{ position: 'relative' }}>
                <button
                    ref={menuButtonRef}
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        console.log('Menu button clicked! Current menuOpen:', menuOpen, 'Setting to:', !menuOpen);
                        setMenuOpen(!menuOpen);
                    }}
                    style={{ opacity: 0.7 }}
                >
                    <MoreVertical size={14} />
                </button>

                {menuOpen && console.log('Menu is OPEN - rendering dropdown')}
                {menuOpen && (
                    <>
                        <div
                            style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'transparent' }}
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
                        />
                        <div className="dropdown-menu" style={{
                            position: 'fixed',
                            top: getDropdownPosition().top,
                            right: getDropdownPosition().right,
                            zIndex: 9999,
                            minWidth: '180px',
                            background: '#ffffff',
                            border: '1px solid #e4e4e7',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
                            padding: '4px 0'
                        }}>
                            {/* Edit option for action/waiting types */}
                            {(isAction || isWaiting) && onEdit && (
                                <button className="dropdown-item" onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(false);
                                    onEdit(item);
                                }}>
                                    <Edit3 size={14} /> Edit
                                </button>
                            )}

                            {/* Assign To submenu for action/waiting types */}
                            {(isAction || isWaiting) && users && users.length > 0 && (
                                <div className="dropdown-submenu" style={{ position: 'relative' }}>
                                    <button
                                        className="dropdown-item"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowAssignMenu(!showAssignMenu);
                                        }}
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                    >
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <UserPlus size={14} /> Assign To
                                        </span>
                                        <ChevronRight size={12} />
                                    </button>
                                    {showAssignMenu && (
                                        <div className="dropdown-menu submenu" style={{
                                            position: 'absolute',
                                            left: '100%',
                                            top: 0,
                                            marginLeft: '4px',
                                            minWidth: '140px',
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            zIndex: 12
                                        }}>
                                            <button
                                                className="dropdown-item"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMenuOpen(false);
                                                    setShowAssignMenu(false);
                                                    updateTask(item.id, { assigned_to: null });
                                                }}
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                <User size={14} /> Unassigned
                                            </button>
                                            {users.map(user => (
                                                <button
                                                    key={user.id}
                                                    className={`dropdown-item ${item.assigned_to === user.id ? 'active' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMenuOpen(false);
                                                        setShowAssignMenu(false);
                                                        updateTask(item.id, { assigned_to: user.id });
                                                    }}
                                                >
                                                    <div className="avatar avatar-xs" style={{ width: '18px', height: '18px', fontSize: '8px' }}>
                                                        {user.avatar || user.name[0]}
                                                    </div>
                                                    {user.name.split(' ')[0]}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Delete option for action/waiting types */}
                            {(isAction || isWaiting) && onDelete && (
                                <>
                                    <div className="dropdown-divider" style={{ borderTop: '1px solid var(--border-light)', margin: '4px 0' }}></div>
                                    <button className="dropdown-item danger" onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuOpen(false);
                                        onDelete(item);
                                    }}>
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </>
                            )}

                            {/* Original edit/delete for non-recognized types (fallback) */}
                            {!isAction && !isWaiting && !isInbox && onEdit && (
                                <button className="dropdown-item" onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(false);
                                    onEdit(item);
                                }}>
                                    <Edit3 size={14} /> Edit
                                </button>
                            )}
                            {!isAction && !isWaiting && !isInbox && onDelete && (
                                <button className="dropdown-item danger" onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(false);
                                    onDelete(item);
                                }}>
                                    <Trash2 size={14} /> Delete
                                </button>
                            )}
                            {isInbox && (
                                <>
                                    <button className="dropdown-item" onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuOpen(false);
                                        if (onAction) onAction(item); // Process / Edit
                                    }}>
                                        <ArrowRight size={14} /> Process (Manual)
                                    </button>
                                    <button className="dropdown-item" onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuOpen(false);
                                        if (onEdit) onEdit(item, 'auto'); // Use onEdit callback to trigger auto-process
                                    }} style={{ color: 'var(--color-primary-600)' }}>
                                        <Sparkles size={14} /> Smart Process
                                    </button>
                                    <div className="dropdown-divider" style={{ borderTop: '1px solid var(--border-light)', margin: '4px 0' }}></div>
                                    {onEdit && (
                                        <button className="dropdown-item" onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuOpen(false);
                                            onEdit(item);
                                        }}>
                                            <Edit3 size={14} /> Edit note
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button className="dropdown-item danger" onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuOpen(false);
                                            onDelete(item);
                                        }}>
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    )}
                                    <div className="dropdown-divider" style={{ borderTop: '1px solid var(--border-light)', margin: '4px 0' }}></div>
                                    <button className="dropdown-item" onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuOpen(false);
                                        if (onMarkProcessed) onMarkProcessed(item);
                                    }}>
                                        <CheckCircle2 size={14} /> Mark Processed
                                    </button>
                                    <div className="dropdown-divider" style={{ borderTop: '1px solid var(--border-light)', margin: '4px 0' }}></div>
                                    <button className="dropdown-item" onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuOpen(false);
                                        if (onAction) onAction(item, 'action'); // Pass target
                                    }}>
                                        <Zap size={14} /> Move to Do Now
                                    </button>
                                    <button className="dropdown-item" onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuOpen(false);
                                        if (onAction) onAction(item, 'waiting'); // Pass target
                                    }}>
                                        <Clock size={14} /> Move to Waiting
                                    </button>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>

            <style>{`
                .action-card:hover {
                    border-color: var(--color-primary-200);
                    box-shadow: var(--shadow-sm);
                }
                .btn-icon-ghost {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }
                .btn-icon-ghost:hover {
                    opacity: 1;
                }
                .dropdown-item.active {
                    background: var(--color-primary-50);
                    color: var(--color-primary-700);
                    font-weight: var(--font-semibold);
                }
                .dropdown-submenu .dropdown-menu.submenu {
                    background: var(--bg-primary);
                    border: 1px solid var(--border-light);
                    border-radius: var(--radius-md);
                    box-shadow: var(--shadow-lg);
                    padding: 4px 0;
                }
            `}</style>
        </div>
    );
}
