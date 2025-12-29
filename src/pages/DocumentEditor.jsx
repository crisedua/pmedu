import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useData } from '../context/DataContext';
import {
    ArrowLeft,
    Save,
    Bold,
    Italic,
    Strikethrough,
    Code,
    List,
    ListOrdered,
    Quote,
    Undo,
    Redo,
    Heading1,
    Heading2,
    Heading3,
    Minus,
    Trash2,
    Check,
} from 'lucide-react';
import { format } from 'date-fns';

export default function DocumentEditor() {
    const { projectId, docId } = useParams();
    const navigate = useNavigate();
    const { getDocument, getProject, updateDocument, deleteDocument, getUser } = useData();

    const document = getDocument(docId);
    const project = getProject(projectId);
    const [title, setTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Start writing your document...',
            }),
        ],
        content: document?.content || '',
        onUpdate: () => {
            setHasChanges(true);
        },
    });

    useEffect(() => {
        if (document) {
            setTitle(document.title);
            if (editor && document.content !== editor.getHTML()) {
                editor.commands.setContent(document.content);
            }
            // Initialize lastSaved state from document data
            if (!lastSaved) {
                setLastSaved(new Date(document.lastEdited));
            }
        }
    }, [document, editor, lastSaved]);

    const saveDocument = useCallback(async () => {
        if (!editor) return;

        setIsSaving(true);
        const content = editor.getHTML();

        updateDocument(docId, {
            title,
            content,
        });

        setHasChanges(false);
        setLastSaved(new Date());
        setIsSaving(false);
    }, [editor, docId, title, updateDocument, hasChanges]);

    // Autosave every 5 seconds if there are changes
    useEffect(() => {
        const interval = setInterval(() => {
            if (hasChanges) {
                saveDocument();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [hasChanges, saveDocument]);

    // Save on Ctrl+S
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveDocument();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [saveDocument]);

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this document?')) {
            deleteDocument(docId);
            navigate(`/project/${projectId}`);
        }
    };

    if (!document || !project) {
        return (
            <div className="empty-state">
                <h2>Document not found</h2>
                <button className="btn btn-primary" onClick={() => navigate('/')}>
                    Go to Dashboard
                </button>
            </div>
        );
    }

    const author = getUser(document.authorId);

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-6)',
            }}>
                <Link
                    to={`/project/${projectId}`}
                    className="btn btn-ghost btn-sm"
                    style={{ marginLeft: '-0.5rem' }}
                >
                    <ArrowLeft size={16} />
                    Back to {project.name}
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    {lastSaved && (
                        <span style={{
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-1)',
                        }}>
                            <Check size={14} style={{ color: 'var(--color-accent-emerald)' }} />
                            Saved {format(lastSaved, 'h:mm a')}
                        </span>
                    )}
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={saveDocument}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <div className="spinner" style={{ width: '14px', height: '14px' }} />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                {hasChanges ? 'Save' : 'Saved'}
                            </>
                        )}
                    </button>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={handleDelete}
                        style={{ color: 'var(--color-error)' }}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Document Title */}
            <input
                type="text"
                value={title}
                onChange={(e) => {
                    setTitle(e.target.value);
                    setHasChanges(true);
                }}
                placeholder="Document title..."
                style={{
                    width: '100%',
                    fontSize: 'var(--text-3xl)',
                    fontWeight: 'var(--font-bold)',
                    border: 'none',
                    background: 'transparent',
                    marginBottom: 'var(--space-2)',
                    padding: 0,
                    outline: 'none',
                }}
            />

            {/* Document Meta */}
            <div style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-tertiary)',
                marginBottom: 'var(--space-6)',
            }}>
                Created by {author?.name || 'Unknown'} • Last edited {format(new Date(document.lastEdited), 'MMM d, yyyy h:mm a')}
            </div>

            {/* Editor */}
            <div className="editor-container">
                {/* Toolbar */}
                <div className="editor-toolbar">
                    <button
                        className={`editor-toolbar-btn ${editor?.isActive('bold') ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                        title="Bold (Ctrl+B)"
                    >
                        <Bold size={18} />
                    </button>
                    <button
                        className={`editor-toolbar-btn ${editor?.isActive('italic') ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                        title="Italic (Ctrl+I)"
                    >
                        <Italic size={18} />
                    </button>
                    <button
                        className={`editor-toolbar-btn ${editor?.isActive('strike') ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().toggleStrike().run()}
                        title="Strikethrough"
                    >
                        <Strikethrough size={18} />
                    </button>
                    <button
                        className={`editor-toolbar-btn ${editor?.isActive('code') ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().toggleCode().run()}
                        title="Inline Code"
                    >
                        <Code size={18} />
                    </button>

                    <div className="editor-toolbar-divider" />

                    <button
                        className={`editor-toolbar-btn ${editor?.isActive('heading', { level: 1 }) ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                        title="Heading 1"
                    >
                        <Heading1 size={18} />
                    </button>
                    <button
                        className={`editor-toolbar-btn ${editor?.isActive('heading', { level: 2 }) ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                        title="Heading 2"
                    >
                        <Heading2 size={18} />
                    </button>
                    <button
                        className={`editor-toolbar-btn ${editor?.isActive('heading', { level: 3 }) ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                        title="Heading 3"
                    >
                        <Heading3 size={18} />
                    </button>

                    <div className="editor-toolbar-divider" />

                    <button
                        className={`editor-toolbar-btn ${editor?.isActive('bulletList') ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().toggleBulletList().run()}
                        title="Bullet List"
                    >
                        <List size={18} />
                    </button>
                    <button
                        className={`editor-toolbar-btn ${editor?.isActive('orderedList') ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                        title="Numbered List"
                    >
                        <ListOrdered size={18} />
                    </button>
                    <button
                        className={`editor-toolbar-btn ${editor?.isActive('blockquote') ? 'active' : ''}`}
                        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                        title="Quote"
                    >
                        <Quote size={18} />
                    </button>
                    <button
                        className="editor-toolbar-btn"
                        onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                        title="Horizontal Rule"
                    >
                        <Minus size={18} />
                    </button>

                    <div className="editor-toolbar-divider" />

                    <button
                        className="editor-toolbar-btn"
                        onClick={() => editor?.chain().focus().undo().run()}
                        disabled={!editor?.can().undo()}
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo size={18} />
                    </button>
                    <button
                        className="editor-toolbar-btn"
                        onClick={() => editor?.chain().focus().redo().run()}
                        disabled={!editor?.can().redo()}
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="editor-content">
                    <EditorContent editor={editor} />
                </div>
            </div>

            {/* Keyboard Shortcuts Help */}
            <div style={{
                marginTop: 'var(--space-4)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                display: 'flex',
                justifyContent: 'center',
                gap: 'var(--space-6)',
            }}>
                <span><strong>Ctrl+B</strong> Bold</span>
                <span><strong>Ctrl+I</strong> Italic</span>
                <span><strong>Ctrl+S</strong> Save</span>
                <span><strong>Ctrl+Z</strong> Undo</span>
            </div>
        </div>
    );
}
