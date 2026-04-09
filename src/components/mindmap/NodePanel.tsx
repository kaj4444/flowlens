'use client'
import { useState } from 'react'
import { Node } from 'reactflow'

interface Props {
  node: Node
  comments: any[]
  onUpdate: (id: string, data: any) => void
  onDelete: (id: string) => void
  onAddComment: (nodeId: string, content: string) => void
  onClose: () => void
  colors: string[]
}

export default function NodePanel({ node, comments, onUpdate, onDelete, onAddComment, onClose, colors }: Props) {
  const [newComment, setNewComment] = useState('')
  const [tab, setTab] = useState<'edit' | 'comments'>('edit')

  return (
    <div style={{
      width: '320px', flexShrink: 0, background: 'var(--bg2)', borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Vlastnosti uzlu</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {(['edit', 'comments'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontSize: '13px',
            fontFamily: 'var(--font-body)', background: 'transparent',
            color: tab === t ? 'var(--accent-light)' : 'var(--text-muted)',
            borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
            transition: 'all 0.15s'
          }}>
            {t === 'edit' ? 'Editace' : `Komentáře (${comments.length})`}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {tab === 'edit' ? (
          <>
            <div>
              <label className="label">Název uzlu</label>
              <input className="input" value={node.data.label}
                onChange={e => onUpdate(node.id, { label: e.target.value })} />
            </div>
            <div>
              <label className="label">Obsah / popis</label>
              <textarea className="input" rows={3} value={node.data.content || ''}
                onChange={e => onUpdate(node.id, { content: e.target.value })}
                placeholder="Přidej popis nebo poznámku..." />
            </div>
            <div>
              <label className="label">Štítek</label>
              <input className="input" value={node.data.tag || ''}
                onChange={e => onUpdate(node.id, { tag: e.target.value })}
                placeholder="Např: Priorita, TODO, Hotovo..." />
            </div>
            <div>
              <label className="label">Barva</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                {colors.map(c => (
                  <button key={c} onClick={() => onUpdate(node.id, { color: c })} style={{
                    width: '28px', height: '28px', borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                    outline: node.data.color === c ? '3px solid white' : 'none', outlineOffset: '2px', transition: 'outline 0.1s'
                  }} />
                ))}
              </div>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <button onClick={() => onDelete(node.id)} className="btn btn-danger" style={{ width: '100%', justifyContent: 'center', fontSize: '13px' }}>
                🗑 Smazat uzel
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {comments.length === 0 ? (
                <p style={{ color: 'var(--text-dim)', fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>Zatím žádné komentáře</p>
              ) : (
                comments.map((c: any) => (
                  <div key={c.id} style={{ padding: '12px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)' }}>
                    <p style={{ fontSize: '13px', marginBottom: '6px' }}>{c.content}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{new Date(c.created_at).toLocaleDateString('cs')}</p>
                  </div>
                ))
              )}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <textarea className="input" rows={3} value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Napsat komentář..." />
              <button onClick={() => { if (newComment.trim()) { onAddComment(node.id, newComment); setNewComment('') } }}
                className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px', fontSize: '13px' }}>
                Přidat komentář
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
