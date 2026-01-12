import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { X } from 'lucide-react';

export default function EditInboxItemModal({ item, onClose }) {
    const { updateInboxItem } = useData();
    const [content, setContent] = useState(item.content || item.name || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        setLoading(true);
        try {
            await updateInboxItem(item.id, { content: content.trim() });
            onClose();
        } catch (error) {
            console.error('Error updating inbox item:', error);
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Edit Note</h3>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Content</label>
                            <textarea
                                className="form-textarea"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={5}
                                autoFocus
                                required
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!content.trim() || loading}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
