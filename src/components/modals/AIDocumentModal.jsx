import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { X, Sparkles, Brain, FileText } from 'lucide-react';
import { generateDocumentWithAI } from '../../services/aiService';

const DOCUMENT_TYPES = [
    { id: 'brief', label: 'Project Brief', description: 'Overview, goals, scope, and timeline' },
    { id: 'proposal', label: 'Proposal', description: 'Client proposal with solution and pricing' },
    { id: 'technical', label: 'Technical Spec', description: 'Architecture and technical details' },
    { id: 'plan', label: 'Strategic Plan', description: 'Roadmap and milestones' },
    { id: 'meeting', label: 'Meeting Notes', description: 'Agenda and action items template' },
    { id: 'custom', label: 'Custom', description: 'Describe what you need' },
];

export default function AIDocumentModal({ projectId, onClose, onCreated }) {
    const { createDocument } = useData();
    const [title, setTitle] = useState('');
    const [selectedType, setSelectedType] = useState(null);
    const [customPrompt, setCustomPrompt] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!title.trim()) return;
        if (!selectedType) return;

        const prompt = selectedType === 'custom' ? customPrompt : selectedType;

        setLoading(true);
        try {
            const content = await generateDocumentWithAI(title.trim(), prompt);

            const doc = createDocument({
                title: title.trim(),
                content,
                projectId,
            });

            onCreated(doc);
        } catch (error) {
            console.error('Error generating document:', error);
            alert('Failed to generate document. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header" style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-md)',
                            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                        }}>
                            <Brain size={18} />
                        </div>
                        <h3 className="modal-title">Create Document with AI</h3>
                    </div>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Document Title *</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter document title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Document Type *</label>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: 'var(--space-3)',
                        }}>
                            {DOCUMENT_TYPES.map(type => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setSelectedType(type.id)}
                                    style={{
                                        padding: 'var(--space-4)',
                                        background: selectedType === type.id
                                            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
                                            : 'var(--bg-secondary)',
                                        border: selectedType === type.id
                                            ? '2px solid var(--color-primary-500)'
                                            : '1px solid var(--border-light)',
                                        borderRadius: 'var(--radius-lg)',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        transition: 'all var(--transition-fast)',
                                    }}
                                >
                                    <div style={{
                                        fontWeight: 'var(--font-medium)',
                                        marginBottom: 'var(--space-1)',
                                        color: selectedType === type.id ? 'var(--color-primary-600)' : 'var(--text-primary)',
                                    }}>
                                        {type.label}
                                    </div>
                                    <div style={{
                                        fontSize: 'var(--text-xs)',
                                        color: 'var(--text-tertiary)',
                                    }}>
                                        {type.description}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedType === 'custom' && (
                        <div className="form-group">
                            <label className="form-label">Describe your document</label>
                            <textarea
                                className="form-textarea"
                                placeholder="Example: A client onboarding guide that explains our process, expectations, and key milestones..."
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                rows={3}
                            />
                        </div>
                    )}

                    <div style={{
                        padding: 'var(--space-3)',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-tertiary)',
                    }}>
                        ✨ AI will generate a structured document that you can edit immediately.
                        All content is fully editable in the rich text editor.
                    </div>
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-ai"
                        onClick={handleGenerate}
                        disabled={!title.trim() || !selectedType || (selectedType === 'custom' && !customPrompt.trim()) || loading}
                    >
                        <span>
                            {loading ? (
                                <>
                                    <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    Generate Document
                                </>
                            )}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
