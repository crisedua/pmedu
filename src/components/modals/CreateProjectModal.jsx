import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { X, Sparkles } from 'lucide-react';
import ProjectSetupWizard from './ProjectSetupWizard';

export default function CreateProjectModal({ onClose, onCreated }) {
    const { createProject } = useData();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('Planning');
    const [loading, setLoading] = useState(false);
    const [showWizard, setShowWizard] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            const project = await createProject({
                name: name.trim(),
                description: description.trim(),
                status,
            });

            onCreated(project);
        } catch (error) {
            console.error('Error creating project:', error);
            setLoading(false);
        }
    };

    // If wizard is open, show it instead
    if (showWizard) {
        return <ProjectSetupWizard onClose={onClose} onCreated={onCreated} />;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Create New Project</h3>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* AI Guided Setup Option */}
                <div style={{
                    padding: 'var(--space-4)',
                    borderBottom: '1px solid var(--border-light)',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                }}>
                    <button
                        className="btn"
                        onClick={() => setShowWizard(true)}
                        style={{
                            width: '100%',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                            color: 'white',
                            border: 'none',
                            gap: '8px',
                        }}
                    >
                        <Sparkles size={18} />
                        Guided Setup with AI
                    </button>
                    <p style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        textAlign: 'center',
                        marginTop: '8px',
                        marginBottom: 0,
                    }}>
                        Let AI guide you through project setup using PMBOK & Agile best practices
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
                            Or quickly create a project manually:
                        </p>
                        <div className="form-group">
                            <label className="form-label">Project Name *</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter project name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-textarea"
                                placeholder="Describe your project..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Initial Status</label>
                            <select
                                className="form-select"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="Planning">Planning</option>
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!name.trim() || loading}
                        >
                            {loading ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

