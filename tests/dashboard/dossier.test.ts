import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  COST_REDUCTION_ACTIONS,
  SAVINGS_HORIZON_YEARS,
  projectedNetSavings,
  totalImplementationCost,
  totalProjectedGrossSavings,
  totalProjectedNetSavings,
} from '../../lib/dashboard/cost-reduction-plan.js'
import { AI_EVIDENCE_REVIEWS, getDemoReadinessScore } from '../../lib/dashboard/demo-intake.js'
import { NON_ACORD_PRIVATE_DATA_ITEMS } from '../../lib/dashboard/non-acord-data.js'
import {
  buildTelegramLink,
  collectSectionEntries,
  countClientStatuses,
  createDossierPdfBytes,
  getUploadGroups,
  toDossierFileName,
} from '../../lib/dashboard/dossier.js'
import type { Client, Upload } from '../../lib/supabase/types.js'

function client(overrides: Partial<Client> = {}): Client {
  return {
    id: 'client-1',
    broker_id: 'broker-1',
    business_name: 'Golden Gate Bakery',
    owner_name: 'Mina Patel',
    owner_contact: '415-555-0100',
    telegram_chat_id: null,
    intake_token: 'token-123',
    intake_status: 'pending',
    created_at: '2026-04-25T10:00:00.000Z',
    updated_at: '2026-04-25T10:00:00.000Z',
    ...overrides,
  }
}

describe('dashboard dossier helpers', () => {
  it('uses the fixed MVP Telegram bot link while tokenized links are deferred', () => {
    assert.equal(
      buildTelegramLink('abc-123', 'DistrictCoverBot'),
      'https://t.me/Rova_district_bot?start=demo-test-token-123',
    )
  })

  it('counts clients by intake status', () => {
    assert.deepEqual(
      countClientStatuses([
        client({ id: '1', intake_status: 'pending' }),
        client({ id: '2', intake_status: 'in_progress' }),
        client({ id: '3', intake_status: 'complete' }),
        client({ id: '4', intake_status: 'complete' }),
      ]),
      { pending: 1, in_progress: 1, complete: 2 },
    )
  })

  it('collects displayable ACORD section entries with stable labels', () => {
    assert.deepEqual(
      collectSectionEntries({
        a_business_name: 'Golden Gate Bakery',
        a_entity_type: 'LLC',
        a_website: '',
        c_drones: false,
      }),
      [
        { key: 'a_business_name', label: 'Business name', value: 'Golden Gate Bakery' },
        { key: 'a_entity_type', label: 'Entity type', value: 'LLC' },
      ],
    )
  })

  it('groups uploads by label for broker review and export', () => {
    const uploads: Upload[] = [
      {
        id: 'upload-1',
        client_id: 'client-1',
        storage_path: 'client-uploads/client-1/d_alarm_contract/upload-1-alarm.pdf',
        file_name: 'alarm.pdf',
        file_type: 'pdf',
        label: 'Alarm contract',
        telegram_file_id: 'tg-1',
        uploaded_at: '2026-04-25T10:00:00.000Z',
      },
      {
        id: 'upload-2',
        client_id: 'client-1',
        storage_path: 'client-uploads/client-1/d_alarm_contract/upload-2-alarm-photo.jpg',
        file_name: 'alarm-photo.jpg',
        file_type: 'photo',
        label: 'Alarm contract',
        telegram_file_id: 'tg-2',
        uploaded_at: '2026-04-25T10:05:00.000Z',
      },
    ]

    assert.deepEqual(getUploadGroups(uploads), [
      { label: 'Alarm contract', uploads },
    ])
  })

  it('creates a stable PDF export filename from the business name', () => {
    assert.equal(
      toDossierFileName('Golden Gate Bakery & Café'),
      'district-cover-golden-gate-bakery-caf-dossier.pdf',
    )
  })

  it('creates downloadable PDF bytes for a dossier export', () => {
    const bytes = createDossierPdfBytes([
      'District Cover Broker Dossier',
      'Business: Golden Gate Bakery',
      'Readiness score: 82/100',
    ])

    assert.equal(Buffer.from(bytes.subarray(0, 5)).toString('utf8'), '%PDF-')
    assert.ok(bytes.length > 300)
  })

  it('calculates a complete readiness score from the MVP demo intake answers', () => {
    const score = getDemoReadinessScore('client-1')

    assert.equal(score.total_score, 95)
    assert.equal(score.documentation_score, 25)
    assert.equal(score.safety_score, 25)
    assert.equal(score.property_score, 20)
    assert.equal(score.claims_score, 20)
    assert.equal(score.neighborhood_score, 5)
  })

  it('defines sample AI-reviewed evidence for the MVP dossier', () => {
    assert.equal(AI_EVIDENCE_REVIEWS.length, 4)
    assert.deepEqual(
      AI_EVIDENCE_REVIEWS.map((review) => review.label),
      ['Electrical panel photo', 'Fire extinguisher photo', 'Sprinkler head photo', 'Alarm panel photo'],
    )
    assert.ok(AI_EVIDENCE_REVIEWS.every((review) => review.imagePath.startsWith('/evidence/')))
    assert.ok(AI_EVIDENCE_REVIEWS.every((review) => review.aiResult.startsWith('AI read:')))
    assert.ok(AI_EVIDENCE_REVIEWS.every((review) => review.sourceUrl.startsWith('https://commons.wikimedia.org/')))
  })

  it('explains every private non-ACORD data item across coverage, cost, and business value', () => {
    assert.deepEqual(
      NON_ACORD_PRIVATE_DATA_ITEMS.map((item) => item.label),
      [
        'Roof age and inspection report',
        'Electrical panel details and photo',
        'Sprinkler system and inspection certificate',
        'Alarm system and monitoring contract',
        'Fire extinguisher evidence',
      ],
    )
    assert.ok(NON_ACORD_PRIVATE_DATA_ITEMS.every((item) => item.coverageUse && item.costUse && item.businessHelp))
    assert.ok(NON_ACORD_PRIVATE_DATA_ITEMS.every((item) => item.qualificationSignal && item.brokerUse && item.ownerValue))
    assert.ok(
      NON_ACORD_PRIVATE_DATA_ITEMS.every((item) => {
        const copy = `${item.qualificationSignal} ${item.brokerUse} ${item.ownerValue}`.toLowerCase()

        return !copy.includes('points') && !copy.includes('formula') && !copy.includes('score calculation')
      }),
    )
  })

  it('builds a cost reduction plan with projected multi-year savings', () => {
    assert.equal(SAVINGS_HORIZON_YEARS, 3)
    assert.deepEqual(
      COST_REDUCTION_ACTIONS.map((action) => action.label),
      [
        'Get a current roof inspection letter',
        'Document electrical panel maintenance',
        'Refresh sprinkler inspection certificate',
        'Keep alarm monitoring active',
        'Service and photograph extinguisher tags',
      ],
    )
    assert.equal(projectedNetSavings(COST_REDUCTION_ACTIONS[0]), 610)
    assert.equal(totalImplementationCost(), 3040)
    assert.equal(totalProjectedGrossSavings(), 5940)
    assert.equal(totalProjectedNetSavings(), 2900)
    assert.ok(COST_REDUCTION_ACTIONS.every((action) => action.qualificationFocus && action.brokerPositioning))
  })
})
