import { useState, useEffect, useRef } from 'react'
import IssueSidebar from './components/IssueSidebar'
import DocumentViewer from './components/DocumentViewer'
import ChatInterface from './components/ChatInterface'
import './index.css'

const getApiBase = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    if (window.location.port === '5173') return 'http://localhost:8000';
  }
  return '';
};
const getWsBase = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    if (window.location.port === '5173') return 'ws://localhost:8000';
  }
  return window.location.protocol === 'https:' ? `wss://${window.location.host}` : `ws://${window.location.host}`;
};

const API_BASE = getApiBase();
const WS_BASE = getWsBase();

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [fileText, setFileText] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [activeContractId, setActiveContractId] = useState(null)
  const [issues, setIssues] = useState([])
  const [financials, setFinancials] = useState([])
  const [progress, setProgress] = useState({ completed: 0, total: 0 })
  const [history, setHistory] = useState([])
  
  // Security State
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('cd_auth_token'))
  const [passcode, setPasscode] = useState('')
  const [authError, setAuthError] = useState('')
  
  // Fetch History side-effect
  useEffect(() => {
    if (activeTab === 'history') {
      fetch('http://localhost:8000/api/v1/contracts/history')
        .then(res => res.json())
        .then(data => setHistory(data))
        .catch(err => console.error("Failed to fetch history", err));
    }
  }, [activeTab]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/contracts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };
  
  // WebSocket Connection
  useEffect(() => {
    if (!activeContractId) return;

    const ws = new WebSocket(`ws://localhost:8000/api/v1/ws/${activeContractId}`);
    
    ws.onopen = () => console.log(`WebSocket Connected for contract ${activeContractId}`);
    ws.onerror = (error) => console.error("WebSocket Error: ", error);
    ws.onclose = () => console.log("WebSocket Disconnected");

    ws.onmessage = (event) => {
      console.log("WebSocket Message Received:", event.data);
      const message = JSON.parse(event.data);
      if (message.type === 'new_issue') {
        setIssues(prev => [...prev, message.data]);
      } else if (message.type === 'progress') {
        setProgress(message.data);
      }
    };

    return () => {
      ws.close();
    };
  }, [activeContractId]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setFileText(null);
    setIssues([]);
    setFinancials([]);
    setProgress({ completed: 0, total: 0 });
    setActiveContractId(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/api/v1/contracts/upload/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setFileText(data.parsed_text);
      setActiveContractId(data.contract_id);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload document. See console for details.");
    } finally {
      setIsUploading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', backgroundImage: 'var(--bg-mesh)' }}>
        <div className="glass-panel animate-fade-in" style={{ padding: '40px', maxWidth: '420px', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', textAlign: 'center' }}>
          <img src="/logo.png" alt="CD Specialty Contractors" style={{ maxWidth: '200px', marginBottom: '16px' }} />
          <div>
            <h2 style={{ color: 'var(--primary-hover)', margin: 0, marginBottom: '8px' }}>Scaffold AI Engine</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>Enter the master passcode to access the secure commercial dashboard.</p>
          </div>
          
          <form style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={async (e) => {
            e.preventDefault();
            setAuthError('');
            try {
              const res = await fetch('http://localhost:8000/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passcode })
              });
              if (res.ok) {
                const data = await res.json();
                localStorage.setItem('cd_auth_token', data.token);
                setIsAuthenticated(true);
              } else {
                setAuthError("Incorrect passcode. Please try again.");
              }
            } catch (err) {
              setAuthError("Connection error. Is the backend running?");
            }
          }}>
            <input 
              type="password" 
              placeholder="Enter Passcode..." 
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'rgba(255,255,255,0.85)', fontSize: '1rem', outline: 'none' }}
              autoFocus
            />
            {authError && <div style={{ color: 'var(--danger-color)', fontSize: '0.85rem', fontWeight: 'bold' }}>{authError}</div>}
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 'bold', marginTop: '8px' }}>
              Secure Login
            </button>
          </form>
          
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
             🔒 End-to-End Encrypted Sandbox
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '16px' }}>
          {/* Physical Application Logo */}
          <img src="/logo.png" alt="CD Specialty Contractors" style={{ maxWidth: '100%', maxHeight: '65px', objectFit: 'contain' }} />
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            style={{ justifyContent: 'flex-start' }}
          >
            Dashboard
          </button>
          <button 
            className={`btn ${activeTab === 'review' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('review')}
            style={{ justifyContent: 'flex-start' }}
          >
            Active Review
          </button>
          <button 
            className={`btn ${activeTab === 'history' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('history')}
            style={{ justifyContent: 'flex-start' }}
          >
            Contract History
          </button>
        </nav>

        <div style={{ marginTop: 'auto', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <p>System Status: Online</p>
          <p>API: Connected</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>
            {activeTab === 'dashboard' && 'Dashboard Overview'}
            {activeTab === 'review' && 'Contract Review Workspace'}
            {activeTab === 'history' && 'Past Contracts'}
          </h2>
        </header>

        {/* Dynamic Workspace Container */}
        <div className="glass-panel animate-fade-in" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {activeTab === 'dashboard' && (
            <div style={{ textAlign: 'center', marginTop: '10%' }}>
              <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Welcome to Scaffold AI</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
                Upload a general contractor agreement to automatically analyze it against your core scaffolding principles. We'll identify risks, suggest redlines, and extract all financials.
              </p>
              <br/>
              <button className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '1rem' }} onClick={() => setActiveTab('review')}>
                Start a New Review
              </button>
            </div>
          )}
          
          {activeTab === 'review' && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {!activeContractId && !isUploading ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--surface-border)', borderRadius: '12px', background: 'rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📄</div>
                  <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Upload General Contractor Agreement</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Select a PDF or DOCX file to begin AI risk analysis.</p>
                  <label className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '1rem', cursor: 'pointer' }}>
                    Browse Files
                    <input type="file" accept=".pdf,.docx,.doc,.txt" style={{ display: 'none' }} onChange={handleUpload} />
                  </label>
                </div>
              ) : isUploading && !activeContractId ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="animate-fade-in" style={{ padding: '40px', background: 'var(--surface-color)', borderRadius: '50%', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', marginBottom: '24px', border: '4px solid var(--primary-color)', borderTopColor: 'transparent', animation: 'spin 1.5s linear infinite' }}></div>
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Processing Contract...</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Extracting text, chunking, and streaming risks.</p>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--surface-border)' }}>
                    <div>
                      <h3 style={{ color: 'var(--text-primary)' }}>Risk Analysis Report</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Real-time streaming LLM results</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        className="btn" 
                        onClick={async () => {
                          try {
                            const res = await fetch(`http://localhost:8000/api/v1/contracts/${activeContractId}/export_summary`);
                            if (!res.ok) throw new Error("Export failed");
                            const blob = await res.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `CheatSheet_${activeContractId}.docx`; 
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            window.URL.revokeObjectURL(url);
                          } catch (e) {
                            alert("Summary export failed: " + e.message);
                          }
                        }}
                      >
                        📄 Download Cheat Sheet
                      </button>
                      <button 
                        className="btn btn-primary" 
                        onClick={async () => {
                          try {
                            const res = await fetch(`http://localhost:8000/api/v1/contracts/${activeContractId}/export`);
                            if (!res.ok) throw new Error("Export failed");
                            const blob = await res.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `AI_Reviewed_Contract_${activeContractId}.docx`; 
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            window.URL.revokeObjectURL(url);
                          } catch (e) {
                            alert("Export failed: " + e.message);
                          }
                        }}
                      >
                        ⬇️ Download Redlines Doc
                      </button>
                    </div>
                  </div>
                  
                  {/* PROGRESS BAR */}
                  {progress.total > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <span>Analyzing Contract Sections...</span>
                        <span>{progress.completed} / {progress.total} Complete</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--surface-color)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
                        <div style={{ 
                          height: '100%', 
                          backgroundColor: 'var(--primary-color)', 
                          width: `${Math.round((progress.completed / progress.total) * 100)}%`,
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                    </div>
                  )}

                  <IssueSidebar issues={issues} financials={financials} />
                  <ChatInterface contractId={null} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="library-container animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', height: '100%', overflow: 'hidden' }}>
              
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(255,255,255,0.6)' }}>
                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-hover)', fontSize: '1.1rem' }}>
                  📁 Raw Contracts
                </h3>
                <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                   {history.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No contracts explicitly stored yet.</p>}
                   {history.map(c => (
                     <div key={c.id} className="animate-fade-in" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                       <div className="btn" style={{ flex: 1, justifyContent: 'flex-start', padding: '12px 16px', fontWeight: '500', color: 'var(--text-primary)', border: '1px solid rgba(0,0,0,0.05)', background: 'rgba(255,255,255,0.8)' }}>
                         📄 {c.filename}
                       </div>
                       <button 
                          className="btn" 
                          style={{ padding: '12px', background: 'rgba(225, 29, 72, 0.05)', color: 'var(--danger-color)', border: '1px solid rgba(225, 29, 72, 0.2)' }} 
                          onClick={() => handleDelete(c.id, c.filename)} 
                          title="Delete Contract"
                       >
                         🗑️
                       </button>
                     </div>
                   ))}
                </div>
              </div>
              
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(255,255,255,0.6)' }}>
                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-color)', fontSize: '1.1rem' }}>
                  ✨ AI Reviewed Summaries
                </h3>
                <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                   {history.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Pending document uploads.</p>}
                   {history.map(c => (
                     <div key={c.id} className="animate-fade-in" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                       <a href={`http://localhost:8000/api/v1/contracts/${c.id}/export`} target="_blank" rel="noopener noreferrer" className="btn" style={{ flex: 1, textDecoration: 'none', justifyContent: 'flex-start', padding: '12px 16px', fontWeight: '500', color: 'var(--primary-color)', border: '1px solid rgba(0,0,0,0.05)', background: 'rgba(255,255,255,0.8)' }}>
                         📝 AI_Reviewed_{c.filename}.docx
                       </a>
                       <button 
                          className="btn" 
                          style={{ padding: '12px', background: 'rgba(225, 29, 72, 0.05)', color: 'var(--danger-color)', border: '1px solid rgba(225, 29, 72, 0.2)' }} 
                          onClick={() => handleDelete(c.id, c.filename)} 
                          title="Delete Contract"
                       >
                         🗑️
                       </button>
                     </div>
                   ))}
                </div>
              </div>

            </div>
          )}
          
        </div>
      </main>
    </div>
  )
}

export default App
