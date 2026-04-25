export interface Question {
  key: string
  section: 'a' | 'b' | 'c' | 'd' | 'e'
  text: string
  followUp?: string
  type: 'text' | 'choice' | 'yes_no' | 'number' | 'upload_photo' | 'upload_pdf' | 'upload_either'
  choices?: string[]
  required: boolean
  acordField: string
}

// Section A — Applicant Identity
const SECTION_A: Question[] = [
  {
    key: 'a_business_name',
    section: 'a',
    text: "Let's start with the basics. What's the full legal name of your business? If you operate under a different name (DBA), include that too.",
    type: 'text',
    required: true,
    acordField: 'First Named Insured / DBA',
  },
  {
    key: 'a_entity_type',
    section: 'a',
    text: "What type of business entity is it?",
    type: 'choice',
    choices: ['LLC', 'Corporation', 'Sole Proprietorship', 'Partnership', 'Other'],
    required: true,
    acordField: 'Entity Type',
  },
  {
    key: 'a_fein',
    section: 'a',
    text: "What's your Federal Employer Identification Number (FEIN)? If you're a sole proprietor without one, your SSN works.",
    followUp: "This is required to issue a policy.",
    type: 'text',
    required: true,
    acordField: 'FEIN or SOC SEC #',
  },
  {
    key: 'a_date_started',
    section: 'a',
    text: "What year did this business start?",
    type: 'text',
    required: true,
    acordField: 'Date Business Started',
  },
  {
    key: 'a_website',
    section: 'a',
    text: "Do you have a business website? If yes, what's the URL? (Type 'none' if not applicable)",
    type: 'text',
    required: false,
    acordField: 'Website Address',
  },
  {
    key: 'a_phone',
    section: 'a',
    text: "What's the best phone number to reach the business?",
    type: 'text',
    required: true,
    acordField: 'Business Phone #',
  },
]

// Section B — Premises
const SECTION_B: Question[] = [
  {
    key: 'b_address',
    section: 'b',
    text: "What's the full street address of the business in San Francisco?",
    type: 'text',
    required: true,
    acordField: 'Street / City / State / ZIP',
  },
  {
    key: 'b_ownership',
    section: 'b',
    text: "Does the business own or rent this space?",
    type: 'choice',
    choices: ['Owner (we own the building)', 'Tenant (we rent/lease)'],
    required: true,
    acordField: 'Interest: Owner / Tenant',
  },
  {
    key: 'b_landlord',
    section: 'b',
    text: "What's the landlord's name and when does your lease expire? (e.g. 'John Smith, Dec 2027')",
    type: 'text',
    required: false,
    acordField: 'Leaseback / Interest End Date',
  },
  {
    key: 'b_total_sqft',
    section: 'b',
    text: "Approximately how many square feet is the total building?",
    type: 'number',
    required: true,
    acordField: 'Total Building Area',
  },
  {
    key: 'b_occupied_sqft',
    section: 'b',
    text: "How many square feet does your business occupy?",
    type: 'number',
    required: true,
    acordField: 'Occupied Area',
  },
  {
    key: 'b_public_sqft',
    section: 'b',
    text: "How much of that space is open to customers or the public? (Square feet)",
    followUp: "This is used to calculate your General Liability exposure — it's the area where slip-and-fall incidents could happen.",
    type: 'number',
    required: true,
    acordField: 'Open to Public Area',
  },
  {
    key: 'b_sublease',
    section: 'b',
    text: "Do you sublease any part of the space to other businesses or individuals?",
    type: 'yes_no',
    required: true,
    acordField: 'Any Area Leased to Others',
  },
  {
    key: 'b_annual_revenue',
    section: 'b',
    text: "What was your approximate annual revenue last year? (Round to nearest $10k is fine)",
    type: 'text',
    required: true,
    acordField: 'Annual Revenues',
  },
  {
    key: 'b_fulltime_employees',
    section: 'b',
    text: "How many full-time employees do you have, including yourself?",
    type: 'number',
    required: true,
    acordField: '# Full Time Empl',
  },
  {
    key: 'b_parttime_employees',
    section: 'b',
    text: "How many part-time employees?",
    type: 'number',
    required: true,
    acordField: '# Part Time Empl',
  },
  {
    key: 'b_operations',
    section: 'b',
    text: "Describe what your business does in 2–3 sentences. What do you sell or provide, and who are your customers?",
    type: 'text',
    required: true,
    acordField: 'Description of Operations',
  },
]

