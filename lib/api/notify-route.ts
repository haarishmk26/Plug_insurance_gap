export interface NotifySupabaseClient {
  from(table: 'clients'): {
    select(columns: string): {
      eq(column: 'id', value: string): {
        maybeSingle(): Promise<{ data: unknown; error: unknown }>
      }
    }
  }
}

export interface NotifyLogger {
  log(message?: unknown, ...optionalParams: unknown[]): void
}

export interface NotifyBroker {
  id: string
  name: string
  email: string
}

export interface NotifyPayload {
  type: 'broker_intake_complete'
  clientId: string
  businessName: string
  ownerName: string
  broker: NotifyBroker
  dashboardUrl: string
  message: string
}

export type NotifyResult =
  | { status: 200; body: { notification: NotifyPayload } }
  | { status: 401; body: { error: 'Unauthorized' } }
  | { status: 404; body: { error: 'Client not found' } }
  | { status: 500; body: { error: 'Notification lookup failed' | 'Notification secret not configured' } }

export interface HandleNotifyRequestParams {
  clientId: string
  internalSecret: string | null
  webhookSecret: string | undefined
  dashboardBaseUrl: string
  supabase: NotifySupabaseClient
  logger: NotifyLogger
}

interface NotifyClientRecord {
  id: string
  business_name: string
  owner_name: string
  brokers: NotifyBroker | NotifyBroker[] | null
}

export async function handleNotifyRequest(params: HandleNotifyRequestParams): Promise<NotifyResult> {
  const { clientId, internalSecret, webhookSecret, dashboardBaseUrl, supabase, logger } = params

  if (!webhookSecret) {
    return { status: 500, body: { error: 'Notification secret not configured' } }
  }

  if (internalSecret !== webhookSecret) {
    return { status: 401, body: { error: 'Unauthorized' } }
  }

  const { data, error } = await supabase
    .from('clients')
    .select('id, business_name, owner_name, brokers(id, name, email)')
    .eq('id', clientId)
    .maybeSingle()

  if (error) {
    return { status: 500, body: { error: 'Notification lookup failed' } }
  }

  if (!isNotifyClientRecord(data)) {
    return { status: 404, body: { error: 'Client not found' } }
  }

  const broker = Array.isArray(data.brokers) ? data.brokers[0] : data.brokers

  if (!broker) {
    return { status: 404, body: { error: 'Client not found' } }
  }

  const notification: NotifyPayload = {
    type: 'broker_intake_complete',
    clientId: data.id,
    businessName: data.business_name,
    ownerName: data.owner_name,
    broker,
    dashboardUrl: buildDashboardUrl(dashboardBaseUrl, data.id),
    message: `${data.business_name} completed intake. Broker review is ready.`,
  }

  logger.log('broker_intake_complete', notification)

  return { status: 200, body: { notification } }
}

function buildDashboardUrl(baseUrl: string, clientId: string) {
  return `${baseUrl.replace(/\/+$/, '')}/clients/${encodeURIComponent(clientId)}`
}

function isNotifyClientRecord(value: unknown): value is NotifyClientRecord {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>

  return (
    typeof record.id === 'string' &&
    typeof record.business_name === 'string' &&
    typeof record.owner_name === 'string' &&
    hasBrokerShape(record.brokers)
  )
}

function hasBrokerShape(value: unknown): value is NotifyBroker | NotifyBroker[] {
  if (Array.isArray(value)) {
    return value.every(isBroker)
  }

  return isBroker(value)
}

function isBroker(value: unknown): value is NotifyBroker {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>

  return typeof record.id === 'string' && typeof record.name === 'string' && typeof record.email === 'string'
}
