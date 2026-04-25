import type { IntakeData as SupabaseIntakeData } from '../supabase/types'

export type IntakeData = Pick<
  SupabaseIntakeData,
  'section_a' | 'section_b' | 'section_c' | 'section_d' | 'section_e'
>

export interface ScoreDetail {
  points: number
  max: number
  explanation: string
  filled?: number
  total?: number
  items?: string[]
}

export interface ScoreResult {
  total_score: number
  documentation_score: number
  safety_score: number
  property_score: number
  claims_score: number
  neighborhood_score: number
  score_details: Record<'documentation' | 'safety' | 'property' | 'claims' | 'neighborhood', ScoreDetail>
}

export const ACORD_125_REQUIRED_DOCUMENTATION_KEYS = [
  'a_business_name',
  'a_entity_type',
  'a_fein',
  'a_date_started',
  'a_phone',
  'a_contact_name',
  'a_contact_email',
  'b_address',
  'b_ownership',
  'b_total_sqft',
  'b_occupied_sqft',
  'b_public_sqft',
  'b_annual_revenue',
  'b_fulltime_employees',
  'b_parttime_employees',
  'b_operations',
  'e_prior_carrier',
  'e_prior_policy_number',
  'e_prior_policy_dates',
  'e_prior_premium',
] as const

function answers(data: IntakeData): Record<string, unknown> {
  return {
    ...data.section_a,
    ...data.section_b,
    ...data.section_c,
    ...data.section_d,
    ...data.section_e,
  }
}

function isFilled(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '' && value !== 'skipped'
}

function scoreDocumentation(a: Record<string, unknown>): { score: number; detail: ScoreDetail } {
  // Documentation Completeness: 25 pts. Source: ACORD 125 (2016/03) applicant,
  // premises, and prior carrier fields plus PRD Section 9's underwriting-delay rationale.
  const required = ACORD_125_REQUIRED_DOCUMENTATION_KEYS
  const filled = required.filter((key) => isFilled(a[key])).length
  const score = Math.round((filled / required.length) * 25)

  return {
    score,
    detail: {
      points: score,
      max: 25,
      filled,
      total: required.length,
      explanation:
        `${filled} of ${required.length} required ACORD fields completed. ` +
        'Incomplete submissions are the #1 cause of underwriting delays; a complete submission materially improves placement odds.',
    },
  }
}

function scoreSafety(a: Record<string, unknown>): { score: number; detail: ScoreDetail } {
  let score = 0
  const items: string[] = []

  // Hard gate. Source: ACORD Q8 / PRD Section 8; open fire or safety code violations block submission.
  if (a.c_code_violations === 'yes') {
    return {
      score: 0,
      detail: {
        points: 0,
        max: 25,
        explanation:
          'Open fire/safety code violation detected (ACORD Q8). This blocks submission until corrected; it is a hard underwriting gate.',
      },
    }
  }

  // +12 pts. Source: OSHA.gov cited in PRD Section 9; formal safety programs reduce workplace injury claims 40-50%.
  if (a.c_safety_manual === 'yes') {
    score += 12
    items.push('Has written safety manual (+12 pts, OSHA data: 40-50% fewer injury claims)')
  }

  // +8 pts. Source: PRD Section 9; prior cancellations for underwriting cause are near-automatic decline triggers.
  if (a.c_prior_cancellation === 'no') {
    score += 8
    items.push('No prior policy cancellations (+8 pts)')
  } else if (a.c_prior_cancellation === 'yes') {
    items.push('Prior cancellation disclosed (0 pts) - underwriter will review')
  }

  // +5 pts. Source: ACORD underwriting disclosure posture in PRD Section 8.
  if (a.c_discrimination_claims === 'no') {
    score += 5
    items.push('No discrimination/harassment claims (+5 pts)')
  }

  return {
    score,
    detail: {
      points: score,
      max: 25,
      items,
      explanation: items.join('. ') || 'Safety and compliance items not yet answered.',
    },
  }
}

