import { useState, useRef, useEffect } from 'react';

const ChatInterface = ({ contractId }) => {
  const [messages, setMessages] = useState([{ role: 'system', text: 'Ask me anything about this contract.' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem('cd_auth_token');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !contractId || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contract_id: contractId,
          user_message: userMsg
        })
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: `Error: ${err.message}. Check that the backend is running.` }]);
    } finally {
      setLoading(false);
    }
  };

  if (!contractId) {
    return (
      <div style={{ height: '35%', display: 'flex', flexDirection: 'column', border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '16px', background: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Upload a contract to start chatting about it.</p>
      </div>
    );
  }

  return (
    <div style={{ height: '35%', display: 'flex', flexDirection: 'column', border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '16px', background: 'rgba(255,255,255,0.5)' }}>
      <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>AI Assistant</h4>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            background: msg.role === 'user' ? 'var(--primary-color)' : 'rgba(0,0,0,0.04)',
            color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
            padding: '8px 12px',
            borderRadius: '12px',
            maxWidth: '85%',
            fontSize: '0.85rem',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.5
          }}>
            {msg.text}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '8px 12px' }}>
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this contract..."
          disabled={loading}
          style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'rgba(255,255,255,0.85)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem' }}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }} disabled={loading}>Send</button>
      </form>
    </div>
  );
};

export default ChatInterface;
