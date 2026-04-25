import type { Database } from './types'

type BrokerInsert = Database['public']['Tables']['brokers']['Insert']
type ClientInsert = Database['public']['Tables']['clients']['Insert']

export type DemoBrokerContext = Pick<BrokerInsert, 'id' | 'name' | 'email'>

export const DEFAULT_DEMO_BROKER_ID = 'be21add1-fd45-4505-b642-3dc690edf514' as const

export const DEFAULT_DEMO_BROKER = {
  id: DEFAULT_DEMO_BROKER_ID,
  name: 'Demo Broker',
  email: 'demo@districtcover.local',
} as const satisfies DemoBrokerContext

type DemoBrokerUpsertClient = {
  from(table: 'brokers'): {
    upsert(values: BrokerInsert, options: { onConflict: 'id' }): {
      select(columns: '*'): {
        single(): Promise<{ data: DemoBrokerContext | null; error: Error | { message?: string } | null }>
      }
    }
  }
}

export function getDemoBrokerInsert(): BrokerInsert {
  return {
    id: DEFAULT_DEMO_BROKER.id,
    name: DEFAULT_DEMO_BROKER.name,
    email: DEFAULT_DEMO_BROKER.email,
  }
}

export function getDemoBrokerClientInsert(
  values: Omit<ClientInsert, 'broker_id'> & Partial<Pick<ClientInsert, 'broker_id'>>,
): ClientInsert {
  const { broker_id: _brokerId, ...clientValues } = values

  return {
    broker_id: DEFAULT_DEMO_BROKER_ID,
    ...clientValues,
  }
}

export async function upsertDemoBroker(supabase: DemoBrokerUpsertClient): Promise<DemoBrokerContext> {
  const { data, error } = await supabase
    .from('brokers')
    .upsert(getDemoBrokerInsert(), { onConflict: 'id' })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('Supabase did not return the demo broker row.')
  }

  return {
    id: data.id,
    name: data.name,
    email: data.email,
  }
}
