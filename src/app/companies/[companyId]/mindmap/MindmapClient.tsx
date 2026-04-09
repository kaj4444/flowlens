'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import ReactFlow, {
  Node, Edge, Controls, Background, MiniMap,
  useNodesState, useEdgesState, addEdge, Connection,
  BackgroundVariant, NodeTypes, ReactFlowProvider
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
  nodes.push({ id: 'root', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Firma', type: 'root', color: '#7c6ff7', tag: null, content: '' } })
  const angleStep = (2 * Math.PI) / Math.max(areas.length, 1)
  areas.forEach((area, ai) => {
    const angle = ai * angleStep - Math.PI / 2
    const ax = Math.cos(angle) * 300
    const ay = Math.sin(angle) * 300
    const areaNodeId = `area-${area.id}`
    nodes.push({ id: areaNodeId, type: 'custom', position: { x: ax, y: ay }, data: { label: area.name, type: 'area', color: area.color, icon: area.icon, tag: null, content: area.description } })
    edges.push({ id: `e-root-${areaNodeId}`, source: 'root', target: areaNodeId, style: { stroke: area.color, strokeWidth: 1.5 } })
    const areaProcesses = processes.filter(p => p.area_id === area.id)
    const pAngleStep = (Math.PI * 0.8) / Math.max(areaProcesses.length, 1)
    const baseAngle = angle - (Math.PI * 0.4)
    areaProcesses.forEach((proc, pi) => {
      const pa = baseAngle + pi * pAngleStep
      const procNodeId = `proc-${proc.id}`
      nodes.push({ id: procNodeId, type: 'custom', position: { x: ax + Math.cos(pa) * 200, y: ay + Math.sin(pa) * 200 }, data: { label: proc.title, type: 'process', color: area.color, tag: null, content: proc.raw_description } })
      edges.push({ id: `e-${areaNodeId}-${procNodeId}`, source: areaNodeId, target: procNodeId, style: { stroke: area.color, strokeWidth: 1, opacity: 0.7 } })
    })
  })
  return { nodes, edges }
}

function MindmapInner({ company, areas, processes, savedNodes, savedEdges, comments: initialComments }: any) {
  const supabase = createClient()
  const saveTimeout = useRef<any>(null)
  const nodesHistory = useRef<Node[][]>([])
  const edgesHistory = useRef<Edge[][]>([])
  const historyPtr = useRef(0)
  const isUndoRedo = useRef(false)

  const getInitialState = () => {
    if (savedNodes.length > 0) {
      return {
        nodes: savedNodes.map((n: any) => ({ id: n.node_id, type: 'custom', position: { x: n.position_x, y: n.position_y }, data: { label: n.label, type: n.type, color: n.color, tag: n.tag, content: n.content } })),
        edges: savedEdges.map((e: any) => ({ id: e.edge_id, source: e.source_node_id, target: e.target_node_id, label: e.label, style: { stroke: '#7c6ff7', strokeWidth: 1.5 } }))
      }
    }
    return buildInitialGraph(areas, processes)
  }

  const { nodes: initNodes, edges: initEdges } = getInitialState()
  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [comments, setComments] = useState(initialComments)
  const [saving, setSaving] = useState(false)
  const [aiChatOpen, setAiChatOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    nodesHistory.current = [initNodes]
    edgesHistory.current = [initEdges]
    historyPtr.current = 0
  }, [])

  const pushHistory = useCallback((ns: Node[], es: Edge[]) => {
    if (isUndoRedo.current) return
    nodesHistory.current = nodesHistory.current.slice(0, historyPtr.current + 1)
    edgesHistory.current = edgesHistory.current.slice(0, historyPtr.current + 1)
    nodesHistory.current.push([...ns])
    edgesHistory.current.push([...es])
    historyPtr.current = nodesHistory.current.length - 1
  }, [])

  const handleUndo = useCallback(() => {
    if (historyPtr.current > 0) {
      historyPtr.current--
      isUndoRedo.current = true
      setNodes([...nodesHistory.current[historyPtr.current]])
      setEdges([...edgesHistory.current[historyPtr.current]])
      setTimeout(() => { isUndoRedo.current = false }, 100)
      toast('Zpět', { icon: '↩' })
    }
  }, [setNodes, setEdges])

  const handleRedo = useCallback(() => {
    if (historyPtr.current < nodesHistory.current.length - 1) {
      historyPtr.current++
      isUndoRedo.current = true
      setNodes([...nodesHistory.current[historyPtr.current]])
      setEdges([...edgesHistory.current[historyPtr.current]])
      setTimeout(() => { isUndoRedo.current = false }, 100)
      toast('Vpřed', { icon: '↪' })
    }
  }, [setNodes, setEdges])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo() }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); handleRedo() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleUndo, handleRedo])

  const onConnect = useCallback((params: Connection) => {
    setEdges(eds => addEdge({ ...params, style: { stroke: '#7c6ff7', strokeWidth: 1.5 } }, eds))
  }, [setEdges])

  const onNodeClick = useCallback((_: any, node: Node) => setSelectedNode(node), [])
  const onPaneClick = useCallback(() => setSelectedNode(null), [])

  useEffect(() => {
    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(saveToDb, 2000)
  }, [nodes, edges])

  const saveToDb = async () => {
    setSaving(true)
    try {
      await supabase.from('mindmap_nodes').delete().eq('company_id', company.id)
      await supabase.from('mindmap_edges').delete().eq('company_id', company.id)
      if (nodes.length > 0) await supabase.from('mindmap_nodes').insert(nodes.map(n => ({ company_id: company.id, node_id: n.id, type: n.data.type || 'default', label: n.data.label, content: n.data.content || null, position_x: n.position.x, position_y: n.position.y, color: n.data.color || '#7c6ff7', tag: n.data.tag || null })))
      if (edges.length > 0) await supabase.from('mindmap_edges').insert(edges.map(e => ({ company_id: company.id, edge_id: e.id, source_node_id: e.source, target_node_id: e.target, label: (e.label as string) || null })))
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const handleAddNode = (type: string) => {
    const id = `node-${Date.now()}`
    const color = NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)]
    const newNode: Node = { id, type: 'custom', position: { x: Math.random() * 400 - 200, y: Math.random() * 400 - 200 }, data: { label: type === 'note' ? 'Poznámka' : 'Nový uzel', type, color, tag: null, content: '' } }
    setNodes(ns => { const next = [...ns, newNode]; pushHistory(next, edges); return next })
    setSelectedNode(newNode)
  }

  const handleUpdateNode = (nodeId: string, updates: any) => {
    setNodes(ns => { const next = ns.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n); pushHistory(next, edges); return next })
    setSelectedNode((s: any) => s?.id === nodeId ? { ...s, data: { ...s.data, ...updates } } : s)
  }

  const handleDeleteNode = (nodeId: string) => {
    setNodes(ns => { const next = ns.filter(n => n.id !== nodeId); pushHistory(next, edges.filter(e => e.source !== nodeId && e.target !== nodeId)); return next })
    setEdges(es => es.filter(e => e.source !== nodeId && e.target !== nodeId))
    setSelectedNode(null)
  }

  const handleDeleteEdge = (edgeId: string) => {
    setEdges(es => { const next = es.filter(e => e.id !== edgeId); pushHistory(nodes, next); return next })
    toast('Spojení smazáno', { icon: '✂️' })
  }

  const handleAddComment = async (nodeId: string, content: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('node_comments').insert({ node_id: nodeId, company_id: company.id, user_id: user!.id, content }).select().single()
    if (error) return toast.error(error.message)
    setComments((cs: any) => [...cs, data])
    toast.success('Komentář přidán')
  }

  const handleAiChat = async () => {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/mindmap-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, currentNodes: nodes.map(n => ({ id: n.id, label: n.data.label, type: n.data.type, color: n.data.color })), companyName: company.name })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (data.action === 'add_node') {
        const id = `node-${Date.now()}`
        const color = data.color || NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)]
        const parentNode = data.connectTo ? nodes.find(n => n.data.label.toLowerCase().includes(data.connectTo.toLowerCase())) : null
        const pos = parentNode ? { x: parentNode.position.x + 220, y: parentNode.position.y + Math.random() * 100 - 50 } : { x: Math.random() * 400 - 200, y: Math.random() * 400 - 200 }
        const newNode: Node = { id, type: 'custom', position: pos, data: { label: data.label, type: data.nodeType || 'default', color, tag: data.tag || null, content: data.content || '' } }
        const newEdges = parentNode ? [{ id: `e-${parentNode.id}-${id}`, source: parentNode.id, target: id, style: { stroke: color, strokeWidth: 1.5 } }] : []
        setNodes(ns => { const next = [...ns, newNode]; pushHistory(next, [...edges, ...newEdges]); return next })
        if (newEdges.length) setEdges(es => [...es, ...newEdges])
        toast.success(`Přidán: ${data.label}`)
      } else if (data.action === 'add_multiple') {
        const newNodes: Node[] = []
        const newEdges: Edge[] = []
        data.nodes.forEach((n: any, i: number) => {
          const id = `node-${Date.now()}-${i}`
          const color = n.color || NODE_COLORS[i % NODE_COLORS.length]
          const parentNode = n.connectTo ? nodes.find((nd: Node) => nd.data.label.toLowerCase().includes(n.connectTo.toLowerCase())) : null
          const pos = parentNode ? { x: parentNode.position.x + 220 + (i % 2) * 60, y: parentNode.position.y + (i - data.nodes.length / 2) * 110 } : { x: Math.random() * 600 - 300, y: Math.random() * 400 - 200 }
          newNodes.push({ id, type: 'custom', position: pos, data: { label: n.label, type: n.nodeType || 'default', color, tag: n.tag || null, content: n.content || '' } })
          if (parentNode) newEdges.push({ id: `e-${parentNode.id}-${id}`, source: parentNode.id, target: id, style: { stroke: color, strokeWidth: 1.5 } })
        })
        setNodes(ns => { const next = [...ns, ...newNodes]; pushHistory(next, [...edges, ...newEdges]); return next })
        if (newEdges.length) setEdges(es => [...es, ...newEdges])
        toast.success(`Přidáno ${newNodes.length} uzlů`)
      } else {
        toast(data.message || 'Hotovo', { icon: '✓' })
      }
      setAiPrompt('')
    } catch (err: any) { toast.error(err.message) }
    finally { setAiLoading(false) }
  }

  const handleExportPNG = async () => {
    const { default: html2canvas } = await import('html2canvas')
    const el = document.querySelector('.react-flow') as HTMLElement
    if (!el) return
    const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2 })
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
    const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'landscape', format: 'a3' })
    const w = pdf.internal.pageSize.getWidth()
    pdf.addImage(imgData, 'PNG', 0, 0, w, (canvas.height * w) / canvas.width)
    pdf.save(`${company.name}-mindmapa.pdf`)
    toast.success('PDF exportováno')
  }

  const handleShare = async () => {
    const { data, error } = await supabase.from('share_links').insert({ company_id: company.id }).select().single()
    if (error) return toast.error(error.message)
    await navigator.clipboard.writeText(`${window.location.origin}/share/${data.token}`)
    toast.success('Share link zkopírován!')
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid var(--border)', background: '#fff', zIndex: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href={`/companies/${company.id}`} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px' }}>← {company.name}</a>
          <h1 style={{ fontSize: '16px', fontWeight: 700 }}>Mind mapa</h1>
          {saving && <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Ukládám...</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={handleUndo} className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: '16px' }} title="Zpět (⌘Z)">↩</button>
          <button onClick={handleRedo} className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: '16px' }} title="Vpřed (⌘Y)">↪</button>
          <div style={{ width: '1px', height: '24px', background: 'var(--border)' }} />
          <MindmapToolbar onAddNode={handleAddNode} onExportPNG={handleExportPNG} onExportPDF={handleExportPDF} onShare={handleShare} />
          <button onClick={() => setAiChatOpen(o => !o)} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '13px' }}>✦ AI asistent</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <div style={{ flex: 1 }}>
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} onNodeClick={onNodeClick} onPaneClick={onPaneClick}
            onEdgeClick={(_, edge) => { if (window.confirm('Smazat toto spojení?')) handleDeleteEdge(edge.id) }}
            nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.2 }} deleteKeyCode={null}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(0,0,0,0.06)" />
            <Controls />
            <MiniMap nodeColor={(n) => n.data?.color || '#7c6ff7'} style={{ background: '#f8f8fc', border: '1px solid var(--border)' }} maskColor="rgba(0,0,0,0.08)" />
          </ReactFlow>
        </div>

        {selectedNode && (
          <NodePanel node={selectedNode} comments={comments.filter((c: any) => c.node_id === selectedNode.id)} onUpdate={handleUpdateNode} onDelete={handleDeleteNode} onAddComment={handleAddComment} onClose={() => setSelectedNode(null)} colors={NODE_COLORS} />
        )}

        {aiChatOpen && (
          <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', width: '560px', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 20, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '15px' }}>✦ AI asistent</span>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Řekni AI co chceš přidat nebo změnit v mapě</p>
              </div>
              <button onClick={() => setAiChatOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input className="input" placeholder='Např: "Přidej uzel Reklamace pod Zákaznický servis"' value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiChat()} style={{ flex: 1 }} />
              <button onClick={handleAiChat} className="btn btn-primary" disabled={aiLoading} style={{ flexShrink: 0 }}>
                {aiLoading ? <span className="spinner" style={{ width: '14px', height: '14px' }} /> : '→'}
              </button>
            </div>
            <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['Přidej uzel Reklamace', 'Přidej proces Fakturace', 'Přidej 3 kroky obchodu'].map(s => (
                <button key={s} onClick={() => setAiPrompt(s)} style={{ fontSize: '11px', padding: '3px 10px', background: 'var(--accent-dim)', color: 'var(--accent)', border: 'none', borderRadius: '20px', cursor: 'pointer' }}>{s}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MindmapClient(props: any) {
  return <ReactFlowProvider><MindmapInner {...props} /></ReactFlowProvider>
}
