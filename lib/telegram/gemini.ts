import OpenAI from 'openai'

let nebius: OpenAI | null = null

function getNebiusClient() {
  const apiKey = process.env.NEBIUS_API_KEY
  if (!apiKey) {
    throw new Error('NEBIUS_API_KEY is required to run Telegram intake chat.')
  }

  nebius ??= new OpenAI({
    apiKey,
    baseURL: 'https://api.studio.nebius.com/v1/',
  })

  return nebius
}

// All required ACORD fields to collect
const REQUIRED_FIELDS = [
  'a_business_name', 'a_entity_type', 'a_fein', 'a_date_started', 'a_phone',
  'b_address', 'b_ownership', 'b_total_sqft', 'b_occupied_sqft', 'b_public_sqft',
  'b_sublease', 'b_annual_revenue', 'b_fulltime_employees', 'b_parttime_employees', 'b_operations',
  'c_subsidiary', 'c_safety_manual', 'c_hazardous_materials', 'c_prior_cancellation',
  'c_discrimination_claims', 'c_arson', 'c_code_violations', 'c_bankruptcy',
  'c_judgements', 'c_foreign_operations', 'c_drones',
  'd_roof_age', 'd_electrical_panel', 'd_sprinklers', 'd_alarm_system', 'd_fire_extinguishers',
  'e_prior_carrier', 'e_prior_policy_number', 'e_prior_policy_dates', 'e_prior_premium', 'e_claims',
]

// The 4 fields we collect in demo mode — enough to show the value without the full flow
const DEMO_FIELDS = ['b_operations', 'b_annual_revenue', 'b_fulltime_employees', 'e_claims']

const FIELD_DESCRIPTIONS: Record<string, string> = {
  a_business_name: 'Full legal business name (and DBA if any)',
  a_entity_type: 'Entity type — one of: LLC, Corporation, Sole Proprietorship, Partnership, Other',
  a_fein: 'Federal Employer ID Number (or SSN for sole proprietors)',
  a_date_started: 'Year the business started',
  a_phone: 'Business phone number',
  b_address: 'Full San Francisco street address',
  b_ownership: 'Do they own or rent/lease — normalize to "Owner" or "Tenant"',
  b_total_sqft: 'Total building square footage (number)',
  b_occupied_sqft: 'Square footage the business occupies (number)',
  b_public_sqft: 'Square footage open to customers/public (number)',
  b_sublease: 'Whether they sublease any space to others (yes/no)',
  b_annual_revenue: 'Approximate annual revenue last year',
  b_fulltime_employees: 'Number of full-time employees including owner (number)',
  b_parttime_employees: 'Number of part-time employees (number)',
  b_operations: '2-3 sentence description of what the business does and who its customers are',
  c_subsidiary: 'Whether business is a subsidiary or has a parent company (yes/no)',
  c_safety_manual: 'Whether they have a written safety manual or formal safety procedures (yes/no)',
  c_hazardous_materials: 'Whether they use, store, or sell flammable liquids, explosives, or chemicals (yes/no)',
  c_prior_cancellation: 'Whether any policy was declined, cancelled, or not renewed in past 3 years (yes/no)',
  c_discrimination_claims: 'Whether there were discrimination, harassment, or wrongful termination claims in past 5 years (yes/no)',
  c_arson: 'Whether any owner/principal was convicted of or indicted for arson in past 5 years (yes/no)',
  c_code_violations: 'Whether there are uncorrected fire, safety, or building code violations right now (yes/no)',
  c_bankruptcy: 'Whether there was a bankruptcy, foreclosure, or repossession in past 5 years (yes/no)',
  c_judgements: 'Whether there are unsatisfied judgements or tax liens in past 5 years (yes/no)',
  c_foreign_operations: 'Whether business has operations, products, or services outside the US (yes/no)',
  c_drones: 'Whether business owns, operates, or hires others to operate drones (yes/no)',
  d_roof_age: 'Roof age in years and material (e.g. "15 years, flat tar and gravel")',
  d_electrical_panel: 'Electrical panel type and approximate age (e.g. "200-amp circuit breaker, ~20 years")',
  d_sprinklers: 'Whether building has a fire sprinkler system (yes/no)',
  d_alarm_system: 'Whether there is a monitored alarm system (not just a siren — one that calls a monitoring company) (yes/no)',
  d_fire_extinguishers: 'Whether fire extinguishers are present and have been inspected in past 12 months (yes/no)',
  e_prior_carrier: 'Current or most recent insurance carrier name',
  e_prior_policy_number: 'Prior policy number',
  e_prior_policy_dates: 'Prior policy start and end dates',
  e_prior_premium: 'Prior policy annual premium (approximate is fine)',
  e_claims: 'Whether there were any insurance claims in past 5 years (yes/no)',
}

