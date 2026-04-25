import { handleWebhook } from '@/lib/telegram/bot'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-telegram-bot-api-secret-token')
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    return await handleWebhook(req)
  } catch (err) {
    // Always return 200 to Telegram — returning 5xx causes infinite retries
    console.error('Webhook top-level error:', err)
    return new Response('OK', { status: 200 })
  }
}
