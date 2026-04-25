import type { IntakeData } from '@/lib/supabase/types'

export interface ScoreResult {
  total_score: number
  documentation_score: number  // 0–25
  safety_score: number         // 0–25
  property_score: number       // 0–20
  claims_score: number         // 0–20
  neighborhood_score: number   // 0–10 (Phase 1: fixed at 5 — no SF public data yet)
  score_details: Record<string, { points: number; max: number; explanation: string }>
}

function answers(data: IntakeData): Record<string, unknown> {
  return {
    ...data.section_a,
    ...data.section_b,
    ...data.section_c,
    ...data.section_d,
    ...data.section_e,
  }
}

// Documentation Completeness — 25 pts
// Source: Incomplete ACORD submissions are #1 cause of underwriting delays.
function scoreDocumentation(a: Record<string, unknown>) {
  const required = [
    'a_business_name', 'a_entity_type', 'a_fein', 'a_date_started', 'a_phone',
    'b_address', 'b_ownership', 'b_total_sqft', 'b_occupied_sqft', 'b_public_sqft',
    'b_annual_revenue', 'b_fulltime_employees', 'b_operations',
    'e_prior_carrier', 'e_prior_policy_number', 'e_prior_policy_dates', 'e_prior_premium',
  ]
  const filled = required.filter(k => a[k] && a[k] !== '' && a[k] !== 'skipped').length
  const score = Math.round((filled / required.length) * 25)
  return {
    score,
    detail: {
      points: score, max: 25, filled, total: required.length,
      explanation: `${filled} of ${required.length} required ACORD fields completed. ` +
        `Complete submissions materially improve placement odds.`,
    },
  }
}

// Safety & Compliance — 25 pts
// Source: OSHA — formal safety programs reduce workplace injury claims 40-50%.
// Hard gate: uncorrected code violations → 0 pts (ACORD Q8).
function scoreSafety(a: Record<string, unknown>) {
  if (a['c_code_violations'] === 'yes') {
    return {
      score: 0,
      detail: {
        points: 0, max: 25,
        explanation: 'Uncorrected code violations block submission (ACORD Q8). Resolve before proceeding.',
      },
    }
  }

  let score = 0
  if (a['c_safety_manual'] === 'yes') score += 10   // OSHA: 40-50% fewer workplace injury claims
  if (a['c_arson'] === 'no') score += 5
  if (a['c_discrimination_claims'] === 'no') score += 5
  if (a['c_bankruptcy'] === 'no') score += 5

  return {
    score: Math.min(score, 25),
    detail: {
      points: Math.min(score, 25), max: 25,
      explanation: 'Based on safety program, arson history, discrimination claims, and financial stability.',
    },
  }
}

// Physical Property Condition — 20 pts
// Source: IBHS monitored alarms → 60-80% lower theft/burglary frequency.
// NFPA sprinklers → 50-75% reduction in property loss per fire.
function scoreProperty(a: Record<string, unknown>) {
  let score = 0
  if (a['d_sprinklers'] === 'yes') score += 7        // NFPA: 50-75% property loss reduction
  if (a['d_alarm_system'] === 'yes') score += 7      // IBHS: 60-80% burglary frequency reduction
  if (a['d_fire_extinguishers'] === 'yes') score += 3
  if (a['d_roof_inspection'] && a['d_roof_inspection'] !== 'skipped') score += 3
  return {
    score: Math.min(score, 20),
    detail: {
      points: Math.min(score, 20), max: 20,
      explanation: 'Based on fire suppression, alarm system, extinguishers, and roof documentation.',
    },
  }
}

// Claims & Financial History — 20 pts
// Prior underwriting cancellations are near-automatic decline triggers in surplus lines.
function scoreClaims(a: Record<string, unknown>) {
  let score = 20
  if (a['c_prior_cancellation'] === 'yes') score -= 10
  if (a['c_bankruptcy'] === 'yes') score -= 5
  if (a['c_judgements'] === 'yes') score -= 3
  if (a['e_claims'] === 'yes') score -= 2
  return {
    score: Math.max(score, 0),
    detail: {
      points: Math.max(score, 0), max: 20,
      explanation: 'Based on prior cancellations, bankruptcy, judgements, and claims history.',
    },
  }
}

export function calculateScore(data: IntakeData): ScoreResult {
  const a = answers(data)
  const doc = scoreDocumentation(a)
  const safety = scoreSafety(a)
  const property = scoreProperty(a)
  const claims = scoreClaims(a)
  const neighborhood = { score: 5, detail: { points: 5, max: 10, explanation: 'Phase 1: neutral baseline. SF public data enrichment added in Phase 2.' } }

  const total = doc.score + safety.score + property.score + claims.score + neighborhood.score

  return {
    total_score: Math.min(total, 100),
    documentation_score: doc.score,
    safety_score: safety.score,
    property_score: property.score,
    claims_score: claims.score,
    neighborhood_score: neighborhood.score,
    score_details: {
      documentation: doc.detail,
      safety: safety.detail,
      property: property.detail,
      claims: claims.detail,
      neighborhood: neighborhood.detail,
    },
  }
}
