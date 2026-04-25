import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  DEFAULT_DEMO_BROKER,
  DEFAULT_DEMO_BROKER_ID,
  getDemoBrokerClientInsert,
  getDemoBrokerInsert,
  upsertDemoBroker,
} from '../../lib/supabase/demo-broker.js'

describe('demo broker context', () => {
  it('exposes a stable Phase 1 broker identity for shared dashboard writes', () => {
    assert.equal(DEFAULT_DEMO_BROKER.id, DEFAULT_DEMO_BROKER_ID)
    assert.equal(DEFAULT_DEMO_BROKER.name, 'Demo Broker')
    assert.equal(DEFAULT_DEMO_BROKER.email, 'demo@districtcover.local')
    assert.match(DEFAULT_DEMO_BROKER_ID, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('builds a broker insert row without requiring callers to know demo constants', () => {
    assert.deepEqual(getDemoBrokerInsert(), {
      id: DEFAULT_DEMO_BROKER.id,
      name: DEFAULT_DEMO_BROKER.name,
      email: DEFAULT_DEMO_BROKER.email,
    })
  })

  it('stamps dashboard client writes with the default demo broker id', () => {
    const insert = getDemoBrokerClientInsert({
      business_name: 'Golden Gate Bakery',
      owner_name: 'Sam Rivera',
      intake_token: 'token-123',
      broker_id: '11111111-1111-4111-8111-111111111111',
    })

    assert.deepEqual(insert, {
      broker_id: DEFAULT_DEMO_BROKER_ID,
      business_name: 'Golden Gate Bakery',
      owner_name: 'Sam Rivera',
      intake_token: 'token-123',
    })
  })

  it('upserts the shared broker row and returns it', async () => {
    const calls: unknown[] = []
    const supabase = {
      from(table: string) {
        calls.push(['from', table])
        return {
          upsert(values: unknown, options: unknown) {
            calls.push(['upsert', values, options])
            return {
              select(columns: string) {
                calls.push(['select', columns])
                return {
                  single() {
                    calls.push(['single'])
                    return Promise.resolve({ data: DEFAULT_DEMO_BROKER, error: null })
                  },
                }
              },
            }
          },
        }
      },
    }

    const broker = await upsertDemoBroker(supabase)

    assert.deepEqual(broker, DEFAULT_DEMO_BROKER)
    assert.deepEqual(calls, [
      ['from', 'brokers'],
      ['upsert', getDemoBrokerInsert(), { onConflict: 'id' }],
      ['select', '*'],
      ['single'],
    ])
  })

  it('surfaces Supabase failures while seeding the demo broker', async () => {
    const supabase = {
      from() {
        return {
          upsert() {
            return {
              select() {
                return {
                  single() {
                    return Promise.resolve({ data: null, error: new Error('insert failed') })
                  },
                }
              },
            }
          },
        }
      },
    }

    await assert.rejects(() => upsertDemoBroker(supabase), /insert failed/)
  })
})
