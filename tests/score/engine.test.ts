import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  ACORD_125_REQUIRED_DOCUMENTATION_KEYS,
  calculateScore,
  getScoreTier,
  type IntakeData,
} from '../../lib/score/engine.js'

function intake(sections: Partial<IntakeData> = {}): IntakeData {
  return {
    section_a: {},
    section_b: {},
    section_c: {},
    section_d: {},
    section_e: {},
    ...sections,
  }
}

const completeIntake = intake({
  section_a: {
    a_business_name: 'Golden Gate Bakery',
    a_entity_type: 'LLC',
    a_fein: '12-3456789',
    a_date_started: '2018-02-01',
    a_phone: '415-555-0100',
    a_contact_name: 'Mina Patel',
    a_contact_email: 'mina@goldengatebakery.example',
  },
  section_b: {
    b_address: '123 Market St, San Francisco, CA',
    b_ownership: 'tenant',
    b_total_sqft: 2400,
    b_occupied_sqft: 2400,
    b_public_sqft: 1200,
    b_annual_revenue: 850000,
    b_fulltime_employees: 12,
    b_parttime_employees: 4,
    b_operations: 'Retail bakery and cafe',
  },
  section_c: {
    c_code_violations: 'no',
    c_safety_manual: 'yes',
    c_prior_cancellation: 'no',
    c_discrimination_claims: 'no',
    c_bankruptcy: 'no',
  },
  section_d: {
    d_alarm_system: 'yes',
    d_alarm_contract: 'alarm-contract.pdf',
    d_sprinklers: 'yes',
    d_sprinkler_certificate: 'sprinkler-cert.pdf',
    d_fire_extinguishers: 'yes',
    d_electrical_photo: 'panel.jpg',
  },
  section_e: {
    e_prior_carrier: 'Travelers',
    e_prior_policy_number: 'TRV-100',
    e_prior_policy_dates: '2025-01-01 to 2026-01-01',
    e_prior_premium: 10400,
    e_claims: 'no',
  },
})

describe('score engine', () => {
  it('calculates a complete intake across all five readiness dimensions', () => {
    const result = calculateScore(completeIntake)

    assert.equal(result.total_score, 95)
    assert.equal(result.documentation_score, 25)
    assert.equal(result.safety_score, 25)
    assert.equal(result.property_score, 20)
    assert.equal(result.claims_score, 20)
    assert.equal(result.neighborhood_score, 5)
    assert.deepEqual(Object.keys(result.score_details).sort(), [
      'claims',
      'documentation',
      'neighborhood',
      'property',
      'safety',
    ])
  })

  it('uses the ACORD 125 core intake fields as the documentation completeness contract', () => {
    assert.deepEqual(ACORD_125_REQUIRED_DOCUMENTATION_KEYS, [
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
    ])
  })

  it('applies an open code violation as a safety hard gate', () => {
    const result = calculateScore(
      intake({
        ...completeIntake,
        section_c: {
          ...completeIntake.section_c,
          c_code_violations: 'yes',
        },
      }),
    )

    assert.equal(result.safety_score, 0)
    assert.equal(result.total_score, 70)
    assert.match(result.score_details.safety.explanation, /blocks submission/i)
  })

  it('handles empty and minimal intake without inventing points', () => {
    const result = calculateScore(intake())

    assert.equal(result.total_score, 5)
    assert.equal(result.documentation_score, 0)
    assert.equal(result.safety_score, 0)
    assert.equal(result.property_score, 0)
    assert.equal(result.claims_score, 0)
    assert.equal(result.neighborhood_score, 5)
    assert.equal(result.score_details.documentation.points, 0)
    assert.equal(result.score_details.documentation.max, 25)
  })

  it('maps score tiers to the Phase 1 PRD boundaries', () => {
    assert.deepEqual(getScoreTier(80), {
      label: 'Submission Ready',
      color: 'green',
      meaning: 'Clean profile. Route to broker review.',
    })
    assert.deepEqual(getScoreTier(60), {
      label: 'Minor Gaps',
      color: 'yellow',
      meaning: 'Proceed with broker review. Checklist provided.',
    })
    assert.deepEqual(getScoreTier(40), {
      label: 'Significant Gaps',
      color: 'orange',
      meaning: 'Address gaps before submission.',
    })
    assert.deepEqual(getScoreTier(39), {
      label: 'Not Ready',
      color: 'red',
      meaning: 'Advisory mode only. Fix critical items first.',
    })
  })

  it('keeps neighborhood score fixed at 5 for Phase 1', () => {
    const result = calculateScore(
      intake({
        section_b: {
          b_address: 'Flood zone, recent fire incidents, open city complaints',
        },
      }),
    )

    assert.equal(result.neighborhood_score, 5)
    assert.equal(result.score_details.neighborhood.points, 5)
    assert.match(result.score_details.neighborhood.explanation, /Phase 1/i)
  })
})
