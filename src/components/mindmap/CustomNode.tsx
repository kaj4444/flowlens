'use client'
import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'

const CustomNode = memo(({ data, selected }: NodeProps) => {
  const isRoot = data.type === 'root'
  const isArea = data.type === 'area'
  const isNote = data.type === 'note'
  const size = isRoot ? 80 : isArea ? 64 : 52
  const fontSize = isRoot ? 13 : isArea ? 12 : 11

  return (
    <div style={{
      position: 'relative',
      minWidth: isNote ? '160px' : `${size}px`,
      padding: isNote ? '12px 14px' : `${size/2}px ${size/2.5}px`,
      borderRadius: isNote ? '8px' : isRoot ? '50%' : isArea ? '12px' : '8px',
      background: isNote ? 'rgba(30,30,46,0.95)' : `${data.color}20`,
      border: `${selected ? 2 : 1.5}px solid ${selected ? 'white' : data.color}`,
      boxShadow: selected ? `0 0 0 2px ${data.color}40, 0 4px 20px ${data.color}30` : `0 2px 12px ${data.color}20`,
      cursor: 'grab', transition: 'box-shadow 0.15s',
      textAlign: 'center', minHeight: isNote ? undefined : `${size}px`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px'
    }}>
      <Handle type="target" position={Position.Left} style={{ background: data.color, border: 'none', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: data.color, border: 'none', width: 8, height: 8 }} />
      {data.icon && <span style={{ fontSize: isArea ? '18px' : '14px' }}>{data.icon}</span>}
      <div style={{
        fontSize: `${fontSize}px`, fontWeight: isRoot || isArea ? 700 : 500,
        color: data.type === 'note' ? 'var(--text-muted)' : data.color,
        fontFamily: 'var(--font-display)', lineHeight: 1.3,
        maxWidth: isNote ? undefined : '120px', wordBreak: 'break-word'
      }}>{data.label}</div>
      {data.tag && (
        <span style={{
          fontSize: '9px', padding: '1px 6px', borderRadius: '4px',
          background: `${data.color}30`, color: data.color, fontWeight: 600,
          letterSpacing: '0.05em', textTransform: 'uppercase'
        }}>{data.tag}</span>
      )}
      {isNote && data.content && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{data.content}</div>
      )}
    </div>
  )
})

CustomNode.displayName = 'CustomNode'
export default CustomNode
