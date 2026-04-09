'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Process, ProcessArea, ProcessStep } from '@/types'

interface Props {
  companyId: string
  areas: ProcessArea[]
  processes: any[]
  initialAreaFilter?: string
}

export default function ProcessClient({ companyId, areas, processes: initial, initialAreaFilter }: Props) {
  const [processes, setProcesses] = useState(initial)
  const [activeArea, setActiveArea] = useState(initialAreaFilter || 'all')
  const [selected, setSelected] = useState<any | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [newProc, setNewProc] = useState({ title: '', area_id: '', raw_description: '' })
  const [aiLoading, setAiLoading] = useState(false)
  const supabase = createClient()

  const filtered = activeArea === 'all' ? processes : processes.filter(p => p.area_id === activeArea)

  const handleStructure = async (proc: any) => {
    if (!proc.raw_description) return toast.error('Nejprve přidej popis procesu')
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/structure-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: proc.title, description: proc.raw_description })
      })
      const data = await res.json()
      const { error } = await supabase.from('processes').update({
        structured_steps: data.steps, status: 'structured'
      }).eq('id', proc.id)
      if (error) throw error
      setProcesses(ps => ps.map(p => p.id === proc.id ? { ...p, structured_steps: data.steps, status: 'structured' } : p))
      setSelected((s: any) => s?.id === proc.id ? { ...s, structured_steps: data.steps, status: 'structured' } : s)
      toast.success('Proces strukturován!')
    } catch (err: any) { toast.error(err.message) }
    finally { setAiLoading(false) }
  }

  const handleAddProcess = async () => {
    if (!newProc.title) return
    const { data, error } = await supabase.from('processes').insert({
      company_id: companyId,
      title: newProc.title,
      area_id: newProc.area_id || null,
      raw_description: newProc.raw_description,
      status: 'draft'
    }).select('*, process_areas(name, color, icon)').single()
    if (error) return toast.error(error.message)
    setProcesses(ps => [...ps, data])
    setNewProc({ title: '', area_id: '', raw_description: '' })
    setAddingNew(false)
    setSelected(data)
    toast.success('Proces přidán')
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', minHeight: '600px' }}>
      {/* Left: list */}
      <div>
        {/* Area filter */}
        <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button onClick={() => setActiveArea('all')} style={{
            padding: '8px 12px', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
            fontSize: '13px', fontFamily: 'var(--font-body)', textAlign: 'left',
            background: activeArea === 'all' ? 'var(--accent-dim)' : 'transparent',
            color: activeArea === 'all' ? 'var(--accent-light)' : 'var(--text-muted)',
            fontWeight: activeArea === 'all' ? 600 : 400
          }}>Všechny oblasti ({processes.length})</button>
          {areas.map(a => (
            <button key={a.id} onClick={() => setActiveArea(a.id)} style={{
              padding: '8px 12px', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
              fontSize: '13px', fontFamily: 'var(--font-body)', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px',
              background: activeArea === a.id ? `${a.color}18` : 'transparent',
              color: activeArea === a.id ? a.color : 'var(--text-muted)'
            }}>
              <span>{a.icon}</span>
              <span style={{ flex: 1 }}>{a.name}</span>
              <span style={{ fontSize: '11px', opacity: 0.7 }}>{processes.filter(p => p.area_id === a.id).length}</span>
            </button>
          ))}
        </div>

        {/* Process list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filtered.map(p => (
            <div key={p.id} onClick={() => setSelected(p)} style={{
              padding: '12px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              background: selected?.id === p.id ? 'var(--surface)' : 'var(--bg3)',
              border: `1px solid ${selected?.id === p.id ? 'var(--accent)' : 'var(--border)'}`,
              transition: 'all 0.15s'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{p.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {p.process_areas && (
                  <span style={{ fontSize: '11px', color: p.process_areas.color }}>{p.process_areas.icon} {p.process_areas.name}</span>
                )}
                <span className={`badge ${p.status === 'structured' ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '10px' }}>
                  {p.status === 'draft' ? 'Draft' : p.status === 'structured' ? '✓ Strukturovaný' : 'Mapovaný'}
                </span>
              </div>
            </div>
          ))}

          <button onClick={() => setAddingNew(true)} className="btn btn-ghost" style={{ justifyContent: 'center', marginTop: '8px', fontSize: '13px' }}>
            + Přidat proces
          </button>
        </div>
      </div>

      {/* Right: detail */}
      <div>
        {addingNew && (
          <div className="glass" style={{ padding: '28px', marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '20px' }}>Nový proces</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="label">Název procesu</label>
                <input className="input" placeholder="Např. Přijetí objednávky" value={newProc.title}
                  onChange={e => setNewProc(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className="label">Oblast</label>
                <select className="input" value={newProc.area_id} onChange={e => setNewProc(p => ({ ...p, area_id: e.target.value }))} style={{ cursor: 'pointer' }}>
                  <option value="">Bez oblasti</option>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Popis procesu (pro AI strukturování)</label>
                <textarea className="input" placeholder="Popiš slovně jak tento proces probíhá..." value={newProc.raw_description}
                  onChange={e => setNewProc(p => ({ ...p, raw_description: e.target.value }))} rows={4} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleAddProcess} className="btn btn-primary">Přidat</button>
                <button onClick={() => setAddingNew(false)} className="btn btn-ghost">Zrušit</button>
              </div>
            </div>
          </div>
        )}

        {selected ? (
          <ProcessDetail process={selected} onStructure={handleStructure} aiLoading={aiLoading} />
        ) : !addingNew && (
          <div className="glass" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-dim)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.4 }}>▸</div>
            <p>Vyber proces ze seznamu vlevo</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ProcessDetail({ process: p, onStructure, aiLoading }: { process: any; onStructure: (p: any) => void; aiLoading: boolean }) {
  return (
    <div className="glass" style={{ padding: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', marginBottom: '6px' }}>{p.title}</h2>
          {p.process_areas && (
            <span style={{ fontSize: '13px', color: p.process_areas.color }}>
              {p.process_areas.icon} {p.process_areas.name}
            </span>
          )}
        </div>
        {p.status === 'draft' && (
          <button onClick={() => onStructure(p)} className="btn btn-primary" disabled={aiLoading} style={{ fontSize: '13px' }}>
            {aiLoading ? <span className="spinner" style={{ width: '14px', height: '14px' }} /> : '✦ Strukturovat s AI'}
          </button>
        )}
      </div>

      {p.raw_description && (
        <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--border)' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Popis</p>
          <p style={{ fontSize: '14px' }}>{p.raw_description}</p>
        </div>
      )}

      {p.structured_steps?.length > 0 && (
        <div>
          <h3 style={{ fontSize: '15px', marginBottom: '16px', color: 'var(--text-muted)' }}>Kroky procesu</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {p.structured_steps.map((step: ProcessStep, i: number) => (
              <div key={step.id} style={{
                display: 'flex', gap: '16px', padding: '16px',
                background: 'var(--bg3)', borderRadius: 'var(--radius-sm)',
                borderLeft: '3px solid var(--accent)'
              }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'var(--accent-dim)', color: 'var(--accent-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700, flexShrink: 0
                }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{step.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>{step.description}</div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {step.responsible && <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>👤 {step.responsible}</span>}
                    {step.duration && <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>⏱ {step.duration}</span>}
                    {step.tools?.map(t => (
                      <span key={t} style={{ fontSize: '11px', padding: '2px 8px', background: 'var(--surface)', borderRadius: '4px', color: 'var(--text-dim)' }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