function scoreProperty(a: Record<string, unknown>): { score: number; detail: ScoreDetail } {
  let score = 0
  const items: string[] = []

  // +6 pts. Source: IBHS cited in PRD Section 9; monitored alarms reduce theft/burglary claim frequency 60-80%.
  if (a.d_alarm_system === 'yes') {
    score += 6
    items.push('Monitored alarm system present (+6 pts, IBHS: 60-80% fewer theft/burglary claims)')
  }

  // +3 pts. Source: PRD Section 9; verification documents help underwriters trust mitigation claims.
  if (isFilled(a.d_alarm_contract)) {
    score += 3
    items.push('Alarm monitoring contract uploaded (+3 pts)')
  }

  // +4 pts. Source: NFPA cited in PRD Section 9; sprinklers reduce property loss per fire by 50-75%.
  if (a.d_sprinklers === 'yes') {
    score += 4
    items.push('Fire sprinkler system present (+4 pts, NFPA: 50-75% less property loss per fire)')
  }

  // +2 pts. Source: PRD Section 9; current certificates verify property-risk mitigations.
  if (isFilled(a.d_sprinkler_certificate)) {
    score += 2
    items.push('Sprinkler inspection certificate uploaded (+2 pts)')
  }

  // +3 pts. Source: PRD Section 9 physical property condition weighting for documented fire mitigations.
  if (a.d_fire_extinguishers === 'yes') {
    score += 3
    items.push('Fire extinguishers present and inspected (+3 pts)')
  }

  // +2 pts. Source: PRD Section 9; electrical panel photo helps confirm modern, lower-risk property condition.
  if (isFilled(a.d_electrical_photo)) {
    score += 2
    items.push('Electrical panel photo provided (+2 pts)')
  }

  return {
    score,
    detail: {
      points: score,
      max: 20,
      items,
      explanation: items.join('. ') || 'Physical property items not yet answered.',
    },
  }
}

function scoreClaims(a: Record<string, unknown>): { score: number; detail: ScoreDetail } {
  let score = 0
  const items: string[] = []

  // +10 pts. Source: PRD Section 9; clean 5-year loss history is a primary positive signal.
  if (a.e_claims === 'no') {
    score += 10
    items.push('No claims in past 5 years (+10 pts)')
  } else if (a.e_claims === 'yes') {
    // +3 pts. Source: PRD Section 9; disclosed claims are workable, undisclosed claims are not.
    score += 3
    items.push('Claims disclosed (+3 pts) - disclosed claims are workable; undisclosed ones are not')
  }

  // +5 pts. Source: PRD Section 9; recent bankruptcy/liens indicate financial instability and moral hazard concern.
  if (a.c_bankruptcy === 'no') {
    score += 5
    items.push('No bankruptcy/foreclosure in past 5 years (+5 pts)')
  }

  // +5 pts. Source: PRD Section 9; prior carrier details show insurable history and reduce underwriting ambiguity.
  if (isFilled(a.e_prior_carrier) && isFilled(a.e_prior_policy_number)) {
    score += 5
    items.push('Prior insurance carrier information provided (+5 pts)')
  }

  return {
    score,
    detail: {
      points: score,
      max: 20,
      items,
      explanation: items.join('. ') || 'Claims history not yet answered.',
    },
  }
}

function scoreNeighborhood(): { score: number; detail: ScoreDetail } {
  // Neighborhood Context: 10 pts. Source: PRD Section 9; Phase 1 uses a neutral 5/10 because SF public
  // signals are supporting context and can penalize businesses for factors outside their control.
  return {
    score: 5,
    detail: {
      points: 5,
      max: 10,
      explanation:
        'Neighborhood context score is 5/10 in Phase 1. SF public data signals will be integrated in Phase 2, and this dimension is intentionally weighted lowest.',
    },
  }
}

export function calculateScore(intakeData: IntakeData): ScoreResult {
  const flatAnswers = answers(intakeData)
  const documentation = scoreDocumentation(flatAnswers)
  const safety = scoreSafety(flatAnswers)
  const property = scoreProperty(flatAnswers)
  const claims = scoreClaims(flatAnswers)
  const neighborhood = scoreNeighborhood()

  return {
    total_score: documentation.score + safety.score + property.score + claims.score + neighborhood.score,
    documentation_score: documentation.score,
    safety_score: safety.score,
    property_score: property.score,
    claims_score: claims.score,
    neighborhood_score: neighborhood.score,
    score_details: {
      documentation: documentation.detail,
      safety: safety.detail,
      property: property.detail,
      claims: claims.detail,
      neighborhood: neighborhood.detail,
    },
  }
}

export function getScoreTier(score: number): {
  label: string
  color: 'green' | 'yellow' | 'orange' | 'red'
  meaning: string
} {
  if (score >= 80) {
    return { label: 'Submission Ready', color: 'green', meaning: 'Clean profile. Route to broker review.' }
  }
  if (score >= 60) {
    return { label: 'Minor Gaps', color: 'yellow', meaning: 'Proceed with broker review. Checklist provided.' }
  }
  if (score >= 40) {
    return { label: 'Significant Gaps', color: 'orange', meaning: 'Address gaps before submission.' }
  }
  return { label: 'Not Ready', color: 'red', meaning: 'Advisory mode only. Fix critical items first.' }
}
