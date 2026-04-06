import { useState, useEffect } from 'react'

export default function PromptEditor() {
  const [content, setContent] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [isDefault, setIsDefault] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null) // { type: 'success'|'error', message }

  const token = localStorage.getItem('cd_auth_token')

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  useEffect(() => {
    fetch('/api/v1/prompt', { headers })
      .then(res => res.json())
      .then(data => {
        setContent(data.content)
        setSavedContent(data.content)
        setIsDefault(data.is_default)
      })
      .catch(() => setStatus({ type: 'error', message: 'Failed to load prompt.' }))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setStatus(null)
    try {
      const res = await fetch('/api/v1/prompt', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ content })
      })
      if (!res.ok) throw new Error('Save failed')
      const data = await res.json()
      setSavedContent(data.content)
      setIsDefault(data.is_default)
      setStatus({ type: 'success', message: 'Prompt saved successfully.' })
    } catch (e) {
      setStatus({ type: 'error', message: 'Failed to save prompt: ' + e.message })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!window.confirm('Reset to the original default prompt? Your custom prompt will be deactivated.')) return
    setSaving(true)
    setStatus(null)
    try {
      const res = await fetch('/api/v1/prompt/reset', {
        method: 'POST',
        headers
      })
      if (!res.ok) throw new Error('Reset failed')
      const data = await res.json()
      setContent(data.content)
      setSavedContent(data.content)
      setIsDefault(data.is_default)
      setStatus({ type: 'success', message: 'Prompt reset to default.' })
    } catch (e) {
      setStatus({ type: 'error', message: 'Failed to reset prompt: ' + e.message })
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = content !== savedContent

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        Loading prompt...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>System Prompt Editor</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            {isDefault ? 'Using default prompt from scaffolding_prompt.md' : 'Using custom prompt (saved in database)'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {hasChanges && (
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: 500 }}>
              Unsaved changes
            </span>
          )}
          <button
            className="btn"
            onClick={handleReset}
            disabled={saving || isDefault}
            style={{ opacity: isDefault ? 0.5 : 1 }}
            title={isDefault ? 'Already using default prompt' : 'Reset to default prompt'}
          >
            Reset to Default
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            style={{ opacity: !hasChanges ? 0.5 : 1 }}
          >
            {saving ? 'Saving...' : 'Save Prompt'}
          </button>
        </div>
      </div>

      {/* Status message */}
      {status && (
        <div style={{
          padding: '10px 16px',
          borderRadius: '8px',
          fontSize: '0.85rem',
          fontWeight: 500,
          background: status.type === 'success' ? 'rgba(13, 148, 136, 0.1)' : 'rgba(225, 29, 72, 0.1)',
          color: status.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)',
          border: `1px solid ${status.type === 'success' ? 'rgba(13, 148, 136, 0.2)' : 'rgba(225, 29, 72, 0.2)'}`
        }}>
          {status.message}
        </div>
      )}

      {/* Editor */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{
          flex: 1,
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid var(--surface-border)',
          background: 'rgba(255, 255, 255, 0.85)',
          fontSize: '0.85rem',
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          lineHeight: 1.6,
          resize: 'none',
          outline: 'none',
          color: 'var(--text-primary)',
          minHeight: '300px'
        }}
        spellCheck={false}
      />

      {/* Footer info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <span>{content.length.toLocaleString()} characters</span>
        <span>Changes take effect on the next contract upload</span>
      </div>
    </div>
  )
}
