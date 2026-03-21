import React from 'react';

const DocumentViewer = ({ fileText, isUploading, onUpload }) => {
  return (
    <div style={{ flex: 2, display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--surface-border)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ color: 'var(--text-primary)' }}>Document Viewer</h4>
        {!fileText && (
          <label className="btn btn-primary" style={{ cursor: isUploading ? 'not-allowed' : 'pointer' }}>
            {isUploading ? 'Uploading...' : 'Upload Contract (.pdf, .docx)'}
            <input 
              type="file" 
              accept=".pdf,.docx,.doc,.txt" 
              style={{ display: 'none' }} 
              onChange={onUpload}
              disabled={isUploading}
            />
          </label>
        )}
      </div>
      
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
        {isUploading ? (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
             <p className="animate-fade-in" style={{ color: 'var(--primary-color)' }}>Analyzing document chunks...</p>
          </div>
        ) : fileText ? (
          <div className="animate-fade-in">{fileText}</div>
        ) : (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <p>Select a contract to review its contents.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;
