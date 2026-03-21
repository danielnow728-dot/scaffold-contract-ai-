import React, { useState } from 'react';

const ChatInterface = ({ contractId }) => {
  const [messages, setMessages] = useState([{ role: 'system', text: 'Ask me anything about this contract.'}]);
  const [input, setInput] = useState('');

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');

    // In a real app we'd call the /chat endpoint here
    // const response = await fetch('/api/v1/chat', { ... })
    setTimeout(() => {
        setMessages(prev => [...prev, { role: 'ai', text: 'This is a simulated response. The backend logic will connect here.' }]);
    }, 1000);
  };

  return (
    <div style={{ height: '35%', display: 'flex', flexDirection: 'column', border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '16px', background: 'rgba(0,0,0,0.2)' }}>
      <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>AI Assistant</h4>
      
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ 
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            background: msg.role === 'user' ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
            color: msg.role === 'user' ? '#000' : 'var(--text-primary)',
            padding: '8px 12px',
            borderRadius: '12px',
            maxWidth: '85%',
            fontSize: '0.85rem'
          }}>
            {msg.text}
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', gap: '8px' }}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..." 
          style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.4)', color: '#fff', outline: 'none' }}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>Send</button>
      </form>
    </div>
  );
};

export default ChatInterface;
