import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function CompanyPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params
  const supabase = await createClient()

  const { data: company } = await supabase.from('companies').select('*').eq('id', companyId).single()
  if (!company) notFound()

  const { data: areas } = await supabase
    .from('process_areas')
    .select('id, name, description, icon, color, sort_order')
    .eq('company_id', companyId)
    .order('sort_order')

  const { data: processes } = await supabase
    .from('processes')
    .select('id, title, status, area_id')
    .eq('company_id', companyId)

  const { data: nodeCount } = await supabase
    .from('mindmap_nodes')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)

  return (
    <div style={{ padding: '52px 48px', maxWidth: '1100px' }}>
      {/* Breadcrumb + header */}
      <div style={{ marginBottom: '44px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '14px' }}>
          <Link href="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>Dashboard</Link>
          <span style={{ margin: '0 8px', opacity: 0.4 }}>/</span>
          <span>{company.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h1 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.02em' }}>{company.name}</h1>
              {company.areas_confirmed
                ? <span className="badge badge-green">✓ Aktivní</span>
                : <span className="badge badge-amber">Nastavení</span>}
            </div>
            {company.industry && (
              <p style={{ color: 'var(--accent-light)', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                {company.industry}{company.size ? ` · ${company.size} zaměstnanců` : ''}
              </p>
            )}
            {company.description && (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '580px', lineHeight: 1.6 }}>{company.description}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            <Link href={`/companies/${companyId}/processes`} className="btn btn-ghost" style={{ fontSize: '14px' }}>
              Procesy
            </Link>
            <Link href={`/companies/${companyId}/mindmap`} className="btn btn-primary" style={{ fontSize: '14px' }}>
              Mind mapa →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '44px' }}>
        {[
          { label: 'Oblasti', value: areas?.length ?? 0, color: 'var(--accent)' },
          { label: 'Procesy', value: processes?.length ?? 0, color: 'var(--teal)' },
          { label: 'Strukturované', value: processes?.filter(p => p.status === 'structured').length ?? 0, color: 'var(--green)' },
          { label: 'Uzlů v mapě', value: (nodeCount as any)?.count ?? 0, color: 'var(--amber)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '20px 18px' }}>
            <div style={{ fontSize: '32px', fontFamily: 'var(--font-display)', fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: '6px' }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Areas grid */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Procesní oblasti</h2>
        <Link href={`/companies/${companyId}/processes`} style={{ fontSize: '13px', color: 'var(--accent-light)', textDecoration: 'none' }}>
          Zobrazit všechny procesy →
        </Link>
      </div>

      {areas?.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '14px', marginBottom: '44px' }}>
          {areas.map(area => {
            const areaProcesses = processes?.filter(p => p.area_id === area.id) ?? []
            const structured = areaProcesses.filter(p => p.status === 'structured').length
            return (
              <Link key={area.id} href={`/companies/${companyId}/processes?area=${area.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--surface)', borderRadius: 'var(--radius)',
                  border: `1px solid ${area.color}30`,
                  borderTop: `3px solid ${area.color}`,
                  padding: '20px', cursor: 'pointer',
                  transition: 'border-color 0.15s, transform 0.15s'
                }}>
                  <div style={{ fontSize: '26px', marginBottom: '10px' }}>{area.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: area.color, marginBottom: '6px' }}>{area.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.4 }}>{area.description}</div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-dim)' }}>▸ {areaProcesses.length} procesů</span>
                    {structured > 0 && <span style={{ color: 'var(--green)' }}>✓ {structured} hotovo</span>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '40px', textAlign: 'center', marginBottom: '44px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Žádné oblasti — přidej firmu znovu přes AI flow</p>
        </div>
      )}

      {/* Recent processes */}
      {processes && processes.length > 0 && (
        <>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Poslední procesy</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {processes.slice(0, 5).map(p => {
              const area = areas?.find(a => a.id === p.area_id)
              return (
                <div key={p.id} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '14px 18px',
                  display: 'flex', alignItems: 'center', gap: '14px'
                }}>
                  {area && <span style={{ fontSize: '16px' }}>{area.icon}</span>}
                  <span style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>{p.title}</span>
                  {area && <span style={{ fontSize: '12px', color: area.color }}>{area.name}</span>}
                  <span className={`badge ${p.status === 'structured' ? 'badge-green' : 'badge-amber'}`}>
                    {p.status === 'structured' ? '✓ Strukturovaný' : 'Draft'}
                  </span>
                </div>
              )
            })}
            {processes.length > 5 && (
              <Link href={`/companies/${companyId}/processes`} style={{ fontSize: '13px', color: 'var(--accent-light)', textDecoration: 'none', textAlign: 'center', padding: '8px' }}>
                Zobrazit všech {processes.length} procesů →
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  )
}
