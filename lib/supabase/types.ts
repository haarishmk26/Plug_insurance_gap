export type IntakeStatus = 'pending' | 'in_progress' | 'complete'
export type FileType = 'photo' | 'pdf'

export interface Broker {
  id: string
  name: string
  email: string
  created_at: string
}

export interface Client {
  id: string
  broker_id: string
  business_name: string
  owner_name: string
  owner_contact: string | null
  telegram_chat_id: number | null
  intake_token: string
  intake_status: IntakeStatus
  created_at: string
  updated_at: string
}

export interface IntakeData {
  id: string
  client_id: string
  section_a: Record<string, unknown>
  section_b: Record<string, unknown>
  section_c: Record<string, unknown>
  section_d: Record<string, unknown>
  section_e: Record<string, unknown>
  current_question_key: string | null
  updated_at: string
}

export interface Upload {
  id: string
  client_id: string
  storage_path: string
  file_name: string
  file_type: FileType
  label: string | null
  telegram_file_id: string | null
  uploaded_at: string
}

export interface ReadinessScore {
  id: string
  client_id: string
  total_score: number
  documentation_score: number
  safety_score: number
  property_score: number
  claims_score: number
  neighborhood_score: number
  score_details: Record<string, unknown>
  calculated_at: string
}
