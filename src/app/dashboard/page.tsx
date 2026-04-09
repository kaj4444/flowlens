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
      {/* Header */}
      <div style={{ marginBottom: '52px' }}>
        <p style={{ color: 'var(--text-dim)', fontSize: '13px', letterSpacing: '0.04em', marginBottom: '10px', textTransform: 'uppercase', fontWeight: 500 }}>
          {greeting}
        </p>
        <h1 style={{ fontSize: '42px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '10px' }}>
          {name} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
          Tady máš přehled všech firem a procesů.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '52px' }}>
        <StatCard label="Sledované firmy" value={companies?.length ?? 0} color="var(--accent)" icon="◈" />
        <StatCard label="Procesů zmapováno" value={processCount ?? 0} color="var(--teal)" icon="▸" />
        <StatCard label="Mind map" value={companies?.filter(c => c.areas_confirmed).length ?? 0} color="var(--amber)" icon="⬡" />
      </div>

      {/* Companies */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700 }}>Moje firmy</h2>
        <Link href="/companies/new" className="btn btn-primary" style={{ padding: '9px 18px', fontSize: '13px' }}>
          + Přidat firmu
        </Link>
      </div>

      {!companies?.length ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {companies.map(c => <CompanyCard key={c.id} company={c} />)}
          <AddCompanyCard />
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--radius)',
      border: '1px solid var(--border)', padding: '28px 24px',
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: color, opacity: 0.8 }} />
      <div style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '28px', opacity: 0.08, color }}>{icon}</div>
      <div style={{ fontSize: '44px', fontFamily: 'var(--font-display)', fontWeight: 800, color, lineHeight: 1, marginBottom: '8px' }}>
        {value}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
    </div>
  )
}

function CompanyCard({ company }: { company: any }) {
  return (
    <Link href={`/companies/${company.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius)',
        border: '1px solid var(--border)', padding: '24px',
        cursor: 'pointer', minHeight: '170px', display: 'flex', flexDirection: 'column',
        transition: 'border-color 0.15s, transform 0.15s',
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'
          ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
          ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, lineHeight: 1.2 }}>{company.name}</h3>
          {company.areas_confirmed
            ? <span className="badge badge-green">✓ Aktivní</span>
            : <span className="badge badge-amber">Draft</span>}
        </div>
        {company.industry && (
          <p style={{ color: 'var(--accent-light)', fontSize: '12px', fontWeight: 500, marginBottom: '8px' }}>{company.industry}</p>
        )}
        {company.description && (
          <p style={{ color: 'var(--text-dim)', fontSize: '13px', lineHeight: 1.5, flex: 1,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any }}>
            {company.description}
          </p>
        )}
        <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-dim)' }}>
          Přidáno {new Date(company.created_at).toLocaleDateString('cs', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
    </Link>
  )
}

function AddCompanyCard() {
  return (
    <Link href="/companies/new" style={{ textDecoration: 'none' }}>
      <div style={{
        borderRadius: 'var(--radius)', border: '2px dashed var(--border)',
        minHeight: '170px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '10px',
        cursor: 'pointer', color: 'var(--text-dim)',
        transition: 'border-color 0.15s, color 0.15s'
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'
          ;(e.currentTarget as HTMLElement).style.color = 'var(--accent-light)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
          ;(e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'
        }}
      >
        <span style={{ fontSize: '28px', lineHeight: 1 }}>+</span>
        <span style={{ fontSize: '14px', fontWeight: 500 }}>Přidat firmu</span>
      </div>
    </Link>
  )
}

function EmptyState() {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--radius)',
      border: '1px solid var(--border)', padding: '80px 40px', textAlign: 'center'
    }}>
      <div style={{ fontSize: '52px', marginBottom: '20px', opacity: 0.25 }}>◈</div>
      <h3 style={{ fontSize: '22px', marginBottom: '10px' }}>Ještě žádné firmy</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '28px', fontSize: '15px', maxWidth: '360px', margin: '0 auto 28px' }}>
        Přidej první firmu — AI ji analyzuje, navrhne oblasti a vygeneruje procesy.
      </p>
      <Link href="/companies/new" className="btn btn-primary" style={{ padding: '12px 28px' }}>
        Začít s první firmou →
      </Link>
    </div>
  )
}
