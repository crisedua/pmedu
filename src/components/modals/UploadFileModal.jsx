import { useState, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { X, Upload, File, Trash2 } from 'lucide-react';

export default function UploadFileModal({ projectId, onClose }) {
    const { uploadFile } = useData();
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef(null);

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        addFiles(selectedFiles);
    };

    const addFiles = (newFiles) => {
        const fileObjects = newFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            name: file.name,
            size: file.size,
            type: file.type,
        }));
        setFiles(prev => [...prev, ...fileObjects]);
    };

    const removeFile = (id) => {
        setFiles(files.filter(f => f.id !== id));
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        addFiles(droppedFiles);
    };

    const handleUpload = () => {
        if (files.length === 0) return;

        setLoading(true);

        // Simulate file upload - in production this would upload to storage
        files.forEach(fileObj => {
            uploadFile({
                name: fileObj.name,
                type: fileObj.type,
                size: fileObj.size,
                projectId,
            });
        });

        onClose();
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Upload Files</h3>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Drop Zone */}
                    <div
                        className={`drop-zone ${dragOver ? 'dragover' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="drop-zone-icon">
                            <Upload size={32} />
                        </div>
                        <p className="drop-zone-text">
                            <strong>Click to upload</strong> or drag and drop files here
                        </p>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
                            Supports all file types
                        </p>
                    </div>

                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />

                    {/* File List */}
                    {files.length > 0 && (
                        <div style={{ marginTop: 'var(--space-4)' }}>
                            <h4 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                                Files to upload ({files.length})
                            </h4>
                            <div className="file-list">
                                {files.map(fileObj => (
                                    <div key={fileObj.id} className="file-item">
                                        <div className="file-icon">
                                            <File size={18} />
                                        </div>
                                        <div className="file-info">
                                            <div className="file-name">{fileObj.name}</div>
                                            <div className="file-meta">{formatFileSize(fileObj.size)}</div>
                                        </div>
                                        <button
                                            className="btn btn-ghost btn-icon btn-sm"
                                            onClick={() => removeFile(fileObj.id)}
                                            style={{ color: 'var(--color-error)' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleUpload}
                        disabled={files.length === 0 || loading}
                    >
                        {loading ? (
                            <>
                                <div className="spinner" style={{ width: '16px', height: '16px' }} />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload size={18} />
                                Upload {files.length > 0 ? `${files.length} File${files.length > 1 ? 's' : ''}` : 'Files'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
