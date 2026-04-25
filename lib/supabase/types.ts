export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type IntakeStatus = 'pending' | 'in_progress' | 'complete'
export type FileType = 'photo' | 'pdf'

export type IntakeSectionKey = 'section_a' | 'section_b' | 'section_c' | 'section_d' | 'section_e'

export type AcordQuestionKey =
  | 'a_business_name'
  | 'a_entity_type'
  | 'a_fein'
  | 'a_date_started'
  | 'a_website'
  | 'a_phone'
  | 'a_contact_name'
  | 'a_contact_email'
  | 'b_address'
  | 'b_ownership'
  | 'b_landlord'
  | 'b_total_sqft'
  | 'b_occupied_sqft'
  | 'b_public_sqft'
  | 'b_sublease'
  | 'b_annual_revenue'
  | 'b_fulltime_employees'
  | 'b_parttime_employees'
  | 'b_operations'
  | 'c_subsidiary'
  | 'c_safety_manual'
  | 'c_hazardous_materials'
  | 'c_other_insurance'
  | 'c_prior_cancellation'
  | 'c_discrimination_claims'
  | 'c_arson'
  | 'c_code_violations'
  | 'c_bankruptcy'
  | 'c_judgements'
  | 'c_trust'
  | 'c_foreign_operations'
  | 'c_other_ventures'
  | 'c_drones'
  | 'd_roof_age'
  | 'd_roof_inspection'
  | 'd_electrical_panel'
  | 'd_electrical_photo'
  | 'd_sprinklers'
  | 'd_sprinkler_certificate'
  | 'd_alarm_system'
  | 'd_alarm_contract'
  | 'd_fire_extinguishers'
  | 'd_extinguisher_photo'
  | 'e_prior_carrier'
  | 'e_prior_policy_number'
  | 'e_prior_policy_dates'
  | 'e_prior_premium'
  | 'e_claims'
  | 'e_claims_detail'

export type IntakeAnswers = Partial<Record<AcordQuestionKey, Json>>

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
  section_a: IntakeAnswers
  section_b: IntakeAnswers
  section_c: IntakeAnswers
  section_d: IntakeAnswers
  section_e: IntakeAnswers
  current_question_key: AcordQuestionKey | null
  conversation_history: Json[]
  updated_at: string
}

export interface ClientWithIntake extends Client {
  intake_data: IntakeData[]
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

export interface ScoreDimensionDetail {
  points: number
  max: number
  explanation: string
  filled?: number
  total?: number
  signals?: string[]
  recommendations?: string[]
  items?: string[]
}

export interface ScoreDetails {
  documentation?: ScoreDimensionDetail
  safety?: ScoreDimensionDetail
  property?: ScoreDimensionDetail
  claims?: ScoreDimensionDetail
  neighborhood?: ScoreDimensionDetail
  [key: string]: Json | ScoreDimensionDetail | undefined
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
  score_details: ScoreDetails
  calculated_at: string
}

export interface Database {
  public: {
    Tables: {
      brokers: {
        Row: Broker
        Insert: {
          id: string
          name: string
          email: string
          created_at?: string
        }
        Update: Partial<Omit<Broker, 'id' | 'created_at'>>
      }
      clients: {
        Row: Client
        Insert: {
          id?: string
          broker_id: string
          business_name: string
          owner_name: string
          owner_contact?: string | null
          telegram_chat_id?: number | null
          intake_token: string
          intake_status?: IntakeStatus
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Client, 'id' | 'broker_id' | 'created_at'>>
      }
      intake_data: {
        Row: IntakeData
        Insert: {
          id?: string
          client_id: string
          section_a?: IntakeAnswers
          section_b?: IntakeAnswers
          section_c?: IntakeAnswers
          section_d?: IntakeAnswers
          section_e?: IntakeAnswers
          current_question_key?: string | null
          conversation_history?: Json[]
          updated_at?: string
        }
        Update: Partial<Omit<IntakeData, 'id' | 'client_id'>> & { current_question_key?: string | null }
      }
      uploads: {
        Row: Upload
        Insert: {
          id?: string
          client_id: string
          storage_path: string
          file_name: string
          file_type: FileType
          label?: string | null
          telegram_file_id?: string | null
          uploaded_at?: string
        }
        Update: Partial<Omit<Upload, 'id' | 'client_id'>>
      }
      readiness_scores: {
        Row: ReadinessScore
        Insert: {
          id?: string
          client_id: string
          total_score: number
          documentation_score: number
          safety_score: number
          property_score: number
          claims_score: number
          neighborhood_score: number
          score_details?: ScoreDetails
          calculated_at?: string
        }
        Update: Partial<Omit<ReadinessScore, 'id' | 'client_id'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export const CLIENT_UPLOADS_BUCKET = 'client-uploads' as const

// Use this object name with supabase.storage.from(CLIENT_UPLOADS_BUCKET).
export function getClientUploadObjectName(params: {
  clientId: string
  questionKey: AcordQuestionKey
  uploadId: string
  safeFileName: string
}) {
  const { clientId, questionKey, uploadId, safeFileName } = params
  return `${clientId}/${questionKey}/${uploadId}-${safeFileName}`
}

// Store this full path in uploads.storage_path for dashboard/PDF display.
export function getClientUploadStoragePath(params: {
  clientId: string
  questionKey: AcordQuestionKey
  uploadId: string
  safeFileName: string
}) {
  return `${CLIENT_UPLOADS_BUCKET}/${getClientUploadObjectName(params)}`
}
