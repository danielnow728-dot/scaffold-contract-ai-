import { useState, useEffect } from 'react'

export default function PromptViewer() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  const token = localStorage.getItem('cd_auth_token')

  useEffect(() => {
    if (!expanded) return
    if (content) return // already loaded

    fetch('/api/v1/prompt', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setContent(data.content))
      .catch(() => setContent('Unable to load prompt.'))
      .finally(() => setLoading(false))
  }, [expanded])

  return (
    <div style={{ marginTop: '32px', maxWidth: '700px', margin: '32px auto 0 auto', textAlign: 'left' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          fontWeight: 500,
          padding: '8px 0',
          width: '100%',
          justifyContent: 'center'
        }}
      >
        <span style={{
          display: 'inline-block',
          transition: 'transform 0.2s ease',
          transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)'
        }}>
          &#9654;
        </span>
        What does the AI look for?
      </button>

      {expanded && (
        <div className="animate-fade-in" style={{
          marginTop: '12px',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid var(--surface-border)',
          background: 'rgba(255,255,255,0.7)',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {loading ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>Loading...</p>
          ) : (
            <>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '12px', fontStyle: 'italic' }}>
                This is the exact set of instructions the AI uses when reviewing your contracts. It is not a black box.
              </p>
              <pre style={{
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                fontSize: '0.8rem',
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                margin: 0
              }}>
                {content}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  )
}
