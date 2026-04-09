import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function CompaniesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')
  const { data: companies } = await supabase.from('companies').select('*').order('created_at', { ascending: false })

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar companies={companies || []} />
      <main className="main-content" style={{ padding: '48px', maxWidth: '1100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '32px', marginBottom: '6px' }}>Firmy</h1>
            <p style={{ color: 'var(--text-muted)' }}>Správa všech firem a jejich procesů</p>
          </div>
          <Link href="/companies/new" className="btn btn-primary">+ Přidat firmu</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {companies?.map((c: any) => (
            <Link key={c.id} href={`/companies/${c.id}`} style={{ textDecoration: 'none' }}>
              <div className="glass" style={{ padding: '24px', cursor: 'pointer', minHeight: '140px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h3 style={{ fontSize: '17px' }}>{c.name}</h3>
                {c.industry && <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{c.industry}</p>}
                {c.description && <p style={{ color: 'var(--text-dim)', fontSize: '13px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.description}</p>}
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: 'auto' }}>
                  {new Date(c.created_at).toLocaleDateString('cs')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
