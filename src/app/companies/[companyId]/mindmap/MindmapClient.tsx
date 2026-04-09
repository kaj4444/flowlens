'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import ReactFlow, {
  Node, Edge, Controls, Background, MiniMap,
  useNodesState, useEdgesState, addEdge, Connection,
  BackgroundVariant, NodeTypes, Panel
} from 'reactflow'
import 'reactflow/dist/style.css'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import CustomNode from '@/components/mindmap/CustomNode'
import NodePanel from '@/components/mindmap/NodePanel'
import MindmapToolbar from '@/components/mindmap/MindmapToolbar'

const nodeTypes: NodeTypes = { custom: CustomNode }

const NODE_COLORS = ['#7c6ff7','#10b981','#f59e0b','#3b82f6','#ec4899','#14b8a6','#f97316','#8b5cf6','#22c55e','#ef4444']

function buildInitialGraph(areas: any[], processes: any[]) {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Center root
  nodes.push({
    id: 'root', type: 'custom', position: { x: 0, y: 0 },
    data: { label: 'Firma', type: 'root', color: '#7c6ff7', tag: null, content: '' }
  })

  const angleStep = (2 * Math.PI) / Math.max(areas.length, 1)
  const areaRadius = 300

  areas.forEach((area, ai) => {
    const angle = ai * angleStep - Math.PI / 2
    const ax = Math.cos(angle) * areaRadius
    const ay = Math.sin(angle) * areaRadius
    const areaNodeId = `area-${area.id}`

    nodes.push({
      id: areaNodeId, type: 'custom',
      position: { x: ax, y: ay },
      data: { label: area.name, type: 'area', color: area.color, icon: area.icon, tag: null, content: area.description }
    })
    edges.push({ id: `e-root-${areaNodeId}`, source: 'root', target: areaNodeId, style: { stroke: area.color, strokeWidth: 1.5 } })

    const areaProcesses = processes.filter(p => p.area_id === area.id)
    const pAngleStep = (Math.PI * 0.8) / Math.max(areaProcesses.length, 1)
    const baseAngle = angle - (Math.PI * 0.4)

    areaProcesses.forEach((proc, pi) => {
      const pa = baseAngle + pi * pAngleStep
      const pr = 200
      const px = ax + Math.cos(pa) * pr
      const py = ay + Math.sin(pa) * pr
      const procNodeId = `proc-${proc.id}`

      nodes.push({
        id: procNodeId, type: 'custom',
        position: { x: px, y: py },
        data: { label: proc.title, type: 'process', color: area.color, tag: null, content: proc.raw_description }
      })
      edges.push({ id: `e-${areaNodeId}-${procNodeId}`, source: areaNodeId, target: procNodeId, style: { stroke: area.color, strokeWidth: 1, opacity: 0.7 } })
    })
  })

  return { nodes, edges }
}

