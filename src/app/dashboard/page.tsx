import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name, industry, description, areas_confirmed, created_at')
    .order('created_at', { ascending: false })

  const { count: processCount } = await supabase
    .from('processes')
    .select('*', { count: 'exact', head: true })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Dobré ráno' : hour < 18 ? 'Dobrý den' : 'Dobrý večer'
  const name = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0]

  return (
    <div style={{ padding: '52px 48px', maxWidth: '1100px' }}>
      <div style={{ marginBottom: '52px' }}>
        <p style={{ color: 'var(--text-dim)', fontSize: '13px', letterSpacing: '0.04em', marginBottom: '10px', textTransform: 'uppercase', fontWeight: 500 }}>{greeting}</p>
        <h1 style={{ fontSize: '42px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '10px' }}>{name} 👋</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>Tady máš přehled všech firem a procesů.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '52px' }}>
        <StatCard label="Sledované firmy" value={companies?.length ?? 0} color="var(--accent)" icon="◈" />
        <StatCard label="Procesů zmapováno" value={processCount ?? 0} color="var(--teal)" icon="▸" />
        <StatCard label="Mind map" value={companies?.filter(c => c.areas_confirmed).length ?? 0} color="var(--amber)" icon="⬡" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700 }}>Moje firmy</h2>
        <Link href="/companies/new" className="btn btn-primary" style={{ padding: '9px 18px', fontSize: '13px' }}>+ Přidat firmu</Link>
      </div>

      {!companies?.length ? (
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '80px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: '52px', marginBottom: '20px', opacity: 0.25 }}>◈</div>
          <h3 style={{ fontSize: '22px', marginBottom: '10px' }}>Ještě žádné firmy</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '28px', fontSize: '15px' }}>Přidej první firmu — AI ji analyzuje a vygeneruje procesy.</p>
          <Link href="/companies/new" className="btn btn-primary" style={{ padding: '12px 28px' }}>Začít s první firmou →</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {companies.map(c => (
            <Link key={c.id} href={`/companies/${c.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '24px', minHeight: '170px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: 700 }}>{c.name}</h3>
                  {c.areas_confirmed ? <span className="badge badge-green">✓ Aktivní</span> : <span className="badge badge-amber">Draft</span>}
                </div>
                {c.industry && <p style={{ color: 'var(--accent)', fontSize: '12px', fontWeight: 500 }}>{c.industry}</p>}
                {c.description && <p style={{ color: 'var(--text-dim)', fontSize: '13px', flex: 1 }}>{c.description.slice(0, 100)}{c.description.length > 100 ? '...' : ''}</p>}
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: 'auto' }}>{new Date(c.created_at).toLocaleDateString('cs', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </Link>
          ))}
          <Link href="/companies/new" style={{ textDecoration: 'none', borderRadius: 'var(--radius)', border: '2px dashed var(--border)', minHeight: '170px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--text-dim)', fontSize: '14px', fontWeight: 500 }}>
            <span style={{ fontSize: '28px' }}>+</span>
            <span>Přidat firmu</span>
          </Link>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '28px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: color }} />
      <div style={{ fontSize: '44px', fontFamily: 'var(--font-display)', fontWeight: 800, color, lineHeight: 1, marginBottom: '8px' }}>{value}</div>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
    </div>
  )
}