// Section C — General Information (ACORD Q1–Q15)
const SECTION_C: Question[] = [
  {
    key: 'c_subsidiary',
    section: 'c',
    text: "Is this business a subsidiary of, or does it have a parent company or holding company?",
    type: 'yes_no',
    required: true,
    acordField: 'ACORD Q1 - Subsidiary',
  },
  {
    key: 'c_safety_manual',
    section: 'c',
    text: "Does your business have a written safety manual or formal safety procedures?",
    followUp: "Businesses with formal safety programs have 40–50% fewer workplace injury claims (OSHA). This directly affects your General Liability premium.",
    type: 'yes_no',
    required: true,
    acordField: 'ACORD Q2 - Safety Manual',
  },
  {
    key: 'c_hazardous_materials',
    section: 'c',
    text: "Does your business use, store, or sell any flammable liquids, explosives, or chemicals?",
    type: 'yes_no',
    required: true,
    acordField: 'ACORD Q3 - Hazardous Exposure',
  },
  {
    key: 'c_other_insurance',
    section: 'c',
    text: "Do you have any other insurance policies with the same carrier you're applying with? (Type 'not sure' if you don't know)",
    type: 'text',
    required: false,
    acordField: 'ACORD Q4 - Other Insurance Same Carrier',
  },
  {
    key: 'c_prior_cancellation',
    section: 'c',
    text: "In the past 3 years, has any insurance policy been declined, cancelled, or not renewed?",
    followUp: "If yes, please briefly explain why. Non-payment is treated very differently from an underwriting cancellation.",
    type: 'yes_no',
    required: true,
    acordField: 'ACORD Q5 - Prior Cancellation',
  },
  {
    key: 'c_discrimination_claims',
    section: 'c',
    text: "Have there been any claims or lawsuits related to discrimination, harassment, or wrongful termination in the past 5 years?",
    type: 'yes_no',
    required: true,
    acordField: 'ACORD Q6 - Discrimination Claims',
  },
  {
    key: 'c_arson',
    section: 'c',
    text: "In the past 5 years, has any owner, officer, or principal of this business been convicted of or indicted for arson?",
    type: 'yes_no',
    required: true,
    acordField: 'ACORD Q7 - Arson Conviction',
  },
  {
    key: 'c_code_violations',
    section: 'c',
    text: "Are there any uncorrected fire, safety, or building code violations at your property right now?",
    followUp: "An open violation blocks your submission. If there is one, we'll help you understand what to do.",
    type: 'yes_no',
    required: true,
    acordField: 'ACORD Q8 - Code Violations',
  },
  {
    key: 'c_bankruptcy',
    section: 'c',
    text: "In the past 5 years, has the business or any principal had a bankruptcy, foreclosure, or repossession?",
    type: 'yes_no',
    required: true,
    acordField: 'ACORD Q9 - Bankruptcy',
  },
  {
    key: 'c_judgements',
    section: 'c',
    text: "In the past 5 years, have there been any unsatisfied judgements or tax liens against the business or any principal?",
    type: 'yes_no',
    required: true,
    acordField: 'ACORD Q10 - Judgements / Liens',
  },
  {
    key: 'c_trust',
    section: 'c',
    text: "Is the business or any of its assets held in a trust?",
    type: 'yes_no',
    required: false,
    acordField: 'ACORD Q11 - Business in Trust',
  },
  {
    key: 'c_foreign_operations',
    section: 'c',
    text: "Does the business have any operations, products, or services outside the United States?",
    type: 'yes_no',
    required: true,
    acordField: 'ACORD Q12 - Foreign Operations',
  },
  {
    key: 'c_other_ventures',
    section: 'c',
    text: "Do you or any principal have other business ventures that are NOT being covered under this policy?",
    type: 'yes_no',
    required: false,
    acordField: 'ACORD Q13 - Other Business Ventures',
  },
  {
    key: 'c_drones',
    section: 'c',
    text: "Does the business own, operate, or hire others to operate drones (unmanned aircraft) for any purpose?",
    type: 'yes_no',
    required: true,
    acordField: 'ACORD Q14/Q15 - Drone Operations',
  },
]

