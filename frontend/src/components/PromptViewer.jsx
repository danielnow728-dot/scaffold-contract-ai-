import { useState, useEffect, useMemo } from 'react'

function HighlightedText({ text, search }) {
  if (!search.trim()) return <>{text}</>

  const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} style={{ background: '#fde68a', color: 'var(--text-primary)', borderRadius: '2px', padding: '0 1px' }}>{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

export default function PromptViewer() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const token = localStorage.getItem('cd_auth_token')

  useEffect(() => {
    fetch('/api/v1/prompt', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setContent(data.content))
      .catch(() => setContent('Unable to load prompt.'))
      .finally(() => setLoading(false))
  }, [])

  const matchCount = useMemo(() => {
    if (!search.trim() || !content) return 0
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    return (content.match(regex) || []).length
  }, [search, content])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        Loading...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      {/* Header */}
      <div>
        <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>What does the AI look for?</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0', fontStyle: 'italic' }}>
          This is the exact set of instructions the AI uses when reviewing your contracts. Search for any topic to see what rules apply.
        </p>
      </div>

      {/* Search bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search (e.g. insurance, retention, lien, liquidated damages)..."
          autoFocus
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid var(--surface-border)',
            background: 'rgba(255,255,255,0.85)',
            fontSize: '0.9rem',
            outline: 'none',
            color: 'var(--text-primary)'
          }}
        />
        {search.trim() && (
          <span style={{
            fontSize: '0.85rem',
            color: matchCount > 0 ? 'var(--success-color)' : 'var(--danger-color)',
            whiteSpace: 'nowrap',
            fontWeight: 500
          }}>
            {matchCount} {matchCount === 1 ? 'match' : 'matches'}
          </span>
        )}
      </div>

      {/* Prompt content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid var(--surface-border)',
        background: 'rgba(255,255,255,0.7)'
      }}>
        <pre style={{
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          fontSize: '0.8rem',
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          lineHeight: 1.6,
          color: 'var(--text-primary)',
          margin: 0
        }}>
          <HighlightedText text={content} search={search} />
        </pre>
      </div>
    </div>
  )
}
