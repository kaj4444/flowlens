import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import MindmapClient from './MindmapClient'

export default async function MindmapPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params
  const supabase = await createClient()

  const { data: company } = await supabase.from('companies').select('*').eq('id', companyId).single()
  if (!company) notFound()

  const { data: areas } = await supabase.from('process_areas').select('*').eq('company_id', companyId).order('sort_order')
  const { data: processes } = await supabase.from('processes').select('*, process_areas(name, color, icon)').eq('company_id', companyId)
  const { data: savedNodes } = await supabase.from('mindmap_nodes').select('*').eq('company_id', companyId)
  const { data: savedEdges } = await supabase.from('mindmap_edges').select('*').eq('company_id', companyId)
  const { data: comments } = await supabase.from('node_comments').select('*').eq('company_id', companyId)

  return (
    <MindmapClient
      company={company}
      areas={areas || []}
      processes={processes || []}
      savedNodes={savedNodes || []}
      savedEdges={savedEdges || []}
      comments={comments || []}
    />
  )
}
