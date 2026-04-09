import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ShareMindmapView from './ShareMindmapView'

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data: link } = await supabase
    .from('share_links')
    .select('*, companies(id, name, industry, description)')
    .eq('token', token)
    .single()

  if (!link) notFound()

  const company = (link as any).companies
  const { data: nodes } = await supabase.from('mindmap_nodes').select('*').eq('company_id', company.id)
  const { data: edges } = await supabase.from('mindmap_edges').select('*').eq('company_id', company.id)

  return <ShareMindmapView company={company} nodes={nodes || []} edges={edges || []} />
}
