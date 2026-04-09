'use client'

interface Props {
  onAddNode: (type: string) => void
  onExportPNG: () => void
  onExportPDF: () => void
  onShare: () => void
}

export default function MindmapToolbar({ onAddNode, onExportPNG, onExportPDF, onShare }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', padding: '4px' }}>
        <ToolBtn onClick={() => onAddNode('default')} title="Přidat uzel" label="+ Uzel" />
        <ToolBtn onClick={() => onAddNode('note')} title="Přidat poznámku" label="📝 Poznámka" />
      </div>
      <div style={{ width: '1px', height: '24px', background: 'var(--border)' }} />
      <div style={{ display: 'flex', gap: '4px' }}>
        <ToolBtn onClick={onExportPNG} label="⬇ PNG" />
        <ToolBtn onClick={onExportPDF} label="⬇ PDF" />
        <button onClick={onShare} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '13px' }}>
          ↗ Sdílet
        </button>
      </div>
    </div>
  )
}

function ToolBtn({ onClick, label, title }: { onClick: () => void; label: string; title?: string }) {
  return (
    <button onClick={onClick} title={title} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '13px' }}>
      {label}
    </button>
  )
}