// Section D — Physical Property (non-public data — the primary differentiator)
const SECTION_D: Question[] = [
  {
    key: 'd_roof_age',
    section: 'd',
    text: "How old is the roof on this building, and what's it made of? (e.g. '15 years, flat tar and gravel')",
    followUp: "Roof age and condition is the single largest property valuation variable for underwriters. An unverified old roof gets rated at worst-case.",
    type: 'text',
    required: true,
    acordField: 'Roof Material / Age',
  },
  {
    key: 'd_roof_inspection',
    section: 'd',
    text: "Do you have a roof inspection report from the past 5 years? If yes, please upload it as a PDF.",
    type: 'upload_pdf',
    required: false,
    acordField: 'Roof Inspection Report',
  },
  {
    key: 'd_electrical_panel',
    section: 'd',
    text: "What type of electrical panel does the building have, and how old is it? (e.g. '200-amp circuit breaker, ~20 years old')",
    followUp: "Knob-and-tube wiring or fuse boxes are major flags for underwriters. Modern panels are a significant positive.",
    type: 'text',
    required: true,
    acordField: 'Electrical Panel Type / Age',
  },
  {
    key: 'd_electrical_photo',
    section: 'd',
    text: "Can you take a photo of the electrical panel? This helps verify the type and condition.",
    type: 'upload_photo',
    required: false,
    acordField: 'Electrical Panel Photo',
  },
  {
    key: 'd_sprinklers',
    section: 'd',
    text: "Does the building have a fire sprinkler system?",
    followUp: "NFPA data shows sprinklers reduce property loss per fire by 50–75%. This can save 8–15% on your premium.",
    type: 'yes_no',
    required: true,
    acordField: 'Fire Suppression Present',
  },
  {
    key: 'd_sprinkler_certificate',
    section: 'd',
    text: "Please upload your most recent fire suppression inspection certificate (PDF).",
    type: 'upload_pdf',
    required: false,
    acordField: 'Fire Suppression Certificate',
  },
  {
    key: 'd_alarm_system',
    section: 'd',
    text: "Is there a monitored alarm system at this location? (Not just a siren — one that notifies a monitoring company)",
    followUp: "IBHS data shows monitored alarms reduce theft/burglary claim frequency by 60–80%. Significant premium impact.",
    type: 'yes_no',
    required: true,
    acordField: 'Monitored Alarm Present',
  },
  {
    key: 'd_alarm_contract',
    section: 'd',
    text: "Can you upload your alarm monitoring contract? This confirms the provider and that it's active.",
    type: 'upload_pdf',
    required: false,
    acordField: 'Alarm Monitoring Contract',
  },
  {
    key: 'd_fire_extinguishers',
    section: 'd',
    text: "Are there fire extinguishers on the premises, and have they been inspected in the past 12 months?",
    type: 'yes_no',
    required: true,
    acordField: 'Fire Extinguishers Present/Inspected',
  },
  {
    key: 'd_extinguisher_photo',
    section: 'd',
    text: "Please send a photo of a fire extinguisher tag — this confirms the inspection date.",
    type: 'upload_photo',
    required: false,
    acordField: 'Fire Extinguisher Tag Photo',
  },
]

// Section E — Loss History
const SECTION_E: Question[] = [
  {
    key: 'e_prior_carrier',
    section: 'e',
    text: "Who is your current or most recent insurance carrier? (Company name)",
    type: 'text',
    required: true,
    acordField: 'Prior Carrier',
  },
  {
    key: 'e_prior_policy_number',
    section: 'e',
    text: "What's the policy number? (Check your insurance card or policy documents)",
    type: 'text',
    required: true,
    acordField: 'Prior Policy Number',
  },
  {
    key: 'e_prior_policy_dates',
    section: 'e',
    text: "When does/did that policy run? (Start and end dates, e.g. 'Jan 1 2025 – Jan 1 2026')",
    type: 'text',
    required: true,
    acordField: 'Policy Effective / Expiration',
  },
  {
    key: 'e_prior_premium',
    section: 'e',
    text: "What was the annual premium on that policy? (Approximate is fine)",
    type: 'text',
    required: true,
    acordField: 'Prior Premium',
  },
  {
    key: 'e_claims',
    section: 'e',
    text: "Have you had any insurance claims in the past 5 years? This includes any incident, regardless of who was at fault.",
    type: 'yes_no',
    required: true,
    acordField: 'Loss History',
  },
  {
    key: 'e_claims_detail',
    section: 'e',
    text: "Please describe each claim: date, type of incident, amount paid, and whether it's still open. (e.g. 'March 2023, slip and fall, $8,000 paid, closed')",
    type: 'text',
    required: false,
    acordField: 'Loss History Detail',
  },
]

export const ALL_QUESTIONS: Question[] = [
  ...SECTION_A,
  ...SECTION_B,
  ...SECTION_C,
  ...SECTION_D,
  ...SECTION_E,
]

export const QUESTION_BY_KEY = Object.fromEntries(
  ALL_QUESTIONS.map(q => [q.key, q])
)

// Returns the next question key, or null if all questions are done
export function getNextQuestionKey(
  currentKey: string | null,
  answers: Record<string, unknown>
): string | null {
  if (!currentKey) return ALL_QUESTIONS[0].key

  const currentIndex = ALL_QUESTIONS.findIndex(q => q.key === currentKey)
  if (currentIndex === -1) return null

  for (let i = currentIndex + 1; i < ALL_QUESTIONS.length; i++) {
    const next = ALL_QUESTIONS[i]

    // Skip landlord question if owner (not tenant)
    if (next.key === 'b_landlord') {
      const ownership = answers['b_ownership'] as string
      if (!ownership?.toLowerCase().includes('tenant')) continue
    }

    // Skip sprinkler certificate if no sprinklers
    if (next.key === 'd_sprinkler_certificate') {
      if (answers['d_sprinklers'] !== 'yes') continue
    }

    // Skip alarm contract if no alarm system
    if (next.key === 'd_alarm_contract') {
      if (answers['d_alarm_system'] !== 'yes') continue
    }

    // Skip extinguisher photo if no extinguishers
    if (next.key === 'd_extinguisher_photo') {
      if (answers['d_fire_extinguishers'] !== 'yes') continue
    }

    // Skip claims detail if no prior claims
    if (next.key === 'e_claims_detail') {
      if (answers['e_claims'] !== 'yes') continue
    }

    return next.key
  }

  return null // intake complete
}
