import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function CompanyLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ companyId: string }>
}) {
  const { companyId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: companies } = await supabase.from('companies').select('id, name').order('created_at')
  const company = companies?.find((c: any) => c.id === companyId)
  if (!company) notFound()

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar companies={companies || []} currentCompanyId={companyId} />
      <main className="main-content">{children}</main>
    </div>
  )
}
