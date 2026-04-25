import { NextResponse } from 'next/server'

import {
  ACORD_SECTIONS,
  SCORE_DIMENSIONS,
  collectSectionEntries,
  createDossierPdfBytes,
  getUploadGroups,
  toDossierFileName,
} from '@/lib/dashboard/dossier'
import { getDossierData } from '@/lib/dashboard/data'
import type { IntakeSectionKey, ReadinessScore } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

type ExportContext = {
  params: Promise<{ clientId: string }> | { clientId: string }
}

function scoreValue(score: ReadinessScore, key: string) {
  return Number((score as unknown as Record<string, number>)[key] ?? 0)
}

function buildPdfLines(data: Awaited<ReturnType<typeof getDossierData>>): string[] {
  const { client, intakeData, uploads, score } = data
  const lines = [
    'District Cover Broker Dossier',
    `Business: ${client.business_name}`,
    `Owner: ${client.owner_name}`,
    `Owner contact: ${client.owner_contact ?? 'Not provided'}`,
    `Intake status: ${client.intake_status}`,
    '',
  ]

  if (score) {
    lines.push(`Readiness score: ${score.total_score}/100`)
    for (const dimension of SCORE_DIMENSIONS) {
      lines.push(`${dimension.label}: ${scoreValue(score, dimension.key)}/${dimension.max}`)
    }
    lines.push('')
  } else {
    lines.push('Readiness score: Not calculated')
    lines.push('')
  }

  for (const section of ACORD_SECTIONS) {
    lines.push(section.label)
    const entries = collectSectionEntries(intakeData?.[section.key as IntakeSectionKey] ?? {})
    if (entries.length === 0) {
      lines.push('No answers yet.')
    } else {
      for (const entry of entries) {
        lines.push(`${entry.label}: ${entry.value}`)
      }
    }
    lines.push('')
  }

  lines.push('Uploaded documents')
  const groups = getUploadGroups(uploads)
  if (groups.length === 0) {
    lines.push('No uploads yet.')
  } else {
    for (const group of groups) {
      lines.push(group.label)
      for (const upload of group.uploads) {
        lines.push(`${upload.file_name} (${upload.file_type}) - ${upload.uploaded_at}`)
      }
    }
  }

  return lines
}

export async function GET(_request: Request, context: ExportContext) {
  const { clientId } = await context.params
  const dossier = await getDossierData(clientId)
  const pdf = createDossierPdfBytes(buildPdfLines(dossier))

  return new NextResponse(Buffer.from(pdf) as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${toDossierFileName(dossier.client.business_name)}"`,
    },
  })
}
