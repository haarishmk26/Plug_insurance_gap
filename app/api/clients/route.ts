import { randomUUID } from 'node:crypto'

import { NextResponse } from 'next/server'

import { buildTelegramLink } from '@/lib/dashboard/dossier'
import { getDemoBrokerClientInsert, upsertDemoBroker } from '@/lib/supabase/demo-broker'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const { businessName, ownerName, ownerContact } = await request.json()

  if (!businessName?.trim() || !ownerName?.trim()) {
    return NextResponse.json(
      { error: 'Business name and owner name are required.' },
      { status: 400 },
    )
  }

  const supabase = createServiceClient() as any
  await upsertDemoBroker(supabase)

  const intakeToken = randomUUID()
  const clientInsert = getDemoBrokerClientInsert({
    business_name: businessName.trim(),
    owner_name: ownerName.trim(),
    owner_contact: ownerContact?.trim() || null,
    intake_token: intakeToken,
    intake_status: 'pending',
  })

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert(clientInsert)
    .select('*')
    .single()

  if (clientError || !client) {
    return NextResponse.json(
      { error: clientError?.message ?? 'Failed to create client.' },
      { status: 500 },
    )
  }

  const { error: intakeError } = await supabase.from('intake_data').insert({
    client_id: client.id,
  })

  if (intakeError) {
    return NextResponse.json({ error: intakeError.message }, { status: 500 })
  }

  return NextResponse.json(
    {
      ...client,
      telegramLink: buildTelegramLink(
        client.intake_token,
        process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? 'DistrictCoverBot',
      ),
    },
    { status: 201 },
  )
}
