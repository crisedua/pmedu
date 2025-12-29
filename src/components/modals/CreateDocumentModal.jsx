import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { X } from 'lucide-react';

export default function CreateDocumentModal({ projectId, onClose, onCreated }) {
    const { createDocument } = useData();
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        setLoading(true);
        try {
            const doc = await createDocument({
                title: title.trim(),
                content: '',
                projectId,
            });

            onCreated(doc);
        } catch (error) {
            console.error('Error creating document:', error);
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Create New Document</h3>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
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
                                required
                            />
                        </div>

                        <div style={{
                            padding: 'var(--space-3)',
                            background: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--text-sm)',
                            color: 'var(--text-secondary)',
                        }}>
                            💡 You'll be able to write and format your document content in the editor.
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!title.trim() || loading}
                        >
                            {loading ? 'Creating...' : 'Create Document'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
