import type { Client, IntakeAnswers, IntakeSectionKey, Upload } from '../supabase/types.js'

export const FIELD_LABELS: Record<string, string> = {
  a_business_name: 'Business name',
  a_entity_type: 'Entity type',
  a_fein: 'FEIN',
  a_date_started: 'Date started',
  a_website: 'Website',
  a_phone: 'Phone',
  a_contact_name: 'Contact name',
  a_contact_email: 'Contact email',
  b_address: 'Address',
  b_ownership: 'Ownership',
  b_landlord: 'Landlord',
  b_total_sqft: 'Total sq ft',
  b_occupied_sqft: 'Occupied sq ft',
  b_public_sqft: 'Public sq ft',
  b_sublease: 'Sublease',
  b_annual_revenue: 'Annual revenue',
  b_fulltime_employees: 'Full-time employees',
  b_parttime_employees: 'Part-time employees',
  b_operations: 'Description of operations',
  c_subsidiary: 'Subsidiary / parent',
  c_safety_manual: 'Safety manual',
  c_hazardous_materials: 'Hazardous materials',
  c_other_insurance: 'Other insurance',
  c_prior_cancellation: 'Prior cancellation',
  c_discrimination_claims: 'Discrimination claims',
  c_arson: 'Arson history',
  c_code_violations: 'Code violations',
  c_bankruptcy: 'Bankruptcy',
  c_judgements: 'Judgements',
  c_trust: 'Trust',
  c_foreign_operations: 'Foreign operations',
  c_other_ventures: 'Other ventures',
  c_drones: 'Drones',
  d_roof_age: 'Roof age',
  d_roof_inspection: 'Roof inspection',
  d_electrical_panel: 'Electrical panel',
  d_electrical_photo: 'Electrical panel photo',
  d_sprinklers: 'Sprinklers',
  d_sprinkler_certificate: 'Sprinkler certificate',
  d_alarm_system: 'Alarm system',
  d_alarm_contract: 'Alarm contract',
  d_fire_extinguishers: 'Fire extinguishers',
  d_extinguisher_photo: 'Extinguisher photo',
  e_prior_carrier: 'Prior carrier',
  e_prior_policy_number: 'Prior policy number',
  e_prior_policy_dates: 'Prior policy dates',
  e_prior_premium: 'Prior premium',
  e_claims: 'Claims',
  e_claims_detail: 'Claims detail',
}

export const ACORD_SECTIONS: Array<{ key: IntakeSectionKey; label: string }> = [
  { key: 'section_a', label: 'Section A - Applicant Identity' },
  { key: 'section_b', label: 'Section B - Premises' },
  { key: 'section_c', label: 'Section C - General Information' },
  { key: 'section_d', label: 'Section D - Physical Property' },
  { key: 'section_e', label: 'Section E - Loss History' },
]

export const SCORE_DIMENSIONS = [
  { key: 'documentation_score', label: 'Documentation', max: 25 },
  { key: 'safety_score', label: 'Safety', max: 25 },
  { key: 'property_score', label: 'Property', max: 20 },
  { key: 'claims_score', label: 'Claims', max: 20 },
  { key: 'neighborhood_score', label: 'Neighborhood', max: 10 },
] as const

export type StatusCounts = Record<Client['intake_status'], number>

export interface SectionEntry {
  key: string
  label: string
  value: string
}

export interface UploadGroup {
  label: string
  uploads: Upload[]
}

export function buildTelegramLink(token: string, botUsername = 'DistrictCoverBot'): string {
  return `https://t.me/${botUsername}?start=${encodeURIComponent(token)}`
}

export function countClientStatuses(clients: Pick<Client, 'intake_status'>[]): StatusCounts {
  return clients.reduce<StatusCounts>(
    (counts, client) => {
      counts[client.intake_status] += 1
      return counts
    },
    { pending: 0, in_progress: 0, complete: 0 },
  )
}

export function formatAnswer(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(formatAnswer).join(', ')
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  return String(value)
}

export function isDisplayableAnswer(value: unknown): boolean {
  return value !== '' && value !== null && value !== undefined && value !== false
}

export function collectSectionEntries(section: IntakeAnswers): SectionEntry[] {
  return Object.entries(section)
    .filter(([, value]) => isDisplayableAnswer(value))
    .map(([key, value]) => ({
      key,
      label: FIELD_LABELS[key] ?? key,
      value: formatAnswer(value),
    }))
}

export function getUploadGroups(uploads: Upload[]): UploadGroup[] {
  const groups = new Map<string, Upload[]>()

  for (const upload of uploads) {
    const label = upload.label || upload.file_name
    groups.set(label, [...(groups.get(label) ?? []), upload])
  }

  return Array.from(groups, ([label, groupedUploads]) => ({
    label,
    uploads: groupedUploads,
  }))
}

export function toDossierFileName(businessName: string): string {
  const slug =
    businessName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'client'

  return `district-cover-${slug}-dossier.pdf`
}

function escapePdfText(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)')
}

function wrapPdfLines(lines: string[]): string[] {
  return lines.flatMap((line) => {
    if (line.length <= 88) {
      return line
    }

    const chunks: string[] = []
    let remaining = line
    while (remaining.length > 88) {
      const splitAt = remaining.lastIndexOf(' ', 88)
      const index = splitAt > 30 ? splitAt : 88
      chunks.push(remaining.slice(0, index))
      remaining = remaining.slice(index).trimStart()
    }
    if (remaining) {
      chunks.push(remaining)
    }
    return chunks
  })
}

export function createDossierPdfBytes(lines: string[]): Uint8Array {
  const safeLines = wrapPdfLines(lines.length > 0 ? lines : ['District Cover Broker Dossier'])
  const contentLines = ['BT', '/F1 10 Tf', '50 760 Td']

  safeLines.forEach((line, index) => {
    if (index > 0) {
      contentLines.push('0 -15 Td')
    }
    contentLines.push(`(${escapePdfText(line)}) Tj`)
  })

  contentLines.push('ET')
  const stream = contentLines.join('\n')

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream\nendobj\n`,
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'))
    pdf += object
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8')
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`
  pdf += `startxref\n${xrefOffset}\n%%EOF\n`

  return new TextEncoder().encode(pdf)
}
