import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { handleScoreRequest, type ScoreRouteSupabaseClient } from '../../lib/api/score-route.js'
import { calculateScore, type IntakeData } from '../../lib/score/engine.js'

type TableName = 'intake_data' | 'readiness_scores'

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

function fakeSupabase(params: {
  intakeData?: IntakeData | null
  intakeError?: Error | null
  upsertError?: Error | null
}) {
  const calls: Array<{ table: TableName; action: string; value?: unknown }> = []
  const client = {
    from(table: TableName) {
      calls.push({ table, action: 'from' })

      if (table === 'intake_data') {
        return {
          select(columns: string) {
            calls.push({ table, action: 'select', value: columns })

            return {
              eq(column: string, value: string) {
                calls.push({ table, action: 'eq', value: { column, value } })

                return {
                  async single() {
                    calls.push({ table, action: 'single' })
                    return {
                      data: params.intakeData ?? null,
                      error: params.intakeError ?? null,
                    }
                  },
                }
              },
            }
          },
        }
      }

      return {
        async upsert(value: Record<string, unknown>, options?: Record<string, unknown>) {
          calls.push({ table, action: 'upsert', value: { value, options } })
          return {
            error: params.upsertError ?? null,
          }
        },
      }
    },
  } as ScoreRouteSupabaseClient

  return { client, calls }
}

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>
}

describe('score route helper', () => {
  it('rejects requests without the internal secret', async () => {
    const supabase = fakeSupabase({ intakeData: completeIntake })

    const response = await handleScoreRequest({
      clientId: 'client-123',
      internalSecret: 'wrong-secret',
      expectedSecret: 'correct-secret',
      supabase: supabase.client,
    })

    assert.equal(response.status, 401)
    assert.deepEqual(await readJson(response), { error: 'Unauthorized' })
    assert.deepEqual(supabase.calls, [])
  })

  it('returns not found when the client has no intake data', async () => {
    const supabase = fakeSupabase({ intakeData: null })

    const response = await handleScoreRequest({
      clientId: 'client-123',
      internalSecret: 'correct-secret',
      expectedSecret: 'correct-secret',
      supabase: supabase.client,
    })

    assert.equal(response.status, 404)
    assert.deepEqual(await readJson(response), { error: 'Intake data not found' })
    assert.deepEqual(supabase.calls, [
      { table: 'intake_data', action: 'from' },
      { table: 'intake_data', action: 'select', value: '*' },
      {
        table: 'intake_data',
        action: 'eq',
        value: { column: 'client_id', value: 'client-123' },
      },
      { table: 'intake_data', action: 'single' },
    ])
  })

  it('calculates the score, upserts readiness_scores, and returns the score', async () => {
    const supabase = fakeSupabase({ intakeData: completeIntake })
    const expectedScore = calculateScore(completeIntake)

    const response = await handleScoreRequest({
      clientId: 'client-123',
      internalSecret: 'correct-secret',
      expectedSecret: 'correct-secret',
      supabase: supabase.client,
    })

    assert.equal(response.status, 200)
    assert.deepEqual(await readJson(response), expectedScore)
    assert.deepEqual(supabase.calls.at(-2), { table: 'readiness_scores', action: 'from' })
    assert.deepEqual(supabase.calls.at(-1), {
      table: 'readiness_scores',
      action: 'upsert',
      value: {
        value: {
          client_id: 'client-123',
          ...expectedScore,
        },
        options: { onConflict: 'client_id' },
      },
    })
  })
})
