import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ProcessClient from './ProcessClient'

export default async function ProcessesPage({ params, searchParams }: {
  params: Promise<{ companyId: string }>
  searchParams: Promise<{ area?: string }>
}) {
  const { companyId } = await params
  const { area: areaFilter } = await searchParams
  const supabase = await createClient()

  const { data: company } = await supabase.from('companies').select('name').eq('id', companyId).single()
  const { data: areas } = await supabase.from('process_areas').select('*').eq('company_id', companyId).order('sort_order')
  const { data: processes } = await supabase.from('processes').select('*, process_areas(name, color, icon)').eq('company_id', companyId).order('created_at')

  return (
    <div style={{ padding: '48px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '40px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
          <Link href="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>Dashboard</Link>
          {' / '}
          <Link href={`/companies/${companyId}`} style={{ color: 'inherit', textDecoration: 'none' }}>{company?.name}</Link>
          {' / '}Procesy
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: '32px' }}>Procesy</h1>
          <Link href={`/companies/${companyId}/mindmap`} className="btn btn-primary">Zobrazit mind mapu →</Link>
        </div>
      </div>
      <ProcessClient companyId={companyId} areas={areas || []} processes={processes || []} initialAreaFilter={areaFilter} />
    </div>
  )
}
