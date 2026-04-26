import { calculateScore } from '../score/engine'
import type { Client, IntakeData, ReadinessScore } from '../supabase/types'

export const AI_EVIDENCE_REVIEWS = [
  {
    id: 'electrical-panel',
    label: 'Electrical panel photo',
    fileName: 'electrical-panel-photo.jpg',
    fileType: 'photo',
    imagePath: '/evidence/electrical-panel.jpg',
    aiResult: 'AI read: modern circuit breaker panel, no visible corrosion, panel directory present.',
    mappedAnswer: 'Electrical panel upgraded in 2019; photo accepted for property-condition score.',
    sourceLabel: 'Wikimedia Commons: Electrical panel opened.jpg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Electrical_panel_opened.jpg',
    license: 'CC BY-SA 4.0',
  },
  {
    id: 'fire-extinguisher',
    label: 'Fire extinguisher photo',
    fileName: 'fire-extinguisher-photo.jpg',
    fileType: 'photo',
    imagePath: '/evidence/fire-extinguisher.jpg',
    aiResult: 'AI read: wall-mounted fire extinguisher is present and accessible.',
    mappedAnswer: 'Fire extinguisher presence confirmed; inspection follow-up can be requested if the tag is not readable.',
    sourceLabel: 'Wikimedia Commons: Fire Extinguisher.JPG',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Fire_Extinguisher.JPG',
    license: 'Public domain',
  },
  {
    id: 'sprinkler-head',
    label: 'Sprinkler head photo',
    fileName: 'fire-sprinkler-photo.jpg',
    fileType: 'photo',
    imagePath: '/evidence/fire-sprinkler.jpg',
    aiResult: 'AI read: visible ceiling fire sprinkler head is installed in the premises.',
    mappedAnswer: 'Sprinkler system presence confirmed; current inspection certificate remains stored as supporting documentation.',
    sourceLabel: 'Wikimedia Commons: Fire Sprinkler.jpg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Fire_Sprinkler.jpg',
    license: 'CC BY-SA 3.0',
  },
  {
    id: 'alarm-panel',
    label: 'Alarm panel photo',
    fileName: 'alarm-panel-photo.jpg',
    fileType: 'photo',
    imagePath: '/evidence/alarm-panel.jpg',
    aiResult: 'AI read: installed security alarm control panel is visible on site.',
    mappedAnswer: 'Alarm system presence confirmed; active monitoring contract remains stored as supporting documentation.',
    sourceLabel: 'Wikimedia Commons: Menvier TS690 Security Alarm Panel.jpg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Menvier_TS690_Security_Alarm_Panel.jpg',
    license: 'CC BY-SA 4.0',
  },
] as const

export const DEMO_INTAKE_SECTIONS = {
  section_a: {
    a_business_name: 'Golden Gate Deli',
    a_entity_type: 'LLC',
    a_fein: '12-3456789',
    a_date_started: '2018',
    a_website: 'https://goldengatedeli.example',
    a_phone: '+1 415 555 0100',
    a_contact_name: 'Maria Santos',
    a_contact_email: 'maria@goldengatedeli.example',
  },
  section_b: {
    b_address: '123 Market St, San Francisco, CA 94103',
    b_ownership: 'Tenant',
    b_landlord: 'Market Street Properties LLC',
    b_total_sqft: 2400,
    b_occupied_sqft: 1800,
    b_public_sqft: 950,
    b_sublease: 'no',
    b_annual_revenue: 875000,
    b_fulltime_employees: 8,
    b_parttime_employees: 4,
    b_operations: 'Neighborhood deli and prepared-food counter serving office workers, residents, and walk-in customers.',
  },
  section_c: {
    c_subsidiary: 'no',
    c_safety_manual: 'yes',
    c_hazardous_materials: 'no',
    c_other_insurance: 'yes',
    c_prior_cancellation: 'no',
    c_discrimination_claims: 'no',
    c_arson: 'no',
    c_code_violations: 'no',
    c_bankruptcy: 'no',
    c_judgements: 'no',
    c_trust: 'no',
    c_foreign_operations: 'no',
    c_other_ventures: 'no',
    c_drones: 'no',
  },
  section_d: {
    d_roof_age: '12 years, flat roof, inspected in 2025',
    d_roof_inspection: '2025 roof inspection report on file',
    d_electrical_panel: '200 amp circuit breaker panel, upgraded in 2019',
    d_electrical_photo: 'electrical-panel-photo.jpg',
    d_sprinklers: 'yes',
    d_sprinkler_certificate: 'sprinkler-certificate-2026.pdf',
    d_alarm_system: 'yes',
    d_alarm_contract: 'central-station-alarm-contract.pdf',
    d_fire_extinguishers: 'yes',
    d_extinguisher_photo: 'fire-extinguisher-tags.jpg',
  },
  section_e: {
    e_prior_carrier: 'Travelers',
    e_prior_policy_number: 'TRV-GL-2025-1001',
    e_prior_policy_dates: '2025-01-01 to 2026-01-01',
    e_prior_premium: 10400,
    e_claims: 'no',
    e_claims_detail: 'No claims in the past five years.',
  },
} as const

export function getDemoIntakeInsert(clientId: string): IntakeData {
  return {
    id: 'demo-intake-preview',
    client_id: clientId,
    ...DEMO_INTAKE_SECTIONS,
    current_question_key: null,
    conversation_history: [
      { role: 'user', text: 'I am ready to complete the insurance intake.' },
      { role: 'model', text: 'Thanks. I have everything needed for the MVP demo dossier.' },
    ],
    updated_at: new Date().toISOString(),
  }
}

export function getDemoReadinessScore(clientId: string): ReadinessScore {
  return {
    id: 'demo-readiness-preview',
    client_id: clientId,
    ...calculateScore(DEMO_INTAKE_SECTIONS),
    calculated_at: new Date().toISOString(),
  }
}

export function isEmptyDemoCandidate(intakeData: IntakeData | null, score: ReadinessScore | null): boolean {
  if (!intakeData || !score) {
    return true
  }

  return ['section_a', 'section_b', 'section_c', 'section_d', 'section_e'].every((sectionKey) => {
    const section = intakeData[sectionKey as keyof Pick<IntakeData, 'section_a' | 'section_b' | 'section_c' | 'section_d' | 'section_e'>]
    return Object.keys(section).length === 0
  })
}

export async function seedDemoIntakeCompletion(supabase: any, client: Client): Promise<{
  client: Client
  intakeData: IntakeData
  score: ReadinessScore
}> {
  const intakeData = getDemoIntakeInsert(client.id)
  const score = getDemoReadinessScore(client.id)

  await supabase
    .from('clients')
    .update({ intake_status: 'complete' })
    .eq('id', client.id)

  await supabase.from('intake_data').upsert(
    {
      client_id: client.id,
      ...DEMO_INTAKE_SECTIONS,
      current_question_key: null,
      conversation_history: [
        { role: 'user', text: 'I am ready to complete the insurance intake.' },
        { role: 'model', text: 'Thanks. I have everything needed for the MVP demo dossier.' },
      ],
    },
    { onConflict: 'client_id' },
  )

  await supabase.from('readiness_scores').upsert(
    {
      client_id: client.id,
      total_score: score.total_score,
      documentation_score: score.documentation_score,
      safety_score: score.safety_score,
      property_score: score.property_score,
      claims_score: score.claims_score,
      neighborhood_score: score.neighborhood_score,
      score_details: score.score_details,
    },
    { onConflict: 'client_id' },
  )

  return {
    client: { ...client, intake_status: 'complete' },
    intakeData,
    score,
  }
}
