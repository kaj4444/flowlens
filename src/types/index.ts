export interface Profile {
  id: string
  email: string
  full_name: string | null
  is_admin: boolean
  created_at: string
}

export interface Company {
  id: string
  user_id: string
  name: string
  industry: string | null
  segment: string | null
  size: string | null
  description: string | null
  identified_areas: IdentifiedArea[]
  areas_confirmed: boolean
  created_at: string
  updated_at: string
}

export interface IdentifiedArea {
  name: string
  description: string
  icon: string
  color: string
}

export interface ProcessArea {
  id: string
  company_id: string
  name: string
  description: string | null
  icon: string | null
  color: string
  sort_order: number
  created_at: string
}

export interface ProcessStep {
  id: string
  title: string
  description: string
  responsible?: string
  tools?: string[]
  duration?: string
}

export interface Process {
  id: string
  company_id: string
  area_id: string | null
  title: string
  raw_description: string | null
  structured_steps: ProcessStep[]
  status: 'draft' | 'structured' | 'mapped'
  created_at: string
  updated_at: string
  area?: ProcessArea
}

export interface MindmapNode {
  id: string
  company_id: string
  node_id: string
  type: 'default' | 'area' | 'process' | 'step' | 'note'
  label: string
  content: string | null
  position_x: number
  position_y: number
  color: string
  tag: string | null
  parent_node_id: string | null
  created_at: string
}

export interface MindmapEdge {
  id: string
  company_id: string
  edge_id: string
  source_node_id: string
  target_node_id: string
  label: string | null
  created_at: string
}

export interface NodeComment {
  id: string
  node_id: string
  company_id: string
  user_id: string
  content: string
  created_at: string
}

export interface ShareLink {
  id: string
  company_id: string
  token: string
  expires_at: string | null
  created_at: string
}

// AI API types
export interface AIAreaSuggestion {
  areas: IdentifiedArea[]
  business_type: string
  summary: string
}

export interface AIProcessGeneration {
  processes: {
    area: string
    title: string
    steps: ProcessStep[]
  }[]
}
