import { createClient } from '@supabase/supabase-js'

import {
  handleNotifyRequest,
  type NotifyResult,
  type NotifySupabaseClient,
} from '../../../../lib/api/notify-route.js'
import type { Database } from '../../../../lib/supabase/types.js'

type NotifyRouteContext = {
  params: { clientId: string } | Promise<{ clientId: string }>
}

const unusedSupabase = {} as NotifySupabaseClient

export async function POST(request: Request, context: NotifyRouteContext) {
  const { clientId } = await context.params
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET
  const internalSecret = request.headers.get('x-internal-secret')
  const dashboardBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin

  if (!webhookSecret || internalSecret !== webhookSecret) {
    return notifyJson(
      await handleNotifyRequest({
        clientId,
        internalSecret,
        webhookSecret,
        dashboardBaseUrl,
        supabase: unusedSupabase,
        logger: console,
      }),
    )
  }

  let supabase: NotifySupabaseClient

  try {
    supabase = createNotificationSupabaseClient()
  } catch {
    return Response.json({ error: 'Notification lookup failed' }, { status: 500 })
  }

  return notifyJson(
    await handleNotifyRequest({
      clientId,
      internalSecret,
      webhookSecret,
      dashboardBaseUrl,
      supabase,
      logger: console,
    }),
  )
}

function notifyJson(result: NotifyResult) {
  return Response.json(result.body, { status: result.status })
}

function createNotificationSupabaseClient(): NotifySupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service credentials are not configured')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  }) as unknown as NotifySupabaseClient
}