export default function MindmapClient({ company, areas, processes, savedNodes, savedEdges, comments: initialComments }: any) {
  const supabase = createClient()
  const saveTimeout = useRef<any>(null)
  const flowRef = useRef<any>(null)

  // Build initial nodes/edges from saved or generate fresh
  const getInitialState = () => {
    if (savedNodes.length > 0) {
      const nodes: Node[] = savedNodes.map((n: any) => ({
        id: n.node_id, type: 'custom',
        position: { x: n.position_x, y: n.position_y },
        data: { label: n.label, type: n.type, color: n.color, tag: n.tag, content: n.content }
      }))
      const edges: Edge[] = savedEdges.map((e: any) => ({
        id: e.edge_id, source: e.source_node_id, target: e.target_node_id, label: e.label,
        style: { stroke: 'var(--accent)', strokeWidth: 1.5 }
      }))
      return { nodes, edges }
    }
    return buildInitialGraph(areas, processes)
  }

  const { nodes: initNodes, edges: initEdges } = getInitialState()
  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [comments, setComments] = useState(initialComments)
  const [saving, setSaving] = useState(false)

  const onConnect = useCallback((params: Connection) => {
    setEdges(eds => addEdge({ ...params, style: { stroke: 'var(--accent)', strokeWidth: 1.5 } }, eds))
  }, [setEdges])

  const onNodeClick = useCallback((_: any, node: Node) => setSelectedNode(node), [])
  const onPaneClick = useCallback(() => setSelectedNode(null), [])

  // Auto-save debounced
  const scheduleSave = useCallback(() => {
    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => saveToDb(), 2000)
  }, [nodes, edges])

  useEffect(() => { scheduleSave() }, [nodes, edges])

  const saveToDb = async () => {
    setSaving(true)
    try {
      // Delete existing and re-insert
      await supabase.from('mindmap_nodes').delete().eq('company_id', company.id)
      await supabase.from('mindmap_edges').delete().eq('company_id', company.id)

      if (nodes.length > 0) {
        await supabase.from('mindmap_nodes').insert(
          nodes.map(n => ({
            company_id: company.id,
            node_id: n.id,
            type: n.data.type || 'default',
            label: n.data.label,
            content: n.data.content || null,
            position_x: n.position.x,
            position_y: n.position.y,
            color: n.data.color || '#7c6ff7',
            tag: n.data.tag || null
          }))
        )
      }

      if (edges.length > 0) {
        await supabase.from('mindmap_edges').insert(
          edges.map(e => ({
            company_id: company.id,
            edge_id: e.id,
            source_node_id: e.source,
            target_node_id: e.target,
            label: e.label as string || null
          }))
        )
      }
    } catch (err) { console.error('Save error', err) }
    finally { setSaving(false) }
  }

  const handleAddNode = (type: string) => {
    const id = `node-${Date.now()}`
    const color = NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)]
    const newNode: Node = {
      id, type: 'custom',
      position: { x: Math.random() * 400 - 200, y: Math.random() * 400 - 200 },
      data: { label: type === 'note' ? 'Poznámka' : 'Nový uzel', type, color, tag: null, content: '' }
    }
    setNodes(ns => [...ns, newNode])
    setSelectedNode(newNode)
  }

  const handleUpdateNode = (nodeId: string, updates: Partial<Node['data']>) => {
    setNodes(ns => ns.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n))
    setSelectedNode(s => s?.id === nodeId ? { ...s, data: { ...s.data, ...updates } } : s)
  }

  const handleDeleteNode = (nodeId: string) => {
    setNodes(ns => ns.filter(n => n.id !== nodeId))
    setEdges(es => es.filter(e => e.source !== nodeId && e.target !== nodeId))
    setSelectedNode(null)
  }

  const handleAddComment = async (nodeId: string, content: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('node_comments').insert({
      node_id: nodeId, company_id: company.id, user_id: user!.id, content
    }).select().single()
    if (error) return toast.error(error.message)
    setComments((cs: any) => [...cs, data])
    toast.success('Komentář přidán')
  }

  const handleExportPNG = async () => {
    const { toPng } = await import('html2canvas').then(() => ({ toPng: null }))
    // Use html2canvas
    const { default: html2canvas } = await import('html2canvas')
    const el = document.querySelector('.react-flow') as HTMLElement
    if (!el) return
    const canvas = await html2canvas(el, { backgroundColor: '#0a0a0f', scale: 2 })
    const link = document.createElement('a')
    link.download = `${company.name}-mindmapa.png`
    link.href = canvas.toDataURL()
    link.click()
    toast.success('PNG exportováno')
  }

  const handleExportPDF = async () => {
    const { default: html2canvas } = await import('html2canvas')
    const { default: jsPDF } = await import('jspdf')
    const el = document.querySelector('.react-flow') as HTMLElement
    if (!el) return
    const canvas = await html2canvas(el, { backgroundColor: '#0a0a0f', scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'landscape', format: 'a3' })
    const w = pdf.internal.pageSize.getWidth()
    const h = (canvas.height * w) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, w, h)
    pdf.save(`${company.name}-mindmapa.pdf`)
    toast.success('PDF exportováno')
  }

  const handleShare = async () => {
    const { data, error } = await supabase.from('share_links').insert({ company_id: company.id }).select().single()
    if (error) return toast.error(error.message)
    const url = `${window.location.origin}/share/${data.token}`
    await navigator.clipboard.writeText(url)
    toast.success('Share link zkopírován!')
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg2)', zIndex: 10, flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href={`/companies/${company.id}`} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px' }}>
            ← {company.name}
          </a>
          <h1 style={{ fontSize: '16px', fontWeight: 700 }}>Mind mapa</h1>
          {saving && <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Ukládám...</span>}
        </div>
        <MindmapToolbar onAddNode={handleAddNode} onExportPNG={handleExportPNG} onExportPDF={handleExportPDF} onShare={handleShare} />
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.05)" />
            <Controls style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
            <MiniMap
              nodeColor={(n) => n.data?.color || '#7c6ff7'}
              style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}
              maskColor="rgba(0,0,0,0.5)"
            />
          </ReactFlow>
        </div>

        {/* Right panel */}
        {selectedNode && (
          <NodePanel
            node={selectedNode}
            comments={comments.filter((c: any) => c.node_id === selectedNode.id)}
            onUpdate={handleUpdateNode}
            onDelete={handleDeleteNode}
            onAddComment={handleAddComment}
            onClose={() => setSelectedNode(null)}
            colors={NODE_COLORS}
          />
        )}
      </div>
    </div>
  )
}
