import OpenAI from 'openai'

const nebius = new OpenAI({
  apiKey: process.env.NEBIUS_API_KEY!,
  baseURL: 'https://api.studio.nebius.com/v1/',
})

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

// The 5 fields we collect in demo mode — in order, one at a time
const DEMO_FIELD_ORDER = ['b_operations', 'b_annual_revenue', 'b_fulltime_employees', 'd_extinguisher_photo', 'e_claims'] as const

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

// Question text for each demo field — hardcoded so the server controls the sequence
const DEMO_QUESTIONS: Record<string, string> = {
  b_operations: `Tell me a bit about what your business does day-to-day — who are your customers and what services do you provide?`,
  b_annual_revenue: `Roughly what was your total revenue last year?`,
  b_fulltime_employees: `How many people work with you — full-time including yourself, and any part-time?`,
  d_extinguisher_photo: `Upload a clear photo of your fire extinguisher with the inspection label, mounting and placement clearly visible.`,
  e_claims: `Last one: any insurance claims in the past 5 years — like a slip-and-fall, property damage, or theft?`,
}

// Called by bot.ts to get the next question after extracting the current field
export function getNextDemoQuestion(
  collectedBefore: Record<string, unknown>,
  extractedNow: Record<string, string>
): string | null {
  const updated = { ...collectedBefore, ...extractedNow }
  const next = DEMO_FIELD_ORDER.find(k => !updated[k] || updated[k] === 'skipped')
  return next ? DEMO_QUESTIONS[next] : null
}

export function isDemoComplete(collected: Record<string, unknown>): boolean {
  return DEMO_FIELD_ORDER.every(k => !!(collected[k]) && collected[k] !== 'skipped')
}

// Hardcoded insurance Q&A answer — shown any time the user asks an insurance question in demo mode
export const DEMO_INSURANCE_ANSWER =
  "Great question! Yes — that's exactly what General Liability covers. " +
  "It handles medical costs and legal fees if a customer is injured on your premises. " +
  "It's a core part of a Business Owner's Policy (BOP), which is what we'd typically recommend for a business like yours."

export const DEMO_EXTINGUISHER_RESPONSE =
  "The fire extinguisher is clearly visible. The mounting is secure and accessible. " +
  "However I do not see a pressure gauge and the inspection label is barely legible. " +
  "Due to these issues, I will have to flag this for manual review."

// Returns the current field key that still needs to be collected in demo mode
export function getCurrentDemoField(collected: Record<string, unknown>): typeof DEMO_FIELD_ORDER[number] | null {
  return DEMO_FIELD_ORDER.find(k => !collected[k] || collected[k] === 'skipped') ?? null
}

export function isInsuranceQuestion(text: string): boolean {
  const lower = text.toLowerCase()
  return ['cover', 'covered', 'coverage', 'claim', 'liability', 'bop', 'policy', 'premium', 'deductible', 'insur'].some(kw => lower.includes(kw))
}