export interface GeminiResponse {
  message: string
  fields: Record<string, string>
  is_complete: boolean
}

export type ConversationTurn = { role: 'user' | 'model'; text: string }

function buildSystemPrompt(
  ownerName: string,
  businessName: string,
  collected: Record<string, unknown>,
  isDemoMode: boolean
): string {
  const collectedLines = Object.entries(collected)
    .filter(([, v]) => v && v !== 'skipped')
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n')

  const qaRule = `
ANSWERING INSURANCE QUESTIONS: If the user asks any insurance-related question mid-conversation — such as "would I be covered if X happens?", "what does liability insurance cover?", "why do you need my FEIN?", "what's a BOP?", or any scenario question — answer it helpfully in 2–3 plain-English sentences first. Then continue with the next intake question on a new paragraph. Capture any intake fields the message incidentally contains.`

  const fieldList = isDemoMode ? DEMO_FIELDS : REQUIRED_FIELDS
  const missing = fieldList.filter(k => !collected[k] || collected[k] === 'skipped')
  const nextField = missing[0]

  const alreadyCollectedSection = collectedLines
    ? `ALREADY COLLECTED — do NOT ask about these again:\n${collectedLines}`
    : `ALREADY COLLECTED: (none yet)`

  const nextFieldSection = nextField
    ? `NEXT FIELD TO ASK ABOUT:\n  ${nextField}: ${FIELD_DESCRIPTIONS[nextField]}\n\nDo NOT ask about any other field until this one is answered.`
    : `All fields collected — wrap up warmly now. Mention that a broker will be in touch with a personalized link for the full application.`

  const completionRule = isDemoMode
    ? `- When all fields are collected, set is_complete to true and write a natural closing message. Mention the broker will send a personalized link for the full application.`
    : `- When all fields are collected, set is_complete to true`

  return `You are an insurance intake assistant for District Cover, helping San Francisco small business owners apply for commercial insurance.

You are speaking with ${ownerName}, owner of ${businessName}.

${alreadyCollectedSection}

${nextFieldSection}

RULES:
- Acknowledge the user's last answer briefly before asking the next question
- If the user gives multiple facts in one message, extract all of them in "fields", then ask about the NEXT missing field
- For yes/no fields, normalize the value to exactly "yes" or "no"
- Do not ask about document/photo uploads
- Be friendly and plain-English — not like a form
${completionRule}
- Be non-judgmental about prior claims, cancellations, or violations
${qaRule}

RESPONSE FORMAT — always return valid JSON, no markdown, no code fences:
{
  "message": "your conversational reply to the user",
  "fields": { "field_key": "extracted value" },
  "is_complete": false
}`
}

export async function geminiChat(
  userMessage: string,
  ownerName: string,
  businessName: string,
  collected: Record<string, unknown>,
  history: ConversationTurn[],
  isDemoMode = false
): Promise<GeminiResponse> {
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: buildSystemPrompt(ownerName, businessName, collected, isDemoMode) },
    ...history.map(turn => ({
      role: (turn.role === 'model' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: turn.text,
    })),
    { role: 'user', content: userMessage },
  ]

  const response = await getNebiusClient().chat.completions.create({
    model: 'meta-llama/Llama-3.3-70B-Instruct',
    messages,
    response_format: { type: 'json_object' },
    temperature: 0.7,
  })

  const raw = response.choices[0]?.message?.content?.trim() ?? ''

  try {
    return JSON.parse(raw) as GeminiResponse
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) as GeminiResponse } catch {}
    }
    return { message: raw, fields: {}, is_complete: false }
  }
}

export { REQUIRED_FIELDS }
