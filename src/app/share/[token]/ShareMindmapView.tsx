'use client'
import ReactFlow, { Node, Edge, Controls, Background, BackgroundVariant, MiniMap } from 'reactflow'
import 'reactflow/dist/style.css'
import CustomNode from '@/components/mindmap/CustomNode'
import { useMemo } from 'react'

const nodeTypes = { custom: CustomNode }

export default function ShareMindmapView({ company, nodes: rawNodes, edges: rawEdges }: any) {
  const nodes: Node[] = useMemo(() => rawNodes.map((n: any) => ({
    id: n.node_id, type: 'custom',
    position: { x: n.position_x, y: n.position_y },
    data: { label: n.label, type: n.type, color: n.color, tag: n.tag, content: n.content }
  })), [rawNodes])

  const edges: Edge[] = useMemo(() => rawEdges.map((e: any) => ({
    id: e.edge_id, source: e.source_node_id, target: e.target_node_id,
    style: { stroke: 'var(--accent)', strokeWidth: 1.5 }
  })), [rawEdges])

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'linear-gradient(135deg, var(--accent), var(--teal))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>⬡</div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 800 }}>Flowlens</span>
          </div>
          <div style={{ width: '1px', height: '18px', background: 'var(--border)' }} />
          <div>
            <span style={{ fontSize: '15px', fontWeight: 600 }}>{company.name}</span>
            {company.industry && <span style={{ color: 'var(--text-muted)', fontSize: '13px', marginLeft: '8px' }}>{company.industry}</span>}
          </div>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
          Sdílená mapa · {rawNodes.length} uzlů
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.05)" />
          <Controls showInteractive={false} />
          <MiniMap nodeColor={(n) => n.data?.color || '#7c6ff7'} style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }} maskColor="rgba(0,0,0,0.5)" />
        </ReactFlow>
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg2)', fontSize: '12px', color: 'var(--text-dim)', textAlign: 'center' }}>
        Vytvořeno v <strong style={{ color: 'var(--accent-light)' }}>Flowlens</strong> · Pouze pro prohlížení
      </div>
    </div>
  )
}