function buildDemoSystemPrompt(
  ownerName: string,
  businessName: string,
  collected: Record<string, unknown>,
  userMessage: string
): string {
  // Opening turn — just write a greeting; bot.ts appends the first question
  if (userMessage === '__start__') {
    return `You are a friendly insurance intake assistant for District Cover.
Greet ${ownerName}, owner of ${businessName}, in exactly one warm sentence. Do not ask any question — a question will follow separately.

Respond with valid JSON, no markdown:
{"message": "one-sentence greeting only", "fields": {}, "is_complete": false}`
  }

  const currentFieldKey = DEMO_FIELD_ORDER.find(k => !collected[k] || collected[k] === 'skipped')

  // All fields collected — write the closing
  if (!currentFieldKey) {
    return `You are a friendly insurance intake assistant for District Cover.
Write a warm 2-3 sentence closing for ${ownerName} of ${businessName}. Thank them and say their broker will review their profile and be in touch with a personalized link to complete the full application when ready.

Respond with valid JSON, no markdown:
{"message": "your closing", "fields": {}, "is_complete": true}`
  }

  const currentQuestion = DEMO_QUESTIONS[currentFieldKey]
  const additionalExtract = currentFieldKey === 'b_fulltime_employees'
    ? ' Also extract "b_parttime_employees" if they mention part-time staff (number).'
    : ''

  return `You are a friendly insurance intake assistant for District Cover.
You are speaking with ${ownerName}, owner of ${businessName}.

The user was just asked: "${currentQuestion}"

YOUR ONLY JOB:
1. If the user ANSWERED the question — write one warm sentence acknowledging their answer. Extract "${currentFieldKey}" into fields.${additionalExtract} Do NOT ask any question (a question will follow separately).
2. If the user asked an INSURANCE QUESTION — anything about coverage, claims, what a policy covers, insurance terms (BOP, liability, deductible, etc.), or specific "what if X happens?" scenarios — give a clear, helpful 2-4 sentence answer the way a knowledgeable insurance advisor would. Be specific to their business type. Do not extract any field. The current question will be repeated separately after your answer.
3. If the user said something unclear or off-topic — acknowledge briefly and say you'll come back to the question.

RULES:
- For yes/no fields normalize to exactly "yes" or "no"
- Never ask what they've already answered
- Never volunteer information beyond what is asked

Respond with valid JSON, no markdown:
{"message": "your one-sentence response", "fields": {"${currentFieldKey}": "extracted value or empty"}, "is_complete": false}`
}

function buildFullSystemPrompt(
  ownerName: string,
  businessName: string,
  collected: Record<string, unknown>
): string {
  const missing = REQUIRED_FIELDS.filter(k => !collected[k] || collected[k] === 'skipped')
  const nextField = missing[0]
  const collectedLines = Object.entries(collected)
    .filter(([, v]) => v && v !== 'skipped')
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n')

  if (!nextField) {
    return `You are an insurance intake assistant for District Cover.
You are speaking with ${ownerName}, owner of ${businessName}.
All required information has been collected. Write a warm closing message. Set is_complete to true.
Respond with valid JSON: {"message": "...", "fields": {}, "is_complete": true}`
  }

  const afterNext = missing[1]

  return `You are an insurance intake assistant for District Cover, helping San Francisco small business owners apply for commercial insurance.
You are speaking with ${ownerName}, owner of ${businessName}.

ALREADY COLLECTED — do NOT ask about these again:
${collectedLines || '  (none yet)'}

CURRENT QUESTION TO ASK (or extract if already in the user's message):
  ${nextField}: ${FIELD_DESCRIPTIONS[nextField]}
${afterNext ? `\nAFTER THIS, ask about: ${afterNext} — ${FIELD_DESCRIPTIONS[afterNext]}` : '\nAfter this, all done — wrap up warmly and set is_complete to true.'}

INSURANCE QUESTIONS: If the user asks any insurance question, answer it in 2 plain-English sentences, then ask the current question.

RULES:
- Acknowledge the user's last answer briefly, then ask the current question
- If the user answers multiple things at once, extract all into "fields" and move to the next missing field
- For yes/no fields, normalize to exactly "yes" or "no"
- Do not ask about document/photo uploads
- Be non-judgmental about prior claims or violations

Respond with valid JSON, no markdown:
{"message": "your response", "fields": {"field_key": "extracted value"}, "is_complete": false}`
}

function buildSystemPrompt(
  ownerName: string,
  businessName: string,
  collected: Record<string, unknown>,
  isDemoMode: boolean,
  userMessage: string
): string {
  if (isDemoMode) return buildDemoSystemPrompt(ownerName, businessName, collected, userMessage)
  return buildFullSystemPrompt(ownerName, businessName, collected)
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
    { role: 'system', content: buildSystemPrompt(ownerName, businessName, collected, isDemoMode, userMessage) },
    ...history.map(turn => ({
      role: (turn.role === 'model' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: turn.text,
    })),
    { role: 'user', content: userMessage },
  ]

  const response = await nebius.chat.completions.create({
    model: 'deepseek-ai/DeepSeek-V3.2-fast',
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
