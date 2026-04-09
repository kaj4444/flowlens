'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { IdentifiedArea } from '@/types'

const SIZES = ['1–10', '11–50', '51–200', '200+']
const INDUSTRIES = [
  'Výroba', 'Logistika a doprava', 'Obchod – produkt', 'Obchod – služba',
  'IT a technologie', 'Konzultace a poradenství', 'Stavebnictví',
  'Zdravotnictví', 'Finance a pojišťovnictví', 'Vzdělávání', 'Jiné'
]

export default function NewCompanyPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<'form' | 'loading' | 'areas' | 'generating'>('form')
  const [formData, setFormData] = useState({ name: '', industry: '', size: '', description: '' })
  const [suggestedAreas, setSuggestedAreas] = useState<IdentifiedArea[]>([])
  const [selectedAreas, setSelectedAreas] = useState<Set<number>>(new Set())
  const [businessSummary, setBusinessSummary] = useState('')
  const [companyId, setCompanyId] = useState<string | null>(null)

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

  const handleConfirmAreas = async () => {
    setStep('generating')
    try {
      const confirmed = suggestedAreas.filter((_, i) => selectedAreas.has(i))

      // Save company to DB
      const { data: { user } } = await supabase.auth.getUser()
      const { data: company, error } = await supabase.from('companies').insert({
        user_id: user!.id,
        name: formData.name,
        industry: formData.industry,
        size: formData.size,
        description: formData.description,
        identified_areas: confirmed,
        areas_confirmed: true
      }).select().single()

      if (error) throw error
      setCompanyId(company.id)

      // Save areas
      await supabase.from('process_areas').insert(
        confirmed.map((area, i) => ({
          company_id: company.id,
          name: area.name,
          description: area.description,
          icon: area.icon,
          color: area.color,
          sort_order: i
        }))
      )

      // Generate processes via AI
      const res = await fetch('/api/ai/generate-processes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, areas: confirmed })
      })
      const procData = await res.json()
      if (!res.ok) throw new Error(procData.error)

      // Get area IDs
      const { data: dbAreas } = await supabase.from('process_areas').select('id, name').eq('company_id', company.id)
      const areaMap = Object.fromEntries((dbAreas || []).map((a: any) => [a.name, a.id]))

      // Save processes
      if (procData.processes?.length) {
        await supabase.from('processes').insert(
          procData.processes.map((p: any) => ({
            company_id: company.id,
            area_id: areaMap[p.area] || null,
            title: p.title,
            structured_steps: p.steps,
            status: 'structured'
          }))
        )
      }

      toast.success('Firma a procesy úspěšně vytvořeny!')
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
          <a href="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>Dashboard</a>
          {' / '}Nová firma
        </p>
        <h1 style={{ fontSize: '32px' }}>Přidat firmu</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
          AI analyzuje firmu a navrhne oblasti a procesy
        </p>
      </div>

      {step === 'form' && (
        <form onSubmit={handleAnalyze} className="glass" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label className="label">Název firmy *</label>
            <input className="input" placeholder="Např. Riscare s.r.o." value={formData.name}
              onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="label">Odvětví</label>
              <select className="input" value={formData.industry}
                onChange={e => setFormData(p => ({ ...p, industry: e.target.value }))}
                style={{ cursor: 'pointer' }}>
                <option value="">Vybrat...</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Počet zaměstnanců</label>
              <select className="input" value={formData.size}
                onChange={e => setFormData(p => ({ ...p, size: e.target.value }))}
                style={{ cursor: 'pointer' }}>
                <option value="">Vybrat...</option>
                {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Popis firmy a byznysu *</label>
            <textarea className="input" rows={5}
              placeholder="Popiš co firma dělá, jak funguje, co prodává, kdo jsou zákazníci, jak vypadá typická zakázka od poptávky po dodání..."
              value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              required style={{ minHeight: '140px' }} />
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', marginBottom: '32px' }}>
              {suggestedAreas.map((area, i) => (
                <div key={i} onClick={() => setSelectedAreas(prev => {
                  const next = new Set(prev)
                  next.has(i) ? next.delete(i) : next.add(i)
                  return next
                })} style={{
                  padding: '16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  border: `2px solid ${selectedAreas.has(i) ? area.color : 'var(--border)'}`,
                  background: selectedAreas.has(i) ? `${area.color}15` : 'var(--bg3)',
                  transition: 'all 0.15s'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{area.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', color: selectedAreas.has(i) ? area.color : 'var(--text)' }}>
                    {area.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{area.description}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleConfirmAreas} className="btn btn-primary" disabled={selectedAreas.size === 0}
                style={{ padding: '12px 28px' }}>
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
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            AI vytváří krok-za-krokem procesy pro každou oblast. Moment...
          </p>
        </div>
      )}
    </div>
  )
}
