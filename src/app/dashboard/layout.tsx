import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .order('created_at', { ascending: true })

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar companies={companies || []} />
      <main className="main-content">{children}</main>
    </div>
  )
}
