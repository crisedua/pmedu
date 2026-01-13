import { useState, useRef, useEffect } from 'react';
import {
    CheckCircle2,
    Circle,
    Clock,
    MoreVertical,
    Trash2,
    Edit3,
    User,
    ArrowRight,
    Sparkles,
    Zap,
    Archive
} from 'lucide-react';
import { format } from 'date-fns';

export default function DemoActionCard({
    item,
    type,
    onAction,
    onEdit,
    onDelete,
    onMarkProcessed,
    onClick,
    users = [],
    getUser = () => null
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const menuButtonRef = useRef(null);
    const menuRef = useRef(null);

    const isInbox = type === 'inbox';
    const isWaiting = type === 'waiting';
    const isAction = type === 'action';

    const assignee = item.assigned_to ? getUser(item.assigned_to) : null;
    const dateObj = item.due_date ? new Date(item.due_date) : (item.created_at ? new Date(item.created_at) : null);
    const dateStr = dateObj ? format(dateObj, 'MMM d') : '';

    // Handle click outside to close menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target) &&
                menuButtonRef.current && !menuButtonRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };

        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    // Calculate menu position
    useEffect(() => {
        if (menuOpen && menuButtonRef.current) {
            const rect = menuButtonRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + 4,
                left: rect.right - 180 // Align right edge of menu with button
            });
        }
    }, [menuOpen]);

    const handleMenuToggle = (e) => {
        e.stopPropagation();
        setMenuOpen(!menuOpen);
    };

    const handleMainAction = (e) => {
        e.stopPropagation();
        if (onAction) onAction(item);
    };

    const menuAction = (callback, ...args) => (e) => {
        e.stopPropagation();
        setMenuOpen(false);
        if (callback) callback(...args);
    };

    return (
        <div
            className="demo-action-card"
            onClick={() => onClick && onClick(item)}
            style={{
                background: '#ffffff',
                border: '1px solid #e4e4e7',
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '12px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                position: 'relative'
            }}
        >
            {/* Left Icon */}
            <div style={{ flexShrink: 0, marginTop: '2px' }}>
                {isAction && (
                    <button
                        onClick={handleMainAction}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            color: item.status === 'Done' ? '#10b981' : '#a1a1aa'
                        }}
                    >
                        {item.status === 'Done' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </button>
                )}
                {isWaiting && (
                    <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 'bold'
                    }}>
                        {assignee?.avatar || <User size={12} />}
                    </div>
                )}
                {isInbox && (
                    <div style={{
                        color: '#6366f1',
                        background: '#eef2ff',
                        padding: '4px',
                        borderRadius: '6px'
                    }}>
                        <Sparkles size={14} />
                    </div>
                )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: item.status === 'Done' ? '#a1a1aa' : '#18181b',
                    textDecoration: item.status === 'Done' ? 'line-through' : 'none',
                    margin: 0,
                    lineHeight: 1.4
                }}>
                    {item.name || item.content}
                </h4>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '6px',
                    fontSize: '12px',
                    color: '#71717a'
                }}>
                    {dateStr && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
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
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {isInbox && (
                    <>
                        <button
                            className="demo-action-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onEdit) onEdit(item);
                            }}
                            title="Edit"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                opacity: 0.5,
                                color: '#71717a'
                            }}
                        >
                            <Edit3 size={14} />
                        </button>
                        <button
                            className="demo-action-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onDelete) onDelete(item);
                            }}
                            title="Delete"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                opacity: 0.5,
                                color: '#ef4444'
                            }}
                        >
                            <Trash2 size={14} />
                        </button>
                    </>
                )}
                <button
                    ref={menuButtonRef}
                    onClick={handleMenuToggle}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: '#71717a',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <MoreVertical size={16} />
                </button>
            </div>

            {/* Dropdown Menu - Fixed Position */}
            {menuOpen && (
                <div
                    ref={menuRef}
                    style={{
                        position: 'fixed',
                        top: menuPosition.top,
                        left: menuPosition.left,
                        zIndex: 10000,
                        minWidth: '180px',
                        background: '#ffffff',
                        border: '1px solid #e4e4e7',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.2)',
                        padding: '4px 0'
                    }}
                >
                    {/* Action/Waiting type menu items */}
                    {(isAction || isWaiting) && (
                        <>
                            <MenuItem icon={<Edit3 size={14} />} onClick={menuAction(onEdit, item)}>
                                Edit
                            </MenuItem>
                            <MenuDivider />
                            <MenuItem icon={<Trash2 size={14} />} danger onClick={menuAction(onDelete, item)}>
                                Delete
                            </MenuItem>
                        </>
                    )}

                    {/* Inbox type menu items */}
                    {isInbox && (
                        <>
                            <MenuItem icon={<ArrowRight size={14} />} onClick={menuAction(onAction, item)}>
                                Process (Manual)
                            </MenuItem>
                            <MenuItem icon={<Sparkles size={14} />} highlight onClick={menuAction(onEdit, item, 'auto')}>
                                Smart Process
                            </MenuItem>
                            <MenuDivider />
                            <MenuItem icon={<Edit3 size={14} />} onClick={menuAction(onEdit, item)}>
                                Edit note
                            </MenuItem>
                            <MenuItem icon={<Trash2 size={14} />} danger onClick={menuAction(onDelete, item)}>
                                Delete
                            </MenuItem>
                            <MenuDivider />
                            <MenuItem icon={<Archive size={14} />} onClick={menuAction(onMarkProcessed, item)}>
                                Archive
                            </MenuItem>
                            <MenuDivider />
                            <MenuItem icon={<Zap size={14} />} onClick={menuAction(onAction, item, 'action')}>
                                Move to Do Now
                            </MenuItem>
                            <MenuItem icon={<Clock size={14} />} onClick={menuAction(onAction, item, 'waiting')}>
                                Move to Waiting
                            </MenuItem>
                        </>
                    )}
                </div>
            )}

            <style>{`
                .demo-action-card:hover {
                    border-color: #c7d2fe;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                }
                .demo-action-btn {
                    opacity: 0 !important;
                    transition: opacity 0.2s ease;
                    pointer-events: none;
                }
                .demo-action-card:hover .demo-action-btn {
                    opacity: 0.5 !important;
                    pointer-events: auto;
                }
                .demo-action-card:hover .demo-action-btn:hover {
                    opacity: 1 !important;
                    background-color: #f4f4f5;
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
}

// Menu Item Component
function MenuItem({ icon, children, onClick, danger, highlight }) {
    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                color: danger ? '#ef4444' : highlight ? '#6366f1' : '#18181b',
                fontWeight: highlight ? 600 : 400,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => e.target.style.background = danger ? 'rgba(239, 68, 68, 0.1)' : '#f4f4f5'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
            {icon}
            {children}
        </button>
    );
}

// Menu Divider Component
function MenuDivider() {
    return <div style={{ borderTop: '1px solid #e4e4e7', margin: '4px 0' }} />;
}
