'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { IdentifiedArea } from '@/types'

const SIZES = ['1–10', '11–50', '51–200', '200+']
const INDUSTRIES = ['Výroba','Logistika a doprava','Obchod – produkt','Obchod – služba','IT a technologie','Konzultace a poradenství','Stavebnictví','Zdravotnictví','Finance a pojišťovnictví','Vzdělávání','Jiné']
const EXTRA_AREAS = ['Obchod','Marketing','Výroba','Logistika','Sklad','Finance','HR','IT','Zákaznický servis','Nákup','Kvalita','Právní oddělení','Administrativa','R&D','Export','E-commerce','PR a komunikace','Bezpečnost']
const AREA_COLORS = ['#7c6ff7','#10b981','#f59e0b','#3b82f6','#ec4899','#14b8a6','#f97316','#8b5cf6','#22c55e','#ef4444']

export default function NewCompanyPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<'form'|'loading'|'areas'|'generating'>('form')
  const [formData, setFormData] = useState({ name: '', industry: '', size: '', description: '' })
  const [suggestedAreas, setSuggestedAreas] = useState<IdentifiedArea[]>([])
  const [selectedAreas, setSelectedAreas] = useState<Set<number>>(new Set())
  const [businessSummary, setBusinessSummary] = useState('')
  const [showAddArea, setShowAddArea] = useState(false)
  const [customAreaName, setCustomAreaName] = useState('')
  const [fetchingUrl, setFetchingUrl] = useState(false)

  const handleFetchUrl = async () => {
    const url = formData.description.trim()
    if (!url.startsWith('http')) return
    setFetchingUrl(true)
    try {
      const res = await fetch('/api/ai/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFormData(p => ({ ...p, description: data.content }))
      toast.success('Web načten a analyzován!')
    } catch (err: any) {
      toast.error('Nepodařilo se načíst web: ' + err.message)
    } finally {
      setFetchingUrl(false)
    }
  }

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.description) return
    setStep('loading')
    try {
      const res = await fetch('/api/ai/identify-areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuggestedAreas(data.areas)
      setBusinessSummary(data.summary)
      setSelectedAreas(new Set(data.areas.map((_: any, i: number) => i)))
      setStep('areas')
    } catch (err: any) {
      toast.error(err.message)
      setStep('form')
    }
  }

  const handleAddCustomArea = () => {
    if (!customAreaName.trim()) return
    const color = AREA_COLORS[suggestedAreas.length % AREA_COLORS.length]
    const newArea: IdentifiedArea = { name: customAreaName, description: 'Vlastní oblast', icon: '📋', color }
    setSuggestedAreas(prev => {
      const next = [...prev, newArea]
      setSelectedAreas(s => new Set([...s, next.length - 1]))
      return next
    })
    setCustomAreaName('')
    setShowAddArea(false)
    toast.success(`Oblast "${customAreaName}" přidána`)
  }

  const handleAddFromDropdown = (name: string) => {
    if (suggestedAreas.find(a => a.name === name)) { toast('Tato oblast už je v seznamu'); return }
    const color = AREA_COLORS[suggestedAreas.length % AREA_COLORS.length]
    const newArea: IdentifiedArea = { name, description: 'Přidaná oblast', icon: '📋', color }
    setSuggestedAreas(prev => {
      const next = [...prev, newArea]
      setSelectedAreas(s => new Set([...s, next.length - 1]))
      return next
    })
    setShowAddArea(false)
    toast.success(`Oblast "${name}" přidána`)
  }

  const handleConfirmAreas = async () => {
    setStep('generating')
    try {
      const confirmed = suggestedAreas.filter((_, i) => selectedAreas.has(i))
      const { data: { user } } = await supabase.auth.getUser()
      const { data: company, error } = await supabase.from('companies').insert({
        user_id: user!.id, name: formData.name, industry: formData.industry,
        size: formData.size, description: formData.description,
        identified_areas: confirmed, areas_confirmed: true
      }).select().single()
      if (error) throw error

      await supabase.from('process_areas').insert(confirmed.map((area, i) => ({
        company_id: company.id, name: area.name, description: area.description,
        icon: area.icon, color: area.color, sort_order: i
      })))

      const res = await fetch('/api/ai/generate-processes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, areas: confirmed })
      })
      const procData = await res.json()
      if (!res.ok) throw new Error(procData.error)

      const { data: dbAreas } = await supabase.from('process_areas').select('id, name').eq('company_id', company.id)
      const areaMap = Object.fromEntries((dbAreas || []).map((a: any) => [a.name, a.id]))

      if (procData.processes?.length) {
        await supabase.from('processes').insert(procData.processes.map((p: any) => ({
          company_id: company.id, area_id: areaMap[p.area] || null,
          title: p.title, structured_steps: p.steps, status: 'structured'
        })))
      }

      toast.success('Firma vytvořena!')
      router.push(`/companies/${company.id}/mindmap`)
    } catch (err: any) {
      toast.error(err.message)
      setStep('areas')
    }
  }

  return (
    <div style={{ padding: '48px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '40px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
          <a href="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>Dashboard</a> / Nová firma
        </p>
        <h1 style={{ fontSize: '32px' }}>Přidat firmu</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>AI analyzuje firmu a navrhne oblasti a procesy</p>
      </div>

      {step === 'form' && (
        <form onSubmit={handleAnalyze} className="glass" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label className="label">Název firmy *</label>
            <input className="input" placeholder="Např. Talkey s.r.o." value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="label">Odvětví</label>
              <select className="input" value={formData.industry} onChange={e => setFormData(p => ({ ...p, industry: e.target.value }))} style={{ cursor: 'pointer' }}>
                <option value="">Vybrat...</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Počet zaměstnanců</label>
              <select className="input" value={formData.size} onChange={e => setFormData(p => ({ ...p, size: e.target.value }))} style={{ cursor: 'pointer' }}>
                <option value="">Vybrat...</option>
                {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Popis firmy nebo URL webu *</label>
            <div style={{ position: 'relative' }}>
              <textarea className="input" rows={5}
                placeholder="Popiš co firma dělá... nebo vlož URL webu (https://...) a klikni Načíst web"
                value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                required style={{ minHeight: '140px', paddingRight: formData.description.startsWith('http') ? '120px' : '14px' }} />
              {formData.description.startsWith('http') && (
                <button type="button" onClick={handleFetchUrl} disabled={fetchingUrl}
                  style={{ position: 'absolute', right: '10px', top: '10px', padding: '6px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  {fetchingUrl ? '...' : '🌐 Načíst web'}
                </button>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px' }}>
              Tip: Vlož URL webu firmy a AI automaticky načte a analyzuje obsah
            </p>
          </div>
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '12px 28px' }}>
            Analyzovat s AI →
          </button>
        </form>
      )}

      {step === 'loading' && (
        <div className="glass" style={{ padding: '80px', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 20px', width: '32px', height: '32px' }} />
          <h3 style={{ marginBottom: '8px' }}>AI analyzuje firmu...</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Identifikujeme odvětví, segment a klíčové oblasti</p>
        </div>
      )}

      {step === 'areas' && (
        <div>
          <div className="glass" style={{ padding: '24px', marginBottom: '24px', borderLeft: '3px solid var(--accent)' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>AI analýza</p>
            <p style={{ fontSize: '15px' }}>{businessSummary}</p>
          </div>

          <div className="glass" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Navržené oblasti</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
              Vyber oblasti které chceš zpracovat — AI pak vygeneruje procesy pro každou z nich
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              {suggestedAreas.map((area, i) => (
                <div key={i} onClick={() => setSelectedAreas(prev => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next })}
                  style={{ padding: '16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: `2px solid ${selectedAreas.has(i) ? area.color : 'var(--border)'}`, background: selectedAreas.has(i) ? `${area.color}15` : 'var(--bg3)', transition: 'all 0.15s', position: 'relative' }}>
                  {!['area-0','area-1'].includes(`area-${i}`) && suggestedAreas.length > 1 && (
                    <button onClick={e => { e.stopPropagation(); setSuggestedAreas(prev => { const next = prev.filter((_, idx) => idx !== i); setSelectedAreas(s => { const ns = new Set<number>(); s.forEach(v => { if (v < i) ns.add(v); else if (v > i) ns.add(v - 1) }); return ns }); return next }) }}
                      style={{ position: 'absolute', top: '6px', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: '16px', lineHeight: 1 }}>×</button>
                  )}
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{area.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', color: selectedAreas.has(i) ? area.color : 'var(--text)' }}>{area.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{area.description}</div>
                </div>
              ))}

              {/* Add area button */}
              <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100px', gap: '8px' }}>
                {showAddArea ? (
                  <div style={{ width: '100%' }}>
                    <select className="input" style={{ marginBottom: '8px', fontSize: '12px', padding: '6px 10px' }}
                      onChange={e => { if (e.target.value) handleAddFromDropdown(e.target.value) }} defaultValue="">
                      <option value="">Vybrat oblast...</option>
                      {EXTRA_AREAS.filter(a => !suggestedAreas.find(s => s.name === a)).map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input className="input" placeholder="Nebo vlastní název..." value={customAreaName}
                        onChange={e => setCustomAreaName(e.target.value)} style={{ fontSize: '12px', padding: '6px 10px' }}
                        onKeyDown={e => e.key === 'Enter' && handleAddCustomArea()} />
                      <button onClick={handleAddCustomArea} className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '12px', flexShrink: 0 }}>+</button>
                    </div>
                    <button onClick={() => setShowAddArea(false)} style={{ marginTop: '6px', background: 'none', border: 'none', fontSize: '12px', color: 'var(--text-dim)', cursor: 'pointer' }}>Zrušit</button>
                  </div>
                ) : (
                  <button onClick={() => setShowAddArea(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '24px' }}>+</span>
                    <span>Přidat oblast</span>
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleConfirmAreas} className="btn btn-primary" disabled={selectedAreas.size === 0} style={{ padding: '12px 28px' }}>
                Potvrdit a generovat procesy →
              </button>
              <button onClick={() => setStep('form')} className="btn btn-ghost">← Zpět</button>
            </div>
          </div>
        </div>
      )}

      {step === 'generating' && (
        <div className="glass" style={{ padding: '80px', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 20px', width: '32px', height: '32px' }} />
          <h3 style={{ marginBottom: '8px' }}>Generuji procesy...</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>AI vytváří krok-za-krokem procesy. Moment...</p>
        </div>
      )}
    </div>
  )
}
