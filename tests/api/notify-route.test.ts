import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { handleNotifyRequest, type NotifySupabaseClient } from '../../lib/api/notify-route.js'

function supabaseWithClient(client: unknown): NotifySupabaseClient {
  return {
    from(table: string) {
      assert.equal(table, 'clients')

      return {
        select(columns: string) {
          assert.match(columns, /brokers/)

          return {
            eq(column: string, value: string) {
              assert.equal(column, 'id')
              assert.equal(value, 'client-123')

              return {
                async maybeSingle() {
                  return { data: client, error: null }
                },
              }
            },
          }
        },
      }
    },
  }
}

describe('notification route helper', () => {
  it('rejects requests without the internal secret', async () => {
    const logs: unknown[] = []
    const result = await handleNotifyRequest({
      clientId: 'client-123',
      internalSecret: 'wrong-secret',
      webhookSecret: 'right-secret',
      dashboardBaseUrl: 'https://plug.test',
      supabase: supabaseWithClient(null),
      logger: { log: (...args: unknown[]) => logs.push(args) },
    })

    assert.equal(result.status, 401)
    assert.deepEqual(result.body, { error: 'Unauthorized' })
    assert.deepEqual(logs, [])
  })

  it('returns not found when the client is missing', async () => {
    const result = await handleNotifyRequest({
      clientId: 'client-123',
      internalSecret: 'right-secret',
      webhookSecret: 'right-secret',
      dashboardBaseUrl: 'https://plug.test',
      supabase: supabaseWithClient(null),
      logger: console,
    })

    assert.equal(result.status, 404)
    assert.deepEqual(result.body, { error: 'Client not found' })
  })

  it('returns and logs the Phase 1 broker notification payload', async () => {
    const logs: unknown[] = []
    const result = await handleNotifyRequest({
      clientId: 'client-123',
      internalSecret: 'right-secret',
      webhookSecret: 'right-secret',
      dashboardBaseUrl: 'https://plug.test/',
      supabase: supabaseWithClient({
        id: 'client-123',
        business_name: 'Golden Gate Bakery',
        owner_name: 'Mina Park',
        brokers: {
          id: 'broker-456',
          name: 'Alex Broker',
          email: 'alex@example.com',
        },
      }),
      logger: { log: (...args: unknown[]) => logs.push(args) },
    })

    assert.equal(result.status, 200)
    assert.deepEqual(result.body, {
      notification: {
        type: 'broker_intake_complete',
        clientId: 'client-123',
        businessName: 'Golden Gate Bakery',
        ownerName: 'Mina Park',
        broker: {
          id: 'broker-456',
          name: 'Alex Broker',
          email: 'alex@example.com',
        },
        dashboardUrl: 'https://plug.test/clients/client-123',
        message: 'Golden Gate Bakery completed intake. Broker review is ready.',
      },
    })
    assert.deepEqual(logs, [['broker_intake_complete', result.body.notification]])
  })
})
