import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

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
  it('builds Telegram links with the configured bot username', () => {
    assert.equal(
      buildTelegramLink('abc-123', 'DistrictCoverBot'),
      'https://t.me/DistrictCoverBot?start=abc-123',
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
})
