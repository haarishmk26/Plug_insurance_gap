import { createRawServiceClient } from '@/lib/supabase/server'
import type { ClientWithIntake } from '@/lib/supabase/types'
import type { ConversationTurn } from './gemini'

type SectionMap = {
  section_a: Record<string, unknown>
  section_b: Record<string, unknown>
  section_c: Record<string, unknown>
  section_d: Record<string, unknown>
  section_e: Record<string, unknown>
}

// Flatten all section answers into one record for Gemini context
export function flattenAnswers(intakeData: SectionMap): Record<string, unknown> {
  return {
    ...intakeData.section_a,
    ...intakeData.section_b,
    ...intakeData.section_c,
    ...intakeData.section_d,
    ...intakeData.section_e,
  }
}

function sectionColumn(key: string): keyof SectionMap {
  const prefix = key.split('_')[0]
  const map: Record<string, keyof SectionMap> = {
    a: 'section_a', b: 'section_b', c: 'section_c',
    d: 'section_d', e: 'section_e',
  }
  return map[prefix] ?? 'section_a'
}

// Save a batch of extracted fields from Gemini — groups by section column
export async function saveExtractedFields(
  clientId: string,
  fields: Record<string, string>
) {
  if (Object.keys(fields).length === 0) return

  const supabase = createRawServiceClient()

  // Group new values by section column
  const grouped: Partial<Record<keyof SectionMap, Record<string, string>>> = {}
  for (const [key, value] of Object.entries(fields)) {
    const col = sectionColumn(key)
    if (!grouped[col]) grouped[col] = {}
    grouped[col]![key] = value
  }

  // Fetch current section data for all affected columns
  const cols = Object.keys(grouped) as (keyof SectionMap)[]
  const { data: existing } = await supabase
    .from('intake_data')
    .select(cols.join(','))
    .eq('client_id', clientId)
    .single()

  // Merge new values into existing sections
  const updates: Record<string, unknown> = { client_id: clientId }
  for (const col of cols) {
    const current = (existing?.[col as keyof typeof existing] ?? {}) as Record<string, unknown>
    updates[col] = { ...current, ...grouped[col] }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await supabase.from('intake_data').upsert(updates as any)
}

// Append turns to conversation_history in Supabase
export async function appendConversationHistory(
  clientId: string,
  newTurns: ConversationTurn[]
) {
  const supabase = createRawServiceClient()
  const { data: existing } = await supabase
    .from('intake_data')
    .select('conversation_history')
    .eq('client_id', clientId)
    .single()

  const current: ConversationTurn[] = (existing?.conversation_history as ConversationTurn[]) ?? []
  await supabase
    .from('intake_data')
    .upsert({ client_id: clientId, conversation_history: [...current, ...newTurns] })
}

// Load conversation history for Gemini context
export async function getConversationHistory(clientId: string): Promise<ConversationTurn[]> {
  const supabase = createRawServiceClient()
  const { data } = await supabase
    .from('intake_data')
    .select('conversation_history')
    .eq('client_id', clientId)
    .single()
  return (data?.conversation_history as ConversationTurn[]) ?? []
}

// Single-answer save (kept for upload questions)
export async function saveAnswer(
  clientId: string,
  questionKey: string,
  answer: string,
  nextQuestionKey: string | null
) {
  const supabase = createRawServiceClient()
  const col = sectionColumn(questionKey)

  const { data: existing } = await supabase
    .from('intake_data')
    .select(col)
    .eq('client_id', clientId)
    .single()

  const currentSection = (existing?.[col as keyof typeof existing] ?? {}) as Record<string, unknown>

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await supabase.from('intake_data').upsert({
    client_id: clientId,
    [col]: { ...currentSection, [questionKey]: answer },
    current_question_key: nextQuestionKey,
  } as any)
}

// Resolve a client by their unique deep-link token
export async function getClientByToken(token: string): Promise<ClientWithIntake | null> {
  const supabase = createRawServiceClient()
  const { data } = await supabase
    .from('clients')
    .select('*, intake_data(*)')
    .eq('intake_token', token)
    .single()
  return data as ClientWithIntake | null
}

// Associate the Telegram chat_id with the client on first /start
export async function linkChatId(clientId: string, chatId: number) {
  const supabase = createRawServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('clients') as any)
    .update({ telegram_chat_id: chatId, intake_status: 'in_progress' })
    .eq('id', clientId)
}

// Called after Gemini signals is_complete — marks status and fires score
export async function markIntakeComplete(clientId: string) {
  const supabase = createRawServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('clients') as any)
    .update({ intake_status: 'complete' })
    .eq('id', clientId)

  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/score/${clientId}`, {
    method: 'POST',
    headers: { 'x-internal-secret': process.env.TELEGRAM_WEBHOOK_SECRET! },
  }).catch(() => {})
}
